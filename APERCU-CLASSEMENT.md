# Aperçu du classement accessible jusqu’au bout

Correction d’interface du 27 octobre 2026, en revue. Le moteur `1.5.0-exploratoire`, les notes et les références restent inchangés.

## Problème reproduit

Le bouton « Voir le classement complet des 28 spécialisations », sous les cinq pistes détaillées, ouvrait le panneau d’aperçu situé près de la question et y déplaçait la page. Ce renvoi donnait l’impression de revenir au début, sans permettre une consultation fiable de la liste.

Le panneau avait une hauteur maximale et `overflow:hidden`. Son corps portait `overflow:auto`, mais le contenu natif de `<details>` ne se répartissait pas comme un enfant flex ordinaire. Dans la reproduction sur ordinateur, le corps mesurait 2 024 px pour une hauteur défilable de 2 024 px : il ne défilait pas. Le panneau visible ne mesurait qu’environ 568 px et masquait le reste.

## Comportement corrigé

- Le bouton de renvoi sous le top 5 est retiré, ainsi que son gestionnaire de navigation.
- L’aperçu reste fermé par défaut. Quand on l’ouvre, toutes les spécialisations compatibles sont présentes directement, sans second bouton « Voir les autres ».
- Le cadre du panneau défile lui-même. Son en-tête reste visible et affiche le nombre de spécialisations à comparer, ajusté aux exigences du joueur.
- Sur ordinateur, sa hauteur est bornée à la question et à la fenêtre. Sur mobile et dans un profil partagé, il est borné à 65 % de la hauteur de la fenêtre.
- Le classement est accessible au clavier dans une région nommée. La touche Fin atteint la dernière ligne ; l’en-tête permet toujours de replier le panneau.
- Les cinq pistes détaillées, leurs explications, les rangs et les égalités sont conservés. Les scores et l’ordre proviennent du même moteur.

La consultation d’un profil partagé corrige également le positionnement absolu de l’aperçu : sans questionnaire visible, celui-ci doit retrouver une hauteur normale dans la page.

## Contrôles

Validation locale : **229 tests réussis**, contrôle Chromium complet réussi et captures de fin de liste relues sur ordinateur et mobile. L’artefact Pages a été vérifié.

- Les tests d’interface vérifient la liste complète, l’ordre du moteur, le compteur et les contraintes, ainsi que l’absence du bouton de renvoi.
- `tests/live-preview-browser.cjs`, appelé par le contrôle Chromium complet, vérifie réellement la dernière ligne visible, à la molette et avec Fin. Il vérifie aussi l’en-tête fixe, les changements de hauteur de question, les limites de colonnes à 820/821 et 1 060/1 061 px, les largeurs 320/390/1 300 px, le repli au clavier, les filtres, une question longue, la réinitialisation et les profils partagés.
- Le contrôle préexistant ne se contente plus de constater `scrollHeight >= clientHeight` sur le corps : il exige un vrai débordement défilable dans le cadre. Le contrôle dédié confirme ensuite que la dernière ligne se trouve bien dans la zone visible.
- Captures à relire : `tests/screenshots/apercu-classement-fin-390.png` et `tests/screenshots/apercu-classement-fin-1300.png`.

Aucune donnée du moteur ni photographie de référence n’est modifiée.
