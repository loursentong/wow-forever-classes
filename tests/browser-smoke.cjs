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
for(const f of ['configuration-notes.js','configuration-details.js','configuration-notes.css','result-explanations.js','notes-specialisations.js','support.js'])allowed['/'+f]=f;
for(const f of fs.readdirSync(path.join(base,'fiches-sources')).filter(f=>f.endsWith('.html')))allowed['/fiches-sources/'+f]='fiches-sources/'+f;
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
  // Arrivée : deux cartes pour choisir son parcours, aucune question ouverte d'emblée.
  await page.waitForSelector('#reco-app.is-choosing .reco-modes');
  // Soutien : destination exacte, transparence et copie du coupon sans toucher aux préférences.
  assert.equal(await page.title(),'Choisir ma classe WoW Forever');
  assert.equal(await page.locator('.support-reminder').isVisible(),false);
  for(const link of await page.locator('a[href*="restedxp.com/ref/"]').all()){
   assert.equal(await link.getAttribute('href'),'https://shop.restedxp.com/ref/LoursEnTong/');
   assert.match(await link.getAttribute('rel'),/sponsored/);
   assert.match(await page.locator('#'+await link.getAttribute('aria-describedby')).textContent(),/commission/);
  }
  for(const width of [320,390,768,820,821,1060,1061,1300,1580]){
   await page.setViewportSize({width,height:1000});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2),'Encart sans débordement à '+width);
   const placement=await page.evaluate(()=>{
    const rect=s=>document.querySelector(s).getBoundingClientRect();
    const card=rect('.support-card'),intro=rect('.reco-hero-copy'),section=rect('.reco-section'),modes=rect('.reco-modes');
    return {rightOfIntro:card.left>=intro.right&&Math.abs(card.top-intro.top)<=2,belowIntro:card.top>=intro.bottom,
     fullWidth:Math.abs(modes.left-section.left)<=2&&Math.abs(modes.right-section.right)<=2,
     belowHeader:modes.top>=Math.max(card.bottom,intro.bottom)};
   });
   assert.ok(width<=1060?placement.belowIntro:placement.rightOfIntro,'Placement de l’encart à '+width);
   assert.ok(placement.fullWidth&&placement.belowHeader,'Parcours sur toute la largeur sous l’en-tête à '+width);
   if([390,1060,1300,1580].includes(width))await page.locator('.reco-section').screenshot({path:path.join(__dirname,'screenshots','soutien-'+width+'.png'),animations:'disabled'});
  }
  const prefsBefore=await page.evaluate(()=>JSON.stringify(localStorage));
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async text=>{window.__couponCopied=text;}}}));
  await page.locator('[data-support-copy]').focus();await page.keyboard.press('Enter');
  assert.equal(await page.evaluate(()=>window.__couponCopied),'1K9U6RPCTR');
  assert.match(await page.locator('.support-copy-status').textContent(),/Code copié/);
  await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('Presse-papiers indisponible');}}}));
  await page.locator('[data-support-copy]').click();
  assert.equal(await page.evaluate(()=>getSelection().toString()),'1K9U6RPCTR');
  assert.match(await page.locator('.support-copy-status').textContent(),/Code sélectionné/);
  assert.equal(await page.evaluate(()=>JSON.stringify(localStorage)),prefsBefore);
  await page.reload();
  await page.setViewportSize({width:1300,height:900});
  assert.equal(await page.locator('#reco-guided').isVisible(),false);
  assert.equal(await page.locator('#reco-priorities').isVisible(),false);
  assert.equal(await page.locator('#reco-app .rf-band').isVisible(),false);
  assert.deepEqual(await page.locator('[data-reco-mode]').evaluateAll(b=>b.map(x=>x.getAttribute('aria-selected'))),['false','false']);
  assert.match(await page.locator('.reco-mode-heading').textContent(),/Comment veux-tu trouver ta classe/);
  const arrival=await page.evaluate(()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {left:Math.round(b.left),right:Math.round(b.right),width:Math.round(b.width)};};
   return {modes:r('.reco-modes'),guided:r('[data-reco-mode="guided"]'),priorities:r('[data-reco-mode="priorities"]')};});
  assert.ok(Math.abs(arrival.guided.width-arrival.priorities.width)<=2&&arrival.guided.left<=arrival.modes.left+2&&arrival.priorities.right>=arrival.modes.right-2,
    'Deux cartes de même largeur sur toute la ligne : '+JSON.stringify(arrival));
  await page.screenshot({path:path.join(__dirname,'screenshots','arrivee-desktop.png'),fullPage:false});
  await page.locator('[data-reco-mode="guided"]').click();
  await page.waitForSelector('#reco-form .reco-question');
  assert.equal(await page.locator('#reco-app').evaluate(el=>el.classList.contains('is-choosing')),false);
  // Les onglets prennent toute la largeur du bandeau « Parcours 1 / 2 ».
  const tabsWidth=await page.evaluate(()=>{const a=document.querySelector('.reco-modes').getBoundingClientRect(),b=document.querySelector('#reco-app .rf-band').getBoundingClientRect();
   return {tabs:[Math.round(a.left),Math.round(a.right)],band:[Math.round(b.left),Math.round(b.right)]};});
  assert.ok(Math.abs(tabsWidth.tabs[0]-tabsWidth.band[0])<=2&&Math.abs(tabsWidth.tabs[1]-tabsWidth.band[1])<=2,'Onglets alignés sur le bandeau : '+JSON.stringify(tabsWidth));
  assert.equal(await page.locator('#reco-form .reco-question').count(),1,'Une question seulement à la fois');
  assert.equal(await page.locator('[data-step]').count(),6);
  assert.equal(await page.locator('.reco-step-rail .reco-step').count(),6);
  assert.equal(await page.locator('.reco-summary-row').count(),6);
  const geometry=await page.evaluate(()=>{
   const rect=x=>{const b=document.querySelector(x).getBoundingClientRect();return {left:b.left,right:b.right,top:b.top,bottom:b.bottom,width:b.width};};
   return {rail:rect('#reco-rail'),form:rect('#reco-guided .reco-workspace'),sidebar:rect('.reco-sidebar'),live:rect('#reco-guided .reco-live'),panel:rect('#reco-live')};
  });
  assert.ok(geometry.rail.right<=geometry.form.left&&geometry.sidebar.right<=geometry.form.left&&geometry.sidebar.top>=geometry.rail.bottom-2&&geometry.form.right<=geometry.live.left,
    'Étapes puis « Mes choix » à gauche, question au centre, aperçu à droite : '+JSON.stringify(geometry));
  assert.ok(geometry.form.width>350&&geometry.sidebar.width>=200&&geometry.live.width>=220);
  // L'aperçu du classement, fermé par défaut, ne dépasse jamais la hauteur de la question.
  assert.equal(await page.locator('#reco-live').evaluate(d=>d.open),false);
  assert.ok(Math.abs(geometry.live.top-geometry.form.top)<=2&&geometry.live.bottom<=geometry.form.bottom+2,'Aperçu borné à la question : '+JSON.stringify(geometry));

  await page.locator('[data-summary-step="2"]').click();
  assert.match(await page.locator('#reco-form').textContent(),/Comment aimes-tu combattre/);
  await page.locator('[data-summary-step="0"]').click();
  assert.match(await page.locator('#reco-results').textContent(),/Tout commence par tes envies/);
  assert.equal(await page.locator('#reco-hero-facts').count(),0);
  assert.equal(await page.locator('link[href="ux-polish.css"]').count(),1);

  // Le comparatif historique, dépassé, a été retiré ; la matrice des 126 notes reste.
  assert.equal(await page.locator('#rank,#legacy-advanced').count(),0);
  assert.doesNotMatch(await page.locator('main').textContent(),/Explorer le comparatif historique/);
  assert.equal(await page.locator('td.cell[data-k]').count(),126);
  assert.equal(await page.locator('.wow-class-index img').count(),9,'Les neuf icônes de classe doivent figurer dans la navigation');
  assert.equal(await page.locator('.wow-card-class-icon').count(),9,'Les neuf fiches doivent utiliser l’iconographie officielle');
  assert.equal(await page.locator('.wow-hero-logo').count(),1);
  // Logo officiel du kit de presse, hébergé avec le site et toujours accompagné de la mention de fan.
  assert.equal(await page.locator('.wow-hero-logo').getAttribute('src'),'assets/img/logo-wow-forever.webp');
  assert.ok(await page.locator('.wow-hero-logo').evaluate(img=>img.complete&&img.naturalWidth>0),'Le logo doit se charger');
  assert.match(await page.locator('.wow-fan-mention').textContent(),/Outil de fan · non officiel/);
  assert.match(await page.locator('footer.end').textContent(),/non affilié à Blizzard Entertainment/);

  // Méthode de maîtrise : après le détail des classes, juste avant les sources.
  assert.deepEqual(await page.evaluate(()=>[...document.querySelectorAll('main section[id^="h-"],main [id^="h-"]')].map(x=>x.id).filter((v,i,a)=>a.indexOf(v)===i).slice(-3)),['h-rules','h-model','h-src']);

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
  assert.match(await page.locator('#reco-results').textContent(),/Prévisualiser mes résultats/);
  assert.equal(await page.locator('#reco-results .reco-result-card').count(),0);
  // L'aperçu du classement suit les réponses : neuf classes, dans l'ordre du moteur.
  await page.locator('#reco-live > summary').click();
  assert.equal(await page.locator('#reco-live-body li').count(),10,'dix spécialisations visibles, les autres sur demande');
  const liveBox=await page.evaluate(()=>{const a=document.querySelector('#reco-guided .reco-live').getBoundingClientRect(),b=document.querySelector('#reco-guided .reco-workspace').getBoundingClientRect(),
   c=document.querySelector('#reco-live-body');return {liveBottom:Math.round(a.bottom),formBottom:Math.round(b.bottom),scrolls:c.scrollHeight>=c.clientHeight};});
  assert.ok(liveBox.liveBottom<=liveBox.formBottom+2,'Aperçu ouvert, toujours borné à la question : '+JSON.stringify(liveBox));
  await page.locator('#reco-live > summary').click();
  const place=()=>page.evaluate(()=>{const r=s=>{const b=document.querySelector(s).getBoundingClientRect();return {top:Math.round(b.top),bottom:Math.round(b.bottom),left:Math.round(b.left),width:Math.round(b.width)};};
   return {form:r('#reco-guided .reco-workspace'),results:r('#reco-results'),summary:r('#reco-summary-panel')};});
  let placed=await place();
  // Fermés comme révélés, les résultats occupent la même place : sous la question, à la même largeur.
  const sous=p=>p.results.top>=p.form.bottom-2&&Math.abs(p.results.left-p.form.left)<=2&&Math.abs(p.results.width-p.form.width)<=2;
  assert.ok(sous(placed),'Aperçu fermé sous la question, même largeur : '+JSON.stringify(placed));
  assert.ok(placed.summary.left+placed.summary.width<=placed.form.left+2,'« Mes choix » à gauche : '+JSON.stringify(placed));
  await page.locator('[data-reco-reveal]').click();
  assert.equal(await page.locator('#reco-results .reco-result-card').count(),5);
  assert.equal(await page.locator('.support-reminder').isVisible(),true);
  assert.equal(await page.locator('#reco-results .reco-config-details').count(),5);
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
  assert.ok(sous(placed),'Résultats sous la question, même largeur : '+JSON.stringify(placed));
  // Les pistes s'empilent en pleine largeur.
  const cardBoxes=await page.locator('#reco-results .reco-result-card').evaluateAll(cards=>cards.map(c=>{const b=c.getBoundingClientRect();return {top:b.top,left:b.left,width:b.width};}));
  assert.ok(cardBoxes.every((c,i)=>i===0||(c.top>cardBoxes[i-1].top+20&&Math.abs(c.left-cardBoxes[0].left)<=1&&Math.abs(c.width-cardBoxes[0].width)<=1)),
    'Pistes empilées : '+JSON.stringify(cardBoxes));
  assert.ok(cardBoxes[0].width>=placed.form.width-60,'Pistes en pleine largeur : '+JSON.stringify({cardBoxes,placed}));
  // Les blocs déroulants sont encadrés et repérables : bordure dorée, chevron, pas de marqueur natif.
  const summaryLook=await page.locator('#reco-results details.reco-evidence').first().evaluate(d=>{const s=getComputedStyle(d),m=getComputedStyle(d.querySelector('summary'));
   return {border:s.borderTopWidth,borderColor:s.borderTopColor,summaryColor:m.color,chevron:getComputedStyle(d.querySelector('summary'),'::after').content};});
  assert.equal(summaryLook.border,'1px');
  assert.match(summaryLook.borderColor,/rgba\(233, 179, 79/);
  assert.equal(summaryLook.summaryColor,'rgb(255, 215, 140)');
  assert.equal(summaryLook.chevron,'""');
  // « Pourquoi cette piste » : les points des critères font le score affiché.
  const why=await page.locator('#reco-results .reco-result-card').first().evaluate(card=>({score:Number(card.querySelector('.reco-score strong').textContent),
   points:[...card.querySelectorAll('.reco-calculation tbody td:last-child')].map(x=>Number(x.textContent.split('/')[0])),summary:card.querySelector('.reco-why summary').textContent}));
  assert.equal(why.summary,'Pourquoi cette piste');
  assert.equal(why.points.reduce((a,b)=>a+b,0),why.score,JSON.stringify(why));
  // Les blocs de chaque carte se répondent : « À garder en tête » nomme la première ligne du bilan, mêmes points.
  const coherent=await page.locator('#reco-results .reco-result-card').evaluateAll(cards=>cards.map(card=>({
   keep:[...card.querySelectorAll('.reco-reasons p')].find(p=>p.querySelector('b').textContent==='À garder en tête').querySelector('span').textContent,
   sum:card.querySelector('.reco-why > p').textContent})));
  assert.equal(coherent.length,5);
  for(const c of coherent){
   assert.equal(c.sum,c.keep,'Le compromis de la carte et celui de l’explication sont identiques');
   assert.doesNotMatch(c.keep,/\d|%/);
  }
  await page.locator('[data-reco-hide]').click();
  assert.equal(await page.locator('#reco-results .reco-result-card').count(),0);
  placed=await place();
  assert.ok(sous(placed),'Résultats masqués : même place, sous la question '+JSON.stringify(placed));
  await page.locator('[data-reco-reveal]').click();
  assert.equal(await page.locator('#reco-results .reco-result-card').count(),5);
  await page.locator('[data-step="4"]').click();
  assert.match(await page.locator('#reco-form').textContent(),/Quelle place pour les familiers/);
  await page.locator('[data-prev]').click();
  assert.match(await page.locator('#reco-form').textContent(),/Quel style te ressemble/);
  await page.reload({waitUntil:'domcontentloaded'});
  assert.equal(await page.locator('[data-reco-mode="guided"]').getAttribute('data-last'),'true','Dernier parcours signalé');
  await page.locator('[data-reco-mode="guided"]').click();
  await page.locator('[data-step="3"]').click();
  assert.equal(await page.locator('[data-multi="styles"][data-key="ctrl"]').getAttribute('aria-pressed'),'true');

  // Veto sur rôle et portée explicites, état impossible honnêtement signalé.
  await page.locator('#reco-reset').click();
  await page.locator('[data-multi="roles"][data-key="tank"]').click();
  await page.locator('[data-roles-strict]').check();
  await page.locator('[data-step="2"]').click();
  await page.locator('[data-single="range"][data-key="distance"]').click();
  await page.locator('[data-strict="range"]').check();
  assert.match(await page.locator('#reco-results').textContent(),/Prévisualiser mes résultats/);
  await page.locator('[data-reco-reveal]').click();
  assert.match(await page.locator('#reco-results').textContent(),/Ces exigences ne vont pas ensemble/);
  assert.equal(await page.locator('.support-reminder').isVisible(),false);

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
  assert.equal(await page.locator('.support-reminder').isVisible(),true);
  const dpsScores=await page.locator('#reco-priority-results .reco-priority-score').allTextContents();
  assert.ok(new Set(dpsScores).size>=3, 'DPS PvE doit différencier les neuf classes');
  assert.ok(dpsScores.some(x=>!x.trim().startsWith('100')));
  assert.equal(await page.locator('[data-prio-axis]').count(),60);
  assert.equal(await page.locator('#reco-priority-results .reco-priority-class').count(),10);
  assert.equal(await page.locator('#reco-priority-results .reco-config-details').count(),10);
  await page.locator('[data-prio-preset="pvp"]').click();
  const weight=(axis,v)=>page.locator('[data-prio-axis="'+axis+'"][data-prio-weight="'+v+'"]').getAttribute('aria-pressed');
  assert.equal(await weight('bg',3),'true');
  await page.locator('[data-prio-mastery="3"]').click();
  assert.equal(await page.locator('[data-prio-mastery="3"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#reco-priority-results .reco-priority-class').count(),10);
  // « Pourquoi cette place » : neuf explications ; les points des critères font le score affiché.
  assert.equal(await page.locator('#reco-priority-results .reco-why > summary').count(),10);
  const place1=page.locator('#reco-priority-results .reco-priority-class').first();
  await place1.locator('.reco-why > summary').click();
  const placeWhy=await place1.evaluate(li=>({score:parseInt(li.querySelector('.reco-priority-score').textContent,10),
   points:[...li.querySelectorAll('.reco-calculation tbody td:last-child')].map(x=>parseInt(x.textContent,10)),text:li.querySelector('.reco-friendly-groups').textContent}));
  assert.equal(placeWhy.points.reduce((a,b)=>a+b,0),placeWhy.score,JSON.stringify(placeWhy));
  assert.doesNotMatch(placeWhy.text,/\d|%/);
  assert.equal(await place1.locator('.reco-calculation').evaluate(d=>d.open),false);
  await place1.locator('.reco-calculation > summary').click();
  assert.equal(await place1.locator('.reco-calculation').evaluate(d=>d.open),true);
  await place1.screenshot({path:path.join(__dirname,'screenshots','priorites-pourquoi-cette-place.png'),animations:'disabled'});
  await place1.locator('.reco-why > summary').click();
  await page.locator('[data-prio-axis="poly"][data-prio-weight="0"]').click();
  assert.equal(await weight('poly',0),'true');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('wf-overview-v3')));
  assert.equal(saved.w.bg,3);assert.equal(saved.m,3);
  // Sauvegarde explicite : modifier, sauvegarder, tester un preset, restaurer.
  await page.locator('[data-prio-save]').click();
  const custom=await page.evaluate(()=>JSON.parse(localStorage.getItem('wf-priority-custom-v1')));
  assert.equal(custom.mastery,3);assert.equal(custom.weights.bg,3);assert.equal(custom.weights.poly,0);
  await page.locator('[data-prio-preset="solo"]').click();
  assert.equal(await weight('solo',3),'true');
  await page.locator('[data-prio-restore]').click();
  assert.equal(await weight('bg',3),'true');
  assert.equal(await weight('poly',0),'true');
  assert.equal(await page.locator('[data-prio-restore]').isDisabled(),true);
  assert.equal(await page.locator('[data-reco-mode="priorities"]').getAttribute('aria-selected'),'true');
  await page.reload({waitUntil:'domcontentloaded'});
  // Au retour, le choix du parcours est reproposé ; le dernier utilisé est signalé, l'état est repris.
  assert.equal(await page.locator('#reco-priorities').isVisible(),false);
  assert.equal(await page.locator('[data-reco-mode="priorities"]').getAttribute('data-last'),'true');
  await page.locator('[data-reco-mode="priorities"]').click();
  assert.equal(await page.locator('#reco-priorities').isVisible(),true);
  assert.equal(await page.locator('[data-prio-mastery="3"]').getAttribute('aria-pressed'),'true');
  assert.equal(await weight('poly',0),'true');

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
  assert.equal(await page.locator('#reco-priority-results .reco-priority-class').count(),10);
  await page.locator('[data-reco-mode="guided"]').click();
  const guideBandMobile=await bandBox('#reco-app .rf-band');
  await page.locator('[data-step="2"]').click();
  const vertical=await page.evaluate(()=>{
   const a=document.querySelector('#reco-rail').getBoundingClientRect();
   const b=document.querySelector('#reco-guided .reco-workspace').getBoundingClientRect();
   const c=document.querySelector('.reco-sidebar').getBoundingClientRect();
   const d=document.querySelector('#reco-results').getBoundingClientRect();
   const e=document.querySelector('#reco-guided .reco-live').getBoundingClientRect();
   return {railBottom:a.bottom,formTop:b.top,formBottom:b.bottom,sidebarTop:c.top,resultsTop:d.top,resultsBottom:d.bottom,liveTop:e.top,liveBottom:e.bottom};
  });
  // Sur mobile : étapes, question, résultats, aperçu du classement, puis « Mes choix ».
  assert.ok(vertical.railBottom<=vertical.formTop+2&&vertical.formBottom<=vertical.resultsTop+2&&vertical.resultsBottom<=vertical.liveTop+2&&vertical.liveBottom<=vertical.sidebarTop+2,
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
  await lightPage.waitForSelector('#reco-app .reco-modes');
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
  await page.locator('[data-reco-mode="guided"]').click();
  await page.locator('[data-reco-reveal]').click();
  assert.match(await page.locator('#reco-results .reco-tie-note').textContent(),/Démoniste Affliction, Mage Givre/);
  assert.equal(await page.locator('#reco-results .reco-featured').count(),0);
  const givre=page.locator('[data-config-id="mage-givre"]');
  await givre.locator('summary').click();
  // Depuis la v11 : la note sur 5, ce qui pèse dans chaque contexte et le lien vers le détail de la grille.
  assert.match(await givre.textContent(),/PvE : Assez accessible \(2\/5\) · PvP : Exigeant \(4\/5\)\. En PvE, la rotation, la gestion de la ressource et le placement pèsent un peu\. En PvP, les contrôles, la défense et le placement pèsent beaucoup ; l’ouverture, un peu\./);
  assert.equal(await givre.locator('a[href="fiches-sources/mage.html#mage-givre-complexite"]').count(),1);
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
  await page.locator('[data-reco-mode="guided"]').click();
  await page.locator('[data-reco-reveal]').click();
  assert.match(await page.locator('#reco-results').textContent(),/donjons et raids, avec la difficulté PvE/);
  // Une même classe peut revenir dans les pistes, au plus trois fois sur cinq.
  await page.evaluate(()=>localStorage.setItem('wf-recommend-v1',JSON.stringify({styles:{mob:5,surv:5},mastery:2})));
  await page.reload({waitUntil:'domcontentloaded'});
  await page.locator('[data-reco-mode="guided"]').click();
  await page.locator('[data-step="5"]').click();
  await page.locator('[data-show-results]').click();
  const cards=await page.locator('#reco-results .reco-result-card h4').allTextContents();
  // Cinq pistes : une classe en occupe au plus trois (ici les trois Druides à égalité), puis d'autres classes.
  assert.equal(cards.length,5);assert.deepEqual(cards.slice(0,3),['Druide','Druide','Druide']);
  assert.ok(cards.slice(3).every(c=>c!=='Druide'),'les places suivantes vont à d’autres classes : '+cards);
  // Le classement complet s'ouvre depuis les résultats.
  await page.locator('[data-reco-full]').click();
  assert.equal(await page.locator('#reco-live').evaluate(d=>d.open),true);
  assert.ok(await page.locator('#reco-live-body li').count()>10);
  await page.locator('#reco-results').screenshot({path:path.join(__dirname,'screenshots','v10-deux-druides.png'),animations:'disabled'});
  await page.locator('[data-reco-mode="priorities"]').click();
  await page.locator('[data-prio-preset="controle"]').click();
  const rankRows=page.locator('#reco-priority-results .reco-priority-class');
  assert.equal(await rankRows.nth(0).getAttribute('value'),'1');
  assert.equal(await rankRows.nth(1).getAttribute('value'),'1');
  assert.equal(await rankRows.nth(2).getAttribute('value'),'1');
  assert.equal(await rankRows.nth(3).getAttribute('value'),'1');
  // Quatre spécialisations à égalité en tête, dont deux du Voleur (v10).
  assert.match(await rankRows.nth(1).textContent(),/à égalité avec 3 autres spécialisations/);
  assert.doesNotMatch(await page.locator('#reco-priority-results').textContent(),/ex æquo|résultat proche/);
  const leadBorders=await page.locator('#reco-priority-results .is-leading').evaluateAll(rows=>rows.map(row=>getComputedStyle(row).borderColor));
  assert.equal(leadBorders.length,4);
  assert.equal(new Set(leadBorders).size,1,'Les spécialisations à égalité doivent recevoir la même mise en avant');
  // Les autres spécialisations s'affichent sur demande.
  await page.locator('[data-prio-more]').click();
  assert.equal(await page.locator('#reco-priority-results .reco-priority-class').count(),28);
  assert.equal(await page.locator('[data-prio-more]').getAttribute('aria-expanded'),'true');
  await page.locator('[data-prio-more]').click();
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
  await page.locator('[data-reco-mode="guided"]').click();
  // Questions 1 à 5 : le bloc sous la question propose de prévisualiser les résultats.
  await page.locator('[data-step="1"]').click();
  await page.locator('[data-multi="activities"][data-key="raid"]').click();
  assert.match(await page.locator('[data-reco-reveal]').textContent(),/Prévisualiser mes résultats/);
  // Question 6 : « Voir mes résultats » remplace « Question suivante » ; le bloc d'aperçu s'efface.
  await page.locator('[data-step="5"]').click();
  assert.equal(await page.locator('[data-next]').count(),0);
  assert.equal(await page.locator('[data-show-results]').isEnabled(),true);
  assert.equal(await page.locator('#reco-results').isVisible(),false);
  assert.match(await page.locator('#reco-form .reco-form-footer').textContent(),/Dernière question : tu peux la passer[\s\S]*Voir mes résultats/);
  await page.locator('#reco-guided .reco-guided-layout').screenshot({path:path.join(__dirname,'screenshots','derniere-question.png'),animations:'disabled'});
  await page.locator('[data-step="1"]').click();
  await page.locator('[data-multi="activities"][data-key="raid"]').click();
  await page.locator('[data-step="5"]').click();
  await page.locator('[data-show-results]').click();
  assert.match(await page.locator('#reco-results .reco-tie-note').textContent(),/Chaman Restauration, Druide Restauration, Paladin Sacré, Prêtre Discipline, Prêtre Sacré/);
  assert.equal(await page.locator('#reco-results .reco-featured').count(),0);
  assert.equal(await page.locator('#reco-results .reco-result-card').count(),5);
  assert.match(await page.locator('#reco-results').textContent(),/préciser ta façon de soigner à la question 1/);
  // Lot 3 : la façon de soigner, sous-question facultative du rôle Soin, départage les soigneurs.
  await page.locator('[data-step="0"]').click();
  const healQuestion=page.locator('#reco-form .reco-subquestion');
  assert.match(await healQuestion.textContent(),/Quelle façon de soigner t’attire/);
  await page.locator('[data-multi="healStyles"][data-key="cible"]').click();
  await page.locator('#rc-healStyles-cible').fill('5');
  assert.match(await page.locator('#reco-form').textContent(),/1 sur 2 choix possibles/);
  assert.equal(await page.locator('#reco-results .reco-tie-note').count(),0);
  assert.equal(await page.locator('#reco-results .reco-featured h4').textContent(),'Paladin');
  assert.match(await page.locator('#reco-results').textContent(),/Ta façon de soigner aide à trouver le soigneur qui te ressemble/);
  const sacre=page.locator('[data-config-id="paladin-sacre"]');
  await sacre.locator('summary').click();
  assert.match(await sacre.textContent(),/Façon de soigner : Gros soins ciblés : son point fort/);
  assert.match(await page.locator('.reco-summary-row').first().textContent(),/Soin \(soins ciblés\)/);
  await healQuestion.screenshot({path:path.join(__dirname,'screenshots','lot3-facon-de-soigner.png'),animations:'disabled'});
  await page.locator('#reco-results .reco-featured').screenshot({path:path.join(__dirname,'screenshots','lot3-piste-soin.png'),animations:'disabled'});
  for(const width of [320,390,768]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2),'Façon de soigner à '+width+'px');
  }
  await page.setViewportSize({width:390,height:844});
  await healQuestion.screenshot({path:path.join(__dirname,'screenshots','lot3-facon-de-soigner-mobile.png'),animations:'disabled'});
  // Détail par réponse et arrondis bornés, y compris le cas autrefois affiché « 30 / 29 ».
  await page.evaluate(()=>{
   localStorage.clear();localStorage.setItem('wf-recommend-v1',JSON.stringify({roles:{soin:5},activities:{bg:0,solo:3},range:{value:'distance',certainty:0},styles:{zone:4,surv:5,support:4},mastery:3}));
  });
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-reco-mode="guided"]').click();await page.locator('[data-reco-reveal]').click();
  const detailsWhy=page.locator('#reco-results .reco-why').nth(1);
  await detailsWhy.locator(':scope > summary').focus();await page.keyboard.press('Enter');
  assert.equal(await detailsWhy.evaluate(d=>d.open),true);
  // Chaque choix se lit en trois temps : note de référence de la spécialisation, ton choix, résultat.
  assert.match(await detailsWhy.locator('.reco-friendly-groups').textContent(),/Soutien/);
  assert.doesNotMatch(await detailsWhy.locator('.reco-friendly-groups').textContent(),/\d|%/);
  const totals=await page.locator('#reco-results .reco-result-card').evaluateAll(cards=>cards.map(c=>({score:Number(c.querySelector('.reco-score strong').textContent),parts:[...c.querySelectorAll('.reco-calculation tbody td:last-child')].map(x=>x.textContent.match(/\d+/g).map(Number))})));
  for(const t of totals){assert.equal(t.parts.reduce((n,p)=>n+p[0],0),t.score);assert.ok(t.parts.every(p=>p[0]<=p[1]));}
  for(const width of [320,390,768,1300]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2),'Explications ouvertes à '+width+'px');
   if(width===390||width===1300)await detailsWhy.screenshot({path:path.join(__dirname,'screenshots','explications-'+width+'.png'),animations:'disabled'});
  }
  const destination=await detailsWhy.locator('a').getAttribute('href');
  await detailsWhy.locator('a').click();
  assert.ok(page.url().endsWith(destination));
  assert.equal(await page.locator(page.url().slice(page.url().indexOf('#'))).count(),1,'Lien vers la bonne configuration');
  await page.locator('main > nav a').first().click();
  await page.locator('[data-reco-mode="guided"]').click();
  await page.locator('[data-reco-reveal]').click();
  assert.equal(await page.locator('#reco-results .reco-score strong').nth(1).textContent(),String(totals[1].score),'Préférences conservées après consultation des sources');
  // Tableau des notes : chaque ligne de classe déroule ses spécialisations (notes du moteur), à la souris ou au clavier.
  await page.setViewportSize({width:1300,height:900});
  const specRows=page.locator('table.matrix tr.spec-row'),parents=page.locator('table.matrix tr.spec-parent');
  await page.locator('table.matrix').scrollIntoViewIfNeeded();
  assert.equal(await parents.count(),9);
  assert.equal(await specRows.count(),28);
  assert.equal(await page.locator('table.matrix td.spec-cell[data-k]').count(),28*14);
  assert.equal(await page.locator('td.cell[data-k]').count(),126,'Les notes historiques restent seules notées « cell »');
  assert.equal(await page.evaluate(()=>window.WFSpecRows.mount(document)),null,'Un second montage ne duplique rien');
  assert.equal(await specRows.count(),28);
  assert.equal(await page.locator('table.matrix tr.spec-row:visible').count(),0,'Spécialisations repliées à l’arrivée');
  const firstColumn=()=>page.locator('table.matrix thead th.corner').evaluate(th=>Math.round(th.getBoundingClientRect().width));
  const closedColumn=await firstColumn();
  const visibleSpecs=()=>page.locator('table.matrix tr.spec-row:visible').evaluateAll(rows=>rows.map(r=>({id:r.dataset.spec,
   notes:[...r.querySelectorAll('td')].map(td=>td.dataset.k==='tech'?td.dataset.pve+'·'+td.dataset.pvp:(td.dataset.v||'—')).join(' ')})));
  await parents.first().locator('td[data-k="burst"]').click();
  assert.equal(await parents.first().locator('.spec-toggle').getAttribute('aria-expanded'),'true');
  assert.deepEqual(await visibleSpecs(),[
   {id:'guerrier-armes',notes:'— — — 4 4 3 5 4 3 3 4 2 2 4·4'},
   {id:'guerrier-fureur',notes:'— — — 5 4 3 4 5 2 3 4 2 3 3·4'},
   {id:'guerrier-protection',notes:'— 5 — — 4 2 2 3 3 5 3 3 3 4·4'}]);
  assert.equal(await firstColumn(),closedColumn,'La colonne des noms ne bouge pas à l’ouverture');
  // Le nom de la classe ouvre toujours sa fiche, sans replier ni déplier.
  await parents.first().locator('a[href="#c-guerrier"]').click();
  assert.ok(page.url().endsWith('#c-guerrier'));
  assert.equal(await page.locator('table.matrix tr.spec-row:visible').count(),3);
  await page.locator('table.matrix').scrollIntoViewIfNeeded();
  await parents.first().locator('.spec-toggle').click();
  assert.equal(await page.locator('table.matrix tr.spec-row:visible').count(),0);
  assert.equal(await parents.first().locator('.spec-toggle').getAttribute('aria-expanded'),'false');
  // Clavier : le bouton de la ligne s'active avec Entrée puis Espace.
  await parents.nth(2).locator('.spec-toggle').focus();
  await page.keyboard.press('Enter');
  assert.deepEqual((await visibleSpecs()).map(r=>r.id),['chasseur-maitrise-betes','chasseur-precision','chasseur-survie']);
  assert.match(await page.locator('#spec-chasseur-precision th').textContent(),/^Précision\s*Loup solitaire$/);
  await page.keyboard.press('Space');
  assert.equal(await page.locator('table.matrix tr.spec-row:visible').count(),0);
  // Tout dérouler, puis tout replier.
  const allSpecs=page.locator('.spec-all');
  await allSpecs.click();
  assert.equal(await page.locator('table.matrix tr.spec-row:visible').count(),28);
  assert.equal(await allSpecs.getAttribute('aria-expanded'),'true');
  assert.equal((await allSpecs.textContent()).trim(),'Replier les spécialisations');
  assert.deepEqual(await page.locator('table.matrix .spec-toggle').evaluateAll(b=>b.map(x=>x.getAttribute('aria-expanded'))),Array(9).fill('true'));
  await page.waitForTimeout(500);
  await page.locator('section:has(#h-matrix)').screenshot({path:path.join(__dirname,'screenshots','notes-specialisations-desktop.png'),animations:'disabled'});
  for(const width of [320,390,768,1024]){
   await page.setViewportSize({width,height:900});
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2),'Tableau déroulé à '+width+'px');
  }
  await page.setViewportSize({width:390,height:844});
  const mobileOpen=await firstColumn();
  await page.locator('table.matrix').scrollIntoViewIfNeeded();
  await page.locator('.table-box:has(table.matrix)').screenshot({path:path.join(__dirname,'screenshots','notes-specialisations-mobile.png'),animations:'disabled'});
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await page.locator('#spec-guerrier-armes td').first().evaluate(td=>getComputedStyle(td).animationName),'none','Pas d’animation avec reduced-motion');
  await page.emulateMedia({reducedMotion:'no-preference'});
  await allSpecs.click();
  assert.equal(await page.locator('table.matrix tr.spec-row:visible').count(),0);
  assert.equal(await firstColumn(),mobileOpen,'Colonne des noms stable sur mobile');
  await page.setViewportSize({width:1300,height:900});

  // Chaque fiche fonctionne au clavier et aux quatre largeurs, notes dépliées.
  for(const cls of ['chaman','chasseur','demoniste','druide','guerrier','mage','paladin','pretre','voleur']){
   await page.goto('http://127.0.0.1:'+server.address().port+'/fiches-sources/'+cls+'.html');
   await page.locator('section.config details > summary').first().focus();await page.keyboard.press('Enter');
   assert.equal(await page.locator('section.config details').first().evaluate(d=>d.open),true);
   for(const width of [320,390,768,1300]){
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2),'Fiche '+cls+' à '+width+'px');
   }
   if(cls==='mage'){
    await page.screenshot({path:path.join(__dirname,'screenshots','sources-desktop.png'),animations:'disabled'});
    await page.setViewportSize({width:390,height:844});await page.screenshot({path:path.join(__dirname,'screenshots','sources-mobile.png'),animations:'disabled'});
   }
  }
  // v14 : rôles évalués dans leurs activités, explications en mots, nouveau critère PvE explicite.
  await page.goto('http://127.0.0.1:'+server.address().port+'/');
  for(const [label,activities] of [['pvp',{bg:5,world:5}],['solo',{solo:5}],['raid',{raid:5}],['mixte',{raid:5,bg:5}]]){
   await page.evaluate(p=>{localStorage.clear();localStorage.setItem('wf-recommend-v1',JSON.stringify(p));},
    {roles:{dps:5},rolesStrict:true,activities,styles:{burst:4,ctrl:5},difficulty:{value:'simple',certainty:5},mastery:0});
   await page.reload({waitUntil:'domcontentloaded'});await page.setViewportSize({width:1300,height:1000});
   await page.locator('[data-reco-mode="guided"]').click();await page.locator('[data-step="1"]').click();
   assert.match(await page.locator('#reco-form legend').textContent(),/Quelles activités comptent pour toi/);
   assert.match(await page.locator('#reco-form').textContent(),/Coche les activités où tu veux que ta classe soit à l’aise/);
   await page.locator('[data-reco-reveal]').click();
   const why=page.locator('#reco-results .reco-why').first();await why.locator(':scope > summary').click();
   const words=await why.locator('.reco-friendly-groups').textContent();
   assert.doesNotMatch(words,/\d|%|DPS PvE/);
   if(label==='pvp'||label==='solo')assert.doesNotMatch(words,/donjon|raid/i);
   if(label==='pvp')assert.match(words,/PvP/);
   if(label==='solo')assert.match(words,/solo/i);
   assert.equal(await why.locator('.reco-calculation').evaluate(d=>d.open),false);
   if(label==='pvp')await page.locator('#reco-results .reco-result-card').first().screenshot({path:path.join(__dirname,'screenshots','v14-pvp-desktop.png'),animations:'disabled'});
   if(label==='solo'){
    await page.setViewportSize({width:390,height:1000});
    await page.locator('#reco-results .reco-result-card').first().screenshot({path:path.join(__dirname,'screenshots','v14-solo-mobile.png'),animations:'disabled'});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2));
   }
  }
  // v15 : synthèse monocible/zone, mêmes chiffres dans les deux parcours, détail facultatif et mobile.
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('wf-recommend-v1',JSON.stringify({roles:{dps:5},rolesStrict:true,activities:{raid:5},mastery:2}));});
  await page.reload({waitUntil:'domcontentloaded'});await page.setViewportSize({width:1300,height:1000});
  await page.locator('[data-reco-mode="guided"]').click();await page.locator('[data-reco-reveal]').click();
  const fireCard=page.locator('#reco-results .reco-result-card').filter({has:page.locator('a[href="fiches-sources/mage.html#mage-feu"]')});
  assert.equal(await fireCard.count(),1);
  await fireCard.locator('.reco-why > summary').click();
  assert.match(await fireCard.locator('.reco-why').textContent(),/sur une cible.*groupes d’ennemis/);
  const fireCalc=fireCard.locator('.reco-calculation');assert.equal(await fireCalc.evaluate(d=>d.open),false);
  await fireCalc.locator('summary').click();
  const recipe=await fireCalc.textContent();assert.doesNotMatch(recipe,/75\s?%|25\s?%|Synthèse|Repère PvE de groupe/);
  await fireCard.screenshot({path:path.join(__dirname,'screenshots','v15-pve-desktop.png'),animations:'disabled'});
  await page.setViewportSize({width:390,height:1100});
  assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2));
  await fireCard.screenshot({path:path.join(__dirname,'screenshots','v15-pve-mobile.png'),animations:'disabled'});
  await page.setViewportSize({width:1300,height:1000});await page.locator('[data-reco-mode="priorities"]').click();
  await page.locator('[data-prio-preset="dps"]').click();
  const firePlace=page.locator('#reco-priority-results .reco-priority-class').filter({has:page.locator('a[href="fiches-sources/mage.html#mage-feu"]')});
  assert.equal(await firePlace.count(),1);await firePlace.locator('.reco-why > summary').click();
  assert.equal(await firePlace.locator('.reco-calculation').evaluate(d=>d.open),false);
  assert.doesNotMatch(await firePlace.locator('.reco-calculation').textContent(),/75\s?%|25\s?%|Synthèse/);

  // Une sauvegarde des 14 anciens poids n'active aucun nouveau poids ; le quinzième se sauvegarde et se restaure.
  await page.evaluate(()=>{
   const w=Object.fromEntries(window.__WF.axes.map(k=>[k,0]));w.dps=3;w.bg=3;
   localStorage.clear();localStorage.setItem('wf-overview-v3',JSON.stringify({w,m:2}));
   localStorage.setItem('wf-priority-custom-v1',JSON.stringify({weights:w,mastery:2}));
  });
  await page.reload({waitUntil:'domcontentloaded'});await page.setViewportSize({width:1300,height:1000});
  await page.locator('[data-reco-mode="priorities"]').click();
  assert.equal(await weight('raid',0),'true');assert.equal(await weight('dps',3),'true');
  await page.locator('[data-prio-axis="raid"][data-prio-weight="3"]').click();
  await page.locator('[data-prio-save]').click();await page.locator('[data-prio-preset="pvp"]').click();
  assert.equal(await weight('raid',0),'true');await page.locator('[data-prio-restore]').click();
  assert.equal(await weight('raid',3),'true');
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-reco-mode="priorities"]').click();
  assert.equal(await weight('raid',3),'true');assert.equal(await weight('bg',3),'true');
  // Régression : sélectionner une réponse ne déplace pas les autres cartes et garde le focus.
  for(const width of [320,390,900]){
   await page.evaluate(()=>localStorage.clear());await page.reload({waitUntil:'domcontentloaded'});
   await page.setViewportSize({width,height:950});await page.locator('[data-reco-mode="guided"]').click();
   for(const [step,group,key] of [[2,'range','distance'],[4,'pet','like']]){
    await page.locator('[data-step="'+step+'"]').click();
    const buttons=page.locator('[data-single="'+group+'"]');
    const places=()=>buttons.evaluateAll(items=>items.map(b=>{const r=b.getBoundingClientRect();return {key:b.dataset.key,y:r.top+window.scrollY,x:r.left,h:r.height};}));
    const selected=page.locator('[data-single="'+group+'"][data-key="'+key+'"]');await selected.scrollIntoViewIfNeeded();
    const scrollBefore=await page.evaluate(()=>window.scrollY);
    const before=await places();await selected.click();
    assert.ok(Math.abs(await page.evaluate(()=>window.scrollY)-scrollBefore)<=1,'Défilement stable '+width+'/'+group);
    const after=await places();for(let i=0;i<before.length;i++){
     assert.ok(Math.abs(before[i].y-after[i].y)<=1&&Math.abs(before[i].h-after[i].h)<=1,'Cartes stables '+width+'/'+group);
    }
    assert.equal(await page.locator('[data-tuning="'+group+'"] input[type=range]').isVisible(),true);
    assert.equal(await page.locator('[data-tuning="'+group+'"] summary').count(),0);
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.key),key);
    if(width===900&&group==='range')await page.locator('#reco-guided .reco-workspace').screenshot({path:path.join(__dirname,'screenshots','selection-stable-desktop.png'),animations:'disabled'});
    if(width===390)await page.locator('#reco-guided .reco-workspace').screenshot({path:path.join(__dirname,'screenshots','mobile-stable-'+group+'.png'),animations:'disabled'});
   }
   if(width===390){
    assert.equal(await page.locator('#reco-summary-choices').isVisible(),false);
    await page.locator('[data-summary-toggle]').click();assert.equal(await page.locator('#reco-summary-choices').isVisible(),true);
    await page.locator('[data-summary-toggle]').click();assert.equal(await page.locator('#reco-summary-choices').isVisible(),false);
    await page.locator('[data-reco-mode="priorities"]').click();
    assert.equal(await page.locator('#prio-group-2').isVisible(),false);
    await page.locator('[data-prio-group-toggle="2"]').click();
    await page.locator('[data-prio-axis="ctrl"][data-prio-weight="2"]').click();
    assert.equal(await page.locator('#prio-group-2').isVisible(),true);
    assert.equal(await page.evaluate(()=>document.activeElement.dataset.prioAxis),'ctrl');
    await page.locator('#reco-priority-form').screenshot({path:path.join(__dirname,'screenshots','mobile-priorites-allegees.png'),animations:'disabled'});
   }
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2));
  }
  // Exigeant très affirmé : préciser le sens de l'écart, avec une vraie spé intermédiaire.
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('wf-recommend-v1',JSON.stringify({roles:{dps:5},rolesStrict:true,range:{value:'distance',certainty:5,strict:true},activities:{raid:5},difficulty:{value:'complex',certainty:5},mastery:3}));});
  await page.reload({waitUntil:'domcontentloaded'});await page.setViewportSize({width:390,height:1000});
  await page.locator('[data-reco-mode="guided"]').click();await page.locator('[data-step="5"]').click();
  assert.equal(await page.locator('#rc-difficulty-complex').isVisible(),true);
  assert.equal(await page.locator('#rc-difficulty-complex').inputValue(),'5');
  assert.doesNotMatch(await page.locator('#reco-form .reco-question').textContent(),/facultatif/);
  await page.locator('#reco-guided .reco-workspace').screenshot({path:path.join(__dirname,'screenshots','certitude-visible-mobile.png'),animations:'disabled'});
  await page.locator('[data-show-results]').click();
  const arcaneCard=page.locator('#reco-results .reco-result-card').filter({has:page.locator('a[href="fiches-sources/mage.html#mage-arcane"]')});
  assert.equal(await arcaneCard.count(),1);await arcaneCard.locator('.reco-why > summary').click();
  const complexity=arcaneCard.locator('.reco-friendly-groups li').filter({has:page.locator('h5',{hasText:'Complexité'})});
  assert.match(await complexity.textContent(),/Plus simple que ton envie/);
  assert.match(await complexity.textContent(),/difficulté intermédiaire en PvE/);
  assert.doesNotMatch(await complexity.textContent(),/À voir si/);
  await complexity.screenshot({path:path.join(__dirname,'screenshots','complexite-envie.png'),animations:'disabled'});
  // Fureur en PvE : les six graduations passent par le vrai curseur, pour les deux envies.
  await page.evaluate(()=>{localStorage.clear();localStorage.setItem('wf-recommend-v1',JSON.stringify({roles:{dps:5},rolesStrict:true,activities:{raid:5},mastery:3}));});
  await page.reload({waitUntil:'domcontentloaded'});await page.locator('[data-reco-mode="guided"]').click();
  for(const value of ['simple','complex'])for(const certainty of [0,1,2,3,4,5]){
   await page.locator('[data-step="5"]').click();
   await page.locator('[data-single="difficulty"][data-key="'+value+'"]').click();
   const slider=page.locator('#rc-difficulty-'+value);await slider.press('Home');
   for(let i=0;i<certainty;i++)await slider.press('ArrowRight');
   assert.equal(await slider.inputValue(),String(certainty));
   await page.locator('[data-show-results]').click();
   const fury=page.locator('#reco-results .reco-result-card').filter({has:page.locator('a[href="fiches-sources/guerrier.html#guerrier-fureur"]')});
   assert.equal(await fury.count(),1);
   if(!await fury.locator('.reco-why').evaluate(d=>d.open))await fury.locator('.reco-why > summary').click();
   const g=fury.locator('.reco-friendly-groups li').filter({has:page.locator('h5',{hasText:'Complexité'})});
   const expected=certainty<=2?'Une piste compatible':certainty<5?'Un peu plus '+(value==='simple'?'technique':'simple'):value==='simple'?'Plus technique que ton envie':'Plus simple que ton envie';
   assert.equal(await g.locator('.reco-friendly-head span').textContent(),expected);
   assert.match(await g.textContent(),/difficulté intermédiaire en PvE/);
   if(certainty<=2)assert.match(await g.textContent(),/préférence reste souple.*peut bien te convenir/);
   if(value==='simple'&&certainty===2)await g.screenshot({path:path.join(__dirname,'screenshots','complexite-souple-mobile.png'),animations:'disabled'});
  }
  assert.deepEqual(errors,[],'Erreurs JavaScript navigateur');
  process.stdout.write('Chromium : deux parcours, 15 poids, 15 presets, 28 spécialisations classées, maîtrise partagée, mobile et clavier — OK\n');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
}
check().catch(err=>{console.error(err);process.exitCode=1;});
