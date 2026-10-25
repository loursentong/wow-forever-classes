'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),crypto=require('node:crypto');
const E=require('../recommendation-engine.js'),v13=require('./fixtures/moteur-reference-v13.json'),v14=require('./fixtures/moteur-reference-v14.json');
const {snapshot,compare}=require('../scripts/reference-v14.cjs');
test('v13 intacte ; v14 documentée, données identiques et évolution limitée aux contextes déclarés',()=>{
 const s=fs.readFileSync(require.resolve('./fixtures/moteur-reference-v13.json'),'utf8').replace(/\r\n/g,'\n');
 assert.equal(crypto.createHash('sha1').update('blob '+Buffer.byteLength(s)+'\0').update(s).digest('hex'),'27c1151550da3596cdf942c7edb9b7278e478ffc');
 assert.equal(v14.info.engineVersion,'1.4.0-exploratoire');assert.equal(v14.info.revision,14);assert.equal(v14.info.previousReference,'moteur-reference-v13.json');
 // La photographie v14 conserve sa décision ; le contrat actif est désormais v15.
 const r=compare(v13,v14);
 assert.equal(r.guideCases,46);assert.equal(r.changedGuide.length,14);assert.equal(r.unchangedNeutralGuide,32);
 assert.equal(r.priorityCases,118);assert.equal(r.changedPriority.length,60);assert.equal(r.unchangedPriority,58);
 for(const field of ['matrix','specs','petless','heal','referenceVariants','petlessComplexity'])assert.deepEqual(v14[field],v13[field]);
});
