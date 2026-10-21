'use strict';
// Régénère connaissances/ecarts-a-arbitrer.md à partir de connaissances/ecarts.json.
// Usage : node scripts/synthese-ecarts.cjs
const fs=require('node:fs');
const path=require('node:path');
const E=require('../recommendation-engine.js');
const dir=path.join(__dirname,'..','connaissances');
const data=JSON.parse(fs.readFileSync(path.join(dir,'ecarts.json'),'utf8'));
const LIBELLES={raid:'Donjons et raids',bg:'Champs de bataille',world:'PvP sauvage et duel',solo:'Solo et farm',burst:'Dégâts explosifs',
 zone:'Dégâts de zone',ctrl:'Contrôle',surv:'Résistance',mob:'Mobilité',support:'Soutien',charge_pve:'Difficulté PvE',charge_pvp:'Difficulté PvP'};
const nom=id=>{const s=E.specs.find(x=>x.id===id);if(s)return s.className+' '+s.label;
 return {'mage-*':'Mage (les trois)','voleur-*':'Voleur (les trois)','soigneurs':'Les cinq soigneurs'}[id]||id;};
const cell=t=>String(t).replace(/\|/g,'\\|');
const tranches=data.ecarts.filter(e=>e.decision),ouverts=data.ecarts.filter(e=>!e.decision);
const out=['# Écarts à arbitrer','',
 `> Base de connaissances du ${data.date}, moteur \`${data.moteur}\`. Un écart **tranché** porte sa décision, appliquée au moteur ;`,
 '> un écart **ouvert** attend des données ou une décision. Les arguments restent à apprécier dans leur contexte : ils ne prouvent pas tous une erreur de note.',''];
if(tranches.length){
 out.push('## Tranchés','','| # | Configuration | Critère | Avant | Décision | Motif |','|---|---|---|---|---|---|');
 for(const e of tranches)out.push(`| ${e.id} | ${nom(e.spec)} | ${LIBELLES[e.critere]} | ${e.valeur} | ${e.decision.choix==='changer'?'changée à '+e.decision.valeur:'gardée'} (${e.decision.date}) | ${cell(e.decision.motif||e.constat)} |`);
 out.push('');
}
if(ouverts.length){
 out.push('## Ouverts','','| # | Configuration | Critère | Actuel | Proposé | Attente | Constat |','|---|---|---|---|---|---|---|');
 for(const e of ouverts)out.push(`| ${e.id} | ${nom(e.spec)} | ${LIBELLES[e.critere]} | ${e.valeur} | ${e.proposition} | ${cell(e.attente||'décision')} | ${cell(e.constat)} |`);
 out.push('');
}
out.push('## À surveiller, sans changement proposé','');
for(const w of data.surveiller)out.push(`- **${nom(w.spec)}** · ${LIBELLES[w.critere]} : ${w.constat}`);
out.push('','Les appuis de chaque écart (identifiants de faits) sont dans `ecarts.json` ; les faits et leurs sources, dans `classes/` et `sources.json`.','');
fs.writeFileSync(path.join(dir,'ecarts-a-arbitrer.md'),out.join('\n'));
console.log(JSON.stringify({tranches:tranches.length,ouverts:ouverts.length,surveiller:data.surveiller.length}));
