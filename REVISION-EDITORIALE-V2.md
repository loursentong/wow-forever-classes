# Révision éditoriale v2 et références v3 à v9 — 21 octobre 2026

Changement de **données et d'explications**, approuvé par le responsable du projet après la revue pratique des 28 configurations : moteur `1.0.1-exploratoire`, référence v2. Il est complété le même jour par la règle d'affichage à score égal (moteur `1.0.2-exploratoire`, référence v3) puis par l'exception solo du Chasseur réservée à Maîtrise des bêtes (moteur `1.0.3-exploratoire`, référence v4), voir plus bas. Base commune : `71f81ec53bc3023e5fd8e8428de1267ff5df2d4a`.

## Décisions appliquées

| Donnée | Avant → après | Motif éditorial et source du kit |
|---|---|---|
| Soin Chaman | 4 → 5 | Soins directs et de groupe, Riptide : point fort majeur. [Blizzard — Chaman](https://news.blizzard.com/en-us/article/24302097/world-of-warcraft-forever-class-deep-dives-mage-and-shaman). |
| Soin Paladin | 4 → 5 | Spécialité majeure, notamment sur une cible, avec protection et soutien. [Blizzard — Paladin](https://news.blizzard.com/en-us/article/24302099/world-of-warcraft-forever-class-deep-dives-paladin). |
| Contrôle Prêtre Discipline | 4 → 3 | La protection et la résistance aux contrôles ne justifient pas un palier supplémentaire de contrôle infligé par rapport à Sacré. [Blizzard — Prêtre](https://news.blizzard.com/en-us/article/24301514/world-of-warcraft-forever-class-deep-dives-priest-and-warrior). |

Ces sources décrivent les kits ; elles ne démontrent pas les notes. Les descriptions et jugements sont ceux de la revue du 21 octobre 2026 et pourront évoluer avec les patchs. Les autres notes sont conservées provisoirement, sans prétendre à une validation exhaustive.

Les deux notes de classe sont synchronisées dans la matrice affichée, `window.__WF` et `ROLE_REFERENCE`. Seules les configurations de soin bénéficient de leur hausse dans le moteur spécialisé. Le comparateur historique, qui décrit la classe entière, reflète aussi les deux changements.

## Repères pour les joueurs

Les 28 configurations reçoivent une courte explication : « Pour toi si… », deux atouts et « À prévoir ». Le même contenu est accessible dans les deux parcours, sous un volet dépliable au clavier. Les dépendances au familier, au placement, à l'équipement ou à l'apprentissage sont précisées lorsqu'elles aident à choisir. Les sources de kit restent les fiches officielles associées à chaque configuration.

`configuration-notes.js` contient le texte ; `configuration-details.js` assure son affichage commun. Ils ne modifient pas le calcul et n'ajoutent aucun réglage. La petite feuille de style propre à ces volets complète les composants existants sans modifier les fichiers graphiques de la refonte.

## Effets vérifiés

Les 99 cas de la photographie v1 ont été rejoués : **60 inchangés, 39 avec un changement de score, de spécialisation ou d'ordre**. Les scores des six classes non concernées restent identiques ; leur place peut varier parce qu'une autre classe remonte ou descend. Les cas vides, filtres stricts et scénarios explorés sont conservés.

| Exemple, maîtrise Confirmé | Avant | Après | Interprétation |
|---|---:|---:|---|
| Priorités : Soin seul, Chaman / Paladin | 86,25 | 100 | Même palier éditorial de soin que Prêtre et Druide. |
| Guide : Soin + raid, certitudes 5, Chaman / Paladin | 94,84 | 100 | Hausse uniquement par la référence de soin. |
| Guide : Soin strict + contrôle, certitudes 5, Prêtre | 88,89 | 77,78 | L'avantage de contrôle de Discipline disparaît. |
| Comparateur historique, tous les critères, Paladin | 76 affiché | 77 affiché | Une note de plus parmi les quatorze. |
| Comparateur historique, tous les critères, Chaman | 73 affiché | 74 affiché | Même effet. |

Le cas guidé « Soigneur soutien BG » change de première piste : Paladin Sacré passe de 95,25 à 98,93 ; le Druide reste à 95,89. Chaman Restauration atteint également 95,89 et entre dans le top 3. Les égalités restent départagées par l'ordre déterministe existant, sans signifier une supériorité en jeu.

Des spécialisations retenues peuvent changer : par exemple Paladin Sacré remplace Protection dans « Tous les critères » à certaines maîtrises, et Prêtre Ombre peut remplacer Discipline quand seul le contrôle compte. Ce sont les conséquences de la sélection de la meilleure configuration, sans cumul des spécialisations. Aucun ajustement n'a cherché à répartir les premières places entre classes.

## Contrôle pratique de la maîtrise

Quatre profils simples ont été comparés en Débutant et en Confirmé, avec des préférences identiques. Dans le guide, une seule réponse est donnée, à certitude 5. Dans les priorités, ce sont les profils de l'interface.

| Profil | Guide : Confirmé → Débutant | Priorités : Confirmé → Débutant |
|---|---|---|
| Solo | Chasseur, Démonologie, Paladin Protection à 100 → Chasseur 100, Paladin Protection 85,5, Démonologie 78,3 | Démonologie 100, Paladin Protection 100, Chasseur Survie 87,5 → Paladin Protection 87,1, Chasseur Maîtrise des bêtes 85,5, Démonologie 79,7 |
| Soin | Chaman, Druide, Paladin, Prêtre (Discipline) à 100 → Chaman, Paladin, Prêtre (Sacré) 95,1, Druide 92,7 | Mêmes classes à 100 → Chaman, Paladin, Prêtre (Sacré) 93,1, Druide 89,7 |
| Tank | Guerrier 100, Druide ours 81,3, Paladin 81,3 → Guerrier 92,7, Paladin 76,4, Druide ours 71,5 | Guerrier 100, Druide ours 80,9, Paladin 80,9 → Guerrier 88,8, Paladin 74,1, Druide ours 67,1 |
| DPS | Chasseur Survie et Guerrier Fureur 100, Démoniste Affliction 81,3 → Fureur 92,7, Survie 90,2, Paladin Vindicte 76,4 | Survie et Fureur 100, Affliction 75 → Fureur 90,2, Survie 87,0, Vindicte 68,5 |

**Conclusion : les coefficients de maîtrise sont conservés.**

- **Pénalité bornée.** En Débutant, une configuration exigeante perd au plus 1,2 point sur 5 par activité ou qualité. L'écart le plus fort est de −29 points de score, pour Farouche en solo.
- **Ordre cohérent.** Les configurations accessibles remontent : Paladin Protection passe devant l'ours, Sacré remplace Discipline. Aucune configuration exigeante n'est exclue ni reléguée derrière des choix nettement moins adaptés.
- **Choix explicites respectés.** Un débutant qui demande un gameplay « Exigeant » garde des pistes exigeantes : Survie, Fureur, Démonologie en DPS. « Accessible » place la Maîtrise des bêtes en tête.
- **Goût et maîtrise distincts.** La Technicité des priorités et la difficulté recherchée dans le guide reposent sur la charge d'exécution brute, sans effet de la maîtrise. L'interface sépare déjà les deux notions.

Deux observations ne relèvent pas de la maîtrise.

- **DPS seul, en Débutant.** Chasseur Survie, configuration de mêlée exigeante, devance de peu la Maîtrise des bêtes : 90,2 contre 89,1. Le volet « Jouer Survie » signale l'exigence, et le choix « Accessible » inverse l'ordre.
- **Égalités dans les priorités.** Entre deux spécialisations de même score d'une même classe, l'arrondi des nombres décidait de celle qui était affichée. Exemple : profil Solo en Confirmé, Chasseur en Survie alors que Maîtrise des bêtes obtient exactement le même score. Réglé par la version 1.0.2 ci-dessous.

## Version 1.0.2 : configuration affichée à score égal

Le responsable du projet a choisi la règle le 21 octobre 2026. Quand plusieurs configurations d'une même classe obtiennent le même score, on affiche celle qui a **le plus haut potentiel compte tenu de la maîtrise**.

- **Potentiel retenu :** celui du codex (§ 3.4), c'est-à-dire l'adéquation PvE éditoriale de la configuration (activité « raid ») après effet de la maîtrise.
- **À potentiel égal :** l'identifiant départage.
- **Portée :** la règle vaut pour les deux parcours. Elle ne change ni les scores ni l'ordre des classes.
- **Avant :** les priorités laissaient un arrondi flottant choisir ; le guide prenait l'ordre alphabétique.

Sur les 99 cas de référence, **41 changent de configuration affichée** : 38 dans les priorités, 3 dans le guide. Cela fait 82 lignes, dont 29 de classes à 0 point. Aucun score ni aucun rang ne bouge.

| Cas | Avant | Après |
|---|---|---|
| Guide, solo seul, Débutant et Confirmé : 1ʳᵉ piste à 100 | Chasseur Maîtrise des bêtes | Chasseur Survie |
| Guide, solo sans familier obligatoire, Confirmé : 2ᵉ à 83 | Chasseur Précision | Chasseur Survie |
| Priorités, Soutien et mobilité : 1ʳᵉ place | Druide Équilibre | Druide Restauration |
| Priorités, DPS en raid, Débutant : 4ᵉ | Démoniste Destruction | Démoniste Affliction |

**Limite relevée, réglée par la version 1.0.3.** Le Chasseur n'était pas pénalisé en solo, quelle que soit sa spécialisation. Survie et Maîtrise des bêtes restaient donc à égalité en solo même en Débutant, et Survie l'emportait par son potentiel PvE : 3,84 contre 3,71 sur 5.

## Version 1.0.3 : exception solo du Chasseur réservée à Maîtrise des bêtes

Le responsable du projet l'a décidé le 21 octobre 2026. Seule Maîtrise des bêtes, où le familier est central, garde l'exception : son activité solo n'est pas réduite par la maîtrise, car le leveling y est porté par le familier.

Précision et Survie, où le familier est facultatif, suivent désormais la règle générale. En Débutant, leur note solo passe de 5 à 4,42 et 3,84 ; en Intermédiaire, à 4,74 et 4,48. Rien ne change en Confirmé et en Expert, ni pour les autres classes.

Sur les 99 cas de référence, **5 changent**, tous en solo, en Débutant ou Intermédiaire, et seul le Chasseur y baisse :

| Cas | Avant | Après |
|---|---|---|
| Mélange DPS 3 + solo 1, Débutant : 1ʳᵉ place | Chasseur Survie 90,05 | Chasseur Maîtrise des bêtes 88,93 |
| Mélange DPS 1 + solo 3, Débutant : 1ʳᵉ place | Chasseur Survie 96,57 | Chasseur Maîtrise des bêtes 96,18 |
| Mélange solo 3 + technicité 2 + BG 1, Débutant | Chasseur Survie 81,86, 1ᵉʳ | Chasseur Précision 72,14, 2ᵉ |
| Tout à égalité, Débutant | Chasseur Précision 43,85, 4ᵉ | Chasseur Précision 42,50, 6ᵉ |
| Tout à égalité, Intermédiaire | Chasseur Survie 48,63, 4ᵉ | Chasseur Survie 47,42, 7ᵉ |

Dans le guide, un débutant ou un intermédiaire qui cherche du solo voit de nouveau le Chasseur Maîtrise des bêtes en première piste, à 100. En Confirmé, les trois spécialisations du Chasseur restent à 100 ; la règle d'égalité retient alors Survie, au plus haut potentiel.

## Version 1.0.4 : variantes sans familier

Le responsable du projet l'a décidé le 21 octobre 2026, après les retours de sa guilde, relus par Astra. Quand le joueur préfère jouer sans compagnon, une configuration à familier facultatif est évaluée avec les notes de son build sans familier. Avant, elle gardait ses notes avec familier, avec une pénalité forfaitaire. Raisons et appuis sont dans la [base de connaissances](connaissances/README.md).

| Configuration | Notes qui changent sans familier | Raison |
|---|---|---|
| Démoniste Affliction | contrôle 5→4, PvP sauvage 5→4, solo 4→3 | ni Séduction ni Verrou magique, et plus de démon pour encaisser |
| Démoniste Destruction | contrôle 4→3, PvP sauvage 5→4, solo 4→3 | idem ; Peur, Voile mortel et le ralentissement de Conflagration restent |
| Chasseur Survie | solo 5→4 | plus de familier pour encaisser en solo |
| Chasseur Précision | aucune | déjà évaluée en « Loup solitaire » |

La variante répond pleinement au souhait de jouer sans compagnon (1 au lieu de 0,78) : le compromis est désormais dans ses notes. Rien ne change sans cette préférence, ni dans « Régler mes priorités ».

Sur les 99 cas de référence, **un seul change** : « solo sans familier obligatoire ».
- Le Chasseur y est représenté par Précision, à égalité avec le Paladin Protection à 89,29 (Survie était à 83).
- Le Démoniste Affliction passe de 70,50 à 64,29.

La référence v5 ajoute quatre scénarios sans familier. Parmi eux, le retour de guilde « contrôle à distance sans familier » : le Mage Givre y passe seul en tête à toutes les maîtrises (en Confirmé, 100 contre 88,89 au Démoniste sans démon).

## Version 1.0.5 : difficulté selon les activités

Le responsable du projet l'a décidé le 21 octobre 2026, après les retours de sa guilde. Pour eux, le Chasseur est « bidon » en PvE mais technique en PvP de haut niveau ; le Mage demande en PvP des feintes d'incantation, des lignes de vue et des temps de Métamorphose. La préférence « prise en main confortable » ou « gameplay à approfondir » compare donc la difficulté PvE de chaque spécialisation si le joueur n'a choisi que des activités PvE. Elle compare la difficulté PvP s'il n'a choisi que du PvP, et la moyenne sinon, comme avant.

Cette préférence pèse 5 % du score : l'effet reste limité.
- Aucun des 103 cas de la v5 ne change. La v6 ajoute quatre scénarios qui combinent difficulté et activités.
- Exemple : un joueur qui cherche un gameplay exigeant en donjons et raids voit Survie passer de 93,75 à 95,83. Il est jugé sur sa rotation en alternance (PvE 4) et non plus sur sa moyenne (3,5).
- Les résultats annoncent quelle difficulté a été comparée. « Régler mes priorités » garde la moyenne pour l'axe Technicité.

## Version 1.0.6 : note raid des DPS alignée sur leurs dégâts

Le responsable du projet l'a décidé le 21 octobre 2026, sur les écarts de la base de connaissances relus par Astra. Pour un DPS, la note « Donjons et raids » mesure ses dégâts simulés seuls ; son utilité de groupe est notée dans « Soutien ». Barèmes, en pourcentage du meilleur DPS simulé au niveau 60 : 5 à partir de 86 %, 4 de 72 à 85 %, 3 de 55 à 71 %, 2 en dessous. Les Chasseurs sont pris dans la rotation évaluée (tir statique pour Maîtrise des bêtes et Précision, alternance pour Survie).

| Configuration | Note | Simulation |
|---|---|---|
| Chaman Élémentaire | raid 3→2 | 49 % |
| Démoniste Destruction | raid 4→3 | 68 % |
| Chaman Amélioration | raid 4→3 | 68 % (ses totems restent notés 4 en Soutien) |
| Voleur Combat | raid 4→3 | 65 % (à revoir si Blizzard renforce le Voleur) |
| Druide Farouche (félin) | zone 3→2 | « Swipe » réservé à l'ours |

Les autres écarts :
- le contrôle du félin et celui du Druide Restauration sont gardés à 3, avec « Pounce » et les outils accessibles par changement de forme ;
- six écarts attendent les données du lancement : les duels du Mage, la zone d'Équilibre, et le solo d'Armes, Givre et Amélioration.

Sur les 107 cas de la v6, **45 changent**, mais **la première classe recommandée ne change dans aucun**. Seule la configuration en tête change une fois : « Tout à égalité » en Confirmé, Druide félin 60,08 → Druide Restauration 59,87.

## Version 1.0.7 : façon de soigner

Le responsable du projet l'a décidé le 21 octobre 2026 (lot 3). Jusqu'ici, rien ne départageait les soigneurs : un joueur qui demandait seulement le rôle Soin voyait les quatre classes de soin à égalité. Quand le rôle Soin est choisi, la question 1 propose désormais une sous-question facultative, « Quelle façon de soigner t'attire ? », avec deux choix au plus et leur certitude.

| Façon de soigner | Sacré (Paladin) | Discipline | Sacré (Prêtre) | Restauration (Chaman) | Restauration (Druide) |
|---|---|---|---|---|---|
| Prévenir les dégâts (boucliers, absorptions) | 1 | 5 | 3 | 1 | 1 |
| Soins sur la durée | 1 | 2 | 2 | 3 | 5 |
| Gros soins ciblés | 5 | 4 | 4 | 4 | 3 |
| Soigner tout le groupe | 3 | 3 | 5 | 5 | 4 |

Ces profils viennent des présentations officielles des classes par Blizzard ; raisons, appuis et confiance sont dans la [base de connaissances](connaissances/README.md). Ils décrivent une façon de jouer, pas une puissance de soin.

La façon de soigner pèse 0,15 et ne juge que les configurations de soin : les autres gardent exactement leur score. Sans le rôle Soin, elle est ignorée. Une façon de soigner hésitante (certitude 2 ou moins) est explorée comme les autres préférences hésitantes. « Régler mes priorités » ne l'utilise pas.

Aucun des 107 cas de la v7 ne change : aucun ne précise de façon de soigner. La v8 ajoute sept scénarios. Pour un joueur qui veut seulement soigner, avec une certitude maximale :
- prévenir les dégâts : Prêtre Discipline 100, les trois autres classes à 62,5 ;
- soins sur la durée : Druide Restauration 100, Chaman 81,25, Prêtre 71,87, Paladin 62,5 ;
- gros soins ciblés : Paladin Sacré 100, Chaman et Prêtre 90,62, Druide 81,25 ;
- soigner tout le groupe : Chaman Restauration et Prêtre Sacré à égalité à 100, Druide 90,62, Paladin 81,25.

Le panneau « Jouer … » de chaque configuration de soin décrit aussi sa façon de soigner, dans les deux parcours.

## Version 1.0.8 : familier et soin (référence v9)

Proposition d'Astra après un audit des interactions (8 172 profils guidés et 2 768 profils personnalisés de contrôle), retenue par le responsable du projet le 21 octobre 2026. Aucune note, aucun coefficient ni aucune priorité ne change.

- **Sans compagnon, souhait souple.** Affliction, Destruction et Survie sont évaluées avec et sans leur compagnon ; le meilleur build complet est retenu, à égalité celui sans compagnon, sans jamais mélanger leurs notes. Avant, le build sans compagnon s'imposait dès « Je préfère éviter », même à 0/5 de certitude. Exemple, Contrôle 5/5, Distance 5/5, sans familier 0/5 : Affliction passe de 80,56 sans démon à 86,39 avec démon, et le résultat l'annonce. Un refus strict garde seulement le build sans compagnon.
- **Précision** est toujours évaluée en Loup solitaire : « J'aime les familiers » ne lui accorde plus 76 % sur ce critère, mais 10 %, comme à tout build sans compagnon. Exemple, Burst, Distance et familier souhaité, tous certains : Précision passe de 94,67 à 80.
- **La façon de soigner compte pour toutes les pistes.** Une configuration qui ne soigne pas reçoit une adéquation nulle à cette envie, atténuée par la certitude, et toutes les pistes ont le même dénominateur. Ajouter « Prévenir les dégâts » ne peut plus faire représenter le Paladin par Protection au lieu de Sacré, comme dans le cas relevé par l'audit. Dans un profil Soin et DPS, les pistes DPS baissent : avec Soin 4/5, DPS 3/5 et Prévention 5/5, le Paladin passe de Vindicte à 71,2 à Sacré à 47,49.

Sur les 27 scénarios guidés de la v8, deux changent de scores ou de configuration, sans changement de première classe ; les priorités et le mode personnalisé sont identiques. Sur les 8 172 profils guidés de contrôle, 729 changent, dont 170 de première classe : 99 par la règle du familier, 243 par celle du soin, 387 par les deux ; l'écart maximal est de 21,98 points. La v9 ajoute sept scénarios.

## Références et reproduction

La fixture v1 et `tests/reference-notes.json` sont conservés. La fixture v2 fige les mêmes entrées, après vérification des trois seuls écarts de notes. La fixture v3 ne diffère de la v2 que par les configurations affichées à score égal. La fixture v4 ne diffère de la v3 que par le Chasseur en solo, en Débutant ou Intermédiaire. La fixture v5 ne diffère de la v4 que par un scénario sans familier ; elle ajoute quatre scénarios. La fixture v6 reprend la v5 à l'identique et ajoute quatre scénarios de difficulté. La fixture v7 ne diffère de la v6 que par les cinq notes décidées. La fixture v8 reprend la v7 à l'identique, y ajoute les profils de soin et sept scénarios de soin. La fixture v9, active, ne diffère de la v8 que par deux scénarios de soin, le build de référence de Précision et sept scénarios d'interactions. Les tests protègent les empreintes des v1 à v8. Les formules de score existantes et les données de maîtrise sont inchangées ; la v8 ajoute un domaine, la façon de soigner.

```text
node --test tests/*.test.cjs
node scripts/compare-editorial-v2.cjs comparaison-v1-v2.json
node scripts/reference-v3.cjs comparaison-v2-v3.json
node scripts/reference-v4.cjs comparaison-v3-v4.json
node scripts/reference-v5.cjs comparaison-v4-v5.json
node scripts/reference-v6.cjs comparaison-v5-v6.json
node scripts/reference-v7.cjs comparaison-v6-v7.json
node scripts/reference-v8.cjs comparaison-v7-v8.json
node scripts/reference-v9.cjs comparaison-v8-v9.json
node scripts/audit-interactions.cjs > audit-interactions.json
bash scripts/prepare-pages.sh
node tests/browser-smoke.cjs
```

Les comparaisons produisent les scores, rangs et spécialisations avant/après avec la cause de chaque écart. Elles ne réécrivent aucune fixture : `scripts/reference-v9.cjs` n'écrit la photographie qu'avec l'option explicite `--fixture`, et jamais sur un fichier existant. Le test navigateur utilise Playwright ; `FRV_CHROMIUM_EXECUTABLE` permet de sélectionner un Chrome/Chromium déjà installé.

Les tests et les 99 cas vérifient la cohérence de l'implémentation, pas la justesse scientifique au niveau 60. Cette étape ne revoit ni les coefficients de maîtrise ni les formules et ne lance pas de nouvel audit exhaustif.
