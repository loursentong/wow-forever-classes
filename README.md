# Les classes de WoW Forever

Comparatif interactif des neuf classes de World of Warcraft: Forever, projeté au niveau 60 à partir des sources disponibles le 20 octobre 2026.

## Finition visuelle et ergonomique

La vitrine réutilise la palette Claude, avec une illustration SVG originale légère dans le bandeau et des icônes vectorielles pour les deux parcours. La finition est regroupée dans `ux-polish.css` (aucune bibliothèque graphique externe), pour permettre des ajustements indépendants du moteur.

Le parcours guidé ne révèle **aucun classement après une seule dimension**. À partir de deux dimensions exprimées, il propose un **aperçu facultatif** ; le bouton final « Voir mes résultats » demande explicitement le classement. Une fois révélé, les résultats s'actualisent avec les nouvelles réponses et peuvent être masqués sans effacer les choix.

La sélection du degré de certitude et les changements d'étape bénéficient de transitions courtes, tandis que le résumé « Mes choix » est replié par défaut. Les animations respectent `prefers-reduced-motion`. Le packaging GitHub Pages copie explicitement les fichiers CSS et les visuels et vérifie leurs réponses après déploiement.

## Deux parcours de choix, un même moteur

Le bloc principal propose deux entrées équivalentes :

- **Être guidé** : une question à la fois, progression en six étapes, navigation libre, graduation de certitude 0–5 pour chaque préférence et top 3 expliqué.
- **Régler mes priorités** : les 14 critères pondérables historiques, les 15 profils prédéfinis et le niveau de maîtrise partagés avec le comparatif. Le résultat est désormais un **classement des neuf classes**, calculé sur une configuration concrète par classe par le même moteur de recommandation spécialisé.

Le classement des priorités regroupe les axes en quatre domaines (rôles, activités, gameplay, affinités), afin de ne pas compter séparément la capacité à être tank, soin et DPS comme des qualités universelles. **Polyvalence** et **Technicité** n'interviennent que si leurs axes sont activés. Les notes sources du tableau et les scores historiques restent inchangés dans les réglages avancés. Un profil « Tous les critères » décrit un scénario de référence, pas les préférences d'un joueur particulier.

Le choix du parcours est conservé localement. Le thème Claude, les préférences existantes, le niveau de maîtrise partagé et la navigation mobile/clavier restent pris en charge.

## Assistant de choix (version exploratoire)

Le nouveau questionnaire est placé avant le tableau historique et n'affiche **aucun classement tant que le joueur n'a pas exprimé de préférence**. Il comprend six questions facultatives : rôles, activités, portée, style, familiers, maîtrise/complexité. Chaque choix est accompagné d'une certitude de **0 à 5** ; un refus absolu nécessite une case distincte. Les questions laissées sans réponse n'influencent pas les résultats.

Le moteur autonome compare **27 spécialisations et 1 configuration Farouche (ours)**, puis propose au plus trois classes différentes et une configuration précise pour chacune. Il affiche les compromis, les fiches officielles et des scénarios de réponses hésitantes. Ses notes de style et d'activité restent **des hypothèses éditoriales à confronter à la réalité du niveau 60**.

Consulter [la méthodologie et ses limites](RECOMMANDATION-METHODE.md). Les quatorze critères historiques, leurs quinze préréglages et les courbes existantes sont conservés comme outils avancés.

## Fonctionnalités

- Neuf classes, quatorze critères notés avec leurs sources et leur fiabilité. Burst et Dégâts de zone, ajoutés le 20 octobre, sont justifiés classe par classe sous le tableau.
- Pondération personnalisable de 0 à 3 par critère, avec quinze profils : Tout à égalité (valeur par défaut), Polyvalence, PvE d'abord, PvP d'abord, Tank en groupe, Soin en groupe, DPS en raid, Dégâts de zone, Soutien et mobilité, Champ de bataille, Soin en champ de bataille, PvP sauvage, Burst et mobilité, Contrôle et Solo et leveling. Chaque profil porte le nom de son critère dominant (au moins la moitié des poids), sans Technicité ni Polyvalence ajoutées, et chaque classe mène ou partage la tête d'au moins un profil.
- « Mes critères » : la dernière pondération personnelle est gardée automatiquement et se réaffiche en un clic après avoir essayé les profils. « Tout remettre à 0 » permet de repartir d'une pondération vierge.
- Maîtrise dans le même panneau que les pondérations : Débutant, Intermédiaire, Confirmé, Expert. Ce réglage adapte le classement et les courbes sans ajouter d'axe pondéré ; les 126 notes du tableau d'ensemble restent fixes.
- Plancher et plafond distincts en PvE et PvP, avec des raisons succinctes et des références bibliographiques. Confirmé conserve les scores de référence.
- Courbes pour les neuf classes avec mise en avant au choix et tableau de chiffres repliable.
- Palette Claude sombre par défaut ; choix clair, sombre ou système enregistré sur l'appareil.
- Préférences enregistrées sur l'appareil du visiteur, page sans dépendances de compilation.

**L'indice sur 100 n'est pas une probabilité.** Les adaptations de maîtrise sont des hypothèses documentées et non des données de joueurs niveau 60.

## Documentation

- [Audit documentaire](AUDIT-2026-10-20.md)
- [Modèle de maîtrise et validation](MODELE-MAITRISE.md)

## Tests

Commande : node --test tests/*.test.cjs

Une GitHub Action vérifie chaque pull request. La suite protège les 126 notes (les 108 de `main` au commit `74a0e6f` et les 18 notes Burst et Dégâts de zone du 20 octobre), les scores de « Tout à égalité », les quinze profils et leur homogénéité, la maîtrise, les courbes, les préférences, « Mes critères », la remise à 0 et la migration des anciennes sauvegardes. Elle accepte les fins de ligne Windows et Unix.

L'inspection visuelle reste nécessaire avant publication ; le détail des contrôles de cette révision est dans [VERIFICATION-INTERFACE.md](VERIFICATION-INTERFACE.md).
