'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async function(browser,url){
 const context=await browser.newContext({viewport:{width:1300,height:900},locale:'fr-FR',reducedMotion:'reduce'});
 await context.route('https://fonts.googleapis.com/**',r=>r.abort());await context.route('https://fonts.gstatic.com/**',r=>r.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const panel=page.locator('#reco-live'),body=page.locator('#reco-live-body'),summary=panel.locator(':scope > summary');
 const bottom=()=>page.waitForFunction(()=>{const e=document.getElementById('reco-live');return e.scrollTop>=e.scrollHeight-e.clientHeight-3;});
 const geometry=()=>page.evaluate(()=>{
  const panel=document.getElementById('reco-live'),box=panel.getBoundingClientRect(),last=panel.querySelector('li:last-child').getBoundingClientRect(),head=panel.querySelector('summary').getBoundingClientRect();
  return {scrollable:panel.scrollHeight>panel.clientHeight,visibleLast:last.bottom<=box.bottom+2&&last.top>=head.bottom-2,
   fixedHead:Math.abs(head.top-box.top)<=2,height:box.height,viewport:innerHeight,overflow:document.documentElement.scrollWidth>document.documentElement.clientWidth+2};
 });
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});await page.locator('[data-reco-mode="guided"]').click();
  assert.equal(await panel.evaluate(e=>e.open),false);assert.equal(await body.locator('li').count(),0);
  await page.locator('[data-multi="roles"][data-key="dps"]').click();
  assert.equal(await body.locator('li').count(),28);assert.equal(await page.locator('#reco-results .reco-result-card').count(),0);
  await page.locator('[data-step="1"]').click();await page.locator('[data-multi="activities"][data-key="raid"]').click();
  await page.locator('[data-reco-reveal]').click();
  assert.equal(await page.locator('#reco-results .reco-result-card').count(),5);
  assert.equal(await page.locator('[data-reco-full], [data-live-more]').count(),0);
  await summary.focus();await page.keyboard.press('Enter');assert.equal(await panel.evaluate(e=>e.open),true);
  const compared=await page.evaluate(()=>{
   const rows=[...document.querySelectorAll('#reco-live-body li')].map(e=>[e.querySelector('b').textContent,e.querySelector('small').textContent,Number(e.querySelector('.reco-live-score').textContent)]);
   const expected=WFRecommend.ranking(WFGuide.getProfile()).results.map(r=>[r.spec.className,r.spec.label+(r.spec.variant==='sans-familier'?' · sans familier':''),Math.round(r.score)]);
   return {rows,expected};
  });assert.deepEqual(compared.rows,compared.expected);
  // Le clavier atteint le dernier élément aux changements de colonnes et de hauteur de question.
  for(const width of [1300,1061,1060,821,820,390,320])for(const step of [0,2,5]){
   await page.setViewportSize({width,height:900});await page.locator('[data-step="'+step+'"]').click();
   await panel.scrollIntoViewIfNeeded();await panel.evaluate(e=>{e.scrollTop=0;});
   await body.focus();await page.keyboard.press('End');await bottom();
   const g=await geometry();assert.ok(g.scrollable&&g.visibleLast&&g.fixedHead&&!g.overflow,'Fin du classement '+width+'/'+step+': '+JSON.stringify(g));
   assert.ok(g.height<=g.viewport+2,'Cadre borné à la fenêtre');
   if(step===5&&[390,1300].includes(width))await panel.screenshot({path:path.join(__dirname,'screenshots','apercu-classement-fin-'+width+'.png'),animations:'disabled'});
  }
  // La molette atteint elle aussi le dernier élément ; aucune coupure masquée dans un ancêtre.
  for(const width of [390,900,1300]){
   await page.setViewportSize({width,height:900});await panel.scrollIntoViewIfNeeded();await panel.evaluate(e=>{e.scrollTop=0;});
   await panel.hover();await page.mouse.wheel(0,100000);await bottom();assert.ok((await geometry()).visibleLast);
  }
  await body.focus();await page.keyboard.press('Shift+Tab');assert.equal(await summary.evaluate(e=>e===document.activeElement),true);
  await page.keyboard.press('Enter');assert.equal(await panel.evaluate(e=>e.open),false);
  await page.keyboard.press('Enter');assert.equal(await panel.evaluate(e=>e.open),true);
  // Les contraintes ajustent la liste et son compteur, sans changer les cinq pistes détaillées.
  await page.locator('[data-step="2"]').click();await page.locator('[data-single="range"][data-key="distance"]').click();await page.locator('[data-strict="range"]').check();
  const filtered=await page.evaluate(()=>WFRecommend.ranking(WFGuide.getProfile()).results.length);
  assert.ok(filtered>0&&filtered<28);assert.equal(await body.locator('li').count(),filtered);
  assert.equal(await page.locator('#reco-live-status').textContent(),filtered+' spécialisations à comparer');
  await panel.scrollIntoViewIfNeeded();await body.focus();await page.keyboard.press('End');await bottom();assert.ok((await geometry()).visibleLast);
  // Une question longue ne pousse pas le cadre au-delà de la fenêtre.
  await page.locator('[data-step="3"]').click();for(const key of ['burst','zone','ctrl'])await page.locator('[data-multi="styles"][data-key="'+key+'"]').click();
  await panel.scrollIntoViewIfNeeded();await body.focus();await page.keyboard.press('End');await bottom();assert.ok((await geometry()).height<=902);
  // Même accès au classement lors de la consultation d’un partage (questionnaire masqué).
  const hash=await page.evaluate(()=>new URL(WFResultShare.link(WFResultShare.create('guided',WFRecommend.sanitize({roles:{dps:3},activities:{raid:3}})),location.href)).hash);
  await page.goto(url+hash,{waitUntil:'domcontentloaded'});assert.equal(await page.locator('#reco-shared-profile').isVisible(),true);
  for(const width of [1300,390]){
   await page.setViewportSize({width,height:900});
   if(!await panel.evaluate(e=>e.open))await summary.click();
   await panel.scrollIntoViewIfNeeded();await body.focus();await page.keyboard.press('End');await bottom();
   const g=await geometry();assert.ok(g.visibleLast&&g.fixedHead&&g.height>150&&g.height<=g.viewport+2,'Aperçu partagé '+width+': '+JSON.stringify(g));
  }
  await page.locator('[data-share-return]').click();assert.equal(await page.locator('#reco-shared-profile').isVisible(),false);
  await page.locator('#reco-reset').click();assert.equal(await body.locator('li').count(),0);
  assert.match(await page.locator('#reco-live-status').textContent(),/Toutes les spécialisations/);
  assert.deepEqual(errors,[]);
  process.stdout.write('Chromium aperçu : classement complet, dernière ligne accessible à la molette et au clavier, en-tête visible, filtres, partage, mobile et top 5 — OK\n');
 }finally{await context.close();}
};
