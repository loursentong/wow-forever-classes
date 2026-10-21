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
 function petNotice(spec,profile){
  if(!profile||!profile.pet||profile.pet.value!=='avoid')return '';
  if(spec.pet==='core')return 'Le familier est central dans cette spécialisation : cette piste répond moins bien à ton envie de jouer sans compagnon.';
  if(spec.pet!=='optional')return '';
  return 'Le familier est facultatif selon le build, mais ce score ne distingue pas encore les variantes avec et sans compagnon.'+
   (spec.classId==='demoniste'?' Sans démon invoqué, tu perds ses contrôles, notamment Séduction ou l’interruption du Chasseur corrompu.':' Les outils et le confort en solo peuvent changer sans lui.');
 }
 function contextNotes(context){
  var out=[],p=context.profile,w=context.weights;
  if((p&&Object.hasOwn(p.styles||{},'ctrl'))||(w&&w.ctrl>0))
   out.push('Le contrôle regroupe plusieurs usages. La maîtrise choisie tient aussi compte de la difficulté estimée à utiliser ces outils.');
  if((p&&Object.hasOwn(p.roles||{},'soin'))||(w&&w.soin>0))
   out.push('Les styles de soin ne sont pas encore départagés par tes réponses. Consulte les fiches des spécialisations pour comparer leur façon de soigner.');
  return out;
 }
 return {criteria:criteria,ranks:ranks,tieNote:tieNote,petNotice:petNotice,contextNotes:contextNotes};
});
