'use strict';
// Nouvelle référence proposée pour la correction demandée le 25 octobre 2026.
// Ne touche jamais aux photographies v1 à v13. --fixture est explicite, avec écriture exclusive.
const fs=require('node:fs'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),before=require('../tests/fixtures/moteur-reference-v13.json');
const DECISION='Correction demandée le 25 octobre 2026 : évaluer les rôles et départager les configurations selon les activités choisies. '+
 'Aucune note de raid dans un profil uniquement PvP ou solo ; note solo et difficulté PvE pour le leveling. '+
 'Donjons et raids devient une quinzième priorité explicite, sans changer les 126 notes, les 28 configurations ni les coefficients. '+
 'En l’absence d’activité, le rôle garde son repère PvE historique, annoncé comme provisoire. Proposition à valider avant publication.';
const NEW_CASES=[
 {id:'v14-dps-bg',profile:{roles:{dps:5},activities:{bg:5}}},
 {id:'v14-dps-world',profile:{roles:{dps:5},activities:{world:5},mastery:0}},
 {id:'v14-dps-solo',profile:{roles:{dps:5},activities:{solo:5},mastery:0}},
 {id:'v14-solo-pvp',profile:{roles:{dps:5},activities:{solo:5,world:5},styles:{ctrl:4},mastery:1}},
 {id:'v14-raid-pvp',profile:{roles:{dps:5},activities:{raid:5,bg:5},mastery:2}},
 {id:'v14-tank-raid',profile:{roles:{tank:5},rolesStrict:true,activities:{raid:5}}}
];
const compact=r=>r.results.map(x=>[x.spec.classId,x.spec.id,x.score]);
function guide(profile){const r=E.recommend(profile);return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r),top:r.top.map(x=>x.spec.id),uncertain:r.uncertain,scenarios:r.scenarios.map(x=>[x.name,x.status,x.top]),sansFamilier:r.results.filter(x=>x.spec.variant==='sans-familier').map(x=>x.spec.id)};}
function snapshot(){
 const next=structuredClone(before);
 next.info={...before.info,revision:14,sourceMainCommit:'5212e32a2484d95b60ac63d84c996b71a1cb8ada',engineVersion:E.version,previousReference:'moteur-reference-v13.json',decision:DECISION};
 next.priorityAxes=E.priorityAxes.slice();
 next.guide=before.guide.map(c=>({...c,...guide(c.profile)})).concat(NEW_CASES.map(c=>({...c,...guide(c.profile)})));
 for(const c of next.priorities){c.weights=E.priorityPreset(c.id,before.matrix.presets[c.id]);for(const l of c.levels)l.results=compact(E.priorityRanking(c.weights,l.mastery));}
 for(const l of next.isolatedRoles)for(const c of l.axes)c.results=compact(E.priorityRanking({[c.axis]:3},l.mastery));
 for(const c of next.mixed)for(const l of c.levels)l.results=compact(E.priorityRanking(c.weights,l.mastery));
 for(const c of next.technicite)for(const l of c.levels)l.results=compact(E.priorityRanking(c.weights,l.mastery));
 next.mixed.push(...[{raid:3,dps:3},{raid:3,bg:1,dps:3,tech:2},{solo:3,dps:3,ctrl:2}].map(weights=>({weights,levels:[0,2,3].map(mastery=>({mastery,results:compact(E.priorityRanking(weights,mastery))}))})));
 return next;
}
function compare(previous,next){
 for(const field of ['matrix','specs','petless','heal','referenceVariants','petlessComplexity'])assert.deepEqual(next[field],previous[field],field+' inchangé');
 const changedGuide=[],neutralGuide=[];
 for(const a of previous.guide){
  const b=next.guide.find(b=>b.id===a.id);assert.ok(b,a.id);
  for(const k of ['status','compatible','used','uncertain','profile'])assert.deepEqual(a[k],b[k],a.id+'/'+k);
  const acts=Object.keys(a.profile.activities||{});
  if(!acts.length||acts.every(k=>k==='raid')){assert.deepEqual(b.results,a.results,a.id+' sans activité ou en raid seul');neutralGuide.push(a.id);}
  if(JSON.stringify(a.results)!==JSON.stringify(b.results))changedGuide.push({id:a.id,before:a.top,after:b.top,firstChanged:a.top[0]!==b.top[0]});
 }
 const changedPriority=[];let cases=0,unchanged=0;
 function visit(id,w,m,a,b){cases++;if(JSON.stringify(a)!==JSON.stringify(b))changedPriority.push({id,mastery:m,before:a.slice(0,3).map(x=>x[1]),after:b.slice(0,3).map(x=>x[1])});else unchanged++;}
 for(const a of previous.priorities)for(const l of a.levels)visit(a.id,previous.matrix.presets[a.id],l.mastery,l.results,next.priorities.find(c=>c.id===a.id).levels.find(x=>x.mastery===l.mastery).results);
 for(const l of previous.isolatedRoles)for(const a of l.axes)visit(a.axis,{[a.axis]:3},l.mastery,a.results,next.isolatedRoles.find(x=>x.mastery===l.mastery).axes.find(x=>x.axis===a.axis).results);
 for(const field of ['mixed','technicite'])for(let i=0;i<previous[field].length;i++)for(const l of previous[field][i].levels)visit(field+'/'+i,previous[field][i].weights,l.mastery,l.results,next[field][i].levels.find(x=>x.mastery===l.mastery).results);
 return {version:E.version,guideCases:previous.guide.length,unchangedNeutralGuide:neutralGuide.length,changedGuide,priorityCases:cases,unchangedPriority:unchanged,changedPriority,newCases:NEW_CASES.map(c=>({id:c.id,top:next.guide.find(x=>x.id===c.id).top})),decision:DECISION};
}
if(require.main===module){
 const args=process.argv.slice(2),n=args.indexOf('--fixture'),file=n<0?null:args.splice(n,2)[1];
 const next=snapshot(),report=compare(before,next);
 if(file)fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n',{flag:'wx'});
 if(args[0])fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({guideCases:report.guideCases,changedGuide:report.changedGuide.length,unchangedNeutralGuide:report.unchangedNeutralGuide,priorityCases:report.priorityCases,changedPriority:report.changedPriority.length,unchangedPriority:report.unchangedPriority,newCases:report.newCases},null,2));
}
module.exports={snapshot,compare,NEW_CASES,DECISION};
