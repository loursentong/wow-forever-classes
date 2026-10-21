'use strict';
// Compare d'abord chaque cas v8. L'écriture d'une nouvelle référence est explicite,
// sans écrasement possible. Aucune ancienne fixture n'est modifiée.
const fs=require('node:fs'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),v8=require('../tests/fixtures/moteur-reference-v8.json');
const DECISION='Proposition locale 1.0.8 issue de la poursuite de l’audit autorisée le 21 octobre 2026 : comparer les builds complets avec/sans compagnon pour un souhait souple ; imposer le build sans compagnon pour un refus strict ; identifier Précision comme Loup solitaire dans les deux parcours ; appliquer une envie de soin à toutes les pistes, avec une adéquation brute nulle hors soin, atténuée par la certitude. Aucune note ni aucun coefficient modifié. Pas encore intégré ni publié.';
const control={styles:{ctrl:5},range:{value:'distance',certainty:5},mastery:2};
const healAudit={roles:{soin:1},activities:{bg:4,solo:1},range:{value:'melee',certainty:2},styles:{zone:0,surv:5,support:2},difficulty:{value:'simple',certainty:2},mastery:1};
const NEW_CASES=[
 {id:'pet-soft-control-0',profile:{...control,pet:{value:'avoid',certainty:0}}},
 {id:'pet-soft-control-5',profile:{...control,pet:{value:'avoid',certainty:5}}},
 {id:'pet-strict-control-0',profile:{...control,pet:{value:'avoid',certainty:0,strict:true}}},
 {id:'precision-pet-wanted',profile:{styles:{burst:5},range:{value:'distance',certainty:5},pet:{value:'like',certainty:5},mastery:2}},
 {id:'heal-audit-without-style',profile:healAudit},
 {id:'heal-audit-prevention-0',profile:{...healAudit,healStyles:{prevention:0}}},
 {id:'heal-style-tank-and-heal-strict',profile:{roles:{tank:5,soin:5},rolesStrict:true,healStyles:{groupe:5},mastery:2}}
];
const compact=r=>r.results.map(x=>[x.spec.classId,x.spec.id,x.score]);
function guide(p){const r=E.recommend(p);return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r),uncertain:r.uncertain,scenarios:r.scenarios.map(x=>[x.name,x.status,x.top]),sansFamilier:r.results.filter(x=>x.spec.variant==='sans-familier').map(x=>x.spec.id)};}
function allowedChange(profile,classId){const p=E.sanitize(profile);return Object.keys(p.healStyles).length>0||
 p.pet.value==='avoid'&&!p.pet.strict&&['chasseur','demoniste'].includes(classId)||p.pet.value==='like'&&classId==='chasseur';}
function snapshot(){
 const next=structuredClone(v8);
 next.info={...v8.info,engineVersion:E.version,revision:9,previousReference:'moteur-reference-v8.json',decision:DECISION};
 next.referenceVariants={...E.referenceVariants};next.specs=E.specs;
 next.guide=v8.guide.map(c=>({...c,...guide(c.profile)})).concat(NEW_CASES.map(c=>({...c,...guide(c.profile)})));
 for(const c of next.priorities)for(const l of c.levels)l.results=compact(E.priorityRanking(v8.matrix.presets[c.id],l.mastery));
 for(const l of next.isolatedRoles)for(const c of l.axes)c.results=compact(E.priorityRanking({[c.axis]:3},l.mastery));
 for(const c of next.mixed)for(const l of c.levels)l.results=compact(E.priorityRanking(c.weights,l.mastery));
 return next;
}
function compare(before,after){
 for(const field of ['matrix','specs','petless','heal','priorities','isolatedRoles','mixed'])assert.deepEqual(after[field],before[field],field+' doit rester inchangé');
 assert.deepEqual(after.referenceVariants,{'chasseur-precision':'sans-familier'});
 const changes=[];
 for(const a of before.guide){
  const b=after.guide.find(x=>x.id===a.id);assert.ok(b,a.id);
  for(const field of ['status','compatible','used','uncertain','profile'])assert.deepEqual(b[field],a[field],a.id+'/'+field);
  const rows=[];
  for(const previous of a.results){
   const next=b.results.find(r=>r[0]===previous[0]);assert.ok(next,a.id);
   if(!allowedChange(a.profile,previous[0]))assert.deepEqual(next,previous,'Changement hors périmètre '+a.id+'/'+previous[0]);
   if(JSON.stringify(next)!==JSON.stringify(previous))rows.push({classe:previous[0],avant:previous.slice(1),apres:next.slice(1)});
  }
  if(JSON.stringify(a)!==JSON.stringify(b))changes.push({id:a.id,profile:a.profile,rows,
   premierAvant:a.results[0]||null,premierApres:b.results[0]||null,
   variantesAvant:a.sansFamilier,variantesApres:b.sansFamilier,
   sensibiliteChangee:JSON.stringify(a.scenarios)!==JSON.stringify(b.scenarios)});
 }
 assert.equal(after.guide.length,before.guide.length+NEW_CASES.length);
 return {version:E.version,decision:DECISION,existingGuideCases:before.guide.length,
  changedScoresOrSpecs:changes.filter(c=>c.rows.length).length,changedFirstClasses:changes.filter(c=>c.premierAvant?.[0]!==c.premierApres?.[0]).length,
  unchangedPriorityCases:87,changes,newCases:after.guide.slice(before.guide.length)};
}
if(require.main===module){const args=process.argv.slice(2),i=args.indexOf('--fixture'),file=i>=0?args.splice(i,2)[1]:null;
 const next=snapshot(),report=compare(v8,next);
 if(file)fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n',{flag:'wx'});
 if(args[0])fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({existing:report.existingGuideCases,changedScoresOrSpecs:report.changedScoresOrSpecs,changedFirstClasses:report.changedFirstClasses,
  unchangedPriorities:report.unchangedPriorityCases,changes:report.changes.map(c=>({id:c.id,rows:c.rows,first:[c.premierAvant,c.premierApres],sensitivity:c.sensibiliteChangee})),
  newCases:report.newCases.map(c=>({id:c.id,top:c.results.slice(0,3)}))},null,2));
}
module.exports={snapshot,compare,NEW_CASES,allowedChange};
