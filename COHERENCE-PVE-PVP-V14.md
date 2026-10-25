# Rôles, activités et explications — proposition v14

Correction demandée le 25 octobre 2026. Moteur proposé : `1.4.0-exploratoire`, sur la production `5212e32a2484d95b60ac63d84c996b71a1cb8ada`. Publication soumise à validation.

## Problème et comportement voulu

Le rôle DPS utilisait le repère de classe DPS PvE et la note de raid, même pour un joueur uniquement PvP ou solo. Le départage des configurations à score égal utilisait également le raid. Ce biais concernait les deux parcours et les trois rôles.

Avec une activité choisie, le rôle et le départage suivent maintenant cette activité. Avec plusieurs activités, le guide leur donne la même part ; les priorités personnalisées les pondèrent selon leur importance. La certitude ne devient pas une pondération d’activité supplémentaire.

- **Donjons et raids** : conservation de la formule de rôle PvE, `0,55 × référence de classe normalisée + 0,45 × note raid de la spécialisation après maîtrise normalisée`.
- **Solo et leveling** : note solo de la configuration, après maîtrise PvE, normalisée sur 0…1. La note raid et la référence de rôle par classe n’interviennent pas. L’exception du Chasseur Maîtrise des bêtes en solo est conservée.
- **Champs de bataille et PvP sauvage** : notes de ces activités, après maîtrise PvP, normalisées sur 0…1. Aucune note PvE, aucune référence de classe DPS PvE et aucun départage par le raid.
- **Activité non précisée** : le rôle garde son repère PvE historique pour éviter une réinterprétation silencieuse des profils incomplets. L’interface demande de préciser les activités et annonce ce repère provisoire. La difficulté sans activité garde sa convention moyenne PvE/PvP.

Une note de BG ou de PvP sauvage décrit l’aisance globale dans cette activité, **pas un débit de dégâts PvP**. Aucune note de DPS PvP n’est inventée. Les mêmes règles s’appliquent au soin et au tank. Le tank est présenté dans son usage donjons/raids ; si le joueur choisit Tank et seulement du PvP, l’interface explique que ces choix évaluent le PvP et invite à ajouter l’activité de groupe, sans modifier ses réponses.

Les coefficients des domaines sont conservés. L’activité intervient donc toujours dans l’évaluation du rôle et dans le domaine Activités : ces composantes sont corrélées, comme auparavant pour le raid. Cette correction retire une référence hors contexte ; elle ne constitue pas une calibration indépendante des poids.

## Priorités et sauvegardes

Le mode personnalisé possède **15 critères**, avec une activité « Donjons et raids » distincte du rôle DPS. Le contexte de difficulté tient compte de cette nouvelle activité, y compris dans les mélanges pondérés. La matrice documentaire reste à **14 colonnes et 126 notes**.

Les 15 profils historiques gardent leurs anciens poids ; les profils PvE, DPS en raid, Tank en groupe et Soin en groupe ajoutent explicitement Donjons et raids à 3, Tous les critères à 1. Les sauvegardes anciennes conservent exactement leurs poids et leur maîtrise ; le critère absent vaut 0. Il n’est pas ajouté implicitement à une sauvegarde personnalisée. La sauvegarde explicite et sa restauration incluent désormais ce nouveau poids.

## Présentation

La question 2 devient « Quelles activités comptent pour toi ? », avec « Coche les activités où tu veux que ta classe soit à l’aise. Tu peux en choisir plusieurs. » Le solo, le leveling et le farm sont une priorité à choisir, pas une case à cocher parce que tout le monde en fait.

« Dégâts de burst » remplace « Dégâts explosifs », avec « Frapper très fort en peu de temps ». Les explications mettent les atouts et le principal compromis en mots. Le choix de ce compromis suit toujours la contribution pondérée au score ; une hésitation est attribuée au joueur, pas à une faiblesse de la classe.

Les repères d’accord utilisent la valeur brute après maîtrise, arrondie au pourcentage entier comme les anciens repères : ≥ 0,90 « Ça colle très bien » ; ≥ 0,70 « Ça colle bien » ; ≥ 0,45 « Un compromis » ; ≥ 0,15 « Ça colle peu » ; sinon « Ça ne colle pas ». Le groupe moyenne ses réponses comme le moteur. La certitude est expliquée séparément et reste appliquée au score réel. Le score global est conservé ; les pourcentages et contributions de groupes passent dans « Voir le détail du calcul », fermé par défaut. Les égalités exactes restent nommées ; les petits écarts se lisent « au coude-à-coude ».

## Vérification et référence

`node --test tests/coherence-v14.test.cjs` vérifie notamment que modifier les données PvE ne peut changer aucun score, ordre, build ou scénario d’un profil uniquement PvP. Un contrôle similaire isole le solo du raid et du PvP. Ces contrôles portent sur les deux parcours et plusieurs maîtrises.

`node scripts/reference-v14.cjs rapport.json` compare la proposition à la v13. `--fixture tests/fixtures/moteur-reference-v14.json` écrit exclusivement un nouveau fichier, sans écraser les références précédentes. Les 126 notes, les 28 configurations, leurs variantes et les coefficients sont inchangés. La v13 reste protégée par son empreinte. Les écarts détaillés sont des changements de comportement à examiner, pas des objectifs de classement.

La comparaison à la v13 constate 14 scénarios guidés modifiés sur 46, les 32 scénarios sans activité ou limités au raid restant identiques. Sur les 118 cas personnalisés précédents, 60 changent et 58 restent identiques ; ces changements incluent les profils rendus explicitement PvE. Les nouveaux cas sont versionnés séparément.
