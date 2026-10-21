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
 const window={WFRecommend:engine,WFConfigurationDetails:require('../configuration-details.js'),WFResultExplanations:require('../result-explanations.js')};
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
 assert.match(h.results.innerHTML,/Voir mes résultats/);
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
 // Avant toute préférence : invitation et progression vers un premier aperçu.
 assert.match(h.results.innerHTML,/reco-empty-action[\s\S]*0 préférence sur 2 pour un premier aperçu/);
 assert.match(h.results.innerHTML,/Deux préférences suffisent/);
 h.press('multi','roles','dps');
 assert.match(h.results.innerHTML,/Encore un peu de contexte/);
 assert.match(h.results.innerHTML,/1 préférence sur 2[\s\S]*class="is-done"[\s\S]*Encore une préférence/);
 assert.doesNotMatch(h.results.innerHTML,/reco-result-card/);
 h.step(1);
 h.press('multi','activities','solo');
 assert.match(h.results.innerHTML,/Voir mes résultats/);
 assert.doesNotMatch(h.results.innerHTML,/reco-result-card/);
 h.reveal();
 assert.match(h.results.innerHTML,/reco-result-card/);
 h.step(3);h.press('multi','styles','ctrl');
 assert.match(h.results.innerHTML,/reco-result-card/);
 h.hide();
 assert.match(h.results.innerHTML,/Voir mes résultats/);
 h.reset.click();
 assert.match(h.results.innerHTML,/Tout commence par tes envies/);
});

test('Une égalité en tête ne reçoit pas de carte gagnante ; la variante sans familier est annoncée',()=>{
 const h=createHarness({'wf-recommend-v1':JSON.stringify({styles:{ctrl:5},range:{value:'distance',certainty:5},mastery:2})});
 h.reveal();
 assert.match(h.results.innerHTML,/À égalité en tête : Démoniste, Mage/);
 assert.doesNotMatch(h.results.innerHTML,/reco-featured/);
 assert.doesNotMatch(h.results.innerHTML,/PISTE PRINCIPALE/);
 h.step(4);h.single('pet','avoid');h.certainty('pet','avoid',5);h.strict('pet',true);
 // Depuis la v5, le Démoniste est évalué sans démon : le Mage passe seul en tête.
 assert.match(h.results.innerHTML,/PISTE PRINCIPALE<\/span><h4>Mage/);
 assert.match(h.results.innerHTML,/<strong>Affliction<\/strong> · sans familier/);
 assert.match(h.results.innerHTML,/Évaluée sans démon : sans Séduction ni Verrou magique/);
 assert.match(h.results.innerHTML,/<strong>Givre<\/strong>/);
 assert.match(h.results.innerHTML,/Difficulté de cette spécialisation/);
 assert.equal(h.profile().pet.strict,true);
});

test('Façon de soigner : sous-question facultative du rôle Soin, deux choix au plus, ignorée sans ce rôle',()=>{
 const h=createHarness();
 assert.doesNotMatch(h.form.innerHTML,/Quelle façon de soigner/);
 h.press('multi','roles','dps');
 assert.doesNotMatch(h.form.innerHTML,/Quelle façon de soigner/);
 h.press('multi','roles','soin');
 assert.match(h.form.innerHTML,/Quelle façon de soigner t’attire/);
 assert.match(h.form.innerHTML,/0 sur 2 choix possibles/);
 assert.match(h.form.innerHTML,/data-multi="healStyles" data-key="prevention" aria-pressed="false"/);
 for(const k of ['groupe','duree','cible'])h.press('multi','healStyles',k);
 assert.deepEqual(Object.keys(h.profile().healStyles),['groupe','duree']);
 assert.match(h.form.innerHTML,/2 sur 2 choix possibles/);
 assert.match(h.form.innerHTML,/Certitude pour « Soigner tout le groupe »/);
 h.certainty('healStyles','duree',1);
 assert.equal(h.profile().healStyles.duree,1);
 assert.match(h.form.innerHTML,/DPS · Soin \(soins de groupe, soins sur la durée\)/);
 assert.match(h.results.innerHTML,/Voir mes résultats/);
 h.reveal();
 assert.match(h.results.innerHTML,/Ta façon de soigner \(soins sur la durée, soigner tout le groupe\) départage/);
 // Retirer le rôle Soin masque la sous-question ; la façon de soigner ne compte plus.
 h.step(0);h.press('multi','roles','soin');
 assert.doesNotMatch(h.form.innerHTML,/Quelle façon de soigner/);
 assert.doesNotMatch(h.form.innerHTML,/soins de groupe/);
 assert.doesNotMatch(h.results.innerHTML,/façon de soigner/);
 // Le reprendre retrouve les choix de la session.
 h.press('multi','roles','soin');
 assert.match(h.form.innerHTML,/2 sur 2 choix possibles/);
 // Une sauvegarde sans rôle Soin ne conserve pas de façon de soigner.
 const saved=createHarness({'wf-recommend-v1':JSON.stringify({roles:{dps:3},healStyles:{groupe:3}})});
 assert.deepEqual(saved.profile().healStyles,{});
});

