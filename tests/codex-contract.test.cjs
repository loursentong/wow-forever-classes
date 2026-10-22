'use strict';
/*
 * CONTRAT DE NON-RÉGRESSION DU MOTEUR — voir CODEX-MOTEUR-LOGIQUE.md.
 * v1 conserve le commit 470fc92b... ; v2 ne révise que les trois notes
 * approuvées le 21 octobre 2026 (voir REVISION-EDITORIALE-V2.md) ; v3 ne change
 * que la configuration qui représente une classe à score égal (plus haut potentiel) ;
 * v4 réserve l'exception solo du Chasseur à Maîtrise des bêtes ; v5 évalue les configurations à
 * familier facultatif avec leurs notes sans familier quand le joueur préfère jouer sans compagnon ;
 * v6 juge la préférence de difficulté sur le contexte (PvE ou PvP) des activités choisies ; v7 aligne la note
 * raid des DPS sur leurs dégâts simulés et passe Farouche (félin) à 2 en zone ; v8 ajoute la façon de soigner,
 * qui compare les configurations de soin quand le joueur demande ce rôle ; v9 compare les builds avec et
 * sans compagnon et applique l'envie de soin à toutes les pistes ; v10 classe les spécialisations (une
 * classe peut revenir, au plus deux fois dans le top 3 guidé) et fait suivre à la technicité les
 * critères d'activité (PvE, PvP ou moyenne) ; v11 fait suivre à la difficulté d'exécution PvE et PvP le
 * référentiel de complexité (grille de cinq composantes par contexte), partout où elle sert.
 * Ne JAMAIS régénérer ces valeurs sur un échec de CI sans revue explicite des
 * écarts, approbation du changement et nouvelle version documentée.
 */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../recommendation-engine.js');
