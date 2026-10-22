'use strict';
/* Référence v10 (moteur 1.0.9, décision du 22 octobre 2026) : les classements listent les
 * spécialisations ; le top 3 du parcours guidé en garde au plus deux d'une même classe ; la technicité
 * du mode personnalisé suit les critères d'activité. Aucune note ni aucun coefficient ne change :
 * dans chaque cas de la v9, la première configuration de chaque classe, son score et l'ordre des
 * classes sont conservés, et la première piste ne change jamais. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const E=require('../recommendation-engine.js');
const v9=require('./fixtures/moteur-reference-v9.json'),v10=require('./fixtures/moteur-reference-v10.json');
const {compare,snapshot,NEW_CASES,TECH}=require('../scripts/reference-v10.cjs');

test('La photographie v9 reste intacte ; la v10 en dérive explicitement',()=>{
 const source=fs.readFileSync(path.join(__dirname,'fixtures/moteur-reference-v9.json'),'utf8').replace(/\r\n/g,'\n');
 assert.equal(crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex'),'4c01ee23db5b155ebec243179459f89c448502a6');
 assert.equal(v9.info.engineVersion,'1.0.8-exploratoire');
 assert.equal(v10.info.revision,10);
 assert.equal(v10.info.previousReference,'moteur-reference-v9.json');
 assert.equal(v10.info.engineVersion,E.version);
 assert.equal(E.version,'1.0.9-exploratoire');
});

test('v9 → v10 : ordre des classes et première piste conservés partout, top 3 plafonné à deux par classe',()=>{
 assert.deepEqual(snapshot(),v10,'le moteur reproduit exactement la v10');
 const report=compare(v9,v10);
 assert.equal(report.existingGuideCases,34);
 // 22 des 34 scénarios guidés voient une deuxième spécialisation d'une classe entrer dans le top 3.
 assert.equal(report.changedTop3,22);
 for(const c of report.changedTop){
  assert.equal(c.apres[0],c.avant[0],c.id+' : même première piste');
  const counts={};for(const id of c.apres){const k=id.split('-')[0];counts[k]=(counts[k]||0)+1;}
  assert.ok(Object.values(counts).every(n=>n<=2),c.id);
 }
 assert.equal(report.priorityCasesClassOrderKept,87);
 assert.deepEqual(report.newCases.map(c=>c.id),NEW_CASES.map(c=>c.id));
 assert.deepEqual(v10.specs,v9.specs);assert.deepEqual(v10.matrix,v9.matrix);assert.deepEqual(v10.petless,v9.petless);assert.deepEqual(v10.heal,v9.heal);
});

test('Technicité selon les critères d’activité : PvP, PvE, ou moyenne',()=>{
 assert.equal(v10.technicite.length,TECH.length);
 assert.deepEqual(v10.technicite.map(t=>t.context),['pvp','pvp','pve','pve','mixte']);
 // Finesse : difficulté 3 en PvE, 5 en PvP. Seule, la technicité la place en tête en PvP.
 const rank=(w,id)=>E.priorityRanking(w,2).results.findIndex(x=>x.spec.id===id);
 assert.equal(rank({tech:3,sauv:3,ctrl:2},'voleur-finesse'),0);
 assert.ok(rank({tech:3,solo:3},'voleur-finesse')>rank({tech:3,bg:3},'voleur-finesse'));
 // Sans critère d'activité, ou avec les deux, la moyenne de la v9 reste la règle.
 for(const s of E.specs)assert.equal(E.priorityExplain(s.id,{tech:3},2).axes[0].load,(s.load.pve+s.load.pvp)/2,s.id);
});
