'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),X=require('../result-explanations.js');
const spec=id=>E.specs.find(s=>s.id===id),near=(a,b)=>assert.ok(Math.abs(a-b)<1e-10,`${a} != ${b}`);
function changeIrrelevant(change,check){
 const all=[...E.specs,...Object.values(E.petless)],saved=all.map(s=>structuredClone(s));
 const roles=structuredClone(E.roleReference);
 try {all.forEach(change);check();}
 finally {all.forEach((s,i)=>Object.assign(s,saved[i]));for(const k in roles)Object.assign(E.roleReference[k],roles[k]);}
}
test('PvP seul : les données PvE ne peuvent changer aucun score, ordre, build ou scénario',()=>{
 for(const activities of [{bg:5},{world:5},{bg:1,world:5}])for(const mastery of [0,2,3]){
  const p={roles:{dps:5},activities,styles:{ctrl:4,burst:3,surv:2},pet:{value:'avoid',certainty:3},mastery};
  const weights={dps:3,bg:activities.bg===undefined?0:3,sauv:activities.world===undefined?0:1,ctrl:2,burst:3,tech:1};
  const guide=E.recommend(p,5),priority=E.priorityRanking(weights,mastery);
  changeIrrelevant(s=>{s.activity.raid=s.activity.raid===1?5:1;s.activity.solo=s.activity.solo===1?5:1;s.load.pve=s.load.pve===1?5:1;
   for(const k in E.roleReference[s.classId])E.roleReference[s.classId][k]=1;},()=>{
   // Comparaison des calculs et de l'ordre, sans les objets de données intentionnellement modifiés.
   const compact=r=>r.results.map(x=>[x.spec.id,x.spec.variant,x.score,x.fit||x.parts]);
   assert.deepEqual(compact(E.recommend(p,5)),compact(guide));
   assert.deepEqual(E.recommend(p,5).scenarios,guide.scenarios);
   assert.deepEqual(compact(E.priorityRanking(weights,mastery)),compact(priority));
  });
 }
});
test('Solo et leveling : ni la note de raid ni la difficulté PvP ne comptent',()=>{
 for(const mastery of [0,2,3]){
  const p={roles:{dps:5},activities:{solo:5},styles:{ctrl:5,burst:3},mastery},w={dps:3,solo:3,tech:1,ctrl:2};
  const compact=r=>r.results.map(x=>[x.spec.id,x.score]);
  const g=compact(E.ranking(p)),r=compact(E.priorityRanking(w,mastery));
  changeIrrelevant(s=>{s.activity.raid=s.activity.raid===1?5:1;s.activity.bg=1;s.activity.world=1;s.load.pvp=1;
   for(const k in E.roleReference[s.classId])E.roleReference[s.classId][k]=1;},()=>{
   assert.deepEqual(compact(E.ranking(p)),g);assert.deepEqual(compact(E.priorityRanking(w,mastery)),r);
  });
  const s=spec('mage-givre'),a=E.explain(s.id,p).answers.find(a=>a.domain==='roles');
  near(a.aptitude,(E.adjustedActivity(s,'solo',mastery)-1)/4);
  assert.deepEqual(a.activityContext.activities,{solo:1});
 }
});
test('Les rôles suivent les activités ; le repère raid reste réservé au raid ou à une activité non précisée',()=>{
 const s=spec('mage-givre'),pve=.55*(E.roleReference.mage.dps-1)/4+.45*(E.adjustedActivity(s,'raid',2)-1)/4;
 near(E.roleSuitability(s,2),pve);near(E.roleSuitability(s,2,{raid:1}),pve);
 near(E.roleSuitability(s,2,{bg:1}),(s.activity.bg-1)/4);
 near(E.roleSuitability(s,2,{world:1}),(s.activity.world-1)/4);
 near(E.roleSuitability(s,2,{solo:1}),(s.activity.solo-1)/4);
 near(E.roleSuitability(s,2,{raid:2,bg:1}),(2*pve+(s.activity.bg-1)/4)/3);
 for(const role of ['tank','soin','dps'])for(const id of ['mage-givre','paladin-sacre','guerrier-protection']){
  const ex=E.priorityExplain(id,{[role]:3,bg:3},0),a=ex.axes.find(a=>a.key===role);
  near(a.raw,ex.spec.role===role?(E.adjustedActivity(ex.spec,'bg',0)-1)/4:0);
 }
});
test('Donjons et raids : quinzième priorité explicite, pondération et difficulté cohérentes en contexte mixte',()=>{
 assert.equal(E.priorityAxes.length,15);assert.ok(E.priorityAxes.includes('raid'));
 const ex=E.priorityExplain('voleur-finesse',{raid:3,bg:1,tech:3,dps:2},2),tech=ex.axes.find(a=>a.key==='tech');
 assert.equal(tech.context,'mixte');near(tech.load,(3*ex.spec.load.pve+ex.spec.load.pvp)/4);
 assert.deepEqual(ex.axes.find(a=>a.key==='dps').activityContext.activities,{raid:.75,bg:.25});
 const old={dps:3,ctrl:1};assert.equal(E.sanitizeWeights(old).raid,0);assert.deepEqual(old,{dps:3,ctrl:1});
 assert.equal(E.priorityPreset('dps',old).raid,3);assert.equal(E.priorityPreset('pvp',{bg:3}).raid,0);
 for(const weight of [1,2,3])assert.equal(E.priorityRanking({raid:weight},2).results.find(r=>r.spec.id==='mage-givre').score,50);
});
test('Texte courant : accord en mots, contexte exact et chiffres réservés au détail du calcul',()=>{
 for(const activities of [{bg:5},{world:5},{solo:5},{raid:5,bg:5}])for(const mastery of [0,2,3]){
  const p={roles:{dps:5},activities,styles:{burst:4,ctrl:2},difficulty:{value:'simple',certainty:4},mastery};
  for(const r of E.recommend(p,5).top){
   const ex=E.explain(r.spec.id,p),text=X.friendlyHtml(X.friendlyGroups(ex,false)).replace(/<[^>]*>/g,'');
   assert.doesNotMatch(text,/\d|%|undefined|NaN|points? sur/);assert.doesNotMatch(X.friendlyKeep(ex),/\d|%|points? sur/);
   if(!activities.raid)assert.doesNotMatch(text,/raid|donjon/i);
   assert.match(X.calculationHtml(X.pisteParts(ex,r.fit,r.score)),/Voir le détail du calcul/);
  }
 }
 const ex=E.explain('mage-givre',{styles:{ctrl:0}});
 assert.match(X.friendlyKeep(ex),/Tu hésites encore sur « Contrôle »/);
 assert.doesNotMatch(X.friendlyKeep(ex),/faible|manque|limites|points/);
 assert.deepEqual([.9,.7,.45,.15,0].map(X.fitWords),['Ça colle très bien','Ça colle bien','Un compromis','Ça colle peu','Ça ne colle pas']);
 const raw=JSON.stringify(E.recommend({roles:{dps:5},activities:{bg:5}}));
 X.friendlyGroups(E.explain('mage-givre',{roles:{dps:5},activities:{bg:5}}),false);
 assert.equal(JSON.stringify(E.recommend({roles:{dps:5},activities:{bg:5}})),raw);
});
