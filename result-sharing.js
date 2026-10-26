/* Format portable des choix. Aucun score importé : le moteur courant fait le calcul. */
(function(root,factory){
 'use strict';
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./recommendation-engine.js'));
 else root.WFResultShare=factory(root.WFRecommend);
})(typeof globalThis==='object'?globalThis:this,function(E){
'use strict';
var APP='choisir-ma-classe-wow-forever',MAX_BYTES=16384,MAX_TOKEN=22000;
function fail(message){throw new Error(message||'Ce partage est incomplet ou ne correspond pas à cet outil.');}
function object(x){return !!x&&typeof x==='object'&&!Array.isArray(x);}
function fields(x,allowed,required){
 if(!object(x)||Object.keys(x).some(function(k){return allowed.indexOf(k)<0;})||
  (required||allowed).some(function(k){return !Object.prototype.hasOwnProperty.call(x,k);}))fail();
}
function integer(x,min,max){if(!Number.isInteger(x)||x<min||x>max)fail();}
function choices(x,allowed,limit){
 fields(x,allowed,[]);var keys=Object.keys(x);
 if(keys.length>(limit||allowed.length))fail();
 keys.forEach(function(k){integer(x[k],0,5);});
}
function guided(p){
 fields(p,['roles','rolesStrict','healStyles','activities','range','styles','pet','difficulty','mastery']);
 choices(p.roles,E.roles);choices(p.activities,E.activities);choices(p.styles,E.styles,3);choices(p.healStyles,E.healStyles,2);
 if(typeof p.rolesStrict!=='boolean'||Object.keys(p.healStyles).length&&!Object.hasOwn(p.roles,'soin'))fail();
 integer(p.mastery,0,3);
 ['range','pet','difficulty'].forEach(function(k){
  var v=p[k],allowed=k==='range'?['any','distance','melee','mixte']:k==='pet'?['any','like','avoid']:['any','simple','complex'];
  fields(v,k==='difficulty'?['value','certainty']:['value','certainty','strict']);
  if(allowed.indexOf(v.value)<0)fail();integer(v.certainty,0,5);
  if(k!=='difficulty'&&(typeof v.strict!=='boolean'||v.strict&&(v.value==='any'||k==='pet'&&v.value!=='avoid'||v.certainty!==5)))fail();
 });
 if(p.rolesStrict&&Object.keys(p.roles).some(function(k){return p.roles[k]!==5;}))fail();
 var clean=E.sanitize(p);
 if(E.ranking(clean).status==='unanswered')fail('Choisis au moins une envie avant de partager tes résultats.');
 return clean;
}
function priorities(p){
 fields(p,['weights','mastery']);fields(p.weights,E.priorityAxes);
 E.priorityAxes.forEach(function(k){integer(p.weights[k],0,3);});integer(p.mastery,0,3);
 var clean={weights:E.sanitizeWeights(p.weights),mastery:p.mastery};
 if(E.priorityRanking(clean.weights,clean.mastery).status==='unanswered')fail('Active au moins un critère avant de partager tes résultats.');
 return clean;
}
function validate(x){
 if(!object(x)||x.app!==APP)fail();
 if(x.format!==1)fail('Ce format de partage n’est pas pris en charge. Demande un nouveau lien à la personne qui te l’a envoyé.');
 fields(x,['app','format','mode','engine','created','choices']);
 if(['guided','priorities'].indexOf(x.mode)<0||typeof x.engine!=='string'||x.engine.length>80||
  typeof x.created!=='string'||!/^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d\.\d{3}Z$/.test(x.created)||!Number.isFinite(Date.parse(x.created))||new Date(x.created).toISOString()!==x.created)fail();
 return {app:APP,format:1,mode:x.mode,engine:x.engine,created:x.created,choices:x.mode==='guided'?guided(x.choices):priorities(x.choices)};
}
function create(mode,p){
 var data;
 if(mode==='guided'){
  data=E.sanitize(p);
  if(data.rolesStrict)Object.keys(data.roles).forEach(function(k){data.roles[k]=5;});
  ['range','pet'].forEach(function(k){if(data[k].strict)data[k].certainty=5;});
 }else data={weights:E.sanitizeWeights(p&&p.weights),mastery:p&&p.mastery};
 return validate({app:APP,format:1,mode:mode,engine:E.version,created:new Date().toISOString(),choices:data});
}
function stringify(x){return JSON.stringify(validate(x),null,2);}
function parse(text){
 if(typeof text!=='string'||text.length>MAX_BYTES)fail('Ce fichier est trop volumineux pour être un partage de résultats.');
 if(new TextEncoder().encode(text).length>MAX_BYTES)fail('Ce fichier est trop volumineux pour être un partage de résultats.');
 var x;try{x=JSON.parse(text.trim());}catch(e){fail('Ce fichier n’est pas un partage de résultats valide.');}
 return validate(x);
}
function encode(x){
 var bytes=new TextEncoder().encode(JSON.stringify(validate(x))),binary='';
 bytes.forEach(function(b){binary+=String.fromCharCode(b);});
 var base64=typeof btoa==='function'?btoa(binary):Buffer.from(bytes).toString('base64');
 return base64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function decode(token){
 if(typeof token!=='string'||!token.length||token.length>MAX_TOKEN||!/^[A-Za-z0-9_-]+$/.test(token))fail('Ce lien de partage est incomplet ou invalide.');
 var text;
 try{
  var base64=token.replace(/-/g,'+').replace(/_/g,'/'),binary=typeof atob==='function'?atob(base64):Buffer.from(base64,'base64').toString('binary');
  text=new TextDecoder('utf-8',{fatal:true}).decode(Uint8Array.from(binary,function(c){return c.charCodeAt(0);}));
 }catch(e){fail('Ce lien de partage est incomplet ou invalide.');}
 var x=parse(text);
 if(encode(x)!==token)fail('Ce lien de partage est incomplet ou invalide.');
 return x;
}
function link(x,base){
 var url=new URL(base);if(!/^https?:$/.test(url.protocol))fail();
 url.search='';url.hash='partage='+encode(x);return url.href;
}
function readLink(value){
 if(typeof value!=='string'||value.length>MAX_TOKEN+2048)fail('Ce lien de partage est trop long ou invalide.');
 var hash=value.trim();
 if(hash.charAt(0)!=='#'){
  var url;try{url=new URL(hash);}catch(e){fail('Colle un lien de partage reçu depuis cet outil.');}
  if(!/^https?:$/.test(url.protocol))fail();hash=url.hash;
 }
 if(hash.indexOf('#partage=')!==0)fail('Ce lien ne contient pas de résultats à importer.');
 return decode(hash.slice(9));
}
return {create:create,validate:validate,stringify:stringify,parse:parse,encode:encode,decode:decode,link:link,readLink:readLink,maxBytes:MAX_BYTES};
});
