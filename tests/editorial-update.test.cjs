'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../recommendation-engine.js');
const v1=require('./fixtures/moteur-reference-v1.json');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const D=JSON.parse(html.match(/window\.__WF = (\{.*?\});\s*<\/script>/s)[1]);

test('La photographie v1 et les notes d’origine restent intactes',()=>{
 const crypto=require('node:crypto');
 const source=fs.readFileSync(path.join(__dirname,'fixtures/moteur-reference-v1.json'),'utf8').replace(/\r\n/g,'\n');
 const hash=crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex');
 assert.equal(hash,'efe65a1df9dfd7b09d8aaf4c660037f8492d9ad4');
 assert.deepEqual(require('./reference-notes.json'),Object.fromEntries(v1.matrix.classes.map(c=>[c.id,c.r])));
 const v2=require('./fixtures/moteur-reference-v2.json');
 assert.equal(v2.info.revision,2);
 assert.deepEqual(v2.matrix.axes,v1.matrix.axes);
 assert.deepEqual(v2.matrix.presets,v1.matrix.presets);
 assert.deepEqual(v2.guide.map(g=>[g.id,g.profile]),v1.guide.map(g=>[g.id,g.profile]));
});

test('Révision éditoriale : seules les trois notes approuvées changent',()=>{
 const matrix=structuredClone(v1.matrix.classes);
 for(const id of ['chaman','paladin'])matrix.find(c=>c.id===id).r.soin=5;
 // Depuis la v13, la matrice affichée reprend la meilleure spé de chaque classe (classes-meilleure-spe-v13.test.cjs) :
 // la révision v2 se vérifie sur la dernière photographie qui la porte seule, la v12.
 assert.deepEqual(require('./fixtures/moteur-reference-v12.json').matrix.classes,matrix);
 assert.equal(D.classes.length,matrix.length);
 const specs=structuredClone(v1.specs);
 specs.find(s=>s.id==='pretre-discipline').style.ctrl=3;
 // La révision v2 est vérifiée sur sa photographie ; les révisions suivantes ont leurs propres tests (v7 : notes raid).
 assert.deepEqual(require('./fixtures/moteur-reference-v2.json').specs,specs);
 // La référence de rôle suit la matrice active : vérifié par codex-contract.test.cjs et classes-meilleure-spe-v13.test.cjs.
 for(const c of D.classes)for(const role of E.roles)assert.equal(E.roleReference[c.id][role],c.r[role]);
});

const firstOfEachClass=rows=>rows.filter((r,i)=>rows.findIndex(q=>(q.classId||q.spec.classId)===(r.classId||r.spec.classId))===i);
test('Soin seul : Paladin et Chaman à 100 au niveau Confirmé, seuls leurs soigneurs en bénéficient',()=>{
 const result=E.priorityRanking({soin:3},2);
 for(const id of ['paladin','chaman']){
  const row=result.results.find(r=>r.classId===id);
  assert.equal(row.score,100);
  assert.equal(row.spec.role,'soin');
  const guide=E.ranking({roles:{soin:5},activities:{raid:5},mastery:2}).results.find(r=>r.spec.classId===id);
  assert.equal(guide.score,100);
 }
 // Tank et DPS : classes et scores identiques à la v1. Depuis la v3, la configuration
 // affichée à score égal suit le plus haut potentiel ; les lignes complètes suivent la v3.
 // Vérifié sur la photographie v3. Le moteur actuel garde les classes et scores du classement Tank
 // (seule la configuration affichée d'une classe sans tank, à 0, peut suivre le potentiel) ; les DPS suivent la v7.
 const v3=require('./fixtures/moteur-reference-v3.json');
 for(const role of ['tank','dps']){
  const rows=v3.isolatedRoles.find(x=>x.mastery===2).axes.find(x=>x.axis===role).results;
  const expected=v1.isolatedRoles.find(x=>x.mastery===2).axes.find(x=>x.axis===role).results;
  assert.deepEqual(rows.map(r=>[r[0],r[2]]),expected.map(r=>[r[0],r[2]]));
 }
 // Depuis la v10, chaque configuration est classée : la première de chaque classe suit la v3.
 assert.deepEqual(firstOfEachClass(E.priorityRanking({tank:3},2).results).map(r=>[r.classId,r.score]),
  v3.isolatedRoles.find(x=>x.mastery===2).axes.find(x=>x.axis==='tank').results.map(r=>[r[0],r[2]]));
});

test('Discipline : protection et soutien inchangés, contrôle infligé au même palier que Sacré',()=>{
 const disc=E.specs.find(s=>s.id==='pretre-discipline');
 const holy=E.specs.find(s=>s.id==='pretre-sacre');
 assert.equal(disc.style.ctrl,holy.style.ctrl);
 assert.equal(disc.style.ctrl,3);
 assert.equal(disc.style.surv,4);
 assert.equal(disc.style.support,5);
 const row=E.ranking({roles:{soin:5},rolesStrict:true,styles:{ctrl:5},mastery:2}).results.find(r=>r.spec.classId==='pretre');
 assert.equal(row.score,77.78);
});
