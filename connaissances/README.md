# Base de connaissances

Elle relie chaque note du moteur à des **faits sourcés**, avec une **raison** et un **niveau de confiance**. Elle rend les notes traçables, pas « vraies » : ce restent des évaluations éditoriales de 1 à 5 (voir le [codex](../CODEX-MOTEUR-LOGIQUE.md), §1 et §8).

**Étape 1, 21 octobre 2026 (moteur `1.0.3-exploratoire`) :** registre des sources, faits de kit des 28 configurations, justification des 336 notes. **Aucune valeur du moteur n’a changé** ; les notes que les faits contredisent sont listées dans [les écarts à arbitrer](ecarts-a-arbitrer.md).

## Contenu

| Fichier | Rôle |
|---|---|
| `sources.json` | Registre : type, fiabilité, portée, date, statut (utilisée, repérée, écartée) de chaque source. |
| `classes/<classe>.json` | Faits de kit (catégorie, texte, sources, configurations concernées ; critères contredits pour une limite), puis, pour chaque configuration, son profil et ses 12 notes `{valeur, raison, appuis, confiance}`. |
| `ecarts.json` | Notes contredites par les faits, avec une proposition et une décision à prendre ; notes à surveiller. |
| `ecarts-a-arbitrer.md` | La même chose, à lire. |

Les 12 critères reprennent les clés du moteur : `raid`, `bg`, `world`, `solo` (activités), `burst`, `zone`, `ctrl`, `surv`, `mob`, `support` (styles), `charge_pve`, `charge_pvp` (difficulté d’exécution).

## Échelles

**Fiabilité d’une source**
- **haute** : donnée officielle de Blizzard ou lue dans le client ;
- **moyenne** : simulation, guide ou avis argumenté d’un auteur identifié ;
- **faible** : extrapolation (niveau 30, autre version du jeu), popularité ou intention non vérifiée.

**Confiance d’une note**
- **haute** : un fait officiel net, ou des sources indépendantes qui convergent ;
- **moyenne** : une seule simulation, un seul guide ou un seul avis, ou un kit sans mesure d’intensité ;
- **faible** : extrapolation, intention seule, sources contradictoires ou aucune source propre à Forever.

Une copie (une tier list qui reprend une simulation, par exemple) ne compte pas comme une source indépendante : elle est enregistrée comme « écartée ».

## Règles vérifiées

`tests/base-connaissances.test.cjs` vérifie que :
- la base couvre exactement les configurations du moteur, avec les mêmes valeurs, le même profil et la même version ;
- chaque note a une raison, au moins un appui, et que chaque appui concerne bien sa configuration ;
- une note de style à 4 ou plus s’appuie sur un fait de son domaine (un contrôle pour `ctrl`, une défense pour `surv`…) et cite toute limite de sa classe qui pèse contre ce critère, sauf si elle figure dans un écart ouvert ;
- une source « utilisée » est citée par au moins un fait, et réciproquement ;
- un écart ouvert porte la valeur actuelle du moteur et une note en confiance faible ; un écart tranché porte sa décision, appliquée au moteur.

## Mettre à jour

- **Nouveau fait** : l’ajouter au fichier de sa classe avec ses sources ; ajouter la source au registre si besoin.
- **Changer une note** : c’est un changement du moteur. Il suit le protocole du codex (§7) : décision, nouvelle photographie de référence, puis mise à jour de la valeur, de la raison et de la version ici. L’écart correspondant reçoit sa décision (`{choix, date, valeur}`).
- **À chaque patch** : revoir les faits de performance et les sources datées, et noter ce qui a changé.

La version du moteur est inscrite dans chaque fichier : toute nouvelle version du moteur oblige à relire la base.
