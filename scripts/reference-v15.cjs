'use strict';
// Nouvelle décision 75/25. Les anciennes photographies ne sont jamais réécrites.
const fs=require('node:fs'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),before=require('../tests/fixtures/moteur-reference-v14.json');
const DECISION='Décision du responsable du projet, 25 octobre 2026 : le repère DPS de Donjons et raids combine '+
 '75 % de la note monocible et 25 % de la note de zone de la même configuration, avant la maîtrise PvE appliquée une fois. '+
 'Le rôle DPS et le départage utilisent le même repère. La référence monocible de classe ne s’ajoute plus au rôle DPS. '+
 'Aucune note source, donnée de configuration ou sauvegarde ne change. Convention éditoriale, pas une mesure de DPS. Publication à valider.';
const NEW_CASES=[
 {id:'v15-pve-dps',profile:{roles:{dps:5},rolesStrict:true,activities:{raid:5},mastery:2}},
 {id:'v15-pve-debutant',profile:{roles:{dps:5},rolesStrict:true,activities:{raid:5},mastery:0}},
 {id:'v15-pve-zone',profile:{roles:{dps:5},rolesStrict:true,activities:{raid:5},styles:{zone:5},mastery:2}},
 {id:'v15-pve-distance-sans-familier',profile:{roles:{dps:5},rolesStrict:true,activities:{raid:5},range:{value:'distance',strict:true,certainty:5},pet:{value:'avoid',strict:true,certainty:5},mastery:2}}
];
const NEW_MIXED=[{dps:3,raid:3,zone:3},{raid:3,zone:3,tech:2}];
const compact=r=>r.results.map(x=>[x.spec.classId,x.spec.id,x.score]);
function guide(profile){const r=E.recommend(profile);return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r),top:r.top.map(x=>x.spec.id),uncertain:r.uncertain,scenarios:r.scenarios.map(x=>[x.name,x.status,x.top]),sansFamilier:r.results.filter(x=>x.spec.variant==='sans-familier').map(x=>x.spec.id)};}
function snapshot(){
 const next=structuredClone(before);
 next.info={...before.info,revision:15,sourceMainCommit:'09c90cc35c3b6f411051df11ebc1600d31e8f680',engineVersion:E.version,previousReference:'moteur-reference-v14.json',decision:DECISION};
 next.guide=before.guide.map(c=>({...c,...guide(c.profile)})).concat(NEW_CASES.map(c=>({...c,...guide(c.profile)})));
 for(const c of next.priorities)for(const l of c.levels)l.results=compact(E.priorityRanking(c.weights,l.mastery));
 for(const l of next.isolatedRoles)for(const c of l.axes)c.results=compact(E.priorityRanking({[c.axis]:3},l.mastery));
 for(const field of ['mixed','technicite'])for(const c of next[field])for(const l of c.levels)l.results=compact(E.priorityRanking(c.weights,l.mastery));
 next.mixed.push(...NEW_MIXED.map(weights=>({weights,levels:[0,2,3].map(mastery=>({mastery,results:compact(E.priorityRanking(weights,mastery))}))})));
 return next;
}
function compare(previous,next){
 for(const field of ['matrix','specs','petless','heal','referenceVariants','petlessComplexity','priorityAxes'])assert.deepEqual(next[field],previous[field],field+' inchangé');
 const changedGuide=[],neutralGuide=[],changedPriority=[],neutralPriority=[];
 const roles=Object.fromEntries(previous.specs.map(s=>[s.id,s.role]));
 function checkRows(id,a,b,neutral){
  assert.deepEqual(b.map(x=>x[1]).sort(),a.map(x=>x[1]).sort(),id+' : mêmes configurations');
  for(const row of a)if(roles[row[1]]!=='dps')assert.equal(b.find(x=>x[1]===row[1])[2],row[2],id+'/'+row[1]+' : score hors DPS inchangé');
  if(neutral)assert.deepEqual(b,a,id+' : activité explicite sans PvE de groupe');
  return JSON.stringify(a)!==JSON.stringify(b);
 }
 for(const a of previous.guide){
  const b=next.guide.find(b=>b.id===a.id);assert.ok(b,a.id);
  for(const k of ['status','compatible','used','uncertain','profile'])assert.deepEqual(a[k],b[k],a.id+'/'+k);
  const acts=Object.keys(a.profile.activities||{}),neutral=acts.length>0&&!acts.includes('raid');
  if(neutral)neutralGuide.push(a.id);
  if(checkRows(a.id,a.results,b.results,neutral))changedGuide.push({id:a.id,before:a.top,after:b.top,firstChanged:a.top[0]!==b.top[0]});
 }
 let cases=0;
 function visit(id,w,m,a,b){
  cases++;const neutral=Object.keys(w).some(k=>['bg','sauv','solo'].includes(k)&&w[k]>0)&&!(w.raid>0);
  if(neutral)neutralPriority.push({id,mastery:m});
  if(checkRows(id+'/'+m,a,b,neutral))changedPriority.push({id,mastery:m,before:a.slice(0,3).map(x=>x[1]),after:b.slice(0,3).map(x=>x[1]),firstChanged:a[0]?.[1]!==b[0]?.[1]});
 }
 for(const a of previous.priorities)for(const l of a.levels)visit(a.id,a.weights,l.mastery,l.results,next.priorities.find(c=>c.id===a.id).levels.find(x=>x.mastery===l.mastery).results);
 for(const l of previous.isolatedRoles)for(const a of l.axes)visit(a.axis,{[a.axis]:3},l.mastery,a.results,next.isolatedRoles.find(x=>x.mastery===l.mastery).axes.find(x=>x.axis===a.axis).results);
 for(const field of ['mixed','technicite'])for(let i=0;i<previous[field].length;i++)for(const l of previous[field][i].levels)visit(field+'/'+i,previous[field][i].weights,l.mastery,l.results,next[field][i].levels.find(x=>x.mastery===l.mastery).results);
 return {version:next.info.engineVersion,guideCases:previous.guide.length,neutralGuide:neutralGuide.length,changedGuide,priorityCases:cases,neutralPriority:neutralPriority.length,changedPriority,newCases:NEW_CASES.map(c=>({id:c.id,top:next.guide.find(x=>x.id===c.id).top})),decision:DECISION};
}
if(require.main===module){
 const args=process.argv.slice(2),n=args.indexOf('--fixture'),file=n<0?null:args.splice(n,2)[1];
 const next=snapshot(),report=compare(before,next);
 if(file)fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n',{flag:'wx'});
 if(args[0])fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({guideCases:report.guideCases,changedGuide:report.changedGuide.length,changedGuideFirst:report.changedGuide.filter(c=>c.firstChanged).length,neutralGuide:report.neutralGuide,priorityCases:report.priorityCases,changedPriority:report.changedPriority.length,changedPriorityFirst:report.changedPriority.filter(c=>c.firstChanged).length,neutralPriority:report.neutralPriority,newCases:report.newCases},null,2));
}
module.exports={snapshot,compare,NEW_CASES,NEW_MIXED,DECISION};
