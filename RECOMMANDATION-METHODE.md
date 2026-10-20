# Moteur de recommandation — spécification et limites

**État : 20 octobre 2026. Modèle exploratoire, non calibré au niveau 60.**

Le nouveau parcours de six questions est distinct du comparatif historique à 14 critères. Ce dernier, ses 15 préréglages, les 9 classes et les notes existantes restent accessibles. Le nouveau moteur ne prend jamais les meilleures notes de toutes les spécialisations d'une classe pour les additionner.

## Données

Le fichier recommendation-engine.js décrit **27 spécialisations et une configuration Farouche Ours**, soit 28 configurations jouables. Les rôles, la portée et les possibilités de familiers sont rattachés aux fiches officielles Blizzard, dont https://worldofwarcraft.blizzard.com/en-us/news/24301515 et https://worldofwarcraft.blizzard.com/en-us/news/24310968 . La mention « familier optionnel » indique une possibilité de build et non des performances égales sans familier.

Les activités (raids, BG, PvP sauvage, solo), les six qualités de style et la difficulté d'exécution reçoivent des évaluations éditoriales sur 1–5. Elles sont **hypothétiques**, non mesurées sur des joueurs de niveau 60. Chaque configuration possède une référence officielle pour les éléments structurels, mais cette référence **ne valide pas les notes numériques éditoriales**.

## Saisie

1. Rôles (DPS, tank, soin), plusieurs choix et possibilité explicite d'exiger tous les rôles.
2. Activités (raids/donjons, BG, PvP sauvage/duel, solo/farm), réponses multiples.
3. Portée (distance, mêlée, alterner, indifférent), préférence souple ou exigence absolue.
4. Styles (burst, zone, contrôle, survie, mobilité, soutien), trois choix maximum.
5. Familiers (aimer, éviter, indifférent), avec option de refus strict des configurations nécessitant un familier.
6. Niveau de maîtrise actuel (quatre niveaux) et complexité recherchée, indépendants.

Toute réponse retenue comporte une certitude entière entre **0 (intuition)** et **5 (certain)**. Il ne s'agit pas d'un pourcentage de probabilité. Un rôle à 0/5 n'exclut pas automatiquement les autres ; **seule une exigence expressément déclarée** élimine une configuration. Les questions laissées sans réponse n'ajoutent aucun score. Si aucune préférence n'est donnée, aucun classement n'est affiché. Si les exigences s'excluent mutuellement, le moteur signale qu'aucune configuration n'est compatible.

Les réponses sont enregistrées dans le navigateur sous la clé wf-recommend-v1, distincte des sauvegardes du comparateur historique.

## Calcul explicite

Chaque domaine effectivement répondu contribue au score avec un poids de conception : rôles **0,25**, activités **0,25**, portée **0,15**, styles **0,20**, familiers **0,10**, complexité **0,05**. Les poids sont renormalisés sur les domaines actifs. À l'intérieur des questions multiples, les réponses sont moyennées : trois styles sélectionnés ne triplent donc pas leur importance.

Pour une adéquation brute a entre 0 et 1 et une certitude c dans 0…5 :

- intensité(c) = 0,25 + 0,75 × c / 5 ;
- adéquation(c) = 0,5 + intensité(c) × (a − 0,5).

Une certitude 0 atténue donc une préférence sans l'effacer ni la transformer en veto. La certitude ne doit pas être confondue avec l'importance ; cette première version conserve des poids explicites de conception, qui devront être calibrés sur des observations. Les notes de style et d'activité sont légèrement modulées par la maîtrise en fonction de la configuration et du contexte PvE/PvP.

Les exigences strictes sont vérifiées **avant le calcul**. Quand plusieurs rôles sont demandés, la couverture de la classe ne compte que parce que ce changement de rôle a été explicitement exprimé. Un seul rôle demandé ne rapporte aucun bonus de polyvalence.

## Restitution et robustesse

Le résultat propose trois classes distinctes au maximum, chacune avec **une spécialisation précise**, des correspondances, des compromis et un lien vers sa fiche officielle. Le score sur 100 est un **indice éditorial d'adéquation**, pas une probabilité.

Chaque réponse à certitude ≤2 entraîne un scénario déterministe où cette réponse est temporairement retirée. L'indication de stabilité du top 3 est une **fréquence interne aux scénarios explorés**, pas une probabilité prédictive. Cette méthode est locale et limitée aux suppressions une à une : elle ne modélise pas toutes les évolutions possibles de l'avis du joueur.

## Vérification et diffusion

Commande : node --test tests/*.test.cjs

La CI exécute les tests historiques et la nouvelle suite. Les contrôles couvrent notamment : inventaire et sources, données valides, cas indécis/contradictoires, exactitude des filtres stricts, certitude 0, monotonie, rôles et configurations Farouche, cas de référence indépendants, calculs bornés/déterministes et **12 000 profils générés reproductibles**.

Les profils générés ne représentent **pas** statistiquement la communauté : aucune part de première place par classe n'est une cible de validation. Les cas de référence doivent être confrontés à des spécialistes indépendants. Une inspection réelle de la page (mobile, clavier, contrastes, lecteurs d'écran) demeure indispensable.

Évolutions futures : mesurer les performances par spécialisation et activité après lancement, documenter tailles d'échantillon et incertitudes, calibrer les poids par une étude d'utilisateurs consentants, et versionner les données après chaque patch.
