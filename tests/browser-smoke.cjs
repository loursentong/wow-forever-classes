'use strict';
/* Contrôle de bout en bout dans Chromium, sans déployer sur Pages.
   npm install --no-save --no-package-lock playwright@1.56.1
   npx playwright install chromium
   node tests/browser-smoke.cjs */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const http=require('node:http');
const {chromium}=require('playwright');

const base=path.resolve(__dirname,'..');
const allowed={'/':'index.html','/index.html':'index.html','/questionnaire.js':'questionnaire.js','/recommendation-engine.js':'recommendation-engine.js','/priorities-ui.js':'priorities-ui.js','/ux-polish.css':'ux-polish.css','/warcraft-visual-pack.css':'warcraft-visual-pack.css','/wow-ui-rework.css':'wow-ui-rework.css','/refonte-forever.css':'refonte-forever.css','/assets/hero-landscape.svg':'assets/hero-landscape.svg'};
for(const f of ['configuration-notes.js','configuration-details.js','configuration-notes.css','result-explanations.js'])allowed['/'+f]=f;
// Visuels de la refonte (kit de presse officiel), servis comme sur GitHub Pages.
for(const f of ['logo-wow-forever.webp','hero-arbre-monde.webp','hero-vallee-nuit.webp','bandeau-gantelet.webp','bandeau-darkspear.webp','grain.png'])allowed['/assets/img/'+f]='assets/img/'+f;
const types={'.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml; charset=utf-8','.webp':'image/webp','.png':'image/png'};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!Object.hasOwn(allowed,pathname)){res.writeHead(404);res.end();return;}
  const file=allowed[pathname];
  res.setHeader('content-type',types[path.extname(file)]||'text/html; charset=utf-8');
  res.end(fs.readFileSync(path.join(base,file)));
});
async function check(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true,...(process.env.FRV_CHROMIUM_EXECUTABLE?{executablePath:process.env.FRV_CHROMIUM_EXECUTABLE}:{})});
  const page=await browser.newPage({viewport:{width:1300,height:900},locale:'fr-FR'});
  // Rendu reproductible sans dépendance réseau aux Google Fonts.
  await page.route('https://fonts.googleapis.com/**',route=>route.abort());
  await page.route('https://fonts.gstatic.com/**',route=>route.abort());
  const errors=[];
  page.on('pageerror',err=>errors.push(String(err)));
  await page.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await page.waitForSelector('#reco-form .reco-question');
  assert.equal(await page.locator('#reco-form .reco-question').count(),1,'Une question seulement à la fois');
  assert.equal(await page.locator('[data-step]').count(),6);
  assert.equal(await page.locator('.reco-step-rail .reco-step').count(),6);
  assert.equal(await page.locator('.reco-summary-row').count(),6);
  const geometry=await page.evaluate(()=>{
   const rect=x=>{const b=document.querySelector(x).getBoundingClientRect();return {left:b.left,right:b.right,width:b.width};};
   return {rail:rect('#reco-rail'),form:rect('#reco-guided .reco-workspace'),sidebar:rect('.reco-sidebar')};
  });
  assert.ok(geometry.rail.right<=geometry.form.left&&geometry.form.right<=geometry.sidebar.left,
    'Trois colonnes sans recouvrement : '+JSON.stringify(geometry));
  assert.ok(geometry.form.width>350&&geometry.sidebar.width>=240);

  await page.locator('[data-summary-step="2"]').click();
  assert.match(await page.locator('#reco-form').textContent(),/Comment aimes-tu combattre/);
  await page.locator('[data-summary-step="0"]').click();
  assert.match(await page.locator('#reco-results').textContent(),/Tout commence par tes envies/);
  assert.equal(await page.locator('#reco-hero-facts').count(),0);
  assert.equal(await page.locator('link[href="ux-polish.css"]').count(),1);

  // Le comparatif historique reste intact sous ses réglages avancés.
  assert.equal(await page.locator('#rank').count(),1);
  assert.equal(await page.locator('td.cell[data-k]').count(),126);
  assert.equal(await page.locator('.wow-class-index img').count(),9,'Les neuf icônes de classe doivent figurer dans la navigation');
  assert.equal(await page.locator('.wow-card-class-icon').count(),9,'Les neuf fiches doivent utiliser l’iconographie officielle');
  assert.equal(await page.locator('.wow-hero-logo').count(),1);
  // Logo officiel du kit de presse, hébergé avec le site et toujours accompagné de la mention de fan.
  assert.equal(await page.locator('.wow-hero-logo').getAttribute('src'),'assets/img/logo-wow-forever.webp');
  assert.ok(await page.locator('.wow-hero-logo').evaluate(img=>img.complete&&img.naturalWidth>0),'Le logo doit se charger');
  assert.match(await page.locator('.wow-fan-mention').textContent(),/Outil de fan · non officiel/);
  assert.match(await page.locator('footer.end').textContent(),/non affilié à Blizzard Entertainment/);

  assert.equal(await page.locator('#legacy-advanced').evaluate(el=>el.open),false);
  await page.locator('#legacy-advanced > summary').click();
  assert.equal(await page.locator('#legacy-advanced').evaluate(el=>el.open),true);
  await page.locator('#legacy-advanced > summary').click();

  // Étapes accessibles sans répondre à toutes les questions.
  await page.locator('[data-step="3"]').click();
  assert.match(await page.locator('#reco-form').textContent(),/Quel style te ressemble/);
  for(const k of ['ctrl','zone','burst','surv']){
    await page.locator('[data-multi="styles"][data-key="'+k+'"]').click();
  }
  assert.equal(await page.locator('#reco-form .reco-cert').count(),3);
  assert.ok(await page.locator('#reco-form .reco-option-art img').count()>=3,'Les vrais pictogrammes de compétences sont présents');

  const slider=page.locator('#rc-styles-ctrl');
  await slider.evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.equal(await slider.inputValue(),'0');
  assert.match(await page.locator('#reco-results').textContent(),/Encore un peu de contexte/);
  assert.equal(await page.locator('#reco-results .reco-result-card').count(),0);
  // Une seconde dimension rend un aperçu possible sans l'imposer.
  await page.locator('[data-step="2"]').click();
  await page.locator('[data-single="range"][data-key="distance"]').click();
  assert.match(await page.locator('#reco-results').textContent(),/Voir un aperçu/);
  assert.equal(await page.locator('#reco-results .reco-result-card').count(),0);
  const place=()=>page.evaluate(()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {top:Math.round(b.top),bottom:Math.round(b.bottom),left:Math.round(b.left),width:Math.round(b.width)};};
   return {form:r('#reco-guided .reco-workspace'),results:r('#reco-results'),summary:r('#reco-summary-panel')};});
  let placed=await place();
  assert.ok(placed.results.left>=placed.summary.left-2&&placed.results.top>=placed.summary.bottom-2,'Aperçu fermé sous « Mes choix » : '+JSON.stringify(placed));
  await page.locator('[data-reco-reveal]').click();
  assert.equal(await page.locator('#reco-results .reco-result-card').count(),3);
  assert.equal(await page.locator('#reco-results .reco-config-details').count(),3);
  const guideDetails=page.locator('#reco-results .reco-config-details').first();
  await guideDetails.locator('summary').focus();
  await page.keyboard.press('Enter');
  assert.equal(await guideDetails.evaluate(el=>el.open),true);
  assert.match(await guideDetails.textContent(),/Pour toi si…[\s\S]*Ses atouts :[\s\S]*À prévoir :/);
  fs.mkdirSync(path.join(__dirname,'screenshots'),{recursive:true});
  await page.locator('#reco-results .reco-result-card').first().screenshot({path:path.join(__dirname,'screenshots','specialisation-guide.png')});
  await page.keyboard.press('Enter');
  // Révélés, les résultats passent sous la question, à la même largeur.
  placed=await place();
  assert.ok(placed.results.top>=placed.form.bottom-2&&Math.abs(placed.results.left-placed.form.left)<=2&&Math.abs(placed.results.width-placed.form.width)<=2,
    'Résultats sous la question, même largeur : '+JSON.stringify(placed));
  await page.locator('[data-reco-hide]').click();
  assert.equal(await page.locator('#reco-results .reco-result-card').count(),0);
  placed=await place();
  assert.ok(placed.results.left>=placed.summary.left-2,'Résultats masqués : retour sous « Mes choix » '+JSON.stringify(placed));
  await page.locator('[data-reco-reveal]').click();
  assert.equal(await page.locator('#reco-results .reco-result-card').count(),3);
  await page.locator('[data-step="4"]').click();
  assert.match(await page.locator('#reco-form').textContent(),/Quelle place pour les familiers/);
  await page.locator('[data-prev]').click();
  assert.match(await page.locator('#reco-form').textContent(),/Quel style te ressemble/);
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-step="3"]').click();
  assert.equal(await page.locator('[data-multi="styles"][data-key="ctrl"]').getAttribute('aria-pressed'),'true');

  // Veto sur rôle et portée explicites, état impossible honnêtement signalé.
  await page.locator('#reco-reset').click();
  await page.locator('[data-multi="roles"][data-key="tank"]').click();
  await page.locator('[data-roles-strict]').check();
  await page.locator('[data-step="2"]').click();
  await page.locator('[data-single="range"][data-key="distance"]').click();
  await page.locator('[data-strict="range"]').check();
  assert.match(await page.locator('#reco-results').textContent(),/Voir un aperçu/);
  await page.locator('[data-reco-reveal]').click();
  assert.match(await page.locator('#reco-results').textContent(),/Ces exigences ne vont pas ensemble/);

  // Bandeaux homogènes : passer d'un parcours à l'autre ne décale pas la page.
  const bandBox=sel=>page.locator(sel).evaluate(el=>{const r=el.getBoundingClientRect();return {top:Math.round(r.top+window.scrollY),height:Math.round(r.height)};});
  const sameBand=(a,b)=>Math.abs(a.top-b.top)<=2&&Math.abs(a.height-b.height)<=2;
  assert.equal(await page.locator('#reco-app .rf-band').count(),1);
  assert.equal(await page.locator('.rf-band-copy-guide').isVisible(),true);
  assert.equal(await page.locator('.rf-band-copy-priorites').isVisible(),false);
  assert.match(await page.locator('.rf-band-copy-guide').textContent(),/Parcours 1[\s\S]*Être guidé/);
  const guideBand=await bandBox('#reco-app .rf-band');

  // Second parcours : poids classiques réutilisés, mêmes 15 profils, top neuf classes.
  await page.locator('[data-reco-mode="priorities"]').click();
  assert.equal(await page.locator('#reco-priorities').isVisible(),true);
  assert.equal(await page.locator('.rf-band-copy-priorites').isVisible(),true);
  assert.equal(await page.locator('.rf-band-copy-guide').isVisible(),false);
  const prioBand=await bandBox('#reco-app .rf-band');
  assert.ok(sameBand(guideBand,prioBand),'Bandeau décalé entre les parcours : '+JSON.stringify({guideBand,prioBand}));
  assert.equal(await page.locator('#reco-guided').isVisible(),false);
  assert.equal(await page.locator('[data-prio-preset]').count(),8);
  assert.equal(await page.locator('.reco-more-presets').count(),0);
  assert.ok(await page.locator('[data-prio-save]').count()===1);
  // Régression DPS PvE : les neuf classes ne peuvent PAS recevoir toutes 100.
  await page.locator('[data-prio-preset="dps"]').click();
  const dpsScores=await page.locator('#reco-priority-results .reco-priority-score').allTextContents();
  assert.ok(new Set(dpsScores).size>=3, 'DPS PvE doit différencier les neuf classes');
  assert.ok(dpsScores.some(x=>!x.trim().startsWith('100')));
  assert.equal(await page.locator('[data-prio-axis]').count(),56);
  assert.equal(await page.locator('#reco-priority-results .reco-priority-class').count(),9);
  assert.equal(await page.locator('#reco-priority-results .reco-config-details').count(),9);
  await page.locator('[data-prio-preset="pvp"]').click();
  assert.equal(await page.locator('.seg button[data-ax="bg"][data-v="3"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-prio-mastery="3"]').click();
  assert.equal(await page.locator('.mbtn[data-m="3"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#reco-priority-results .reco-priority-class').count(),9);
  await page.locator('[data-prio-axis="poly"][data-prio-weight="0"]').click();
  assert.equal(await page.locator('.seg button[data-ax="poly"][data-v="0"]').getAttribute('aria-pressed'),'true');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('wf-overview-v3')));
  assert.equal(saved.w.bg,3);assert.equal(saved.m,3);
  // Sauvegarde explicite : modifier, sauvegarder, tester un preset, restaurer.
  await page.locator('[data-prio-save]').click();
  const custom=await page.evaluate(()=>JSON.parse(localStorage.getItem('wf-priority-custom-v1')));
  assert.equal(custom.mastery,3);assert.equal(custom.weights.bg,3);assert.equal(custom.weights.poly,0);
  await page.locator('[data-prio-preset="solo"]').click();
  assert.equal(await page.locator('.seg button[data-ax="solo"][data-v="3"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-prio-restore]').click();
  assert.equal(await page.locator('.seg button[data-ax="bg"][data-v="3"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.seg button[data-ax="poly"][data-v="0"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('[data-prio-restore]').isDisabled(),true);
  assert.equal(await page.locator('[data-reco-mode="priorities"]').getAttribute('aria-selected'),'true');
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('#reco-priorities').isVisible(),true);
  assert.equal(await page.locator('[data-prio-mastery="3"]').getAttribute('aria-pressed'),'true');

  // Maîtrise commune aux deux modes.
  await page.locator('[data-reco-mode="guided"]').click();
  await page.locator('[data-step="5"]').click();
  assert.equal(await page.locator('[data-mastery="3"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-mastery="0"]').click();
  await page.locator('[data-reco-mode="priorities"]').click();
  assert.equal(await page.locator('[data-prio-mastery="0"]').getAttribute('aria-pressed'),'true');

  // Taille mobile, visibilité des navigations et accès clavier.
  await page.setViewportSize({width:390,height:844});
  const priorityDetails=page.locator('#reco-priority-results .reco-config-details').first();
  await priorityDetails.locator('summary').click();
  assert.equal(await priorityDetails.evaluate(el=>el.open),true);
  assert.match(await priorityDetails.textContent(),/À prévoir :/);
  await page.locator('#reco-priority-results .reco-priority-class').first().screenshot({path:path.join(__dirname,'screenshots','specialisation-priorites-mobile.png')});
  const measurements=await page.evaluate(()=>({
    document:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth
  }));
  assert.ok(measurements.document<=measurements.viewport+2,'Débordement horizontal '+JSON.stringify(measurements));
  assert.equal(await page.locator('#reco-priority-results .reco-priority-class').count(),9);
  await page.locator('[data-reco-mode="guided"]').click();
  const guideBandMobile=await bandBox('#reco-app .rf-band');
  const vertical=await page.evaluate(()=>{
   const a=document.querySelector('#reco-rail').getBoundingClientRect();
   const b=document.querySelector('#reco-guided .reco-workspace').getBoundingClientRect();
   const c=document.querySelector('.reco-sidebar').getBoundingClientRect();
   return {railBottom:a.bottom,formTop:b.top,formBottom:b.bottom,sidebarTop:c.top};
  });
  assert.ok(vertical.railBottom<=vertical.formTop+2&&vertical.formBottom<=vertical.sidebarTop+2,
    'Empilement mobile : '+JSON.stringify(vertical));
  await page.locator('[data-step="2"]').click();
  await page.locator('[data-single="range"][data-key="melee"]').focus();
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.key),'melee');
  const sizing=await page.evaluate(()=>({
    doc:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth
  }));
  assert.ok(sizing.doc<=sizing.viewport+2,'Débordement formulaire mobile '+JSON.stringify(sizing));
  fs.mkdirSync(path.join(__dirname,'screenshots'),{recursive:true});
  await page.locator('#reco-form').scrollIntoViewIfNeeded();
  await page.waitForTimeout(280);
  await page.screenshot({path:path.join(__dirname,'screenshots','questionnaire-mobile.png'),fullPage:false});
  await page.locator('[data-reco-mode="priorities"]').click();
  const prioBandMobile=await bandBox('#reco-app .rf-band');
  assert.ok(sameBand(guideBandMobile,prioBandMobile),'Bandeau décalé sur mobile : '+JSON.stringify({guideBandMobile,prioBandMobile}));
  await page.locator('#reco-priority-form').scrollIntoViewIfNeeded();
  await page.waitForTimeout(280);
  await page.screenshot({path:path.join(__dirname,'screenshots','priorites-mobile.png'),fullPage:false});
  await page.setViewportSize({width:1300,height:900});
  await page.locator('#h-reco').scrollIntoViewIfNeeded();
  await page.waitForTimeout(280);
  await page.screenshot({path:path.join(__dirname,'screenshots','priorites-desktop.png'),fullPage:false});
  await page.locator('[data-reco-mode="guided"]').click();
  await page.locator('[data-step="0"]').click();
  await page.screenshot({path:path.join(__dirname,'screenshots','questionnaire-desktop.png'),fullPage:false});
  await page.locator('[data-multi="roles"][data-key="dps"]').click();
  await page.locator('[data-step="1"]').click();
  await page.locator('[data-multi="activities"][data-key="raid"]').click();
  await page.locator('[data-step="2"]').click();
  await page.locator('[data-single="range"][data-key="distance"]').click();
  await page.waitForTimeout(300);
  await page.screenshot({path:path.join(__dirname,'screenshots','guide-immersion-interaction-desktop.png'),fullPage:false});

  // Matrice de tailles, pour éviter une capture réussie à 390 px qui masque
  // des cassures intermédiaires (320 / 500 / 768 / 1024 / 1440).
  for(const width of [320,390,500,768,1024,1440]){
    await page.setViewportSize({width,height:900});
    const widths=await page.evaluate(()=>({
      doc:document.documentElement.scrollWidth,
      inner:document.documentElement.clientWidth
    }));
    assert.ok(widths.doc<=widths.inner+2,'Débordement à '+width+'px : '+JSON.stringify(widths));
  }
  await page.setViewportSize({width:1440,height:900});
  await page.locator('[data-step="2"]').click();
  const choice=page.locator('[data-single="range"][data-key="melee"]');
  const glowBefore=await choice.evaluate(el=>getComputedStyle(el).boxShadow);
  await choice.hover();
  const glowAfter=await choice.evaluate(el=>getComputedStyle(el).boxShadow);
  await page.waitForTimeout(240);
  const glowReady=await choice.evaluate(el=>getComputedStyle(el).boxShadow);
  assert.notEqual(glowBefore,glowReady,'Le survol doit éclairer le composant de manière visible');
  assert.ok(typeof glowAfter==='string');
  // Contrôles des ressources graphiques et de l’accessibilité des animations.
  const assets=await page.evaluate(async()=>Promise.all(['ux-polish.css','warcraft-visual-pack.css','wow-ui-rework.css','refonte-forever.css','assets/hero-landscape.svg',
   'assets/img/hero-arbre-monde.webp','assets/img/hero-vallee-nuit.webp','assets/img/bandeau-gantelet.webp','assets/img/bandeau-darkspear.webp','assets/img/grain.png'].map(async p=>{
    const r=await fetch(p);return {url:p,status:r.status,ok:r.ok};
  })));
  assert.ok(assets.every(x=>x.ok),'CSS et illustration manquants : '+JSON.stringify(assets));
  assert.equal(await page.locator('#reco-summary-panel').count(),1);
  await page.emulateMedia({reducedMotion:'reduce'});
  const motion=await page.locator('.reco-modes button').first().evaluate(el=>getComputedStyle(el).transitionDuration);
  assert.match(motion,/^0s(, 0s)*$/,'Les transitions doivent être désactivées avec reduced-motion');
  const reducedHover=await page.locator('.wow-class-index a').first().evaluate(el=>getComputedStyle(el).transitionDuration);
  assert.match(reducedHover,/^0s(, 0s)*$/,'Les hover doivent respecter reduced-motion');
  await page.emulateMedia({reducedMotion:'no-preference'});

  // Thème sombre unique : ni une ancienne préférence « clair » ni un système réglé en clair ne changent la page.
  const lightContext=await browser.newContext({viewport:{width:390,height:844},locale:'fr-FR',colorScheme:'light'});
  const lightPage=await lightContext.newPage();
  await lightPage.route('https://fonts.googleapis.com/**',route=>route.abort());
  await lightPage.route('https://fonts.gstatic.com/**',route=>route.abort());
  lightPage.on('pageerror',err=>errors.push(String(err)));
  await lightPage.addInitScript(()=>{try{localStorage.setItem('wf-overview-theme','light');}catch(e){}});
  await lightPage.goto('http://127.0.0.1:'+server.address().port+'/',{waitUntil:'domcontentloaded'});
  await lightPage.waitForSelector('#reco-form .reco-question');
  const dark=await lightPage.evaluate(()=>({
    theme:document.documentElement.getAttribute('data-theme'),
    background:getComputedStyle(document.body).backgroundColor,
    themeControls:document.querySelectorAll('#theme,.theme-choice').length,
    stored:localStorage.getItem('wf-overview-theme'),
    heroTop:document.querySelector('.reco-hero').getBoundingClientRect().top
  }));
  assert.deepEqual({theme:dark.theme,background:dark.background,themeControls:dark.themeControls,stored:dark.stored},
    {theme:'dark',background:'rgb(10, 23, 37)',themeControls:0,stored:'light'},'Thème sombre unique : '+JSON.stringify(dark));
  assert.ok(dark.heroTop<=20,'L’en-tête de page ne réserve plus de place au-dessus du logo : '+JSON.stringify(dark));
  await lightContext.close();

  // Retours de guilde : égalités, profils sans familier et difficulté par spécialisation.
  await page.setViewportSize({width:1300,height:900});
  await page.evaluate(()=>{
   localStorage.clear();
   localStorage.setItem('wf-recommend-v1',JSON.stringify({styles:{ctrl:5},range:{value:'distance',certainty:5},mastery:2}));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-reco-reveal]').click();
  assert.match(await page.locator('#reco-results .reco-tie-note').textContent(),/Démoniste, Mage/);
  assert.equal(await page.locator('#reco-results .reco-featured').count(),0);
  const givre=page.locator('[data-config-id="mage-givre"]');
  await givre.locator('summary').click();
  assert.match(await givre.textContent(),/PvE : Assez accessible · PvP : Exigeant/);
  await page.locator('#reco-results').screenshot({path:path.join(__dirname,'screenshots','lot1-egalite-guide.png'),animations:'disabled'});
  await page.locator('[data-step="4"]').click();
  await page.locator('[data-single="pet"][data-key="avoid"]').click();
  await page.locator('#rc-pet-avoid').fill('5');
  await page.locator('[data-strict="pet"]').check();
  const warlock=page.locator('#reco-results .reco-result-card').filter({has:page.locator('h4', {hasText:'Démoniste'})});
  assert.match(await warlock.locator('.reco-config-notice').textContent(),/Évaluée sans démon/);
  assert.match(await warlock.locator('.reco-result-main p').textContent(),/sans familier/);
  assert.equal(await page.locator('#reco-results .reco-result-card').first().locator('h4').textContent(),'Mage');
  await page.setViewportSize({width:390,height:844});
  await warlock.screenshot({path:path.join(__dirname,'screenshots','lot1-familier-mobile.png'),animations:'disabled'});
  for(const width of [320,390,768]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2),'Résultats sans familier à '+width+'px');
  }
  // Difficulté selon les activités (v6) : les résultats annoncent la difficulté comparée.
  await page.setViewportSize({width:1300,height:900});
  await page.evaluate(()=>localStorage.setItem('wf-recommend-v1',JSON.stringify({activities:{raid:5},difficulty:{value:'simple',certainty:5},mastery:2})));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-reco-reveal]').click();
  assert.match(await page.locator('#reco-results').textContent(),/comparé à la difficulté PvE/);
  await page.locator('[data-reco-mode="priorities"]').click();
  await page.locator('[data-prio-preset="controle"]').click();
  const rankRows=page.locator('#reco-priority-results .reco-priority-class');
  assert.equal(await rankRows.nth(0).getAttribute('value'),'1');
  assert.equal(await rankRows.nth(1).getAttribute('value'),'1');
  assert.equal(await rankRows.nth(2).getAttribute('value'),'1');
  assert.match(await rankRows.nth(1).textContent(),/ex æquo/);
  const leadBorders=await page.locator('#reco-priority-results .is-leading').evaluateAll(rows=>rows.map(row=>getComputedStyle(row).borderColor));
  assert.equal(leadBorders.length,3);
  assert.equal(new Set(leadBorders).size,1,'Les trois classes à égalité doivent recevoir la même mise en avant');
  const weightsControl=page.locator('[aria-describedby="prio-help-ctrl"]');
  assert.equal(await weightsControl.count(),1);
  await weightsControl.locator('button').first().focus();
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.prioAxis),'ctrl');
  for(const width of [320,390,768,1300]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2),'Définitions des critères à '+width+'px');
  }
  await page.locator('#reco-priority-results').screenshot({path:path.join(__dirname,'screenshots','lot1-egalite-priorites.png'),animations:'disabled'});
  await page.evaluate(()=>{
   localStorage.clear();
   localStorage.setItem('wf-recommend-v1',JSON.stringify({roles:{soin:5},rolesStrict:true,mastery:2}));
  });
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-step="5"]').click();
  await page.locator('[data-show-results]').click();
  assert.match(await page.locator('#reco-results .reco-tie-note').textContent(),/Chaman, Druide, Paladin, Prêtre/);
  assert.equal(await page.locator('#reco-results .reco-featured').count(),0);
  assert.equal(await page.locator('#reco-results .reco-result-card').count(),3);
  assert.match(await page.locator('#reco-results').textContent(),/styles de soin ne sont pas encore départagés/);
  assert.deepEqual(errors,[],'Erreurs JavaScript navigateur');
  process.stdout.write('Chromium : deux parcours, 14 poids, 15 presets, neuf rangs, maîtrise partagée, mobile et clavier — OK\n');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
}
check().catch(err=>{console.error(err);process.exitCode=1;});
