# CODEX — Contrat du moteur logique de WoW Forever Classes

> **Statut : référentiel normatif v9 — 21 octobre 2026.** v2 : révision des données ; v3 : configuration qui représente une classe à score égal ; v4 : exception solo du Chasseur réservée à Maîtrise des bêtes ; v5 : variantes sans familier ; v6 : difficulté selon les activités ; v7 : note raid des DPS alignée sur leurs dégâts simulés ; v8 : façon de soigner ; v9 : interactions familier et soin.
> **Base figée :** commit de production `470fc92b607327ba7573307d1c00577ffc887208`, après la correction « DPS PvE = 100 partout ».
> **Base des révisions v2 à v10 :** `71f81ec53bc3023e5fd8e8428de1267ff5df2d4a`. Moteur `1.0.9-exploratoire` : soin Chaman et Paladin 4→5, contrôle Discipline 4→3 (v2) ; à score égal, une classe est représentée par sa configuration au plus haut potentiel ajusté à la maîtrise (v3) ; seule Maîtrise des bêtes garde l'exception solo du Chasseur (v4) ; quand le joueur préfère jouer sans compagnon, une configuration à familier facultatif est évaluée avec les notes de son build sans familier (v5) ; la préférence de difficulté juge la charge PvE ou PvP selon les activités choisies (v6) ; la note raid d'un DPS suit ses dégâts simulés (Élémentaire 3→2, Destruction, Combat et Amélioration 4→3) et Farouche (félin) passe à 2 en zone (v7) ; avec le rôle Soin, jusqu'à deux façons de soigner comparent les configurations de soin selon leur profil de soin (v8) ; un souhait souple de jouer sans compagnon compare les builds complets avec et sans compagnon, Précision est toujours évaluée en Loup solitaire et une façon de soigner compte pour toutes les pistes (v9) ; les classements listent les spécialisations, une classe peut revenir, au plus deux fois dans le top 3 du parcours guidé, et la technicité du mode personnalisé suit les critères d'activité (v10). Notes d'activité et de style, formules des autres domaines et coefficients de maîtrise inchangés. Décisions et effets dans [REVISION-EDITORIALE-V2.md](REVISION-EDITORIALE-V2.md).
> **Périmètre :** algorithmes, hypothèses, données, sauvegardes, tests et gouvernance des évolutions.
> **Non-objectif :** déclarer le modèle scientifiquement validé, équilibrer arbitrairement les classes, garantir des performances en jeu ou figer à jamais les valeurs éditoriales.

## 0. Autorité et mode d'emploi

Ce document fait office de **contrat de référence** : tout changement de comportement du moteur doit être identifié, expliqué, testé et approuvé avant sa mise en ligne.

Les trois sources de vérité techniques sont :

1. `recommendation-engine.js` : moteur partagé, exécutable dans Node.js et dans le navigateur.
2. `index.html` → `window.__WF` : matrice historique **9 classes × 14 notes = 126 notes**, 15 préréglages et calcul historique conservé séparément.
3. `tests/fixtures/moteur-reference-v9.json` : **photographie active de la version de référence**, vérifiée par `tests/codex-contract.test.cjs`. Les photographies v1 à v8 restent immuables : l'empreinte de la v1 et les trois seuls écarts de notes sont protégés par `tests/editorial-update.test.cjs`, l'empreinte de la v2 et les seuls écarts admis de la v3 par `tests/egalites-v3.test.cjs`, l'empreinte de la v3 et les seuls écarts admis de la v4 par `tests/chasseur-solo-v4.test.cjs`, l'empreinte de la v4 et les seuls écarts admis de la v5 par `tests/sans-familier-v5.test.cjs`, l'empreinte de la v5 et l'absence d'écart de la v6 par `tests/difficulte-contexte-v6.test.cjs`, l'empreinte de la v6 et les seules cinq notes changées de la v7 par `tests/raid-degats-v7.test.cjs`, l'empreinte de la v7 et l'absence d'écart de la v8 par `tests/soin-v8.test.cjs`, l'empreinte de la v8 et les seuls écarts admis de la v9 par `tests/interactions-v9.test.cjs`.

`questionnaire.js` et `priorities-ui.js` gèrent **l'affichage et les préférences**, mais ne doivent pas constituer des moteurs de scoring concurrents. `RECOMMANDATION-METHODE.md` apporte les explications destinées aux utilisateurs. En cas de contradiction entre l'intention de ce codex et le code, **arrêter la modification, caractériser l'écart, puis décider explicitement du contrat voulu** : ne pas réécrire silencieusement le codex pour justifier un résultat accidentel.

Les mots **DOIT**, **INTERDIT**, **REQUIERT** et **NON GARANTI** sont à prendre au sens prescriptif.

## 1. Inventaire et statut des données

### 1.1. Structures

