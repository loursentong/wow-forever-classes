'use strict';
/* Diagnostic de la production GitHub Pages (non bloquant pendant les PR).
 * Run: node tests/pages-live-check.cjs
 */
const {chromium}=require('playwright');
const url='https://loursentong.github.io/wow-forever-classes/';
(async()=>{
 const qs='?diagnostic='+Date.now();
 const requests=[url,url+'recommendation-engine.js',url+'questionnaire.js',url+'priorities-ui.js'];
 for(const u of requests){
  try{
   const res=await fetch(u+qs,{signal:AbortSignal.timeout(15000),headers:{'cache-control':'no-cache'}});
   const body=await res.text();
   console.log(JSON.stringify({url:u,status:res.status,contentType:res.headers.get('content-type'),cache:res.headers.get('cache-control'),age:res.headers.get('age'),length:body.length,
    hasModes:u===url?body.includes('data-reco-mode="guided"'):undefined,htmlResponse:u.endsWith('.js')?body.trimStart().startsWith('<'):undefined}));
  }catch(err){console.log(JSON.stringify({url:u,error:String(err)}));}
 }
 let browser;
 try{
  browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1280,height:900}});
  const errors=[],network=[];
  page.on('pageerror',e=>errors.push(String(e)));
  page.on('response',r=>{if(r.status()>=400)network.push({url:r.url(),status:r.status()});});
  page.on('requestfailed',r=>network.push({url:r.url(),failure:r.failure()}));
  await page.goto(url+qs,{waitUntil:'domcontentloaded',timeout:20000});
  await page.waitForTimeout(2500);
  const state=await page.evaluate(()=>({
   title:document.title,
   prepared:document.getElementById('reco-form')?.textContent?.trim().slice(0,110),
   hasEngine:!!window.WFRecommend,hasGuide:!!window.WFGuide,
   hasModes:!!document.querySelector('[data-reco-mode="priorities"]'),
   hasPriorityResults:document.getElementById('reco-priority-results')?.textContent?.trim().slice(0,110)
  }));
  console.log('LIVE_BROWSER '+JSON.stringify({state,errors,network}));
 }catch(err){console.log('LIVE_BROWSER_ERROR '+String(err));}
 finally{if(browser)await browser.close();}
})().catch(e=>{console.log('DIAG_ERROR '+String(e));});
