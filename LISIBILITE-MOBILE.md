# Remarques et lisibilité mobile — 25 octobre 2026

Base publiée : moteur 1.5.0, référence v15, commit `bf2e42f589c19385c93baeae98c93c5a7fd90bff` (PR #45, lisibilité mobile). Le suivi « Complexité et certitude » ci-dessous est en revue. Il concerne seulement la restitution : aucun score, coefficient, note, filtre, sauvegarde ou résultat de référence ne change.

## Remarques cohérentes

Une adéquation intermédiaire ne signifie pas qu'une spécialisation est incapable de faire l'activité. Les textes distinguent désormais le profil de référence, la maîtrise à acquérir et les hésitations du joueur. Pour la complexité, ils comparent explicitement l’envie du joueur à la difficulté retenue pour la spécialisation dans chaque contexte : « Plus simple que ton envie » ou « Plus technique que ton envie » si nécessaire. Une forte certitude sur « Exigeant » ne rend pas la spécialisation plus complexe ; la maîtrise Expert reste indépendante de cette préférence.

### Complexité et certitude — suivi en revue

Pour une spécialisation de difficulté intermédiaire (par exemple Fureur en PvE), les commentaires suivent la certitude du choix Accessible ou Exigeant :

| Certitude | Restitution |
| --- | --- |
| 0 à 2 | « Une piste compatible » : la préférence reste souple, cette difficulté peut convenir. |
| 3 à 4 | « Un peu plus technique » ou « Un peu plus simple », selon l’envie. |
| 5 | « Plus technique que ton envie » ou « Plus simple que ton envie ». |

La difficulté annoncée reste la même à toutes les graduations. Aux extrêmes, une préférence peu affirmée donne « À explorer », en indiquant explicitement que la spécialisation est accessible ou exigeante ; elle n’est pas automatiquement déclarée compatible. Les contextes PvE et PvP gardent leurs propres commentaires, y compris dans « À garder en tête ». Une préférence de difficulté peu affirmée n’y est pas présentée comme une incompatibilité.

Ces mots expriment une ouverture, sans transformer le score en accord parfait. La Technicité du mode personnalisé conserve sa lecture : son poids représente l’importance du critère, pas une certitude. Le niveau de maîtrise reste indépendant.

Pour les Chasseurs en PvE, le texte nomme le compromis concret : monocible fort, zone plus moyenne ou modeste selon la spécialisation. La maîtrise peut demander de la pratique ; elle ne transforme pas ce profil en faiblesse intrinsèque de classe. Une activité réellement moins bien évaluée garde son avertissement. Cette règle s'applique aux deux parcours et ne donne aucun avantage numérique à une classe.

Les mentions « Le point à regarder » sont réservées aux incompatibilités ou limites effectives. Le verdict général intermédiaire dit « Ça colle en partie » ; le verdict d'une activité adaptée ou d'un rôle approprié décrit ce constat, ou la pratique à acquérir. La formule interne reste absente des textes destinés aux joueurs.

## Sélections stables

Les curseurs de certitude et exigences ne s'ouvrent plus dans une carte de réponse. Ils s’affichent automatiquement sous l’ensemble des choix sélectionnés, sans volet à ouvrir ni mention « facultatif ». Une exigence déjà activée reste visible. Le focus revient au contrôle utilisé, sans déplacement automatique.

L'animation de hauteur du formulaire est supprimée. Le texte descriptif garde la même graisse avant et après sélection pour éviter un retour à la ligne supplémentaire sur les écrans étroits. Sélectionner « À distance » ou « J'aime les familiers » garde la position des autres cartes. Resélectionner la même réponse ne réinitialise plus sa certitude ou son exigence. Les anciennes sauvegardes restent compatibles.

## Mobile

- Onglets de parcours compacts une fois le parcours choisi ; étapes numérotées avec intitulés accessibles au lecteur d'écran.
- Question sur fond stable, transitions supprimées sur les réponses et panneaux mobiles, navigation et défilement des résultats sans animation.
- « Mes choix » replié et disponible à la demande. Navigation entre les étapes, modification des réponses et aperçu du classement conservés.
- Critères personnalisés regroupés dans des panneaux repliables ; le nombre de critères actifs reste affiché, y compris dans un groupe fermé. Fermer un groupe ne désactive aucun poids.
- Zones tactiles d'au moins 44 pixels pour les nouveaux contrôles ; explications des résultats sur une colonne.

## Vérification

`node --test tests/*.test.cjs` protège notamment la référence v15, les contextes PvE/PvP/solo, les sauvegardes et les nouvelles explications. `tests/remarques-claires.test.cjs` contrôle les trois Chasseurs sur les quatre maîtrises, les deux parcours, les avertissements réels et l'immutabilité des résultats.

`node tests/browser-smoke.cjs` vérifie les cartes et le défilement à la sélection, le focus, l'accès aux réglages affichés sous les choix, les exigences, les résumés et les groupes de priorités. Les tailles mobiles et les deux colonnes sont couvertes. Les captures permettent une revue visuelle avant publication.

Contrôles du suivi : 204 tests réussis ; contrôle Chromium complet réussi, avec stabilité des positions et du défilement à 320, 390 et 900 pixels, aperçu des deux parcours et vérification des sauvegardes. Les six graduations d’Accessible et d’Exigeant sont parcourues au clavier sur mobile pour Fureur en PvE ; le cas Expert, Exigeant au maximum et spécialisation intermédiaire reste couvert. Les tests vérifient aussi les contextes mixtes, les difficultés aux extrêmes et la séparation entre certitude et importance du mode personnalisé. L’artefact Pages est complet.
