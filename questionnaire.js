/* Présentation progressive de l'assistant. Le moteur de recommandation reste inchangé. */
(function(){
'use strict';
var E=window.WFRecommend;
var root=document.getElementById('reco-app');
if(!E||!root)return;
var KEY='wf-recommend-v1',state=E.sanitize(null),step=0;
try{state=E.sanitize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){state=E.sanitize(null);}
var names={
 roles:{dps:'DPS',tank:'Tank',soin:'Soin'},
 activities:{raid:'Donjons et raids',bg:'Champs de bataille',world:'PvP sauvage et duel',solo:'Solo et farm'},
 range:{distance:'À distance',melee:'Au corps-à-corps',mixte:'Pouvoir alterner'},
 styles:{burst:'Dégâts explosifs',zone:'Dégâts de zone',ctrl:'Contrôle',surv:'Résistance',mob:'Mobilité',support:'Soutien'},
 pet:{like:"J'aime les familiers",avoid:'Je préfère éviter'},
 difficulty:{simple:'Accessible',complex:'Exigeant'}
};
var descriptions={
 roles:{dps:'Infliger des dégâts',tank:'Protéger et encaisser',soin:'Soigner et soutenir'},
 activities:{raid:'Jouer en groupe en PvE',bg:'Affrontements en équipe',world:'Combats imprévus et duels',solo:'Explorer et progresser seul'},
 range:{distance:'Combattre sans être au contact',melee:'Combattre au plus près',mixte:'Changer selon la configuration'},
 styles:{burst:'Frapper très fort en peu de temps',zone:'Toucher plusieurs cibles',ctrl:'Gêner les actions adverses',surv:'Tenir sous pression',mob:'Se déplacer et poursuivre',support:'Renforcer les alliés'},
 pet:{like:'Un compagnon fait partie du plaisir',avoid:'Je préfère jouer sans compagnon'},
 difficulty:{simple:'Prise en main confortable',complex:'Gameplay à approfondir'}
};
var short=['Rôles','Activités','Portée','Gameplay','Familiers','Maîtrise'];
var labels={roles:'Rôles',activities:'Activités',range:'Portée',styles:'Gameplay',pet:'Familiers',difficulty:'Complexité'};
var roleNames={dps:'DPS',tank:'Tank',soin:'Soin'};
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
function summaryText(){
 var parts=[];
 ['roles','activities','styles'].forEach(function(k){
  E.selected(state[k]).forEach(function(v){parts.push((names[k]||{})[v]);});
 });
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
function choice(group,k,on,type){
 var mark='<span class="reco-option-mark" aria-hidden="true"></span>';
 return '<button type="button" class="reco-option" data-'+type+'="'+group+'" data-key="'+k+'" aria-pressed="'+on+'">'+mark+
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
 if(limit)html+='<p class="reco-selection-count">'+chosen.length+' sur '+limit+' styles possibles</p>';
 return html;
}
function single(group){
 var html='<div class="reco-options" role="group" aria-label="'+labels[group]+'">';
 html+='<button type="button" class="reco-option reco-option-neutral" data-single="'+group+'" data-key="any" aria-pressed="'+(state[group].value==='any')+'"><span class="reco-option-mark" aria-hidden="true"></span><span class="reco-option-text"><strong>Je ne sais pas encore</strong><small>Aucune préférence imposée</small></span></button>';
 Object.keys(names[group]||{}).forEach(function(k){html+=choice(group,k,state[group].value===k,'single');});
 html+='</div>';
 if(state[group].value!=='any')html+='<div class="reco-cert-list">'+certaintyControl(group,state[group].value,state[group].certainty)+'</div>';
 if(group==='range'&&state.range.value!=='any')
  html+='<label class="reco-strict"><input type="checkbox" data-strict="range" '+(state.range.strict?'checked':'')+'><span><strong>C’est une exigence absolue</strong><small>Les configurations incompatibles seront exclues.</small></span></label>';
 if(group==='pet'&&state.pet.value==='avoid')
  html+='<label class="reco-strict"><input type="checkbox" data-strict="pet" '+(state.pet.strict?'checked':'')+'><span><strong>Je refuse les configurations nécessitant un familier</strong><small>Une préférence simple ne suffit pas pour exclure.</small></span></label>';
 return html;
}
function question(n,title,hint,content){
 return '<fieldset class="reco-question" aria-describedby="reco-hint-'+n+'"><legend tabindex="-1"><span class="reco-question-index">QUESTION '+n+' / 6</span><span class="reco-question-title">'+title+'</span></legend>'+
   '<p id="reco-hint-'+n+'" class="reco-hint">'+hint+'</p>'+content+'</fieldset>';
}
function currentQuestion(){
 if(step===0)return question(1,'Quel rôle voudrais-tu jouer ?','Tu peux choisir plusieurs rôles ou simplement explorer ce qui t’attire.',
  multi('roles')+(E.selected(state.roles).length?'<label class="reco-strict"><input type="checkbox" data-roles-strict '+(state.rolesStrict?'checked':'')+'><span><strong>'+ (E.selected(state.roles).length>1?'Je veux pouvoir exercer tous ces rôles':'Ce rôle est indispensable pour moi')+'</strong><small>Une préférence seule ne bloque jamais les alternatives.</small></span></label>':''));
 if(step===1)return question(2,'Où passeras-tu le plus de temps ?','Tu peux sélectionner plusieurs activités. Aucune obligation de te décider tout de suite.',multi('activities'));
 if(step===2)return question(3,'Comment aimes-tu combattre ?','Une préférence peut rester souple. Coche une exigence uniquement si elle est non négociable.',single('range'));
 if(step===3)return question(4,'Quel style te ressemble ?','Choisis jusqu’à trois qualités qui t’attirent. Tes hésitations sont normales.',multi('styles',3));
 if(step===4)return question(5,'Quelle place pour les familiers ?','Une configuration sans familier permanent peut être envisageable selon la spécialisation.',single('pet'));
 var controls='<div class="reco-mastery"><span class="reco-label">Ton expérience actuelle</span><div class="reco-mastery-choices" role="group" aria-label="Maîtrise actuelle">'+
  mastery.map(function(v,i){return '<button type="button" data-mastery="'+i+'" aria-pressed="'+(i===state.mastery)+'">'+v+'</button>';}).join('')+
  '</div></div><div class="reco-difficulty"><span class="reco-label">Le type de difficulté que tu recherches</span>'+single('difficulty')+'</div>';
 return question(6,'Quel est ton rapport à la difficulté ?','Être débutant ne t’empêche pas de vouloir apprendre une classe exigeante.',controls);
}
function renderForm(){
 var done=answered(),count=done.filter(Boolean).length;
 var html='<div class="reco-progress-top"><div><span class="reco-kicker">Ton parcours</span><strong>Étape '+(step+1)+' sur 6</strong></div><span class="reco-progress-count">'+count+' thème'+(count>1?'s':'')+' renseigné'+(count>1?'s':'')+'</span></div>';
 html+='<div class="reco-progress-track" role="progressbar" aria-label="Étapes parcourues" aria-valuemin="0" aria-valuemax="6" aria-valuenow="'+(step+1)+'"><span style="width:'+((step+1)/6*100).toFixed(2)+'%"></span></div>';
 html+='<nav class="reco-steps" aria-label="Navigation entre les six questions">';
 short.forEach(function(t,i){html+='<button type="button" class="reco-step'+(i===step?' is-current':'')+(done[i]?' is-answered':'')+'" data-step="'+i+'" '+(i===step?'aria-current="step"':'')+' aria-label="Question '+(i+1)+' : '+t+(done[i]?' (renseignée)':'')+'"><span class="reco-step-no">'+(i+1)+'</span><span class="reco-step-label">'+t+'</span></button>';});
 html+='</nav>';
 html+=currentQuestion();
 html+='<div class="reco-form-footer"><button type="button" class="reco-back" data-prev '+(step===0?'disabled':'')+'>← Précédent</button>'+
  '<span class="reco-form-help">Tu peux passer une question.</span>'+
  (step===5?'<button type="button" class="reco-next" data-show-results>Voir mes résultats ↓</button>':'<button type="button" class="reco-next" data-next>Question suivante →</button>')+'</div>';
 var tags=summaryText();
 html+='<div class="reco-summary"><strong>Mes choix</strong><div class="reco-summary-tags">'+(tags.length?tags.map(function(t){return '<span>'+esc(t)+'</span>';}).join(''):'<span class="reco-summary-empty">Tu peux commencer par n’importe quelle question.</span>')+'</div></div>';
 root.querySelector('#reco-form').innerHTML=html;
}
function pointsName(k){return labels[k]||k;}
function fitLabel(v){
 if(v>=.82)return 'Très bonne piste';
 if(v>=.68)return 'Bonne correspondance';
 return 'À explorer';
}
function resultCard(r,i){
 var strong=r.strengths.length?r.strengths.map(pointsName).join(' · '):'Plusieurs pistes possibles';
 var weak=r.tradeoffs.length?r.tradeoffs.map(pointsName).join(' · '):'Pas de réserve majeure sur les dimensions retenues';
 var cls=r.classId;
 var stability=r.scenarioCount<=1?'Pas assez de réponses hésitantes pour comparer plusieurs scénarios':
  'Présente dans '+r.scenarioAppearances+' des '+r.scenarioCount+' variantes de tes réponses hésitantes';
 return '<article class="reco-result-card '+(i===0?'reco-featured':'')+'" style="--reco-class:var(--k-'+esc(cls)+')">'+
  '<div class="reco-result-top"><span class="reco-emblem" aria-hidden="true">'+esc(r.className.charAt(0))+'</span>'+
  '<div class="reco-result-main"><span class="reco-result-label">'+(i===0?'PISTE PRINCIPALE':'ALTERNATIVE '+i)+'</span><h4>'+esc(r.className)+'</h4>'+
  '<p>'+esc(r.spec.label)+' · '+esc(roleNames[r.spec.role])+' · '+(r.spec.range==='distance'?'Distance':'Mêlée')+'</p></div>'+
  '<div class="reco-score"><strong>'+Math.round(r.score)+'</strong><small>/100</small></div></div>'+
  '<div class="reco-fit"><span>'+fitLabel(r.score/100)+'</span><small>Indice estimé, pas une probabilité</small></div>'+
  '<div class="reco-bars"><div class="reco-bar" style="width:'+Math.min(100,Math.max(0,r.score))+'%"></div></div>'+
  '<div class="reco-reasons"><p><b>Correspond à tes envies</b><span>'+esc(strong)+'</span></p>'+
  '<p><b>À garder en tête</b><span>'+esc(weak)+'</span></p></div>'+
  '<details class="reco-evidence"><summary>Fiabilité et incertitude</summary><p>'+esc(stability)+'. Évaluation des qualités de gameplay encore exploratoire au niveau 60.</p>'+
  '<a href="'+esc(r.spec.source)+'" target="_blank" rel="noopener noreferrer">Source officielle de la classe ↗</a></details></article>';
}
function renderResults(){
 var report=E.recommend(state),out=root.querySelector('#reco-results');
 if(report.status==='unanswered'){
  out.innerHTML='<div class="reco-empty"><div class="reco-empty-art" aria-hidden="true"><span>?</span><span>✦</span><span>✧</span></div>'+
   '<span class="reco-kicker">Ton prochain personnage</span><h3>Les meilleures pistes restent à découvrir</h3>'+
   '<p>Aucune classe ne part gagnante. Choisis une ou deux envies à gauche : tes premières recommandations apparaîtront ici.</p>'+
   '<div class="reco-empty-benefits"><span>✓ 28 configurations étudiées</span><span>✓ Tes hésitations sont prises en compte</span><span>✓ Aucun choix obligatoire</span></div></div>';
 }else if(report.status==='no-match'){
  out.innerHTML='<div class="reco-empty reco-no-match"><span class="reco-kicker">Aucune correspondance stricte</span><h3>Ces exigences ne vont pas ensemble</h3>'+
   '<p>Aucune spécialisation ne remplit toutes tes contraintes. Rends éventuellement un rôle, la portée ou le familier non obligatoire, puis réessaie.</p></div>';
 }else{
  var h='<div class="reco-results-head"><div><span class="reco-kicker">Résultats en direct</span><h3>Les meilleures pistes pour toi</h3></div>'+
   '<p>'+report.compatible+' configurations compatibles · '+report.used.length+' dimensions exprimées</p></div>';
  h+='<div class="reco-cards">'+report.top.map(resultCard).join('')+'</div>';
  if(report.uncertain.length)h+='<p class="reco-note">Analyse de sensibilité : '+report.uncertain.length+' préférence(s) hésitante(s) testée(s) séparément. Il ne s’agit pas d’une probabilité de satisfaction.</p>';
  else h+='<p class="reco-note">Ajoute tes préférences et leur certitude pour affiner les pistes ; ces scores restent des estimations.</p>';
  out.innerHTML=h;
 }
 try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
}
function navigate(next){
 step=Math.max(0,Math.min(5,next));renderForm();
 var legend=root.querySelector('#reco-form .reco-question legend');
 if(legend&&typeof legend.focus==='function')legend.focus({preventScroll:true});
}
var form=root.querySelector('#reco-form');
form.addEventListener('click',function(ev){
 var b=ev.target.closest('button');if(!b||!form.contains(b))return;
 if(b.dataset.step!==undefined){navigate(Number(b.dataset.step));return;}
 if(b.hasAttribute('data-prev')){navigate(step-1);return;}
 if(b.hasAttribute('data-next')){navigate(step+1);return;}
 if(b.hasAttribute('data-show-results')){
  var r=root.querySelector('#reco-results');if(r&&r.scrollIntoView)r.scrollIntoView({behavior:'smooth',block:'start'});return;
 }
 var group=b.dataset.multi,key=b.dataset.key;
 if(group){
  if(Object.prototype.hasOwnProperty.call(state[group],key))delete state[group][key];
  else{
   if(group==='styles'&&E.selected(state.styles).length>=3)return;
   state[group][key]=3;
  }
  renderForm();renderResults();return;
 }
 group=b.dataset.single;
 if(group){
  state[group].value=key;state[group].strict=false;state[group].certainty=3;
  renderForm();renderResults();return;
 }
 if(b.dataset.mastery!==undefined){state.mastery=Number(b.dataset.mastery);renderForm();renderResults();}
});
form.addEventListener('input',function(ev){
 var el=ev.target,group=el.dataset.certgroup,key=el.dataset.certkey;
 if(!group)return;
 var n=Number(el.value);
 if(group==='roles'||group==='activities'||group==='styles')state[group][key]=n;
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
 state=E.sanitize(null);step=0;renderForm();renderResults();
});
var advanced=document.getElementById('legacy-advanced');
if(advanced)advanced.addEventListener('toggle',function(){
 if(advanced.open)window.dispatchEvent(new Event('resize'));
});
renderForm();renderResults();
})();