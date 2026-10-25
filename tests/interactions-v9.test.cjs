'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),X=require('../result-explanations.js');
const v8=require('./fixtures/moteur-reference-v8.json'),v9=require('./fixtures/moteur-reference-v9.json');
const {compare}=require('../scripts/reference-v9.cjs');
const control={styles:{ctrl:5},range:{value:'distance',certainty:5},mastery:2};
test('La photographie v8 reste intacte',()=>{
 const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
 const source=fs.readFileSync(path.join(__dirname,'fixtures/moteur-reference-v8.json'),'utf8').replace(/\r\n/g,'\n');
 assert.equal(crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex'),'ff0b12929d820b9aabf4a7e7d51238f1cebe179e');
});
test('v9 : référence distincte, changements relus et limités, toutes les notes conservées',()=>{
 assert.equal(v8.info.engineVersion,'1.0.7-exploratoire');assert.equal(v9.info.engineVersion,'1.0.8-exploratoire');
 // Depuis la v10, la v9 est une photographie figée (empreinte vérifiée dans reference-v10.test.cjs) : on compare des fixtures.
 assert.equal(v9.info.previousReference,'moteur-reference-v8.json');
 const report=compare(v8,v9);assert.equal(report.changedScoresOrSpecs,2);assert.equal(report.changedFirstClasses,0);
 assert.deepEqual(report.changes.filter(c=>c.rows.length).map(c=>c.id),['heal-style-raid-hesitant','heal-style-dps-mixed']);
 assert.deepEqual(v9.specs,v8.specs);assert.deepEqual(v9.matrix,v8.matrix);assert.deepEqual(v9.petless,v8.petless);assert.deepEqual(v9.heal,v8.heal);
});
test('Préférence sans compagnon : choix d’un build entier, compromis explicite, aucun bonus de contrôle emprunté',()=>{
 const soft=E.explain('demoniste-affliction',{...control,pet:{value:'avoid',certainty:0}});
 const strict=E.explain('demoniste-affliction',{...control,pet:{value:'avoid',certainty:0,strict:true}});
 assert.equal(soft.spec.variant,undefined);assert.equal(soft.score,86.39);assert.equal(soft.spec.style.ctrl,5);
 assert.equal(soft.answers.find(a=>a.domain==='pet').raw,.05,'Le build avec démon ne reçoit pas les points du build sans démon');
 assert.equal(strict.spec.variant,'sans-familier');assert.equal(strict.score,80.56);assert.equal(strict.spec.style.ctrl,4);
 assert.match(X.petNotice(soft.spec,soft.profile),/avec son compagnon/);
 assert.match(X.petNotice(strict.spec,strict.profile),/sans démon.*ni Verrou magique/);
 assert.equal(E.explain('demoniste-affliction',{...control,pet:{value:'avoid',certainty:5}}).spec.variant,'sans-familier');
});
test('Refus strict : aucun build avec familier à aucune certitude ; aucun filtrage implicite en préférence souple',()=>{
 for(let certainty=0;certainty<=5;certainty++)for(let mastery=0;mastery<4;mastery++){
  const p={activities:{solo:5},styles:{ctrl:5},pet:{value:'avoid',certainty,strict:true},mastery};
  const r=E.ranking(p);assert.ok(r.results.every(x=>x.spec.pet==='none'||x.spec.variant==='sans-familier'));
  assert.equal(E.explain('chasseur-maitrise-betes',p),null);
  const soft=E.ranking({...p,pet:{...p.pet,strict:false}});assert.equal(soft.compatible,28);
 }
});
test('Augmenter l’envie de jouer sans familier ne fait pas revenir au build avec compagnon',()=>{
 for(const id of ['chasseur-survie','demoniste-affliction','demoniste-destruction'])for(let mastery=0;mastery<4;mastery++){
  let without=false;
  for(let certainty=0;certainty<=5;certainty++){
   const t=E.explain(id,{activities:{solo:3,world:4},styles:{ctrl:5},pet:{value:'avoid',certainty},mastery});
   if(without)assert.equal(t.spec.variant,'sans-familier',id+'/'+certainty);
   without=t.spec.variant==='sans-familier';
   const expected=without?E.petless[id]:E.specs.find(s=>s.id===id);assert.deepEqual(t.spec,expected,'Un seul build, jamais un mélange');
  }
 }
});
test('Précision : Loup solitaire quel que soit le souhait ; aucune affinité empruntée au build avec compagnon',()=>{
 for(const value of ['any','like','avoid']){
  const t=E.explain('chasseur-precision',{styles:{burst:5},range:{value:'distance',certainty:5},pet:{value,certainty:5},mastery:2});
  assert.equal(t.spec.variant,'sans-familier');assert.deepEqual(t.spec.style,E.petless['chasseur-precision'].style);
  if(value!=='any')assert.equal(t.answers.find(a=>a.domain==='pet').raw,value==='like'?.1:1);
  assert.match(X.petNotice(t.spec,t.profile),/Loup solitaire/);
 }
 const kb=require('../connaissances/classes/chasseur.json').specialisations.find(s=>s.id==='chasseur-precision');
 assert.equal(kb.profil.variante_reference,E.referenceVariants[kb.id]);
 const custom=E.priorityRanking({burst:3},2).results.find(r=>r.classId==='chasseur');
 assert.equal(custom.spec.id,'chasseur-precision');assert.equal(custom.spec.variant,'sans-familier');
});
test('Soin : même dénominateur, zéro aptitude hors rôle, certitude conservée et jamais de veto implicite',()=>{
 for(const certainty of [0,2,5]){
  const p={roles:{soin:3,dps:3},healStyles:{prevention:certainty},mastery:2},r=E.ranking(p);
  assert.equal(r.compatible,28);assert.equal(r.results.length,28,'depuis la v10, une ligne par configuration');assert.equal(new Set(r.results.map(x=>x.spec.classId)).size,9);
  const sums=r.results.map(r=>Object.values(r.fit).reduce((n,a)=>n+a.weight,0));assert.equal(new Set(sums).size,1);
  const trace=E.explain('mage-givre',p),a=trace.answers.find(a=>a.domain==='healStyles');
  assert.equal(a.raw,0);assert.equal(a.note,undefined);assert.equal(a.fit,E.preferenceFit(0,certainty));
  assert.match(X.answerText(a,p),/ne soigne pas/);
 }
});
test('Ajouter une façon de soigner ne peut plus faire passer un non-soigneur devant un soigneur auparavant mieux classé',()=>{
 const bases=[{roles:{soin:1},activities:{bg:4,solo:1},range:{value:'melee',certainty:2},styles:{zone:0,surv:5,support:2},difficulty:{value:'simple',certainty:2},mastery:1},
  {roles:{soin:4,dps:3},activities:{raid:3},mastery:0}];
 for(const p of bases)for(const key of E.healStyles)for(const certainty of [0,2,5]){
  const before=E.specs.map(s=>E.explain(s.id,p)),after=new Map(E.specs.map(s=>[s.id,E.explain(s.id,{...p,healStyles:{[key]:certainty}})]));
  for(const h of before.filter(t=>t.spec.heal))for(const n of before.filter(t=>!t.spec.heal))if(h.rawScore>=n.rawScore)
   assert.ok(after.get(h.spec.id).rawScore>=after.get(n.spec.id).rawScore-1e-8,h.spec.id+'/'+n.spec.id);
 }
 const p={...bases[0],healStyles:{prevention:0}},leader=E.ranking(p).results[0];
 assert.equal(leader.spec.id,'paladin-sacre');assert.equal(leader.score,56.6); // v14 : rôle Soin évalué dans BG + solo, plus en raid.
});
