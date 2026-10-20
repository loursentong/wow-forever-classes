'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\r\n/g, '\n');
const referenceNotes = require('./reference-notes.json');
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
    getAttribute(name) { return this.attrs[name]; },
    trigger(name = 'click') { for (const fn of (listeners[name] || [])) fn(); },
    b: baseNode
  };
}
function boot(initial = {}, storageDisabled = false) {
  const ids = ['mdesc','mlabel','rank','rank-status','curves','curves-values','theme','mine','reset-w'];
  const elements = Object.fromEntries(ids.map(id => [id, elem()]));
  const groups = {
    '.mbtn': config.levels.map((_, i) => elem({m: String(i)})),
    '.seg button[data-ax]': config.axes.flatMap(ax => [0,1,2,3].map(v => elem({ax, v: String(v)}))),
    '.presets button[data-preset]': Object.keys(config.presets).map(preset => elem({preset})),
    '.hl-chips button': config.classes.map(c => elem({id: c.id}))
  };
  const document = {
    documentElement: elem(),
    getElementById(id) { assert.ok(elements[id], 'élément absent : '+id); return elements[id]; },
    querySelectorAll(selector) {
      assert.ok(groups[selector], 'sélecteur inattendu : '+selector);
      return groups[selector];
    },
    createElement() { return {className: '', title: '', textContent: ''}; }
  };
  document.documentElement.setAttribute('data-theme', 'dark');
  const storage = {...initial};
  const localStorage = {
    getItem(k) { if(storageDisabled) throw Error('storage disabled'); return Object.hasOwn(storage,k) ? storage[k] : null; },
    setItem(k,v) { if(storageDisabled) throw Error('storage disabled'); storage[k]=v; }
  };
  const window = {addEventListener() {}};
  const needle = '  renderAll();\n})();';
  assert.ok(script.includes(needle), 'insertion API de test impossible');
  const augmented = script.replace(needle,
    '  __test.api = {S:S,D:D,eff:eff,score:score,tw:tw,renderAll:renderAll};\n' + needle);
  const holder = {};
  const context = {window,document,localStorage,__test:holder,console};
  vm.runInNewContext(html.match(/<script data-theme-init>([\s\S]*?)<\/script>/)[1], context);
  vm.runInNewContext(augmented, context, {timeout:3000});
  return {config:holder.api.D, api:holder.api, elements, groups, storage, document};
}
const ranking = html => [...html.matchAll(/class="bname">[\s\S]*?<\/span>([^<]+)<\/span>[\s\S]*?class="bval mono">(\d+)<\/span>/g)]
  .map(m=>[m[1],Number(m[2])]);

test('Le comparatif conserve neuf classes, quatorze axes et quatre niveaux avec quinze profils',()=>{
  assert.equal(config.classes.length,9);
  assert.equal(config.axes.length,14);
  assert.deepEqual(Object.keys(config.presets),['egal','polyvalence','pve','pvp','tank','soin','dps','zone','soutien','bg','soinbg','sauvage','burst','controle','solo']);
  assert.equal(config.levels.length,4);
  assert.ok(html.includes('id="curves-values"'));
  assert.equal((html.match(/<span class="tag you">Pour toi<\/span>/g)||[]).length,0);
  assert.equal((html.match(/<span class="tag you">Style de jeu<\/span>/g)||[]).length,9);
  assert.ok(!/Ton profil|Spiritualiste d'Aion|tu l'as écarté|Tu te décris/i.test(html));
});

