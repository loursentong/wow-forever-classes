/* Restitution commune aux deux parcours ; aucun calcul de score. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./configuration-notes.js'));
 else root.WFConfigurationDetails=factory(root.WFConfigurationNotes);
})(typeof globalThis==='object'?globalThis:this,function(notes){
 'use strict';
 function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 var effort=['','Peu exigeant','Assez accessible','Demande de la pratique','Exigeant','Très exigeant'];
 return function(spec){
  var note=notes&&notes[spec.id];
  if(!note)return '';
  return '<details class="reco-evidence reco-config-details" data-config-id="'+esc(spec.id)+'">'+
   '<summary>Jouer '+esc(spec.label)+'</summary>'+
   '<p><b>Pour toi si…</b> '+esc(note.fit)+'</p>'+
   '<p><b>Ses atouts :</b> '+note.strengths.map(esc).join(' · ')+'.</p>'+
   '<p><b>À prévoir :</b> '+esc(note.caution)+'</p>'+
   (spec.load?'<p><b>Difficulté de cette spécialisation :</b> PvE : '+esc(effort[spec.load.pve])+' · PvP : '+esc(effort[spec.load.pvp])+'. Repères éditoriaux : la prise en main et l’optimisation peuvent différer.</p>':'')+
   '<p><a href="'+esc(spec.source)+'" target="_blank" rel="noopener noreferrer">Fiche officielle de la classe ↗</a></p>'+
   '</details>';
 };
});
