'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),X=require('../result-explanations.js');
const spec=id=>E.specs.find(s=>s.id===id),clamp=(v,a,b)=>Math.min(b,Math.max(a,v));
const near=(a,b,msg)=>assert.ok(Math.abs(a-b)<1e-10,msg||`${a} != ${b}`);
const all=()=>[...E.specs,...Object.values(E.petless)];

test('PvE de groupe : 75 % monocible et 25 % zone, même configuration et aucune note source changée',()=>{
 const before=structuredClone(all());
 for(const s of all()){
  for(const k of Object.keys(s.activity)){
   const expected=k==='raid'&&s.role==='dps'?.75*s.activity.raid+.25*s.style.zone:s.activity[k];
   near(E.activityNote(s,k),expected,s.id+'/'+k);
  }
  if(s.role==='dps'){
   const d=E.groupPveDetails(s,2);
   assert.equal(d.singleTargetShare,.75);assert.equal(d.areaShare,.25);
   assert.equal(d.singleTarget,s.activity.raid);assert.equal(d.area,s.style.zone);
   near(d.note,.75*s.activity.raid+.25*s.style.zone);
  }else assert.equal(E.groupPveDetails(s,2),null);
 }
 near(E.activityNote(spec('chasseur-survie'),'raid'),4.5);
 near(E.activityNote(spec('mage-feu'),'raid'),4.25);
 assert.deepEqual(all(),before);
});

test('La maîtrise PvE intervient une seule fois après la synthèse, y compris sans familier',()=>{
 for(const s of all())for(let m=0;m<4;m++){
  const note=s.role==='dps'?.75*s.activity.raid+.25*s.style.zone:s.activity.raid;
  near(E.adjustedActivity(s,'raid',m),clamp(note+clamp([-.29,-.13,0,.09][m]*s.load.pve,-1.2,.35),1,5),s.id+'/'+m);
  if(s.role==='dps')near(E.roleSuitability(s,m,{raid:1}),(E.adjustedActivity(s,'raid',m)-1)/4);
  else near(E.roleSuitability(s,m,{raid:1}),.55*(E.roleReference[s.classId][s.role]-1)/4+.45*(E.adjustedActivity(s,'raid',m)-1)/4);
 }
});

test('La zone compte dans l’activité et le rôle DPS sans sélectionner le style Zone ; le choisir renforce cette envie',()=>{
 const p={roles:{dps:5},activities:{raid:5},mastery:2};
 const id='mage-feu',s=spec(id),initial=s.style.zone;
 const before=E.explain(id,p),personal=E.priorityExplain(id,{dps:3,raid:3},2);
 try {
  s.style.zone=initial-1;
  const after=E.explain(id,p),pa=E.priorityExplain(id,{dps:3,raid:3},2);
  assert.ok(after.score<before.score);assert.ok(pa.score<personal.score);
  const activity=ex=>ex.answers.find(a=>a.domain==='activities');
  near(activity(before).note-activity(after).note,.25);
  assert.ok(!before.answers.some(a=>a.key==='zone'));assert.ok(!personal.axes.some(a=>a.key==='zone'));
 }finally{s.style.zone=initial;}
 const withZone=E.explain(id,{...p,styles:{zone:5}});
 near(withZone.answers.find(a=>a.domain==='activities').note,before.pveDamage.note);
 assert.ok(withZone.answers.some(a=>a.domain==='styles'&&a.key==='zone'));
 assert.ok(E.priorityExplain(id,{dps:3,raid:3,zone:3},2).axes.some(a=>a.key==='zone'));
});

test('PvP et solo explicites : aucune influence du monocible ou de la zone si ce style n’est pas demandé',()=>{
 const data=all(),saved=data.map(s=>[s.activity.raid,s.style.zone]);
 const compact=r=>r.results.map(x=>[x.spec.id,x.spec.variant,x.score]);
 for(const activities of [{bg:5},{world:5},{solo:5},{bg:5,solo:5}])for(const mastery of [0,2,3]){
  const p={roles:{dps:5},activities,styles:{ctrl:3},mastery};
  const w={dps:3,ctrl:2,bg:activities.bg?3:0,sauv:activities.world?3:0,solo:activities.solo?3:0};
  const a=compact(E.ranking(p)),b=compact(E.priorityRanking(w,mastery));
  try {data.forEach(s=>{s.activity.raid=1;s.style.zone=1;});
   assert.deepEqual(compact(E.ranking(p)),a);assert.deepEqual(compact(E.priorityRanking(w,mastery)),b);
  }finally{data.forEach((s,i)=>{s.activity.raid=saved[i][0];s.style.zone=saved[i][1];});}
  assert.equal(E.explain('mage-feu',p).pveDamage,null);
  assert.equal(E.priorityExplain('mage-feu',w,mastery).pveDamage,null);
 }
});

test('La trace utilise la synthèse comme référence et distingue la maîtrise d’une faiblesse de la classe',()=>{
 const p={roles:{dps:5},activities:{raid:5},mastery:2},ex=E.explain('mage-feu',p);
 const a=ex.answers.find(a=>a.domain==='activities');
 near(a.note,4.25);near(a.base,(4.25-1)/4);near(a.causes.mastery,0);
 const novice=E.explain('mage-feu',{...p,mastery:0});
 for(const a of novice.answers.filter(a=>a.domain==='activities'||a.domain==='roles')){
  assert.match(X.friendlyAnswer(a,novice),/réflexes restent à prendre/);
  assert.doesNotMatch(X.friendlyAnswer(a,novice),/limites|moins à l’aise/);
 }
 const personal=E.priorityExplain('mage-feu',{dps:3,raid:3},0);
 assert.match(X.friendlyAnswer(personal.axes.find(a=>a.key==='dps'),personal),/réflexes restent à prendre/);
 const html=X.calculationHtml(X.pisteParts(ex,E.ranking(p).results.find(r=>r.spec.id==='mage-feu').fit,ex.score),ex);
 assert.doesNotMatch(html,/75\s?%|25\s?%|Synthèse|Repère PvE de groupe/);
 assert.doesNotMatch(html,/<details[^>]*\bopen\b/);
 assert.doesNotMatch(X.pveProfile(ex),/\d|%|NaN|undefined/);
 for(const p0 of [{roles:{dps:5}},{activities:{raid:5}},{roles:{dps:5},activities:{raid:5,bg:5}}]){
  const e=E.explain('mage-feu',p0);assert.ok(e.pveDamage);
  for(const row of e.answers)near(row.causes.aptitude+row.causes.mastery+row.causes.certainty,row.loss);
 }
});
