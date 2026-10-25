# DPS en PvE de groupe — référence v15

Décision du responsable du projet le 25 octobre 2026 : **75 % monocible et 25 % zone**. Intégration préparée pour revue ; publication à valider séparément. Base : production `09c90cc35c3b6f411051df11ebc1600d31e8f680`, moteur précédent 1.4.0, nouvelle version 1.5.0-exploratoire.

## Comportement retenu

Dans l'activité existante **Donjons et raids**, une configuration DPS est évaluée sur la synthèse :

`repère = 0,75 × note monocible + 0,25 × note de zone`

Les deux notes viennent de la même configuration, y compris pour une variante sans familier. La maîtrise PvE s'applique ensuite **une seule fois** à cette synthèse, avec les coefficients et les bornes existants. Aucun nombre de cibles ne multiplie une note. À maîtrise Confirmé, Survie passe de ses repères 5 et 3 à 4,5/5 ; Feu de 4 et 5 à 4,25/5.

Cette règle est commune aux vingt spécialisations DPS et à leurs variantes. Aucun réglage supplémentaire n'est demandé au joueur. Les activités ne sont pas séparées en deux questions : la synthèse s'applique à l'intitulé groupé actuel, aussi bien dans le parcours guidé que dans le mode personnalisé. Ce choix généraliste ne décrit pas chaque boss ou chaque donjon.

Le critère facultatif **Dégâts de zone** ajoute l'envie explicite du joueur de privilégier cette qualité. La zone contribue déjà au repère d'activité si ce critère n'est pas sélectionné. Les deux contributions sont corrélées volontairement : les poids des domaines restent ceux du modèle existant, sans prétention de calibration statistique.

## Cohérence du rôle et du départage

Le rôle DPS utilise la même synthèse après maîtrise dans le contexte PvE de groupe. Il n'y ajoute plus les 55 % de référence monocible de classe de l'ancienne formule : cette référence pouvait venir d'une autre spécialisation et aurait réintroduit un avantage monocible dans un repère désormais composite. Les règles de couverture des rôles multiples et la transformation de l'adéquation en score restent inchangées.

Les rôles Tank et Soin gardent leur formule et leurs notes. Les profils uniquement PvP, uniquement solo, ou mêlant ces activités sans PvE de groupe gardent leurs scores et leur ordre. Sans activité précisée, le rôle et le départage de repli emploient le nouveau repère de groupe, toujours signalé comme provisoire dans l'interface. Cela peut modifier des égalités dans les profils sans activité.

Les 28 configurations, leurs variantes, les 126 notes historiques, les grilles de complexité, les notes sources et les sauvegardes sont conservées. La matrice et les fiches désignent explicitement le repère source comme **monocible PvE** ; elles distinguent la zone et expliquent la synthèse utilisée par l'activité. La répartition et sa formule ne sont affichées ni dans les résultats ni dans les fiches ou la méthode destinées aux joueurs. Seul le détail habituel des contributions au score reste dans son volet facultatif. Une baisse due à la maîtrise doit être décrite comme des réflexes à acquérir, sans devenir une faiblesse intrinsèque de la spécialisation.

## Portée des données

Le 75/25 est une **convention éditoriale d'aide au choix**, pas une part de dégâts mesurée. Les notes ordinales ne sont ni des DPS ni des pourcentages de performance. Elles n'établissent pas qu'un joueur ou une classe terminera devant un autre dans son groupe.

Le repère monocible s'appuie sur les projections MythicSim déjà documentées au niveau 60 ; la zone est un jugement éditorial. Les rapports de bêta et les classements communautaires examinés concernent le contexte du niveau 30 et ne valident pas quantitativement la synthèse au niveau 60. Plusieurs analyses reprennent Forever Logs : elles ne constituent pas autant d'échantillons indépendants. Aucun Mage Feu ne participait aux quatre rapports complets directement examinés ; leur lecture ne permet donc pas de comparer Feu et Chasseur. Aucune note ne change pour obtenir un vainqueur souhaité.

## Vérification reproductible

`node --test tests/*.test.cjs` : contrat actif v15, anciennes références conservées, calcul indépendant du 75/25, maîtrise et bornes, variantes, rôle, absence d'influence en solo/PvP, traces et explications. Le test de comparaison historique v2→v3 calcule désormais son potentiel avec sa formule figée, pour ne pas relire l'ancienne décision à travers le moteur actuel.

`node scripts/reference-v15.cjs rapport.json` : compare les 52 profils guidés et 127 classements personnalisés de la v14. Il vérifie séparément que les notes restent identiques, que les scores des configurations hors DPS restent identiques, et que les profils avec activités explicites sans PvE de groupe conservent leurs classements. La v15 ajoute quatre profils guidés et deux pondérations croisées. Le rapport détaille chaque changement de top ; un changement de première place n'est pas un objectif d'équilibrage.

La nouvelle photographie s'écrit uniquement avec `--fixture chemin-nouveau.json`, en création exclusive. Ne jamais écraser v1 à v14 ni régénérer pour masquer un échec.

`node tests/browser-smoke.cjs` : deux parcours, clavier, sauvegardes, mobile, fiches de sources et détail du repère monocible/zone.

Ces vérifications portent sur le respect de la décision et sur le fonctionnement de l'outil, pas sur les performances réelles au niveau 60.

Résultat des contrôles : 191 tests unitaires et de contrat réussis. Comparaison v14→v15 : 23/52 classements guidés modifiés (6 premières pistes), 62/127 classements personnalisés modifiés (11 premières pistes). Les 18 profils guidés et 59 classements personnalisés avec activités explicites sans PvE de groupe restent identiques.
