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
 const results={innerHTML:'',listeners:{},addEventListener(k,fn){this.listeners[k]=fn;}},form={innerHTML:'',listeners:{},
  addEventListener(k,fn){this.listeners[k]=fn;},
  contains(){return true;},
  querySelector(){return null;}};
 const reset={addEventListener(k,fn){listeners[k]=fn;},click(){listeners.click();}};
 const root={querySelector(s){return {'#reco-form':form,'#reco-results':results,'#reco-reset':reset}[s]||null;}};
 const document={getElementById(id){return id==='reco-app'?root:null;}};
 const localStorage={getItem(k){return Object.hasOwn(store,k)?store[k]:null;},setItem(k,v){store[k]=v;}};
 const window={WFRecommend:engine};
 vm.runInNewContext(ui,{window,document,localStorage},{timeout:2000});
 function button(dataset,attrs=[]){
  return {dataset,hasAttribute(k){return attrs.includes(k);},closest(){return this;}};
 }
 function press(dataset,attrs=[]){form.listeners.click({target:button(dataset,attrs)});}
 return {form,results,reset,store,window,
  step(n){press({step:String(n)});},
  next(){press({},['data-next']);},
  back(){press({},['data-prev']);},
  choose(group,key){this.step({roles:0,activities:1,range:2,styles:3,pet:4,difficulty:5}[group]);press({multi:group,key});},
  press(kind,group,key){press({[kind]:group,key});},
  single(group,key){press({single:group,key});},
  mastery(n){this.step(5);press({mastery:String(n)});},
  certainty(group,key,n){form.listeners.input({target:{dataset:{certgroup:group,certkey:key},value:String(n),setAttribute(){}}});},
  strict(field,checked){const target={dataset:{},checked,hasAttribute(k){return k==='data-roles-strict'&&field==='roles';}};
    if(field!=='roles')target.dataset.strict=field;form.listeners.change({target});},
  reveal(){results.listeners.click({target:button({},['data-reco-reveal'])});},
  hide(){results.listeners.click({target:button({},['data-reco-hide'])});},
  profile(){return JSON.parse(store['wf-recommend-v1']);}
 };
}
test('Accueil épuré : une question, six étapes et aucune recommandation arbitraire',()=>{
 const h=createHarness();
 assert.match(h.form.innerHTML,/Quel rôle voudrais-tu jouer/);
 assert.match(h.form.innerHTML,/data-step="5"/);
 assert.equal((h.form.innerHTML.match(/class="reco-question"/g)||[]).length,1);
 assert.match(h.results.innerHTML,/Tout commence par tes envies/);
 assert.equal(h.profile().mastery,2);
});
test('Six étapes accessibles directement, parcours suivant/précédent, repères de progression',()=>{
 const h=createHarness();
 h.step(3);assert.match(h.form.innerHTML,/Quel style te ressemble/);
 assert.match(h.form.innerHTML,/Étape 4 sur 6/);
 h.next();assert.match(h.form.innerHTML,/Quelle place pour les familiers/);
 h.back();assert.match(h.form.innerHTML,/Quel style te ressemble/);
 h.step(5);assert.match(h.form.innerHTML,/Ton expérience actuelle/);
 h.step(0);assert.match(h.form.innerHTML,/Quel rôle voudrais-tu jouer/);
});
test('Certitude 0 à 5 visible uniquement pour les réponses actives',()=>{
 const h=createHarness();
 h.step(3);h.press('multi','styles','ctrl');
 assert.match(h.form.innerHTML,/Certitude pour « Contrôle »/);
 h.certainty('styles','ctrl',0);
 assert.equal(h.profile().styles.ctrl,0);
 assert.match(h.results.innerHTML,/Encore un peu de contexte/);
 h.certainty('styles','ctrl',5);
 assert.equal(h.profile().styles.ctrl,5);
 h.press('multi','styles','ctrl');
 assert.ok(!Object.hasOwn(h.profile().styles,'ctrl'));
 assert.match(h.results.innerHTML,/Tout commence par tes envies/);
});
test('Jusqu’à trois styles, y compris après navigation entre questions',()=>{
 const h=createHarness();h.step(3);
 for(const k of ['ctrl','burst','zone'])h.press('multi','styles',k);
 h.press('multi','styles','surv');
 assert.deepEqual(Object.keys(h.profile().styles),['ctrl','burst','zone']);
 h.step(4);h.step(3);
 h.press('multi','styles','burst');h.press('multi','styles','surv');
 assert.deepEqual(Object.keys(h.profile().styles),['ctrl','zone','surv']);
 assert.match(h.form.innerHTML,/3 sur 3 styles possibles/);
});
test('Rôle, portée et familiaux stricts sont explicites',()=>{
 const h=createHarness();
 h.press('multi','roles','tank');
 assert.match(h.form.innerHTML,/Ce rôle est indispensable/);
 h.strict('roles',true);
 h.step(2);h.single('range','distance');
 assert.match(h.form.innerHTML,/C’est une exigence absolue/);
 h.strict('range',true);
 assert.match(h.results.innerHTML,/Voir un aperçu/);
 h.reveal();
 assert.match(h.results.innerHTML,/Ces exigences ne vont pas ensemble/);
 h.strict('range',false);
 assert.match(h.results.innerHTML,/Tes meilleures pistes/);
});
test('Niveau actuel et complexité souhaitée sont indépendants et persistants',()=>{
 const h=createHarness();h.mastery(0);
 h.single('difficulty','complex');h.certainty('difficulty','complex',4);
 assert.equal(h.profile().mastery,0);
 assert.equal(h.profile().difficulty.value,'complex');
 assert.equal(h.profile().difficulty.certainty,4);
 const saved=createHarness(h.store);saved.step(5);
 assert.match(saved.form.innerHTML,/data-mastery="0" aria-pressed="true"/);
 assert.match(saved.form.innerHTML,/data-single="difficulty" data-key="complex" aria-pressed="true"/);
 assert.equal(saved.window.WFGuide.getMastery(),0);
});
test('Réinitialisation, navigation et localStorage corrompu',()=>{
 const h=createHarness({'wf-recommend-v1':'INVALID JSON'});
 assert.match(h.results.innerHTML,/Tout commence par tes envies/);
 h.step(1);h.press('multi','activities','bg');
 h.reset.click();
 assert.deepEqual(Object.keys(h.profile().activities),[]);
 assert.equal(h.profile().range.value,'any');
 assert.match(h.form.innerHTML,/Étape 1 sur 6/);
 assert.match(h.results.innerHTML,/Tout commence par tes envies/);
});
test('Les poids historiques ne changent pas le guide et l’API de synchronisation existe',()=>{
 const h=createHarness({'wf-overview-v3':JSON.stringify({w:{tank:3,bg:3}})});
 h.step(4);h.single('pet','avoid');h.strict('pet',true);
 assert.match(h.results.innerHTML,/Encore un peu de contexte/);
 assert.deepEqual(Object.keys(h.profile().roles),[]);
 assert.equal(h.profile().pet.strict,true);
 h.window.WFGuide.setMastery(3);
 assert.equal(h.profile().mastery,3);
});

test('Les résultats attendent deux dimensions et un geste explicite avant d’apparaître',()=>{
 const h=createHarness();
 h.press('multi','roles','dps');
 assert.match(h.results.innerHTML,/Encore un peu de contexte/);
 assert.doesNotMatch(h.results.innerHTML,/reco-result-card/);
 h.step(1);
 h.press('multi','activities','solo');
 assert.match(h.results.innerHTML,/Voir un aperçu/);
 assert.doesNotMatch(h.results.innerHTML,/reco-result-card/);
 h.reveal();
 assert.match(h.results.innerHTML,/reco-result-card/);
 h.step(3);h.press('multi','styles','ctrl');
 assert.match(h.results.innerHTML,/reco-result-card/);
 h.hide();
 assert.match(h.results.innerHTML,/Voir un aperçu/);
 h.reset.click();
 assert.match(h.results.innerHTML,/Tout commence par tes envies/);
});
