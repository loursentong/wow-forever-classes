'use strict';
/* Moteur 1.3.0, référence v13 (décision du responsable du projet, 23 octobre 2026) : sur chaque critère que
 * portent les spécialisations, la note d'une classe est celle de sa meilleure spécialisation, comme l'annonce le
 * tableau (« chaque classe est notée sur sa meilleure spé »). Polyvalence, Technicité et les rôles qu'aucune
 * spécialisation ne tient restent des notes de classe. 27 notes changent ; la référence de rôle du moteur suit
 * (Druide DPS 3→4). Aucune note de configuration ne change. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../recommendation-engine.js');
const S=require('../notes-specialisations.js');
const v12=require('./fixtures/moteur-reference-v12.json');
const v13=require('./fixtures/moteur-reference-v13.json');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const D=JSON.parse(html.match(/window\.__WF = (\{.*?\});\s*<\/script>/s)[1]);
// [classe, critère, note v12, note v13], dans l'ordre des classes et des critères du tableau.
const CHANGES=[
 ['guerrier','sauv',2,3],['guerrier','burst',4,5],['guerrier','surv',3,5],
 ['chasseur','burst',4,5],['chasseur','ctrl',3,4],['chasseur','util',3,2],
 ['voleur','bg',3,4],['voleur','zone',2,3],['voleur','surv',2,3],['voleur','mob',4,5],['voleur','util',2,1],
 ['pretre','surv',3,4],['pretre','util',4,5],
 ['chaman','bg',4,5],['chaman','ctrl',2,3],['chaman','surv',3,4],
 ['mage','bg',4,5],['mage','sauv',3,5],['mage','surv',2,3],
 ['demoniste','surv',4,5],['demoniste','solo',4,5],
 ['druide','dps',3,4],['druide','bg',4,5],['druide','burst',4,5],['druide','ctrl',2,3],['druide','surv',4,5],['druide','solo',3,4]
];
const best=(classId,k)=>{const v=S.specsOf(classId).map(s=>S.value(s,k)).filter(x=>x.v);return v.length?Math.max(...v.map(x=>x.v)):null;};

test('Règle v13 : sur chaque critère porté par les spécialisations, la classe vaut sa meilleure spé',()=>{
 const own=[];let checked=0;
 for(const c of D.classes)for(const k of D.axes){
  const b=best(c.id,k);
  if(b===null){own.push(c.id+'/'+k);continue;}
  checked++;assert.equal(c.r[k],b,c.id+'/'+k+' : note de classe = meilleure spé');
 }
 assert.equal(checked,97);
 // Restent des notes de classe : Polyvalence et Technicité (9 + 9) et les 11 rôles qu'aucune spé ne tient.
 assert.equal(own.length,29);
 assert.deepEqual(own.filter(x=>!/\/(poly|tech)$/.test(x)),['guerrier/soin','chasseur/tank','chasseur/soin','voleur/tank','voleur/soin',
  'pretre/tank','chaman/tank','mage/tank','mage/soin','demoniste/tank','demoniste/soin']);
});

test('v12 → v13 : exactement les 27 notes qui différaient de leur meilleure spé',()=>{
 const diff=[];
 // La transition historique est comparée à sa photographie, le tableau actif reste contrôlé ci-dessous.
 for(const c of v12.matrix.classes){const now=v13.matrix.classes.find(x=>x.id===c.id).r;for(const k of v13.matrix.axes)if(now[k]!==c.r[k])diff.push([c.id,k,c.r[k],now[k]]);}
 assert.deepEqual(diff,CHANGES);
 assert.equal(CHANGES.filter(x=>x[3]>x[2]).length,25,'25 notes montent');
 assert.deepEqual(CHANGES.filter(x=>x[3]<x[2]).map(x=>x[0]+'/'+x[1]),['chasseur/util','voleur/util'],'2 baissent');
 // Le tableau affiché porte les mêmes notes que window.__WF, couleur comprise.
 const rows=[...html.match(/<table class="matrix">[\s\S]*?<\/table>/)[0].matchAll(/<tr><th scope="row" class="sticky"><a href="#c-([a-z]+)">[\s\S]*?<\/tr>/g)];
 assert.equal(rows.length,9);
 for(const [i,m] of rows.entries()){
  const cells=[...m[0].matchAll(/class="cell (?:q(\d)|tech)" data-c="\d" data-k="([a-z]+)" data-v="(\d)"><b>(\d)<\/b>/g)];
  assert.equal(cells.length,14,m[1]);
  for(const [,q,k,v,b] of cells)assert.ok((q===undefined||q===v)&&v===b&&Number(v)===D.classes[i].r[k],m[1]+'/'+k+' : '+[q,v,b]);
 }
});

test('La référence de rôle du moteur suit les notes de classe : Druide DPS 3 → 4, moteur 1.3.0',()=>{
 // La version active est vérifiée par le contrat ; cette décision historique porte sur les notes de classe.
 for(const c of D.classes)for(const r of E.roles)assert.equal(E.roleReference[c.id][r],c.r[r],c.id+'/'+r);
 assert.equal(v13.matrix.classes.find(c=>c.id==='druide').r.dps,4);
 assert.deepEqual(v13.specs,v12.specs,'aucune note de configuration ne change en v13');
});

test('Textes : la note sous le tableau et les justifications de Burst et de Zone suivent la règle',()=>{
 assert.match(html,/<p class="note spec-note">Les lignes de spé reprennent les notes du moteur de recommandation[^<]*; la ligne de la classe reprend la meilleure d'entre elles/);
 assert.doesNotMatch(html,/les deux peuvent s'écarter/);
 const why=html.match(/<details class="crit-why">[\s\S]*?<\/details>/)[0];
 const names=Object.fromEntries(D.classes.map(c=>[c.name,c.id]));
 const rows=[...why.matchAll(/<tr><th scope="row"><span class="sw"[^>]*><\/span> ([^<]+)<\/th><td class="mono num">(\d)<\/td><td class="mono num">(\d)<\/td>/g)];
 assert.equal(rows.length,9);
 for(const [,name,burst,zone] of rows){const r=D.classes.find(c=>c.id===names[name]).r;assert.deepEqual([Number(burst),Number(zone)],[r.burst,r.zone],name);}
});
