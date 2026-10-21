'use strict';
// Référence v4 : l'exception solo du Chasseur est réservée à Maîtrise des bêtes (familier central).
// Seuls le score et la configuration du Chasseur peuvent changer, uniquement en solo, en Débutant ou
// Intermédiaire, et seulement à la baisse ; les autres classes gardent configuration, score et ordre.
// Usage : node scripts/reference-v4.cjs [rapport.json]
// Depuis le moteur 1.0.4, la comparaison porte sur la photographie v4 figée (le moteur actuel suit
// la v5, voir scripts/reference-v5.cjs) ; aucune photographie n'est écrite.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const E=require('../recommendation-engine.js');
const v3=require('../tests/fixtures/moteur-reference-v3.json');

const DECISION='L’activité solo du Chasseur n’échappe plus à l’effet de la maîtrise que pour Maîtrise des bêtes, '+
 'où le familier est central ; Précision et Survie suivent la règle générale (décision du responsable du projet, '+
 '21 octobre 2026). Les autres classes, les notes et les formules sont inchangées.';
const HUNTER='chasseur';
function compact(results){return results.map(x=>[x.spec.classId,x.spec.id,x.score]);}
function guide(profile){
 const r=E.recommend(profile);
 return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r.results),uncertain:r.uncertain,
  scenarios:r.scenarios.map(x=>[x.name,x.status,x.top])};
}
// Photographie v4 : mêmes entrées que la v3, rejouées avec le moteur actuel.
function snapshot(){
 const next=structuredClone(v3);
 next.info={...v3.info,engineVersion:E.version,revision:4,previousReference:'moteur-reference-v3.json',decision:DECISION};
 next.specs=E.specs;
 next.guide=v3.guide.map(ex=>({...ex,...guide(ex.profile)}));
 for(const ex of next.priorities)for(const level of ex.levels)level.results=compact(E.priorityRanking(v3.matrix.presets[ex.id],level.mastery).results);
 for(const level of next.isolatedRoles)for(const ex of level.axes)ex.results=compact(E.priorityRanking({[ex.axis]:3},level.mastery).results);
 for(const ex of next.mixed)for(const level of ex.levels)level.results=compact(E.priorityRanking(ex.weights,level.mastery).results);
 return next;
}
const withoutHunter=list=>list.filter(c=>c!==HUNTER);
function compare(before,after){
 assert.deepEqual(after.matrix,before.matrix,'Notes historiques inchangées');
 assert.deepEqual(after.specs,before.specs,'Notes spécialisées inchangées');
 const cases=[];
 function rows(id,mastery,soloAsked,a,b){
  assert.equal(b.length,a.length,id);
  const others=x=>x.filter(r=>r[0]!==HUNTER);
  assert.deepEqual(others(b),others(a),'Autres classes inchangées (configuration, score, ordre) : '+id);
  const h0=a.find(r=>r[0]===HUNTER),h1=b.find(r=>r[0]===HUNTER);
  assert.equal(!!h1,!!h0,id);
  const changed=JSON.stringify(a)!==JSON.stringify(b);
  if(changed){
   assert.ok(soloAsked&&mastery<=1,'Écart hors solo Débutant/Intermédiaire : '+id);
   assert.ok(h1[2]<=h0[2],'Le Chasseur ne peut que baisser : '+id);
  }
  cases.push({id,maitrise:mastery,modifie:changed,
   chasseur:h0?{avant:{rang:a.indexOf(h0)+1,configuration:h0[1],score:h0[2]},apres:{rang:b.indexOf(h1)+1,configuration:h1[1],score:h1[2]}}:null});
 }
 before.guide.forEach((a,i)=>{
  const b=after.guide[i],p=E.sanitize(a.profile),solo=E.selected(p.activities).includes('solo');
  for(const k of ['id','profile','status','compatible','used','uncertain'])assert.deepEqual(b[k],a[k],a.id+'/'+k);
  assert.equal(b.scenarios.length,a.scenarios.length,a.id+'/scénarios');
  a.scenarios.forEach((s,j)=>{
   const t=b.scenarios[j];
   assert.deepEqual(t.slice(0,2),s.slice(0,2),a.id+'/scénario '+j);
   // Seul le Chasseur peut reculer : les autres classes gardent leur ordre, une suivante peut entrer.
   const x=withoutHunter(s[2]),y=withoutHunter(t[2]);
   assert.deepEqual(y.slice(0,x.length),x,a.id+'/scénario '+j+' : ordre des autres classes');
   if(JSON.stringify(t[2])!==JSON.stringify(s[2]))assert.ok(solo&&p.mastery<=1,a.id+'/scénario '+j+' hors solo');
  });
  rows('guide/'+a.id,p.mastery,solo,a.results,b.results);
 });
 const soloWeighted=w=>(w&&w.solo>0);
 before.priorities.forEach((a,i)=>a.levels.forEach((l,j)=>rows('priorites/'+a.id,l.mastery,soloWeighted(before.matrix.presets[a.id]),l.results,after.priorities[i].levels[j].results)));
 before.isolatedRoles.forEach((a,i)=>a.axes.forEach((x,j)=>rows('role/'+x.axis,a.mastery,false,x.results,after.isolatedRoles[i].axes[j].results)));
 before.mixed.forEach((a,i)=>a.levels.forEach((l,j)=>rows('melange/'+JSON.stringify(a.weights),l.mastery,soloWeighted(a.weights),l.results,after.mixed[i].levels[j].results)));
 return {version:E.version,reference:'v3 → v4',cas:cases.length,cas_modifies:cases.filter(c=>c.modifie).length,
  regle:DECISION,resultats:cases.filter(c=>c.modifie)};
}
if(require.main===module){
 const args=process.argv.slice(2);
 const report=compare(v3,require('../tests/fixtures/moteur-reference-v4.json'));
 if(args[0])fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({version:report.version,cas:report.cas,cas_modifies:report.cas_modifies}));
}
module.exports={snapshot,compare};