- **9 classes** distinctes, avec une identité stable.
- **28 configurations** : 27 spécialisations et une configuration Farouche Ours distincte du Farouche félin.
- Pour chaque configuration : identifiant, classe, libellé, rôle `tank|soin|dps`, portée `distance|melee`, familier `none|optional|core`, **4 activités**, **6 styles**, difficulté d'exécution PvE/PvP et référence officielle de classe.
- Activités : `raid`, `bg`, `world`, `solo`.
- Styles : `burst`, `zone`, `ctrl`, `surv`, `mob`, `support`.
- Les notes d'activité et de style sont des **évaluations éditoriales entières de 1 à 5**, non de la télémétrie observée.
- Les catégories rôle/portée/familier proviennent des kits et descriptions de classes ; les URL Blizzard attestent ces éléments structurels, **pas la véracité des notes éditoriales**.
- **Définitions (v7) :** pour un DPS, l'activité `raid` mesure ses **dégâts simulés seuls**, en pourcentage du meilleur DPS simulé au niveau 60 : 5 à partir de 86 %, 4 de 72 à 85 %, 3 de 55 à 71 %, 2 en dessous ; l'utilité de groupe est notée dans le style `support`. Le style `ctrl` couvre trois usages, neutraliser, interrompre, ralentir ou immobiliser, avec les seuls outils du build évalué ; ceux accessibles par changement de forme comptent avec leur contrainte. Les soigneurs et les tanks gardent leur convention.
- **Variantes sans familier (v5) :** chaque configuration à familier `optional` a une variante « sans familier » (`E.petless`) qui ne modifie que les notes où le familier compte : Affliction (contrôle 5→4, PvP sauvage 5→4, solo 4→3), Destruction (contrôle 4→3, PvP sauvage 5→4, solo 4→3), Survie (solo 5→4) ; Précision, déjà évaluée en « Loup solitaire », est inchangée. Raisons et appuis dans la base de connaissances.
- **Build de référence (v9) :** Précision est toujours évaluée dans son build Loup solitaire, sans compagnon, dans les deux parcours (`E.referenceVariants`, `variante_reference` dans la base) ; aucun build avec compagnon n'est inventé à partir de ces notes.
- **Profils de soin (v8) :** les cinq configurations de soin, et elles seules, portent un profil `heal` de 1 à 5 sur quatre façons de soigner : `prevention` (prévenir les dégâts : boucliers et absorptions), `duree` (soins sur la durée), `cible` (gros soins ciblés) et `groupe` (soigner tout le groupe). C'est un portrait éditorial tiré des présentations officielles, pas une mesure de puissance : Sacré (Paladin) 1/1/5/3, Discipline 5/2/4/3, Sacré (Prêtre) 3/2/4/5, Restauration (Chaman) 1/3/4/5, Restauration (Druide) 1/5/3/4 (dans cet ordre). Raisons et appuis dans la base de connaissances (`profil_soin`).
- **Justifications :** la [base de connaissances](connaissances/README.md) relie chaque note à des faits sourcés, avec une raison et un niveau de confiance, et liste les notes que les faits contredisent. Elle ne change aucun calcul ; `tests/base-connaissances.test.cjs` vérifie qu'elle reste alignée sur le moteur (mêmes configurations, valeurs et version).

**Invariants :** aucun doublon d'identifiant de configuration, aucune configuration sans classe, aucune note non finie/hors plage, aucun mélange des attributs de deux spécialisations dans une même évaluation, aucune modification silencieuse des 126 notes historiques.

### 1.2. Niveau de maîtrise

Index entier : **0 Débutant, 1 Intermédiaire, 2 Confirmé (référence), 3 Expert**. Toute valeur invalide retombe sur 2 pour les calculs qui le prévoient.

La modulation du moteur spécialisé suit, pour une activité `k` et une spécialisation `s` :

- Contexte PvE si `k = raid` ou `solo` ; sinon PvP.
- `delta = clamp(facteur[maîtrise] × charge_execution[s,contexte], -1.2, 0.35)`
- `facteur = [-0.29, -0.13, 0, +0.09]`
- `activite_ajustee = clamp(note_activite + delta, 1, 5)`
- Exception explicite : activité `solo` du **Chasseur Maîtrise des bêtes**, seule configuration où le familier est central → `delta = 0` (hypothèse de leveling porté par le familier). Depuis la v4, Précision et Survie, où le familier est facultatif, suivent la règle générale.
- Pour les styles `ctrl` et `surv`, le contexte d'exécution est PvP (`world`), pour les autres styles PvE (`raid`) ; la correction est `0.55 × delta`, puis bornée à `[1,5]`.

La maîtrise représente une **hypothèse de réalisation du potentiel** ; elle ne mesure ni le niveau réel du joueur ni un bonus de DPS universel. Le **goût pour la complexité** est un critère distinct.

## 2. Parcours « Être guidé » — API et contrat

### 2.1. Entrée et normalisation

API : `sanitize(profile)`, `ranking(profile)`, `recommend(profile)`.

**Restitution, 21 octobre 2026 :** `explain(specId, profile)` expose les valeurs réellement utilisées par le parcours guidé, sans intervenir dans le classement. Pour chaque réponse : repère de référence, valeur après maîtrise, certitude, adéquation et contribution normalisée. Les rôles multiples restent groupés car leur couverture et leur rôle principal interagissent. L’écart au maximum se décompose en aptitude, maîtrise et certitude ; une contribution négative représente un gain, notamment lorsqu’une hésitation atténue un désaccord. Les sommes non arrondies sont vérifiées à la tolérance flottante près ; `score` conserve exactement l’arrondi du classement. À l’écran, les points entiers sont répartis sous la contrainte de ne jamais dépasser leur maximum affiché. Cette API et cet arrondi de présentation ne changent aucun classement.

Sept dimensions répondables, toutes facultatives :

