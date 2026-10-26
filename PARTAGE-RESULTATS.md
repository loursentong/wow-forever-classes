# Partager et reprendre ses résultats

Partage initial publié par la PR #49 le 26 octobre 2026. Les liens compacts sont en revue. Moteur `1.5.0-exploratoire`, notes et référence v15 inchangés.

## Parcours du joueur

- **Recevoir** : « Importer des résultats » reste visible avant le choix du parcours, à l’accueil et pendant une session. Le joueur peut coller un lien ou choisir un fichier JSON. Un lien ouvert directement affiche les résultats partagés.
- **Partager après un aperçu ou un classement** : une action se trouve près du titre des résultats et une autre à la fin, dans les deux parcours. Aucun bouton flottant. Une seule fenêtre donne accès à la copie du lien, au partage natif si disponible et au fichier.
- **Consulter** : une vue temporaire recalcule les résultats reçus et permet de voir les envies correspondantes. Les formulaires sont masqués pendant cette consultation ; les détails et le classement complet restent accessibles. « Revenir à mes choix » restaure le parcours et l’étape précédents.
- **Reprendre** : « Essayer ces réglages » adopte explicitement les choix reçus dans leur parcours et synchronise la maîtrise comme une action habituelle. La sauvegarde séparée « Mes critères personnels » n’est pas remplacée.

Le partage transporte les choix, pas une photographie historique du classement. À son ouverture, **le moteur et les notes actuels** calculent les pistes et leurs explications. Aucun écran avant/après ni choix de version ancienne : « Les résultats sont calculés avec les notes actuelles de l’outil ». La même version de calcul et les mêmes notes retrouvent le même résultat. Un ancien partage peut évoluer après une mise à jour du dump ; sa date et son numéro de moteur restent des métadonnées internes, pas un engagement de figer les scores.

Cette simplicité de lecture concerne l’interface des joueurs. Les contrôles internes de provenance et de non-régression restent nécessaires lors d’une mise à jour des notes ; leur comparaison n’est pas affichée aux joueurs.

## Format portable v1

`result-sharing.js` définit le format JSON du fichier et des anciens liens longs :

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

Les anciens liens utilisent `#partage=…`, encodé en UTF-8/base64url. Leur lecture reste inchangée, y compris leurs métadonnées d’origine. Le chemin du site est conservé, y compris `/wow-forever-classes/` sur Pages ; en prévisualisation locale HTTP le lien reste local. Le fichier porte l’extension `.json` et son nom indique le parcours. Aucun compte, nouveau service ou dépendance externe n’est ajouté.

Le validateur refuse les formats non pris en charge, champs inconnus, faux scores, sélections incohérentes, types et bornes invalides. La taille des fichiers est limitée à 16 Kio, celle des liens est bornée avant décodage. Aucun contenu importé n’est exécuté ; les libellés affichés viennent du catalogue courant. Un changement futur du schéma portable devra traiter explicitement la compatibilité ; un format non pris en charge donne un message compréhensible.

## Codes de lien compacts v1 — en revue

Les nouveaux liens utilisent `#p=…`. Le code transporte uniquement les choix et la version de leur disposition. La date d’export, le numéro du moteur et les clés JSON ne sont pas nécessaires au recalcul ; le fichier JSON conserve son format complet. À l’ouverture d’un code compact, une nouvelle enveloppe locale est créée avec le moteur courant et la date d’ouverture, sans prétendre restituer les métadonnées de l’émetteur.

Sur l’adresse publique à la racine du projet, la longueur complète est fixe :

| Parcours | Nouveau code | URL complète | Ancien lien sur les exemples de contrôle |
|---|---:|---:|---:|
| Guidé | 15 caractères | 68 caractères | 585 caractères |
| Personnalisé | 8 caractères | 61 caractères | 466 caractères |

