'use strict';
/* Moteur 1.0.9, référence v10 (décision du responsable du projet, 22 octobre 2026).
 * 1. Les classements listent les spécialisations, plus seulement la meilleure de chaque classe :
 *    une classe peut apparaître plusieurs fois. Le top 3 du parcours guidé en garde au plus deux
 *    d'une même classe ; la place suivante va à la meilleure autre classe.
 * 2. Mode personnalisé : la technicité suit les critères d'activité, comme la difficulté du test
 *    (PvP seul : difficulté PvP ; PvE seul : difficulté PvE ; sinon la moyenne). */
const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../recommendation-engine.js');

test('Parcours guidé : chaque configuration admissible est classée, une classe peut revenir',()=>{
 const p={styles:{mob:5,surv:5}},r=E.ranking(p);
 assert.equal(r.status,'ok');
 assert.equal(r.results.length,r.compatible,'une ligne par configuration admissible');
 assert.equal(new Set(r.results.map(x=>x.spec.id)).size,r.results.length,'aucune configuration en double');
 // Trois Druides à égalité : Restauration d'abord (plus haut potentiel), puis l'identifiant.
 assert.deepEqual(r.results.slice(0,3).map(x=>x.spec.id),['druide-restauration','druide-farouche-chat','druide-farouche-ours']);
 // Ordre : score, puis classe, puis potentiel ajusté à la maîtrise, puis identifiant.
 for(let i=1;i<r.results.length;i++)assert.ok(r.results[i-1].score>=r.results[i].score);
});

test('Top 3 : au plus deux spécialisations d’une même classe, la troisième place va à une autre classe',()=>{
 const druids=E.recommend({styles:{mob:5,surv:5}});
 assert.deepEqual(druids.top.map(x=>x.spec.id),['druide-restauration','druide-farouche-chat','chaman-restauration']);
 const hunters=E.recommend({roles:{dps:5},activities:{solo:5}});
 assert.deepEqual(hunters.top.map(x=>x.spec.classId),['chasseur','chasseur','demoniste']);
 assert.equal(hunters.top[0].spec.id,'chasseur-survie');
 // La stabilité se compte désormais par spécialisation.
 for(const t of hunters.top)assert.ok(t.scenarioAppearances<=t.scenarioCount);
 assert.ok(hunters.scenarios.every(s=>s.top.every(id=>E.specs.some(x=>x.id===id))),'les scénarios citent des spécialisations');
});

test('Mode personnalisé : les 28 configurations sont classées',()=>{
 const r=E.priorityRanking({ctrl:3},2);
 assert.equal(r.results.length,28);
 assert.equal(new Set(r.results.map(x=>x.spec.id)).size,28);
 assert.equal(new Set(r.results.map(x=>x.classId)).size,9);
});

test('Technicité : difficulté PvP pour des critères PvP, PvE pour des critères PvE, sinon la moyenne',()=>{
 const load=w=>E.priorityExplain('voleur-finesse',w,2).axes.find(a=>a.key==='tech');
 assert.equal(load({tech:3,bg:3}).load,5);assert.equal(load({tech:3,bg:3}).context,'pvp');
 assert.equal(load({tech:3,sauv:2}).load,5);
 assert.equal(load({tech:3,solo:3}).load,3);assert.equal(load({tech:3,solo:3}).context,'pve');
 assert.equal(load({tech:3,dps:1}).load,3,'les rôles sont évalués en PvE');
 assert.equal(load({tech:3,bg:3,solo:3}).load,4);assert.equal(load({tech:3,bg:3,solo:3}).context,'mixte');
 assert.equal(load({tech:3}).load,4);
 // Le score suit : Finesse est plus exigeante en PvP.
 const score=w=>E.priorityRanking(w,2).results.find(x=>x.spec.id==='voleur-finesse').score;
 assert.ok(score({tech:3,bg:3})>score({tech:3,solo:3}));
});
