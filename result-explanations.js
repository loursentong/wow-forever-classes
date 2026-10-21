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
 // « Pourquoi cette piste » : part de chaque critère renseigné dans le score. Son poids est le
 // coefficient du moteur ramené aux seuls critères renseignés (codex, § 2.4) ; son adéquation est la
 // valeur après certitude. Arrondi au plus fort reste : les points font exactement le score affiché,
 // et les maximums 100.
 var partOrder=['roles','healStyles','activities','range','styles','pet','difficulty'];
 var partNames={roles:'Rôles',healStyles:'Façon de soigner',activities:'Activités',range:'Portée',styles:'Gameplay',pet:'Familiers',difficulty:'Complexité'};
 function apportion(raw,total,caps){
  var out=raw.map(function(v,i){return Math.min(Math.floor(v),caps?caps[i]:Infinity);});
  var left=total-out.reduce(function(a,b){return a+b;},0);
  // Les points ne peuvent pas dépasser le maximum affiché, lui-même arrondi.
  while(left>0){
   var available=raw.map(function(v,i){return {i:i,r:v-out[i]};})
    .filter(function(x){return !caps||out[x.i]<caps[x.i];}).sort(function(a,b){return b.r-a.r||a.i-b.i;});
   if(!available.length)break;
   out[available[0].i]++;left--;
  }
  return out;
 }
 function scoreParts(fit,score){
  var keys=partOrder.filter(function(k){return fit&&fit[k];});
  var denom=keys.reduce(function(t,k){return t+fit[k].weight;},0);
  if(!denom)return [];
  var max=apportion(keys.map(function(k){return 100*fit[k].weight/denom;}),100);
  var points=apportion(keys.map(function(k){return 100*fit[k].value*fit[k].weight/denom;}),Math.round(score),max);
  return keys.map(function(k,i){return {key:k,label:partNames[k],fit:Math.round(100*fit[k].value),points:points[i],max:max[i]};});
 }
 var answerNames={raid:'Donjons et raids',bg:'Champs de bataille',world:'PvP sauvage',solo:'Solo',
  burst:'Burst',zone:'Dégâts de zone',ctrl:'Contrôle',surv:'Survie',mob:'Mobilité',support:'Soutien',
  prevention:'Prévenir les dégâts',duree:'Soins sur la durée',cible:'Gros soins ciblés',groupe:'Soins de groupe',
  distance:'Jouer à distance',melee:'Jouer en mêlée',mixte:'Alterner distance et mêlée',
  like:'Jouer avec un familier',avoid:'Jouer sans familier',simple:'Jeu simple',complex:'Jeu exigeant'};
 var roleNames={tank:'Tank',soin:'Soin',dps:'Dégâts'};
 function number(v){return String(Math.round(v*10)/10).replace('.',',');}
 function answerLabel(a,p){return a.domain==='roles'?'Rôle : '+Object.keys(p.roles).map(function(k){return roleNames[k];}).join(' + '):answerNames[a.key];}
 function mainCause(a){return Object.keys(a.causes).sort(function(x,y){return a.causes[y]-a.causes[x];})[0];}
 function answerText(a,p){
  var text;
  if(a.domain==='healStyles'&&a.note===undefined){
   text='Cette spécialisation ne soigne pas : elle ne répond pas à cette envie.';
  }else if(a.note!==undefined){
   text='Repère de la spécialisation : '+number(a.note)+'/5.';
   if(Math.abs(a.note-a.adjusted)>.001)text+=' Avec ta maîtrise : '+number(a.adjusted)+'/5.';
  }else if(a.domain==='roles'){
   var many=Object.keys(p.roles).length>1;
   text=many?'Tes rôles sont évalués ensemble : la classe doit pouvoir les proposer, et la spécialisation retenue compte aussi.':
    'Ce choix tient compte du rôle de la spécialisation et de son aisance estimée en PvE.';
   text+=' Correspondance avec ce choix : '+Math.round(a.raw*100)+' %.';
  }else text='Cette spécialisation répond à '+Math.round(a.raw*100)+' % de ce choix.';
  if(a.certainty<5)text+=' Tu as indiqué '+number(a.certainty)+'/5 de certitude : le résultat est moins tranché.';
  return text;
 }
 function mainTradeoff(explanation){
  if(!explanation||!explanation.answers.length)return '';
  var a=explanation.answers.slice().sort(function(x,y){return y.loss-x.loss;})[0],p=explanation.profile;
  if(a.loss<.05)return 'Tes choix correspondent pleinement à cette piste dans nos estimations. Regarde si son style de jeu te plaît.';
  var label=answerLabel(a,p),cause=mainCause(a);
  if(cause==='certainty')return 'Tu hésites sur « '+label+' » ('+number(a.certainty)+'/5 de certitude). C’est ce qui retient le plus son score.';
  if(a.domain==='healStyles'&&a.note===undefined)return 'Ton envie « '+label+' » n’est pas remplie : cette spécialisation ne soigne pas.';
  if(cause==='mastery')return label+' : '+(a.adjusted!==undefined?number(a.adjusted)+'/5 avec ta maîtrise. ':'')+'Cette spécialisation demande de la pratique pour en profiter pleinement.';
  if(a.note!==undefined)return label+' : '+number(a.note)+'/5. C’est le principal compromis avec tes envies.';
  if(a.domain==='roles')return label+' : '+Math.round(a.raw*100)+' % de correspondance. C’est le principal compromis avec tes envies.';
  if(a.domain==='pet')return a.key==='like'?'Tu veux un familier. '+(explanation.spec.pet==='none'||explanation.spec.variant==='sans-familier'?'Le build présenté ici se joue sans compagnon.':'Il n’est pas au centre de cette spécialisation.'):
   'Tu préfères jouer sans familier, mais le build présenté ici en utilise un.';
  if(a.domain==='range')return a.key==='mixte'?'Tu veux alterner distance et mêlée. Cette classe ne propose pas les deux pour tes rôles.':
   'Tu veux jouer '+(a.key==='distance'?'à distance':'en mêlée')+', mais cette spécialisation se joue '+(explanation.spec.range==='distance'?'à distance.':'en mêlée.');
  return a.key==='simple'?'Tu veux un jeu simple. Cette spécialisation demande davantage de pratique.':'Tu cherches un jeu exigeant. Cette spécialisation est plutôt accessible.';
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
  if(spec.id==='chasseur-precision')return 'Précision est évaluée en Loup solitaire, sans familier. Le build avec compagnon n’est pas évalué ici.';
  if(!profile||!profile.pet||profile.pet.value!=='avoid')return '';
  if(spec.pet==='core')return 'Le familier est central dans cette spécialisation : cette piste répond moins bien à ton envie de jouer sans compagnon.';
  if(spec.pet!=='optional')return '';
  if(spec.variant!=='sans-familier')return 'Évaluée avec son compagnon : ce build répond mieux à l’ensemble de tes choix. Pour jouer uniquement sans familier, coche l’exigence absolue.';
  return petless[spec.id]||'Évaluée sans familier.';
 }
 // Façon de soigner (référence v9) : deux choix au plus, retenus avec le rôle Soin.
 // Les configurations hors soin ne répondent pas à cette préférence.
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
   out.push(heal.length?'Ta façon de soigner ('+heal.map(function(k){return healNames[k];}).join(', ')+') départage les spécialisations de soin. Les autres rôles répondent moins bien à cette envie.':
    'Tu peux préciser ta façon de soigner à la question 1 : elle départage les spécialisations de soin.');
  }else if(w&&w.soin>0)
   out.push('Ce comparateur ne départage pas les façons de soigner : le parcours guidé le fait à la question 1, et la fiche de chaque spécialisation de soin les décrit.');
  return out;
 }
 return {criteria:criteria,ranks:ranks,rankHint:rankHint,scoreParts:scoreParts,answerLabel:answerLabel,answerText:answerText,mainTradeoff:mainTradeoff,number:number,tieNote:tieNote,petNotice:petNotice,contextNotes:contextNotes,healChoices:healChoices};
});
