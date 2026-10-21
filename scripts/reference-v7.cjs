'use strict';
// Référence v7 : la note « Donjons et raids » d'un DPS mesure ses dégâts simulés seuls, selon les barèmes
// 5 ≥ 86 %, 4 de 72 à 85 %, 3 de 55 à 71 %, 2 en dessous ; l'utilité de groupe reste notée dans Soutien.
// Quatre notes changent : Élémentaire 3→2, Destruction 4→3, Combat 4→3, Amélioration 4→3 (écarts e1,
// e2, e3 et e13). L'écart e5 s'y ajoute : Farouche (félin) en zone 3→2, faute de Swipe hors de l'ours.
// Seules ces cinq notes changent ; les classes concernées sont le Chaman, le Démoniste, le Voleur et le
// Druide : les autres gardent configuration et score dans chaque classement, seul leur rang peut bouger.
// Usage : node scripts/reference-v7.cjs [rapport.json]
// Depuis le moteur 1.0.7, la comparaison porte sur la photographie v7 figée (le moteur actuel suit
// la v8, voir scripts/reference-v8.cjs) ; aucune photographie n'est écrite.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const E=require('../recommendation-engine.js');
const v6=require('../tests/fixtures/moteur-reference-v6.json');

const DECISION='Pour un DPS, la note « Donjons et raids » mesure ses dégâts simulés seuls (barèmes 5 ≥ 86 %, 4 de 72 à 85 %, '+
 '3 de 55 à 71 %, 2 en dessous), l’utilité restant notée dans Soutien ; Farouche (félin) passe à 2 en zone, sans Swipe hors de '+
 'l’ours (décisions du responsable du projet, 21 octobre 2026, sur les écarts e1, e2, e3, e5 et e13).';
const CHANGES={'chaman-elementaire':{raid:[3,2]},'demoniste-destruction':{raid:[4,3]},'voleur-combat':{raid:[4,3]},
 'chaman-amelioration':{raid:[4,3]},'druide-farouche-chat':{zone:[3,2]}};
const AFFECTED=[...new Set(Object.keys(CHANGES).map(id=>id.split('-')[0]))];
function compact(results){return results.map(x=>[x.spec.classId,x.spec.id,x.score]);}
function guide(profile){
 const r=E.recommend(profile);
 return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r.results),uncertain:r.uncertain,
  scenarios:r.scenarios.map(x=>[x.name,x.status,x.top]),
  sansFamilier:r.results.filter(x=>x.spec.variant==='sans-familier').map(x=>x.spec.id)};
}
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
 const next=structuredClone(v6);
 next.info={...v6.info,engineVersion:E.version,revision:7,previousReference:'moteur-reference-v6.json',decision:DECISION};
 next.specs=E.specs;
 next.petless=petlessNotes();
 next.guide=v6.guide.map(ex=>({...ex,...guide(ex.profile)}));
 for(const ex of next.priorities)for(const level of ex.levels)level.results=compact(E.priorityRanking(v6.matrix.presets[ex.id],level.mastery).results);
 for(const level of next.isolatedRoles)for(const ex of level.axes)ex.results=compact(E.priorityRanking({[ex.axis]:3},level.mastery).results);
 for(const ex of next.mixed)for(const level of ex.levels)level.results=compact(E.priorityRanking(ex.weights,level.mastery).results);
 return next;
}
function noteOf(s,k){return k in s.activity?s.activity[k]:s.style[k];}
const stable=rows=>rows.filter(r=>!AFFECTED.includes(r[0])).map(r=>r.slice(1)).sort((a,b)=>a[0].localeCompare(b[0]));
function compare(before,after){
 assert.deepEqual(after.matrix,before.matrix,'Notes historiques inchangées');
 assert.deepEqual(after.petless,before.petless,'Écarts des variantes sans familier inchangés');
 // Seules les cinq notes décidées changent.
 before.specs.forEach((a,i)=>{
  const b=after.specs[i],c=CHANGES[a.id]||{};
  for(const part of ['activity','style'])for(const k of Object.keys(a[part])){
   if(c[k]){assert.equal(a[part][k],c[k][0],a.id+'/'+k);assert.equal(b[part][k],c[k][1],a.id+'/'+k);}
   else assert.equal(b[part][k],a[part][k],a.id+'/'+k);
  }
  for(const k of ['id','classId','label','role','range','pet','load','source'])assert.deepEqual(b[k],a[k],a.id+'/'+k);
 });
 const cases=[];
 function rows(id,a,b){
  assert.equal(b.length,a.length,id);
  assert.deepEqual(stable(b),stable(a),'Autres classes : configuration et score inchangés : '+id);
  const changed=JSON.stringify(a)!==JSON.stringify(b);
  cases.push({id,modifie:changed,premier_avant:a[0]||null,premier_apres:b[0]||null});
 }
 before.guide.forEach((a,i)=>{
  const b=after.guide[i];
  assert.equal(b.id,a.id);
  for(const k of ['profile','status','compatible','used','uncertain'])assert.deepEqual(b[k],a[k],a.id+'/'+k);
  rows('guide/'+a.id,a.results,b.results);
 });
 before.priorities.forEach((a,i)=>a.levels.forEach((l,j)=>rows('priorites/'+a.id+'/'+l.mastery,l.results,after.priorities[i].levels[j].results)));
 before.isolatedRoles.forEach((a,i)=>a.axes.forEach((x,j)=>rows('role/'+x.axis+'/'+a.mastery,x.results,after.isolatedRoles[i].axes[j].results)));
 before.mixed.forEach((a,i)=>a.levels.forEach((l,j)=>rows('melange/'+JSON.stringify(a.weights)+'/'+l.mastery,l.results,after.mixed[i].levels[j].results)));
 const changed=cases.filter(c=>c.modifie);
 return {version:E.version,reference:'v6 → v7',cas:cases.length,cas_modifies:changed.length,
  premiere_classe_modifiee:changed.filter(c=>c.premier_avant&&c.premier_avant[0]!==c.premier_apres[0]).length,
  premiere_configuration_modifiee:changed.filter(c=>c.premier_avant&&c.premier_avant[1]!==c.premier_apres[1]).map(c=>({id:c.id,avant:c.premier_avant,apres:c.premier_apres})),
  regle:DECISION,notes:CHANGES,resultats:changed};
}
if(require.main===module){
 const args=process.argv.slice(2);
 const report=compare(v6,require('../tests/fixtures/moteur-reference-v7.json'));
 if(args[0])fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({version:report.version,cas:report.cas,cas_modifies:report.cas_modifies,
  premiere_classe_modifiee:report.premiere_classe_modifiee,premiere_configuration_modifiee:report.premiere_configuration_modifiee}));
}
module.exports={snapshot,compare,CHANGES};
