'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const dataText = html.match(/var D=(\{.*?\});\s*\/\* Modelé/s);
const scriptText = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(dataText && scriptText, 'La matrice JSON et le script du site doivent être présents');
const data = JSON.parse(dataText[1]);
const script = scriptText[1];

function mockElement(dataset = {}) {
  return {
    dataset,
    attrs: {},
    listeners: {},
    value: '',
    innerHTML: '',
    textContent: '',
    addEventListener(event, fn) {
      (this.listeners[event] ||= []).push(fn);
    },
    setAttribute(key, value) { this.attrs[key] = value; },
    trigger(event = 'click') {
      for (const fn of (this.listeners[event] || [])) fn();
    }
  };
}
function boot(initial = {}) {
  const storage = { ...initial }, elements = {};
  const ids = ['rank', 'compare-a', 'compare-b', 'progress-chart', 'drivers-chart', 'skill-description'];
  for (const id of ids) elements[id] = mockElement();
  const groups = {
    '.seg button': data.axes.flatMap(ax => [0, 1, 2, 3].map(v => mockElement({ ax, v: String(v) }))),
    '.presets button': Object.keys(data.presets).map(preset => mockElement({ preset })),
    '.skill-choices button': ['debutant', 'intermediaire', 'confirme', 'expert'].map(skill => mockElement({ skill }))
  };
  const document = {
    getElementById(id) { return elements[id]; },
    querySelectorAll(query) { return groups[query] || []; }
  };
  const localStorage = {
    getItem(key) { return Object.hasOwn(storage, key) ? storage[key] : null; },
    setItem(key, value) { storage[key] = value; }
  };
  // Instrumentation confinée au test : aucune API de test n'est exposée sur le site réel.
  const marker = '  render();\n})();';
  assert.ok(script.includes(marker), 'Point d’instrumentation introuvable');
  const instrumented = script.replace(marker,
    '  __test.api={score:score,rawScore:rawScore,effective:effective,w:w,classes:D.classes};\n' + marker);
  const holder = {};
  vm.runInNewContext('(function(document,localStorage,__test){' + instrumented + '})', {}, { timeout: 3000 })(
    document, localStorage, holder
  );
  return { storage, elements, groups, api: holder.api };
}
function ranking(htmlString) {
  const list = [];
  for (const match of htmlString.matchAll(/class="bname">[\s\S]*?<\/span>([^<]+)<\/span>[\s\S]*?class="bval mono">(\d+)<\/span>/g)) {
    list.push([match[1], Number(match[2])]);
  }
  return list;
}

