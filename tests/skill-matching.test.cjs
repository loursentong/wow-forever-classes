'use strict';
/* Données historiques de la page et état du mode personnalisé.
 * Le comparatif historique (tableau de bord, courbes de maîtrise) a été retiré de la page le
 * 21 octobre 2026 : dépassé, il pouvait induire en erreur. Ses données restent dans window.__WF
 * (126 notes, 14 axes, 15 profils) et le mode personnalisé garde son propre état, sauvegardé dans
 * wf-overview-v3 avec le même schéma ; les anciennes sauvegardes sont reprises. */
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const E = require('../recommendation-engine.js');
const X = require('../result-explanations.js');

const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8').replace(/\r\n/g, '\n');
// Référence active : la v13 reprend, pour chaque classe, la meilleure de ses spécialisations (27 notes depuis la v2).
const referenceNotes = Object.fromEntries(require('./fixtures/moteur-reference-v13.json').matrix.classes.map(c=>[c.id,c.r]));
const match = html.match(/window\.__WF = (\{.*?\});\s*<\/script>/s);
assert.ok(match, 'données historiques présentes');
const config = JSON.parse(match[1]);
const ui = fs.readFileSync(path.join(__dirname, '..', 'priorities-ui.js'), 'utf8');

test('Les données historiques gardent neuf classes, quatorze axes, quatre niveaux et quinze profils',()=>{
  assert.equal(config.classes.length,9);
  assert.equal(config.axes.length,14);
  assert.deepEqual(Object.keys(config.presets),['egal','polyvalence','pve','pvp','tank','soin','dps','zone','soutien','bg','soinbg','sauvage','burst','controle','solo']);
  assert.equal(config.levels.length,4);
  assert.equal((html.match(/<span class="tag you">Pour toi<\/span>/g)||[]).length,0);
  assert.equal((html.match(/<span class="tag you">Style de jeu<\/span>/g)||[]).length,9);
  assert.ok(!/Ton profil|Spiritualiste d'Aion|tu l'as écarté|Tu te décris/i.test(html));
});