test('Fiche d’une piste de soin : façon de soigner décrite, sans score supplémentaire',()=>{
 const h=createHarness();
 h.press('multi','roles','soin');h.strict('roles',true);
 h.press('multi','healStyles','cible');h.certainty('healStyles','cible',5);
 h.reveal();
 assert.match(h.results.innerHTML,/PISTE PRINCIPALE/);
 assert.match(h.results.innerHTML,/<strong>Sacré<\/strong>/);
 assert.match(h.results.innerHTML,/Façon de soigner :<\/b> Gros soins ciblés : son point fort/);
 assert.match(h.results.innerHTML,/2 dimensions prises en compte/);
 assert.match(h.results.innerHTML,/Rôles · Façon de soigner/);
});

test('Sauvegarde de la façon de soigner : aller-retour, et une ancienne sauvegarde reste valide',()=>{
 const h=createHarness();
 h.press('multi','roles','soin');
 h.press('multi','healStyles','prevention');h.certainty('healStyles','prevention',4);
 const saved=createHarness(h.store);
 assert.deepEqual(saved.profile().healStyles,{prevention:4});
 assert.match(saved.form.innerHTML,/data-multi="healStyles" data-key="prevention" aria-pressed="true"/);
 const old=createHarness({'wf-recommend-v1':JSON.stringify({roles:{soin:4},activities:{raid:3},mastery:1})});
 assert.deepEqual(old.profile().healStyles,{});
 assert.deepEqual(old.profile().roles,{soin:4});
 assert.equal(old.profile().mastery,1);
 assert.match(old.form.innerHTML,/0 sur 2 choix possibles/);
});

test('Dernière question : un seul bouton « Voir mes résultats » à l’écran',()=>{
 const h=createHarness();
 h.press('multi','roles','dps');
 h.step(5);
 // Une seule préférence : le bloc des résultats n'offre pas encore de bouton, la question le garde.
 assert.match(h.form.innerHTML,/data-show-results/);
 assert.doesNotMatch(h.results.innerHTML,/data-reco-reveal/);
 h.step(1);h.press('multi','activities','raid');h.step(5);
 // Deux préférences : le bouton est dans le bloc juste en dessous, pas répété dans la question.
 assert.match(h.results.innerHTML,/data-reco-reveal[\s\S]*Voir mes résultats/);
 assert.doesNotMatch(h.form.innerHTML,/data-show-results/);
 h.reveal();
 assert.match(h.results.innerHTML,/reco-result-card/);
 assert.match(h.form.innerHTML,/data-show-results/);
 h.hide();
 assert.doesNotMatch(h.form.innerHTML,/data-show-results/);
});

test('Pourquoi cette piste remplace « Fiabilité et incertitude » : critères, hésitations nommées, sources',()=>{
 const h=createHarness();
 h.press('multi','roles','soin');h.certainty('roles','soin',2);
 h.step(1);h.press('multi','activities','raid');
 h.reveal();
 assert.doesNotMatch(h.results.innerHTML,/Fiabilité et incertitude/);
 assert.equal((h.results.innerHTML.match(/<summary>Pourquoi cette piste<\/summary>/g)||[]).length,3);
 assert.match(h.results.innerHTML,/reco-why-parts[\s\S]*Rôles[\s\S]*Activités/);
 assert.match(h.results.innerHTML,/sans chacune de tes réponses hésitantes \(Soin\)/);
 assert.match(h.results.innerHTML,/github\.com\/loursentong\/wow-forever-classes\/tree\/main\/connaissances/);
 h.certainty('roles','soin',5);
 assert.match(h.results.innerHTML,/aucune de tes réponses n’est hésitante/);
});
