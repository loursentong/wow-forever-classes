'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const css=fs.readFileSync(path.join(__dirname,'..','warcraft-visual-pack.css'),'utf8');
const questionnaire=fs.readFileSync(path.join(__dirname,'..','questionnaire.js'),'utf8');
const priority=fs.readFileSync(path.join(__dirname,'..','priorities-ui.js'),'utf8');
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
test('Le bandeau reprend un vrai logo Forever et un paysage WoW hébergés par Blizzard',()=>{
 assert.match(html,/bnetcmsus-a\.akamaihd\.net\/cms\/gallery\/j3\/J3RLTCKOODJ51789169243964\.png/);
 assert.match(css,/bnetcmsus-a\.akamaihd\.net\/cms\/blog_header\/to\/TO55V6TRR1RW1790054798721\.png/);
 assert.match(html,/warcraft-visual-pack\.css/);
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
