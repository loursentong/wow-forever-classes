'use strict';
// Référence v12 (moteur 1.2.0). Rejoue chaque cas de la v11 avec le moteur actuel et vérifie ce qui peut
// changer : la difficulté suit le contexte des activités partout (technicité du mode personnalisé, effet de
// la maîtrise sur les styles) et les variantes sans familier ont leur propre grille. L'écriture d'une
// nouvelle photographie est explicite (--fixture), sans écrasement possible. Aucune ancienne fixture n'est modifiée.
const fs=require('node:fs'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),v11=require('../tests/fixtures/moteur-reference-v11.json');
const DECISION='Décision du responsable du projet, 23 octobre 2026 : la difficulté suit le contexte des activités partout où elle sert. '+
 'Mode personnalisé : la technicité suit les activités, les rôles ne comptent plus comme du PvE ; PvE et PvP mêlés comptent chacun selon leur priorité ; sans activité, la moyenne. '+
 'L’effet de la maîtrise sur les styles suit les activités du joueur (PvE seul ou PvP seul), sinon la règle d’avant. '+
 'Les variantes sans familier ont leur propre grille de complexité : Survie 3/5 en PvE, Destruction 2/5 en PvE et 3/5 en PvP sans compagnon. Aucune note de configuration ni aucun coefficient modifié.';
