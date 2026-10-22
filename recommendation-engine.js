/* Moteur autonome de recommandation : WoW Forever, édition exploratoire 2026-10-20.
 * Les scores de style/activité sont des hypothèses éditoriales, pas des mesures de niveau 60.
 * Le calcul n'utilise jamais la moyenne composite des 14 critères historiques.
 * Fonctionne dans le navigateur ou avec Node.js, sans dépendance.
 */
(function(root,factory){
  var api=factory();
  if(typeof module==='object' && module.exports)module.exports=api;
  else root.WFRecommend=api;
})(typeof globalThis==='object'?globalThis:this,function(){
'use strict';
var sources={
 guerrier:'https://worldofwarcraft.blizzard.com/en-us/news/24301514',
 paladin:'https://worldofwarcraft.blizzard.com/en-us/news/24302099',
 chasseur:'https://worldofwarcraft.blizzard.com/fr-fr/news/24301515/world-of-warcraft-forever-chasseurchasseresse-et-druidedruidesse',
 voleur:'https://worldofwarcraft.blizzard.com/en-us/news/24310968/world-of-warcraft-forever-class-deep-dives-rogue-and-warlock',
 pretre:'https://worldofwarcraft.blizzard.com/en-us/news/24301514',
 chaman:'https://worldofwarcraft.blizzard.com/en-us/news/24302097',
 mage:'https://worldofwarcraft.blizzard.com/en-us/news/24302097',
 demoniste:'https://worldofwarcraft.blizzard.com/en-us/news/24310968/world-of-warcraft-forever-class-deep-dives-rogue-and-warlock',
 druide:'https://worldofwarcraft.blizzard.com/en-us/news/24301515'
};
var names={guerrier:'Guerrier',paladin:'Paladin',chasseur:'Chasseur',voleur:'Voleur',pretre:'Prêtre',chaman:'Chaman',mage:'Mage',demoniste:'Démoniste',druide:'Druide'};
/* Format : id;classe;spécialisation;role;portée;familier; activités(raid,bg,sauvage,solo); styles(burst,zone,controle,survie,mobilite,soutien); charge d'exécution PvE,PvP.
 * "optionnel" signifie configuration sans familier théoriquement viable, PAS rendement égal.
 * Tous les chiffres d'activité et style sont des hypothèses, à remplacer par télémétrie par spécialisation.
 * Activité raid d'un DPS (référence v7) : dégâts simulés seuls, barèmes 5 ≥ 86 %, 4 de 72 à 85 %, 3 de 55 à 71 %,
 * 2 en dessous ; l'utilité de groupe est notée dans le style Soutien.
 * Source pour rôles/portée : présentation officielle de la classe (sources).
 */
var rows=[
['armes','guerrier','Armes','dps','melee','none', [4,4,3,2],[5,4,3,3,4,2],[2,4]],
['fureur','guerrier','Fureur','dps','melee','none',[5,4,3,3],[4,5,2,3,4,2],[3,3]],
['protection','guerrier','Protection','tank','melee','none',[5,4,2,3],[2,3,3,5,3,3],[3,4]],
['sacre','paladin','Sacré','soin','distance','none',[5,5,4,3],[2,2,2,5,2,5],[2,2]],
['protection','paladin','Protection','tank','melee','none',[4,4,3,5],[3,3,2,5,2,5],[2,2]],
['vindicte','paladin','Vindicte','dps','melee','none',[4,4,4,4],[4,3,2,4,2,4],[2,2]],
['maitrise-betes','chasseur','Maîtrise des bêtes','dps','distance','core',[4,4,4,5],[3,2,3,3,3,2],[1,2]],
['precision','chasseur','Précision','dps','distance','optional',[4,5,4,5],[5,3,3,2,3,2],[2,3]],
['survie','chasseur','Survie','dps','melee','optional',[5,4,4,5],[4,3,4,3,3,2],[4,3]],
['assassinat','voleur','Assassinat','dps','melee','none',[3,3,5,3],[5,2,5,2,4,1],[3,4]],
['combat','voleur','Combat','dps','melee','none',[3,3,4,3],[4,3,4,3,4,1],[2,3]],
['finesse','voleur','Finesse','dps','melee','none',[3,4,5,3],[5,2,5,2,5,1],[3,5]],
['discipline','pretre','Discipline','soin','distance','none',[5,5,4,3],[2,2,3,4,2,5],[3,4]],
['sacre','pretre','Sacré','soin','distance','none',[5,5,3,3],[2,2,3,4,2,5],[2,3]],
['ombre','pretre','Ombre','dps','distance','none',[3,4,4,3],[3,2,4,3,2,4],[3,4]],
['elementaire','chaman','Élémentaire','dps','distance','none',[2,4,4,3],[5,4,3,3,4,4],[3,3]],
['amelioration','chaman','Amélioration','dps','melee','none',[3,4,4,3],[5,3,2,3,5,4],[3,3]],
['restauration','chaman','Restauration','soin','distance','none',[5,5,4,3],[2,2,2,4,4,5],[2,3]],
['arcane','mage','Arcane','dps','distance','none',[4,4,3,3],[5,4,4,2,3,3],[3,4]],
['feu','mage','Feu','dps','distance','none',[4,4,4,3],[5,5,3,2,3,3],[3,4]],
['givre','mage','Givre','dps','distance','none',[3,5,5,3],[4,5,5,3,3,3],[2,4]],
['affliction','demoniste','Affliction','dps','distance','optional',[4,5,5,4],[3,4,5,4,2,3],[3,3]],
['demonologie','demoniste','Démonologie','dps','distance','core',[4,5,4,5],[4,4,4,5,2,3],[3,4]],
['destruction','demoniste','Destruction','dps','distance','optional',[3,5,5,4],[5,4,4,3,2,2],[3,4]],
['equilibre','druide','Équilibre','dps','distance','none',[3,4,4,3],[4,3,3,3,5,5],[3,4]],
['farouche-chat','druide','Farouche (félin)','dps','melee','none',[4,4,4,4],[5,2,3,4,5,3],[4,5]],
['farouche-ours','druide','Farouche (ours)','tank','melee','none',[4,4,3,4],[2,3,3,5,4,4],[4,5]],
['restauration','druide','Restauration','soin','distance','none',[5,5,4,3],[2,2,3,4,5,5],[3,4]]
];
var acts=['raid','bg','world','solo'],styles=['burst','zone','ctrl','surv','mob','support'];
var specs=rows.map(function(r){
  var a={},st={};
  acts.forEach(function(k,i){a[k]=r[6][i];});
  styles.forEach(function(k,i){st[k]=r[7][i];});
  return {id:r[1]+'-'+r[0],classId:r[1],className:names[r[1]],label:r[2],role:r[3],range:r[4],pet:r[5],activity:a,style:st,load:{pve:r[8][0],pvp:r[8][1]},source:sources[r[1]],dataQuality:{officialKit:true,activity:'éditoriale',style:'éditoriale'}};
});
/* Façon de soigner (référence v8) : profil éditorial 1–5 des cinq configurations de soin, d'après les
 * présentations officielles (base de connaissances) : prévenir les dégâts (boucliers, absorptions), soins sur
 * la durée, gros soins ciblés, soins de groupe. Un portrait de jeu, pas un classement de puissance. */
var HEAL_STYLES=['prevention','duree','cible','groupe'];
var HEAL={
 'paladin-sacre':{prevention:1,duree:1,cible:5,groupe:3},
 'pretre-discipline':{prevention:5,duree:2,cible:4,groupe:3},
 'pretre-sacre':{prevention:3,duree:2,cible:4,groupe:5},
 'chaman-restauration':{prevention:1,duree:3,cible:4,groupe:5},
 'druide-restauration':{prevention:1,duree:5,cible:3,groupe:4}
};
specs.forEach(function(s){if(HEAL[s.id])s.heal=HEAL[s.id];});
/* Variantes sans familier (référence v5) : pour chaque configuration à familier facultatif, notes
 * du build joué sans compagnon, uniquement là où le familier compte (base de connaissances).
 * Elles s'appliquent quand le joueur préfère jouer sans compagnon ; la variante répond alors
 * pleinement à ce souhait, et son compromis est porté par ses notes, plus par la préférence.
 * Précision est déjà évaluée en « Loup solitaire » : aucune note ne change. */
var PETLESS={
 'chasseur-precision':{},
 'chasseur-survie':{activity:{solo:4}},
 'demoniste-affliction':{activity:{world:4,solo:3},style:{ctrl:4}},
 'demoniste-destruction':{activity:{world:4,solo:3},style:{ctrl:3}}
};
var petless={};
specs.forEach(function(s){
  if(s.pet!=='optional'||!PETLESS[s.id])return;
  var d=PETLESS[s.id];
  petless[s.id]=Object.assign({},s,{variant:'sans-familier',
    activity:Object.assign({},s.activity,d.activity||{}),style:Object.assign({},s.style,d.style||{})});
});
// Le build de référence de Précision est déjà Loup solitaire. Aucun build avec
// compagnon n'est inventé à partir de ces notes (référence v9).
var REFERENCE_VARIANTS={'chasseur-precision':'sans-familier'};
function referenceSpec(s){return REFERENCE_VARIANTS[s.id]==='sans-familier'?petless[s.id]:s;}
function candidateSpecs(s,p){
  if(REFERENCE_VARIANTS[s.id])return [referenceSpec(s)];
  if(p.pet.value==='avoid'&&petless[s.id])return p.pet.strict?[petless[s.id]]:[s,petless[s.id]];
  return [s];
}
function bestCandidate(s,p){
  var best;
  candidateSpecs(s,p).forEach(function(v){
    var fit=specFit(v,p),row={spec:v,score:Math.round(10000*fit.value)/100,fit:fit.parts};
    // À score égal au centième, le build sans compagnon respecte mieux le souhait.
    if(!best||row.score>best.score||row.score===best.score&&v.variant==='sans-familier')best=row;
  });
  return best;
}
var ROLE=['tank','soin','dps'];
var DEFAULT={roles:{},rolesStrict:false,healStyles:{},activities:{},range:{value:'any',certainty:3,strict:false},styles:{},pet:{value:'any',certainty:3,strict:false},difficulty:{value:'any',certainty:3},mastery:2};
function validCert(v){return Number.isInteger(v)&&v>=0&&v<=5;}
function copy(obj){return JSON.parse(JSON.stringify(obj));}
function sanitize(x){
  var p=copy(DEFAULT);
  if(!x||typeof x!=='object'||Array.isArray(x))return p;
  for(var k of ROLE)if(validCert(x.roles&&x.roles[k]))p.roles[k]=x.roles[k];
  for(var k of acts)if(validCert(x.activities&&x.activities[k]))p.activities[k]=x.activities[k];
  for(var k of styles)if(validCert(x.styles&&x.styles[k])&&selected(p.styles).length<3)p.styles[k]=x.styles[k];
  // Façon de soigner : deux choix au plus, retenus seulement si le rôle Soin est demandé.
  if(selected(p.roles).indexOf('soin')>=0)
    for(var k of HEAL_STYLES)if(validCert(x.healStyles&&x.healStyles[k])&&selected(p.healStyles).length<2)p.healStyles[k]=x.healStyles[k];
  for(var field of ['range','pet','difficulty']){
    var v=x[field];if(!v||typeof v!=='object')continue;
    var allowed=field==='range'?['any','distance','melee','mixte']:field==='pet'?['any','like','avoid']:['any','simple','complex'];
    if(allowed.indexOf(v.value)>=0)p[field].value=v.value;
    if(validCert(v.certainty))p[field].certainty=v.certainty;
    if(field!=='difficulty')p[field].strict=v.strict===true;
  }
  p.rolesStrict=x.rolesStrict===true;
  if(Number.isInteger(x.mastery)&&x.mastery>=0&&x.mastery<=3)p.mastery=x.mastery;
  return p;
}
function selected(obj){return Object.keys(obj).filter(function(k){return validCert(obj[k]);});}
function domains(p){
  var q=[];
  if(selected(p.roles).length)q.push('roles');
  if(selected(p.activities).length)q.push('activities');
  if(p.range.value!=='any')q.push('range');
  if(selected(p.styles).length)q.push('styles');
  if(healActive(p))q.push('healStyles');
  if(p.pet.value!=='any')q.push('pet');
  if(p.difficulty.value!=='any')q.push('difficulty');
  return q;
}
function healActive(p){return selected(p.healStyles).length>0&&selected(p.roles).indexOf('soin')>=0;}
function rolePool(classId){return Array.from(new Set(specs.filter(function(s){return s.classId===classId;}).map(function(s){return s.role;})));}
function distPool(c,p){
  var requested=selected(p.roles);
  return Array.from(new Set(specs.filter(function(s){
    return s.classId===c&&(requested.length===0||requested.indexOf(s.role)>=0);
  }).map(function(s){return s.range;})));
}
function eligible(s,p){
  var roles=selected(p.roles);
  // Seule une exigence explicitement déclarée exclut un rôle : même à 5/5,
  // une préférence souple n'est PAS un filtre dur.
  if(roles.length&&p.rolesStrict){
    if(!roles.includes(s.role))return false;
    if(!roles.every(function(k){return rolePool(s.classId).includes(k);}))return false;
  }
  if(p.range.strict&&p.range.value==='distance'&&s.range!=='distance')return false;
  if(p.range.strict&&p.range.value==='melee'&&s.range!=='melee')return false;
  if(p.range.strict&&p.range.value==='mixte'&&distPool(s.classId,p).length<2)return false;
  if(p.pet.strict&&p.pet.value==='avoid'&&s.pet==='core')return false;
  return true;
}
function clamp(v,lo,hi){return Math.min(hi,Math.max(lo,v));}
function execution(s,k,m){
  var isPve=k==='raid'||k==='solo';
  var load=isPve?s.load.pve:s.load.pvp;
  // Leveling porté par le familier, accessible même en Débutant : réservé à la spécialisation
  // où il est central (Maîtrise des bêtes). Précision et Survie suivent la règle générale.
  if(k==='solo'&&s.classId==='chasseur'&&s.pet==='core')return 0;
  var factor=[-0.29,-0.13,0,0.09][m];
  return clamp(factor*load,-1.2,0.35);
}
function adjustedActivity(s,k,m){return clamp(s.activity[k]+execution(s,k,m),1,5);}
function adjustedStyle(s,k,m){
  var pvp=k==='ctrl'||k==='surv';
  var domain=pvp?'world':'raid';
  return clamp(s.style[k]+execution(s,domain,m)*0.55,1,5);
}
/* Difficulté selon les activités (référence v6) : la préférence de difficulté juge la charge PvE si
 * le joueur n'a choisi que des activités PvE (donjons et raids, solo), la charge PvP s'il n'a choisi
 * que du PvP (champs de bataille, PvP sauvage), sinon la moyenne des deux. */
function difficultyContext(p){
  var a=selected(p.activities);
  var pve=a.some(function(k){return k==='raid'||k==='solo';}),pvp=a.some(function(k){return k==='bg'||k==='world';});
  return pve&&!pvp?'pve':pvp&&!pve?'pvp':'mixte';
}
function difficultyLoad(s,p){
  var c=difficultyContext(p);
  return c==='pve'?s.load.pve:c==='pvp'?s.load.pvp:(s.load.pve+s.load.pvp)/2;
}
function intensity(cert){return .25+.75*cert/5;}
function preferenceFit(raw,cert){return .5+intensity(cert)*(raw-.5);}
function aggregate(keys,answers,rawFn){
  if(!keys.length)return null;
  return keys.reduce(function(t,k){return t+preferenceFit(rawFn(k),answers[k]);},0)/keys.length;
}
function specFit(s,p,trace){
  var parts={};
  // La trace lit les valeurs du calcul lui-même ; elle ne participe pas au classement.
  function record(domain,key,base,raw,certainty,note,adjusted){
    if(trace)trace.push({domain:domain,key:key,base:base,raw:raw,certainty:certainty,
      fit:preferenceFit(raw,certainty),note:note,adjusted:adjusted});
    return raw;
  }
  var roles=selected(p.roles),activities=selected(p.activities),sty=selected(p.styles);
  if(roles.length){
    var coverage=roles.filter(function(k){return rolePool(s.classId).includes(k);}).length/roles.length;
    // Deux rôles demandés donnent un intérêt explicite à pouvoir alterner.
    var mainWeight=roles.length===1?1:roles.reduce(function(t,k){return t+(k===s.role?1+p.roles[k]/5:0);},0)/
      roles.reduce(function(t,k){return t+1+p.roles[k]/5;},0);
    var certainty=roles.reduce(function(t,k){return t+p.roles[k];},0)/roles.length;
    var rolePve=roleSuitability(s,p.mastery);
    var raw=roles.length===1?(s.role===roles[0]?(.25+.75*rolePve):0):.65*coverage+.35*mainWeight*rolePve;
    parts.roles={value:preferenceFit(raw,certainty),weight:0.25};
    var referenceRole=roleSuitability(s,2);
    record('roles','roles',roles.length===1?(s.role===roles[0]?(.25+.75*referenceRole):0):.65*coverage+.35*mainWeight*referenceRole,raw,certainty);
    // Pour l'explication seulement : rôles demandés que propose la classe, aisance estimée de la spécialisation.
    if(trace){trace[trace.length-1].covered=roles.filter(function(k){return rolePool(s.classId).includes(k);});trace[trace.length-1].aptitude=rolePve;}
  }
  if(activities.length)parts.activities={value:aggregate(activities,p.activities,function(k){var a=adjustedActivity(s,k,p.mastery);return record('activities',k,(s.activity[k]-1)/4,(a-1)/4,p.activities[k],s.activity[k],a);}),weight:.25};
  if(p.range.value!=='any'){
    var v=p.range.value==='mixte'?(distPool(s.classId,p).length>=2?1:.28):s.range===p.range.value?1:.12;
    parts.range={value:preferenceFit(v,p.range.certainty),weight:.15};
    record('range',p.range.value,v,v,p.range.certainty);
  }
  if(sty.length)parts.styles={value:aggregate(sty,p.styles,function(k){var a=adjustedStyle(s,k,p.mastery);return record('styles',k,(s.style[k]-1)/4,(a-1)/4,p.styles[k],s.style[k],a);}),weight:.20};
  // Une envie de soin s'applique à toutes les pistes : un autre rôle n'y répond pas.
  // Même dénominateur, aucun veto implicite et aucune note de soin inventée hors rôle.
  if(healActive(p))parts.healStyles={value:aggregate(selected(p.healStyles),p.healStyles,function(k){var note=s.heal?s.heal[k]:undefined,v=s.heal?(note-1)/4:0;return record('healStyles',k,v,v,p.healStyles[k],note,note);}),weight:.15};
  if(p.pet.value!=='any'){
    var without=s.pet==='none'||s.variant==='sans-familier';
    var v=p.pet.value==='like'?(without?.1:s.pet==='core'?1:.76):(without?1:.05);
    parts.pet={value:preferenceFit(v,p.pet.certainty),weight:.10};
    record('pet',p.pet.value,v,v,p.pet.certainty);
  }
  if(p.difficulty.value!=='any'){
    var load=difficultyLoad(s,p);var v=p.difficulty.value==='simple'?(5-load)/4:(load-1)/4;
    parts.difficulty={value:preferenceFit(v,p.difficulty.certainty),weight:.05};
    record('difficulty',p.difficulty.value,v,v,p.difficulty.certainty);
  }
  var denom=Object.keys(parts).reduce(function(t,k){return t+parts[k].weight;},0);
  var value=denom?Object.keys(parts).reduce(function(t,k){return t+parts[k].value*parts[k].weight;},0)/denom:null;
  return {value:value,parts:parts};
}
// Détail explicatif du parcours guidé. Les rôles multiples restent une réponse groupée :
// leur couverture et la spécialisation principale interagissent dans la formule du codex.
function explain(id,profile){
  var p=sanitize(profile),original=specs.find(function(s){return s.id===id;});
  if(!original||!eligible(original,p)||!domains(p).length)return null;
  var s=bestCandidate(original,p).spec,answers=[],result=specFit(s,p,answers);
  var denom=Object.keys(result.parts).reduce(function(t,k){return t+result.parts[k].weight;},0);
  answers.forEach(function(a){
    var count=answers.filter(function(b){return b.domain===a.domain;}).length;
    a.max=100*result.parts[a.domain].weight/denom/count;
    a.points=a.max*a.fit;a.loss=a.max-a.points;
    a.causes={aptitude:(1-a.base)*a.max,mastery:(a.base-a.raw)*a.max,certainty:(a.raw-a.fit)*a.max};
  });
  return {spec:s,profile:p,score:Math.round(10000*result.value)/100,rawScore:100*result.value,answers:answers};
}
/* Potentiel d'une configuration ajusté à la maîtrise (codex § 3.4) : adéquation PvE
 * éditoriale (activité « raid ») après effet de la maîtrise, sur 0…1. */
function potential(s,m){return (adjustedActivity(s,'raid',m)-1)/4;}
function potentialKey(s,m){return Math.round(potential(s,m)*1e4);}
/* Classements par spécialisation (référence v10) : chaque configuration admissible est classée, une
 * classe peut donc revenir. Ordre : score au centième, puis classe, puis potentiel ajusté à la maîtrise,
 * puis identifiant. La première configuration de chaque classe est celle que la v3 retenait (à score
 * égal, le plus haut potentiel) et l'ordre de ces premières configurations est celui de la v9.
 * Jamais un arrondi flottant : le potentiel est comparé en entiers. */
function byScore(m){
  return function(a,b){
    return b.score-a.score||(a.spec.classId<b.spec.classId?-1:a.spec.classId>b.spec.classId?1:0)||
      potentialKey(b.spec,m)-potentialKey(a.spec,m)||(a.spec.id<b.spec.id?-1:a.spec.id>b.spec.id?1:0);
  };
}
function ranking(profile){
  var p=sanitize(profile),used=domains(p);
  if(!used.length)return {status:'unanswered',profile:p,used:used,results:[],compatible:0};
  var candidates=specs.filter(function(s){return eligible(s,p);}).map(function(s){return bestCandidate(s,p);}).sort(byScore(p.mastery));
  if(!candidates.length)return {status:'no-match',profile:p,used:used,results:[],compatible:0};
  return {status:'ok',profile:p,used:used,results:candidates,compatible:candidates.length};
}
/* Top 3 du parcours guidé : au plus deux spécialisations d'une même classe ; la place suivante va à
 * la meilleure configuration d'une autre classe. */
var MAX_PER_CLASS=2;
function topPicks(results,n){
  var count={},out=[];
  for(var i=0;i<results.length&&out.length<n;i++){
    var c=results[i].spec.classId;
    if((count[c]||0)>=MAX_PER_CLASS)continue;
    count[c]=(count[c]||0)+1;out.push(results[i]);
  }
  return out;
}
function perturbations(p){
  var out=[{label:'Réponses actuelles',profile:p}],fields=['roles','activities','styles','healStyles'];
  for(var field of fields)for(var key of selected(p[field])){
    if(p[field][key]<=2){
      var next=copy(p);delete next[field][key];
      if(field==='roles'&&next.rolesStrict)next.rolesStrict=false;
      out.push({label:'Sans '+field+'/'+key,profile:next});
    }
  }
  for(var kind of ['range','pet','difficulty'])if(p[kind].value!=='any'&&p[kind].certainty<=2&&!p[kind].strict){
    var n=copy(p);n[kind].value='any';
    out.push({label:'Sans '+kind,profile:n});
  }
  return out;
}
/* `count` pistes (3 par défaut, valeur de la photographie de référence) ; l'interface du parcours guidé
 * en demande cinq. La stabilité d'une piste est sa présence parmi les `count` premières de chaque scénario. */
function recommend(profile,count){
  var n=Number.isInteger(count)&&count>=1?Math.min(count,specs.length):3;
  var base=ranking(profile);
  if(base.status!=='ok')return Object.assign({},base,{top:[],scenarios:[],uncertain:[]});
  var scenarios=perturbations(base.profile);
  var probes=scenarios.map(function(s){return {label:s.label,ranking:ranking(s.profile)};});
  var active=probes.filter(function(x){return x.ranking.status==='ok';});
  var top=topPicks(base.results,n).map(function(r){
    // Stabilité par spécialisation : sa présence parmi les n premières pistes de chaque scénario admissible.
    var appearances=active.filter(function(x){return topPicks(x.ranking.results,n).some(function(q){return q.spec.id===r.spec.id;});}).length;
    var sorted=Object.keys(r.fit).sort(function(a,b){return r.fit[b].value-r.fit[a].value;});
    var positives=sorted.filter(function(k){return r.fit[k].value>=.56;}).slice(0,2);
    var negatives=sorted.slice().reverse().filter(function(k){return r.fit[k].value<.55;}).slice(0,2);
    return {classId:r.spec.classId,className:r.spec.className,spec:r.spec,score:r.score,
      strengths:positives,tradeoffs:negatives,fit:r.fit,scenarioCount:active.length,
      scenarioAppearances:appearances,reliability:'Estimation éditoriale (niveau 60 non observé)',
      note:'Classe et spécialisation recommandées pour les réponses déclarées, sans probabilité calibrée.'};
  });
  return Object.assign({},base,{top:top,scenarios:probes.map(function(x){return {name:x.label,status:x.ranking.status,top:topPicks(x.ranking.results,n).map(function(r){return r.spec.id;})};}),
    uncertain:scenarios.slice(1).map(function(x){return x.label;})});
}
/* Classement à 14 priorités : même inventaire de spécialisations que le parcours guidé.
 * Les axes sont répartis en domaines pour éviter de compter trois fois le rôle
 * ou de surpondérer un domaine parce que plusieurs de ses axes sont cochés.
 */
var PRIORITY_AXES=['poly','tank','soin','dps','bg','sauv','burst','zone','ctrl','surv','mob','util','solo','tech'];
function sanitizeWeights(input){
  var weights={};
  PRIORITY_AXES.forEach(function(k){
    weights[k]=input&&Number.isInteger(input[k])&&input[k]>=0&&input[k]<=3?input[k]:0;
  });
  return weights;
}
/* Référentiel éditorial historique par classe et rôle (indice 1–5).
 * Conserve le contexte des notes de rôle de index.html, mais évalue en plus
 * la configuration spécialisée en activité raid pour empêcher les 100% universels.
 * Révision éditoriale v2 : soins Paladin/Chaman 5, contrôle Discipline 3.
 * Vérification de synchronisation avec les 126 notes affichées dans les tests.
 */
var ROLE_REFERENCE={
 guerrier:{tank:5,soin:1,dps:5},paladin:{tank:4,soin:5,dps:4},
 chasseur:{tank:1,soin:1,dps:5},voleur:{tank:1,soin:1,dps:3},
 pretre:{tank:1,soin:5,dps:3},chaman:{tank:2,soin:5,dps:3},
 mage:{tank:1,soin:1,dps:4},demoniste:{tank:1,soin:1,dps:4},
 druide:{tank:4,soin:5,dps:3}
};
function roleSuitability(s,m){
 var baseline=(ROLE_REFERENCE[s.classId][s.role]-1)/4;
 return clamp(.55*baseline+.45*potential(s,m),0,1);
}
/* Classement à 14 priorités : groupes, adéquations et score, partagés par le classement et son
 * explication (priorityExplain), pour qu'ils ne puissent pas diverger. */
var PRIORITY_GROUPS=[
  {id:'roles',axes:['tank','soin','dps'],factor:.30},
  {id:'activities',axes:['bg','sauv','solo'],factor:.28},
  {id:'style',axes:['burst','zone','ctrl','surv','mob','util'],factor:.28},
  {id:'affinity',axes:['poly','tech'],factor:.14}
];
var PRIORITY_ACTIVITY={bg:'bg',sauv:'world',solo:'solo'};
var PRIORITY_STYLE={burst:'burst',zone:'zone',ctrl:'ctrl',surv:'surv',mob:'mob',util:'support'};
/* Technicité (référence v10) : comme la difficulté du parcours guidé (v6), elle suit les critères
 * d'activité. PvP : champ de bataille, PvP sauvage ; PvE : solo et rôles, évalués en PvE ; les deux,
 * ou aucun : moyenne des difficultés PvE et PvP. */
function techContext(w){
  var pvp=w.bg>0||w.sauv>0,pve=w.solo>0||w.tank>0||w.soin>0||w.dps>0;
  return pvp&&!pve?'pvp':pve&&!pvp?'pve':'mixte';
}
function techLoad(s,ctx){return ctx==='pve'?s.load.pve:ctx==='pvp'?s.load.pvp:(s.load.pve+s.load.pvp)/2;}
function priorityRaw(s,k,m,ctx){
  // Un rôle n'est pas une note de performance : les spécialisations d'un même
  // rôle reçoivent une adéquation PvE distincte (proxy éditorial 'raid').
  // Le rôle inadéquat vaut 0 ; impossible d'agréger les meilleures spés d'une classe.
  if(k==='tank'||k==='soin'||k==='dps')return s.role===k?roleSuitability(s,m):0;
  if(PRIORITY_ACTIVITY[k])return (adjustedActivity(s,PRIORITY_ACTIVITY[k],m)-1)/4;
  if(PRIORITY_STYLE[k])return (adjustedStyle(s,PRIORITY_STYLE[k],m)-1)/4;
  if(k==='poly')return (rolePool(s.classId).length-1)/2;
  if(k==='tech')return clamp((techLoad(s,ctx||'mixte')-1)/4,0,1);
  return .5;
}
function priorityFit(s,w,m,active,trace){
  var parts={},numer=0,denom=0,ctx=techContext(w);
  for(var g of PRIORITY_GROUPS){
    var axes=g.axes.filter(function(k){return w[k]>0;});
    if(!axes.length)continue;
    // Rôles exprimés : l'aptitude à exercer la spécialisation préférée
    // est une seule dimension ; les autres groupes sont moyens, pas additionnés.
    var weighted=axes.reduce(function(t,k){return t+w[k]*priorityRaw(s,k,m,ctx);},0);
    var total=axes.reduce(function(t,k){return t+w[k];},0);
    var value=weighted/total;
    var importance=g.factor*Math.max.apply(null,axes.map(function(k){return w[k];}))/3;
    parts[g.id]={value:value,weight:importance};
    numer+=value*importance;denom+=importance;
    if(trace)axes.forEach(function(k){
      var row={group:g.id,key:k,weight:w[k],share:w[k]/total,raw:priorityRaw(s,k,m,ctx)};
      if(PRIORITY_ACTIVITY[k]){row.note=s.activity[PRIORITY_ACTIVITY[k]];row.adjusted=adjustedActivity(s,PRIORITY_ACTIVITY[k],m);}
      if(PRIORITY_STYLE[k]){row.note=s.style[PRIORITY_STYLE[k]];row.adjusted=adjustedStyle(s,PRIORITY_STYLE[k],m);}
      if(k==='poly')row.roles=rolePool(s.classId).length;
      if(k==='tech'){row.load=techLoad(s,ctx);row.context=ctx;}
      trace.push(row);
    });
  }
  // Un critère unique doit donner le même score quel que soit son poids :
  // éviter la dérive d'arrondi des divisions flottantes normalisées.
  return {score:active.length===1?100*priorityRaw(s,active[0],m,ctx):(denom?100*numer/denom:0),parts:parts};
}
function priorityInput(input,mastery){
  var w=sanitizeWeights(input),m=Number.isInteger(mastery)&&mastery>=0&&mastery<=3?mastery:2;
  return {w:w,m:m,active:PRIORITY_AXES.filter(function(k){return w[k]>0;})};
}
function priorityRanking(input,mastery){
  var q=priorityInput(input,mastery),w=q.w,m=q.m,active=q.active;
  if(!active.length)return {status:'unanswered',results:[],active:[],weights:w,mastery:m};
  // Les 28 configurations, dans l'ordre commun aux deux parcours (référence v10).
  var results=specs.map(function(original){
    var sp=referenceSpec(original),r=priorityFit(sp,w,m,active);
    return {spec:sp,classId:sp.classId,className:sp.className,score:Math.round(r.score*100)/100,parts:r.parts};
  }).sort(byScore(m));
  return {status:'ok',results:results,active:active,weights:w,mastery:m,
    caveat:'Indice heuristique par spécialisation. Les égalités et faibles écarts ne sont pas des mesures de supériorité.'};
}
/* Détail explicatif du mode personnalisé : les valeurs du calcul lui-même, critère par critère.
 * N'intervient pas dans le classement. */
function priorityExplain(id,input,mastery){
  var q=priorityInput(input,mastery),original=specs.find(function(s){return s.id===id;});
  if(!q.active.length||!original)return null;
  var s=referenceSpec(original),axes=[],r=priorityFit(s,q.w,q.m,q.active,axes);
  return {spec:s,score:Math.round(r.score*100)/100,parts:r.parts,axes:axes,weights:q.w,mastery:q.m};
}
function checkData(){
 var errors=[],ids=new Set();
 for(var s of specs){
  if(ids.has(s.id))errors.push('doublon '+s.id);ids.add(s.id);
  if(!sources[s.classId]||ROLE.indexOf(s.role)<0||['distance','melee'].indexOf(s.range)<0||['none','optional','core'].indexOf(s.pet)<0)errors.push('structure '+s.id);
  for(var k of acts)if(!Number.isInteger(s.activity[k])||s.activity[k]<1||s.activity[k]>5)errors.push('activité '+s.id+':'+k);
  for(var k of styles)if(!Number.isInteger(s.style[k])||s.style[k]<1||s.style[k]>5)errors.push('style '+s.id+':'+k);
  if(s.pet==='optional'&&!petless[s.id])errors.push('variante sans familier manquante '+s.id);
  if((s.role==='soin')!==!!s.heal)errors.push('profil de soin '+s.id);
  if(s.heal)for(var h of HEAL_STYLES)if(!Number.isInteger(s.heal[h])||s.heal[h]<1||s.heal[h]>5)errors.push('soin '+s.id+':'+h);
 }
 for(var id in PETLESS){
  var base=specs.find(function(x){return x.id===id;});
  if(!base||base.pet!=='optional')errors.push('variante sans familier sans objet '+id);
  else for(var part of ['activity','style'])for(var k in PETLESS[id][part]||{}){
   var v=PETLESS[id][part][k];
   if(!(k in base[part])||!Number.isInteger(v)||v<1||v>5)errors.push('variante '+id+':'+k);
  }
 }
 return errors;
}
return {version:'1.0.9-exploratoire',referenceVariants:REFERENCE_VARIANTS,healStyles:HEAL_STYLES,sources:sources,specs:specs,petless:petless,difficultyContext:difficultyContext,difficultyLoad:difficultyLoad,roles:ROLE,activities:acts,styles:styles,
 defaultProfile:copy(DEFAULT),sanitize:sanitize,selected:selected,domains:domains,eligible:eligible,
 ranking:ranking,recommend:recommend,topPicks:topPicks,maxPerClass:MAX_PER_CLASS,techContext:techContext,explain:explain,priorityExplain:priorityExplain,checkData:checkData,intensity:intensity,preferenceFit:preferenceFit,
 rolePool:rolePool,adjustedActivity:adjustedActivity,potential:potential,roleSuitability:roleSuitability,roleReference:ROLE_REFERENCE,priorityAxes:PRIORITY_AXES,priorityRanking:priorityRanking,sanitizeWeights:sanitizeWeights};
});
