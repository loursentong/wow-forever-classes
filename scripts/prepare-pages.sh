#!/usr/bin/env bash
set -euo pipefail

# Le site GitHub Pages utilise un artefact statique : il faut copier tous les
# scripts locaux avec index.html, pas seulement le HTML.
mkdir -p _site
cp -- index.html .nojekyll ./*.js RECOMMANDATION-METHODE.md _site/

# La même vérification est exécutée dans la CI et pendant le déploiement.
# Toute ressource locale oubliée doit faire échouer la publication.
node <<'NODE'
const fs = require('node:fs');
const html = fs.readFileSync('_site/index.html', 'utf8');
const refs = [...html.matchAll(/(?:src|href)\s*=\s*["']([^"']+)["']/gi)]
  .map(x => x[1])
  .filter(p => !/^(?:https?:|mailto:|tel:|data:|#|\/\/)/i.test(p))
  .map(p => decodeURIComponent(p.split(/[?#]/, 1)[0]))
  .filter(Boolean);
const missing = [...new Set(refs)].filter(p => !fs.existsSync('_site/' + p));
if (missing.length) {
  console.error('Fichiers manquants dans l’artefact Pages :', missing.join(', '));
  process.exit(1);
}
console.log('Artefact GitHub Pages complet. Ressources locales :', [...new Set(refs)].join(', '));
NODE
