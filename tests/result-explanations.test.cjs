'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js');
const X=require('../result-explanations.js');

test('Égalités : rang partagé exact, sans transformer un arrondi commun en égalité',()=>{
 const rows=[100,100,99.9,85,85].map((score,i)=>({score,className:'Classe '+i}));
 const before=JSON.stringify(rows),positions=X.ranks(rows);
 assert.deepEqual(positions.map(p=>p.rank),[1,1,3,4,4]);
 assert.deepEqual(positions.map(p=>p.tied),[true,true,false,true,true]);
 assert.equal(positions[2].close,true);
 assert.equal(positions[2].leader,false);
 assert.equal(JSON.stringify(rows),before);
 assert.equal(X.tieNote([]),'');
 assert.equal(X.tieNote(rows.slice(2,3)),'');
});

test('Repères de rang explicites : égalité nommée, écart chiffré avec la classe juste au-dessus',()=>{
 const rows=[['Démoniste',100],['Paladin',100],['Druide',95],['Prêtre',95],['Chaman',94.62],['Mage',89.2],['Guerrier',88.4],['Chasseur',82],['Voleur',80],['Rogue',70]]
  .map(([className,score])=>({className,score}));
 const hints=rows.map((r,i)=>X.rankHint(rows,i));
 assert.deepEqual(hints,['à égalité avec le Paladin','à égalité avec le Démoniste','à égalité avec le Prêtre','à égalité avec le Druide',
  '0,4 point derrière le Druide et le Prêtre','','0,8 point derrière le Mage','','2 points derrière le Chasseur','']);
 const four=[100,100,100,100,99.98].map((score,i)=>({className:'C'+i,score}));
 assert.equal(X.rankHint(four,0),'à égalité avec 3 autres classes');
 assert.equal(X.rankHint(four,4),'moins de 0,1 point derrière les 4 classes à égalité au-dessus');
 assert.equal(X.rankHint([],0),'');
});

test('Les égalités des soigneurs incluent la quatrième classe au-delà des trois cartes',()=>{
 const r=E.recommend({roles:{soin:5},rolesStrict:true,mastery:2});
 assert.equal(r.results.length,4);
 const note=X.tieNote(r.results);
 for(const row of r.results)assert.ok(note.includes(row.spec.className));
 assert.ok(X.ranks(r.results).every(p=>p.tied&&p.rank===1));
 // Sans façon de soigner précisée, l'explication invite à la préciser (référence v8).
 assert.match(X.contextNotes({profile:r.profile}).join(' '),/préciser ta façon de soigner/);
});

test('Familier : la limite dépend du profil demandé et de la configuration, sans modifier les scores',()=>{
 const p=E.sanitize({styles:{ctrl:5},pet:{value:'avoid',strict:true,certainty:5}});
 const before=JSON.stringify(E.recommend(p));
 const aff=E.petless['demoniste-affliction'];
 const mage=E.specs.find(s=>s.id==='mage-givre');
 const bm=E.specs.find(s=>s.id==='chasseur-maitrise-betes');
 assert.match(X.petNotice(aff,p),/Évaluée sans démon/);
 assert.match(X.petNotice(aff,p),/Séduction ni Verrou magique/);
 assert.match(X.petNotice(E.specs.find(s=>s.id==='chasseur-precision'),p),/Loup solitaire/);
 // Le texte décrit la variante réellement évaluée par le moteur pour ce profil.
 const warlock=E.recommend(p).results.find(r=>r.spec.classId==='demoniste');
 assert.equal(warlock.spec.variant,'sans-familier');
 assert.match(X.petNotice(warlock.spec,p),/Évaluée sans démon/);
 assert.equal(X.petNotice(mage,p),'');
 assert.equal(X.petNotice(aff,E.sanitize(null)),'');
 assert.match(X.petNotice(bm,E.sanitize({pet:{value:'avoid'}})),/familier est central/);
 assert.equal(JSON.stringify(E.recommend(p)),before);
});

