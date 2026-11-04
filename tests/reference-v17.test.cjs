'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const {execFileSync} = require('node:child_process');
const E = require('../recommendation-engine.js');
const v16 = require('./fixtures/moteur-reference-v16.json');
const v17 = require('./fixtures/moteur-reference-v17.json');
const {
 snapshot, compare, effectivePetless, formulaFingerprint, BASE_COMMIT,
 SPEC_CHANGES, MATRIX_CHANGES, PETLESS_CHANGES,
 PETLESS_COMPLEXITY_CHANGES, PETLESS_EFFECTIVE_CHANGES
} = require('../scripts/reference-v17.cjs');

const fingerprint = 'a42fba8c0ca6329886017ffd141c07e06c83e401fd9c77e27b85aa7fd9db275b';
const frozenSource = execFileSync('git', ['show', BASE_COMMIT + ':recommendation-engine.js'], {encoding: 'utf8'});
const sorted = rows => rows.slice().sort((a, b) => JSON.stringify(a).localeCompare(JSON.stringify(b), 'en'));

function gitBlob(version) {
 const text = fs.readFileSync(require.resolve('./fixtures/moteur-reference-v' + version + '.json'), 'utf8').replace(/\r\n/g, '\n');
 return crypto.createHash('sha1').update('blob ' + Buffer.byteLength(text) + '\0').update(text).digest('hex');
}

test('v17 : référence v16 immuable et décision explicite sur la base publiée', () => {
 assert.equal(gitBlob(16), 'ce0fdb7ea65919a0643f322274896bac74d4fbc2');
 assert.equal(gitBlob(17), 'd00c45d03aa6edb2c9b54ab21ee88b430e3c8d86');
 assert.equal(v16.info.engineVersion, '1.6.0-exploratoire');
 assert.equal(v17.info.revision, 17);
 assert.equal(v17.info.engineVersion, '1.7.0-exploratoire');
 assert.equal(v17.info.previousReference, 'moteur-reference-v16.json');
 assert.equal(v17.info.sourceMainCommit, BASE_COMMIT);
 assert.equal(BASE_COMMIT, '583a8cbe7d84f68f926103f7abde0d7af9e66a37');
 assert.match(v17.info.decision, /notes officielles du 2 novembre/);
 assert.match(v17.info.decision, /rapports MythicSim du 4 novembre/);
 assert.match(v17.info.decision, /Formules, barèmes, coefficients, pondérations/);
});

test('v17 : reconstruction exacte des données, variantes et cas actifs', () => {
 assert.equal(E.version, '1.7.0-exploratoire');
 assert.deepEqual(snapshot(), v17);
 assert.equal(v17.guide.length, 62);
 assert.equal(v17.priorities.reduce((total, entry) => total + entry.levels.length, 0), 60);
 assert.equal(v17.isolatedRoles.reduce((total, entry) => total + entry.axes.length, 0), 12);
 assert.equal(v17.mixed.reduce((total, entry) => total + entry.levels.length, 0), 33);
 assert.equal(v17.technicite.reduce((total, entry) => total + entry.levels.length, 0), 28);
 assert.deepEqual(effectivePetless(v17), E.petless);
 assert.deepEqual(E.checkData(), []);
});

test('v16 → v17 : seuls les changements de données décidés et leurs effets sont acceptés', () => {
 const result = compare(v16, v17);
 assert.equal(SPEC_CHANGES.length, 36);
 assert.equal(MATRIX_CHANGES.length, 7);
 assert.deepEqual(sorted(result.specChanges), sorted(SPEC_CHANGES));
 assert.deepEqual(sorted(result.matrixChanges), sorted(MATRIX_CHANGES));
 assert.deepEqual(sorted(result.petlessChanges), sorted(PETLESS_CHANGES));
 assert.deepEqual(sorted(result.petlessComplexityChanges), sorted(PETLESS_COMPLEXITY_CHANGES));
 assert.deepEqual(sorted(result.petlessEffectiveChanges), sorted(PETLESS_EFFECTIVE_CHANGES));
 assert.equal(result.guideCases, 59);
 assert.equal(result.changedGuide.length, 47);
 assert.equal(result.unchangedGuide.length, 12);
 assert.deepEqual(result.changedGuide.filter(entry => entry.firstChanged).map(entry => entry.id), [
  'low-certainty-styles', 'difficulty-simple-pve', 'heal-audit-prevention-0',
  'v13-dps-melee-mobile', 'v14-solo-pvp'
 ]);
 assert.equal(result.priorityCases, 133);
 assert.equal(result.changedPriority.length, 131);
 assert.equal(result.unchangedPriority.length, 2);
 assert.equal(result.changedPriority.filter(entry => entry.firstChanged).length, 15);
});

