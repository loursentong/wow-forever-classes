'use strict';
/* Moteur 1.1.0, référence v11 (décision du responsable du projet, 22 octobre 2026) : la difficulté
 * d'exécution PvE et PvP de chaque spécialisation suit le référentiel de complexité. Cinq composantes
 * par contexte, notées 0, 1 ou 2 ; le total sur 10 donne la note (0–2 → 1, 3–4 → 2, 5–6 → 3, 7–8 → 4,
 * 9–10 → 5). Elle remplace l'ancienne charge partout : difficulté souhaitée, technicité et effet de la
 * maîtrise. Survie est notée sur son jeu de référence, en alternance tir-mêlée. */
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const E=require('../recommendation-engine.js');
const X=require('../result-explanations.js');
const details=require('../configuration-details.js');
const GRID={pve:['rotation','entretien','ressource','placement','pilotage'],pvp:['controles','defense','placement','ouverture','pilotage']};
// Points décidés : composantes dans l'ordre de la grille.
const POINTS={
 'chasseur-maitrise-betes':{pve:[0,1,1,1,1],pvp:[2,1,2,1,2]},
 'chasseur-precision':{pve:[1,1,1,1,0],pvp:[2,1,2,1,1]},
 'chasseur-survie':{pve:[2,1,1,2,1],pvp:[2,2,2,1,1]},
 'druide-equilibre':{pve:[0,1,1,1,0],pvp:[1,1,2,1,2]},
 'druide-farouche-chat':{pve:[2,2,2,1,1],pvp:[1,2,1,2,2]},
 'druide-farouche-ours':{pve:[1,1,1,0,1],pvp:[1,2,1,0,2]},
 'druide-restauration':{pve:[1,2,1,0,1],pvp:[1,2,2,0,2]},
 'mage-arcane':{pve:[1,1,2,1,0],pvp:[2,1,2,1,0]},
 'mage-feu':{pve:[1,1,1,1,0],pvp:[2,1,2,1,0]},
 'mage-givre':{pve:[1,0,1,1,0],pvp:[2,2,2,1,0]},
 'paladin-sacre':{pve:[0,1,1,1,1],pvp:[1,1,1,0,1]},
 'paladin-protection':{pve:[1,1,2,0,1],pvp:[1,1,1,0,1]},
 'paladin-vindicte':{pve:[0,1,1,0,0],pvp:[1,1,2,1,1]},
 'pretre-discipline':{pve:[1,2,2,1,1],pvp:[1,2,2,0,2]},
 'pretre-sacre':{pve:[0,1,1,1,1],pvp:[1,1,2,0,2]},
 'pretre-ombre':{pve:[0,1,2,1,0],pvp:[2,1,2,1,1]},
 'voleur-assassinat':{pve:[1,1,2,0,0],pvp:[2,1,1,2,1]},
 'voleur-combat':{pve:[0,1,2,0,0],pvp:[2,1,1,2,1]},
 'voleur-finesse':{pve:[2,2,2,1,0],pvp:[2,2,2,2,1]},
 'chaman-elementaire':{pve:[1,1,1,1,1],pvp:[1,1,2,1,2]},
 'chaman-amelioration':{pve:[1,2,2,0,1],pvp:[1,1,1,1,2]},
 'chaman-restauration':{pve:[0,1,1,1,2],pvp:[1,1,2,0,2]},
 'demoniste-affliction':{pve:[1,2,1,1,1],pvp:[2,1,2,1,2]},
 'demoniste-demonologie':{pve:[1,2,1,1,2],pvp:[2,1,2,1,2]},
 'demoniste-destruction':{pve:[1,1,1,1,1],pvp:[2,1,2,1,2]},
 'guerrier-armes':{pve:[2,2,2,0,1],pvp:[2,1,2,1,2]},
 'guerrier-fureur':{pve:[2,1,2,0,0],pvp:[2,1,2,1,1]},
 'guerrier-protection':{pve:[2,2,2,0,1],pvp:[2,2,1,0,2]}
};
const note=t=>t<=2?1:t<=4?2:t<=6?3:t<=8?4:5;
const sum=a=>a.reduce((x,y)=>x+y,0);
const spec=id=>E.specs.find(s=>s.id===id);
const dir=path.join(__dirname,'..','connaissances');
const lire=f=>JSON.parse(fs.readFileSync(path.join(dir,f),'utf8'));

