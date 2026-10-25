'use strict';
// Vérification reproductible des classements, traces et repères communs aux deux parcours.
const fs=require('node:fs'),path=require('node:path');
const E=require('../recommendation-engine.js'),X=require('../result-explanations.js'),P=require('../priority-profiles.js');
const activity={raid:'raid',bg:'bg',sauv:'world',solo:'solo'};
const style={burst:'burst',zone:'zone',ctrl:'ctrl',surv:'surv',mob:'mob',util:'support'};
function run(){
 const html=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
 const D=JSON.parse(html.match(/window\.__WF = (\{.*?\});\s*<\/script>/s)[1]);
 const cases=P.map(p=>({id:p.id,w:p.weights}));
 for(const [id,w] of Object.entries(D.presets))cases.push({id:'historique:'+id,w:E.priorityPreset(id,w)});
 for(const key of E.priorityAxes)cases.push({id:'critère:'+key,w:{[key]:3}});
 const contexts=[{raid:3},{bg:3},{sauv:3},{solo:3},{raid:3,bg:1},{solo:1,sauv:3}];
 for(const role of ['dps','tank','soin'])contexts.forEach((ctx,i)=>cases.push({id:'mixte:'+role+':'+i,w:{[role]:3,...ctx,burst:1,zone:2,ctrl:3,surv:2,mob:1,util:2,poly:1,tech:2}}));
 const result={profiles:cases.length,masteries:4,configurations:E.specs.length,explanations:0,commonReferences:0,checks:0,anomalies:[],limits:[
  'Audit déterministe des cas annoncés ; ce n’est pas une validation des performances en jeu.',
  'Les coefficients des deux parcours diffèrent. Le guide distingue capacité à jouer le rôle et aisance ; le mode personnalisé pondère cette aisance.',
  'En contexte mixte, la certitude du guide et l’importance personnalisée ne sont pas interchangeables. Les repères par activité et par contexte doivent rester communs.'
 ]};
 function check(ok,where,message){result.checks++;if(!ok)result.anomalies.push({where,message});}
 function near(a,b,where,message){check(Number.isFinite(a)&&Number.isFinite(b)&&Math.abs(a-b)<1e-8,where,message+' ('+a+' / '+b+')');}
 for(const c of cases)for(const mastery of [0,1,2,3]){
  const w=E.sanitizeWeights(c.w),rank=E.priorityRanking(w,mastery),scope={};
  for(const k in activity)if(w[k]>0)scope[activity[k]]=5;
  const where=c.id+'/maîtrise:'+mastery;
  check(rank.status==='ok'&&rank.results.length===28,where,'Les 28 configurations doivent être classées');
  check(new Set(rank.results.map(r=>r.spec.id)).size===28,where,'Une seule ligne par configuration');
  for(let i=1;i<rank.results.length;i++)check(rank.results[i-1].score>=rank.results[i].score-1e-8,where,'Ordre décroissant des scores');
  for(const row of rank.results){
   const at=where+'/'+row.spec.id,ex=E.priorityExplain(row.spec.id,w,mastery);result.explanations++;
   near(row.score,ex.score,at,'Classement et explication');
   const groups=Object.values(ex.parts),den=groups.reduce((n,g)=>n+g.weight,0);
   const recomposed=100*groups.reduce((n,g)=>n+g.value*g.weight,0)/den;
   // Une demi-unité du dernier chiffre affiché ; évite les faux écarts aux seuils flottants x.xx5.
   check(Number.isFinite(recomposed)&&Math.abs(ex.score-recomposed)<=.005+1e-8,at,'Recomposition du score à deux décimales');
   const parts=X.priorityParts(ex,ex.score);
   near(parts.reduce((n,g)=>n+g.points,0),Math.round(row.score),at,'Somme des points affichés');
   near(parts.reduce((n,g)=>n+g.max,0),100,at,'Somme des maxima affichés');
   const text=X.friendlyHtml(X.friendlyGroups(ex,true))+X.friendlySummary(ex,true);
   check(!/undefined|NaN|Infinity/.test(text),at,'Explications complètes');
   for(const a of ex.axes){
    if(activity[a.key]){
     const g=E.explain(row.spec.id,{activities:{[activity[a.key]]:5},mastery}).answers.find(x=>x.domain==='activities');
     near(a.note,g.note,at,'Note commune '+a.key);near(a.adjusted,g.adjusted,at,'Maîtrise commune '+a.key);near(a.raw,g.raw,at,'Repère commun '+a.key);result.commonReferences++;
    }else if(style[a.key]){
     const g=E.explain(row.spec.id,{activities:scope,styles:{[style[a.key]]:5},mastery}).answers.find(x=>x.domain==='styles');
     near(a.note,g.note,at,'Note commune '+a.key);near(a.adjusted,g.adjusted,at,'Maîtrise commune '+a.key);near(a.raw,g.raw,at,'Repère commun '+a.key);result.commonReferences++;
    }else if(['tank','soin','dps'].includes(a.key)){
     let aptitude=0;
     if(row.spec.role===a.key){
      const ctx=a.activityContext.activities,keys=Object.keys(ctx);
      for(const k of keys.length?keys:['raid']){
       const g=E.explain(row.spec.id,{roles:{[a.key]:5},activities:{[k]:5},mastery}).answers.find(x=>x.domain==='roles');
       aptitude+=(keys.length?ctx[k]:1)*g.aptitude;
      }
     }
     near(a.aptitude,aptitude,at,'Aisance du rôle dans les activités choisies');result.commonReferences++;
    }else if(a.key==='tech'){
     const g=E.explain(row.spec.id,{activities:scope,difficulty:{value:'complex',certainty:5},mastery}).answers.find(x=>x.domain==='difficulty');
     check(a.context===g.context,at,'Contexte de difficulté commun');
     if(a.contexts)for(const k of ['pve','pvp'])near(a.contexts[k].load,g.contexts[k].load,at,'Difficulté commune '+k);
     else near(a.load,1+4*g.raw,at,'Difficulté commune');result.commonReferences++;
    }else if(a.key==='poly'){
     const roles=new Set(E.specs.filter(s=>s.classId===row.spec.classId).map(s=>s.role));
     near(a.roles,roles.size,at,'Rôles réellement proposés par la classe');result.commonReferences++;
    }
   }
  }
 }
 for(const mastery of [0,1,2,3])check(E.priorityRanking({},mastery).status==='unanswered','vide/'+mastery,'Aucun classement sans critère');
 return result;
}
module.exports=run;
if(require.main===module){const result=run();console.log(JSON.stringify(result,null,2));if(result.anomalies.length)process.exitCode=1;}
