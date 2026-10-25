---
name: frv-dump-update
description: Préparer et réviser le dump de notes par spécialisation de Choisir ma classe WoW Forever, dépôt loursentong/wow-forever-classes. Utiliser pour une mise à jour des évaluations ou de leurs sources après lancement ou patch, pas pour une refonte graphique.
---

# Mettre à jour le dump de Choisir ma classe WoW Forever

Le « dump » désigne les jugements de gameplay et leurs justifications, pas les formules du moteur. L’objectif est une aide au choix fiable et compréhensible, avec un effort proportionné. Une recherche solide peut conduire à conserver une note.

## Se repérer

Travailler depuis le checkout courant du dépôt, après vérification de son état et de la version publiée. Lire les instructions du projet, les parties pertinentes de `CODEX-MOTEUR-LOGIQUE.md`, `RECOMMANDATION-METHODE.md`, `connaissances/README.md` et les références actives. Les exemples historiques ne décrivent pas nécessairement l’état actuel.

Lire [les repères de révision](references/revision.md) pour les emplacements, les recherches à prioriser et le format des propositions. Les données du moteur, les justifications et les valeurs dérivées ont des fonctions différentes : ne pas mettre à jour uniquement un export ou un tableau.

## Préparer une revue ciblée

Utiliser `scripts/revue-dump.cjs preparer --repo DEPOT --sortie NOUVEAU_DOSSIER` avec Node pour capturer l’état initial et créer le suivi, les dossiers par classe et une liste vide de propositions. Cette préparation ne modifie aucune note. Reprendre un dossier existant avec le vérificateur ; ne pas l’écraser.

Préciser le patch et la période réellement disponibles à la date de la demande. Commencer par les changements officiels, les notes fragiles et les écarts ouverts. Charger les fichiers des classes du lot, plutôt que tout le corpus. Consigner les recherches déjà faites et leur résultat dans `SUIVI.md` pour pouvoir reprendre sans les répéter.

## Rechercher et décider

Privilégier Blizzard pour les faits, correctifs, talents et compétences. Pour juger les performances, comparer les données au bon niveau et dans des conditions pertinentes, puis recouper les guides communautaires argumentés, dont Kami Labs et Mobalytics. Vérifier patch, date, activité, build, équipement et limites connues. Un guide repris par plusieurs sites reste une même famille de provenance.

Les retours écrits de joueurs servent à découvrir des mécanismes ou des problèmes de contexte, jamais comme mesures. Distinguer les faits confirmés, les simulations, les extrapolations, les contradictions et les informations inconnues. Une capacité officiellement décrite ne valide pas automatiquement une note de performance.

Réviser les builds concernés avec leurs contraintes : variantes sans familier, formes, talents exclusifs et équipement nécessaire. Séparer les critères et les contextes PvE/PvP ; conserver la grille commune de complexité. Documenter les notes conservées comme les changements proposés. Garder une incertitude explicite si les éléments sont insuffisants, sans forcer une note ni un gagnant.

Renseigner les changements motivés dans `propositions.json`, puis lancer `scripts/revue-dump.cjs verifier --repo DEPOT --sortie DOSSIER`. Ce contrôle ne visite pas les liens, n’évalue pas la véracité des sources et n’applique pas de notes. Relire les preuves et les avertissements.

## Réaliser la demande autorisée

Si la demande porte seulement sur la recherche, remettre une proposition avant/après et le suivi des inconnues. Si elle autorise la mise à jour, préparer les modifications sur une branche dédiée, synchroniser données et justifications, puis suivre le protocole DONNEES du codex. Préserver les formules, les pondérations, les sauvegardes et les fixtures historiques ; toute évolution de modèle doit être identifiée séparément.

Comparer les classements des deux parcours avant/après, expliquer les divergences et versionner la nouvelle référence après cet examen. Vérifier variantes, profils de soin, maîtrise et sources affichées, ainsi que les contrôles unitaires et navigateur adaptés. Ne pas régénérer une référence simplement pour faire passer un test rouge.

Présenter une synthèse courte : notes changées et pourquoi, notes conservées, incertitudes, effets sur les recommandations, contrôles effectués. Relier la PR au travail courant. Respecter la portée de l’autorisation pour la fusion et la publication, puis confirmer les ressources réellement déployées si la publication est demandée.
