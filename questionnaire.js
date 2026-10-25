/* Présentation progressive de l'assistant ; calcul confié au moteur partagé. */
(function(){
'use strict';
var E=window.WFRecommend;
var X=window.WFResultExplanations;
var root=document.getElementById('reco-app');
if(!E||!root)return;
var KEY='wf-recommend-v1',state=E.sanitize(null),step=0,revealed=false;
var summaryExpanded=false;
function compactScreen(){return !!(window.matchMedia&&window.matchMedia('(max-width:820px)').matches);}
function tuning(group,content){return '<div class="reco-choice-details reco-tuning" data-tuning="'+group+'"><div class="reco-tuning-body">'+content+'</div></div>';}
// Pistes détaillées : cinq, dont au plus trois spécialisations d'une même classe ; le classement complet
// reste dans l'aperçu du classement.
var PISTES=5,firstWords=['','première','deux premières','trois premières','quatre premières','cinq premières','six premières'];
try{state=E.sanitize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){state=E.sanitize(null);}
/* Une exigence absolue n'est pas une hésitation : la certitude du choix exigé passe à 5/5 et son
 * curseur est verrouillé (rôles indispensables, portée exigée, uniquement sans familier). */
function lockStrict(){
 if(state.rolesStrict)E.selected(state.roles).forEach(function(k){state.roles[k]=5;});
 ['range','pet'].forEach(function(f){if(state[f].strict)state[f].certainty=5;});
}
lockStrict();
var names={
 roles:{dps:'DPS',tank:'Tank',soin:'Soin'},
 healStyles:{prevention:'Prévenir les dégâts',duree:'Soins sur la durée',cible:'Gros soins ciblés',groupe:'Soigner tout le groupe'},
 activities:{raid:'Donjons et raids',bg:'Champs de bataille',world:'PvP sauvage et duel',solo:'Solo, leveling et farm'},
 range:{distance:'À distance',melee:'Au corps-à-corps',mixte:'Pouvoir alterner'},
 styles:{burst:'Dégâts de burst',zone:'Dégâts de zone',ctrl:'Contrôle',surv:'Résistance',mob:'Mobilité',support:'Soutien'},
 pet:{like:"J'aime les familiers",avoid:'Je préfère éviter'},
 difficulty:{simple:'Accessible',complex:'Exigeant'}
};
var descriptions={
 roles:{dps:'Infliger des dégâts, en PvE ou en PvP',tank:'Encaisser pour le groupe en donjons et raids',soin:'Soigner et soutenir, en PvE ou en PvP'},
 healStyles:{prevention:'Boucliers et absorptions avant les coups',duree:'Des soins qui agissent dans le temps',cible:'Garder une cible en vie, souvent le tank',groupe:'Des soins qui touchent plusieurs alliés'},
 activities:{raid:'Jouer en groupe en PvE',bg:'Affrontements en équipe',world:'Combats imprévus et duels',solo:'Progresser, explorer et farmer seul'},
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
 var name=(names[group]||{})[key]||key,locked=group==='roles'?state.rolesStrict:(group==='range'||group==='pet')&&state[group].strict;
 return '<div class="reco-cert"><div class="reco-cert-head"><label for="rc-'+group+'-'+key+'">Certitude pour « '+esc(name)+' »</label>'+
   '<output data-certout="'+group+'/'+key+'">'+n+'/5 · '+certWords[n]+'</output></div>'+
   '<input id="rc-'+group+'-'+key+'" type="range" min="0" max="5" step="1" value="'+n+'" data-certgroup="'+group+'" data-certkey="'+key+'" aria-label="Certitude pour '+esc(name)+' (0 intuition, 5 certain)" aria-valuetext="'+esc(certWords[n])+'"'+(locked?' disabled':'')+'/>'+
   '<div class="reco-cert-scale"><span>0 · Intuition</span><span>5 · Certain</span></div>'+
   (locked?'<p class="reco-cert-locked">Exigence absolue : certitude maximale.</p>':'')+'</div>';
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
  var controls='<div class="reco-cert-list"><p class="reco-cert-title">À quel point es-tu sûr de ces envies ?</p>';
  chosen.forEach(function(k){controls+=certaintyControl(group,k,state[group][k]);});
  html+=tuning(group,controls+'</div>');
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
  html+='</div>';
 });
 html+='</div>';
 // Les réglages suivent toute la grille : sélectionner une réponse ne déplace plus ses voisines.
 if(selected!=='any'){
  var controls=certaintyControl(group,selected,state[group].certainty);
  if(group==='range')controls+='<label class="reco-strict"><input type="checkbox" data-strict="range" '+(state.range.strict?'checked':'')+'><span><strong>C’est une exigence absolue</strong><small>Écarte les configurations incompatibles.</small></span></label>';
  if(group==='pet'&&selected==='avoid')controls+='<label class="reco-strict"><input type="checkbox" data-strict="pet" '+(state.pet.strict?'checked':'')+'><span><strong>Je veux jouer uniquement sans familier</strong><small>Les builds avec compagnon seront écartés.</small></span></label>';
  html+=tuning(group,controls);
 }
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
  '<p class="reco-subquestion-hint" id="reco-heal-hint">Facultatif · jusqu’à deux choix pour trouver le soigneur qui te ressemble.</p>'+
  multi('healStyles',2)+'</div>';
}
function currentQuestion(){
 if(step===0)return question(1,'Quel rôle voudrais-tu jouer ?','Tu peux choisir plusieurs rôles ou simplement explorer ce qui t’attire.',
  multi('roles')+(E.selected(state.roles).length?'<label class="reco-strict"><input type="checkbox" data-roles-strict '+(state.rolesStrict?'checked':'')+'><span><strong>'+ (E.selected(state.roles).length>1?'Je veux pouvoir exercer tous ces rôles':'Ce rôle est indispensable pour moi')+'</strong><small>Une préférence seule ne bloque jamais les alternatives.</small></span></label>':'')+healQuestion());
 if(step===1)return question(2,'Quelles activités comptent pour toi ?','Coche les activités où tu veux que ta classe soit à l’aise. Tu peux en choisir plusieurs.',multi('activities')+
  (E.selected(state.roles).includes('tank')?'<p class="reco-note">Pour tanker en groupe, choisis « Donjons et raids ». Tu peux aussi ajouter tes autres envies.</p>':''));
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
 // À la dernière question, « Voir mes résultats » prend la place de « Question suivante » ; le bloc
 // sous le questionnaire, qui propose de prévisualiser les résultats aux questions 1 à 5, s'efface alors.
 var empty=step===5&&E.recommend(state).status==='unanswered';
 html+='<div class="reco-form-footer"><button type="button" class="reco-back" data-prev '+(step===0?'disabled':'')+'>← Précédent</button>'+
  '<span class="reco-form-help" id="reco-form-help">'+(step<5?'Tu peux passer une question.':empty?'Choisis au moins une préférence pour voir tes résultats.':'Dernière question : tu peux la passer.')+'</span>'+
  (step<5?'<button type="button" class="reco-next" data-next>Question suivante →</button>':
   '<button type="button" class="reco-next" data-show-results aria-describedby="reco-form-help"'+(empty?' disabled':'')+'>Voir mes résultats ↓</button>')+'</div>';
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
 var summaryMarkup='<div class="reco-summary-header"><span class="reco-kicker">Mes choix</span><span class="reco-summary-count">'+answered().filter(Boolean).length+' / 6 thèmes</span><button type="button" class="reco-summary-toggle" data-summary-toggle aria-controls="reco-summary-choices" aria-expanded="'+summaryExpanded+'" aria-label="'+(summaryExpanded?'Masquer':'Afficher')+' mes choix">'+(summaryExpanded?'Masquer':'Afficher')+'</button></div>'+
  '<div id="reco-summary-choices" class="reco-summary-rows'+(summaryExpanded?' is-expanded':'')+'">'+summaryRows.map(function(item,i){
   return '<div class="reco-summary-row'+(item.value&&!(i===5&&state.mastery===2)?' is-filled':'')+'"><span class="reco-summary-index">'+(i+1)+'</span>'+
   '<span class="reco-summary-name">'+item.title+'</span><span class="reco-summary-value">'+esc(item.value||'Non renseigné')+'</span>'+
   '<button type="button" class="reco-summary-edit" data-summary-step="'+i+'" aria-label="Modifier '+item.title+'">✎</button></div>';
  }).join('')+'</div>';
 if(summaryPanel)summaryPanel.innerHTML=summaryMarkup;
 else html+='<div class="reco-summary" aria-label="Mes choix">'+summaryMarkup+'</div>';
 form.innerHTML=html;
}
function fitLabel(v){
 return X.fitWords(v);
}
/* « Pourquoi cette piste » : part de chaque critère dans le score, stabilité face aux réponses
 * hésitantes (scénarios du moteur), sources. */
