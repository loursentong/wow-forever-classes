'use strict';
/* Référence v3 (moteur 1.0.2) : à score égal entre configurations d'une même classe,
 * la classe est représentée par la configuration au plus haut potentiel ajusté à la maîtrise.
 * Rien d'autre ne change : mêmes classes, mêmes rangs, mêmes scores. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const E=require('../recommendation-engine.js');
const v2=require('./fixtures/moteur-reference-v2.json');
const v3=require('./fixtures/moteur-reference-v3.json');
const {compare}=require('../scripts/reference-v3.cjs');
const spec=id=>E.specs.find(s=>s.id===id);

test('La photographie v2 reste intacte ; la v3 en dérive explicitement',()=>{
 const source=fs.readFileSync(path.join(__dirname,'fixtures/moteur-reference-v2.json'),'utf8').replace(/\r\n/g,'\n');
 const hash=crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex');
 assert.equal(hash,'a78c33f624a6cd9f984e6b2536efa37b3065e375');
 assert.equal(v3.info.revision,3);
 assert.equal(v3.info.previousReference,'moteur-reference-v2.json');
 assert.equal(v3.info.engineVersion,'1.0.2-exploratoire');
});

test('v2 → v3 : mêmes classes, rangs et scores ; seule la configuration affichée à égalité change, vers le plus haut potentiel',()=>{
 const report=compare(v2,v3);
 assert.equal(report.cas,99);
 assert.equal(report.cas_modifies,41);
 for(const c of report.resultats)for(const x of c.changements)assert.ok(x.potentiel_apres>=x.potentiel_avant,c.id);
});

test('Le potentiel est celui du codex (§ 3.4) et reste la base de l’adéquation aux rôles',()=>{
 for(const s of E.specs)for(const m of [0,1,2,3]){
  assert.equal(E.potential(s,m),(E.adjustedActivity(s,'raid',m)-1)/4);
  const base=(E.roleReference[s.classId][s.role]-1)/4;
  assert.equal(E.roleSuitability(s,m),Math.min(1,Math.max(0,.55*base+.45*E.potential(s,m))));
 }
});

const firstOfEachClass=rows=>rows.filter((r,i)=>rows.findIndex(q=>(q.classId||q.spec.classId)===(r.classId||r.spec.classId))===i);
test('Exemples : la configuration au plus haut potentiel représente la classe à égalité',()=>{
 // Guide « solo » sans préférence de familier : les trois Chasseurs à 85 ; Survie a le plus haut potentiel.
 // Jusqu'à la v4, « solo sans familier obligatoire » illustrait la même règle (Précision et Survie à 83) ;
 // depuis la v5, Précision y est évaluée en « Loup solitaire » et l'emporte au score.
 const guide=E.ranking({activities:{solo:3}}).results;
 const hunter=guide.find(r=>r.spec.classId==='chasseur');
 assert.equal(hunter.spec.id,'chasseur-survie');
 assert.equal(hunter.score,85);
 assert.equal(v2.guide.find(g=>g.id==='solo-no-mandatory-pet').results[1].join(),'chasseur,chasseur-precision,83');
 assert.ok(E.potential(spec('chasseur-survie'),2)>E.potential(spec('chasseur-precision'),2));
 // Le potentiel dépend de la maîtrise : en Débutant, la Maîtrise des bêtes gagne déjà au score.
 const solo=v2.matrix.presets.solo;
 assert.equal(E.priorityRanking(solo,2).results.find(r=>r.classId==='chasseur').spec.id,'chasseur-survie');
 assert.equal(E.priorityRanking(solo,0).results.find(r=>r.classId==='chasseur').spec.id,'chasseur-maitrise-betes');
 // Ordre des classes inchangé à égalité de score : identifiant de classe, comme avant.
 const tie=firstOfEachClass(E.ranking({activities:{solo:5},mastery:2}).results).slice(0,3).map(r=>r.spec.classId);
 assert.deepEqual(tie,['chasseur','demoniste','paladin']);
});
