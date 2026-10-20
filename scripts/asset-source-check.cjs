'use strict';
const candidates=[
 'https://render.worldofwarcraft.com/us/icons/56/classicon_warrior.jpg',
 'https://render.worldofwarcraft.com/us/icons/56/classicon_paladin.jpg',
 'https://render.worldofwarcraft.com/us/icons/56/classicon_hunter.jpg',
 'https://render.worldofwarcraft.com/us/icons/56/ability_warrior_battleshout.jpg',
 'https://wow.zamimg.com/images/wow/icons/large/classicon_warrior.jpg',
 'https://wow.zamimg.com/images/wow/icons/large/ability_warrior_battleshout.jpg',
 'https://blizzard.gamespress.com/wowforeverreveal'
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