test('v11 : le moteur porte la grille et les points décidés, et sa difficulté en découle',()=>{
 assert.deepEqual(E.complexityGrid,GRID);
 assert.deepEqual([0,1,2,3,4,5,6,7,8,9,10].map(E.complexityNote),[1,1,1,2,2,3,3,4,4,5,5]);
 assert.deepEqual(Object.keys(POINTS).sort(),E.specs.map(s=>s.id).sort());
 for(const s of E.specs){
  assert.deepEqual(s.complexity,POINTS[s.id],s.id);
  for(const c of ['pve','pvp']){
   assert.ok(s.complexity[c].every(p=>p===0||p===1||p===2),s.id);
   assert.equal(s.load[c],note(sum(s.complexity[c])),s.id+'/'+c+' : la difficulté suit la grille');
  }
 }
 // Les variantes sans familier gardent la complexité de leur configuration (règle de la v5 conservée).
 for(const [id,v] of Object.entries(E.petless))assert.deepEqual(v.complexity,spec(id).complexity,id);
 assert.deepEqual(E.checkData(),[]);
});

test('Exemples de la décision : chasseurs simples en PvE, exigeants en PvP ; Survie notée en alternance',()=>{
 assert.deepEqual(spec('chasseur-maitrise-betes').load,{pve:2,pvp:4});
 assert.deepEqual(spec('chasseur-precision').load,{pve:2,pvp:4});
 assert.deepEqual(spec('chasseur-survie').load,{pve:4,pvp:4});
 assert.deepEqual(spec('paladin-vindicte').load,{pve:1,pvp:3});
 assert.deepEqual(spec('guerrier-armes').load,{pve:4,pvp:4});
 assert.deepEqual(spec('druide-farouche-ours').load,{pve:2,pvp:3});
 assert.deepEqual(spec('voleur-assassinat').load,{pve:2,pvp:4},'Mutilate n’exige pas d’être dans le dos de la cible');
 assert.deepEqual(spec('voleur-finesse').load,{pve:4,pvp:5});
 assert.deepEqual(E.specs.filter(s=>s.load.pve===1).map(s=>s.id),['paladin-vindicte']);
 assert.equal(E.specs.filter(s=>s.load.pvp>s.load.pve).length,17);
 assert.deepEqual(E.specs.filter(s=>s.load.pvp<s.load.pve).map(s=>s.id),['paladin-protection']);
});

test('La complexité règle aussi l’effet de la maîtrise (décision : partout)',()=>{
 const factor=[-0.29,-0.13,0,0.09];
 for(const s of E.specs)for(let m=0;m<4;m++)for(const k of ['raid','bg','world','solo']){
  const ctx=k==='raid'||k==='solo'?'pve':'pvp';
  const delta=k==='solo'&&s.classId==='chasseur'&&s.pet==='core'?0:Math.min(0.35,Math.max(-1.2,factor[m]*note(sum(s.complexity[ctx]))));
  assert.equal(E.adjustedActivity(s,k,m),Math.min(5,Math.max(1,s.activity[k]+delta)),s.id+'/'+k+'/'+m);
 }
});

