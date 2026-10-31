> **Revue actuelle : 31 octobre 2026, moteur 1.6.0-exploratoire.** Les neuf classes, leurs variantes, les profils de soin et les justifications ont été relus face aux changements disponibles. Huit repères DPS, le burst félin et trois composantes de complexité évoluent ; toutes les autres valeurs sont conservées. [Décisions et sources](../REVISION-DONNEES-2026-10-31.md), [photographie chiffrée](revisions/2026-10-31.json). Les anciennes dates et statistiques ci-dessous décrivent leurs étapes historiques ; elles ne prétendent pas valider le hotfix courant.

# Base de connaissances

Elle relie chaque note du moteur à des **faits sourcés**, avec une **raison** et un **niveau de confiance**. Elle rend les notes traçables, pas « vraies » : ce restent des évaluations éditoriales de 1 à 5 (voir le [codex](../CODEX-MOTEUR-LOGIQUE.md), §1 et §8).

**Étape 1, 21 octobre 2026 (moteur `1.0.3-exploratoire`) :** registre de 34 sources, 202 faits de kit pour les 28 configurations, justification des 336 notes, complétés par une passe de recherche ciblée sur les angles les plus fragiles (soigneurs, PvP et champs de bataille, solo, difficulté, tanks). **Aucune valeur du moteur n’a changé** ; les propositions de réévaluation sont listées dans [les écarts à arbitrer](ecarts-a-arbitrer.md). Une proposition n'établit pas à elle seule que la note actuelle est fausse.

**Lot 3, 21 octobre 2026 (moteur `1.0.7-exploratoire`) :** 8 faits de soin, tirés des présentations officielles des classes (211 faits au total), et le profil de soin des cinq configurations de soin, utilisé par le moteur depuis la v8.

