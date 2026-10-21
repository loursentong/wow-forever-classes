# Explications, sources et audit des interactions — 21 octobre 2026

Travail local sur la branche `codex/explications-sources-2026-10-21`, depuis le commit `f5bf5f6eaff1265348a40d77be38e884732e310d` de Claude. Moteur de scoring 1.0.7, référence v8. Aucune écriture sur GitHub, aucune publication. Les données de classe, coefficients, règles de classement et fixtures sont conservés.

## Ce qui est réalisé

- « Pourquoi cette piste » détaille les réponses : Contrôle, Soutien, Solo, etc., leurs repères sur 5, l’effet de la maîtrise et la certitude déclarée. Il lit une trace du calcul existant, au lieu de réimplémenter le moteur dans l’interface.
- « À garder en tête » choisit la réponse qui explique le plus de points manquants, compte tenu de son poids. Une hésitation est décrite comme une hésitation du joueur ; elle n’est pas présentée comme une faiblesse de la classe. Exemple : « Solo : 3/5. C’est le principal compromis avec tes envies. »
- Les rôles multiples restent expliqués ensemble, car leur calcul n’est pas une somme de notes indépendantes par rôle.
- Correction d’un défaut d’arrondi : on pouvait afficher **30 / 29 points**. La répartition des points est désormais bornée par les maximums affichés, tout en totalisant exactement le score entier. Le score du moteur n’a pas changé.
- Neuf fiches de classe et un index des sources sont générés depuis le corpus versionné. Ils exposent les 336 notes, les profils de soin, les variantes sans familier, les faits, les raisons, la confiance, les points à revoir ou surveiller et les liens datés. Les deux parcours renvoient vers la bonne classe et la bonne configuration.
- Les pages distinguent source officielle, simulation et avis, et rappellent que les reprises d’une même source ne sont pas indépendantes. Elles ne prétendent pas à une nouvelle vérification externe de tout le corpus.

## Constats de l’audit

### 1. Familiers : influence légitime et effet de normalisation

Une classe sans familier peut légitimement mieux répondre à « jouer sans compagnon » et moins bien à « jouer avec un compagnon ». Il ne faut donc pas rendre la question neutre pour toutes ces classes.

Les aptitudes de ces configurations restent identiques quand on ajoute ce choix. Le nouveau critère, commun à ces classes, peut modifier leurs scores normalisés et rapprocher leurs résultats. Il peut aussi créer une égalité au centième : Mage Givre 53,13 et Chaman Restauration 53,12 deviennent tous deux 58,64 dans le profil reproductible de l’audit. L’ordre alphabétique peut alors remplacer l’ordre précédent ; cela ne démontre pas un bonus de classe.

### 2. « Sans familier » hésitant : un changement de configuration immédiat

Le moteur sélectionne la variante sans familier dès `avoid`, même avec une certitude de 0/5. La certitude atténue le critère familier mais pas la perte des outils du compagnon.

Exemple : Contrôle 5/5, Distance 5/5, maîtrise Confirmé. Sans réponse familier, Mage Givre et Affliction obtiennent 100. Avec « sans familier », certitude 0/5 : Mage 91,67, Affliction 80,56. À 5/5 : Mage 100, Affliction 88,89. C’est conforme à la règle actuelle, mais le changement de build peut surprendre avec une simple intuition.

### 3. Précision : une référence de build à clarifier

La base indique que Précision est déjà évaluée en Loup solitaire. Pourtant, « avec familier » lui attribue 76 % sur ce critère, comme à une configuration avec compagnon facultatif. Le profil Burst 5/5 + Distance 5/5 + Familier souhaité 5/5, Confirmé, lui donne 94,67.

Ce constat justifie une clarification du build. Il ne justifie pas d’inventer la performance de Précision avec compagnon ni de transférer les avantages de Loup solitaire à ce build.

### 4. Façon de soigner : des maximums différents entre rôles

La façon de soigner n’est évaluée que pour les soigneurs. Dans une comparaison qui comprend aussi d’autres rôles, leurs scores n’ont donc pas les mêmes critères actifs.

Exemple volontairement contradictoire : Soin 1/5, BG 4/5, Solo 1/5, Mêlée 2/5, Zone 0/5, Survie 5/5, Soutien 2/5, jeu simple 2/5, maîtrise Intermédiaire. Paladin Sacré mène à 62,17. Ajouter Prévention à 0/5 fait passer Paladin Protection en tête à 59,66. L’interface explique désormais que la façon de soigner ne compte pas pour cette piste, mais la règle de classement reste à arbitrer.

### 5. Affichage et référence inchangée

