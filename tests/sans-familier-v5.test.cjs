'use strict';
/* Référence v5 (moteur 1.0.4) : quand le joueur préfère jouer sans compagnon, une configuration à
 * familier facultatif est évaluée avec les notes de son build sans familier. Seuls les profils
 * guidés qui évitent les familiers peuvent changer, et seulement pour le Chasseur et le Démoniste. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const E=require('../recommendation-engine.js');
const v4=require('./fixtures/moteur-reference-v4.json');
const v5=require('./fixtures/moteur-reference-v5.json');
const {compare}=require('../scripts/reference-v5.cjs');
const spec=id=>E.specs.find(s=>s.id===id);
const avoid={value:'avoid',certainty:5,strict:true};

test('La photographie v4 reste intacte ; la v5 en dérive explicitement',()=>{
 const source=fs.readFileSync(path.join(__dirname,'fixtures/moteur-reference-v4.json'),'utf8').replace(/\r\n/g,'\n');
 const hash=crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex');
 assert.equal(hash,'1bc2fc6e702fbdb719c4ad94b659147c2aaa3bce');
 assert.equal(v4.info.engineVersion,'1.0.3-exploratoire');
 assert.equal(v5.info.revision,5);
 assert.equal(v5.info.previousReference,'moteur-reference-v4.json');
 assert.equal(v5.info.engineVersion,'1.0.4-exploratoire');
});

test('v4 → v5 : un seul scénario change, celui qui évite les familiers ; priorités identiques',()=>{
 const report=compare(v4,v5);
 assert.equal(report.cas,99);
 assert.equal(report.cas_modifies,1);
 assert.equal(report.resultats[0].id,'solo-no-mandatory-pet');
 assert.equal(report.nouveaux_cas.length,4);
});

test('Notes sans familier : seules celles qui dépendent du familier changent',()=>{
 assert.deepEqual(Object.keys(E.petless).sort(),E.specs.filter(s=>s.pet==='optional').map(s=>s.id).sort());
 assert.deepEqual(v5.petless,{
  'chasseur-precision':{},
  'chasseur-survie':{solo:[5,4]},
  'demoniste-affliction':{world:[5,4],solo:[4,3],ctrl:[5,4]},
  'demoniste-destruction':{world:[5,4],solo:[4,3],ctrl:[4,3]}
 });
 for(const [id,v] of Object.entries(E.petless)){
  const base=spec(id);
  assert.equal(v.variant,'sans-familier');
  for(const k of ['id','classId','label','role','range','pet','load','source'])assert.deepEqual(v[k],base[k],id+'/'+k);
 }
 assert.deepEqual(E.checkData(),[]);
});

test('La variante ne s’applique que si le joueur préfère jouer sans compagnon',()=>{
 for(const pet of [undefined,{value:'like',certainty:5},{value:'any'}]){
  const r=E.ranking({styles:{ctrl:5},pet});
  assert.ok(r.results.every(x=>!x.spec.variant),JSON.stringify(pet));
 }
 const r=E.ranking({styles:{ctrl:5},pet:avoid});
 const aff=r.results.find(x=>x.spec.classId==='demoniste');
 assert.equal(aff.spec.id,'demoniste-affliction');
 assert.equal(aff.spec.variant,'sans-familier');
 assert.equal(aff.spec.style.ctrl,4);
 assert.equal(aff.fit.pet.value,1,'La variante répond pleinement au souhait');
 // Un familier central n'a pas de variante : la pénalité d'une préférence souple est inchangée.
 const soft=E.ranking({activities:{solo:5},pet:{value:'avoid',certainty:1}});
 const demo=soft.results.find(x=>x.spec.id==='demoniste-demonologie');
 assert.ok(demo,'Démonologie représente le Démoniste en solo');
 assert.equal(demo.spec.variant,undefined);
 assert.equal(demo.fit.pet.value,E.preferenceFit(.05,1));
 assert.equal(E.petless['chasseur-maitrise-betes'],undefined);
});

test('Retour de guilde : sans familier, le Démoniste ne profite plus des contrôles de son démon',()=>{
 for(const mastery of [0,1,2,3]){
  const r=E.recommend({styles:{ctrl:5},range:{value:'distance',certainty:5},pet:avoid,mastery});
  assert.equal(r.results[0].spec.id,'mage-givre','maîtrise '+mastery);
  const w=r.results.find(x=>x.spec.classId==='demoniste');
  assert.ok(w.score<r.results[0].score,'maîtrise '+mastery);
  assert.equal(w.spec.variant,'sans-familier');
 }
});
