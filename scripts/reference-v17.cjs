'use strict';
// Révision DONNEES du 4 novembre : photographie nouvelle, anciennes références immuables.
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict'),crypto=require('node:crypto');
const E=require('../recommendation-engine.js'),before=require('../tests/fixtures/moteur-reference-v16.json');
const BASE_COMMIT='583a8cbe7d84f68f926103f7abde0d7af9e66a37';
const DECISION='Révision DONNEES autorisée le 4 novembre 2026 après les notes officielles du 2 novembre, '+
 'les données du client et des hotfixes du 3 novembre et les rapports MythicSim du 4 novembre. '+
 'Les décisions documentées révisent les repères DPS, plusieurs jugements de kit et composantes de difficulté, '+
 'leurs variantes sans familier et les valeurs dérivées de la matrice. '+
 'Formules, barèmes, coefficients, pondérations, identités, sauvegardes et anciennes références conservés.';
const NEW_CASES=[
 {id:'v17-affliction-sans-familier',profile:{roles:{dps:5},rolesStrict:true,activities:{raid:5},range:{value:'distance',certainty:5,strict:true},pet:{value:'avoid',certainty:5,strict:true},styles:{ctrl:5,support:3},mastery:2}},
 {id:'v17-paladin-tank-pvp',profile:{roles:{tank:5},rolesStrict:true,activities:{bg:5,world:3},styles:{surv:5,mob:4},mastery:1}},
 {id:'v17-dps-pve-accessible',profile:{roles:{dps:5},rolesStrict:true,activities:{raid:5},difficulty:{value:'simple',certainty:5},styles:{zone:3},pet:{value:'avoid',certainty:4,strict:false},mastery:0}}
];
const SPEC_CHANGES=[
 ["paladin-vindicte","activity.raid",3,4],
 ["chasseur-precision","activity.raid",3,4],
 ["voleur-finesse","activity.raid",3,4],
 ["chaman-elementaire","activity.raid",2,3],
 ["chaman-amelioration","activity.raid",3,4],
 ["mage-arcane","activity.raid",3,4],
 ["demoniste-destruction","activity.raid",3,4],
 ["druide-farouche-chat","activity.raid",3,4],
 ["paladin-protection","activity.solo",5,4],
 ["mage-givre","activity.solo",3,4],
 ["voleur-assassinat","style.ctrl",5,4],
 ["chaman-elementaire","style.burst",5,4],
 ["demoniste-destruction","style.support",2,3],
 ["guerrier-fureur","load.pve",3,4],
 ["paladin-sacre","load.pve",2,3],
 ["voleur-assassinat","load.pve",2,3],
 ["voleur-combat","load.pve",2,3],
 ["chaman-amelioration","load.pve",3,4],
 ["paladin-sacre","load.pvp",2,3],
 ["paladin-protection","load.pvp",2,3],
 ["paladin-vindicte","load.pvp",3,4],
 ["guerrier-armes","complexity.pve.4",1,2],
 ["guerrier-fureur","complexity.pve.4",0,2],
 ["paladin-sacre","complexity.pve.0",0,1],
 ["paladin-sacre","complexity.pvp.1",1,2],
 ["paladin-protection","complexity.pvp.1",1,2],
 ["paladin-vindicte","complexity.pvp.1",1,2],
 ["voleur-assassinat","complexity.pve.3",0,1],
 ["voleur-combat","complexity.pve.0",0,2],
 ["voleur-combat","complexity.pve.3",0,1],
 ["chaman-amelioration","complexity.pve.0",1,2],
 ["chaman-restauration","complexity.pve.1",1,2],
 ["mage-arcane","complexity.pve.0",1,2],
 ["demoniste-destruction","complexity.pve.1",1,2],
 ["druide-equilibre","complexity.pve.0",0,1],
 ["guerrier-armes","style.burst",5,4]
];
const MATRIX_CHANGES=[
 ["guerrier","r.burst",5,4],
 ["paladin","r.dps",3,4],
 ["paladin","r.solo",5,4],
 ["voleur","r.dps",3,4],
 ["chaman","r.dps",3,4],
 ["mage","r.solo",3,4],
 ["druide","r.dps",3,4]
];
const PETLESS_CHANGES=[
 ["demoniste-affliction","raid",null,[3,4]]
];
const PETLESS_COMPLEXITY_CHANGES=[
 ["demoniste-destruction","complexity.pve.1",1,2],
 ["demoniste-destruction","load.pve",2,3]
];
const PETLESS_EFFECTIVE_CHANGES=[
 ["chasseur-precision","activity.raid",3,4],
 ["demoniste-affliction","activity.raid",3,4],
 ["demoniste-destruction","activity.raid",3,4],
 ["demoniste-destruction","style.support",2,3],
 ["demoniste-destruction","complexity.pve.1",1,2],
 ["demoniste-destruction","load.pve",2,3]
];
const compact=r=>r.results.map(x=>[x.spec.classId,x.spec.id,x.score]);
function guide(profile){
 const r=E.recommend(profile);
 return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r),top:r.top.map(x=>x.spec.id),
  uncertain:r.uncertain,scenarios:r.scenarios.map(x=>[x.name,x.status,x.top]),
  sansFamilier:r.results.filter(x=>x.spec.variant==='sans-familier').map(x=>x.spec.id)};
}
function matrix(){
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const match=html.match(/window\.__WF = (\{.*?\});\s*<\/script>/s);assert.ok(match,'Matrice exposée dans index.html');
 const data=JSON.parse(match[1]);
 return {axes:data.axes,classes:data.classes.map(c=>({id:c.id,r:c.r})),presets:data.presets};
}
function petlessDifferences(){
 return Object.fromEntries(Object.entries(E.petless).map(([id,variant])=>{
  const base=E.specs.find(s=>s.id===id),diff={};
  for(const part of ['activity','style'])for(const key of Object.keys(base[part]))
   if(base[part][key]!==variant[part][key])diff[key]=[base[part][key],variant[part][key]];
  return [id,diff];
 }));
}
function snapshot(){
 assert.equal(E.version,'1.7.0-exploratoire','Générer seulement après application complète de la révision v17');
 const next=structuredClone(before);
 next.info={...before.info,revision:17,sourceMainCommit:BASE_COMMIT,engineVersion:E.version,
  previousReference:'moteur-reference-v16.json',decision:DECISION};
 next.matrix=matrix();next.specs=structuredClone(E.specs);
 next.petless=petlessDifferences();
 next.heal=Object.fromEntries(E.specs.filter(s=>s.heal).map(s=>[s.id,structuredClone(s.heal)]));
 next.referenceVariants=structuredClone(E.referenceVariants);
 next.petlessComplexity=Object.fromEntries(Object.entries(E.petless).map(([id,s])=>[id,{complexity:structuredClone(s.complexity),load:structuredClone(s.load)}]));
 next.priorityAxes=E.priorityAxes.slice();
 next.guide=before.guide.map(c=>({...c,...guide(c.profile)})).concat(NEW_CASES.map(c=>({...c,...guide(c.profile)})));
 for(const c of next.priorities)for(const level of c.levels)level.results=compact(E.priorityRanking(c.weights,level.mastery));
 for(const level of next.isolatedRoles)for(const c of level.axes)c.results=compact(E.priorityRanking({[c.axis]:3},level.mastery));
 for(const field of ['mixed','technicite'])for(const c of next[field])for(const level of c.levels)level.results=compact(E.priorityRanking(c.weights,level.mastery));
 return next;
}
function differences(a,b,prefix='',allowMissing=false){
 if(a===b)return [];
 if(a&&b&&typeof a==='object'&&typeof b==='object'){
  if(!allowMissing)assert.deepEqual(Object.keys(b).sort(),Object.keys(a).sort(),prefix+' : structure conservée');
  const keys=allowMissing?[...new Set(Object.keys(a).concat(Object.keys(b)))]:Object.keys(a);
  return keys.flatMap(k=>differences(a[k],b[k],prefix?prefix+'.'+k:k,allowMissing));
 }
 return [[prefix,a===undefined?null:a,b===undefined?null:b]];
}
function effectivePetless(reference){
 return Object.fromEntries(Object.entries(reference.petless).map(([id,overrides])=>{
  const base=reference.specs.find(spec=>spec.id===id);assert.ok(base,id);
  const variant=structuredClone(base);variant.variant='sans-familier';
  for(const [key,pair] of Object.entries(overrides)){
   const section=Object.hasOwn(base.activity,key)?'activity':'style';
   assert.ok(Object.hasOwn(base[section],key),id+'/'+key);
   assert.equal(pair[0],base[section][key],id+'/'+key+' : base de la variante cohérente');
   variant[section][key]=pair[1];
  }
  variant.complexity=structuredClone(reference.petlessComplexity[id].complexity);
  variant.load=structuredClone(reference.petlessComplexity[id].load);
  return [id,variant];
 }));
}
const order=rows=>rows.slice().sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b),'en'));
function compare(previous,next){
 assert.equal(previous.info.revision,16);assert.equal(next.info.revision,17);
 assert.equal(next.info.engineVersion,'1.7.0-exploratoire');
 const specChanges=previous.specs.flatMap(a=>{
  const b=next.specs.find(b=>b.id===a.id);assert.ok(b,a.id);
  return differences(a,b).map(d=>[a.id,...d]);
 });
 assert.equal(next.specs.length,previous.specs.length);
 assert.deepEqual(order(specChanges),order(SPEC_CHANGES),'Seules les différences spécialisées validées sont admises');
 const matrixChanges=previous.matrix.classes.flatMap(a=>{
  const b=next.matrix.classes.find(b=>b.id===a.id);assert.ok(b,a.id);
  return differences(a,b).map(d=>[a.id,...d]);
 });
 assert.equal(next.matrix.classes.length,previous.matrix.classes.length);
 assert.deepEqual(order(matrixChanges),order(MATRIX_CHANGES),'Seules les cellules dérivées validées sont admises');
 assert.deepEqual(next.matrix.axes,previous.matrix.axes);assert.deepEqual(next.matrix.presets,previous.matrix.presets);
 const petlessChanges=differences(previous.petless,next.petless,'',true).map(([key,a,b])=>{
  const dot=key.indexOf('.');return [key.slice(0,dot),key.slice(dot+1),a,b];
 });
 assert.deepEqual(order(petlessChanges),order(PETLESS_CHANGES),'Seuls les écarts sans familier validés sont admis');
 const petlessComplexityChanges=Object.keys(previous.petlessComplexity).flatMap(id=>
  differences(previous.petlessComplexity[id],next.petlessComplexity[id]).map(change=>[id,...change]));
 assert.deepEqual(order(petlessComplexityChanges),order(PETLESS_COMPLEXITY_CHANGES),'Seules les difficultés sans familier validées sont admises');
 const previousPetless=effectivePetless(previous),nextPetless=effectivePetless(next);
 const petlessEffectiveChanges=Object.keys(previousPetless).flatMap(id=>
  differences(previousPetless[id],nextPetless[id]).map(change=>[id,...change]));
 assert.deepEqual(order(petlessEffectiveChanges),order(PETLESS_EFFECTIVE_CHANGES),'Seules les variantes effectives validées sont admises');
 for(const field of ['heal','referenceVariants','priorityAxes'])assert.deepEqual(next[field],previous[field],field+' inchangé');
 const affected=new Set(SPEC_CHANGES.concat(PETLESS_EFFECTIVE_CHANGES).filter(c=>!c[1].startsWith('complexity.')).map(c=>c[0]));
 const changedGuide=[],unchangedGuide=[],changedPriority=[],unchangedPriority=[];
 function rows(id,a,b){
  assert.deepEqual(b.map(x=>x[1]).sort(),a.map(x=>x[1]).sort(),id+' : mêmes configurations');
  for(const row of a)if(!affected.has(row[1]))assert.equal(b.find(x=>x[1]===row[1])[2],row[2],id+'/'+row[1]+' : score inchangé hors données révisées');
  return JSON.stringify(a)!==JSON.stringify(b);
 }
 for(const a of previous.guide){
  const b=next.guide.find(b=>b.id===a.id);assert.ok(b,a.id);
  for(const key of ['profile','status','compatible','used','uncertain'])assert.deepEqual(b[key],a[key],a.id+'/'+key);
  const variantChangedIds=new Set(PETLESS_EFFECTIVE_CHANGES.map(change=>change[0]));
  assert.deepEqual(b.sansFamilier.filter(id=>!variantChangedIds.has(id)).sort(),a.sansFamilier.filter(id=>!variantChangedIds.has(id)).sort(),a.id+' : mêmes variantes hors données révisées');
  for(const id of b.sansFamilier)assert.ok(Object.hasOwn(next.petless,id),a.id+' : variante connue '+id);
  if(rows(a.id,a.results,b.results))changedGuide.push({id:a.id,before:a.top,after:b.top,firstChanged:a.top[0]!==b.top[0]});
  else unchangedGuide.push(a.id);
 }
 assert.deepEqual(next.guide.map(c=>c.id),previous.guide.map(c=>c.id).concat(NEW_CASES.map(c=>c.id)));
 function visit(id,w,m,a,b){
  if(rows(id+'/'+m,a,b))changedPriority.push({id,weights:w,mastery:m,before:a.slice(0,3).map(x=>x[1]),after:b.slice(0,3).map(x=>x[1]),firstChanged:a[0]?.[1]!==b[0]?.[1]});
  else unchangedPriority.push({id,mastery:m});
 }
 assert.equal(next.priorities.length,previous.priorities.length);
 for(const a of previous.priorities){
  const b=next.priorities.find(c=>c.id===a.id);assert.ok(b,a.id);assert.deepEqual(b.weights,a.weights);
  assert.deepEqual(b.levels.map(l=>l.mastery),a.levels.map(l=>l.mastery));
  for(const l of a.levels)visit(a.id,a.weights,l.mastery,l.results,b.levels.find(x=>x.mastery===l.mastery).results);
 }
 assert.equal(next.isolatedRoles.length,previous.isolatedRoles.length);
 for(const l of previous.isolatedRoles){
  const b=next.isolatedRoles.find(x=>x.mastery===l.mastery);assert.ok(b);assert.deepEqual(b.axes.map(c=>c.axis),l.axes.map(c=>c.axis));
  for(const a of l.axes)visit('isolé/'+a.axis,{[a.axis]:3},l.mastery,a.results,b.axes.find(x=>x.axis===a.axis).results);
 }
 for(const field of ['mixed','technicite']){
  assert.equal(next[field].length,previous[field].length,field+' : tous les cas conservés');
  for(let i=0;i<previous[field].length;i++){
   const a=previous[field][i],b=next[field][i];assert.deepEqual(b.weights,a.weights);
   if('context' in a)assert.equal(b.context,a.context);
   assert.deepEqual(b.levels.map(l=>l.mastery),a.levels.map(l=>l.mastery));
   for(const l of a.levels)visit(field+'/'+i,a.weights,l.mastery,l.results,b.levels.find(x=>x.mastery===l.mastery).results);
  }
 }
 return {version:next.info.engineVersion,decision:DECISION,specChanges,matrixChanges,petlessChanges,petlessComplexityChanges,petlessEffectiveChanges,
  guideCases:previous.guide.length,changedGuide,unchangedGuide,
  priorityCases:changedPriority.length+unchangedPriority.length,changedPriority,unchangedPriority,
  newCases:NEW_CASES.map(c=>({id:c.id,top:next.guide.find(x=>x.id===c.id).top}))};
}
function formulaFingerprint(source){
 let text=source.replace(/\r\n/g,'\n');
 for(const [name,end] of [['rows','\\]'],['COMPLEXITY','\\}'],['ROLE_REFERENCE','\\}'],['PETLESS','\\}']]){
  const pattern=new RegExp('var '+name+'=[\\s\\S]*?\\n'+end+';');
  assert.ok(pattern.test(text),'Déclaration de données attendue : '+name);
  text=text.replace(pattern,'var '+name+'=DONNEES;');
 }
 text=text.replace(/version:'[^']*'/g,"version:'REFERENCE'")
  .replace(/\/\*[\s\S]*?\*\//g,'').replace(/^\s*\/\/.*$/gm,'').replace(/\s+/g,'');
 return crypto.createHash('sha256').update(text).digest('hex');
}
if(require.main===module){
 const args=process.argv.slice(2),i=args.indexOf('--fixture');let file=null;
 if(i>=0){assert.ok(args[i+1]&&!args[i+1].startsWith('--'),'--fixture exige le chemin de la nouvelle référence');file=args.splice(i,2)[1];}
 assert.ok(args.length<=1,'Au plus un chemin de rapport, en plus de --fixture');
 if(file)assert.equal(path.basename(file),'moteur-reference-v17.json','Écriture limitée à la nouvelle référence v17');
 const next=snapshot(),report=compare(before,next);
 if(file)fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n',{flag:'wx'});
 if(args[0])fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({version:report.version,specChanges:report.specChanges.length,matrixChanges:report.matrixChanges.length,
  guideCases:report.guideCases,changedGuide:report.changedGuide.length,changedGuideFirst:report.changedGuide.filter(c=>c.firstChanged).length,
  priorityCases:report.priorityCases,changedPriority:report.changedPriority.length,changedPriorityFirst:report.changedPriority.filter(c=>c.firstChanged).length,
  newCases:report.newCases},null,2));
}
module.exports={snapshot,compare,effectivePetless,formulaFingerprint,BASE_COMMIT,DECISION,NEW_CASES,SPEC_CHANGES,MATRIX_CHANGES,PETLESS_CHANGES,PETLESS_COMPLEXITY_CHANGES,PETLESS_EFFECTIVE_CHANGES};
