'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../recommendation-engine.js');
const v1=require('./fixtures/moteur-reference-v1.json');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const D=JSON.parse(html.match(/window\.__WF = (\{.*?\});\s*\(function\(\)/s)[1]);

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
 assert.deepEqual(D.classes.map(c=>({id:c.id,r:c.r})),matrix);
 const specs=structuredClone(v1.specs);
 specs.find(s=>s.id==='pretre-discipline').style.ctrl=3;
 assert.deepEqual(E.specs,specs);
 for(const c of matrix)for(const role of E.roles)assert.equal(E.roleReference[c.id][role],c.r[role]);
});

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
 const v3=require('./fixtures/moteur-reference-v3.json');
 for(const role of ['tank','dps']){
  const rows=E.priorityRanking({[role]:3},2).results.map(r=>[r.classId,r.spec.id,r.score]);
  const expected=v1.isolatedRoles.find(x=>x.mastery===2).axes.find(x=>x.axis===role).results;
  assert.deepEqual(rows.map(r=>[r[0],r[2]]),expected.map(r=>[r[0],r[2]]));
  assert.deepEqual(rows,v3.isolatedRoles.find(x=>x.mastery===2).axes.find(x=>x.axis===role).results);
 }
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