| Dimension | Forme | Choix/particularité |
| --- | --- | --- |
| Rôles | ensemble `dps/tank/soin` | plusieurs, contrainte explicite `rolesStrict` |
| Façon de soigner (v8) | ensemble `prevention/duree/cible/groupe` | **2 choix maximum**, retenus seulement si le rôle Soin est choisi |
| Activités | ensemble `raid/bg/world/solo` | plusieurs |
| Portée | `any/distance/melee/mixte` | préférence ou contrainte explicite |
| Styles | ensemble des six qualités | **3 choix maximum** |
| Familiers | `any/like/avoid` | `avoid` souple : builds avec et sans compagnon comparés ; strict : sans compagnon uniquement (v9) |
| Difficulté souhaitée | `any/simple/complex` | distincte de `mastery` |

Certitude **entière de 0 à 5**, attachée à chaque choix exprimé. Les données invalides ou corrompues sont nettoyées (sélections hors catalogue ignorées, maîtrise hors plage ramenée au défaut, styles limités à trois, façons de soigner limitées à deux et ignorées sans le rôle Soin).

**Contrat :** une question sans réponse n'intervient ni dans les poids ni dans les filtres. `mastery` seule n'exprime aucune préférence et ne déclenche **pas** de classement.

### 2.2. Certitude ≠ importance ≠ exclusion

Pour une adéquation brute normalisée `a ∈ [0,1]` et une certitude `c ∈ {0,…,5}` :

```text
intensité(c) = 0,25 + 0,75 × c / 5
préférence(a,c) = 0,5 + intensité(c) × (a − 0,5)
```

- À **0/5**, la préférence est **atténuée**, pas supprimée (`intensité = 0,25`).
- À **5/5**, sa valeur brute est pleinement utilisée.
- Une certitude 5 ne crée **jamais** un filtre éliminatoire implicite.
- Seul un choix **explicitement strict** peut éliminer une configuration.

### 2.3. Filtres stricts appliqués AVANT le score

`eligible(s,p)` :

- Rôles stricts : la classe doit pouvoir exercer **tous les rôles demandés** ; la configuration évaluée doit elle-même exercer l'un d'eux.
- Portée `distance` ou `melee` stricte : la configuration doit avoir cette portée.
- Portée `mixte` stricte : la classe doit posséder au moins deux portées dans le périmètre des rôles demandés.
- Familier `avoid` strict : les configurations à familier **obligatoire** (`core`) sont exclues ; un familier `optional` reste autorisé, évalué dans sa variante sans familier (§2.4).
- Les préférences souples, même très affirmées, **n'excluent jamais**.
- **Interface (21 octobre 2026) :** une exigence absolue n'est pas une hésitation. Cocher « indispensable », « exigence absolue » ou « uniquement sans familier » fixe la certitude du choix exigé à **5/5** et verrouille son curseur ; une sauvegarde stricte et hésitante est relue à 5/5. Le moteur et ses formules sont inchangés : pour la portée et le familier, toutes les configurations admises y répondent pleinement, l'ordre ne change donc pas, seuls les scores affichés montent.

Les contraintes contradictoires renvoient `status='no-match'`, **sans inventer de classe de remplacement**.

### 2.4. Valeur d'une spécialisation

Chaque dimension activée produit un `parts[dimension] = {value, weight}`. Coefficients de conception :

| Rôles | Activités | Portée | Styles | Façon de soigner | Familiers | Difficulté |
|---:|---:|---:|---:|---:|---:|---:|
| 0,25 | 0,25 | 0,15 | 0,20 | 0,15 | 0,10 | 0,05 |

**Rôles :** si un seul rôle est demandé, une configuration du rôle correspondant reçoit la valeur brute `0,25 + 0,75 × roleSuitability(s, mastery)` ; toute autre configuration reçoit **0**, avant l'atténuation par certitude. Pour plusieurs rôles, la valeur brute mélange **65 % de couverture de tous les rôles par la classe** et **35 % d'adéquation à celui de la spécialisation** ; aucune polyvalence n'est récompensée lorsque le joueur ne la demande pas.

**Activités et styles :** moyenne des adéquations normalisées `(note_ajustée − 1)/4` de leurs choix, après la fonction de certitude. Sélectionner trois styles ne multiplie pas le poids total du domaine.

**Façon de soigner (v8) :** domaine actif seulement si le rôle Soin est demandé et qu'au moins une façon de soigner est choisie. Pour une configuration de soin, moyenne des adéquations `(heal_k − 1)/4` des choix, après la fonction de certitude. Depuis la v9, une configuration d'un autre rôle reçoit une adéquation brute nulle sur ce domaine, atténuée par la certitude : elle ne répond pas à cette envie. Toutes les pistes ont ainsi le même dénominateur, et ce seul domaine ne peut plus faire représenter une classe par une configuration d'un autre rôle (en v8, une configuration hors soin n'en recevait aucune part). Le parcours « Mode personnalisé » ne l'utilise pas.

**Portée :** adéquation brute `1` pour le type souhaité, `0,12` pour l'autre ; le choix `mixte` vaut `1` si la classe peut alterner selon les rôles demandés, sinon `0,28`.

**Familier (v9) :** `like` donne `1` pour `core`, `0,76` pour un build `optional` joué avec son compagnon, `0,1` pour `none` ou un build sans compagnon (variante sans familier, Précision en Loup solitaire). `avoid` donne `1` pour `none` ou un build sans compagnon, `0,05` pour un build avec compagnon (`core` ou `optional`).

**Builds avec ou sans compagnon (v9) :** pour un `avoid` souple, le moteur évalue les deux builds complets d'une configuration `optional`, avec et sans compagnon, et retient le meilleur score ; à égalité au centième, le build sans compagnon. Il ne mélange jamais leurs notes. Pour un `avoid` strict, seul le build sans compagnon est évalué. Le résultat annonce le build retenu.

