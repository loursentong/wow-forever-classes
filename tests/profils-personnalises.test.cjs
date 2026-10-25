'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs');
const P=require('../priority-profiles.js'),E=require('../recommendation-engine.js');
test('Huit profils concrets, distincts et sans préférence ajoutée pour la polyvalence ou la difficulté',()=>{
 assert.equal(P.length,8);assert.equal(new Set(P.map(p=>p.id)).size,8);
 assert.equal(new Set(P.map(p=>JSON.stringify(E.sanitizeWeights(p.weights)))).size,8);
 for(const p of P){
  assert.ok(p.label&&p.description&&p.icon);
  for(const [k,v] of Object.entries(p.weights)){assert.ok(E.priorityAxes.includes(k));assert.ok(Number.isInteger(v)&&v>0&&v<=3);}
  const w=E.sanitizeWeights(p.weights);assert.equal(w.poly,0);assert.equal(w.tech,0);
  assert.equal([w.tank,w.soin,w.dps].filter(v=>v>0).length,p.id==='pvp-controle'||p.id==='solo-autonomie'?0:1);
  assert.ok(w.raid||w.bg||w.sauv||w.solo,'Activité explicite');
  if(p.id.startsWith('groupe-'))assert.deepEqual([w.raid,w.bg,w.sauv,w.solo],[3,0,0,0]);
  if(p.id.startsWith('bg-'))assert.deepEqual([w.raid,w.bg,w.sauv,w.solo],[0,3,0,0]);
  const role=['tank','soin','dps'].find(k=>w[k]>0);
  if(role)for(const mastery of [0,1,2,3])assert.equal(E.priorityRanking(w,mastery).results[0].spec.role,role,p.id+'/'+mastery);
 }
});
test('La nouvelle dépendance est publiée et chargée avant le mode personnalisé',()=>{
 const html=fs.readFileSync('index.html','utf8'),check=fs.readFileSync('scripts/verify-pages-live.cjs','utf8');
 assert.ok(html.indexOf('src="priority-profiles.js"')<html.indexOf('src="priorities-ui.js"'));
 assert.match(check,/'priority-profiles.js':'WFPriorityProfiles'/);
});
test('Audit croisé : classement, points détaillés et repères du guide sont cohérents sur les quatre maîtrises',()=>{
 const r=require('../scripts/audit-personnalise.cjs')();
 assert.equal(r.profiles,56);assert.equal(r.explanations,6272);
 assert.deepEqual(r.anomalies,[]);
});
