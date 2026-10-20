# CODEX — Contrat du moteur logique de WoW Forever Classes

> **Statut : référentiel normatif du comportement existant, v1 — 21 octobre 2026.**
> **Base figée :** commit de production `470fc92b607327ba7573307d1c00577ffc887208`, après la correction « DPS PvE = 100 partout ».
> **Périmètre :** algorithmes, hypothèses, données, sauvegardes, tests et gouvernance des évolutions.
> **Non-objectif :** déclarer le modèle scientifiquement validé, équilibrer arbitrairement les classes, garantir des performances en jeu ou figer à jamais les valeurs éditoriales.

## 0. Autorité et mode d'emploi

Ce document fait office de **contrat de référence** : tout changement de comportement du moteur doit être identifié, expliqué, testé et approuvé avant sa mise en ligne.

Les trois sources de vérité techniques sont :

1. `recommendation-engine.js` : moteur partagé, exécutable dans Node.js et dans le navigateur.
2. `index.html` → `window.__WF` : matrice historique **9 classes × 14 notes = 126 notes**, 15 préréglages et calcul historique conservé séparément.
3. `tests/fixtures/moteur-reference-v1.json` : **photographie immuable de la version de référence** (données et classements observés), vérifiée par `tests/codex-contract.test.cjs`.

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

**Invariants :** aucun doublon d'identifiant de configuration, aucune configuration sans classe, aucune note non finie/hors plage, aucun mélange des attributs de deux spécialisations dans une même évaluation, aucune modification silencieuse des 126 notes historiques.

### 1.2. Niveau de maîtrise

Index entier : **0 Débutant, 1 Intermédiaire, 2 Confirmé (référence), 3 Expert**. Toute valeur invalide retombe sur 2 pour les calculs qui le prévoient.

La modulation du moteur spécialisé suit, pour une activité `k` et une spécialisation `s` :

