# Les classes de WoW Forever

**Lot local du 21 octobre 2026 :** [explications des résultats](LOT-1-EXPLICATIONS.md) — égalités explicites, spécialisation visible, difficulté PvE/PvP et limites des variantes sans familier. Aucun changement de scoring ; les évolutions des profils et les préférences de soin sont réservées aux lots suivants.

**Révision du moteur du 21 octobre 2026 — moteur 1.0.3-exploratoire.** Trois notes révisées après revue : soin Chaman et Paladin 4→5, contrôle Discipline 4→3. À score égal, une classe est représentée par sa spécialisation au plus haut potentiel compte tenu de la maîtrise. En solo, seul le Chasseur Maîtrise des bêtes, porté par son familier, échappe à l'effet de la maîtrise. Les formules de score, la maîtrise et la refonte graphique sont conservées. Les 28 configurations disposent de repères courts dans les résultats des deux parcours. Voir [le détail et les effets](REVISION-EDITORIALE-V2.md).


> **Référentiel du moteur logique :** [CODEX-MOTEUR-LOGIQUE.md](CODEX-MOTEUR-LOGIQUE.md). Ce document spécifie les entrées, formules, filtres, interprétations, sauvegardes et règles de changement. Les tests de contrat comparent la version actuelle à [la photographie v4](tests/fixtures/moteur-reference-v4.json) couvrant les 28 configurations, les 126 notes historiques, 60 classements par préréglage et maîtrise et douze scénarios guidés. Les versions [v1](tests/fixtures/moteur-reference-v1.json), [v2](tests/fixtures/moteur-reference-v2.json) et [v3](tests/fixtures/moteur-reference-v3.json) sont conservées intactes.
>
> **Important :** un échec de ces tests peut signaler une évolution intentionnelle ou une régression. Ne jamais régénérer automatiquement la photographie pour rétablir une CI verte. Examiner les écarts, obtenir l'accord sur le nouveau comportement et versionner le référentiel.


## Stabilisation du modèle et UX de la vitrine

**Correction majeure des rôles (21 octobre 2026) :** une classe pouvant exercer le rôle DPS, Tank ou Soin n'obtient plus automatiquement 100/100 sur ce critère. Chaque configuration dispose d'un score de rôle éditorial combinant deux valeurs :
- 55 % : notation du rôle par classe reprise à l'identique du comparatif historique (testée directement contre les données sources de `index.html`).
- 45 % : adéquation éditoriale à l'activité de groupe / raid de la spécialisation, modulée par la maîtrise actuelle.

Cette métrique **n'est pas** une mesure de DPS, HPS, menace ou performance réelle au niveau 60. Elle permet de hiérarchiser raisonnablement les configurations sans attribuer à une classe les avantages simultanés de plusieurs spécialisations. Les préférences Tank/Soin/DPS restent comptées dans **un seul domaine** afin d'éviter la prime structurelle à la polyvalence. Un poids 1 → 3 d'un critère *seul* ne modifie pas le score normalisé ; il modifie son importance **relative** dès qu'un autre critère est actif.

Dans « Régler mes priorités », seuls **huit profils clairs** sont affichés, les quinze anciens restent présents dans les données historiques. « Enregistrer mes critères » sauvegarde explicitement pondérations et maîtrise dans `wf-priority-custom-v1`, sans remplacer les autres sauvegardes ; « Reprendre mes critères » restaure exactement la sélection après exploration. Migration automatique depuis l'ancien « Mes critères » si disponible.

L'interface guidée a une navigation verticale en six étapes, une zone centrale de réponses, et une synthèse éditable à droite sur grand écran. Les animations sont facultatives et respectent `prefers-reduced-motion`. La couche `wow-ui-rework.css` restitue les grandes lignes du visuel fantasy de référence sans figer les contrôles dans une image.

**Régression :** tests unitaires pour 14 axes × 4 maîtrises × 3 forces, 24 000 pondérations aléatoires, indépendance des classes, intégrité des 126 notes historiques, cas guidés, persistence des favoris et tests de navigateur mobile/ordinateur. Ces épreuves ne remplacent pas la vérification du modèle contre des données réelles de joueurs.

Comparatif interactif des neuf classes de World of Warcraft: Forever, projeté au niveau 60 à partir des sources disponibles le 20 octobre 2026.

## Refonte graphique (21 octobre 2026)

La page applique la maquette validée ([design/README.md](design/README.md)) par une dernière feuille de style, `refonte-forever.css`, chargée après les autres :

- décor plein cadre de l'Arbre-monde, avec voiles de lecture et braises fixes ;
- logo officiel toujours accompagné de la mention « Outil de fan · non officiel » ;
- portails dorés pour les deux parcours, cadres héroïques (question, classement) et nobles (étapes, « Mes choix », aperçu) ;
- un bandeau commun aux deux parcours, dont le texte et l'image suivent le parcours choisi (vallée de nuit pour « Être guidé », gantelet pour « Régler mes priorités ») : en changer ne décale pas la page ; Darkspear Islands illustre le tableau des notes ;
- dans le parcours guidé, les résultats révélés s'affichent sous la question, à la même largeur, les trois pistes côte à côte ; fermé, l'aperçu reste sous « Mes choix » ;
- médaillons des neuf classes et couleurs de rareté des objets pour les notes.

Ces visuels viennent du kit de presse officiel et sont publiés avec le site (`assets/img`, provenance et droits dans [assets/README.md](assets/README.md)). Le site n'a plus qu'un thème, sombre : le thème clair et le choix d'apparence ont été retirés le même jour. Aucun calcul, aucune donnée et aucune sauvegarde ne changent ; les icônes de classes et de compétences restent chargées depuis le serveur de Blizzard.

