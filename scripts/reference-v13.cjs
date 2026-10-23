'use strict';
// Référence v13 (moteur 1.3.0). Sur chaque critère que portent les spécialisations, la note d'une classe est celle
// de sa meilleure spécialisation : 27 notes de la matrice changent, et la référence de rôle du moteur suit (Druide
// DPS 3→4). Rejoue chaque cas de la v12 avec le moteur actuel et vérifie ce qui peut changer : seuls les classements
// qui demandent le rôle DPS. L'écriture d'une nouvelle photographie est explicite (--fixture), sans écrasement
// possible. Aucune ancienne fixture n'est modifiée.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),v12=require('../tests/fixtures/moteur-reference-v12.json');
const DECISION='Décision du responsable du projet, 23 octobre 2026 : sur chaque critère que portent les spécialisations, la note d’une classe est celle de sa meilleure spécialisation, '+
 'comme l’annonce le tableau des notes. 27 notes de classe changent (25 montent, l’Utilité du Chasseur et du Voleur baisse) ; Polyvalence, Technicité et les rôles qu’aucune '+
 'spécialisation ne tient restent des notes de classe. La référence de rôle du moteur suit : Druide DPS 3→4 (Farouche félin, 73 % du meilleur DPS simulé). '+
 'Aucune note de configuration ni aucun coefficient modifié.';
