'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');
const match = html.match(/window\.__WF = (\{.*?\});\s*\(function\(\)/s);
const scriptMatch = html.match(/<script>([\s\S]*?)<\/script>/);
assert.ok(match && scriptMatch, 'modèle et script présents');
const config = JSON.parse(match[1]);
const script = scriptMatch[1];

function elem(dataset = {}) {
  const listeners = {};
  const baseNode = { textContent: '', after(_node) {} };
  const classes = new Set(['cell']);
  return {
    dataset,
    attrs: {},
    listeners,
    innerHTML: '',
    textContent: '',
    value: '',
    clientWidth: 640,
    classList: {
      add(x) { classes.add(x); },
      remove(...names) { for (const name of names) classes.delete(name); }
    },
    querySelector(selector) { return selector === 'b' ? baseNode : null; },
    addEventListener(name, fn) { (listeners[name] ||= []).push(fn); },
    setAttribute(name, value) { this.attrs[name] = value; },
    trigger(name = 'click') { for (const fn of (listeners[name] || [])) fn(); },
    b: baseNode
  };
}
function boot(initial = {}) {
  const ids = ['mdesc','mlabel','rank','curves','curves-values','duel','duelSum','duelA','duelB'];
  const elements = Object.fromEntries(ids.map(id => [id, elem()]));
  const groups = {
    '.mbtn': config.levels.map((_, i) => elem({m: String(i)})),
    '.seg button[data-ax]': config.axes.flatMap(ax => [0,1,2,3].map(v => elem({ax, v: String(v)}))),
    '.presets button': Object.keys(config.presets).map(preset => elem({preset})),
    '.hl-chips button': config.classes.map(c => elem({id: c.id})),
    'td.cell[data-k]': config.classes.flatMap((c,i) => config.axes.map(k => elem({c: String(i),k,v: String(c.r[k])})))
  };
  const document = {
    getElementById(id) { return elements[id]; },
    querySelectorAll(selector) { return groups[selector] || []; },
    createElement() { return {className: '', title: '', textContent: ''}; }
  };
  const storage = {...initial};
  const localStorage = {
    getItem(k) { return Object.hasOwn(storage,k) ? storage[k] : null; },
    setItem(k,v) { storage[k]=v; }
  };
  const window = {addEventListener() {}};
  const needle = '  renderAll();\n})();';
  assert.ok(script.includes(needle), 'insertion API de test impossible');
  const augmented = script.replace(needle,
    '  __test.api = {S:S,D:D,eff:eff,score:score,tw:tw,renderAll:renderAll};\n' + needle);
  const holder = {};
  const context = {window,document,localStorage,__test:holder,console};
  vm.runInNewContext(augmented, context, {timeout:3000});
  return {config:holder.api.D, api:holder.api, elements, groups, storage};
}
const ranking = html => [...html.matchAll(/class="bname">[\s\S]*?<\/span>([^<]+)<\/span>[\s\S]*?class="bval mono">(\d+)<\/span>/g)]
  .map(m=>[m[1],Number(m[2])]);

test('Le comparatif conserve neuf classes, douze axes, quatre profils et quatre niveaux',()=>{
  assert.equal(config.classes.length,9);
  assert.equal(config.axes.length,12);
  assert.deepEqual(Object.keys(config.presets),['egal','polyvalence','pvp','pve']);
  assert.equal(config.levels.length,4);
  assert.ok(html.includes('id="curves-values"'));
  assert.equal((html.match(/<span class="tag you">Pour toi<\/span>/g)||[]).length,0);
  assert.equal((html.match(/<span class="tag you">Style de jeu<\/span>/g)||[]).length,9);
  assert.ok(!/Ton profil|Spiritualiste d'Aion|tu l'as écarté/i.test(html));
});

test('La référence Confirmé conserve les 108 notes et les scores initiaux des profils historiques',()=>{
  const historical = {
    egal: [82,77,70,67,67,65,62,58,57],
    pvp: [81,78,76,72,71,71,70,66,63],
    pve: [82,81,71,67,62,54,53,49,44]
  };
  const h=boot();
  for(const [preset,scores] of Object.entries(historical)){
    h.groups['.presets button'].find(x=>x.dataset.preset===preset).trigger();
    assert.deepEqual(ranking(h.elements.rank.innerHTML).map(x=>x[1]),scores,preset);
  }
  for(const c of config.classes) for(const k of config.axes) assert.equal(h.api.eff(c,k,2),c.r[k]);
});

test('Débutant → Intermédiaire → Confirmé → Expert est monotone, 0 à 100',()=>{
  const h=boot();
  for(const preset of Object.keys(config.presets)){
    h.groups['.presets button'].find(x=>x.dataset.preset===preset).trigger();
    for(const c of config.classes){
      const v=[0,1,2,3].map(m=>h.api.score(c,m));
      assert.ok(v.every((x,i)=>x>=0 && x<=100 && (!i||x>=v[i-1])),c.name+'/'+preset+'/'+v);
    }
  }
});

test('Les rôles absents, la mobilité, la technicité, la polyvalence et l’utilité restent intacts',()=>{
  const h=boot();
  for(const c of config.classes){
    for(const k of ['poly','mob','util','tech']){
      assert.equal(h.api.eff(c,k,0),c.r[k]);
      assert.equal(h.api.eff(c,k,3),c.r[k]);
    }
    for(const k of config.axes) if(c.r[k]===1) assert.equal(h.api.eff(c,k,3),1);
  }
});

test('Le Chasseur reste accessible en solo, mais son DPS optimise des rotations plus exigeantes',()=>{
  const h=boot(),c=config.classes.find(x=>x.id==='chasseur');
  assert.equal(h.api.eff(c,'solo',0),c.r.solo);
  assert.ok(h.api.eff(c,'dps',0)<c.r.dps);
  assert.equal(h.api.eff(c,'dps',3),5);
});

test('Les graphiques contiennent les neuf classes et la lecture chiffrée accessible',()=>{
  const h=boot();
  assert.ok(h.elements.curves.innerHTML.includes('<svg'));
  assert.equal((h.elements['curves-values'].innerHTML.match(/<tr>/g)||[]).length,9);
  assert.ok(h.elements['curves-values'].innerHTML.includes('Chasseur'));
  h.groups['.mbtn'][0].trigger();
  assert.equal(h.api.S.m,0);
  assert.equal(h.groups['.mbtn'][0].attrs['aria-pressed'],'true');
  assert.match(h.elements.curves.innerHTML,/<svg/);
  assert.equal((h.elements['curves-values'].innerHTML.match(/<tr>/g)||[]).length,9);
});

test('Le duel suit les sélections et l’écart est égal à la somme des contributions',()=>{
  const h=boot();
  h.elements.duelA.value='chasseur';
  h.elements.duelA.trigger('change');
  h.elements.duelB.value='druide';
  h.elements.duelB.trigger('change');
  assert.match(h.elements.duel.innerHTML,/dbar/);
  assert.match(h.elements.duelSum.innerHTML,/Chasseur/);
  const a=config.classes.find(c=>c.id==='chasseur');
  const b=config.classes.find(c=>c.id==='druide');
  for(let m=0;m<4;m++){
    const total=h.api.tw();
    const contributions=config.axes.reduce((sum,k)=>sum+100*h.api.S.w[k]*
      (h.api.eff(a,k,m)-h.api.eff(b,k,m))/(5*total),0);
    assert.ok(Math.abs(contributions-(h.api.score(a,m)-h.api.score(b,m)))<1e-10);
  }
  h.elements.duelB.value='chasseur';h.elements.duelB.trigger('change');
  assert.match(h.elements.duel.innerHTML,/deux classes différentes/);
});

test('Tous les poids nuls sont gérés et expliqués',()=>{
  const h=boot({'wf-overview-v3':JSON.stringify({w:Object.fromEntries(config.axes.map(k=>[k,0]))})});
  assert.deepEqual(ranking(h.elements.rank.innerHTML).map(x=>x[1]),Array(9).fill(0));
  assert.match(h.elements.duel.innerHTML,/aucun ne départage/);
  assert.equal((h.elements['curves-values'].innerHTML.match(/<tr>/g)||[]).length,9);
});

test('Persistance et migration des anciennes préférences',()=>{
  const h=boot();
  h.groups['.mbtn'][0].trigger();
  h.groups['.presets button'].find(x=>x.dataset.preset==='pvp').trigger();
  const saved=boot(h.storage);
  assert.equal(saved.api.S.m,0);
  assert.equal(saved.api.S.w.bg,3);
  assert.equal(saved.api.S.w.soin,0);
  const legacy=boot({'wf-overview-weights':JSON.stringify({ctrl:3,poly:0}),
    'wf-overview-skill':'debutant'});
  assert.equal(legacy.api.S.m,0);
  assert.equal(legacy.api.S.w.ctrl,3);
  assert.equal(legacy.api.S.w.poly,0);
  const broken=boot({'wf-overview-v3':JSON.stringify({m:7,w:{ctrl:55,soin:-1,mob:2.5}})});
  assert.equal(broken.api.S.m,2);
  assert.equal(broken.api.S.w.ctrl,1);
  assert.equal(broken.api.S.w.soin,1);
  assert.equal(broken.api.S.w.mob,1);
});
