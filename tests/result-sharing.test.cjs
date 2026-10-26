'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const E=require('../recommendation-engine.js'),C=require('../result-sharing.js');
const fixture=require('./fixtures/moteur-reference-v15.json');
const base='https://loursentong.github.io/wow-forever-classes/?test=1#ancien';
const clone=x=>JSON.parse(JSON.stringify(x));
const full=()=>E.sanitize({roles:{soin:4,dps:1},healStyles:{prevention:0,groupe:5},activities:{raid:2,bg:5,world:0,solo:1},range:{value:'distance',certainty:5,strict:true},styles:{ctrl:0,surv:2,support:5},pet:{value:'avoid',certainty:5,strict:true},difficulty:{value:'complex',certainty:1},mastery:3});

test('Lien et fichier conservent chaque réponse, les zéros, le soin, les exigences et la maîtrise',()=>{
 const profile=full(),packet=C.create('guided',profile);
 assert.deepEqual(packet.choices,profile);
 for(const imported of [C.parse(C.stringify(packet)),C.readLink(C.link(packet,base))]){
  assert.deepEqual(imported,packet);
  assert.deepEqual(E.recommend(imported.choices),E.recommend(profile));
 }
 assert.ok(C.link(packet,base).length<1500);
 const url=new URL(C.link(packet,base));assert.equal(url.pathname,'/wow-forever-classes/');assert.equal(url.search,'');
 assert.ok(!Object.hasOwn(packet,'results'));assert.ok(!Object.hasOwn(packet,'scores'));
});
test('Les profils guidés de référence se transportent sans changer leur classement ni leurs explications',()=>{
 let checked=0;
 for(const row of fixture.guide){
  if(E.ranking(row.profile).status==='unanswered')continue;
  const packet=C.create('guided',row.profile),imported=C.decode(C.encode(packet));
  assert.deepEqual(imported.choices,packet.choices,row.id);
  assert.deepEqual(E.recommend(imported.choices),E.recommend(packet.choices),row.id);
  for(const r of E.ranking(packet.choices).results)assert.deepEqual(E.explain(r.spec.id,imported.choices),E.explain(r.spec.id,packet.choices));
  checked++;
 }assert.ok(checked>=50);
});
test('Les profils personnalisés actuels et historiques gardent leurs 15 poids aux quatre maîtrises',()=>{
 for(const p of require('../priority-profiles.js').concat(fixture.priorities))for(const mastery of [0,1,2,3]){
  const data={weights:E.sanitizeWeights(p.weights),mastery},packet=C.create('priorities',data);
  const imported=C.readLink(C.link(packet,base));assert.deepEqual(imported.choices,data);
  assert.deepEqual(E.priorityRanking(imported.choices.weights,imported.choices.mastery),E.priorityRanking(data.weights,mastery));
 }
});
test('Un ancien numéro de moteur ne restaure ni scores ni notes anciennes',()=>{
 const p=C.create('guided',full());p.engine='ancien-patch';
 const imported=C.parse(JSON.stringify(p));assert.deepEqual(E.ranking(imported.choices),E.ranking(full()));
 p.results=[{id:'mage-feu',score:100}];assert.throws(()=>C.parse(JSON.stringify(p)));
});
test('Les contraintes incompatibles peuvent être partagées ; un profil sans envie ne le peut pas',()=>{
 const p=E.sanitize({roles:{tank:5},rolesStrict:true,range:{value:'distance',certainty:5,strict:true}});
 assert.equal(E.ranking(p).status,'no-match');assert.deepEqual(C.parse(C.stringify(C.create('guided',p))).choices,p);
 assert.throws(()=>C.create('guided',E.sanitize(null)),/au moins une envie/);
 assert.throws(()=>C.create('priorities',{weights:{},mastery:2}),/au moins un critère/);
});
test('Bornes, types, champs inconnus, formats futurs et sélections incohérentes sont refusés',()=>{
 const packet=C.create('guided',full());
 const changes=[p=>p.format=2,p=>p.mode='autre',p=>p.app='autre',p=>p.choices.mastery=4,p=>p.choices.styles.ctrl=-1,
  p=>p.choices.roles.dps='5',p=>p.choices.pet.strict='true',p=>p.choices.range.certainty=0,
  p=>p.choices.styles.zone=3,p=>p.choices.healStyles.duree=3,p=>delete p.choices.roles.soin,
  p=>p.choices.range.value='vol',p=>p.choices.roles.inconnu=5,p=>p.choices.extra='contenu',p=>p.choices.rolesStrict=1,
  p=>p.created='hier',p=>p.created='2026-02-30T12:00:00.000Z',p=>p.choices=[]];
 for(const change of changes){const p=clone(packet);change(p);assert.throws(()=>C.parse(JSON.stringify(p)));}
 const custom=C.create('priorities',{weights:E.sanitizeWeights({raid:3}),mastery:2});
 for(const value of [4,-1,1.5,'3',null]){const p=clone(custom);p.choices.weights.raid=value;assert.throws(()=>C.parse(JSON.stringify(p)));}
 delete custom.choices.weights.raid;assert.throws(()=>C.parse(JSON.stringify(custom)));
});
test('Liens et fichiers malformés ou trop volumineux sont refusés sans navigation ni exécution',()=>{
 for(const value of ['','%','a','____','a'.repeat(22001)])assert.throws(()=>C.decode(value));
 for(const value of ['https://example.org/','javascript:alert(1)#partage=abc','<script>bad()</script>'])assert.throws(()=>C.readLink(value));
 for(const value of ['{}','[]','null','<html>',' '.repeat(C.maxBytes+1)])assert.throws(()=>C.parse(value));
 const p=C.create('guided',full());assert.deepEqual(C.readLink('#partage='+C.encode(p)),p);
 assert.throws(()=>C.readLink(C.link(p,base)+'!'));
 assert.throws(()=>C.parse(JSON.stringify(p).replace('"roles":{','"roles":{"__proto__":{"polluted":true},')));
 assert.equal({}.polluted,undefined);
});
test('Le format Unicode est portable entre lien et fichier, sans changer les entrées',()=>{
 const p=C.create('guided',full());p.engine='révision-épreuve';
 assert.deepEqual(C.decode(C.encode(p)),p);assert.deepEqual(C.parse('\uFEFF'+C.stringify(p)),p);
});
test('Le partage ne modifie jamais les objets transmis ni les données du moteur',()=>{
 const profile=full(),before=JSON.stringify({profile,specs:E.specs,petless:E.petless,refs:E.roleReference});
 const p=C.create('guided',profile);C.readLink(C.link(p,base));C.parse(C.stringify(p));
 assert.equal(JSON.stringify({profile,specs:E.specs,petless:E.petless,refs:E.roleReference}),before);
});
test('Les ressources de partage sont chargées et font partie de l’artefact et des contrôles navigateur',()=>{
 const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
 for(const file of ['result-sharing.js','result-sharing-ui.js','result-sharing.css'])assert.ok(html.includes('"'+file+'"'));
 assert.ok(html.indexOf('src="result-sharing-ui.js"')>html.indexOf('src="priorities-ui.js"'));
 assert.match(html,/data-share-import/);
 const browser=fs.readFileSync(path.join(__dirname,'browser-smoke.cjs'),'utf8');assert.match(browser,/sharing-browser/);
 for(const file of ['result-sharing.js','result-sharing-ui.js','result-sharing.css'])assert.ok(browser.includes("'"+file+"'"));
});
