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
const allowed={'/':'index.html','/index.html':'index.html','/questionnaire.js':'questionnaire.js','/recommendation-engine.js':'recommendation-engine.js','/priorities-ui.js':'priorities-ui.js','/ux-polish.css':'ux-polish.css','/warcraft-visual-pack.css':'warcraft-visual-pack.css','/assets/hero-landscape.svg':'assets/hero-landscape.svg'};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!Object.hasOwn(allowed,pathname)){res.writeHead(404);res.end();return;}
  const file=allowed[pathname];
  res.setHeader('content-type',file.endsWith('.js')?'text/javascript; charset=utf-8':file.endsWith('.css')?'text/css; charset=utf-8':file.endsWith('.svg')?'image/svg+xml; charset=utf-8':'text/html; charset=utf-8');
  res.end(fs.readFileSync(path.join(base,file)));
});
async function check(){
 await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
 let browser;
 try{
  browser=await chromium.launch({headless:true});
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
  assert.match(await page.locator('#reco-results').textContent(),/Tout commence par tes envies/);
  assert.equal(await page.locator('#reco-hero-facts').count(),0);
  assert.equal(await page.locator('link[href="ux-polish.css"]').count(),1);

  // Le comparatif historique reste intact sous ses réglages avancés.
  assert.equal(await page.locator('#rank').count(),1);
  assert.equal(await page.locator('td.cell[data-k]').count(),126);
  assert.equal(await page.locator('.wow-class-index img').count(),9,'Les neuf icônes de classe doivent figurer dans la navigation');
  assert.equal(await page.locator('.wow-card-class-icon').count(),9,'Les neuf fiches doivent utiliser l’iconographie officielle');
  assert.equal(await page.locator('.wow-hero-logo').count(),1);
  assert.match(await page.locator('.wow-hero-logo').getAttribute('src'),/bnetcmsus-a\.akamaihd\.net/);
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
  await page.locator('[data-reco-reveal]').click();
  assert.equal(await page.locator('#reco-results .reco-result-card').count(),3);
  await page.locator('[data-reco-hide]').click();
  assert.equal(await page.locator('#reco-results .reco-result-card').count(),0);
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

  // Second parcours : poids classiques réutilisés, mêmes 15 profils, top neuf classes.
  await page.locator('[data-reco-mode="priorities"]').click();
  assert.equal(await page.locator('#reco-priorities').isVisible(),true);
  assert.equal(await page.locator('#reco-guided').isVisible(),false);
  assert.equal(await page.locator('[data-prio-preset]').count(),15);
  assert.equal(await page.locator('[data-prio-axis]').count(),56);
  assert.equal(await page.locator('#reco-priority-results .reco-priority-class').count(),9);
  await page.locator('[data-prio-preset="pvp"]').click();
  assert.equal(await page.locator('.seg button[data-ax="bg"][data-v="3"]').getAttribute('aria-pressed'),'true');
  await page.locator('[data-prio-mastery="3"]').click();
  assert.equal(await page.locator('.mbtn[data-m="3"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('#reco-priority-results .reco-priority-class').count(),9);
  await page.locator('[data-prio-axis="poly"][data-prio-weight="0"]').click();
  assert.equal(await page.locator('.seg button[data-ax="poly"][data-v="0"]').getAttribute('aria-pressed'),'true');
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('wf-overview-v3')));
  assert.equal(saved.w.bg,3);assert.equal(saved.m,3);
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
  const measurements=await page.evaluate(()=>({
    document:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth
  }));
  assert.ok(measurements.document<=measurements.viewport+2,'Débordement horizontal '+JSON.stringify(measurements));
  assert.equal(await page.locator('#reco-priority-results .reco-priority-class').count(),9);
  await page.locator('[data-reco-mode="guided"]').click();
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
  // Contrôles des ressources graphiques et de l’accessibilité des animations.
  const assets=await page.evaluate(async()=>Promise.all(['ux-polish.css','warcraft-visual-pack.css','assets/hero-landscape.svg'].map(async p=>{
    const r=await fetch(p);return {url:p,status:r.status,ok:r.ok};
  })));
  assert.ok(assets.every(x=>x.ok),'CSS et illustration manquants : '+JSON.stringify(assets));
  await page.emulateMedia({reducedMotion:'reduce'});
  const motion=await page.locator('.reco-modes button').first().evaluate(el=>getComputedStyle(el).transitionDuration);
  assert.match(motion,/^0s(, 0s)*$/,'Les transitions doivent être désactivées avec reduced-motion');
  const reducedHover=await page.locator('.wow-class-index a').first().evaluate(el=>getComputedStyle(el).transitionDuration);
  assert.match(reducedHover,/^0s(, 0s)*$/,'Les hover doivent respecter reduced-motion');
  await page.emulateMedia({reducedMotion:'no-preference'});
  assert.deepEqual(errors,[],'Erreurs JavaScript navigateur');
  process.stdout.write('Chromium : deux parcours, 14 poids, 15 presets, neuf rangs, maîtrise partagée, mobile et clavier — OK\n');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
}
check().catch(err=>{console.error(err);process.exitCode=1;});
