/* Points de départ éditoriaux du mode personnalisé. Les critères non cités restent à zéro.
 * Les profils historiques et le moteur sont conservés séparément. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory();
 else root.WFPriorityProfiles=factory();
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 return [
  {id:'groupe-dps',label:'DPS en groupe',icon:'dps',description:'Faire des dégâts en donjons et en raids.',weights:{dps:3,raid:3}},
  {id:'groupe-tank',label:'Tank en groupe',icon:'tank',description:'Encaisser pour ton groupe en donjons et en raids.',weights:{tank:3,raid:3}},
  {id:'groupe-soin',label:'Soin en groupe',icon:'soin',description:'Soigner ton groupe en donjons et en raids.',weights:{soin:3,raid:3}},
  {id:'bg-dps',label:'DPS en champ de bataille',icon:'bg',description:'Faire des dégâts en champs de bataille.',weights:{dps:3,bg:3}},
  {id:'bg-soin',label:'Soin en champ de bataille',icon:'soin',description:'Soigner tes alliés en champs de bataille.',weights:{soin:3,bg:3}},
  {id:'sauvage-dps',label:'DPS en PvP sauvage',icon:'pvp',description:'Faire des dégâts en duel et en petit comité.',weights:{dps:3,sauv:3}},
  {id:'solo-autonomie',label:'Solo, leveling et farm',icon:'solo',description:'Progresser, faire tes quêtes et farmer en autonomie.',weights:{solo:3}},
  {id:'pvp-controle',label:'Contrôle en PvP',icon:'controle',description:'Miser sur les contrôles en champs de bataille et en PvP sauvage.',weights:{bg:2,sauv:2,ctrl:3}}
 ];
});
