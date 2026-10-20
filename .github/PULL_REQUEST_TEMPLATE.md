## Objectif de la PR

Décrire le problème, le comportement attendu et les éléments modifiés.

### Type de changement

- [ ] Présentation uniquement (aucune modification des calculs)
- [ ] Correctif de bug
- [ ] Changement de données éditoriales / de sources
- [ ] Évolution intentionnelle du modèle de recommandation
- [ ] Documentation ou tests seulement

### Référentiel logique — vérification obligatoire

Lire [CODEX-MOTEUR-LOGIQUE.md](../CODEX-MOTEUR-LOGIQUE.md) avant toute modification du moteur, des 126 notes, des 28 configurations, des sauvegardes ou des UI de choix.

- [ ] Le comportement actuel et le comportement cible sont explicités.
- [ ] Si une formule ou une donnée change, la source, l'hypothèse et la justification sont documentées.
- [ ] Un test reproduisant la régression a été ajouté **avant** le correctif, si applicable.
- [ ] Les 9 classes / 28 configurations, veto, certitudes, maîtrise et sauvegardes ont été vérifiés selon le périmètre.
- [ ] Les classements et spécialisations affectés ont été comparés avant/après.
- [ ] Si la photographie `tests/fixtures/moteur-reference-v1.json` change, les écarts sont listés et **explicitement approuvés** ; ne jamais la régénérer automatiquement pour faire passer une CI rouge.
- [ ] Si le changement est volontaire et incompatible, la version du référentiel et le changelog correspondant sont mis à jour.

### Validation

- [ ] `node --test tests/*.test.cjs` réussi (ou expliquer pourquoi non exécuté).
- [ ] Tests Chromium, clavier et responsive exécutés si l'UI change.
- [ ] `bash scripts/prepare-pages.sh` réussi.
- [ ] Aucune régression du score « DPS PvE » (plus de 100/100 attribué mécaniquement aux neuf classes).
- [ ] Les résultats présentés au public restent clairement qualifiés d'**estimations éditoriales**, non de mesures du niveau 60.
- [ ] Les ressources graphiques utilisées ont une provenance et un statut de droits vérifiés si la DA change.

**Preuves / liens de tests :**

**Différences attendues de classement (avant → après) :**

**Risques restants / limites connues :**

**Publication :** ne pas déclarer le site opérationnel tant que GitHub Pages n'a pas réellement servi les scripts, CSS et ressources nécessaires.
