'use strict';
/* Référence v11 (moteur 1.1.0, décision du 22 octobre 2026) : la difficulté d'exécution PvE et PvP suit le
 * référentiel de complexité, partout (difficulté souhaitée, technicité, effet de la maîtrise). Seules les
 * charges décidées changent ; sans préférence de difficulté et à la maîtrise de référence (Confirmé), aucun
 * résultat ne bouge, ni dans le parcours guidé, ni dans le mode personnalisé sans technicité. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const E=require('../recommendation-engine.js');
const v10=require('./fixtures/moteur-reference-v10.json'),v11=require('./fixtures/moteur-reference-v11.json');
const {compare,snapshot,NEW_CASES,LOADS}=require('../scripts/reference-v11.cjs');

test('La photographie v10 reste intacte ; la v11 en dérive explicitement',()=>{
 const source=fs.readFileSync(path.join(__dirname,'fixtures/moteur-reference-v10.json'),'utf8').replace(/\r\n/g,'\n');
 assert.equal(crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex'),'3deafbd31688ea77becb1b15ec2a7d7d0706aa6b');
 assert.equal(v10.info.engineVersion,'1.0.9-exploratoire');
 assert.equal(v11.info.revision,11);
 assert.equal(v11.info.previousReference,'moteur-reference-v10.json');
 assert.equal(v11.info.engineVersion,E.version);
 assert.equal(E.version,'1.1.0-exploratoire');
});

test('v10 → v11 : seules les charges décidées changent ; sans préférence de difficulté, à la maîtrise de référence, rien ne bouge',()=>{
 assert.deepEqual(snapshot(),v11,'le moteur reproduit exactement la v11');
 const report=compare(v10,v11);
 assert.equal(report.loadChanges,26,'26 notes de difficulté sur 56');
 assert.equal(Object.keys(LOADS).length,22,'22 spécialisations');
 assert.equal(report.existingGuideCases,37);
 assert.equal(report.unchangedNeutralGuideCases,28);
 // Top 3 changé dans 8 scénarios guidés, première piste dans 3, tous avec une préférence de difficulté ou une autre maîtrise.
 assert.equal(report.changedTop3,8);
 assert.deepEqual(report.changedFirstList,[
  {id:'exact-complex-skill',avant:'druide-farouche-chat',apres:'voleur-finesse'},
  {id:'difficulty-simple-pve',avant:'chaman-restauration',apres:'paladin-sacre'},
  {id:'difficulty-complex-pvp',avant:'demoniste-demonologie',apres:'chasseur-precision'}]);
 for(const c of report.changedTop){const p=v10.guide.find(g=>g.id===c.id).profile;assert.ok(p.difficulty&&p.difficulty.value!=='any'||p.mastery!==undefined&&p.mastery!==2,c.id);}
 // Mode personnalisé : 107 classements, aucun changement à la maîtrise de référence sans technicité.
 assert.equal(report.personalCases,107);
 assert.equal(report.personalNeutralUnchanged,21);
 assert.equal(report.personalChangedTop3,53);
 assert.deepEqual(report.newCases.map(c=>c.id),NEW_CASES.map(c=>c.id));
 assert.deepEqual(v11.matrix,v10.matrix);assert.deepEqual(v11.petless,v10.petless);assert.deepEqual(v11.heal,v10.heal);
});

test('Nouveaux cas : difficulté recherchée en PvE ou en PvP, et maîtrise',()=>{
 const top=id=>v11.guide.find(g=>g.id===id).top;
 // Un tank qui veut une difficulté accessible : l'ours (2/5 en PvE) passe devant le Paladin (3/5).
 assert.deepEqual(top('v11-tank-accessible'),['guerrier-protection','druide-farouche-ours','paladin-protection']);
 // À distance en PvP exigeant : les Démonistes (4/5) et le Givre (4/5).
 assert.deepEqual(top('v11-distance-pvp-exigeant'),['demoniste-affliction','demoniste-destruction','mage-givre']);
 // La préférence de difficulté pèse 5 % du score : elle départage plus qu'elle ne renverse.
 assert.deepEqual(top('v11-dps-raid-accessible'),['guerrier-fureur','chasseur-survie','chasseur-maitrise-betes']);
});
