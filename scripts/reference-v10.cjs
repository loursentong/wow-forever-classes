'use strict';
// Référence v10 (moteur 1.0.9). Rejoue chaque cas de la v9 avec le moteur actuel et vérifie ce qui
// peut changer. L'écriture d'une nouvelle photographie est explicite (--fixture), sans écrasement
// possible. Aucune ancienne fixture n'est modifiée.
const fs=require('node:fs'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),v9=require('../tests/fixtures/moteur-reference-v9.json');
const DECISION='Décision du responsable du projet, 22 octobre 2026 : les classements listent les spécialisations, plus seulement la meilleure de chaque classe ; '+
 'le top 3 du parcours guidé en garde au plus deux d’une même classe ; les listes affichent dix configurations, puis les autres sur demande. '+
 'Mode personnalisé : la technicité suit les critères d’activité, comme la difficulté du parcours guidé (PvP seul : difficulté PvP ; PvE seul, rôles compris : PvE ; sinon la moyenne). '+
 'Aucune note ni aucun coefficient modifié.';
// Nouveaux cas : une classe qui revient dans le classement, et la technicité selon les activités.
const NEW_CASES=[
 {id:'v10-trois-druides-a-egalite',profile:{styles:{mob:5,surv:5},mastery:2}},
 {id:'v10-chasseurs-solo-dps',profile:{roles:{dps:5},activities:{solo:5},mastery:2}},
 {id:'v10-chasseurs-solo-tous-roles',profile:{activities:{solo:5},mastery:2}}
];
const TECH=[{tech:3,bg:3},{tech:3,sauv:3,ctrl:2},{tech:3,solo:3},{tech:3,dps:2},{tech:3,bg:3,solo:3}];
const compact=r=>r.results.map(x=>[x.spec.classId,x.spec.id,x.score]);
function guide(p){
 const r=E.recommend(p);
 return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r),top:r.top.map(x=>x.spec.id),uncertain:r.uncertain,
  scenarios:r.scenarios.map(x=>[x.name,x.status,x.top]),sansFamilier:r.results.filter(x=>x.spec.variant==='sans-familier').map(x=>x.spec.id)};
}
function snapshot(){
 const next=structuredClone(v9);
 next.info={...v9.info,engineVersion:E.version,revision:10,previousReference:'moteur-reference-v9.json',decision:DECISION};
 next.guide=v9.guide.map(c=>({...c,...guide(c.profile)})).concat(NEW_CASES.map(c=>({...c,...guide(c.profile)})));
 for(const c of next.priorities)for(const l of c.levels)l.results=compact(E.priorityRanking(v9.matrix.presets[c.id],l.mastery));
 for(const l of next.isolatedRoles)for(const c of l.axes)c.results=compact(E.priorityRanking({[c.axis]:3},l.mastery));
 for(const c of next.mixed)for(const l of c.levels)l.results=compact(E.priorityRanking(c.weights,l.mastery));
 next.technicite=TECH.map(weights=>({weights,context:E.techContext(E.sanitizeWeights(weights)),
  levels:[0,1,2,3].map(mastery=>({mastery,results:compact(E.priorityRanking(weights,mastery))}))}));
 return next;
}
// Première configuration de chaque classe, dans l'ordre : ce que la v9 affichait.
const firstOfEachClass=rows=>rows.filter((r,i)=>rows.findIndex(q=>q[0]===r[0])===i);
function sameClassOrder(before,after,label){assert.deepEqual(firstOfEachClass(after),before,label+' : premières configurations de chaque classe');}
function topPicks(rows){const n={},out=[];for(const r of rows){if(out.length===3)break;if((n[r[0]]||0)>=2)continue;n[r[0]]=(n[r[0]]||0)+1;out.push(r);}return out;}
function compare(before,after){
 for(const field of ['matrix','specs','petless','heal','referenceVariants'])assert.deepEqual(after[field],before[field],field+' doit rester inchangé');
 const changedTop=[];
 for(const a of before.guide){
  const b=after.guide.find(x=>x.id===a.id);assert.ok(b,a.id);
  for(const field of ['status','compatible','used','uncertain','profile'])assert.deepEqual(b[field],a[field],a.id+'/'+field);
  sameClassOrder(a.results,b.results,a.id);
  assert.equal(b.results.length,b.compatible,a.id+' : une ligne par configuration admissible');
  assert.deepEqual(b.top,topPicks(b.results).map(r=>r[1]),a.id+' : top 3 plafonné à deux par classe');
  for(const id of a.sansFamilier)assert.ok(b.sansFamilier.includes(id),a.id+' : variante '+id);
  const v9top=a.results.slice(0,3).map(r=>r[1]);
  if(JSON.stringify(v9top)!==JSON.stringify(b.top))changedTop.push({id:a.id,avant:v9top,apres:b.top});
  if(b.results.length)assert.deepEqual(b.results[0],a.results[0],a.id+' : la première piste ne change pas');
 }
 assert.equal(after.guide.length,before.guide.length+NEW_CASES.length);
 for(const c of before.priorities)for(const l of c.levels)sameClassOrder(l.results,after.priorities.find(x=>x.id===c.id).levels.find(x=>x.mastery===l.mastery).results,c.id+'/'+l.mastery);
 for(const l of before.isolatedRoles)for(const c of l.axes)sameClassOrder(c.results,after.isolatedRoles.find(x=>x.mastery===l.mastery).axes.find(x=>x.axis===c.axis).results,c.axis+'/'+l.mastery);
 for(const c of before.mixed)for(const l of c.levels)sameClassOrder(l.results,after.mixed.find(x=>JSON.stringify(x.weights)===JSON.stringify(c.weights)).levels.find(x=>x.mastery===l.mastery).results,JSON.stringify(c.weights)+'/'+l.mastery);
 // Technicité : seul le contexte change la difficulté retenue ; la moyenne reste la règle mixte.
 const techChanges=after.technicite.filter(t=>t.context!=='mixte').length;
 return {version:E.version,decision:DECISION,existingGuideCases:before.guide.length,changedTop3:changedTop.length,changedTop,
  unchangedFirstConfigurations:before.guide.filter(a=>a.results.length).length,priorityCasesClassOrderKept:before.priorities.length*4+before.isolatedRoles.length*3+before.mixed.reduce((n,c)=>n+c.levels.length,0),
  techniciteCases:after.technicite.length,techniciteContextual:techChanges,newCases:after.guide.slice(before.guide.length).map(c=>({id:c.id,top:c.top}))};
}
if(require.main===module){
 const args=process.argv.slice(2),i=args.indexOf('--fixture'),file=i>=0?args.splice(i,2)[1]:null;
 const next=snapshot(),report=compare(v9,next);
 if(file)fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n',{flag:'wx'});
 if(args[0])fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({existing:report.existingGuideCases,changedTop3:report.changedTop3,priorityCasesClassOrderKept:report.priorityCasesClassOrderKept,
  techniciteCases:report.techniciteCases,techniciteContextual:report.techniciteContextual,changedTop:report.changedTop,newCases:report.newCases},null,1));
}
module.exports={snapshot,compare,NEW_CASES,TECH,firstOfEachClass,DECISION};
