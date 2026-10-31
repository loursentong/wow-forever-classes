'use strict';
// Révision de données autorisée le 31 octobre : le moteur conserve toutes ses formules v15.
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const E=require('../recommendation-engine.js');
const v15=require('./fixtures/moteur-reference-v15.json'),v16=require('./fixtures/moteur-reference-v16.json');
const {snapshot,compare,formulaFingerprint,BASE_COMMIT,SPEC_CHANGES,MATRIX_CHANGES}=require('../scripts/reference-v16.cjs');
const fingerprint='68d10334989a4e7674d58364ffea446040327f7dde812e214a1b57f9fe5daa1b';
function gitBlob(version){
 const text=fs.readFileSync(require.resolve('./fixtures/moteur-reference-v'+version+'.json'),'utf8').replace(/\r\n/g,'\n');
 return crypto.createHash('sha1').update('blob '+Buffer.byteLength(text)+'\0').update(text).digest('hex');
}

test('v16 : références v15 et v16 immuables, base et décision de révision explicites',()=>{
 assert.equal(gitBlob(15),'9035f56a33edb98ebf7967e7a686326f018fb119');
 assert.equal(gitBlob(16),'ce0fdb7ea65919a0643f322274896bac74d4fbc2');
 assert.equal(v15.info.engineVersion,'1.5.0-exploratoire');
 assert.equal(v16.info.revision,16);assert.equal(v16.info.engineVersion,'1.6.0-exploratoire');
 assert.equal(v16.info.previousReference,'moteur-reference-v15.json');
 assert.equal(v16.info.sourceMainCommit,BASE_COMMIT);
 assert.match(v16.info.decision,/hotfixes du 30 octobre.*MythicSim du 31 octobre/);
 assert.match(v16.info.decision,/Formules, barèmes, coefficients, pondérations/);
});

test('v16 : reconstruction exacte de toutes les données et de tous les résultats actifs',()=>{
 assert.equal(E.version,'1.6.0-exploratoire');
 assert.deepEqual(snapshot(),v16);
 assert.equal(v16.guide.length,59);
 assert.equal(v16.priorities.reduce((n,c)=>n+c.levels.length,0),60);
 assert.equal(v16.isolatedRoles.reduce((n,c)=>n+c.axes.length,0),12);
 assert.equal(v16.mixed.reduce((n,c)=>n+c.levels.length,0),33);
 assert.equal(v16.technicite.reduce((n,c)=>n+c.levels.length,0),28);
 assert.deepEqual(E.checkData(),[]);
});

test('v15 → v16 : exactement 13 champs spécialisés, quatre cellules et leurs effets sur les classements',()=>{
 const r=compare(v15,v16);
 const sorted=rows=>rows.slice().sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b),'en'));
 assert.deepEqual(sorted(r.specChanges),sorted(SPEC_CHANGES));
 assert.deepEqual(r.matrixChanges,MATRIX_CHANGES);
 assert.equal(r.guideCases,56);assert.equal(r.changedGuide.length,27);assert.equal(r.unchangedGuide.length,29);
 assert.deepEqual(r.changedGuide.filter(c=>c.firstChanged).map(c=>c.id),[
  'dps-soft','heal-style-without-heal-role','v11-dps-raid-accessible','v11-dps-raid-debutant',
  'v12-givre-debutant-pve-controle','v12-sans-familier-pve-accessible','v14-raid-pvp','v15-pve-dps','v15-pve-debutant'
 ]);
 assert.equal(r.priorityCases,133);assert.equal(r.changedPriority.length,97);assert.equal(r.unchangedPriority.length,36);
 assert.equal(r.changedPriority.filter(c=>c.firstChanged).length,19);
 assert.deepEqual(v16.guide.find(c=>c.id==='v15-pve-dps').top,['chasseur-survie','guerrier-fureur','mage-feu']);
 assert.deepEqual(v16.guide.find(c=>c.id==='v15-pve-debutant').top,['mage-feu','guerrier-fureur','chasseur-survie']);
});

test('v16 : aucune formule, aucun coefficient ni algorithme modifié depuis la base v15 validée',()=>{
 const source=fs.readFileSync(require.resolve('../recommendation-engine.js'),'utf8');
 assert.equal(formulaFingerprint(source),fingerprint);
 // Le contrôle doit détecter une modification de calcul, même si les déclarations de données sont exclues.
 const altered=source.replace('var GROUP_PVE_SINGLE_TARGET = 0.75;','var GROUP_PVE_SINGLE_TARGET = 0.74;');
 assert.ok(altered!==source,'la formule témoin existe');
 assert.notEqual(formulaFingerprint(altered),fingerprint);
});

test('v16 : trois profils ciblés supplémentaires ; difficultés et héritage sans familier cohérents',()=>{
 assert.deepEqual(v16.guide.slice(-3).map(c=>[c.id,c.top]),[
  ['v16-pve-dps-accessible',['mage-feu','guerrier-fureur','chasseur-survie']],
  ['v16-soin-raid-mobile-duree',['druide-restauration','chaman-restauration','pretre-discipline']],
  ['v16-melee-bg-burst',['chaman-amelioration','guerrier-armes','voleur-finesse']]
 ]);
 const spec=id=>E.specs.find(s=>s.id===id);
 for(const [id,points,load] of [
  ['paladin-vindicte',[1,1,1,0,0],2],['mage-givre',[1,1,1,1,0],2],['druide-restauration',[1,2,1,1,1],3]
 ]){
  assert.deepEqual(spec(id).complexity.pve,points,id);
  assert.equal(spec(id).load.pve,load,id);
 }
 for(const id of ['chasseur-precision','demoniste-affliction']){
  assert.equal(E.petless[id].activity.raid,3,id+' : nouveau repère hérité de la configuration');
  assert.deepEqual(E.petless[id].complexity,v16.petlessComplexity[id].complexity,id);
 }
});

test('v16 : le comparateur refuse une note non autorisée, un ancien profil perdu ou une pondération altérée',()=>{
 const note=structuredClone(v16);note.specs.find(s=>s.id==='guerrier-protection').activity.raid=1;
 assert.throws(()=>compare(v15,note),/13 différences de données validées/);
 const missing=structuredClone(v16);missing.guide.shift();
 assert.throws(()=>compare(v15,missing));
 const weights=structuredClone(v16);weights.priorities[0].weights.raid=3;
 assert.throws(()=>compare(v15,weights));
});
