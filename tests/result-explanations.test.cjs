'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js');
const X=require('../result-explanations.js');

test('Égalités : rang partagé exact, sans transformer un arrondi commun en égalité',()=>{
 const rows=[100,100,99.9,85,85].map((score,i)=>({score,className:'Classe '+i}));
 const before=JSON.stringify(rows),positions=X.ranks(rows);
 assert.deepEqual(positions.map(p=>p.rank),[1,1,3,4,4]);
 assert.deepEqual(positions.map(p=>p.tied),[true,true,false,true,true]);
 assert.equal(positions[2].close,true);
 assert.equal(positions[2].leader,false);
 assert.equal(JSON.stringify(rows),before);
 assert.equal(X.tieNote([]),'');
 assert.equal(X.tieNote(rows.slice(2,3)),'');
});

test('Repères de rang explicites : égalité nommée, écart chiffré avec la classe juste au-dessus',()=>{
 const rows=[['Démoniste',100],['Paladin',100],['Druide',95],['Prêtre',95],['Chaman',94.62],['Mage',89.2],['Guerrier',88.4],['Chasseur',82],['Voleur',80],['Rogue',70]]
  .map(([className,score])=>({className,score}));
 const hints=rows.map((r,i)=>X.rankHint(rows,i));
 assert.deepEqual(hints,['à égalité avec le Paladin','à égalité avec le Démoniste','à égalité avec le Prêtre','à égalité avec le Druide',
  '0,4 point derrière le Druide et le Prêtre','','0,8 point derrière le Mage','','2 points derrière le Chasseur','']);
 const four=[100,100,100,100,99.98].map((score,i)=>({className:'C'+i,score}));
 assert.equal(X.rankHint(four,0),'à égalité avec 3 autres classes');
 assert.equal(X.rankHint(four,4),'moins de 0,1 point derrière les 4 classes à égalité au-dessus');
 assert.equal(X.rankHint([],0),'');
});

test('Les égalités des soigneurs incluent la quatrième classe au-delà des trois cartes',()=>{
 const r=E.recommend({roles:{soin:5},rolesStrict:true,mastery:2});
 assert.equal(r.results.length,4);
 const note=X.tieNote(r.results);
 for(const row of r.results)assert.ok(note.includes(row.spec.className));
 assert.ok(X.ranks(r.results).every(p=>p.tied&&p.rank===1));
 // Sans façon de soigner précisée, l'explication invite à la préciser (référence v8).
 assert.match(X.contextNotes({profile:r.profile}).join(' '),/préciser ta façon de soigner/);
});

test('Familier : la limite dépend du profil demandé et de la configuration, sans modifier les scores',()=>{
 const p=E.sanitize({styles:{ctrl:5},pet:{value:'avoid',strict:true,certainty:5}});
 const before=JSON.stringify(E.recommend(p));
 const aff=E.petless['demoniste-affliction'];
 const mage=E.specs.find(s=>s.id==='mage-givre');
 const bm=E.specs.find(s=>s.id==='chasseur-maitrise-betes');
 assert.match(X.petNotice(aff,p),/Évaluée sans démon/);
 assert.match(X.petNotice(aff,p),/Séduction ni Verrou magique/);
 assert.match(X.petNotice(E.specs.find(s=>s.id==='chasseur-precision'),p),/Loup solitaire/);
 // Le texte décrit la variante réellement évaluée par le moteur pour ce profil.
 const warlock=E.recommend(p).results.find(r=>r.spec.classId==='demoniste');
 assert.equal(warlock.spec.variant,'sans-familier');
 assert.match(X.petNotice(warlock.spec,p),/Évaluée sans démon/);
 assert.equal(X.petNotice(mage,p),'');
 assert.equal(X.petNotice(aff,E.sanitize(null)),'');
 assert.match(X.petNotice(bm,E.sanitize({pet:{value:'avoid'}})),/familier est central/);
 assert.equal(JSON.stringify(E.recommend(p)),before);
});

test('Pourquoi cette piste : la part de chaque critère fait exactement le score affiché',()=>{
 const profiles=[{roles:{soin:4},activities:{raid:4},styles:{support:2},healStyles:{groupe:4}},
  {roles:{dps:5},range:{value:'distance',certainty:2},pet:{value:'avoid',certainty:5},difficulty:{value:'simple',certainty:3},activities:{bg:3,world:1}},
  {styles:{ctrl:0,zone:5,burst:3}}];
 for(const profile of profiles)for(const t of E.recommend(profile).top){
  const parts=X.scoreParts(t.fit,t.score);
  assert.deepEqual(parts.map(p=>p.key),['roles','healStyles','activities','range','styles','pet','difficulty'].filter(k=>k in t.fit));
  assert.equal(parts.reduce((s,p)=>s+p.points,0),Math.round(t.score),t.spec.id);
  assert.equal(parts.reduce((s,p)=>s+p.max,0),100,t.spec.id);
  for(const p of parts)assert.ok(p.points<=p.max&&p.fit>=0&&p.fit<=100&&p.label,t.spec.id+'/'+p.key);
 }
 assert.deepEqual(X.scoreParts({},0),[]);
});
