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
 /* Référentiel de complexité (référence v11) : composantes dans l'ordre du moteur (spec.complexity), avec les
  * mots de la base de connaissances (connaissances/referentiel-complexite.json). Une composante à 2 points
  * « pèse beaucoup », à 1 point « un peu » ; à 0, elle n'est pas citée. */
 var grid={pve:['rotation','entretien','ressource','placement','pilotage'],pvp:['controles','defense','placement','ouverture','pilotage']};
 var phrases={pve:{rotation:'la rotation',entretien:'les effets à entretenir',ressource:'la gestion de la ressource',placement:'le placement',pilotage:'le pilotage'},
  pvp:{controles:'les contrôles',defense:'la défense',placement:'le placement',ouverture:'l’ouverture',pilotage:'le pilotage'}};
 var contextNames={pve:'PvE',pvp:'PvP'};
 function list(items){return items.length>1?items.slice(0,-1).join(', ')+' et '+items[items.length-1]:items[0];}
 function weigh(items){return items.length>1||/^les /.test(items[0])?'pèsent':'pèse';}
 function weighs(spec,ctx){
  var points=spec&&spec.complexity&&spec.complexity[ctx];
  if(!points||!grid[ctx])return '';
  var heavy=[],light=[];
  grid[ctx].forEach(function(k,i){if(points[i]===2)heavy.push(phrases[ctx][k]);else if(points[i]===1)light.push(phrases[ctx][k]);});
  if(heavy.length&&light.length)return list(heavy)+' '+weigh(heavy)+' beaucoup ; '+list(light)+', un peu';
  if(heavy.length)return list(heavy)+' '+weigh(heavy)+' beaucoup';
  if(light.length)return list(light)+' '+weigh(light)+' un peu';
  return 'rien n’y pèse';
 }
 function difficulty(spec){
  if(!spec.load)return '';
  var levels=['pve','pvp'].map(function(c){return contextNames[c]+' : '+esc(effort[spec.load[c]])+' ('+spec.load[c]+'/5)';}).join(' · ');
  if(!spec.complexity)return '<p><b>Difficulté de cette spécialisation :</b> '+levels+'.</p>';
  // Depuis la v12, une variante sans familier a sa propre grille : le lien mène à sa section de la fiche.
  return '<p><b>Difficulté de cette spécialisation :</b> '+levels+'. '+
   ['pve','pvp'].map(function(c){return 'En '+contextNames[c]+', '+esc(weighs(spec,c))+'.';}).join(' ')+
   ' <a href="fiches-sources/'+esc(spec.classId)+'.html#'+esc(spec.id)+(spec.variant==='sans-familier'?'-sans-familier':'-complexite')+'">Le détail, composante par composante</a></p>';
 }
 function render(spec){
  var note=notes&&notes[spec.id];
  if(!note)return '';
  return '<details class="reco-evidence reco-config-details" data-config-id="'+esc(spec.id)+'">'+
   '<summary>Jouer '+esc(spec.label)+'</summary>'+
   (spec.id==='chasseur-precision'?'<p><b>Build évalué :</b> Loup solitaire, sans familier. Le build avec compagnon n’est pas évalué ici.</p>':'')+
   '<p><b>Pour toi si…</b> '+esc(note.fit)+'</p>'+
   '<p><b>Ses atouts :</b> '+note.strengths.map(esc).join(' · ')+'.</p>'+
   '<p><b>À prévoir :</b> '+esc(note.caution)+'</p>'+
   (spec.heal?healLine(spec.heal):'')+
   difficulty(spec)+
   '<p><a href="fiches-sources/'+esc(spec.classId)+'.html#'+esc(spec.id)+(spec.variant==='sans-familier'?'-sans-familier':'')+'">Les notes et les sources du '+esc(spec.className)+'</a> · <a href="'+esc(spec.source)+'" target="_blank" rel="noopener noreferrer">Fiche officielle ↗</a></p>'+
   '</details>';
 }
 render.complexity={grid:grid,phrases:phrases,weighs:weighs};
 return render;
});
