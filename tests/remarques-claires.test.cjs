'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),X=require('../result-explanations.js');

test('Chasseurs en PvE : des remarques concrètes, sans transformer le repère en incapacité à faire des donjons',()=>{
 for(const id of ['chasseur-survie','chasseur-precision','chasseur-maitrise-betes'])for(const mastery of [0,1,2,3]){
  const ex=E.explain(id,{roles:{dps:5},activities:{raid:5},mastery});
  const activity=X.friendlyGroups(ex,false).find(g=>g.key==='activities');
  assert.doesNotMatch(activity.verdict,/compromis/i);
  assert.doesNotMatch(activity.answers[0].text,/peut le faire, avec quelques limites|moins à l’aise en donjons/);
  assert.doesNotMatch(X.friendlyKeep(ex),/Le point à regarder|compromis/i);
  assert.doesNotMatch(X.friendlyHtml(X.friendlyGroups(ex,false)).replace(/<[^>]*>/g,''),/\d|%|NaN|undefined/);
  const p=E.priorityExplain(id,{dps:3,raid:3},mastery);
  assert.doesNotMatch(X.friendlyGroups(p,true).find(g=>g.key==='activities').verdict,/compromis/i);
 }
 const bm=E.explain('chasseur-maitrise-betes',{activities:{raid:5},mastery:2});
 assert.match(X.friendlyKeep(bm),/forte sur une cible.*gros groupes/i);
});

test('Maîtrise, activités faibles et hésitations gardent des explications distinctes',()=>{
 const s=E.explain('chasseur-survie',{roles:{dps:5},activities:{raid:5},mastery:0});
 assert.match(X.friendlyGroups(s,false).find(g=>g.key==='activities').verdict,/réflexes/);
 assert.match(X.friendlyKeep(s),/réflexes/);
 const weak=E.explain('voleur-assassinat',{activities:{raid:5},mastery:2});
 assert.match(X.friendlyKeep(weak),/moins à l’aise/);
 const unsure=E.explain('mage-givre',{styles:{ctrl:0}});
 assert.match(X.friendlyKeep(unsure),/Tu hésites/);
});

test('Les explications ne modifient aucun score ni ordre du moteur',()=>{
 for(const activities of [{raid:5},{bg:5},{solo:5},{raid:5,bg:3}]){
  const p={roles:{dps:5},activities,mastery:0},before=JSON.stringify(E.recommend(p));
  for(const s of E.specs){const ex=E.explain(s.id,p);X.friendlyGroups(ex,false);X.friendlyKeep(ex);X.friendlyStrengths(ex);}
  assert.equal(JSON.stringify(E.recommend(p)),before);
 }
});