**Référentiel de complexité, 22 octobre 2026 (moteur `1.1.0-exploratoire`, référence v11) :** une grille commune pour la difficulté PvE et PvP (`referentiel-complexite.json`), et pour chaque configuration la `complexite` détaillée, composante par composante. 2 sources (guides de la bêta d'Icy Veins et de wowtbc.gg), 29 faits ajoutés ou mis à jour (catégorie `complexite` : rotations simulées mesurées de la même façon, guides, sorts et talents lus dans le client). Les notes `charge_pve` et `charge_pvp` sont désormais celles de la grille ; les deux points à surveiller sur la difficulté PvE d'Armes et du Voleur sont tranchés.

## Contenu

| Fichier | Rôle |
|---|---|
| `sources.json` | Registre : type, fiabilité, portée, date, statut (utilisée, repérée, écartée) de chaque source. |
| `classes/<classe>.json` | Faits de kit (catégorie, texte, sources, configurations concernées ; critères contredits pour une limite), puis, pour chaque configuration, son profil et ses 12 notes `{valeur, raison, appuis, confiance}`. Une configuration à familier facultatif porte aussi sa `variante_sans_familier` : les seules notes qui changent sans compagnon, utilisées par le moteur depuis la v5. Une configuration de soin porte son `profil_soin` : quatre notes `{valeur, raison, appuis, confiance}` sur les façons de soigner, utilisées par le moteur depuis la v8. `variante_reference` désigne un build de référence sans compagnon : Précision est toujours évaluée en Loup solitaire depuis la v9. Depuis la v11, chaque configuration porte sa `complexite` : pour `pve` et `pvp`, la `note`, le `total` sur 10, les cinq `composantes` `{points, raison}` dans l'ordre de la grille, la `confiance`, les `appuis`, et selon le cas un `approfondissement` (technique hors note) ou une `variante` (Survie en mêlée seule). |
| `referentiel-complexite.json` | Le référentiel de complexité (v11) : définition, jeu évalué, les cinq composantes de chaque contexte avec leurs trois niveaux, le barème du total à la note, la méthode de mesure des rotations, les limites et les sources principales. Publié sur la fiche « Comment nous mesurons la complexité ». |
| `ecarts.json` | Propositions de réévaluation, avec leurs arguments et une décision à prendre ; notes à surveiller. |
| `ecarts-a-arbitrer.md` | La même chose, à lire, régénérée par `node scripts/synthese-ecarts.cjs`. Un écart tranché porte sa décision ; un écart ouvert, ce qu’il attend. |
| `../fiches-sources/` | Les mêmes données, lisibles par classe : notes, raisons, confiance, faits, variantes et sources datées. Pages générées par `node scripts/build-source-pages.cjs` (aussi lors de la préparation de Pages), liées depuis les résultats des deux parcours. |

Les 12 critères reprennent les clés du moteur : `raid`, `bg`, `world`, `solo` (activités), `burst`, `zone`, `ctrl`, `surv`, `mob`, `support` (styles), `charge_pve`, `charge_pvp` (difficulté d’exécution, note de la grille de complexité depuis la v11).

## Définitions des critères

- **Donjons et raids, pour un DPS** : ses dégâts simulés seuls, en pourcentage du meilleur DPS simulé au niveau 60 (5 à partir de 86 %, 4 de 72 à 85 %, 3 de 55 à 71 %, 2 en dessous), dans la rotation évaluée. L’utilité de groupe est notée dans « Soutien ». Les soigneurs et les tanks gardent leur convention.
- **Façon de soigner** (configurations de soin seulement) : `prevention` (prévenir les dégâts : boucliers et absorptions), `duree` (soins sur la durée), `cible` (gros soins ciblés), `groupe` (soigner tout le groupe). La note dit ce que la présentation officielle met en avant, pas une puissance de soin : 5 pour la signature de la spécialisation, 1 pour un outil absent ou non décrit.
- **Difficulté d'exécution (v11)** : ce qu'une spécialisation demande pour être bien jouée dans un contexte, ni sa puissance ni son confort en leveling. Cinq composantes notées 0, 1 ou 2 : rotation, entretien, ressource, placement et pilotage en PvE ; contrôles, défense, placement, ouverture et pilotage en PvP. Total sur 10 : 0–2 → 1, 3–4 → 2, 5–6 → 3, 7–8 → 4, 9–10 → 5. Le jeu évalué est celui des guides ; une technique avancée ne compte que si les autres notes en dépendent (au moins 10 % de dégâts en simulation). Une rotation simulée se mesure en sorts que la liste peut lancer et en conditions élémentaires (effet actif, temps restant, ressource, recharge, minuteur d'attaque).
- **Contrôle** : neutraliser, interrompre, ralentir ou immobiliser, avec les seuls outils du build évalué. Un outil accessible par changement de forme ou par un familier compte avec sa contrainte ; des outils de familiers différents ne sont jamais disponibles ensemble.

## Échelles

**Fiabilité d’une source**
- **haute** : donnée officielle de Blizzard ou lue dans le client ;
- **moyenne** : simulation, guide ou avis argumenté d’un auteur identifié ;
- **faible** : extrapolation (niveau 30, autre version du jeu), popularité ou intention non vérifiée.

**Confiance d’une note**
- **haute** : un fait officiel net, ou des sources indépendantes qui convergent ;
- **moyenne** : une seule simulation, un seul guide ou un seul avis, ou un kit sans mesure d’intensité ;
- **faible** : extrapolation, intention seule, sources contradictoires ou aucune source propre à Forever.

La confiance porte sur l'argument éditorial, pas sur la précision du chiffre : une capacité officielle ne prouve pas un 4/5 ou un 5/5. Le familier, les talents et la forme nécessaires doivent être explicités ; des outils conditionnels ne forment pas automatiquement un kit disponible simultanément.

Une reprise ne compte pas comme une preuve indépendante. La tier list Kami dérivée de MythicSim est écartée comme doublon ; le résumé Kami du podcast peut rester utile comme accès secondaire, mais ne corrobore pas indépendamment ce podcast. De même, le simulateur et une liste qui utilise son moteur ne sont pas deux validations séparées de la performance.

## Règles vérifiées

`tests/base-connaissances.test.cjs` vérifie que :
- la base couvre exactement les configurations du moteur, avec les mêmes valeurs, le même profil et la même version ;
- chaque note a une raison, au moins un appui, et que chaque appui concerne bien sa configuration ;
- une note de style à 4 ou plus s’appuie sur un fait de son domaine (un contrôle pour `ctrl`, une défense pour `surv`…) et cite toute limite de sa classe qui pèse contre ce critère, sauf si elle figure dans un écart ouvert ;
- une variante sans familier existe pour chaque familier facultatif, et seulement pour eux ; elle porte exactement les notes que le moteur change, chacune justifiée ;
- un profil de soin existe pour chaque configuration de soin, et seulement pour elles ; il porte les valeurs du moteur, chacune justifiée, et une note de 4 ou plus s'appuie sur un fait de soin ;
- une source « utilisée » est citée par au moins un fait, et réciproquement ;
- un écart ouvert porte la valeur actuelle du moteur et une note en confiance faible ; un écart tranché porte sa décision, appliquée au moteur.

`tests/complexite-v11.test.cjs` vérifie que la grille du référentiel a les mêmes composantes, dans le même ordre, que le moteur et l'interface ; que son barème est celui du moteur ; que chaque configuration décrit ses composantes avec les points du moteur et une raison, son total et sa note ; que `charge_pve` et `charge_pvp` en reprennent la valeur, les appuis et la confiance ; que chaque appui existe et concerne la configuration.

## Limites connues (21 octobre 2026)

- La bêta est plafonnée au niveau 30 (20 jusqu’au 1er octobre) et aucun raid n’y est testé : les notes de raid et de PvP au niveau 60 reposent sur des simulations, le kit et des avis, jamais sur des mesures en jeu.
- Aucun classement comparatif de soin exploitable n'a été établi dans cette base. La FAQ MythicSim annonce un Quick Sim en HPS, mais exclut les soigneurs de sa tier list : son existence annoncée ne valide ni son implémentation ni un classement en raid. Les cinq soigneurs restent à 5 en raid par convention, sans égalité de performance démontrée. Leurs profils de soin décrivent les outils mis en avant par Blizzard ; l'intensité relative (un 4 contre un 5) reste un jugement éditorial.
- Aucun retour comparatif par classe sur les champs de bataille suffisamment étayé n'a été retenu dans le corpus consulté. Cela ne démontre pas l'absence de tels retours ailleurs.
- La taille d'une rotation simulée est un indice qualitatif dépendant de son auteur et des optimisations retenues, pas une mesure de difficulté pour un joueur. Chez le Chasseur, la performance issue d'une rotation alternant mêlée et distance ne justifie pas en même temps la simplicité d'une rotation statique : depuis la v11, Survie est notée sur son jeu en alternance, celui qui fonde sa note de raid.
- Complexité (v11) : chaque composante est un jugement à un point près ; les guides de la bêta décrivent le niveau 30 ; en PvP, 18 configurations sur 28 sont à 4/5. Depuis la v12, les variantes sans familier ont leur propre grille : la `variante_sans_familier` de Survie et de Destruction porte ses notes `charge_pve` (et `charge_pvp` pour Destruction), justifiées comme les autres.
- Depuis le moteur 1.0.4, une préférence sans familier fait évaluer Affliction, Destruction, Survie et Précision dans leur variante sans familier. L’ampleur des baisses (un point par critère concerné) est un jugement éditorial, non une mesure.
- Beaucoup de tier lists de sites commerciaux se recopient entre elles : elles ne sont pas retenues.

Après le lancement du 4 novembre, journaux de combat, statistiques de champs de bataille et retours au niveau 60 permettront de mesurer. Les notes en confiance faible sont à relire en premier.

## Mettre à jour

- **Nouveau fait** : l’ajouter au fichier de sa classe avec ses sources ; ajouter la source au registre si besoin.
- **Changer une note** : c’est un changement du moteur. Il suit le protocole du codex (§7) : décision, nouvelle photographie de référence, puis mise à jour de la valeur, de la raison et de la version ici. L’écart correspondant reçoit sa décision (`{choix, date, valeur}`).
- **À chaque patch** : revoir les faits de performance et les sources datées, et noter ce qui a changé.

La version du moteur est inscrite dans chaque fichier : toute nouvelle version du moteur oblige à relire la base.
