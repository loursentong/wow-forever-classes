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
['combat','voleur','Combat','dps','melee','none',[4,3,4,3],[4,3,4,3,4,1],[2,3]],
['finesse','voleur','Finesse','dps','melee','none',[3,4,5,3],[5,2,5,2,5,1],[3,5]],
['discipline','pretre','Discipline','soin','distance','none',[5,5,4,3],[2,2,4,4,2,5],[3,4]],
['sacre','pretre','Sacré','soin','distance','none',[5,5,3,3],[2,2,3,4,2,5],[2,3]],
['ombre','pretre','Ombre','dps','distance','none',[3,4,4,3],[3,2,4,3,2,4],[3,4]],
['elementaire','chaman','Élémentaire','dps','distance','none',[3,4,4,3],[5,4,3,3,4,4],[3,3]],
['amelioration','chaman','Amélioration','dps','melee','none',[4,4,4,3],[5,3,2,3,5,4],[3,3]],
['restauration','chaman','Restauration','soin','distance','none',[5,5,4,3],[2,2,2,4,4,5],[2,3]],
['arcane','mage','Arcane','dps','distance','none',[4,4,3,3],[5,4,4,2,3,3],[3,4]],
['feu','mage','Feu','dps','distance','none',[4,4,4,3],[5,5,3,2,3,3],[3,4]],
['givre','mage','Givre','dps','distance','none',[3,5,5,3],[4,5,5,3,3,3],[2,4]],
['affliction','demoniste','Affliction','dps','distance','optional',[4,5,5,4],[3,4,5,4,2,3],[3,3]],
['demonologie','demoniste','Démonologie','dps','distance','core',[4,5,4,5],[4,4,4,5,2,3],[3,4]],
['destruction','demoniste','Destruction','dps','distance','optional',[4,5,5,4],[5,4,4,3,2,2],[3,4]],
['equilibre','druide','Équilibre','dps','distance','none',[3,4,4,3],[4,3,3,3,5,5],[3,4]],
['farouche-chat','druide','Farouche (félin)','dps','melee','none',[4,4,4,4],[5,3,3,4,5,3],[4,5]],
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
var ROLE=['tank','soin','dps'];
var DEFAULT={roles:{},rolesStrict:false,activities:{},range:{value:'any',certainty:3,strict:false},styles:{},pet:{value:'any',certainty:3,strict:false},difficulty:{value:'any',certainty:3},mastery:2};
function validCert(v){return Number.isInteger(v)&&v>=0&&v<=5;}
function copy(obj){return JSON.parse(JSON.stringify(obj));}
function sanitize(x){
  var p=copy(DEFAULT);
  if(!x||typeof x!=='object'||Array.isArray(x))return p;
  for(var k of ROLE)if(validCert(x.roles&&x.roles[k]))p.roles[k]=x.roles[k];
  for(var k of acts)if(validCert(x.activities&&x.activities[k]))p.activities[k]=x.activities[k];
  for(var k of styles)if(validCert(x.styles&&x.styles[k])&&selected(p.styles).length<3)p.styles[k]=x.styles[k];
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
  if(p.pet.value!=='any')q.push('pet');
  if(p.difficulty.value!=='any')q.push('difficulty');
  return q;
}
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
  if(k==='solo'&&s.classId==='chasseur')return 0; // Familiers/kit de leveling accessibles même au niveau Débutant
  var factor=[-0.29,-0.13,0,0.09][m];
  return clamp(factor*load,-1.2,0.35);
}
function adjustedActivity(s,k,m){return clamp(s.activity[k]+execution(s,k,m),1,5);}
function adjustedStyle(s,k,m){
  var pvp=k==='ctrl'||k==='surv';
  var domain=pvp?'world':'raid';
  return clamp(s.style[k]+execution(s,domain,m)*0.55,1,5);
}
function intensity(cert){return .25+.75*cert/5;}
function preferenceFit(raw,cert){return .5+intensity(cert)*(raw-.5);}
function aggregate(keys,answers,rawFn){
  if(!keys.length)return null;
  return keys.reduce(function(t,k){return t+preferenceFit(rawFn(k),answers[k]);},0)/keys.length;
}
function specFit(s,p){
  var parts={};
  var roles=selected(p.roles),activities=selected(p.activities),sty=selected(p.styles);
  if(roles.length){
    var coverage=roles.filter(function(k){return rolePool(s.classId).includes(k);}).length/roles.length;
    // Deux rôles demandés donnent un intérêt explicite à pouvoir alterner.
    var mainWeight=roles.length===1?1:roles.reduce(function(t,k){return t+(k===s.role?1+p.roles[k]/5:0);},0)/
      roles.reduce(function(t,k){return t+1+p.roles[k]/5;},0);
    var certainty=roles.reduce(function(t,k){return t+p.roles[k];},0)/roles.length;
    var rolePve=(adjustedActivity(s,'raid',p.mastery)-1)/4;
    var raw=roles.length===1?(s.role===roles[0]?(.25+.75*rolePve):0):.65*coverage+.35*mainWeight*rolePve;
    parts.roles={value:preferenceFit(raw,certainty),weight:0.25};
  }
  if(activities.length)parts.activities={value:aggregate(activities,p.activities,function(k){return (adjustedActivity(s,k,p.mastery)-1)/4;}),weight:.25};
  if(p.range.value!=='any'){
    var v=p.range.value==='mixte'?(distPool(s.classId,p).length>=2?1:.28):s.range===p.range.value?1:.12;
    parts.range={value:preferenceFit(v,p.range.certainty),weight:.15};
  }
  if(sty.length)parts.styles={value:aggregate(sty,p.styles,function(k){return (adjustedStyle(s,k,p.mastery)-1)/4;}),weight:.20};
  if(p.pet.value!=='any'){
    var v=p.pet.value==='like'?(s.pet==='core'?1:s.pet==='optional'?.76:.1):
      (s.pet==='none'?1:s.pet==='optional'?.78:.05);
    parts.pet={value:preferenceFit(v,p.pet.certainty),weight:.10};
  }
  if(p.difficulty.value!=='any'){
    var load=(s.load.pve+s.load.pvp)/2;var v=p.difficulty.value==='simple'?(5-load)/4:(load-1)/4;
    parts.difficulty={value:preferenceFit(v,p.difficulty.certainty),weight:.05};
  }
  var denom=Object.keys(parts).reduce(function(t,k){return t+parts[k].weight;},0);
  var value=denom?Object.keys(parts).reduce(function(t,k){return t+parts[k].value*parts[k].weight;},0)/denom:null;
  return {value:value,parts:parts};
}
function stableSort(a,b){return b.score-a.score||a.spec.id.localeCompare(b.spec.id);}
function ranking(profile){
  var p=sanitize(profile),used=domains(p);
  if(!used.length)return {status:'unanswered',profile:p,used:used,results:[],compatible:0};
  var candidates=specs.filter(function(s){return eligible(s,p);}).map(function(s){
    var fit=specFit(s,p);
    return {spec:s,score:Math.round(10000*fit.value)/100,fit:fit.parts};
  }).sort(stableSort);
  if(!candidates.length)return {status:'no-match',profile:p,used:used,results:[],compatible:0};
  var seen=new Set(),unique=[];
  for(var r of candidates)if(!seen.has(r.spec.classId)){seen.add(r.spec.classId);unique.push(r);}
  return {status:'ok',profile:p,used:used,results:unique,compatible:candidates.length};
}
function perturbations(p){
  var out=[{label:'Réponses actuelles',profile:p}],fields=['roles','activities','styles'];
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
function recommend(profile){
  var base=ranking(profile);
  if(base.status!=='ok')return Object.assign({},base,{top:[],scenarios:[],uncertain:[]});
  var scenarios=perturbations(base.profile);
  var probes=scenarios.map(function(s){return {label:s.label,ranking:ranking(s.profile)};});
  var active=probes.filter(function(x){return x.ranking.status==='ok';});
  var top=base.results.slice(0,3).map(function(r){
    var appearances=active.filter(function(x){return x.ranking.results.slice(0,3).some(function(q){return q.spec.classId===r.spec.classId;});}).length;
    var sorted=Object.keys(r.fit).sort(function(a,b){return r.fit[b].value-r.fit[a].value;});
    var positives=sorted.filter(function(k){return r.fit[k].value>=.56;}).slice(0,2);
    var negatives=sorted.slice().reverse().filter(function(k){return r.fit[k].value<.55;}).slice(0,2);
    return {classId:r.spec.classId,className:r.spec.className,spec:r.spec,score:r.score,
      strengths:positives,tradeoffs:negatives,fit:r.fit,scenarioCount:active.length,
      scenarioAppearances:appearances,reliability:'Estimation éditoriale (niveau 60 non observé)',
      note:'Classe et spécialisation recommandées pour les réponses déclarées, sans probabilité calibrée.'};
  });
  return Object.assign({},base,{top:top,scenarios:probes.map(function(x){return {name:x.label,status:x.ranking.status,top:x.ranking.results.slice(0,3).map(function(r){return r.spec.classId;})};}),
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
function priorityRanking(input,mastery){
  var w=sanitizeWeights(input),m=Number.isInteger(mastery)&&mastery>=0&&mastery<=3?mastery:2;
  var active=PRIORITY_AXES.filter(function(k){return w[k]>0;});
  if(!active.length)return {status:'unanswered',results:[],active:[],weights:w,mastery:m};
  var groups=[
    {id:'roles',axes:['tank','soin','dps'],factor:.30},
    {id:'activities',axes:['bg','sauv','solo'],factor:.28},
    {id:'style',axes:['burst','zone','ctrl','surv','mob','util'],factor:.28},
    {id:'affinity',axes:['poly','tech'],factor:.14}
  ];
  var activityMap={bg:'bg',sauv:'world',solo:'solo'};
  var styleMap={burst:'burst',zone:'zone',ctrl:'ctrl',surv:'surv',mob:'mob',util:'support'};
  function raw(s,k){
    // Un rôle n'est pas une note de performance : les spécialisations d'un même
    // rôle reçoivent une adéquation PvE distincte (proxy éditorial 'raid').
    // Le rôle inadéquat vaut 0 ; impossible d'agréger les meilleures spés d'une classe.
    if(k==='tank'||k==='soin'||k==='dps')return s.role===k?(adjustedActivity(s,'raid',m)-1)/4:0;
    if(activityMap[k])return (adjustedActivity(s,activityMap[k],m)-1)/4;
    if(styleMap[k])return (adjustedStyle(s,styleMap[k],m)-1)/4;
    if(k==='poly')return (rolePool(s.classId).length-1)/2;
    if(k==='tech')return clamp(((s.load.pve+s.load.pvp)/2-1)/4,0,1);
    return .5;
  }
  function fit(s){
    var parts={},numer=0,denom=0;
    for(var g of groups){
      var axes=g.axes.filter(function(k){return w[k]>0;});
      if(!axes.length)continue;
      // Rôles exprimés : l'aptitude à exercer la spécialisation préférée
      // est une seule dimension ; les autres groupes sont moyens, pas additionnés.
      var weighted=axes.reduce(function(t,k){return t+w[k]*raw(s,k);},0);
      var total=axes.reduce(function(t,k){return t+w[k];},0);
      var value=weighted/total;
      var importance=g.factor*Math.max.apply(null,axes.map(function(k){return w[k];}))/3;
      parts[g.id]={value:value,weight:importance};
      numer+=value*importance;denom+=importance;
    }
    return {score:denom?100*numer/denom:0,parts:parts};
  }
  var byClass={};
  for(var sp of specs){
    var r=fit(sp);
    if(!byClass[sp.classId]||r.score>byClass[sp.classId].score){
      byClass[sp.classId]={spec:sp,classId:sp.classId,className:sp.className,
        score:Math.round(r.score*100)/100,parts:r.parts};
    }
  }
  var results=Object.keys(byClass).map(function(k){return byClass[k];})
    .sort(function(a,b){return b.score-a.score||a.className.localeCompare(b.className,'fr');});
  return {status:'ok',results:results,active:active,weights:w,mastery:m,
    caveat:'Indice heuristique par spécialisation. Les égalités et faibles écarts ne sont pas des mesures de supériorité.'};
}
function checkData(){
 var errors=[],ids=new Set();
 for(var s of specs){
  if(ids.has(s.id))errors.push('doublon '+s.id);ids.add(s.id);
  if(!sources[s.classId]||ROLE.indexOf(s.role)<0||['distance','melee'].indexOf(s.range)<0||['none','optional','core'].indexOf(s.pet)<0)errors.push('structure '+s.id);
  for(var k of acts)if(!Number.isInteger(s.activity[k])||s.activity[k]<1||s.activity[k]>5)errors.push('activité '+s.id+':'+k);
  for(var k of styles)if(!Number.isInteger(s.style[k])||s.style[k]<1||s.style[k]>5)errors.push('style '+s.id+':'+k);
 }
 return errors;
}
return {version:'1.0.0-exploratoire',sources:sources,specs:specs,roles:ROLE,activities:acts,styles:styles,
 defaultProfile:copy(DEFAULT),sanitize:sanitize,selected:selected,domains:domains,eligible:eligible,
 ranking:ranking,recommend:recommend,checkData:checkData,intensity:intensity,preferenceFit:preferenceFit,
 rolePool:rolePool,adjustedActivity:adjustedActivity,priorityAxes:PRIORITY_AXES,priorityRanking:priorityRanking,sanitizeWeights:sanitizeWeights};
});
