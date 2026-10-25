# Profils et cohérence du mode personnalisé — 25 octobre 2026

Base publiée : `45eb9d40f386ca9717efb1d13900a2c408c3004a` (PR #46), moteur 1.5.0, référence v15. Ce lot est en revue. Il remplace les exemples proposés et améliore leur réglage ; aucune formule, note, donnée de complexité ou fixture historique n’est modifiée.

## Profils proposés

Les intitulés génériques PvE/PvP laissaient implicites les rôles et ajoutaient des goûts de gameplay. Le nouveau catalogue, séparé du moteur dans `priority-profiles.js`, annonce chaque intention. Les critères absents prennent zéro.

| Profil | Critères activés |
| --- | --- |
| DPS en groupe | DPS 3, Donjons et raids 3 |
| Tank en groupe | Tank 3, Donjons et raids 3 |
| Soin en groupe | Soin 3, Donjons et raids 3 |
| DPS en champ de bataille | DPS 3, Champ de bataille 3 |
| Soin en champ de bataille | Soin 3, Champ de bataille 3 |
| DPS en PvP sauvage | DPS 3, PvP sauvage 3 |
| Solo, leveling et farm | Solo 3, sans rôle imposé |
| Contrôle en PvP | Contrôle 3, Champ de bataille 2, PvP sauvage 2, sans rôle imposé |

Ce sont des points de départ éditoriaux, pas des builds ou des recommandations universelles. Aucun ne valorise par défaut la difficulté ou la polyvalence. Le profil de groupe utilise le repère PvE existant ; le solo reste une activité distincte. Les quinze anciens profils demeurent dans les données et les tests de référence. Le chargement et la restauration des anciennes pondérations restent inchangés ; choisir un nouveau profil ne change pas la maîtrise ni les critères personnels enregistrés.

## Importance des critères

La légende 0–3 précède les réglages ; le niveau sélectionné apparaît aussi en mots près du nom du critère. Le zéro reste visible avec un traitement plus discret ; les critères actifs ressortent en or. Les titres sont des titres HTML accessibles. Sur mobile, sélectionner un profil ouvre ses groupes actifs, en gardant la possibilité de les replier sans désactiver les poids. Les deux parcours et les commandes de sauvegarde/restauration sont conservés.

## Vérification croisée du moteur et des explications

Commande reproductible : `node scripts/audit-personnalise.cjs`. Elle fournit un bilan JSON et échoue en cas d’anomalie.

- 56 ensembles : 8 nouveaux profils, 15 historiques, 15 critères isolés et 18 cas mêlant rôles, activités et styles.
- Les 4 maîtrises et les 28 configurations : **6 272 explications**, dont Précision en Loup solitaire.
- **30 240 repères communs** vérifiés avec le guide : notes, effet de maîtrise, aisance dans les activités, styles, difficultés PvE/PvP et rôles proposés par la classe.
- Recomposition du score à sa précision de deux décimales ; ordre du classement ; points détaillés et maxima affichés ; absence de texte incomplet et de classement sans critère.
- **113 572 contrôles, aucune anomalie détectée** sur ce périmètre.

Les différences de score global entre les deux parcours sont attendues : leurs coefficients de domaine diffèrent. Pour les rôles, le guide distingue la capacité à jouer le rôle et l’aisance ; le mode personnalisé pondère l’aisance. En contexte mixte, les certitudes du guide et les importances personnalisées ne sont pas interchangeables. L’audit vérifie les mêmes repères par activité et par contexte, puis la fidélité de chaque restitution à son calcul ; il n’impose pas des classements identiques entre les parcours.

Ce contrôle ne valide pas les performances réelles des classes ni l’exhaustivité de tous les profils possibles. Les notes restent éditoriales. Les fixtures v1 à v15 ne sont pas régénérées.

## Validation de l’interface

**208 tests réussis.** La suite couvre le nouveau catalogue, les sauvegardes et les références antérieures. Le contrôle Chromium réussi compare les lignes et les explications réellement présentes dans la page aux sorties du moteur pour les 8 profils, 4 maîtrises et 28 configurations, soit **896 lignes**. Il vérifie aussi les deux parcours, le clavier et les vues à 320, 390 et 1 300 pixels. Les captures ont été relues pour les deux blocs avant publication. L’artefact Pages inclut le nouveau catalogue et a été vérifié.
