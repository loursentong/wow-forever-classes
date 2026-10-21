'use strict';
// Vérification de bout en bout de la publication GitHub Pages, exécutée APRÈS deploy-pages.
// Les caches CDN peuvent prendre quelques secondes à se synchroniser.
const BASE='https://loursentong.github.io/wow-forever-classes/';
const SHA=(process.env.GITHUB_SHA||'manual').slice(0,12);
const expected={
 'index.html':'data-reco-mode="priorities"',
 'recommendation-engine.js':'priorityRanking',
 'questionnaire.js':'WFGuide',
 'priorities-ui.js':'priorityRanking',
 'ux-polish.css':'reco-reveal-button',
 'warcraft-visual-pack.css':'--wow-gold:#eac061',
 'wow-ui-rework.css':'reco-step-rail',
 'refonte-forever.css':'rf-band',
 'configuration-notes.js':'guerrier-armes',
 'configuration-details.js':'reco-config-details',
 'result-explanations.js':'WFResultExplanations',
 'configuration-notes.css':'reco-config-details',
 'assets/hero-landscape.svg':'<svg',
 'assets/img/hero-arbre-monde.webp':'WEBP',
 'assets/img/logo-wow-forever.webp':'WEBP'
};
(async()=>{
 for(let attempt=1;attempt<=18;attempt++){
  const state=[];
  for(const [name,signature] of Object.entries(expected)){
   const url=BASE+(name==='index.html'?'':name)+'?pages-check='+SHA+'-'+attempt;
   try{
    const res=await fetch(url,{signal:AbortSignal.timeout(12000),headers:{'cache-control':'no-cache'}});
    const text=await res.text();
    state.push({file:name,http:res.status,valid:res.status===200&&text.includes(signature)});
   }catch(e){state.push({file:name,error:String(e),valid:false});}
  }
  console.log('Pages verification',attempt,JSON.stringify(state));
  if(state.every(x=>x.valid)){console.log('Pages OK : HTML et les trois scripts sont accessibles.');return;}
  if(attempt<18)await new Promise(resolve=>setTimeout(resolve,5000));
 }
 console.error('GitHub Pages incomplet : le HTML et les scripts doivent tous être publiés.');
 process.exitCode=1;
})().catch(e=>{console.error(e);process.exitCode=1;});
