# Partager et reprendre ses résultats

Évolution d’interface préparée le 26 octobre 2026. Moteur `1.5.0-exploratoire`, notes et référence v15 inchangés. Publication soumise à validation de la PR.

## Parcours du joueur

- **Recevoir** : « Importer des résultats » reste visible avant le choix du parcours, à l’accueil et pendant une session. Le joueur peut coller un lien ou choisir un fichier JSON. Un lien ouvert directement affiche les résultats partagés.
- **Partager après un aperçu ou un classement** : une action se trouve près du titre des résultats et une autre à la fin, dans les deux parcours. Aucun bouton flottant. Une seule fenêtre donne accès à la copie du lien, au partage natif si disponible et au fichier.
- **Consulter** : une vue temporaire recalcule les résultats reçus et permet de voir les envies correspondantes. Les formulaires sont masqués pendant cette consultation ; les détails et le classement complet restent accessibles. « Revenir à mes choix » restaure le parcours et l’étape précédents.
- **Reprendre** : « Essayer ces réglages » adopte explicitement les choix reçus dans leur parcours et synchronise la maîtrise comme une action habituelle. La sauvegarde séparée « Mes critères personnels » n’est pas remplacée.

Le partage transporte les choix, pas une photographie historique du classement. À son ouverture, **le moteur et les notes actuels** calculent les pistes et leurs explications. Aucun écran avant/après ni choix de version ancienne : « Les résultats sont calculés avec les notes actuelles de l’outil ». La même version de calcul et les mêmes notes retrouvent le même résultat. Un ancien partage peut évoluer après une mise à jour du dump ; sa date et son numéro de moteur restent des métadonnées internes, pas un engagement de figer les scores.

Cette simplicité de lecture concerne l’interface des joueurs. Les contrôles internes de provenance et de non-régression restent nécessaires lors d’une mise à jour des notes ; leur comparaison n’est pas affichée aux joueurs.

## Format portable v1

`result-sharing.js` définit un format JSON commun au fichier et au lien :

```json
{
  "app": "choisir-ma-classe-wow-forever",
  "format": 1,
  "mode": "guided",
  "engine": "1.5.0-exploratoire",
  "created": "2026-10-26T12:00:00.000Z",
  "choices": {}
}
```

`choices` contient soit le profil guidé complet nettoyé (certitudes, exigences, soin et maîtrise compris), soit `{weights, mastery}` avec les quinze poids. L’objet vide ci-dessus illustre l’enveloppe seulement : un partage réel doit exprimer au moins une préférence. Des exigences incompatibles peuvent être partagées pour en discuter.

Le lien utilise le fragment `#partage=…`, encodé en UTF-8/base64url. Le chemin du site est conservé, y compris `/wow-forever-classes/` sur Pages ; en prévisualisation locale le lien reste local. Le fichier porte l’extension `.json` et son nom indique le parcours. Aucun compte, nouveau service ou dépendance externe n’est ajouté.

Le validateur refuse les formats non pris en charge, champs inconnus, faux scores, sélections incohérentes, types et bornes invalides. La taille des fichiers est limitée à 16 Kio, celle des liens est bornée avant décodage. Aucun contenu importé n’est exécuté ; les libellés affichés viennent du catalogue courant. Un changement futur du schéma portable devra traiter explicitement la compatibilité ; un format non pris en charge donne un message compréhensible.

## État et accessibilité

`WFGuide` et `WFPriorities` exposent un profil copié, une prévisualisation temporaire et sa sortie. La consultation ne synchronise pas la maîtrise vers l’autre parcours et ne remplace aucune préférence sauvegardée. L’adoption utilise les règles de persistance et de maîtrise déjà présentes ; aucun nouveau schéma de `localStorage`.

`result-sharing-ui.js` gère l’import, le téléchargement, le fragment d’URL et la fenêtre native `<dialog>` : focus, fermeture par Échap, clavier, messages et erreurs. Si le presse-papiers est indisponible, le lien devient visible et sélectionné pour une copie manuelle. Le partage natif est proposé seulement si l’appareil l’expose ; une annulation n’est pas traitée comme une erreur.

## Vérification

Validation locale : **222 tests réussis**, contrôle Chromium complet réussi et captures relues sur ordinateur et mobile. L’artefact Pages contient les nouveaux scripts et la feuille de style. Ces vérifications n’ont modifié aucune note ni photographie de référence.

- `node --test tests/*.test.cjs` : les profils guidés actifs et les profils personnalisés actuels et historiques traversent lien et fichier sans perte de leurs entrées, classements ou explications ; validation, bornes, caractères UTF-8 et données immuables.
- `node tests/browser-smoke.cjs` : tests existants des deux parcours, puis `tests/sharing-browser.cjs` pour liens directs, rechargement, fichiers, collage, sortie et adoption, sauvegardes, copie et repli manuel, téléchargement, annulation/échec du partage natif et erreurs. Largeurs 320, 390, 768 et 1 300 px, captures pour relecture.
- `bash scripts/prepare-pages.sh` : scripts et CSS de partage inclus et versionnés dans l’artefact Pages.

Les copies du presse-papiers et le partage natif sont simulés dans les contrôles automatiques ; le téléchargement et les fichiers importés passent par les vraies API du navigateur. Ces contrôles ne garantissent pas les comportements propres à chaque application de messagerie ou appareil.
