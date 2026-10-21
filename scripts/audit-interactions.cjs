'use strict';
// Audit reproductible : choix isolés, toutes les paires de choix simples aux certitudes
// 0 et 5, quatre maîtrises, puis profils composés déterministes. Ne change aucune donnée.
const assert=require('node:assert/strict'),crypto=require('node:crypto'),path=require('node:path');
const {execFileSync}=require('node:child_process'),Module=require('node:module');
const E=require('../recommendation-engine.js'),X=require('../result-explanations.js');
const {allowedChange}=require('./reference-v9.cjs');
const root=path.resolve(__dirname,'..'),baseline='f5bf5f6eaff1265348a40d77be38e884732e310d';
const code=execFileSync('git',['show',baseline+':recommendation-engine.js'],{cwd:root,encoding:'utf8'});
const baselineFile=path.join(root,'baseline-audit.cjs'),moduleBefore=new Module(baselineFile);moduleBefore._compile(code,baselineFile);
const before=moduleBefore.exports,groups={roles:[],activities:[],range:[],styles:[],healStyles:[],pet:[],difficulty:[]};
for(const certainty of [0,5]){
 for(const key of E.roles)for(const rolesStrict of [false,true])groups.roles.push({roles:{[key]:certainty},rolesStrict});
 for(const key of E.activities)groups.activities.push({activities:{[key]:certainty}});
 for(const key of E.styles)groups.styles.push({styles:{[key]:certainty}});
 for(const key of E.healStyles)groups.healStyles.push({healStyles:{[key]:certainty}});
 for(const value of ['distance','melee','mixte'])for(const strict of [false,true])groups.range.push({range:{value,certainty,strict}});
 for(const value of ['like','avoid'])for(const strict of [false,true])groups.pet.push({pet:{value,certainty,strict}});
 for(const value of ['simple','complex'])groups.difficulty.push({difficulty:{value,certainty}});
}
const cases=[{}],families=Object.values(groups);
for(let i=0;i<families.length;i++)for(const a of families[i]){
 cases.push(a);for(let j=i+1;j<families.length;j++)for(const b of families[j])cases.push({...a,...b});
}
let seed=20261021;
const rand=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
const multi=(keys,max)=>Object.fromEntries(keys.filter(()=>rand(3)!==0).slice(0,max).map(k=>[k,rand(6)]));
const composed=[];
for(let i=0;i<1000;i++)composed.push({roles:multi(E.roles,3),rolesStrict:rand(3)===0,activities:multi(E.activities,4),styles:multi(E.styles,3),healStyles:multi(E.healStyles,2),
 range:{value:['any','distance','melee','mixte'][rand(4)],certainty:rand(6),strict:rand(3)===0},
 pet:{value:['any','like','avoid'][rand(3)],certainty:rand(6),strict:rand(3)===0},
 difficulty:{value:['any','simple','complex'][rand(3)],certainty:rand(6)},mastery:rand(4)});
