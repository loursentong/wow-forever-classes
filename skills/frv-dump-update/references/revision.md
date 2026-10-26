# Repères de révision

## Où agir

- `recommendation-engine.js` contient les évaluations utilisées par les deux parcours, leurs profils, les variantes sans familier, les profils de soin et les composantes de complexité.
- `connaissances/classes/*.json` documente chaque jugement : valeur, raison, appuis et confiance. Les faits renvoient au registre `connaissances/sources.json`.
- `connaissances/referentiel-complexite.json` définit la grille ; la note de difficulté est calculée à partir de ses composantes. Modifier une composante argumentée, puis répercuter son total et sa note. Ne pas choisir directement une note de difficulté pour obtenir un classement.
- Les 126 valeurs de classe dans `index.html` ne sont pas 126 nouvelles évaluations indépendantes. Lire leur règle d’agrégation dans le codex ; synchroniser les références de rôle du moteur lorsque cette règle l’exige.
- La note source `raid` d’un DPS décrit le repère monocible ; l’activité Donjons et raids est construite par le moteur avec le repère de zone. Ne pas y écrire une seconde fois le résultat composé.
- Précision est évaluée en Loup solitaire. Vérifier la variante, les talents, les compétences réellement accessibles et l’équipement avant de comparer deux performances.

## Prioriser les recherches

1. Correctifs et changements officiels depuis la dernière revue : kit, talents, équipements, valeurs modifiées.
2. Notes faibles, écarts encore ouverts, conclusions fondées sur la bêta ou un niveau différent du contexte visé.
3. Cas où un changement touche plusieurs critères ou un build de référence : réexaminer ses conséquences, sans réévaluer arbitrairement toute la classe.

Commencer par Blizzard et le client du jeu pour les faits et les changements. Pour le jugement de performance, croiser des observations comparables au bon patch avec des guides argumentés : Kami Labs, Mobalytics ou d’autres auteurs identifiés. Actualiser les URL depuis le registre et vérifier leur date au moment de la recherche. Une description officielle de sort ne prouve pas une note de performance à 4 ou 5.

Pour chaque élément utile, relever patch/date, niveau, spécialisation et build, activité, équipement et conditions de comparaison ; préciser les informations manquantes. Séparer dégâts monocibles/zone, donjons/raids, solo/leveling et PvE/PvP. Les traces de combat contextualisées sont des données ; un témoignage écrit est un indice qualitatif à recouper.

Deux pages qui reprennent le même simulateur, auteur ou podcast appartiennent à une même famille de provenance. Les compter une seule fois pour la corroboration. Une tier list seule ne justifie pas une hausse précise ; rechercher le mécanisme ou la comparaison qui la motive.

Rester proportionné : viser une aide fiable au choix, pas une simulation exhaustive. S’arrêter quand le jugement est suffisamment étayé ; conserver la note et signaler l’incertitude sinon. Prévoir des lots par classe et des points de reprise si le budget le justifie. Aucun quota de classes gagnantes.

## Dossier de travail

Le script `scripts/revue-dump.cjs` de cette compétence propose deux commandes, sans appliquer de données :

```text
node CHEMIN_COMPETENCE/scripts/revue-dump.cjs preparer --repo DEPOT --sortie NOUVEAU_DOSSIER
node CHEMIN_COMPETENCE/scripts/revue-dump.cjs verifier --repo DEPOT --sortie DOSSIER
```

- `etat-initial.json` : inventaire, version, commit et empreinte des données. La présentation HTML est exclue de l’empreinte ; une refonte graphique seule n’invalide pas la revue.
- `classes/*.json` : valeurs effectives et documentation par classe, avec leurs liens sources. Lire les fichiers nécessaires au lot, plutôt que tout le dump en contexte.
- `SUIVI.md` : priorités et avancement ; y noter aussi les notes conservées, les doutes et les recherches déjà faites.
- `propositions.json` : contexte de la revue et changements à examiner. La liste démarre vide.

Chaque proposition contient `id` (repris de l’inventaire), `actuelle`, `proposee`, `raison`, `confiance` et `preuves`. Exemple de structure, à remplacer par des éléments réellement consultés :

```json
{
  "id": "mage-feu/reference/note/raid",
  "actuelle": 4,
  "proposee": 5,
  "raison": "Expliquer pourquoi les nouveaux éléments changent ce jugement.",
  "confiance": "moyenne",
  "preuves": [{
    "url": "https://example.org/source-a-remplacer",
    "titre": "Source réellement consultée",
    "nature": "guide",
    "groupe": "auteur-ou-jeu-de-donnees-d-origine",
    "consultee": "2026-10-25",
    "contexte": "Patch, niveau, contenu, build, équipement et limites connus",
    "constat": "Élément précis soutenant la proposition, avec ses limites"
  }]
}
```

Cet exemple n’est pas une proposition concernant le Mage. Les natures acceptées sont `officiel`, `mesure`, `simulation`, `guide`, `retour-joueur`. La confiance est `haute`, `moyenne` ou `faible` ; elle porte sur la solidité du jugement, sans transformer une note ordinale en mesure précise.

Le vérificateur bloque les bases obsolètes, identifiants inconnus, doublons, valeurs hors échelle, modifications directes de valeurs dérivées et propositions fondées uniquement sur des témoignages. Il vérifie la structure des appuis, pas leur véracité ni l’indépendance réelle : ce travail reste à faire pendant l’analyse. Un dossier valide n’autorise pas sa publication.

## Quand la mise à jour des données est demandée

Respecter le protocole DONNEES du codex : mettre les valeurs, leurs raisons et leurs sources en cohérence, versionner les décisions et comparer les résultats avant/après. Les anciennes fixtures restent intactes ; créer une nouvelle référence seulement après examen des divergences attendues. Régénérer les fiches de sources avec l’outil du dépôt, puis vérifier les deux parcours, les variantes, la maîtrise et les sauvegardes. Utiliser aussi `scripts/audit-personnalise.cjs` pour la cohérence des restitutions. Une formule ou une pondération modifiée relève d’une décision de modèle distincte.
