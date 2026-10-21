# Lot 1 — Comprendre les résultats

21 octobre 2026. Version locale, à la suite de la validation de l'analyse de reprise. Lot limité aux explications et à la présentation pour préserver la marge d'utilisation restante. Moteur conservé en `1.0.3-exploratoire`.

## Réalisé

- Les scores exactement égaux partagent un rang dans les priorités. Toutes les classes en tête reçoivent la même mise en avant, au lieu de privilégier la première dans l'ordre de départage.
- Le guide affiche « Piste à égalité » sans carte gagnante arbitraire. Le texte cite toutes les classes en tête, y compris si elles dépassent les trois cartes proposées.
- La spécialisation retenue est mise en évidence. Une explication précise qu'elle répond à l'ensemble des préférences et peut changer quand elles évoluent.
- Les fiches donnent séparément les repères de difficulté PvE et PvP de la spécialisation. Contrôle et Technicité sont définis plus clairement ; l'apprentissage et l'optimisation sont distingués.
- Lorsqu'un joueur préfère éviter les familiers, les pistes concernées indiquent visiblement que leurs variantes sans compagnon ne sont pas encore évaluées séparément. Pour le Démoniste, la perte des contrôles du démon est explicitée.
- Les fiches Chasseur rendent visible la distinction entre rotation statique et alternance tirs/mêlée, sans prétendre que leurs scores ont été réconciliés.
- Une demande de soin indique que les styles de soin ne sont pas encore départagés par le questionnaire ; les fiches existantes restent disponibles.

## Portée et limites

Ce lot corrige la présentation trompeuse des égalités et clarifie les résultats. **Il ne corrige pas encore la modélisation des variantes avec/sans familier ni des rotations du Chasseur.** (Les variantes sans familier sont traitées depuis le moteur 1.0.4.) Aucun nouveau chiffre n'a été introduit pour masquer cette incertitude.

La structure des sauvegardes, les poids, les notes, les formules et les quatre photographies de référence sont conservés. Le nouveau module `result-explanations.js` lit les résultats sans les trier ou les modifier. Une égalité correspond au même score au centième dans le moteur ; deux nombres identiques après arrondi à l'entier peuvent seulement être proches.

La mise en avant conserve les styles existants de Claude ; leurs sélecteurs reposent désormais sur les classes réellement en tête. Aucun nouvel habillage graphique.

## Vérification

- 105 tests unitaires et de contrat : données, classement, sauvegardes, échappement des textes, égalités exactes et arrondis proches.
- Scénarios Chrome : deux parcours, restauration des préférences, clavier, tailles 320 à 1440 px, contrôle Mage/Démoniste, préférence sans familier et quatre soigneurs à égalité.
- Captures dans `tests/screenshots/lot1-*`. Vérification manuelle des résultats sur ordinateur et de la carte Démoniste sur mobile.
- Condition de livraison : aucun changement dans `recommendation-engine.js`, `tests/fixtures/` ou `tests/reference-notes.json` ; aucune modification des 126 notes intégrées à `index.html`.

## Lots suivants

1. **Profils cohérents et scoring** : fixer les configurations avec/sans compagnon, les talents et rotations retenus ; documenter chaque changement de comportement, comparer à la référence et créer une nouvelle version si nécessaire. Ne pas appliquer automatiquement les 12 propositions de Claude.
2. **Préférences de soin** : définir quelques choix facultatifs utiles et les relier aux styles des cinq configurations, sans transformer une identité de jeu en classement de puissance.

Aucun push, aucune PR et aucune publication pour ce lot. Les corrections documentaires de la reprise de Claude restent présentes dans la branche locale.
