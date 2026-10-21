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

/* Révisions du 21 octobre 2026 : chaque choix se lit en trois lignes, avec les mots du questionnaire,
 * le nom de la spécialisation et des mots avant les chiffres ; en tête, le bilan des points manquants. */
test('Pourquoi cette piste : la spécialisation nommée et sa note, ton choix en mots, puis le constat',()=>{
 const fs=require('node:fs'),path=require('node:path');
 const ui=fs.readFileSync(path.join(__dirname,'..','questionnaire.js'),'utf8');
 // Mêmes mots que le curseur de certitude et que les options du questionnaire.
 const certWords=JSON.parse(ui.match(/var certWords=(\[[^\]]+\]);/)[1].replace(/'/g,'"'));
 assert.deepEqual(X.certaintyWords,certWords.map(w=>w.toLowerCase()));
 for(const [key,label] of Object.entries({burst:'Dégâts explosifs',surv:'Résistance',world:'PvP sauvage et duel',solo:'Solo et farm',groupe:'Soigner tout le groupe'}))
  assert.ok(ui.includes(label),label+' figure dans le questionnaire'),assert.equal(X.answerLabel({domain:'x',key},{}),label);
 const where={activities:'pour cette activité',styles:'pour ce style',healStyles:'pour cette façon de soigner'};
 const profiles=[{roles:{soin:5},activities:{bg:0,solo:3},range:{value:'distance',certainty:0},styles:{zone:4,surv:5,support:4},mastery:3},
  {roles:{tank:4,soin:2},rolesStrict:true,healStyles:{groupe:3},pet:{value:'avoid',certainty:5,strict:true},difficulty:{value:'simple',certainty:3},activities:{raid:4},range:{value:'mixte',certainty:4},mastery:0}];
 for(const p of profiles)for(const row of E.ranking(p).results){
  const ex=E.explain(row.spec.id,p),parts=X.pisteParts(ex,row.fit,row.score);
  for(const a of ex.answers){
   const lines=X.answerLines(a,ex),[spec,choice,result]=lines.map(l=>l.text);
   assert.deepEqual(lines.map(l=>l.lead),['La spécialisation','Ton choix','Constat']);
   if(a.note!==undefined){
    assert.ok(spec.startsWith(ex.spec.label+' est notée '+X.number(a.note)+'/5 '+where[a.domain]),spec);
    assert.equal(spec.includes('avec ta maîtrise'),Math.abs(a.note-a.adjusted)>.001,spec);
   }
   const word=X.certaintyWords[Math.round(a.certainty)];
   assert.ok(choice.startsWith(word[0].toUpperCase()+word.slice(1)+' (certitude '),choice);
   // Le constat : à quel point elle répond, puis la valeur retenue après certitude, celle du moteur.
   assert.match(result,new RegExp('^Elle (y répond|n’y répond pas)'));
   assert.match(result,new RegExp((Math.abs(a.fit-a.raw)<.005?'\\('+Math.round(a.raw*100)+'\u00a0%\\)\\.':'adouci à '+Math.round(a.fit*100)+'\u00a0% par ta certitude\\.')),result);
   assert.doesNotMatch(lines.map(l=>l.text).join(' '),/Repère|undefined|NaN|note de référence/);
  }
  // Une ligne par groupe de plusieurs réponses, avec leurs valeurs retenues.
  for(const g of parts){
   const answers=ex.answers.filter(a=>a.domain===g.key);
   assert.equal(g.answers.length,answers.length);
   assert.equal(g.note,answers.length>1?'Moyenne de tes '+answers.length+' choix : '+answers.map(a=>Math.round(a.fit*100)+'\u00a0%').join(answers.length>2?', ':' et ').replace(/, ([^,]+)$/,' et $1')+'.':'');
  }
  // En tête : les points manquants, groupe par groupe, font exactement l'écart à 100.
  const summary=X.pisteMissing(ex,row.fit,row.score),missing=100-Math.round(row.score);
  if(missing<=0)assert.equal(summary,'Elle répond pleinement à tes choix.');
  else{
   assert.ok(summary.startsWith('Il lui manque '+missing+' point'),summary);
   assert.equal([...summary.matchAll(/(\d+) sur (les|la|le) /g)].reduce((n,m)=>n+Number(m[1]),0),missing,summary);
  }
 }
 const ex=E.explain('druide-restauration',profiles[0]),bg=ex.answers.find(a=>a.key==='bg'),solo=ex.answers.find(a=>a.key==='solo');
 assert.deepEqual(X.answerLines(bg,ex).map(l=>l.text),['Restauration est notée 5/5 pour cette activité.','Intuition (certitude 0/5)','Elle y répond pleinement (100\u00a0%), adouci à 63\u00a0% par ta certitude.']);
 assert.equal(X.answerLines(solo,ex)[0].text,'Restauration est notée 3/5 pour cette activité, 3,3/5 avec ta maîtrise (expert).');
 const strict=E.explain('druide-restauration',profiles[1]),roles=X.answerLines(strict.answers.find(a=>a.domain==='roles'),strict);
 assert.match(roles[0].text,/^La classe Druide propose Tank et Soin ; Restauration joue Soin \(aisance estimée en PvE : \d+\u00a0%\)\.$/);
 assert.equal(roles[1].text,'Assez sûr (certitude moyenne 3/5) · tous ces rôles indispensables');
 assert.match(roles[2].text,/Les rôles que propose sa classe comptent pour 65\u00a0%, la spécialisation retenue pour 35\u00a0%\.$/);
 assert.equal(X.answerLines(strict.answers.find(a=>a.domain==='pet'),strict)[1].text,'Certain (certitude 5/5) · uniquement sans familier');
 const partial=E.explain('guerrier-protection',{...profiles[1],rolesStrict:false});
 assert.match(X.answerLines(partial.answers.find(a=>a.domain==='roles'),partial)[0].text,/^La classe Guerrier propose Tank, pas Soin ; Protection joue Tank/);
 const none=E.explain('mage-givre',{...profiles[1],rolesStrict:false});
 assert.match(X.answerLines(none.answers.find(a=>a.domain==='roles'),none)[0].text,/^La classe Mage ne propose aucun de ces rôles ; Givre joue DPS/);
 assert.equal(X.mainTradeoff(none),'Le Mage Givre ne joue aucun de tes rôles (Tank + Soin) : c’est ce qui lui coûte le plus de points.');
 // « À garder en tête » situe la classe, la spécialisation et le critère, en une phrase.
 const hunter=E.explain('chasseur-maitrise-betes',{styles:{surv:5},activities:{bg:5},mastery:2});
 assert.match(X.mainTradeoff(hunter),/^Le Chasseur Maîtrise des bêtes est noté \d\/5 en (résistance|champs de bataille) : c’est ce qui lui coûte le plus de points\.$/);
 const role=E.explain('demoniste-demonologie',{roles:{dps:5},activities:{bg:5},range:{value:'distance',certainty:5},mastery:2});
 assert.match(X.mainTradeoff(role),/^(En DPS, le Démoniste Démonologie a une aisance estimée à \d+\u00a0% en PvE|Le Démoniste Démonologie est noté \d\/5 en champs de bataille) : c’est ce qui lui coûte le plus de points\.$/);
 const armes=E.explain('guerrier-armes',{range:{value:'distance',certainty:5},styles:{ctrl:5}});
 assert.match(X.mainTradeoff(armes),/le Guerrier Armes|Le Guerrier Armes/);
 assert.equal(X.of('Affliction'),'d’Affliction');assert.equal(X.of('Élémentaire'),'d’Élémentaire');assert.equal(X.of('Finesse'),'de Finesse');
 // Le rendu échappe le texte et marque la ligne du constat.
 assert.equal(X.answerHtml('A & B',[{lead:'La spécialisation',text:'<b>'},{lead:'Constat',text:'ok'}]),
  '<div class="reco-answer"><b class="reco-answer-title">A &amp; B</b><dl class="reco-answer-steps"><div><dt>La spécialisation</dt><dd>&lt;b&gt;</dd></div><div class="is-result"><dt>Constat</dt><dd>ok</dd></div></dl></div>');
});

test('Pourquoi cette place : priorité en mots, part de chaque critère dans son groupe, points manquants',()=>{
 // L'exemple du Voleur : Champ de bataille et PvP sauvage essentiels, Contrôle, Mobilité et Technicité importants, maîtrise Expert.
 const w={bg:3,sauv:3,ctrl:2,mob:2,tech:2},ex=E.priorityExplain('voleur-finesse',w,3);
 const groups=X.priorityParts(ex,ex.score),axes=groups.flatMap(g=>g.axes);
 assert.equal(Math.round(ex.score),92);
 for(const a of axes){
  assert.deepEqual(a.lines.map(l=>l.lead),['La spécialisation','Ton choix','Constat']);
  assert.match(a.lines[1].text,/^Priorité (secondaire \(1\)|importante \(2\)|essentielle \(3\))$/);
  assert.doesNotMatch(a.lines.map(l=>l.text).join(' '),/Repère|undefined|NaN|poids/);
 }
 assert.deepEqual(axes.find(a=>a.key==='bg').lines.map(l=>l.text),
  ['Finesse est notée 4/5 pour cette activité, 4,4/5 avec ta maîtrise (expert).','Priorité essentielle (3)','Elle y répond bien (84\u00a0%).']);
 assert.equal(axes.find(a=>a.key==='tech').lines[0].text,'Finesse est notée 4/5 en difficulté (moyenne PvE et PvP).');
 assert.deepEqual(groups.map(g=>g.note),['Tes 2 critères ont la même priorité : ils comptent autant.','Tes 2 critères ont la même priorité : ils comptent autant.','']);
 assert.equal(X.priorityMissing(ex,ex.score),'Il lui manque 8 points : 4 sur les activités (Champ de bataille) et 4 sur les affinités (Technicité).');
 // Priorités différentes dans un groupe ; rôle non joué ; polyvalence ; aucun point manquant.
 const tank=E.priorityExplain('paladin-protection',{tank:3,soin:1,poly:1},3),roles=X.priorityParts(tank,tank.score)[0];
 assert.equal(roles.note,'Chaque critère compte selon ta priorité : Tank 75\u00a0% et Soin 25\u00a0%.');
 assert.equal(roles.axes.find(a=>a.key==='soin').lines[0].text,'Protection ne joue pas ce rôle (spécialisation Tank).');
 assert.equal(X.priorityParts(tank,tank.score)[1].axes[0].lines[0].text,'La classe Paladin propose 3 rôles.');
 const full=E.priorityExplain('voleur-finesse',{ctrl:3},2);
 assert.equal(X.priorityMissing(full,full.score),'Elle répond pleinement à tes critères.');
 assert.deepEqual(X.priorityWords,['sans importance','secondaire','importante','essentielle']);
});
