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
test('Le second parcours propose 15 critères avec Donjons et raids, le guide et un moteur partagé',()=>{
 assert.equal(E.priorityAxes.length,15);
 assert.equal(new Set(E.priorityAxes).size,15);
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
const firstOfEachClass=rows=>rows.filter((r,i)=>rows.findIndex(q=>(q.classId||q.spec.classId)===(r.classId||r.spec.classId))===i);
test('Le domaine du rôle est compté une seule fois, quelle que soit sa diversité',()=>{
 const tank=E.priorityRanking(withW({tank:3}),2);
 assert.equal(tank.results.length,28,'depuis la v10, une ligne par configuration');
 assert.equal(tank.results[0].score,100);
 assert.equal(tank.results[0].spec.role,'tank');
 assert.equal(tank.results.find(x=>x.classId==='mage').score,0);
 assert.ok(tank.results.find(x=>x.classId==='druide').score<100);
 assert.ok(tank.results.find(x=>x.classId==='paladin').score<100);
 const equal=E.priorityRanking(withW({tank:1,soin:1,dps:1}),2);
 assert.ok(new Set(equal.results.map(x=>x.score)).size>1,'Les rôles sont distingués par leur adéquation au PvE, sans prime au généraliste');
 assert.ok(equal.results.every(x=>x.parts.roles.weight>0),'Un seul domaine rôle même avec trois choix');
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
 const D=JSON.parse(html.match(/window\.__WF = (\{.*?\});\s*<\/script>/s)[1]);
 assert.equal(Object.keys(D.presets).length,15);
 for(const name of Object.keys(D.presets)){
  const r=E.priorityRanking(D.presets[name],2);
  assert.equal(r.status,'ok',name);
  assert.equal(r.results.length,28,name);
  assert.equal(new Set(r.results.map(x=>x.spec.id)).size,28,name);
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
test('Chaque configuration est classée une fois, cohérente, avec un score fini (v10)',()=>{
 const profiles=[
  withW({tank:3,soin:2}),withW({dps:3,zone:3}),
  withW({sauv:3,ctrl:3,burst:3}),withW({solo:3}),
  withW({poly:3}),withW({mob:3,util:3}),withW({tech:3,burst:3})
 ];
 for(const w of profiles)for(let level=0;level<4;level++){
  const r=E.priorityRanking(w,level);
  assert.equal(r.results.length,28);
  assert.equal(new Set(r.results.map(x=>x.spec.id)).size,28);
  assert.ok(r.results.every(x=>E.specs.some(s=>(E.referenceVariants[s.id]?E.petless[s.id]:s)===x.spec)));
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

test('Régression DPS PvE : jamais 100% pour les neuf classes, quel que soit le poids',()=>{
 for(let level=0;level<4;level++){
  const results=[1,2,3].map(weight=>E.priorityRanking(withW({dps:weight}),level));
  for(const r of results){
   const classes=firstOfEachClass(r.results);
   assert.equal(r.results.length,28);assert.equal(classes.length,9);
   assert.ok(classes.filter(x=>x.score===100).length<9,'DPS au niveau '+level+' ne doit jamais donner 100 aux neuf classes');
   assert.ok(new Set(classes.map(x=>x.score)).size>=3,'Le rôle DPS distingue plusieurs degrés d’adéquation');
   assert.ok(classes.every(x=>x.spec.role==='dps'),'Meilleure spécialisation DPS pour chaque classe');
   assert.ok(r.results.every(x=>x.spec.role==='dps'||x.score===0),'une configuration qui n’est pas DPS vaut 0 sur cet axe');
  }
  // Intensité d’un unique axe n’affecte pas les proportions : c’est l’importance relative.
  assert.deepEqual(results[0].results.map(x=>x.score),results[1].results.map(x=>x.score));
  assert.deepEqual(results[1].results.map(x=>x.score),results[2].results.map(x=>x.score));
 }
});
test('Les notes des trois rôles sont ancrées dans les 126 notes historiques et la spé PvE',()=>{
 const d=JSON.parse(html.match(/window\.__WF = (\{.*?\});\s*<\/script>/s)[1]);
 for(const cls of d.classes)for(const k of ['dps','tank','soin']){
  assert.equal(E.roleReference[cls.id][k],cls.r[k],cls.id+' '+k);
 }
 for(const spec of E.specs){
  const quality=E.roleSuitability(spec,2);
  const activity=(E.adjustedActivity(spec,'raid',2)-1)/4;
  const expected=spec.role==='dps'?activity:.55*(E.roleReference[spec.classId][spec.role]-1)/4+.45*activity;
  assert.ok(Math.abs(quality-expected)<1e-9,spec.id);
 }
});
test('14 axes × 4 niveaux × 3 forces : toujours 28 configurations et neuf classes, jamais tous 100',()=>{
 for(const k of E.priorityAxes)for(let level=0;level<4;level++)for(let weight=1;weight<=3;weight++){
  const r=E.priorityRanking(withW({[k]:weight}),level);
  assert.equal(r.results.length,28,k);
  assert.equal(r.active.length,1,k);
  assert.equal(new Set(r.results.map(x=>x.classId)).size,9,k);
  assert.ok(r.results.some(x=>x.score<100),'Axe non discriminant : '+k+' niveau '+level);
  assert.ok(r.results.every(x=>x.score>=0&&x.score<=100&&Number.isFinite(x.score)),k);
 }
});
test('Les priorités modulent effectivement le classement dans les profils multifactoriels',()=>{
 const first=E.priorityRanking(withW({dps:3,solo:1}),2);
 const second=E.priorityRanking(withW({dps:1,solo:3}),2);
 assert.notDeepEqual(first.results.map(x=>[x.classId,x.score]),second.results.map(x=>[x.classId,x.score]));
 const avg=E.priorityRanking(withW({dps:2,solo:2}),2);
 assert.ok(avg.results.every(x=>x.spec.classId===x.classId));
});
test('L’exploration guidée distingue les spécialisations DPS même si aucun autre critère n’a été renseigné',()=>{
 const r=E.recommend({roles:{dps:5}});
 assert.equal(r.status,'ok');
 assert.equal(r.top.length,3);
 assert.ok(new Set(r.results.map(x=>x.score)).size>=3);
 assert.ok(r.top.every(x=>x.spec.role==='dps'));
});
test('24 000 combinaisons aléatoires déterministes : bornes, classement, unicité, coefficients actifs',()=>{
 let seed=20261021;
 function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
 const winners={};
 for(let i=0;i<24000;i++){
  const w=withW({});
  for(const k of E.priorityAxes)w[k]=Math.floor(rnd()*4);
  if(i%23===0)for(const k of E.priorityAxes)w[k]=0;
  const lvl=i%4,r=E.priorityRanking(w,lvl);
  if(!r.active.length){assert.equal(r.status,'unanswered');assert.equal(r.results.length,0);continue;}
  assert.equal(r.status,'ok');assert.equal(r.results.length,28);
  assert.equal(new Set(r.results.map(x=>x.spec.id)).size,28);
  assert.equal(new Set(r.results.map(x=>x.classId)).size,9);
  assert.ok(r.results.every(x=>x.score>=0&&x.score<=100&&Number.isFinite(x.score)));
  assert.ok(r.results.every((x,j)=>j===0||x.score<=r.results[j-1].score));
  assert.ok(r.results.every(x=>E.specs.some(sp=>(E.referenceVariants[sp.id]?E.petless[sp.id]:sp)===x.spec)));
  winners[r.results[0].classId]=(winners[r.results[0].classId]||0)+1;
 }
 assert.ok(Object.keys(winners).length>=4,'Simulations variées : aucun quota par classe');
});
