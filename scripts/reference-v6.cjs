'use strict';
// Référence v6 : difficulté selon les activités. La préférence « prise en main confortable » ou
// « gameplay à approfondir » juge la charge PvE si le joueur n'a choisi que des activités PvE
// (donjons et raids, solo), la charge PvP s'il n'a choisi que du PvP (champs de bataille, PvP
// sauvage), sinon la moyenne des deux, comme avant. Seuls les profils qui combinent cette préférence
// avec des activités d'un seul contexte peuvent changer ; aucun des 103 cas de la v5 n'en fait partie.
// La v6 ajoute quatre scénarios qui combinent difficulté et activités.
// Usage : node scripts/reference-v6.cjs [rapport.json] [--fixture chemin.json]
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const E=require('../recommendation-engine.js');
const v5=require('../tests/fixtures/moteur-reference-v5.json');

const DECISION='La préférence de difficulté juge la charge PvE quand le joueur n’a choisi que des activités PvE, la charge PvP '+
 'quand il n’a choisi que du PvP, sinon la moyenne (décision du responsable du projet, 21 octobre 2026, après les retours de sa '+
 'guilde : le Chasseur est jugé simple en PvE et exigeant en PvP de haut niveau). Les notes, les autres formules et les priorités '+
 'sont inchangées.';
const NEW_CASES=[
 {id:'difficulty-simple-pve',profile:{difficulty:{value:'simple',certainty:5},activities:{raid:5}}},
 {id:'difficulty-simple-pvp',profile:{difficulty:{value:'simple',certainty:5},activities:{world:5}}},
 {id:'difficulty-complex-pve',profile:{difficulty:{value:'complex',certainty:5},activities:{raid:5}}},
 {id:'difficulty-complex-pvp',profile:{difficulty:{value:'complex',certainty:5},activities:{bg:5}}}
];
function compact(results){return results.map(x=>[x.spec.classId,x.spec.id,x.score]);}
function guide(profile){
 const r=E.recommend(profile);
 return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r.results),uncertain:r.uncertain,
  scenarios:r.scenarios.map(x=>[x.name,x.status,x.top]),
  sansFamilier:r.results.filter(x=>x.spec.variant==='sans-familier').map(x=>x.spec.id)};
}
function snapshot(){
 const next=structuredClone(v5);
 next.info={...v5.info,engineVersion:E.version,revision:6,previousReference:'moteur-reference-v5.json',decision:DECISION};
 next.specs=E.specs;
 next.guide=v5.guide.map(ex=>({...ex,...guide(ex.profile)}))
  .concat(NEW_CASES.map(c=>({id:c.id,profile:c.profile,...guide(c.profile)})));
 for(const ex of next.priorities)for(const level of ex.levels)level.results=compact(E.priorityRanking(v5.matrix.presets[ex.id],level.mastery).results);
 for(const level of next.isolatedRoles)for(const ex of level.axes)ex.results=compact(E.priorityRanking({[ex.axis]:3},level.mastery).results);
 for(const ex of next.mixed)for(const level of ex.levels)level.results=compact(E.priorityRanking(ex.weights,level.mastery).results);
 return next;
}
// Un profil ne peut changer que s'il exprime une préférence de difficulté et des activités d'un seul contexte.
const contextual=p=>{const q=E.sanitize(p);return q.difficulty.value!=='any'&&E.difficultyContext(q)!=='mixte';};
function compare(before,after){
 for(const k of ['matrix','specs','petless','priorities','isolatedRoles','mixed'])assert.deepEqual(after[k],before[k],k+' inchangé');
 const cases=[];
 before.guide.forEach((a,i)=>{
  const b=after.guide[i];
  assert.equal(b.id,a.id);
  for(const k of ['profile','status','compatible','used','uncertain'])assert.deepEqual(b[k],a[k],a.id+'/'+k);
  const changed=['results','scenarios','sansFamilier'].some(k=>JSON.stringify(b[k])!==JSON.stringify(a[k]));
  if(changed)assert.ok(contextual(a.profile),'Écart hors préférence de difficulté contextualisée : '+a.id);
  cases.push({id:a.id,modifie:changed});
 });
 const added=after.guide.slice(before.guide.length);
 assert.deepEqual(added.map(c=>c.id),NEW_CASES.map(c=>c.id),'Nouveaux scénarios de difficulté');
 const fixed=before.priorities.reduce((n,x)=>n+x.levels.length,0)+before.isolatedRoles.reduce((n,x)=>n+x.axes.length,0)+
  before.mixed.reduce((n,x)=>n+x.levels.length,0);
 return {version:E.version,reference:'v5 → v6',cas:cases.length+fixed,cas_modifies:cases.filter(c=>c.modifie).length,
  nouveaux_cas:added.map(c=>({id:c.id,contexte:E.difficultyContext(E.sanitize(c.profile)),premiers:c.results.slice(0,4)})),
  regle:DECISION,resultats:cases.filter(c=>c.modifie)};
}
if(require.main===module){
 const args=process.argv.slice(2),i=args.indexOf('--fixture');
 const fixturePath=i>=0?args.splice(i,2)[1]:null;
 const next=snapshot(),report=compare(v5,next);
 if(fixturePath)fs.writeFileSync(path.resolve(fixturePath),JSON.stringify(next,null,2)+'\n');
 if(args[0])fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({version:report.version,cas:report.cas,cas_modifies:report.cas_modifies,nouveaux:report.nouveaux_cas.length}));
}
module.exports={snapshot,compare,NEW_CASES};
