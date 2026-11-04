/* Nerdeus Meals Heritage v16.7 — food-first fidelity defaults.
   Versioned only: no mutation of saved older packages, snapshots or historical templates. */
(function(){
'use strict';
const M=window.LabelMasterV9,R=window.LabelReferenceV15,C=window.LabelCore,Cuts=window.LabelCuts;
if(!M||!R||!C||!Cuts)throw Error('v16.7 heritage dependencies unavailable');
const REV='v16.7',previousApply=R.apply,previousMotif=M.drawMotif,previousCut=Cuts.draw,previousCutSVG=Cuts.svgImage;
function set(doc,name,props){
 const el=doc.elements.find(e=>e.name===name);if(!el)return;
 for(const [key,value] of Object.entries(props))if(!['x','y','w','h'].includes(key)||!Number.isFinite(el.userGeometry?.[key]))el[key]=value;
}
function insert(doc,el,before){
 if(doc.elements.some(e=>e.name===el.name))return;
 let i=doc.elements.findIndex(e=>e.name===before);if(i<0)i=doc.elements.length;doc.elements.splice(i,0,el);
}
const txt=s=>String(s||'').trim(),upper=s=>txt(s).toUpperCase();
function wrapTitle(s){
 const v=upper(s).replace(/\s+/g,' '),parts=v.split(' ').filter(Boolean);if(parts.length<2)return v;
 let best=1,score=Infinity;
 for(let i=1;i<parts.length;i++){const left=parts.slice(0,i).join(' '),right=parts.slice(i).join(' '),value=Math.abs(left.length-right.length)+Math.max(0,Math.max(left.length,right.length)-21)*4;
 if(value<score){score=value;best=i;}}
 return parts.slice(0,best).join(' ')+'\n'+parts.slice(best).join(' ');
}
function fullDescriptor(d){
 const parts=[],t=d['pkg.type'];
 if(t==='raw_plain'){
  if(txt(d['pkg.attributes']))parts.push(txt(d['pkg.attributes']));
  if(txt(d['pkg.cut'])&&!upper(d['pkg.food']).includes(upper(d['pkg.cut'])))parts.push(txt(d['pkg.cut']));
 }else if(t==='ingredient_prepped'&&txt(d['pkg.prepMethod']))parts.push(txt(d['pkg.prepMethod']));
 parts.push(...txt(d['pkg.contents']).split(/[·,;|]+/).map(x=>x.trim()).filter(Boolean));
 return [...new Set(parts.map(upper))].join(' · ');
}
function kind(d){
 if(d['pkg.recordRole']==='example'&&txt(d['pkg.proofIcon']))return txt(d['pkg.proofIcon']);
 const p=txt(d['pkg.protein']).toLowerCase();
 if(/^beef$|^cattle$|^bison$|^buffalo$/.test(p))return 'cattle';
 if(/^pork$|^pig$/.test(p))return 'pig';
 if(/^chicken$|^turkey$|^duck$/.test(p))return 'chicken';
 if(d['pkg.type']==='ingredient_single'&&txt(d['pkg.prepMethod']).toLowerCase()==='blanched')return 'broccoli';
 if(d['pkg.type']==='ingredient_prepped')return 'onion';
 if(d['pkg.type']==='ingredient_combo')return 'pepper';
 return 'fallback';
}
function status(d){
 if(d['pkg.recordRole']==='example'&&txt(d['pkg.proofStatus']))return upper(d['pkg.proofStatus']);
 const t=d['pkg.type'],protein=upper(d['pkg.protein']),storage=upper(d['pkg.storage']),method=upper(d['pkg.prepMethod']);
 let lead;
 if(t==='raw_plain')lead=[protein,'RAW'].filter(Boolean).join(' · ');
 else if(t==='raw_seasoned')lead='RAW · DRY SEASONED';
 else if(t==='raw_marinated')lead='RAW · MARINATED';
 else if(t==='raw_meal_kit')lead='RAW · ASSEMBLED';
 else if(t==='ingredient_single'&&method)lead=method;
 else if(t==='ingredient_prepped'||t==='ingredient_combo')lead='RAW';
 else if(t==='dry_baking_mix')lead='DRY MIX · YEAST INCLUDED';
 else if(t==='seasoning_dry_base')lead='DRY BLEND';
 else lead=upper(d['pkg.state'])||'PREPARED';
 return [lead,storage].filter(Boolean).join(' · ');
}
function update(doc){
 if(doc?.data?.['pkg.templateRevision']!==REV||doc?.data?.['pkg.layoutStyle']!=='reference-v15')return doc;
 const d=doc.data,allergens=!!txt(d['pkg.allergens']),delta=allergens?0:-18;
 d['pkg.referenceHeader']=wrapTitle(d['pkg.food']||'FOOD PACKAGE');
 d['pkg.referenceStatus']=status(d);
 d['pkg.displayContents']=fullDescriptor(d);
 const quality=[1,2,3,4].find(i=>['best_quality_by','use_by'].includes(d['pkg.date'+i+'Type'])&&txt(d['pkg.date'+i+'Display']));
 const qualityKinds=new Set(['ingredient_single','ingredient_prepped','ingredient_combo','pantry_ingredient','seasoning_dry_base']);
 d['pkg.referenceFooter']=quality&&qualityKinds.has(d['pkg.type'])?(d['pkg.date'+quality+'Type']==='best_quality_by'?'BEST QUALITY BY ':'USE BY ')+d['pkg.date'+quality+'Display']:d['pkg.printInstruction']||'';
 set(doc,'Red product header',{x:8,y:3,w:575,h:145,radius:0,fill:'red'});
 set(doc,'Main product title',{text:'{{pkg.referenceHeader}}',x:148,y:14,w:420,h:123,fontFamily:'Impact',fontWeight:700,bold:true,fontSize:52,textScaleX:.83,maxLines:2,lineHeight:1.05,autoFit:true,align:'center',color:'white'});
 set(doc,'White category icon',{x:19,y:15,w:125,h:125,visible:true});
 set(doc,'Black condition strip',{x:9,y:148,w:573,h:36,radius:0,fill:'black'});
 set(doc,'Heritage second header',{text:'{{pkg.referenceStatus}}',x:18,y:151,w:553,h:31,fontFamily:'Impact',fontWeight:700,bold:true,fontSize:27,textScaleX:.91,maxLines:1,autoFit:true,align:'center',color:'white'});
 set(doc,'Artwork edge botanicals',{x:9,y:184,w:573,h:224,assetId:'BG-103',fit:'stretch',visible:true});
 set(doc,'Central white dither knockout',{visible:false});
 set(doc,'Hero food illustration',{x:55,y:194,w:482,h:210,haloPreset:'light',visible:true});
 set(doc,'Unapproved artwork placeholder',{x:68,y:267,w:454,h:33,fontSize:19});
 set(doc,'Extra contents descriptor',{x:25,y:408,w:540,h:28,fontSize:21,fontWeight:700,bold:true,autoFit:true,align:'center',maxLines:1});
 set(doc,'Contents bottom divider',{x:23,y:435,w:545,h:2,fill:'red'});
 set(doc,'Metric quantity',{x:25,y:438,w:252,h:47,fontSize:45,fontWeight:700,bold:true,align:'center'});
 set(doc,'Imperial quantity',{x:316,y:438,w:249,h:47,fontSize:45,fontWeight:700,bold:true,align:'center'});
 set(doc,'Quantity separator',{x:295,y:442,w:3,h:40});
 set(doc,'Packaging material',{x:25,y:484,w:541,h:27,fontSize:20,fontWeight:700,bold:true,autoFit:true,align:'center'});
 set(doc,'Quantity divider',{x:23,y:515,w:545,h:2});
 set(doc,'Reference allergen capsules',{x:26,y:520,w:538,h:29,visible:true,showWhen:'pkg.allergens'});
 set(doc,'Reference red allergen rule',{x:23,y:allergens?552:525,w:545,h:2,fill:'red'});
 set(doc,'QR: package ID',{x:31,y:565+delta,w:126,h:126,text:'{{pkg.id}}',color:'black'});
 const caption=doc.elements.find(e=>e.name==='Reference QR caption');
 if(!caption)insert(doc,C.el('text','Reference QR caption',19,695,150,18,{text:'DETAILS',color:'black',fontFamily:'Arial',fontSize:17,fontWeight:700,bold:true,align:'center',maxLines:1,showWhen:'pkg.id',locked:true}),'ID below QR');
 set(doc,'Reference QR caption',{x:19,y:696+delta,w:150,h:18,showWhen:'pkg.id'});
 set(doc,'ID below QR',{x:19,y:713+delta,w:150,h:20,fontSize:15,maxLines:1,autoFit:true,showWhen:'pkg.id'});
 for(let i=1;i<=4;i++){
  const y=557+(i-1)*41+delta;
  set(doc,'Reference event icon '+i,{x:182,y:y+2,w:30,h:27});
  set(doc,'Event '+i+' name',{x:219,y,w:126,h:29,fontSize:20,fontWeight:700,bold:true,maxLines:1,autoFit:true});
  set(doc,'Event '+i+' date',{x:344,y,w:222,h:29,fontSize:23,fontWeight:700,bold:true,maxLines:1,autoFit:true,align:'right'});
  if(i<4)set(doc,'Reference date rule '+i,{x:192,y:y+33,w:371,h:1,showWhen:'pkg.date'+i+'Display'});
 }
 set(doc,'Black instruction footer',{x:9,y:736,w:573,h:86,radius:0,fill:'black'});
 set(doc,'Reference footer icon',{x:22,y:747,w:58,h:61});
 set(doc,'One validated instruction',{text:'{{pkg.referenceFooter}}',x:86,y:744,w:485,h:71,fontFamily:'Impact',fontWeight:700,bold:true,fontSize:27,textScaleX:.91,maxLines:2,lineHeight:1.08,autoFit:true,align:'center',color:'white'});
 set(doc,'Reference border',{x:8,y:2,w:575,h:821,radius:0,stroke:'black',strokeWidth:2,fill:'none'});
 if(!doc.elements.some(e=>e.name==='Header corner flourishes'))insert(doc,C.el('motif','Header corner flourishes',511,8,63,131,{motif:'white-herb-corner',color:'white',locked:true}),'Black condition strip');
 return doc;
}
function ornament(ctx,e){
 ctx.save();ctx.beginPath();ctx.rect(e.x,e.y,e.w,e.h);ctx.clip();
 ctx.translate(e.x+e.w*.72,e.y+e.h*.96);ctx.strokeStyle='#fff';ctx.fillStyle='#fff';ctx.lineCap='round';
 for(let j=0;j<3;j++){
  ctx.save();ctx.translate(-j*15,0);ctx.rotate(-j*.17);
  ctx.beginPath();ctx.lineWidth=1.15;ctx.moveTo(0,0);ctx.bezierCurveTo(21,-32,-2,-80,8,-114);ctx.stroke();
  for(let i=1;i<=7;i++){const t=i/8,y=-t*110,x=7+5*Math.sin(t*4);
   for(const side of [-1,1]){ctx.save();ctx.translate(x,y);ctx.rotate(side*.7);ctx.beginPath();ctx.ellipse(side*7,0,9,2.6,side*.4,0,Math.PI*2);ctx.fill();ctx.restore();}
  }ctx.restore();
 }ctx.restore();
}
function specificIcon(ctx,e,doc){
 const key=kind(doc.data||{});if(key==='fallback')return false;
 const scale=Math.min(e.w,e.h)/105;
 ctx.save();ctx.translate(e.x+e.w/2,e.y+e.h/2);ctx.scale(scale,scale);ctx.fillStyle='#fff';ctx.strokeStyle='#fff';ctx.lineWidth=2.2;ctx.lineJoin='round';
 ctx.beginPath();ctx.arc(0,0,46,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.arc(0,0,40,0,Math.PI*2);ctx.stroke();
 const body=(x,y,w,h)=>{ctx.beginPath();ctx.ellipse(x,y,w,h,0,0,Math.PI*2);ctx.fill();};
 if(key==='cattle'){
  body(-4,2,27,15);body(23,-3,14,12);ctx.fillRect(-22,12,6,18);ctx.fillRect(-2,11,6,19);ctx.fillRect(16,9,6,21);
  ctx.beginPath();ctx.moveTo(26,-9);ctx.lineTo(19,-21);ctx.lineTo(33,-16);ctx.lineTo(42,-22);ctx.lineTo(41,-11);ctx.closePath();ctx.fill();
  ctx.beginPath();ctx.moveTo(-30,0);ctx.quadraticCurveTo(-39,-8,-37,-22);ctx.stroke();
 }else if(key==='pig'){
  body(-5,3,30,19);body(21,4,15,14);ctx.fillRect(-21,18,6,16);ctx.fillRect(5,17,7,17);body(34,11,9,6);
  ctx.beginPath();ctx.moveTo(12,-10);ctx.lineTo(8,-24);ctx.lineTo(22,-14);ctx.fill();
  ctx.beginPath();ctx.arc(-32,5,8,-1.7,1.7);ctx.stroke();
 }else if(key==='chicken'){
  body(-5,7,24,18);body(16,-10,10,18);body(19,-22,9,9);
  ctx.beginPath();ctx.moveTo(26,-21);ctx.lineTo(39,-16);ctx.lineTo(27,-12);ctx.fill();
  ctx.beginPath();ctx.moveTo(-25,-5);ctx.lineTo(-38,-20);ctx.lineTo(-28,-20);ctx.lineTo(-16,-7);ctx.fill();
  ctx.fillRect(-6,21,3,13);ctx.fillRect(7,21,3,13);
 }else if(key==='broccoli'){
  for(const [x,y,r] of [[-18,-9,14],[-7,-20,16],[13,-19,16],[25,-5,13],[-1,-3,17]])body(x,y,r,r);
  ctx.beginPath();ctx.moveTo(-9,1);ctx.lineTo(-5,30);ctx.lineTo(12,30);ctx.lineTo(8,1);ctx.fill();
 }else if(key==='onion'||key==='pepper'){
  ctx.lineWidth=3;ctx.beginPath();
  if(key==='onion'){ctx.moveTo(0,-30);ctx.bezierCurveTo(-35,-5,-35,17,0,31);ctx.bezierCurveTo(35,17,34,-5,0,-30);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-28);ctx.quadraticCurveTo(-8,-39,-3,-42);ctx.stroke();}
  else{ctx.moveTo(0,-22);ctx.bezierCurveTo(-32,-31,-34,7,-24,23);ctx.quadraticCurveTo(0,40,24,23);ctx.bezierCurveTo(34,7,31,-31,0,-22);ctx.stroke();ctx.beginPath();ctx.moveTo(0,-24);ctx.lineTo(3,-39);ctx.stroke();}
 }
 ctx.restore();return true;
}
R.apply=function(doc){return update(previousApply(doc));};
M.drawMotif=function(ctx,e,doc){
 if(doc?.data?.['pkg.templateRevision']===REV){
  if(e.motif==='white-herb-corner')return ornament(ctx,e);
  if(e.motif==='icon'&&specificIcon(ctx,e,doc))return;
 }
 return previousMotif(ctx,e,doc);
};
Cuts.draw=function(ctx,e,doc){
 if(doc?.data?.['pkg.templateRevision']!==REV||e.name!=='Hero food illustration')return previousCut(ctx,e,doc);
 const cx=e.x+e.w/2,cy=e.y+e.h/2;ctx.save();ctx.beginPath();ctx.rect(e.x,e.y,e.w,e.h);ctx.clip();
 ctx.translate(cx,cy);ctx.scale(1.24,1.15);ctx.translate(-cx,-cy);previousCut(ctx,e,doc);ctx.restore();
};
Cuts.svgImage=function(doc,e){
 const svg=previousCutSVG(doc,e);if(doc?.data?.['pkg.templateRevision']!==REV||e.name!=='Hero food illustration')return svg;
 const cx=e.x+e.w/2,cy=e.y+e.h/2,clip='food-'+String(doc.id).replace(/[^a-z0-9]/gi,'').slice(0,24);
 return '<defs><clipPath id="'+clip+'"><rect x="'+e.x+'" y="'+e.y+'" width="'+e.w+'" height="'+e.h+'"/></clipPath></defs><g clip-path="url(#'+clip+')" transform="translate('+cx+' '+cy+') scale(1.24 1.15) translate('+-cx+' '+-cy+')">'+svg+'</g>';
};
// The prior v16.6 module wraps creation; promote only freshly-created documents.
const inheritedMake=M.make,inheritedBlank=M.makeBlank;
M.make=function(def){const doc=inheritedMake(def);if(doc?.data?.['pkg.recordRole']==='example'&&doc.data['pkg.layoutStyle']==='reference-v15'){doc.data['pkg.templateRevision']=REV;update(doc);}return doc;};
M.makeBlank=function(def){const doc=inheritedBlank(def);if(doc?.data?.['pkg.recordRole']==='package'&&doc.data['pkg.layoutStyle']==='reference-v15'){doc.data['pkg.templateRevision']=REV;update(doc);}return doc;};
for(const doc of M.defaults||[])if(doc?.data?.['pkg.templateRevision']===REV)update(doc);
window.NerdeusHeritageV167={version:'16.7',revision:REV,apply:update,wrapTitle,fullDescriptor,kind,referenceOrder:['raw_plain','raw_seasoned','raw_marinated','raw_meal_kit','cooked_meal','cooked_side','ingredient_single','ingredient_prepped','ingredient_combo','sauce_stock_concentrate','dry_baking_mix','seasoning_dry_base']};
})();