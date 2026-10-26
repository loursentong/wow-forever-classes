/* Mode personnalisé : 15 critères pondérés de 0 à 3, des profils concrets et la maîtrise.
 * Il garde son propre état (sauvegardé dans wf-overview-v3, schéma inchangé) et produit son
 * classement avec le moteur unique par spécialisation. Il gère aussi le choix du parcours. */
(function(){
'use strict';
var E=window.WFRecommend,D=window.__WF,P=window.WFPriorityProfiles,root=document.getElementById('reco-app');
var X=window.WFResultExplanations;
if(!E||!D||!P||!root||typeof E.priorityRanking!=='function')return;
var modes=Array.prototype.slice.call(root.querySelectorAll('[data-reco-mode]'));
var guided=root.querySelector('#reco-guided'),priority=root.querySelector('#reco-priorities');
var form=root.querySelector('#reco-priority-form'),output=root.querySelector('#reco-priority-results');
var KEY='wf-reco-mode-v1',CUSTOM_KEY='wf-priority-custom-v1',STATE_KEY='wf-overview-v3';
// Mots de l'échelle 0 à 3, repris dans les explications (« Priorité essentielle (3) »).
var words=X&&X.priorityWords||['sans importance','secondaire','importante','essentielle'];
// État du mode personnalisé. Les champs hérités (hl, c) d'une ancienne sauvegarde sont conservés tels quels.
var presets={};Object.keys(D.presets).forEach(function(k){presets[k]=E.priorityPreset(k,D.presets[k]);});
P.forEach(function(p){presets[p.id]=E.sanitizeWeights(p.weights);});
var popular=P.map(function(p){return p.id;});
var S={w:Object.assign({},presets.egal),m:2,extra:{}},hasMastery=false;
function validW(o){return !!o&&typeof o==='object'&&!Array.isArray(o)&&E.priorityAxes.every(function(k){return k==='raid'&&o[k]===undefined||Number.isInteger(o[k])&&o[k]>=0&&o[k]<=3;});}
function presetOf(w){return popular.concat(Object.keys(D.presets)).find(function(p){return E.priorityAxes.every(function(k){return presets[p][k]===w[k];});})||null;}
// Burst et Dégâts de zone datent du 20 octobre 2026 : une sauvegarde antérieure ne les contient pas.
// Ils prennent alors 0, sauf si tous les autres critères avaient le même poids : ils reçoivent ce poids.
var ADDED=['burst','zone'];
function loadWeights(src){
 S.w.raid=Number.isInteger(src.raid)&&src.raid>=0&&src.raid<=3?src.raid:0;
 E.priorityAxes.forEach(function(k){if(Number.isInteger(src[k])&&src[k]>=0&&src[k]<=3)S.w[k]=src[k];});
 if(ADDED.some(function(k){return Object.prototype.hasOwnProperty.call(src,k);}))return;
 var rest=E.priorityAxes.filter(function(k){return k!=='raid'&&ADDED.indexOf(k)<0;}).map(function(k){return S.w[k];});
 var same=rest.every(function(v){return v===rest[0];})?rest[0]:0;
 ADDED.forEach(function(k){S.w[k]=same;});
}
try{
 var saved=localStorage.getItem(STATE_KEY)||localStorage.getItem('wf-overview-v2');
 var stored=saved?JSON.parse(saved):null;
 if(stored&&typeof stored==='object'&&!Array.isArray(stored)){
  if(stored.w&&typeof stored.w==='object')loadWeights(stored.w);
  if(Number.isInteger(stored.m)&&stored.m>=0&&stored.m<=3){S.m=stored.m;hasMastery=true;}
  ['hl','c'].forEach(function(k){if(Object.prototype.hasOwnProperty.call(stored,k))S.extra[k]=stored[k];});
 }else if(!saved){
  var oldWeights=JSON.parse(localStorage.getItem('wf-overview-weights')||'null');
  if(oldWeights&&typeof oldWeights==='object')loadWeights(oldWeights);
  var oldLevel=['debutant','intermediaire','confirme','expert'].indexOf(localStorage.getItem('wf-overview-skill'));
  if(oldLevel>=0){S.m=oldLevel;hasMastery=true;}
 }
}catch(e){}
// Une pondération personnelle enregistrée avant « Mes critères » le devient.
if(!validW(S.extra.c)&&!presetOf(S.w))S.extra.c=Object.assign({},S.w);
function save(){try{localStorage.setItem(STATE_KEY,JSON.stringify(Object.assign({},S.extra,{w:S.w,m:S.m})));}catch(e){}}
var savedCustom=null;
try{
 var stored=JSON.parse(localStorage.getItem(CUSTOM_KEY)||'null');
 if(stored&&stored.weights&&Number.isInteger(stored.mastery)&&stored.mastery>=0&&stored.mastery<=3){
  var cleaned=E.sanitizeWeights(stored.weights);
  if(validW(stored.weights))
   savedCustom={weights:cleaned,mastery:stored.mastery};
 }
 // Compatibilité : sauvegarde historique de « Mes critères » (ancienne interface).
 if(!savedCustom){
  if(validW(S.extra.c))savedCustom={weights:E.sanitizeWeights(S.extra.c),mastery:S.m};
 }
}catch(err){savedCustom=null;}
function isCurrentCustom(w,m){
 return !!savedCustom&&savedCustom.mastery===m&&E.priorityAxes.every(function(k){return savedCustom.weights[k]===w[k];});
}
var groupExpanded={0:true},preview=null;
var axes=[
 {name:'Rôles',items:[['tank','Tank'],['soin','Soin'],['dps','DPS']],hint:'Choisis ce que tu veux faire. L’aisance dans ce rôle suit tes activités ci-dessous.'},
 {name:'Activités',items:[['raid','Donjons et raids'],['bg','Champ de bataille'],['sauv','PvP sauvage'],['solo','Solo, leveling et farm']],hint:'PvE de groupe, solo, PvP : choisis les activités qui comptent pour toi.'},
 {name:'Style de combat',items:[['burst','Dégâts de burst'],['zone','Dégâts de zone'],['ctrl','Contrôle'],['surv','Résistance'],['mob','Mobilité'],['util','Soutien']],hint:'Le burst, c’est frapper fort en peu de temps. Choisis les qualités qui te plaisent.'},
 {name:'Affinités facultatives',items:[['poly','Polyvalence'],['tech','Technicité']],hint:'La polyvalence et la difficulté ne sont valorisées que si tu les demandes expressément.'}
];
var mastery=['Débutant','Intermédiaire','Confirmé','Expert'];
var WOW_ICON_BASE='https://render.worldofwarcraft.com/us/icons/56/classicon_';
var wowClassIcons={guerrier:'warrior',paladin:'paladin',chasseur:'hunter',voleur:'rogue',pretre:'priest',chaman:'shaman',mage:'mage',demoniste:'warlock',druide:'druid'};
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function weights(){return Object.assign({},S.w);}
function currentMastery(){return S.m;}
function presetMatch(w){
 return presetOf(w);
}
function makePreset(k,active){
 var p=P.find(function(p){return p.id===k;});
 return '<button type="button" class="reco-template" data-prio-preset="'+k+'" data-prio-icon="'+p.icon+'" title="'+esc(p.description)+'" aria-pressed="'+(active===k)+'"'+(active===k?' aria-describedby="prio-profile-hint"':'')+'>'+esc(p.label)+'</button>';
}
function controls(){
 var w=weights(),active=presetMatch(w),profile=P.find(function(p){return p.id===active;}),html='';
 html+='<div class="reco-priority-presets"><div><span class="reco-kicker">Démarrer avec un profil</span><p id="prio-profile-hint" aria-live="polite">'+esc(profile?profile.description:'Choisis un exemple, puis adapte chaque critère à ta façon.')+'</p></div>';
 html+='<div class="reco-template-list">'+popular.map(function(k){return makePreset(k,active);}).join('')+'</div></div>';
 html+='<div class="reco-custom-toolbar" aria-label="Sauvegarde des critères personnels"><div class="reco-custom-copy">'+
  '<strong>Mes critères personnels</strong><small>Enregistre tes poids et ta maîtrise sur cet appareil, puis retrouve-les après avoir essayé les profils.</small></div>'+
  '<div class="reco-custom-actions"><button type="button" data-prio-save>'+
  (savedCustom?(isCurrentCustom(w,currentMastery())?'✓ Critères enregistrés':'Mettre à jour mes critères'):'Enregistrer mes critères')+'</button>'+
  (savedCustom?'<button type="button" data-prio-restore '+(isCurrentCustom(w,currentMastery())?'disabled':'')+'>Reprendre mes critères</button>':'')+'</div></div>';
 html+='<div class="reco-priority-mastery"><div><b>Ton niveau de maîtrise</b><small>Influence les performances réalisables, pas le goût pour la difficulté.</small></div><div class="reco-mastery-choices" role="group" aria-label="Maîtrise pour le classement des priorités">'+
  mastery.map(function(name,i){return '<button type="button" data-prio-mastery="'+i+'" aria-pressed="'+(currentMastery()===i)+'">'+name+'</button>';}).join('')+'</div></div>';
 html+='<section class="reco-priority-groups" aria-labelledby="prio-importance-title"><div class="reco-priority-intro"><h4 id="prio-importance-title">Importance de chaque critère</h4><p><strong>0</strong> Sans importance · <strong>1</strong> Secondaire · <strong>2</strong> Importante · <strong>3</strong> Essentielle</p></div>';
 axes.forEach(function(g,index){
  var count=g.items.filter(function(it){return w[it[0]]>0;}).length,expanded=!!groupExpanded[index];
  html+='<section class="reco-priority-group'+(expanded?' is-expanded':'')+'"><div class="reco-priority-group-head"><h5>'+g.name+'</h5><span class="reco-priority-group-count">'+count+' actif'+(count>1?'s':'')+'</span><button type="button" class="reco-priority-group-toggle" data-prio-group-toggle="'+index+'" aria-expanded="'+expanded+'" aria-controls="prio-group-'+index+'" aria-label="'+(expanded?'Replier':'Déplier')+' '+g.name+'">'+(expanded?'Replier':'Déplier')+'</button><p>'+g.hint+'</p></div><div class="reco-priority-fields" id="prio-group-'+index+'">';
  g.items.forEach(function(it){
   var val=w[it[0]];
   var help=X&&X.criteria[it[0]];
   html+='<div class="reco-priority-row"><span class="reco-priority-label"><span class="reco-priority-name"><strong>'+it[1]+'</strong><span class="reco-priority-level" data-prio-level="'+it[0]+'">'+esc(words[val])+'</span></span>'+
    (help?'<small id="prio-help-'+it[0]+'">'+esc(help)+'</small>':'')+'</span>'+
    '<div class="reco-weights" role="group" aria-label="Importance de '+esc(it[1])+'"'+(help?' aria-describedby="prio-help-'+it[0]+'"':'')+'>'+[0,1,2,3].map(function(n){
      return '<button type="button" data-prio-axis="'+it[0]+'" data-prio-weight="'+n+'" aria-pressed="'+(val===n)+'" aria-label="'+it[1]+' : '+(n?'priorité '+words[n]:words[0])+' ('+n+')">'+n+'</button>';
    }).join('')+'</div></div>';
  });
  html+='</div></section>';
 });
 html+='</section>';
 html+='<div class="reco-priority-footer"><p>Les critères à 0 ne comptent pas.</p>'+
  '<button type="button" data-prio-clear>Tout remettre à zéro</button></div>';
 form.innerHTML=html;
}
function classify(v){
 if(v>=80)return 'Très bonne piste';
 if(v>=65)return 'Bonne correspondance';
 return 'À explorer';
}
function whyPlace(x,w,m){
 var ex=X&&E.priorityExplain?E.priorityExplain(x.spec.id,w,m):null;
 if(!ex)return '';
 var parts=X.priorityParts(ex,x.score);
 return '<details class="reco-evidence reco-why"><summary>Pourquoi cette place</summary>'+
  '<p class="reco-friendly-summary">'+esc(X.friendlySummary(ex,true))+'</p>'+
  (X.learningNote(ex)?'<p>'+esc(X.learningNote(ex))+'</p>':'')+
  (X.pveProfile(ex)?'<p>'+esc(X.pveProfile(ex))+'</p>':'')+
  X.friendlyHtml(X.friendlyGroups(ex,true))+X.calculationHtml(parts)+
  '<p><a href="fiches-sources/'+esc(x.classId)+'.html#'+esc(x.spec.id)+(x.spec.variant==='sans-familier'?'-sans-familier':'')+'">Comprendre les notes et voir les sources du '+esc(x.className)+'</a></p>'+
  '</details>';
}
// Les dix premières spécialisations sont affichées, les autres sur demande (référence v10).
var VISIBLE=10,showAll=false;
function results(){
 var w=weights(),r=E.priorityRanking(w,currentMastery()),h='';
 if(r.status==='unanswered'){
  h='<div class="reco-empty"><span class="reco-kicker">À toi de définir les règles</span><h3>Aucune priorité définie</h3>'+
   '<p>Active un critère pour classer les spécialisations des neuf classes, chacune avec ses propres notes, et non par une addition de leurs rôles.</p></div>';
 }else{
  var described=r.active.length;
  h='<div class="reco-results-head"><div><span class="reco-kicker">Classement personnalisé</span><h3>Les spécialisations selon tes critères</h3></div>'+
    '<p>'+described+' critère'+(described>1?'s':'')+' actif'+(described>1?'s':'')+' · maîtrise '+mastery[currentMastery()]+'</p><button type="button" class="reco-share-button" data-share-results="priorities">Partager mes résultats</button></div>';
  h+='<p class="reco-note">Chaque spécialisation est classée avec ses propres notes : une même classe peut donc revenir plusieurs fois.</p>';
  var positions=X?X.ranks(r.results):[],tie=X?X.tieNote(r.results):'';
  if(tie)h+='<p class="reco-note reco-tie-note">'+esc(tie)+'</p>';
  if(X)X.contextNotes({weights:w}).forEach(function(note){h+='<p class="reco-note">'+esc(note)+'</p>';});
  h+='<ol class="reco-priority-ranking">';
  r.results.slice(0,showAll?r.results.length:VISIBLE).forEach(function(x,i){
    var rounded=Math.round(x.score),hint=X?X.rankHint(r.results,i):'';
    var position=positions[i]||{rank:i+1,tied:false,leader:i===0};
    h+='<li class="reco-priority-class'+(position.leader?' is-leading':'')+'" value="'+position.rank+'" style="--reco-class:var(--k-'+esc(x.classId)+')">'+
     '<span class="reco-priority-place" aria-label="Rang '+position.rank+(position.tied?', à égalité':'')+'">'+position.rank+'</span>'+
     '<span class="reco-priority-class-icon" aria-hidden="true"><img src="'+WOW_ICON_BASE+wowClassIcons[x.classId]+'.jpg" width="30" height="30" alt="" loading="lazy" decoding="async"></span>'+
     '<span class="reco-priority-class-info"><b>'+esc(x.className)+'</b><small>'+
     '<strong>'+esc(x.spec.label)+'</strong> · '+(x.spec.range==='distance'?'Distance':'Mêlée')+(hint?' · '+esc(hint):'')+'</small></span>'+
     '<span class="reco-priority-score">'+rounded+'<small>/100</small></span>'+
     '<span class="reco-priority-line" aria-hidden="true"><i style="width:'+Math.max(0,Math.min(100,rounded))+'%"></i></span>'+
     '<div class="reco-priority-more">'+(window.WFConfigurationDetails?window.WFConfigurationDetails(x.spec):'')+whyPlace(x,w,currentMastery())+'</div></li>';
  });
  h+='</ol>'+(r.results.length>VISIBLE?'<button type="button" class="reco-more" data-prio-more aria-expanded="'+showAll+'">'+
   (showAll?'Afficher les '+VISIBLE+' premières seulement':'Voir les '+(r.results.length-VISIBLE)+' autres spécialisations')+'</button>':'')+
   '<p class="reco-note">Chaque spécialisation est évaluée avec ses propres notes. Les rôles ne sont comptés qu’une fois ; la polyvalence et la technicité n’interviennent que si tu les actives. Les faibles écarts ne prouvent pas de supériorité.</p>';
  if(r.active.length===1)h+='<p class="reco-note">Avec un seul critère actif, le poids 1, 2 ou 3 ne change pas les proportions du score : il détermine son importance par rapport à d’autres critères si tu en ajoutes.</p>';
  if(presetMatch(w)==='egal')h+='<p class="reco-note">« Tous les critères » est un scénario de référence, pas un profil neutre du joueur : pour une recommandation personnelle, précise ce qui compte vraiment.</p>';
 }
 if(r.status==='ok')h+='<div class="reco-share-footer"><span>Envie d’en parler avec un ami ?</span><button type="button" class="reco-share-button" data-share-results="priorities">Partager mes résultats</button></div>';
 output.innerHTML=h;
}
function setMastery(level,fromGuide){
 if(!Number.isInteger(level)||level<0||level>3)return;
 S.m=level;save();
 if(!fromGuide&&window.WFGuide&&window.WFGuide.setMastery)window.WFGuide.setMastery(level);
}
function applyWeights(newW,newMastery){
 S.w=E.sanitizeWeights(newW);save();
 setMastery(newMastery);
 sync();
}
function sync(button){
 var selector='';
 if(button){
  if(button.dataset.prioAxis!==undefined)selector='[data-prio-axis="'+button.dataset.prioAxis+'"][data-prio-weight="'+button.dataset.prioWeight+'"]';
  else if(button.dataset.prioMastery!==undefined)selector='[data-prio-mastery="'+button.dataset.prioMastery+'"]';
  else if(button.dataset.prioPreset)selector='[data-prio-preset="'+button.dataset.prioPreset+'"]';
 }
 controls();results();
 var again=selector&&form.querySelector&&form.querySelector(selector);if(again&&again.focus)again.focus({preventScroll:true});
}
function setMode(m,temporary){
 if(m===null){
  root.classList.add('is-choosing');guided.hidden=true;priority.hidden=true;
  var last=null;try{last=localStorage.getItem(KEY);}catch(e){}
  modes.forEach(function(b){b.setAttribute('aria-selected','false');b.tabIndex=0;if(b.dataset.recoMode===last)b.setAttribute('data-last','true');else b.removeAttribute('data-last');});return;
 }
 var choosing=root.classList.contains('is-choosing'),isPriority=m==='priorities';
 root.classList.remove('is-choosing');
 priority.hidden=!isPriority;guided.hidden=isPriority;
 modes.forEach(function(b){b.setAttribute('aria-selected',String(b.dataset.recoMode===m));b.tabIndex=b.dataset.recoMode===m?0:-1;if(!temporary)b.removeAttribute('data-last');});
 if(isPriority)sync();
 if(!temporary)try{localStorage.setItem(KEY,m);}catch(e){}
 // Après le premier choix, les deux cartes deviennent des onglets : on garde le parcours en vue.
 var bar=root.querySelector('.reco-modes');
 if(choosing&&bar&&bar.scrollIntoView)bar.scrollIntoView({block:'start',behavior:window.matchMedia&&(window.matchMedia('(max-width:820px)').matches||window.matchMedia('(prefers-reduced-motion: reduce)').matches)?'auto':'smooth'});
}
modes.forEach(function(b){
 b.addEventListener('click',function(){setMode(b.dataset.recoMode);});
 b.addEventListener('keydown',function(ev){
  if(['ArrowRight','ArrowLeft','Home','End'].indexOf(ev.key)<0)return;
  ev.preventDefault();var i=ev.key==='Home'?0:ev.key==='End'?modes.length-1:
    (modes.indexOf(b)+(ev.key==='ArrowRight'?1:-1)+modes.length)%modes.length;
  modes[i].focus();setMode(modes[i].dataset.recoMode);
 });
});
output.addEventListener('click',function(ev){
 var b=ev.target.closest&&ev.target.closest('[data-prio-more]');if(!b)return;
 showAll=!showAll;results();
 var again=output.querySelector&&output.querySelector('[data-prio-more]');if(again&&again.focus)again.focus();
});
form.addEventListener('click',function(ev){
 var b=ev.target.closest('button');if(!b||!form.contains(b))return;
 if(b.dataset.prioGroupToggle!==undefined){groupExpanded[b.dataset.prioGroupToggle]=!groupExpanded[b.dataset.prioGroupToggle];sync();var toggle=form.querySelector('[data-prio-group-toggle="'+b.dataset.prioGroupToggle+'"]');if(toggle&&toggle.focus)toggle.focus({preventScroll:true});return;}
 if(b.hasAttribute('data-prio-save')){
  savedCustom={weights:E.sanitizeWeights(weights()),mastery:currentMastery()};
  try{localStorage.setItem(CUSTOM_KEY,JSON.stringify(savedCustom));}catch(e){}
  sync(b);return;
 }
 if(b.hasAttribute('data-prio-restore')){
  if(savedCustom)applyWeights(savedCustom.weights,savedCustom.mastery);
  return;
 }
 if(b.dataset.prioAxis!==undefined){
  var axis=b.dataset.prioAxis,weight=Number(b.dataset.prioWeight);
  if(E.priorityAxes.indexOf(axis)>=0&&weight>=0&&weight<=3){S.w[axis]=weight;save();}
  sync(b);return;
 }
 if(b.dataset.prioPreset){
  if(presets[b.dataset.prioPreset]){
   S.w=Object.assign({},presets[b.dataset.prioPreset]);save();
   groupExpanded={};axes.forEach(function(g,i){if(g.items.some(function(it){return S.w[it[0]]>0;}))groupExpanded[i]=true;});
  }
  sync(b);return;
 }
 if(b.dataset.prioMastery!==undefined){setMastery(Number(b.dataset.prioMastery));sync(b);return;}
 if(b.hasAttribute('data-prio-clear')){
  E.priorityAxes.forEach(function(k){S.w[k]=0;});save();sync();
 }
});
// La maîtrise est partagée avec le parcours guidé : un choix dans l'un est repris par l'autre. Au
// chargement, une maîtrise sauvegardée ici est conservée ; sinon celle du parcours guidé est reprise,
// sans rien écrire tant que le visiteur n'agit pas.
if(!hasMastery&&window.WFGuide&&window.WFGuide.getMastery){var fromGuide=window.WFGuide.getMastery();if(Number.isInteger(fromGuide)&&fromGuide>=0&&fromGuide<=3)S.m=fromGuide;}
window.WFPriorities={getMastery:function(){return S.m;},setMastery:function(level){
 if(level===S.m)return;setMastery(level,true);if(!priority.hidden)sync();
},getProfile:function(){return {weights:weights(),mastery:S.m};},
 getMode:function(){return root.classList.contains('is-choosing')?null:priority.hidden?'guided':'priorities';},
 openMode:setMode,
 describe:function(){
  var lines=[];axes.forEach(function(g){g.items.forEach(function(it){if(S.w[it[0]])lines.push(it[1]+' · priorité '+words[S.w[it[0]]]);});});
  lines.push('Maîtrise : '+mastery[S.m]);return lines;
 },
 preview:function(p){
  if(!preview)preview={w:weights(),m:S.m,showAll:showAll,expanded:groupExpanded};
  S.w=E.sanitizeWeights(p.weights);S.m=p.mastery;showAll=false;sync();
 },
 endPreview:function(adopt){
  if(!preview)return;
  if(!adopt){S.w=preview.w;S.m=preview.m;showAll=preview.showAll;groupExpanded=preview.expanded;}
  preview=null;
  if(adopt){save();setMastery(S.m);groupExpanded={};axes.forEach(function(g,i){if(g.items.some(function(it){return S.w[it[0]]>0;}))groupExpanded[i]=true;});}
  sync();
 }};
// À l'arrivée, aucun parcours n'est ouvert : le visiteur choisit. Le dernier parcours utilisé est signalé.
root.classList.add('is-choosing');guided.hidden=true;priority.hidden=true;
modes.forEach(function(b){b.setAttribute('aria-selected','false');});
try{var last=localStorage.getItem(KEY);modes.forEach(function(b){if(b.dataset.recoMode===last)b.setAttribute('data-last','true');});}catch(e){}
modes.forEach(function(b){b.tabIndex=0;});
})();
