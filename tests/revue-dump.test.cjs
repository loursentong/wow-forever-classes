'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),os=require('node:os');
const kit=require('../skills/frv-dump-update/scripts/revue-dump.cjs'),repo=path.resolve(__dirname,'..');
function workspace(t){
 const temp=fs.mkdtempSync(path.join(os.tmpdir(),'frv-revue-dump-'));
 t.after(()=>{assert.ok(path.resolve(temp).startsWith(path.resolve(os.tmpdir())+path.sep+'frv-revue-dump-'));fs.rmSync(temp,{recursive:true,force:true});});
 return temp;
}
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const write=(p,data)=>fs.writeFileSync(p,JSON.stringify(data,null,2)+'\n','utf8');
function candidate(folder,overrides={}){
 const plan=read(path.join(folder,'propositions.json'));
 plan.contexte.patch='Contexte de test, aucune donnée appliquée';
 plan.changements=[{id:'mage-feu/reference/note/raid',actuelle:4,proposee:5,raison:'Cas de validation du dossier, sans changer le dépôt.',confiance:'moyenne',preuves:[{url:'https://example.org/source-de-test',titre:'Appui fictif de test',nature:'guide',groupe:'auteur-test',consultee:'2026-10-25',contexte:'Test de structure uniquement, niveau 60 et équipement non mesurés',constat:'Appui fictif, sans valeur factuelle.'}],...overrides}];
 write(path.join(folder,'propositions.json'),plan);return plan;
}
function session(t){const folder=path.join(workspace(t),'revue');kit.prepare(repo,folder);return folder;}

test('Le kit inventorie les notes réelles, les variantes, les profils de soin et les valeurs dérivées',()=>{
 const s=kit.collect(repo);
 assert.deepEqual(s.statistiques,{configurations:28,notesSpecialisees:336,variantes:4,notesVariantes:48,composantes:320,profilsSoin:20,matrice:126});
 assert.equal(new Set(s.entrees.map(e=>e.id)).size,s.entrees.length);
 assert.ok(s.entrees.find(e=>e.id==='mage-feu/reference/note/charge_pve').derivee);
 assert.equal(s.entrees.find(e=>e.id==='mage-feu/reference/composante/pve.rotation').maximum,2);
 assert.ok(s.entrees.find(e=>e.id==='chasseur-precision/sans-familier/note/raid').heritee);
});
test('Une préparation est non destructive, lisible par classe et n’écrase jamais une revue',t=>{
 const before=kit.collect(repo).empreinte,folder=session(t);
 assert.equal(fs.readdirSync(path.join(folder,'classes')).length,9);
 assert.ok(read(path.join(folder,'classes','guerrier.json')).sources.length);
 assert.equal(kit.verify(repo,folder).valide,true);
 assert.deepEqual(read(path.join(folder,'propositions.json')).changements,[]);
 const snapshot=fs.readFileSync(path.join(folder,'etat-initial.json'),'utf8');
 assert.throws(()=>kit.prepare(repo,folder),/existe déjà/);
 assert.equal(fs.readFileSync(path.join(folder,'etat-initial.json'),'utf8'),snapshot);
 assert.equal(kit.collect(repo).empreinte,before);
});
test('Les références sources et les métadonnées Git ne servent pas de sortie',t=>{
 const temp=workspace(t);fs.mkdirSync(path.join(temp,'sources'));
 assert.throws(()=>kit.prepare(repo,path.join(temp,'sources','revue')),/Sortie refusée/);
});
test('Vérifier une proposition ne l’applique pas au moteur ni à sa documentation',t=>{
 const before=kit.collect(repo).empreinte,folder=session(t);candidate(folder);
 const r=kit.verify(repo,folder);assert.equal(r.valide,true);assert.equal(r.changements,1);
 assert.equal(kit.collect(repo).empreinte,before);
});
test('Les propositions hors échelle, dérivées, dupliquées ou fondées sur une ancienne valeur sont refusées',t=>{
 const folder=session(t);
 for(const [change,code] of [[{proposee:6},'plage'],[{actuelle:1},'valeur-actuelle'],[{id:'absent'},'entree-inconnue'],[{id:'mage-feu/reference/note/charge_pve',actuelle:2},'valeur-derivee']]){
  candidate(folder,change);assert.ok(kit.verify(repo,folder).erreurs.some(e=>e.code===code),code);
 }
 const p=candidate(folder);p.changements.push(p.changements[0]);write(path.join(folder,'propositions.json'),p);
 assert.ok(kit.verify(repo,folder).erreurs.some(e=>e.code==='doublon'));
});
test('Une composante de difficulté se révise sur 0–2, avec une provenance vérifiable',t=>{
 const folder=session(t),e=kit.collect(repo).entrees.find(e=>e.id==='mage-feu/reference/composante/pve.rotation');
 candidate(folder,{id:e.id,actuelle:e.valeur,proposee:e.valeur===2?1:2});assert.equal(kit.verify(repo,folder).valide,true);
 candidate(folder,{id:e.id,actuelle:e.valeur,proposee:3});assert.ok(kit.verify(repo,folder).erreurs.some(e=>e.code==='plage'));
});
test('Un témoignage seul et des appuis incomplets ne justifient pas une note numérique',t=>{
 const folder=session(t),p=candidate(folder);p.changements[0].preuves[0].nature='retour-joueur';write(path.join(folder,'propositions.json'),p);
 assert.ok(kit.verify(repo,folder).erreurs.some(e=>e.code==='qualitatif-seul'));
 p.changements[0].preuves[0]={url:'javascript:alert(1)',consultee:'2026-02-31'};write(path.join(folder,'propositions.json'),p);
 const codes=kit.verify(repo,folder).erreurs.map(e=>e.code);
 for(const code of ['url','date','provenance','nature'])assert.ok(codes.includes(code),code);
});
test('Une refonte HTML préserve la revue ; un changement de sources impose de la réconcilier',t=>{
 const temp=workspace(t),mirror=path.join(temp,'depot');fs.mkdirSync(mirror);
 for(const f of ['recommendation-engine.js','index.html'])fs.copyFileSync(path.join(repo,f),path.join(mirror,f));
 fs.cpSync(path.join(repo,'connaissances'),path.join(mirror,'connaissances'),{recursive:true});
 const folder=path.join(temp,'revue');kit.prepare(mirror,folder);
 fs.appendFileSync(path.join(mirror,'index.html'),'\n<!-- Présentation seulement -->\n');assert.equal(kit.verify(mirror,folder).valide,true);
 const file=path.join(mirror,'connaissances','sources.json'),sources=read(file);sources.sources[0].note+=' Mise à jour de test.';write(file,sources);
 assert.ok(kit.verify(mirror,folder).erreurs.some(e=>e.code==='base-obsolete'));
});
