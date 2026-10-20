/* Interface du questionnaire ; le moteur pur est dans recommendation-engine.js. */
(function(){
'use strict';
var E=window.WFRecommend;
var root=document.getElementById('reco-app');
if(!E||!root)return;
var KEY='wf-recommend-v1', state=E.defaultProfile;
try{state=E.sanitize(JSON.parse(localStorage.getItem(KEY)||'null'));}catch(e){state=E.defaultProfile;}
var names={roles:{dps:'DPS',tank:'Tank',soin:'Soin'},
 activities:{raid:'Donjons et raids',bg:'Champs de bataille',world:'PvP sauvage et duel',solo:'Solo et farm'},
 range:{distance:'À distance',melee:'Au corps-à-corps',mixte:'Pouvoir alterner'},
 styles:{burst:'Dégâts explosifs',zone:'Dégâts de zone',ctrl:'Contrôle',surv:'Résistance',mob:'Mobilité',support:'Soutien'},
 pet:{like:"J'aime les familiers",avoid:'Je préfère éviter'},
 difficulty:{simple:'Accessible',complex:'Exigeant'}};
var labels={roles:'Rôles',activities:'Activités',range:'Portée',styles:'Style',pet:'Familier',difficulty:'Complexité'};
var roleNames={dps:'DPS',tank:'Tank',soin:'Soin'};
function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
function cert(value){return '<span class="reco-cert-word">'+(['intuition','très hésitant','hésitant','assez sûr','très sûr','certain'][value]||'')+'</span>';}
function certaintyControl(group,key,n){
  return '<div class="reco-cert"><label for="rc-'+group+'-'+key+'">Certitude pour « '+esc((names[group]||{})[key]||key)+' » <output data-certout="'+group+'/'+key+'">'+n+'/5</output></label>'+
    '<input id="rc-'+group+'-'+key+'" type="range" min="0" max="5" step="1" value="'+n+'" data-certgroup="'+group+'" data-certkey="'+key+'" aria-label="Certitude : '+esc((names[group]||{})[key]||key)+' de zéro à cinq"/>'+
    '<small>0 · intuition <span aria-hidden="true">—</span> 5 · certain</small></div>';
}
function multi(group,limit){
  var choices=names[group]||{},chosen=E.selected(state[group]);
  var html='<div class="reco-options" role="group" aria-label="'+labels[group]+'">';
  Object.keys(choices).forEach(function(key){var on=chosen.indexOf(key)>=0;
    html+='<button type="button" data-multi="'+group+'" data-key="'+key+'" aria-pressed="'+on+'">'+esc(choices[key])+'</button>';
  });
  html+='</div>';
  chosen.forEach(function(k){html+=certaintyControl(group,k,state[group][k]);});
  if(limit)html+='<p class="reco-hint">'+chosen.length+' / '+limit+' styles sélectionnés</p>';
  return html;
}
function single(group){
  var html='<div class="reco-options" role="group" aria-label="'+labels[group]+'">';
  html+='<button type="button" data-single="'+group+'" data-key="any" aria-pressed="'+(state[group].value==='any')+'">Je ne sais pas / peu importe</button>';
  Object.keys(names[group]||{}).forEach(function(k){
    html+='<button type="button" data-single="'+group+'" data-key="'+k+'" aria-pressed="'+(state[group].value===k)+'">'+esc(names[group][k])+'</button>';
  });
  html+='</div>';
  if(state[group].value!=='any')html+=certaintyControl(group,state[group].value,state[group].certainty);
  if(group==='range'&&state.range.value!=='any')
    html+='<label class="reco-strict"><input type="checkbox" data-strict="range" '+(state.range.strict?'checked':'')+'> C’est une exigence absolue</label>';
  if(group==='pet'&&state.pet.value==='avoid')
    html+='<label class="reco-strict"><input type="checkbox" data-strict="pet" '+(state.pet.strict?'checked':'')+'> Je refuse les configurations nécessitant un familier</label>';
  return html;
}
function field(n,title,hint,contents){
  return '<fieldset class="reco-question"><legend><span class="reco-number">'+n+'</span> '+title+'</legend>'+
    '<p class="reco-hint">'+hint+'</p>'+contents+'</fieldset>';
}
function renderForm(){
  var html='<div class="reco-questions">';
  html+=field(1,'Quels rôles souhaites-tu jouer ?','Choisis-en plusieurs si tu veux alterner. Seules les exigences cochées éliminent des configurations.',multi('roles')+
    (E.selected(state.roles).length>0?'<label class="reco-strict"><input type="checkbox" data-roles-strict '+(state.rolesStrict?'checked':'')+'>'+ (E.selected(state.roles).length>1?' Je veux pouvoir exercer tous ces rôles sur une même classe':' Ce rôle est indispensable pour moi')+'</label>':''));
  html+=field(2,'Où souhaites-tu jouer ?','Plusieurs activités possibles ; indique ta certitude pour chacune.',multi('activities'));
  html+=field(3,'Distance ou corps-à-corps ?','Préférence souple ou exigence absolue ; « alterner » signifie plusieurs configurations.',single('range'));
  html+=field(4,'Quel style de combat recherches-tu ?','Choisis jusqu’à trois qualités importantes pour ton plaisir de jeu.',multi('styles',3));
  html+=field(5,'Quel rapport aux familiers ?','Certains talents permettent de jouer sans familier permanent, parfois avec des compromis.',single('pet'));
  var mastery=['Débutant','Intermédiaire','Confirmé','Expert'];
  var choices='<div class="reco-options" role="group" aria-label="Maîtrise actuelle">'+mastery.map(function(v,i){
    return '<button type="button" data-mastery="'+i+'" aria-pressed="'+(i===state.mastery)+'">'+v+'</button>';
  }).join('')+'</div>';
  html+=field(6,'Maîtrise et difficulté','Ta maîtrise actuelle et ton goût pour un gameplay exigeant sont deux choses différentes.',
    '<label class="reco-label">Ton niveau actuel</label>'+choices+
    '<label class="reco-label">Complexité souhaitée</label>'+single('difficulty'));
  html+='</div>';
  root.querySelector('#reco-form').innerHTML=html;
}
function pointsName(k){return labels[k]||k;}
function resultCard(r,i){
  var diff=r.tradeoffs.length?r.tradeoffs.map(pointsName).join(', '):'Aucun point de friction majeur parmi les réponses renseignées.';
  var good=r.strengths.length?r.strengths.map(pointsName).join(', '):'Correspondance partielle ; explore les alternatives.';
  var stability=r.scenarioCount<=1?'Certitudes actuelles sans scénario alternatif':
     r.scenarioAppearances+' / '+r.scenarioCount+' scénarios de réponses hésitantes où la classe reste dans le top 3';
  return '<article class="reco-result-card">'+
    '<div class="reco-result-top"><span class="reco-rank">#'+(i+1)+'</span><div><h4>'+esc(r.className)+'</h4><p>'+esc(r.spec.label)+' · '+esc(roleNames[r.spec.role])+' · '+(r.spec.range==='distance'?'Distance':'Mêlée')+'</p></div><strong title="Indice d’adéquation heuristique, non une probabilité">'+Math.round(r.score)+'/100</strong></div>'+
    '<div class="reco-bars"><div class="reco-bar" style="width:'+Math.min(100,Math.max(0,r.score))+'%"></div></div>'+
    '<p><b>Atouts selon tes choix :</b> '+esc(good)+'</p>'+
    '<p><b>Compromis :</b> '+esc(diff)+'</p>'+
    '<p class="reco-muted"><b>Stabilité exploratoire :</b> '+esc(stability)+'.</p>'+
    '<p class="reco-muted">Scores de gameplay estimés et non mesurés au niveau 60. <a href="'+esc(r.spec.source)+'" target="_blank" rel="noopener noreferrer">Fiche officielle de la classe ↗</a></p>'+
    '</article>';
}
function renderResults(){
  var report=E.recommend(state),out=root.querySelector('#reco-results');
  if(report.status==='unanswered'){
    out.innerHTML='<div class="reco-empty"><h3>À toi de définir tes envies</h3><p>Aucune classe n’est favorisée tant que tu n’as pas exprimé une préférence. Les six questions sont facultatives : quelques réponses suffisent pour commencer.</p></div>';
  } else if(report.status==='no-match'){
    out.innerHTML='<div class="reco-empty"><h3>Aucune spécialisation ne respecte toutes tes exigences</h3><p>Essaie de rendre une contrainte souple (portée, familier ou couverture de tous les rôles). Nous ne proposerons jamais un faux résultat compatible.</p></div>';
  } else {
    var h='<div class="reco-results-head"><h3>Les classes qui correspondent à tes réponses</h3><p>'+report.used.length+' dimensions exprimées · '+report.compatible+' configurations compatibles · scores indicatifs, pas des probabilités.</p></div>';
    h+='<div class="reco-cards">'+report.top.map(resultCard).join('')+'</div>';
    if(report.uncertain.length)h+='<p class="reco-note">Sensibilité testée : '+report.uncertain.map(esc).join(' ; ')+'. Ces scénarios ne sont pas des probabilités de changement d’avis.</p>';
    else h+='<p class="reco-note">La stabilité sera davantage explorée lorsque des réponses à faible certitude seront présentes.</p>';
    out.innerHTML=h;
  }
  try{localStorage.setItem(KEY,JSON.stringify(state));}catch(e){}
}
var form=root.querySelector('#reco-form');
form.addEventListener('click',function(ev){
  var b=ev.target.closest('button');if(!b||!form.contains(b))return;
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
    state[group].value=key;
    state[group].strict=false;
    state[group].certainty=3;
    renderForm();renderResults();return;
  }
  if(b.dataset.mastery!==undefined){
    state.mastery=Number(b.dataset.mastery);renderForm();renderResults();
  }
});
form.addEventListener('input',function(ev){
  var el=ev.target,group=el.dataset.certgroup,key=el.dataset.certkey;
  if(group){
    var n=Number(el.value);
    if(group==='roles'||group==='activities'||group==='styles')state[group][key]=n;
    else state[group].certainty=n;
    var output=form.querySelector('[data-certout="'+group+'/'+key+'"]');
    if(output)output.textContent=n+'/5';
    renderResults();
  }
});
form.addEventListener('change',function(ev){
  var el=ev.target;
  if(el.hasAttribute('data-roles-strict'))state.rolesStrict=el.checked;
  if(el.dataset.strict)state[el.dataset.strict].strict=el.checked;
  renderResults();
});
root.querySelector('#reco-reset').addEventListener('click',function(){
  state=E.defaultProfile;renderForm();renderResults();
});
renderForm();renderResults();
})();