function hesitations(report){
 return (report.uncertain||[]).map(function(label){
  var m=/^Sans (\w+)(?:\/(\w+))?$/.exec(label);
  if(!m)return '';
  return m[2]?(names[m[1]]||{})[m[2]]||m[2]:labels[m[1]]||m[1];
 }).filter(Boolean);
}
function whyBlock(r,hesitant){
 var explanation=E.explain(r.spec.id,state);
 var parts=X?X.pisteParts(explanation,r.fit,r.score):[];
 var stability=r.scenarioCount<=1?'Tes choix sont assez affirmés pour dessiner cette piste.':
  r.scenarioAppearances===r.scenarioCount?'Elle reste parmi tes pistes quand on retire tes réponses hésitantes.':
  'Sa place dépend de certaines envies sur lesquelles tu hésites encore. Tu peux les préciser en revenant aux questions.';
 return '<details class="reco-evidence reco-why"><summary>Pourquoi cette piste</summary>'+
  '<p class="reco-friendly-summary">'+esc(X.friendlySummary(explanation,false))+'</p>'+
  (X.learningNote(explanation)?'<p>'+esc(X.learningNote(explanation))+'</p>':'')+
  (X.pveProfile(explanation)?'<p>'+esc(X.pveProfile(explanation))+'</p>':'')+
  X.friendlyHtml(X.friendlyGroups(explanation,false))+
  '<p><b>Si tu changes d’avis :</b> '+esc(stability)+'</p>'+
  X.calculationHtml(parts)+
  '<p><a href="fiches-sources/'+esc(r.classId)+'.html#'+esc(r.spec.id)+(r.spec.variant==='sans-familier'?'-sans-familier':'')+'">Comprendre les notes et voir les sources du '+esc(r.className)+'</a></p>'+
  '</details>';
}
/* « Correspond à tes envies » et « À garder en tête » lisent la même analyse que « Pourquoi cette piste »
 * (fit et score de la piste) : le critère nommé est le premier du bilan des points manquants. */
