# Révision éditoriale v2 — 21 octobre 2026

Changement de **données et d'explications**, approuvé par le responsable du projet après la revue pratique des 28 configurations. Version locale `1.0.1-exploratoire`, basée sur `71f81ec53bc3023e5fd8e8428de1267ff5df2d4a`. Aucune publication GitHub.

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
| Solo | Chasseur Maîtrise des bêtes, Démonologie, Paladin Protection à 100 → Maîtrise des bêtes 100, Paladin Protection 85,5, Démonologie 78,3 | Démonologie 100, Paladin Protection 100, Chasseur Survie 87,5 → Paladin Protection 87,1, Chasseur Maîtrise des bêtes 85,5, Démonologie 79,7 |
| Soin | Chaman, Druide, Paladin, Prêtre (Discipline) à 100 → Chaman, Paladin, Prêtre (Sacré) 95,1, Druide 92,7 | Mêmes classes à 100 → Chaman, Paladin, Prêtre (Sacré) 93,1, Druide 89,7 |
| Tank | Guerrier 100, Druide ours 81,3, Paladin 81,3 → Guerrier 92,7, Paladin 76,4, Druide ours 71,5 | Guerrier 100, Druide ours 80,9, Paladin 80,9 → Guerrier 88,8, Paladin 74,1, Druide ours 67,1 |
| DPS | Chasseur Survie et Guerrier Fureur 100, Démoniste Affliction 81,3 → Fureur 92,7, Survie 90,2, Paladin Vindicte 76,4 | Survie et Fureur 100, Affliction 75 → Fureur 90,2, Survie 87,0, Vindicte 68,5 |

**Conclusion : les coefficients de maîtrise sont conservés.**

- **Pénalité bornée.** En Débutant, une configuration exigeante perd au plus 1,2 point sur 5 par activité ou qualité. L'écart le plus fort est de −29 points de score, pour Farouche en solo.
- **Ordre cohérent.** Les configurations accessibles remontent : Paladin Protection passe devant l'ours, Sacré remplace Discipline. Aucune configuration exigeante n'est exclue ni reléguée derrière des choix nettement moins adaptés.
- **Choix explicites respectés.** Un débutant qui demande un gameplay « Exigeant » garde des pistes exigeantes : Survie, Fureur, Démonologie en DPS. « Accessible » place la Maîtrise des bêtes en tête.
- **Goût et maîtrise distincts.** La Technicité des priorités et la difficulté recherchée dans le guide reposent sur la charge d'exécution brute, sans effet de la maîtrise. L'interface sépare déjà les deux notions.

Deux observations ne relèvent pas de la maîtrise. Ce lot ne les modifie pas.

- **DPS seul, en Débutant.** Chasseur Survie, configuration de mêlée exigeante, devance de peu la Maîtrise des bêtes : 90,2 contre 89,1. Le volet « Jouer Survie » signale l'exigence, et le choix « Accessible » inverse l'ordre.
- **Égalités dans les priorités.** Entre deux spécialisations de même score d'une même classe, l'arrondi des nombres décide de celle qui est affichée.
  - Exemple : profil Solo en Confirmé. Le Chasseur apparaît en Survie, alors que Maîtrise des bêtes obtient exactement le même score.
  - Une règle explicite changerait la spécialisation affichée dans 33 à 39 des 87 cas de priorités de la référence, sans changer de score. Par exemple : à égalité, la configuration la plus accessible.
  - Cette règle demande une décision et une nouvelle version de référence.

## Références et reproduction

La fixture v1 et `tests/reference-notes.json` sont conservés. La nouvelle fixture v2 fige les mêmes entrées, après vérification des trois seuls écarts de notes. Les tests protègent aussi l'empreinte de la v1. Le code des formules et les données de maîtrise sont inchangés.

```text
node --test tests/*.test.cjs
node scripts/compare-editorial-v2.cjs comparaison-v1-v2.json
bash scripts/prepare-pages.sh
node tests/browser-smoke.cjs
```

La comparaison produit les scores, rangs et spécialisations avant/après avec la cause de chaque écart. Elle ne réécrit aucune fixture. Le test navigateur utilise Playwright ; `FRV_CHROMIUM_EXECUTABLE` permet de sélectionner un Chrome/Chromium déjà installé.

Les tests et les 99 cas vérifient la cohérence de l'implémentation, pas la justesse scientifique au niveau 60. Cette étape ne revoit ni les coefficients de maîtrise ni les formules et ne lance pas de nouvel audit exhaustif.
