'use strict';
/* Tests de contrat, de cas de référence et génératifs. Toute hypothèse chiffrée
 * sur les performances des spécialisations reste éditoriale, non validée au niv. 60. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../recommendation-engine.js');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'..','questionnaire.js'),'utf8');
const js=fs.readFileSync(path.join(__dirname,'..','recommendation-engine.js'),'utf8');
function names(r){return r.top.map(x=>x.className);}
function best(p){return E.recommend(p).top[0];}
test('Inventaire : 9 classes, 27 spécialisations + 1 configuration Farouche ours, source par classe',()=>{
 assert.deepEqual(E.checkData(),[]);
 assert.equal(E.specs.length,28);
 assert.equal(new Set(E.specs.map(s=>s.classId)).size,9);
 assert.equal(new Set(E.specs.map(s=>s.id)).size,28);
 assert.equal(E.specs.filter(s=>s.classId==='druide').length,4);
 assert.equal(E.specs.filter(s=>s.classId==='chasseur').length,3);
 for(const s of E.specs){assert.match(s.source,/^https:\/\/worldofwarcraft\.blizzard\.com\//);assert.ok(s.dataQuality.officialKit);}
 assert.ok(js.includes('pas des mesures de niveau 60'));
});
test('L’accueil reste sans classement quand aucune préférence n’est exprimée',()=>{
 const r=E.recommend({});
 assert.equal(r.status,'unanswered');
 assert.equal(r.top.length,0);
 assert.equal(r.compatible,0);
 assert.equal(E.ranking({mastery:3}).status,'unanswered');
});
test('Les contraintes strictes ne peuvent jamais être enfreintes',()=>{
 const p={roles:{tank:5},rolesStrict:true,range:{value:'distance',strict:true,certainty:5}};
 assert.equal(E.recommend(p).status,'no-match');
 const noPet=E.recommend({pet:{value:'avoid',strict:true,certainty:5}});
 assert.ok(noPet.results.every(x=>x.spec.pet!=='core'));
 const noMelee=E.recommend({range:{value:'distance',strict:true,certainty:3}});
 assert.ok(noMelee.results.every(x=>x.spec.range==='distance'));
 const multirole=E.recommend({roles:{tank:5,soin:4},rolesStrict:true});
 assert.deepEqual([...new Set(names(multirole))].sort(),['Druide','Paladin']);
});
test('Une préférence de portée souple ne doit pas exclure la mêlée',()=>{
 const p={range:{value:'distance',certainty:4,strict:false}};
 const r=E.ranking(p);
 assert.ok(r.results.some(x=>x.spec.range==='melee'));
 assert.equal(r.status,'ok');
});
test('Le rôle ne profite pas à une classe simplement parce qu’elle a plus de rôles',()=>{
 const p={roles:{dps:5}};
 const r=E.ranking(p);
 assert.ok(r.results.slice(0,3).every(x=>x.spec.role==='dps'));
 assert.ok(E.eligible(E.specs.find(x=>x.role==='tank'),E.sanitize(p)), 'sans veto explicite les autres rôles restent éligibles');
 const mage=E.specs.find(x=>x.id==='mage-feu');
 const druid=E.specs.find(x=>x.id==='druide-equilibre');
 assert.ok(E.eligible(mage,E.sanitize(p)));
 assert.ok(E.eligible(druid,E.sanitize(p)));
 assert.ok(E.ranking({roles:{dps:5},rolesStrict:true}).results.every(x=>x.spec.role==='dps'));
});
test('Faible certitude dans un rôle : aucune exclusion implicite',()=>{
 const soft=E.ranking({roles:{tank:0}});
 const hard=E.ranking({roles:{tank:0},rolesStrict:true});
 assert.ok(soft.results.some(x=>x.spec.role==='dps'));
 assert.ok(hard.results.every(x=>x.spec.role==='tank'));
 assert.ok(soft.results.length>hard.results.length);
});
test('Les six thèmes sont ignorés s’ils ne sont pas renseignés',()=>{
 const a=E.recommend({styles:{ctrl:5,zone:5}});
 const b=E.recommend({styles:{ctrl:5,zone:5},pet:{value:'any',certainty:5},difficulty:{value:'any',certainty:0},mastery:2});
 assert.deepEqual(a.top.map(x=>[x.spec.id,x.score]),b.top.map(x=>[x.spec.id,x.score]));
 assert.deepEqual(a.used,['styles']);
});
test('Certitude 0 = intuition et non veto ; monotonie du soutien à une préférence',()=>{
 assert.ok(E.intensity(0)>0 && E.intensity(0)<1);
 for(let score=0;score<=10;score++){
   const raw=score/10;
   for(let n=0;n<5;n++){
     const a=E.preferenceFit(raw,n),b=E.preferenceFit(raw,n+1);
     if(raw>.5)assert.ok(b>=a);
     else if(raw<.5)assert.ok(b<=a);
     assert.ok(a>=0 && a<=1);
   }
 }
 assert.equal(E.recommend({range:{value:'distance',certainty:0,strict:false}}).status,'ok');
});
test('Le joueur peut explorer même lorsque les réponses sont hésitantes',()=>{
 const p={roles:{dps:0},activities:{world:1},styles:{ctrl:2}};
 const r=E.recommend(p);
 assert.equal(r.status,'ok');
 assert.ok(r.uncertain.length>=3);
 assert.ok(r.top[0].scenarioAppearances<=r.top[0].scenarioCount);
 assert.ok(r.top[0].scenarioCount>=1);
 assert.deepEqual(r.scenarios,E.recommend(p).scenarios);
});
test('Les spécialisations sont évaluées séparément : Farouche chat ≠ ours',()=>{
 const s1=E.specs.find(s=>s.id==='druide-farouche-chat');
 const s2=E.specs.find(s=>s.id==='druide-farouche-ours');
 assert.equal(s1.role,'dps');
 assert.equal(s2.role,'tank');
 assert.equal(s1.range,'melee');
 assert.ok(E.eligible(s1,E.sanitize({roles:{dps:5}})));
 assert.equal(E.eligible(s1,E.sanitize({roles:{tank:5},rolesStrict:true})),false);
});
test('Chasseur sans familier : configurations possibles, pas la Maîtrise des bêtes',()=>{
 const r=E.recommend({roles:{dps:5},range:{value:'distance',certainty:5,strict:true},pet:{value:'avoid',certainty:5,strict:true}});
 assert.ok(r.results.some(x=>x.spec.classId==='chasseur'&&x.spec.id==='chasseur-precision'));
 assert.ok(r.results.every(x=>x.spec.pet!=='core'));
});
test('La maîtrise est indépendante de la préférence pour un jeu difficile',()=>{
 const p=E.sanitize({roles:{dps:5},difficulty:{value:'complex',certainty:5},mastery:0});
 assert.equal(p.mastery,0);
 assert.equal(p.difficulty.value,'complex');
 const b=E.sanitize({roles:{dps:5},difficulty:{value:'simple',certainty:5},mastery:3});
 assert.equal(b.mastery,3);
 assert.equal(b.difficulty.value,'simple');
 const hunter=E.specs.find(s=>s.id==='chasseur-maitrise-betes');
 assert.equal(E.adjustedActivity(hunter,'solo',0),hunter.activity.solo);
});
test('Cas de référence indépendants : préférences ciblées et exclusion des contrariétés',()=>{
 const cases=[
  // v11 : à la maîtrise Expert, le bonus de contrôle suit la difficulté PvP (référentiel de complexité). Affliction sans
  // démon (4/5) devance Arcane (3/5) de 0,11 point ; en v10 (3/5 contre 4/5), c'était l'inverse, du même écart.
  ['Contrôle de zone DPS distance sans pet', {roles:{dps:5},range:{value:'distance',certainty:5,strict:true},pet:{value:'avoid',certainty:5,strict:true},styles:{ctrl:5,zone:5},activities:{raid:4},mastery:3},'Démoniste'],
  ['Duel mobile en mêlée', {roles:{dps:5},range:{value:'melee',certainty:5,strict:true},styles:{ctrl:5,burst:5,mob:5},activities:{world:5},mastery:3},'Voleur'],
  ['Solo accessible aux débutants',{activities:{solo:5},difficulty:{value:'simple',certainty:5},mastery:0},'Chasseur'],
  // v2 : soin Paladin 4→5, sa résistance le place devant ; aucune modification des poids.
  ['Soigneur soutien BG',{roles:{soin:5},activities:{bg:5},styles:{support:5,surv:4}},'Paladin']
 ];
 for(const [label,p,expected] of cases)assert.equal(best(p).className,expected,label);
});
test('Indépendance déterministe et immutabilité des entrées',()=>{
 const profile={roles:{dps:4},activities:{bg:2},styles:{burst:0}};
 const before=JSON.stringify(profile);
 const a=E.recommend(profile),b=E.recommend(profile);
 assert.deepEqual(names(a),names(b));
 assert.equal(JSON.stringify(profile),before);
 assert.equal(JSON.stringify(E.defaultProfile),JSON.stringify(E.sanitize(null)));
});
test('Données corrompues, 6 choix de style et maîtrise invalide : repli sain',()=>{
 const p=E.sanitize({mastery:44,roles:{tank:100,dps:-1,soin:2},activities:{raid:'5',bg:4},range:{value:'unknown',strict:true},pet:{value:'avoid',certainty:12,strict:'true'},difficulty:{value:'complex',certainty:NaN},styles:{ctrl:0}});
 assert.equal(p.mastery,2);
 assert.deepEqual(p.roles,{soin:2});
 assert.deepEqual(p.activities,{bg:4});
 assert.equal(p.range.value,'any');
 assert.equal(p.pet.strict,false);
 assert.equal(p.pet.certainty,3);
 assert.equal(p.styles.ctrl,0);
 const overspecified=E.sanitize({styles:{burst:5,zone:5,ctrl:5,surv:5,mob:5,support:5}});
 assert.equal(E.selected(overspecified.styles).length,3, 'une sauvegarde corrompue ne contourne pas la limite de trois styles');
});
test('Extraits HTML : formulaire accessible, charte existante conservée, JS valide',()=>{
 assert.match(html,/id="reco-form"/);
 assert.match(html,/id="reco-results" class="reco-results" aria-live="polite"/);
 assert.match(html,/src="recommendation-engine\.js"/);
 assert.match(html,/src="questionnaire\.js"/);
 assert.match(html,/id="h-matrix"/);
 // Le comparatif historique, dépassé, est retiré de la page ; ses données restent dans window.__WF.
 assert.doesNotMatch(html,/id="rank"|legacy-advanced|Explorer le comparatif historique/);
 // À l'arrivée, aucun parcours n'est ouvert : le visiteur choisit.
 assert.match(html,/id="reco-app" class="reco-panel is-choosing"/);
 assert.match(html,/id="reco-guided" role="tabpanel" aria-labelledby="reco-tab-guided" hidden/);
 assert.match(ui,/aria-pressed/);
 assert.match(ui,/type="range" min="0" max="5"/);
 assert.match(ui,/type="checkbox"/);
 assert.match(ui,/data-mastery/);
 assert.doesNotThrow(()=>new Function('window','document','localStorage',ui));
 assert.doesNotThrow(()=>new Function('module',js));
});
function random(seed){
 let s=seed>>>0;return function(){s=(Math.imul(s,1664525)+1013904223)>>>0;return s/4294967296;};
}
test('12 000 profils synthétiques reproductibles : finitude, déterminisme, contraintes et classes distinctes',()=>{
 const r=random(20261020),pick=a=>a[Math.floor(r()*a.length)],winner={};let noMatch=0,unanswered=0,visited=0;
 for(let i=0;i<12000;i++){
  const p={mastery:Math.floor(r()*4)};
  if(r()<.83){p.roles={};for(let j=0;j<1+Math.floor(r()*2);j++)p.roles[pick(E.roles)]=Math.floor(r()*6);p.rolesStrict=r()<.17;}
  if(r()<.77){p.activities={};for(let j=0;j<1+Math.floor(r()*3);j++)p.activities[pick(E.activities)]=Math.floor(r()*6);}
  if(r()<.6)p.range={value:pick(['distance','melee','mixte']),certainty:Math.floor(r()*6),strict:r()<.18};
  if(r()<.71){p.styles={};for(let j=0;j<1+Math.floor(r()*3);j++)p.styles[pick(E.styles)]=Math.floor(r()*6);}
  if(r()<.46)p.pet={value:pick(['like','avoid']),certainty:Math.floor(r()*6),strict:r()<.24};
  if(r()<.49)p.difficulty={value:pick(['simple','complex']),certainty:Math.floor(r()*6)};
  const report=E.recommend(p);
  if(report.status==='no-match'){noMatch++;continue;}
  if(report.status==='unanswered'){unanswered++;continue;}
  visited++;
  assert.ok(report.top.length>=1 && report.top.length<=3);
  // Depuis la v10 : au plus deux spécialisations d'une même classe, sinon l'ordre du classement.
  const perClass={};for(const v of report.top)perClass[v.classId]=(perClass[v.classId]||0)+1;
  assert.ok(Object.values(perClass).every(n=>n<=2));
  assert.deepEqual(report.top.map(v=>v.spec.id),E.topPicks(report.results,3).map(v=>v.spec.id));
  assert.ok(report.top.every(v=>Number.isFinite(v.score)&&v.score>=0&&v.score<=100&&E.eligible(v.spec,report.profile)));
  assert.ok(report.top.every(v=>v.scenarioAppearances<=v.scenarioCount));
  winner[report.top[0].classId]=(winner[report.top[0].classId]||0)+1;
 }
 assert.ok(visited>9000);
 assert.equal(Object.keys(winner).length,9,'chaque classe doit pouvoir émerger sous certains profils');
 assert.ok(noMatch>0,'les contraintes impossibles ne doivent pas être masquées');
 // Ce n'est volontairement PAS un test d'équité en 11,1% : le générateur n'est pas une enquête de joueurs.
});
