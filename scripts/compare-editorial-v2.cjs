'use strict';
// Comparaison reproductible v1 → v2, sans écrire de fixture ni modifier le moteur.
// Usage : node scripts/compare-editorial-v2.cjs [rapport.json]
// Depuis le moteur 1.0.2, la comparaison porte sur la photographie v2 figée : le moteur actuel
// suit la référence v3 (configuration affichée à score égal, voir scripts/reference-v3.cjs).
const fs=require('node:fs');
const path=require('node:path');
const assert=require('node:assert/strict');
const E=require('../recommendation-engine.js');
const v1=require('../tests/fixtures/moteur-reference-v1.json');
const root=path.resolve(__dirname,'..');
const D=JSON.parse(fs.readFileSync(path.join(root,'index.html'),'utf8').match(/window\.__WF = (\{.*?\});\s*\(function\(\)/s)[1]);
function compact(r){return r.results.map(x=>[x.spec.classId,x.spec.id,x.score]);}
function guide(profile){
 const r=E.recommend(profile);
 return {status:r.status,compatible:r.compatible,used:r.used,results:compact(r),uncertain:r.uncertain,
  scenarios:r.scenarios.map(x=>[x.name,x.status,x.top])};
}
function snapshot(){
 const next=structuredClone(v1);
 next.info={...next.info,engineVersion:E.version,sourceMainCommit:'71f81ec53bc3023e5fd8e8428de1267ff5df2d4a',
  revision:2,previousReference:'moteur-reference-v1.json',decision:'Trois ajustements éditoriaux approuvés le 21 octobre 2026 ; formules inchangées.'};
 next.matrix={axes:D.axes,classes:D.classes.map(c=>({id:c.id,r:c.r})),presets:D.presets};
 next.specs=E.specs;
 next.guide=next.guide.map(ex=>({...ex,...guide(ex.profile)}));
 for(const ex of next.priorities)for(const level of ex.levels)level.results=compact(E.priorityRanking(D.presets[ex.id],level.mastery));
 for(const level of next.isolatedRoles)for(const ex of level.axes)ex.results=compact(E.priorityRanking({[ex.axis]:3},level.mastery));
 for(const ex of next.mixed)for(const level of ex.levels)level.results=compact(E.priorityRanking(ex.weights,level.mastery));
 return next;
}
function compare(next){
 const expected=structuredClone(v1.matrix);
 for(const id of ['paladin','chaman'])expected.classes.find(c=>c.id===id).r.soin=5;
 assert.deepEqual(next.matrix,expected,'Aucune autre modification historique autorisée');
 const specs=structuredClone(v1.specs);
 specs.find(s=>s.id==='pretre-discipline').style.ctrl=3;
 assert.deepEqual(next.specs,specs,'Aucune autre note spécialisée autorisée');
 const cases=[];
 function add(id,before,after){
  const rows=after.map((r,i)=>{
   const j=before.findIndex(x=>x[0]===r[0]),old=before[j];
   assert.ok(old,'Même classe admissible : '+id);
   const scoreChanged=r[2]!==old[2],specChanged=r[1]!==old[1];
   if(scoreChanged||specChanged){
    assert.ok(['paladin','chaman','pretre'].includes(r[0]),'Classe collatérale inattendue : '+id+'/'+r[0]);
    assert.ok(r[0]==='pretre'?r[2]<=old[2]:r[2]>=old[2],'Sens du changement inattendu : '+id+'/'+r[0]);
   }
   return {classe:r[0],avant:{rang:j+1,specialisation:old[1],score:old[2]},apres:{rang:i+1,specialisation:r[1],score:r[2]},
    cause:scoreChanged||specChanged?(r[0]==='pretre'?'Contrôle Discipline 4 → 3 ; sélection possible d’une autre spécialisation.':'Référence de soin 4 → 5 ; sélection possible du soigneur.'):(i!==j?'Déplacement relatif lié aux classes ajustées.':'Inchangé.')};
  });
  assert.equal(before.length,after.length,id);
  cases.push({id,modifie:JSON.stringify(before)!==JSON.stringify(after),lignes:rows});
 }
 for(let i=0;i<v1.guide.length;i++){
  const a=v1.guide[i],b=next.guide[i];
  for(const k of ['status','compatible','used','uncertain'])assert.deepEqual(b[k],a[k],a.id+'/'+k);
  assert.deepEqual(b.scenarios.map(s=>s.slice(0,2)),a.scenarios.map(s=>s.slice(0,2)),a.id+'/scénarios');
  add('guide/'+a.id,a.results,b.results);
 }
 for(let i=0;i<v1.priorities.length;i++)for(let m=0;m<4;m++)add('priorites/'+v1.priorities[i].id+'/'+m,v1.priorities[i].levels[m].results,next.priorities[i].levels[m].results);
 for(let i=0;i<v1.isolatedRoles.length;i++)for(let j=0;j<3;j++)add('role/'+v1.isolatedRoles[i].axes[j].axis+'/'+v1.isolatedRoles[i].mastery,v1.isolatedRoles[i].axes[j].results,next.isolatedRoles[i].axes[j].results);
 for(let i=0;i<v1.mixed.length;i++)for(let j=0;j<v1.mixed[i].levels.length;j++)add('melange/'+i+'/'+v1.mixed[i].levels[j].mastery,v1.mixed[i].levels[j].results,next.mixed[i].levels[j].results);
 return {version:E.version,reference:'v1',cas:cases.length,cas_modifies:cases.filter(c=>c.modifie).length,
  note:'Cas de non-régression, pas un échantillon représentatif des joueurs. Les déplacements dans les classements ne sont pas des performances en jeu.',resultats:cases,
  scenarios_guides:next.guide.map((g,i)=>({id:g.id,avant:v1.guide[i].scenarios,apres:g.scenarios}))};
}
if(require.main===module){
 const report=compare(require('../tests/fixtures/moteur-reference-v2.json'));
 if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
 console.log(JSON.stringify({version:report.version,cas:report.cas,cas_modifies:report.cas_modifies}));
}
module.exports={snapshot,compare};
