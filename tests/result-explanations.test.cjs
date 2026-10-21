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

test('Les égalités des soigneurs incluent la quatrième classe au-delà des trois cartes',()=>{
 const r=E.recommend({roles:{soin:5},rolesStrict:true,mastery:2});
 assert.equal(r.results.length,4);
 const note=X.tieNote(r.results);
 for(const row of r.results)assert.ok(note.includes(row.spec.className));
 assert.ok(X.ranks(r.results).every(p=>p.tied&&p.rank===1));
 assert.match(X.contextNotes({profile:r.profile}).join(' '),/styles de soin/);
});

test('Familier : la limite dépend du profil demandé et de la configuration, sans modifier les scores',()=>{
 const p=E.sanitize({styles:{ctrl:5},pet:{value:'avoid',strict:true,certainty:5}});
 const before=JSON.stringify(E.recommend(p));
 const aff=E.specs.find(s=>s.id==='demoniste-affliction');
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
