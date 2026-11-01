/* Nerdeus Meals — label templates v6. Stock templates use separated art and true content panels. */
(function(){
'use strict';
const C=window.LabelCore;
if(!C||!window.LabelBackgrounds)throw Error('Nerdeus label core not initialized');
const original=C.initialTemplates();
const originalById=new Map(original.map(t=>[t.id,t]));
const APP='NERDEUS / ';
function tx(name,s,x,y,w,h,size,color='black',extra={}){return C.el('text',name,x,y,w,h,{text:s,color,fontSize:size,fontFamily:'Arial',bold:true,align:'left',lineHeight:1.12,...extra});}
function box(name,x,y,w,h,fill='white',extra={}){return C.el('rect',name,x,y,w,h,{fill,stroke:'none',...extra});}
function rule(name,x,y,w,color='black',strokeWidth=2){return C.el('line',name,x,y,w,1,{color,strokeWidth});}
function iconCalendar(name,x,y,col){
return [box(name+' outline',x,y,24,24,'none',{stroke:col,strokeWidth:2,radius:2}),
 rule(name+' top',x+2,y+7,20,col,2),
 rule(name+' ring left',x+6,y-2,1,col,3),
 rule(name+' ring right',x+17,y-2,1,col,3)];
}
const dataSpecs=[
{id:'meal-label',name:'Prepared meal',kind:'meal',tag:'PREPARED MEAL',prefix:'meal',food:'Baked Lasagna',quantity:'2 servings',storage:'REFRIGERATED',packed:'OCT 31, 2026',useBy:'NOV 04, 2026',cook:'Reheat to 165°F / 74°C',thaw:'',allergens:'WHEAT · MILK',batch:'26073112',bg:3,fields:{quantity:'portions',packed:'prepared',cook:'instructions',batch:'id'}},
{id:'raw-protein',name:'Raw protein',kind:'raw',tag:'RAW PROTEIN',prefix:'raw',food:'Boneless Chicken Breast',quantity:'650 g / 22.9 oz',quantityLabel:'NET WEIGHT',storage:'REFRIGERATED',packed:'OCT 31, 2026',useBy:'SET DATE',cook:'Cook to 165°F / 74°C',thaw:'Thaw in refrigerator',allergens:'',batch:'RAW-0001',bg:23},
{id:'seasoned-protein',name:'Dry-seasoned protein',kind:'seasoned',tag:'SEASONED / RAW',prefix:'season',food:'Garlic Herb Chicken',quantity:'680 g / 24 oz',quantityLabel:'NET WEIGHT',storage:'REFRIGERATED',packed:'OCT 31, 2026',useBy:'SET DATE',cook:'Cook to 165°F / 74°C',thaw:'Thaw under refrigeration',allergens:'MILK',batch:'DRY-0002',bg:13},
{id:'marinated-protein',name:'Marinated protein',kind:'marinated',tag:'MARINATED / RAW',prefix:'marinade',food:'Citrus Pork Chops',quantity:'900 g / 31.7 oz',quantityLabel:'NET WEIGHT',storage:'REFRIGERATED',packed:'OCT 31, 2026',useBy:'SET DATE',cook:'Cook per safe-cut guidance',thaw:'Refrigerate to thaw completely',allergens:'SOY',batch:'MAR-0003',bg:92},
{id:'raw-meal-kit',name:'Raw meal kit',kind:'raw-kit',tag:'RAW MEAL KIT',prefix:'kit',food:'Fajita Skillet Kit',quantity:'4 portions',storage:'REFRIGERATED',packed:'OCT 31, 2026',useBy:'SET DATE',cook:'Fully cook all raw ingredients',thaw:'',allergens:'WHEAT',batch:'KIT-0004',bg:26},
{id:'freezer-label',name:'Freezer packaging',kind:'freezer',tag:'FREEZER / MEAL KIT',prefix:'freezer',food:'Chicken Alfredo',quantity:'4 × 1 cup',storage:'FROZEN',packed:'OCT 31, 2026',useBy:'SET DATE',dateLabel:'BEST QUALITY BY',cook:'Reheat to 165°F / 74°C',thaw:'Thaw in refrigerator',allergens:'WHEAT · MILK',batch:'FRO-0005',bg:76,
fields:{name:'item',quantity:'portions',packed:'packed',useBy:'bestBy',cook:'method',batch:'id'}},
{id:'side-component',name:'Side / component',kind:'side',tag:'SIDE / COMPONENT',prefix:'side',food:'Roasted Garlic Potatoes',quantity:'4 portions',storage:'REFRIGERATED',packed:'OCT 31, 2026',useBy:'SET DATE',cook:'Reheat until hot throughout',thaw:'',allergens:'',batch:'SID-0006',bg:5},
{id:'leftovers',name:'Leftovers',kind:'leftovers',tag:'LEFTOVERS',prefix:'leftovers',food:'Sunday Pot Roast',quantity:'2 portions',storage:'REFRIGERATED',packed:'OCT 31, 2026',useBy:'SET DATE',cook:'Reheat to 165°F / 74°C',thaw:'',allergens:'',batch:'LFT-0007',bg:1},
{id:'prepared-ingredient',name:'Prepared ingredient',kind:'ingredient',tag:'PREPARED INGREDIENT',prefix:'ingredient',food:'Diced Yellow Onion',quantity:'450 g / 15.9 oz',quantityLabel:'NET WEIGHT',storage:'REFRIGERATED',packed:'OCT 31, 2026',useBy:'SET DATE',cook:'Use in a prepared recipe',thaw:'',allergens:'',batch:'ING-0008',bg:24},
{id:'soup-stew',name:'Soup / stew',kind:'soup',tag:'SOUP / STEW',prefix:'soup',food:'Hearty Beef Stew',quantity:'2 × 400 g',storage:'FROZEN',packed:'OCT 31, 2026',useBy:'SET DATE',cook:'Reheat to 165°F / 74°C',thaw:'Thaw in refrigerator',allergens:'CELERY',batch:'SUP-0009',bg:72},
{id:'dry-mix',name:'Dry bread / meal mix',kind:'dry-mix',tag:'DRY MIX',prefix:'mix',food:'Herbed Cheddar Bread Mix',quantity:'1 dry packet',storage:'COOL & DRY',packed:'OCT 31, 2026',useBy:'SET DATE',dateLabel:'BEST BY',cook:'Add water + oil per recipe',thaw:'',allergens:'WHEAT · MILK',batch:'MIX-0010',bg:36},
{id:'pantry-label',name:'Pantry storage',kind:'pantry',tag:'PANTRY / INGREDIENT',prefix:'pantry',food:'Smoked Paprika',quantity:'340 g / 12 oz',quantityLabel:'QUANTITY',storage:'SPICE WALL / A–C',packed:'OCT 31, 2026',useBy:'SET DATE',dateLabel:'BEST BEFORE',cook:'Keep sealed; store cool and dry',thaw:'',allergens:'',batch:'PAN-0011',
fields:{name:'item',quantity:'quantity',storage:'location',packed:'opened',useBy:'bestBy',batch:'id'},bg:55},
{id:'advanced-prep',name:'Advanced meal prep',kind:'advanced',tag:'BATCH / MEAL PREP',prefix:'prep',food:'Beef Stew',quantity:'425 g / 15 oz',quantityLabel:'NET WEIGHT',storage:'CHILLED',packed:'OCT 31, 2026',useBy:'SET DATE',cook:'Reheat to 165°F / 74°C',thaw:'',allergens:'CELERY',batch:'BATCH-0012',
fields:{name:'name',quantity:'netWeight',packed:'prepared',batch:'batch'},bg:71}
];
function makeTemplate(def){
const p=def.prefix,m=def.fields||{},key=(name)=>p+'.'+(m[name]||name);
const info={};
for(const [k,v] of Object.entries({name:def.food,quantity:def.quantity,storage:def.storage,packed:def.packed,useBy:def.useBy,cook:def.cook,thaw:def.thaw,allergens:def.allergens,batch:def.batch}))info[key(k)]=v;
const art=window.LabelBackgrounds.catalog.find(b=>b.id==='BG-'+String(def.bg).padStart(3,'0'))||window.LabelBackgrounds.catalog[0];
const el=[
box('Top brand stripe',0,0,591,10,'red'),
tx('Section label',APP+def.tag,33,29,524,27,17,'red'),
tx('Food name','{{'+key('name')+'}}',33,69,520,99,47,'black',{autoFit:true,maxLines:2}),
C.el('background','Food illustration · '+art.name,32,168,527,205,{assetId:art.id,region:'custom',fit:'fill',panX:50,panY:50,zoom:100,locked:true}),
rule('Art lower rule',32,381,527,'red',2),
tx('Portion caption',def.quantityLabel||'PORTIONS',33,394,247,22,15),
tx('Storage caption','STORAGE',309,394,248,22,15),
tx('Portion amount','{{'+key('quantity')+'}}',33,420,251,42,25,'black',{autoFit:true,maxLines:1}),
tx('Storage condition','{{'+key('storage')+'}}',309,420,248,42,24,'red',{autoFit:true,maxLines:1}),
rule('Information divider',33,467,524,'black',2),
...iconCalendar('Pack date icon',35,486,'black'),
...iconCalendar('Use by date icon',309,486,'red'),
tx('Prepared caption',def.id==='pantry-label'?'OPENED':'PACKED',67,488,224,23,14),
tx('Use by caption',def.dateLabel||'USE BY',341,488,211,23,14,'red',{autoFit:true,maxLines:1}),
tx('Prepared date','{{'+key('packed')+'}}',34,518,247,34,24,'black',{autoFit:true,maxLines:1}),
tx('Use by date','{{'+key('useBy')+'}}',308,518,250,34,24,'red',{autoFit:true,maxLines:1}),
rule('Directions divider',33,559,524,'black',2),
tx('Cooking caption',def.id==='dry-mix'?'MIX / BAKE':'COOK / REHEAT',33,571,524,20,14,'red'),
tx('Cooking method','{{'+key('cook')+'}}',33,595,522,30,23,'black',{autoFit:true,maxLines:1}),
tx('Thaw note','{{'+key('thaw')+'}}',33,627,523,23,17,'black',{showWhen:key('thaw'),autoFit:true,maxLines:1}),
tx('Allergens caption','ALLERGENS',33,653,520,17,14,'red',{showWhen:key('allergens')}),
tx('Allergens red bullets','{{'+key('allergens')+'}}',33,673,522,22,18,'red',{showWhen:key('allergens'),format:'allergenBullets',autoFit:true,maxLines:1}),
box('Black information footer',0,698,591,129,'black'),
tx('Footer identifier title','LABEL / BATCH ID',34,722,390,21,14,'white'),
tx('Footer identifier','{{'+key('batch')+'}}',34,748,395,30,25,'white',{autoFit:true,maxLines:1}),
tx('Footer details','SCAN FOR DETAILS',34,784,300,17,12,'white'),
C.el('qr','Package QR code',448,695,105,102,{text:'{{'+key('batch')+'}}',color:'black'})
];
const old=originalById.get(def.id);
return {schema:C.SCHEMA,id:def.id,name:def.name,kind:def.kind,description:def.tag+' · reusable print template · sample fields, validate before use',profile:C.clone(old?old.profile:original[0].profile),data:info,elements:el,assets:{},nlsDesignVersion:6};
}
const modern=dataSpecs.map(makeTemplate);
const modernById=new Map(modern.map(t=>[t.id,t]));
const isModern=t=>t&&t.nlsDesignVersion===6&&t.elements?.some(e=>e.name==='Black information footer');
function isUntouchedLegacy(t){const base=originalById.get(t.id);if(!base)return false;
const a=t.elements.filter(x=>x.type!=='background');
if(a.length!==base.elements.length)return false;
return a.every((e,i)=>{const o=base.elements[i];
 const sameStyle=['color','fontSize','bold','align','fontFamily','fill','stroke','strokeWidth','radius','locked','visible'].every(k=>o[k]===undefined||e[k]===o[k]);
 return sameStyle&&e.type===o.type&&e.name===o.name&&(e.text||'')===(o.text||'')&&Math.abs((e.x||0)-(o.x||0))<=1&&Math.abs((e.y||0)-(o.y||0))<=1&&Math.abs((e.w||0)-(o.w||0))<=1&&Math.abs((e.h||0)-(o.h||0))<=1;});
}
function migrate(t){
if(isModern(t)||!modernById.has(t.id)||!isUntouchedLegacy(t))return t;
const doc=C.clone(modernById.get(t.id));doc.data={...doc.data,...t.data};doc.name=t.name;doc.assets={...t.assets};
const prior=t.elements.find(e=>e.type==='background');const next=doc.elements.find(e=>e.type==='background');
if(prior&&next){next.assetId=prior.assetId;next.name='Food illustration · '+window.LabelBackgrounds.displayName(t,prior.assetId);}
return doc;
}
C.initialTemplates=()=>modern.concat(original.filter(t=>!modernById.has(t.id)));
window.NerdeusLabelV6={version:6,modernById,originalById,isModern,isUntouchedLegacy,migrate,count:modern.length};
})();