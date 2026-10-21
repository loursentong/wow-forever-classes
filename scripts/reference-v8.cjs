'use strict';
// Référence v8 : façon de soigner. Quand le joueur demande le rôle Soin, il peut préciser jusqu'à deux
// façons de soigner (prévenir les dégâts, soins sur la durée, gros soins ciblés, soigner tout le groupe),
// chacune avec sa certitude. Elles comparent les cinq configurations de soin grâce à leur profil de soin
// (1 à 5, établi dans la base de connaissances), avec un poids de 0,15 ; les autres configurations ne sont
// pas jugées sur ce critère, et sans le rôle Soin ces réponses sont ignorées.
// Aucune note ne change et aucun des 107 cas de la v7 ne change : ils ne précisent aucune façon de soigner.
// La v8 ajoute sept scénarios guidés.
// Usage : node scripts/reference-v8.cjs [rapport.json] [--fixture chemin.json]
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const E=require('../recommendation-engine.js');
const v7=require('../tests/fixtures/moteur-reference-v7.json');

const DECISION='Quand le joueur demande le rôle Soin, jusqu’à deux façons de soigner (prévenir les dégâts, soins sur la durée, '+
 'gros soins ciblés, soigner tout le groupe) comparent les configurations de soin selon leur profil de soin, établi dans la base '+
 'de connaissances, avec un poids de 0,15 ; les autres configurations ne sont pas jugées sur ce critère (décision du responsable '+
 'du projet, 21 octobre 2026, lot 3). Les notes, les autres formules et les priorités sont inchangées.';
const NEW_CASES=[
 {id:'heal-style-prevention',profile:{roles:{soin:5},rolesStrict:true,healStyles:{prevention:5}}},
 {id:'heal-style-duree',profile:{roles:{soin:5},rolesStrict:true,healStyles:{duree:5}}},
 {id:'heal-style-cible',profile:{roles:{soin:5},rolesStrict:true,healStyles:{cible:5}}},
 {id:'heal-style-groupe',profile:{roles:{soin:5},rolesStrict:true,healStyles:{groupe:5}}},
 {id:'heal-style-raid-hesitant',profile:{roles:{soin:4},activities:{raid:4},healStyles:{groupe:4,duree:2}}},
 {id:'heal-style-dps-mixed',profile:{roles:{soin:4,dps:3},healStyles:{prevention:5}}},
 {id:'heal-style-without-heal-role',profile:{roles:{dps:5},healStyles:{duree:5}}}
];
function compact(results){return results.map(x=>[x.spec.classId,x.spec.id,x.score]);}
function guide(profile){
 const r=E.recommend(profile);
 return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r.results),uncertain:r.uncertain,
  scenarios:r.scenarios.map(x=>[x.name,x.status,x.top]),
  sansFamilier:r.results.filter(x=>x.spec.variant==='sans-familier').map(x=>x.spec.id)};
}
function healProfiles(){
 const out={};
 for(const s of E.specs)if(s.heal)out[s.id]={...s.heal};
 return out;
}
function snapshot(){
 const next=structuredClone(v7);
 next.info={...v7.info,engineVersion:E.version,revision:8,previousReference:'moteur-reference-v7.json',decision:DECISION};
 next.specs=E.specs;
 next.heal=healProfiles();
 next.guide=v7.guide.map(ex=>({...ex,...guide(ex.profile)}))
  .concat(NEW_CASES.map(c=>({id:c.id,profile:c.profile,...guide(c.profile)})));
 for(const ex of next.priorities)for(const level of ex.levels)level.results=compact(E.priorityRanking(v7.matrix.presets[ex.id],level.mastery).results);
 for(const level of next.isolatedRoles)for(const ex of level.axes)ex.results=compact(E.priorityRanking({[ex.axis]:3},level.mastery).results);
 for(const ex of next.mixed)for(const level of ex.levels)level.results=compact(E.priorityRanking(ex.weights,level.mastery).results);
 return next;
}
function compare(before,after){
 assert.deepEqual(after.matrix,before.matrix,'Notes historiques inchangées');
 assert.deepEqual(after.petless,before.petless,'Variantes sans familier inchangées');
 // Aucune note ne change : seules les configurations de soin reçoivent un profil de soin.
 assert.equal(after.specs.length,before.specs.length);
 before.specs.forEach((a,i)=>{
  const {heal,...rest}=after.specs[i];
  assert.deepEqual(rest,a,a.id+' : identité et notes inchangées');
  assert.equal(!!heal,a.role==='soin',a.id+' : profil de soin seulement pour une configuration de soin');
  if(heal){
   assert.deepEqual(heal,after.heal[a.id],a.id);
   assert.deepEqual(Object.keys(heal),[...E.healStyles],a.id);
   for(const k of E.healStyles)assert.ok(Number.isInteger(heal[k])&&heal[k]>=1&&heal[k]<=5,a.id+'/'+k);
  }
 });
 assert.deepEqual(Object.keys(after.heal).sort(),before.specs.filter(s=>s.role==='soin').map(s=>s.id).sort());
 // Les 107 cas de la v7 restent identiques : 20 scénarios guidés et 87 classements de priorités.
 before.guide.forEach((a,i)=>assert.deepEqual(after.guide[i],a,'Scénario guidé inchangé : '+a.id));
 for(const k of ['priorities','isolatedRoles','mixed'])assert.deepEqual(after[k],before[k],k+' inchangés');
 const added=after.guide.slice(before.guide.length);
 assert.deepEqual(added.map(c=>c.id),NEW_CASES.map(c=>c.id),'Nouveaux scénarios de soin');
 // La façon de soigner ne compte qu'avec le rôle Soin.
 for(const c of added)assert.equal(c.used.includes('healStyles'),Object.keys(c.profile.roles||{}).includes('soin'),c.id);
 const fixed=before.priorities.reduce((n,x)=>n+x.levels.length,0)+before.isolatedRoles.reduce((n,x)=>n+x.axes.length,0)+
  before.mixed.reduce((n,x)=>n+x.levels.length,0);
 return {version:E.version,reference:'v7 → v8',cas:before.guide.length+fixed,cas_modifies:0,
  nouveaux_cas:added.map(c=>({id:c.id,dimensions:c.used,premiers:c.results.slice(0,3),hesitations:c.uncertain})),
  regle:DECISION,profils_soin:after.heal};
}
if(require.main===module){
 const args=process.argv.slice(2),i=args.indexOf('--fixture');
 const fixturePath=i>=0?args.splice(i,2)[1]:null;
 const next=snapshot(),report=compare(v7,next);
 if(fixturePath)fs.writeFileSync(path.resolve(fixturePath),JSON.stringify(next,null,2)+'\n');
 if(args[0])fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({version:report.version,cas:report.cas,cas_modifies:report.cas_modifies,
  nouveaux:report.nouveaux_cas.map(c=>c.id+' → '+c.premiers.map(r=>r[1]+' '+r[2]).join(', '))},null,1));
}
module.exports={snapshot,compare,NEW_CASES};
