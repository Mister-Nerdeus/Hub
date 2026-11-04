/* Nerdeus Heritage v16.6 — approved 17-label reference geometry.
   Applies only to new v16.6 templates. No saved package/snapshot migration. */
(function(){
'use strict';
const M=window.LabelMasterV9,R=window.LabelReferenceV15;
if(!M||!R||M.version!==15)throw Error('v16.6 requires the verified reference label master');
const prevApply=R.apply;
const VERSION='v16.6';
function set(doc,name,props){
 const e=doc.elements.find(x=>x.name===name);
 if(!e)return;
 const user=e.userGeometry||{};
 for(const [key,value] of Object.entries(props)){
  if(['x','y','w','h'].includes(key)&&Number.isFinite(user[key]))continue;
  e[key]=value;
 }
}
function update(doc){
 if(doc?.data?.['pkg.templateRevision']!==VERSION||doc.data['pkg.layoutStyle']!=='reference-v15')return doc;
 const d=doc.data;
 // Keep all food facts data-bound. Dates are never estimated from a reference sheet.
 const quality=[1,2,3,4].find(n=>
   ['best_quality_by','use_by'].includes(d['pkg.date'+n+'Type'])&&
   !!d['pkg.date'+n+'Display']);
 const foodTypes=new Set(['ingredient_single','ingredient_prepped','ingredient_combo','pantry_ingredient','seasoning_dry_base']);
 const qualityText=quality?(d['pkg.date'+quality+'Type']==='best_quality_by'?'BEST QUALITY BY ':'USE BY ')+d['pkg.date'+quality+'Display']:'';
 d['pkg.referenceFooter']=foodTypes.has(d['pkg.type'])&&qualityText?qualityText:(d['pkg.printInstruction']||'');
 set(doc,'Red product header',{x:8,y:3,w:575,h:145,radius:0,fill:'red'});
 set(doc,'White category icon',{x:18,y:15,w:128,h:128});
 set(doc,'Main product title',{x:150,y:12,w:417,h:124,fontSize:45,fontFamily:'Arial Narrow,Arial',fontWeight:900,lineHeight:1.02,maxLines:2,autoFit:true,color:'white',align:'center'});
 set(doc,'Black condition strip',{x:9,y:148,w:573,h:36,radius:0,fill:'black'});
 set(doc,'Heritage second header',{x:19,y:151,w:552,h:31,fontSize:26,fontFamily:'Arial Narrow,Arial',fontWeight:800,align:'center',maxLines:1,autoFit:true,color:'white'});
 set(doc,'Artwork edge botanicals',{x:9,y:184,w:573,h:222,fit:'stretch',visible:true});
 const deco=doc.elements.find(x=>x.name==='Artwork edge botanicals');
 if(deco&&['BG-101','BG-013'].includes(deco.assetId))deco.assetId='BG-102';
 set(doc,'Central white dither knockout',{visible:false});
 set(doc,'Hero food illustration',{x:62,y:198,w:468,h:201,haloPreset:'light',visible:true});
 set(doc,'Unapproved artwork placeholder',{x:68,y:258,w:457,h:36,fontSize:19,align:'center'});
 set(doc,'Extra contents descriptor',{x:26,y:404,w:538,h:28,fontSize:20,fontWeight:800,maxLines:1,align:'center'});
 set(doc,'Contents bottom divider',{x:23,y:432,w:545,h:2,fill:'red'});
 set(doc,'Metric quantity',{x:24,y:435,w:251,h:49,fontSize:43,fontWeight:900,align:'center',maxLines:1});
 set(doc,'Imperial quantity',{x:317,y:435,w:247,h:49,fontSize:43,fontWeight:900,align:'center',maxLines:1});
 set(doc,'Quantity separator',{x:295,y:438,w:3,h:43,fill:'red'});
 set(doc,'Packaging material',{x:24,y:482,w:544,h:27,fontSize:20,fontWeight:700,align:'center',maxLines:1});
 set(doc,'Quantity divider',{x:23,y:512,w:545,h:2,fill:'red'});
 set(doc,'Reference allergen capsules',{x:29,y:517,w:532,h:32,showWhen:'pkg.allergens',visible:true});
 set(doc,'Reference red allergen rule',{x:23,y:552,w:545,h:2,fill:'red'});
 set(doc,'QR: package ID',{x:29,y:566,w:132,h:132,text:'{{pkg.id}}',color:'black'});
 set(doc,'ID below QR',{x:22,y:701,w:146,h:27,fontSize:16,maxLines:1,align:'center'});
 for(let n=1;n<=4;n++){
  const y=558+(n-1)*41;
  set(doc,'Reference event icon '+n,{x:181,y:y+1,w:31,h:27,showWhen:'pkg.date'+n+'Display'});
  set(doc,'Event '+n+' name',{x:220,y,w:121,h:30,fontSize:20,fontWeight:800,maxLines:1,align:'left',showWhen:'pkg.date'+n+'Label'});
  set(doc,'Event '+n+' date',{x:343,y,w:222,h:30,fontSize:23,fontWeight:700,maxLines:1,align:'right',showWhen:'pkg.date'+n+'Display'});
  if(n<4)set(doc,'Reference date rule '+n,{x:191,y:y+33,w:374,h:1,fill:'red',showWhen:'pkg.date'+n+'Display'});
 }
 set(doc,'Black instruction footer',{x:9,y:736,w:573,h:86,radius:0,fill:'black'});
 set(doc,'Reference footer icon',{x:22,y:747,w:59,h:60});
 set(doc,'One validated instruction',{text:'{{pkg.referenceFooter}}',x:88,y:742,w:483,h:73,fontSize:26,fontWeight:800,lineHeight:1.08,align:'center',maxLines:2,color:'white',autoFit:true});
 set(doc,'Reference border',{x:8,y:2,w:575,h:821,radius:0,stroke:'black',strokeWidth:2,fill:'none'});
 return doc;
}
R.apply=function(doc){const d=prevApply(doc);return update(d);};
// Promote only newly generated canonical examples and drafts. Existing saved package
// records keep their recorded revision and geometry until the user opts into an upgrade.
function promoteNewTemplate(doc){
 if(!M.isMaster(doc)||doc?.data?.['pkg.layoutStyle']!=='reference-v15')return doc;
 const role=doc.data?.['pkg.recordRole'];
 if(role!=='example'&&role!=='package')return doc;
 doc.data['pkg.templateRevision']=VERSION;
 return update(doc);
}
const previousMake=M.make,previousMakeBlank=M.makeBlank;
M.make=def=>promoteNewTemplate(previousMake(def));
M.makeBlank=def=>promoteNewTemplate(previousMakeBlank(def));
for(const doc of M.defaults||[]){
 if(doc?.data?.['pkg.recordRole']==='example'&&doc.data?.['pkg.layoutStyle']==='reference-v15'&&doc.data?.['pkg.templateRevision']==='v15')
   doc.data['pkg.templateRevision']=VERSION;
 if(doc?.data?.['pkg.templateRevision']===VERSION)update(doc);
}
window.NerdeusHeritageV166={version:'16.6',styleRevision:VERSION,apply:update,referenceGeometry:{
 header:[8,3,575,145],status:[9,148,573,36],artwork:[9,184,573,222],
 dataStart:404,footer:[9,736,573,86]
}};
})();