function resultCard(r,i,position,hesitant){
 var explanation=E.explain(r.spec.id,state);
 var strong=X.friendlyStrengths(explanation,r.fit,r.score);
 var weak=X.friendlyKeep(explanation,r.fit,r.score);
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
/* Aperçu du classement, à droite du questionnaire : les spécialisations selon les réponses actuelles,
 * dans un bloc repliable fermé par défaut (les résultats restent affichés à la demande). Depuis la v10,
 * une classe peut revenir ; les dix premières sont affichées, les autres sur demande. */
var live=root.querySelector('#reco-live-body'),LIVE_VISIBLE=10,liveAll=false,lastLive=null;
function moreButton(attr,total,open){
 return total>LIVE_VISIBLE?'<button type="button" class="reco-more" '+attr+' aria-expanded="'+open+'">'+
  (open?'Afficher les '+LIVE_VISIBLE+' premières seulement':'Voir les '+(total-LIVE_VISIBLE)+' autres spécialisations')+'</button>':'';
}
function renderLive(report){
 if(!live)return;
 var h;lastLive=report;
 if(report.status==='unanswered')h='<p class="reco-live-empty">Réponds à une question : les spécialisations se classeront ici à chaque réponse.</p>';
 else if(report.status==='no-match')h='<p class="reco-live-empty">Aucune configuration ne remplit toutes tes exigences.</p>';
 else{
  var positions=X?X.ranks(report.results):[];
  h=(report.used.length<2?'<p class="reco-live-note">Avec une seule préférence, ce classement est encore peu parlant.</p>':'')+
   '<ol class="reco-live-list">'+report.results.slice(0,liveAll?report.results.length:LIVE_VISIBLE).map(function(r,i){
    var p=positions[i]||{rank:i+1},score=Math.round(r.score);
    return '<li value="'+p.rank+'" style="--reco-class:var(--k-'+esc(r.spec.classId)+')"><span class="reco-live-rank">'+p.rank+'</span>'+
     '<img src="'+wowClassIcon(r.spec.classId)+'" alt="" width="28" height="28" loading="lazy" decoding="async">'+
     '<span class="reco-live-name"><b>'+esc(r.spec.className)+'</b><small>'+esc(r.spec.label)+(r.spec.variant==='sans-familier'?' · sans familier':'')+'</small></span>'+
     '<span class="reco-live-score">'+score+'</span><span class="reco-live-bar" aria-hidden="true"><i style="width:'+Math.max(0,Math.min(100,score))+'%"></i></span></li>';
   }).join('')+'</ol>'+moreButton('data-live-more',report.results.length,liveAll);
 }
 if(live.innerHTML!==h)live.innerHTML=h;
}
if(live&&live.addEventListener)live.addEventListener('click',function(ev){
 if(!ev.target.closest||!ev.target.closest('[data-live-more]')||!lastLive)return;
 liveAll=!liveAll;renderLive(lastLive);
 var again=live.querySelector&&live.querySelector('[data-live-more]');if(again&&again.focus)again.focus();
});
function canReveal(report){return !revealed&&report.status==='ok'&&report.used.length>=2;}
function renderResults(){
 var report=E.recommend(state,PISTES),out=root.querySelector('#reco-results'),h='';
 var ready=canReveal(report);
 renderLive(report);
 if(report.status==='unanswered'){
  h=waiting('reco-intro','Ta prochaine aventure','Tout commence par tes envies.',
   'Choisis ce qui t’attire : nous construirons ta sélection étape par étape, sans favoriser de classe au départ.',discovery(0));
 }else if(!revealed){
  if(report.used.length<2&&report.status==='ok'){
   h=waiting('reco-awaiting','Une première piste','Encore un peu de contexte…',
    'Un seul choix ne définit pas ton style. Continue à ton rythme : une autre préférence rendra l’aperçu plus pertinent.',discovery(1));
  }else if(step<5){
   h=waiting('reco-ready','Une sélection prend forme','Prêt à découvrir tes pistes ?',
    'Tes réponses permettent déjà une comparaison. Tu peux continuer les questions ou prévisualiser tes résultats dès maintenant : ils s’affineront à chaque réponse.',
    '<button type="button" class="reco-reveal-button" data-reco-reveal>Prévisualiser mes résultats <span aria-hidden="true">→</span></button>');
  }
 }else if(report.status==='no-match'){
  h=waiting('reco-no-match','Aucune correspondance stricte','Ces exigences ne vont pas ensemble',
   'Aucune configuration ne remplit toutes tes contraintes. Tu peux rendre un rôle, la portée ou le familier non obligatoire.',
   '<button type="button" class="reco-hide-results" data-reco-hide>Revenir à mes réponses</button>');
 }else{
  h='<div class="reco-results-head"><div><span class="reco-kicker">Sélection personnalisée</span><h3>Tes meilleures pistes</h3></div>'+
   '<button type="button" class="reco-hide-results" data-reco-hide>Masquer les résultats</button></div>';
  h+='<p class="reco-note">Tes '+report.top.length+' meilleures pistes. Chaque piste est une spécialisation : une même classe peut en proposer '+(E.perClass?['','une','deux','trois','quatre','cinq'][E.perClass(report.top.length)]||E.perClass(report.top.length):'plusieurs')+' au plus, les places suivantes revenant à d’autres classes.</p>';
  // Rangs et égalités entre les pistes affichées (le top 3 peut sauter une troisième spécialisation d'une même classe).
  var positions=X?X.ranks(report.top):[],tie=X?X.tieNote(report.results):'';
  if(tie)h+='<p class="reco-note reco-tie-note">'+esc(tie)+'</p>';
  if(X)X.contextNotes({profile:state}).forEach(function(note){h+='<p class="reco-note">'+esc(note)+'</p>';});
  h+='<div class="reco-cards">'+report.top.map(function(r,i){return resultCard(r,i,positions[i],hesitations(report));}).join('')+'</div>';
  if(report.results.length>report.top.length)h+='<button type="button" class="reco-more" data-reco-full>Voir le classement complet des '+report.results.length+' spécialisations</button>';
  if(report.uncertain.length)h+='<p class="reco-note">Sensibilité : '+report.uncertain.length+' préférence(s) hésitante(s) explorée(s). Ces scénarios ne sont pas des probabilités.</p>';
  else h+='<p class="reco-note">Ces scores sont des estimations de correspondance, pas des probabilités de satisfaction.</p>';
 }
 if(out.innerHTML!==h){
  out.innerHTML=h;
 }
 out.hidden=!h;
 if(out.classList){
  out.classList.toggle('is-revealed',!!revealed&&report.status==='ok');
  out.classList.toggle('is-ready',ready&&!!h);
 }
 try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
}
function showResults(){
 var report=E.recommend(state);
 if(report.status==='unanswered')return;
 revealed=true;renderResults();
 var r=root.querySelector('#reco-results');
 if(r&&r.scrollIntoView)r.scrollIntoView({behavior:compactScreen()||window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth',block:compactScreen()?'start':'nearest'});
}
function navigate(next){
 step=Math.max(0,Math.min(5,next));renderForm();renderResults();
 var legend=root.querySelector('#reco-form .reco-question legend');
 if(legend&&typeof legend.focus==='function')legend.focus({preventScroll:true});
 if(compactScreen()){var workspace=root.querySelector('.reco-workspace');if(workspace&&workspace.scrollIntoView)workspace.scrollIntoView({behavior:'auto',block:'start'});}
}
var form=root.querySelector('#reco-form'),resultsArea=root.querySelector('#reco-results');
var editSummary=root.querySelector('#reco-summary-panel');
if(editSummary)editSummary.addEventListener('click',function(ev){
 if(ev.target.closest('[data-summary-toggle]')){summaryExpanded=!summaryExpanded;renderForm();var toggle=editSummary.querySelector('[data-summary-toggle]');if(toggle&&toggle.focus)toggle.focus({preventScroll:true});return;}
 var b=ev.target.closest('button[data-summary-step]');
 if(b&&editSummary.contains(b))navigate(Number(b.dataset.summaryStep));
});
var stepRail=root.querySelector('#reco-rail');
if(stepRail)stepRail.addEventListener('click',function(ev){
 var b=ev.target.closest('button[data-step]');
 if(b&&stepRail.contains(b))navigate(Number(b.dataset.step));
});
resultsArea.addEventListener('click',function(ev){
 var b=ev.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-reco-full')){
  // Le classement complet est l'aperçu du classement : on l'ouvre, en entier, et on y conduit le joueur.
  var panel=root.querySelector('#reco-live');
  if(panel){panel.open=true;liveAll=true;if(lastLive)renderLive(lastLive);
   if(panel.scrollIntoView)panel.scrollIntoView({block:'start',behavior:window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
   var summary=panel.querySelector('summary');if(summary&&summary.focus)summary.focus({preventScroll:true});}
  return;
 }
 if(b.hasAttribute('data-reco-reveal'))showResults();
 else if(b.hasAttribute('data-reco-hide')){
  revealed=false;renderResults();
  // Le bouton cliqué disparaît : le focus va au bouton qui rouvre les résultats.
  var again=resultsArea.querySelector&&resultsArea.querySelector('[data-reco-reveal]')||form.querySelector('[data-show-results]');
  if(again&&again.focus){again.focus({preventScroll:true});if(again.scrollIntoView)again.scrollIntoView({block:'nearest'});}
 }
});
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
   state[group][key]=group==='roles'&&state.rolesStrict?5:3;
  }
  renderForm();renderResults();var again=form.querySelector('[data-multi="'+group+'"][data-key="'+key+'"]');if(again&&again.focus)again.focus({preventScroll:true});return;
 }
 group=b.dataset.single;
 if(group){
  if(state[group].value===key)return;
  state[group].value=key;state[group].strict=false;state[group].certainty=3;
  renderForm();renderResults();var again=form.querySelector('[data-single="'+group+'"][data-key="'+key+'"]');if(again&&again.focus)again.focus({preventScroll:true});return;
 }
 if(b.dataset.mastery!==undefined){state.mastery=Number(b.dataset.mastery);renderForm();renderResults();if(window.WFPriorities&&window.WFPriorities.setMastery)window.WFPriorities.setMastery(state.mastery);}
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
 var el=ev.target,roles=el.hasAttribute('data-roles-strict');
 if(roles)state.rolesStrict=el.checked;
 if(el.dataset.strict)state[el.dataset.strict].strict=el.checked;
 if(roles||el.dataset.strict){
  lockStrict();renderForm();
  var again=form.querySelector&&form.querySelector(roles?'[data-roles-strict]':'[data-strict="'+el.dataset.strict+'"]');
  if(again&&again.focus)again.focus({preventScroll:true});
 }
 renderResults();
});
root.querySelector('#reco-reset').addEventListener('click',function(){
 state=E.sanitize(null);step=0;revealed=false;summaryExpanded=false;
 renderForm();renderResults();
});
window.WFGuide={getMastery:function(){return state.mastery;},setMastery:function(v){if(Number.isInteger(v)&&v>=0&&v<=3){state.mastery=v;renderForm();renderResults();}}};
renderForm();renderResults();
})();