## Pack graphique Warcraft — ressources officielles et crédit

Le site utilise le **logo officiel World of Warcraft: Forever** et des décors du **kit de presse officiel**, hébergés avec le site, ainsi que les **neuf icônes de classes** et plusieurs **icônes de compétences** chargées depuis le CDN officiel `render.worldofwarcraft.com`. Ces ressources restent la propriété de Blizzard Entertainment. Le pack visuel communautaire est volontairement distinct des créations propres à Kami Labs, qui sert de référence d'usage, pas de source à copier.

La couche `warcraft-visual-pack.css` ajoute des dorures, halos et cadres fantasy réactifs au survol, sans modifier les 14 notes de critères, la maîtrise, les résultats ou les sauvegardes. Des liens d'accès rapide permettent d'ouvrir directement les neuf fiches de classes. Les états clavier et `prefers-reduced-motion` sont vérifiés.

**Sources et conditions** :
- [Kit de presse officiel de Forever](https://blizzard.gamespress.com/fr/wowforeverreveal)
- [Logo Forever — actualités Blizzard](https://news.blizzard.com/en-us/article/24301453/everything-announced-at-blizzcon-2026-opening-ceremony)
- [Conditions d'utilisation communautaire / fan site Blizzard](https://www.blizzard.com/en-us/legal/28d5ebbf-c245-4408-8ba9-043dd5f056bf/legal-faq) et [règles d'usage des marques](https://www.blizzard.com/en-us/legal/574308ba-d8db-44e9-bc64-76173f84a57e/blizzard-entertainment-logo-and-trademark-guidelines)

Le site est **non officiel, non affilié** et doit conserver les notices de crédit. Les permissions communautaires comportent des conditions, notamment relatives au caractère non commercial : une mention de non-affiliation ne suffit pas à elle seule à autoriser n'importe quel usage.

## Finition visuelle et ergonomique

La vitrine réutilise la palette Claude, avec une illustration SVG originale légère dans le bandeau et des icônes vectorielles pour les deux parcours. La finition est regroupée dans `ux-polish.css` (aucune bibliothèque graphique externe), pour permettre des ajustements indépendants du moteur.

Le parcours guidé ne révèle **aucun classement après une seule dimension**. À partir de deux dimensions exprimées, il propose un **aperçu facultatif** ; le bouton final « Voir mes résultats » demande explicitement le classement. Une fois révélé, les résultats s'actualisent avec les nouvelles réponses et peuvent être masqués sans effacer les choix.

La sélection du degré de certitude et les changements d'étape bénéficient de transitions courtes, tandis que le résumé « Mes choix » est replié par défaut. Les animations respectent `prefers-reduced-motion`. Le packaging GitHub Pages copie explicitement les fichiers CSS et les visuels et vérifie leurs réponses après déploiement.

## Deux parcours de choix, un même moteur

Le bloc principal propose deux entrées équivalentes :

- **Être guidé** : une question à la fois, progression en six étapes, navigation libre, graduation de certitude 0–5 pour chaque préférence et top 3 expliqué.
- **Régler mes priorités** : les 14 critères pondérables historiques, les 15 profils prédéfinis et le niveau de maîtrise partagés avec le comparatif. Le résultat est désormais un **classement des neuf classes**, calculé sur une configuration concrète par classe par le même moteur de recommandation spécialisé.

Le classement des priorités regroupe les axes en quatre domaines (rôles, activités, gameplay, affinités), afin de ne pas compter séparément la capacité à être tank, soin et DPS comme des qualités universelles. **Polyvalence** et **Technicité** n'interviennent que si leurs axes sont activés. Les notes sources du tableau et les scores historiques restent inchangés dans les réglages avancés. Un profil « Tous les critères » décrit un scénario de référence, pas les préférences d'un joueur particulier.

Le choix du parcours est conservé localement. Les préférences existantes, le niveau de maîtrise partagé et la navigation mobile/clavier restent pris en charge.

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
- Un seul thème, sombre, celui de la refonte. L'ancien choix clair, sombre ou système a été retiré le 21 octobre 2026 ; une préférence encore enregistrée est ignorée.
- Préférences enregistrées sur l'appareil du visiteur, page sans dépendances de compilation.

**L'indice sur 100 n'est pas une probabilité.** Les adaptations de maîtrise sont des hypothèses documentées et non des données de joueurs niveau 60.

## Documentation

- [Base de connaissances : sources, faits de kit et justification des notes](connaissances/README.md), avec [les écarts à arbitrer](connaissances/ecarts-a-arbitrer.md)
- [Audit documentaire](AUDIT-2026-10-20.md)
- [Modèle de maîtrise et validation](MODELE-MAITRISE.md)
- [Refonte graphique : maquette validée et règles d'intégration](design/README.md)
- [Visuels sources : provenance, droits et inventaire](assets/README.md)

## Tests

Commande : node --test tests/*.test.cjs

Une GitHub Action vérifie chaque pull request. La suite protège les 126 notes (les 108 de `main` au commit `74a0e6f` et les 18 notes Burst et Dégâts de zone du 20 octobre), les scores de « Tout à égalité », les quinze profils et leur homogénéité, la maîtrise, les courbes, les préférences, « Mes critères », la remise à 0 et la migration des anciennes sauvegardes. Elle accepte les fins de ligne Windows et Unix.

L'inspection visuelle reste nécessaire avant publication ; le détail des contrôles de cette révision est dans [VERIFICATION-INTERFACE.md](VERIFICATION-INTERFACE.md).
