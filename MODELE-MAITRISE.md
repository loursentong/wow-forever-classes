# Modèle de maîtrise et visualisations — bêta du 20 octobre 2026

## Objectif et périmètre

Le comparatif conserve **neuf classes, douze axes, les notes source sur 1–5, les quatre profils de pondération et le thème graphique initial**. Le nouveau sélecteur Débutant / Intermédiaire / Confirmé / Expert agit sur la **réalisation hypothétique** de certaines performances en jeu. Il n'ajoute pas un treizième axe aux 12 pondérations.

La différence conceptuelle est essentielle :

- **Technicité** (critère pondéré existant) = intérêt du joueur pour les classes exigeantes. Un joueur débutant peut parfaitement souhaiter apprendre une classe difficile.
- **Niveau de maîtrise** (nouveau réglage global) = aptitude courante à exécuter des mécaniques exigeantes. Il peut évoluer au fil du temps.
- **Score 0–100** = indice d'adéquation du profil ; il **n'est pas une probabilité de satisfaction, de victoire ou de performance**.
- **Notes de la matrice** = observations/projections éditoriales inchangées, servant de référence au niveau Confirmé. Elles ne sont pas un bilan objectif à tous les niveaux de maîtrise.

## Données et règles (hypothèses déclarées)

Les sources documentées dans [AUDIT-2026-10-20.md](AUDIT-2026-10-20.md), notamment les [descriptions officielles des classes de Blizzard](https://worldofwarcraft.blizzard.com/en-us/news/24301515) et les [limites des rotations optimisées par MythicSim](https://mythicsim.com/wow-forever/tier-list), éclairent **quels** aspects demandent de la maîtrise. En revanche, **aucune donnée disponible ne quantifie leurs pentes par niveau de joueur**. Les coefficients ci-dessous sont des conventions éditoriales et non des résultats d'étude.

Pour chaque classe et critère, nous déclarons une **sensibilité d'exécution** entière entre 0 (très peu sensible) et 3 (très sensible).

| Classe | Tank | Soin | DPS | BG | Duel/sauvage | Contrôle | Survie | Solo |
| --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| Guerrier | 2 | 0 | 2 | 2 | 3 | 2 | 2 | 2 |
| Paladin | 1 | 2 | 2 | 1 | 2 | 1 | 1 | 1 |
| Chasseur | 0 | 0 | 3 | 2 | 2 | 2 | 2 | 0 |
| Voleur | 0 | 0 | 3 | 2 | 3 | 3 | 3 | 2 |
| Prêtre | 0 | 2 | 2 | 2 | 2 | 2 | 2 | 2 |
| Chaman | 1 | 2 | 3 | 2 | 3 | 1 | 2 | 2 |
| Mage | 0 | 0 | 2 | 2 | 3 | 3 | 3 | 2 |
| Démoniste | 0 | 0 | 2 | 2 | 3 | 3 | 2 | 2 |
| Druide | 3 | 3 | 3 | 3 | 3 | 3 | 3 | 3 |

Les catégories **Polyvalence, Mobilité, Utilité, Technicité** restent inchangées à tout niveau : nous ne modifions pas artificiellement l'accès aux rôles, les sorts existants, la mobilité structurelle ni l'envie de difficulté.

Le cas du Chasseur illustre le découplage : le leveling solo assisté par familier est accessible, tandis que les rotations DPS utilisant le `melee weaving` sont exigeantes et leur faisabilité en raid n'est pas encore confirmée. Le Druide combine plusieurs modes de jeu et demandes d'exécution. Ces appréciations qualitatives sont plausibles ; **leur codage numérique n'est pas encore validé par télémétrie**.

### Fonction mathématique exacte

Soit `r(c,a)` la note de référence (1–5), `L(c,a)` la sensibilité (0–3) et `d(s)` l'ajustement du niveau choisi :

| Niveau | Ajustement d(s) |
| --- | ---: |
| Débutant | -0,40 |
| Intermédiaire | -0,18 |
| Confirmé | 0,00 |
| Expert | +0,12 |

`note_réalisée(c,a,s) = r(c,a)` quand la note vaut 1 ou quand la sensibilité est nulle.

Sinon : `note_réalisée(c,a,s) = min(5, max(1, r(c,a) + d(s) × L(c,a)))`.

`indice(c,s) = arrondi[100 × somme_a(poids(a) × note_réalisée(c,a,s)) / (5 × somme_a poids(a))]`.

Cas particulier : somme des poids nulle ⇒ indice 0 pour toutes les classes. Les notes ne peuvent jamais dépasser 5, et les classes ne reçoivent jamais de rôle absent de leur kit.

**Par construction**, le niveau Confirmé donne exactement les scores de l'ancienne version. Un niveau supérieur n'inverse jamais la performance d'une classe donnée (monotonie), mais peut changer son ordre par rapport aux autres.

L'augmentation du score pour un Expert n'est **pas** un bonus de dégâts mesuré ni une récompense mécanique liée au niveau de difficulté ; elle représente seulement l'incertitude sur l'accès au potentiel des axes sensibles. Le choix d'un ajustement positif plus petit que les malus s'appuie sur l'idée que les notes de départ décrivaient déjà un potentiel relativement élevé. Ce calibrage est révisable.

### Exemple sur le preset Ton profil

| Niveau | 1re classe | 2e classe | Classement complet calculé sur les neuf classes |
| --- | --- | --- | --- |
| Débutant | Paladin 70 | Druide 64 | Paladin 70, Druide 64, Prêtre 59, Démoniste 59, Chaman 57, Guerrier 56, Chasseur 54, Voleur 48, Mage 47 |
| Intermédiaire | Paladin 74 | Druide 73 | Paladin 74, Druide 73, Démoniste 65, Prêtre 64, Chaman 63, Guerrier 62, Chasseur 59, Voleur 54, Mage 53 |
| Confirmé | Druide 80 | Paladin 78 | Druide 80, Paladin 78, Démoniste 70, Prêtre 68, Chaman 68, Guerrier 67, Chasseur 63, Voleur 60, Mage 58 |
| Expert | Druide 85 | Paladin 79 | Druide 85, Paladin 79, Chaman 72, Prêtre 71, Démoniste 71, Guerrier 70, Chasseur 65, Voleur 62, Mage 61 |

Ces classements sont des **simulations illustratives de maîtrise**, pas des probabilités ni des prédictions validées. Des écarts de 1 à 3 points ne sont pas forcément discriminants.

## Visualisations implémentées

### 1. Progression selon la maîtrise

- Courbes des trois meilleures classes pour les **pondérations et le niveau actuellement sélectionnés**.
- Abscisses : les quatre niveaux ; ordonnées : indice d'adéquation sur 100 (jamais DPS).
- Trait vertical : position de maîtrise sélectionnée ; légende avec noms et couleurs des classes.
- Valeurs numériques disponibles dans un tableau HTML repliable sous le graphique.
- SVG natif : aucune bibliothèque ni ressource graphique externe.

### 2. Pourquoi une classe devance l'autre

- Comparaison initiale des deux premières classes du classement ; les utilisateurs peuvent sélectionner manuellement n'importe quelle paire.
- Chaque barre est un écart **en points d'indice** non arrondis sur un axe pondéré : `100 × poids(a) × [note_réalisée(A,a)-note_réalisée(B,a)] / (5 × somme_poids)`.
- Une barre positive avantage la classe A, une barre négative la classe B ; les contributions sont triées par valeur absolue.
- La somme des contributions égale l'écart de score **avant arrondi**. Les écarts après arrondi peuvent différer de 1 point.
- Les axes de poids nul ne figurent pas ; lorsque tous les poids sont nuls, le graphique affiche une explication.
- Ces contributions ne sont **pas des causes de victoire** : elles expliquent le fonctionnement d'un modèle de préférences.

## Persistance et compatibilité

- Clef existante `wf-overview-weights` conservée. Lecture validée : poids entiers 0 à 3 ; entrées corrompues ignorées.
- Nouvelle clef `wf-overview-skill` validée contre les quatre noms de niveau ; valeur absente ou invalide ⇒ Confirmé.
- Aucune dépendance réseau ou framework ajoutée à la page ; calcul entièrement local et immédiat.
- Les boutons sont utilisables au clavier et portent un état `aria-pressed` ; les courbes disposent de descriptions SVG et d'un tableau numérique alternatif.
- CSS additionnel encapsulé sous les nouveaux sélecteurs de classe ; les styles initiaux n'ont pas été modifiés.

## Limites connues et futures étapes de calibration

1. Le niveau de maîtrise est **global**, non propre à chaque classe, spécialisation ou mode PvE/PvP.
2. La sensibilité par axe est estimée **au niveau classe** ; des spécialisations d'une même classe peuvent avoir des planchers et plafonds très différents.
3. Les ajustements constants par niveau n'ont pas été calibrés à partir de journaux de raid ou d'échantillons de joueurs.
4. Les situations réelles (fights longs, adds, move, ennemis mobiles, latence, équipe, équipements et compositions) peuvent inverser les résultats.
5. Après le lancement, mesurer séparément niveau moyen, dispersion et potentiel haut niveau pour chaque **spécialisation × mode de jeu**, définir des indicateurs observables, puis remplacer les sensibilités éditoriales par des estimations avec intervalle d'incertitude.
6. Garder la valeur Confirmé stable ou expliquer toute rupture d'échelle lors de la migration des données ; versionner tout recalibrage.
7. Vérifier contraste, lisibilité mobile, clavier et lecteurs d'écran dans de vrais navigateurs avant fusion.

## Reproduction et tests

La suite `tests/skill-matching.test.cjs` utilise seulement les modules standards de Node. Exécution : `node --test tests/skill-matching.test.cjs`.

Le test couvre la conservation des scores initiaux, les quatre presets, la monotonie, les axes invariants, les classes sans rôle, l'état vide, les valeurs locales corrompues, les interactions, les choix persistés et les représentations de données. La vérification programmatique ne remplace pas une inspection visuelle multi-navigateurs.

## Décision éditoriale

Publication sous pull request de révision, sans modification de la branche `main` avant contrôle. Les visuels doivent aider à comprendre et comparer, pas conférer aux hypothèses le statut de vérité statistique.