// [classe, critère, note v12, note v13], dans l'ordre des classes et des critères du tableau.
const CHANGES=[
 ['guerrier','sauv',2,3],['guerrier','burst',4,5],['guerrier','surv',3,5],
 ['chasseur','burst',4,5],['chasseur','ctrl',3,4],['chasseur','util',3,2],
 ['voleur','bg',3,4],['voleur','zone',2,3],['voleur','surv',2,3],['voleur','mob',4,5],['voleur','util',2,1],
 ['pretre','surv',3,4],['pretre','util',4,5],
 ['chaman','bg',4,5],['chaman','ctrl',2,3],['chaman','surv',3,4],
 ['mage','bg',4,5],['mage','sauv',3,5],['mage','surv',2,3],
 ['demoniste','surv',4,5],['demoniste','solo',4,5],
 ['druide','dps',3,4],['druide','bg',4,5],['druide','burst',4,5],['druide','ctrl',2,3],['druide','surv',4,5],['druide','solo',3,4]
];
const NEW_CASES=[
 {id:'v13-dps-melee-mobile',profile:{roles:{dps:5},range:{value:'melee',certainty:4},styles:{mob:5,surv:4}}},
 {id:'v13-dps-solo-melee',profile:{roles:{dps:5},activities:{solo:5},range:{value:'melee',certainty:5}}}
];
const NEW_MIXED=[{dps:3,mob:3,surv:2}];
const compact=r=>r.results.map(x=>[x.spec.classId,x.spec.id,x.score]);
function guide(p){
 const r=E.recommend(p);
 return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r),top:r.top.map(x=>x.spec.id),uncertain:r.uncertain,
  scenarios:r.scenarios.map(x=>[x.name,x.status,x.top]),sansFamilier:r.results.filter(x=>x.spec.variant==='sans-familier').map(x=>x.spec.id)};
}
function page(){
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 return JSON.parse(html.match(/window\.__WF = (\{.*?\});\s*<\/script>/s)[1]);
}
const levels=(weights,masteries)=>masteries.map(mastery=>({mastery,results:compact(E.priorityRanking(weights,mastery))}));
function snapshot(){
 const next=structuredClone(v12),D=page();
 next.info={...v12.info,engineVersion:E.version,revision:13,previousReference:'moteur-reference-v12.json',decision:DECISION};
 next.matrix.classes=D.classes.map(c=>({id:c.id,r:c.r}));
 next.guide=v12.guide.map(c=>({...c,...guide(c.profile)})).concat(NEW_CASES.map(c=>({...c,...guide(c.profile)})));
 for(const c of next.priorities)for(const l of c.levels)l.results=compact(E.priorityRanking(v12.matrix.presets[c.id],l.mastery));
 for(const l of next.isolatedRoles)for(const c of l.axes)c.results=compact(E.priorityRanking({[c.axis]:3},l.mastery));
 for(const c of next.mixed)for(const l of c.levels)l.results=compact(E.priorityRanking(c.weights,l.mastery));
 next.mixed=next.mixed.concat(NEW_MIXED.map(weights=>({weights,levels:levels(weights,v12.mixed[0].levels.map(l=>l.mastery))})));
 for(const t of next.technicite)for(const l of t.levels)l.results=compact(E.priorityRanking(t.weights,l.mastery));
 return next;
}
// Restent identiques : un profil guidé qui ne demande pas le rôle DPS ; un classement personnalisé sans poids DPS.
const neutralGuide=p=>!(p.roles&&p.roles.dps>0);
const neutralWeights=w=>!(w.dps>0);
function compare(before,after){
 for(const field of ['specs','petless','heal','referenceVariants','petlessComplexity'])assert.deepEqual(after[field],before[field],field+' doit rester inchangé');
 assert.deepEqual(after.matrix.axes,before.matrix.axes);assert.deepEqual(after.matrix.presets,before.matrix.presets);
 const matrixChanges=[];
 for(const c of before.matrix.classes){const r=after.matrix.classes.find(x=>x.id===c.id).r;for(const k of before.matrix.axes)if(r[k]!==c.r[k])matrixChanges.push([c.id,k,c.r[k],r[k]]);}
 assert.deepEqual(matrixChanges,CHANGES,'seules les 27 notes décidées changent');
 const changedTop=[],changedResults=[];let unchangedNeutral=0;
 for(const a of before.guide){
  const b=after.guide.find(x=>x.id===a.id);assert.ok(b,a.id);
  for(const field of ['status','compatible','used','uncertain','profile'])assert.deepEqual(b[field],a[field],a.id+'/'+field);
  if(neutralGuide(a.profile)){assert.deepEqual(b.results,a.results,a.id+' : sans rôle DPS, rien ne doit changer');unchangedNeutral++;}
  if(JSON.stringify(a.results)!==JSON.stringify(b.results))changedResults.push(a.id);
  if(JSON.stringify(a.top)!==JSON.stringify(b.top))changedTop.push({id:a.id,avant:a.top,apres:b.top});
 }
 assert.equal(after.guide.length,before.guide.length+NEW_CASES.length);
 let personal=0,personalChanged=0,personalNeutral=0;const personalTop3=[];
 const ids=r=>r.slice(0,3).map(x=>x[1]);
 const visit=(label,weights,mastery,x,y)=>{personal++;
  if(JSON.stringify(x)!==JSON.stringify(y))personalChanged++;
  if(JSON.stringify(ids(x))!==JSON.stringify(ids(y)))personalTop3.push({cas:label,maitrise:mastery,avant:ids(x),apres:ids(y)});
  if(neutralWeights(weights)){assert.deepEqual(y,x,JSON.stringify(weights)+' : sans poids DPS, rien ne doit changer');personalNeutral++;}};
 for(const c of before.priorities)for(const l of c.levels)visit('préréglage '+c.id,before.matrix.presets[c.id],l.mastery,l.results,after.priorities.find(x=>x.id===c.id).levels.find(x=>x.mastery===l.mastery).results);
 for(const l of before.isolatedRoles)for(const c of l.axes)visit('rôle '+c.axis,{[c.axis]:3},l.mastery,c.results,after.isolatedRoles.find(x=>x.mastery===l.mastery).axes.find(x=>x.axis===c.axis).results);
 for(const c of before.mixed)for(const l of c.levels)visit(JSON.stringify(c.weights),c.weights,l.mastery,l.results,after.mixed.find(x=>JSON.stringify(x.weights)===JSON.stringify(c.weights)).levels.find(x=>x.mastery===l.mastery).results);
 for(const t of before.technicite)for(const l of t.levels)visit(JSON.stringify(t.weights),t.weights,l.mastery,l.results,after.technicite.find(x=>JSON.stringify(x.weights)===JSON.stringify(t.weights)).levels.find(x=>x.mastery===l.mastery).results);
 assert.equal(after.mixed.length,before.mixed.length+NEW_MIXED.length);
 return {version:E.version,decision:DECISION,matrixChanges:matrixChanges.length,existingGuideCases:before.guide.length,guideResultsChanged:changedResults,
  changedTop3:changedTop.length,changedTop,unchangedNeutralGuideCases:unchangedNeutral,personalCases:personal,personalChanged,personalNeutralUnchanged:personalNeutral,
  personalChangedTop3:personalTop3.length,personalTop3,newCases:after.guide.slice(before.guide.length).map(c=>({id:c.id,top:c.top})),
  newMixed:after.mixed.slice(before.mixed.length).map(c=>({weights:c.weights,top:c.levels.map(l=>[l.mastery,ids(l.results)])}))};
}
if(require.main===module){
 const args=process.argv.slice(2),i=args.indexOf('--fixture'),file=i>=0?args.splice(i,2)[1]:null;
 const next=snapshot(),report=compare(v12,next);
 if(file)fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n',{flag:'wx'});
 if(args[0])fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({matrixChanges:report.matrixChanges,existing:report.existingGuideCases,guideResultsChanged:report.guideResultsChanged.length,changedTop3:report.changedTop3,
  unchangedNeutral:report.unchangedNeutralGuideCases,personal:report.personalCases,personalChanged:report.personalChanged,personalNeutralUnchanged:report.personalNeutralUnchanged,
  personalChangedTop3:report.personalChangedTop3,personalTop3:report.personalTop3,newCases:report.newCases,newMixed:report.newMixed},null,1));
}
module.exports={snapshot,compare,CHANGES,NEW_CASES,NEW_MIXED,DECISION,neutralGuide,neutralWeights};