test('Contrat structurel 9 classes × 12 critères et quatre niveaux', () => {
  assert.equal(data.classes.length, 9);
  assert.equal(data.axes.length, 12);
  assert.equal(new Set(data.classes.map(c => c.name)).size, 9);
  assert.equal((html.match(/data-skill="/g) || []).length, 4);
  assert.ok(html.includes('id="progress-chart"'));
  assert.ok(html.includes('id="drivers-chart"'));
  assert.ok(html.includes('aria-live="polite"'));
});

test('Score Confirmé inchangé pour les quatre préréglages', () => {
  const expected = {
    profil: [80,78,70,68,68,67,63,60,58],
    egal: [82,77,70,67,67,65,62,58,57],
    pvp: [81,78,76,72,71,71,70,66,63],
    pve: [82,81,71,67,62,54,53,49,44]
  };
  const h = boot();
  for (const [preset, vals] of Object.entries(expected)) {
    const button = h.groups['.presets button'].find(b => b.dataset.preset === preset);
    button.trigger();
    assert.deepEqual(ranking(h.elements.rank.innerHTML).map(x => x[1]), vals, preset);
    assert.equal(button.attrs['aria-pressed'], 'true');
  }
});

test('Débutant < Intermédiaire < Confirmé < Expert pour chaque classe et preset', () => {
  const h = boot(), levels = ['debutant', 'intermediaire', 'confirme', 'expert'];
  for (const preset of Object.keys(data.presets)) {
    h.groups['.presets button'].find(b => b.dataset.preset === preset).trigger();
    for (const c of data.classes) {
      const scores = levels.map(s => h.api.score(c, s));
      assert.ok(scores.every((v, i) => i === 0 || scores[i - 1] <= v),
        c.name + '/' + preset + ': ' + scores);
      assert.ok(scores.every(v => v >= 0 && v <= 100));
    }
  }
});

test('Les rôles absents, la polyvalence, la mobilité, les utilitaires et la technicité restent invariants', () => {
  const h = boot();
  for (const c of data.classes) {
    for (const axis of ['poly', 'mob', 'util', 'tech']) {
      assert.equal(h.api.effective(c, axis, 'debutant'), c.r[axis]);
      assert.equal(h.api.effective(c, axis, 'expert'), c.r[axis]);
    }
    for (const axis of data.axes.filter(a => c.r[a] === 1)) {
      assert.equal(h.api.effective(c, axis, 'expert'), 1);
    }
  }
});

test('Chasseur : DPS dépend de la maîtrise, pas son farming solo', () => {
  const h = boot(), hunter = data.classes.find(c => c.name === 'Chasseur');
  assert.ok(h.api.effective(hunter, 'dps', 'debutant') < hunter.r.dps);
  assert.equal(h.api.effective(hunter, 'solo', 'debutant'), hunter.r.solo);
});

test('Le sélecteur met à jour le classement, les courbes et le stockage', () => {
  const h = boot(), original = h.elements.rank.innerHTML;
  h.groups['.skill-choices button'][0].trigger();
  assert.notEqual(h.elements.rank.innerHTML, original);
  assert.equal(h.storage['wf-overview-skill'], 'debutant');
  assert.equal(h.groups['.skill-choices button'][0].attrs['aria-pressed'], 'true');
  assert.match(h.elements['progress-chart'].innerHTML, /<svg/);
  assert.match(h.elements['progress-chart'].innerHTML, /Lire les valeurs du graphique/);
  assert.match(h.elements['drivers-chart'].innerHTML, /driver-row/);
  assert.match(h.elements['skill-description'].textContent, /Débutant/);
});

test('Comparer manuellement deux classes et gérer une sélection identique', () => {
  const h = boot();
  h.elements['compare-a'].value = 'Mage';
  h.elements['compare-a'].trigger('change');
  h.elements['compare-b'].value = 'Voleur';
  h.elements['compare-b'].trigger('change');
  assert.match(h.elements['drivers-chart'].innerHTML, /Mage/);
  assert.match(h.elements['drivers-chart'].innerHTML, /Voleur/);
  h.elements['compare-b'].value = 'Mage';
  h.elements['compare-b'].trigger('change');
  assert.match(h.elements['drivers-chart'].innerHTML, /deux classes différentes/);
});

test('Persistance des choix et tolérance aux valeurs malformées', () => {
  const h = boot();
  h.groups['.skill-choices button'][0].trigger();
  h.groups['.presets button'][2].trigger();
  const back = boot(h.storage);
  assert.equal(back.storage['wf-overview-skill'], 'debutant');
  assert.equal(back.groups['.presets button'][2].attrs['aria-pressed'], 'true');

  const wrong = boot({
    'wf-overview-skill': 'godtiers',
    'wf-overview-weights': JSON.stringify({ soin: 100, dps: -1, bg: 1.5, ctrl: 2 })
  });
  assert.equal(wrong.storage['wf-overview-skill'], 'confirme');
  assert.equal(wrong.api.w.soin, data.presets.profil.soin);
  assert.equal(wrong.api.w.dps, data.presets.profil.dps);
  assert.equal(wrong.api.w.bg, data.presets.profil.bg);
  assert.equal(wrong.api.w.ctrl, 2);
});

test('Tout à zéro : classement nul et explication dans le graphique', () => {
  const zero = Object.fromEntries(data.axes.map(a => [a, 0]));
  const h = boot({ 'wf-overview-weights': JSON.stringify(zero) });
  assert.deepEqual(ranking(h.elements.rank.innerHTML).map(x => x[1]), Array(9).fill(0));
  assert.match(h.elements['drivers-chart'].innerHTML, /poids positif/);
});

test('Somme des contributions = écart brut des indices', () => {
  const h = boot();
  const a = data.classes.find(c => c.name === 'Druide');
  const b = data.classes.find(c => c.name === 'Paladin');
  for (const level of ['debutant', 'intermediaire', 'confirme', 'expert']) {
    const total = data.axes.reduce((n, ax) => n + h.api.w[ax], 0);
    const sum = data.axes.reduce((n, ax) =>
      n + 100 * h.api.w[ax] * (h.api.effective(a, ax, level) - h.api.effective(b, ax, level)) / (5 * total), 0);
    assert.ok(Math.abs(sum - (h.api.rawScore(a, level) - h.api.rawScore(b, level))) < 1e-10, level);
  }
});
