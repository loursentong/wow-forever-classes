'use strict';
// Référence v11 (moteur 1.1.0). Rejoue chaque cas de la v10 avec le moteur actuel et vérifie ce qui peut
// changer : la difficulté d'exécution suit désormais le référentiel de complexité. L'écriture d'une
// nouvelle photographie est explicite (--fixture), sans écrasement possible. Aucune ancienne fixture
// n'est modifiée.
const fs=require('node:fs'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),v10=require('../tests/fixtures/moteur-reference-v10.json');
const DECISION='Décision du responsable du projet, 22 octobre 2026 : la difficulté d’exécution PvE et PvP de chaque spécialisation suit le référentiel de complexité '+
 '(cinq composantes par contexte, de 0 à 2 points ; total sur 10 : 0–2 → 1, 3–4 → 2, 5–6 → 3, 7–8 → 4, 9–10 → 5). Elle remplace l’ancienne charge partout : '+
 'difficulté souhaitée, technicité et effet de la maîtrise. Survie est notée sur son jeu de référence, en alternance tir-mêlée (4/5 en PvE). '+
 'Les activités mêlées gardent la moyenne PvE et PvP. Aucune autre note ni aucun coefficient modifié.';
// Nouveaux cas : la difficulté recherchée en PvE ou en PvP, et l'effet de la maîtrise.
const NEW_CASES=[
 {id:'v11-dps-raid-accessible',profile:{roles:{dps:5},activities:{raid:5},difficulty:{value:'simple',certainty:5},mastery:2}},
 {id:'v11-distance-pvp-exigeant',profile:{activities:{bg:5,world:5},range:{value:'distance',certainty:4},difficulty:{value:'complex',certainty:5},mastery:2}},
 {id:'v11-dps-raid-debutant',profile:{roles:{dps:5},activities:{raid:5},mastery:0}},
 {id:'v11-tank-accessible',profile:{roles:{tank:5},activities:{raid:4},difficulty:{value:'simple',certainty:4},mastery:2}}
];
// Les seules données changées : la charge d'exécution, et la grille qui la fonde.
const LOADS={
 'guerrier-armes':{pve:[2,4]},'guerrier-fureur':{pvp:[3,4]},'guerrier-protection':{pve:[3,4]},
 'paladin-protection':{pve:[2,3]},'paladin-vindicte':{pve:[2,1],pvp:[2,3]},
 'chasseur-maitrise-betes':{pve:[1,2],pvp:[2,4]},'chasseur-precision':{pvp:[3,4]},'chasseur-survie':{pvp:[3,4]},
 'voleur-assassinat':{pve:[3,2]},'voleur-combat':{pvp:[3,4]},'voleur-finesse':{pve:[3,4]},
 'pretre-discipline':{pve:[3,4]},'pretre-ombre':{pve:[3,2]},
 'chaman-elementaire':{pvp:[3,4]},'chaman-restauration':{pve:[2,3]},
 'mage-arcane':{pvp:[4,3]},'mage-feu':{pve:[3,2],pvp:[4,3]},
 'demoniste-affliction':{pvp:[3,4]},'demoniste-demonologie':{pve:[3,4]},
 'druide-equilibre':{pve:[3,2]},'druide-farouche-chat':{pvp:[5,4]},'druide-farouche-ours':{pve:[4,2],pvp:[5,3]}
};
const compact=r=>r.results.map(x=>[x.spec.classId,x.spec.id,x.score]);
function guide(p){
 const r=E.recommend(p);
 return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r),top:r.top.map(x=>x.spec.id),uncertain:r.uncertain,
  scenarios:r.scenarios.map(x=>[x.name,x.status,x.top]),sansFamilier:r.results.filter(x=>x.spec.variant==='sans-familier').map(x=>x.spec.id)};
}
function snapshot(){
 const next=structuredClone(v10);
 next.info={...v10.info,engineVersion:E.version,revision:11,previousReference:'moteur-reference-v10.json',decision:DECISION};
 next.specs=JSON.parse(JSON.stringify(E.specs));
 next.guide=v10.guide.map(c=>({...c,...guide(c.profile)})).concat(NEW_CASES.map(c=>({...c,...guide(c.profile)})));
 for(const c of next.priorities)for(const l of c.levels)l.results=compact(E.priorityRanking(v10.matrix.presets[c.id],l.mastery));
 for(const l of next.isolatedRoles)for(const c of l.axes)c.results=compact(E.priorityRanking({[c.axis]:3},l.mastery));
 for(const c of next.mixed)for(const l of c.levels)l.results=compact(E.priorityRanking(c.weights,l.mastery));
 for(const t of next.technicite)for(const l of t.levels)l.results=compact(E.priorityRanking(t.weights,l.mastery));
 return next;
}
// Sans préférence de difficulté et à la maîtrise de référence (Confirmé), la charge n'intervient pas.
const neutralGuide=p=>(!p.difficulty||p.difficulty.value==='any')&&(p.mastery===undefined||p.mastery===2);
function compare(before,after){
 for(const field of ['matrix','petless','heal','referenceVariants'])assert.deepEqual(after[field],before[field],field+' doit rester inchangé');
 // Spécialisations : seules la charge et sa grille changent, et seulement là où la décision le dit.
 assert.deepEqual(after.specs.map(s=>s.id),before.specs.map(s=>s.id));
 const loadChanges={};
 for(const b of before.specs){
  const a=after.specs.find(s=>s.id===b.id),{load:la,complexity,...restA}=a,{load:lb,...restB}=b;
  assert.deepEqual(restA,restB,b.id+' : seules la charge et la grille changent');
  assert.ok(complexity&&complexity.pve.length===5&&complexity.pvp.length===5,b.id);
  for(const c of ['pve','pvp'])if(la[c]!==lb[c])(loadChanges[b.id]=loadChanges[b.id]||{})[c]=[lb[c],la[c]];
 }
 assert.deepEqual(loadChanges,LOADS,'charges changées');
 const changedTop=[],changedFirst=[];let unchangedNeutral=0;
 for(const a of before.guide){
  const b=after.guide.find(x=>x.id===a.id);assert.ok(b,a.id);
  for(const field of ['status','compatible','used','uncertain','profile'])assert.deepEqual(b[field],a[field],a.id+'/'+field);
  if(neutralGuide(a.profile)){assert.deepEqual(b.results,a.results,a.id+' : sans préférence de difficulté, à la maîtrise de référence, rien ne change');unchangedNeutral++;}
  if(JSON.stringify(a.top)!==JSON.stringify(b.top))changedTop.push({id:a.id,avant:a.top,apres:b.top});
  if(a.top[0]!==b.top[0])changedFirst.push({id:a.id,avant:a.top[0],apres:b.top[0]});
 }
 assert.equal(after.guide.length,before.guide.length+NEW_CASES.length);
 // Mode personnalisé : à la maîtrise de référence et sans technicité, rien ne change.
 let personal=0,personalTop3=0,personalNeutral=0;const sameTop3=(x,y)=>JSON.stringify(x.slice(0,3).map(r=>r[1]))===JSON.stringify(y.slice(0,3).map(r=>r[1]));
 const visit=(weights,mastery,x,y)=>{personal++;if(!sameTop3(x,y))personalTop3++;
  if(mastery===2&&!weights.tech){assert.deepEqual(y,x,JSON.stringify(weights)+' : maîtrise de référence, sans technicité');personalNeutral++;}};
 for(const c of before.priorities)for(const l of c.levels)visit(before.matrix.presets[c.id],l.mastery,l.results,after.priorities.find(x=>x.id===c.id).levels.find(x=>x.mastery===l.mastery).results);
 for(const l of before.isolatedRoles)for(const c of l.axes)visit({[c.axis]:3},l.mastery,c.results,after.isolatedRoles.find(x=>x.mastery===l.mastery).axes.find(x=>x.axis===c.axis).results);
 for(const c of before.mixed)for(const l of c.levels)visit(c.weights,l.mastery,l.results,after.mixed.find(x=>JSON.stringify(x.weights)===JSON.stringify(c.weights)).levels.find(x=>x.mastery===l.mastery).results);
 for(const t of before.technicite)for(const l of t.levels)visit(t.weights,l.mastery,l.results,after.technicite.find(x=>JSON.stringify(x.weights)===JSON.stringify(t.weights)).levels.find(x=>x.mastery===l.mastery).results);
 return {version:E.version,decision:DECISION,existingGuideCases:before.guide.length,changedTop3:changedTop.length,changedFirst:changedFirst.length,changedTop,changedFirstList:changedFirst,
  unchangedNeutralGuideCases:unchangedNeutral,personalCases:personal,personalChangedTop3:personalTop3,personalNeutralUnchanged:personalNeutral,
  loadChanges:Object.values(loadChanges).reduce((n,x)=>n+Object.keys(x).length,0),newCases:after.guide.slice(before.guide.length).map(c=>({id:c.id,top:c.top}))};
}
if(require.main===module){
 const args=process.argv.slice(2),i=args.indexOf('--fixture'),file=i>=0?args.splice(i,2)[1]:null;
 const next=snapshot(),report=compare(v10,next);
 if(file)fs.writeFileSync(file,JSON.stringify(next,null,2)+'\n',{flag:'wx'});
 if(args[0])fs.writeFileSync(args[0],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({existing:report.existingGuideCases,changedTop3:report.changedTop3,changedFirst:report.changedFirst,unchangedNeutral:report.unchangedNeutralGuideCases,
  personal:report.personalCases,personalChangedTop3:report.personalChangedTop3,personalNeutralUnchanged:report.personalNeutralUnchanged,loadChanges:report.loadChanges,
  changedTop:report.changedTop,newCases:report.newCases},null,1));
}
module.exports={snapshot,compare,NEW_CASES,LOADS,DECISION,neutralGuide};
