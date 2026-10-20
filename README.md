# Les classes de WoW Forever

Comparatif interactif des neuf classes de World of Warcraft: Forever, projeté au niveau 60 à partir des sources disponibles le 20 octobre 2026.

## Fonctionnalités

- Neuf classes, douze critères notés avec leurs sources et leur fiabilité.
- Pondération personnalisable de 0 à 3 par critère, avec onze profils : Tout à égalité (valeur par défaut), Polyvalence, PvP d'abord, PvE d'abord, Solo et leveling, Tank en groupe, Soin en groupe, DPS en raid, Champ de bataille, PvP sauvage et Soutien polyvalent.
- Maîtrise dans le même panneau que les pondérations : Débutant, Intermédiaire, Confirmé, Expert. Ce réglage adapte le classement et les courbes sans ajouter d'axe pondéré ; les 108 notes du tableau d'ensemble restent fixes.
- Plancher et plafond distincts en PvE et PvP, avec des raisons succinctes et des références bibliographiques. Confirmé conserve les scores de référence.
- Courbes pour les neuf classes avec mise en avant au choix et tableau de chiffres repliable.
- Palette Claude sombre par défaut ; choix clair, sombre ou système enregistré sur l'appareil.
- Préférences enregistrées sur l'appareil du visiteur, page sans dépendances de compilation.

**L'indice sur 100 n'est pas une probabilité.** Les adaptations de maîtrise sont des hypothèses documentées et non des données de joueurs niveau 60.

## Documentation

- [Audit documentaire](AUDIT-2026-10-20.md)
- [Modèle de maîtrise et validation](MODELE-MAITRISE.md)

## Tests

Commande : node --test tests/skill-matching.test.cjs

Une GitHub Action vérifie chaque pull request. La suite protège les 108 notes (instantané de `main` au commit `74a0e6f`), les scores historiques, les onze profils, la maîtrise, les courbes, les préférences et la migration des anciennes sauvegardes. Elle accepte les fins de ligne Windows et Unix.

L'inspection visuelle reste nécessaire avant publication ; le détail des contrôles de cette révision est dans [VERIFICATION-INTERFACE.md](VERIFICATION-INTERFACE.md).
