'use strict';
/* Audit léger des images WoW officielles (CDN Blizzard).
   Réseau externe : ne bloque pas les régressions fonctionnelles de l'application. */
const base='https://render.worldofwarcraft.com/us/icons/56/';
const classes=['warrior','paladin','hunter','rogue','priest','shaman','mage','warlock','druid']
 .map(x=>base+'classicon_'+x+'.jpg');
const abilities=['inv_sword_04','inv_shield_05','spell_holy_greaterheal',
 'spell_fire_fireball02','spell_frost_frostnova','ability_rogue_sprint',
 'spell_holy_powerwordshield','inv_misc_map_01','ability_hunter_beastcall',
 'spell_holy_devotionaura','inv_misc_book_09','spell_nature_lightning',
 'ability_warrior_battleshout'].map(x=>base+x+'.jpg');
(async()=>{
 let checked=0,missing=[];
 for(const url of [...classes,...abilities]){
  try{
   const res=await fetch(url,{method:'HEAD',signal:AbortSignal.timeout(7000)});
   if(!res.ok||!String(res.headers.get('content-type')).startsWith('image/'))missing.push({url,status:res.status});
   checked++;
  }catch(e){missing.push({url,error:String(e)});}
 }
 console.log('Iconographie Blizzard : '+checked+' ressources vérifiées ; anomalies : '+missing.length);
 if(missing.length){console.error(JSON.stringify(missing));process.exitCode=1;}
})().catch(e=>{console.error(e);process.exitCode=1;});
