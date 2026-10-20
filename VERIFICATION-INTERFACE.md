# Vérification des retours d'interface — 20 octobre 2026

## Base et comparaison des branches

Révision construite sur `main` au commit `74a0e6f6e9590aacc51b98a7ac54d0917c0a92a8`, comparée à `claude/maitrise-et-graphiques` (`d6f717f`). Le modèle à plancher/plafond distincts de Claude était déjà intégré dans `main`, avec les contrôles automatisés et l'exception solo du Chasseur. Ces éléments sont conservés.

Les variables de couleur des deux branches sont identiques. L'apparence claire ou sombre dépendait du système, ce qui pouvait changer le rendu perçu. Le sombre devient le défaut, conformément au choix utilisateur ; un sélecteur permet de conserver le clair ou le suivi du système. La palette existante est conservée.

## Résultat

- Maîtrise intégrée à la liste des pondérations, avec ses quatre niveaux. Elle n'ajoute aucun axe ni poids : le calcul reste sur douze critères.
- Suppression du bloc « Réglage global », des notes ajustées et flèches de la matrice, du bloc de duel et de son code associé.
- Conservation du tableau PvE/PvP plancher/plafond, avec neuf raisons succinctes et leurs références entre crochets. Les références étayent les mécanismes ; les coefficients restent des estimations éditoriales.
- Onze préréglages, dont sept nouveaux : Solo et leveling, Tank en groupe, Soin en groupe, DPS en raid, Champ de bataille, PvP sauvage, Soutien polyvalent. Aucun ne remplace le niveau de maîtrise choisi.
- Maintien du classement, des neuf courbes et de leur tableau de 36 scores, de la mise en avant des classes, du stockage des préférences et de la migration des anciennes sauvegardes.

## Contrôles

`node --test tests/skill-matching.test.cjs` : **15 tests réussis**. Les notes de référence sont figées dans `tests/reference-notes.json`, issu du commit de base, et vérifiées séparément dans la configuration et les 108 cellules HTML. Les scores historiques à Confirmé restent identiques. Les contrôles couvrent aussi les onze profils, la monotonie des niveaux, les rôles absents, l'exception solo du Chasseur, les poids tous nuls, les sauvegardes invalides et le stockage indisponible. Les fins de ligne Windows et Unix sont acceptées.

Contrôle dans un véritable navigateur Chrome, avec captures inspectées en clair et sombre : largeurs de **320, 390, 820, 900, 1 024 et 1 440 pixels**. Aucun débordement horizontal de la page ni libellé de maîtrise tronqué. Les tableaux larges conservent leur défilement horizontal local sur mobile.

Les quatre niveaux et onze préréglages ont été actionnés dans le navigateur : la matrice reste identique, le classement réagit et le niveau choisi reste conservé. Vérifications supplémentaires : rechargement, persistance des thèmes, thème système suivant les changements clair/sombre, clavier Entrée/Espace, ouverture du tableau des courbes, tous les poids à zéro et destinations des références bibliographiques. Aucune erreur JavaScript observée.

Cette révision ne réévalue pas les données de performance ni les divergences historiques MythicSim : notes, paramètres et audit documentaire sont conservés.

## Livraison

Pull request séparée vers `main`. Le déploiement GitHub Pages reste déclenché par la fusion sur `main` ; aucune publication directe n'est effectuée par cette révision.

## Révision des profils (Claude, 20 octobre 2026)

Constat : dans les onze profils précédents, des critères génériques (Polyvalence, Mobilité, Utilité, Technicité) étaient ajoutés presque partout. Ils favorisaient le Druide, en tête de 7 profils sur 11, y compris « Tank en groupe » (devant le Guerrier, seul tank noté 5) et « Champ de bataille » ; le Mage, le Chasseur, le Prêtre et le Chaman ne menaient aucun profil.

