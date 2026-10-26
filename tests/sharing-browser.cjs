'use strict';
/* Contrat réel des deux parcours : ouvrir, consulter, revenir, adopter et partager. */
const assert=require('node:assert/strict'),path=require('node:path');
module.exports=async function(browser,url){
 const context=await browser.newContext({viewport:{width:1300,height:900},locale:'fr-FR',acceptDownloads:true});
 await context.route('https://fonts.googleapis.com/**',r=>r.abort());await context.route('https://fonts.gstatic.com/**',r=>r.abort());
 const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(String(e)));
 const modal=page.locator('dialog.reco-share-dialog');
 const store=()=>page.evaluate(()=>JSON.stringify(Object.fromEntries(Object.keys(localStorage).sort().map(k=>[k,localStorage.getItem(k)]))));
 try{
  await page.goto(url,{waitUntil:'domcontentloaded'});
  await page.evaluate(()=>{
   const E=WFRecommend;
   localStorage.setItem('wf-recommend-v1',JSON.stringify(E.sanitize({roles:{dps:1},activities:{raid:2},mastery:1})));
   localStorage.setItem('wf-overview-v3',JSON.stringify({w:E.sanitizeWeights({solo:3,surv:1}),m:1,hl:'héritage',c:E.sanitizeWeights({ctrl:3})}));
   localStorage.setItem('wf-priority-custom-v1',JSON.stringify({weights:E.sanitizeWeights({dps:3,raid:3}),mastery:0}));
  });
  await page.reload();
  assert.equal(await page.locator('[data-share-import]').isVisible(),true);
  assert.ok(await page.evaluate(()=>document.querySelector('.reco-import-entry').getBoundingClientRect().bottom<=document.querySelector('.reco-modes').getBoundingClientRect().top));
  await page.locator('.reco-mode-intro').screenshot({path:path.join(__dirname,'screenshots','import-accueil.png'),animations:'disabled'});
  const original=await store(),custom=await page.evaluate(()=>localStorage.getItem('wf-priority-custom-v1'));
  const packets=await page.evaluate(()=>{
   const E=WFRecommend,C=WFResultShare;
   return [C.create('guided',E.sanitize({roles:{dps:4},activities:{bg:5,world:1},range:{value:'distance',certainty:5,strict:true},pet:{value:'avoid',certainty:5,strict:true},styles:{ctrl:0,surv:3},difficulty:{value:'complex',certainty:1},mastery:3})),
    C.create('priorities',{weights:E.sanitizeWeights({soin:3,bg:3,util:1,tech:2}),mastery:0})];
  });
  // Lien direct et rechargement : aucun remplacement des choix ni des critères enregistrés.
  for(const packet of packets){
   const token=await page.evaluate(p=>WFResultShare.encode(p),packet);
   await page.goto(url+'#partage='+token,{waitUntil:'domcontentloaded'});
   assert.equal(await page.locator('#reco-shared-profile').isVisible(),true);
   assert.equal(await page.locator('#reco-'+(packet.mode==='guided'?'form':'priority-form')).isVisible(),false);
   assert.equal(await store(),original);
   const actual=await page.evaluate(mode=>(mode==='guided'?WFGuide:WFPriorities).getProfile(),packet.mode);assert.deepEqual(actual,packet.choices);
   const comparison=await page.evaluate(p=>{
    const E=WFRecommend;if(p.mode==='guided'){
     const expected=E.recommend(p.choices,5).top;
     return {actual:[...document.querySelectorAll('#reco-results .reco-result-main h4')].map(e=>e.textContent),expected:expected.map(r=>r.className)};
    }
    return {actual:[...document.querySelectorAll('#reco-priority-results .reco-priority-class-info > b')].map(e=>e.textContent),expected:E.priorityRanking(p.choices.weights,p.choices.mastery).results.slice(0,10).map(r=>r.className)};
   },packet);
   assert.deepEqual(comparison.actual,comparison.expected);
   for(const width of [390,1300]){
    await page.setViewportSize({width,height:900});
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2));
    await page.locator('#reco-shared-profile').screenshot({path:path.join(__dirname,'screenshots','consultation-'+packet.mode+'-'+width+'.png'),animations:'disabled'});
   }
   await page.reload();assert.equal(await store(),original);
   await page.locator('[data-share-return]').click();
   assert.equal(await page.locator('#reco-app.is-choosing').isVisible(),true);assert.equal(await store(),original);
   assert.equal(new URL(page.url()).hash,'');
  }
  // Au milieu du questionnaire : importer puis revenir retrouve aussi l’étape courante.
  await page.locator('[data-reco-mode="guided"]').click();await page.locator('[data-step="3"]').click();
  const beforeImport=await store();
  for(const packet of packets){
   await page.locator('[data-share-import]').click();
   await modal.locator('input[type=file]').setInputFiles({name:'resultats.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(packet))});
   await page.locator('[data-share-return]').waitFor();assert.equal(await store(),beforeImport);
   await page.locator('[data-share-return]').click();
   assert.match(await page.locator('#reco-form legend').textContent(),/Quel style te ressemble/);assert.equal(await store(),beforeImport);
  }
  // Erreurs lisibles, fichier excessif, faux classement : aucune importation partielle.
  await page.locator('[data-share-import]').click();
  for(const [name,content] of [['invalide.json','{'],['faux.json',JSON.stringify({...packets[0],results:[{score:100}]})],['grand.json','x'.repeat(16385)]]){
   await modal.locator('input[type=file]').setInputFiles({name,mimeType:'application/json',buffer:Buffer.from(content)});
   await modal.locator('.is-error').waitFor();assert.equal(await store(),beforeImport);
  }
  await modal.locator('#reco-import-link').fill('https://example.org/');await modal.locator('[data-share-open-link]').click();
  assert.match(await modal.locator('[data-share-status]').textContent(),/ne contient pas/);assert.equal(await store(),beforeImport);
  await page.keyboard.press('Escape');assert.equal(await modal.isVisible(),false);
  // Fermer une importation pendant la lecture ne doit jamais ouvrir des réglages plus tard.
  await page.evaluate(()=>{
   window.__realFileText=File.prototype.text;
   File.prototype.text=function(){return new Promise(resolve=>{window.__finishImport=resolve;});};
  });
  await page.locator('[data-share-import]').click();
  await modal.locator('input[type=file]').setInputFiles({name:'lent.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(packets[0]))});
  await page.waitForFunction(()=>typeof window.__finishImport==='function');await page.keyboard.press('Escape');
  await page.evaluate(async packet=>{window.__finishImport(JSON.stringify(packet));File.prototype.text=window.__realFileText;await new Promise(requestAnimationFrame);},packets[0]);
  assert.equal(await page.locator('#reco-shared-profile').isVisible(),false);assert.equal(await store(),beforeImport);
  // Coller un lien, puis adopter : sauvegarde explicite séparée préservée, maîtrise synchronisée.
  for(const packet of packets){
   const link=await page.evaluate(p=>WFResultShare.link(p,location.href),packet);
   await page.locator('[data-share-import]').click();await modal.locator('#reco-import-link').fill(link);await page.keyboard.press('Enter');
   await page.locator('[data-share-adopt]').click();
   const actual=await page.evaluate(mode=>(mode==='guided'?WFGuide:WFPriorities).getProfile(),packet.mode);assert.deepEqual(actual,packet.choices);
   assert.equal(await page.evaluate(()=>localStorage.getItem('wf-priority-custom-v1')),custom);
   assert.equal(await page.evaluate(()=>WFGuide.getMastery()),packet.choices.mastery);
   assert.equal(await page.evaluate(()=>WFPriorities.getMastery()),packet.choices.mastery);
   assert.equal(await page.locator('#reco-shared-profile').isVisible(),false);
   // Export du même parcours : copie et téléchargement produisent les entrées effectivement affichées.
   const button=page.locator('[data-share-results="'+packet.mode+'"]').first();await button.focus();await page.keyboard.press('Enter');
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async s=>{window.__sharedCopy=s;}}}));
   await modal.locator('[data-share-copy]').click();assert.match(await modal.locator('[data-share-status]').textContent(),/Lien copié/);
   const copied=await page.evaluate(()=>WFResultShare.readLink(window.__sharedCopy));assert.deepEqual(copied.choices,packet.choices);
   const downloadPromise=page.waitForEvent('download');await modal.locator('[data-share-download]').click();
   const download=await downloadPromise,stream=await download.createReadStream(),chunks=[];for await(const chunk of stream)chunks.push(chunk);
   const file=JSON.parse(Buffer.concat(chunks).toString('utf8'));assert.deepEqual(file.choices,packet.choices);
   assert.match(download.suggestedFilename(),/choisir-ma-classe-wow-forever/);
   await page.evaluate(()=>Object.defineProperty(navigator,'clipboard',{configurable:true,value:{writeText:async()=>{throw new Error('refus');}}}));
   await modal.locator('[data-share-copy]').click();assert.match(await modal.locator('[data-share-status]').textContent(),/sélectionné/);
   assert.equal(await modal.locator('#reco-share-link').evaluate(e=>e.selectionEnd-e.selectionStart===e.value.length),true);
   await page.keyboard.press('Escape');assert.equal(await button.evaluate(e=>e===document.activeElement),true);
   await page.reload();assert.deepEqual(await page.evaluate(mode=>(mode==='guided'?WFGuide:WFPriorities).getProfile(),packet.mode),packet.choices);
   await page.locator('[data-reco-mode="'+packet.mode+'"]').click();
  }
  // Téléphone, clavier, contraste visuel et partage natif : aucune barre flottante ni débordement.
  await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async data=>{window.__nativeShare=data;}}));
  for(const width of [320,390,768,1300]){
   await page.setViewportSize({width,height:900});
   assert.equal(await page.locator('[data-share-import]').isVisible(),true);
   await page.locator('[data-share-results="priorities"]').first().click();
   await modal.locator('[data-share-native]').click();assert.equal(await page.evaluate(()=>window.__nativeShare.url),await modal.locator('#reco-share-link').inputValue());
   assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+2));
   assert.ok(await modal.evaluate(e=>e.scrollWidth<=e.clientWidth+2));
   if([390,1300].includes(width))await modal.screenshot({path:path.join(__dirname,'screenshots','partage-'+width+'.png'),animations:'disabled'});
   await page.keyboard.press('Escape');
   if(width===390)await page.locator('#reco-priority-results .reco-results-head').screenshot({path:path.join(__dirname,'screenshots','bouton-partage-mobile.png'),animations:'disabled'});
  }
  // Échec et annulation du partage natif, lien direct invalide : l’outil reste utilisable.
  await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new DOMException('annulé','AbortError');}}));
  await page.locator('[data-share-results="priorities"]').first().click();await modal.locator('[data-share-native]').click();
  assert.equal(await modal.locator('.is-error').count(),0);
  await page.evaluate(()=>Object.defineProperty(navigator,'share',{configurable:true,value:async()=>{throw new Error('refus');}}));
  await modal.locator('[data-share-native]').click();assert.match(await modal.locator('[data-share-status]').textContent(),/copier le lien/);
  await page.keyboard.press('Escape');const beforeBad=await store();
  await page.goto(url+'#partage=bad',{waitUntil:'domcontentloaded'});assert.equal(await modal.isVisible(),true);assert.equal(await store(),beforeBad);
  await page.keyboard.press('Escape');assert.equal(await page.locator('[data-reco-mode="guided"]').isVisible(),true);
  assert.deepEqual(errors,[]);
  process.stdout.write('Chromium partage : liens, fichiers, deux parcours, consultation sans écriture, adoption, sauvegardes, erreurs, mobile et clavier — OK\n');
 }finally{await context.close();}
};
