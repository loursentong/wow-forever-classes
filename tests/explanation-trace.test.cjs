'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),X=require('../result-explanations.js');
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-8,`${a} ≠ ${b}`);
test('La trace reconstitue le score et ses causes, y compris lorsque la certitude augmente un mauvais accord',()=>{
 const profiles=[{roles:{soin:5},activities:{bg:0,solo:3},range:{value:'distance',certainty:0},styles:{zone:4,surv:5,support:4},mastery:3},
  {roles:{tank:2,soin:5},healStyles:{groupe:1,cible:5},activities:{raid:2,solo:4},styles:{ctrl:5,mob:3},pet:{value:'avoid',certainty:0},difficulty:{value:'simple',certainty:4}},
  {range:{value:'melee',certainty:0},styles:{ctrl:0},mastery:0}];
 for(const p of profiles)for(let mastery=0;mastery<4;mastery++){
  p.mastery=mastery;const before=JSON.stringify(p),ranking=E.ranking(p);
  for(const row of ranking.results){
   const t=E.explain(row.spec.id,p),parts=X.scoreParts(row.fit,row.score);
   assert.equal(t.score,row.score);assert.deepEqual(t.spec,row.spec);
   near(t.answers.reduce((n,a)=>n+a.points,0),t.rawScore);
   for(const [key,part] of Object.entries(row.fit)){
    const answers=t.answers.filter(a=>a.domain===key);
    near(answers.reduce((n,a)=>n+a.fit,0)/answers.length,part.value);
   }
   for(const a of t.answers){near(a.causes.aptitude+a.causes.mastery+a.causes.certainty,a.loss);assert.ok(X.answerLabel(a,t.profile));}
   assert.equal(parts.reduce((n,a)=>n+a.points,0),Math.round(row.score));
   assert.equal(parts.reduce((n,a)=>n+a.max,0),100);
   for(const a of parts)assert.ok(a.points>=0&&a.points<=a.max,row.spec.id+JSON.stringify(a));
  }
  assert.equal(JSON.stringify(p),before);assert.deepEqual(E.ranking(p),ranking);
 }
 const poor=E.explain('guerrier-armes',{range:{value:'distance',certainty:0}}).answers[0];
 assert.ok(poor.causes.certainty<0,'Une hésitation peut atténuer un désaccord, pas toujours pénaliser');
 assert.doesNotMatch(X.keepInMind(E.explain('guerrier-armes',{range:{value:'distance',certainty:0}})),/hésites/);
});
test('À garder en tête : le groupe qui perd le plus de points, puis sa réponse ; capacité, maîtrise et certitude distinguées',()=>{
 const uncertain=E.explain('mage-givre',{styles:{ctrl:0},mastery:2});
 // Une hésitation n'est pas une faiblesse de la spécialisation : la phrase dit qu'elle y répond pleinement.
 assert.equal(X.keepInMind(uncertain),'Le Mage Givre répond pleinement à ton choix « Contrôle », mais tu hésites (certitude 0/5) : c’est la seule chose qui lui coûte des points (37 sur le gameplay).');
 const novice=E.explain('mage-givre',{styles:{ctrl:5},mastery:0});
 assert.equal(X.keepInMind(novice),'Le Mage Givre est noté 5/5 en contrôle, 4,4/5 avec ta maîtrise (débutant) : c’est la seule chose qui lui coûte des points (16 sur le gameplay).');
 const fit=E.explain('mage-givre',{styles:{ctrl:5},mastery:2});
 assert.equal(X.keepInMind(fit),'Le Mage Givre répond pleinement à tes choix dans nos estimations : regarde si son style de jeu te plaît.');
 /* Perte pondérée, groupe par groupe (révision du 22 octobre 2026) : le rôle seul perd plus qu'aucune autre
  * réponse (5,66 points), mais le gameplay en perd davantage à deux réponses (8). « À garder en tête » nomme le
  * gameplay et sa réponse la plus coûteuse, comme la première ligne du bilan ; avant, il nommait le rôle. */
 const p={roles:{dps:4},activities:{raid:3,bg:2},styles:{burst:4,surv:3},range:{value:'distance',certainty:3},pet:{value:'like',certainty:4},mastery:3};
 const ex=E.explain('demoniste-affliction',p),row=E.ranking(p).results.find(r=>r.spec.id==='demoniste-affliction');
 assert.equal(ex.answers.slice().sort((a,b)=>b.loss-a.loss)[0].domain,'styles');
 assert.match(X.keepInMind(ex,row.fit,row.score),/3\/5 en dégâts de burst/);
 assert.equal(X.pisteAnalysis(ex,row.fit,row.score).main.key,'styles');
 assert.match(X.friendlyKeep(ex,row.fit,row.score),/Le point à regarder, c’est « Dégâts de burst »/);
 assert.equal(X.strengthsText(ex,row.fit,row.score),'DPS · Champs de bataille · À distance');
 // Sans fit ni score, l'analyse les retrouve dans la trace : même phrase.
 assert.equal(X.keepInMind(ex),X.keepInMind(ex,row.fit,row.score));
});
test('Les réponses sans objet sont absentes de la trace ; les contraintes restent prioritaires',()=>{
 assert.equal(E.explain('absent',{styles:{ctrl:5}}),null);
 assert.equal(E.explain('mage-givre',{}),null);
 assert.equal(E.explain('mage-givre',{roles:{soin:0},rolesStrict:true}),null);
 assert.equal(E.explain('mage-givre',{healStyles:{cible:5}}),null);
 const unavailable=E.explain('mage-givre',{roles:{soin:5},healStyles:{cible:5}}).answers.find(a=>a.domain==='healStyles');
 assert.equal(unavailable.fit,0);assert.equal(unavailable.note,undefined,'Aucune note de soin inventée hors rôle');
 assert.match(X.answerText(unavailable,{}),/ne soigne pas/);
 const multi=E.explain('druide-restauration',{roles:{tank:5,soin:5}});
 assert.equal(multi.answers.filter(a=>a.domain==='roles').length,1);
});
test('La préférence familier ne modifie pas les aptitudes des configurations sans familier',()=>{
 for(const s of E.specs.filter(s=>s.pet==='none'))for(const value of ['like','avoid'])for(const certainty of [0,5]){
  const p={styles:{ctrl:5,support:3},activities:{solo:5},mastery:1},before=E.explain(s.id,p),after=E.explain(s.id,{...p,pet:{value,certainty}});
  assert.deepEqual(after.answers.filter(a=>a.domain!=='pet').map(a=>[a.domain,a.key,a.raw,a.fit]),before.answers.map(a=>[a.domain,a.key,a.raw,a.fit]));
 }
});
