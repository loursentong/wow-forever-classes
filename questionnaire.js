/* Présentation progressive de l'assistant. Le moteur de recommandation reste inchangé. */
(function(){
'use strict';
var E=window.WFRecommend;
var X=window.WFResultExplanations;
var root=document.getElementById('reco-app');
if(!E||!root)return;
var KEY='wf-recommend-v1',state=E.sanitize(null),step=0,revealed=false;
try{state=E.sanitize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){state=E.sanitize(null);}
var names={
 roles:{dps:'DPS',tank:'Tank',soin:'Soin'},
 healStyles:{prevention:'Prévenir les dégâts',duree:'Soins sur la durée',cible:'Gros soins ciblés',groupe:'Soigner tout le groupe'},
 activities:{raid:'Donjons et raids',bg:'Champs de bataille',world:'PvP sauvage et duel',solo:'Solo et farm'},
 range:{distance:'À distance',melee:'Au corps-à-corps',mixte:'Pouvoir alterner'},
 styles:{burst:'Dégâts explosifs',zone:'Dégâts de zone',ctrl:'Contrôle',surv:'Résistance',mob:'Mobilité',support:'Soutien'},
 pet:{like:"J'aime les familiers",avoid:'Je préfère éviter'},
 difficulty:{simple:'Accessible',complex:'Exigeant'}
};
var descriptions={
 roles:{dps:'Infliger des dégâts',tank:'Protéger et encaisser',soin:'Soigner et soutenir'},
 healStyles:{prevention:'Boucliers et absorptions avant les coups',duree:'Des soins qui agissent dans le temps',cible:'Garder une cible en vie, souvent le tank',groupe:'Des soins qui touchent plusieurs alliés'},
 activities:{raid:'Jouer en groupe en PvE',bg:'Affrontements en équipe',world:'Combats imprévus et duels',solo:'Explorer et progresser seul'},
 range:{distance:'Combattre sans être au contact',melee:'Combattre au plus près',mixte:'Changer selon la configuration'},
 styles:{burst:'Frapper très fort en peu de temps',zone:'Toucher plusieurs cibles',ctrl:'Ralentir, immobiliser, interrompre ou neutraliser',surv:'Tenir sous pression',mob:'Se déplacer et poursuivre',support:'Renforcer les alliés'},
 pet:{like:'Un compagnon fait partie du plaisir',avoid:'Je préfère jouer sans compagnon'},
 difficulty:{simple:'Prise en main confortable',complex:'Gameplay à approfondir'}
};
var short=['Rôles','Activités','Portée','Gameplay','Familiers','Maîtrise'];
var labels={roles:'Rôles',healStyles:'Façon de soigner',activities:'Activités',range:'Portée',styles:'Gameplay',pet:'Familiers',difficulty:'Complexité'};
var roleNames={dps:'DPS',tank:'Tank',soin:'Soin'};
var healShort={prevention:'prévention',duree:'soins sur la durée',cible:'soins ciblés',groupe:'soins de groupe'};
var mastery=['Débutant','Intermédiaire','Confirmé','Expert'];
var certWords=['Intuition','Très hésitant','Hésitant','Assez sûr','Très sûr','Certain'];
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function answered(){
 return [
  E.selected(state.roles).length>0,E.selected(state.activities).length>0,
  state.range.value!=='any',E.selected(state.styles).length>0,
  state.pet.value!=='any',state.difficulty.value!=='any'||state.mastery!==2
 ];
}
function healKeys(){return E.selected(state.roles).includes('soin')?E.selected(state.healStyles):[];}
function summaryText(){
 var parts=[];
 ['roles','activities','styles'].forEach(function(k){
  E.selected(state[k]).forEach(function(v){parts.push((names[k]||{})[v]);});
 });
 healKeys().forEach(function(v){parts.push(names.healStyles[v]);});
 ['range','pet','difficulty'].forEach(function(k){
  if(state[k].value!=='any')parts.push((names[k]||{})[state[k].value]);
 });
 if(state.mastery!==2)parts.push('Maîtrise : '+mastery[state.mastery]);
 return parts;
}
function certaintyControl(group,key,n){
 var name=(names[group]||{})[key]||key;
 return '<div class="reco-cert"><div class="reco-cert-head"><label for="rc-'+group+'-'+key+'">Certitude pour « '+esc(name)+' »</label>'+
   '<output data-certout="'+group+'/'+key+'">'+n+'/5 · '+certWords[n]+'</output></div>'+
   '<input id="rc-'+group+'-'+key+'" type="range" min="0" max="5" step="1" value="'+n+'" data-certgroup="'+group+'" data-certkey="'+key+'" aria-label="Certitude pour '+esc(name)+' (0 intuition, 5 certain)" aria-valuetext="'+esc(certWords[n])+'"/>'+
   '<div class="reco-cert-scale"><span>0 · Intuition</span><span>5 · Certain</span></div></div>';
}
/* Icônes de compétences issues du CDN officiel World of Warcraft (Blizzard). */
var WOW_ICON_BASE='https://render.worldofwarcraft.com/us/icons/56/';
var wowChoiceIcons={
 roles:{dps:'inv_sword_04',tank:'inv_shield_05',soin:'spell_holy_greaterheal'},
 healStyles:{prevention:'spell_holy_powerwordshield',duree:'spell_nature_rejuvenation',cible:'spell_holy_flashheal',groupe:'spell_nature_healingwavegreater'},
 activities:{raid:'inv_misc_map_01',bg:'ability_warrior_battleshout',world:'spell_nature_lightning',solo:'ability_hunter_beastcall'},
 range:{distance:'spell_fire_fireball02',melee:'inv_sword_04',mixte:'ability_rogue_sprint'},
 styles:{burst:'spell_fire_fireball02',zone:'spell_nature_lightning',ctrl:'spell_frost_frostnova',surv:'spell_holy_devotionaura',mob:'ability_rogue_sprint',support:'spell_holy_powerwordshield'},
 pet:{like:'ability_hunter_beastcall',avoid:'inv_misc_book_09'},
 difficulty:{simple:'spell_holy_devotionaura',complex:'inv_misc_book_09'}
};
var wowClassIcons={guerrier:'warrior',paladin:'paladin',chasseur:'hunter',voleur:'rogue',pretre:'priest',chaman:'shaman',mage:'mage',demoniste:'warlock',druide:'druid'};
function wowClassIcon(id){return WOW_ICON_BASE+'classicon_'+(wowClassIcons[id]||'warrior')+'.jpg';}
function choice(group,k,on,type){
 var mark='<span class="reco-option-mark" aria-hidden="true"></span>';
 var icon=(wowChoiceIcons[group]||{})[k];
 return '<button type="button" class="reco-option" data-'+type+'="'+group+'" data-key="'+k+'" aria-pressed="'+on+'">'+
   (icon?'<span class="reco-option-art" aria-hidden="true"><img src="'+WOW_ICON_BASE+icon+'.jpg" alt="" loading="lazy" width="40" height="40"></span>':'')+
   '<span class="reco-option-text"><strong>'+esc((names[group]||{})[k])+'</strong>'+
   ((descriptions[group]||{})[k]?'<small>'+esc(descriptions[group][k])+'</small>':'')+
   '</span></button>';
}
function multi(group,limit){
 var chosen=E.selected(state[group]),html='<div class="reco-options" role="group" aria-label="'+labels[group]+'">';
 Object.keys(names[group]||{}).forEach(function(k){html+=choice(group,k,chosen.includes(k),'multi');});
 html+='</div>';
 if(chosen.length){
  html+='<div class="reco-cert-list"><p class="reco-cert-title">À quel point es-tu sûr de ces envies ?</p>';
  chosen.forEach(function(k){html+=certaintyControl(group,k,state[group][k]);});
  html+='</div>';
 }
 if(limit)html+='<p class="reco-selection-count">'+chosen.length+' sur '+limit+(group==='styles'?' styles':' choix')+' possibles</p>';
 return html;
}
function single(group){
 var selected=state[group].value;
 var html='<div class="reco-options reco-single-options" role="group" aria-label="'+labels[group]+'">';
 html+='<div class="reco-choice-wrap">'+
  '<button type="button" class="reco-option reco-option-neutral" data-single="'+group+'" data-key="any" aria-pressed="'+(selected==='any')+'"><span class="reco-option-mark" aria-hidden="true"></span><span class="reco-option-text"><strong>Je ne sais pas encore</strong><small>Aucune préférence imposée</small></span></button></div>';
 Object.keys(names[group]||{}).forEach(function(k){
  var on=selected===k;
  html+='<div class="reco-choice-wrap'+(on?' is-picked':'')+'" data-choice-wrap="'+group+'/'+k+'">'+choice(group,k,on,'single');
  if(on){
   html+='<div class="reco-choice-details">'+certaintyControl(group,k,state[group].certainty);
   if(group==='range')
    html+='<label class="reco-strict"><input type="checkbox" data-strict="range" '+(state.range.strict?'checked':'')+'><span><strong>C’est une exigence absolue</strong><small>Écarte les configurations incompatibles.</small></span></label>';
   if(group==='pet'&&state.pet.value==='avoid')
    html+='<label class="reco-strict"><input type="checkbox" data-strict="pet" '+(state.pet.strict?'checked':'')+'><span><strong>Je ne veux pas de familier obligatoire</strong><small>Les configurations qui l’imposent seront écartées.</small></span></label>';
   html+='</div>';
  }
  html+='</div>';
 });
 html+='</div>';
 return html;
}
function question(n,title,hint,content){
 return '<fieldset class="reco-question" aria-describedby="reco-hint-'+n+'"><legend tabindex="-1"><span class="reco-question-index">QUESTION '+n+' / 6</span><span class="reco-question-title">'+title+'</span></legend>'+
   '<p id="reco-hint-'+n+'" class="reco-hint">'+hint+'</p>'+content+'</fieldset>';
}
/* Sous-question facultative du rôle Soin (référence v8) : départage les configurations de soin. */
function healQuestion(){
 if(!E.selected(state.roles).includes('soin'))return '';
 return '<div class="reco-subquestion" role="group" aria-labelledby="reco-heal-title" aria-describedby="reco-heal-hint">'+
  '<p class="reco-subquestion-title" id="reco-heal-title">Quelle façon de soigner t’attire ?</p>'+
  '<p class="reco-subquestion-hint" id="reco-heal-hint">Facultatif · jusqu’à deux choix. Départage les spécialisations de soin ; le score des autres pistes ne change pas.</p>'+
  multi('healStyles',2)+'</div>';
}
function currentQuestion(){
 if(step===0)return question(1,'Quel rôle voudrais-tu jouer ?','Tu peux choisir plusieurs rôles ou simplement explorer ce qui t’attire.',
  multi('roles')+(E.selected(state.roles).length?'<label class="reco-strict"><input type="checkbox" data-roles-strict '+(state.rolesStrict?'checked':'')+'><span><strong>'+ (E.selected(state.roles).length>1?'Je veux pouvoir exercer tous ces rôles':'Ce rôle est indispensable pour moi')+'</strong><small>Une préférence seule ne bloque jamais les alternatives.</small></span></label>':'')+healQuestion());
 if(step===1)return question(2,'Où passeras-tu le plus de temps ?','Tu peux sélectionner plusieurs activités. Aucune obligation de te décider tout de suite.',multi('activities'));
 if(step===2)return question(3,'Comment aimes-tu combattre ?','Une préférence peut rester souple. Coche une exigence uniquement si elle est non négociable.',single('range'));
 if(step===3)return question(4,'Quel style te ressemble ?','Choisis jusqu’à trois qualités qui t’attirent. Tes hésitations sont normales.',multi('styles',3));
 if(step===4)return question(5,'Quelle place pour les familiers ?','Un familier facultatif peut apporter des outils que tu perds en jouant sans lui.',single('pet'));
 var controls='<div class="reco-mastery"><span class="reco-label">Ton expérience actuelle</span><div class="reco-mastery-choices" role="group" aria-label="Maîtrise actuelle">'+
  mastery.map(function(v,i){return '<button type="button" data-mastery="'+i+'" aria-pressed="'+(i===state.mastery)+'">'+v+'</button>';}).join('')+
  '</div></div><div class="reco-difficulty"><span class="reco-label">Le type de difficulté que tu recherches</span>'+single('difficulty')+'</div>';
 return question(6,'Quel est ton rapport à la difficulté ?','Être débutant ne t’empêche pas de vouloir apprendre une classe exigeante. La difficulté dépend de la spécialisation et de l’activité.',controls);
}
function renderForm(){
 var done=answered(),count=done.filter(Boolean).length;
 var html='<div class="reco-progress-top"><div><span class="reco-kicker">Ton parcours</span><strong>Étape '+(step+1)+' sur 6</strong></div><span class="reco-progress-count">'+count+' thème'+(count>1?'s':'')+' renseigné'+(count>1?'s':'')+'</span></div>';
 html+='<div class="reco-progress-track" role="progressbar" aria-label="Étapes parcourues" aria-valuemin="0" aria-valuemax="6" aria-valuenow="'+(step+1)+'"><span style="width:'+((step+1)/6*100).toFixed(2)+'%"></span></div>';
 var nav='<nav class="reco-steps" aria-label="Navigation entre les six questions">';
 short.forEach(function(t,i){nav+='<button type="button" class="reco-step'+(i===step?' is-current':'')+(done[i]?' is-answered':'')+'" data-step="'+i+'" '+(i===step?'aria-current="step"':'')+' aria-label="Question '+(i+1)+' : '+t+(done[i]?' (renseignée)':'')+'"><span class="reco-step-no">'+(done[i]&&i!==step?'✓':i+1)+'</span><span class="reco-step-label">'+t+'</span></button>';});
 nav+='</nav>';
 var rail=root.querySelector('#reco-rail');
 if(rail)rail.innerHTML=nav;else html+=nav;
 html+=currentQuestion();
 html+='<div class="reco-form-footer"><button type="button" class="reco-back" data-prev '+(step===0?'disabled':'')+'>← Précédent</button>'+
  '<span class="reco-form-help">Tu peux passer une question.</span>'+
  // À la dernière question, le bouton n'est pas répété quand le bloc juste en dessous propose déjà « Voir mes résultats ».
  (step===5?(canReveal(E.recommend(state))?'':'<button type="button" class="reco-next" data-show-results>Voir mes résultats ↓</button>'):
   '<button type="button" class="reco-next" data-next>Question suivante →</button>')+'</div>';
 var tags=summaryText(),form=root.querySelector('#reco-form'),summaryPanel=root.querySelector('#reco-summary-panel');
 var roleKeys=E.selected(state.roles),activityKeys=E.selected(state.activities),styleKeys=E.selected(state.styles);
 var summaryRows=[
  {title:'Rôles',value:roleKeys.map(function(k){var h=k==='soin'?healKeys():[];return names.roles[k]+(h.length?' ('+h.map(function(x){return healShort[x];}).join(', ')+')':'');}).join(' · ')},
  {title:'Activités',value:activityKeys.map(function(k){return names.activities[k];}).join(' · ')},
  {title:'Portée',value:state.range.value==='any'?'':names.range[state.range.value]+' · '+state.range.certainty+'/5'},
  {title:'Gameplay',value:styleKeys.map(function(k){return names.styles[k];}).join(' · ')},
  {title:'Familiers',value:state.pet.value==='any'?'':names.pet[state.pet.value]},
  {title:'Maîtrise',value:state.mastery===2?'Référence : confirmé':mastery[state.mastery]+(state.difficulty.value!=='any'?' · '+names.difficulty[state.difficulty.value]:'')}
 ];
 var summaryMarkup='<div class="reco-summary-header"><span class="reco-kicker">Mes choix</span><span class="reco-summary-count">'+answered().filter(Boolean).length+' / 6 thèmes</span></div>'+
  '<div class="reco-summary-rows">'+summaryRows.map(function(item,i){
   return '<div class="reco-summary-row'+(item.value&&!(i===5&&state.mastery===2)?' is-filled':'')+'"><span class="reco-summary-index">'+(i+1)+'</span>'+
   '<span class="reco-summary-name">'+item.title+'</span><span class="reco-summary-value">'+esc(item.value||'Non renseigné')+'</span>'+
   '<button type="button" class="reco-summary-edit" data-summary-step="'+i+'" aria-label="Modifier '+item.title+'">✎</button></div>';
  }).join('')+'</div>';
 if(summaryPanel)summaryPanel.innerHTML=summaryMarkup;
 else html+='<div class="reco-summary" aria-label="Mes choix">'+summaryMarkup+'</div>';
 var canAnimate=!!(form.getBoundingClientRect&&window.matchMedia&&window.requestAnimationFrame&&!window.matchMedia('(prefers-reduced-motion: reduce)').matches);
 var oldHeight=canAnimate?form.getBoundingClientRect().height:0;
 form.style&&(form.style.transition='none');
 form.style&&(form.style.height='');
 form.innerHTML=html;
 if(canAnimate&&oldHeight>0){
  var newHeight=form.getBoundingClientRect().height;
  if(Math.abs(newHeight-oldHeight)>4){
   form.style.height=oldHeight+'px';form.style.overflow='hidden';
   void form.offsetHeight;
   window.requestAnimationFrame(function(){
    form.style.transition='height 210ms cubic-bezier(.2,.75,.25,1)';
    form.style.height=newHeight+'px';
   });
   if(form.__recoMotion)window.clearTimeout(form.__recoMotion);
   form.__recoMotion=window.setTimeout(function(){form.style.height='';form.style.overflow='';form.style.transition='';},260);
  }
 }
}
function pointsName(k){return labels[k]||k;}
function fitLabel(v){
 if(v>=.82)return 'Très bonne piste';
 if(v>=.68)return 'Bonne correspondance';
 return 'À explorer';
}
/* « Pourquoi cette piste » : part de chaque critère dans le score, stabilité face aux réponses
 * hésitantes (scénarios du moteur), sources. */
var KB_URL='https://github.com/loursentong/wow-forever-classes/tree/main/connaissances';
function hesitations(report){
 return (report.uncertain||[]).map(function(label){
  var m=/^Sans (\w+)(?:\/(\w+))?$/.exec(label);
  if(!m)return '';
  return m[2]?(names[m[1]]||{})[m[2]]||m[2]:labels[m[1]]||m[1];
 }).filter(Boolean);
}
function whyBlock(r,hesitant){
 var parts=X?X.scoreParts(r.fit,r.score):[];
 var rows=parts.map(function(p){
  return '<li><span class="reco-why-name">'+esc(p.label)+'</span><span class="reco-why-bar" aria-hidden="true"><i style="width:'+p.fit+'%"></i></span>'+
   '<span class="reco-why-fit" title="Adéquation à ta réponse">'+p.fit+' %</span><span class="reco-why-points">'+p.points+' / '+p.max+' pts</span></li>';
 }).join('');
 var stability=r.scenarioCount<=1?'aucune de tes réponses n’est hésitante (certitude de 2 ou moins) : il n’y a pas de variante à tester.':
  'parmi tes trois premières pistes dans '+r.scenarioAppearances+' des '+r.scenarioCount+' scénarios testés : tes réponses actuelles, puis sans chacune de tes réponses hésitantes'+
  (hesitant.length?' ('+hesitant.join(', ')+')':'')+'.';
 return '<details class="reco-evidence reco-why"><summary>Pourquoi cette piste</summary>'+
  '<p><b>Ce qui fait son score de '+Math.round(r.score)+' :</b> pour chaque critère renseigné, son adéquation à ta réponse (la barre) et les points obtenus sur les points possibles. Une réponse hésitante pèse moins : son adéquation est rapprochée de 50 %.</p>'+
  (rows?'<ul class="reco-why-parts" aria-label="Part de chaque critère dans le score">'+rows+'</ul>':'')+
  '<p><b>Stabilité face à tes hésitations :</b> '+esc(stability)+'</p>'+
  '<p><b>Sources :</b> notes éditoriales, non mesurées au niveau 60, justifiées dans la <a href="'+KB_URL+'" target="_blank" rel="noopener noreferrer">base de connaissances du projet ↗</a> · <a href="'+esc(r.spec.source)+'" target="_blank" rel="noopener noreferrer">présentation officielle de la classe ↗</a></p>'+
  '</details>';
}
function resultCard(r,i,position,hesitant){
 var strong=r.strengths.length?r.strengths.map(pointsName).join(' · '):'Plusieurs pistes possibles';
 var weak=r.tradeoffs.length?r.tradeoffs.map(pointsName).join(' · '):'Consulte les repères de cette spécialisation ci-dessous';
 var cls=r.classId;
 var tied=position&&position.tied,leader=position?position.leader:i===0;
 var petNotice=X?X.petNotice(r.spec,state):'';
 return '<article class="reco-result-card '+(leader&&!tied?'reco-featured':'')+'" style="--reco-class:var(--k-'+esc(cls)+')">'+
  '<div class="reco-result-top"><span class="reco-emblem" aria-hidden="true"><img src="'+wowClassIcon(cls)+'" alt="" width="42" height="42" loading="lazy" decoding="async"></span>'+
  '<div class="reco-result-main"><span class="reco-result-label">'+(tied?(leader?'PISTE À ÉGALITÉ':'ALTERNATIVE À ÉGALITÉ'):(leader?'PISTE PRINCIPALE':'ALTERNATIVE '+i))+'</span><h4>'+esc(r.className)+'</h4>'+
  '<p><strong>'+esc(r.spec.label)+'</strong>'+(r.spec.variant==='sans-familier'?' · sans familier':'')+' · '+esc(roleNames[r.spec.role])+' · '+(r.spec.range==='distance'?'Distance':'Mêlée')+'</p></div>'+
  '<div class="reco-score"><strong>'+Math.round(r.score)+'</strong><small>/100</small></div></div>'+
  '<div class="reco-fit"><span>'+fitLabel(r.score/100)+'</span><small>Indice estimé, pas une probabilité</small></div>'+
  '<div class="reco-bars"><div class="reco-bar" style="width:'+Math.min(100,Math.max(0,r.score))+'%"></div></div>'+
  '<div class="reco-reasons"><p><b>Correspond à tes envies</b><span>'+esc(strong)+'</span></p>'+
  '<p><b>À garder en tête</b><span>'+esc(weak)+'</span></p></div>'+
  (petNotice?'<p class="reco-config-notice">'+esc(petNotice)+'</p>':'')+
  (window.WFConfigurationDetails?window.WFConfigurationDetails(r.spec):'')+
  whyBlock(r,hesitant||[])+'</article>';
}
/* Avant les résultats, un bloc en pleine largeur sous la question : le texte, puis l'action
 * (progression vers un premier aperçu, ou bouton des résultats). */
function waiting(kind,kicker,title,text,action){
 return '<div class="reco-empty '+kind+'"><div class="reco-empty-copy"><span class="reco-kicker">'+kicker+'</span><h3>'+title+'</h3>'+
  '<p>'+text+'</p></div><div class="reco-empty-action">'+action+'</div></div>';
}
function discovery(n){
 return '<div class="reco-discovery-progress" role="img" aria-label="'+n+' préférence'+(n>1?'s':'')+' sur 2 pour un premier aperçu">'+
  '<span'+(n>=1?' class="is-done"':'')+'></span><span'+(n>=2?' class="is-done"':'')+'></span></div>'+
  '<small>'+(n?'Encore une préférence pour un premier aperçu.':'Deux préférences suffisent pour un premier aperçu.')+'</small>';
}
function canReveal(report){return !revealed&&report.status==='ok'&&report.used.length>=2;}
function renderResults(){
 var report=E.recommend(state),out=root.querySelector('#reco-results'),h='';
 var ready=canReveal(report);
 if(report.status==='unanswered'){
  h=waiting('reco-intro','Ta prochaine aventure','Tout commence par tes envies.',
   'Choisis ce qui t’attire : nous construirons ta sélection étape par étape, sans favoriser de classe au départ.',discovery(0));
 }else if(!revealed){
  if(report.used.length<2&&report.status==='ok'){
   h=waiting('reco-awaiting','Une première piste','Encore un peu de contexte…',
    'Un seul choix ne définit pas ton style. Continue à ton rythme : une autre préférence rendra l’aperçu plus pertinent.',discovery(1));
  }else{
   h=waiting('reco-ready','Une sélection prend forme','Prêt à découvrir tes pistes ?',
    'Tes réponses permettent de commencer une comparaison. Tu peux continuer les questions ou voir tes résultats dès maintenant.',
    '<button type="button" class="reco-reveal-button" data-reco-reveal>Voir mes résultats <span aria-hidden="true">→</span></button>');
  }
 }else if(report.status==='no-match'){
  h=waiting('reco-no-match','Aucune correspondance stricte','Ces exigences ne vont pas ensemble',
   'Aucune configuration ne remplit toutes tes contraintes. Tu peux rendre un rôle, la portée ou le familier non obligatoire.',
   '<button type="button" class="reco-hide-results" data-reco-hide>Revenir à mes réponses</button>');
 }else{
  h='<div class="reco-results-head"><div><span class="reco-kicker">Sélection personnalisée</span><h3>Tes meilleures pistes</h3></div>'+
   '<button type="button" class="reco-hide-results" data-reco-hide>Masquer les résultats</button></div>';
  h+='<p class="reco-results-meta">'+report.compatible+' configurations compatibles · '+report.used.length+' dimensions prises en compte</p>';
  h+='<p class="reco-note">Chaque piste retient une spécialisation pour l’ensemble de tes réponses. Ajouter une activité peut changer celle qui est proposée.</p>';
  var positions=X?X.ranks(report.results):[],tie=X?X.tieNote(report.results):'';
  if(tie)h+='<p class="reco-note reco-tie-note">'+esc(tie)+'</p>';
  if(X)X.contextNotes({profile:state}).forEach(function(note){h+='<p class="reco-note">'+esc(note)+'</p>';});
  h+='<div class="reco-cards">'+report.top.map(function(r,i){return resultCard(r,i,positions[i],hesitations(report));}).join('')+'</div>';
  if(report.uncertain.length)h+='<p class="reco-note">Sensibilité : '+report.uncertain.length+' préférence(s) hésitante(s) explorée(s). Ces scénarios ne sont pas des probabilités.</p>';
  else h+='<p class="reco-note">Ces scores sont des estimations de correspondance, pas des probabilités de satisfaction.</p>';
 }
 if(out.innerHTML!==h){
  out.innerHTML=h;
 }
 if(out.classList){
  out.classList.toggle('is-revealed',!!revealed&&report.status==='ok');
  out.classList.toggle('is-ready',ready);
 }
 try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
}
function showResults(){
 var report=E.recommend(state);
 if(report.status==='unanswered')return;
 revealed=true;renderResults();
 var r=root.querySelector('#reco-results');
 if(r&&r.scrollIntoView)r.scrollIntoView({behavior:window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:'nearest'});
}
function navigate(next){
 step=Math.max(0,Math.min(5,next));renderForm();
 var legend=root.querySelector('#reco-form .reco-question legend');
 if(legend&&typeof legend.focus==='function')legend.focus({preventScroll:true});
}
var form=root.querySelector('#reco-form'),resultsArea=root.querySelector('#reco-results');
var editSummary=root.querySelector('#reco-summary-panel');
if(editSummary)editSummary.addEventListener('click',function(ev){
 var b=ev.target.closest('button[data-summary-step]');
 if(b&&editSummary.contains(b))navigate(Number(b.dataset.summaryStep));
});
var stepRail=root.querySelector('#reco-rail');
if(stepRail)stepRail.addEventListener('click',function(ev){
 var b=ev.target.closest('button[data-step]');
 if(b&&stepRail.contains(b))navigate(Number(b.dataset.step));
});
resultsArea.addEventListener('click',function(ev){var b=ev.target.closest('button');if(!b)return;if(b.hasAttribute('data-reco-reveal')){showResults();renderForm();}else if(b.hasAttribute('data-reco-hide')){revealed=false;renderResults();renderForm();}});
form.addEventListener('click',function(ev){
 var b=ev.target.closest('button');if(!b||!form.contains(b))return;
 if(b.dataset.step!==undefined){navigate(Number(b.dataset.step));return;}
 if(b.hasAttribute('data-prev')){navigate(step-1);return;}
 if(b.hasAttribute('data-next')){navigate(step+1);return;}
 if(b.hasAttribute('data-show-results')){showResults();return;}
 var group=b.dataset.multi,key=b.dataset.key;
 if(group){
  if(Object.prototype.hasOwnProperty.call(state[group],key))delete state[group][key];
  else{
   if(group==='styles'&&E.selected(state.styles).length>=3)return;
   if(group==='healStyles'&&E.selected(state.healStyles).length>=2)return;
   state[group][key]=3;
  }
  renderForm();renderResults();return;
 }
 group=b.dataset.single;
 if(group){
  state[group].value=key;state[group].strict=false;state[group].certainty=3;
  renderForm();renderResults();return;
 }
 if(b.dataset.mastery!==undefined){state.mastery=Number(b.dataset.mastery);renderForm();renderResults();var old=document.querySelector&&document.querySelector('.mbtn[data-m="'+state.mastery+'"]');if(old)old.click();}
});
form.addEventListener('input',function(ev){
 var el=ev.target,group=el.dataset.certgroup,key=el.dataset.certkey;
 if(!group)return;
 var n=Number(el.value);
 if(group==='roles'||group==='healStyles'||group==='activities'||group==='styles')state[group][key]=n;
 else state[group].certainty=n;
 var output=form.querySelector('[data-certout="'+group+'/'+key+'"]');
 if(output)output.textContent=n+'/5 · '+certWords[n];
 el.setAttribute('aria-valuetext',certWords[n]);
 renderResults();
});
form.addEventListener('change',function(ev){
 var el=ev.target;
 if(el.hasAttribute('data-roles-strict'))state.rolesStrict=el.checked;
 if(el.dataset.strict)state[el.dataset.strict].strict=el.checked;
 renderResults();
});
root.querySelector('#reco-reset').addEventListener('click',function(){
 state=E.sanitize(null);step=0;revealed=false;renderForm();renderResults();
});
var advanced=document.getElementById('legacy-advanced');
if(advanced)advanced.addEventListener('toggle',function(){
 if(advanced.open)window.dispatchEvent(new Event('resize'));
});
window.WFGuide={getMastery:function(){return state.mastery;},setMastery:function(v){if(Number.isInteger(v)&&v>=0&&v<=3){state.mastery=v;renderForm();renderResults();}}};
renderForm();renderResults();
})();
