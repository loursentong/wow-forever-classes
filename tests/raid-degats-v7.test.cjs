'use strict';
/* Référence v7 (moteur 1.0.6) : pour un DPS, la note « Donjons et raids » mesure ses dégâts simulés seuls,
 * selon les barèmes 5 ≥ 86 %, 4 de 72 à 85 %, 3 de 55 à 71 %, 2 en dessous ; Farouche (félin) passe à 2
 * en zone. Seules ces cinq notes changent ; la première classe recommandée ne change dans aucun cas. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const E=require('../recommendation-engine.js');
const v6=require('./fixtures/moteur-reference-v6.json');
const v7=require('./fixtures/moteur-reference-v7.json');
const {compare,CHANGES}=require('../scripts/reference-v7.cjs');
const ecarts=require('../connaissances/ecarts.json');

test('La photographie v6 reste intacte ; la v7 en dérive explicitement',()=>{
 const source=fs.readFileSync(path.join(__dirname,'fixtures/moteur-reference-v6.json'),'utf8').replace(/\r\n/g,'\n');
 const hash=crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex');
 assert.equal(hash,'a054fbbe433b15d393e3b8d802007c8124899421');
 assert.equal(v6.info.engineVersion,'1.0.5-exploratoire');
 assert.equal(v7.info.revision,7);
 assert.equal(v7.info.previousReference,'moteur-reference-v6.json');
 assert.equal(v7.info.engineVersion,'1.0.6-exploratoire');
});

test('v6 → v7 : cinq notes, 45 cas sur 107, aucune première classe différente',()=>{
 const report=compare(v6,v7);
 assert.equal(report.cas,107);
 assert.equal(report.cas_modifies,45);
 assert.equal(report.premiere_classe_modifiee,0);
 assert.deepEqual(report.premiere_configuration_modifiee.map(c=>c.id),['priorites/egal/2']);
});

test('Barèmes de dégâts : la note raid de chaque DPS correspond à sa simulation',()=>{
 // Pourcentage du meilleur DPS simulé (MythicSim, base de connaissances). Chasseurs : rotation évaluée,
 // tir statique sur un combat long pour Maîtrise des bêtes et Précision, alternance pour Survie.
 const sim={'chasseur-survie':100,'guerrier-fureur':86,'chasseur-precision':85,'demoniste-demonologie':83,'mage-feu':80,
  'paladin-vindicte':78,'chasseur-maitrise-betes':75,'guerrier-armes':74,'mage-arcane':74,'demoniste-affliction':74,
  'druide-farouche-chat':73,'pretre-ombre':71,'chaman-amelioration':68,'demoniste-destruction':68,'voleur-combat':65,
  'voleur-finesse':63,'mage-givre':62,'voleur-assassinat':62,'druide-equilibre':62,'chaman-elementaire':49};
 const bareme=p=>p>=86?5:p>=72?4:p>=55?3:2;
 const dps=E.specs.filter(s=>s.role==='dps');
 assert.deepEqual(dps.map(s=>s.id).sort(),Object.keys(sim).sort());
 for(const s of dps)assert.equal(s.activity.raid,bareme(sim[s.id]),s.id+' ('+sim[s.id]+' %)');
});

test('Les écarts tranchés sont tracés dans la base et appliqués au moteur',()=>{
 const byId=Object.fromEntries(ecarts.ecarts.map(e=>[e.id,e]));
 for(const id of ['e1','e2','e3','e5','e13']){
  const e=byId[id];
  assert.equal(e.decision.choix,'changer',id);
  assert.equal(CHANGES[e.spec][e.critere][1],e.decision.valeur,id);
 }
 for(const id of ['e4','e6'])assert.equal(byId[id].decision.choix,'garder',id);
 for(const id of ['e7','e8','e9','e10','e11','e12']){
  assert.equal(byId[id].decision,null,id);
  assert.match(byId[id].attente,/lancement/,id);
 }
});