Révision : treize profils, chacun nommé d'après son critère dominant (au moins la moitié des poids), sans Technicité ni Polyvalence ajoutées. Têtes au niveau Confirmé : Guerrier (Tank ; DPS en raid, ex æquo avec le Chasseur), Paladin (PvE d'abord, Champ de bataille, Solo et leveling), Prêtre (Soin en champ de bataille), Voleur (PvP sauvage ; Contrôle, ex æquo avec le Mage et le Démoniste), Démoniste (PvP d'abord), Druide (Tout à égalité, Polyvalence, Soin en groupe ; Soutien et mobilité, ex æquo avec le Chaman).

Limite : avec les notes actuelles, le Mage n'égale ou ne dépasse le Démoniste que sur la Mobilité, et le Chaman n'égale ou ne dépasse le Druide que sur la Technicité ; aucun profil honnête ne peut donc les placer seuls en tête. Cette limite est levée par l'ajout des critères Burst et Dégâts de zone (section suivante).

Tests : 17 réussis (deux nouveaux : chaque classe mène ou partage la tête d'un profil ; chaque profil respecte les règles de construction). Le test de désélection des profils modifie désormais la Technicité, qu'aucun profil n'utilise, au lieu du Solo, devenu le dernier profil de la liste.

## Ajout de Burst et Dégâts de zone (Claude, 20 octobre 2026)

Pourquoi : sur les douze critères, le Mage ne dépassait le Démoniste que sur la Mobilité et le Chaman ne dépassait le Druide que sur la Technicité. Aucun profil ne pouvait les mettre seuls en tête sans fausser une note. Il manquait deux qualités que les sources attribuent justement à ces classes : les dégâts concentrés et les dégâts de zone.

Définitions, affichées au survol des colonnes :

- **Burst** (fiabilité faible) : dégâts concentrés en quelques secondes (ouvertures, recharges offensives, enchaînements). Suit le paramètre de maîtrise PvP.
- **Dégâts de zone** (fiabilité moyenne) : dégâts sur plusieurs cibles en groupe (packs de donjon, adds, mêlées de champ de bataille). Le farm de zone en solo reste dans « Solo et farm ». Suit le paramètre de maîtrise PvE.

| Classe | Burst | Dégâts de zone | Appui principal |
| --- | ---: | ---: | --- |
| Guerrier | 4 | 5 | Armes cité par Kami [1] ; référence du cleave voulue par Blizzard [5] |
| Paladin | 4 | 3 | Vindicte et Shockadin [1], Champion of the Light divisé par deux ; Consécration ramenée de 0,095 à 0,042 [3] |
| Chasseur | 4 | 3 | Précision [1] ; Flèches multiples, Salve, pièges de feu indexés sur la puissance d'attaque [3] |
| Voleur | 5 | 2 | Embuscade et Sang froid [1] ; seulement Déluge de lames |
| Prêtre | 3 | 2 | Mot de l'ombre : Mort à 18 s [3] ; Nova sacrée, Devouring Contagion sur 2 cibles [3] |
| Chaman | 5 | 4 | Explosion de lave et Furie-des-vents [1] ; Chaîne d'éclairs environ 35 % moins chère [3] |
| Mage | 5 | 5 | Givre et Feu [1] ; Blizzard, Choc de flammes, Explosion des arcanes, Cône de froid |
| Démoniste | 5 | 4 | Destruction, dégâts sur la durée qui critiquent [1] ; Flammes infernales, Pluie de feu |
| Druide | 4 | 3 | Farouche avec Berserk [1] ; Balayage, Ouragan |

Les changements cités en [3] figurent dans la section du 16 octobre des notes de développement officielles. Flèches multiples instantanée, repérée dans les données du jeu mais absente des notes, n'est pas retenue. La fiche du Mage précise désormais que le farm de zone bridé concerne le jeu en solo et ajoute ses dégâts de zone en groupe à ses points forts.

Deux profils, construits selon les mêmes règles que les autres :

- **Dégâts de zone** : Dégâts de zone ×3, Burst ×1. Mage 100, Guerrier 95.
- **Burst et mobilité** : Burst ×3, Mobilité ×1. Chaman 100, Voleur 95.

Les autres profils ne changent pas. Champ de bataille et Sauvage et duel sont des notes d'ensemble qui intègrent déjà le burst ; l'ajouter à PvP d'abord le compterait deux fois. « Tout à égalité » passe à quatorze critères : Druide 80, Paladin 76, Chaman 73, Guerrier 70, Démoniste 69, Prêtre 64, Chasseur 63, Mage 63, Voleur 60.

Têtes au niveau Confirmé : chaque classe mène seule au moins un profil, sauf le Chasseur, à égalité avec le Guerrier en DPS en raid. Le Mage mène Dégâts de zone et le Chaman Burst et mobilité.

Préférences enregistrées : une sauvegarde antérieure reçoit 0 dans les deux nouveaux critères. Son classement et son profil restent donc identiques. Exception : si tous ses poids étaient égaux, comme dans « Tout à égalité », les deux critères prennent ce même poids.

Tests : 19 réussis. Deux nouveaux tests couvrent les paramètres de maîtrise des nouveaux critères et la migration des sauvegardes, profil par profil. Les comptes passent à 14 axes, 126 cases et 56 boutons de poids.

Navigateur (Chromium, 320, 390, 820, 1 024 et 1 440 pixels) : aucun débordement horizontal de la page, 14 colonnes réparties en 5 groupes, tableau des justifications lisible sans défilement dès 390 pixels. Les deux profils s'activent et placent le Mage et le Chaman en tête. Des sauvegardes à douze critères (PvP d'abord au niveau Débutant, Tout à égalité) se rechargent avec le bon profil sélectionné et le bon niveau. Aucune erreur JavaScript. Correctif au passage : à 320 pixels, la légende de fiabilité dépassait de 13 pixels, déjà avant cette révision ; elle passe désormais à la ligne.
