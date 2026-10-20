# Les classes de WoW Forever

Vue d'ensemble des neuf classes de *World of Warcraft: Forever* au niveau 60 : ce que chaque classe peut faire, où elle excelle et où elle est faible.

## Fonctionnalités

- Tableau de neuf classes sur douze critères, avec degré de fiabilité et fiches sourcées.
- Classement dynamique par pondération 0–3 de chacun des douze critères et quatre profils prédéfinis.
- **Niveau de maîtrise** du joueur : Débutant, Intermédiaire, Confirmé (référence historique), Expert.
- Courbes d'évolution de l'indice d'adéquation selon la maîtrise, avec tableau de valeurs accessible.
- Comparaison de deux classes avec décomposition visuelle et chiffrée de l'écart selon les poids retenus.
- Sauvegarde locale du niveau et des pondérations, sans serveur ni bibliothèque JavaScript externe.

Les niveaux de maîtrise utilisent des **coefficients exploratoires éditoriaux** et non des courbes de performance mesurées au niveau 60. Le score sur 100 est un **indice d'adéquation** pondéré, **pas une probabilité**.

## Traçabilité

- [Audit documentaire et méthode de vérification](AUDIT-2026-10-20.md)
- [Modèle de maîtrise, hypothèses, coefficients, limites et graphiques](MODELE-MAITRISE.md)

## Vérification

`node --test tests/skill-matching.test.cjs`

Cette suite utilise uniquement Node.js 22, sans installation de dépendances. Une action GitHub exécute les tests sur les pull requests.

État des sources : bêta au 20 octobre 2026. Les mesures de niveau 60 restent projetées et pourront évoluer après le lancement.