test('Les 126 notes source et les 126 cases restent identiques à la référence',()=>{
  assert.deepEqual(Object.fromEntries(config.classes.map(c=>[c.id,c.r])),referenceNotes);
  const cells=[...html.matchAll(/<td class="cell [^"]+" data-c="(\d+)" data-k="([^"]+)" data-v="(\d)"><b>(\d)<\/b>/g)];
  assert.equal(cells.length,126);
  const seen=new Set();
  for(const [,c,k,v,display] of cells){
    const id=config.classes[Number(c)].id;
    assert.equal(Number(v),referenceNotes[id][k]);
    assert.equal(v,display);
    seen.add(id+'/'+k);
  }
  assert.equal(seen.size,126);
});

test('La maîtrise est dans le panneau des pondérations ; le tableau et le duel ne sont plus pilotés',()=>{
  const tool=html.match(/<section class="sec" aria-labelledby="h-tool">([\s\S]*?)<\/section>/)[1];
  assert.match(tool,/<div class="wrows">\s*<div class="wrow mastery-row">/);
  assert.equal((tool.match(/class="mbtn"/g)||[]).length,4);
  assert.equal((tool.match(/data-ax=/g)||[]).length,56);
  assert.ok(!/Réglage global|Duel de classes|id="duel|renderDuel|renderMatrix|\.delta/.test(html));
  const matrix=html.match(/aria-labelledby="h-matrix">([\s\S]*?)<\/section>/)[1];
  assert.ok(!/mlabel|data-m=|Notes au niveau/.test(matrix));
  // An attempt to update the matrix also fails through the strict mock selectors in boot().
  const h=boot();
  const before=h.elements.rank.innerHTML;
  h.groups['.mbtn'][0].trigger();
  assert.notEqual(h.elements.rank.innerHTML,before);
  assert.equal(h.api.tw(),14);
  assert.deepEqual(Object.keys(h.api.S.w),config.axes);
});

test('Chaque préréglage définit les quatorze poids, sans écraser la maîtrise',()=>{
  const h=boot();
  h.groups['.mbtn'][0].trigger();
  const signatures=new Set();
  for(const [id,weights] of Object.entries(config.presets)){
    assert.deepEqual(Object.keys(weights),config.axes);
    assert.ok(Object.values(weights).every(v=>Number.isInteger(v)&&v>=0&&v<=3));
    assert.ok(Object.values(weights).some(v=>v>0));
    signatures.add(JSON.stringify(weights));
    const button=h.groups['.presets button[data-preset]'].find(b=>b.dataset.preset===id);
    button.trigger();
    assert.equal(JSON.stringify(h.api.S.w),JSON.stringify(weights));
    assert.equal(h.api.S.m,0);
    assert.equal(button.attrs['aria-pressed'],'true');
    assert.equal(h.groups['.presets button[data-preset]'].filter(b=>b.attrs['aria-pressed']==='true').length,1);
  }
  assert.equal(signatures.size,Object.keys(config.presets).length);
  // Modifier un poids qu'aucun profil n'utilise à 3 désélectionne tous les profils.
  h.groups['.seg button[data-ax]'].find(b=>b.dataset.ax==='tech'&&b.dataset.v==='3').trigger();
  assert.equal(h.api.S.w.tech,3);
  assert.ok(h.groups['.presets button[data-preset]'].every(b=>b.attrs['aria-pressed']==='false'));
});

test('Les neuf raisons du modèle sont concises et renvoient à la bibliographie',()=>{
  const reasons=[...html.matchAll(/<td class="why">([\s\S]*?)<\/td>/g)];
  assert.equal(reasons.length,9);
  for(const [,reason] of reasons){
    assert.ok(reason.replace(/<[^>]+>/g,'').length<150);
    const refs=[...reason.matchAll(/href="#src-(\d+)">\[\1\]<\/a>/g)];
    assert.ok(refs.length>0);
    for(const [,id] of refs) assert.ok(html.includes('id="src-'+id+'"'));
  }
});

test('La référence Confirmé applique les notes telles quelles et fige les scores de « Tout à égalité »',()=>{
  // Depuis l'ajout de Burst et Dégâts de zone (20 octobre), « Tout à égalité » porte sur quatorze critères.
  // Sur les douze critères d'origine, ces scores étaient 82, 77, 70, 67, 67, 65, 62, 58 et 57.
  const historical = {
    egal: [80,76,73,70,69,64,63,63,60]
  };
  const h=boot();
  for(const [preset,scores] of Object.entries(historical)){
    h.groups['.presets button[data-preset]'].find(x=>x.dataset.preset===preset).trigger();
    assert.deepEqual(ranking(h.elements.rank.innerHTML).map(x=>x[1]),scores,preset);
  }
  for(const c of config.classes) for(const k of config.axes) assert.equal(h.api.eff(c,k,2),c.r[k]);
});

test('Débutant → Intermédiaire → Confirmé → Expert est monotone, 0 à 100',()=>{
  const h=boot();
  for(const preset of Object.keys(config.presets)){
    h.groups['.presets button[data-preset]'].find(x=>x.dataset.preset===preset).trigger();
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

test('Tous les poids nuls sont gérés et expliqués',()=>{
  const h=boot({'wf-overview-v3':JSON.stringify({w:Object.fromEntries(config.axes.map(k=>[k,0]))})});
  assert.deepEqual(ranking(h.elements.rank.innerHTML).map(x=>x[1]),Array(9).fill(0));
  assert.match(h.elements['rank-status'].textContent,/aucun ne départage/);
  assert.equal((h.elements['curves-values'].innerHTML.match(/<tr>/g)||[]).length,9);
});

test('Persistance et migration des anciennes préférences',()=>{
  const h=boot();
  h.groups['.mbtn'][0].trigger();
  h.groups['.presets button[data-preset]'].find(x=>x.dataset.preset==='pvp').trigger();
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
  const v2=boot({'wf-overview-v2':JSON.stringify({m:1,w:{tank:3},hl:['mage','mage','invalid'],a:'druide',b:'paladin'})});
  assert.equal(v2.api.S.m,1);
  assert.equal(v2.api.S.w.tank,3);
  assert.equal(JSON.stringify(v2.api.S.hl),'["mage"]');
  assert.ok(!Object.hasOwn(v2.api.S,'a')&&!Object.hasOwn(v2.api.S,'b'));
});

test('La mise en avant des courbes se modifie et persiste',()=>{
  const h=boot();
  const mage=h.groups['.hl-chips button'].find(b=>b.dataset.id==='mage');
  mage.trigger();
  assert.equal(mage.attrs['aria-pressed'],'true');
  assert.ok(boot(h.storage).api.S.hl.includes('mage'));
  mage.trigger();
  assert.equal(mage.attrs['aria-pressed'],'false');
});

test('Sombre par défaut, choix clair/sombre/système conservé indépendamment du classement',()=>{
  const h=boot();
  assert.equal(h.elements.theme.value,'dark');
  const before=h.elements.rank.innerHTML;
  for(const theme of ['light','dark','system']){
    h.elements.theme.value=theme;
    h.elements.theme.trigger('change');
    assert.equal(h.document.documentElement.getAttribute('data-theme'),theme);
    assert.equal(boot(h.storage).elements.theme.value,theme);
    assert.equal(h.elements.rank.innerHTML,before);
  }
  assert.equal(boot({'wf-overview-theme':'invalid'}).elements.theme.value,'dark');
});

test('La page reste utilisable sans stockage local et avec une sauvegarde invalide',()=>{
  const h=boot({},true);
  h.groups['.mbtn'][0].trigger();
  h.groups['.presets button[data-preset]'].find(b=>b.dataset.preset==='solo').trigger();
  assert.equal(h.api.S.m,0);
  assert.equal(h.api.S.w.solo,3);
  assert.equal(ranking(h.elements.rank.innerHTML).length,9);
  assert.equal(boot({'wf-overview-v3':'{broken'}).api.S.m,2);
});

test('Profils homogènes : chaque classe mène ou partage la tête d’au moins un profil au niveau Confirmé',()=>{
  const h=boot();
  const leaders=new Set();
  for(const preset of Object.keys(config.presets)){
    h.groups['.presets button[data-preset]'].find(x=>x.dataset.preset===preset).trigger();
    const scores=config.classes.map(c=>[c.id,Math.round(h.api.score(c,2))]);
    const top=Math.max(...scores.map(x=>x[1]));
    scores.filter(x=>x[1]===top).forEach(x=>leaders.add(x[0]));
  }
  assert.deepEqual([...leaders].sort(),config.classes.map(c=>c.id).sort());
});

test('Profils homogènes : le nom annonce le critère dominant, sans Technicité ni Polyvalence ajoutées',()=>{
  const headline={tank:'tank',soin:'soin',dps:'dps',zone:'zone',soutien:'util',bg:'bg',soinbg:'soin',sauvage:'sauv',burst:'burst',controle:'ctrl',solo:'solo',polyvalence:'poly'};
  for(const [preset,weights] of Object.entries(config.presets)){
    if(preset==='egal') continue;
    assert.equal(weights.tech,0,preset+' ne doit pas pondérer la Technicité');
    if(preset!=='polyvalence') assert.equal(weights.poly,0,preset+' ne doit pas pondérer la Polyvalence');
    const k=headline[preset]; if(!k) continue;
    const total=Object.values(weights).reduce((a,b)=>a+b,0);
    assert.ok(weights[k]===3 && weights[k]/total>=0.5, preset+' : '+k+' doit peser au moins la moitié');
  }
});

test('Burst suit le paramètre PvP et Dégâts de zone le paramètre PvE',()=>{
  const h=boot();
  assert.ok(config.pvpAx.includes('burst')&&!config.pveAx.includes('burst'));
  assert.ok(config.pveAx.includes('zone')&&!config.pvpAx.includes('zone'));
  const mage=config.classes.find(c=>c.id==='mage');
  // Mage : plancher PvP 5, plancher PvE 3, plafonds 2 et 1.
  assert.equal(h.api.eff(mage,'burst',0),3.4);
  assert.equal(h.api.eff(mage,'zone',0),4.2);
  assert.equal(h.api.eff(mage,'burst',3),5);
  assert.equal(h.api.eff(mage,'zone',3),5);
  const voleur=config.classes.find(c=>c.id==='voleur');
  assert.equal(h.api.eff(voleur,'zone',0),1.6);
});

test('Une sauvegarde antérieure à Burst et Dégâts de zone garde son profil et son classement',()=>{
  const added=['burst','zone'];
  const before=w=>Object.fromEntries(config.axes.filter(k=>!added.includes(k)).map(k=>[k,w[k]]));
  for(const preset of Object.keys(config.presets)){
    if(added.some(k=>config.presets[preset][k]>0) && preset!=='egal') continue; // profils créés le 20 octobre
    const h=boot({'wf-overview-v3':JSON.stringify({m:1,w:before(config.presets[preset])})});
    assert.equal(JSON.stringify(h.api.S.w),JSON.stringify(config.presets[preset]),preset);
    assert.equal(h.groups['.presets button[data-preset]'].find(b=>b.dataset.preset===preset).attrs['aria-pressed'],'true',preset);
    assert.equal(h.api.S.m,1);
  }
  // Pondération personnelle : Burst et Dégâts de zone à 0, donc classement inchangé.
  const custom={...before(config.presets.egal),tank:3,tech:0,mob:2};
  const h=boot({'wf-overview-v3':JSON.stringify({w:custom})});
  assert.equal(h.api.S.w.burst,0);
  assert.equal(h.api.S.w.zone,0);
  for(const c of config.classes){
    const keys=Object.keys(custom), total=keys.reduce((a,k)=>a+custom[k],0);
    const expected=100*keys.reduce((a,k)=>a+custom[k]*c.r[k],0)/(5*total);
    assert.ok(Math.abs(h.api.score(c,2)-expected)<1e-9,c.id);
  }
  // Une sauvegarde qui contient déjà les nouveaux critères est reprise telle quelle.
  const zero=boot({'wf-overview-v3':JSON.stringify({w:{...before(config.presets.egal),burst:0,zone:3}})});
  assert.equal(zero.api.S.w.burst,0);
  assert.equal(zero.api.S.w.zone,3);
});

test('« Mes critères » garde la pondération personnelle et la réaffiche en un clic',()=>{
  const h=boot();
  const mine=h.elements.mine;
  const presets=h.groups['.presets button[data-preset]'];
  const preset=id=>presets.find(b=>b.dataset.preset===id).trigger();
  const weight=(ax,v)=>h.groups['.seg button[data-ax]'].find(b=>b.dataset.ax===ax&&b.dataset.v===String(v)).trigger();
  assert.equal(mine.hidden,true);
  h.groups['.mbtn'][1].trigger();
  weight('tank',3); weight('tech',0);
  const custom=JSON.stringify(h.api.S.w);
  assert.equal(mine.hidden,false);
  assert.equal(mine.attrs['aria-pressed'],'true');
  preset('pvp'); preset('zone');
  assert.equal(mine.hidden,false);
  assert.equal(mine.attrs['aria-pressed'],'false');
  mine.trigger();
  assert.equal(JSON.stringify(h.api.S.w),custom);
  assert.equal(mine.attrs['aria-pressed'],'true');
  assert.ok(presets.every(b=>b.attrs['aria-pressed']==='false'));
  assert.equal(h.api.S.m,1,'le niveau de maîtrise ne change pas');
  // Un réglage qui retombe exactement sur un profil ne remplace pas « Mes critères ».
  preset('dps');
  weight('dps',2);
  const latest=JSON.stringify(h.api.S.w);
  weight('dps',3);
  assert.equal(presets.find(b=>b.dataset.preset==='dps').attrs['aria-pressed'],'true');
  mine.trigger();
  assert.equal(JSON.stringify(h.api.S.w),latest);
  // Conservé au rechargement de la page.
  const again=boot(h.storage);
  assert.equal(JSON.stringify(again.api.S.c),latest);
  assert.equal(again.elements.mine.hidden,false);
});

test('« Mes critères » reprend une pondération personnelle déjà enregistrée et ignore une sauvegarde invalide',()=>{
  const custom={...config.presets.egal,tank:3};
  const old=boot({'wf-overview-v3':JSON.stringify({w:custom,m:2})});
  assert.equal(JSON.stringify(old.api.S.c),JSON.stringify(custom));
  assert.equal(old.elements.mine.attrs['aria-pressed'],'true');
  const bad=boot({'wf-overview-v3':JSON.stringify({w:config.presets.pvp,c:{tank:9}})});
  assert.equal(bad.api.S.c,null);
  assert.equal(bad.elements.mine.hidden,true);
  const none=boot({},true);
  assert.equal(none.elements.mine.hidden,true);
});

test('« Tout remettre à 0 » vide les quatorze poids sans toucher à la maîtrise ni à « Mes critères »',()=>{
  const h=boot();
  const reset=h.elements['reset-w'], mine=h.elements.mine;
  const weight=(ax,v)=>h.groups['.seg button[data-ax]'].find(b=>b.dataset.ax===ax&&b.dataset.v===String(v)).trigger();
  assert.match(html,/<div class="wrow wtools">[\s\S]*?id="reset-w"[\s\S]*?Tout remettre à 0<\/button><\/div>\s*<div class="wrow"><span class="wlab">Polyvalence/);
  assert.equal(reset.disabled,false);
  h.groups['.mbtn'][3].trigger();
  weight('tank',3);
  const custom=JSON.stringify(h.api.S.c);
  reset.trigger();
  assert.ok(config.axes.every(k=>h.api.S.w[k]===0));
  assert.equal(h.api.S.m,3,'le niveau de maîtrise ne change pas');
  assert.equal(reset.disabled,true);
  assert.match(h.elements['rank-status'].textContent,/aucun ne départage/);
  assert.deepEqual(ranking(h.elements.rank.innerHTML).map(x=>x[1]),Array(9).fill(0));
  assert.ok(h.groups['.presets button[data-preset]'].every(b=>b.attrs['aria-pressed']==='false'));
  assert.equal(JSON.stringify(h.api.S.c),custom,'la remise à 0 ne remplace pas « Mes critères »');
  assert.equal(mine.attrs['aria-pressed'],'false');
  // Repartir de zéro : le premier réglage devient la nouvelle pondération personnelle.
  weight('soin',3);
  assert.equal(reset.disabled,false);
  assert.equal(h.api.S.w.soin,3);
  assert.equal(h.api.S.w.tank,0);
  assert.equal(JSON.stringify(h.api.S.c),JSON.stringify(h.api.S.w));
  // Un clic sur un profil réactive le bouton.
  reset.trigger();
  h.groups['.presets button[data-preset]'].find(b=>b.dataset.preset==='egal').trigger();
  assert.equal(reset.disabled,false);
});

