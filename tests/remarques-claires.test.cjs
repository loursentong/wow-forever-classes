'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),X=require('../result-explanations.js');

test('Exigeant au maximum : une spécialisation intermédiaire est explicitement plus simple que l’envie',()=>{
 const p={activities:{raid:5},difficulty:{value:'complex',certainty:5},mastery:3};
 const ex=E.explain('mage-arcane',p),a=ex.answers.find(a=>a.domain==='difficulty');
 assert.equal(a.raw,.5);
 const g=X.friendlyGroups(ex,false).find(g=>g.key==='difficulty');
 assert.equal(g.verdict,'Plus simple que ton envie');
 assert.match(g.answers[0].text,/difficulté intermédiaire en PvE/);
 assert.match(g.answers[0].text,/plus simple que ce que tu recherches/);
 assert.doesNotMatch(g.answers[0].text,/À voir si|plaît/);
 const hard=E.explain('chasseur-survie',p),h=X.friendlyGroups(hard,false).find(g=>g.key==='difficulty');
 assert.match(h.verdict,/Ça colle/);assert.match(h.answers[0].text,/exigeante en PvE, comme tu le souhaites/);
});

test('Accessible et Exigeant : le texte donne le sens de l’écart et distingue PvE et PvP',()=>{
 const simple=E.explain('mage-arcane',{activities:{raid:5},difficulty:{value:'simple',certainty:5}});
 assert.equal(X.friendlyGroups(simple,false).find(g=>g.key==='difficulty').verdict,'Plus technique que ton envie');
 const p={activities:{raid:5,bg:5},difficulty:{value:'complex',certainty:5}},ex=E.explain('mage-givre',p);
 const g=X.friendlyGroups(ex,false).find(g=>g.key==='difficulty');
 assert.equal(g.verdict,'Selon l’activité');assert.equal(g.answers.length,2);
 assert.match(g.answers[0].text,/accessible en PvE.*plus simple/);
 assert.match(g.answers[1].text,/exigeante en PvP.*comme tu le souhaites/);
 assert.deepEqual(g,X.friendlyGroups(E.explain('mage-givre',{...p,mastery:3}),false).find(g=>g.key==='difficulty'));
});

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
 // v16 : son repère monocible est désormais 3 ; conserver la distinction cible/zone sans le qualifier de « fort ».
 assert.match(X.friendlyKeep(bm),/dégâts estimés privilégient une cible.*gros groupes/i);
 assert.doesNotMatch(X.friendlyKeep(bm),/forte sur une cible/);
});

test('Maîtrise, activités faibles et hésitations gardent des explications distinctes',()=>{
 const s=E.explain('chasseur-survie',{roles:{dps:5},activities:{raid:5},mastery:0});
 assert.match(X.friendlyGroups(s,false).find(g=>g.key==='activities').verdict,/réflexes/);
 assert.match(X.friendlyKeep(s),/réflexes/);
 const weak=E.explain('voleur-assassinat',{activities:{raid:5},mastery:2});
 assert.match(X.friendlyKeep(weak),/dégâts estimés privilégient une cible.*gros groupes/i);
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
