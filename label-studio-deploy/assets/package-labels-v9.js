/* Label Studio v9 – consistent packaging artwork system.
   Exact red/black/white, content-accurate artwork, binary white stipple halo.
   New templates are additive; legacy templates and immutable snapshots unchanged. */
(function(){
'use strict';
const C=window.LabelCore, P=window.LabelPackages, Cuts=window.LabelCuts;
if(!C||!P||!Cuts)throw new Error('v9 requires core, packages and cut library');
const prevMake=C.initialTemplates,prevPanel=P.panel,prevValidate=P.validate,prevIsPackage=P.isPackage,prevChange=P.change,prevRender=C.render,prevSVG=C.svg,prevCutDraw=Cuts.draw,prevCutSVG=Cuts.svgImage;
const BW={red:'#ff0000',white:'#ffffff',black:'#000000'};
const variants=[
{id:'pkg-seasoned-protein',name:'Dry-seasoned raw protein',category:'SEASONED RAW PROTEIN',nameSample:'Garlic Herb Chicken',state:'RAW',metric:'500 g',imperial:'17.6 oz',storage:'FROZEN',action:'COOK',instructions:'Follow verified cooking directions',temp:'165°F / 74°C',contents:'Garlic · herbs · sea salt',allergens:'',portions:''},
{id:'pkg-marinated-protein',name:'Marinated raw protein',category:'MARINATED RAW PROTEIN',nameSample:'Teriyaki Pork Chops',state:'RAW',metric:'550 g',imperial:'19.4 oz',storage:'FROZEN',action:'COOK',instructions:'Follow verified cut-specific cooking directions',temp:'',contents:'Soy · ginger · garlic',allergens:'SOY',portions:''},
{id:'pkg-seasoning-base',name:'Seasoning packet / meal base',category:'DRY SEASONING',nameSample:'Taco Seasoning',state:'DRY',metric:'60 g',imperial:'2.1 oz',storage:'COOL & DRY',action:'PREPARE',instructions:'Use per recipe',temp:'',contents:'Chile · cumin · garlic',allergens:'',portions:''},
{id:'pkg-opened-product',name:'Opened / ready-to-eat product',category:'OPENED / READY TO EAT',nameSample:'Shredded Cheese',state:'READY TO EAT',metric:'200 g',imperial:'7.1 oz',storage:'REFRIGERATED',action:'USE',instructions:'Use according to storage guidance',temp:'',contents:'',allergens:'MILK',portions:''}
];
for(const v of variants){if(!P.byId.has(v.id)){P.specs.push(v);P.byId.set(v.id,v);}}
const examples={
'pkg-raw-protein':{food:'Ribeye Steak',status:'BEEF · RAW · FROZEN',detail:'BONELESS · 1 STEAK',pack:'VACUUM BAG',icon:'steak',cut:'beef_ribeye',footer:'COOK TO VERIFIED TARGET',footnote:''},
'pkg-seasoned-protein':{food:'Garlic Herb Chicken',status:'RAW · DRY SEASONED · FROZEN',detail:'GARLIC · HERBS · SEA SALT',pack:'VACUUM BAG',icon:'chicken',cut:'chicken_breast_boneless_skinless',footer:'COOK TO VERIFIED TARGET',footnote:''},
'pkg-marinated-protein':{food:'Teriyaki Pork Chops',status:'RAW · MARINATED · FROZEN',detail:'SOY · GINGER · GARLIC',pack:'VACUUM BAG',icon:'steak',cut:'pork_chops_bone_in',footer:'COOK TO VERIFIED TARGET',footnote:''},
'pkg-prepped-raw':{food:'Diced Onion',status:'RAW · FROZEN',detail:'PEELED · DICED',pack:'VACUUM BAG',icon:'onion',footer:'USE PER RECIPE',footnote:''},
'pkg-raw-combo':{food:'Onion & Pepper Mix',status:'RAW · DICED',detail:'ONION · RED PEPPER · GREEN PEPPER',pack:'VACUUM BAG',icon:'onion',footer:'USE PER RECIPE',footnote:''},
'pkg-raw-kit':{food:'Chicken Fajita Kit',status:'RAW COMPONENTS · FROZEN',detail:'CHICKEN · PEPPERS · ONION',pack:'VACUUM BAG',icon:'kit',footer:'COOK ALL RAW COMPONENTS',footnote:'FOLLOW VERIFIED RECIPE'},
'pkg-cooked-ingredient':{food:'Sautéed Peppers & Onion',status:'COOKED · REFRIGERATED',detail:'PEPPERS · ONION',pack:'VACUUM BAG',icon:'onion',footer:'REHEAT TO VERIFIED TARGET',footnote:''},
'pkg-cooked-side':{food:'Mashed Potatoes',status:'COOKED · FROZEN',detail:'POTATO · BUTTER · MILK',pack:'SEALED TUB',icon:'vegetable',footer:'REHEAT TO VERIFIED TARGET',footnote:''},
'pkg-cooked-meal':{food:'Beef Lasagna',status:'COOKED · FROZEN',detail:'BEEF · PASTA · TOMATO · CHEESE',pack:'SEALED TRAY',icon:'lasagna',footer:'REHEAT TO VERIFIED TARGET',footnote:''},
'pkg-leftovers':{food:'Sunday Pot Roast',status:'COOKED · REFRIGERATED',detail:'',pack:'SEALED CONTAINER',icon:'steak',footer:'REHEAT TO VERIFIED TARGET',footnote:''},
'pkg-soup-stew':{food:'Hearty Beef Stew',status:'COOKED · FROZEN',detail:'BEEF · POTATO · CARROT',pack:'SEALED BAG',icon:'meal',footer:'REHEAT TO VERIFIED TARGET',footnote:''},
'pkg-sauce':{food:'Tomato Pasta Sauce',status:'COOKED · FROZEN',detail:'TOMATO · HERBS',pack:'SEALED POUCH',icon:'vegetable',footer:'HEAT PER RECIPE',footnote:''},
'pkg-dry-mix':{food:'White Bread Mix',status:'DRY MIX · YEAST INCLUDED',detail:'FLOUR · DAIRY POWDERS · YEAST',pack:'VACUUM BAG',icon:'wheat',footer:'ADD WATER + OIL',footnote:'FOLLOW RECIPE'},
'pkg-pantry':{food:'Smoked Paprika',status:'DRY · PANTRY',detail:'',pack:'SEALED JAR',icon:'wheat',footer:'USE PER RECIPE',footnote:''},
'pkg-seasoning-base':{food:'Taco Seasoning',status:'DRY BLEND',detail:'CHILE · CUMIN · GARLIC · SALT',pack:'SEALED PACKET',icon:'wheat',footer:'USE PER RECIPE',footnote:''},
'pkg-opened-product':{food:'Shredded Cheese',status:'OPENED · REFRIGERATED',detail:'',pack:'RESEALED BAG',icon:'vegetable',footer:'USE BY RECORDED DATE',footnote:''}
};
const baseProfile=C.clone(prevMake()[0].profile);
function element(type,name,x,y,w,h,props){return C.el(type,name,x,y,w,h,props||{});}
function label(name,value,x,y,w,h,size,color='black',extra={}){
return element('text','v9 · '+name,x,y,w,h,{text:value,color,bold:true,fontFamily:'Arial',fontSize:size,align:'left',lineHeight:1.08,autoFit:true,maxLines:1,...extra});
}
function block(name,x,y,w,h,fill){return element('rect','v9 · '+name,x,y,w,h,{fill,stroke:'none',radius:0});}
function rule(name,x,y,w,color='red',strokeWidth=2){return element('line','v9 · '+name,x,y,w,2,{color,strokeWidth});}
const ART_ID='v9-engraved-border';
function makeOrnament(){
 const c=document.createElement('canvas');c.width=540;c.height=215;
 const q=c.getContext('2d',{willReadFrequently:true});q.fillStyle='#fff';q.fillRect(0,0,540,215);
 q.strokeStyle='#ff0000';q.fillStyle='#ff0000';q.lineCap='round';
 function leaf(x,y,scale,reverse){
  q.save();q.translate(x,y);q.scale(reverse?-scale:scale,scale);q.lineWidth=3.0;
  q.beginPath();q.moveTo(0,62);q.bezierCurveTo(1,27,5,-14,28,-66);q.stroke();
  for(let k=0;k<7;k++){const yy=40-k*15;for(const side of [-1,1]){
   q.beginPath();q.moveTo(3+k*2,yy);q.quadraticCurveTo(side*24+6+k*2,yy-20,side*23+6+k*2,yy-28);
   q.quadraticCurveTo(side*3+4+k*2,yy-20,3+k*2,yy);q.fill();}}
  q.restore();
 }
 leaf(9,145,.76,false);leaf(79,167,.61,false);leaf(528,143,.76,true);leaf(461,168,.61,true);
 leaf(5,30,.38,false);leaf(533,29,.38,true);
 let seed=99713;const rand=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;};
 for(let i=0;i<390;i++){let l=i%2===0,x=l?rand()*121:540-rand()*121,y=10+rand()*193;
  let probability=.18+.50*Math.min(x,540-x)/121;
  if(rand()<probability){q.fillRect(Math.round(x),Math.round(y),i%8===0?2:1,i%8===0?2:1);}
 }
 const img=q.getImageData(0,0,540,215),d=img.data;
 for(let i=0;i<d.length;i+=4){const red=d[i+1]<140;d[i]=255;d[i+1]=red?0:255;d[i+2]=red?0:255;d[i+3]=255;}
 q.putImageData(img,0,0);return c.toDataURL('image/png');
}
const ornamentData=makeOrnament();
function create(spec){
 const a=examples[spec.id]||{},id='v9-'+spec.id;
 const d={
  'pkg.type':id,'pkg.food':a.food||spec.nameSample,'pkg.state':spec.state,'pkg.status':a.status||spec.state,'pkg.detail':a.detail||spec.contents||'',
  'pkg.metric':spec.metric,'pkg.imperial':spec.imperial,'pkg.portions':spec.portions||'',
  'pkg.storage':spec.storage,'pkg.packaging':a.pack||'VACUUM BAG','pkg.packed':'','pkg.packedCaption':spec.id.includes('opened')?'OPENED':spec.state==='DRY'?'BLENDED':spec.id==='pkg-raw-kit'?'ASSEMBLED':spec.id==='pkg-prepped-raw'||spec.id==='pkg-raw-combo'?'PREPPED':spec.state==='COOKED'?'COOKED':'PACKED','pkg.extraDate':'','pkg.extraDateLabel':spec.storage==='FROZEN'?'FROZEN':'PREPARED',
  'pkg.date':'','pkg.dateCaption':P.dateCaption(spec.storage),'pkg.instructions':spec.instructions||'',
  'pkg.action':spec.action,'pkg.temp':spec.temp||'','pkg.thaw':spec.storage==='FROZEN'?'Thaw in refrigerator if needed':'',
  'pkg.contents':spec.contents||'','pkg.allergens':spec.allergens||'','pkg.id':'DEMO-'+spec.id.slice(4).toUpperCase(),
  'pkg.batch':'','pkg.recipeRef':'','pkg.location':'','pkg.footerMain':a.footer||spec.action+' PER RECIPE','pkg.footerSub':a.footnote||'',
  'pkg.icon':a.icon||'meal','pkg.needsArt':a.cut?'':'SELECT ACTUAL FOOD ARTWORK','pkg.sampleFlag':'SAMPLE · VERIFY DATA',
  'pkg.reviewed':'0','pkg.allergensReviewed':'0','pkg.artworkReviewed':'0'
 };
 const E=[
  block('White stock',0,0,591,827,'white'),
  block('Red header',0,0,591,149,'red'),
  label('Title','{{pkg.food}}',150,37,407,98,46,'white',{maxLines:2}),
  block('Status band',0,149,591,35,'black'),
  label('Status line','{{pkg.status}}',18,155,555,25,21,'white',{align:'center'}),
  element('background','v9 · botanical art-region ornament',0,184,591,214,{assetId:ART_ID,region:'custom',fit:'stretch',panX:50,panY:50,zoom:100,locked:true}),
  label('Awaiting actual artwork','{{pkg.needsArt}}',49,271,493,27,20,'red',{align:'center',showWhen:'pkg.needsArt'}),
  label('Ingredients or physical form','{{pkg.detail}}',21,405,549,24,17,'black',{align:'center',showWhen:'pkg.detail'}),
  rule('Weight top line',24,436,543,'red',2),
  label('Metric quantity','{{pkg.metric}}',25,448,248,41,36,'black',{align:'center'}),
  block('Quantity separator',294,449,4,39,'red'),
  label('Imperial quantity','{{pkg.imperial}}',319,448,245,41,36,'black',{align:'center'}),
  label('Packaging information','NET QUANTITY · {{pkg.packaging}}',24,493,544,20,15,'black',{align:'center'}),
  rule('Weight bottom line',24,519,543,'red',2),
  // Red allergen capsules drawn by the final renderer only when recorded.
  rule('Dates upper divider',24,555,543,'red',2),
  label('Date one heading','{{pkg.packedCaption}}',208,574,144,22,16,'black'),
  label('Date one value','{{pkg.packed}}',355,574,218,23,17,'black',{format:'date',align:'right'}),
  rule('Date line one',204,605,358,'red',1),
  label('Date two heading','{{pkg.extraDateLabel}}',208,618,144,22,16,'black',{showWhen:'pkg.extraDate'}),
  label('Date two value','{{pkg.extraDate}}',355,618,218,23,17,'black',{format:'date',align:'right'}),
  rule('Date line two',204,649,358,'red',1),
  label('End date heading','{{pkg.dateCaption}}',208,661,147,23,15,'red'),
  label('End date value','{{pkg.date}}',356,661,215,23,17,'red',{format:'date',align:'right'}),
  rule('Date line three',204,692,358,'red',1),
  element('qr','v9 · package ID QR only',28,570,140,140,{text:'{{pkg.id}}',color:'black'}),
  label('Package ID','{{pkg.id}}',25,715,150,23,13,'black',{align:'center'}),
  block('Black action footer',0,748,591,79,'black'),
  label('Action','{{pkg.footerMain}}',30,759,531,25,21,'white',{align:'center'}),
  label('Action detail','{{pkg.footerSub}}',30,786,531,25,18,'white',{align:'center',showWhen:'pkg.footerSub'}),
  label('Draft indicator','{{pkg.sampleFlag}}',340,18,222,18,12,'white',{align:'right',showWhen:'pkg.sampleFlag'})
 ];
 if(a.cut)E.splice(6,0,element('illustration','v9 · isolated actual food',49,205,490,176,{assetId:a.cut,haloMode:'stipple',locked:false}));
 const assets={[ART_ID]:{id:ART_ID,name:'Botanical engraving with halftone edges',width:540,height:215,origin:'nls-v9',dataUri:ornamentData}};
 // Do not embed old cut images in each stock template: v4 catalog supplies them.
 return {schema:C.SCHEMA,id,name:'NEW · '+spec.name,kind:'package',description:'Red / black packaging style · choose actual food artwork and confirm all data',profile:C.clone(baseProfile),data:d,assets,elements:E,nlsDesignVersion:9};
}
const defaults=P.specs.map(create);
const catalog=new Map(defaults.map(x=>[x.id,x]));
C.initialTemplates=()=>defaults.concat(prevMake().filter(t=>!P.byId.has(t.id)));
const isV9=doc=>!!doc&&doc.nlsDesignVersion===9&&String(doc.data?.['pkg.type']||'').startsWith('v9-pkg-');
P.isPackage=doc=>isV9(doc)||prevIsPackage(doc);
P.defaults=defaults;
P.make=spec=>create(spec);
function pairError(metric,imperial){return P.calculatePair(metric,imperial);}
function dateOK(x){
 if(!/^\d{4}-\d{2}-\d{2}$/.test(x||''))return false;
 const d=new Date(x+'T12:00:00Z');return !Number.isNaN(d.valueOf())&&d.toISOString().slice(0,10)===x;
}
function verify(doc,review=true){
 if(!isV9(doc))return prevValidate(doc,review);
 const d=doc.data,v=k=>String(d['pkg.'+k]||'').trim(),issues=[];
 for(const k of ['food','status','metric','imperial','storage','packaging','instructions','id','footerMain'])if(!v(k))issues.push('Complete the '+k+' field.');
 const q=pairError(v('metric'),v('imperial'));if(q)issues.push(q);
 if(!dateOK(v('packed')))issues.push('Enter the actual packed date (YYYY-MM-DD).');
 if(!dateOK(v('date')))issues.push('Enter the verified use-by or quality date (YYYY-MM-DD).');
 if(dateOK(v('packed'))&&dateOK(v('date'))&&v('date')<v('packed'))issues.push('Use-by or quality date is earlier than packed date.');
 if(v('extraDate')&&!dateOK(v('extraDate')))issues.push('The optional preparation/frozen date is invalid.');
 if(v('extraDate')&&dateOK(v('packed'))&&dateOK(v('extraDate'))&&v('extraDate')<v('packed'))issues.push('Extra date precedes packed date; check actual chronology.');
 if(!/^[A-Z0-9][A-Z0-9-]{5,39}$/.test(v('id'))||/^(DEMO|SAMPLE|TEST|TEMP)[-_]/i.test(v('id')))issues.push('Enter a real unique package ID (not a demo).');
 if(['v9-pkg-raw-combo','v9-pkg-raw-kit'].includes(v('type'))&&!v('contents'))issues.push('Record the actual mixture or meal-kit ingredients.');
 if(v('action')==='COOK'&&!/\d+(?:\.\d+)?\s*°?\s*F.*\d+(?:\.\d+)?\s*°?\s*C/i.test(v('temp')))issues.push('Cooked temperature is missing or unverified; enter both °F and °C.');
 if(v('action')==='REHEAT'&&!/\d+(?:\.\d+)?\s*°?\s*F.*\d+(?:\.\d+)?\s*°?\s*C/i.test(v('temp')))issues.push('Reheat target must be verified and given in °F and °C.');
 if(['NONE','NO ALLERGENS','UNKNOWN'].includes(v('allergens').toUpperCase()))issues.push('Blank allergens do not mean allergen-free; record reviewed allergens only.');
 const art=doc.elements.find(e=>e.type==='illustration'&&e.visible!==false);
 if(!art)issues.push('Choose actual product artwork before printing this illustrated template.');
 if(art&&!Cuts.source(doc,art.assetId))issues.push('Food artwork asset is missing.');
 if(!doc.elements.some(e=>e.type==='qr'&&e.text==='{{pkg.id}}'))issues.push('QR must encode the package ID only.');
 if(review){
  if(v('reviewed')!=='1')issues.push('Confirm identity, quantities, dates, storage and directions.');
  if(v('allergensReviewed')!=='1')issues.push('Confirm the real ingredients and allergen information were reviewed.');
  if(v('artworkReviewed')!=='1')issues.push('Confirm the artwork shows only the packaged food and no cookware.');
 }
 return issues;
}
P.validate=verify;
function reviewFlag(doc){if(!isV9(doc))return;doc.data['pkg.sampleFlag']=verify(doc,true).length?'SAMPLE · VERIFY DATA':'';}
P.refreshSampleFlag=doc=>isV9(doc)?reviewFlag(doc):undefined;
P.change=(doc,key,value)=>{
 if(!isV9(doc))return prevChange(doc,key,value);
 const d=doc.data;d[key]=String(value??'').slice(0,1000);
 if(key==='pkg.storage'){
   d['pkg.dateCaption']=P.dateCaption(value);
   if(value==='FROZEN')d['pkg.extraDateLabel']='FROZEN';
 }
 if(key==='pkg.allergens'&&/^\s*(NONE|NO ALLERGENS)$/i.test(String(value||'')))d[key]='';
 if(!['pkg.reviewed','pkg.allergensReviewed','pkg.artworkReviewed'].includes(key)){
   d['pkg.reviewed']='0';d['pkg.allergensReviewed']='0';d['pkg.artworkReviewed']='0';
 }
 reviewFlag(doc);
};
// Create a single reusable punchy species/product icon, with no cookware.
function drawEmblem(canvas,doc){
 const q=canvas.getContext('2d',{willReadFrequently:true}),kind=String(doc.data['pkg.icon']||'vegetable');
 q.save();q.strokeStyle=BW.white;q.fillStyle=BW.white;q.lineWidth=5;q.lineCap='round';q.lineJoin='round';
 q.beginPath();q.arc(89,77,57,0,Math.PI*2);q.stroke();
 q.translate(89,77);
 function path(points,close=false){q.beginPath();points.forEach((p,i)=>i?q.lineTo(...p):q.moveTo(...p));if(close)q.closePath();q.stroke();}
 if(kind==='steak'){
  q.beginPath();q.ellipse(0,0,36,24,-.23,0,Math.PI*2);q.stroke();
  q.beginPath();q.ellipse(-5,1,18,11,-.23,0,Math.PI*2);q.stroke();
  q.beginPath();q.arc(17,-10,4,0,Math.PI*2);q.fill();
 }else if(kind==='chicken'){
  q.beginPath();q.ellipse(-6,4,26,19,-.15,0,Math.PI*2);q.fill();
  q.beginPath();q.arc(15,-19,10,0,Math.PI*2);q.fill();
  path([[25,-19],[39,-15],[25,-10]],true);
  path([[-10,20],[-13,35],[-22,35]]);
  path([[7,20],[7,35],[-2,35]]);
  path([[-31,-7],[-42,-17],[-31,-15]]);
 }else if(kind==='onion'||kind==='vegetable'){
  q.beginPath();q.moveTo(0,-37);q.bezierCurveTo(-5,-19,-29,-27,-32,-1);q.bezierCurveTo(-35,25,-10,34,0,33);
  q.bezierCurveTo(10,34,35,25,32,-1);q.bezierCurveTo(29,-27,5,-19,0,-37);q.stroke();
  path([[0,-31],[0,29]]);path([[-19,-15],[-11,12],[0,30],[11,12],[19,-15]]);
 }else if(kind==='kit'){
  path([[-30,-14],[0,-29],[30,-14],[0,3]],true);
  path([[-30,-14],[-30,19],[0,33],[0,3]]);
  path([[30,-14],[30,19],[0,33]]);
 }else if(kind==='lasagna'||kind==='meal'){
  for(let i=0;i<3;i++)path([[-29,-17+i*14],[-12,-27+i*14],[29,-14+i*14],[12,-5+i*14],[-29,-17+i*14]],true);
  path([[-29,11],[-29,19],[12,31],[29,22],[29,15]]);
 }else if(kind==='wheat'){
  path([[0,36],[0,-35]]);
  for(let i=0;i<5;i++){const y=-29+i*13;path([[0,y+12],[-19,y],[-7,y-9]]);path([[0,y+12],[19,y],[7,y-9]]);}
 }else{
  path([[-30,18],[30,18],[20,-15],[-20,-15]],true);
 }
 q.restore();
 // Preserve the hardware's exact 3 colors even around antialiased circle edges.
 const im=q.getImageData(24,12,130,130),a=im.data;
 for(let i=0;i<a.length;i+=4){const isWhite=a[i+1]>=128&&a[i+2]>=128;
  a[i]=255;a[i+1]=isWhite?255:0;a[i+2]=isWhite?255:0;a[i+3]=255;
 }
 q.putImageData(im,24,12);
}
function whiteHalo(ctx,e,doc){
 const w=Math.max(1,Math.round(e.w)),h=Math.max(1,Math.round(e.h));
 if(w*h>300000||w<25||h<25)return null;
 const m=document.createElement('canvas');m.width=w;m.height=h;
 const q=m.getContext('2d',{willReadFrequently:true});
 prevCutDraw(q,{...e,x:0,y:0,w,h},doc);
 const im=q.getImageData(0,0,w,h),a=im.data,N=w*h,opaque=new Uint8Array(N),dist=new Uint16Array(N);
 let count=0;
 for(let i=0;i<N;i++){const k=i*4,yes=a[k+3]>=80;opaque[i]=yes?1:0;if(yes)count++;dist[i]=yes?0:1200;}
 if(count<20)return null;
 // Most sources are transparent binary drawings. When artwork has an opaque
 // page background, derive a compact region from the actual black-ink extents.
 if(count>N*.90){
  let x0=w,y0=h,x1=0,y1=0;
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){
   const z=4*(y*w+x);if(a[z+3]>=80&&a[z]<150&&a[z+1]<150&&a[z+2]<150){x0=Math.min(x0,x);x1=Math.max(x1,x);y0=Math.min(y0,y);y1=Math.max(y1,y);}
  }
  if(x1<=x0||y1<=y0)return null;
  const cx=(x0+x1)/2,cy=(y0+y1)/2,rx=Math.max(1,(x1-x0)/2),ry=Math.max(1,(y1-y0)/2);
  for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x,inside=((x-cx)/rx)**2+((y-cy)/ry)**2<=1;dist[i]=inside?0:1200;}
 }
 const at=(x,y)=>dist[y*w+x];
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){const i=y*w+x;let v=dist[i];
  if(x>0)v=Math.min(v,at(x-1,y)+3);
  if(y>0)v=Math.min(v,at(x,y-1)+3);
  if(x>0&&y>0)v=Math.min(v,at(x-1,y-1)+4);
  if(x<w-1&&y>0)v=Math.min(v,at(x+1,y-1)+4);
  dist[i]=v;}
 for(let y=h-1;y>=0;y--)for(let x=w-1;x>=0;x--){const i=y*w+x;let v=dist[i];
  if(x<w-1)v=Math.min(v,at(x+1,y)+3);
  if(y<h-1)v=Math.min(v,at(x,y+1)+3);
  if(x<w-1&&y<h-1)v=Math.min(v,at(x+1,y+1)+4);
  if(x>0&&y<h-1)v=Math.min(v,at(x-1,y+1)+4);
  dist[i]=v;}
 const halo=document.createElement('canvas');halo.width=w;halo.height=h;
 const hq=halo.getContext('2d',{willReadFrequently:true});const pix=hq.createImageData(w,h),z=pix.data;
 for(let y=0;y<h;y++)for(let x=0;x<w;x++){
  const i=y*w+x,d=dist[i]/3;if(d<=0||d>27)continue;
  const hash=((Math.imul(x+47,1103515245)^Math.imul(y+19,2654435761))>>>0)%1000/1000;
  const chance=d<=7?1:Math.max(0,(27-d)/20);
  if(hash<=chance){const k=i*4;z[k]=z[k+1]=z[k+2]=z[k+3]=255;}
 }
 hq.putImageData(pix,0,0);return halo;
}
const haloCache=new Map();
Cuts.draw=(ctx,e,doc)=>{
 if(!isV9(doc)||e.haloMode!=='stipple')return prevCutDraw(ctx,e,doc);
 const key=e.assetId+'/'+e.w+'/'+e.h;
 let halo=haloCache.get(key);if(!halo){halo=whiteHalo(ctx,e,doc);if(halo){haloCache.set(key,halo);if(haloCache.size>24)haloCache.delete(haloCache.keys().next().value);}}
 if(halo){ctx.save();ctx.imageSmoothingEnabled=false;ctx.drawImage(halo,e.x,e.y);ctx.restore();}
 prevCutDraw(ctx,e,doc);
};
Cuts.svgImage=(doc,e)=>{
 if(!isV9(doc)||e.haloMode!=='stipple')return prevCutSVG(doc,e);
 const halo=whiteHalo(null,e,doc);
 return (halo?'<image x="'+e.x+'" y="'+e.y+'" width="'+e.w+'" height="'+e.h+'" href="'+halo.toDataURL('image/png')+'"/>':'')+prevCutSVG(doc,e);
};
function drawAllergens(canvas,doc){
 const tokens=String(doc.data['pkg.allergens']||'').split(/[;,·\n]+/).map(x=>x.trim().toUpperCase()).filter(Boolean).slice(0,7);
 if(!tokens.length)return;
 const q=canvas.getContext('2d',{willReadFrequently:true});q.font='bold 17px Arial';q.textBaseline='middle';q.textAlign='center';
 const widths=tokens.map(t=>Math.min(154,Math.max(65,Math.ceil(q.measureText(t).width)+24)));
 const total=widths.reduce((a,b)=>a+b,0)+(tokens.length-1)*7;
 let x=Math.max(25,Math.round((591-total)/2));
 for(let i=0;i<tokens.length;i++){
  const w=widths[i];if(x+w>567)break;
  q.fillStyle='#ff0000';q.beginPath();q.roundRect(x,523,w,26,12);q.fill();
  q.fillStyle='#ffffff';q.fillText(tokens[i],x+w/2,536);x+=w+7;
 }
 const im=q.getImageData(20,522,553,29),a=im.data;
 for(let i=0;i<a.length;i+=4){const isRed=a[i]>145&&a[i+1]<145;
  const isWhite=!isRed&&(a[i+1]>135||a[i+2]>135);
  if(a[i+3]<30)continue;
  a[i]=isRed||isWhite?255:0;a[i+1]=isWhite?255:0;a[i+2]=isWhite?255:0;a[i+3]=255;
 }
 q.putImageData(im,20,522);
}
C.render=doc=>{const c=prevRender(doc);if(isV9(doc)){drawEmblem(c,doc);drawAllergens(c,doc);}return c;};
C.svg=doc=>{
 let s=prevSVG(doc);if(!isV9(doc))return s;
 const c=document.createElement('canvas');c.width=C.W;c.height=C.H;
 const q=c.getContext('2d');q.fillStyle='#ff0000';q.fillRect(0,0,c.width,c.height);
 // Overlay only emblem; raster export remains authoritative for exact halftone.
 drawEmblem(c,doc);
 const icon=c.getContext('2d').getImageData(24,12,130,130),i=document.createElement('canvas');i.width=130;i.height=130;i.getContext('2d').putImageData(icon,0,0);
 const badge=document.createElement('canvas');badge.width=C.W;badge.height=C.H;drawAllergens(badge,doc);
 const b=document.createElement('canvas');b.width=553;b.height=29;b.getContext('2d').putImageData(badge.getContext('2d').getImageData(20,522,553,29),0,0);
 return s.replace('</svg>','<image x="24" y="12" width="130" height="130" href="'+i.toDataURL('image/png')+'"/><image x="20" y="522" width="553" height="29" href="'+b.toDataURL('image/png')+'"/></svg>');
};
async function ingest(file,doc){
 if(!/^image\/(png|webp|jpeg)$/.test(file?.type||''))throw Error('Upload a PNG, WEBP or JPEG image (PNG transparency preferred).');
 if(file.size>12*1024*1024)throw Error('Image too large. Maximum is 12 MB.');
 const bitmap=await createImageBitmap(file),canvas=document.createElement('canvas');canvas.width=540;canvas.height=215;
 const q=canvas.getContext('2d',{willReadFrequently:true});q.clearRect(0,0,540,215);q.imageSmoothingEnabled=true;
 const k=Math.min(512/bitmap.width,195/bitmap.height),w=Math.round(bitmap.width*k),h=Math.round(bitmap.height*k);
 q.drawImage(bitmap,Math.round((540-w)/2),Math.round((215-h)/2),w,h);bitmap.close?.();
 const im=q.getImageData(0,0,540,215),data=im.data;
 // Keep original fully transparent pixels transparent. For flattened white uploads,
 // flood-fill white connected to the boundary only (do not erase enclosed white food).
 const cand=new Uint8Array(540*215),remove=new Uint8Array(540*215),queue=new Int32Array(540*215);let head=0,tail=0;
 let opaque=0;for(let i=0;i<cand.length;i++){let o=i*4;if(data[o+3]>30){opaque++;if(data[o]>235&&data[o+1]>235&&data[o+2]>235)cand[i]=1;}}
 if(opaque>cand.length*.7){
  function put(i){if(i<0||i>=cand.length||!cand[i]||remove[i])return;remove[i]=1;queue[tail++]=i;}
  const x0=Math.round((540-w)/2),y0=Math.round((215-h)/2),x1=x0+w-1,y1=y0+h-1;
  for(let x=x0;x<=x1;x++){put(y0*540+x);put(y1*540+x);}
  for(let y=y0;y<=y1;y++){put(y*540+x0);put(y*540+x1);}
  while(head<tail){const n=queue[head++],x=n%540;
   if(x>0)put(n-1);if(x<539)put(n+1);if(n>=540)put(n-540);if(n<540*214)put(n+540);}
 }
 for(let i=0;i<cand.length;i++){
  const a=i*4,alpha=data[a+3],gray=.2126*data[a]+.7152*data[a+1]+.0722*data[a+2];
  if(alpha<128||remove[i]){data[a]=data[a+1]=data[a+2]=0;data[a+3]=0;continue;}
  const b=gray<158?0:255;data[a]=data[a+1]=data[a+2]=b;data[a+3]=255;
 }
 q.putImageData(im,0,0);const uri=canvas.toDataURL('image/png');
 if(uri.length>=850000)throw Error('Converted art exceeds the embedded artwork size limit; simplify the source PNG.');
 const id='custom-art-'+C.UID();doc.assets[id]={id,name:file.name.slice(0,80),width:540,height:215,origin:'custom-food-art-v9',dataUri:uri};
 return id;
}
function setArt(doc,id){
 let e=doc.elements.find(x=>x.type==='illustration');
 if(!id){if(e)e.visible=false;doc.data['pkg.needsArt']='SELECT ACTUAL FOOD ARTWORK';return;}
 if(!Cuts.source(doc,id))throw Error('Artwork asset is unavailable.');
 if(!e){e=element('illustration','v9 · selected actual food',49,205,490,176,{assetId:id,haloMode:'stipple'});doc.elements.splice(6,0,e);}
 e.assetId=id;e.visible=true;e.haloMode='stipple';e.name='v9 · actual packaged food';doc.data['pkg.needsArt']='';
}
function renderPanel({doc,target,esc,checkpoint,saveLocal,drawArtwork,renderInspector,refresh,setActive}){
 const v=k=>String(doc.data['pkg.'+k]??''),safe=esc;
 const groups=[
 ['IDENTITY',[['food','Product name'],['status','Condition and meaningful attributes'],['detail','Contents / cut summary'],['packaging','Package type'],['icon','Header symbol','icon']]],
 ['QUANTITY',[['metric','Metric quantity'],['imperial','Imperial quantity'],['portions','Servings / portions']]],
 ['DATES AND STORAGE',[['storage','Storage condition'],['packedCaption','First date caption'],['packed','Packed / prepared date','date'],['extraDateLabel','Extra date caption'],['extraDate','Extra date','date'],['date','Use-by / best-quality date','date']]],
 ['HANDLING',[['instructions','Verified handling instructions','textarea'],['temp','Verified temperature (°F / °C)'],['footerMain','Black footer – main instruction'],['footerSub','Black footer – secondary instruction']]],
 ['RECIPE / ALLERGENS',[['contents','Actual ingredients / combinations','textarea'],['allergens','Confirmed allergens'],['id','Unique package ID'],['batch','Batch / lot'],['recipeRef','Recipe reference'],['location','Storage location']]]
 ];
 function field([key,name,type]){
  const inp=type==='textarea'?'<textarea rows="2" data-v9key="pkg.'+key+'">'+safe(v(key))+'</textarea>':
   type==='date'?'<input type="date" data-v9key="pkg.'+key+'" value="'+safe(v(key))+'"/>':
   key==='storage'?'<select data-v9key="pkg.storage">'+['FROZEN','REFRIGERATED','COOL & DRY','ROOM TEMPERATURE'].map(i=>'<option '+(i===v(key)?'selected':'')+'>'+i+'</option>').join('')+'</select>':
   type==='icon'?'<select data-v9key="pkg.icon">'+['steak','chicken','onion','kit','lasagna','meal','wheat','vegetable'].map(i=>'<option '+(i===v(key)?'selected':'')+'>'+i+'</option>').join('')+'</select>':
   '<input type="text" data-v9key="pkg.'+key+'" value="'+safe(v(key))+'"/>';
  return '<div class="field"><label>'+safe(name)+'</label>'+inp+'</div>';
 }
 const selectOptions=defaults.map(x=>'<option value="'+safe(x.id)+'" '+(v('type')===x.id?'selected':'')+'>'+safe(x.name.slice(6))+'</option>').join('');
 const currentArt=doc.elements.find(e=>e.type==='illustration'&&e.visible!==false);
 const artOptions='<option value="">No illustration selected</option>'+Cuts.catalog.map(x=>'<option value="'+safe(x.id)+'" '+(currentArt?.assetId===x.id?'selected':'')+'>'+safe(x.species+' · '+x.name)+'</option>').join('');
 target.innerHTML='<div class="v9-panel"><h3>Package layout · v9</h3><p class="v9-note">Same print design for every category. All examples are drafts until verified.</p>'+
 '<div class="field"><label>Choose label type</label><select id="v9-type">'+selectOptions+'</select></div>'+
 '<section class="v9-art"><h4>Food illustration & white stipple halo</h4><p>Show only the actual food being packed. No bowls, pans or unrelated garnish.</p>'+
 '<div class="field"><label>Choose an existing illustration</label><select id="v9-art-pick">'+artOptions+'</select></div>'+
 '<div class="field"><label>Image separation</label><select id="v9-halo"><option value="stipple">White stippled halo</option><option value="off">No halo</option></select></div>'+ 
 '<div class="v9-actions"><button type="button" class="btn btn-outline" id="v9-upload-button">Import black/white food image</button><button type="button" class="btn btn-light" id="v9-remove-art">No art</button></div>'+
 '<input type="file" id="v9-art-file" accept="image/png,image/webp,image/jpeg" hidden/><div class="v9-art-note">'+safe(currentArt?.assetId||'No food artwork selected')+'</div></section>'+
 groups.map(([title,fields])=>'<section class="v9-fields"><h4>'+title+'</h4>'+fields.map(field).join('')+'</section>').join('')+
 '<section class="v9-review"><label><input type="checkbox" data-v9review="pkg.allergensReviewed" '+(v('allergensReviewed')==='1'?'checked':'')+'/> Ingredients and allergens verified</label>'+
 '<label><input type="checkbox" data-v9review="pkg.artworkReviewed" '+(v('artworkReviewed')==='1'?'checked':'')+'/> Artwork matches actual packed contents</label>'+
 '<label><input type="checkbox" data-v9review="pkg.reviewed" '+(v('reviewed')==='1'?'checked':'')+'/> Dates, quantity, handling and identity verified</label></section>'+
 '<div id="v9-checks" class="v9-checks"></div><p class="v9-note">QR contains the package ID only. Sample data is not a source for allergens, safe storage life or validated cooking instructions.</p></div>';
 function updateChecks(){const issues=verify(doc,true);target.querySelector('#v9-checks').innerHTML='<b>Print checks · '+issues.length+' remaining</b>'+(issues.length?'<ul>'+issues.slice(0,9).map(x=>'<li>'+safe(x)+'</li>').join('')+'</ul>':'<p>Data checks passed; physical stock and food-safety validation are still required.</p>');}
 target.querySelector('#v9-type').onchange=e=>setActive(e.target.value);
 for(const t of target.querySelectorAll('[data-v9key]')){t.addEventListener('focus',checkpoint,{once:true});
  t.oninput=()=>{P.change(doc,t.dataset.v9key,t.value);for(const cb of target.querySelectorAll('[data-v9review]'))cb.checked=doc.data[cb.dataset.v9review]==='1';saveLocal();drawArtwork();updateChecks();};
 }
 for(const t of target.querySelectorAll('[data-v9review]'))t.onchange=()=>{checkpoint();doc.data[t.dataset.v9review]=t.checked?'1':'0';reviewFlag(doc);saveLocal();drawArtwork();updateChecks();};
 target.querySelector('#v9-halo').value=currentArt?.haloMode==='off'?'off':'stipple';
 target.querySelector('#v9-halo').onchange=e=>{checkpoint();const art=doc.elements.find(x=>x.type==='illustration');if(art){art.haloMode=e.target.value;doc.data['pkg.artworkReviewed']='0';reviewFlag(doc);saveLocal();drawArtwork();updateChecks();}};
 target.querySelector('#v9-art-pick').onchange=e=>{checkpoint();try{setArt(doc,e.target.value);doc.data['pkg.artworkReviewed']='0';reviewFlag(doc);saveLocal();refresh();}catch(err){alert(err.message);}};
 target.querySelector('#v9-upload-button').onclick=()=>target.querySelector('#v9-art-file').click();
 target.querySelector('#v9-art-file').onchange=async e=>{const f=e.target.files?.[0];if(!f)return;checkpoint();try{const id=await ingest(f,doc);setArt(doc,id);doc.data['pkg.artworkReviewed']='0';reviewFlag(doc);saveLocal();refresh();}catch(err){alert('Artwork import: '+err.message);}};
 target.querySelector('#v9-remove-art').onclick=()=>{checkpoint();setArt(doc,null);doc.data['pkg.artworkReviewed']='0';reviewFlag(doc);saveLocal();refresh();};
 updateChecks();
}
P.panel=opts=>isV9(opts.doc)?renderPanel(opts):prevPanel(opts);
window.LabelDesignV9={version:9,defaults,isV9,verify,create,setArt,ingest,makeOrnament,opts:examples};
})();