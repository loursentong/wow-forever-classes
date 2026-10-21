# Écarts à arbitrer

> Base de connaissances du 2026-10-21, moteur `1.0.3-exploratoire`. Aucune valeur n’a été changée : chaque écart attend une décision.
> Pour chaque ligne : **garder** (la note reste, en confiance faible) ou **changer** (nouvelle valeur dans le moteur,
> avec une nouvelle photographie de référence, comme pour les révisions précédentes).

| # | Configuration | Critère | Actuel | Proposé | Priorité | Constat |
|---|---|---|---|---|---|---|
| e1 | Chaman Élémentaire | Donjons et raids | 3 | 2 | haute | Dernier DPS simulé au niveau 60 (49 %), 13 points sous la configuration suivante. |
| e2 | Démoniste Destruction | Donjons et raids | 4 | 3 | moyenne | 68 % en simulation, sous l’Ombre (71 %) notée 3. Amélioration, à 68 % aussi, reste à 4 grâce à ses totems de raid ; la Destruction n’a pas cet argument. |
| e3 | Voleur Combat | Donjons et raids | 4 | 3 | moyenne | 65 % en simulation (17e), sous l’Ombre notée 3. Seule l’intention de Blizzard de faire du Voleur le meilleur DPS monocible soutient le 4 : à garder si tu veux parier sur les ajustements annoncés. |
| e4 | Paladin Protection | Donjons et raids | 4 | 3 | moyenne | Menace simulée la plus faible des trois tanks (67 % de l’ours, groupe C), alors que Guerrier (85 %) est à 5 et l’ours (100 %) à 4. Survie non simulée. |
| e5 | Druide Farouche (félin) | Contrôle | 3 | 2 | moyenne | Ni interruption ni ralentissement en félin ; Blizzard décrit un contrôle plus faible et moins fiable. Le Paladin, sans interruption ni ralentissement non plus, est à 2. |
| e6 | Druide Restauration | Contrôle | 3 | 2 | basse | Racines seulement, sans ralentissement, silence ni interruption ; Chaman Restauration (interruption et ralentissement) et Paladin Sacré (un seul étourdissement) sont à 2. |
| e7 | Druide Farouche (félin) | Dégâts de zone | 3 | 2 | basse | Aucun outil de zone cité en félin : « Swipe » est réservé à l’ours. |
| e8 | Mage Givre | PvP sauvage et duel | 5 | 4 | basse | Les quatre meilleurs Mages sont sortis au top 32 du tournoi de duel niveau 30, et Kami juge le Mage plus technique face à des classes plus mobiles. Preuve faible : niveau 30, format que Blizzard dit ne pas équilibrer. |
| e9 | Druide Équilibre | Dégâts de zone | 3 | 4 | basse | « Hurricane » n’a plus de recharge : un sort de zone répétable, comme le « Blizzard » du Mage (Givre et Feu à 5). Aucune mesure des dégâts de zone. |

## À surveiller, sans changement proposé

- **Paladin Protection** · Solo et farm : Kami la voit farmer sans difficulté ; Mobalytics classe le Paladin dernier (base Vanilla) et « Consecration » a été réduite le 16 octobre.
- **Mage (les trois)** · Solo et farm : Mobalytics classe le Mage S (base Vanilla), mais Blizzard a volontairement réduit le farm de zone en solo.
- **Voleur (les trois)** · Solo et farm : Classé A par Mobalytics (base Vanilla), sans soin personnel ; aucune source propre à Forever.
- **Voleur Assassinat** · PvP sauvage et duel : Noté 5 comme Finesse, mais Kami réserve son avis le plus fort à Finesse et le meilleur Voleur sort au top 16 du tournoi niveau 30.
- **Voleur Combat** · Résistance : Noté au-dessus d’Assassinat et Finesse grâce à « Deflection », alors que Kami juge sa survie la plus limitée une fois découvert.
- **Druide Farouche (ours)** · Donjons et raids : Menace simulée la plus haute (100 %), mais ne bloque ni ne pare ; survie non simulée.
- **Druide Restauration** · Donjons et raids : Blizzard juge sa boîte à outils plus limitée que celle du Prêtre ; aucun comparatif chiffré entre soigneurs.
- **Chaman Amélioration** · Donjons et raids : 68 % en simulation comme la Destruction ; gardé à 4 pour ses totems de raid.
- **Guerrier Armes** · Solo et farm : Noté sous Fureur sans qu’aucune source ne les sépare en solo.
- **Les cinq soigneurs** · Donjons et raids : Convention : les cinq soigneurs sont à 5 ; aucune donnée ne les départage encore.

Les appuis de chaque écart (identifiants de faits) sont dans `ecarts.json` ; les faits et leurs sources, dans `classes/` et `sources.json`.
