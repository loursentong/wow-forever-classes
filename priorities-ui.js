/* Mode personnalisé : 14 critères pondérés de 0 à 3, les profils historiques et la maîtrise.
 * Il garde son propre état (sauvegardé dans wf-overview-v3, schéma inchangé) et produit son
 * classement avec le moteur unique par spécialisation. Il gère aussi le choix du parcours. */
(function(){
'use strict';
var E=window.WFRecommend,D=window.__WF,root=document.getElementById('reco-app');
var X=window.WFResultExplanations;
if(!E||!D||!root||typeof E.priorityRanking!=='function')return;
var modes=Array.prototype.slice.call(root.querySelectorAll('[data-reco-mode]'));
var guided=root.querySelector('#reco-guided'),priority=root.querySelector('#reco-priorities');
var form=root.querySelector('#reco-priority-form'),output=root.querySelector('#reco-priority-results');
var KEY='wf-reco-mode-v1',CUSTOM_KEY='wf-priority-custom-v1',STATE_KEY='wf-overview-v3';
// Mots de l'échelle 0 à 3, repris dans les explications (« Priorité essentielle (3) »).
var words=X&&X.priorityWords||['sans importance','secondaire','importante','essentielle'];
// État du mode personnalisé. Les champs hérités (hl, c) d'une ancienne sauvegarde sont conservés tels quels.
var S={w:Object.assign({},D.presets.egal),m:2,extra:{}},hasMastery=false;
function validW(o){return !!o&&typeof o==='object'&&!Array.isArray(o)&&E.priorityAxes.every(function(k){return Number.isInteger(o[k])&&o[k]>=0&&o[k]<=3;});}
function presetOf(w){return Object.keys(D.presets).find(function(p){return E.priorityAxes.every(function(k){return D.presets[p][k]===w[k];});})||null;}
// Burst et Dégâts de zone datent du 20 octobre 2026 : une sauvegarde antérieure ne les contient pas.
// Ils prennent alors 0, sauf si tous les autres critères avaient le même poids : ils reçoivent ce poids.
var ADDED=['burst','zone'];
function loadWeights(src){
 E.priorityAxes.forEach(function(k){if(Number.isInteger(src[k])&&src[k]>=0&&src[k]<=3)S.w[k]=src[k];});
 if(ADDED.some(function(k){return Object.prototype.hasOwnProperty.call(src,k);}))return;
 var rest=E.priorityAxes.filter(function(k){return ADDED.indexOf(k)<0;}).map(function(k){return S.w[k];});
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
  if(E.priorityAxes.every(function(k){return stored.weights[k]===cleaned[k];}))
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
var axes=[
 {name:'Rôles',items:[['tank','Tank'],['soin','Soin'],['dps','DPS PvE']],hint:'Un seul domaine de rôle. Pas de bonus automatique pour pouvoir tout jouer.'},
 {name:'Activités',items:[['bg','Champ de bataille'],['sauv','PvP sauvage'],['solo','Solo / leveling']],hint:'Les activités que tu privilégies, évaluées dans leur contexte.'},
 {name:'Style de combat',items:[['burst','Burst'],['zone','Dégâts de zone'],['ctrl','Contrôle'],['surv','Résistance'],['mob','Mobilité'],['util','Soutien']],hint:'Choisir plusieurs qualités ne multiplie pas artificiellement le poids du domaine.'},
 {name:'Affinités facultatives',items:[['poly','Polyvalence'],['tech','Technicité']],hint:'La polyvalence et la difficulté ne sont valorisées que si tu les demandes expressément.'}
];
var presetNames={egal:'Tous les critères',polyvalence:'Polyvalence',pve:'PvE',pvp:'PvP',tank:'Tank en groupe',soin:'Soin en groupe',dps:'DPS en raid',zone:'Dégâts de zone',soutien:'Soutien',bg:'Champ de bataille',soinbg:'Soin en BG',sauvage:'PvP sauvage',burst:'Burst et mobilité',controle:'Contrôle',solo:'Solo et leveling'};
var popular=['pve','pvp','dps','tank','soin','solo','bg','controle'];
var mastery=['Débutant','Intermédiaire','Confirmé','Expert'];
var WOW_ICON_BASE='https://render.worldofwarcraft.com/us/icons/56/classicon_';
var wowClassIcons={guerrier:'warrior',paladin:'paladin',chasseur:'hunter',voleur:'rogue',pretre:'priest',chaman:'shaman',mage:'mage',demoniste:'warlock',druide:'druid'};
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function weights(){return Object.assign({},S.w);}
function currentMastery(){return S.m;}
function presetMatch(w){
 return Object.keys(D.presets).find(function(k){
  return E.priorityAxes.every(function(a){return w[a]===D.presets[k][a];});
 })||null;
}
function makePreset(k,active){
 return '<button type="button" class="reco-template" data-prio-preset="'+k+'" aria-pressed="'+(active===k)+'">'+
  esc(presetNames[k]||k)+'</button>';
}
function controls(){
 var w=weights(),active=presetMatch(w),html='';
 html+='<div class="reco-priority-presets"><div><span class="reco-kicker">Démarrer avec un profil</span><p>Choisis un exemple, puis adapte chaque critère à ta façon.</p></div>';
 html+='<div class="reco-template-list">'+popular.map(function(k){return makePreset(k,active);}).join('')+'</div></div>';
 html+='<div class="reco-custom-toolbar" aria-label="Sauvegarde des critères personnels"><div class="reco-custom-copy">'+
  '<strong>Mes critères personnels</strong><small>Enregistre tes poids et ta maîtrise sur cet appareil, puis retrouve-les après avoir essayé les profils.</small></div>'+
  '<div class="reco-custom-actions"><button type="button" data-prio-save>'+
  (savedCustom?(isCurrentCustom(w,currentMastery())?'✓ Critères enregistrés':'Mettre à jour mes critères'):'Enregistrer mes critères')+'</button>'+
  (savedCustom?'<button type="button" data-prio-restore '+(isCurrentCustom(w,currentMastery())?'disabled':'')+'>Reprendre mes critères</button>':'')+'</div></div>';
 html+='<div class="reco-priority-mastery"><div><b>Ton niveau de maîtrise</b><small>Influence les performances réalisables, pas le goût pour la difficulté.</small></div><div class="reco-mastery-choices" role="group" aria-label="Maîtrise pour le classement des priorités">'+
  mastery.map(function(name,i){return '<button type="button" data-prio-mastery="'+i+'" aria-pressed="'+(currentMastery()===i)+'">'+name+'</button>';}).join('')+'</div></div>';
 html+='<div class="reco-priority-groups">';
 axes.forEach(function(g){
  html+='<section class="reco-priority-group"><div class="reco-priority-group-head"><h4>'+g.name+'</h4><p>'+g.hint+'</p></div>';
  g.items.forEach(function(it){
   var val=w[it[0]];
   var help=X&&X.criteria[it[0]];
   html+='<div class="reco-priority-row"><span class="reco-priority-label">'+it[1]+
    (help?'<small id="prio-help-'+it[0]+'">'+esc(help)+'</small>':'')+'</span>'+
    '<div class="reco-weights" role="group" aria-label="Importance de '+esc(it[1])+'"'+(help?' aria-describedby="prio-help-'+it[0]+'"':'')+'>'+[0,1,2,3].map(function(n){
      return '<button type="button" data-prio-axis="'+it[0]+'" data-prio-weight="'+n+'" aria-pressed="'+(val===n)+'" aria-label="'+it[1]+' : '+(n?'priorité '+words[n]:words[0])+' ('+n+')">'+n+'</button>';
    }).join('')+'</div></div>';
  });
  html+='</section>';
 });
 html+='</div>';
 html+='<div class="reco-priority-footer"><p><strong>0</strong> = sans importance · <strong>1</strong> = secondaire · <strong>2</strong> = importante · <strong>3</strong> = essentielle. Les critères ignorés ne procurent aucun avantage.</p>'+
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
 var rows=X.priorityParts(ex,x.score).map(function(g){
  return '<li><span class="reco-why-name">'+esc(g.label)+'</span><span class="reco-why-bar" aria-hidden="true"><i style="width:'+g.fit+'%"></i></span>'+
   '<span class="reco-why-fit" title="Correspondance avec tes critères">'+g.fit+' %</span><span class="reco-why-points">'+g.points+' / '+g.max+' pts</span>'+
   '<div class="reco-answer-list">'+(g.note?'<p class="reco-why-note">'+esc(g.note)+'</p>':'')+
   g.axes.map(function(a){return X.answerHtml(a.label,a.lines);}).join('')+'</div></li>';
 }).join('');
 return '<details class="reco-evidence reco-why"><summary>Pourquoi cette place</summary>'+
  '<p><b>Pourquoi '+Math.round(x.score)+' sur 100 ?</b> '+esc(X.priorityMissing(ex,x.score))+'</p>'+
  '<p>Pour chaque critère : la note '+esc(X.of(x.spec.label))+', ta priorité, puis le constat. Une note de 1/5 compte pour 0&nbsp;% et 5/5 pour 100&nbsp;% ; '+
  'ces notes sont des estimations, pas des mesures de puissance, et ta maîtrise en ajuste certaines. Chaque groupe pèse selon ta priorité la plus forte, et ses points forment le score.</p>'+
  '<ul class="reco-why-parts" aria-label="Part de chaque groupe de critères dans le score">'+rows+'</ul>'+
  '<p><a href="fiches-sources/'+esc(x.classId)+'.html#'+esc(x.spec.id)+(x.spec.variant==='sans-familier'?'-sans-familier':'')+'">Comprendre les notes et voir les sources du '+esc(x.className)+'</a></p>'+
  '</details>';
}
function results(){
 var w=weights(),r=E.priorityRanking(w,currentMastery()),h='';
 if(r.status==='unanswered'){
  h='<div class="reco-empty"><span class="reco-kicker">À toi de définir les règles</span><h3>Aucune priorité définie</h3>'+
   '<p>Active un critère pour construire un classement de neuf classes, fondé sur leurs spécialisations et non sur une addition de leurs rôles.</p></div>';
 }else{
  var described=r.active.length;
  h='<div class="reco-results-head"><div><span class="reco-kicker">Classement personnalisé</span><h3>Les neuf classes selon tes critères</h3></div>'+
    '<p>'+described+' critère'+(described>1?'s':'')+' actif'+(described>1?'s':'')+' · maîtrise '+mastery[currentMastery()]+'</p></div>';
  h+='<p class="reco-note">La spécialisation affichée est retenue pour l’ensemble de tes critères. Le classement peut proposer une autre spécialisation lorsque tu modifies tes priorités.</p>';
  var positions=X?X.ranks(r.results):[],tie=X?X.tieNote(r.results):'';
  if(tie)h+='<p class="reco-note reco-tie-note">'+esc(tie)+'</p>';
  if(X)X.contextNotes({weights:w}).forEach(function(note){h+='<p class="reco-note">'+esc(note)+'</p>';});
  h+='<ol class="reco-priority-ranking">';
  r.results.forEach(function(x,i){
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
  h+='</ol><p class="reco-note">Le classement est fondé sur les configurations de spécialisation les plus cohérentes avec les critères choisis. Les rôles ne sont comptés qu’une fois ; la polyvalence et la technicité n’interviennent que si tu les actives. Les faibles écarts ne prouvent pas de supériorité.</p>';
  if(r.active.length===1)h+='<p class="reco-note">Avec un seul critère actif, le poids 1, 2 ou 3 ne change pas les proportions du score : il détermine son importance par rapport à d’autres critères si tu en ajoutes.</p>';
  if(presetMatch(w)==='egal')h+='<p class="reco-note">« Tous les critères » est un scénario de référence, pas un profil neutre du joueur : pour une recommandation personnelle, précise ce qui compte vraiment.</p>';
 }
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
function sync(){controls();results();}
function setMode(m){
 var choosing=root.classList.contains('is-choosing'),isPriority=m==='priorities';
 root.classList.remove('is-choosing');
 priority.hidden=!isPriority;guided.hidden=isPriority;
 modes.forEach(function(b){b.setAttribute('aria-selected',String(b.dataset.recoMode===m));b.tabIndex=b.dataset.recoMode===m?0:-1;b.removeAttribute('data-last');});
 if(isPriority)sync();
 try{localStorage.setItem(KEY,m);}catch(e){}
 // Après le premier choix, les deux cartes deviennent des onglets : on garde le parcours en vue.
 var bar=root.querySelector('.reco-modes');
 if(choosing&&bar&&bar.scrollIntoView)bar.scrollIntoView({block:'start',behavior:window.matchMedia&&window.matchMedia('(prefers-reduced-motion: reduce)').matches?'auto':'smooth'});
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
form.addEventListener('click',function(ev){
 var b=ev.target.closest('button');if(!b||!form.contains(b))return;
 if(b.hasAttribute('data-prio-save')){
  savedCustom={weights:E.sanitizeWeights(weights()),mastery:currentMastery()};
  try{localStorage.setItem(CUSTOM_KEY,JSON.stringify(savedCustom));}catch(e){}
  sync();return;
 }
 if(b.hasAttribute('data-prio-restore')){
  if(savedCustom)applyWeights(savedCustom.weights,savedCustom.mastery);
  return;
 }
 if(b.dataset.prioAxis!==undefined){
  var axis=b.dataset.prioAxis,weight=Number(b.dataset.prioWeight);
  if(E.priorityAxes.indexOf(axis)>=0&&weight>=0&&weight<=3){S.w[axis]=weight;save();}
  sync();return;
 }
 if(b.dataset.prioPreset){
  if(D.presets[b.dataset.prioPreset]){S.w=E.sanitizeWeights(D.presets[b.dataset.prioPreset]);save();}
  sync();return;
 }
 if(b.dataset.prioMastery!==undefined){setMastery(Number(b.dataset.prioMastery));sync();return;}
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
}};
// À l'arrivée, aucun parcours n'est ouvert : le visiteur choisit. Le dernier parcours utilisé est signalé.
root.classList.add('is-choosing');guided.hidden=true;priority.hidden=true;
modes.forEach(function(b){b.setAttribute('aria-selected','false');});
try{var last=localStorage.getItem(KEY);modes.forEach(function(b){if(b.dataset.recoMode===last)b.setAttribute('data-last','true');});}catch(e){}
modes.forEach(function(b){b.tabIndex=0;});
})();
