'use strict';
/* Base de connaissances : registre des sources, faits de kit et justification des 336 notes.
 * Elle ne change aucun calcul. Ces tests vérifient qu'elle reste alignée sur le moteur
 * (mêmes configurations, valeurs et version) et cohérente (appuis, limites, écarts). */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../recommendation-engine.js');
const dir=path.join(__dirname,'..','connaissances');
const lire=f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));
const registre=lire('sources.json');
const classes=fs.readdirSync(path.join(dir,'classes')).filter(f=>f.endsWith('.json')).map(f=>lire('classes/'+f));
const ecarts=lire('ecarts.json');
const CRITERES=['raid','bg','world','solo','burst','zone','ctrl','surv','mob','support','charge_pve','charge_pvp'];
// « complexite » (v11) : faits qui fondent le référentiel de complexité (rotations simulées, guides, kit lu dans le client).
const CATEGORIES=new Set(['role','ressource','mobilite','interruption','ralentissement','controle','defense','zone','burst','soin',
 'pvp','soutien','limite','performance','solo','familier','complexite']);
// Catégories de faits qui peuvent fonder une note de style de 4 ou plus.
const REGLES={burst:['burst'],zone:['zone'],ctrl:['controle','interruption','ralentissement'],surv:['defense'],mob:['mobilite'],support:['soutien']};
const valeur=(s,c)=>c.startsWith('charge_')?s.load[c.slice(7)]:(c in s.activity?s.activity[c]:s.style[c]);
const sources=new Map(registre.sources.map(s=>[s.id,s]));
const faits=new Map();
for(const k of classes)for(const f of k.faits)faits.set(f.id,{...f,classe:k.classe});
const applique=(f,id)=>id.startsWith(f.classe+'-')&&(!f.specs||f.specs.includes(id));
const ouvert=e=>e.decision===null;
const enEcart=new Set(ecarts.ecarts.filter(ouvert).map(e=>e.spec+'/'+e.critere));

