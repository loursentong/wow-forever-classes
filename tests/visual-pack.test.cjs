'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','warcraft-visual-pack.css'),'utf8');
const questionnaire=fs.readFileSync(path.join(__dirname,'..','questionnaire.js'),'utf8');
const priority=fs.readFileSync(path.join(__dirname,'..','priorities-ui.js'),'utf8');
const refonte=fs.readFileSync(path.join(__dirname,'..','refonte-forever.css'),'utf8');
const ids=['guerrier','paladin','chasseur','voleur','pretre','chaman','mage','demoniste','druide'];
test('Les neuf classes pointent vers des icônes originales validées chez Blizzard',()=>{
 assert.equal((html.match(/class="wow-card-class-icon"/g)||[]).length,9);
 for(const id of ids){
  assert.match(html,new RegExp('href="#c-'+id+'"'));
  assert.match(html,new RegExp('id="c-'+id+'"'));
 }
 const links=[...html.matchAll(/<img[^>]+src="(https:\/\/render\.worldofwarcraft\.com\/us\/icons\/56\/classicon_[a-z]+\.jpg)"/g)];
 assert.equal(links.length,18,'9 icônes d’index + 9 icônes de fiche');
 assert.equal(new Set(links.map(x=>x[1])).size,9);
 assert.match(questionnaire,/function wowClassIcon/);
 assert.match(priority,/var wowClassIcons/);
});
test('Le bandeau reprend le logo officiel et un décor du kit de presse, hébergés avec le site',()=>{
 // Refonte du 21 octobre 2026 : logo et décors viennent du kit de presse officiel (assets/README.md).
 assert.match(html,/<img class="wow-hero-logo" src="assets\/img\/logo-wow-forever\.webp"/);
 assert.match(html,/Outil de fan · non officiel/);
 assert.match(refonte,/url\("assets\/img\/hero-arbre-monde\.webp"\)/);
 for(const f of ['logo-wow-forever.webp','hero-arbre-monde.webp','hero-vallee-nuit.webp','bandeau-gantelet.webp','bandeau-darkspear.webp','grain.png'])
  assert.ok(fs.statSync(path.join(__dirname,'..','assets','img',f)).size>1000,f);
 assert.match(html,/warcraft-visual-pack\.css/);
 assert.ok(html.indexOf('href="refonte-forever.css"')>html.indexOf('href="wow-ui-rework.css"'),'La refonte doit être la dernière feuille de style');
});
test('Un bandeau commun aux deux parcours, sans décalage au changement',()=>{
 assert.equal((html.match(/class="rf-band"/g)||[]).length,1);
 assert.match(html,/<div class="rf-band-copy rf-band-copy-guide">\s*<p class="rf-band-kicker">Parcours 1<\/p>\s*<h3 class="rf-band-title">Être guidé<\/h3>/);
 assert.match(html,/<div class="rf-band-copy rf-band-copy-priorites">\s*<p class="rf-band-kicker">Parcours 2<\/p>\s*<h3 class="rf-band-title">Mode personnalisé<\/h3>/);
 assert.ok(html.indexOf('class="rf-band"')<html.indexOf('id="reco-guided"'),'Le bandeau précède les deux panneaux');
 // Les deux textes occupent la même cellule : la hauteur ne dépend pas du parcours affiché.
 assert.match(refonte,/\.rf-band-copy\{grid-area:1\/1/);
 assert.match(refonte,/#reco-app:has\(#reco-priorities:not\(\[hidden\]\)\) \.rf-band-copy-priorites\{visibility:visible\}/);
 assert.match(refonte,/url\("assets\/img\/hero-vallee-nuit\.webp"\)/);
 assert.match(refonte,/url\("assets\/img\/bandeau-gantelet\.webp"\)/);
});
test('Un seul thème, sombre : aucune feuille de style ne garde de variante claire ou système',()=>{
 // Thème clair retiré le 21 octobre 2026 : la page est toujours sombre, sans choix d'apparence.
 assert.match(html,/<html lang="fr" data-theme="dark">/);
 assert.match(html,/:root\{\r?\n  color-scheme:dark;/);
 assert.match(html,/<meta name="theme-color" content="#0A1725">/);
 for(const f of ['index.html','ux-polish.css','warcraft-visual-pack.css','wow-ui-rework.css','refonte-forever.css']){
  const src=fs.readFileSync(path.join(__dirname,'..',f),'utf8');
  assert.ok(!/data-theme="(light|system)"|prefers-color-scheme|theme-choice|wf-overview-theme/.test(src),f);
 }
});
test('La refonte reste une couche de présentation accessible',()=>{
 assert.match(refonte,/prefers-reduced-motion:reduce/);
 assert.match(refonte,/:focus-visible\{outline:2px solid/);
 assert.ok(!/script|expression\s*\(/i.test(refonte));
});
test('Le guide emploie des pictogrammes de véritables compétences, pas des substituts SVG inventés',()=>{
 for(const icon of ['inv_sword_04','inv_shield_05','spell_holy_greaterheal',
  'spell_fire_fireball02','spell_frost_frostnova','ability_rogue_sprint',
  'ability_hunter_beastcall','spell_holy_powerwordshield'])
   assert.ok(questionnaire.includes(icon),icon);
 assert.match(questionnaire,/class="reco-option-art"/);
});
test('La propriété intellectuelle et l’absence d’affiliation sont visibles, avec source officielle',()=>{
 assert.match(html,/non officiel et non affilié à Blizzard Entertainment/);
 assert.match(html,/blizzard\.gamespress\.com\/fr\/wowforeverreveal/);
 assert.match(html,/© 2026/);
});
test('La palette, les focus visibles et les animations réduites sont conservés',()=>{
 assert.match(css,/--wow-gold:#eac061/);
 assert.match(css,/\.reco-option:focus-visible/);
 assert.match(css,/prefers-reduced-motion:reduce/);
 assert.match(css,/\.wow-class-index/);
 assert.ok(!/script|expression\s*\(/i.test(css));
});
