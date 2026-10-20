'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const engine=require('../recommendation-engine.js');
const ui=fs.readFileSync(path.join(__dirname,'..','questionnaire.js'),'utf8');

function createHarness(initial={}){
 const store={...initial},listeners={};
 const results={innerHTML:''},form={innerHTML:'',listeners:{},
   addEventListener(k,fn){this.listeners[k]=fn;},
   contains(){return true;},
   querySelector(){return null;}};
 const reset={addEventListener(k,fn){listeners[k]=fn;},click(){listeners.click();}};
 const root={querySelector(sel){return {'#reco-form':form,'#reco-results':results,'#reco-reset':reset}[sel];}};
 const document={getElementById(id){return id==='reco-app'?root:null;}};
 const localStorage={getItem(k){return Object.hasOwn(store,k)?store[k]:null;},setItem(k,v){store[k]=v;}};
 vm.runInNewContext(ui,{window:{WFRecommend:engine},document,localStorage},{timeout:2000});
 return {form,results,reset,store,
   press(kind,group,key){
     const target={dataset:{[kind]:group,key},closest(){return this;}};
     form.listeners.click({target});
   },
   mastery(n){
     const target={dataset:{mastery:String(n)},closest(){return this;}};
     form.listeners.click({target});
   },
   certainty(group,key,n){
     form.listeners.input({target:{dataset:{certgroup:group,certkey:key},value:String(n)}});
   },
   strict(field,checked){
     const target={dataset:{},checked,hasAttribute(k){return k==='data-roles-strict'&&field==='roles';}};
     if(field!=='roles')target.dataset.strict=field;
     form.listeners.change({target});
   },
   profile(){return JSON.parse(store['wf-recommend-v1']);}
 };
}
test('Le formulaire est visible et la liste reste vide avant réponse',()=>{
 const h=createHarness();
 assert.match(h.form.innerHTML,/Quels rôles souhaites-tu jouer/);
 assert.match(h.form.innerHTML,/Ton niveau actuel/);
 assert.match(h.form.innerHTML,/Certitude/);
 assert.match(h.results.innerHTML,/Aucune classe n’est favorisée/);
 assert.equal(h.profile().mastery,2);
});
test('Cliquer une réponse sélectionne une certitude modifiable de zéro à cinq',()=>{
 const h=createHarness();
 h.press('multi','styles','ctrl');
 assert.match(h.form.innerHTML,/Certitude pour « Contrôle »/);
 h.certainty('styles','ctrl',0);
 assert.equal(h.profile().styles.ctrl,0);
 assert.match(h.results.innerHTML,/Les classes qui correspondent/);
 h.certainty('styles','ctrl',5);
 assert.equal(h.profile().styles.ctrl,5);
 h.press('multi','styles','ctrl');
 assert.ok(!Object.hasOwn(h.profile().styles,'ctrl'));
 assert.match(h.results.innerHTML,/Aucune classe n’est favorisée/);
});
test('Au maximum trois styles, avec suppression et réattribution',()=>{
 const h=createHarness();
 for(const v of ['ctrl','burst','zone'])h.press('multi','styles',v);
 h.press('multi','styles','surv');
 assert.deepEqual(Object.keys(h.profile().styles),['ctrl','burst','zone']);
 h.press('multi','styles','burst');
 h.press('multi','styles','surv');
 assert.deepEqual(Object.keys(h.profile().styles),['ctrl','zone','surv']);
});
test('Le veto sur un rôle unique est proposé et appliqué explicitement',()=>{
 const h=createHarness();
 h.press('multi','roles','tank');
 assert.match(h.form.innerHTML,/Ce rôle est indispensable pour moi/);
 h.strict('roles',true);
 h.press('single','range','distance');
 h.strict('range',true);
 assert.match(h.results.innerHTML,/Aucune spécialisation ne respecte/);
 h.strict('range',false);
 assert.match(h.results.innerHTML,/Les classes qui correspondent/);
});
test('La maîtrise et la complexité peuvent diverger et persistent',()=>{
 const h=createHarness();
 h.mastery(0);
 h.press('single','difficulty','complex');
 h.certainty('difficulty','complex',4);
 assert.equal(h.profile().mastery,0);
 assert.equal(h.profile().difficulty.value,'complex');
 assert.equal(h.profile().difficulty.certainty,4);
 const loaded=createHarness(h.store);
 assert.equal(loaded.profile().mastery,0);
 assert.match(loaded.form.innerHTML,/aria-pressed="true">Débutant/);
 assert.match(loaded.form.innerHTML,/data-single="difficulty" data-key="complex" aria-pressed="true"/);
});
test('Réinitialisation et stockage local invalide ne provoquent aucune erreur',()=>{
 const h=createHarness({'wf-recommend-v1':'ceci nest pas du JSON'});
 assert.match(h.results.innerHTML,/Aucune classe n’est favorisée/);
 h.press('multi','activities','bg');
 h.reset.click();
 assert.deepEqual(Object.keys(h.profile().activities),[]);
 assert.equal(h.profile().range.value,'any');
 assert.match(h.results.innerHTML,/Aucune classe n’est favorisée/);
});
test('Cas limite : déclencheur sans valeurs de poids historique ne crée aucun couplage',()=>{
 const h=createHarness({'wf-overview-v3':JSON.stringify({w:{tank:3,bg:3}})});
 h.press('single','pet','avoid');
 h.strict('pet',true);
 assert.match(h.results.innerHTML,/Les classes qui correspondent/);
 assert.deepEqual(Object.keys(h.profile().roles),[]);
 assert.equal(h.profile().pet.strict,true);
});
