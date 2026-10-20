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
const allowed={'/':'index.html','/index.html':'index.html','/questionnaire.js':'questionnaire.js','/recommendation-engine.js':'recommendation-engine.js'};
const server=http.createServer((req,res)=>{
  const pathname=new URL(req.url,'http://localhost').pathname;
  if(!Object.hasOwn(allowed,pathname)){res.writeHead(404);res.end();return;}
  const file=allowed[pathname];
  res.setHeader('content-type',file.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');
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
  assert.equal(await page.locator('#reco-form .reco-question').count(),6);
  assert.match(await page.locator('#reco-results').textContent(),/Aucune classe n’est favorisée/);

  // Aucun classement par défaut et aucun conflit avec les 14 critères historiques.
  assert.equal(await page.locator('#rank').count(),1);
  assert.equal(await page.locator('td.cell[data-k]').count(),126);
  assert.equal(await page.locator('#legacy-advanced').evaluate(el=>el.open),false);
  await page.locator('#legacy-advanced > summary').click();
  assert.equal(await page.locator('#legacy-advanced').evaluate(el=>el.open),true);
  await page.locator('#legacy-advanced > summary').click();

  // Choix + certitude 0/5 : ce n'est pas une exclusion automatique.
  await page.locator('[data-multi="roles"][data-key="dps"]').click();
  await page.locator('#rc-roles-dps').evaluate(el=>{el.value='0';el.dispatchEvent(new Event('input',{bubbles:true}));});
  assert.match(await page.locator('#reco-results').textContent(),/Les classes qui correspondent/);
  assert.equal(await page.locator('#rc-roles-dps').inputValue(),'0');
  assert.ok(await page.locator('#reco-results .reco-result-card').count()>=1);

  // Contrainte explicite incompatible : tank strict + DPS à distance strict.
  await page.locator('#reco-reset').click();
  await page.locator('[data-multi="roles"][data-key="tank"]').click();
  await page.locator('[data-roles-strict]').check();
  await page.locator('[data-single="range"][data-key="distance"]').click();
  await page.locator('[data-strict="range"]').check();
  assert.match(await page.locator('#reco-results').textContent(),/Aucune spécialisation ne respecte/);

  // Réinitialisation puis au plus trois styles.
  await page.locator('#reco-reset').click();
  for(const k of ['ctrl','zone','burst','surv'])await page.locator('[data-multi="styles"][data-key="'+k+'"]').click();
  assert.equal(await page.locator('.reco-cert').count(),3);
  assert.match(await page.locator('#reco-results').textContent(),/Les classes qui correspondent/);

  // Sauvegarde des réponses après rechargement.
  await page.reload({waitUntil:'domcontentloaded'});
  await page.waitForSelector('[data-multi="styles"][data-key="ctrl"]');
  assert.equal(await page.locator('[data-multi="styles"][data-key="ctrl"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.reco-cert').count(),3);

  // Mise en page mobile et champ clavier focusable.
  await page.setViewportSize({width:390,height:844});
  await page.locator('#h-reco').scrollIntoViewIfNeeded();
  const dimensions=await page.evaluate(()=>({document:document.documentElement.scrollWidth,viewport:document.documentElement.clientWidth}));
  assert.ok(dimensions.document<=dimensions.viewport+2,'Débordement horizontal : '+JSON.stringify(dimensions));
  assert.equal(await page.locator('.reco-question').count(),6);
  await page.locator('[data-multi="styles"][data-key="ctrl"]').focus();
  assert.equal(await page.evaluate(()=>document.activeElement.dataset.key),'ctrl');

  fs.mkdirSync(path.join(__dirname,'screenshots'),{recursive:true});
  await page.screenshot({path:path.join(__dirname,'screenshots','questionnaire-mobile.png'),fullPage:false});
  await page.setViewportSize({width:1300,height:900});
  await page.locator('#h-reco').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(__dirname,'screenshots','questionnaire-desktop.png'),fullPage:false});
  assert.deepEqual(errors,[],'Erreurs JavaScript navigateur');
  process.stdout.write('Chromium : questionnaire, certitude, veto, persistance, 14 axes, mobile et clavier — OK\n');
 }finally{
  if(browser)await browser.close();
  await new Promise(resolve=>server.close(resolve));
 }
}
check().catch(err=>{console.error(err);process.exitCode=1;});