test('Base de connaissances : grille, composantes justifiées et notes alignées sur le moteur',()=>{
 const R=lire('referentiel-complexite.json');
 assert.equal(R.moteur,E.version);
 for(const c of ['pve','pvp']){
  assert.deepEqual(R.contextes[c].composantes.map(x=>x.cle),GRID[c]);
  for(const x of R.contextes[c].composantes){assert.ok(x.libelle&&x.phrase,c+'/'+x.cle);assert.equal(x.niveaux.length,3);}
 }
 for(let t=0;t<=10;t++){const b=R.bareme.filter(b=>t>=b.de&&t<=b.a);assert.equal(b.length,1,'barème '+t);assert.equal(b[0].note,E.complexityNote(t),'barème '+t);}
 const classes=fs.readdirSync(path.join(dir,'classes')).filter(f=>f.endsWith('.json')).map(f=>lire('classes/'+f));
 const faits=new Map();for(const k of classes)for(const f of k.faits)faits.set(f.id,{...f,classe:k.classe});
 const applique=(f,id)=>id.startsWith(f.classe+'-')&&(!f.specs||f.specs.includes(id));
 for(const k of classes)for(const s of k.specialisations){
  const m=spec(s.id);
  assert.ok(s.complexite,s.id+' : complexité décrite');
  for(const c of ['pve','pvp']){
   const x=s.complexite[c],id=s.id+'/'+c;
   assert.deepEqual(Object.keys(x.composantes),GRID[c],id);
   GRID[c].forEach((g,i)=>{const n=x.composantes[g];assert.equal(n.points,m.complexity[c][i],id+'/'+g);assert.ok(n.raison&&n.raison.length>=10,id+'/'+g);});
   assert.equal(x.total,sum(m.complexity[c]),id);
   assert.equal(x.note,m.load[c],id);
   assert.ok(['haute','moyenne','faible'].includes(x.confiance),id);
   assert.ok(x.appuis.length,id);
   for(const a of x.appuis){assert.ok(faits.has(a),id+' : fait inconnu '+a);assert.ok(applique(faits.get(a),s.id),id+' : '+a+' ne concerne pas cette configuration');}
   // La note de difficulté de la base reprend la grille : même valeur, mêmes appuis, même confiance.
   const n=s.notes['charge_'+c];
   assert.equal(n.valeur,x.note,id);assert.deepEqual(n.appuis,x.appuis,id);assert.equal(n.confiance,x.confiance,id);
   if(x.variante){
    const v=x.variante,t=sum(Object.values(v.points));
    assert.deepEqual(Object.keys(v.points),GRID[c],id);assert.equal(v.total,t,id);assert.equal(v.note,E.complexityNote(t),id);assert.ok(v.raison.length>=15,id);
   }
  }
 }
 const survie=classes.find(k=>k.classe==='chasseur').specialisations.find(s=>s.id==='chasseur-survie');
 assert.equal(survie.complexite.pve.variante.note,2,'Survie en mêlée seule : 2/5');
});

test('Explications : la difficulté dit ce qui pèse, la fiche détaille chaque composante',()=>{
 const C=details.complexity,R=lire('referentiel-complexite.json');
 assert.deepEqual(C.grid,GRID,'même ordre que le moteur');
 for(const c of ['pve','pvp'])for(const x of R.contextes[c].composantes)assert.equal(C.phrases[c][x.cle],x.phrase,'mêmes mots que le référentiel : '+c+'/'+x.cle);
 assert.equal(C.weighs(spec('chasseur-survie'),'pve'),'la rotation et le placement pèsent beaucoup ; les effets à entretenir, la gestion de la ressource et le pilotage, un peu');
 assert.equal(C.weighs(spec('paladin-vindicte'),'pve'),'les effets à entretenir et la gestion de la ressource pèsent un peu');
 assert.equal(C.weighs(spec('voleur-combat'),'pve'),'la gestion de la ressource pèse beaucoup ; les effets à entretenir, un peu');
 assert.equal(C.weighs(spec('voleur-finesse'),'pvp'),'les contrôles, la défense, le placement et l’ouverture pèsent beaucoup ; le pilotage, un peu');
 const html=details(spec('chasseur-survie'));
 assert.match(html,/En PvE, la rotation et le placement pèsent beaucoup ; les effets à entretenir, la gestion de la ressource et le pilotage, un peu\./);
 assert.match(html,/href="fiches-sources\/chasseur\.html#chasseur-survie-complexite"/);
 // Variante sans familier : même complexité, même lien vers la configuration.
 assert.match(details(E.petless['chasseur-survie']),/href="fiches-sources\/chasseur\.html#chasseur-survie-complexite"/);
 // « Pourquoi cette piste » : la note, puis ce qui pèse, dans le contexte retenu.
 const ex=E.explain('voleur-finesse',{difficulty:{value:'complex',certainty:5},activities:{bg:5}});
 const lines=X.answerLines(ex.answers.find(a=>a.domain==='difficulty'),ex);
 assert.equal(lines[0].text,'Finesse est notée 5/5 en difficulté PvP : les contrôles, la défense, le placement et l’ouverture pèsent beaucoup ; le pilotage, un peu.');
});
