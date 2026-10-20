'use strict';
const candidates=[
 'https://render.worldofwarcraft.com/us/icons/56/classicon_warrior.jpg',
 'https://render.worldofwarcraft.com/us/icons/56/classicon_paladin.jpg',
 'https://render.worldofwarcraft.com/us/icons/56/classicon_druid.jpg',
 'https://render.worldofwarcraft.com/us/icons/56/classicon_warlock.jpg',
 'https://render.worldofwarcraft.com/us/icons/56/classicon_mage.jpg',
 'https://render.worldofwarcraft.com/us/icons/56/classicon_shaman.jpg',
 'https://render.worldofwarcraft.com/us/icons/56/classicon_priest.jpg',
 'https://render.worldofwarcraft.com/us/icons/56/classicon_rogue.jpg',
 'https://render.worldofwarcraft.com/us/icons/56/classicon_hunter.jpg',
 'https://render.worldofwarcraft.com/us/icons/56/ability_warrior_battleshout.jpg',
 'https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg',
 'https://wow.zamimg.com/images/wow/icons/large/ability_warrior_battleshout.jpg',
 'https://blizzard.gamespress.com/wowforeverreveal',
 'https://bnetcmsus-a.akamaihd.net/cms/gallery/j3/J3RLTCKOODJ51789169243964.png',
 'https://bnetcmsus-a.akamaihd.net/cms/blog_header/to/TO55V6TRR1RW1790054798721.png'
];
(async()=>{
 for(const url of candidates){
  try{const response=await fetch(url,{signal:AbortSignal.timeout(9000),redirect:'follow'});
   const type=response.headers.get('content-type')||'';
   const bytes=await response.arrayBuffer();
   console.log(JSON.stringify({url,status:response.status,type,bytes:bytes.byteLength,final:response.url,head:(!type.includes('image/')?Buffer.from(bytes).toString('utf8').slice(0,80):undefined)}));
  }catch(err){console.log(JSON.stringify({url,error:String(err)}));}
 }
})().catch(e=>{console.error(e);process.exitCode=1;});

(async()=>{
 const r=await fetch('https://blizzard.gamespress.com/wowforeverreveal');
 const h=await r.text();
 for(const needle of ['WoW_Forever_Logo.png','WoW_Forever_Announce_Key_Art_-_Alliance.jpg','WoW_Camelot_Announce_Zones_Riverglades_037']){
  let at=h.indexOf(needle);
  console.log('PRESS_HTML '+needle+' '+(at<0?'NOT FOUND':h.slice(Math.max(0,at-850),at+440).replace(/\s+/g,' ').slice(0,1250)));
 }
 console.log('PRESS_META '+[...h.matchAll(/(?:property="og:image"|name="twitter:image")[^>]+>/gi)].slice(0,3).map(x=>x[0]).join(' '));
})().catch(e=>console.log('Press parse '+e));


(async()=>{
 const html=await (await fetch('https://blizzard.gamespress.com/wowforeverreveal')).text();
 for(const name of ['WoW_Forever_Logo.png','WoW_Forever_Announce_Key_Art_-_Alliance.jpg','WoW_Camelot_Announce_Zones_Riverglades_037.jpg']){
  const i=html.indexOf('alt="'+name+'"');
  const frag=html.slice(i,i+2400);
  const preview=frag.match(/data-preview="([^"]+)"/);
  console.log('OFFICIAL_PREVIEW',name,preview?preview[1]:'missing');
 }
 const skills=['inv_sword_04','inv_shield_05','spell_holy_greaterheal','spell_fire_fireball02','spell_frost_frostnova','ability_rogue_sprint','spell_holy_powerwordshield','inv_misc_map_01','ability_hunter_beastcall','spell_holy_devotionaura','inv_misc_book_09','spell_nature_lightning'];
 for(const key of skills){
  const url='https://render.worldofwarcraft.com/us/icons/56/'+key+'.jpg';
  try{const res=await fetch(url,{signal:AbortSignal.timeout(6500)});console.log('SPELL_ICON',key,res.status,res.headers.get('content-type'));}catch(e){console.log('SPELL_ICON',key,'ERROR');}
 }
})().catch(e=>console.log('EXTENDED_PROBE',String(e)));
