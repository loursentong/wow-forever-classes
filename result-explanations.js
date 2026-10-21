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
 function scoreParts(fit,score,order,names){
  order=order||partOrder;names=names||partNames;
  var keys=order.filter(function(k){return fit&&fit[k];});
  var denom=keys.reduce(function(t,k){return t+fit[k].weight;},0);
  if(!denom)return [];
  var max=apportion(keys.map(function(k){return 100*fit[k].weight/denom;}),100);
  var points=apportion(keys.map(function(k){return 100*fit[k].value*fit[k].weight/denom;}),Math.round(score),max);
  return keys.map(function(k,i){return {key:k,label:names[k],fit:Math.round(100*fit[k].value),points:points[i],max:max[i]};});
 }
 // Mode personnalisé : mêmes règles de lecture, sur les groupes et critères du classement à 14 priorités
 // (priorityExplain du moteur). Le poids 1 à 3 est l'importance donnée au critère.
 var priorityGroups=['roles','activities','style','affinity'];
 var priorityGroupNames={roles:'Rôles',activities:'Activités',style:'Style de combat',affinity:'Affinités'};
 var priorityAxisNames={tank:'Tank',soin:'Soin',dps:'DPS PvE',bg:'Champ de bataille',sauv:'PvP sauvage',solo:'Solo / leveling',
  burst:'Burst',zone:'Dégâts de zone',ctrl:'Contrôle',surv:'Résistance',mob:'Mobilité',util:'Soutien',poly:'Polyvalence',tech:'Technicité'};
 var roleVerbs={tank:'ne tank pas',soin:'ne soigne pas',dps:'n’est pas une spécialisation de dégâts'};
 /* Lecture d'un critère ou d'une réponse en trois temps (révision du 21 octobre 2026) :
  * « La spécialisation » (sa note de référence, sur 5, et l'effet de ta maîtrise), « Ton choix »
  * (ta certitude ou ton poids), puis « Donc » (ce que cela donne). Une note de 1 à 5 vaut 0 à 100 % ;
  * une certitude inférieure à 5 rapproche le résultat de 50 % (preferenceFit du moteur). */
 var masteryNames=['Débutant','Intermédiaire','Confirmé','Expert'];
 var certaintyWords=['intuition','très hésitant','hésitant','assez sûr','très sûr','certain'];
 function percent(v){return Math.round(v*100)+'\u00a0%';}
 function verdict(v){
  // Même arrondi que le pourcentage affiché à côté.
  var raw=Math.round(v*100)/100;
  return raw>=.9?'elle y répond pleinement':raw>=.7?'elle y répond bien':raw>=.45?'elle y répond en partie':raw>=.15?'elle y répond peu':'elle n’y répond pas';
 }
 function noteLine(a,mastery){
  var t=number(a.note)+'/5 (note de référence)';
  if(a.adjusted!==undefined&&Math.abs(a.note-a.adjusted)>.001)t+=' · '+number(a.adjusted)+'/5 avec ta maîtrise ('+(masteryNames[mastery]||'').toLowerCase()+')';
  return t;
 }
 function lines(spec,choice,conclusion){return [{lead:'La spécialisation',text:spec},{lead:'Ton choix',text:choice},{lead:'Donc',text:conclusion}];}
 function priorityAxisLines(a,ex){
  var s=ex&&ex.spec||{},spec;
  if(a.group==='roles')spec=a.raw>0?'joue ce rôle · aisance estimée en PvE : '+percent(a.raw):
   'ne joue pas ce rôle'+(roleNames[s.role]?' (rôle '+roleNames[s.role]+')':'');
  else if(a.note!==undefined)spec=noteLine(a,ex&&ex.mastery);
  else if(a.key==='poly')spec='sa classe propose '+a.roles+' rôle'+(a.roles>1?'s':'');
  else spec='difficulté '+number(a.load)+'/5 en moyenne PvE et PvP (note de référence)';
  var choice='poids '+a.weight+' sur 3'+(a.share<1?' · '+percent(a.share)+' du groupe « '+priorityGroupNames[a.group]+' »':'');
  return lines(spec,choice,verdict(a.raw)+' : '+percent(a.raw)+'.');
 }
 function priorityParts(ex,score){
  if(!ex)return [];
  return scoreParts(ex.parts,score,priorityGroups,priorityGroupNames).map(function(g){
   g.axes=ex.axes.filter(function(a){return a.group===g.key;}).map(function(a){
    var l=priorityAxisLines(a,ex);
    return {key:a.key,label:priorityAxisNames[a.key],lines:l,text:l.map(function(x){return x.lead+' : '+x.text;}).join(' ')};
   });
   return g;
  });
 }
 function priorityTradeoff(ex){
  if(!ex)return '';
  var denom=Object.keys(ex.parts).reduce(function(t,k){return t+ex.parts[k].weight;},0);
  var worst=null;
  ex.axes.forEach(function(a){
   var loss=100*ex.parts[a.group].weight/denom*a.share*(1-a.raw);
   if(!worst||loss>worst.loss)worst={a:a,loss:loss};
  });
  if(!worst||worst.loss<.5)return 'Elle répond à presque tous tes critères dans nos estimations.';
  var a=worst.a,label=priorityAxisNames[a.key];
  if(a.group==='roles'&&a.raw===0)return label+' (poids '+a.weight+') : cette spécialisation '+roleVerbs[a.key]+'. C’est ce qui retient le plus son score.';
  return label+' (poids '+a.weight+') : '+priorityAxisLines(a,ex)[0].text+'. C’est le principal écart avec tes critères.';
 }
 // Intitulés des réponses : ceux du questionnaire, pour que le joueur retrouve ce qu'il a choisi.
 var answerNames={raid:'Donjons et raids',bg:'Champs de bataille',world:'PvP sauvage et duel',solo:'Solo et farm',
  burst:'Dégâts explosifs',zone:'Dégâts de zone',ctrl:'Contrôle',surv:'Résistance',mob:'Mobilité',support:'Soutien',
  prevention:'Prévenir les dégâts',duree:'Soins sur la durée',cible:'Gros soins ciblés',groupe:'Soigner tout le groupe',
  distance:'À distance',melee:'Au corps-à-corps',mixte:'Pouvoir alterner distance et mêlée',
  like:'J’aime les familiers',avoid:'Je préfère éviter les familiers',simple:'Type de difficulté : accessible',complex:'Type de difficulté : exigeant'};
 var roleNames={tank:'Tank',soin:'Soin',dps:'DPS'};
 function number(v){return String(Math.round(v*10)/10).replace('.',',');}
 function answerLabel(a,p){
  var keys=Object.keys(p&&p.roles||{});
  return a.domain==='roles'?(keys.length>1?'Rôles : ':'Rôle : ')+keys.map(function(k){return roleNames[k];}).join(' + '):answerNames[a.key];
 }
 function mainCause(a){return Object.keys(a.causes).sort(function(x,y){return a.causes[y]-a.causes[x];})[0];}
 function difficultyContext(p){
  var acts=Object.keys(p&&p.activities||{}),pve=acts.some(function(k){return k==='raid'||k==='solo';}),pvp=acts.some(function(k){return k==='bg'||k==='world';});
  return pve&&!pvp?'pve':pvp&&!pve?'pvp':'mixte';
 }
 function roleSpecLine(a,p,s){
  var keys=Object.keys(p&&p.roles||{}),aptitude=a.aptitude!==undefined?' · aisance estimée en PvE : '+percent(a.aptitude):'';
  var other=roleNames[s.role]?' (rôle '+roleNames[s.role]+')':'';
  if(keys.length<2)return a.raw>0?'joue ce rôle'+aptitude:'ne joue pas ce rôle'+other;
  var covered=a.covered||[],missing=keys.filter(function(k){return covered.indexOf(k)<0;});
  return 'sa classe '+(covered.length?'propose '+covered.map(function(k){return roleNames[k];}).join(' et '):'ne propose aucun de ces rôles')+
   (missing.length&&covered.length?', pas '+missing.map(function(k){return roleNames[k];}).join(' ni '):'')+
   ' ; cette spécialisation joue '+(roleNames[s.role]||'son rôle')+aptitude;
 }
 // Familier : d'après la configuration évaluée ; à défaut, d'après l'adéquation du moteur.
 function petLine(a,s){
  if(s.pet==='none')return 'se joue sans familier';
  if(s.variant==='sans-familier')return 'évaluée sans son familier, facultatif';
  if(s.pet==='core')return 'le familier est au cœur de son jeu';
  if(s.pet==='optional')return 'joue avec un familier, facultatif';
  return a.key==='like'?(a.raw>=1?'le familier est au cœur de son jeu':a.raw>.5?'joue avec un familier, facultatif':'se joue sans familier'):
   (a.raw>=1?'se joue sans familier':'joue avec un familier');
 }
 function answerLines(a,ex){
  var p=ex&&ex.profile||{},s=ex&&ex.spec||{},spec;
  if(a.domain==='healStyles'&&a.note===undefined)spec='ne soigne pas';
  else if(a.note!==undefined)spec=noteLine(a,p.mastery);
  else if(a.domain==='roles')spec=roleSpecLine(a,p,s);
  else if(a.domain==='range')spec=a.key==='mixte'?(a.raw>=1?'sa classe propose distance et mêlée pour tes rôles':'sa classe ne propose qu’une seule portée pour tes rôles'):
   'se joue '+((a.raw>=1)===(a.key==='distance')?'à distance':'en mêlée');
  else if(a.domain==='pet')spec=petLine(a,s);
  else{
   var load=a.key==='simple'?5-4*a.raw:1+4*a.raw,ctx=difficultyContext(p);
   spec='difficulté '+number(load)+'/5 '+(ctx==='pve'?'en PvE':ctx==='pvp'?'en PvP':'en moyenne PvE et PvP')+' (note de référence)';
  }
  var multi=a.domain==='roles'&&Object.keys(p.roles||{}).length>1;
  var choice='certitude '+(multi?'moyenne ':'')+number(a.certainty)+'/5 ('+certaintyWords[Math.round(a.certainty)]+')';
  if(a.domain==='roles'&&p.rolesStrict)choice+=multi?' · tous ces rôles indispensables':' · rôle indispensable';
  if(a.domain==='range'&&p.range&&p.range.strict)choice+=' · exigence absolue';
  if(a.domain==='pet'&&p.pet&&p.pet.strict)choice+=' · uniquement sans familier';
  var conclusion=verdict(a.raw)+(Math.abs(a.fit-a.raw)<.005?' : '+percent(a.raw)+'.':' ('+percent(a.raw)+') ; compte tenu de ta certitude, '+percent(a.fit)+'.');
  if(a.domain==='roles'&&a.aptitude!==undefined&&a.raw>0)conclusion+=multi?' Ce que propose sa classe compte pour 65 %, la spécialisation retenue pour 35 %.':
   Math.abs(a.raw-a.aptitude)>.005?' Jouer ce rôle compte pour un quart, son aisance pour le reste.':'';
  return lines(spec,choice,conclusion);
 }
 function escape(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 function answerHtml(title,steps){
  return '<div class="reco-answer"><b class="reco-answer-title">'+escape(title)+'</b><dl class="reco-answer-steps">'+steps.map(function(l,i){
   return '<div'+(i===steps.length-1?' class="is-result"':'')+'><dt>'+escape(l.lead)+'</dt><dd>'+escape(l.text)+'</dd></div>';
  }).join('')+'</dl></div>';
 }
 function answerText(a,p,spec){
  return answerLines(a,{profile:p,spec:spec}).map(function(x){return x.lead+' : '+x.text;}).join(' ');
 }
 function mainTradeoff(explanation){
  if(!explanation||!explanation.answers.length)return '';
  var a=explanation.answers.slice().sort(function(x,y){return y.loss-x.loss;})[0],p=explanation.profile;
  if(a.loss<.05)return 'Tes choix correspondent pleinement à cette piste dans nos estimations. Regarde si son style de jeu te plaît.';
  var label=answerLabel(a,p),cause=mainCause(a);
  var named=a.domain==='roles'?(Object.keys(p.roles).length>1?'Tes rôles ':'Ton rôle ')+Object.keys(p.roles).map(function(k){return roleNames[k];}).join(' + '):label;
  if(cause==='certainty')return 'Tu hésites sur « '+label+' » ('+number(a.certainty)+'/5 de certitude). C’est ce qui retient le plus son score.';
  if(a.domain==='healStyles'&&a.note===undefined)return 'Ton envie « '+label+' » n’est pas remplie : cette spécialisation ne soigne pas.';
  if(cause==='mastery')return named+' : '+(a.note!==undefined?number(a.note)+'/5 en note de référence, '+number(a.adjusted)+'/5 avec ta maîtrise ('+(masteryNames[p.mastery]||'').toLowerCase()+'). Cette':'cette')+
   ' spécialisation demande de la pratique pour en profiter pleinement.';
  if(a.note!==undefined)return label+' : '+number(a.note)+'/5 pour cette spécialisation (note de référence). C’est le principal compromis avec tes envies.';
  if(a.domain==='roles')return named+' : '+Math.round(a.raw*100)+' % de correspondance. C’est le principal compromis avec tes envies.';
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
   var ctx=difficultyContext(p);
   out.push(ctx==='pve'?'Ton rapport à la difficulté est comparé à la difficulté PvE de chaque spécialisation, puisque tes activités sont en PvE.':
    ctx==='pvp'?'Ton rapport à la difficulté est comparé à la difficulté PvP de chaque spécialisation, puisque tes activités sont en PvP.':
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
 return {criteria:criteria,ranks:ranks,rankHint:rankHint,scoreParts:scoreParts,priorityParts:priorityParts,priorityTradeoff:priorityTradeoff,answerLabel:answerLabel,answerLines:answerLines,answerHtml:answerHtml,answerText:answerText,certaintyWords:certaintyWords,mainTradeoff:mainTradeoff,number:number,tieNote:tieNote,petNotice:petNotice,contextNotes:contextNotes,healChoices:healChoices};
});