const fixture=require('./fixtures/moteur-reference-v11.json');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const questionnaire=fs.readFileSync(path.join(__dirname,'..','questionnaire.js'),'utf8');
const prioritiesUI=fs.readFileSync(path.join(__dirname,'..','priorities-ui.js'),'utf8');
const match=html.match(/window\.__WF = (\{.*?\});\s*<\/script>/s);
assert.ok(match,'La matrice historique doit rester exposée dans window.__WF');
const D=JSON.parse(match[1]);
function compactResults(r){
 return r.results.map(x=>[x.classId,x.spec.id,x.score]);
}
function compactGuide(profile){
 const r=E.recommend(profile);
 return {
  status:r.status,
  compatible:r.compatible,
  used:r.used,
  results:r.results.map(x=>[x.spec.classId,x.spec.id,x.score]),
  top:r.top.map(x=>x.spec.id),
  uncertain:r.uncertain,
  scenarios:r.scenarios.map(x=>[x.name,x.status,x.top]),
  sansFamilier:r.results.filter(x=>x.spec.variant==='sans-familier').map(x=>x.spec.id)
 };
}
function stableIds(r){
 return new Set(r.results.map(x=>x.classId));
}
test('CODEx: intégrité du fichier baseline et de la version de calcul',()=>{
 assert.equal(fixture.info.schema,1);
 assert.equal(fixture.info.engineVersion,E.version);
 assert.match(fixture.info.sourceMainCommit,/^[a-f0-9]{40}$/);
 assert.ok(fs.readFileSync(path.join(__dirname,'..','CODEX-MOTEUR-LOGIQUE.md'),'utf8').includes(fixture.info.sourceMainCommit));
 assert.deepEqual(E.checkData(),[]);
});
test('CODEx: 126 notes historiques, identifiants des 14 axes et 15 profils figés',()=>{
 assert.deepEqual(D.axes,fixture.matrix.axes);
 assert.deepEqual(D.classes.map(c=>({id:c.id,r:c.r})),fixture.matrix.classes);
 assert.deepEqual(D.presets,fixture.matrix.presets);
 assert.equal(D.classes.length,9);
 assert.equal(D.axes.length,14);
 assert.equal(Object.keys(D.presets).length,15);
 assert.equal(D.classes.reduce((total,c)=>total+Object.keys(c.r).length,0),126);
});
test('CODEx: 28 configurations exactes, kit, identité, provenance et notes figés',()=>{
 assert.equal(E.specs.length,28);
 assert.deepEqual(E.specs,fixture.specs);
 assert.equal(new Set(E.specs.map(x=>x.id)).size,28);
 assert.equal(new Set(E.specs.map(x=>x.classId)).size,9);
 assert.equal(E.rolePool('druide').length,3);
});
test('CODEx: référence de rôle toujours liée aux notes historiques',()=>{
 for(const cls of fixture.matrix.classes){
  for(const key of ['tank','soin','dps']){
   assert.equal(E.roleReference[cls.id][key],cls.r[key],cls.id+'/'+key);
  }
 }
 for(const s of E.specs){
  const baseline=(E.roleReference[s.classId][s.role]-1)/4;
  const activity=(E.adjustedActivity(s,'raid',2)-1)/4;
  assert.ok(Math.abs(E.roleSuitability(s,2)-(.55*baseline+.45*activity))<1e-12,s.id);
 }
});
test('CODEx: 41 scénarios guidés — statut, spécialisations, scores, top 3, sensibilité, vétos, variantes sans familier, difficulté et soin',()=>{
 assert.equal(fixture.guide.length,41);
 for(const ex of fixture.guide){
  const actual=compactGuide(ex.profile);
  assert.deepEqual(actual,{
   status:ex.status,compatible:ex.compatible,used:ex.used,
   results:ex.results,top:ex.top,uncertain:ex.uncertain,scenarios:ex.scenarios,sansFamilier:ex.sansFamilier
  },'Régression du guide : '+ex.id);
  if(actual.status==='ok'){
   // Une ligne par configuration admissible ; au plus trois pistes, dont deux d'une même classe.
   assert.equal(actual.results.length,actual.compatible,ex.id);
   assert.equal(new Set(actual.results.map(x=>x[1])).size,actual.results.length,ex.id);
   assert.ok(actual.top.length<=3,ex.id);
   const perClass={};for(const id of actual.top){const c=actual.results.find(x=>x[1]===id)[0];perClass[c]=(perClass[c]||0)+1;}
   assert.ok(Object.values(perClass).every(n=>n<=2),ex.id);
  }else assert.equal(actual.results.length,0,ex.id);
 }
});
test('CODEx: 15 préréglages × 4 maîtrises — classe, spé, score et ordre exacts',()=>{
 assert.equal(fixture.priorities.length,15);
 for(const preset of fixture.priorities){
  assert.ok(Object.hasOwn(D.presets,preset.id),preset.id);
  assert.equal(preset.levels.length,4,preset.id);
  for(const {mastery,results} of preset.levels){
   const r=E.priorityRanking(D.presets[preset.id],mastery);
   assert.equal(r.status,'ok');
   assert.deepEqual(compactResults(r),results,preset.id+'/maîtrise='+mastery);
   assert.equal(r.results.length,28,preset.id);
   assert.equal(new Set(r.results.map(x=>x.spec.id)).size,28,preset.id);
   assert.equal(stableIds(r).size,9,preset.id);
  }
 }
});
test('CODEx: DPS PvE / Tank / Soin isolés × 4 maîtrises — aucune régression booléenne',()=>{
 for(const level of fixture.isolatedRoles){
  for(const axis of level.axes){
   const w={[axis.axis]:3};
   const r=E.priorityRanking(w,level.mastery);
   assert.deepEqual(compactResults(r),axis.results,axis.axis+'/maîtrise='+level.mastery);
   const unique=new Set(r.results.map(x=>x.score));
   // La révision éditoriale accepte les quatre classes de soin au même palier.
   // Les tanks et DPS restent différenciés ; les classes sans soigneur restent à 0.
   assert.ok(unique.size>=(axis.axis==='soin'?2:3),'Axe rôle non discriminant : '+axis.axis);
   if(axis.axis==='soin'){
    for(const row of r.results){
     // Depuis la v10, chaque configuration est classée : seules celles qui soignent obtiennent l'axe Soin,
     // et la première configuration de chaque classe de soin reste à 100 dès le niveau Confirmé.
     if(row.spec.role!=='soin')assert.equal(row.score,0);
     else if(level.mastery>=2&&r.results.find(x=>x.classId===row.classId)===row)assert.equal(row.score,100);
    }
   }
   assert.ok(!r.results.every(x=>x.score===100),axis.axis);
   for(const n of [1,2]){
    assert.deepEqual(compactResults(E.priorityRanking({[axis.axis]:n},level.mastery)),axis.results,
     'Poids isolé doit rester relatif : '+axis.axis+'/'+n);
   }
  }
 }
});
test('CODEx: cinq pondérations croisées sur trois maîtrises — pas de dérive silencieuse',()=>{
 assert.equal(fixture.mixed.length,5);
 for(const example of fixture.mixed)for(const caseLevel of example.levels){
  const w=structuredClone(example.weights);
  const r=E.priorityRanking(w,caseLevel.mastery);
  assert.deepEqual(compactResults(r),caseLevel.results,
    'pondérations='+JSON.stringify(example.weights)+'/niveau='+caseLevel.mastery);
  assert.deepEqual(w,example.weights,'Le classement doit laisser son entrée intacte');
 }
});
test('CODEx: technicité selon les critères d’activité — cinq pondérations × quatre maîtrises',()=>{
 assert.equal(fixture.technicite.length,5);
 for(const t of fixture.technicite){
  assert.equal(E.techContext(E.sanitizeWeights(t.weights)),t.context);
  for(const l of t.levels)assert.deepEqual(compactResults(E.priorityRanking(t.weights,l.mastery)),l.results,JSON.stringify(t.weights)+'/'+l.mastery);
 }
});
test('CODEx: filtre dur et statut distinct des préférences souples',()=>{
 const preferences={roles:{tank:5},range:{value:'distance',certainty:5,strict:false}};
 const soft=E.ranking(preferences);
 assert.equal(soft.status,'ok');
 assert.ok(soft.results.some(x=>x.spec.role==='tank'));
 const impossible=E.ranking({...preferences,rolesStrict:true,range:{value:'distance',certainty:5,strict:true}});
 assert.equal(impossible.status,'no-match');
 assert.deepEqual(impossible.results,[]);
 const noChoice=E.ranking({mastery:3});
 assert.equal(noChoice.status,'unanswered');
 assert.deepEqual(noChoice.results,[]);
 assert.equal(E.intensity(0),.25);
 assert.equal(E.intensity(5),1);
});
test('CODEx: état guidé et priorités séparés, sauvegarde personnelle identifiable',()=>{
 assert.match(questionnaire,/wf-recommend-v1/);
 assert.match(prioritiesUI,/wf-reco-mode-v1/);
 assert.match(prioritiesUI,/wf-priority-custom-v1/);
 assert.match(prioritiesUI,/data-prio-save/);
 assert.match(prioritiesUI,/data-prio-restore/);
 assert.match(prioritiesUI,/wf-overview-v3/);
 const zeros=E.priorityRanking({},2);
 assert.equal(zeros.status,'unanswered');
 assert.deepEqual(zeros.results,[]);
});