test('Les 126 notes source et les 126 cases du tableau restent identiques à la référence',()=>{
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

test('Thème sombre unique et comparatif historique retiré, méthode de maîtrise placée avant les sources',()=>{
  assert.match(html,/^<!doctype html>\n<html lang="fr" data-theme="dark">\n/);
  assert.ok(!/wf-overview-theme|data-theme-init|theme-choice|id="theme"|prefers-color-scheme/.test(html));
  assert.ok(!/id="rank"|id="curves"|class="mbtn"|data-preset=/.test(html),'plus aucun contrôle du comparatif historique');
  const order=['h-reco','h-matrix','h-cards','h-rules','h-model','h-src'].map(id=>html.indexOf('id="'+id+'"'));
  assert.ok(order.every((v,i)=>v>0&&(i===0||v>order[i-1])),'ordre des sections : '+order);
  // La méthode décrit le modèle du moteur (difficulté d'exécution), plus l'ancien plancher/plafond.
  const model=html.slice(order[4],order[5]);
  assert.match(model,/0,29 point par point de difficulté/);
  assert.doesNotMatch(model,/plancher|plafond PvE/);
});

/* Harnais du mode personnalisé : priorities-ui.js tourne seul, avec le moteur et ses données. */
function boot(storage={},guide){
  const store={...storage},calls=[];
  const localStorage={getItem:k=>Object.hasOwn(store,k)?store[k]:null,setItem:(k,v)=>{store[k]=String(v);}};
  const el=id=>({id,hidden:false,innerHTML:'',dataset:{},attrs:{},listeners:{},tabIndex:-1,
    setAttribute(n,v){this.attrs[n]=String(v);},getAttribute(n){return this.attrs[n];},removeAttribute(n){delete this.attrs[n];},
    hasAttribute(n){return Object.hasOwn(this.attrs,n);},addEventListener(t,f){(this.listeners[t]||=[]).push(f);},
    contains(){return true;},closest(){return this;},scrollIntoView(){calls.push('scroll');}});
  const tabs=['guided','priorities'].map(m=>{const b=el('tab-'+m);b.dataset.recoMode=m;return b;});
  const guided=el('reco-guided'),priority=el('reco-priorities'),form=el('reco-priority-form'),output=el('reco-priority-results'),bar=el('modes');
  const classes=new Set(['reco-panel']);
  const root={classList:{contains:c=>classes.has(c),remove:c=>classes.delete(c),add:c=>classes.add(c)},
    querySelectorAll:s=>s==='[data-reco-mode]'?tabs:[],
    querySelector:s=>({'#reco-guided':guided,'#reco-priorities':priority,'#reco-priority-form':form,'#reco-priority-results':output,'.reco-modes':bar})[s]||null};
  const window={WFRecommend:E,__WF:config,WFResultExplanations:X,WFConfigurationDetails:require('../configuration-details.js'),
    WFGuide:guide,matchMedia:()=>({matches:true})};
  vm.runInNewContext(ui,{window,document:{getElementById:id=>id==='reco-app'?root:null},localStorage},{timeout:3000});
  const press=(dataset,attrs=[])=>form.listeners.click[0]({target:{dataset,hasAttribute:k=>attrs.includes(k),closest(){return this;}}});
  return {store,tabs,guided,priority,form,output,classes,window,calls,press,
    choose(m){tabs.find(t=>t.dataset.recoMode===m).listeners.click[0]();},
    saved(){return JSON.parse(store['wf-overview-v3']||'null');},
    pressed(axis){const m=form.innerHTML.match(new RegExp('data-prio-axis="'+axis+'" data-prio-weight="(\\d)" aria-pressed="true"'));return m&&Number(m[1]);}};
}

test('Arrivée : aucun parcours ouvert, le dernier parcours utilisé est signalé, le choix ouvre son panneau',()=>{
  const h=boot({'wf-reco-mode-v1':'priorities'});
  assert.ok(h.classes.has('is-choosing'));
  assert.equal(h.guided.hidden,true);assert.equal(h.priority.hidden,true);
  assert.deepEqual(h.tabs.map(t=>t.attrs['aria-selected']),['false','false']);
  assert.deepEqual(h.tabs.map(t=>t.attrs['data-last']),[undefined,'true']);
  h.choose('guided');
  assert.ok(!h.classes.has('is-choosing'));
  assert.equal(h.guided.hidden,false);assert.equal(h.priority.hidden,true);
  assert.equal(h.store['wf-reco-mode-v1'],'guided');
  assert.deepEqual(h.calls,['scroll'],'le parcours choisi reste en vue');
  h.choose('priorities');
  assert.equal(h.priority.hidden,false);assert.equal(h.guided.hidden,true);
  assert.deepEqual(h.calls,['scroll'],'changer ensuite d’onglet ne fait pas défiler');
  assert.match(h.output.innerHTML,/Les spécialisations selon tes critères/);
});

test('Profils, poids, maîtrise partagée et remise à zéro : l’état est sauvegardé, la maîtrise suit le guide',()=>{
  const levels=[];
  const h=boot({},{getMastery:()=>1,setMastery:m=>levels.push(m)});
  h.choose('priorities');
  assert.equal(h.pressed('ctrl'),config.presets.egal.ctrl,'profil de départ : Tous les critères');
  assert.equal(h.saved(),null,'rien n’est écrit sans action');
  h.press({prioPreset:'solo'});
  assert.deepEqual(h.saved().w,E.sanitizeWeights(config.presets.solo));
  assert.equal(h.saved().m,1,'sans maîtrise sauvegardée ici, celle du parcours guidé est reprise');
  // Une maîtrise sauvegardée ici n'est pas écrasée par celle du parcours guidé.
  const own=boot({'wf-overview-v3':JSON.stringify({w:config.presets.pvp,m:0})},{getMastery:()=>3,setMastery(){}});
  own.choose('priorities');
  assert.match(own.form.innerHTML,/data-prio-mastery="0" aria-pressed="true"/);
  assert.equal(own.saved().m,0);
  h.press({prioAxis:'ctrl',prioWeight:'3'});
  assert.equal(h.saved().w.ctrl,3);assert.equal(h.pressed('ctrl'),3);
  h.press({prioMastery:'0'});
  assert.equal(h.saved().m,0);assert.deepEqual(levels,[0]);
  h.window.WFPriorities.setMastery(3);
  assert.equal(h.saved().m,3);assert.deepEqual(levels,[0],'une maîtrise venue du guide ne lui est pas renvoyée');
  h.press({},['data-prio-clear']);
  assert.ok(Object.values(h.saved().w).every(v=>v===0));
  assert.match(h.output.innerHTML,/Aucune priorité définie/);
});

test('Sauvegardes : reprise, anciennes clés, critères apparus le 20 octobre, sauvegarde invalide ou absente',()=>{
  const before=w=>Object.fromEntries(config.axes.filter(k=>!['burst','zone'].includes(k)).map(k=>[k,w[k]]));
  // Reprise exacte, champs hérités conservés.
  const h=boot({'wf-overview-v3':JSON.stringify({w:config.presets.pvp,m:1,hl:['mage'],c:config.presets.pvp})});
  h.choose('priorities');h.press({prioAxis:'tank',prioWeight:'2'});
  assert.equal(h.saved().m,1);assert.deepEqual(h.saved().hl,['mage']);assert.deepEqual(h.saved().c,config.presets.pvp);
  // Avant Burst et Dégâts de zone : 0, sauf si tous les critères avaient le même poids.
  for(const [preset,expected] of [['egal',config.presets.egal.burst],['tank',0]]){
    const old=boot({'wf-overview-v3':JSON.stringify({m:2,w:before(config.presets[preset])})});old.choose('priorities');
    assert.equal(old.pressed('burst'),expected,preset);assert.equal(old.pressed('zone'),expected,preset);
  }
  // Anciennes clés : wf-overview-v2, puis poids et niveau séparés.
  const v2=boot({'wf-overview-v2':JSON.stringify({w:config.presets.solo,m:0})});v2.choose('priorities');
  assert.equal(v2.pressed('solo'),config.presets.solo.solo);
  const split=boot({'wf-overview-weights':JSON.stringify(config.presets.controle),'wf-overview-skill':'expert'});split.choose('priorities');
  assert.equal(split.pressed('ctrl'),config.presets.controle.ctrl);
  assert.match(split.form.innerHTML,/data-prio-mastery="3" aria-pressed="true"/);
  // Sauvegarde illisible : profil de référence, maîtrise Confirmé, aucune erreur.
  const broken=boot({'wf-overview-v3':'{broken'});broken.choose('priorities');
  assert.equal(broken.pressed('ctrl'),config.presets.egal.ctrl);
  assert.match(broken.form.innerHTML,/data-prio-mastery="2" aria-pressed="true"/);
  // Une pondération personnelle d'avant « Mes critères » devient une sauvegarde reprenable.
  const custom={...config.presets.egal,tank:3,mob:0};
  const mine=boot({'wf-overview-v3':JSON.stringify({w:custom,m:2})});mine.choose('priorities');
  assert.match(mine.form.innerHTML,/data-prio-restore/);
});

test('Pourquoi cette place : chaque spécialisation explique son score, les points font le score affiché',()=>{
  const h=boot();h.choose('priorities');h.press({prioPreset:'pvp'});
  // Dix spécialisations visibles, puis les 18 autres sur demande (v10).
  assert.equal(h.output.innerHTML.split('<li class="reco-priority-class').length-1,10);
  assert.match(h.output.innerHTML,/data-prio-more aria-expanded="false">Voir les 18 autres spécialisations</);
  h.output.listeners.click[0]({target:{closest:s=>s==='[data-prio-more]'?{}:null}});
  const rows=h.output.innerHTML.split('<li class="reco-priority-class').slice(1);
  assert.equal(rows.length,28);
  for(const row of rows){
    assert.match(row,/<summary>Pourquoi cette place<\/summary>/);
    const score=Number(row.match(/<span class="reco-priority-score">(\d+)/)[1]);
    const points=[...row.matchAll(/<td>(\d+) \/ (\d+)<\/td>/g)];
    assert.equal(points.reduce((t,m)=>t+Number(m[1]),0),score);
    assert.equal(points.reduce((t,m)=>t+Number(m[2]),0),100);
    assert.match(row,/<summary>Voir le détail du calcul<\/summary>/);
    assert.match(row,/reco-friendly-groups/);
    assert.match(row,/href="fiches-sources\/[a-z]+\.html#[a-z-]+"/);
  }
});

test('v14 : anciens critères personnels conservés ; Donjons et raids se sauvegarde et se restaure',()=>{
 const legacy={...config.presets.pvp,dps:3},stored=JSON.stringify({weights:legacy,mastery:1});
 const h=boot({'wf-overview-v3':JSON.stringify({w:legacy,m:1,hl:['mage']}),'wf-priority-custom-v1':stored});
 h.choose('priorities');assert.equal(h.pressed('raid'),0);assert.equal(h.pressed('dps'),3);
 assert.equal(h.store['wf-priority-custom-v1'],stored,'lecture de l’ancien format sans écrasement');
 h.press({prioAxis:'raid',prioWeight:'2'});h.press({},['data-prio-save']);
 const custom=JSON.parse(h.store['wf-priority-custom-v1']);assert.equal(custom.weights.raid,2);assert.equal(custom.mastery,1);
 h.press({prioPreset:'pvp'});assert.equal(h.pressed('raid'),0);
 h.press({},['data-prio-restore']);assert.equal(h.pressed('raid'),2);assert.deepEqual(h.saved().hl,['mage']);
 const restored=boot(h.store);restored.choose('priorities');assert.equal(restored.pressed('raid'),2);assert.equal(restored.pressed('dps'),3);
});
