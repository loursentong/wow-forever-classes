'use strict';
/* Référence v4 (moteur 1.0.3) : l'activité solo du Chasseur n'échappe à l'effet de la maîtrise
 * que pour Maîtrise des bêtes, où le familier est central. Précision et Survie suivent la règle
 * générale ; les autres classes ne changent pas. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const E=require('../recommendation-engine.js');
const v3=require('./fixtures/moteur-reference-v3.json');
const v4=require('./fixtures/moteur-reference-v4.json');
const {compare}=require('../scripts/reference-v4.cjs');
const spec=id=>E.specs.find(s=>s.id===id);

test('La photographie v3 reste intacte ; la v4 en dérive explicitement',()=>{
 const source=fs.readFileSync(path.join(__dirname,'fixtures/moteur-reference-v3.json'),'utf8').replace(/\r\n/g,'\n');
 const hash=crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex');
 assert.equal(hash,'011919e1777828fbe667bd9c7434a7b9cb36432a');
 assert.equal(v4.info.revision,4);
 assert.equal(v4.info.previousReference,'moteur-reference-v3.json');
 assert.equal(v4.info.engineVersion,E.version);
});

test('v3 → v4 : seul le Chasseur change, en solo, en Débutant ou Intermédiaire, et seulement à la baisse',()=>{
 const report=compare(v3,v4);
 assert.equal(report.cas,99);
 assert.equal(report.cas_modifies,5);
 for(const c of report.resultats){
  assert.ok(c.maitrise<=1,c.id);
  assert.ok(c.chasseur.apres.score<c.chasseur.avant.score,c.id);
 }
});

test('Solo : seule Maîtrise des bêtes échappe à la maîtrise ; Précision et Survie suivent la règle générale',()=>{
 const factor=[-0.29,-0.13,0,0.09];
 for(const m of [0,1,2,3]){
  assert.equal(E.adjustedActivity(spec('chasseur-maitrise-betes'),'solo',m),5);
  for(const s of E.specs.filter(x=>x.id!=='chasseur-maitrise-betes')){
   const delta=Math.min(.35,Math.max(-1.2,factor[m]*s.load.pve));
   assert.equal(E.adjustedActivity(s,'solo',m),Math.min(5,Math.max(1,s.activity.solo+delta)),s.id+'/'+m);
  }
 }
 assert.equal(E.adjustedActivity(spec('chasseur-precision'),'solo',0).toFixed(2),'4.42');
 assert.equal(E.adjustedActivity(spec('chasseur-survie'),'solo',0).toFixed(2),'3.84');
});

test('Un débutant qui cherche du solo voit Maîtrise des bêtes en première piste',()=>{
 for(const m of [0,1]){
  const top=E.recommend({activities:{solo:5},mastery:m}).top[0];
  assert.equal(top.spec.id,'chasseur-maitrise-betes');
  assert.equal(top.score,100);
 }
 // Confirmé : les trois spécialisations sont à 100 ; la règle d'égalité (potentiel) retient Survie.
 assert.equal(E.recommend({activities:{solo:5},mastery:2}).top[0].spec.id,'chasseur-survie');
});
