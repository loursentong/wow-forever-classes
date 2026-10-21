# Révision éditoriale v2 et références v3 à v5 — 21 octobre 2026

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

## Références et reproduction

La fixture v1 et `tests/reference-notes.json` sont conservés. La fixture v2 fige les mêmes entrées, après vérification des trois seuls écarts de notes. La fixture v3 ne diffère de la v2 que par les configurations affichées à score égal. La fixture v4 ne diffère de la v3 que par le Chasseur en solo, en Débutant ou Intermédiaire. La fixture v5, active, ne diffère de la v4 que par un scénario sans familier ; elle ajoute quatre scénarios. Les tests protègent les empreintes des v1 à v4. Le code des formules de score et les données de maîtrise sont inchangés.

```text
node --test tests/*.test.cjs
node scripts/compare-editorial-v2.cjs comparaison-v1-v2.json
node scripts/reference-v3.cjs comparaison-v2-v3.json
node scripts/reference-v4.cjs comparaison-v3-v4.json
node scripts/reference-v5.cjs comparaison-v4-v5.json
bash scripts/prepare-pages.sh
node tests/browser-smoke.cjs
```

Les comparaisons produisent les scores, rangs et spécialisations avant/après avec la cause de chaque écart. Elles ne réécrivent aucune fixture : `scripts/reference-v5.cjs` n'écrit la photographie qu'avec l'option explicite `--fixture`. Le test navigateur utilise Playwright ; `FRV_CHROMIUM_EXECUTABLE` permet de sélectionner un Chrome/Chromium déjà installé.

Les tests et les 99 cas vérifient la cohérence de l'implémentation, pas la justesse scientifique au niveau 60. Cette étape ne revoit ni les coefficients de maîtrise ni les formules et ne lance pas de nouvel audit exhaustif.
