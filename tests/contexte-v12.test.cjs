'use strict';
/* Moteur 1.2.0, référence v12 (décision du responsable du projet, 23 octobre 2026) : la difficulté suit le
 * contexte de jeu partout où elle sert.
 * 1. Mode personnalisé : la technicité suit les activités ; les rôles ne comptent plus comme du PvE. PvE et
 *    PvP mêlés : chacun selon sa priorité ; sans activité, la moyenne des deux.
 * 2. L'effet de la maîtrise sur les styles suit les activités du joueur : PvE seul → difficulté PvE, PvP
 *    seul → PvP ; sinon la règle d'avant (contrôle et résistance en PvP, les autres styles en PvE).
 * 3. Les variantes sans familier ont leur propre grille de complexité. */
const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../recommendation-engine.js');
const X=require('../result-explanations.js');
const details=require('../configuration-details.js');
const spec=id=>E.specs.find(s=>s.id===id);
const near=(a,b,label)=>assert.ok(Math.abs(a-b)<1e-9,(label||'')+' '+a+' ≠ '+b);

test('Technicité : les activités décident, les rôles ne comptent plus comme du PvE',()=>{
 const tech=w=>E.priorityExplain('voleur-finesse',w,2).axes.find(a=>a.key==='tech');
 const ctx=w=>E.techContext(E.sanitizeWeights(w));
 // Le cas signalé : un joueur PvP qui choisit aussi un rôle garde la difficulté PvP.
 assert.equal(ctx({dps:2,bg:3,sauv:3,tech:3}),'pvp');
 assert.equal(tech({dps:2,bg:3,sauv:3,tech:3}).load,5);
 assert.equal(ctx({tank:3,solo:2,tech:1}),'pve');
 assert.equal(ctx({dps:3,tech:2}),'mixte','sans activité : la moyenne');
 assert.equal(tech({dps:3,tech:2}).load,4.5);
 // PvE et PvP mêlés : chacun selon sa priorité (Champ de bataille 3 et PvP sauvage 3 contre Solo 1 : 6/7 de PvP).
 const mix=tech({bg:3,sauv:3,solo:1,tech:3});
 assert.equal(mix.context,'mixte');
 near(mix.contexts.pvp.share,6/7,'part PvP');near(mix.contexts.pve.share,1/7,'part PvE');
 near(mix.load,(6*5+1*4)/7,'charge');
 near(mix.raw,mix.contexts.pve.share*mix.contexts.pve.raw+mix.contexts.pvp.share*mix.contexts.pvp.raw,'valeur du calcul');
 const score=(id,w)=>E.priorityRanking(w,2).results.find(x=>x.spec.id===id).score;
 assert.ok(score('chasseur-precision',{dps:2,bg:3,sauv:3,tech:3})>85,'Précision n’est plus tirée vers le bas par le PvE');
});

test('Maîtrise sur les styles : PvE seul → difficulté PvE, PvP seul → PvP, sinon la règle d’avant',()=>{
 const g=spec('mage-givre');// 2/5 en PvE, 4/5 en PvP
 const guided=(p,k)=>E.explain('mage-givre',p).answers.find(a=>a.domain==='styles'&&a.key===k).adjusted;
 near(guided({activities:{raid:5},styles:{ctrl:5},mastery:0},'ctrl'),g.style.ctrl-0.29*2*0.55,'débutant PvE, contrôle');
 near(guided({activities:{bg:5},styles:{burst:5},mastery:0},'burst'),g.style.burst-0.29*4*0.55,'débutant PvP, burst');
 near(guided({activities:{raid:5,bg:5},styles:{ctrl:5},mastery:0},'ctrl'),g.style.ctrl-0.29*4*0.55,'activités mêlées');
 near(guided({styles:{burst:5},mastery:0},'burst'),g.style.burst-0.29*2*0.55,'sans activité');
 const personal=(w,k)=>E.priorityExplain('mage-givre',w,0).axes.find(a=>a.key===k).adjusted;
 near(personal({solo:3,ctrl:3},'ctrl'),g.style.ctrl-0.29*2*0.55,'personnalisé PvE');
 near(personal({bg:3,burst:3},'burst'),g.style.burst-0.29*4*0.55,'personnalisé PvP');
 near(personal({dps:3,ctrl:3},'ctrl'),g.style.ctrl-0.29*4*0.55,'personnalisé sans activité');
 // À la maîtrise de référence, rien ne bouge.
 assert.equal(guided({activities:{raid:5},styles:{ctrl:5},mastery:2},'ctrl'),g.style.ctrl);
});

