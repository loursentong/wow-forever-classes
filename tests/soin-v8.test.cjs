'use strict';
/* Référence v8 (moteur 1.0.7) : façon de soigner. Avec le rôle Soin, jusqu'à deux façons de soigner
 * comparent les cinq configurations de soin selon leur profil de soin (base de connaissances), avec un
 * poids de 0,15 ; les autres configurations ne sont pas jugées sur ce critère. Aucun des 107 cas de la
 * v7 ne change ; sept scénarios s'ajoutent. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const E=require('../recommendation-engine.js');
const X=require('../result-explanations.js');
const details=require('../configuration-details.js');
const v7=require('./fixtures/moteur-reference-v7.json');
const v8=require('./fixtures/moteur-reference-v8.json');
const {compare,NEW_CASES}=require('../scripts/reference-v8.cjs');
const compact=r=>r.results.map(x=>[x.spec.id,x.score]);

test('La photographie v7 reste intacte ; la v8 en dérive explicitement',()=>{
 const source=fs.readFileSync(path.join(__dirname,'fixtures/moteur-reference-v7.json'),'utf8').replace(/\r\n/g,'\n');
 const hash=crypto.createHash('sha1').update('blob '+Buffer.byteLength(source)+'\0').update(source).digest('hex');
 assert.equal(hash,'554669d2f7968637eadfc2370b2e577e2a7b8665');
 assert.equal(v7.info.engineVersion,'1.0.6-exploratoire');
 assert.equal(v8.info.revision,8);
 assert.equal(v8.info.previousReference,'moteur-reference-v7.json');
 assert.equal(v8.info.engineVersion,'1.0.7-exploratoire');
});

test('v7 → v8 : aucun des 107 cas ne change ; sept scénarios de soin s’ajoutent',()=>{
 const report=compare(v7,v8);
 assert.equal(report.cas,107);
 assert.equal(report.cas_modifies,0);
 assert.equal(NEW_CASES.length,7);
 assert.deepEqual(report.nouveaux_cas.map(c=>c.id),NEW_CASES.map(c=>c.id));
});

test('Chaque façon de soigner désigne la configuration dont c’est le point fort',()=>{
 const results=k=>E.recommend({roles:{soin:5},rolesStrict:true,healStyles:{[k]:5}}).results;
 assert.equal(results('prevention')[0].spec.id,'pretre-discipline');
 assert.equal(results('duree')[0].spec.id,'druide-restauration');
 assert.equal(results('cible')[0].spec.id,'paladin-sacre');
 const groupe=results('groupe');
 assert.deepEqual(groupe.filter(r=>r.score===groupe[0].score).map(r=>r.spec.id),['chaman-restauration','pretre-sacre']);
 // Sans façon de soigner, les quatre classes de soin restent à égalité, comme en v7 ; depuis la v10,
 // leurs cinq configurations de soin sont classées (le Prêtre en a deux).
 const none=E.recommend({roles:{soin:5},rolesStrict:true}).results;
 assert.equal(none.length,5);assert.equal(new Set(none.map(r=>r.spec.classId)).size,4);
 assert.ok(none.every(r=>r.score===none[0].score));
});

test('Depuis v9, une envie de soin compte aussi pour les configurations qui ne soignent pas',()=>{
 const base={roles:{soin:4,dps:3},activities:{raid:3}};
 const before=E.ranking(base),after=E.ranking({...base,healStyles:{prevention:5}});
 assert.deepEqual(after.used,['roles','activities','healStyles']);
 for(const r of after.results)assert.ok('healStyles' in r.fit,r.spec.id);
 // Une envie de prévention certaine n'est pas satisfaite par un rôle sans soin.
 for(const c of ['guerrier','chasseur','voleur','mage','demoniste']){
  const a=before.results.find(r=>r.spec.classId===c),b=after.results.find(r=>r.spec.classId===c);
  assert.equal(b.spec.id,a.spec.id,c);assert.ok(b.score<a.score,c);assert.equal(b.fit.healStyles.value,0,c);
 }
 // Valeur et poids de la composante : profil 1 à 5 ramené sur 0…1, nuancé par la certitude.
 const druide=E.ranking({roles:{soin:5},rolesStrict:true,healStyles:{groupe:3}}).results.find(r=>r.spec.id==='druide-restauration');
 assert.equal(druide.fit.healStyles.weight,.15);
 assert.equal(druide.fit.healStyles.value,E.preferenceFit((4-1)/4,3));
});

test('Sans le rôle Soin, la façon de soigner est ignorée ; deux choix valides au plus',()=>{
 assert.deepEqual(E.sanitize({roles:{dps:5},healStyles:{duree:5}}).healStyles,{});
 assert.deepEqual(compact(E.recommend({roles:{dps:5},healStyles:{duree:5}})),compact(E.recommend({roles:{dps:5}})));
 assert.deepEqual(E.sanitize({roles:{soin:3},healStyles:{prevention:5,duree:9,cible:2,groupe:4,inconnu:3}}).healStyles,{prevention:5,cible:2});
 assert.deepEqual(E.sanitize({roles:{soin:3},healStyles:'groupe'}).healStyles,{});
 assert.deepEqual(E.defaultProfile.healStyles,{});
});

test('Une façon de soigner hésitante est explorée comme les autres préférences hésitantes',()=>{
 const r=E.recommend({roles:{soin:4},healStyles:{groupe:4,duree:2}});
 assert.deepEqual(r.uncertain,['Sans healStyles/duree']);
 // Retirer le rôle Soin hésitant retire aussi la façon de soigner.
 const soft=E.recommend({roles:{soin:2,dps:4},healStyles:{groupe:5}});
 assert.deepEqual(soft.uncertain,['Sans roles/soin']);
});

test('Explications et fiches : mêmes règles que le moteur, profil affiché pour les seuls soigneurs',()=>{
 for(const profile of [{roles:{soin:3},healStyles:{groupe:3,cible:1}},{roles:{soin:3}},{roles:{dps:3},healStyles:{groupe:3}},
  {roles:{soin:2},healStyles:{prevention:1,duree:2,groupe:5}}]){
  assert.deepEqual(X.healChoices(profile),E.selected(E.sanitize(profile).healStyles),JSON.stringify(profile));
 }
 assert.match(X.contextNotes({profile:{roles:{soin:3},healStyles:{groupe:3,cible:1}}}).join(' '),
  /Ta façon de soigner \(gros soins ciblés, soigner tout le groupe\) départage les spécialisations de soin/);
 assert.match(X.contextNotes({profile:{roles:{soin:3}}}).join(' '),/préciser ta façon de soigner à la question 1/);
 assert.ok(!X.contextNotes({profile:{roles:{dps:3},healStyles:{groupe:3}}}).join(' ').includes('soigner'));
 assert.match(X.contextNotes({weights:{soin:2}}).join(' '),/Ce comparateur ne départage pas les façons de soigner/);
 for(const s of E.specs){
  const html=details(s);
  assert.equal(html.includes('Façon de soigner :'),s.role==='soin',s.id);
 }
 assert.match(details(E.specs.find(s=>s.id==='pretre-discipline')),/Prévenir les dégâts : son point fort · Gros soins ciblés : un atout/);
});
