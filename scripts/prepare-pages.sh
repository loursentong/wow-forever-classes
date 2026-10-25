#!/usr/bin/env bash
set -euo pipefail

# Le site GitHub Pages utilise un artefact statique : il faut copier tous les
# scripts locaux avec index.html, pas seulement le HTML.
mkdir -p _site
node scripts/build-source-pages.cjs
cp -r -- fiches-sources _site/
cp -- index.html .nojekyll ./*.js ./*.css RECOMMANDATION-METHODE.md REVISION-EDITORIALE-V2.md LOT-1-EXPLICATIONS.md COHERENCE-PVE-PVP-V14.md _site/
mkdir -p _site/assets
cp -- assets/*.svg _site/assets/
# Visuels de la refonte (logo, décors, bandeaux, grain), appelés par index.html et les CSS.
cp -r -- assets/img _site/assets/

# Numérotation des ressources : à chaque publication, les scripts et feuilles de style locaux
# prennent l'identifiant du commit (?v=…). Un navigateur qui reçoit le nouveau HTML charge alors
# tous les nouveaux fichiers, sans mélanger anciens et nouveaux pendant la durée du cache.
VERSION="${GITHUB_SHA:-$(git rev-parse HEAD 2>/dev/null || echo local)}"
VERSION="${VERSION:0:12}"
sed -i -E 's#((src|href)="[A-Za-z0-9._-]+\.(js|css))"#\1?v='"$VERSION"'"#g' _site/index.html

# La même vérification est exécutée dans la CI et pendant le déploiement.
# Toute ressource locale oubliée, dans le HTML ou dans un url() des CSS, doit
# faire échouer la publication.
node <<'NODE'
const fs = require('node:fs');
const local = p => !/^(?:https?:|mailto:|tel:|data:|#|\/\/)/i.test(p);
const clean = p => decodeURIComponent(p.split(/[?#]/, 1)[0]);
const html = fs.readFileSync('_site/index.html', 'utf8');
const refs = [...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
  .map(x => x[1]).filter(local).map(clean).filter(Boolean);
// Les feuilles de style sont à la racine du site : leurs url() relatives partent de là.
const cssRefs = fs.readdirSync('_site').filter(f => f.endsWith('.css'))
  .flatMap(f => [...fs.readFileSync('_site/' + f, 'utf8').matchAll(/url\(\s*(['"]?)([^'")]+)\1\s*\)/gi)].map(x => x[2]))
  .filter(local).map(clean).filter(Boolean);
const all = [...new Set([...refs, ...cssRefs])];
const unversioned = [...html.matchAll(/(?:src|href)="([A-Za-z0-9._-]+\.(?:js|css))"/g)].map(x => x[1]);
if (unversioned.length) {
  console.error('Ressources sans numéro de version :', unversioned.join(', '));
  process.exit(1);
}
const missing = all.filter(p => !fs.existsSync('_site/' + p));
if (missing.length) {
  console.error('Fichiers manquants dans l’artefact Pages :', missing.join(', '));
  process.exit(1);
}
console.log('Artefact GitHub Pages complet. Ressources locales :', all.join(', '));
NODE
