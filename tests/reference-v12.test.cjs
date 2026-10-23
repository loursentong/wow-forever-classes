'use strict';
/* Référence v12 (moteur 1.2.0, décision du 23 octobre 2026) : la difficulté suit le contexte des activités
 * partout ; les variantes sans familier ont leur propre grille. Aucune note de configuration ne change ; à la
 * maîtrise Confirmé, un profil guidé qui ne combine pas « sans familier » et difficulté, et un classement
 * personnalisé sans technicité, gardent exactement leurs résultats. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const E=require('../recommendation-engine.js');
const v11=require('./fixtures/moteur-reference-v11.json'),v12=require('./fixtures/moteur-reference-v12.json');
const {compare,snapshot,NEW_CASES,NEW_TECH}=require('../scripts/reference-v12.cjs');

test('La photographie v11 reste intacte ; la v12 en dérive explicitement',()=>{
 const source=fs.readFileSync(path.join(__dirname,'fixtures/moteur-reference-v11.json'),'utf8').replace(/\r\n/g,'\n');
 assert.equal(crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex'),'38eb19344cee45612294ab4bb1f20d22f25ef9f5');
 assert.equal(v11.info.engineVersion,'1.1.0-exploratoire');
 assert.equal(v12.info.revision,12);
 assert.equal(v12.info.previousReference,'moteur-reference-v11.json');
 assert.equal(v12.info.engineVersion,E.version);
 assert.equal(E.version,'1.2.0-exploratoire');
});

test('v11 → v12 : aucune note de configuration ne change ; seuls bougent les profils concernés',()=>{
 assert.deepEqual(snapshot(),v12,'le moteur reproduit exactement la v12');
 const report=compare(v11,v12);
 assert.equal(report.existingGuideCases,41);
 assert.equal(report.unchangedNeutralGuideCases,35);
 assert.equal(report.changedTop3,0,'aucun top 3 guidé ne change');
 assert.equal(report.personalCases,107);
 assert.equal(report.personalNeutralUnchanged,21);
 assert.equal(report.personalChangedTop3,5);
 // Technicité : un rôle seul ne fait plus du PvE ; sans activité, c'est la moyenne.
 assert.deepEqual(report.techContextChanges,[['{"tech":3,"dps":2}','pve','mixte']]);
 assert.deepEqual(report.newCases.map(c=>c.id),NEW_CASES.map(c=>c.id));
 assert.deepEqual(v12.technicite.slice(-2).map(t=>t.weights),NEW_TECH);
 assert.deepEqual(v12.specs,v11.specs);
 assert.deepEqual(v12.petlessComplexity['chasseur-survie'].load,{pve:3,pvp:4});
 assert.deepEqual(v12.petlessComplexity['demoniste-destruction'].load,{pve:2,pvp:3});
});

test('Nouveaux cas : Givre accessible en PvE, guerrier débutant en PvP, sans familier accessible',()=>{
 const top=id=>v12.guide.find(g=>g.id===id).top;
 // Débutant 100 % PvE qui veut du contrôle : le Givre (2/5 en PvE) entre dans le top 3 (5e en v11).
 assert.deepEqual(top('v12-givre-debutant-pve-controle'),['demoniste-affliction','pretre-sacre','mage-givre']);
 // Débutant en mêlée PvP : l'effet de la maîtrise joue déjà sur la difficulté PvP ; rien ne change.
 assert.deepEqual(top('v12-guerrier-debutant-pvp'),['chasseur-survie','paladin-vindicte','guerrier-fureur']);
 // Sans familier et difficulté accessible en PvE : Survie sans familier (3/5) rejoint la Fureur.
 assert.deepEqual(top('v12-sans-familier-pve-accessible'),['chasseur-survie','guerrier-fureur','chasseur-precision']);
});
