'use strict';
/* Tableau des notes (23 octobre 2026) : chaque ligne de classe déroule ses spécialisations. Les notes viennent du
 * moteur (WFRecommend.specs), sans calcul ; la ligne de la classe et ses 126 notes historiques ne changent pas. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../recommendation-engine.js');
const S=require('../notes-specialisations.js');
const root=path.join(__dirname,'..');
const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const matrix=html.match(/<table class="matrix">[\s\S]*?<\/table>/)[0];
const classRows=[...matrix.matchAll(/<tr><th scope="row" class="sticky"><a href="#c-([a-z]+)">[\s\S]*?<\/tr>/g)];
const axesOf=row=>[...row.matchAll(/data-k="([a-z]+)"/g)].map(m=>m[1]);
const cells=(s,axes)=>[...S.rowHtml(s,axes,0,false,'').matchAll(/<td[^>]*data-k="([a-z]+)"[^>]*>([\s\S]*?)<\/td>/g)]
 .map(m=>m[1]==='tech'?m[0].match(/data-pve="(\d)" data-pvp="(\d)"/).slice(1).join('·'):(m[0].match(/data-v="(\d)"/)||[,'—'])[1]);

test('Chaque classe du tableau déroule toutes ses spécialisations, dans l’ordre du moteur',()=>{
 assert.equal(classRows.length,9);
 const listed=classRows.flatMap(m=>S.specsOf(m[1]).map(s=>s.id));
 assert.deepEqual(listed,E.specs.map(s=>s.id),'28 configurations, chacune une fois');
 assert.deepEqual(classRows.map(m=>S.specsOf(m[1]).length),[3,3,3,3,3,3,3,3,4],'le Druide a deux configurations Farouche');
});

test('Chaque colonne reçoit la note de la spécialisation correspondant au critère de la classe',()=>{
 const axes=axesOf(classRows[0][0]);
 assert.deepEqual(axes,['poly','tank','soin','dps','bg','sauv','burst','zone','ctrl','surv','mob','util','solo','tech']);
 for(const m of classRows)assert.deepEqual(axesOf(m[0]),axes,'mêmes colonnes pour '+m[1]);
 const spec=id=>E.specs.find(s=>s.id===id);
 // Rôle : la note « Donjons et raids » dans la colonne de son rôle ; Polyvalence : critère de classe ;
 // PvP sauvage → Sauvage et duel, Soutien → Utilité ; technicité : complexité PvE · PvP.
 assert.deepEqual(cells(spec('guerrier-armes'),axes),['—','—','—','3','4','3','5','4','3','3','4','2','2','4·4']);
 assert.deepEqual(cells(spec('guerrier-protection'),axes),['—','5','—','—','4','2','2','3','3','5','3','3','3','4·4']);
 assert.deepEqual(cells(spec('druide-restauration'),axes),['—','—','5','—','5','4','2','2','3','4','5','5','3','3·4']);
 for(const s of E.specs){
  const c=cells(s,axes),at=k=>c[axes.indexOf(k)];
  assert.equal(at(s.role),String(s.activity.raid),s.id+' : son rôle');
  for(const r of ['tank','soin','dps'].filter(r=>r!==s.role))assert.equal(at(r),'—',s.id+' : hors rôle');
  assert.equal(at('bg'),String(s.activity.bg));assert.equal(at('sauv'),String(s.activity.world));assert.equal(at('solo'),String(s.activity.solo));
  for(const k of ['burst','zone','ctrl','surv','mob'])assert.equal(at(k),String(s.style[k]),s.id+'/'+k);
  assert.equal(at('util'),String(s.style.support));
  assert.equal(at('tech'),s.load.pve+'·'+s.load.pvp);
  assert.ok(!S.rowHtml(s,axes,0,false,'').includes('Pas de note'),s.id+' : aucune colonne inconnue');
 }
});

test('Précision : son build de référence, Loup solitaire, sans familier',()=>{
 const s=E.specs.find(x=>x.id==='chasseur-precision');
 assert.equal(E.referenceVariants[s.id],'sans-familier');
 for(const k of ['activity','style','load'])assert.deepEqual(s[k],E.petless[s.id][k],k);
 assert.match(S.rowHtml(s,['tech'],0,false,''),/<small class="spec-variant" title="Évaluée en Loup solitaire, sans familier">Loup solitaire<\/small>/);
 assert.equal(S.variant(E.specs.find(x=>x.id==='chasseur-survie')),'');
});

test('Lignes accessibles : repliées, en-tête de ligne, lien vers la fiche de sources existante',()=>{
 for(const s of E.specs){
  const row=S.rowHtml(s,['poly','tech'],1,true,'#AAD372');
  assert.match(row,new RegExp('^<tr class="spec-row spec-last" id="spec-'+s.id+'" data-spec="'+s.id+'" style="--i:1;--cc:#AAD372" hidden><th scope="row" class="sticky spec-name">'));
  const href='fiches-sources/'+s.classId+'.html#'+s.id;
  assert.ok(row.includes('<a href="'+href+'"'),s.id);
  assert.ok(!/class="cell\b/.test(row),'les 126 notes historiques gardent seules la classe « cell »');
  assert.ok(fs.readFileSync(path.join(root,'fiches-sources',s.classId+'.html'),'utf8').includes('id="'+s.id+'"'),'ancre '+href);
  // Les cases sans objet et la technicité se lisent aussi sans la vue.
  assert.match(row,/<span aria-hidden="true">—<\/span><span class="spec-sr">critère de classe<\/span>/);
  assert.match(row,new RegExp('<span class="spec-sr">PvE </span>'+s.load.pve+'</b>.*<span class="spec-sr">PvP </span>'+s.load.pvp+'</b>'));
 }
});

test('Page : notes historiques intactes, script chargé après le moteur, texte et réglages d’affichage',()=>{
 const D=JSON.parse(html.match(/window\.__WF = (\{.*?\});\s*<\/script>/s)[1]);
 for(const [i,m] of classRows.entries())
  assert.deepEqual([...m[0].matchAll(/data-k="([a-z]+)" data-v="(\d)"/g)].map(x=>[x[1],Number(x[2])]),D.axes.map(k=>[k,D.classes[i].r[k]]),m[1]);
 const scripts=[...html.matchAll(/<script src="([^"]+)"/g)].map(m=>m[1]);
 assert.ok(scripts.indexOf('notes-specialisations.js')===scripts.indexOf('recommendation-engine.js')+1,scripts.join(', '));
 assert.match(html,/Clique sur la ligne d'une classe pour dérouler les notes de ses spés, sur son nom pour sa fiche/);
 assert.match(html,/<p class="note spec-note">Les lignes de spé reprennent les notes du moteur de recommandation/);
 assert.match(html,/href="fiches-sources\/complexite\.html">le référentiel de complexité<\/a>/);
 // Animation de déroulement seulement sans préférence de mouvement réduit ; colonne de noms stable à l'ouverture.
 assert.match(html,/@media \(prefers-reduced-motion:no-preference\)\{\.matrix tr\.spec-row>\*\{animation:spec-in/);
 assert.match(html,/\.matrix\[data-specs\] \.sticky\{width:13em\}/);
});