- Contexte PvE si `k = raid` ou `solo` ; sinon PvP.
- `delta = clamp(facteur[maîtrise] × charge_execution[s,contexte], -1.2, 0.35)`
- `facteur = [-0.29, -0.13, 0, +0.09]`
- `activite_ajustee = clamp(note_activite + delta, 1, 5)`
- Exception explicite : activité `solo` du **Chasseur** → `delta = 0` (hypothèse de facilité d'accès à son kit).
- Pour les styles `ctrl` et `surv`, le contexte d'exécution est PvP (`world`), pour les autres styles PvE (`raid`) ; la correction est `0.55 × delta`, puis bornée à `[1,5]`.

La maîtrise représente une **hypothèse de réalisation du potentiel** ; elle ne mesure ni le niveau réel du joueur ni un bonus de DPS universel. Le **goût pour la complexité** est un critère distinct.

## 2. Parcours « Être guidé » — API et contrat

### 2.1. Entrée et normalisation

API : `sanitize(profile)`, `ranking(profile)`, `recommend(profile)`.

Six dimensions répondables, toutes facultatives :

| Dimension | Forme | Choix/particularité |
| --- | --- | --- |
| Rôles | ensemble `dps/tank/soin` | plusieurs, contrainte explicite `rolesStrict` |
| Activités | ensemble `raid/bg/world/solo` | plusieurs |
| Portée | `any/distance/melee/mixte` | préférence ou contrainte explicite |
| Styles | ensemble des six qualités | **3 choix maximum** |
| Familiers | `any/like/avoid` | `avoid` peut être strict |
| Difficulté souhaitée | `any/simple/complex` | distincte de `mastery` |

Certitude **entière de 0 à 5**, attachée à chaque choix exprimé. Les données invalides ou corrompues sont nettoyées (sélections hors catalogue ignorées, maîtrise hors plage ramenée au défaut, styles limités à trois).

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
- Familier `avoid` strict : les configurations à familier **obligatoire** (`core`) sont exclues ; un familier `optional` reste autorisé.
- Les préférences souples, même très affirmées, **n'excluent jamais**.

Les contraintes contradictoires renvoient `status='no-match'`, **sans inventer de classe de remplacement**.

### 2.4. Valeur d'une spécialisation

Chaque dimension activée produit un `parts[dimension] = {value, weight}`. Coefficients de conception :

| Rôles | Activités | Portée | Styles | Familiers | Difficulté |
|---:|---:|---:|---:|---:|---:|
| 0,25 | 0,25 | 0,15 | 0,20 | 0,10 | 0,05 |

**Rôles :** si un seul rôle est demandé, une configuration du rôle correspondant reçoit la valeur brute `0,25 + 0,75 × roleSuitability(s, mastery)` ; toute autre configuration reçoit **0**, avant l'atténuation par certitude. Pour plusieurs rôles, la valeur brute mélange **65 % de couverture de tous les rôles par la classe** et **35 % d'adéquation à celui de la spécialisation** ; aucune polyvalence n'est récompensée lorsque le joueur ne la demande pas.

**Activités et styles :** moyenne des adéquations normalisées `(note_ajustée − 1)/4` de leurs choix, après la fonction de certitude. Sélectionner trois styles ne multiplie pas le poids total du domaine.

**Portée :** adéquation brute `1` pour le type souhaité, `0,12` pour l'autre ; le choix `mixte` vaut `1` si la classe peut alterner selon les rôles demandés, sinon `0,28`.

**Familier :** `like` donne `1` pour `core`, `0,76` pour `optional`, `0,1` pour `none`. `avoid` donne `1` pour `none`, `0,78` pour `optional`, `0,05` pour `core` avant tout veto strict.

**Difficulté souhaitée :** la charge moyenne `L = (charge_pve + charge_pvp)/2` devient `(5−L)/4` pour `simple` et `(L−1)/4` pour `complex`.

Le score **par spécialisation** normalise les **seuls domaines renseignés** :

```text
score_brut = Σ_d [ valeur_d × coefficient_d ] / Σ_d [ coefficient_d ]
score_affiché = arrondi(100 × score_brut, 2 décimales)
```

### 2.5. Sortie et égalités

- `unanswered` : aucune dimension renseignée, **aucun classement**.
- `no-match` : toutes les configurations sont éliminées, **aucun classement**.
- `ok` : configurations admissibles triées par score décroissant, puis identifiant de spécialisation pour stabiliser les égalités ; **une seule meilleure configuration par classe** ; jusqu'à neuf classes.
- `compatible` = nombre de **configurations** admissibles avant dédoublonnage, **pas** nombre de classes.
- `recommend()` propose **au plus trois classes distinctes** avec points forts/compromis, et des scénarios de sensibilité.

### 2.6. Sensibilité (et ce qu'elle ne signifie pas)

Les choix de certitude **≤ 2** sont successivement retirés **un par un** et les classements recalculés. La stabilité exprimée est un décompte interne d'apparitions dans le top 3 des scénarios admissibles ; **ce n'est pas une probabilité statistique**. Ne pas annoncer « 90 % de chances d'aimer cette classe » à partir de ce dispositif.

Les résultats apparaissent **uniquement sur demande** dans l'interface : l'algorithme peut recalculer instantanément, mais ne doit pas forcer l'affichage du top 3 après une première réponse.

## 3. Parcours « Régler mes priorités » — API et contrat

### 3.1. Entrée

API : `sanitizeWeights(weights)`, `priorityRanking(weights, mastery)`.

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

Le score de classe est celui de **la meilleure configuration cohérente**, sans combiner le tank d'une spé avec le burst d'une autre. **Les neuf classes** figurent au classement (même lorsqu'une classe répond mal aux critères). Les égalités sont stabilisées par nom de classe en locale française.

### 3.3. Signification du brut par axe

- **Rôles :** une configuration ne rapporte des points pour `tank/soin/dps` que si `s.role` correspond. Sa valeur n'est **plus un booléen 1/0** : elle vaut `roleSuitability(s,m)`.
- **Activités :** `(adjustedActivity(s, contexte, m) − 1)/4`.
- **Styles :** `(adjustedStyle(s, qualité, m) − 1)/4`.
- **Polyvalence :** `(nombre_de_rôles_distincts_de_la_classe − 1)/2`, **uniquement si `poly > 0`**.
- **Technicité :** `clamp(((charge_pve + charge_pvp)/2 − 1)/4, 0, 1)`, **uniquement si `tech > 0`**. C'est une préférence pour l'exigence, **pas une puissance intrinsèque**.

**Interdictions fonctionnelles :** compter Tank/Soin/DPS comme trois primes indépendantes au généraliste ; donner 100 à toutes les classes pour « DPS PvE » simplement parce qu'elles possèdent un DPS ; afficher des performances réelles supposées sans mesures.

### 3.4. Adéquation aux rôles — formule critique

Depuis le correctif du 21 octobre 2026, le moteur utilise deux données éditoriales :

```text
référence_classe = (note_historique_classe_pour_le_rôle − 1)/4
potentiel_spé = (adjustedActivity(spé, 'raid', maîtrise) − 1)/4
roleSuitability(spé, maîtrise) =
  clamp(0,55 × référence_classe + 0,45 × potentiel_spé, 0, 1)
```

Les notes historiques sont issues de `ROLE_REFERENCE`, qui **DOIT rester égal** aux colonnes `tank/soin/dps` de `window.__WF.classes[].r` ; cette égalité est vérifiée par tests. Une configuration hors rôle apporte **0** à cet axe.

La composante `raid` est un **proxy éditorial d'adéquation PvE**, non une mesure de DPS, HPS, menace ou rang de tier list. Elle concerne actuellement aussi l'adéquation Tank/Soin. Toute évolution vers des mesures par spécialisation **requiert un changement de modèle documenté**.

### 3.5. Aucune neutralité statistique implicite

« Tous les critères » constitue un **profil éditorial défini**, pas une position neutre. La somme pondérée peut naturellement privilégier un généraliste lorsque l'utilisateur sélectionne de nombreuses qualités. Ne pas forcer neuf classes à gagner chacune 11,1 % des profils simulés. **Les statistiques de fréquence de victoire sont des outils d'audit, jamais des objectifs du moteur**.

Aucun classement sans critère exprimé. Aucun quota de classes. Aucun ajustement de données pour faire gagner une classe déterminée.

## 4. Le comparateur documentaire historique est un troisième calcul distinct

`index.html` conserve `window.__WF`, les **126 notes**, les courbes et le classement historique. Son score descriptif n'est **pas** le score du moteur spécialisé.

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
| `wf-recommend-v1` | questionnaire | profil nettoyé, certitudes, exigences et maîtrise |
| `wf-reco-mode-v1` | choix du parcours | `guided` ou `priorities` |
| `wf-priority-custom-v1` | priorités | sauvegarde **explicite** `{weights, mastery}`, rappel possible |
| `wf-overview-v3` | comparateur historique | poids actifs `w`, maîtrise `m`, surlignage `hl`, critères personnalisés `c` |
| `wf-overview-theme` | apparence | choix du thème |

Compatibilité historique : le comparateur sait migrer `wf-overview-v2`, `wf-overview-weights` et `wf-overview-skill` ; le parcours priorités sait réimporter `wf-overview-v3.c` si aucune sauvegarde personnalisée moderne n'est disponible.

La maîtrise est synchronisée entre les deux parcours via les interfaces existantes ; **ne pas lier les poids de priorités aux réponses guidées**.

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

`tests/codex-contract.test.cjs` compare le moteur et les données **directement** à cette photographie. Elle n'est **pas un jeu d'entraînement**, ni une preuve de justesse du gameplay : c'est un dispositif de **détection de changements**.

Les valeurs et les égalités observées dans cette photographie appartiennent à la version de référence. Si une source Blizzard apporte ultérieurement des données vérifiées modifiant une note, il peut être **correct** que les tests échouent : ils exigent alors une décision explicite et une nouvelle version documentée.

### 6.2. Tests de propriétés indépendants des instantanés

En complément, maintenir :

- Inventaire : 9 classes, 28 configurations, 126 notes, 14 axes, 15 préréglages, 4 maîtrises.
- Bornes et finitude : scores normalisés 0…100 ; notes 1…5 ; aucune valeur `NaN` ou infinie.
- Déterminisme pour une entrée et un référentiel identiques ; immutabilité des entrées.
- `unanswered` pour l'absence de choix ; `no-match` pour des veto réellement incompatibles.
- **Exigences strictes satisfaites** par chaque configuration retournée ; une préférence souple ne peut jamais devenir un veto.
- Certitude 0 ≠ suppression et certitude 5 ≠ filtre implicite.
- Au plus 3 classes dans le guide ; exactement 9 classes distinctes en priorités dès qu'un axe est actif.
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

À chaque patch significatif du jeu : vérifier les descriptions officielles, inventorier les changements de spécialisations, citer les données disponibles et distinguer faits vérifiés / simulations / opinions ; ne mettre à jour les notes qu'avec un motif vérifiable.

### Commandes de validation

```bash
node --test tests/*.test.cjs
bash scripts/prepare-pages.sh
node tests/browser-smoke.cjs
```

Le test navigateur requiert ses dépendances et Chromium (installés dans GitHub Actions). Les contrôles de production Pages sont définis par `.github/workflows/pages.yml`.

---

**Principe final : le référentiel protège le comportement délibéré, pas les erreurs anciennes. Chaque amélioration du moteur reste possible, mais aucune dérive silencieuse des règles, des données ou des sauvegardes n'est admissible.**
