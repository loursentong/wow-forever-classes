# Les classes de WoW Forever

Comparatif interactif des neuf classes de World of Warcraft: Forever, projeté au niveau 60 à partir des sources disponibles le 20 octobre 2026.

## Fonctionnalités

- Neuf classes, douze critères notés avec leurs sources et leur fiabilité.
- Pondération personnalisable de 0 à 3 par critère, avec quatre profils génériques : Tout à égalité (valeur par défaut), Polyvalence, PvP d'abord et PvE d'abord.
- Maîtrise : Débutant, Intermédiaire, Confirmé, Expert. Plancher et plafond distincts en PvE et PvP ; Confirmé conserve les notes de référence.
- Courbes pour les neuf classes avec mise en avant au choix et tableau de chiffres repliable.
- Duel de classes : contributions détaillées de chaque critère à l'écart de score.
- Préférences enregistrées sur l'appareil du visiteur, page sans dépendances de compilation.

**L'indice sur 100 n'est pas une probabilité.** Les adaptations de maîtrise sont des hypothèses documentées et non des données de joueurs niveau 60.

## Documentation

- [Audit documentaire](AUDIT-2026-10-20.md)
- [Modèle de maîtrise et validation](MODELE-MAITRISE.md)

## Tests

Commande : node --test tests/skill-matching.test.cjs

Une GitHub Action vérifie chaque pull request. L'inspection visuelle reste nécessaire avant publication.
