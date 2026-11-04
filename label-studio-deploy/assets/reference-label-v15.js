/* Food Package Labels · Reference v15
   Matches approved red header / black status / engraving / QR+dates / black footer layout.
   One 591×827 artwork profile for existing 50×70 mm stock. Original stored designs,
   customer package records and immutable print snapshots are never deleted.
   Source figures in the reference are *examples*, never automatic food safety values. */
(function(){
'use strict';
const M=window.LabelMasterV9,C=window.LabelCore;
if(!M||!C||M.version!==15)throw Error('Reference v15 requires matching label master version 15');
const NAME='reference-v15';
const rawTypes=new Set(['raw_plain','raw_seasoned','raw_marinated','raw_meal_kit']);
const cookedTypes=new Set(['cooked_meal','cooked_side','cooked_component','leftovers','soup_stew','sauce_stock_concentrate']);
const dryTypes=new Set(['dry_baking_mix','seasoning_dry_base','pantry_ingredient']);
const fillFor=(d)=>{
 const kind=String(d['pkg.type']||''),storage=String(d['pkg.storage']||'').trim().toUpperCase();
 const typeText={
  raw_plain:'RAW',raw_seasoned:'RAW · SEASONED',raw_marinated:'RAW · MARINATED',
  ingredient_single:'RAW',ingredient_prepped:'PREPPED',ingredient_combo:'PREPPED',
  raw_meal_kit:'RAW · ASSEMBLED',cooked_meal:'COOKED',cooked_side:'COOKED',
  cooked_component:'COOKED',leftovers:'LEFTOVERS',soup_stew:'COOKED',
  sauce_stock_concentrate:'STOCK · COOKED',dry_baking_mix:'DRY MIX',
  seasoning_dry_base:'DRY BLEND',pantry_ingredient:'PANTRY',opened_ready_to_eat:'OPENED'
 }[kind]||'PREPARED';
 return [typeText,storage].filter(Boolean).join(' · ');
};
function txt(name,text,x,y,w,h,fontSize=18,color='black',extra={}){
 return C.el('text',name,x,y,w,h,{text,fontSize,fontFamily:'Arial',fontWeight:700,
  bold:false,align:'center',maxLines:1,autoFit:true,lineHeight:1.14,color,...extra});
}
function rect(name,x,y,w,h,fill='white',props={}){
 return C.el('rect',name,x,y,w,h,{fill,stroke:'none',locked:true,...props});
}
function motif(name,x,y,w,h,which,extra={}){
 return C.el('motif',name,x,y,w,h,{motif:which,locked:true,...extra});
}
function upsert(doc,layer,before){
 let existing=doc.elements.find(x=>x.name===layer.name);
 if(!existing){
  const index=before?doc.elements.findIndex(x=>x.name===before):-1;
  if(index>=0)doc.elements.splice(index,0,layer);else doc.elements.push(layer);
  existing=layer;
 }
 return existing;
}
function set(doc,name,changes){
 const e=doc.elements.find(x=>x.name===name);if(!e)return;
 const geometry=e.userGeometry&&['reference-v15'].includes(doc.data?.['pkg.layoutStyle'])?
  Object.fromEntries(['x','y','w','h'].filter(k=>Number.isFinite(e.userGeometry[k])).map(k=>[k,e.userGeometry[k]])):{};
 Object.assign(e,changes,geometry);
}
function apply(doc){
 if(doc?.data?.['pkg.layoutStyle']!==NAME)return doc;
 const d=doc.data,def=M.byId.get(d['pkg.type']);if(!def)return doc;
 const food=String(d['pkg.food']||'').trim();
 d['pkg.referenceHeader']=(food||def.label||'FOOD PACKAGE').toUpperCase();
 d['pkg.referenceStatus']=fillFor(d);
 const volume=/(?:^|\s)(?:ml|l)\s*$/i.test(String(d['pkg.metric']||''));
 d['pkg.referencePack']=[volume?'NET VOLUME':'NET WEIGHT',
  String(d['pkg.packaging']||'').trim().toUpperCase()].filter(Boolean).join(' · ');
 const headerLength=d['pkg.referenceHeader'].length;
 const headerSize=headerLength>30?28:headerLength>23?31:headerLength>15?35:40;

 set(doc,'White stock',{x:0,y:0,w:591,h:827,fill:'white',locked:true});
 set(doc,'Red product header',{x:3,y:3,w:585,h:119,fill:'red',stroke:'none',radius:18,locked:true});
 set(doc,'White category icon',{x:16,y:12,w:106,h:105,visible:true,locked:true});
 set(doc,'Main product title',{text:'{{pkg.referenceHeader}}',x:130,y:13,w:442,h:95,
  fontSize:headerSize,fontFamily:'Arial',fontWeight:700,bold:false,
  color:'white',align:'center',maxLines:2,autoFit:true,lineHeight:1.1});
 set(doc,'Draft indicator',{visible:false});
 set(doc,'Black condition strip',{x:10,y:122,w:571,h:39,fill:'black',radius:15,locked:true});
 upsert(doc,txt('Heritage second header','{{pkg.referenceStatus}}',22,126,545,30,22,'white'),
  'Nonredundant state attributes');
 set(doc,'Heritage second header',{text:'{{pkg.referenceStatus}}',x:24,y:126,w:543,h:31,
  color:'white',fontFamily:'Arial',fontWeight:700,bold:false,fontSize:22,
  align:'center',maxLines:1,autoFit:true});
 set(doc,'Nonredundant state attributes',{visible:false});
 set(doc,'Artwork edge botanicals',{x:7,y:165,w:577,h:215,locked:true,visible:true});
 const deco=doc.elements.find(e=>e.name==='Artwork edge botanicals');
 if(deco?.assetId==='BG-013'&&!d['pkg.ornament']){deco.assetId='BG-101';d['pkg.ornament']='BG-101';}
 set(doc,'Central white dither knockout',{x:7,y:165,w:577,h:215,visible:false});
 set(doc,'Hero food illustration',{x:78,y:180,w:436,h:184,locked:false,visible:true,
  haloPreset:String(d['pkg.halo']||'medium')});
 set(doc,'Unapproved artwork placeholder',{x:78,y:238,w:436,h:34,
  fontFamily:'Arial',fontWeight:600,bold:false,fontSize:18,align:'center',
  showWhen:'pkg.artworkPlaceholder'});
 set(doc,'Heritage actual food name',{visible:false});
 set(doc,'Extra contents descriptor',{x:28,y:384,w:535,h:30,
  fontFamily:'Arial',fontWeight:700,bold:false,fontSize:19,
  align:'center',maxLines:1,autoFit:true,showWhen:'pkg.displayContents'});
 set(doc,'Contents bottom divider',{x:23,y:419,w:545,h:2,fill:'red'});
 set(doc,'Metric quantity',{x:25,y:426,w:244,h:48,fontFamily:'Arial',
  fontWeight:700,bold:false,fontSize:40,align:'center',maxLines:1,autoFit:true});
 set(doc,'Quantity separator',{x:294,y:429,w:3,h:43,fill:'red'});
 set(doc,'Imperial quantity',{x:319,y:426,w:245,h:48,fontFamily:'Arial',
  fontWeight:700,bold:false,fontSize:40,align:'center',maxLines:1,autoFit:true});
 set(doc,'Packaging material',{text:'{{pkg.referencePack}}',x:25,y:473,w:540,h:27,
  fontFamily:'Arial',fontWeight:600,bold:false,fontSize:19,
  align:'center',maxLines:1,autoFit:true});
 set(doc,'Quantity divider',{x:23,y:507,w:545,h:2,fill:'red'});
 // Red allergen capsules exist ONLY for actual recorded allergens.
 set(doc,'Recorded allergen bullets',{visible:false});
 upsert(doc,motif('Reference allergen capsules',27,515,537,31,'allergen-pills',
  {showWhen:'pkg.allergens'}),'QR: package ID');
 set(doc,'Reference allergen capsules',{x:27,y:515,w:537,h:31,motif:'allergen-pills',
  visible:true,locked:true,showWhen:'pkg.allergens'});
 upsert(doc,rect('Reference red allergen rule',23,551,545,2,'red'),'QR: package ID');
 set(doc,'Reference red allergen rule',{x:23,y:552,w:545,h:2,fill:'red',locked:true,visible:true});
 set(doc,'QR: package ID',{x:27,y:563,w:144,h:144,color:'black',text:'{{pkg.id}}'});
 set(doc,'ID below QR',{x:20,y:709,w:162,h:26,fontFamily:'Arial',fontWeight:700,
  bold:false,fontSize:16,align:'center',maxLines:1,autoFit:true});
 for(let n=1;n<=4;n++){
  const y=561+(n-1)*43;
  upsert(doc,motif('Reference event icon '+n,190,y+2,30,27,'date-event',
   {eventIndex:n,showWhen:'pkg.date'+n+'Display'}),'Event '+n+' name');
  set(doc,'Reference event icon '+n,{x:190,y:y+2,w:30,h:27,motif:'date-event',eventIndex:n,
   locked:true,visible:true,showWhen:'pkg.date'+n+'Display'});
  set(doc,'Event '+n+' name',{x:230,y,w:115,h:29,fontFamily:'Arial',fontWeight:700,
   bold:false,fontSize:19,align:'left',maxLines:1,autoFit:true});
  set(doc,'Event '+n+' date',{x:345,y,w:215,h:29,fontFamily:'Arial',fontWeight:600,
   bold:false,fontSize:19,align:'right',maxLines:1,autoFit:true});
  if(n<4){
   upsert(doc,rect('Reference date rule '+n,193,y+34,367,1,'red'),'Black instruction footer');
   set(doc,'Reference date rule '+n,{x:193,y:y+34,w:367,h:1,fill:'red',visible:true,locked:true});
  }
 }
 set(doc,'Black instruction footer',{x:9,y:746,w:573,h:75,fill:'black',
  radius:15,locked:true,visible:true});
 upsert(doc,motif('Reference footer icon',23,755,62,58,'footer-guidance'),
  'One validated instruction');
 set(doc,'Reference footer icon',{x:23,y:755,w:62,h:58,
  motif:'footer-guidance',locked:true,visible:true});
 set(doc,'One validated instruction',{text:'{{pkg.printInstruction}}',
  x:96,y:755,w:474,h:60,fontFamily:'Arial',fontWeight:700,bold:false,
  fontSize:25,color:'white',align:'center',maxLines:2,autoFit:true,lineHeight:1.12});
 const outline=upsert(doc,rect('Reference border',2,2,587,823,'none',
  {stroke:'red',strokeWidth:3,radius:18}),null);
 const idx=doc.elements.indexOf(outline);
 if(idx>=0&&idx<doc.elements.length-1){doc.elements.splice(idx,1);doc.elements.push(outline);}
 set(doc,'Reference border',{x:2,y:2,w:587,h:823,fill:'none',stroke:'red',
  strokeWidth:3,radius:18,visible:true,locked:true});
 return doc;
}
function allergens(doc){
 return String(doc.data?.['pkg.allergens']||'').split(/[;,|]+/).map(t=>t.trim().toUpperCase()).filter(Boolean);
}
function allergenFits(doc){
 const items=allergens(doc);
 if(!items.length)return true;
 if(items.length>8)return false;
 // Conservative measured estimate at 14 px Arial bold. Printing text is more compact at smaller sizes.
 return items.reduce((n,x)=>n+Math.max(43,x.length*9+22),0)+Math.max(0,items.length-1)*8<=537;
}
function drawBadges(ctx,e,doc){
 const labels=allergens(doc);if(!labels.length)return;
 ctx.save();ctx.translate(e.x,e.y);
 let font=18;let widths=[];
 while(font>=13){
  ctx.font='700 '+font+'px Arial,Helvetica,sans-serif';
  widths=labels.map(label=>Math.max(40,Math.ceil(ctx.measureText(label).width)+23));
  if(widths.reduce((a,b)=>a+b,0)+8*(labels.length-1)<=e.w)break;
  font--;
 }
 if(font<13){ // Preview reports the unsafe overflow; shared v15 validation blocks print approval.
  ctx.font='700 14px Arial,Helvetica,sans-serif';ctx.fillStyle='#ff0000';
  ctx.textAlign='center';ctx.fillText('REVIEW ALLERGEN LIST LENGTH',e.w/2,e.h*.73);
  ctx.restore();return;
 }
 const total=widths.reduce((a,b)=>a+b,0)+8*(labels.length-1);
 let x=(e.w-total)/2;
 for(let i=0;i<labels.length;i++){
  const width=widths[i];ctx.fillStyle='#ff0000';
  ctx.beginPath();ctx.roundRect(x,2,width,e.h-4,Math.min(14,(e.h-4)/2));ctx.fill();
  ctx.fillStyle='#ffffff';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.fillText(labels[i],x+width/2,e.h/2+1);
  x+=width+8;
 }
 ctx.restore();
}
function drawDate(ctx,e,doc){
 const n=Number(e.eventIndex)||1;
 const kind=doc.data?.['pkg.date'+n+'Type']||'';
 ctx.save();ctx.translate(e.x,e.y);
 ctx.strokeStyle='#ff0000';ctx.fillStyle='#ff0000';ctx.lineWidth=3.0;
 ctx.lineCap='round';ctx.lineJoin='round';
 if(kind==='frozen'){
  const x=e.w/2,y=e.h/2,len=12;
  for(let k=0;k<3;k++){
   const theta=k*Math.PI/3;
   ctx.beginPath();ctx.moveTo(x-len*Math.cos(theta),y-len*Math.sin(theta));
   ctx.lineTo(x+len*Math.cos(theta),y+len*Math.sin(theta));ctx.stroke();
  }
  for(let k=0;k<6;k++){
   const theta=k*Math.PI/3;
   const xx=x+len*Math.cos(theta),yy=y+len*Math.sin(theta);
   const nx=x+(len-5)*Math.cos(theta),ny=y+(len-5)*Math.sin(theta);
   ctx.beginPath();
   ctx.moveTo(xx-3*Math.cos(theta-Math.PI/3),yy-3*Math.sin(theta-Math.PI/3));
   ctx.lineTo(nx,ny);ctx.lineTo(xx-3*Math.cos(theta+Math.PI/3),yy-3*Math.sin(theta+Math.PI/3));
   ctx.stroke();
  }
 }else{
  const x=3,y=5,w=e.w-6,h=e.h-8;
  ctx.beginPath();ctx.roundRect(x,y,w,h,3);ctx.stroke();
  ctx.beginPath();ctx.moveTo(x,y+7);ctx.lineTo(x+w,y+7);ctx.stroke();
  for(const xx of [x+7,x+w-7]){
   ctx.beginPath();ctx.moveTo(xx,y-3);ctx.lineTo(xx,y+4);ctx.stroke();
  }
  for(const xx of [x+8,x+14,x+20])for(const yy of [y+13,y+19]){
   ctx.fillRect(xx,yy,2.4,2.4);
  }
 }
 ctx.restore();
}
function drawFooter(ctx,e,doc){
 const kind=String(doc.data?.['pkg.type']||'');
 const storage=String(doc.data?.['pkg.storage']||'').toUpperCase();
 ctx.save();ctx.translate(e.x+e.w/2,e.y+e.h/2);
 ctx.strokeStyle='#ffffff';ctx.fillStyle='#ffffff';ctx.lineWidth=4.2;
 ctx.lineCap='round';ctx.lineJoin='round';
 if(rawTypes.has(kind)){
  // Thermometer / temperature guidance.
  ctx.beginPath();ctx.roundRect(-6,-24,12,37,6);ctx.stroke();
  ctx.beginPath();ctx.arc(0,17,12,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(0,-12);ctx.lineTo(0,18);ctx.stroke();
 }else if(kind==='dry_baking_mix'||kind==='seasoning_dry_base'){
  ctx.beginPath();ctx.moveTo(-25,-3);ctx.quadraticCurveTo(-21,24,0,24);
  ctx.quadraticCurveTo(22,24,25,-3);ctx.stroke();
  ctx.beginPath();ctx.ellipse(0,-3,25,7,0,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(11,-3);ctx.lineTo(20,-23);ctx.stroke();
 }else if((kind==='ingredient_prepped'||kind==='ingredient_single'||kind==='ingredient_combo')&&storage==='FROZEN'){
  for(let a=0;a<6;a++){const theta=a*Math.PI/3;
   ctx.beginPath();ctx.moveTo(0,0);ctx.lineTo(25*Math.cos(theta),25*Math.sin(theta));ctx.stroke();}
 }else if(cookedTypes.has(kind)){
  ctx.beginPath();ctx.roundRect(-25,-22,50,43,6);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-25,-12);ctx.lineTo(25,-12);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-16,10);ctx.lineTo(16,10);ctx.stroke();
  for(const x of [-17,-7,3]){ctx.beginPath();ctx.arc(x,-17,1.3,0,Math.PI*2);ctx.fill();}
 }else{
  ctx.beginPath();ctx.ellipse(0,-1,24,12,0,0,Math.PI*2);ctx.stroke();
  ctx.beginPath();ctx.moveTo(-24,1);ctx.quadraticCurveTo(-19,22,0,22);
  ctx.quadraticCurveTo(19,22,24,1);ctx.stroke();
 }
 ctx.restore();
}
function drawMotif(ctx,e,doc){
 if(e.motif==='allergen-pills')drawBadges(ctx,e,doc);
 else if(e.motif==='date-event')drawDate(ctx,e,doc);
 else if(e.motif==='footer-guidance')drawFooter(ctx,e,doc);
}
const masters=M.defaults||[];
for(const doc of masters)if(doc?.data?.['pkg.layoutStyle']===NAME)apply(doc);
const api={version:15,style:NAME,apply,drawMotif,allergenFits,referenceStatus:fillFor};
window.LabelReferenceV15=api;
})();