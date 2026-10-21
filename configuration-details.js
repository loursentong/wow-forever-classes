/* Restitution commune aux deux parcours ; aucun calcul de score. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./configuration-notes.js'));
 else root.WFConfigurationDetails=factory(root.WFConfigurationNotes);
})(typeof globalThis==='object'?globalThis:this,function(notes){
 'use strict';
 function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 var effort=['','Peu exigeant','Assez accessible','Demande de la pratique','Exigeant','Très exigeant'];
 // Profil de soin (référence v8) : portrait éditorial tiré de la base de connaissances, pas un classement.
 var healNames={prevention:'Prévenir les dégâts',duree:'Soins sur la durée',cible:'Gros soins ciblés',groupe:'Soigner tout le groupe'};
 var healLevels=['','peu présent','secondaire','présent','un atout','son point fort'];
 function healLine(heal){
  var keys=Object.keys(healNames).filter(function(k){return heal[k]>=1&&heal[k]<=5;})
   .sort(function(a,b){return heal[b]-heal[a];});
  return '<p><b>Façon de soigner :</b> '+keys.map(function(k){return esc(healNames[k])+' : '+healLevels[heal[k]];}).join(' · ')+
   '. Portrait tiré des présentations officielles, pas un classement de puissance.</p>';
 }
 return function(spec){
  var note=notes&&notes[spec.id];
  if(!note)return '';
  return '<details class="reco-evidence reco-config-details" data-config-id="'+esc(spec.id)+'">'+
   '<summary>Jouer '+esc(spec.label)+'</summary>'+
   '<p><b>Pour toi si…</b> '+esc(note.fit)+'</p>'+
   '<p><b>Ses atouts :</b> '+note.strengths.map(esc).join(' · ')+'.</p>'+
   '<p><b>À prévoir :</b> '+esc(note.caution)+'</p>'+
   (spec.heal?healLine(spec.heal):'')+
   (spec.load?'<p><b>Difficulté de cette spécialisation :</b> PvE : '+esc(effort[spec.load.pve])+' · PvP : '+esc(effort[spec.load.pvp])+'. Repères éditoriaux : la prise en main et l’optimisation peuvent différer.</p>':'')+
   '<p><a href="'+esc(spec.source)+'" target="_blank" rel="noopener noreferrer">Fiche officielle de la classe ↗</a></p>'+
   '</details>';
 };
});