const NEW_CASES=[
 {id:'v12-givre-debutant-pve-controle',profile:{activities:{raid:5},styles:{ctrl:5},range:{value:'distance',certainty:4},mastery:0}},
 {id:'v12-guerrier-debutant-pvp',profile:{roles:{dps:5},activities:{bg:5,world:4},range:{value:'melee',certainty:5},mastery:0}},
 {id:'v12-sans-familier-pve-accessible',profile:{roles:{dps:5},activities:{raid:5},pet:{value:'avoid',certainty:5,strict:true},difficulty:{value:'simple',certainty:5},mastery:2}}
];
const NEW_TECH=[{dps:2,bg:3,sauv:3,tech:3},{bg:3,sauv:3,solo:1,tech:3}];
const compact=r=>r.results.map(x=>[x.spec.classId,x.spec.id,x.score]);
function guide(p){
 const r=E.recommend(p);
 return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r),top:r.top.map(x=>x.spec.id),uncertain:r.uncertain,
  scenarios:r.scenarios.map(x=>[x.name,x.status,x.top]),sansFamilier:r.results.filter(x=>x.spec.variant==='sans-familier').map(x=>x.spec.id)};
}
const tech=weights=>({weights,context:E.techContext(E.sanitizeWeights(weights)),levels:[0,1,2,3].map(mastery=>({mastery,results:compact(E.priorityRanking(weights,mastery))}))});
function snapshot(){
 const next=structuredClone(v11);
 next.info={...v11.info,engineVersion:E.version,revision:12,previousReference:'moteur-reference-v11.json',decision:DECISION};
 next.petlessComplexity=Object.fromEntries(Object.entries(E.petless).map(([id,s])=>[id,{complexity:s.complexity,load:s.load}]));
 next.guide=v11.guide.map(c=>({...c,...guide(c.profile)})).concat(NEW_CASES.map(c=>({...c,...guide(c.profile)})));
 for(const c of next.priorities)for(const l of c.levels)l.results=compact(E.priorityRanking(v11.matrix.presets[c.id],l.mastery));
 for(const l of next.isolatedRoles)for(const c of l.axes)c.results=compact(E.priorityRanking({[c.axis]:3},l.mastery));
 for(const c of next.mixed)for(const l of c.levels)l.results=compact(E.priorityRanking(c.weights,l.mastery));
 next.technicite=v11.technicite.map(t=>tech(t.weights)).concat(NEW_TECH.map(tech));
 return next;
}
// Restent identiques : à la maîtrise Confirmé, un profil guidé qui ne combine pas « sans familier » et
// difficulté ; un classement personnalisé sans technicité.
const neutralGuide=p=>(p.mastery===undefined||p.mastery===2)&&!(p.pet&&p.pet.value==='avoid'&&p.difficulty&&p.difficulty.value!=='any');
function compare(before,after){
 for(const field of ['matrix','specs','petless','heal','referenceVariants'])assert.deepEqual(after[field],before[field],field+' doit rester inchangé');
 const changedTop=[],changedFirst=[];let unchangedNeutral=0;
 for(const a of before.guide){
  const b=after.guide.find(x=>x.id===a.id);assert.ok(b,a.id);
  for(const field of ['status','compatible','used','uncertain','profile'])assert.deepEqual(b[field],a[field],a.id+'/'+field);
  if(neutralGuide(a.profile)){assert.deepEqual(b.results,a.results,a.id+' : rien ne doit changer');unchangedNeutral++;}
  if(JSON.stringify(a.top)!==JSON.stringify(b.top))changedTop.push({id:a.id,avant:a.top,apres:b.top});
  if(a.top[0]!==b.top[0])changedFirst.push({id:a.id,avant:a.top[0],apres:b.top[0]});
 }
 assert.equal(after.guide.length,before.guide.length+NEW_CASES.length);
 let personal=0,personalTop3=0,personalNeutral=0;
 const ids=r=>JSON.stringify(r.slice(0,3).map(x=>x[1]));
 const visit=(weights,mastery,x,y)=>{personal++;if(ids(x)!==ids(y))personalTop3++;
  if(mastery===2&&!weights.tech){assert.deepEqual(y,x,JSON.stringify(weights)+' : sans technicité, à la maîtrise de référence');personalNeutral++;}};
 for(const c of before.priorities)for(const l of c.levels)visit(before.matrix.presets[c.id],l.mastery,l.results,after.priorities.find(x=>x.id===c.id).levels.find(x=>x.mastery===l.mastery).results);
 for(const l of before.isolatedRoles)for(const c of l.axes)visit({[c.axis]:3},l.mastery,c.results,after.isolatedRoles.find(x=>x.mastery===l.mastery).axes.find(x=>x.axis===c.axis).results);
 for(const c of before.mixed)for(const l of c.levels)visit(c.weights,l.mastery,l.results,after.mixed.find(x=>JSON.stringify(x.weights)===JSON.stringify(c.weights)).levels.find(x=>x.mastery===l.mastery).results);
 for(const t of before.technicite)for(const l of t.levels)visit(t.weights,l.mastery,l.results,after.technicite.find(x=>JSON.stringify(x.weights)===JSON.stringify(t.weights)).levels.find(x=>x.mastery===l.mastery).results);
 const contexts=before.technicite.map(t=>[JSON.stringify(t.weights),t.context,after.technicite.find(x=>JSON.stringify(x.weights)===JSON.stringify(t.weights)).context]).filter(x=>x[1]!==x[2]);
 return {version:E.version,decision:DECISION,existingGuideCases:before.guide.length,changedTop3:changedTop.length,changedFirst:changedFirst.length,changedTop,changedFirstList:changedFirst,
  unchangedNeutralGuideCases:unchangedNeutral,personalCases:personal,personalChangedTop3:personalTop3,personalNeutralUnchanged:personalNeutral,techContextChanges:contexts,
  newCases:after.guide.slice(before.guide.length).map(c=>({id:c.id,top:c.top}))};
}
if(require.main===module){
 const args=process.argv.slice(2),i=args.indexOf('--fixture'),file=i>=0?args.splice(i,2)[1]:null;
 const next=snapshot(),report=compare(v11,next);
 if(file)fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n',{flag:'wx'});
 if(args[0])fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({existing:report.existingGuideCases,changedTop3:report.changedTop3,changedFirst:report.changedFirst,unchangedNeutral:report.unchangedNeutralGuideCases,
  personal:report.personalCases,personalChangedTop3:report.personalChangedTop3,personalNeutralUnchanged:report.personalNeutralUnchanged,techContextChanges:report.techContextChanges,
  changedFirstList:report.changedFirstList,newCases:report.newCases},null,1));
}
module.exports={snapshot,compare,NEW_CASES,NEW_TECH,DECISION,neutralGuide};
