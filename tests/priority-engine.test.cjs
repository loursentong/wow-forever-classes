'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../recommendation-engine.js');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'..','priorities-ui.js'),'utf8');
const weights={poly:0,tank:0,soin:0,dps:0,bg:0,sauv:0,burst:0,zone:0,ctrl:0,surv:0,mob:0,util:0,solo:0,tech:0};
function withW(o){return {...weights,...o};}
test('Le second parcours conserve les 14 critères, le guide et un moteur partagé',()=>{
 assert.equal(E.priorityAxes.length,14);
 assert.equal(new Set(E.priorityAxes).size,14);
 assert.match(html,/data-reco-mode="guided"/);
 assert.match(html,/data-reco-mode="priorities"/);
 assert.match(html,/src="priorities-ui.js"/);
 assert.match(ui,/priorityRanking/);
 assert.match(ui,/data-prio-axis/);
 assert.match(ui,/data-prio-preset/);
 assert.match(ui,/data-prio-mastery/);
 assert.doesNotThrow(()=>new Function('window','document','localStorage',ui));
});
test('Aucun poids, aucune recommandation artificielle',()=>{
 const r=E.priorityRanking(weights,2);
 assert.equal(r.status,'unanswered');
 assert.deepEqual(r.results,[]);
 assert.deepEqual(r.active,[]);
});
test('Le domaine du rôle est compté une seule fois, quelle que soit sa diversité',()=>{
 const tank=E.priorityRanking(withW({tank:3}),2);
 assert.equal(tank.results.length,9);
 assert.equal(tank.results[0].score,100);
 assert.equal(tank.results[0].spec.role,'tank');
 assert.equal(tank.results.find(x=>x.classId==='mage').score,0);
 assert.equal(tank.results.find(x=>x.classId==='druide').score,100);
 assert.equal(tank.results.find(x=>x.classId==='paladin').score,100);
 const equal=E.priorityRanking(withW({tank:1,soin:1,dps:1}),2);
 assert.equal(new Set(equal.results.map(x=>x.score)).size,1,'Tous les rôles égaux ne créent pas un bonus de polyvalence');
 assert.equal(new Set(equal.results.map(x=>x.score))[Symbol.iterator]().next().value,33.33);
});
test('La polyvalence n’apporte des points que si l’axe est explicitement demandé',()=>{
 const alone=E.priorityRanking(withW({dps:3}),2);
 const other=E.priorityRanking(withW({dps:3,poly:0}),2);
 assert.deepEqual(alone.results.map(x=>[x.spec.id,x.score]),other.results.map(x=>[x.spec.id,x.score]));
 const selected=E.priorityRanking(withW({poly:3}),2);
 assert.equal(selected.results[0].classId,'druide');
 assert.ok(selected.results[0].score>selected.results.find(x=>x.classId==='mage').score);
});
test('La technicité reste un goût et ne récompense pas automatiquement les experts',()=>{
 const profile=withW({bg:3,ctrl:2});
 const expert=E.priorityRanking(profile,3);
 assert.ok(expert.active.every(x=>x!=='tech'));
 const loveChallenge=E.priorityRanking(withW({tech:3}),0);
 assert.ok(loveChallenge.results[0].score>loveChallenge.results[8].score);
});
test('Le même joueur peut explorer les 15 presets historiques sans modifier les notes sources',()=>{
 const D=JSON.parse(html.match(/window\.__WF = (\{.*?\});\s*\(function\(\)/s)[1]);
 assert.equal(Object.keys(D.presets).length,15);
 for(const name of Object.keys(D.presets)){
  const r=E.priorityRanking(D.presets[name],2);
  assert.equal(r.status,'ok',name);
  assert.equal(r.results.length,9,name);
  assert.equal(new Set(r.results.map(x=>x.classId)).size,9,name);
  assert.ok(r.results.every(x=>x.score>=0&&x.score<=100),name);
 }
 assert.equal(D.classes.length,9);
 assert.equal(D.axes.length,14);
});
test('Les pondérations 0–3 invalides sont neutralisées et les résultats déterministes',()=>{
 const before={tank:33,solo:-1,ctrl:2.5,dps:2};
 const cleaned=E.sanitizeWeights(before);
 assert.equal(cleaned.tank,0);
 assert.equal(cleaned.solo,0);
 assert.equal(cleaned.ctrl,0);
 assert.equal(cleaned.dps,2);
 const input=withW({dps:3,bg:2,burst:1,tech:0});
 const serialized=JSON.stringify(input);
 const a=E.priorityRanking(input,0),b=E.priorityRanking(input,0);
 assert.deepEqual(a.results,b.results);
 assert.equal(JSON.stringify(input),serialized);
});
test('Les classes sont représentées par UNE configuration cohérente et les scores sont finis',()=>{
 const profiles=[
  withW({tank:3,soin:2}),withW({dps:3,zone:3}),
  withW({sauv:3,ctrl:3,burst:3}),withW({solo:3}),
  withW({poly:3}),withW({mob:3,util:3}),withW({tech:3,burst:3})
 ];
 for(const w of profiles)for(let level=0;level<4;level++){
  const r=E.priorityRanking(w,level);
  assert.equal(r.results.length,9);
  assert.ok(r.results.every(x=>E.specs.some(s=>s===x.spec)));
  assert.ok(r.results.every(x=>Number.isFinite(x.score)));
  assert.ok(r.results.every((x,i)=>i===0||x.score<=r.results[i-1].score));
 }
});
test('La source de styles ne peut pas attribuer à un tank les qualités optimisées DPS d’une autre spécialisation',()=>{
 const r=E.priorityRanking(withW({tank:3,burst:3}),2);
 const d=r.results.find(x=>x.classId==='druide');
 assert.ok(['druide-farouche-chat','druide-farouche-ours','druide-equilibre','druide-restauration'].includes(d.spec.id));
 assert.equal(d.spec.classId,'druide');
 assert.ok(!r.results.some(x=>x.spec.id==='druide-farouche-chat'&&x.classId==='paladin'));
});
