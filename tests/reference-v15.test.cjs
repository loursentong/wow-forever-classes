'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const v14=require('./fixtures/moteur-reference-v14.json'),v15=require('./fixtures/moteur-reference-v15.json');
const {compare}=require('../scripts/reference-v15.cjs');

test('v14 intacte ; nouvelle référence v15 explicite et données sources conservées',()=>{
 const s=fs.readFileSync(require.resolve('./fixtures/moteur-reference-v14.json'),'utf8').replace(/\r\n/g,'\n');
 assert.equal(crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex'),'e2c04042407a125bac7a90d187059b23dcdf5ded');
 assert.equal(v14.info.engineVersion,'1.4.0-exploratoire');
 assert.equal(v15.info.engineVersion,'1.5.0-exploratoire');assert.equal(v15.info.revision,15);
 assert.equal(v15.info.previousReference,'moteur-reference-v14.json');
 assert.match(v15.info.decision,/75 %.*25 %/);
 // Depuis la révision de données v16, la reconstruction active appartient au contrat v16.
 // La photographie v15 et toutes ses assertions de transition restent figées, octet pour octet.
 const frozen=fs.readFileSync(require.resolve('./fixtures/moteur-reference-v15.json'),'utf8').replace(/\r\n/g,'\n');
 assert.equal(crypto.createHash('sha1').update('blob '+Buffer.byteLength(frozen)+'\0').update(frozen).digest('hex'),'9035f56a33edb98ebf7967e7a686326f018fb119');
 for(const field of ['matrix','specs','petless','heal','referenceVariants','petlessComplexity','priorityAxes'])assert.deepEqual(v15[field],v14[field]);
});

test('v14 → v15 : changements PvE et départages documentés ; scores hors DPS et contextes solo/PvP conservés',()=>{
 const r=compare(v14,v15);
 assert.equal(r.guideCases,52);assert.equal(r.changedGuide.length,23);assert.equal(r.changedGuide.filter(c=>c.firstChanged).length,6);
 assert.equal(r.neutralGuide,18);
 assert.equal(r.priorityCases,127);assert.equal(r.changedPriority.length,62);assert.equal(r.changedPriority.filter(c=>c.firstChanged).length,11);
 assert.equal(r.neutralPriority,59);
 assert.deepEqual(v15.guide.find(c=>c.id==='v15-pve-dps').top,['guerrier-fureur','chasseur-survie','mage-feu']);
 assert.equal(v15.guide.length,56);assert.equal(v15.mixed.length,11);
});
