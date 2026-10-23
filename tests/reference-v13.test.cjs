'use strict';
/* Référence v13 (moteur 1.3.0, décision du 23 octobre 2026) : sur chaque critère que portent les spécialisations,
 * la note d'une classe est celle de sa meilleure spécialisation. 27 notes de la matrice changent et la référence
 * de rôle du moteur suit (Druide DPS 3→4). Aucune note de configuration ne change ; un profil guidé qui ne demande
 * pas le rôle DPS et un classement personnalisé sans poids DPS gardent exactement leurs résultats. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const E=require('../recommendation-engine.js');
const v2=require('./fixtures/moteur-reference-v2.json'),v12=require('./fixtures/moteur-reference-v12.json'),v13=require('./fixtures/moteur-reference-v13.json');
const {compare,snapshot,CHANGES,NEW_CASES,NEW_MIXED}=require('../scripts/reference-v13.cjs');
const sha=f=>{const s=fs.readFileSync(path.join(__dirname,'fixtures',f),'utf8').replace(/\r\n/g,'\n');return crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex');};

test('La photographie v12 reste intacte ; la v13 en dérive explicitement',()=>{
 assert.equal(sha('moteur-reference-v12.json'),'9e2dcb19b9b3ec95b822846db9eee0d28c371b6a');
 assert.equal(v12.info.engineVersion,'1.2.0-exploratoire');
 assert.equal(v13.info.revision,13);
 assert.equal(v13.info.previousReference,'moteur-reference-v12.json');
 assert.equal(v13.info.engineVersion,E.version);
 assert.equal(E.version,'1.3.0-exploratoire');
 // De la v2 à la v12, aucune note de classe n'avait changé : la v13 est la première révision de la matrice depuis.
 assert.deepEqual(v12.matrix.classes,v2.matrix.classes);
});

test('v12 → v13 : 27 notes de classe ; seuls bougent les classements qui demandent le rôle DPS',()=>{
 assert.deepEqual(snapshot(),v13,'le moteur et la page reproduisent exactement la v13');
 const report=compare(v12,v13);
 assert.equal(report.matrixChanges,27);
 assert.equal(CHANGES.length,27);
 assert.equal(report.existingGuideCases,44);
 assert.equal(report.unchangedNeutralGuideCases,33,'profils guidés sans rôle DPS : identiques');
 assert.equal(report.guideResultsChanged.length,11,'scores des Druides DPS dans les profils qui demandent le DPS');
 assert.equal(report.changedTop3,0,'aucun top 3 guidé existant ne change');
 assert.equal(report.personalCases,115);
 assert.equal(report.personalNeutralUnchanged,78,'classements personnalisés sans poids DPS : identiques');
 assert.equal(report.personalChanged,37);
 // Top 3 personnalisés : le Druide gagne une place dans cinq classements.
 assert.deepEqual(report.personalTop3,[
  {cas:'préréglage egal',maitrise:1,avant:['druide-restauration','druide-farouche-chat','demoniste-demonologie'],apres:['druide-restauration','druide-farouche-chat','druide-equilibre']},
  {cas:'préréglage egal',maitrise:3,avant:['druide-restauration','druide-farouche-chat','demoniste-demonologie'],apres:['druide-farouche-chat','druide-restauration','demoniste-demonologie']},
  {cas:'préréglage polyvalence',maitrise:2,avant:['druide-restauration','paladin-sacre','druide-farouche-ours'],apres:['druide-restauration','paladin-sacre','druide-farouche-chat']},
  {cas:'préréglage polyvalence',maitrise:3,avant:['druide-restauration','paladin-sacre','paladin-protection'],apres:['druide-restauration','paladin-sacre','druide-farouche-chat']},
  {cas:'préréglage pve',maitrise:0,avant:['paladin-sacre','pretre-sacre','chaman-restauration'],apres:['paladin-sacre','pretre-sacre','druide-equilibre']}]);
 assert.deepEqual(report.newCases.map(c=>c.id),NEW_CASES.map(c=>c.id));
 assert.deepEqual(v13.mixed.slice(-1).map(m=>m.weights),NEW_MIXED);
 for(const field of ['specs','petless','heal','referenceVariants','petlessComplexity'])assert.deepEqual(v13[field],v12[field],field);
});

test('Nouveaux cas : le Farouche (félin) profite de la note DPS du Druide',()=>{
 const top=id=>v13.guide.find(g=>g.id===id).top;
 const score=(id,spec)=>v13.guide.find(g=>g.id===id).results.find(r=>r[1]===spec)[2];
 // DPS mêlée mobile et résistant : le félin passe de la 4e à la 2e place (81,22 → 85,52).
 assert.deepEqual(top('v13-dps-melee-mobile'),['guerrier-fureur','druide-farouche-chat','guerrier-armes']);
 assert.equal(score('v13-dps-melee-mobile','druide-farouche-chat'),85.52);
 // DPS mêlée en solo : le félin rejoint la Vindicte (83,17), derrière la Survie.
 assert.deepEqual(top('v13-dps-solo-melee'),['chasseur-survie','druide-farouche-chat','paladin-vindicte']);
 assert.equal(score('v13-dps-solo-melee','druide-farouche-chat'),score('v13-dps-solo-melee','paladin-vindicte'));
 // Mode personnalisé DPS, mobilité et survie : le félin 2e au niveau Confirmé (4e en v12), 1er au niveau Expert.
 const mixed=v13.mixed.find(m=>JSON.stringify(m.weights)===JSON.stringify(NEW_MIXED[0]));
 assert.deepEqual(mixed.levels.map(l=>[l.mastery,l.results.slice(0,2).map(r=>r[1])]),
  [[0,['guerrier-fureur','druide-farouche-chat']],[2,['guerrier-fureur','druide-farouche-chat']],[3,['druide-farouche-chat','guerrier-fureur']]]);
});
