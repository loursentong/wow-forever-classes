/* Présentation des résultats existants : aucun score, tri ou filtre modifié. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.WFResultExplanations=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 var criteria={
  ctrl:'Ralentir, immobiliser, interrompre ou neutraliser un adversaire. Les outils et leurs contraintes varient selon le build.',
  tech:'Préférence pour un jeu exigeant à maîtriser. La prise en main et l’optimisation peuvent demander des efforts différents.'
 };
 function ranks(results){
  return results.map(function(row,i){
   var first=results.findIndex(function(r){return r.score===row.score;});
   return {rank:first+1,tied:results.filter(function(r){return r.score===row.score;}).length>1,
    leader:row.score===results[0].score,
    close:i>0&&row.score!==results[i-1].score&&Math.abs(row.score-results[i-1].score)<2.01};
  });
 }
 function tieNote(results){
  if(!results.length)return '';
  var top=results.filter(function(r){return r.score===results[0].score;});
  if(top.length<2)return '';
  return 'À égalité en tête : '+top.map(function(r){return r.className||r.spec.className;}).join(', ')+'. L’ordre d’affichage ne les départage pas.';
 }
 // Depuis la référence v5, une configuration à familier facultatif est évaluée sans familier quand le
 // joueur préfère jouer sans compagnon : le texte décrit ce que cette variante perd ou garde.
 var petless={
  'chasseur-precision':'Évaluée en « Loup solitaire », sans familier : ses notes supposent déjà ce choix.',
  'chasseur-survie':'Évaluée sans familier : un peu moins à l’aise en solo ; ses pièges, ses contrôles et ses défenses restent les siens.',
  'demoniste-affliction':'Évaluée sans démon : sans Séduction ni Verrou magique, et sans démon pour encaisser en solo. Peur, Voile mortel et malédictions restent.',
  'demoniste-destruction':'Évaluée sans démon : sans Séduction ni Verrou magique, et sans démon pour encaisser en solo. Peur, Voile mortel et le ralentissement de Conflagration restent.'
 };
 function petNotice(spec,profile){
  if(!profile||!profile.pet||profile.pet.value!=='avoid')return '';
  if(spec.pet==='core')return 'Le familier est central dans cette spécialisation : cette piste répond moins bien à ton envie de jouer sans compagnon.';
  if(spec.pet!=='optional')return '';
  return petless[spec.id]||'Évaluée sans familier.';
 }
 function contextNotes(context){
  var out=[],p=context.profile,w=context.weights;
  if((p&&Object.hasOwn(p.styles||{},'ctrl'))||(w&&w.ctrl>0))
   out.push('Le contrôle regroupe plusieurs usages. La maîtrise choisie tient aussi compte de la difficulté estimée à utiliser ces outils.');
  if(p&&p.difficulty&&p.difficulty.value&&p.difficulty.value!=='any'){
   // Même règle que le moteur (difficultyContext) : PvE seul, PvP seul, sinon moyenne.
   var acts=Object.keys(p.activities||{}),pve=acts.some(function(k){return k==='raid'||k==='solo';}),pvp=acts.some(function(k){return k==='bg'||k==='world';});
   out.push(pve&&!pvp?'Ton rapport à la difficulté est comparé à la difficulté PvE de chaque spécialisation, puisque tes activités sont en PvE.':
    pvp&&!pve?'Ton rapport à la difficulté est comparé à la difficulté PvP de chaque spécialisation, puisque tes activités sont en PvP.':
    'Ton rapport à la difficulté est comparé à la moyenne PvE et PvP de chaque spécialisation, faute d’activités d’un seul type.');
  }
  if((p&&Object.hasOwn(p.roles||{},'soin'))||(w&&w.soin>0))
   out.push('Les styles de soin ne sont pas encore départagés par tes réponses. Consulte les fiches des spécialisations pour comparer leur façon de soigner.');
  return out;
 }
 return {criteria:criteria,ranks:ranks,tieNote:tieNote,petNotice:petNotice,contextNotes:contextNotes};
});
