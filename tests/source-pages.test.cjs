'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {generate}=require('../scripts/build-source-pages.cjs');
const E=require('../recommendation-engine.js'),render=require('../configuration-details.js');
test('Fiches générées : à jour, liens locaux résolus, notes, faits, variantes et complexité couverts',()=>{
 // Depuis la v11 : neuf classes, l'index et la page de la grille de complexité.
 const pages=generate();assert.equal(Object.keys(pages).length,11);
 const ids=Object.fromEntries(Object.entries(pages).map(([file,html])=>[file,[...html.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1])]));
 for(const [file,html] of Object.entries(pages)){
  assert.equal(fs.readFileSync(path.join(__dirname,'../fiches-sources',file),'utf8'),html,'Régénérer '+file);
  assert.equal(new Set(ids[file]).size,ids[file].length,'Identifiants uniques '+file);
  for(const m of html.matchAll(/href="([^"<>]+)"/g)){
   const href=m[1];if(href.startsWith('https:'))continue;
   const [target,anchor]=href.split('#');
   if(target==='../index.html'){assert.ok(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8').includes('id="'+anchor+'"'));continue;}
   const key=target||file;assert.ok(pages[key],'Page '+key);if(anchor)assert.ok(ids[key].includes(anchor),file+': '+href);
  }
  if(file==='index.html'||file==='complexite.html')continue;
  const c=require('../connaissances/classes/'+file.replace('.html','.json'));
  for(const f of c.faits)assert.ok(ids[file].includes('fait-'+f.id));
  for(const s of c.specialisations){
   for(const key of Object.keys(s.notes))assert.ok(html.includes('data-note="'+s.id+'/'+key+'"'));
   if(s.profil_soin)for(const key of Object.keys(s.profil_soin))assert.ok(html.includes('data-note="'+s.id+'/'+key+'"'));
   // Complexité (v11) : PvE et PvP, chaque composante et sa raison, sous une ancre propre à la spécialisation.
   assert.ok(ids[file].includes(s.id+'-complexite'),s.id);
   for(const k of ['pve','pvp']){
    assert.ok(html.includes('data-complexite="'+s.id+'/'+k+'"'),s.id+'/'+k);
    for(const n of Object.values(s.complexite[k].composantes))assert.ok(html.includes(n.raison.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;')),s.id+'/'+k);
   }
  }
 }
 for(const s of [...E.specs,...Object.values(E.petless)]){
  const links=[...render(s).matchAll(/href="(fiches-sources\/[^"]+)"/g)].map(m=>m[1]);
  assert.equal(links.length,2,s.id+' : les notes et le détail de la complexité');
  for(const link of links){const [file,anchor]=link.replace('fiches-sources/','').split('#');assert.ok(ids[file].includes(anchor),link);}
 }
 // La page de la grille liste les 28 spécialisations, chacune liée à son détail.
 const grille=pages['complexite.html'];
 for(const s of E.specs)assert.ok(grille.includes('data-complexite-ligne="'+s.id+'"'),s.id);
});
