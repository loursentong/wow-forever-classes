# Base de connaissances

Elle relie chaque note du moteur à des **faits sourcés**, avec une **raison** et un **niveau de confiance**. Elle rend les notes traçables, pas « vraies » : ce restent des évaluations éditoriales de 1 à 5 (voir le [codex](../CODEX-MOTEUR-LOGIQUE.md), §1 et §8).

**Étape 1, 21 octobre 2026 (moteur `1.0.3-exploratoire`) :** registre de 34 sources, 202 faits de kit pour les 28 configurations, justification des 336 notes, complétés par une passe de recherche ciblée sur les angles les plus fragiles (soigneurs, PvP et champs de bataille, solo, difficulté, tanks). **Aucune valeur du moteur n’a changé** ; les notes que les faits contredisent sont listées dans [les écarts à arbitrer](ecarts-a-arbitrer.md).

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

## Limites connues (21 octobre 2026)

- La bêta est plafonnée au niveau 30 (20 jusqu’au 1er octobre) et aucun raid n’y est testé : les notes de raid et de PvP au niveau 60 reposent sur des simulations, le kit et des avis, jamais sur des mesures en jeu.
- Aucune simulation de soin n’existe : le simulateur communautaire ne modélise pas les sorts de soin. Les cinq soigneurs restent à 5 en raid, par convention.
- Le seul champ de bataille jouable (Darkspear Islands : 15 contre 15, quatre points et un drapeau) n’a fait l’objet d’aucun retour par classe.
- La difficulté d’exécution n’est mesurée qu’indirectement, par la taille des rotations simulées, qui comptent les optimisations d’un jeu parfait.
- Beaucoup de tier lists de sites commerciaux se recopient entre elles : elles ne sont pas retenues.

Après le lancement du 4 novembre, journaux de combat, statistiques de champs de bataille et retours au niveau 60 permettront de mesurer. Les notes en confiance faible sont à relire en premier.

## Mettre à jour

- **Nouveau fait** : l’ajouter au fichier de sa classe avec ses sources ; ajouter la source au registre si besoin.
- **Changer une note** : c’est un changement du moteur. Il suit le protocole du codex (§7) : décision, nouvelle photographie de référence, puis mise à jour de la valeur, de la raison et de la version ici. L’écart correspondant reçoit sa décision (`{choix, date, valeur}`).
- **À chaque patch** : revoir les faits de performance et les sources datées, et noter ce qui a changé.

La version du moteur est inscrite dans chaque fichier : toute nouvelle version du moteur oblige à relire la base.
