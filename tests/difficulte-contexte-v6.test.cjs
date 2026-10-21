'use strict';
/* Référence v6 (moteur 1.0.5) : la préférence de difficulté juge la charge PvE si le joueur n'a choisi
 * que des activités PvE, la charge PvP s'il n'a choisi que du PvP, sinon la moyenne des deux.
 * Aucun des 103 cas de la v5 ne change ; quatre scénarios s'ajoutent. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const E=require('../recommendation-engine.js');
const v5=require('./fixtures/moteur-reference-v5.json');
const v6=require('./fixtures/moteur-reference-v6.json');
const {compare}=require('../scripts/reference-v6.cjs');
const X=require('../result-explanations.js');

test('La photographie v5 reste intacte ; la v6 en dérive explicitement',()=>{
 const source=fs.readFileSync(path.join(__dirname,'fixtures/moteur-reference-v5.json'),'utf8').replace(/\r\n/g,'\n');
 const hash=crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex');
 assert.equal(hash,'9da76bbb5490cb450200ab199fcdb5b726aa8b4f');
 assert.equal(v5.info.engineVersion,'1.0.4-exploratoire');
 assert.equal(v6.info.revision,6);
 assert.equal(v6.info.previousReference,'moteur-reference-v5.json');
 assert.equal(v6.info.engineVersion,E.version);
});

test('v5 → v6 : aucun des 103 cas ne change ; quatre scénarios de difficulté s’ajoutent',()=>{
 const report=compare(v5,v6);
 assert.equal(report.cas,103);
 assert.equal(report.cas_modifies,0);
 assert.deepEqual(report.nouveaux_cas.map(c=>c.contexte),['pve','pvp','pve','pvp']);
});

test('Contexte de difficulté : PvE seul, PvP seul, ou moyenne',()=>{
 const ctx=a=>E.difficultyContext(E.sanitize({activities:a}));
 assert.equal(ctx({raid:3}),'pve');
 assert.equal(ctx({raid:3,solo:5}),'pve');
 assert.equal(ctx({bg:2}),'pvp');
 assert.equal(ctx({bg:2,world:4}),'pvp');
 assert.equal(ctx({raid:3,world:1}),'mixte');
 assert.equal(ctx({}),'mixte');
});

test('La charge retenue suit le contexte, pour les deux préférences',()=>{
 const givre=E.specs.find(s=>s.id==='mage-givre');   // PvE 2, PvP 4
 for(const value of ['simple','complex']){
  for(const [activities,load] of [[{raid:5},2],[{world:5},4],[{raid:5,world:5},3],[{},3]]){
   const p=E.sanitize({difficulty:{value,certainty:5},activities});
   assert.equal(E.difficultyLoad(givre,p),load,value+' '+JSON.stringify(activities));
   const r=E.ranking({...p,styles:{zone:5}}).results.find(x=>x.spec.id==='mage-givre');
   if(!r)continue;
   const raw=value==='simple'?(5-load)/4:(load-1)/4;
   assert.equal(r.fit.difficulty.value,E.preferenceFit(raw,5),value+' '+JSON.stringify(activities));
  }
 }
});

test('Retour de guilde : le Chasseur reste simple en PvE même pour un joueur qui cherche le confort',()=>{
 const bm=E.specs.find(s=>s.id==='chasseur-maitrise-betes');
 const pve=E.sanitize({difficulty:{value:'simple',certainty:5},activities:{solo:5}});
 const pvp=E.sanitize({difficulty:{value:'simple',certainty:5},activities:{world:5}});
 assert.ok(E.difficultyLoad(bm,pve)<E.difficultyLoad(bm,pvp));
 // L'explication affichée annonce le contexte retenu, avec la même règle que le moteur.
 for(const p of [pve,pvp,E.sanitize({difficulty:{value:'complex',certainty:3},activities:{raid:2,bg:2}})]){
  const ctx=E.difficultyContext(p),note=X.contextNotes({profile:p}).join(' ');
  assert.match(note,ctx==='pve'?/difficulté PvE/:ctx==='pvp'?/difficulté PvP/:/moyenne PvE et PvP/);
 }
 assert.ok(!X.contextNotes({profile:E.sanitize({activities:{raid:5}})}).join(' ').includes('difficulté'));
});