L’audit ne trouve pas de divergence entre les classements avant et après ce lot sur son jeu de contrôle. Les bornes, les filtres stricts, la normalisation des entrées et l’unicité d’une configuration par classe sont vérifiés. Le défaut « 30 / 29 » est corrigé.

## Recommandations pour le prochain lot

1. **Traiter ensemble les deux cas familiers.** Pour une préférence souple, envisager de comparer des configurations complètes avec et sans compagnon, puis retenir celle qui répond le mieux à l’ensemble du profil. Un refus strict conserve exclusivement les builds compatibles. Vérifier d’abord que les deux builds sont effectivement documentés ; ne jamais assembler leurs meilleurs attributs. Clarifier Précision avant toute nouvelle note.
2. **Décider comment comparer soin et autres rôles.** Le style de soin doit clairement aider à choisir un soigneur. Définir son effet sur une comparaison entre rôles avant de changer le dénominateur ou de pénaliser arbitrairement les autres configurations. Rejouer le cas contradictoire ci-dessus et les profils mixtes Tank/Soin et DPS/Soin.
3. **Versionner les changements de comportement retenus.** Ces décisions toucheraient au scoring : les motiver, comparer les résultats, relire chaque divergence, puis seulement créer une nouvelle référence. Aucun objectif de répartition égale des classes gagnantes.

## Vérification et reproduction

Depuis ce dossier, avec Node :

```text
node scripts/build-source-pages.cjs
node --test tests/*.test.cjs
node scripts/audit-interactions.cjs > audit-interactions.json
node tests/browser-smoke.cjs
bash scripts/prepare-pages.sh
```

Le script d’audit doit disposer du commit Git d’origine cité en tête. Le contrôle navigateur utilise Playwright ; `FRV_CHROMIUM_EXECUTABLE` peut indiquer un Chrome local. La génération et la préparation de l’artefact sont locales et ne publient rien.

- **140 tests unitaires et de contrat réussis**, dont les références versionnées, la correspondance des sources et les traces.
- **8 172 profils guidés** : choix isolés, toutes les paires de choix simples aux certitudes 0 et 5, contraintes strictes/souples, quatre maîtrises, puis 1 000 profils composés déterministes aux certitudes 0 à 5. 8 028 résultats, 108 profils incompatibles et 36 sans réponse exploitable.
- **2 768 profils personnalisés** : les 14 critères seuls et par paires aux pondérations 1 et 3, puis 300 profils composés, aux quatre maîtrises.
- **61 904 lignes de résultat et 153 458 réponses explicatives contrôlées.** Classements comparés exactement au code de Claude ; contributions comparées avant arrondi avec une tolérance de 10⁻⁸, pour tenir compte de l’arithmétique flottante.
- Graine : `20261021`. Empreinte SHA-256 des profils guidés : `ec04199ef89dbc1f2f4e7a8a07b6cc7fa2e9e98382bb421ec1449706fb19cc03`.
- Navigateur réel : les deux parcours, restauration des choix, navigation clavier, détails ouverts, liens vers les fiches ; largeurs 320, 390, 768 et 1 300 px. Captures relues sur mobile et ordinateur. Aucun débordement horizontal ni erreur JavaScript détecté.

### Limites

La couverture par paires et les profils composés ne représentent pas toutes les combinaisons possibles, ni une population de joueurs. Les comptages de premières places fournis dans le JSON sont propres à ce jeu de contrôle et incluent toutes les classes ex æquo ; ils ne prouvent ni l’équilibre ni un favoritisme. Les tests fonctionnels ne valident pas la justesse de chaque jugement de classe.

Ce lot ne réaudite pas les performances, builds et patchs à partir de nouvelles sources : il rend le corpus existant lisible et conserve ses dates et limites. Les trois questions de logique décrites plus haut restaient ouvertes à la fin de ce lot ; les scores et les données n'ont pas été modifiés pour les masquer.

## Suite : moteur 1.0.8 (référence v9)

Les recommandations 1 et 2 ont ensuite été traitées, sans modifier aucune note, aucun coefficient ni aucune priorité :

- souhait souple de jouer sans compagnon : comparaison des builds complets avec et sans compagnon, à égalité celui sans compagnon ; refus strict : build sans compagnon uniquement ;
- Précision identifiée comme Loup solitaire dans les deux parcours, sans build avec compagnon inventé ;
- façon de soigner appliquée à toutes les pistes, avec une adéquation nulle hors soin, atténuée par la certitude.

Sur les 27 scénarios guidés de la v8, deux changent, sans changement de première classe. Sur les 8 172 profils guidés de contrôle, 729 changent, dont 170 de première classe, tous liés à ces règles ; le mode personnalisé ne change pas. Le détail est dans [la révision éditoriale](REVISION-EDITORIALE-V2.md), version 1.0.8.
