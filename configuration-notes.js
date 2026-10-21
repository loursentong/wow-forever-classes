/* Repères éditoriaux du 21 octobre 2026. Aucune donnée de scoring.
 * Synthèse des fiches Blizzard liées à chaque configuration dans le moteur.
 * Les préférences et difficultés décrites sont des orientations, pas des mesures.
 */
(function(root,factory){
 var notes=factory();
 if(typeof module==='object'&&module.exports)module.exports=notes;
 else root.WFConfigurationNotes=notes;
})(typeof globalThis==='object'?globalThis:this,function(){
 'use strict';
 return {
  'guerrier-armes':{
   fit:'Tu aimes les frappes marquées et le combat au corps à corps.',
   strengths:['Frappes puissantes','Pression en mêlée'],
   caution:'Le placement et le choix des engagements comptent. En solo, les temps de récupération et ton arme influencent le confort.'
  },
  'guerrier-fureur':{
   fit:'Tu recherches une mêlée offensive au rythme soutenu.',
   strengths:['Attaques soutenues','Jeu offensif'],
   caution:'Il faut gérer la rage et rester au contact. La qualité des armes et de l’équipement compte dans cette progression.'
  },
  'guerrier-protection':{
   fit:'Tu veux tenir les ennemis et protéger ton groupe en première ligne.',
   strengths:['Résistance','Outils de tank'],
   caution:'Le rôle demande de connaître les rencontres, de placer les ennemis et de préparer un équipement adapté au tank.'
  },
  'paladin-sacre':{
   fit:'Tu veux soigner avec des outils de protection et de soutien.',
   strengths:['Soins sur une cible','Protection des alliés'],
   caution:'La mobilité reste limitée. Les soins de groupe demandent de préparer tes outils et de surveiller ton placement.'
  },
  'paladin-protection':{
   fit:'Tu aimes protéger le groupe avec une approche défensive.',
   strengths:['Résistance','Soutien au groupe'],
   caution:'Prévois un équipement de tank et tes déplacements. Consécration ne garantit pas à elle seule de tenir un nombre illimité d’ennemis.'
  },
  'paladin-vindicte':{
   fit:'Tu veux combattre en mêlée tout en aidant tes alliés.',
   strengths:['Frappes de mêlée','Soutien ponctuel'],
   caution:'La base est assez accessible ; les variantes de sceaux et le bon usage du soutien demandent plus d’apprentissage. Ton arme compte.'
  },
  'chasseur-maitrise-betes':{
   fit:'Tu veux jouer à distance avec un compagnon au centre de ton jeu.',
   strengths:['Compagnon protecteur','Confort en solo'],
   caution:'Une entrée accessible en tir statique, avec un familier à diriger et à garder en vie. Alterner tirs et mêlée rapporte environ 3 à 9 % de dégâts, au prix d’un apprentissage supplémentaire.'
  },
  'chasseur-precision':{
   fit:'Tu préfères les tirs puissants et le placement à distance.',
   strengths:['Tirs puissants','Combat à distance'],
   caution:'Évaluée en « Loup solitaire », sans familier : moins de confort en solo. Le tir statique suffit ; alterner tirs et mêlée n’apporte presque rien.'
  },
  'chasseur-survie':{
   fit:'Tu aimes les pièges et une approche active au corps à corps.',
   strengths:['Pièges','Outils de mêlée'],
   caution:'Évaluée en alternance tirs et mêlée, la façon la plus efficace mais la plus exigeante de la jouer ; en mêlée seule, plus simple mais environ 21 % moins efficace. Sans familier, un peu moins à l’aise en solo.'
  },
  'voleur-assassinat':{
   fit:'Tu aimes les dagues, les poisons et les effets à entretenir.',
   strengths:['Poisons','Pression ciblée'],
   caution:'Il faut suivre tes effets, ton énergie et tes points de combo. Les armes et les conditions de placement influencent le rythme.'
  },
  'voleur-combat':{
   fit:'Tu préfères une approche directe du combat avec tes armes.',
   strengths:['Mêlée soutenue','Approche directe'],
   caution:'L’énergie et les points de combo restent à apprendre. Les armes utilisées comptent dans le choix de tes talents et ta progression.'
  },
  'voleur-finesse':{
   fit:'Tu aimes préparer tes ouvertures et jouer avec la furtivité.',
   strengths:['Ouvertures tactiques','Mobilité et contrôle'],
   caution:'Il faut anticiper et choisir le bon moment, particulièrement en PvP. Les nombreuses possibilités demandent de la pratique.'
  },
  'pretre-discipline':{
   fit:'Tu veux protéger tes alliés avec des absorptions tout en les soignant.',
   strengths:['Absorptions','Protection et soins'],
   caution:'Anticiper les dégâts demande de l’attention et la mobilité reste limitée. Résister aux contrôles et contrôler les ennemis sont deux qualités distinctes.'
  },
  'pretre-sacre':{
   fit:'Tu veux un soigneur aux outils variés et assez directs.',
   strengths:['Soins variés','Réponses aux dégâts du groupe'],
   caution:'Il faut choisir le bon soin et gérer ton mana. La mobilité reste limitée ; le placement aide à garder le groupe à portée.'
  },
  'pretre-ombre':{
   fit:'Tu préfères les dégâts magiques entretenus avec du soutien complémentaire.',
   strengths:['Dégâts dans la durée','Soutien complémentaire'],
   caution:'Il faut suivre tes effets et tes ressources. Cette configuration DPS ne remplace pas une spécialisation de soin dédiée.'
  },
  'chaman-elementaire':{
   fit:'Tu veux lancer des sorts offensifs et aider avec tes totems.',
   strengths:['Pics de dégâts','Totems de soutien'],
   caution:'Le mana, le placement et le choix des totems demandent de l’attention. En raid, ses dégâts simulés sont les plus bas au niveau 60 : son atout de groupe tient surtout aux totems.'
  },
  'chaman-amelioration':{
   fit:'Tu aimes mêler attaques d’armes, magie et totems.',
   strengths:['Mêlée et magie','Soutien par les totems'],
   caution:'Il faut coordonner plusieurs outils en restant au contact. Les armes et l’équipement influencent cette progression.'
  },
  'chaman-restauration':{
   fit:'Tu veux soigner directement et soutenir ton groupe avec des totems.',
   strengths:['Soins directs et de groupe','Totems de soutien'],
   caution:'Il faut surveiller le mana et le placement des alliés. Les outils mobiles aident, mais tous les soins ne se lancent pas en déplacement.'
  },
  'mage-arcane':{
   fit:'Tu aimes enchaîner des sorts en gérant ta ressource.',
   strengths:['Enchaînements de sorts','Fenêtres offensives'],
   caution:'La gestion du mana et le bon enchaînement demandent de l’attention. Le jeu ne se résume pas à répéter un seul sort.'
  },
  'mage-feu':{
   fit:'Tu aimes les critiques et les fenêtres de dégâts offensifs.',
   strengths:['Pics de dégâts','Dégâts de zone'],
   caution:'La fragilité impose de soigner le placement. Préparer tes fenêtres offensives et progresser en équipement influencent les résultats.'
  },
  'mage-givre':{
   fit:'Tu aimes ralentir les ennemis et garder tes distances.',
   strengths:['Ralentissements','Gestion de la distance'],
   caution:'Le contrôle facilite le placement, mais gérer plusieurs ennemis à la fois demande de la pratique. Les résultats varient selon la situation.'
  },
  'demoniste-affliction':{
   fit:'Tu aimes entretenir des dégâts dans le temps et gérer tes ressources.',
   strengths:['Dégâts persistants','Pression sur plusieurs cibles'],
   caution:'Il faut suivre tes effets et tes ressources. Les dégâts ont besoin de temps ; le choix du démon dépend aussi de la situation.'
  },
  'demoniste-demonologie':{
   fit:'Tu veux construire ton jeu autour de ton démon et de la robustesse.',
   strengths:['Démon central','Confort en solo'],
   caution:'Le démon est un élément essentiel à gérer et à garder en vie. Les effets qui soignent le familier ne soignent pas automatiquement ton personnage.'
  },
  'demoniste-destruction':{
   fit:'Tu préfères les sorts offensifs et les pics de dégâts.',
   strengths:['Pics de dégâts','Sorts offensifs directs'],
   caution:'Prévois tes incantations et ton placement. Cette configuration ne reprend pas toute la robustesse de Démonologie ; le démon reste un choix à gérer.'
  },
  'druide-equilibre':{
   fit:'Tu veux infliger des dégâts à distance avec de nombreux outils utiles.',
   strengths:['Magie à distance','Mobilité et soutien'],
   caution:'Les outils sont nombreux et le mana compte. Changer de rôle demande des talents et un équipement adaptés, pas seulement une autre forme.'
  },
  'druide-farouche-chat':{
   fit:'Tu aimes une mêlée mobile avec des ressources et des effets à suivre.',
   strengths:['Mobilité','Pression en mêlée'],
   caution:'Le rythme, les ressources et le placement demandent de la pratique. L’accès à la forme d’ours ne remplace pas une préparation de tank.'
  },
  'druide-farouche-ours':{
   fit:'Tu veux protéger le groupe en encaissant sous forme d’ours.',
   strengths:['Résistance','Outils de tank'],
   caution:'Il faut gérer les ennemis et connaître les rencontres. Un équipement de tank et les choix adaptés restent nécessaires.'
  },
  'druide-restauration':{
   fit:'Tu aimes anticiper les dégâts avec des soins dans la durée et rester mobile.',
   strengths:['Soins dans la durée','Mobilité'],
   caution:'Suivre et préparer les soins demande de l’anticipation. Les nombreux outils et changements de forme enrichissent le jeu, avec davantage à apprendre.'
  }
 };
});
