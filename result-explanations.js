/* Présentation des résultats existants : aucun score, tri ou filtre modifié. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./configuration-details.js'));
 else root.WFResultExplanations=factory(root.WFConfigurationDetails);
})(typeof globalThis==='object'?globalThis:this,function(details){
 'use strict';
 // Référentiel de complexité (v11) : ce qui pèse dans la difficulté d'un contexte, mêmes mots que la fiche.
 function complexityWhy(s,ctx){
  var w=(ctx==='pve'||ctx==='pvp')&&details&&details.complexity?details.complexity.weighs(s,ctx):'';
  return w?' : '+w:'';
 }
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
  // lost : points perdus avant arrondi, pour départager deux groupes qui en perdent autant à l'affichage.
  return keys.map(function(k,i){return {key:k,label:names[k],fit:Math.round(100*fit[k].value),points:points[i],max:max[i],
   lost:100*fit[k].weight/denom*(1-fit[k].value)};});
 }
 // Groupes qui perdent des points, du plus coûteux au moins coûteux (ordre d'affichage à égalité exacte).
 function costly(parts){
  return parts.filter(function(g){return g.max>g.points;}).sort(function(x,y){return (y.max-y.points)-(x.max-x.points)||y.lost-x.lost;});
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
  * En tête, le bilan des points qui manquent, du groupe qui en perd le plus à celui qui en perd le moins. */
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
 // Degré de réponse d'une spécialisation à un choix : mêmes mots dans le constat, « Correspond à tes
 // envies » et « À garder en tête ». Même arrondi que le pourcentage affiché à côté.
 function level(v){
  var raw=Math.round(v*100)/100;
  return raw>=.9?'pleinement':raw>=.7?'bien':raw>=.45?'en partie':raw>=.15?'peu':'pas';
 }
 function verdict(v){var l=level(v);return l==='pas'?'elle n’y répond pas':'elle y répond '+l;}
 function lines(spec,choice,result){return [{lead:'La spécialisation',text:spec},{lead:'Ton choix',text:choice},{lead:'Constat',text:result}];}
 function specNames(s){return {spec:s&&s.label||'Cette spécialisation',cls:s&&s.className?'La classe '+s.className:'Sa classe'};}
 // La note avec ta maîtrise n'est écrite que si elle diffère une fois arrondie : jamais « 3/5, 3/5 avec ta maîtrise ».
 function masteryShown(a){return a.adjusted!==undefined&&number(a.note)!==number(a.adjusted);}
 function noted(name,a,where,mastery){
  return name+' est notée '+number(a.note)+'/5 '+where+
   (masteryShown(a)?', '+number(a.adjusted)+'/5 avec ta maîtrise ('+(masteryNames[mastery]||'').toLowerCase()+')':'')+'.';
 }
 function priorityAxisLines(a,ex){
  var s=ex&&ex.spec||{},n=specNames(s),spec;
  if(a.group==='roles')spec=a.raw>0?n.spec+' joue ce rôle ; aisance estimée en PvE : '+percent(a.raw)+'.':
   n.spec+' ne joue pas ce rôle'+(roleNames[s.role]?' (spécialisation '+roleNames[s.role]+')':'')+'.';
  else if(a.note!==undefined)spec=noted(n.spec,a,noteWhere[a.group],ex&&ex.mastery);
  else if(a.key==='poly')spec=n.cls+(a.roles>1?' propose '+a.roles+' rôles.':' ne propose qu’un rôle.');
  // Technicité (v10) : difficulté PvE, PvP ou moyenne, selon tes critères d'activité.
  else spec=n.spec+' est notée '+number(a.load)+'/5 en difficulté '+(a.context==='pve'?'PvE':a.context==='pvp'?'PvP':'(moyenne PvE et PvP)')+complexityWhy(s,a.context)+'.';
  return lines(spec,'Priorité '+priorityWords[a.weight]+' ('+a.weight+')',capital(verdict(a.raw))+' ('+percent(a.raw)+').');
 }
 // Une ligne par groupe de plusieurs critères : comment ils se partagent ses points.
 function priorityGroupNote(axes){
  if(axes.length<2)return '';
  if(axes.every(function(a){return a.weight===axes[0].weight;}))return 'Tes '+axes.length+' critères ont la même priorité : ils comptent autant.';
  return 'Chaque critère compte selon ta priorité : '+list(axes.map(function(a){return priorityAxisNames[a.key]+' '+percent(a.share);}))+'.';
 }
 /* PvE et PvP séparés (révision du 22 octobre 2026, soir) : quand la difficulté retenue est la moyenne des
  * deux (contexte mixte), l'explication les montre l'une après l'autre, chacune comptant pour moitié ; la
  * trace du moteur en donne les valeurs (`contexts`), dont la moyenne est exactement celle du calcul. */
 var contextNames={pve:'PvE',pvp:'PvP'};
 // Depuis la v12, seules les activités décident : mêlées, chacune compte selon sa priorité ; absentes, moitié-moitié.
 function priorityTechNote(a,ex){
  var c=a.contexts,w=ex&&ex.weights||{},mixed=(w.bg>0||w.sauv>0)&&w.solo>0;
  return 'Technicité : '+(mixed?'tes activités mêlent PvE et PvP, chacune selon sa priorité : le PvP compte pour '+percent(c.pvp.share)+', le PvE pour '+percent(c.pve.share):
   'sans critère d’activité, moyenne des deux')+' ('+percent(c.pve.raw)+' en PvE, '+percent(c.pvp.raw)+' en PvP).';
 }
 function priorityParts(ex,score){
  if(!ex)return [];
  return scoreParts(ex.parts,score,priorityGroups,priorityGroupNames).map(function(g){
   var axes=ex.axes.filter(function(a){return a.group===g.key;});
   g.note=[priorityGroupNote(axes)].concat(axes.filter(function(a){return a.contexts;}).map(function(a){return priorityTechNote(a,ex);})).filter(Boolean).join(' ');
   g.axes=[];
   axes.forEach(function(a){
    (a.contexts?['pve','pvp'].map(function(k){
     var c=a.contexts[k];return {axis:{group:a.group,key:a.key,weight:a.weight,share:a.share,raw:c.raw,load:c.load,context:k},label:priorityAxisNames[a.key]+' · '+contextNames[k]};
    }):[{axis:a,label:priorityAxisNames[a.key]}]).forEach(function(x){
     var l=priorityAxisLines(x.axis,ex);
     g.axes.push({key:a.key,label:x.label,lines:l,text:l.map(function(y){return y.lead+' : '+y.text;}).join(' ')});
    });
   });
   return g;
  });
 }
 // « Pourquoi N sur 100 ? » : les points qui manquent, du groupe qui en perd le plus à celui qui en perd le
 // moins, avec le critère qui en coûte le plus dans chacun. Le premier est celui que nomme « À garder en
 // tête ». Un groupe pleinement satisfait peut perdre un point à l'arrondi : il est alors signalé comme tel.
 var groupOn={roles:'les rôles',healStyles:'la façon de soigner',activities:'les activités',range:'la portée',styles:'le gameplay',
  pet:'les familiers',difficulty:'la complexité',style:'le style de combat',affinity:'les affinités'};
 function missingSummary(parts,score,full,culprit){
  var total=100-Math.round(score),s=total>1?'s':'';
  if(total<=0)return full;
  var items=costly(parts).map(function(g){return {n:g.max-g.points,on:groupOn[g.key]+' ('+(g.fit>=100?'arrondi':culprit(g))+')'};});
  if(items.length===1)return 'Il lui manque '+total+' point'+s+', '+(total>1?'tous ':'')+'sur '+items[0].on+'.';
  return 'Il lui manque '+total+' point'+s+' : '+list(items.map(function(x){return x.n+' sur '+x.on;}))+'.';
 }
 function priorityMissing(ex,score){
  if(!ex)return '';
  return missingSummary(priorityParts(ex,score),score,'Il ne lui manque aucun point : elle répond pleinement à chacun de tes critères.',function(g){
   var axes=ex.axes.filter(function(a){return a.group===g.key;}).sort(function(x,y){return y.share*(1-y.raw)-x.share*(1-x.raw);});
   return priorityAxisNames[axes[0].key];
  });
 }
 // Intitulés des réponses : ceux du questionnaire, pour que le joueur retrouve ce qu'il a choisi.
 var answerNames={raid:'Donjons et raids',bg:'Champs de bataille',world:'PvP sauvage et duel',solo:'Solo et farm',
  burst:'Dégâts explosifs',zone:'Dégâts de zone',ctrl:'Contrôle',surv:'Résistance',mob:'Mobilité',support:'Soutien',
  prevention:'Prévenir les dégâts',duree:'Soins sur la durée',cible:'Gros soins ciblés',groupe:'Soigner tout le groupe',
  distance:'À distance',melee:'Au corps-à-corps',mixte:'Pouvoir alterner distance et mêlée',
  like:'J’aime les familiers',avoid:'Je préfère éviter les familiers',simple:'Difficulté accessible',complex:'Difficulté exigeante'};
 function answerLabel(a,p){
  var keys=Object.keys(p&&p.roles||{});
  return a.domain==='roles'?(keys.length>1?'Rôles : ':'Rôle : ')+keys.map(function(k){return roleNames[k];}).join(' + '):answerNames[a.key];
 }
 // Le choix seul, sans « Rôle : » : « DPS », « Tank + DPS », « Solo et farm ».
 function choiceLabel(a,p){return answerLabel(a,p).replace(/^Rôles? : /,'');}
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
  if(s.variant==='sans-familier')return name+' est évaluée sans son familier (facultatif).';
  if(s.pet==='core')return name+' repose sur son familier.';
  if(s.pet==='optional')return name+' joue avec un familier (facultatif).';
  return a.key==='like'?(a.raw>=1?name+' repose sur son familier.':a.raw>.5?name+' joue avec un familier (facultatif).':name+' se joue sans familier.'):
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
   // Difficulté : la note de la trace (contexte PvE, PvP, ou part PvE / PvP d'un contexte mixte).
   var load=a.load!==undefined?a.load:a.key==='simple'?5-4*a.raw:1+4*a.raw,ctx=a.context||difficultyContext(p);
   spec=n.spec+' est notée '+number(load)+'/5 en difficulté '+(contextNames[ctx]||'(moyenne PvE et PvP)')+complexityWhy(s,ctx)+'.';
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
   var answers=ex.answers.filter(function(a){return a.domain===g.key;}),mixed=answers.length===1&&answers[0].contexts;
   if(mixed){
    // Complexité en contexte mixte : la part PvE puis la part PvP, chacune avec ses trois lignes.
    var a=answers[0],acts=Object.keys(ex.profile&&ex.profile.activities||{}).length;
    g.note=(acts?'Tes activités mêlent PvE et PvP : moyenne des deux, ':'Sans activité choisie : moyenne du PvE et du PvP, ')+
     percent(a.contexts.pve.fit)+' en PvE et '+percent(a.contexts.pvp.fit)+' en PvP.';
    g.answers=['pve','pvp'].map(function(k){
     var c=a.contexts[k];
     return {label:answerLabel(a,ex.profile)+' · '+contextNames[k],
      lines:answerLines({domain:a.domain,key:a.key,certainty:a.certainty,raw:c.raw,fit:c.fit,load:c.load,context:k},ex)};
    });
    return g;
   }
   g.note=answers.length>1?'Moyenne de tes '+answers.length+' choix : '+list(answers.map(function(a){return percent(a.fit);}))+'.':'';
   g.answers=answers.map(function(a){return {label:answerLabel(a,ex.profile),lines:answerLines(a,ex)};});
   return g;
  });
 }
 /* Lecture commune d'une piste (révision du 22 octobre 2026) : « Correspond à tes envies », « À garder en
  * tête » et « Pourquoi N sur 100 ? » partent de la même analyse, pour ne jamais se contredire.
  * - Les groupes qui perdent des points sont triés du plus coûteux au moins coûteux (points affichés, puis
  *   points avant arrondi) ; dans chacun, la réponse qui perd le plus.
  * - « À garder en tête » nomme le premier groupe de ce bilan et cette réponse, avec les chiffres des lignes
  *   « La spécialisation » (note, note avec ta maîtrise, aisance) et le nombre de points du bilan.
  * - « Correspond à tes envies » liste les réponses auxquelles la spécialisation répond pleinement (le mot
  *   du constat), sans celle que nomme « À garder en tête » ; à défaut, celles auxquelles elle répond bien. */
 function fitFromAnswers(ex){
  var fit={};
  ex.answers.forEach(function(a){var f=fit[a.domain]||(fit[a.domain]={sum:0,n:0,weight:0});f.sum+=a.fit;f.n++;f.weight+=a.max;});
  Object.keys(fit).forEach(function(k){fit[k]={value:fit[k].sum/fit[k].n,weight:fit[k].weight};});
  return fit;
 }
 function pisteAnalysis(ex,fit,score){
  if(!ex||!ex.answers||!ex.answers.length)return null;
  if(!fit){fit=fitFromAnswers(ex);score=ex.score;}
  var groups=scoreParts(fit,score).map(function(g){
   g.answers=ex.answers.filter(function(a){return a.domain===g.key;}).sort(function(x,y){return y.loss-x.loss;});
   return g;
  });
  var sorted=costly(groups),main=sorted.length&&sorted[0].fit<100?sorted[0]:null,answer=main?main.answers[0]:null;
  function at(l){return ex.answers.filter(function(a){return a!==answer&&level(a.raw)===l;});}
  var strengths=at('pleinement'),strengthLevel='pleinement';
  if(!strengths.length){strengths=at('bien');strengthLevel='bien';}
  // Seule réponse bien remplie, elle reste un atout, même si « À garder en tête » en parle.
  if(!strengths.length&&answer&&(level(answer.raw)==='pleinement'||level(answer.raw)==='bien')){strengths=[answer];strengthLevel=level(answer.raw);}
  if(!strengths.length)strengthLevel='';
  strengths.sort(function(x,y){return partOrder.indexOf(x.domain)-partOrder.indexOf(y.domain);});
  return {profile:ex.profile,spec:ex.spec,total:100-Math.round(score),groups:groups,costly:sorted,main:main,answer:answer,
   strengths:strengths,strengthLevel:strengthLevel};
 }
 function culpritLabel(a,p){return choiceLabel(a,p)+(mainCause(a)==='certainty'?' : certitude '+number(a.certainty)+'/5':'');}
 function pisteMissing(ex,fit,score){
  if(!ex)return '';
  return missingSummary(scoreParts(fit,score),score,'Il ne lui manque aucun point : elle répond pleinement à chacun de tes choix.',function(g){
   return culpritLabel(ex.answers.filter(function(x){return x.domain===g.key;}).sort(function(x,y){return y.loss-x.loss;})[0],ex.profile);
  });
 }
 // « Correspond à tes envies » : trois choix au plus, avec les intitulés du questionnaire.
 function strengthsText(ex,fit,score){
  var an=pisteAnalysis(ex,fit,score);
  if(!an)return '';
  if(!an.strengths.length)return 'Pas de point fort marqué : regarde « Pourquoi cette piste ».';
  var names=an.strengths.map(function(a){return choiceLabel(a,an.profile);}),shown=names.slice(0,3),more=names.length-shown.length;
  return (an.strengthLevel==='bien'?'En bonne partie : ':'')+shown.join(' · ')+(more?' · et '+more+' autre'+(more>1?'s':''):'');
 }
 // « À garder en tête » : une phrase qui situe la classe, la spécialisation et le critère, avec les chiffres des
 // lignes « La spécialisation » : « Le Chasseur Maîtrise des bêtes est noté 3/5 en résistance : c'est ce qui
 // lui coûte le plus de points (10 sur le gameplay). » Les classes sont toutes au masculin (le, au, du).
 var criterionIn={raid:'en donjons et raids',bg:'en champs de bataille',world:'en PvP sauvage et duel',solo:'en solo et farm',
  burst:'en dégâts explosifs',zone:'en dégâts de zone',ctrl:'en contrôle',surv:'en résistance',mob:'en mobilité',support:'en soutien',
  prevention:'pour prévenir les dégâts',duree:'en soins sur la durée',cible:'en gros soins ciblés',groupe:'pour soigner tout le groupe'};
 function costFact(a,ex,le){
  var p=ex.profile||{},s=ex.spec||{},cause=mainCause(a),l=level(a.raw),mastery=(masteryNames[p.mastery]||'').toLowerCase();
  var roles=Object.keys(p.roles||{}),names=roles.map(function(k){return roleNames[k];}),multi=a.domain==='roles'&&roles.length>1;
  var e=s.className?'':'e',noted=' est noté'+e+' ';
  // L'hésitation du joueur n'est pas une faiblesse de la spécialisation : elle est dite comme telle.
  if(cause==='certainty')return le+(l==='pas'?' ne répond pas':' répond '+l)+' à ton choix « '+choiceLabel(a,p)+' », mais tu hésites (certitude '+(multi?'moyenne ':'')+number(a.certainty)+'/5)';
  if(a.domain==='healStyles'&&a.note===undefined)return le+' ne soigne pas, alors que tu veux « '+choiceLabel(a,p)+' »';
  if(a.note!==undefined)return le+noted+number(a.note)+'/5 '+criterionIn[a.key]+(masteryShown(a)?', '+number(a.adjusted)+'/5 avec ta maîtrise ('+mastery+')':'');
  if(a.domain==='roles'){
   var role=roleNames[s.role]||'',apt=a.aptitude!==undefined?' (aisance estimée en PvE : '+percent(a.aptitude)+')':'';
   if(!multi)return a.raw<.005?le+' ne joue pas le rôle '+names[0]+(role?' (spécialisation '+role+')':''):
    'en '+names[0]+', '+le+' a une aisance estimée en PvE de '+percent(a.aptitude!==undefined?a.aptitude:a.raw)+(cause==='mastery'?' à ton niveau ('+mastery+')':'');
   var covered=a.covered||[],missing=roles.filter(function(k){return covered.indexOf(k)<0;}).map(function(k){return roleNames[k];});
   var lead='pour tes rôles '+names.join(' + ')+', '+le;
   if(roles.indexOf(s.role)<0)return lead+' ne joue aucun de ces rôles'+(role?' (spécialisation '+role+')':'');
   return lead+(missing.length?' joue '+role+', mais sa classe ne propose '+(missing.length>1?'ni '+missing.join(' ni '):'pas '+missing[0]):' ne joue que '+role+apt);
  }
  if(a.domain==='range')return a.key==='mixte'?le+' ne peut pas alterner distance et mêlée (une seule portée dans sa classe pour tes rôles)':
   le+' se joue '+(s.range==='distance'?'à distance':'en mêlée')+', alors que tu veux jouer '+(a.key==='distance'?'à distance':'en mêlée');
  if(a.domain==='pet'){
   // Mêmes faits que la ligne « La spécialisation » du familier.
   var how=s.pet==='none'?' se joue sans familier':s.variant==='sans-familier'?' est évalué'+e+' sans son familier (facultatif)':
    s.pet==='core'?' repose sur son familier':' joue avec un familier (facultatif)';
   if(a.key==='like')return le+(s.pet==='optional'&&s.variant!=='sans-familier'?' joue avec un familier facultatif, pas au centre de son jeu':how+', alors que tu aimes les familiers');
   return le+how+', alors que tu préfères éviter les familiers';
  }
  // Difficulté : une note haute n'est ni bonne ni mauvaise en soi, elle dépend de ton choix ; la phrase dit
  // donc à quel point la spécialisation y répond (le mot du constat), puis sa note de difficulté.
  var choice=' à ton choix « '+choiceLabel(a,p)+' »';
  if(a.contexts){
   // Contexte mixte : PvE et PvP séparés, comme dans « Pourquoi cette piste ».
   var e1=a.contexts.pve,e2=a.contexts.pvp,l1=level(e1.raw),l2=level(e2.raw);
   if(number(e1.load)===number(e2.load))return le+(l1==='pas'?' ne répond pas':' répond '+l1)+choice+' (difficulté notée '+number(e1.load)+'/5 en PvE comme en PvP)';
   return le+(l1==='pas'?' ne répond pas':' répond '+l1)+choice+' en PvE (difficulté notée '+number(e1.load)+'/5) et '+
    (l2==='pas'?'n’y répond pas':'y répond '+l2)+' en PvP ('+number(e2.load)+'/5)';
  }
  var load=a.load!==undefined?a.load:a.key==='simple'?5-4*a.raw:1+4*a.raw,ctx=a.context||difficultyContext(p);
  return le+(l==='pas'?' ne répond pas':' répond '+l)+choice+' (difficulté notée '+number(load)+'/5 '+
   (ctx==='pve'?'en PvE':ctx==='pvp'?'en PvP':'en moyenne PvE et PvP')+')';
 }
 function keepInMind(ex,fit,score){
  var an=pisteAnalysis(ex,fit,score);
  if(!an)return '';
  var s=ex.spec||{},le=s.className&&s.label?'le '+s.className+' '+s.label:'cette spécialisation';
  if(!an.main)return capital(le)+' répond pleinement à tes choix dans nos estimations : regarde si son style de jeu te plaît.';
  var g=an.main,n=g.max-g.points,fact=capital(costFact(an.answer,ex,le));
  // Peu de points manquants : la phrase le dit, sans dramatiser.
  if(an.total<=5)return fact+' : il ne lui manque '+(an.total>1?'que '+an.total+' points':'qu’un point')+(an.costly.length>1?', dont '+n+' sur ':', sur ')+groupOn[g.key]+'.';
  if(an.costly.length===1)return fact+' : c’est la seule chose qui lui coûte des points ('+n+' sur '+groupOn[g.key]+').';
  var next=an.costly[1],tie=next&&next.max-next.points===n?', autant que sur '+groupOn[next.key]:'';
  return fact+' : c’est ce qui lui coûte le plus de points ('+n+' sur '+groupOn[g.key]+tie+').';
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
  // v12 : la maîtrise ajuste les styles selon la difficulté du contexte de tes activités, s'il n'y en a qu'un.
  if(p&&Number.isInteger(p.mastery)&&p.mastery!==2&&Object.keys(p.styles||{}).length){
   var sctx=difficultyContext(p);
   if(sctx!=='mixte')out.push('Ta maîtrise ajuste tes styles selon la difficulté '+(sctx==='pve'?'PvE':'PvP')+' de chaque spécialisation, puisque tes activités sont en '+(sctx==='pve'?'PvE':'PvP')+'.');
  }
  if(p&&Object.hasOwn(p.roles||{},'soin')){
   var heal=healChoices(p);
   out.push(heal.length?'Ta façon de soigner ('+heal.map(function(k){return healNames[k];}).join(', ')+') départage les spécialisations de soin. Les autres rôles répondent moins bien à cette envie.':
    'Tu peux préciser ta façon de soigner à la question 1 : elle départage les spécialisations de soin.');
  }else if(w&&w.soin>0)
   out.push('Ce comparateur ne départage pas les façons de soigner : le parcours guidé le fait à la question 1, et la fiche de chaque spécialisation de soin les décrit.');
  return out;
 }
 return {criteria:criteria,ranks:ranks,rankHint:rankHint,scoreParts:scoreParts,priorityParts:priorityParts,priorityMissing:priorityMissing,pisteParts:pisteParts,pisteMissing:pisteMissing,of:of,priorityWords:priorityWords,answerLabel:answerLabel,answerLines:answerLines,answerHtml:answerHtml,answerText:answerText,certaintyWords:certaintyWords,pisteAnalysis:pisteAnalysis,keepInMind:keepInMind,strengthsText:strengthsText,choiceLabel:choiceLabel,level:level,number:number,tieNote:tieNote,petNotice:petNotice,contextNotes:contextNotes,healChoices:healChoices};
});
