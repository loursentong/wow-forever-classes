'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const E=require('../recommendation-engine.js');
const notes=require('../configuration-notes.js');
const render=require('../configuration-details.js');

test('Les 28 configurations ont des explications utilisables sans intervenir dans le scoring',()=>{
 assert.deepEqual(Object.keys(notes).sort(),E.specs.map(s=>s.id).sort());
 for(const spec of E.specs){
  const n=notes[spec.id];
  assert.equal(n.strengths.length,2,spec.id);
  for(const text of [n.fit,n.caution,...n.strengths])assert.ok(typeof text==='string'&&text.trim().length>0,spec.id);
  const detail=render(spec);
  assert.ok(detail.includes('data-config-id="'+spec.id+'"'));
  assert.ok(detail.includes(spec.source));
  assert.ok(detail.includes('À prévoir'));
 }
 const before=E.priorityRanking({solo:3},0);
 const note=notes['demoniste-demonologie'].fit;
 notes['demoniste-demonologie'].fit='Texte modifié pour vérifier la séparation.';
 try{assert.deepEqual(E.priorityRanking({solo:3},0),before);}finally{notes['demoniste-demonologie'].fit=note;}
});

test('Les explications échappent les textes et tolèrent une configuration inconnue',()=>{
 assert.equal(render({id:'inconnue'}),'');
 const html=render({...E.specs[0],label:'<img src=x onerror=alert(1)>"&'});
 assert.ok(!html.includes('<img'));
 assert.ok(html.includes('&lt;img'));
 assert.ok(html.includes('&quot;&amp;'));
});
