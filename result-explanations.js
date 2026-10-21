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
 // Repère affiché à côté d'une classe classée : l'égalité nomme les classes concernées ; un écart
 // de 2 points au plus est chiffré par rapport à la classe juste au-dessus (scores au centième,
 // affichés arrondis à l'entier). Toutes les classes sont au masculin : « le », « du ».
 function names(rows){
  var n=rows.map(function(r){return 'le '+(r.className||r.spec.className);});
  return n.length>1?n.slice(0,-1).join(', ')+' et '+n[n.length-1]:n[0];
 }
 function rankHint(results,i){
  var row=results[i];
  if(!row)return '';
  var same=results.filter(function(r,j){return j!==i&&r.score===row.score;});
  if(same.length)return 'à égalité avec '+(same.length>2?same.length+' autres classes':names(same));
  if(i===0)return '';
  var gap=results[i-1].score-row.score;
  if(!(gap<2.01))return '';
  var above=results.filter(function(r){return r.score===results[i-1].score;});
  var v=Math.round(gap*10)/10,points=v<0.1?'moins de 0,1 point':String(v).replace('.',',')+(v>=2?' points':' point');
  return points+' derrière '+(above.length>2?'les '+above.length+' classes à égalité au-dessus':names(above));
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
 // Façon de soigner (référence v8) : mêmes règles que le moteur, deux choix au plus, comptés seulement
 // avec le rôle Soin, et pour les seules configurations de soin.
 var healNames={prevention:'prévenir les dégâts',duree:'soins sur la durée',cible:'gros soins ciblés',groupe:'soigner tout le groupe'};
 function healChoices(p){
  var valid=function(v){return Number.isInteger(v)&&v>=0&&v<=5;};
  if(!p||!valid((p.roles||{}).soin))return [];
  return Object.keys(healNames).filter(function(k){return valid((p.healStyles||{})[k]);}).slice(0,2);
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
  if(p&&Object.hasOwn(p.roles||{},'soin')){
   var heal=healChoices(p);
   out.push(heal.length?'Ta façon de soigner ('+heal.map(function(k){return healNames[k];}).join(', ')+') départage les spécialisations de soin ; elle ne compte pas pour les autres rôles.':
    'Tu peux préciser ta façon de soigner à la question 1 : elle départage les spécialisations de soin.');
  }else if(w&&w.soin>0)
   out.push('Ce comparateur ne départage pas les façons de soigner : le parcours guidé le fait à la question 1, et la fiche de chaque spécialisation de soin les décrit.');
  return out;
 }
 return {criteria:criteria,ranks:ranks,rankHint:rankHint,tieNote:tieNote,petNotice:petNotice,contextNotes:contextNotes,healChoices:healChoices};
});