L’encodage place les valeurs dans des champs binaires puis les transforme en base64url. Les tableaux `COMPACT` de `result-sharing.js` fixent les identifiants et leur ordre : **ne jamais les réordonner avec ceux de l’interface ou du moteur**. Une nouvelle disposition demande une nouvelle version et le maintien de la lecture précédente.

- En-tête d’un octet : version sur 4 bits, parcours sur 1 bit, maîtrise sur 2 bits et un bit réservé à zéro.
- Mode personnalisé : les quinze poids sur 2 bits chacun, puis deux bits de remplissage nuls.
- Guide : rôles, exigence de rôles, soin, activités, portée, styles, familier et difficulté. Une certitude utilise 3 bits : 0–5 sont des réponses ; 7 marque l’absence de réponse ; 6 est refusé. Les valeurs de portée/familier/difficulté, leurs certitudes et les exigences sont conservées, même pour les préférences neutres. Trois bits de remplissage nuls.
- Un octet CRC-8 (polynôme `0x07`, départ zéro) détecte les erreurs de copie. Il ne constitue pas une signature du profil. La taille, la version, les champs réservés, les valeurs et la représentation canonique restent vérifiés, puis le même validateur de profils s’applique.

`compactEncode` et `compactDecode` traitent le nouveau code ; `encode` et `decode` conservent l’encodage historique. `readLink` accepte les deux préfixes ; `isShareHash` assure aussi leur reconnaissance pour l’ouverture directe et le retour à ses choix. Les sauvegardes du navigateur, les calculs et le téléchargement JSON ne changent pas.

## État et accessibilité

`WFGuide` et `WFPriorities` exposent un profil copié, une prévisualisation temporaire et sa sortie. La consultation ne synchronise pas la maîtrise vers l’autre parcours et ne remplace aucune préférence sauvegardée. L’adoption utilise les règles de persistance et de maîtrise déjà présentes ; aucun nouveau schéma de `localStorage`.

`result-sharing-ui.js` gère l’import, le téléchargement, le fragment d’URL et la fenêtre native `<dialog>` : focus, fermeture par Échap, clavier, messages et erreurs. Si le presse-papiers est indisponible, le lien devient visible et sélectionné pour une copie manuelle. Le partage natif est proposé seulement si l’appareil l’expose ; une annulation n’est pas traitée comme une erreur.

## Vérification

Validation du partage initial : **222 tests réussis**, contrôle Chromium complet réussi et captures relues sur ordinateur et mobile. L’artefact Pages contient les scripts et la feuille de style de partage. Ces vérifications n’ont modifié aucune note ni photographie de référence. Les contrôles des liens compacts ajoutent les anciens liens publiés figés, des codes v1 figés, 1 000 profils déterministes et les erreurs de copie ; les anciens et nouveaux liens sont parcourus dans le navigateur.

Validation locale des liens compacts : **229 tests réussis**, contrôle Chromium complet réussi dans les deux parcours et aux largeurs mobiles ; artefact Pages vérifié. Le moteur, les notes et les références versionnées sont inchangés.

- `node --test tests/*.test.cjs` : les profils guidés actifs et les profils personnalisés actuels et historiques traversent lien et fichier sans perte de leurs entrées, classements ou explications ; validation, bornes, caractères UTF-8 et données immuables.
- `node tests/browser-smoke.cjs` : tests existants des deux parcours, puis `tests/sharing-browser.cjs` pour liens directs, rechargement, fichiers, collage, sortie et adoption, sauvegardes, copie et repli manuel, téléchargement, annulation/échec du partage natif et erreurs. Largeurs 320, 390, 768 et 1 300 px, captures pour relecture.
- `bash scripts/prepare-pages.sh` : scripts et CSS de partage inclus et versionnés dans l’artefact Pages.

Les copies du presse-papiers et le partage natif sont simulés dans les contrôles automatiques ; le téléchargement et les fichiers importés passent par les vraies API du navigateur. Ces contrôles ne garantissent pas les comportements propres à chaque application de messagerie ou appareil.
