/* Copie du coupon : indépendante du moteur, sans suivi ni appel réseau. */
(function(){
 'use strict';
 var button=document.querySelector('[data-support-copy]');
 var code=document.getElementById('support-code');
 var status=document.querySelector('.support-copy-status');
 if(!button||!code||!status)return;
 button.hidden=false;
 button.addEventListener('click',async function(){
  try{
   await navigator.clipboard.writeText(code.textContent.trim());
   status.textContent='Code copié. Colle-le au paiement sur RestedXP.';
  }catch(e){
   var range=document.createRange();range.selectNodeContents(code);
   var selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);
   status.textContent='Code sélectionné : copie-le avec le menu de ton appareil ou Ctrl+C / ⌘C.';
  }
 });
})();
