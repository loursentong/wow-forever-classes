# Réévaluation des spécialisations au 4 novembre 2026

Les 28 configurations des neuf classes ont été réexaminées après le bilan officiel de Blizzard intitulé « Updated November 2 », ses compléments et les correctifs du client. La revue couvre les 336 notes de spécialisation, les quatre variantes sans familier, les profils de soin et les composantes de difficulté. Le moteur passe à `1.7.0-exploratoire` et la référence active à v17, à partir du commit `583a8cbe7d84f68f926103f7abde0d7af9e66a37`.

## Sources et contexte

Le [message officiel de Blizzard](https://us.forums.blizzard.com/en/wow/t/2360696/9) récapitule les changements depuis le 15 octobre. La lecture du 4 novembre inclut notamment la précision selon laquelle Swiftmend conserve le soin sur la durée de son lanceur. Les [relevés WFT](https://wowforevertalents.com/patch-notes/) et [ForeverChanges](https://foreverchanges.pro/fr/patch-notes) distinguent les annonces, le client 70755 et les données de correctifs. Soins de lien a quitté le grimoire et le dernier rang de Bouclier sacré est associé au niveau 60. Plusieurs annonces peuvent encore précéder les tables consultées.

Les guides du 3 novembre de Mytholxgy chez Icy Veins, de Progress/Thick chez Mobalytics et de Celz chez Method apportent le contexte de jeu pour les soins du Paladin, le solo Protection et le leveling Givre. Leurs conclusions restent attribuées à leurs auteurs. Les sites reprenant les mêmes tables du client ne constituent pas des mesures indépendantes.

La [photographie MythicSim du 4 novembre](https://mythicsim.com/wow-forever/tier-list) est conservée avec les valeurs précises, les dates des rapports, les talents, les races, les rotations et les empreintes dans `connaissances/revisions/2026-11-04.json`. Les rapports utilisent 10 000 itérations sur un boss de niveau 63, un personnage de niveau 60 et deux minutes ±15 secondes. Chaque preset possède son équipement et ses bijoux. Le [journal du simulateur](https://mythicsim.com/changelog) distingue corrections de mécaniques, objets encore provisoires et optimisations de rotations.

## Dégâts monocibles de groupe

Le barème existant reste appliqué aux valeurs non arrondies : 5 à partir de 86 % de la référence, 4 à partir de 72 %, 3 à partir de 55 %, 2 en dessous. Survie en tissage sans compagnon constitue la référence de cette photographie, à 1 288,368517 DPS.

| Configuration | Avant | Après |
| --- | ---: | ---: |
| Paladin Vindicte | 3 | 4 |
| Chasseur Précision à distance, Loup solitaire | 3 | 4 |
| Voleur Finesse | 3 | 4 |
| Chaman Élémentaire | 2 | 3 |
| Chaman Amélioration | 3 | 4 |
| Mage Arcane | 3 | 4 |
| Démoniste Destruction | 3 | 4 |
| Druide Farouche félin | 3 | 4 |
| Démoniste Affliction sans démon, sacrifice | 3 | 4 |

Affliction exige une distinction : le build simulé 35/11/5 sacrifie son démon. Sa variante sans familier reçoit 4. Le repère de la configuration avec démon reste à 3 en confiance faible, faute de nouvelle mesure comparable. Le 5 de Survie avec compagnon reste lui aussi une hypothèse héritée, tandis que sa variante sans compagnon correspond au preset mesuré. BM et Précision conservent des références à distance cohérentes avec leur description du jeu.

Finesse franchit le seuil de 4 de moins de 0,05 DPS, et Destruction d’environ 1,14 DPS. Ces deux notes ont une confiance faible. Assassinat conserve 3, car son ratio exact reste inférieur à 72 % malgré l’arrondi de la carte. Les variations d’équipement, les correctifs du moteur et les rotations participent aux écarts entre photographies.

## Solo, styles et difficulté

| Configuration | Critère | Avant → après | Motif |
| --- | --- | --- | --- |
| Guerrier Armes | Burst | 5 → 4 | Fenêtres fortes, mais Death Wish est incompatible avec Mortal Strike et les bonus de Spearing Strike sont conditionnels. |
| Paladin Protection | Solo | 5 → 4 | Farm de packs favorable, mais quête monocible et mana plus contraignants. |
| Mage Givre | Solo | 3 → 4 | Kiting et défenses sécurisent les quêtes difficiles, avec un coût de mana. |
| Voleur Assassinat | Contrôle | 5 → 4 | Outils de base comparables à Combat ; le supplément spécifique de Finesse est distingué. |
| Chaman Élémentaire | Burst | 5 → 4 | Retrait de Lava Burst ; nouvelle fenêtre Lightning Mastery/Éclair/Chaîne/Horions évaluée séparément. |
| Démoniste Destruction | Soutien | 2 → 3 | Pierres, invocation et malédictions de classe disponibles, cohérents avec les autres Démonistes. |
| Guerrier Fureur | Difficulté PvE | 3 → 4 | La référence utilise Overpower et des changements de posture en combat. |
| Paladin Sacré | Difficulté PvE | 2 → 3 | Priorités, procs et séquence Vigile/Holy Shock. |
| Voleur Assassinat | Difficulté PvE | 2 → 3 | Garrot réutilisé après Vanish, avec contrainte de placement. |
| Voleur Combat | Difficulté PvE | 2 → 3 | Référence Attaque sournoise, Shank et fenêtres de recharges, avec placement dans le dos. |
| Chaman Amélioration | Difficulté PvE | 3 → 4 | Procs Maelstrom et priorités de frappes et sorts qui interagissent. |
| Paladin Sacré | Difficulté PvP | 2 → 3 | Plusieurs défenses et échappatoires à décider, immunités sous Forbearance comptées ensemble. |
| Paladin Protection | Difficulté PvP | 2 → 3 | Même vérification des défenses, complétée par le kit Protection. |
| Paladin Vindicte | Difficulté PvP | 3 → 4 | Plusieurs recharges défensives et échappatoires à placer en plus de l’ouverture. |
| Démoniste Destruction sans familier | Difficulté PvE | 2 → 3 | Effets sur la durée et malédictions à entretenir, malgré l’absence de démon à piloter. |

La grille commune détermine les difficultés à partir de ses composantes. Certaines composantes évoluent sans franchir une tranche : Pilotage Armes, Rotation Équilibre et Arcane, Entretien Restauration Chaman et Destruction. Les consommables et la longueur brute d’une liste d’actions ne servent pas de mesure de difficulté. Les tâches de la référence effectivement jouée et les contraintes du build sont examinées.

## Notes conservées et inconnues

Les autres notes conservent leurs valeurs après examen, avec leurs réserves dans les fiches. Les profils de soin distinguent prévention, durée, cible et groupe. Les cinq repères de raid des soigneurs restent une convention de rôle, faute de comparaison HPS suffisamment cohérente pour le lancement. La disparition du soin initial de Remous modifie sa justification et sa charge d’entretien.

Les bonus de menace de l’Ours et des tanks Guerrier sont traités dans le contrôle de l’aggro. La mitigation, la survie réelle et le confort de progression demandent leurs propres observations. La réduction de vie transférée aux familiers Démonistes est signalée dans les jugements de solo et de survie. Les contraintes de pièges du Chasseur, la recharge commune Javelot/Trait de feu et les talents retirés sont répercutés dans les descriptions.

Cette revue précède l’ouverture en Europe. Les écarts PvP niveau 60, la tenue du tissage en situation réelle et les détails encore approximatifs du simulateur gardent une incertitude explicite. Les formules, coefficients, pondérations, sauvegardes et formats de partage conservent leur contrat existant.

## Comparaison et validation

Sur les mêmes 59 anciens profils guidés, 47 classements changent, dont cinq premières places. Sur les mêmes 133 situations personnalisées, 131 ont au moins un score modifié, dont quinze premières places. Trois cas ciblés supplémentaires rejoignent la référence v17. Les anciennes références sont conservées intactes et l’identité des formules est vérifiée contre la base gelée.

La matrice des classes répercute sept cellules dérivées. Les différences des spécialisations, de leurs variantes et de leur difficulté sont contrôlées séparément.

Validation locale terminée : 241 tests réussis ; 113 572 vérifications des explications sans anomalie ; parcours Chromium sur ordinateur, mobile et clavier, sauvegardes, partage et import réussis ; artefact GitHub Pages complet. Les trente propositions de notes sources et de composantes sont vérifiées sans erreur ni avertissement contre la base immuable conservée.
