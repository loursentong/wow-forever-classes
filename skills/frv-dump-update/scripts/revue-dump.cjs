'use strict';
// Préparer et vérifier une revue. Aucune commande n'applique de notes au dépôt.
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),cp=require('node:child_process');
const read=p=>JSON.parse(fs.readFileSync(p,'utf8'));
const hash=x=>crypto.createHash('sha256').update(typeof x==='string'?x:JSON.stringify(x)).digest('hex');
const dateParis=()=>new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const rating=(s,k)=>k.startsWith('charge_')?s.load[k.slice(7)]:Object.hasOwn(s.activity,k)?s.activity[k]:s.style[k];
function collect(repo){
 repo=path.resolve(repo);const engineFile=path.join(repo,'recommendation-engine.js');
 if(!fs.existsSync(engineFile))throw Error('Dépôt FRV introuvable : préciser --repo.');
 delete require.cache[require.resolve(engineFile)];const E=require(engineFile);
 const html=fs.readFileSync(path.join(repo,'index.html'),'utf8'),match=html.match(/window\.__WF = (\{.*?\});\s*<\/script>/s);
 if(!match)throw Error('Matrice documentaire introuvable dans index.html.');
 const matrix=JSON.parse(match[1]),dir=path.join(repo,'connaissances'),classes=fs.readdirSync(path.join(dir,'classes')).filter(f=>f.endsWith('.json')).sort().map(f=>read(path.join(dir,'classes',f)));
 const sources=read(path.join(dir,'sources.json')),complexity=read(path.join(dir,'referentiel-complexite.json')),gaps=read(path.join(dir,'ecarts.json'));
 const entries=[],sourceIds=new Set(sources.sources.map(s=>s.id));
 for(const k of classes){
  if(!/^[a-z-]+$/.test(k.classe))throw Error('Identifiant de classe invalide.');
  const facts=new Map(k.faits.map(f=>[f.id,f]));
  function add(s,variant,kind,key,value,meta,derived=false,inherited=false){
   const appuis=meta.appuis||[],ids=[...new Set(appuis.flatMap(id=>{
    if(!facts.has(id))throw Error('Fait manquant : '+id);return facts.get(id).sources;
   }))];
   if(ids.some(id=>!sourceIds.has(id)))throw Error('Source inconnue pour '+s.id+'/'+key);
   entries.push({id:[s.id,variant,kind,key].join('/'),classe:k.classe,specialisation:s.id,variante:variant,type:kind,critere:key,valeur:value,derivee:derived,heritee:inherited,minimum:kind==='composante'?0:1,maximum:kind==='composante'?2:5,confiance:meta.confiance||null,appuis,sources:ids});
  }
  for(const s of k.specialisations){
   const original=E.specs.find(x=>x.id===s.id);if(!original)throw Error('Configuration absente du moteur : '+s.id);
   for(const [variant,effective] of [['reference',original],['sans-familier',E.petless[s.id]]]){
    if(!effective)continue;
    const v=variant==='reference'?null:s.variante_sans_familier;if(variant!=='reference'&&!v)throw Error('Variante documentaire manquante : '+s.id);
    for(const [key,n] of Object.entries(s.notes)){
     const meta=v&&v.notes[key]||n,value=rating(effective,key);
     if(value!==meta.valeur)throw Error('Note désynchronisée : '+s.id+'/'+variant+'/'+key);
     add(s,variant,'note',key,value,meta,key.startsWith('charge_'),!!v&&!v.notes[key]);
    }
    for(const context of ['pve','pvp'])E.complexityGrid[context].forEach((key,i)=>{
     const base=s.complexite[context],points=effective.complexity[context][i];
     if(!v&&points!==base.composantes[key].points)throw Error('Grille désynchronisée : '+s.id+'/'+context+'/'+key);
     add(s,variant,'composante',context+'.'+key,points,v&&v.notes['charge_'+context]||base,false,!!v&&points===original.complexity[context][i]);
    });
   }
   if(s.profil_soin)for(const [key,n] of Object.entries(s.profil_soin)){
    if(n.valeur!==original.heal[key])throw Error('Profil de soin désynchronisé : '+s.id+'/'+key);
    add(s,'reference','soin',key,n.valeur,n);
   }
  }
 }
 for(const c of matrix.classes)for(const [key,value] of Object.entries(c.r))entries.push({id:[c.id,'classe','tableau',key].join('/'),classe:c.id,type:'tableau',critere:key,valeur:value,derivee:true,heritee:false,minimum:1,maximum:5});
 const semantic={engine:hash(fs.readFileSync(engineFile,'utf8')),matrix:matrix.classes.map(c=>({id:c.id,r:c.r})),roleReference:E.roleReference,classes,sources,complexity,gaps};
 const rev=cp.spawnSync('git',['rev-parse','HEAD'],{cwd:repo,encoding:'utf8',windowsHide:true});
 return {schema:1,date:dateParis(),depot:'loursentong/wow-forever-classes',commit:rev.status===0?rev.stdout.trim():null,moteur:E.version,empreinte:hash(semantic),entrees:entries,classes,sources,gaps,statistiques:{configurations:E.specs.length,notesSpecialisees:entries.filter(e=>e.variante==='reference'&&e.type==='note').length,variantes:Object.keys(E.petless).length,notesVariantes:entries.filter(e=>e.variante==='sans-familier'&&e.type==='note').length,composantes:entries.filter(e=>e.type==='composante').length,profilsSoin:entries.filter(e=>e.type==='soin').length,matrice:entries.filter(e=>e.type==='tableau').length}};
}
function prepare(repo,out){
 const state=collect(repo);out=path.resolve(out);
 if(out.split(path.sep).some(x=>['sources','.git'].includes(x.toLowerCase())))throw Error('Sortie refusée dans les références synchronisées ou les métadonnées Git.');
 if(fs.existsSync(out))throw Error('Le dossier existe déjà : choisir une nouvelle sortie pour préserver la revue.');
 fs.mkdirSync(out);fs.mkdirSync(path.join(out,'classes'));
 const write=(name,data)=>fs.writeFileSync(path.join(out,name),JSON.stringify(data,null,2)+'\n',{encoding:'utf8',flag:'wx'});
 const {classes,sources,gaps,...snapshot}=state;write('etat-initial.json',snapshot);
 write('propositions.json',{schema:1,base:state.empreinte,contexte:{patch:null,periode:null,niveau:null,contenu:null,equipement:null},changements:[]});
 const rows=[];
 for(const k of classes){
  const entries=state.entrees.filter(e=>e.classe===k.classe),used=new Set(entries.flatMap(e=>e.sources||[]));
  write('classes/'+k.classe+'.json',{classe:k.classe,documentation:k,entrees:entries,sources:sources.sources.filter(s=>used.has(s.id)),ecarts:gaps.ecarts.filter(e=>e.spec&&e.spec.startsWith(k.classe+'-')),surveiller:gaps.surveiller});
  const notes=entries.filter(e=>e.type==='note'&&e.variante==='reference');
  rows.push('| '+k.libelle+' | '+notes.length+' | '+notes.filter(e=>e.confiance==='faible').length+' | À examiner |');
 }
 fs.writeFileSync(path.join(out,'SUIVI.md'),'# Revue du dump — '+state.date+'\n\nBase : '+state.commit+' ; moteur '+state.moteur+'. Aucune note modifiée.\n\nLire une classe à la fois dans `classes/`. Commencer par les patchs qui changent un kit, puis les notes fragiles ou les écarts ouverts. Une note héritée d’une variante ne demande pas une seconde recherche identique.\n\n| Classe | Notes de référence | Confiance faible | Avancement |\n| --- | ---: | ---: | --- |\n'+rows.join('\n')+'\n\nRenseigner le contexte dans `propositions.json`, puis uniquement les changements motivés. Conserver les autres notes et signaler les incertitudes. Le vérificateur contrôle la cohérence du dossier, pas la véracité des sources ni l’autorisation de publier.\n',{encoding:'utf8',flag:'wx'});
 return {sortie:out,statistiques:state.statistiques,empreinte:state.empreinte};
}
function verify(repo,folder){
 const state=collect(repo),snapshot=read(path.join(folder,'etat-initial.json')),plan=read(path.join(folder,'propositions.json')),errors=[],warnings=[],ids=new Set(),map=new Map(state.entrees.map(e=>[e.id,e]));
 const issue=(code,id,message)=>errors.push({code,id,message});
 if(snapshot.schema!==1||plan.schema!==1)issue('schema',null,'Format de revue non reconnu.');
 if(state.empreinte!==snapshot.empreinte||plan.base!==state.empreinte)issue('base-obsolete',null,'Les données ou le moteur ont changé depuis la préparation. Réconcilier la revue avec la nouvelle base.');
 const changes=Array.isArray(plan.changements)?plan.changements:[];
 if(!Array.isArray(plan.changements))issue('schema',null,'changements doit être une liste.');
 if(changes.length&&(!plan.contexte||!plan.contexte.patch))warnings.push('Patch cible à renseigner avant intégration.');
 for(const c of changes){
  if(!c||typeof c!=='object'){issue('schema',null,'Proposition invalide.');continue;}
  const e=map.get(c.id);
  if(ids.has(c.id))issue('doublon',c.id,'Deux propositions visent la même entrée.');ids.add(c.id);
  if(!e){issue('entree-inconnue',c.id,'Entrée absente de la base actuelle.');continue;}
  if(e.derivee)issue('valeur-derivee',c.id,'Réviser les notes sources ou les composantes, puis recalculer cette valeur.');
  if(c.actuelle!==e.valeur)issue('valeur-actuelle',c.id,'La valeur actuelle ne correspond pas au moteur.');
  if(!Number.isInteger(c.proposee)||c.proposee<e.minimum||c.proposee>e.maximum)issue('plage',c.id,'Valeur proposée hors de l’échelle autorisée.');
  if(typeof c.raison!=='string'||c.raison.trim().length<15)issue('raison',c.id,'Expliquer la différence avec la note actuelle.');
  if(!['haute','moyenne','faible'].includes(c.confiance))issue('confiance',c.id,'Confiance absente ou invalide.');
  const proofs=Array.isArray(c.preuves)?c.preuves:[];
  if(!proofs.length)issue('preuves',c.id,'Une modification demande un appui consulté.');
  if(proofs.length&&proofs.every(p=>p&&p.nature==='retour-joueur'))issue('qualitatif-seul',c.id,'Les témoignages seuls ne justifient pas une nouvelle note numérique.');
  for(const p of proofs){
   if(!p||typeof p!=='object'){issue('preuve-invalide',c.id,'Appui invalide.');continue;}
   let url;try{url=new URL(p.url);}catch{}
   if(!url||url.protocol!=='https:')issue('url',c.id,'URL HTTPS de la source requise.');
   if(!['officiel','mesure','simulation','guide','retour-joueur'].includes(p.nature))issue('nature',c.id,'Nature de l’appui inconnue.');
   if(!['titre','groupe','constat','contexte'].every(k=>typeof p[k]==='string'&&p[k].trim()))issue('provenance',c.id,'Préciser titre, famille de provenance, constat et contexte de l’appui.');
   if(typeof p.consultee!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(p.consultee)||!Number.isFinite(Date.parse(p.consultee+'T00:00:00Z'))||new Date(p.consultee+'T00:00:00Z').toISOString().slice(0,10)!==p.consultee)issue('date',c.id,'Date de consultation invalide.');
  }
  if(c.confiance==='haute'&&proofs.length&&new Set(proofs.map(p=>p&&p.groupe)).size<2&&!proofs.some(p=>p&&p.nature==='officiel'))warnings.push(c.id+' : confiance haute avec une seule famille de sources ; revoir la justification.');
  if(c.proposee===c.actuelle)warnings.push(c.id+' : valeur conservée, à noter dans le suivi plutôt que comme changement.');
 }
 return {valide:errors.length===0,changements:changes.length,erreurs:errors,avertissements:warnings,application:'Aucune note appliquée ; vérification documentaire uniquement.'};
}
module.exports={collect,prepare,verify};
if(require.main===module){
 try{
  const [command,...args]=process.argv.slice(2),get=(flag,fallback)=>{const i=args.indexOf(flag);return i<0?fallback:args[i+1];},repo=get('--repo',process.cwd()),out=get('--sortie',null);
  if(!out||!['preparer','verifier'].includes(command))throw Error('Usage : node revue-dump.cjs preparer|verifier --repo DEPOT --sortie DOSSIER');
  const result=command==='preparer'?prepare(repo,out):verify(repo,path.resolve(out));console.log(JSON.stringify(result,null,2));if(result.valide===false)process.exitCode=1;
 }catch(e){console.error(e.message);process.exitCode=1;}
}
