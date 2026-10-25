'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),X=require('../result-explanations.js');
const profile=(value,certainty,activities={raid:5})=>({activities,difficulty:{value,certainty},mastery:3});
const group=ex=>X.friendlyGroups(ex,false).find(g=>g.key==='difficulty');

test('Fureur en PvE : une difficulté intermédiaire est compatible avec les deux envies peu affirmées',()=>{
 for(const value of ['simple','complex'])for(const certainty of [0,1,2]){
  const ex=E.explain('guerrier-fureur',profile(value,certainty)),g=group(ex);
  assert.equal(ex.spec.load.pve,3);assert.equal(g.verdict,'Une piste compatible');
  assert.match(g.answers[0].text,/difficulté intermédiaire en PvE.*préférence reste souple.*peut bien te convenir/);
  assert.doesNotMatch(g.answers[0].text,/plus simple|plus de technique|comme tu le souhaites/);
  assert.equal(X.friendlyKeep(ex),g.answers[0].text);
 }
});

test('Les certitudes 3 et 4 décrivent un écart modéré, dans le bon sens',()=>{
 for(const value of ['simple','complex'])for(const certainty of [3,4]){
  const g=group(E.explain('guerrier-fureur',profile(value,certainty)));
  const direction=value==='simple'?'technique':'simple';
  assert.equal(g.verdict,'Un peu plus '+direction);
  assert.match(g.answers[0].text,new RegExp('difficulté intermédiaire en PvE.*un peu plus '+direction));
 }
});

test('La certitude maximale conserve une explication franche, sans modifier le score',()=>{
 for(const value of ['simple','complex']){
  const ex=E.explain('guerrier-fureur',profile(value,5)),g=group(ex);
  assert.equal(g.verdict,value==='simple'?'Plus technique que ton envie':'Plus simple que ton envie');
  assert.doesNotMatch(g.answers[0].text,/préférence reste souple|un peu plus/);
  assert.equal(ex.answers.find(a=>a.domain==='difficulty').fit,.5);
 }
});

test('En contexte mixte, chaque activité garde son niveau et sa propre explication',()=>{
 const ex=E.explain('guerrier-fureur',profile('simple',1,{raid:5,bg:5})),g=group(ex);
 assert.equal(g.verdict,'Selon l’activité');assert.equal(g.answers.length,2);
 assert.match(g.answers[0].text,/difficulté intermédiaire en PvE.*peut bien te convenir/);
 assert.match(g.answers[1].text,/exigeante en PvP.*regarde si ce niveau te tente/);
 assert.doesNotMatch(g.answers[1].text,/accessible|peut bien te convenir/);
 const onlyDifficulty=E.explain('mage-arcane',{difficulty:{value:'complex',certainty:1}});
 assert.match(X.friendlyKeep(onlyDifficulty),/intermédiaire en PvE.*peut bien te convenir.*intermédiaire en PvP.*peut bien te convenir/);
 assert.doesNotMatch(X.friendlyKeep(onlyDifficulty),/Le point à regarder/);
});

test('Une faible certitude ne masque pas les difficultés aux extrêmes ni la préférence personnalisée',()=>{
 for(const certainty of [0,1,2]){
  const hard=group(E.explain('voleur-finesse',profile('simple',certainty,{bg:5})));
  const easy=group(E.explain('paladin-vindicte',profile('complex',certainty)));
  assert.equal(hard.verdict,'À explorer');assert.match(hard.answers[0].text,/exigeante en PvP/);
  assert.equal(easy.verdict,'À explorer');assert.match(easy.answers[0].text,/accessible en PvE/);
 }
 for(const weight of [1,2,3]){
  const ex=E.priorityExplain('guerrier-fureur',{raid:3,tech:weight},3);
  const text=X.friendlyHtml(X.friendlyGroups(ex,true));
  assert.match(text,/Plus simple que ton envie/);assert.doesNotMatch(text,/préférence reste souple|Une piste compatible|Un peu plus simple/);
 }
});

test('Les nouvelles formulations préservent les classements et la maîtrise reste indépendante',()=>{
 for(const value of ['simple','complex'])for(const certainty of [0,1,2,3,4,5]){
  const p=profile(value,certainty),before=JSON.stringify(E.recommend(p));
  for(const s of E.specs){const ex=E.explain(s.id,p);X.friendlyGroups(ex,false);X.friendlyKeep(ex);}
  assert.equal(JSON.stringify(E.recommend(p)),before);
  for(const mastery of [0,1,2])assert.deepEqual(group(E.explain('guerrier-fureur',{...p,mastery})),group(E.explain('guerrier-fureur',p)));
 }
});
