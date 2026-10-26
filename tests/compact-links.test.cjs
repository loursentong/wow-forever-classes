'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const E=require('../recommendation-engine.js'),C=require('../result-sharing.js');
const base='https://loursentong.github.io/wow-forever-classes/';
const samples=()=>[
 C.create('guided',E.sanitize({roles:{dps:0},activities:{raid:5}})),
 C.create('priorities',{weights:E.sanitizeWeights({dps:3,raid:3}),mastery:0})
];
// Produits par le script publié au commit 044231f, date fixée au 26 octobre 2026 à 12 h UTC.
const legacy=[
 'eyJhcHAiOiJjaG9pc2lyLW1hLWNsYXNzZS13b3ctZm9yZXZlciIsImZvcm1hdCI6MSwibW9kZSI6Imd1aWRlZCIsImVuZ2luZSI6IjEuNS4wLWV4cGxvcmF0b2lyZSIsImNyZWF0ZWQiOiIyMDI2LTEwLTI2VDEyOjAwOjAwLjAwMFoiLCJjaG9pY2VzIjp7InJvbGVzIjp7ImRwcyI6MH0sInJvbGVzU3RyaWN0IjpmYWxzZSwiaGVhbFN0eWxlcyI6e30sImFjdGl2aXRpZXMiOnsicmFpZCI6NX0sInJhbmdlIjp7InZhbHVlIjoiYW55IiwiY2VydGFpbnR5IjozLCJzdHJpY3QiOmZhbHNlfSwic3R5bGVzIjp7fSwicGV0Ijp7InZhbHVlIjoiYW55IiwiY2VydGFpbnR5IjozLCJzdHJpY3QiOmZhbHNlfSwiZGlmZmljdWx0eSI6eyJ2YWx1ZSI6ImFueSIsImNlcnRhaW50eSI6M30sIm1hc3RlcnkiOjJ9fQ',
 'eyJhcHAiOiJjaG9pc2lyLW1hLWNsYXNzZS13b3ctZm9yZXZlciIsImZvcm1hdCI6MSwibW9kZSI6InByaW9yaXRpZXMiLCJlbmdpbmUiOiIxLjUuMC1leHBsb3JhdG9pcmUiLCJjcmVhdGVkIjoiMjAyNi0xMC0yNlQxMjowMDowMC4wMDBaIiwiY2hvaWNlcyI6eyJ3ZWlnaHRzIjp7InBvbHkiOjAsInRhbmsiOjAsInNvaW4iOjAsImRwcyI6MywicmFpZCI6MywiYmciOjAsInNhdXYiOjAsImJ1cnN0IjowLCJ6b25lIjowLCJjdHJsIjowLCJzdXJ2IjowLCJtb2IiOjAsInV0aWwiOjAsInNvbG8iOjAsInRlY2giOjB9LCJtYXN0ZXJ5IjowfX0'
];
test('Les deux anciens liens publiés retrouvent encore leur profil et leurs métadonnées exactes',()=>{
 samples().forEach((p,i)=>{
  p.created='2026-10-26T12:00:00.000Z';
  assert.deepEqual(C.readLink(base+'#partage='+legacy[i]),p);
  assert.deepEqual(C.decode(legacy[i]),p);
  assert.equal(C.encode(p),legacy[i]);
 });
});
test('Codes v1 figés : zéro est une réponse, les positions des critères restent stables',()=>{
 const tokens=['FPw__v_G___GGAg','GAPAAACc'];
 samples().forEach((p,i)=>{
  assert.equal(C.compactEncode(p),tokens[i]);
  const imported=C.compactDecode(tokens[i]);
  assert.equal(imported.mode,p.mode);assert.deepEqual(imported.choices,p.choices);
  assert.equal(C.link(p,base).length,i===0?68:61);
 });
 assert.equal(C.compactDecode(tokens[0]).choices.roles.dps,0);
 assert.equal(Object.hasOwn(C.compactDecode(tokens[0]).choices.roles,'tank'),false);
});
test('Chaque caractère d’un nouveau lien vient des choix, pas de la date ni du numéro du moteur',()=>{
 const p=samples()[0],code=C.compactEncode(p),file=C.stringify(p);
 p.engine='ancienne-révision';p.created='2020-01-01T00:00:00.000Z';
 assert.equal(C.compactEncode(p),code);
 assert.deepEqual(C.compactDecode(code).choices,p.choices);
 assert.notEqual(C.stringify(p),file);assert.deepEqual(C.parse(C.stringify(p)),p);
});
test('Certitudes neutres, toutes les graduations, rôles stricts et profils de soin restent distincts',()=>{
 for(let n=0;n<=5;n++){
  const p=C.create('guided',E.sanitize({roles:{soin:n},healStyles:{prevention:n,groupe:5-n},activities:{solo:n},
   range:{value:'any',certainty:n,strict:false},pet:{value:'any',certainty:5-n,strict:false},difficulty:{value:'any',certainty:n},mastery:n%4}));
  assert.deepEqual(C.compactDecode(C.compactEncode(p)).choices,p.choices);
 }
 const strict=C.create('guided',E.sanitize({roles:{tank:5,soin:5},rolesStrict:true,range:{value:'distance',certainty:5,strict:true},pet:{value:'avoid',certainty:5,strict:true},difficulty:{value:'complex',certainty:0},mastery:3}));
 assert.deepEqual(C.compactDecode(C.compactEncode(strict)).choices,strict.choices);
 assert.deepEqual(E.ranking(C.compactDecode(C.compactEncode(strict)).choices),E.ranking(strict.choices));
});
test('1 000 profils déterministes : aucune perte de sélection, maîtrise, certitude ou contrainte',()=>{
 let seed=90621;const next=n=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%n;};
 for(let i=0;i<1000;i++){
  const map=(keys,max)=>Object.fromEntries(keys.filter(()=>next(3)!==0).slice(0,max||keys.length).map(k=>[k,next(6)]));
  const profile=E.sanitize({roles:map(E.roles),rolesStrict:!!next(2),healStyles:map(E.healStyles,2),activities:map(E.activities),styles:map(E.styles,3),
   range:{value:['any','distance','melee','mixte'][next(4)],certainty:next(6),strict:!!next(2)},
   pet:{value:['any','like','avoid'][next(3)],certainty:next(6),strict:false},difficulty:{value:['any','simple','complex'][next(3)],certainty:next(6)},mastery:next(4)});
  if(profile.range.value==='any')profile.range.strict=false;
  if(profile.pet.value==='avoid')profile.pet.strict=!!next(2);
  if(E.ranking(profile).status==='unanswered')profile.activities.solo=3;
  const p=C.create('guided',profile),before=JSON.stringify(p);
  assert.deepEqual(C.readLink(C.link(p,base)).choices,p.choices,i);
  assert.equal(JSON.stringify(p),before);
 }
});
test('Copie tronquée, caractères interdits, longueur excessive et toute altération d’un bit sont refusés',()=>{
 for(const p of samples()){
  const token=C.compactEncode(p),bytes=Buffer.from(token,'base64url');
  for(let bit=0;bit<bytes.length*8;bit++){
   const changed=Buffer.from(bytes);changed[bit>>3]^=1<<(bit%8);
   assert.throws(()=>C.compactDecode(changed.toString('base64url')));
  }
  for(const bad of [token.slice(0,-1),token+'A',token+'=',token+'!',token.toLowerCase()])assert.throws(()=>C.readLink(base+'#p='+bad));
 }
 for(const token of ['', 'bad', 'A'.repeat(16),'%20'])assert.throws(()=>C.compactDecode(token));
 assert.equal(C.isShareHash('#p='),true);assert.equal(C.isShareHash('#partage='),true);
 for(const hash of ['',null,'#autre=','?p='])assert.equal(C.isShareHash(hash),false);
});
test('Une somme de contrôle valide ne suffit pas : version, réserve, remplissage et valeurs restent contrôlés',()=>{
 assert.throws(()=>C.compactDecode('JPw__v_G___GGLk'),/format de partage/);
 // Vecteurs volontairement invalides avec CRC recalculé : réserve à 1, remplissage à 1, certitude à 6.
 for(const token of ['Ffw__v_G___GGGA','FPw__v_G___GGQ8','FNw__v_G___GGAU'])assert.throws(()=>C.compactDecode(token));
});
