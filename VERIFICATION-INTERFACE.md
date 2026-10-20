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
