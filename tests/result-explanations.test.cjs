'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js');
const X=require('../result-explanations.js');
// fit et score d'une piste, tels que le classement les donne à la carte.
const near=(a,b)=>assert.ok(Math.abs(a-b)<1e-9,a+' ≠ '+b);
const fitScore=ex=>{const r=E.ranking(ex.profile).results.find(x=>x.spec.id===ex.spec.id);return [r.fit,r.score];};

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
 assert.equal(X.rankHint(four,0),'à égalité avec 3 autres spécialisations');
 assert.equal(X.rankHint(four,4),'moins de 0,1 point derrière les 4 spécialisations à égalité au-dessus');
 // Avec une spécialisation, elle est nommée : une même classe peut revenir (v10).
 assert.equal(X.rankHint([{className:'Mage',spec:{label:'Givre'},score:90},{className:'Mage',spec:{label:'Feu'},score:89}],1),'1 point derrière le Mage Givre');
 assert.equal(X.rankHint([],0),'');
});

test('Les égalités des soigneurs incluent la quatrième classe au-delà des trois cartes',()=>{
 const r=E.recommend({roles:{soin:5},rolesStrict:true,mastery:2});
 // Cinq configurations de soin, quatre classes, toutes à égalité ; la note nomme chaque spécialisation.
 assert.equal(r.results.length,5);
 assert.match(X.tieNote(r.results),/^À égalité en tête : Chaman Restauration, Druide Restauration, Paladin Sacré, Prêtre Discipline, Prêtre Sacré\./);
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
    // La note avec ta maîtrise n'est écrite que si elle diffère une fois arrondie (jamais « 3/5, 3/5 avec ta maîtrise »).
    assert.equal(spec.includes('avec ta maîtrise'),X.number(a.note)!==X.number(a.adjusted),spec);
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
  // En tête : les points manquants, du groupe qui en perd le plus à celui qui en perd le moins, font
  // exactement l'écart à 100 ; un seul groupe : « Il lui manque N points, tous sur … ».
  const summary=X.pisteMissing(ex,row.fit,row.score),missing=100-Math.round(row.score);
  if(missing<=0)assert.equal(summary,'Il ne lui manque aucun point : elle répond pleinement à chacun de tes choix.');
  else{
   assert.ok(summary.startsWith('Il lui manque '+missing+' point'),summary);
   const items=[...summary.matchAll(/(\d+) sur (les|la|le) /g)].map(m=>Number(m[1]));
   if(items.length)assert.equal(items.reduce((n,v)=>n+v,0),missing,summary);
   else assert.match(summary,new RegExp('^Il lui manque '+missing+' points?, '+(missing>1?'tous ':'')+'sur '),summary);
   assert.deepEqual(items,items.slice().sort((a,b)=>b-a),summary);
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
 assert.equal(X.keepInMind(none),'Pour tes rôles Tank + Soin, le Mage Givre ne joue aucun de ces rôles (spécialisation DPS) : c’est ce qui lui coûte le plus de points (22 sur les rôles).');
 // « À garder en tête » situe la classe, la spécialisation et le critère, en une phrase, avec les points du bilan.
 const hunter=E.explain('chasseur-maitrise-betes',{styles:{surv:5},activities:{bg:5},mastery:2});
 assert.equal(X.keepInMind(hunter),'Le Chasseur Maîtrise des bêtes est noté 3/5 en résistance : c’est ce qui lui coûte le plus de points (22 sur le gameplay).');
 assert.match(X.pisteMissing(hunter,...fitScore(hunter)),/^Il lui manque 36 points : 22 sur le gameplay \(Résistance\) et 14 sur les activités/);
 const role=E.explain('demoniste-demonologie',{roles:{dps:5},activities:{bg:5},range:{value:'distance',certainty:5},mastery:2});
 assert.equal(X.keepInMind(role),'En DPS, le Démoniste Démonologie a une aisance estimée en PvE de 75\u00a0% : c’est la seule chose qui lui coûte des points (7 sur les rôles).');
 // Le même pourcentage que la ligne « La spécialisation » du rôle.
 assert.match(X.answerLines(role.answers.find(a=>a.domain==='roles'),role)[0].text,/aisance estimée en PvE : 75\u00a0%/);
 const armes=E.explain('guerrier-armes',{range:{value:'distance',certainty:5},styles:{ctrl:5}});
 assert.equal(X.keepInMind(armes),'Le Guerrier Armes se joue en mêlée, alors que tu veux jouer à distance : c’est ce qui lui coûte le plus de points (38 sur la portée).');
 assert.equal(X.of('Affliction'),'d’Affliction');assert.equal(X.of('Élémentaire'),'d’Élémentaire');assert.equal(X.of('Finesse'),'de Finesse');
 // Le rendu échappe le texte et marque la ligne du constat.
 assert.equal(X.answerHtml('A & B',[{lead:'La spécialisation',text:'<b>'},{lead:'Constat',text:'ok'}]),
  '<div class="reco-answer"><b class="reco-answer-title">A &amp; B</b><dl class="reco-answer-steps"><div><dt>La spécialisation</dt><dd>&lt;b&gt;</dd></div><div class="is-result"><dt>Constat</dt><dd>ok</dd></div></dl></div>');
});

test('Pourquoi cette place : priorité en mots, part de chaque critère dans son groupe, points manquants',()=>{
 // L'exemple du Voleur : Champ de bataille et PvP sauvage essentiels, Contrôle, Mobilité et Technicité importants, maîtrise Expert.
 // Depuis la v10, la technicité suit ces critères PvP : Finesse y est notée 5/5 (3/5 en PvE), le score passe de 92 à 96.
 const w={bg:3,sauv:3,ctrl:2,mob:2,tech:2},ex=E.priorityExplain('voleur-finesse',w,3);
 const groups=X.priorityParts(ex,ex.score),axes=groups.flatMap(g=>g.axes);
 assert.equal(Math.round(ex.score),96);
 for(const a of axes){
  assert.deepEqual(a.lines.map(l=>l.lead),['La spécialisation','Ton choix','Constat']);
  assert.match(a.lines[1].text,/^Priorité (secondaire \(1\)|importante \(2\)|essentielle \(3\))$/);
  assert.doesNotMatch(a.lines.map(l=>l.text).join(' '),/Repère|undefined|NaN|poids/);
 }
 assert.deepEqual(axes.find(a=>a.key==='bg').lines.map(l=>l.text),
  ['Finesse est notée 4/5 pour cette activité, 4,4/5 avec ta maîtrise (expert).','Priorité essentielle (3)','Elle y répond bien (84\u00a0%).']);
 assert.equal(axes.find(a=>a.key==='tech').lines[0].text,'Finesse est notée 5/5 en difficulté PvP.');
 assert.equal(E.priorityExplain('voleur-finesse',{tech:2,solo:3},3).axes.find(a=>a.key==='tech').context,'pve');
 // Sans critère d'activité ni de rôle (contexte mixte), la technicité se lit en PvE puis en PvP, chacune pour moitié.
 const mixte=X.priorityParts(E.priorityExplain('voleur-finesse',{tech:2},3),0)[0];
 assert.deepEqual(mixte.axes.map(a=>[a.label,a.lines[0].text,a.lines[2].text]),[
  ['Technicité · PvE','Finesse est notée 3/5 en difficulté PvE.','Elle y répond en partie (50\u00a0%).'],
  ['Technicité · PvP','Finesse est notée 5/5 en difficulté PvP.','Elle y répond pleinement (100\u00a0%).']]);
 assert.equal(mixte.note,'Technicité : sans critère d’activité ni de rôle, moyenne des deux (50\u00a0% en PvE, 100\u00a0% en PvP).');
 assert.deepEqual(groups.map(g=>g.note),['Tes 2 critères ont la même priorité : ils comptent autant.','Tes 2 critères ont la même priorité : ils comptent autant.','']);
 assert.equal(X.priorityMissing(ex,ex.score),'Il lui manque 4 points, tous sur les activités (Champ de bataille).');
 // Priorités différentes dans un groupe ; rôle non joué ; polyvalence ; aucun point manquant.
 const tank=E.priorityExplain('paladin-protection',{tank:3,soin:1,poly:1},3),roles=X.priorityParts(tank,tank.score)[0];
 assert.equal(roles.note,'Chaque critère compte selon ta priorité : Tank 75\u00a0% et Soin 25\u00a0%.');
 assert.equal(roles.axes.find(a=>a.key==='soin').lines[0].text,'Protection ne joue pas ce rôle (spécialisation Tank).');
 assert.equal(X.priorityParts(tank,tank.score)[1].axes[0].lines[0].text,'La classe Paladin propose 3 rôles.');
 const full=E.priorityExplain('voleur-finesse',{ctrl:3},2);
 assert.equal(X.priorityMissing(full,full.score),'Il ne lui manque aucun point : elle répond pleinement à chacun de tes critères.');
 assert.deepEqual(X.priorityWords,['sans importance','secondaire','importante','essentielle']);
});

/* Révision du 22 octobre 2026 : « Correspond à tes envies », « À garder en tête » et « Pourquoi N sur 100 ? »
 * lisent la même analyse. Sur un large échantillon de profils, pour chacune des cinq pistes : « À garder en
 * tête » nomme le premier groupe du bilan avec le même nombre de points ; « Correspond à tes envies » ne
 * reprend pas le choix nommé, sauf s'il est le seul bien rempli ; les mots suivent le constat. */
test('Carte cohérente : à garder en tête = première ligne du bilan, atouts = choix pleinement remplis',()=>{
 const groupOn={roles:'les rôles',healStyles:'la façon de soigner',activities:'les activités',range:'la portée',styles:'le gameplay',pet:'les familiers',difficulty:'la complexité'};
 const roles=[{dps:5},{tank:4},{soin:5},{dps:3,tank:3},{soin:2}],acts=[{},{raid:5},{solo:4,bg:2},{world:3}],sty=[{},{burst:4,surv:3},{ctrl:5,mob:1},{support:0}];
 const extra=[{},{range:{value:'distance',certainty:3}},{range:{value:'mixte',certainty:5},pet:{value:'like',certainty:4}},
  {pet:{value:'avoid',certainty:2},difficulty:{value:'simple',certainty:3}},{healStyles:{groupe:4,duree:1},difficulty:{value:'complex',certainty:5}}];
 let cards=0,named=0;
 for(const r of roles)for(const a of acts)for(const s of sty)for(const x of extra)for(const mastery of [0,2,3]){
  const p={roles:r,activities:a,styles:s,...x,mastery},rec=E.recommend(p,5);
  for(const t of rec.top){
   const ex=E.explain(t.spec.id,p),an=X.pisteAnalysis(ex,t.fit,t.score),keep=X.keepInMind(ex,t.fit,t.score);
   const strong=X.strengthsText(ex,t.fit,t.score),summary=X.pisteMissing(ex,t.fit,t.score),id=t.spec.id+' '+JSON.stringify(p);
   cards++;
   for(const text of [keep,strong,summary])assert.doesNotMatch(text,/undefined|NaN|null|\s{2}|\s[,.]/,id);
   assert.ok(keep.startsWith('Le '+t.className+' '+t.spec.label)||keep.startsWith('En ')||keep.startsWith('Pour tes rôles'),keep);
   if(an.main){
    named++;
    const n=an.main.max-an.main.points,first=summary.match(/^Il lui manque (\d+) points?(?: : (\d+) sur | ?, (?:tous )?sur )(les rôles|la façon de soigner|les activités|la portée|le gameplay|les familiers|la complexité)/);
    assert.ok(first,summary);
    assert.equal(first[3],groupOn[an.main.key],keep+' | '+summary);
    if(first[2])assert.equal(Number(first[2]),n,keep+' | '+summary);
    assert.ok(keep.includes(an.total<=5?(an.total>1?an.total+' points':'un point'):'('+n+' sur '+groupOn[an.main.key]),keep);
    // Le choix nommé ne figure pas parmi les atouts, sauf s'il est le seul bien rempli.
    if(an.strengths.includes(an.answer))assert.equal(an.strengths.length,1,id);
   }else assert.match(keep,/répond pleinement à tes choix/);
   for(const s of an.strengths)assert.equal(X.level(s.raw),an.strengthLevel,id);
   assert.equal(strong.startsWith('En bonne partie : '),an.strengthLevel==='bien',strong);
  }
 }
 assert.ok(cards>1500&&named>1400,cards+' cartes, '+named+' avec un coût');
});

test('Pourquoi cette place : le bilan va aussi du groupe qui perd le plus à celui qui perd le moins',()=>{
 for(const w of [{bg:3,sauv:1,ctrl:2,mob:2,tech:2,dps:1},{tank:2,soin:1,zone:3,util:2,poly:1},{solo:3,burst:2,surv:3,tech:1,dps:3}])for(const m of [0,3]){
  const r=E.priorityRanking(w,m);
  for(const x of r.results.slice(0,12)){
   const ex=E.priorityExplain(x.spec.id,w,m),summary=X.priorityMissing(ex,x.score);
   const items=[...summary.matchAll(/(\d+) sur (les|la|le) /g)].map(v=>Number(v[1]));
   assert.deepEqual(items,items.slice().sort((a,b)=>b-a),summary);
  }
 }
});

/* Révision du 22 octobre 2026, soir : quand la difficulté retenue est la moyenne du PvE et du PvP (activités
 * des deux types, ou aucune), « Complexité » et « Technicité » se lisent en deux blocs, PvE puis PvP. */
test('Complexité et technicité : PvE et PvP séparés quand la difficulté retenue est leur moyenne',()=>{
 // La trace du moteur donne la part PvE et la part PvP ; leur moyenne est exactement la valeur du calcul.
 for(const s of E.specs)for(const value of ['simple','complex'])for(const certainty of [0,3,5])for(const activities of [{},{raid:3,bg:4},{solo:2,world:5}]){
  const d=E.explain(s.id,{difficulty:{value,certainty},activities}).answers.find(a=>a.domain==='difficulty');
  assert.equal(d.context,'mixte');
  near((d.contexts.pve.raw+d.contexts.pvp.raw)/2,d.raw);near((d.contexts.pve.fit+d.contexts.pvp.fit)/2,d.fit);
  assert.deepEqual([d.contexts.pve.load,d.contexts.pvp.load],[s.load.pve,s.load.pvp]);
 }
 // PvE seul ou PvP seul : une seule difficulté, pas de partage.
 for(const activities of [{raid:4},{bg:3,world:2}]){
  const d=E.explain('voleur-finesse',{difficulty:{value:'complex',certainty:5},activities}).answers.find(a=>a.domain==='difficulty');
  assert.equal(d.contexts,undefined);assert.equal(d.context,activities.raid?'pve':'pvp');
 }
 // La capture du 22 octobre : Voleur Finesse, difficulté exigeante (certitude 4/5), activités PvE et PvP.
 const p={roles:{dps:5},activities:{bg:5,raid:3},styles:{ctrl:5},difficulty:{value:'complex',certainty:4},mastery:3};
 const ex=E.explain('voleur-finesse',p),g=X.pisteParts(ex,...fitScore(ex)).find(x=>x.key==='difficulty');
 assert.equal(g.fit,71);
 assert.equal(g.note,'Tes activités mêlent PvE et PvP : moyenne des deux, 50\u00a0% en PvE et 93\u00a0% en PvP.');
 assert.deepEqual(g.answers.map(a=>[a.label,...a.lines.map(l=>l.text)]),[
  ['Difficulté exigeante · PvE','Finesse est notée 3/5 en difficulté PvE.','Très sûr (certitude 4/5)','Elle y répond en partie (50\u00a0%).'],
  ['Difficulté exigeante · PvP','Finesse est notée 5/5 en difficulté PvP.','Très sûr (certitude 4/5)','Elle y répond pleinement (100\u00a0%), adouci à 93\u00a0% par ta certitude.']]);
 // « À garder en tête » sépare aussi les deux ; sans activité, la note le dit.
 const alone=E.explain('voleur-finesse',{difficulty:{value:'complex',certainty:5},mastery:2});
 assert.equal(X.keepInMind(alone),'Le Voleur Finesse répond en partie à ton choix « Difficulté exigeante » en PvE (difficulté notée 3/5) et y répond pleinement en PvP (5/5) : c’est la seule chose qui lui coûte des points (25 sur la complexité).');
 assert.equal(X.pisteParts(alone,...fitScore(alone))[0].note,'Sans activité choisie : moyenne du PvE et du PvP, 50\u00a0% en PvE et 100\u00a0% en PvP.');
 // Mode personnalisé : la technicité se partage de même, et sa moyenne est la valeur du calcul.
 for(const w of [{tech:2},{tech:3,bg:2,solo:1},{tech:1,sauv:2,dps:3}])for(const s of E.specs){
  const t=E.priorityExplain(s.id,w,2).axes.find(a=>a.key==='tech');
  assert.equal(t.context,'mixte');near((t.contexts.pve.raw+t.contexts.pvp.raw)/2,t.raw);
 }
 assert.equal(E.priorityExplain('voleur-finesse',{tech:2,bg:3},2).axes.find(a=>a.key==='tech').contexts,undefined);
});
