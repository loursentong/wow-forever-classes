# WoW Forever — modèle de maîtrise consolidé (20 octobre 2026)

## Principes

Cette version combine le plancher et le plafond distincts introduits dans la branche Claude et les contrôles de non-régression du modèle précédent. Elle porte sur neuf classes, quatorze axes et 126 notes source (Burst et Dégâts de zone ont été ajoutés le 20 octobre). **Les coefficients de maîtrise sont des hypothèses éditoriales, non des observations au niveau 60.** Le score 0–100 est un indice d'adéquation et non une probabilité de satisfaction, de victoire ou de performance.

Le **plancher** représente la difficulté d'accès aux performances, le **plafond** le potentiel de progrès supplémentaire. Deux paires sont définies par classe : une pour PvE (tank, soin, DPS, dégâts de zone, solo) et une pour PvP (BG, duel/sauvage, burst, contrôle, survie). Les axes polyvalence, mobilité, utilité et technicité restent invariants. Les notes 1 ne peuvent jamais acquérir de rôle absent.

| Classe | Plancher PvE | Plafond PvE | Plancher PvP | Plafond PvP |
| --- | ---: | ---: | ---: | ---: |
| Guerrier | 3 | 1 | 5 | 2 |
| Paladin | 2 | 1 | 2 | 1 |
| Chasseur | 2 | 2 | 3 | 1 |
| Voleur | 2 | 1 | 5 | 2 |
| Prêtre | 3 | 1 | 4 | 2 |
| Chaman | 3 | 1 | 4 | 1 |
| Mage | 3 | 1 | 5 | 2 |
| Démoniste | 3 | 1 | 4 | 2 |
| Druide | 4 | 1 | 5 | 2 |

### Exception contrôlée

**Chasseur solo/farm : plancher 1, plafond 0.** Le leveling avec familier reste accessible à un débutant, même si le DPS optimisé en raid repose sur une rotation exigeante de melee weaving. Un unique plancher PvE ne doit pas pénaliser automatiquement son leveling. Les autres activités restent régies par la paire PvE/PvP ; une évolution par spécialisation et activité demanderait des observations en jeu.

## Formule

Niveau de maîtrise, du débutant à expert :
- Pénalité : -0,40 / -0,20 / 0 / 0.
- Bonus : 0 / 0 / 0 / +0,25.

Pour un axe ajustable dont la note est supérieure à 1, la note réalisée est la note source + pénalité × (plancher - 1) + bonus × plafond, bornée entre 1 et 5. Pour les autres axes, la note réalisée égale la note source.

Score = 100 × somme(poids × note réalisée) / [5 × somme des poids], arrondi uniquement pour l'affichage. Si les poids sont tous nuls, le score vaut zéro. Au niveau **Confirmé**, pénalité et bonus sont nuls : les résultats historiques de Claude et de GPT-6 sont préservés.

Pour un Chasseur débutant, note DPS 5 avec plancher PvE 2 donne 4,6, mais sa note solo/farm demeure 5 ; au niveau expert, le DPS reste borné à 5. Les plafonds des classes ne sont pas nécessairement supérieurs quand les planchers sont plus élevés.

## Neutralité et accès universel

- Valeur par défaut : profil « Tout à égalité » et niveau Confirmé.
- Profils : Tout à égalité, Polyvalence, PvE d'abord, PvP d'abord, Tank en groupe, Soin en groupe, DPS en raid, Dégâts de zone, Soutien et mobilité, Champ de bataille, Soin en champ de bataille, PvP sauvage, Burst et mobilité, Contrôle, Solo et leveling. Règles : le critère qui donne son nom au profil pèse au moins la moitié des poids ; la Technicité (goût pour la difficulté) et la Polyvalence ne sont ajoutées à aucun profil d'activité ; chaque classe mène ou partage la tête d'au moins un profil au niveau Confirmé. Un préréglage change uniquement les quatorze poids et conserve le niveau de maîtrise choisi.
- Les neuf encarts « Pour toi » ont été remplacés par des indications génériques de style de jeu.
- Les visiteurs conservent leurs propres préférences localement ; les anciennes sauvegardes sont migrées lorsqu'elles sont valides. Une sauvegarde antérieure au 20 octobre reçoit 0 en Burst et en Dégâts de zone, ce qui conserve son classement et son profil, sauf si tous ses poids étaient égaux : les deux critères prennent alors ce même poids.
- La maîtrise se règle dans la même liste que les pondérations, sans axe ni poids supplémentaire. Elle adapte uniquement le classement et les courbes ; la matrice conserve toujours les 126 notes de référence, sans flèches ni notes ajustées.
- Les neuf courbes sont tracées, les utilisateurs choisissent lesquelles mettre en avant. Le tableau repliable restitue les 36 valeurs numériques.
- Le tableau PvE/PvP plancher/plafond est conservé. Chaque raison est abrégée et renvoie à la bibliographie entre crochets ; les sources décrivent les mécanismes, pas la valeur chiffrée des coefficients, qui reste éditoriale.
- Le bloc de duel de classes a été retiré. Le critère « Sauvage et duel », qui décrit une activité de jeu, est conservé.
- Le thème sombre reprend la palette Claude et devient le défaut, indépendamment du thème de l'appareil. Le visiteur peut choisir clair, sombre ou système ; ce choix est enregistré séparément des pondérations.

## Comparaison MythicSim

Source : https://mythicsim.com/wow-forever/tier-list , snapshot daté du 20 octobre 2026. Le classement actuel **en menace/s (TPS), avec bijoux**, est : Druide Ours 1 579 TPS, 1er A ; Guerrier Protection 1 349, 2e A ; Guerrier Fureur/Protection expérimental 1 152, 3e B ; Paladin Sacré/Protection expérimental 1 063, 4e C ; Paladin Protection 1 052, 5e C ; Paladin Vindicte/Protection expérimental 993, 6e C.

Claude avait observé d'autres valeurs, non reproduites par cette consultation. Ne jamais fusionner mesures avec/sans bijoux ou classement TPS et DPS sans tracer l'état exact de la page. **Le TPS mesure la menace, pas la résistance du tank.**

## Fiabilité, tests et limites

- Audit des sources : AUDIT-2026-10-20.md.
- Tests sans dépendance : commande node --test tests/skill-matching.test.cjs ; intégrés à GitHub Actions.
- La validation en vrai navigateur (responsive, contraste, accessibilité clavier, mode sombre/clair) doit compléter les tests JS simulés.
- Après lancement : remplacer les paramètres éditoriaux par mesures réelles par spécialisation, activité, composition et niveau de joueur, avec échantillons et intervalles d'incertitude.
- Les résultats de tournoi niveau 30 et les simulations statiques à 60 ne suffisent pas pour mesurer les performances réelles de toutes les activités.
