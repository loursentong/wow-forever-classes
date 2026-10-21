/* Entrée « Mes priorités » : réutilise exactement les 14 contrôles historiques
 * et les 15 profils sauvegardés, mais produit son classement via le moteur
 * unique par spécialisation. */
(function(){
'use strict';
var E=window.WFRecommend,D=window.__WF,root=document.getElementById('reco-app');
if(!E||!D||!root||typeof E.priorityRanking!=='function')return;
var modes=Array.prototype.slice.call(root.querySelectorAll('[data-reco-mode]'));
var guided=root.querySelector('#reco-guided'),priority=root.querySelector('#reco-priorities');
var form=root.querySelector('#reco-priority-form'),output=root.querySelector('#reco-priority-results');
var KEY='wf-reco-mode-v1',CUSTOM_KEY='wf-priority-custom-v1';
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
  var legacySaved=JSON.parse(localStorage.getItem('wf-overview-v3')||'null');
  if(legacySaved&&legacySaved.c){
   var oldW=E.sanitizeWeights(legacySaved.c);
   if(E.priorityAxes.every(function(k){return oldW[k]===legacySaved.c[k];}))
    savedCustom={weights:oldW,mastery:Number.isInteger(legacySaved.m)?legacySaved.m:2};
  }
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
function find(k,v){return document.querySelector('.seg button[data-ax="'+k+'"][data-v="'+v+'"]');}
function weights(){
 var w={};E.priorityAxes.forEach(function(k){
  var chosen=document.querySelector('.seg button[data-ax="'+k+'"][aria-pressed="true"]');
  w[k]=chosen?Number(chosen.dataset.v):0;
 });return w;
}
function currentMastery(){
 var b=document.querySelector('.mbtn[aria-pressed="true"]');
 return b?Number(b.dataset.m):2;
}
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
   html+='<div class="reco-priority-row"><span class="reco-priority-label">'+it[1]+'</span>'+
    '<div class="reco-weights" role="group" aria-label="Importance de '+esc(it[1])+'">'+[0,1,2,3].map(function(n){
      return '<button type="button" data-prio-axis="'+it[0]+'" data-prio-weight="'+n+'" aria-pressed="'+(val===n)+'" aria-label="'+it[1]+' : poids '+n+'">'+n+'</button>';
    }).join('')+'</div></div>';
  });
  html+='</section>';
 });
 html+='</div>';
 html+='<div class="reco-priority-footer"><p><strong>0</strong> = sans importance · <strong>3</strong> = priorité essentielle. Les critères ignorés ne procurent aucun avantage.</p>'+
  '<button type="button" data-prio-clear>Tout remettre à zéro</button></div>';
 form.innerHTML=html;
}
function classify(v){
 if(v>=80)return 'Très bonne piste';
 if(v>=65)return 'Bonne correspondance';
 return 'À explorer';
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
  h+='<ol class="reco-priority-ranking">';
  r.results.forEach(function(x,i){
    var rounded=Math.round(x.score),close=i>0&&Math.abs(x.score-r.results[i-1].score)<2.01;
    h+='<li class="reco-priority-class" style="--reco-class:var(--k-'+esc(x.classId)+')">'+
     '<span class="reco-priority-place">'+(i+1)+'</span>'+
     '<span class="reco-priority-class-icon" aria-hidden="true"><img src="'+WOW_ICON_BASE+wowClassIcons[x.classId]+'.jpg" width="30" height="30" alt="" loading="lazy" decoding="async"></span>'+
     '<span class="reco-priority-class-info"><b>'+esc(x.className)+'</b><small>'+
     esc(x.spec.label)+' · '+(x.spec.range==='distance'?'Distance':'Mêlée')+(close?' · résultat proche':'')+'</small></span>'+
     '<span class="reco-priority-score">'+rounded+'<small>/100</small></span>'+
     '<span class="reco-priority-line" aria-hidden="true"><i style="width:'+Math.max(0,Math.min(100,rounded))+'%"></i></span>'+
     (window.WFConfigurationDetails?window.WFConfigurationDetails(x.spec):'')+'</li>';
  });
  h+='</ol><p class="reco-note">Le classement est fondé sur les configurations de spécialisation les plus cohérentes avec les critères choisis. Les rôles ne sont comptés qu’une fois ; la polyvalence et la technicité n’interviennent que si tu les actives. Les faibles écarts ne prouvent pas de supériorité.</p>';
  if(r.active.length===1)h+='<p class="reco-note">Avec un seul critère actif, le poids 1, 2 ou 3 ne change pas les proportions du score : il détermine son importance par rapport à d’autres critères si tu en ajoutes.</p>';
  if(presetMatch(w)==='egal')h+='<p class="reco-note">« Tous les critères » est un scénario de référence, pas un profil neutre du joueur : pour une recommandation personnelle, précise ce qui compte vraiment.</p>';
 }
 output.innerHTML=h;
}
function applyWeights(newW,newMastery){
 var clean=E.sanitizeWeights(newW);
 E.priorityAxes.forEach(function(k){
  var old=find(k,clean[k]);if(old&&old.getAttribute('aria-pressed')!=='true')old.click();
 });
 if(Number.isInteger(newMastery)&&newMastery>=0&&newMastery<=3){
  var masteryButton=document.querySelector('.mbtn[data-m="'+newMastery+'"]');
  if(masteryButton&&masteryButton.getAttribute('aria-pressed')!=='true')masteryButton.click();
  if(window.WFGuide&&window.WFGuide.setMastery)window.WFGuide.setMastery(newMastery);
 }
 sync();
}
function sync(){controls();results();}
function setMode(m){
 var isPriority=m==='priorities';
 priority.hidden=!isPriority;guided.hidden=isPriority;
 modes.forEach(function(b){b.setAttribute('aria-selected',String(b.dataset.recoMode===m));b.tabIndex=b.dataset.recoMode===m?0:-1;});
 if(isPriority)sync();
 try{localStorage.setItem(KEY,m);}catch(e){}
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
  var legacy=find(b.dataset.prioAxis,Number(b.dataset.prioWeight));
  if(legacy)legacy.click();sync();return;
 }
 if(b.dataset.prioPreset){
  var preset=document.querySelector('.presets button[data-preset="'+b.dataset.prioPreset+'"]');
  if(preset)preset.click();sync();return;
 }
 if(b.dataset.prioMastery!==undefined){
  var level=Number(b.dataset.prioMastery),old=document.querySelector('.mbtn[data-m="'+level+'"]');
  if(old)old.click();
  if(window.WFGuide&&window.WFGuide.setMastery)window.WFGuide.setMastery(level);
  sync();return;
 }
 if(b.hasAttribute('data-prio-clear')){
  var reset=document.getElementById('reset-w');if(reset&&!reset.disabled)reset.click();
  sync();
 }
});
document.addEventListener('click',function(ev){
 var b=ev.target.closest('.seg button[data-ax], .presets button[data-preset], .mbtn, #reset-w');
 if(b&&priority&&!priority.hidden)sync();
});
var fromGuide=window.WFGuide&&window.WFGuide.getMastery?window.WFGuide.getMastery():currentMastery();
var original=document.querySelector('.mbtn[data-m="'+fromGuide+'"]');
if(original&&currentMastery()!==fromGuide)original.click();
var initial='guided';
try{if(localStorage.getItem(KEY)==='priorities')initial='priorities';}catch(e){}
setMode(initial);
})();