**Variantes sans familier (v5, règle remplacée par la v9 pour un souhait souple) :** dès que le joueur choisit `avoid`, quelle que soit sa certitude, une configuration `optional` est remplacée par sa variante sans familier, pour tous les domaines du score. La variante répond pleinement au souhait ; son compromis passe dans ses notes et non plus dans une pénalité forfaitaire (l'ancien `0,78`, conservé seulement pour une configuration de base évaluée hors de ce cas). Elle garde l'identifiant, le rôle, la portée et la charge de sa configuration ; le résultat la signale par `spec.variant = 'sans-familier'`. Un scénario de sensibilité qui retire la préférence de familier revient à la configuration de base. Le parcours « Mode personnalisé », sans préférence de familier, n'utilise jamais ces variantes.

**Difficulté souhaitée (v6) :** la charge retenue `L` dépend des activités choisies (`difficultyContext`) : `charge_pve` si toutes sont PvE (donjons et raids, solo), `charge_pvp` si toutes sont PvP (champs de bataille, PvP sauvage), sinon la moyenne `(charge_pve + charge_pvp)/2`, comme avant la v6. Elle devient `(5−L)/4` pour `simple` et `(L−1)/4` pour `complex`. Le parcours « Mode personnalisé » garde la moyenne pour l'axe Technicité.

Le score **par spécialisation** normalise les **seuls domaines renseignés** :

```text
score_brut = Σ_d [ valeur_d × coefficient_d ] / Σ_d [ coefficient_d ]
score_affiché = arrondi(100 × score_brut, 2 décimales)
```

### 2.5. Sortie et égalités

- `unanswered` : aucune dimension renseignée, **aucun classement**.
- `no-match` : toutes les configurations sont éliminées, **aucun classement**.
- `ok` : **toutes les configurations admissibles** (depuis la v10 ; une classe peut donc revenir), chacune dans sa meilleure variante (§ 2.4). Ordre : score au centième décroissant, puis classe (identifiant), puis **potentiel ajusté à la maîtrise** (§ 3.4) décroissant, puis identifiant de spécialisation. La première configuration de chaque classe est donc celle que la v3 retenait pour la représenter, et l'ordre de ces premières configurations est celui de la v9.
- `compatible` = nombre de **configurations** admissibles, égal à la longueur de `results`, **pas** nombre de classes.
- `recommend()` propose **au plus trois pistes** (`top`), dont **au plus deux spécialisations d'une même classe** (`topPicks`, `maxPerClass = 2`) : la place suivante va à la meilleure configuration d'une autre classe. Chaque piste a ses points forts/compromis et sa stabilité dans les scénarios de sensibilité.
- Interface : l'aperçu du classement et la liste du mode personnalisé affichent les **dix premières configurations**, puis les autres sur demande.

**Restitution des égalités (lot d'explications du 21 octobre 2026) :** l'interface partage le rang des scores exactement égaux et leur mise en avant. Le guide cite toutes les classes à égalité en tête, y compris au-delà de ses trois cartes. Cette présentation ne modifie ni le tri déterministe, ni les scores, ni le choix de la configuration représentative. Les scores affichés à l'entier peuvent masquer un petit écart ; ils ne définissent pas l'égalité.

### 2.6. Sensibilité (et ce qu'elle ne signifie pas)

Les choix de certitude **≤ 2** sont successivement retirés **un par un** et les classements recalculés (depuis la v10, la stabilité d'une piste se compte par spécialisation : sa présence dans le top 3 plafonné de chaque scénario) ; depuis la v8, une façon de soigner hésitante l'est aussi, et retirer le rôle Soin retire avec lui la façon de soigner. La stabilité exprimée est un décompte interne d'apparitions dans le top 3 des scénarios admissibles ; **ce n'est pas une probabilité statistique**. Ne pas annoncer « 90 % de chances d'aimer cette classe » à partir de ce dispositif.

Les résultats apparaissent **uniquement sur demande** dans l'interface : l'algorithme peut recalculer instantanément, mais ne doit pas forcer l'affichage du top 3 après une première réponse.

**Agencement du 21 octobre 2026 :** à l'arrivée, aucun parcours n'est ouvert ; deux cartes présentent les parcours et le visiteur choisit. À côté du questionnaire, un **aperçu du classement** des neuf classes suit chaque réponse ; il est **replié par défaut** et ne s'ouvre que sur un geste du joueur, ce qui respecte la règle ci-dessus. Aux questions 1 à 5, dès deux dimensions, le bloc sous la question propose de **« Prévisualiser mes résultats »** ; à la question 6, **« Voir mes résultats »** remplace « Question suivante » et ce bloc s'efface (pas de doublon). Sans aucune préférence, ce bouton est inactif et la question dit pourquoi ; la maîtrise seule n'est pas une préférence.

### 2.7. Explication d'un résultat

API : `explain(id, profile)` (§ 2.4) renvoie, réponse par réponse, les valeurs du calcul lui-même : `base` (adéquation avec la maîtrise de référence), `raw` (avec la maîtrise du joueur), `certainty`, `fit` (après certitude), `note` et `adjusted` pour les critères notés sur 5, et la part de points correspondante. Pour les rôles, la trace porte aussi `covered` (rôles demandés que propose la classe) et `aptitude` (aisance estimée en PvE de la spécialisation) ; ces deux champs ne servent qu'à l'explication et ne modifient aucun score.

« Pourquoi cette piste » lit chaque réponse **en trois lignes**, avec les intitulés du questionnaire et le nom de la spécialisation :
- **La spécialisation** : sa note pour ce critère, puis la note avec la maîtrise du joueur quand elle diffère (« Finesse est notée 4/5 pour cette activité, 4,4/5 avec ta maîtrise (expert). ») ;
- **Ton choix** : la certitude en mots, puis le chiffre (« Assez sûr (certitude 3/5) »), et les exigences éventuelles ;
- **Constat** : à quel point elle répond (« Elle y répond bien (84 %). »), puis, si la certitude est inférieure à 5, la valeur retenue (« adouci à 78 % par ta certitude »).

Une note de 1/5 compte pour 0 % et 5/5 pour 100 % ; une certitude faible adoucit le résultat vers 50 %. Un groupe de plusieurs réponses en donne la moyenne ; ses points font exactement le score affiché (§ 2.4). En tête, « Pourquoi N sur 100 ? » fait le **bilan des points manquants**, groupe par groupe, avec la réponse qui en coûte le plus, et sa certitude quand c'est elle qui coûte. « À garder en tête » nomme cette réponse : « C'est ce qui lui coûte le plus de points ». « Pourquoi cette place » applique la même lecture au mode personnalisé (§ 3.1), avec la **priorité en mots** (« Priorité essentielle (3) » ; 1 secondaire, 2 importante, 3 essentielle, mots repris dans la légende des boutons) et, pour un groupe de plusieurs critères, leur part selon la priorité.

## 3. Parcours « Mode personnalisé » — API et contrat

### 3.1. Entrée

API : `sanitizeWeights(weights)`, `priorityRanking(weights, mastery)`, `priorityExplain(id, weights, mastery)`. Depuis la v10, `priorityRanking` classe les **28 configurations** (variante de référence pour Précision) dans l'ordre du § 2.5. La dernière renvoie, critère par critère, les valeurs du calcul (`group`, `key`, `weight`, `share`, `raw`, et selon le critère `note`/`adjusted`, `roles` ou `load`) ; le classement et son explication partagent les mêmes fonctions et ne peuvent pas diverger.

- **14 axes**, dans l'ordre : `poly,tank,soin,dps,bg,sauv,burst,zone,ctrl,surv,mob,util,solo,tech`.
- Poids **entiers 0…3** ; les valeurs absentes, négatives, décimales ou non entières sont neutralisées à **0**.
- Poids 0 = axe ignoré ; tous les poids à 0 = **`unanswered`, aucun classement**.
- Maîtrise 0…3, défaut 2.
- **8 profils d'entrée visibles** dans l'interface actuelle, issus des **15 préréglages historiques** qui restent conservés dans les données.

### 3.2. Domaines et normalisation

| Groupe | Axes | Coefficient maximal |
|---|---|---:|
| Rôles | tank, soin, dps | **0,30** |
| Activités | bg, sauv, solo | **0,28** |
| Combat | burst, zone, ctrl, surv, mob, util | **0,28** |
| Affinités | poly, tech | **0,14** |

Pour chaque groupe `g`, n'utiliser que les axes `w_k > 0` :

```text
qualité_g(s) = Σ(w_k × brut(s,k)) / Σ(w_k)
importance_g = coefficient_g × max(w_k actifs)/3
score(s) = 100 × Σ(importance_g × qualité_g(s)) / Σ(importance_g)
```

**Exception numérique explicite :** si **un seul axe est actif**, `score(s) = 100 × brut(s,k)`. Ainsi, le poids 1, 2 ou 3 ne doit pas changer le score d'un axe isolé : ces poids expriment son importance **relative aux autres critères**.

Le score de classe est celui de **la meilleure configuration cohérente**, sans combiner le tank d'une spé avec le burst d'une autre. **Les neuf classes** figurent au classement (même lorsqu'une classe répond mal aux critères). Les égalités sont stabilisées par nom de classe en locale française. À score égal au centième entre configurations d'une même classe, la classe est représentée par celle au **plus haut potentiel ajusté à la maîtrise** (§ 3.4), puis par identifiant : jamais par un arrondi flottant.

### 3.3. Signification du brut par axe

- **Rôles :** une configuration ne rapporte des points pour `tank/soin/dps` que si `s.role` correspond. Sa valeur n'est **plus un booléen 1/0** : elle vaut `roleSuitability(s,m)`.
- **Activités :** `(adjustedActivity(s, contexte, m) − 1)/4`.
- **Styles :** `(adjustedStyle(s, qualité, m) − 1)/4`.
- **Polyvalence :** `(nombre_de_rôles_distincts_de_la_classe − 1)/2`, **uniquement si `poly > 0`**.
- **Technicité :** `clamp((L − 1)/4, 0, 1)`, **uniquement si `tech > 0`**. Depuis la v10, `L` suit les critères d'activité (`techContext`), comme la difficulté du parcours guidé (v6) : `charge_pvp` si seuls des critères PvP sont actifs (champ de bataille, PvP sauvage), `charge_pve` si seuls des critères PvE le sont (solo, et les rôles, évalués en PvE), sinon la moyenne `(charge_pve + charge_pvp)/2`. C'est une préférence pour l'exigence, **pas une puissance intrinsèque**.

**Interdictions fonctionnelles :** compter Tank/Soin/DPS comme trois primes indépendantes au généraliste ; donner 100 à toutes les classes pour « DPS PvE » simplement parce qu'elles possèdent un DPS ; afficher des performances réelles supposées sans mesures.

### 3.4. Adéquation aux rôles — formule critique

Depuis le correctif du 21 octobre 2026, le moteur utilise deux données éditoriales :

```text
référence_classe = (note_historique_classe_pour_le_rôle − 1)/4
potentiel_spé = potential(spé, maîtrise) = (adjustedActivity(spé, 'raid', maîtrise) − 1)/4
roleSuitability(spé, maîtrise) =
  clamp(0,55 × référence_classe + 0,45 × potentiel_spé, 0, 1)
```

Depuis la v3, `potential` est exposé par l'API et sert aussi à départager les configurations d'une même classe à score égal (§ 2.5 et § 3.2).

Les notes historiques sont issues de `ROLE_REFERENCE`, qui **DOIT rester égal** aux colonnes `tank/soin/dps` de `window.__WF.classes[].r` ; cette égalité est vérifiée par tests. Une configuration hors rôle apporte **0** à cet axe.

La composante `raid` est un **proxy éditorial d'adéquation PvE**, non une mesure de DPS, HPS, menace ou rang de tier list. Elle concerne actuellement aussi l'adéquation Tank/Soin. Toute évolution vers des mesures par spécialisation **requiert un changement de modèle documenté**.

### 3.5. Aucune neutralité statistique implicite

« Tous les critères » constitue un **profil éditorial défini**, pas une position neutre. La somme pondérée peut naturellement privilégier un généraliste lorsque l'utilisateur sélectionne de nombreuses qualités. Ne pas forcer neuf classes à gagner chacune 11,1 % des profils simulés. **Les statistiques de fréquence de victoire sont des outils d'audit, jamais des objectifs du moteur**.

Aucun classement sans critère exprimé. Aucun quota de classes. Aucun ajustement de données pour faire gagner une classe déterminée.

## 4. Le comparateur documentaire historique est un troisième calcul distinct

**Retiré de la page le 21 octobre 2026.** Le tableau de bord historique (classement à 14 poids, courbes de maîtrise) était dépassé et pouvait être pris pour l'algorithme des parcours : il n'est plus affiché ni exécuté. `index.html` conserve `window.__WF` (les **126 notes**, 14 axes, 15 profils, niveaux et coefficients) : le mode personnalisé y lit ses profils, la matrice des notes et les fiches de classes restent affichées, et les tests vérifient ces données contre la photographie de référence. La section « Comment la maîtrise est modélisée » décrit désormais le modèle du moteur (§ 1.2) ; elle suit le détail des classes et précède les sources. Pour mémoire, le score descriptif historique n'était **pas** le score du moteur spécialisé :

```text
note_effective(c,k,m) = note_historique(c,k)
  ou (si modifiable et note > 1)
  clamp(note_historique + penalty[m] × (coût_execution−1)
                       + bonus[m] × gain_expert, 1, 5)

indice_historique(c) =
  100 × Σ(w_k × note_effective(c,k,m)) / (5 × Σ(w_k))
```

Les coefficients `penalty`, `bonus`, `mastery` et `masteryOverrides` appartiennent à `window.__WF` ; leur sémantique ne doit pas être remplacée subrepticement par celle du moteur spécialisé. L'ancien score reste un **comparatif descriptif**, pas l'algorithme des deux parcours principaux.

**Un écart numérique entre le comparateur historique et les deux parcours n'est pas à lui seul une régression.** Les trois résultats répondent à des modèles différents. L'UI DOIT éviter de les présenter comme interchangeables.

## 5. Contrat de persistance et de séparation des états

| Clé `localStorage` | Propriétaire | Contrat |
|---|---|---|
| `wf-recommend-v1` | questionnaire | profil nettoyé, certitudes, exigences et maîtrise ; depuis la v8, champ facultatif `healStyles` (façon de soigner) |
| `wf-reco-mode-v1` | choix du parcours | `guided` ou `priorities` : dernier parcours ouvert. Depuis le 21 octobre 2026, il n'ouvre plus ce parcours au chargement : la page propose toujours le choix et signale ce parcours (« dernier parcours utilisé »). |
| `wf-priority-custom-v1` | priorités | sauvegarde **explicite** `{weights, mastery}`, rappel possible |
| `wf-overview-v3` | mode personnalisé (comparateur historique jusqu'au 21 octobre 2026) | schéma inchangé : poids actifs `w`, maîtrise `m` ; `hl` et `c`, hérités, sont conservés tels quels. Rien n'est écrit sans geste du visiteur. |
| `wf-overview-theme` | *(retirée)* | ancien choix du thème. Depuis le 21 octobre 2026, la page est toujours sombre : la clé n'est plus lue ni écrite, et une valeur déjà enregistrée est ignorée sans être effacée. |

Compatibilité de la v8 : une sauvegarde antérieure, sans `healStyles`, reste valide et ne précise aucune façon de soigner ; une façon de soigner enregistrée sans le rôle Soin n'est pas restaurée. Aucune migration n'est nécessaire (tests aller/retour dans `tests/recommendation-ui.test.cjs`).

Compatibilité historique : le mode personnalisé reprend les migrations du comparateur retiré (`wf-overview-v2`, puis `wf-overview-weights` et `wf-overview-skill`) ; une sauvegarde antérieure au 20 octobre 2026, sans Burst ni Dégâts de zone, leur donne 0, ou le poids commun si tous les autres critères avaient le même ; une pondération personnelle d'avant « Mes critères » devient une sauvegarde reprenable, et `wf-overview-v3.c` est réimporté si aucune sauvegarde personnalisée moderne n'est disponible (tests dans `tests/skill-matching.test.cjs`).

La maîtrise est partagée entre les deux parcours (`window.WFGuide` et `window.WFPriorities`) : un choix dans l'un est repris et sauvegardé par l'autre. Au chargement, une maîtrise sauvegardée par le mode personnalisé est conservée ; sinon celle du questionnaire est reprise, sans écriture. **Ne pas lier les poids de priorités aux réponses guidées**.

**Garantie attendue :** choisir un préréglage ou changer de parcours ne détruit pas la sauvegarde personnelle ; recharger la page ne fait pas perdre une préférence valide. Si `localStorage` est indisponible ou corrompu, le moteur doit rester utilisable sans crash.

Une modification du schéma de stockage REQUIERT une migration documentée, des tests aller/retour et un contrôle des utilisateurs ayant une ancienne sauvegarde.

## 6. Oracles de non-régression et fichiers à ne pas régénérer automatiquement

### 6.1. Photographie de référence figée

Le fichier `tests/fixtures/moteur-reference-v1.json` contient :

- les 126 notes historiques et l'inventaire des 15 préréglages ;
- les **28 configurations complètes** avec leurs évaluations éditoriales et sources ;
- **12 scénarios guidés** (dont états vides, contraintes impossibles, certitudes faibles et familiers) ;
- **15 préréglages × 4 maîtrises** avec l'ordre, la spécialisation et le score de chaque classe ;
- les **3 rôles isolés × 4 maîtrises** ;
- **5 mélanges d'axes × 3 maîtrises**.

Les photographies v1 à v4 restent conservées. `tests/codex-contract.test.cjs` compare désormais le moteur et les données **directement** à la photographie v10 (37 scénarios guidés, 87 classements personnalisés et cinq pondérations de technicité). `scripts/reference-v10.cjs` rejoue chaque cas de la v9 : dans chacun, la première configuration de chaque classe, son score et l'ordre des classes sont conservés et la première piste ne change jamais ; 22 des 34 scénarios guidés voient une deuxième spécialisation d'une classe entrer dans le top 3 ; l'empreinte de la v9 est vérifiée. Avant la v10, la comparaison portait sur la photographie v9 : les mêmes 99 cas, plus quatre scénarios guidés sans familier (v5), quatre qui combinent difficulté et activités (v6), sept scénarios de soin (v8) et sept scénarios d'interactions familier et soin (v9). `scripts/compare-editorial-v2.cjs` (v1→v2, 39 cas sur 99) et `scripts/reference-v3.cjs` (v2→v3, 41 cas : seules changent, à score égal, les configurations affichées) comparent des photographies figées. `scripts/reference-v4.cjs` compare les photographies v3 et v4 : seul le Chasseur change, en solo, en Débutant ou Intermédiaire, et à la baisse (5 cas sur 99). `scripts/reference-v5.cjs` compare les photographies v4 et v5 : seuls les profils qui évitent les familiers changent, et seulement pour le Chasseur et le Démoniste (1 cas sur 99). `scripts/reference-v6.cjs` compare les photographies v5 et v6 : aucun des 103 cas ne change, quatre scénarios de difficulté s'ajoutent. `scripts/reference-v7.cjs` compare les photographies v6 et v7 : seules les cinq notes décidées changent, et les classes qui ne les portent pas gardent configuration et score dans chaque classement (45 cas sur 107 bougent, aucune première classe). `scripts/reference-v8.cjs` compare les photographies v7 et v8 : aucun des 107 cas ne change, sept scénarios de soin s'ajoutent. `scripts/reference-v9.cjs` rejoue la v8 avec le moteur actuel : notes, priorités et mode personnalisé inchangés ; deux des 27 scénarios guidés changent de scores ou de configuration, sans changement de première classe. `scripts/audit-interactions.cjs` compare le moteur au commit `f5bf5f6` sur 8 172 profils guidés et 2 768 profils personnalisés de contrôle : 729 profils guidés changent, dont 170 de première classe, tous liés aux règles familier ou soin ; aucun profil personnalisé ne change. Aucun script n'écrit de fixture sans l'option explicite `--fixture`. Ces photographies ne sont **pas un jeu d'entraînement**, ni une preuve de justesse du gameplay : elles détectent les changements.

La v2 accepte une égalité des quatre classes soigneuses sur le seul axe Soin aux maîtrises Confirmé et Expert. Cette convention éditoriale ne dit pas que leurs soins réels sont égaux. Les classes sans configuration de soin restent à zéro sur cet axe ; les axes Tank et DPS restent différenciés.

Les valeurs et les égalités observées dans cette photographie appartiennent à la version de référence. Si une source Blizzard apporte ultérieurement des données vérifiées modifiant une note, il peut être **correct** que les tests échouent : ils exigent alors une décision explicite et une nouvelle version documentée.

### 6.2. Tests de propriétés indépendants des instantanés

En complément, maintenir :

- Inventaire : 9 classes, 28 configurations, 126 notes, 14 axes, 15 préréglages, 4 maîtrises.
- Bornes et finitude : scores normalisés 0…100 ; notes 1…5 ; aucune valeur `NaN` ou infinie.
- Déterminisme pour une entrée et un référentiel identiques ; immutabilité des entrées.
- `unanswered` pour l'absence de choix ; `no-match` pour des veto réellement incompatibles.
- **Exigences strictes satisfaites** par chaque configuration retournée ; une préférence souple ne peut jamais devenir un veto.
- Certitude 0 ≠ suppression et certitude 5 ≠ filtre implicite.
- Au plus 3 pistes dans le guide, dont au plus deux spécialisations d'une même classe, et une ligne par configuration admissible ; les 28 configurations (9 classes) en priorités dès qu'un axe est actif.
- Scores de rôle distincts et ancrés sur les notes historiques ; **jamais « DPS PvE = 100 pour les neuf »**.
- Pour chaque axe isolé, **poids 1/2/3 numériquement identiques** (avec le même niveau de maîtrise).
- Polyvalence et technicité absentes du calcul lorsque leurs poids valent 0.
- Configuration retenue cohérente : pas de mélange de spécialisations.
- Nettoyage des entrées invalides, restauration des préférences, maîtrise partagée.
- Clavier, rendu responsive, navigateur réel et déploiement GitHub Pages.

Les tests existants explorent par ailleurs **12 000 profils guidés** et **24 000 pondérations synthétiques** reproductibles. Ce ne sont pas des échantillons représentatifs de joueurs.

**Interdit :** remplacer une assertion exigeante par une assertion plus faible pour faire passer la CI ; regénérer les instantanés après un échec sans en comprendre et approuver la cause.

## 7. Protocole de changement — obligatoire pour toute PR touchant le moteur

1. **Qualifier le changement** : `PRESENTATION`, `CORRECTIF`, `DONNEES` ou `MODELE`. Un changement CSS ne doit pas modifier les scores.
2. **Décrire l'intention** et l'hypothèse corrigée ; identifier les fonctions, données et états affectés.
3. **Reproduire d'abord** le problème en ajoutant un test rouge ciblé, avec une entrée exacte et un résultat attendu.
4. **Implémenter le correctif minimal** ; conserver les invariants non concernés.
5. **Lancer toute la suite** : `node --test tests/*.test.cjs`, navigateur et packaging Pages.
6. **Comparer les instantanés** : produire un tableau des classements/spécialisations avant et après, pour les scénarios affectés.
7. **Justifier chaque divergence** : distinguer correction souhaitée, effet secondaire acceptable et régression.
8. **Si le changement de comportement est autorisé**, produire une **nouvelle version du référentiel** (ou versionner explicitement la photographie avec note de migration), mettre à jour ce codex, le journal de modifications et la version du moteur. Conserver l'ancienne base pour la traçabilité.
9. **Faire relire** la méthodologie et les résultats ; obtenir l'accord explicite du responsable du projet sur une évolution majeure de scoring.
10. **Fusionner seulement avec la CI verte et la revue effectuée**, puis vérifier le site public. Recommander la protection de branche et les statuts de CI obligatoires ; ne pas prétendre qu'ils sont configurés s'ils ne le sont pas.

### Une PR touchant les scores DOIT contenir

- Un exemple reproductible **avant/après**.
- La justification de la formule ou de la donnée modifiée.
- La preuve que les classements collatéraux ont été examinés.
- Le résultat des suites de tests et l'identification des nouveaux tests.
- La liste des hypothèses non encore validées par des mesures réelles.

En cas de divergence inexpliquée, **bloquer la fusion** ; aucun ajustement « cosmétique » des chiffres n'est acceptable.

## 8. Limites scientifiques, transparence et audits périodiques

**NON GARANTI :** équilibre réel au niveau 60, DPS/HPS/menace mesurés, victoire PvP, plaisir du joueur, recommandations statistiquement calibrées, causalité des pondérations, représentativité des simulations. Le moteur est un **outil d'aide à la réflexion**, pas une tier list objective.

Les coefficients (0,55/0,45 pour rôle, poids des domaines, facteurs de maîtrise, notes 1…5) sont des **choix éditoriaux susceptibles d'être révisés** avec preuves. Ne pas utiliser des indicateurs de distribution des vainqueurs comme objectifs à atteindre ; s'en servir seulement pour rechercher des anomalies de modélisation.

À chaque patch significatif du jeu : vérifier les descriptions officielles, inventorier les changements de spécialisations, citer les données disponibles et distinguer faits vérifiés / simulations / opinions ; ne mettre à jour les notes qu'avec un motif vérifiable. Ce travail se consigne dans la [base de connaissances](connaissances/README.md) : faits et sources datés, justification et confiance des notes, écarts à arbitrer.

### Commandes de validation

```bash
node --test tests/*.test.cjs
bash scripts/prepare-pages.sh
node tests/browser-smoke.cjs
```

`scripts/prepare-pages.sh` numérote aussi, dans l'artefact publié, les scripts et feuilles de style locaux avec l'identifiant du commit (`?v=…`) : un navigateur qui reçoit le nouveau HTML charge tous les nouveaux fichiers, sans mélanger deux versions pendant la durée du cache ; `scripts/verify-pages-live.cjs` vérifie cette numérotation en ligne. Le test navigateur requiert ses dépendances et Chromium (installés dans GitHub Actions). Les contrôles de production Pages sont définis par `.github/workflows/pages.yml`.

---

**Principe final : le référentiel protège le comportement délibéré, pas les erreurs anciennes. Chaque amélioration du moteur reste possible, mais aucune dérive silencieuse des règles, des données ou des sauvegardes n'est admissible.**