test('Pourquoi cette piste : la part de chaque critère fait exactement le score affiché',()=>{
 const profiles=[{roles:{soin:4},activities:{raid:4},styles:{support:2},healStyles:{groupe:4}},
  {roles:{dps:5},range:{value:'distance',certainty:2},pet:{value:'avoid',certainty:5},difficulty:{value:'simple',certainty:3},activities:{bg:3,world:1}},
  {styles:{ctrl:0,zone:5,burst:3}}];
 for(const profile of profiles)for(const t of E.recommend(profile).top){
  const parts=X.scoreParts(t.fit,t.score);
  assert.deepEqual(parts.map(p=>p.key),['roles','healStyles','activities','range','styles','pet','difficulty'].filter(k=>k in t.fit));
  assert.equal(parts.reduce((s,p)=>s+p.points,0),Math.round(t.score),t.spec.id);
  assert.equal(parts.reduce((s,p)=>s+p.max,0),100,t.spec.id);
  for(const p of parts)assert.ok(p.points<=p.max&&p.fit>=0&&p.fit<=100&&p.label,t.spec.id+'/'+p.key);
 }
 assert.deepEqual(X.scoreParts({},0),[]);
});

/* Révision du 21 octobre 2026 : chaque choix se lit en trois temps, avec les mots du questionnaire.
 * « Repère de la spécialisation » ne disait pas qu'il s'agit de la note de référence, et la
 * certitude choisie n'était pas rappelée. */
test('Pourquoi cette piste : note de référence, ton choix, puis le résultat chiffré de chaque réponse',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const ui=fs.readFileSync(path.join(__dirname,'..','questionnaire.js'),'utf8');
 // Mêmes mots que le curseur de certitude et que les options du questionnaire.
 const certWords=JSON.parse(ui.match(/var certWords=(\[[^\]]+\]);/)[1].replace(/'/g,'"'));
 assert.deepEqual(X.certaintyWords,certWords.map(w=>w.toLowerCase()));
 for(const [key,label] of Object.entries({burst:'Dégâts explosifs',surv:'Résistance',world:'PvP sauvage et duel',solo:'Solo et farm',groupe:'Soigner tout le groupe'}))
  assert.ok(ui.includes(label),label+' figure dans le questionnaire'),assert.equal(X.answerLabel({domain:'x',key},{}),label);
 const profiles=[{roles:{soin:5},activities:{bg:0,solo:3},range:{value:'distance',certainty:0},styles:{zone:4,surv:5,support:4},mastery:3},
  {roles:{tank:4,soin:2},rolesStrict:true,healStyles:{groupe:3},pet:{value:'avoid',certainty:5,strict:true},difficulty:{value:'simple',certainty:3},activities:{raid:4},range:{value:'mixte',certainty:4},mastery:0}];
 for(const p of profiles)for(const row of E.ranking(p).results){
  const ex=E.explain(row.spec.id,p);
  for(const a of ex.answers){
   const lines=X.answerLines(a,ex),[spec,choice,result]=lines.map(l=>l.text);
   assert.deepEqual(lines.map(l=>l.lead),['La spécialisation','Ton choix','Donc']);
   if(a.note!==undefined){
    assert.match(spec,new RegExp('^'+X.number(a.note)+'/5 \\(note de référence\\)'));
    assert.equal(spec.includes('avec ta maîtrise'),Math.abs(a.note-a.adjusted)>.001,spec);
   }
   assert.match(choice,new RegExp('^certitude (moyenne )?'+X.number(a.certainty)+'/5 \\('+X.certaintyWords[Math.round(a.certainty)]+'\\)'));
   // Le résultat final est l'adéquation du moteur, certitude comprise.
   assert.match(result,new RegExp((Math.abs(a.fit-a.raw)<.005?' : ':', ')+Math.round(a.fit*100)+'\u00a0%\\.'),result);
   assert.doesNotMatch(lines.map(l=>l.text).join(' '),/Repère|undefined|NaN/);
  }
 }
 const ex=E.explain('druide-restauration',profiles[0]),bg=ex.answers.find(a=>a.key==='bg'),solo=ex.answers.find(a=>a.key==='solo');
 assert.deepEqual(X.answerLines(bg,ex).map(l=>l.text),['5/5 (note de référence)','certitude 0/5 (intuition)','elle y répond pleinement (100\u00a0%) ; compte tenu de ta certitude, 63\u00a0%.']);
 assert.equal(X.answerLines(solo,ex)[0].text,'3/5 (note de référence) · 3,3/5 avec ta maîtrise (expert)');
 const strict=E.explain('druide-restauration',profiles[1]),roles=X.answerLines(strict.answers.find(a=>a.domain==='roles'),strict);
 assert.match(roles[0].text,/^sa classe propose Tank et Soin ; cette spécialisation joue Soin · aisance estimée en PvE : \d+\u00a0%$/);
 assert.match(roles[1].text,/^certitude moyenne 3\/5 \(assez sûr\) · tous ces rôles indispensables$/);
 assert.match(roles[2].text,/Ce que propose sa classe compte pour 65 %, la spécialisation retenue pour 35 %\.$/);
 assert.match(X.answerLines(strict.answers.find(a=>a.domain==='pet'),strict)[1].text,/uniquement sans familier$/);
 const partial=E.explain('guerrier-protection',{...profiles[1],rolesStrict:false});
 assert.match(X.answerLines(partial.answers.find(a=>a.domain==='roles'),partial)[0].text,/^sa classe propose Tank, pas Soin ; cette spécialisation joue Tank/);
 const none=E.explain('mage-givre',{...profiles[1],rolesStrict:false});
 assert.match(X.answerLines(none.answers.find(a=>a.domain==='roles'),none)[0].text,/^sa classe ne propose aucun de ces rôles ; cette spécialisation joue DPS/);
 assert.equal(X.mainTradeoff(none),'Tes rôles Tank + Soin : 0 % de correspondance. C’est le principal compromis avec tes envies.');
 // Le rendu échappe le texte et marque la ligne du résultat.
 assert.equal(X.answerHtml('A & B',[{lead:'La spécialisation',text:'<b>'},{lead:'Donc',text:'ok'}]),
  '<div class="reco-answer"><b class="reco-answer-title">A &amp; B</b><dl class="reco-answer-steps"><div><dt>La spécialisation</dt><dd>&lt;b&gt;</dd></div><div class="is-result"><dt>Donc</dt><dd>ok</dd></div></dl></div>');
});

