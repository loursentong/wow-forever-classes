# Les classes de WoW Forever

**Moteur 1.3.0, référence v13 (23 octobre 2026) : chaque classe vaut sa meilleure spé.** Sur chaque critère que portent les spécialisations, la note d'une classe est désormais celle de sa meilleure spécialisation, comme l'annonce le tableau : 27 notes changent (25 montent ; l'Utilité du Chasseur et du Voleur baisse). La Polyvalence, la Technicité et les rôles qu'aucune spé ne tient restent des notes de classe. Seule la note DPS du Druide (3→4, Farouche félin) touche le moteur : aucun top 3 guidé existant ne change, et 5 classements personnalisés sur 115 changent de top 3, chaque fois au profit d'un Druide. Détail et effets dans [la révision éditoriale](REVISION-EDITORIALE-V2.md).

**Tableau des notes par spécialisation (23 octobre 2026) :** dans « Les neuf classes sur quatorze critères », un clic sur la ligne d'une classe (ou son bouton, au clavier) déroule ses spécialisations et leurs notes critère par critère ; un bouton déroule les 28 configurations d'un coup. Ce sont les notes du moteur de recommandation, avec un lien vers la fiche de sources de chaque spé : une spé n'est notée que dans la colonne de son rôle, la Polyvalence reste un critère de classe et la technicité d'une spé donne sa complexité PvE et PvP. Cet affichage ne change aucun calcul ; depuis la référence v13 (ci-dessus), la ligne de la classe reprend la meilleure de ses spés.

**Moteur 1.2.0, référence v12 (23 octobre 2026) : la difficulté suit ton contexte de jeu.** En mode personnalisé, la technicité suit tes activités : un rôle ne compte plus comme du PvE, et si tu mêles PvE et PvP, chacun compte selon sa priorité. La maîtrise ajuste tes styles selon la difficulté PvE ou PvP de tes activités : un débutant qui ne fait que du PvE n'est plus jugé sur la difficulté PvP du Givre. Les spécialisations jouées sans familier ont leur propre grille : Survie 3/5 en PvE, Destruction 2/5 en PvE et 3/5 en PvP. Aucune note de configuration ne change ([décision et effets](REVISION-EDITORIALE-V2.md)).

**Moteur 1.1.0, référence v11 (22 octobre 2026) : référentiel de complexité.** La difficulté PvE et PvP de chaque spécialisation repose désormais sur une grille commune : cinq composantes par contexte, notées de 0 à 2 points (rotation, entretien, ressource, placement et pilotage en PvE ; contrôles, défense, placement, ouverture et pilotage en PvP), dont le total sur 10 donne la note. Chaque composante est justifiée et sourcée dans la base de connaissances et sur [les fiches de sources](fiches-sources/complexite.html) ; les résultats disent ce qui pèse dans chaque difficulté. Cette note sert partout : préférence de difficulté, technicité et effet de la maîtrise. 26 notes changent sur 56 (le Chasseur reste accessible en PvE, Survie mise à part, et devient exigeant en PvP ; Armes passe à 4/5 en PvE, l'ours à 2/5) ; sans préférence de difficulté et à la maîtrise Confirmé, aucun résultat ne bouge ([décision et effets](REVISION-EDITORIALE-V2.md), [codex](CODEX-MOTEUR-LOGIQUE.md) § 1.1).

**Moteur 1.0.9, référence v10 (22 octobre 2026) :** les classements listent les spécialisations : une classe peut revenir, au plus trois fois parmi les cinq pistes détaillées du parcours guidé (suivies d'un lien vers le classement complet), et l'aperçu comme la liste du mode personnalisé affichent dix configurations, puis les autres sur demande ; la technicité du mode personnalisé suit tes critères d'activité (difficulté PvP, PvE ou moyenne). Aucune note ni aucun coefficient ne change ; l'ordre des classes et la première piste de la v9 sont conservés (voir le [codex](CODEX-MOTEUR-LOGIQUE.md), § 2.5 et § 3).

**Cartes cohérentes (22 octobre 2026) :** sur chaque piste, « À garder en tête » nomme le critère qui ouvre le bilan « Pourquoi N sur 100 ? », trié du groupe qui perd le plus de points à celui qui en perd le moins, avec les mêmes chiffres (« … est noté 3/5 en dégâts explosifs : c'est ce qui lui coûte le plus de points (8 sur le gameplay) ») ; « Correspond à tes envies » liste les choix pleinement remplis, avec les mots du questionnaire (« DPS · Solo et farm »), sans celui-là. Le moteur et ses scores ne changent pas. Quand la difficulté retenue est la moyenne du PvE et du PvP, « Complexité » (et « Technicité » en mode personnalisé) se lit en deux blocs, PvE puis PvP.

**Agencement et explications (21 octobre 2026, soir) :** à l'arrivée, deux cartes présentent les parcours et le visiteur choisit ; le questionnaire a, sur grand écran, les étapes et « Mes choix » à gauche, la question au centre et un aperçu repliable du classement des neuf classes à droite ; à la question 6, « Voir mes résultats » remplace « Question suivante » ; « Pourquoi cette piste » et « Pourquoi cette place » lisent chaque choix en trois lignes (la note de la spécialisation nommée, ton choix en mots, le constat) et commencent par le bilan des points qui manquent ; le comparatif historique, dépassé, a été retiré (ses données restent dans `window.__WF`) ; la méthode de maîtrise décrit le modèle du moteur et précède les sources.

**Explications et sources (21 octobre 2026) :** les résultats guidés détaillent chaque réponse et leur principal compromis ; les deux parcours renvoient vers [les fiches de sources par classe](fiches-sources/index.html). Les fiches sont générées depuis `connaissances/` par `node scripts/build-source-pages.cjs`, également appelé lors de la préparation de Pages. Voir [le bilan, l'audit et ses suites](LOT-EXPLICATIONS-SOURCES.md). L’audit reproductible des interactions se lance avec `node scripts/audit-interactions.cjs` depuis un clone possédant le commit de référence `f5bf5f6eaff1265348a40d77be38e884732e310d`.

**Explications des résultats (lot 1, 21 octobre 2026) :** [égalités explicites, spécialisation visible, difficulté PvE/PvP](LOT-1-EXPLICATIONS.md). **Moteurs 1.0.4 à 1.0.8 :** quand tu préfères jouer sans compagnon, Affliction, Destruction et Survie sont comparées avec et sans leur compagnon (sans lui uniquement si tu l'exiges), et Précision est toujours évaluée en Loup solitaire ; ton rapport à la difficulté est comparé à la difficulté PvE ou PvP selon tes activités ; la note raid d'un DPS suit ses dégâts simulés ; avec le rôle Soin, tu peux préciser ta façon de soigner (prévenir les dégâts, soins sur la durée, gros soins ciblés, soigner tout le groupe) pour départager les soigneurs ; les autres rôles ne répondent pas à cette envie ([détail et effets](REVISION-EDITORIALE-V2.md)).

**Révision du moteur du 21 octobre 2026 (moteur 1.0.3, puis 1.0.4).** Trois notes révisées après revue : soin Chaman et Paladin 4→5, contrôle Discipline 4→3. À score égal, une classe est représentée par sa spécialisation au plus haut potentiel compte tenu de la maîtrise. En solo, seul le Chasseur Maîtrise des bêtes, porté par son familier, échappe à l'effet de la maîtrise. Les formules de score, la maîtrise et la refonte graphique sont conservées. Les 28 configurations disposent de repères courts dans les résultats des deux parcours. Voir [le détail et les effets](REVISION-EDITORIALE-V2.md).


> **Référentiel du moteur logique :** [CODEX-MOTEUR-LOGIQUE.md](CODEX-MOTEUR-LOGIQUE.md). Ce document spécifie les entrées, formules, filtres, interprétations, sauvegardes et règles de changement. Les tests de contrat comparent la version actuelle à [la photographie v9](tests/fixtures/moteur-reference-v9.json) couvrant les 28 configurations, leurs variantes sans familier, les profils de soin, les 126 notes historiques, 60 classements par préréglage et maîtrise et trente-quatre scénarios guidés. Les versions [v1](tests/fixtures/moteur-reference-v1.json) à [v8](tests/fixtures/moteur-reference-v8.json) sont conservées intactes.
>
> **Important :** un échec de ces tests peut signaler une évolution intentionnelle ou une régression. Ne jamais régénérer automatiquement la photographie pour rétablir une CI verte. Examiner les écarts, obtenir l'accord sur le nouveau comportement et versionner le référentiel.


## Stabilisation du modèle et UX de la vitrine

**Correction majeure des rôles (21 octobre 2026) :** une classe pouvant exercer le rôle DPS, Tank ou Soin n'obtient plus automatiquement 100/100 sur ce critère. Chaque configuration dispose d'un score de rôle éditorial combinant deux valeurs :
- 55 % : notation du rôle par classe reprise à l'identique du comparatif historique (testée directement contre les données sources de `index.html`).
- 45 % : adéquation éditoriale à l'activité de groupe / raid de la spécialisation, modulée par la maîtrise actuelle.

Cette métrique **n'est pas** une mesure de DPS, HPS, menace ou performance réelle au niveau 60. Elle permet de hiérarchiser raisonnablement les configurations sans attribuer à une classe les avantages simultanés de plusieurs spécialisations. Les préférences Tank/Soin/DPS restent comptées dans **un seul domaine** afin d'éviter la prime structurelle à la polyvalence. Un poids 1 → 3 d'un critère *seul* ne modifie pas le score normalisé ; il modifie son importance **relative** dès qu'un autre critère est actif.

Dans « Mode personnalisé », seuls **huit profils clairs** sont affichés, les quinze anciens restent présents dans les données historiques. « Enregistrer mes critères » sauvegarde explicitement pondérations et maîtrise dans `wf-priority-custom-v1`, sans remplacer les autres sauvegardes ; « Reprendre mes critères » restaure exactement la sélection après exploration. Migration automatique depuis l'ancien « Mes critères » si disponible.

L'interface guidée a, sur grand écran, la navigation en six étapes puis la synthèse éditable « Mes choix » à gauche, la zone de réponses au centre et, à droite, un aperçu du classement des neuf classes, replié par défaut et borné à la hauteur de la question. Sous la question, à la même largeur, un bloc mène aux résultats : il montre la progression vers un premier aperçu, puis le bouton « Prévisualiser mes résultats » (questions 1 à 5), et accueille les résultats à la même place. À la question 6, « Voir mes résultats » remplace « Question suivante ». Sur mobile : étapes, question, résultats, aperçu, puis « Mes choix ». Les animations sont facultatives et respectent `prefers-reduced-motion`. La couche `wow-ui-rework.css` restitue les grandes lignes du visuel fantasy de référence sans figer les contrôles dans une image.

**Régression :** tests unitaires pour 14 axes × 4 maîtrises × 3 forces, 24 000 pondérations aléatoires, indépendance des classes, intégrité des 126 notes historiques, cas guidés, persistence des favoris et tests de navigateur mobile/ordinateur. Ces épreuves ne remplacent pas la vérification du modèle contre des données réelles de joueurs.

Comparatif interactif des neuf classes de World of Warcraft: Forever, projeté au niveau 60 à partir des sources disponibles le 20 octobre 2026.

## Refonte graphique (21 octobre 2026)

La page applique la maquette validée ([design/README.md](design/README.md)) par une dernière feuille de style, `refonte-forever.css`, chargée après les autres :

- décor plein cadre de l'Arbre-monde, avec voiles de lecture et braises fixes ;
- logo officiel toujours accompagné de la mention « Outil de fan · non officiel » ;
- portails dorés pour les deux parcours, cadres héroïques (question, classement) et nobles (étapes, « Mes choix », aperçu) ;
- un bandeau commun aux deux parcours, dont le texte et l'image suivent le parcours choisi (vallée de nuit pour « Être guidé », gantelet pour « Mode personnalisé ») : en changer ne décale pas la page ; Darkspear Islands illustre le tableau des notes ;
- dans le parcours guidé, l'aperçu et les résultats occupent la même place, sous la question et à la même largeur ; les trois pistes s'empilent en pleine largeur, la principale d'abord (évolution du 21 octobre 2026) ;
- chaque piste du parcours guidé explique « Pourquoi cette piste » : la part de chaque critère dans le score (adéquation et points obtenus sur possibles, dont la somme fait le score affiché), sa stabilité quand on retire une réponse hésitante, et ses sources (base de connaissances, présentation officielle) ;
- les blocs déroulants des résultats (« Jouer … », « Pourquoi cette piste ») sont encadrés en or avec un chevron, et prennent la forme d'une pastille dans le classement à neuf classes ; ce classement nomme les égalités (« à égalité avec le Paladin ») et chiffre les écarts serrés (« 0,4 point derrière le Prêtre ») ;
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

Le parcours guidé ne révèle **aucun classement après une seule dimension**. À partir de deux dimensions exprimées, il propose de **prévisualiser les résultats** ; à la question 6, « Voir mes résultats » demande explicitement le classement. L'aperçu compact du classement, à côté du questionnaire, reste replié tant que le joueur ne l'ouvre pas. Une fois révélé, les résultats s'actualisent avec les nouvelles réponses et peuvent être masqués sans effacer les choix.

La sélection du degré de certitude et les changements d'étape bénéficient de transitions courtes, tandis que le résumé « Mes choix » est replié par défaut. Les animations respectent `prefers-reduced-motion`. Le packaging GitHub Pages copie explicitement les fichiers CSS et les visuels et vérifie leurs réponses après déploiement.

## Deux parcours de choix, un même moteur

Le bloc principal propose deux entrées équivalentes :

- **Être guidé** : une question à la fois, progression en six étapes, navigation libre, graduation de certitude 0–5 pour chaque préférence et top 3 expliqué.
- **Mode personnalisé** : les 14 critères pondérables historiques, les 15 profils prédéfinis et le niveau de maîtrise, partagé avec le parcours guidé. Le résultat est désormais un **classement des neuf classes**, calculé sur une configuration concrète par classe par le même moteur de recommandation spécialisé.

Le classement des priorités regroupe les axes en quatre domaines (rôles, activités, gameplay, affinités), afin de ne pas compter séparément la capacité à être tank, soin et DPS comme des qualités universelles. **Polyvalence** et **Technicité** n'interviennent que si leurs axes sont activés. Les notes sources du tableau restent inchangées ; le comparatif historique a été retiré de la page le 21 octobre 2026 (ses données restent dans `window.__WF`). Un profil « Tous les critères » décrit un scénario de référence, pas les préférences d'un joueur particulier.

À l'arrivée, aucun parcours n'est ouvert d'office : le dernier utilisé est signalé sur sa carte. Les préférences existantes, le niveau de maîtrise partagé et la navigation mobile/clavier restent pris en charge.

## Assistant de choix (version exploratoire)

Le nouveau questionnaire est placé avant la matrice des notes et n'affiche **aucun classement tant que le joueur n'a pas exprimé de préférence**. Il comprend six questions facultatives : rôles, activités, portée, style, familiers, maîtrise/complexité. Chaque choix est accompagné d'une certitude de **0 à 5** ; un refus absolu nécessite une case distincte. Les questions laissées sans réponse n'influencent pas les résultats.

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
