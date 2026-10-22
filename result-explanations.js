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
  // Depuis la v10, une classe peut revenir : la spécialisation est nommée avec elle.
  var n=rows.map(function(r){return 'le '+(r.className||r.spec.className)+(r.spec&&r.spec.label?' '+r.spec.label:'');});
  return n.length>1?n.slice(0,-1).join(', ')+' et '+n[n.length-1]:n[0];
 }
 function rankHint(results,i){
  var row=results[i];
  if(!row)return '';
  var same=results.filter(function(r,j){return j!==i&&r.score===row.score;});
  if(same.length)return 'à égalité avec '+(same.length>2?same.length+' autres spécialisations':names(same));
  if(i===0)return '';
  var gap=results[i-1].score-row.score;
  if(!(gap<2.01))return '';
  var above=results.filter(function(r){return r.score===results[i-1].score;});
  var v=Math.round(gap*10)/10,points=v<0.1?'moins de 0,1 point':String(v).replace('.',',')+(v>=2?' points':' point');
  return points+' derrière '+(above.length>2?'les '+above.length+' spécialisations à égalité au-dessus':names(above));
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
 // (priorityExplain du moteur). La priorité 1 à 3 est l'importance donnée au critère.
 var priorityGroups=['roles','activities','style','affinity'];
 var priorityGroupNames={roles:'Rôles',activities:'Activités',style:'Style de combat',affinity:'Affinités'};
 var priorityAxisNames={tank:'Tank',soin:'Soin',dps:'DPS PvE',bg:'Champ de bataille',sauv:'PvP sauvage',solo:'Solo / leveling',
  burst:'Burst',zone:'Dégâts de zone',ctrl:'Contrôle',surv:'Résistance',mob:'Mobilité',util:'Soutien',poly:'Polyvalence',tech:'Technicité'};
 var priorityWords=['sans importance','secondaire','importante','essentielle'];
 /* « Pourquoi cette piste » et « Pourquoi cette place » (révision du 21 octobre 2026, soir) : chaque
  * critère se lit en trois lignes, avec le nom de la spécialisation et des mots avant les chiffres.
  * « La spécialisation » : sa note pour ce critère, puis l'effet de ta maîtrise ; « Ton choix » : ta
  * certitude ou ta priorité ; « Constat » : à quel point elle y répond. Une note de 1 à 5 vaut 0 à
  * 100 % ; une certitude inférieure à 5 adoucit le résultat vers 50 % (preferenceFit du moteur).
  * En tête, le bilan des points qui manquent, groupe par groupe. */
 var masteryNames=['Débutant','Intermédiaire','Confirmé','Expert'];
 var certaintyWords=['intuition','très hésitant','hésitant','assez sûr','très sûr','certain'];
 var roleNames={tank:'Tank',soin:'Soin',dps:'DPS'};
 var noteWhere={activities:'pour cette activité',styles:'pour ce style',style:'pour ce style',healStyles:'pour cette façon de soigner'};
 function number(v){return String(Math.round(v*10)/10).replace('.',',');}
 function percent(v){return Math.round(v*100)+' %';}
 function capital(t){return t.charAt(0).toUpperCase()+t.slice(1);}
 function list(items){return items.length>1?items.slice(0,-1).join(', ')+' et '+items[items.length-1]:items[0]||'';}
 // « la note de Finesse », « la note d’Affliction ».
 function of(name){return (/^[aeiouyàâéèêëîïôûh]/i.test(name)?'d’':'de ')+name;}
 function verdict(v){
  // Même arrondi que le pourcentage affiché à côté.
  var raw=Math.round(v*100)/100;
  return raw>=.9?'elle y répond pleinement':raw>=.7?'elle y répond bien':raw>=.45?'elle y répond en partie':raw>=.15?'elle y répond peu':'elle n’y répond pas';
 }
 function lines(spec,choice,result){return [{lead:'La spécialisation',text:spec},{lead:'Ton choix',text:choice},{lead:'Constat',text:result}];}
 function specNames(s){return {spec:s&&s.label||'Cette spécialisation',cls:s&&s.className?'La classe '+s.className:'Sa classe'};}
 function noted(name,a,where,mastery){
  return name+' est notée '+number(a.note)+'/5 '+where+
   (a.adjusted!==undefined&&Math.abs(a.note-a.adjusted)>.001?', '+number(a.adjusted)+'/5 avec ta maîtrise ('+(masteryNames[mastery]||'').toLowerCase()+')':'')+'.';
 }
 function priorityAxisLines(a,ex){
  var s=ex&&ex.spec||{},n=specNames(s),spec;
  if(a.group==='roles')spec=a.raw>0?n.spec+' joue ce rôle ; aisance estimée en PvE : '+percent(a.raw)+'.':
   n.spec+' ne joue pas ce rôle'+(roleNames[s.role]?' (spécialisation '+roleNames[s.role]+')':'')+'.';
  else if(a.note!==undefined)spec=noted(n.spec,a,noteWhere[a.group],ex&&ex.mastery);
  else if(a.key==='poly')spec=n.cls+(a.roles>1?' propose '+a.roles+' rôles.':' ne propose qu’un rôle.');
  // Technicité (v10) : difficulté PvE, PvP ou moyenne, selon tes critères d'activité.
  else spec=n.spec+' est notée '+number(a.load)+'/5 en difficulté '+(a.context==='pve'?'PvE':a.context==='pvp'?'PvP':'(moyenne PvE et PvP)')+'.';
  return lines(spec,'Priorité '+priorityWords[a.weight]+' ('+a.weight+')',capital(verdict(a.raw))+' ('+percent(a.raw)+').');
 }
 // Une ligne par groupe de plusieurs critères : comment ils se partagent ses points.
 function priorityGroupNote(axes){
  if(axes.length<2)return '';
  if(axes.every(function(a){return a.weight===axes[0].weight;}))return 'Tes '+axes.length+' critères ont la même priorité : ils comptent autant.';
  return 'Chaque critère compte selon ta priorité : '+list(axes.map(function(a){return priorityAxisNames[a.key]+' '+percent(a.share);}))+'.';
 }
 function priorityParts(ex,score){
  if(!ex)return [];
  return scoreParts(ex.parts,score,priorityGroups,priorityGroupNames).map(function(g){
   var axes=ex.axes.filter(function(a){return a.group===g.key;});
   g.note=priorityGroupNote(axes);
   g.axes=axes.map(function(a){
    var l=priorityAxisLines(a,ex);
    return {key:a.key,label:priorityAxisNames[a.key],lines:l,text:l.map(function(x){return x.lead+' : '+x.text;}).join(' ')};
   });
   return g;
  });
 }
 // « Pourquoi N sur 100 ? » : les points qui manquent, groupe par groupe, avec le critère qui en coûte le plus.
 // Un groupe pleinement satisfait peut perdre un point à l'arrondi : il est alors signalé comme tel.
 var groupOn={roles:'les rôles',healStyles:'la façon de soigner',activities:'les activités',range:'la portée',styles:'le gameplay',
  pet:'les familiers',difficulty:'la complexité',style:'le style de combat',affinity:'les affinités'};
 function missingSummary(parts,score,full,culprit){
  var total=100-Math.round(score);
  if(total<=0)return full;
  return 'Il lui manque '+total+' point'+(total>1?'s':'')+' : '+list(parts.filter(function(g){return g.max>g.points;}).map(function(g){
   return (g.max-g.points)+' sur '+groupOn[g.key]+' ('+(g.fit>=100?'arrondi':culprit(g))+')';
  }))+'.';
 }
 function priorityMissing(ex,score){
  if(!ex)return '';
  return missingSummary(priorityParts(ex,score),score,'Elle répond pleinement à tes critères.',function(g){
   var axes=ex.axes.filter(function(a){return a.group===g.key;}).sort(function(x,y){return y.share*(1-y.raw)-x.share*(1-x.raw);});
   return priorityAxisNames[axes[0].key];
  });
 }
 // Intitulés des réponses : ceux du questionnaire, pour que le joueur retrouve ce qu'il a choisi.
 var answerNames={raid:'Donjons et raids',bg:'Champs de bataille',world:'PvP sauvage et duel',solo:'Solo et farm',
  burst:'Dégâts explosifs',zone:'Dégâts de zone',ctrl:'Contrôle',surv:'Résistance',mob:'Mobilité',support:'Soutien',
  prevention:'Prévenir les dégâts',duree:'Soins sur la durée',cible:'Gros soins ciblés',groupe:'Soigner tout le groupe',
  distance:'À distance',melee:'Au corps-à-corps',mixte:'Pouvoir alterner distance et mêlée',
  like:'J’aime les familiers',avoid:'Je préfère éviter les familiers',simple:'Type de difficulté : accessible',complex:'Type de difficulté : exigeant'};
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
  var n=specNames(s),keys=Object.keys(p&&p.roles||{});
  if(keys.length<2)return a.raw>0?n.spec+' joue ce rôle'+(a.aptitude!==undefined?' ; aisance estimée en PvE : '+percent(a.aptitude):'')+'.':
   n.spec+' ne joue pas ce rôle'+(roleNames[s.role]?' (spécialisation '+roleNames[s.role]+')':'')+'.';
  var covered=a.covered||[],missing=keys.filter(function(k){return covered.indexOf(k)<0;});
  return n.cls+(covered.length?' propose '+list(covered.map(function(k){return roleNames[k];})):' ne propose aucun de ces rôles')+
   (missing.length&&covered.length?', pas '+missing.map(function(k){return roleNames[k];}).join(' ni '):'')+
   ' ; '+n.spec+' joue '+(roleNames[s.role]||'son rôle')+(a.aptitude!==undefined?' (aisance estimée en PvE : '+percent(a.aptitude)+')':'')+'.';
 }
 // Familier : d'après la configuration évaluée ; à défaut, d'après l'adéquation du moteur.
 function petLine(a,s){
  var name=specNames(s).spec;
  if(s.pet==='none')return name+' se joue sans familier.';
  if(s.variant==='sans-familier')return name+' est évaluée sans son familier, facultatif.';
  if(s.pet==='core')return name+' repose sur son familier.';
  if(s.pet==='optional')return name+' joue avec un familier, facultatif.';
  return a.key==='like'?(a.raw>=1?name+' repose sur son familier.':a.raw>.5?name+' joue avec un familier, facultatif.':name+' se joue sans familier.'):
   (a.raw>=1?name+' se joue sans familier.':name+' joue avec un familier.');
 }
 function answerLines(a,ex){
  var p=ex&&ex.profile||{},s=ex&&ex.spec||{},n=specNames(s),spec;
  if(a.domain==='healStyles'&&a.note===undefined)spec=n.spec+' ne soigne pas.';
  else if(a.note!==undefined)spec=noted(n.spec,a,noteWhere[a.domain],p.mastery);
  else if(a.domain==='roles')spec=roleSpecLine(a,p,s);
  else if(a.domain==='range')spec=a.key==='mixte'?n.cls+(a.raw>=1?' propose distance et mêlée pour tes rôles.':' ne propose qu’une seule portée pour tes rôles.'):
   n.spec+' se joue '+((a.raw>=1)===(a.key==='distance')?'à distance':'en mêlée')+'.';
  else if(a.domain==='pet')spec=petLine(a,s);
  else{
   var load=a.key==='simple'?5-4*a.raw:1+4*a.raw,ctx=difficultyContext(p);
   spec=n.spec+' est notée '+number(load)+'/5 en difficulté '+(ctx==='pve'?'PvE':ctx==='pvp'?'PvP':'(moyenne PvE et PvP)')+'.';
  }
  var multi=a.domain==='roles'&&Object.keys(p.roles||{}).length>1;
  var choice=capital(certaintyWords[Math.round(a.certainty)])+' (certitude '+(multi?'moyenne ':'')+number(a.certainty)+'/5)';
  if(a.domain==='roles'&&p.rolesStrict)choice+=multi?' · tous ces rôles indispensables':' · rôle indispensable';
  if(a.domain==='range'&&p.range&&p.range.strict)choice+=' · exigence absolue';
  if(a.domain==='pet'&&p.pet&&p.pet.strict)choice+=' · uniquement sans familier';
  var result=capital(verdict(a.raw))+' ('+percent(a.raw)+')'+(Math.abs(a.fit-a.raw)<.005?'.':', adouci à '+percent(a.fit)+' par ta certitude.');
  if(a.domain==='roles'&&a.aptitude!==undefined&&a.raw>0)result+=multi?' Les rôles que propose sa classe comptent pour '+percent(.65)+', la spécialisation retenue pour '+percent(.35)+'.':
   Math.abs(a.raw-a.aptitude)>.005?' Le rôle compte pour un quart, l’aisance pour le reste.':'';
  return lines(spec,choice,result);
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
 // Parcours guidé : groupes de « Pourquoi cette piste », avec leurs réponses et, s'il y en a plusieurs, leur moyenne.
 function pisteParts(ex,fit,score){
  if(!ex)return [];
  return scoreParts(fit,score).map(function(g){
   var answers=ex.answers.filter(function(a){return a.domain===g.key;});
   g.note=answers.length>1?'Moyenne de tes '+answers.length+' choix : '+list(answers.map(function(a){return percent(a.fit);}))+'.':'';
   g.answers=answers.map(function(a){return {label:answerLabel(a,ex.profile),lines:answerLines(a,ex)};});
   return g;
  });
 }
 function pisteMissing(ex,fit,score){
  if(!ex)return '';
  return missingSummary(scoreParts(fit,score),score,'Elle répond pleinement à tes choix.',function(g){
   var a=ex.answers.filter(function(x){return x.domain===g.key;}).sort(function(x,y){return y.loss-x.loss;})[0];
   return answerLabel(a,ex.profile).replace(/^Rôles? : /,'')+(mainCause(a)==='certainty'?' : certitude '+number(a.certainty)+'/5':'');
  });
 }
 // « À garder en tête » : la réponse qui coûte le plus de points, en une phrase qui situe la classe, la
 // spécialisation et le critère : « Le Chasseur Maîtrise des bêtes est noté 3/5 en résistance : c'est ce
 // qui lui coûte le plus de points. » Les classes sont toutes au masculin (le, au, du).
 var criterionIn={raid:'en donjons et raids',bg:'en champs de bataille',world:'en PvP sauvage et duel',solo:'en solo et farm',
  burst:'en dégâts explosifs',zone:'en dégâts de zone',ctrl:'en contrôle',surv:'en résistance',mob:'en mobilité',support:'en soutien',
  prevention:'pour prévenir les dégâts',duree:'en soins sur la durée',cible:'en gros soins ciblés',groupe:'pour soigner tout le groupe'};
 function mainTradeoff(explanation){
  if(!explanation||!explanation.answers.length)return '';
  var a=explanation.answers.slice().sort(function(x,y){return y.loss-x.loss;})[0],p=explanation.profile,s=explanation.spec||{};
  var full=s.className&&s.label?s.className+' '+s.label:'',le=full?'le '+full:'cette spécialisation',Le=capital(le);
  var noted=full?' est noté ':' est notée ',he=full?'il':'elle',cost=' : c’est ce qui lui coûte le plus de points.';
  var level=(masteryNames[p.mastery]||'').toLowerCase(),roles=Object.keys(p.roles||{}).map(function(k){return roleNames[k];}),multi=roles.length>1;
  if(a.loss<.05)return Le+' répond pleinement à tes choix dans nos estimations : regarde si son style de jeu te plaît.';
  var label=answerLabel(a,p),cause=mainCause(a);
  if(cause==='certainty')return 'Tu hésites sur « '+label+' » (certitude '+number(a.certainty)+'/5) : c’est ce qui coûte le plus de points '+(full?'au '+full:'à cette spécialisation')+'.';
  if(a.domain==='healStyles'&&a.note===undefined)return Le+' ne soigne pas : ton envie « '+label+' » n’est pas remplie.';
  if(a.note!==undefined)return Le+noted+number(a.note)+'/5 '+criterionIn[a.key]+
   (cause==='mastery'?', '+number(a.adjusted)+'/5 avec ta maîtrise ('+level+') : '+he+' demande de la pratique pour en profiter pleinement.':cost);
  if(a.domain==='roles'){
   if(cause==='mastery')return Le+' demande de la pratique pour bien jouer '+(multi?'tes rôles '+roles.join(' + '):'le rôle '+roles[0])+' à ton niveau ('+level+')'+cost;
   if(a.raw<.005)return Le+(multi?' ne joue aucun de tes rôles ('+roles.join(' + ')+')':' ne joue pas le rôle '+roles[0])+cost;
   if(!multi)return 'En '+roles[0]+', '+le+' a une aisance estimée à '+percent(a.aptitude!==undefined?a.aptitude:a.raw)+' en PvE'+cost;
   return 'Pour tes rôles '+roles.join(' + ')+', '+le+' obtient '+percent(a.raw)+' de correspondance'+cost;
  }
  if(a.domain==='pet')return a.key==='like'?(s.pet==='none'||s.variant==='sans-familier'?'Tu veux un familier, mais '+le+' est évalué ici sans compagnon.':
   'Tu veux un familier, mais il n’est pas au centre du jeu '+(full?'du '+full:'de cette spécialisation')+'.'):
   'Tu préfères jouer sans familier, mais '+le+' présenté ici en utilise un.';
  if(a.domain==='range')return a.key==='mixte'?'Tu veux alterner distance et mêlée, mais '+(s.className?'la classe '+s.className:'cette classe')+' ne propose pas les deux pour tes rôles.':
   'Tu veux jouer '+(a.key==='distance'?'à distance':'en mêlée')+', mais '+le+' se joue '+(s.range==='distance'?'à distance.':'en mêlée.');
  var load=a.key==='simple'?5-4*a.raw:1+4*a.raw,ctx=difficultyContext(p),where=ctx==='pve'?' en PvE':ctx==='pvp'?' en PvP':' en moyenne PvE et PvP';
  return a.key==='simple'?'Tu veux un jeu accessible, mais '+le+' demande davantage de pratique : difficulté '+number(load)+'/5'+where+'.':
   'Tu cherches un jeu exigeant, mais '+le+' est plutôt accessible : difficulté '+number(load)+'/5'+where+'.';
 }
 function tieNote(results){
  if(!results.length)return '';
  var top=results.filter(function(r){return r.score===results[0].score;});
  if(top.length<2)return '';
  return 'À égalité en tête : '+top.map(function(r){return (r.className||r.spec.className)+(r.spec&&r.spec.label?' '+r.spec.label:'');}).join(', ')+'. L’ordre d’affichage ne les départage pas.';
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
 return {criteria:criteria,ranks:ranks,rankHint:rankHint,scoreParts:scoreParts,priorityParts:priorityParts,priorityMissing:priorityMissing,pisteParts:pisteParts,pisteMissing:pisteMissing,of:of,priorityWords:priorityWords,answerLabel:answerLabel,answerLines:answerLines,answerHtml:answerHtml,answerText:answerText,certaintyWords:certaintyWords,mainTradeoff:mainTradeoff,number:number,tieNote:tieNote,petNotice:petNotice,contextNotes:contextNotes,healChoices:healChoices};
});
