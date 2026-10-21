# Visuels sources de la refonte graphique

Images prêtes pour le web, réunies pour la refonte graphique (maquette dans [`design/`](../design/README.md)). Depuis le 21 octobre 2026, le site charge `img/` (en-tête et `refonte-forever.css`) et `scripts/prepare-pages.sh` publie ce dossier. `icons/` n'est pas encore utilisé : le site charge toujours ses icônes depuis le serveur de Blizzard.

## Droits et usage

World of Warcraft, Forever, leurs logos, illustrations et icônes appartiennent à Blizzard Entertainment. Ces fichiers viennent du [kit de presse officiel de WoW Forever](https://blizzard.gamespress.com/fr/wowforeverreveal) et du serveur d'icônes de Blizzard. Ils servent un site de fan gratuit, non officiel et non affilié, dans les conditions rappelées dans la section « Pack graphique Warcraft » du [README](../README.md), et seront retirés sur simple demande de Blizzard. Seul `img/grain.png` est une création du projet.

- Le logo n'est jamais modifié (couleurs, proportions, découpe) et reste accompagné de la mention « Outil de fan · non officiel ».
- Le logo ne sert pas d'identité au site : ni favicon, ni image de partage.
- Le pied de page garde le crédit Blizzard et la mention de non-affiliation.

## Inventaire

| Fichier | Usage dans la maquette | Format | Poids | Origine |
| --- | --- | --- | --- | --- |
| `img/hero-arbre-monde.webp` | Décor d'accueil, par défaut | 2400 × 1000 | 68 Ko | kit : `WoW_Forever_Cinematic_Still_5.jpeg` |
| `img/hero-vallee-nuit.webp` | Bandeau « Être guidé » ; variante de décor dans la maquette | 2400 × 1000 | 77 Ko | kit : `WoW_Forever_Cinematic_Still_2.jpeg` |
| `img/bandeau-gantelet.webp` | Bandeau « Régler mes priorités » | 1920 × 800 | 58 Ko | kit : `WoW_Forever_Cinematic_Still_11.jpeg` |
| `img/bandeau-darkspear.webp` | Bandeau « Comparer » | 1920 × 1080 | 132 Ko | kit : `WoW_Forever_Announce_BG_DarkspearIslands_090.jpg` |
| `img/logo-wow-forever.webp` | Logo de l'en-tête | 520 × 424, fond transparent | 49 Ko | kit : `WoW_Forever_Logo.png`, marges vides retirées |
| `img/grain.png` | Grain des cadres principaux, en mosaïque | 160 × 160 | 32 Ko | création du projet : bruit gris, opacité 34/255 |
| `icons/classes/<id>.jpg` | Icônes des neuf classes | 56 × 56 | 2 à 3 Ko | serveur d'icônes : `classicon_<classe>.jpg` |
| `icons/jeu/<nom>.jpg` | Pictogrammes des réponses | 56 × 56 | 2 Ko | serveur d'icônes, même nom |

Les plans de la cinématique (3840 × 1600) et le décor de Darkspear Islands (3840 × 2160) sont réduits sans recadrage.

Les icônes de classe portent l'identifiant utilisé par le site, suivi ici du nom chez Blizzard : guerrier (`warrior`), paladin (`paladin`), chasseur (`hunter`), voleur (`rogue`), pretre (`priest`), chaman (`shaman`), mage (`mage`), demoniste (`warlock`), druide (`druid`). Adresse d'origine : `https://render.worldofwarcraft.com/us/icons/56/<nom>.jpg`.

Pictogrammes de la question « Comment aimes-tu combattre ? » dans la maquette : `inv_misc_questionmark` (je ne sais pas encore), `spell_frost_frostbolt02` (à distance), `ability_warrior_charge` (au corps-à-corps), `ability_druid_catform` (pouvoir alterner). Le site actuel utilise d'autres icônes pour ces réponses (`questionnaire.js`) ; la maquette en propose qui ne servent pas déjà aux rôles ni aux styles.

## Originaux

Les cinq originaux du kit (33 Mo au total) ne sont pas versionnés : ils alourdiraient chaque clone du dépôt, pour toujours, et restent téléchargeables sur le kit de presse. Pour régénérer les fichiers web : `python3 design/preparer-visuels.py <dossier des originaux>` (Pillow requis).