test('Registre : identifiants uniques, fiabilité et statut renseignés ; une source utilisée est citée, et réciproquement',()=>{
 assert.equal(sources.size,registre.sources.length);
 const citees=new Set([...faits.values()].flatMap(f=>f.sources));
 for(const s of registre.sources){
  assert.ok(['haute','moyenne','faible'].includes(s.fiabilite),s.id);
  assert.match(s.url,/^https:\/\//,s.id);
  assert.ok(s.titre&&s.type&&s.portee&&s.consultee,s.id);
  assert.ok(['utilisee','reperee','ecartee'].includes(s.statut),s.id);
  assert.equal(s.statut==='utilisee',citees.has(s.id),s.id);
  if(s.statut!=='utilisee')assert.ok(s.raison_statut,s.id);
 }
 for(const id of citees)assert.ok(sources.has(id),'Source inconnue : '+id);
});

test('Faits : identifiants uniques, catégorie connue, sources existantes, spécialisations de la bonne classe',()=>{
 assert.equal(faits.size,classes.reduce((n,k)=>n+k.faits.length,0),'Identifiants de faits uniques');
 const ids=new Set(E.specs.map(s=>s.id));
 for(const f of faits.values()){
  assert.ok(CATEGORIES.has(f.categorie),f.id);
  assert.ok(f.texte&&f.sources.length,f.id);
  for(const s of f.specs||[])assert.ok(ids.has(s)&&s.startsWith(f.classe+'-'),f.id+' → '+s);
  assert.equal(f.categorie==='limite',Array.isArray(f.contre),'Une limite déclare les critères qu’elle contredit : '+f.id);
  for(const c of f.contre||[])assert.ok(CRITERES.includes(c),f.id);
 }
});

test('La base couvre exactement les configurations du moteur, avec les mêmes valeurs, le même profil et la même version',()=>{
 assert.deepEqual(classes.map(k=>k.classe).sort(),[...new Set(E.specs.map(s=>s.classId))].sort());
 const base=classes.flatMap(k=>k.specialisations);
 assert.deepEqual(base.map(s=>s.id).sort(),E.specs.map(s=>s.id).sort());
 for(const k of classes)assert.equal(k.moteur,E.version,'Base alignée sur la version du moteur : '+k.classe);
 assert.equal(ecarts.moteur,E.version);
 for(const s of base){
  const m=E.specs.find(x=>x.id===s.id);
  assert.deepEqual([s.profil.role,s.profil.portee,s.profil.familier],[m.role,m.range,m.pet],s.id);
  assert.equal(s.profil.familier!=='none',s.profil.appuis_familier.length>0,s.id+' : familier justifié');
  assert.deepEqual(Object.keys(s.notes).sort(),[...CRITERES].sort(),s.id);
  for(const c of CRITERES)assert.equal(s.notes[c].valeur,valeur(m,c),s.id+'/'+c);
 }
});

test('Chaque note a une raison, des appuis qui concernent sa configuration et un niveau de confiance',()=>{
 for(const k of classes)for(const s of k.specialisations)for(const c of CRITERES){
  const n=s.notes[c],id=s.id+'/'+c;
  assert.ok(n.raison&&n.raison.length>=15,id);
  assert.ok(['haute','moyenne','faible'].includes(n.confiance),id);
  assert.ok(n.appuis.length,id);
  for(const a of n.appuis){
   assert.ok(faits.has(a),id+' : fait inconnu '+a);
   assert.ok(applique(faits.get(a),s.id),id+' : '+a+' ne concerne pas cette configuration');
  }
 }
});

test('Variantes sans familier : alignées sur le moteur, justifiées, et seulement pour un familier facultatif',()=>{
 for(const k of classes)for(const s of k.specialisations){
  const m=E.specs.find(x=>x.id===s.id),v=s.variante_sans_familier;
  assert.equal(!!v,m.pet==='optional',s.id+' : variante si et seulement si le familier est facultatif');
  if(!v)continue;
  const engine=E.petless[s.id];
  assert.ok(engine,s.id);
  const diff=CRITERES.filter(c=>valeur(engine,c)!==valeur(m,c));
  assert.deepEqual(Object.keys(v.notes).sort(),diff.sort(),s.id+' : notes qui changent sans familier');
  for(const [c,n] of Object.entries(v.notes)){
   assert.equal(n.valeur,valeur(engine,c),s.id+'/'+c);
   assert.ok(n.raison&&n.raison.length>=15&&['haute','moyenne','faible'].includes(n.confiance),s.id+'/'+c);
   for(const a of n.appuis)assert.ok(faits.has(a)&&applique(faits.get(a),s.id),s.id+'/'+c+' : '+a);
  }
  assert.ok(v.synthese&&v.appuis.length&&v.appuis.every(a=>faits.has(a)&&applique(faits.get(a),s.id)),s.id);
 }
});

test('Façon de soigner : un profil justifié pour chaque configuration de soin, identique au moteur',()=>{
 const STYLES=['prevention','duree','cible','groupe'];
 assert.deepEqual([...E.healStyles],STYLES);
 for(const k of classes)for(const s of k.specialisations){
  const m=E.specs.find(x=>x.id===s.id);
  assert.equal(!!s.profil_soin,m.role==='soin',s.id+' : profil de soin si et seulement si la configuration soigne');
  if(!s.profil_soin)continue;
  assert.deepEqual(Object.keys(s.profil_soin).sort(),[...STYLES].sort(),s.id);
  for(const h of STYLES){
   const n=s.profil_soin[h],id=s.id+'/'+h;
   assert.equal(n.valeur,m.heal[h],id);
   assert.ok(n.raison&&n.raison.length>=15&&['haute','moyenne','faible'].includes(n.confiance),id);
   assert.ok(n.appuis.length&&n.appuis.every(a=>faits.has(a)&&applique(faits.get(a),s.id)),id);
   if(n.valeur>=4)assert.ok(n.appuis.some(a=>faits.get(a).categorie==='soin'),id+' : une note de 4 ou plus s’appuie sur un fait de soin');
  }
 }
});

test('Règles : une note de style à 4 ou plus s’appuie sur un fait de son domaine et cite les limites qui pèsent contre elle',()=>{
 for(const k of classes)for(const s of k.specialisations)for(const c of CRITERES){
  const n=s.notes[c],id=s.id+'/'+c;
  if(n.valeur<4||enEcart.has(id))continue;
  if(REGLES[c])assert.ok(n.appuis.some(a=>REGLES[c].includes(faits.get(a).categorie)),id+' sans fait de son domaine');
  for(const f of faits.values())if(f.contre&&f.contre.includes(c)&&applique(f,s.id))
   assert.ok(n.appuis.includes(f.id),id+' doit citer la limite '+f.id);
 }
});

test('Écarts : valeur actuelle exacte tant qu’ils sont ouverts, décision tracée ensuite, synthèse lisible à jour',()=>{
 const notes=new Map(classes.flatMap(k=>k.specialisations).map(s=>[s.id,s.notes]));
 const md=fs.readFileSync(path.join(dir,'ecarts-a-arbitrer.md'),'utf8');
 assert.equal(new Set(ecarts.ecarts.map(e=>e.id)).size,ecarts.ecarts.length);
 for(const e of ecarts.ecarts){
  const m=E.specs.find(s=>s.id===e.spec);
  assert.ok(m&&CRITERES.includes(e.critere),e.id);
  assert.notEqual(e.proposition,e.valeur,e.id);
  assert.ok(['haute','moyenne','basse'].includes(e.priorite),e.id);
  for(const a of e.appuis)assert.ok(faits.has(a),e.id+' : '+a);
  assert.match(md,new RegExp('\\| '+e.id+' \\|'),e.id+' absent de la synthèse');
  if(ouvert(e)){
   assert.equal(e.valeur,valeur(m,e.critere),e.id+' : valeur actuelle du moteur');
   assert.equal(notes.get(e.spec)[e.critere].confiance,'faible',e.id);
  }else{
   assert.ok(['garder','changer'].includes(e.decision.choix)&&e.decision.date,e.id);
   assert.equal(valeur(m,e.critere),e.decision.choix==='garder'?e.valeur:e.decision.valeur,e.id+' : décision appliquée au moteur');
  }
 }
});
