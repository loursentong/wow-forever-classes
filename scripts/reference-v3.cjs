'use strict';
// Référence v3 : seule la configuration qui représente une classe à score égal peut changer.
// Usage : node scripts/reference-v3.cjs [rapport.json]
// Depuis le moteur 1.0.3, la comparaison porte sur la photographie v3 figée (le moteur actuel suit
// la v4, voir scripts/reference-v4.cjs) ; aucune photographie n'est écrite.
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const E=require('../recommendation-engine.js');
const v2=require('../tests/fixtures/moteur-reference-v2.json');

const DECISION='À score égal entre configurations d’une même classe, la classe est représentée par la configuration '+
 'au plus haut potentiel ajusté à la maîtrise, puis par identifiant (décision du responsable du projet, 21 octobre 2026). '+
 'Scores, ordre des classes, notes et formules inchangés.';
function compact(results){return results.map(x=>[x.spec.classId,x.spec.id,x.score]);}
function guide(profile){
 const r=E.recommend(profile);
 return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r.results),uncertain:r.uncertain,
  scenarios:r.scenarios.map(x=>[x.name,x.status,x.top])};
}
// Photographie v3 : mêmes entrées que la v2, rejouées avec le moteur actuel.
function snapshot(){
 const next=structuredClone(v2);
 next.info={...v2.info,engineVersion:E.version,revision:3,previousReference:'moteur-reference-v2.json',decision:DECISION};
 next.specs=E.specs;
 next.guide=v2.guide.map(ex=>({...ex,...guide(ex.profile)}));
 for(const ex of next.priorities)for(const level of ex.levels)level.results=compact(E.priorityRanking(v2Presets(ex.id),level.mastery).results);
 for(const level of next.isolatedRoles)for(const ex of level.axes)ex.results=compact(E.priorityRanking({[ex.axis]:3},level.mastery).results);
 for(const ex of next.mixed)for(const level of ex.levels)level.results=compact(E.priorityRanking(ex.weights,level.mastery).results);
 return next;
}
function v2Presets(id){return v2.matrix.presets[id];}
// Potentiels calculés sur les notes figées de la v2 (identiques en v3), pas sur le moteur actuel.
const specById=Object.fromEntries(v2.specs.map(s=>[s.id,s]));
function historicalPotential(s,m){
 const delta=Math.min(.35,Math.max(-1.2,[-.29,-.13,0,.09][m]*s.load.pve));
 return (Math.min(5,Math.max(1,s.activity.raid+delta))-1)/4;
}
// Contrôle des écarts v2 → v3 : même classe au même rang, même score ; une configuration
// différente n'est admise qu'à égalité, avec un potentiel plus élevé (ou égal et identifiant antérieur).
function compare(before,after){
 assert.deepEqual(after.matrix,before.matrix,'Notes historiques inchangées');
 assert.deepEqual(after.specs,before.specs,'Notes spécialisées inchangées');
 const cases=[];
 function rows(id,mastery,a,b){
  assert.equal(b.length,a.length,id);
  const changes=[];
  b.forEach((row,i)=>{
   const old=a[i];
   assert.equal(row[0],old[0],'Même classe au rang '+(i+1)+' : '+id);
   assert.equal(row[2],old[2],'Même score : '+id+'/'+row[0]);
   if(row[1]!==old[1]){
    const pNew=Math.round(historicalPotential(specById[row[1]],mastery)*1e4),pOld=Math.round(historicalPotential(specById[old[1]],mastery)*1e4);
    assert.ok(pNew>pOld||pNew===pOld&&row[1].localeCompare(old[1])<0,'Potentiel non respecté : '+id+'/'+row[0]);
    changes.push({classe:row[0],rang:i+1,score:row[2],avant:old[1],apres:row[1],potentiel_avant:pOld/1e4,potentiel_apres:pNew/1e4});
   }
  });
  cases.push({id,maitrise:mastery,modifie:changes.length>0,changements:changes});
 }
 before.guide.forEach((a,i)=>{
  const b=after.guide[i];
  for(const k of ['id','profile','status','compatible','used','uncertain','scenarios'])assert.deepEqual(b[k],a[k],a.id+'/'+k);
  rows('guide/'+a.id,E.sanitize(a.profile).mastery,a.results,b.results);
 });
 before.priorities.forEach((a,i)=>a.levels.forEach((l,j)=>rows('priorites/'+a.id,l.mastery,l.results,after.priorities[i].levels[j].results)));
 before.isolatedRoles.forEach((a,i)=>a.axes.forEach((x,j)=>rows('role/'+x.axis,a.mastery,x.results,after.isolatedRoles[i].axes[j].results)));
 before.mixed.forEach((a,i)=>a.levels.forEach((l,j)=>rows('melange/'+JSON.stringify(a.weights),l.mastery,l.results,after.mixed[i].levels[j].results)));
 return {version:E.version,reference:'v2 → v3',cas:cases.length,cas_modifies:cases.filter(c=>c.modifie).length,
  regle:DECISION,resultats:cases.filter(c=>c.modifie)};
}
if(require.main===module){
 const args=process.argv.slice(2);
 const report=compare(v2,require('../tests/fixtures/moteur-reference-v3.json'));
 if(args[0])fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({version:report.version,cas:report.cas,cas_modifies:report.cas_modifies}));
}
module.exports={snapshot,compare};
