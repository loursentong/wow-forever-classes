# Revue des classes du 31 octobre 2026

Les neuf classes ont été relues après les changements de client et les hotfixes du 30 octobre, disponibles dans les relevés du 31. Cette révision met à jour les données et leurs explications ; les formules, pondérations, sauvegardes et formats de partage restent les mêmes.

Moteur : `1.6.0-exploratoire`, référence active `tests/fixtures/moteur-reference-v16.json`. Base : `8d4066ef2f3973fe7f0b7f6ef060e0af988c3efd`, avec le coupon RestedXP déjà validé. Les références v1 à v15 sont conservées intactes.

## Ce que les sources établissent

Les [relevés de WoW Forever Talents](https://wowforevertalents.com/patch-notes/) et [ForeverChanges](https://foreverchanges.pro/fr/patch-notes) lisent les tables du client et le cache des hotfixes. Ils distinguent notamment les clients 70685 et 70707 et les modifications serveur du 30. Ce sont des données extraites, pas une note officielle Blizzard ni un test en jeu. Les deux sites et l'article de Kami qui reprend ces relevés ne forment pas trois mesures indépendantes de performance.

Les rangs appris et les talents actuels ont été comparés aux descriptions de la base. Les baisses d'un ancien dernier rang ne sont pas assimilées à une baisse au niveau 60 lorsque le jeu ajoute un rang supérieur. En particulier : pas de division par deux des bonus maximum du Chasseur, ni de faux nerf du maximum de Morsure féroce ou de Soins de lien. Le rang de Bouclier sacré à 221 dégâts n'a pas de niveau d'apprentissage confirmé dans le relevé courant : son accès reste incertain.

Les fiches corrigent aussi des descriptions antérieures devenues inexactes : suppression de Berserk et du Salut, soins du Druide, mécanismes de Vindicte et Protection, recharge de Javelot, Combustion à trois critiques non périodiques, accès de Soins de lien et portée des outils de contrôle.

## Repères DPS actualisés, même barème

La [photographie MythicSim consultée le 31 octobre](https://mythicsim.com/wow-forever/tier-list) donne une référence Survie à 1 253 DPS. Les cartes documentent notamment les hotfixes 113531 et 113554. Chaque spécialisation est re-simulée séparément ; la date du moteur ne suffit pas à garantir celle d'un résultat.

Contexte : niveau 60, boss 63 unique, deux minutes avec variation de quinze secondes, 10 000 itérations, buffs et consommables de raid, sans world buffs. Chaque preset a ses propres talents, race, équipement et paire de bijoux. Ce sont des références expérimentales, pas des personnages équipés à l'identique ni des performances constatées en jeu.

Le barème existant est conservé : 5 à partir de 86 % de la référence, 4 à partir de 72 %, 3 à partir de 55 %, 2 en dessous. Les ratios non arrondis déterminent la note. Les valeurs et les choix de builds sont conservés dans `connaissances/revisions/2026-10-31.json`.

| Configuration | Repère retenu | Note précédente | Nouvelle note |
| --- | --- | ---: | ---: |
| Guerrier Armes | 832 DPS, 66,4 % | 4 | 3 |
| Guerrier Fureur | 976 DPS, 77,9 % | 5 | 4 |
| Paladin Vindicte | 889 DPS, 71,0 % | 4 | 3 |
| Chasseur Maîtrise des bêtes, tir à distance | 768 DPS, 61,3 % | 4 | 3 |
| Chasseur Précision, tir à distance en Loup solitaire | 866 DPS, 69,1 % | 4 | 3 |
| Mage Arcane | 872 DPS, 69,6 % | 4 | 3 |
| Démoniste Affliction | 888 DPS, 70,9 % | 4 | 3 |
| Druide Farouche félin | 849 DPS, 67,8 % | 4 | 3 |

Les douze autres configurations DPS restent dans leur tranche. Une baisse de note relative ne prouve pas une baisse absolue de dégâts : le félin progresse dans cette simulation tout en reculant par rapport à la nouvelle référence. Aucun chiffre de sort isolé ne sert de multiplicateur de performance.

Maîtrise des bêtes et Précision sont évaluées sur leurs presets qui restent à distance, cohérents avec leur difficulté. Survie conserve son alternance tirs/mêlée et sa charge de placement. Les variantes sans familier n'ont pas de nouvelle mesure dédiée : leurs notes héritées restent des hypothèses du modèle existant, pas une égalité de rendement démontrée.

## Autres jugements révisés

- Félin : burst 5 → 4, parce que Berserk fondait explicitement l'ancien 5. L'ampleur PvP reste un jugement prudent, sans pourcentage de dégâts inventé.
- Vindicte avec Unsealed Wrath : rotation PvE 0 → 1 ; total 2 → 3 et difficulté 1 → 2, d'après la grille commune.
- Givre : entretien PvE 0 → 1 ; total 3 → 4, difficulté conservée à 2.
- Restauration Druide : placement PvE 0 → 1 avec Wild Growth incanté ; total 5 → 6, difficulté conservée à 3.

La matrice de classe suit automatiquement ses meilleures spécialisations : DPS Guerrier 5 → 4, DPS Paladin 4 → 3, DPS Druide 4 → 3 et burst Druide 5 → 4. Elle ne constitue pas une seconde évaluation indépendante.

## Notes conservées et inconnues

Les autres notes de gameplay, les profils de soin et les variantes sont conservés après examen. Les cinq soigneurs gardent 5 en raid par convention faute de comparaison HPS exploitable ; cela ne prouve pas une égalité de puissance. Les tanks conservent leurs repères de kit, en confiance faible pour leur place relative : une mesure de menace ne mesure pas leur survie.

Le PvP au niveau 60, le soin comparé, la survie des tanks, la tenue du tissage et certaines interactions de talents restent à confirmer après ouverture. La consommation exacte de Swiftmend et l'accès au rang supérieur de Bouclier sacré sont notamment signalés dans leurs fiches. Les anciennes simulations et les guides de niveau 30 sont datés et ne sont plus présentés comme des validations des nouveaux talents.

## Effet sur les recommandations et vérification

La comparaison conserve les 56 anciens profils guidés et les 133 situations personnalisées de la référence v15 : 27 profils guidés changent, dont 9 premières places ; 97 situations personnalisées changent, dont 19 premières places. Trois profils ciblés sont ajoutés à la nouvelle référence. Ces écarts viennent des notes sources et de la difficulté révisées, puis de leurs effets sur les classements et départages existants ; les formules restent inchangées.

Le contrat v16 fixe les seules différences attendues, la matrice dérivée, les variantes et l'identité des formules. Les tests historiques continuent de vérifier leurs anciennes photographies. Les contrôles actifs vérifient le moteur, les 336 notes, les appuis, les profils de soin, les deux parcours, le partage et les ressources de publication.

Validation locale : 235 tests réussis ; audit des explications sans anomalie sur 113 572 vérifications ; parcours navigateur sur ordinateur et mobile, clavier, partage et import réussis ; préparation de l'artefact GitHub Pages complète. La revue des propositions ne relève aucune erreur ni aucun avertissement par rapport à la base conservée.
