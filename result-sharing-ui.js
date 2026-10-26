/* Partage, fichier portable et consultation temporaire : aucune sauvegarde remplacée à l’ouverture. */
(function(){
'use strict';
var C=window.WFResultShare,G=window.WFGuide,P=window.WFPriorities,root=document.getElementById('reco-app');
if(!C||!G||!P||!root)return;
var banner=document.getElementById('reco-shared-profile'),session=null,opener=null,operation=0,outgoing=null;
var dialog=document.createElement('dialog');
dialog.className='reco-share-dialog';dialog.setAttribute('aria-labelledby','reco-share-title');
dialog.setAttribute('aria-describedby','reco-share-description');document.body.appendChild(dialog);
function esc(s){return String(s).replace(/[&<>"']/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];});}
function controller(mode){return mode==='guided'?G:P;}
function status(text,error){
 var el=dialog.querySelector('[data-share-status]');if(!el)return;
 el.textContent=text;el.classList.toggle('is-error',!!error);
}
function close(){operation++;dialog.close();}
function open(title,description,content,trigger){
 if(dialog.open)close();opener=trigger||document.activeElement;
 dialog.innerHTML='<div class="reco-share-dialog-head"><h2 id="reco-share-title">'+title+'</h2><button type="button" class="reco-import-button" data-share-close>Fermer</button></div>'+
  '<p id="reco-share-description">'+description+'</p>'+content+'<p class="reco-share-status" role="status" aria-live="polite" data-share-status></p>';
 dialog.showModal();
}
function openImport(trigger,error){
 open('Ouvrir des résultats partagés','Colle un lien de partage ou choisis un fichier de résultats.',
  '<label class="reco-share-field" for="reco-import-link">Lien de partage</label><input id="reco-import-link" type="url" inputmode="url" placeholder="https://…#partage=…" autocomplete="off" spellcheck="false">'+
  '<button type="button" class="reco-share-button" data-share-open-link>Ouvrir le lien</button>'+
  '<div class="reco-share-file"><label class="reco-share-field" for="reco-import-file">Ou importer un fichier</label><input id="reco-import-file" type="file" accept=".json,application/json"><small>Le fichier téléchargé depuis « Partager mes résultats ».</small></div>',trigger);
 if(error)status(error,true);
}
function openShare(mode,trigger){
 try{outgoing=C.create(mode,controller(mode).getProfile());}catch(e){open('Partager mes résultats','Tes choix ne peuvent pas encore être partagés.','',trigger);status(e.message,true);return;}
 var url=C.link(outgoing,location.protocol==='file:'?'https://loursentong.github.io/wow-forever-classes/':location.href);
 open('Partager mes résultats','Envoie tes choix à un ami ou garde-les pour les reprendre ailleurs.',
  '<p class="reco-share-current">Les résultats sont calculés avec les notes actuelles de l’outil.</p>'+
  '<div class="reco-share-link-fallback" hidden><label class="reco-share-field" for="reco-share-link">Ton lien de partage</label><textarea id="reco-share-link" rows="2" readonly spellcheck="false">'+esc(url)+'</textarea></div>'+
  '<div class="reco-share-options">'+(typeof navigator.share==='function'?'<button type="button" class="reco-share-button" data-share-native>Partager…</button>':'')+
  '<button type="button" class="reco-share-button" data-share-copy>Copier le lien</button><button type="button" class="reco-import-button" data-share-download>Télécharger le fichier</button></div>',trigger);
}
function clearHash(){if(location.hash.indexOf('#partage=')===0)history.replaceState(history.state,'',location.pathname+location.search);}
function focusBanner(){var h=banner.querySelector('h3');if(h){h.focus({preventScroll:true});banner.scrollIntoView({block:'start',behavior:'auto'});}}
function present(packet){
 packet=C.validate(packet);
 var previous=session?session.previous:P.getMode(),scroll=session?session.scroll:window.scrollY;
 if(session)controller(session.packet.mode).endPreview(false);
 session={packet:packet,previous:previous,scroll:scroll};
 root.classList.add('is-shared');controller(packet.mode).preview(packet.choices);P.openMode(packet.mode,true);
 var lines=controller(packet.mode).describe();
 banner.innerHTML='<span class="reco-kicker">Résultats partagés</span><h3 id="reco-shared-title" tabindex="-1">Voici les pistes de ce profil</h3>'+
  '<p>Le classement reprend les choix reçus, avec les notes actuelles de l’outil. Tes propres choix sont conservés.</p>'+
  '<details><summary>Voir les choix · '+(packet.mode==='guided'?'parcours guidé':'mode personnalisé')+'</summary><ul>'+lines.map(function(s){return '<li>'+esc(s)+'</li>';}).join('')+'</ul></details>'+
  '<div class="reco-share-options"><button type="button" class="reco-share-button" data-share-adopt>Essayer ces réglages</button><button type="button" class="reco-import-button" data-share-return>Revenir à mes choix</button></div>';
 banner.hidden=false;focusBanner();
}
function leave(adopt){
 if(!session)return;var old=session;session=null;
 controller(old.packet.mode).endPreview(adopt);root.classList.remove('is-shared');banner.hidden=true;banner.innerHTML='';clearHash();
 P.openMode(adopt?old.packet.mode:old.previous,!adopt);
 var target=adopt?document.getElementById(old.packet.mode==='guided'?'reco-results':'reco-priority-results').querySelector('h3'):root.querySelector('[data-share-import]');
 if(target){target.setAttribute('tabindex','-1');target.focus({preventScroll:true});}
 if(adopt){if(target)target.scrollIntoView({block:'start',behavior:'auto'});}else window.scrollTo({top:old.scroll,behavior:'auto'});
}
function openLink(){
 try{var packet=C.readLink(dialog.querySelector('#reco-import-link').value);close();present(packet);}catch(e){status(e.message,true);}
}
root.addEventListener('click',function(ev){
 var b=ev.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-share-results'))openShare(b.dataset.shareResults,b);
 else if(b.hasAttribute('data-share-import'))openImport(b);
 else if(b.hasAttribute('data-share-adopt'))leave(true);
 else if(b.hasAttribute('data-share-return'))leave(false);
});
dialog.addEventListener('click',async function(ev){
 var b=ev.target.closest('button');if(!b)return;
 if(b.hasAttribute('data-share-close')){close();return;}
 if(b.hasAttribute('data-share-open-link')){openLink();return;}
 if(b.hasAttribute('data-share-copy')){
  var link=dialog.querySelector('#reco-share-link');
  try{
   if(!navigator.clipboard||!navigator.clipboard.writeText)throw new Error('clipboard');
   await navigator.clipboard.writeText(link.value);if(dialog.open&&link.isConnected)status('Lien copié. Tu peux l’envoyer à ton ami.');
  }catch(e){if(dialog.open&&link.isConnected){link.parentElement.hidden=false;link.focus();link.select();status('Le lien est sélectionné. Copie-le avec le menu de ton appareil ou Ctrl+C.');}}
 }
 if(b.hasAttribute('data-share-native')){
  var link=dialog.querySelector('#reco-share-link');
  try{await navigator.share({title:'Choisir ma classe WoW Forever',text:'Voici les classes qui me correspondent. Tu en penses quoi ?',url:link.value});}
  catch(e){if(e.name!=='AbortError'&&dialog.open&&link.isConnected)status('Le partage n’a pas abouti. Tu peux copier le lien.',true);}
 }
 if(b.hasAttribute('data-share-download')){
  var url;
  try{
   url=URL.createObjectURL(new Blob([C.stringify(outgoing)+'\n'],{type:'application/json;charset=utf-8'}));
   var a=document.createElement('a');a.href=url;a.download='choisir-ma-classe-wow-forever-'+(outgoing.mode==='guided'?'guide':'personnalise')+'.json';a.hidden=true;
   document.body.appendChild(a);a.click();a.remove();status('Fichier prêt à enregistrer et à partager.');
  }catch(e){status('Le téléchargement n’a pas abouti. Tu peux copier le lien.',true);}
  if(url)setTimeout(function(){URL.revokeObjectURL(url);},1000);
 }
});
dialog.addEventListener('keydown',function(ev){if(ev.key==='Enter'&&ev.target.id==='reco-import-link'){ev.preventDefault();openLink();}});
dialog.addEventListener('change',async function(ev){
 if(ev.target.id!=='reco-import-file')return;
 var file=ev.target.files[0],token=++operation;if(!file)return;
 try{
  if(file.size>C.maxBytes)throw new Error('Ce fichier est trop volumineux pour être un partage de résultats.');
  var text=await file.text();if(token!==operation||!dialog.open)return;
  var packet=C.parse(text);close();present(packet);
 }catch(e){if(token===operation&&dialog.open)status(e.message,true);}
});
dialog.addEventListener('close',function(){if(dialog.open)return;operation++;if(opener&&opener.isConnected)opener.focus({preventScroll:true});});
function fromHash(){
 if(location.hash.indexOf('#partage=')!==0){if(session)leave(false);return;}
 try{present(C.readLink(location.hash));}catch(e){clearHash();openImport(null,e.message);}
}
window.addEventListener('hashchange',fromHash);
fromHash();
})();
