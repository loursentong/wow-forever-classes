'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {generate}=require('../scripts/build-source-pages.cjs');
const E=require('../recommendation-engine.js'),render=require('../configuration-details.js');
test('Fiches générées : à jour, liens locaux résolus, notes, faits et variantes couverts',()=>{
 const pages=generate();assert.equal(Object.keys(pages).length,10);
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
  if(file==='index.html')continue;
  const c=require('../connaissances/classes/'+file.replace('.html','.json'));
  for(const f of c.faits)assert.ok(ids[file].includes('fait-'+f.id));
  for(const s of c.specialisations){
   for(const key of Object.keys(s.notes))assert.ok(html.includes('data-note="'+s.id+'/'+key+'"'));
   if(s.profil_soin)for(const key of Object.keys(s.profil_soin))assert.ok(html.includes('data-note="'+s.id+'/'+key+'"'));
  }
 }
 for(const s of [...E.specs,...Object.values(E.petless)]){
  const link=/href="(fiches-sources\/[^"]+)"/.exec(render(s))[1];
  const [file,anchor]=link.replace('fiches-sources/','').split('#');assert.ok(ids[file].includes(anchor),link);
 }
});
