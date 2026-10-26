/* Format portable des choix. Aucun score importé : le moteur courant fait le calcul. */
(function(root,factory){
 'use strict';
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./recommendation-engine.js'));
 else root.WFResultShare=factory(root.WFRecommend);
})(typeof globalThis==='object'?globalThis:this,function(E){
'use strict';
var APP='choisir-ma-classe-wow-forever',MAX_BYTES=16384,MAX_TOKEN=22000;
// Ordres du protocole compact v1 : immuables, même si les catalogues du moteur sont réordonnés.
var COMPACT={roles:['tank','soin','dps'],heal:['prevention','duree','cible','groupe'],activities:['raid','bg','world','solo'],
 styles:['burst','zone','ctrl','surv','mob','support'],range:['any','distance','melee','mixte'],pet:['any','like','avoid'],difficulty:['any','simple','complex'],
 weights:['poly','tank','soin','dps','raid','bg','sauv','burst','zone','ctrl','surv','mob','util','solo','tech']};
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
function toToken(bytes){
 var binary='';
 bytes.forEach(function(b){binary+=String.fromCharCode(b);});
 var base64=typeof btoa==='function'?btoa(binary):Buffer.from(bytes).toString('base64');
 return base64.replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
function fromToken(token,max){
 if(typeof token!=='string'||!token.length||token.length>max||!/^[A-Za-z0-9_-]+$/.test(token))fail('Ce lien de partage est incomplet ou invalide.');
 try{
  var base64=token.replace(/-/g,'+').replace(/_/g,'/'),binary=typeof atob==='function'?atob(base64):Buffer.from(base64,'base64').toString('binary');
  return Uint8Array.from(binary,function(c){return c.charCodeAt(0);});
 }catch(e){fail('Ce lien de partage est incomplet ou invalide.');}
}
// Ancien encodage conservé pour tous les liens #partage= déjà diffusés.
function encode(x){return toToken(new TextEncoder().encode(JSON.stringify(validate(x))));}
function decode(token){
 var text;try{text=new TextDecoder('utf-8',{fatal:true}).decode(fromToken(token,MAX_TOKEN));}
 catch(e){fail('Ce lien de partage est incomplet ou invalide.');}
 var x=parse(text);
 if(encode(x)!==token)fail('Ce lien de partage est incomplet ou invalide.');
 return x;
}
function checksum(bytes){
 var crc=0;bytes.forEach(function(b){crc^=b;for(var i=0;i<8;i++)crc=(crc&128?(crc<<1)^7:crc<<1)&255;});return crc;
}
function compactEncode(x){
 var p=validate(x),c=p.choices,bytes=[],bit=0;
 function put(value,width){
  for(var i=width-1;i>=0;i--){if(!(bit&7))bytes.push(0);bytes[bit>>3]|=((value>>i)&1)<<(7-(bit&7));bit++;}
 }
 function selection(values,keys){
  if(Object.keys(values).some(function(k){return keys.indexOf(k)<0;}))fail();
  keys.forEach(function(k){put(Object.hasOwn(values,k)?values[k]:7,3);});
 }
 function enumeration(value,keys){var n=keys.indexOf(value);if(n<0)fail();put(n,2);}
 // Version (4), parcours (1), maîtrise (2), réservé (1).
 put(1,4);put(p.mode==='priorities'?1:0,1);put(c.mastery,2);put(0,1);
 if(p.mode==='priorities'){
  if(Object.keys(c.weights).some(function(k){return COMPACT.weights.indexOf(k)<0&&c.weights[k]!==0;}))fail();
  COMPACT.weights.forEach(function(k){put(c.weights[k]||0,2);});
 }else{
  selection(c.roles,COMPACT.roles);put(c.rolesStrict?1:0,1);selection(c.healStyles,COMPACT.heal);selection(c.activities,COMPACT.activities);
  enumeration(c.range.value,COMPACT.range);put(c.range.certainty,3);put(c.range.strict?1:0,1);
  selection(c.styles,COMPACT.styles);
  enumeration(c.pet.value,COMPACT.pet);put(c.pet.certainty,3);put(c.pet.strict?1:0,1);
  enumeration(c.difficulty.value,COMPACT.difficulty);put(c.difficulty.certainty,3);
 }
 bytes.push(checksum(bytes));return toToken(bytes);
}
function compactDecode(token){
 var bytes=fromToken(token,15);
 if(bytes.length!==6&&bytes.length!==11||checksum(bytes.slice(0,-1))!==bytes[bytes.length-1])fail('Ce lien de partage est incomplet ou invalide.');
 var bit=0;
 function get(width){
  if(bit+width>(bytes.length-1)*8)fail();var value=0;
  for(var i=0;i<width;i++){value=(value<<1)|((bytes[bit>>3]>>(7-(bit&7)))&1);bit++;}return value;
 }
 function selection(keys){var values={};keys.forEach(function(k){var v=get(3);if(v===6)fail();if(v!==7)values[k]=v;});return values;}
 if(get(4)!==1)fail('Ce format de partage n’est pas pris en charge. Demande un nouveau lien à la personne qui te l’a envoyé.');
 var mode=get(1)?'priorities':'guided',mastery=get(2);if(get(1)!==0||bytes.length!==(mode==='guided'?11:6))fail();
 var c;
 if(mode==='priorities'){
  var weights={};COMPACT.weights.forEach(function(k){weights[k]=get(2);});
  if(Object.keys(weights).some(function(k){return weights[k]!==0&&E.priorityAxes.indexOf(k)<0;}))fail();
  c={weights:E.sanitizeWeights(weights),mastery:mastery};
 }else{
  c={roles:selection(COMPACT.roles),rolesStrict:!!get(1),healStyles:selection(COMPACT.heal),activities:selection(COMPACT.activities)};
  c.range={value:COMPACT.range[get(2)],certainty:get(3),strict:!!get(1)};c.styles=selection(COMPACT.styles);
  c.pet={value:COMPACT.pet[get(2)],certainty:get(3),strict:!!get(1)};c.difficulty={value:COMPACT.difficulty[get(2)],certainty:get(3)};c.mastery=mastery;
 }
 // Nouvelle enveloppe locale ; la date et le moteur de l’émetteur ne sont pas dans le code.
 var p=validate({app:APP,format:1,mode:mode,engine:E.version,created:new Date().toISOString(),choices:c});
 if(compactEncode(p)!==token)fail('Ce lien de partage est incomplet ou invalide.');return p;
}
function isShareHash(hash){return typeof hash==='string'&&(hash.indexOf('#p=')===0||hash.indexOf('#partage=')===0);}
function link(x,base){
 var url=new URL(base);if(!/^https?:$/.test(url.protocol))fail();
 url.search='';url.hash='p='+compactEncode(x);return url.href;
}
function readLink(value){
 if(typeof value!=='string'||value.length>MAX_TOKEN+2048)fail('Ce lien de partage est trop long ou invalide.');
 var hash=value.trim();
 if(hash.charAt(0)!=='#'){
  var url;try{url=new URL(hash);}catch(e){fail('Colle un lien de partage reçu depuis cet outil.');}
  if(!/^https?:$/.test(url.protocol))fail();hash=url.hash;
 }
 if(hash.indexOf('#p=')===0)return compactDecode(hash.slice(3));
 if(hash.indexOf('#partage=')===0)return decode(hash.slice(9));
 fail('Ce lien ne contient pas de résultats à importer.');
}
return {create:create,validate:validate,stringify:stringify,parse:parse,encode:encode,decode:decode,compactEncode:compactEncode,compactDecode:compactDecode,isShareHash:isShareHash,link:link,readLink:readLink,maxBytes:MAX_BYTES};
});