test('Sans familier : Survie, Affliction et Destruction ont leur propre grille',()=>{
 const v=id=>E.petless[id];
 assert.deepEqual(v('chasseur-survie').complexity,{pve:[2,1,1,2,0],pvp:[2,2,2,1,1]});
 assert.deepEqual(v('chasseur-survie').load,{pve:3,pvp:4});
 // Démoniste sans démon : plus de démon à piloter ; « Drain Mana » reste. L'Affliction garde quatre contrôles
 // (Fear, Death Coil, Curse of Tongues, Curse of Exhaustion), la Destruction trois (ralentissement de Conflagrate).
 assert.deepEqual(v('demoniste-affliction').complexity,{pve:[1,2,1,1,0],pvp:[2,1,2,1,1]});
 assert.deepEqual(v('demoniste-affliction').load,{pve:3,pvp:4});
 assert.deepEqual(v('demoniste-destruction').complexity,{pve:[1,1,1,1,0],pvp:[1,1,2,1,1]});
 assert.deepEqual(v('demoniste-destruction').load,{pve:2,pvp:3});
 assert.deepEqual(v('chasseur-precision').complexity,spec('chasseur-precision').complexity,'déjà évaluée en Loup solitaire');
 for(const [id,s] of Object.entries(E.petless))for(const c of ['pve','pvp'])
  assert.equal(s.load[c],E.complexityNote(s.complexity[c].reduce((a,b)=>a+b,0)),id+'/'+c);
 assert.deepEqual(E.checkData(),[]);
 // La difficulté souhaitée lit la grille du build évalué.
 const d=E.explain('chasseur-survie',{activities:{raid:5},difficulty:{value:'simple',certainty:5},pet:{value:'avoid',certainty:5,strict:true}})
  .answers.find(a=>a.domain==='difficulty');
 near(5-4*d.raw,3,'Survie sans familier en PvE');
});

test('Explications : part de chaque contexte pour la technicité, détail du build sans familier',()=>{
 const ex=E.priorityExplain('voleur-finesse',{bg:3,sauv:3,solo:1,tech:3},2);
 const group=X.priorityParts(ex,ex.score).find(g=>g.axes.some(a=>a.key==='tech'));
 assert.match(group.note,/Technicité : tes activités mêlent PvE et PvP, chacune selon sa priorité : le PvP compte pour 86 %, le PvE pour 14 % \(75 % en PvE, 100 % en PvP\)\./);
 const none=E.priorityExplain('voleur-finesse',{dps:3,tech:2},2);
 assert.match(X.priorityParts(none,none.score).find(g=>g.axes.some(a=>a.key==='tech')).note,/Technicité : sans critère d’activité, moyenne des deux \(75 % en PvE, 100 % en PvP\)\./);
 const html=details(E.petless['chasseur-survie']);
 assert.match(html,/PvE : Demande de la pratique \(3\/5\)/);
 assert.match(html,/href="fiches-sources\/chasseur\.html#chasseur-survie-sans-familier">Le détail, composante par composante<\/a>/);
 // Parcours guidé : la note de contexte dit sur quelle difficulté la maîtrise ajuste les styles.
 assert.match(X.contextNotes({profile:E.sanitize({activities:{raid:5},styles:{ctrl:4},mastery:0})}).join(' '),/Ta maîtrise ajuste tes styles selon la difficulté PvE de chaque spécialisation, puisque tes activités sont en PvE\./);
 assert.ok(!X.contextNotes({profile:E.sanitize({activities:{raid:5},styles:{ctrl:4},mastery:2})}).join(' ').includes('ajuste tes styles'));
});
