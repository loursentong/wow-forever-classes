/* Tableau des notes : chaque ligne de classe déroule ses spécialisations, avec les notes du moteur
 * (WFRecommend.specs) critère par critère. Affichage seul : aucun calcul, aucun score, aucune note modifiée.
 * La ligne de la classe garde la notation d'origine du tableau (window.__WF) ; sans JavaScript, le tableau
 * reste celui des neuf classes. */
(function(root,factory){
 if(typeof module==='object'&&module.exports)module.exports=factory(require('./recommendation-engine.js'));
 else{
  root.WFSpecRows=factory(root.WFRecommend);
  var doc=root.document;
  if(doc&&root.WFRecommend){
   if(doc.readyState==='loading')doc.addEventListener('DOMContentLoaded',function(){root.WFSpecRows.mount(doc);});
   else root.WFSpecRows.mount(doc);
  }
 }
})(typeof globalThis==='object'?globalThis:this,function(E){
 'use strict';
 function esc(t){return String(t).replace(/[&<>"]/g,function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];});}
 var ROLES={tank:1,soin:1,dps:1};
 /* Colonne du tableau → note de la spécialisation. Les colonnes de rôle reçoivent la note « Donjons et raids »
  * dans le rôle de la spé (même définition que la colonne de la classe) ; la Polyvalence est un critère de classe ;
  * la Technicité donne la complexité PvE et PvP du référentiel. */
 function value(s,k){
  if(k==='poly')return {na:'classe'};
  if(ROLES[k])return s.role===k?{v:s.activity.raid}:{na:'role'};
  if(k==='bg')return {v:s.activity.bg};
  if(k==='sauv')return {v:s.activity.world};
  if(k==='solo')return {v:s.activity.solo};
  if(k==='util')return {v:s.style.support};
  if(k==='tech')return {pve:s.load.pve,pvp:s.load.pvp};
  return Object.prototype.hasOwnProperty.call(s.style,k)?{v:s.style[k]}:{na:'inconnu'};
 }
 function specsOf(classId){return E.specs.filter(function(s){return s.classId===classId;});}
 var NA={classe:'Critère de classe : la variété des rôles et des spécialisations',role:'Pas le rôle de cette spécialisation',inconnu:'Pas de note pour cette spécialisation'};
 var NA_SR={classe:'critère de classe',role:'hors de son rôle',inconnu:'sans note'};
 function cell(s,k){
  var x=value(s,k);
  if(x.na)return '<td class="spec-cell spec-na" data-k="'+esc(k)+'" title="'+NA[x.na]+'"><span aria-hidden="true">—</span><span class="spec-sr">'+NA_SR[x.na]+'</span></td>';
  if(k==='tech')return '<td class="spec-cell tech spec-tech" data-k="tech" data-pve="'+x.pve+'" data-pvp="'+x.pvp+'" title="Complexité : '+x.pve+'/5 en PvE, '+x.pvp+'/5 en PvP">'+
   '<span class="spec-tq"><small>PvE</small><b><span class="spec-sr">PvE </span>'+x.pve+'</b></span>'+
   '<span class="spec-tq"><small>PvP</small><b><span class="spec-sr">PvP </span>'+x.pvp+'</b></span></td>';
  return '<td class="spec-cell q'+x.v+'" data-k="'+esc(k)+'" data-v="'+x.v+'"><b>'+x.v+'</b></td>';
 }
 // Précision est toujours évaluée dans son build de référence, Loup solitaire (WFRecommend.referenceVariants).
 function variant(s){return E.referenceVariants&&E.referenceVariants[s.id]==='sans-familier'?'Loup solitaire':'';}
 function rowHtml(s,axes,i,last,cc){
  var v=variant(s);
  return '<tr class="spec-row'+(last?' spec-last':'')+'" id="spec-'+esc(s.id)+'" data-spec="'+esc(s.id)+'" style="--i:'+i+(cc?';--cc:'+esc(cc):'')+'" hidden>'+
   '<th scope="row" class="sticky spec-name"><span class="spec-label"><a href="fiches-sources/'+esc(s.classId)+'.html#'+esc(s.id)+'" title="Notes et sources de la spécialisation">'+esc(s.label)+'</a>'+
   (v?'<small class="spec-variant" title="Évaluée en Loup solitaire, sans familier">'+esc(v)+'</small>':'')+'</span></th>'+
   axes.map(function(k){return cell(s,k);}).join('')+'</tr>';
 }
 function toggleHtml(ids,name,n){
  return '<button type="button" class="spec-toggle" aria-expanded="false" aria-controls="'+esc(ids.join(' '))+'" aria-label="Spécialisations du '+esc(name)+' ('+n+')" title="Dérouler les '+n+' spécialisations">'+
   '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button>';
 }
 var ALL=['Dérouler toutes les spécialisations','Replier les spécialisations'];
 function mount(doc){
  var table=doc.querySelector('table.matrix'),body=table&&table.tBodies[0];
  if(!body||table.hasAttribute('data-specs'))return null;
  var parents=[],allIds=[];
  Array.prototype.slice.call(body.rows).forEach(function(row){
   var link=row.querySelector('th a[href^="#c-"]');if(!link)return;
   var specs=specsOf(link.getAttribute('href').slice(3));if(!specs.length)return;
   var axes=Array.prototype.map.call(row.querySelectorAll('td[data-k]'),function(td){return td.getAttribute('data-k');});
   var sw=row.querySelector('.sw'),cc=sw&&sw.style.getPropertyValue('--cc').trim();
   var ids=specs.map(function(s){return 'spec-'+s.id;});
   row.classList.add('spec-parent');
   if(cc)row.style.setProperty('--cc',cc);
   row.querySelector('th').insertAdjacentHTML('afterbegin',toggleHtml(ids,link.textContent.trim(),specs.length));
   row.insertAdjacentHTML('afterend',specs.map(function(s,i){return rowHtml(s,axes,i,i===specs.length-1,cc);}).join(''));
   parents.push(row);allIds=allIds.concat(ids);
  });
  if(!parents.length)return null;
  table.setAttribute('data-specs','');
  var box=table.parentNode&&table.parentNode.classList&&table.parentNode.classList.contains('table-box')?table.parentNode:table;
  box.insertAdjacentHTML('beforebegin','<div class="spec-tools"><button type="button" class="spec-all" aria-expanded="false" aria-controls="'+esc(allIds.join(' '))+'">'+
   '<svg viewBox="0 0 16 16" width="12" height="12" aria-hidden="true" focusable="false"><path d="M6 3.5 10.5 8 6 12.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'+
   '<span>'+ALL[0]+'</span></button></div>');
  var all=box.previousElementSibling.querySelector('.spec-all');
  function open(row){return row.classList.contains('is-open');}
  function set(row,on){
   var btn=row.querySelector('.spec-toggle');
   btn.setAttribute('aria-expanded',String(on));
   btn.setAttribute('title',(on?'Replier les ':'Dérouler les ')+btn.getAttribute('aria-controls').split(' ').length+' spécialisations');
   row.classList.toggle('is-open',on);
   btn.getAttribute('aria-controls').split(' ').forEach(function(id){doc.getElementById(id).hidden=!on;});
  }
  function sync(){
   var every=parents.every(open);
   all.setAttribute('aria-expanded',String(every));
   all.classList.toggle('is-open',every);
   all.querySelector('span').textContent=ALL[every?1:0];
   // Dernière ligne visible : pas de trait sous le tableau, quelle que soit la ligne.
   var last=null;
   Array.prototype.forEach.call(body.rows,function(r){r.classList.remove('is-last');if(!r.hidden)last=r;});
   if(last)last.classList.add('is-last');
  }
  body.addEventListener('click',function(e){
   var t=e.target;if(!t||!t.closest||t.closest('a'))return;
   var row=t.closest('tr.spec-parent');if(!row)return;
   // Un texte sélectionné à la souris ne replie pas la ligne.
   var sel=doc.getSelection&&doc.getSelection();
   if(sel&&String(sel)&&!t.closest('button'))return;
   set(row,!open(row));sync();
  });
  all.addEventListener('click',function(){
   var on=all.getAttribute('aria-expanded')!=='true';
   parents.forEach(function(r){set(r,on);});sync();
  });
  sync();
  return {parents:parents,toggleAll:function(){all.click();}};
 }
 return {value:value,cell:cell,rowHtml:rowHtml,specsOf:specsOf,variant:variant,mount:mount};
});