test('v17 : mêmes formules que la source gelée malgré les nouvelles données PETLESS', () => {
 const source = fs.readFileSync(require.resolve('../recommendation-engine.js'), 'utf8');
 assert.equal(formulaFingerprint(frozenSource), fingerprint);
 assert.equal(formulaFingerprint(source), fingerprint);
 const coefficient = source.replace('var GROUP_PVE_SINGLE_TARGET = 0.75;', 'var GROUP_PVE_SINGLE_TARGET = 0.74;');
 assert.notEqual(coefficient, source);
 assert.notEqual(formulaFingerprint(coefficient), fingerprint);
 const variantBuilder = source.replace('activity:Object.assign({},s.activity,d.activity||{})', 'activity:Object.assign({},s.activity)');
 assert.notEqual(variantBuilder, source, 'La construction des variantes reste dans le contrôle de formules');
 assert.notEqual(formulaFingerprint(variantBuilder), fingerprint);
 const variantData = source.replace(/var PETLESS=[\s\S]*?\n\};/, declaration => declaration.replace('solo:3', 'solo:2'));
 assert.notEqual(variantData, source);
 assert.equal(formulaFingerprint(variantData), fingerprint, 'Les déclarations de données sont vérifiées par le comparateur dédié');
});

test('v17 : trois profils supplémentaires exercent sans familier, tank PvP et DPS accessible', () => {
 assert.deepEqual(v17.guide.slice(-3).map(entry => [entry.id, entry.top]), [
  ['v17-affliction-sans-familier', ['mage-feu', 'demoniste-affliction', 'mage-arcane']],
  ['v17-paladin-tank-pvp', ['druide-farouche-ours', 'paladin-protection', 'guerrier-protection']],
  ['v17-dps-pve-accessible', ['mage-feu', 'mage-givre', 'chasseur-survie']]
 ]);
 const withoutPet = v17.guide.find(entry => entry.id === 'v17-affliction-sans-familier');
 assert.ok(withoutPet.sansFamilier.includes('demoniste-affliction'));
 assert.equal(effectivePetless(v17)['demoniste-affliction'].activity.raid, 4);
 assert.equal(v17.specs.find(spec => spec.id === 'demoniste-affliction').activity.raid, 3);
 assert.equal(effectivePetless(v17)['demoniste-destruction'].load.pve, 3);
 assert.deepEqual(effectivePetless(v17)['demoniste-destruction'].complexity.pve, [1, 2, 1, 1, 0]);
});

test('v17 : le comparateur refuse les changements de note, variantes ou profils non autorisés', () => {
 const note = structuredClone(v17);
 note.specs.find(spec => spec.id === 'guerrier-protection').activity.raid = 1;
 assert.throws(() => compare(v16, note), /différences spécialisées validées/);
 const missing = structuredClone(v17);
 missing.guide.shift();
 assert.throws(() => compare(v16, missing));
 const weights = structuredClone(v17);
 weights.priorities[0].weights.raid = 3;
 assert.throws(() => compare(v16, weights));
 const petless = structuredClone(v17);
 petless.petless['chasseur-survie'].raid = [5, 4];
 assert.throws(() => compare(v16, petless), /écarts sans familier validés/);
 const petlessDifficulty = structuredClone(v17);
 petlessDifficulty.petlessComplexity['demoniste-destruction'].complexity.pve[4] = 1;
 assert.throws(() => compare(v16, petlessDifficulty), /difficultés sans familier validées/);
 const healing = structuredClone(v17);
 healing.heal['pretre-sacre'].groupe = 4;
 assert.throws(() => compare(v16, healing), /heal inchangé/);
});