test('Pourquoi cette place : même lecture en trois temps, avec le poids et sa part dans le groupe',()=>{
 const w={ctrl:2,surv:3,tank:3,soin:1,poly:1,tech:2,bg:1},ex=E.priorityExplain('paladin-protection',w,3);
 const groups=X.priorityParts(ex,ex.score),axes=groups.flatMap(g=>g.axes);
 assert.equal(axes.length,7);
 for(const a of axes){
  assert.deepEqual(a.lines.map(l=>l.lead),['La spécialisation','Ton choix','Donc']);
  assert.match(a.lines[1].text,/^poids [123] sur 3/);
  assert.doesNotMatch(a.lines.map(l=>l.text).join(' '),/Repère|undefined|NaN/);
 }
 const ctrl=axes.find(a=>a.key==='ctrl');
 assert.deepEqual(ctrl.lines.map(l=>l.text),['2/5 (note de référence) · 2,1/5 avec ta maîtrise (expert)','poids 2 sur 3 · 40\u00a0% du groupe « Style de combat »','elle y répond peu : 27\u00a0%.']);
 assert.equal(axes.find(a=>a.key==='bg').lines[1].text,'poids 1 sur 3','un critère seul dans son groupe n’en indique pas la part');
 assert.equal(axes.find(a=>a.key==='soin').lines[0].text,'ne joue pas ce rôle (rôle Tank)');
 assert.equal(X.priorityTradeoff(ex),'Contrôle (poids 2) : 2/5 (note de référence) · 2,1/5 avec ta maîtrise (expert). C’est le principal écart avec tes critères.');
});
