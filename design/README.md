# Refonte graphique

Maquette de la refonte visuelle, validée le 21 octobre 2026 comme cible du rendu et intégrée le même jour par [`refonte-forever.css`](../refonte-forever.css). Elle fixe l'apparence de la page, pas sa logique : le moteur, ses calculs et ses textes restent ceux du site, décrits dans [CODEX-MOTEUR-LOGIQUE.md](../CODEX-MOTEUR-LOGIQUE.md). Les images sont dans [`assets/`](../assets/README.md).

| Fichier | Contenu |
| --- | --- |
| `maquette/Main.dc.html` | Page complète, bureau 1536 px : décor, logo, deux parcours, question avec certitude et exigence, « Mes choix », aperçu, priorités, classement, comparatif historique |
| `maquette/Mobile.dc.html` | La même page à 390 px |
| `maquette/Systeme.dc.html` | Système visuel : palette et contrastes, typographies, cadres, états des composants, icônes, échelle de rareté, mouvement, règles d'imagerie |
| `maquette/canvas.json` | Disposition des planches |
| `preparer-visuels.py` | Régénère `assets/img` à partir des originaux du kit de presse |

Réglages de la maquette : intensité (Sobre, Équilibré, Épique), décor (Arbre-monde, Vallée de nuit), aperçu ouvert ou fermé. Par défaut : Équilibré, Arbre-monde.

## Lire la maquette

Ces fichiers viennent d'un canevas Claude Design : les `{{…}}`, `<sc-for>` et `<sc-if>` sont remplis par le script en bas de chaque fichier. Ils ne s'ouvrent pas tels quels dans un navigateur, mais tous les styles y sont lisibles : couleurs, typographies, ombres, rayons, espacements et états.

Les libellés reprennent ceux de `questionnaire.js` et `priorities-ui.js`. Les exemples de l'aperçu et du classement sont la sortie du moteur au commit `278a10c` : DPS et Donjons et raids à 3/5, puis chaque réponse possible à la question 3 ; profil « DPS en raid » au niveau Confirmé. Ils changeront avec le moteur : à l'intégration, chaque valeur affichée reste celle que calcule le site, jamais une valeur recopiée de la maquette. Les notes du comparatif historique sont celles de `window.__WF`.

Les états de survol et le focus clavier (anneau or clair de 2 px, décalé de 3 px) sont définis dans l'en-tête de `Main.dc.html`.

## Intégrer sans toucher au moteur

Au sens du codex, l'intégration est un changement de type **Présentation** : aucun score, aucun classement ni aucune sauvegarde ne doit changer.

- Ne pas modifier `recommendation-engine.js`, `window.__WF` (126 notes, 15 préréglages), `tests/fixtures/moteur-reference-v1.json` ni les clés `localStorage`.
- Garder les points d'accroche des scripts : `#reco-app`, `[data-reco-mode]`, `#reco-guided`, `#reco-priorities`, `#reco-form`, `#reco-rail`, `#reco-summary-panel`, `#reco-results`, `#reco-reset`, `#reco-priority-form`, `#reco-priority-results`, `#legacy-advanced`, les attributs `data-*` produits par `questionnaire.js` et `priorities-ui.js`, ainsi que `.presets button[data-preset]`, `.seg button[data-ax]`, `.mbtn[data-m]`, `#reset-w` et les identifiants du comparatif vérifiés par `tests/skill-matching.test.cjs`.
- Passer d'abord par les feuilles de style ; ne changer le balisage que là où la maquette l'exige (en-tête, bandeaux).
- `scripts/prepare-pages.sh` publie `assets/img` et vérifie aussi les `url()` des feuilles de style. Les icônes de `assets/icons` ne sont pas encore utilisées : passer des icônes du CDN de Blizzard aux fichiers locaux demandera de modifier `questionnaire.js`, `priorities-ui.js`, `index.html` et `tests/visual-pack.test.cjs` dans une même PR, en le signalant.
- Valider avec `node --test tests/*.test.cjs`, `bash scripts/prepare-pages.sh` et `node tests/browser-smoke.cjs`.

## Polices

Cinzel (titres), Source Sans 3 (texte) et JetBrains Mono (scores), sous licence SIL Open Font License, servies par Google Fonts.
