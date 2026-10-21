'use strict';
// Référence v5 : variantes sans familier. Quand le joueur préfère jouer sans compagnon, une
// configuration à familier facultatif est évaluée avec les notes de son build sans familier
// et répond pleinement à ce souhait (le compromis passe dans ses notes) :
//  - Affliction : contrôle 5→4, PvP sauvage 5→4, solo 4→3 ;
//  - Destruction : contrôle 4→3, PvP sauvage 5→4, solo 4→3 ;
//  - Survie : solo 5→4 ;
//  - Précision : aucune note, déjà évaluée en « Loup solitaire ».
// Seuls les profils guidés qui évitent les familiers peuvent changer, et seulement pour le
// Chasseur et le Démoniste ; les priorités, sans préférence de familier, restent identiques.
// La v5 ajoute quatre scénarios guidés sans familier.
// Usage : node scripts/reference-v5.cjs [rapport.json]
// Depuis le moteur 1.0.5, la comparaison porte sur la photographie v5 figée (le moteur actuel suit
// la v6, voir scripts/reference-v6.cjs) ; aucune photographie n'est écrite.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const E=require('../recommendation-engine.js');
const v4=require('../tests/fixtures/moteur-reference-v4.json');

const DECISION='Quand le joueur préfère jouer sans compagnon, les configurations à familier facultatif sont évaluées '+
 'avec les notes de leur build sans familier, établies dans la base de connaissances, et répondent pleinement à ce souhait '+
 '(décision du responsable du projet, 21 octobre 2026). Les autres notes, les formules et les priorités sont inchangées.';
const AFFECTED=['chasseur','demoniste'];
const NEW_CASES=[
 {id:'pet-avoid-control-ranged-beginner',profile:{styles:{ctrl:5},range:{value:'distance',certainty:5},pet:{value:'avoid',certainty:5,strict:true},mastery:0}},
 {id:'pet-avoid-control-ranged',profile:{styles:{ctrl:5},range:{value:'distance',certainty:5},pet:{value:'avoid',certainty:5,strict:true}}},
 {id:'pet-avoid-solo',profile:{activities:{solo:5},pet:{value:'avoid',certainty:5}}},
 {id:'pet-avoid-ranged-world',profile:{roles:{dps:5},range:{value:'distance',certainty:4},activities:{world:5},pet:{value:'avoid',certainty:4}}}
];
function compact(results){return results.map(x=>[x.spec.classId,x.spec.id,x.score]);}
function guide(profile){
 const r=E.recommend(profile);
 return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r.results),uncertain:r.uncertain,
  scenarios:r.scenarios.map(x=>[x.name,x.status,x.top]),
  sansFamilier:r.results.filter(x=>x.spec.variant==='sans-familier').map(x=>x.spec.id)};
}
// Notes qui diffèrent de la configuration de base, pour chaque variante sans familier.
function petlessNotes(){
 const out={};
 for(const id of Object.keys(E.petless).sort()){
  const base=E.specs.find(s=>s.id===id),v=E.petless[id],diff={};
  for(const part of ['activity','style'])for(const k of Object.keys(base[part]))
   if(v[part][k]!==base[part][k])diff[k]=[base[part][k],v[part][k]];
  out[id]=diff;
 }
 return out;
}
function snapshot(){
 const next=structuredClone(v4);
 next.info={...v4.info,engineVersion:E.version,revision:5,previousReference:'moteur-reference-v4.json',decision:DECISION};
 next.specs=E.specs;
 next.petless=petlessNotes();
 next.guide=v4.guide.map(ex=>({...ex,...guide(ex.profile)}))
  .concat(NEW_CASES.map(c=>({id:c.id,profile:c.profile,...guide(c.profile)})));
 for(const ex of next.priorities)for(const level of ex.levels)level.results=compact(E.priorityRanking(v4.matrix.presets[ex.id],level.mastery).results);
 for(const level of next.isolatedRoles)for(const ex of level.axes)ex.results=compact(E.priorityRanking({[ex.axis]:3},level.mastery).results);
 for(const ex of next.mixed)for(const level of ex.levels)level.results=compact(E.priorityRanking(ex.weights,level.mastery).results);
 return next;
}
const avoidsPets=p=>E.sanitize(p).pet.value==='avoid';
const others=rows=>rows.filter(r=>!AFFECTED.includes(r[0]));
function compare(before,after){
 assert.deepEqual(after.matrix,before.matrix,'Notes historiques inchangées');
 assert.deepEqual(after.specs,before.specs,'Notes des 28 configurations inchangées');
 assert.deepEqual(after.priorities,before.priorities,'Priorités inchangées');
 assert.deepEqual(after.isolatedRoles,before.isolatedRoles,'Rôles isolés inchangés');
 assert.deepEqual(after.mixed,before.mixed,'Pondérations croisées inchangées');
 assert.deepEqual(Object.keys(after.petless).sort(),E.specs.filter(s=>s.pet==='optional').map(s=>s.id).sort(),'Une variante par familier facultatif');
 const cases=[];
 before.guide.forEach((a,i)=>{
  const b=after.guide[i];
  assert.equal(b.id,a.id);
  for(const k of ['profile','status','compatible','used','uncertain'])assert.deepEqual(b[k],a[k],a.id+'/'+k);
  const changed=JSON.stringify(b.results)!==JSON.stringify(a.results)||JSON.stringify(b.scenarios)!==JSON.stringify(a.scenarios);
  if(changed){
   assert.ok(avoidsPets(a.profile),'Écart hors préférence sans familier : '+a.id);
   assert.deepEqual(others(b.results).map(r=>r.slice(1)),others(a.results).map(r=>r.slice(1)),
    'Autres classes inchangées (configuration, score, ordre) : '+a.id);
  }
  cases.push({id:a.id,modifie:changed,avant:a.results.slice(0,3),apres:b.results.slice(0,3),sans_familier:b.sansFamilier});
 });
 const added=after.guide.slice(before.guide.length);
 assert.deepEqual(added.map(c=>c.id),NEW_CASES.map(c=>c.id),'Nouveaux scénarios sans familier');
 // Les 99 cas de la v4 : 12 scénarios guidés et 87 classements de priorités, ces derniers identiques.
 const fixed=before.priorities.reduce((n,x)=>n+x.levels.length,0)+before.isolatedRoles.reduce((n,x)=>n+x.axes.length,0)+
  before.mixed.reduce((n,x)=>n+x.levels.length,0);
 return {version:E.version,reference:'v4 → v5',cas:cases.length+fixed,cas_modifies:cases.filter(c=>c.modifie).length,
  nouveaux_cas:added.map(c=>({id:c.id,premiers:c.results.slice(0,3),sans_familier:c.sansFamilier})),
  regle:DECISION,variantes:after.petless,resultats:cases.filter(c=>c.modifie)};
}
if(require.main===module){
 const args=process.argv.slice(2);
 const report=compare(v4,require('../tests/fixtures/moteur-reference-v5.json'));
 if(args[0])fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({version:report.version,cas:report.cas,cas_modifies:report.cas_modifies,nouveaux:report.nouveaux_cas.length}));
}
module.exports={snapshot,compare,NEW_CASES};