const profiles=cases.flatMap(p=>[0,1,2,3].map(mastery=>({...p,mastery}))).concat(composed);
const status={},winners={},digest=crypto.createHash('sha256');let rows=0,answers=0,changedGuidedProfiles=0,changedTopClasses=0,changedRows=0,maxAbsoluteScoreDelta=0;
const causes={pet:0,heal:0,both:0};
for(const p of profiles){
 digest.update(JSON.stringify(p)+'\n');
 const r=E.ranking(p),old=before.ranking(p);
 assert.equal(r.status,old.status);assert.equal(r.compatible,old.compatible);
 let changed=false;
 for(const a of old.results){
  const b=r.results.find(x=>x.spec.classId===a.spec.classId);assert.ok(b);
  if(!allowedChange(p,a.spec.classId))assert.deepEqual([b.spec.id,b.score,b.fit],[a.spec.id,a.score,a.fit],'Changement hors périmètre');
  if(b.spec.id!==a.spec.id||b.score!==a.score){changed=true;changedRows++;maxAbsoluteScoreDelta=Math.max(maxAbsoluteScoreDelta,Math.abs(b.score-a.score));}
 }
 if(changed){changedGuidedProfiles++;const heal=Object.keys(r.profile.healStyles).length>0,pet=r.profile.pet.value!=='any';causes[heal?(pet?'both':'heal'):'pet']++;}
 if(r.results[0]?.spec.classId!==old.results[0]?.spec.classId)changedTopClasses++;
 assert.deepEqual(E.sanitize(r.profile),r.profile,'Normalisation idempotente');
 status[r.status]=(status[r.status]||0)+1;
 if(r.results.length){const best=r.results[0].score;for(const winner of r.results.filter(x=>x.score===best))winners[winner.spec.classId]=(winners[winner.spec.classId]||0)+1;}
 assert.equal(new Set(r.results.map(x=>x.spec.classId)).size,r.results.length,'Une seule configuration par classe');
 for(const row of r.results){
  rows++;assert.ok(row.score>=0&&row.score<=100);assert.ok(E.eligible(row.spec,r.profile));
  const trace=E.explain(row.spec.id,p),parts=X.scoreParts(row.fit,row.score);answers+=trace.answers.length;
  assert.equal(trace.score,row.score);assert.deepEqual(trace.spec,row.spec);
  // Le score public conserve l'ordre d'arrondi du moteur. Sommer les contributions dans
  // un autre ordre peut changer le dernier bit à une frontière de demi-centième.
  assert.ok(Math.abs(trace.answers.reduce((n,a)=>n+a.points,0)-trace.rawScore)<1e-8,'Somme des réponses avant arrondi');
  for(const a of trace.answers){assert.ok(a.max>=0&&a.loss>=-1e-9);assert.ok(Math.abs(a.loss-a.causes.aptitude-a.causes.mastery-a.causes.certainty)<1e-8);}
  assert.equal(parts.reduce((n,a)=>n+a.points,0),Math.round(row.score));assert.equal(parts.reduce((n,a)=>n+a.max,0),100);
  for(const a of parts)assert.ok(a.points>=0&&a.points<=a.max,'Points affichés bornés');
 }
}
// Les 14 axes du mode personnalisé : seuls, par paires et profils composés.
const weights=[];
for(let i=0;i<E.priorityAxes.length;i++)for(const force of [1,3]){
 weights.push({[E.priorityAxes[i]]:force});
 for(let j=i+1;j<E.priorityAxes.length;j++)for(const other of [1,3])weights.push({[E.priorityAxes[i]]:force,[E.priorityAxes[j]]:other});
}
for(let i=0;i<300;i++)weights.push(Object.fromEntries(E.priorityAxes.map(k=>[k,rand(4)])));
for(const w of weights)for(let mastery=0;mastery<4;mastery++){
 const current=E.priorityRanking(w,mastery),previous=before.priorityRanking(w,mastery);
 // L'étiquette Loup solitaire est nouvelle, sans changement des résultats personnalisés.
 const normalized=JSON.parse(JSON.stringify(current));for(const row of normalized.results)if(row.spec.id==='chasseur-precision')delete row.spec.variant;
 assert.deepEqual(normalized,previous);
}
const short=p=>E.ranking(p).results.map(r=>({classe:r.spec.className,specialisation:r.spec.id,score:r.score,variante:r.spec.variant||'référence',familier:r.fit.pet?Math.round(100*r.fit.pet.value):null}));
const control={styles:{ctrl:5},range:{value:'distance',certainty:5},mastery:2};
const healer={roles:{soin:1},activities:{bg:4,solo:1},range:{value:'melee',certainty:2},styles:{zone:0,surv:5,support:2},difficulty:{value:'simple',certainty:2},mastery:1};
const rounding={roles:{tank:0,dps:1},activities:{bg:2,solo:5},styles:{zone:2,surv:5,support:2},difficulty:{value:'complex',certainty:0},mastery:1};
console.log(JSON.stringify({baseline,engine:E.version,seed:20261021,profilesSha256:digest.digest('hex'),guidedProfiles:profiles.length,priorityProfiles:weights.length*4,rows,answers,status,
 changes:{changedGuidedProfiles,changedTopClasses,changedRows,maxAbsoluteScoreDelta,causes},
 checks:'Changements limités aux règles familiers/soin ; mode personnalisé inchangé ; traces additives, bornes, unicité des classes, exigences strictes et normalisation : OK',
 firstPlaceIncludingTies:winners,frequencyCaveat:'Comptages propres à ce jeu de contrôle, construit pour couvrir les choix. Aucune fréquence représentative des joueurs ; les égalités sont comptées pour chaque classe.',
 observations:{petCertainty:{profile:control,any:short(control),avoid0:short({...control,pet:{value:'avoid',certainty:0}}),avoid5:short({...control,pet:{value:'avoid',certainty:5}})},
 precisionPet:{profile:{styles:{burst:5},range:{value:'distance',certainty:5},pet:{value:'like',certainty:5},mastery:2},results:short({styles:{burst:5},range:{value:'distance',certainty:5},pet:{value:'like',certainty:5},mastery:2})},
 healDenominator:{profile:healer,without:short(healer),withPrevention0:short({...healer,healStyles:{prevention:0}})},
 rounding:{profile:rounding,without:short(rounding),withAvoid5:short({...rounding,pet:{value:'avoid',certainty:5}})}}},null,2));
