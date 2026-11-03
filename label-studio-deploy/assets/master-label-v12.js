/* Nerdeus Meals · Label Master v9.1
   One 591×827 three-colour physical design, 17 canonical types in six families.
   Additive to v8; never modifies legacy templates, imported art or archival snapshots.
   Artwork is optional for draft proofs; verified art or explicit text-only approval required to print.
*/
(function(){
'use strict';
const C=window.LabelCore, Cuts=window.LabelCuts, P8=window.LabelPackages;
if(!C||!Cuts||!P8)throw Error('Nerdeus v9 requires the v8 label core, cut registry and package module.');
const prevInitial=C.initialTemplates,oldIsPackage=P8.isPackage,oldPanel=P8.panel,oldValidate=P8.validate;
const families=[
 {id:'raw_proteins',name:'Raw proteins'},
 {id:'ingredients',name:'Whole & prepped ingredients'},
 {id:'meal_kits',name:'Meal kits'},
 {id:'cooked_food',name:'Cooked meals & components'},
 {id:'wet_food',name:'Soups, sauces & concentrates'},
 {id:'dry_opened',name:'Dry goods, pantry & opened'}
];
// id, family, title in picker, sample title, state, action, storage, icon, contents, quantity metric & imperial.
const records=[
 ['raw_plain','raw_proteins','Plain raw protein','Ribeye Steak','RAW','COOK','FROZEN','protein','','450 g','15.9 oz','beef_ribeye'],
 ['raw_seasoned','raw_proteins','Dry-seasoned raw protein','Garlic Herb Chicken','RAW','COOK','FROZEN','protein','Garlic · herbs · sea salt','500 g','17.6 oz','chicken_breast_boneless_skinless'],
 ['raw_marinated','raw_proteins','Marinated raw protein','Teriyaki Pork Chops','RAW','COOK','FROZEN','protein','Soy · ginger · garlic','550 g','19.4 oz','pork_chops_bone_in'],
 ['ingredient_single','ingredients','Whole / single ingredient','Whole Yellow Onion','RAW','USE','FROZEN','vegetable','','450 g','15.9 oz',''],
 ['ingredient_prepped','ingredients','Prepped single ingredient','Diced Yellow Onion','RAW','USE','FROZEN','vegetable','','250 g','8.8 oz',''],
 ['ingredient_combo','ingredients','Ingredient combination','Onion & Pepper Mix','RAW','USE','FROZEN','vegetable','Onion · red pepper · green pepper','450 g','15.9 oz',''],
 ['raw_meal_kit','meal_kits','Raw meal kit','Chicken Fajita Kit','RAW','COOK','FROZEN','kit','Chicken · peppers · onion','800 g','28.2 oz',''],
 ['cooked_meal','cooked_food','Complete cooked meal','Beef Lasagna','COOKED','REHEAT','FROZEN','meal','Beef · pasta · tomato · cheese','700 g','24.7 oz',''],
 ['cooked_side','cooked_food','Cooked side','Mashed Potatoes','COOKED','REHEAT','FROZEN','side','Potatoes · butter · milk','400 g','14.1 oz',''],
 ['cooked_component','cooked_food','Cooked component','Sautéed Onions','COOKED','USE','REFRIGERATED','vegetable','','400 g','14.1 oz',''],
 ['leftovers','cooked_food','Leftovers','Sunday Pot Roast','COOKED','REHEAT','REFRIGERATED','meal','','450 g','15.9 oz',''],
 ['soup_stew','wet_food','Soup / stew','Beef Stew','COOKED','REHEAT','FROZEN','soup','','500 g','17.6 oz',''],
 ['sauce_stock_concentrate','wet_food','Sauce / stock concentrate','Chicken Stock Concentrate','COOKED','USE','FROZEN','soup','','250 mL','8.5 US fl oz',''],
 ['dry_baking_mix','dry_opened','Dry baking / meal mix','White Bread Mix','DRY','MIX','COOL & DRY','grain','Flour · yeast · dairy powder','500 g','17.6 oz',''],
 ['seasoning_dry_base','dry_opened','Seasoning / dry meal base','Taco Seasoning','DRY','USE','COOL & DRY','grain','Chili · cumin · garlic · salt','60 g','2.1 oz',''],
 ['pantry_ingredient','dry_opened','Pantry ingredient','Smoked Paprika','DRY','STORE','COOL & DRY','grain','','200 g','7.1 oz',''],
 ['opened_ready_to_eat','dry_opened','Opened / ready-to-eat','Opened Sliced Cheese','OPENED','SERVE','REFRIGERATED','side','','200 g','7.1 oz','']
];
const defs=records.map(([id,familyId,label,food,state,action,storage,icon,contents,metric,imperial,assetId])=>({id,familyId,label,food,state,action,storage,icon,contents,metric,imperial,assetId}));
const byId=new Map(defs.map(a=>[a.id,a]));
const profile={artWidth:591,artHeight:827,printerWidth:576,printerHeight:827,cropLeft:7,cropRight:8,stock:'50 × 70 mm',dpi:300,safeInset:30,rotation:'none'};
const l=(type,name,x,y,w,h,opts={})=>C.el(type,name,x,y,w,h,opts);
const txt=(name,text,x,y,w,h,size,color='black',other={})=>l('text',name,x,y,w,h,{text,fontSize:size,fontFamily:'Impact',bold:true,align:'left',lineHeight:1.07,color,autoFit:true,maxLines:2,...other});
const rect=(name,x,y,w,h,color,extra={})=>l('rect',name,x,y,w,h,{fill:color,stroke:'none',...extra});
const rule=(name,y,color='red')=>rect(name,25,y,541,2,color);
const fmtDate=v=>{if(!/^\d{4}-\d{2}-\d{2}$/.test(String(v||'')))return '';let d=new Date(v+'T12:00:00Z');return Number.isNaN(d.getTime())?'':d.toLocaleDateString('en-US',{timeZone:'UTC',month:'short',day:'2-digit',year:'numeric'}).toUpperCase();};
const dateTypes=['purchased','prepared','seasoned','assembled','marinated','packed','cooked','frozen','blended','opened','use_by','best_quality_by'];
const dateNames={purchased:'PURCHASED',prepared:'PREPPED',seasoned:'SEASONED',assembled:'ASSEMBLED',marinated:'MARINATED',packed:'PACKED',cooked:'COOKED',frozen:'FROZEN',blended:'BLENDED',opened:'OPENED',use_by:'USE BY',best_quality_by:'BEST QUALITY'};
function splitTokens(s){return String(s||'').toUpperCase().split(/[\s·,;\/|+-]+/).map(t=>t.trim()).filter(Boolean);}
function status(d){
 const titleTokens=new Set(splitTokens(d['pkg.food']));
 const state=String(d['pkg.state']||'').toUpperCase(),storage=String(d['pkg.storage']||'').toUpperCase();
 const attrs=String(d['pkg.attributes']||'').split(/[·,;|]+/).map(a=>a.trim().toUpperCase()).filter(Boolean);
 const values=[state,...attrs,storage].filter(t=>!titleTokens.has(t));
 return [...new Set(values)].slice(0,3).join(' · ');
}
function descriptor(d){
 const title=new Set(splitTokens(d['pkg.food']));let tokens=String(d['pkg.contents']||'').split(/[·,;|]+/).map(x=>x.trim()).filter(Boolean);
 // Omit exact repeats, but do not strip distinct ingredients (e.g. red vs green pepper).
 tokens=tokens.filter(x=>!title.has(x.toUpperCase())&&x.toUpperCase()!==String(d['pkg.food']||'').toUpperCase());
 return tokens.join(' · ');
}
function eventCount(d){return [1,2,3,4].filter(n=>d['pkg.date'+n+'Type']&&d['pkg.date'+n]).length;}
function isMaster(doc){return !!doc&&doc.nlsDesignVersion===9&&!!byId.get(doc.data?.['pkg.type']);}

/* Heritage v12: optional, data-bound engraving layout on the same 17 canonical types.
   Existing browser-saved master docs remain classic unless explicitly restyled.
   The new defaults remain editable: every label field is still its {{pkg.*}} binding. */
const heritageTypes={
 raw_plain:['RAW','PLAIN • UNSEASONED'],raw_seasoned:['RAW','DRY-SEASONED • UNCOOKED'],
 raw_marinated:['RAW','MARINATED • UNCOOKED'],ingredient_single:['INGREDIENT','WHOLE • UNCOOKED'],
 ingredient_prepped:['PREPPED','DICED • UNCOOKED'],ingredient_combo:['PREPPED MIX','ONIONS • PEPPERS'],
 raw_meal_kit:['RAW MEAL KIT','READY TO COOK'],cooked_meal:['COOKED MEAL','COMPLETE • PORTIONED'],
 cooked_side:['COOKED SIDE','READY TO REHEAT'],cooked_component:['COOKED COMPONENT','READY TO USE'],
 leftovers:['LEFTOVERS','COOKED • REPACKED'],soup_stew:['SOUP / STEW','COOKED • PORTIONED'],
 sauce_stock_concentrate:['CONCENTRATE','SAUCE / STOCK'],dry_baking_mix:['DRY BREAD MIX','YEAST / MIX INCLUDED'],
 seasoning_dry_base:['DRY SEASONING','PACKET / MEAL BASE'],pantry_ingredient:['PANTRY INGREDIENT','DRY • SEALED'],
 opened_ready_to_eat:['OPENED PRODUCT','READY TO EAT']
};
function setH(doc,name,values){let e=doc.elements.find(e=>e.name===name);if(e)Object.assign(e,values);return e;}
function addHeritageArtwork(doc){
 const id=doc.data?.['pkg.type'];const uri=window.NerdeusHeritageArtworkV12?.byType?.[id];
 if(!uri||doc.elements.some(e=>e.name==='Hero food illustration'))return;
 const assetId='heritage-proof-'+id;
 doc.assets=doc.assets||{};
 doc.assets[assetId]={id:assetId,name:'Heritage '+id+' food-only proof (requires review)',width:540,height:215,origin:'heritage-v12-food-candidate',dataUri:uri};
 const idx=doc.elements.findIndex(e=>e.name==='Unapproved artwork placeholder');
 doc.elements.splice(idx<0?7:idx,0,l('illustration','Hero food illustration',44,164,503,214,{assetId,haloPreset:'medium'}));
 doc.data['pkg.artworkPlaceholder']='';doc.data['pkg.artStatus']='candidate';doc.data['pkg.artworkReviewed']='0';
}
function applyHeritage(doc){
 const d=doc.data,def=byId.get(d['pkg.type']);if(!def)return;
 const base=heritageTypes[def.id]||['STORED FOOD','PREPARED'];
 const food=String(d['pkg.food']||'').toUpperCase();
 const animal=(food.match(/\b(BEEF|CHICKEN|PORK|TURKEY|VENISON|LAMB|FISH|SALMON|BISON|ELK|MOOSE)\b/)||[])[1]||(/RIBEYE|BRISKET|SIRLOIN|PORTERHOUSE/.test(food)?'BEEF':'');
 const header=base[0]==='RAW'?(animal?'RAW '+animal:'RAW PROTEIN'):base[0];
 const attrib=String(d['pkg.attributes']||'').trim().toUpperCase();
 let sub=base[1];
 if(def.id==='raw_plain'&&attrib){
   const cut=food.replace(/^(BEEF|CHICKEN|PORK|TURKEY|VENISON|LAMB|FISH|SALMON)\s+/,'').replace(/\b(STEAK|CHOPS?|BREAST|ROAST|FILLETS?)\b.*$/,'').trim();
   sub=attrib+(cut&&cut.length<=18?' • '+cut:'');
 }
 if(def.id==='ingredient_combo'&&d['pkg.contents'])sub=String(d['pkg.contents']).toUpperCase().split(/[;,·]/).map(x=>x.trim()).filter(Boolean).slice(0,2).join(' • ').slice(0,39);
 d['pkg.heritageHeader']=header+'\n'+sub;
 d['pkg.heritageState']=String(d['pkg.storage']||'').toUpperCase()+' • '+String(d['pkg.packaging']||'').toUpperCase();
 const set=(name,geometry)=>setH(doc,name,geometry);
 set('Red product header',{x:0,y:0,w:591,h:124,fill:'red'});
 set('White category icon',{x:27,y:22,w:81,h:81});
 set('Main product title',{text:'{{pkg.heritageHeader}}',x:108,y:19,w:453,h:91,fontSize:31,fontFamily:'Impact',bold:true,autoFit:true,maxLines:2,align:'center',lineHeight:1.19,color:'white'});
 set('Draft indicator',{x:438,y:109,w:123,h:13,fontSize:10,maxLines:1,align:'right'});
 set('Black condition strip',{x:0,y:124,w:591,h:33,fill:'black'});
 set('Nonredundant state attributes',{text:'{{pkg.heritageState}}',x:28,y:129,w:535,h:23,fontSize:17,align:'center',maxLines:1});
 set('Artwork edge botanicals',{x:0,y:157,w:591,h:222,locked:true});
 set('Central white dither knockout',{x:0,y:157,w:591,h:222,locked:true});
 set('Hero food illustration',{x:44,y:163,w:503,h:213,haloPreset:d['pkg.halo']||'medium'});
 set('Unapproved artwork placeholder',{x:45,y:254,w:501,h:32,fontSize:16,align:'center'});
 let foodName=doc.elements.find(x=>x.name==='Heritage actual food name');
 if(!foodName){
  foodName=txt('Heritage actual food name','{{pkg.food}}',31,382,529,41,32,'black',{align:'center',maxLines:1,autoFit:true});
  const idx=doc.elements.findIndex(x=>x.name==='Extra contents descriptor');doc.elements.splice(idx<0?11:idx,0,foodName);
 }
 set('Heritage actual food name',{x:31,y:381,w:529,h:43,fontSize:32,align:'center',autoFit:true,maxLines:1});
 set('Extra contents descriptor',{x:33,y:418,w:525,h:22,fontSize:17,align:'center',maxLines:1,autoFit:true,showWhen:'pkg.displayContents'});
 set('Contents bottom divider',{x:25,y:444,w:541,h:2,fill:'red'});
 set('Metric quantity',{x:32,y:454,w:245,h:39,fontSize:34,align:'center',maxLines:1});
 set('Quantity separator',{x:294,y:453,w:3,h:44,fill:'red'});
 set('Imperial quantity',{x:314,y:454,w:245,h:39,fontSize:34,align:'center',maxLines:1});
 set('Packaging material',{x:33,y:500,w:524,h:20,fontSize:17,align:'center',maxLines:1});
 set('Quantity divider',{x:25,y:526,w:541,h:2,fill:'red'});
 set('Recorded allergen bullets',{x:32,y:534,w:528,h:24,fontSize:17,align:'center',showWhen:'pkg.allergens',maxLines:1,format:'allergenBullets'});
 set('QR: package ID',{x:35,y:562,w:148,h:148,color:'black',text:'{{pkg.id}}'});
 set('ID below QR',{x:33,y:712,w:152,h:20,fontSize:15,align:'center',maxLines:1});
 for(let n=1;n<=4;n++){
  const y=562+(n-1)*38;
  set('Event '+n+' name',{x:211,y,w:143,h:25,fontSize:17,align:'left',maxLines:1});
  set('Event '+n+' date',{x:351,y,w:213,h:25,fontSize:19,align:'right',maxLines:1});
 }
 set('Black instruction footer',{x:0,y:739,w:591,h:88,fill:'black'});
 set('One validated instruction',{x:33,y:757,w:525,h:54,fontSize:26,align:'center',maxLines:2,autoFit:true});
}

function derived(doc){
 if(!isMaster(doc))return;
 const d=doc.data;
 d['pkg.status']=status(d);
 d['pkg.displayContents']=descriptor(d);
 for(let n=1;n<=4;n++){
   const type=d['pkg.date'+n+'Type']; const date=fmtDate(d['pkg.date'+n]);
   d['pkg.date'+n+'Label']=type&&date?(dateNames[type]||type.toUpperCase()):'';
   d['pkg.date'+n+'Display']=type&&date?date:'';
 }
 const hasContents=!!d['pkg.displayContents'];const allergens=!!String(d['pkg.allergens']||'').trim();
 const art=doc.elements.find(e=>e.name==='Hero food illustration');
 const deco=doc.elements.find(e=>e.name==='Artwork edge botanicals');
 const placeholder=doc.elements.find(e=>e.name==='Unapproved artwork placeholder');
 const contents=doc.elements.find(e=>e.name==='Extra contents descriptor');
 const outline=doc.elements.find(e=>e.name==='Contents bottom divider');
 if(art){art.y=hasContents?160:170;art.h=hasContents?209:228;art.haloPreset=d['pkg.halo']||'medium';}
 if(deco)deco.h=hasContents?222:252;
  const knockout=doc.elements.find(e=>e.name==='Central white dither knockout');if(knockout)knockout.h=hasContents?222:252;
 if(placeholder){placeholder.showWhen='pkg.artworkPlaceholder';placeholder.y=hasContents?247:252;}
 if(contents)contents.showWhen='pkg.displayContents';
 if(outline)outline.y=403;
 const qTop=allergens?511:477;
 const qr=doc.elements.find(e=>e.name==='QR: package ID');if(qr){qr.y=qTop+26;qr.h=144;qr.w=146;}
 const qrName=doc.elements.find(e=>e.name==='ID below QR');if(qrName)qrName.y=qTop+173;
 for(let n=1;n<=4;n++){
  const y=qTop+25+(n-1)*40;
  for(const [name,baseX] of [['Event '+n+' name',222],['Event '+n+' date',355]]){
    const e=doc.elements.find(x=>x.name===name);if(e)e.y=y;
  }
 }
 if(d['pkg.layoutStyle']==='heritage-v12')applyHeritage(doc);
 d['pkg.proof']=validate(doc).length?'DRAFT / REVIEW':'';
}
function initialEventTypes(def){
 const quality=def.storage==='FROZEN'?'best_quality_by':def.storage==='REFRIGERATED'?'use_by':'best_quality_by';
 switch(def.id){
 case 'raw_plain':return ['purchased','packed','frozen',quality];
 case 'raw_seasoned':return ['seasoned','packed','frozen',quality];
 case 'raw_marinated':return ['marinated','packed','frozen',quality];
 case 'ingredient_single':return ['purchased','packed','frozen',quality];
 case 'ingredient_prepped':case 'ingredient_combo':return ['prepared','packed','frozen',quality];
 case 'raw_meal_kit':return ['assembled','packed','frozen',quality];
 case 'cooked_meal':case 'cooked_side':case 'soup_stew':case 'sauce_stock_concentrate':return ['cooked','packed','frozen',quality];
 case 'cooked_component':case 'leftovers':return ['cooked','packed','use_by',''];
 case 'dry_baking_mix':case 'seasoning_dry_base':return ['blended','packed','best_quality_by',''];
 case 'pantry_ingredient':return ['purchased','packed','best_quality_by',''];
 case 'opened_ready_to_eat':return ['opened','use_by','',''];
 default:return ['packed',quality,'',''];
 }
}
function make(def){
 const d={
  'pkg.layoutStyle':'heritage-v12','pkg.type':def.id,'pkg.food':def.food,'pkg.state':def.state,'pkg.attributes':def.id==='raw_plain'?'Boneless':'',
  'pkg.storage':def.storage,'pkg.contents':def.contents,'pkg.displayContents':'','pkg.status':'',
  'pkg.metric':def.metric,'pkg.imperial':def.imperial,'pkg.portions':'','pkg.packaging':'VACUUM POUCH',
  'pkg.id':'DEMO-'+def.id.toUpperCase().replace(/_/g,'-'),'pkg.allergens':'',
  'pkg.action':def.action,'pkg.actionText':def.action==='MIX'?'ADD WATER + OIL PER RECIPE':def.action==='USE'?'USE PER RECIPE':def.action==='STORE'?'STORE AS DIRECTED':def.action==='SERVE'?'SERVE AS DIRECTED':def.action+' PER VERIFIED RECIPE',
  'pkg.actionVerified':'0','pkg.headerIcon':def.icon,'pkg.halo':'medium',
  'pkg.artStatus':def.assetId?'candidate':'missing','pkg.artworkReviewed':'0','pkg.textOnlyApproved':'0','pkg.artworkPlaceholder':def.assetId?'':'ARTWORK NOT SELECTED',
  'pkg.identityReviewed':'0','pkg.quantityReviewed':'0','pkg.storageReviewed':'0','pkg.datesReviewed':'0','pkg.allergensReviewed':'0',
  'pkg.proof':'DRAFT / REVIEW','pkg.recipeRef':'','pkg.location':'','pkg.batch':'',
  'pkg.date1Type':initialEventTypes(def)[0],'pkg.date1':'',
   'pkg.date2Type':initialEventTypes(def)[1],'pkg.date2':'',
   'pkg.date3Type':initialEventTypes(def)[2],'pkg.date3':'',
   'pkg.date4Type':initialEventTypes(def)[3],'pkg.date4':''
 };
 const e=[
  rect('White stock',0,0,591,827,'white'),
  rect('Red product header',0,0,591,120,'red'),
  l('motif','White category icon',26,15,95,95,{motif:'icon'}),
  txt('Main product title','{{pkg.food}}',143,30,418,80,44,'white',{maxLines:2}),
  txt('Draft indicator','{{pkg.proof}}',385,8,177,22,15,'white',{showWhen:'pkg.proof',maxLines:1,align:'right'}),
  rect('Black condition strip',0,120,591,32,'black'),
  txt('Nonredundant state attributes','{{pkg.status}}',26,125,539,25,21,'white',{align:'center',maxLines:1}),
  l('background','Artwork edge botanicals',0,152,591,222,{assetId:'BG-013',region:'custom',fit:'stretch',panX:50,panY:50,zoom:100,locked:true}),
   l('motif','Central white dither knockout',0,152,591,222,{motif:'white-knockout',locked:true}),
  txt('Unapproved artwork placeholder','{{pkg.artworkPlaceholder}}',70,247,450,37,17,'black',{align:'center',showWhen:'pkg.artworkPlaceholder',maxLines:1}),
  txt('Extra contents descriptor','{{pkg.displayContents}}',30,379,531,23,19,'black',{align:'center',showWhen:'pkg.displayContents',maxLines:1}),
  rule('Contents bottom divider',403,'red'),
  txt('Metric quantity','{{pkg.metric}}',30,417,247,37,35,'black',{align:'center',maxLines:1}),
  rect('Quantity separator',291,415,3,40,'red'),
  txt('Imperial quantity','{{pkg.imperial}}',311,417,249,37,35,'black',{align:'center',maxLines:1}),
  txt('Packaging material','{{pkg.packaging}}',31,454,530,21,18,'black',{align:'center',maxLines:1}),
  rule('Quantity divider',475,'red'),
  txt('Recorded allergen bullets','{{pkg.allergens}}',30,485,530,23,16,'red',{format:'allergenBullets',showWhen:'pkg.allergens',align:'center',maxLines:1}),
  l('qr','QR: package ID',34,537,146,144,{text:'{{pkg.id}}',color:'black'}),
  txt('ID below QR','{{pkg.id}}',32,684,150,24,16,'black',{align:'center',maxLines:1}),
  txt('Event 1 name','{{pkg.date1Label}}',222,536,129,28,18,'red',{maxLines:1,showWhen:'pkg.date1Label'}),
  txt('Event 1 date','{{pkg.date1Display}}',355,536,206,28,20,'black',{maxLines:1,align:'right',showWhen:'pkg.date1Display'}),
  txt('Event 2 name','{{pkg.date2Label}}',222,576,129,28,18,'red',{maxLines:1,showWhen:'pkg.date2Label'}),
  txt('Event 2 date','{{pkg.date2Display}}',355,576,206,28,20,'black',{maxLines:1,align:'right',showWhen:'pkg.date2Display'}),
  txt('Event 3 name','{{pkg.date3Label}}',222,616,129,28,18,'red',{maxLines:1,showWhen:'pkg.date3Label'}),
  txt('Event 3 date','{{pkg.date3Display}}',355,616,206,28,20,'black',{maxLines:1,align:'right',showWhen:'pkg.date3Display'}),
  txt('Event 4 name','{{pkg.date4Label}}',222,656,129,28,18,'red',{maxLines:1,showWhen:'pkg.date4Label'}),
  txt('Event 4 date','{{pkg.date4Display}}',355,656,206,28,20,'black',{maxLines:1,align:'right',showWhen:'pkg.date4Display'}),
  rect('Black instruction footer',0,722,591,105,'black'),
  txt('One validated instruction','{{pkg.actionText}}',29,748,533,53,29,'white',{align:'center',maxLines:2})
 ];
 if(def.assetId){e.splice(e.findIndex(x=>x.name==='Unapproved artwork placeholder'),0,l('illustration','Hero food illustration',57,160,478,209,{assetId:def.assetId,haloPreset:'medium'}));}
 const doc={schema:C.SCHEMA,id:'master-'+def.id,name:'Master · '+def.label,kind:'master',description:'v12 heritage engraved layout · '+def.familyId,profile:C.clone(profile),data:d,assets:{},elements:e,nlsDesignVersion:9};
 const proof=window.NerdeusHeritageArtworkV12?.byType?.[def.id];
 if(proof){const assetId='heritage-proof-'+def.id;doc.assets[assetId]={id:assetId,name:'Heritage food-only proof · '+def.id,width:540,height:215,origin:'heritage-v12-food-candidate',dataUri:proof};const hero=doc.elements.find(x=>x.name==='Hero food illustration');if(hero)hero.assetId=assetId;else addHeritageArtwork(doc);d['pkg.artStatus']='candidate';d['pkg.artworkReviewed']='0';d['pkg.artworkPlaceholder']='';}
 const backdrop=doc.elements.find(x=>x.name==='Artwork edge botanicals');if(backdrop){backdrop.assetId='BG-101';}
 derived(doc);return doc;
}
function isValidDate(v){if(!/^\d{4}-\d\d-\d\d$/.test(String(v||'')))return false;const d=new Date(v+'T12:00:00Z');return !Number.isNaN(d.getTime())&&d.toISOString().slice(0,10)===v;}
function validate(doc){
 if(!isMaster(doc))return [];
 const d=doc.data,issues=[],v=k=>String(d['pkg.'+k]||'').trim();
 const def=byId.get(v('type'));
 if(!v('food'))issues.push('Enter the exact product name.');
 if(!v('storage'))issues.push('Storage condition is required.');
 if(!v('packaging'))issues.push('Choose the actual packaging material.');
 const pair=P8.calculatePair(v('metric'),v('imperial'));
 if(pair)issues.push(pair);
 if(!/^[A-Z0-9][A-Z0-9-]{5,39}$/.test(v('id'))||/^(?:DEMO|SAMPLE|TEMP|TEST)[-_]/i.test(v('id')))issues.push('Replace the demo ID with the unique package ID (6–40 alphanumeric/hyphen characters).');
 if(['ingredient_combo','raw_meal_kit'].includes(v('type'))&&!v('contents'))issues.push('List the actual contents of this combination/kit.');
 const eventRows=[];
 for(let n=1;n<=4;n++){const typ=v('date'+n+'Type'),date=v('date'+n);if(!typ&&!date)continue;
  if(!typ||!isValidDate(date))issues.push('Event '+n+' needs a valid type and YYYY-MM-DD date.');
  else eventRows.push({kind:typ,date});
 }
 if(!eventRows.some(x=>['packed','prepared','assembled','marinated','seasoned','opened','blended'].includes(x.kind)))issues.push('Provide a recorded packing, preparation, assembly, seasoning, blending or opening event.');
 if(!eventRows.some(x=>['use_by','best_quality_by'].includes(x.kind)))issues.push('Provide a reviewed use-by or best-quality date.');
 const pack=eventRows.find(x=>['packed','prepared','assembled','marinated','seasoned','opened','blended'].includes(x.kind));
 const end=eventRows.find(x=>['use_by','best_quality_by'].includes(x.kind));
 if(pack&&end&&end.date<pack.date)issues.push('End date precedes packed/prepared date.');
 if(new Set(eventRows.map(x=>x.kind)).size!==eventRows.length)issues.push('Repeated date-event types: use distinct events.');
 if(/\b(?:NONE|NO ALLERGENS|UNKNOWN)\b/i.test(v('allergens')))issues.push('Leave confirmed allergens blank; do not assert allergen-free.');
 if(!v('actionText')||v('actionText').length>90)issues.push('Enter a concise handling instruction, 1–90 characters.');
 if(v('layoutStyle')==='heritage-v12'&&v('actionText').length>62)issues.push('Heritage footer needs 62 characters or fewer for print legibility.');
 if(v('actionVerified')!=='1')issues.push('Confirm the handling/cook/reheat instructions against source data.');
 const visibleHero=doc.elements.find(e=>e.name==='Hero food illustration'&&e.visible!==false);
 if(visibleHero){const mismatch=artworkSpeciesMismatch(doc,visibleHero);if(mismatch)issues.push(mismatch);
   if(v('artStatus')!=='approved'||v('artworkReviewed')!=='1')issues.push('Confirm the selected artwork is approved and matches the packaged contents.');
  if(!Cuts.source(doc,visibleHero.assetId))issues.push('Selected food artwork asset is unavailable.');
 }else if(v('textOnlyApproved')!=='1')issues.push('Select reviewed artwork, or approve the truthful text-only fallback.');
 for(const n of ['identityReviewed','quantityReviewed','storageReviewed','datesReviewed','allergensReviewed'])if(v(n)!=='1')issues.push('Review '+n.replace('Reviewed','').toLowerCase()+' information.');
 if(!doc.elements.some(x=>x.type==='qr'&&x.text==='{{pkg.id}}'))issues.push('The QR must encode only pkg.id.');
 const title=doc.elements.find(x=>x.name==='Main product title');
 if(!title||title.w<350||title.h<66)issues.push('Product title requires the two-line master header.');
 return issues;
}
function update(doc,key,value){
 if(!isMaster(doc))return;
 const d=doc.data;d[key]=String(value??'').slice(0,250);
 const checkKey=['pkg.identityReviewed','pkg.quantityReviewed','pkg.storageReviewed','pkg.datesReviewed','pkg.allergensReviewed','pkg.artworkReviewed','pkg.textOnlyApproved','pkg.actionVerified'];
 if(!checkKey.includes(key)){
  for(const k of ['pkg.identityReviewed','pkg.quantityReviewed','pkg.storageReviewed','pkg.datesReviewed','pkg.allergensReviewed','pkg.actionVerified'])d[k]='0';
  d['pkg.artworkReviewed']='0';
 }
 if(key==='pkg.halo'){
  const art=doc.elements.find(e=>e.name==='Hero food illustration');if(art)art.haloPreset=value;
 }
 derived(doc);
}
function assignArt(doc,id){
 if(!isMaster(doc))return;
 const d=doc.data;
 let layer=doc.elements.find(x=>x.name==='Hero food illustration');
 if(!id){if(layer)doc.elements=doc.elements.filter(x=>x!==layer);d['pkg.artworkPlaceholder']='ARTWORK NOT SELECTED';d['pkg.artStatus']='missing';}
 else{
  if(!Cuts.source(doc,id))throw Error('Selected artwork is missing.');
  if(!layer){layer=l('illustration','Hero food illustration',57,160,478,209,{assetId:id,haloPreset:d['pkg.halo']||'medium'});
    doc.elements.splice(doc.elements.findIndex(x=>x.name==='Unapproved artwork placeholder'),0,layer);
  }else layer.assetId=id;
  d['pkg.artworkPlaceholder']='';d['pkg.artStatus']='candidate';
 }
 d['pkg.artworkReviewed']='0';d['pkg.textOnlyApproved']='0';derived(doc);
}
// Pixel-perfect, bitonal halo behind the actual black/white transparent food image.
const oldCutDraw=Cuts.draw,oldCutSvg=Cuts.svgImage;
const rasterCache=new Map();
const sizes={none:[0,0],light:[4,12],medium:[6,17],strong:[8,22]};
function hashPixel(x,y){let z=(x*73856093)^(y*19349663)^0x52fd497;z=Math.imul(z^(z>>>13),1274126177);return (z>>>0)/4294967295;}
function compHero(e,doc){
 const W=Math.max(1,Math.round(e.w)),H=Math.max(1,Math.round(e.h)),preset=e.haloPreset||'medium';
 const uri=Cuts.source(doc,e.assetId);if(!uri)throw Error('Food artwork unavailable: '+e.assetId);
 const key=e.assetId+'|'+uri.length+'|'+W+'x'+H+'|'+preset;
 if(rasterCache.has(key))return rasterCache.get(key);
 const raw=document.createElement('canvas');raw.width=W;raw.height=H;
 const rx=raw.getContext('2d',{willReadFrequently:true});rx.clearRect(0,0,W,H);oldCutDraw(rx,{...e,x:0,y:0,w:W,h:H},doc);
 const p=rx.getImageData(0,0,W,H).data;
 const out=document.createElement('canvas');out.width=W;out.height=H;
 const ox=out.getContext('2d',{willReadFrequently:true});
 const band=sizes[preset]||sizes.medium;
 if(band[1]){
  const inf=32000,dist=new Uint16Array(W*H);dist.fill(inf);
  for(let i=0;i<W*H;i++)if(p[i*4+3]>127)dist[i]=0;
  for(let y=1;y<H;y++)for(let x=1;x<W;x++){
   const i=y*W+x;dist[i]=Math.min(dist[i],dist[i-1]+3,dist[i-W]+3,dist[i-W-1]+4);
  }
  for(let y=H-2;y>=0;y--)for(let x=W-2;x>=0;x--){
   const i=y*W+x;dist[i]=Math.min(dist[i],dist[i+1]+3,dist[i+W]+3,dist[i+W+1]+4);
  }
  const image=ox.createImageData(W,H),z=image.data;
  const solid=band[0]*3,outer=band[1]*3;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){
   const i=y*W+x,at=i*4,dd=dist[i];
   if(dd===0||dd>outer)continue;
   const white=dd<=solid||hashPixel(x,y)<Math.pow((outer-dd)/(outer-solid),1.12)*.9;
   if(white){z[at]=z[at+1]=z[at+2]=255;z[at+3]=255;}
  }
  ox.putImageData(image,0,0);
 }
 ox.drawImage(raw,0,0);
 if(rasterCache.size>32)rasterCache.clear();rasterCache.set(key,out);return out;
}
Cuts.draw=function(ctx,e,doc){if(e.haloPreset&&isMaster(doc)){const c=compHero(e,doc);ctx.drawImage(c,Math.round(e.x),Math.round(e.y));return;}return oldCutDraw(ctx,e,doc);};
Cuts.svgImage=function(doc,e){if(e.haloPreset&&isMaster(doc)){const c=compHero(e,doc);return '<image x="'+e.x+'" y="'+e.y+'" width="'+e.w+'" height="'+e.h+'" href="'+c.toDataURL('image/png')+'"/>';}
 return oldCutSvg(doc,e);
};
function drawMotif(ctx,e,doc){
 ctx.save();ctx.beginPath();ctx.rect(e.x,e.y,e.w,e.h);ctx.clip();
 if(e.motif==='white-knockout'){
   // Approved red floral edge art remains intact; clear an irregular white hero
   // zone so actual food and missing-art notices never overlap red decoration.
   // All output pixels are pure opaque white, not alpha/blur/gray.
   const W=Math.round(e.w),H=Math.round(e.h),left=Math.round(e.x),top=Math.round(e.y);
   const im=ctx.getImageData(left,top,W,H),pixels=im.data;
   for(let y=0;y<H;y++)for(let x=0;x<W;x++){
     const center=W/2, core=168+6*Math.sin(y/17)+3*Math.sin(y/7),d=Math.abs(x-center)-core;
     const chance=d<=0?1:d>=58?0:Math.pow((58-d)/58,1.3);
     if(chance===0||hashPixel(x,y)>chance)continue;
     const at=(y*W+x)*4;pixels[at]=255;pixels[at+1]=255;pixels[at+2]=255;pixels[at+3]=255;
   }
   ctx.putImageData(im,left,top);
 }else if(e.motif==='icon'){
  const cx=e.x+e.w/2,cy=e.y+e.h/2;
  ctx.strokeStyle='#ffffff';ctx.fillStyle='#ffffff';ctx.lineWidth=4;
  ctx.beginPath();ctx.arc(cx,cy,Math.min(e.w,e.h)*.45,0,Math.PI*2);ctx.stroke();
  ctx.save();ctx.translate(cx,cy);const kind=String(doc.data?.['pkg.headerIcon']||'meal');
  if(kind==='grain'){
   ctx.beginPath();ctx.moveTo(-8,31);ctx.lineTo(7,-33);ctx.stroke();
   for(let i=0;i<5;i++){const y=-25+i*12,x=8-i*3;for(const side of [-1,1]){
    ctx.beginPath();ctx.ellipse(x+side*10,y,10,4,side*.65,0,Math.PI*2);ctx.fill();}}
  }else if(kind==='vegetable'){
   ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(0,-23);ctx.bezierCurveTo(-30,-29,-34,21,0,30);ctx.bezierCurveTo(34,21,30,-29,0,-23);ctx.stroke();
   ctx.beginPath();ctx.moveTo(0,-22);ctx.lineTo(3,-36);ctx.stroke();ctx.beginPath();ctx.ellipse(16,-29,13,5,-.4,0,Math.PI*2);ctx.fill();
  }else if(kind==='soup'){
   ctx.beginPath();ctx.moveTo(-27,1);ctx.quadraticCurveTo(-25,33,0,34);ctx.quadraticCurveTo(25,33,27,1);ctx.stroke();ctx.beginPath();ctx.ellipse(0,1,27,7,0,0,Math.PI*2);ctx.stroke();
   for(let k=-1;k<=1;k++){ctx.beginPath();ctx.moveTo(k*14,-8);ctx.bezierCurveTo(k*14-10,-19,k*14+11,-22,k*14,-35);ctx.stroke();}
  }else if(kind==='protein'){
   ctx.beginPath();ctx.ellipse(-2,0,28,19,-.35,0,Math.PI*2);ctx.stroke();ctx.beginPath();ctx.ellipse(-2,0,15,9,-.35,0,Math.PI*2);ctx.stroke();
   ctx.beginPath();ctx.moveTo(-24,-11);ctx.lineTo(-14,-26);ctx.stroke();
  }else if(kind==='kit'){
   ctx.strokeRect(-24,-24,48,47);ctx.beginPath();ctx.moveTo(-24,-8);ctx.lineTo(24,-8);ctx.moveTo(0,-8);ctx.lineTo(0,22);ctx.stroke();
  }else if(kind==='side'){
   ctx.beginPath();ctx.moveTo(-27,13);ctx.quadraticCurveTo(-18,-10,0,-14);ctx.quadraticCurveTo(18,-10,27,13);ctx.stroke();
   ctx.beginPath();ctx.moveTo(-25,15);ctx.lineTo(25,15);ctx.stroke();
  }else{
   ctx.beginPath();ctx.moveTo(-24,-17);ctx.lineTo(24,-17);ctx.lineTo(18,21);ctx.lineTo(-18,21);ctx.closePath();ctx.stroke();
   ctx.beginPath();ctx.moveTo(-24,-4);ctx.lineTo(24,-4);ctx.moveTo(-22,9);ctx.lineTo(22,9);ctx.stroke();
  }
  ctx.restore();
 }else if(e.motif==='botanical'){
   ctx.strokeStyle='#ff0000';ctx.fillStyle='#ff0000';ctx.lineWidth=2.4;ctx.lineCap='round';
   for(const side of [0,1]){
    ctx.save();if(side){ctx.translate(e.x+e.w,e.y);ctx.scale(-1,1);}else ctx.translate(e.x,e.y);
    const H=e.h;
    for(let stem=0;stem<3;stem++){
     const x0=stem*10-8,y0=H-15+stem*7;
     ctx.beginPath();ctx.moveTo(x0,y0);ctx.bezierCurveTo(32+stem*5,H*.6,12+stem*6,H*.32,48+stem*6,8);ctx.stroke();
     for(let k=0;k<8;k++){
      const y=H-29-k*(H-53)/8;const x=7+stem*6+Math.sin((k+stem)*1.3)*8+k*4;
      for(const d of [-1,1]){
       ctx.save();ctx.translate(x,y);ctx.rotate(d*.55);ctx.beginPath();ctx.ellipse(d*10,0,10,4.2,d*.45,0,Math.PI*2);ctx.fill();ctx.restore();
      }
     }
    }
    ctx.restore();
   }
 }
 ctx.restore();
}
function svgMotif(doc,e){const c=document.createElement('canvas');c.width=e.w;c.height=e.h;drawMotif(c.getContext('2d'),{...e,x:0,y:0},doc);return '<image x="'+e.x+'" y="'+e.y+'" width="'+e.w+'" height="'+e.h+'" href="'+c.toDataURL('image/png')+'"/>';}
const defaults=defs.map(make);
C.initialTemplates=()=>defaults.concat(prevInitial());
P8.isPackage=doc=>isMaster(doc)||oldIsPackage(doc);
P8.validate=(doc,review=true)=>isMaster(doc)?validate(doc):oldValidate(doc,review);
P8.panel=args=>isMaster(args.doc)?panel(args):oldPanel(args);
const v9={version:9,families,defs,byId,defaults,isMaster,make,validate,update,derived,assignArt,drawMotif,svgMotif,compHero,fmtDate,dateTypes,dateNames,suggestedArtwork,artworkSpeciesMismatch};
window.LabelMasterV9=v9;

const style=document.createElement('style');
style.textContent='.master-artwork-picker{margin:16px 0;padding:12px;border:1px solid rgba(128,145,162,.25);border-radius:10px}.master-artwork-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:7px;max-height:300px;overflow:auto;margin:8px 0}.master-artwork-choice{background:rgba(128,145,162,.08);border:1px solid rgba(128,145,162,.28);border-radius:7px;padding:5px;text-align:center;color:inherit;cursor:pointer;min-width:0}.master-artwork-choice.is-chosen{border:2px solid #ff0000}.master-artwork-choice img{width:100%;height:74px;object-fit:contain;background:#fff;border-radius:4px}.master-artwork-choice span{display:block;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;font-weight:700;font-size:10px}.master-artwork-choice small{display:block;font-size:9px;opacity:.7}.master-artwork-review{border:1px solid rgba(128,145,162,.24);border-radius:8px;padding:8px;font-size:11px;line-height:1.5}.master-artwork-proof{background:#fff}.master-artwork-proof img{width:100%;height:116px;object-fit:contain}.master-artwork-review p{margin:6px 0;color:#7f8996}';
document.head.appendChild(style);



/* Artwork review: rank physical raw-cut matches, never invent meal imagery. */
const matchingWords=new Set(['raw','fresh','frozen','protein','cut','bone','boneless','bonein','skinless','skin','on','herb','garlic','spicy','dry','seasoned','marinated','teriyaki','plain','vacuum','whole','prepared','ground','sliced']);
function words(t){return String(t||'').toLowerCase().split(/[^a-z0-9]+/).filter(v=>v.length>=3&&!matchingWords.has(v));}
function suggestedArtwork(doc){
 if(!isMaster(doc))return [];
 const def=byId.get(doc.data['pkg.type']);
 // A raw-cut picture is not a substitute for finished meals, sides or kits.
 if(!def||def.familyId!=='raw_proteins')return [];
 const text=(doc.data['pkg.food']||'')+' '+(doc.data['pkg.attributes']||'');
 const tokens=new Set(words(text));
 const proteinTerms={beef:['beef','ribeye','brisket','sirloin','tbone','porterhouse'],pork:['pork','chop','porkchop'],chicken:['chicken'],turkey:['turkey'],lamb:['lamb'],venison:['venison','deer'],duck:['duck'],salmon:['salmon'],shrimp:['shrimp']};
 let likely='';
 for(const [species,tags] of Object.entries(proteinTerms))if(tags.some(k=>tokens.has(k))){likely=species;break;}
 const cuts=Cuts.catalog.filter(a=>a&&a.id&&a.dataUri);
 const scored=cuts.map(a=>{
  const idTokens=new Set(words(a.id+' '+a.name));
  const animal=String(a.species||a.protein||a.category||'').toLowerCase();
  const species=animal.replace(/\s.+/,'');
  if(likely && species!==likely && !a.id.startsWith(likely+'_'))return null;
  // If the title names a physical cut (ribeye, chop, tenderloin, etc.),
  // don't recommend every other cut of the same species as if it matched.
  const cutWords=[...tokens].filter(k=>k!==likely&&!['beef','pork','chicken','turkey','lamb','venison','deer','duck','salmon','shrimp'].includes(k));
  if(cutWords.length&&!cutWords.some(k=>idTokens.has(k)))return null;
  let points=likely?5:0;
  for(const k of tokens)if(idTokens.has(k))points+=3;
  if(a.id===doc.elements.find(e=>e.name==='Hero food illustration')?.assetId)points+=100;
  if(points===0)return null;
  return {asset:a,score:points,source:a.status==='candidate'?'candidate archive':'existing artwork'};
 }).filter(Boolean);
 scored.sort((a,b)=>b.score-a.score||a.asset.id.localeCompare(b.asset.id));
 return scored.slice(0,12);
}
function artworkSpeciesMismatch(doc,art){
 if(!isMaster(doc)||!art)return '';
 const def=byId.get(doc.data['pkg.type']);if(def?.familyId!=='raw_proteins')return '';
 const title=String(doc.data['pkg.food']||'').toLowerCase();
 let protein=title.match(/\b(chicken|pork|beef|turkey|duck|lamb|venison|deer|salmon|shrimp)\b/)?.[1];
 if(!protein && /\b(ribeye|brisket|sirloin|porterhouse)\b/.test(title))protein='beef';
 if(!protein && /\b(pork chops?|bacon)\b/.test(title))protein='pork';
 if(!protein)return '';
 if(protein==='deer')protein='venison';
 const asset=Cuts.byId.get(art.assetId);
 if(!asset)return '';
 const species=String(asset.species||asset.protein||asset.category||'').toLowerCase();
 return species!==protein&&!String(asset.id||'').startsWith(protein+'_')
  ?'Selected '+(asset.species||'artwork')+' illustration does not match the '+protein+' named in the package. Choose an accurate cut or an approved text-only label.':'';
}

function panel({doc,target,esc,checkpoint,saveLocal,drawArtwork,renderInspector,refresh,setActive,createFresh}){
 const safe=esc,d=doc.data,v=k=>String(d['pkg.'+k]??'');
 const inputs=[
 ['food','Product name','text'],['state','Preparation state','select',['RAW','COOKED','DRY','OPENED','PARTIALLY COOKED']],
 ['attributes','Extra condition or cut attributes · separated by commas','text'],
 ['storage','Storage','select',['FROZEN','REFRIGERATED','COOL & DRY','ROOM TEMPERATURE']],
 ['contents','Additional factual contents · separate with commas','textarea'],
 ['metric','Metric net quantity','text'],['imperial','Imperial net quantity','text'],
 ['portions','Servings / portions (optional)','text'],['packaging','Physical package material','text'],
 ['id','Unique package ID · QR contains ONLY this ID','text'],
 ['actionText','Primary handling / cooking instruction','textarea'],
 ['allergens','Verified allergens · comma separated; blank hides','text'],
 ['artStatus','Artwork approval','select',['missing','candidate','approved']],
 ['headerIcon','Header pictogram','select',['protein','vegetable','kit','meal','side','soup','grain']],
 ['halo','White dither edge','select',['none','light','medium','strong']],
 ['recipeRef','Recipe reference · record only','text'],
 ['location','Storage location · record only','text'],['batch','Batch ID · record only','text']
 ];
 const field=([key,label,typ,opts])=>{
  let t;if(typ==='select')t='<select data-master-field="'+key+'">'+opts.map(o=>'<option value="'+safe(o)+'" '+(o===v(key)?'selected':'')+'>'+safe(o)+'</option>').join('')+'</select>';
  else if(typ==='textarea')t='<textarea rows="2" data-master-field="'+key+'">'+safe(v(key))+'</textarea>';
  else t='<input data-master-field="'+key+'" value="'+safe(v(key))+'" type="text"/>';
  return '<div class="field"><label>'+safe(label)+'</label>'+t+'</div>';
 };
 const selector='<div class="field"><label>Master label type · 17 presets</label><select id="masterLabelType">'+families.map(f=>'<optgroup label="'+safe(f.name)+'">'+defs.filter(x=>x.familyId===f.id).map(x=>'<option value="'+safe(x.id)+'" '+(x.id===v('type')?'selected':'')+'>'+safe(x.label)+'</option>').join('')+'</optgroup>').join('')+'</select></div>';
 const eventRows=[1,2,3,4].map(n=>'<div class="master-event"><select data-master-event="'+n+'" data-which="Type"><option value="">No event</option>'+dateTypes.map(x=>'<option value="'+x+'" '+(x===v('date'+n+'Type')?'selected':'')+'>'+safe(dateNames[x])+'</option>').join('')+'</select><input type="date" data-master-event="'+n+'" data-which="Date" value="'+safe(v('date'+n))+'"/></div>').join('');
 const chosen=doc.elements.find(x=>x.name==='Hero food illustration');
 const gallery='<section class="master-artwork-picker"><div class="field"><label>Food-only artwork · search the candidate library</label><input id="masterArtSearch" type="search" placeholder="Search cuts or species…" autocomplete="off"/></div><p id="masterArtHelp" class="form-tip"></p><div id="masterArtSuggestions" class="master-artwork-grid" role="group" aria-label="Recommended food illustrations"></div><div class="field"><label>Selected artwork</label><select id="masterArtwork"><option value="">No artwork — reviewed text-only</option></select></div><div id="masterArtPreview" class="master-artwork-review"></div></section>';
 const reviews=[['identityReviewed','Product identity and contents confirmed'],['quantityReviewed','Metric / imperial quantities verified'],['storageReviewed','Actual storage condition and container verified'],['datesReviewed','All printed events and quality/use-by date verified'],['allergensReviewed','Actual recipe ingredients and allergens reviewed'],['actionVerified','Handling and any safety-critical cooking directions verified'],['artworkReviewed','Selected food artwork approved; no cookware or unlisted items'],['textOnlyApproved','Allow a truthful text-only label when artwork is unavailable']];
 target.innerHTML='<div class="master-form"><h3>One master layout · current preset</h3><p class="form-tip">Values are illustrative until verified. The header never prints generic branding or repeats the food name below the illustration.</p>'+selector+'<button type="button" id="masterNewPackage" class="btn btn-outline" style="width:100%;min-height:40px;margin:8px 0 14px">+ New blank package of this type</button><div class="master-field-grid">'+inputs.map(field).join('')+'</div>'+gallery+
 '<div class="field"><label>Decorative edge artwork</label><select id="masterBotanical"><option value="BG-101">Heritage herb engraving · BG-101</option><option value="BG-013">Earlier approved engraving · BG-013</option><option value="legacy">Earlier simplified botanicals</option></select></div><p class="form-tip">The red botanical artwork is decorative only, not a depiction of ingredients.</p>'+
 '<div class="field"><label>Upload transparent black/white food PNG · 540 × 215 px</label><input id="masterArtUpload" type="file" accept="image/png"/></div><p class="form-tip">Uploaded art is a candidate until reviewed. No bowls, cookware or unrelated food unless physically packaged.</p><h4>DATED EVENTS (UP TO 4 PRINTED)</h4>'+eventRows+
 '<h4>REVIEW BEFORE PRINTING</h4><div class="master-review">'+reviews.map(([key,label])=>'<label><input type="checkbox" data-master-check="'+key+'" '+(v(key)==='1'?'checked':'')+' />'+safe(label)+'</label>').join('')+'</div><div class="master-gate" id="masterGate"></div><p class="form-tip">Printed QR contains the ID only. No automatic expiry, ingredient or temperature guesses. Legacy templates and historical print snapshots remain unchanged.</p></div>';
 const stylePanel=document.createElement('div');stylePanel.className='master-artwork-review';stylePanel.style.marginBottom='14px';
 stylePanel.innerHTML='<strong>Heritage v12 · engraved two-line label system</strong><p>17 editable types · 591 × 827 preview · 576 × 827 centered-crop printer raster · 3 exact colors. Food-only artwork is a candidate until reviewed.</p>'+(v('layoutStyle')==='heritage-v12'?'<p><strong>Heritage layout active</strong> · changes to content and the independent background remain editable.</p>':'<button class="btn btn-outline" type="button" id="masterApplyHeritage" style="width:100%;min-height:42px">Apply Heritage layout to this label</button>');
 target.querySelector('.master-form').prepend(stylePanel);
 const applyButton=stylePanel.querySelector('#masterApplyHeritage');if(applyButton)applyButton.onclick=()=>{checkpoint();d['pkg.layoutStyle']='heritage-v12';const deco=doc.elements.find(x=>x.name==='Artwork edge botanicals');if(deco&&deco.type==='background')deco.assetId='BG-101';addHeritageArtwork(doc);for(const key of ['identityReviewed','quantityReviewed','storageReviewed','datesReviewed','allergensReviewed','artworkReviewed','actionVerified'])d['pkg.'+key]='0';derived(doc);saveLocal();refresh();};
 const warnings=target.querySelector('#masterGate');
 function showWarnings(){derived(doc);const w=validate(doc);warnings.innerHTML='<strong>Print preflight · '+w.length+' item'+(w.length===1?'':'s')+' to resolve</strong>'+(w.length?'<ul>'+w.slice(0,13).map(x=>'<li>'+safe(x)+'</li>').join('')+'</ul>':'<p>Record checks passed; physically test printer alignment and QR scans.</p>');}
 const deco=doc.elements.find(e=>e.name==='Artwork edge botanicals');
 target.querySelector('#masterBotanical').value=deco?.type==='background'?deco.assetId:'legacy';
 target.querySelector('#masterBotanical').onchange=e=>{
  checkpoint();const layer=doc.elements.find(e=>e.name==='Artwork edge botanicals');if(!layer)return;
  if(e.target.value!=='legacy')Object.assign(layer,{type:'background',assetId:e.target.value,region:'custom',fit:'stretch',panX:50,panY:50,zoom:100,locked:true});
  else Object.assign(layer,{type:'motif',motif:'botanical',locked:true});
  let knockout=doc.elements.find(e=>e.name==='Central white dither knockout');
  if(!knockout&&e.target.value!=='legacy'){
    knockout=l('motif','Central white dither knockout',0,152,591,222,{motif:'white-knockout',locked:true});
    doc.elements.splice(doc.elements.indexOf(layer)+1,0,knockout);
  }
  if(knockout)knockout.visible=e.target.value!=='legacy';
  update(doc,'pkg.ornament',e.target.value);saveLocal();refresh();
 };
 target.querySelector('#masterNewPackage').onclick=()=>createFresh?.(v('type'));
 target.querySelector('#masterLabelType').onchange=e=>{setActive('master-'+e.target.value);};
 for(const field of target.querySelectorAll('[data-master-field]')){
  field.addEventListener('focus',()=>checkpoint(),{once:true});
  field.addEventListener('input',()=>{update(doc,'pkg.'+field.dataset.masterField,field.value);saveLocal();drawArtwork();showWarnings();for(const c of target.querySelectorAll('[data-master-check]'))c.checked=v(c.dataset.masterCheck)==='1';});
  if(field.tagName==='SELECT')field.onchange=()=>{if(['halo'].includes(field.dataset.masterField))drawArtwork();};
 }
 for(const input of target.querySelectorAll('[data-master-event]')){
  input.onchange=()=>{checkpoint();update(doc,'pkg.date'+input.dataset.masterEvent+input.dataset.which,input.value);saveLocal();drawArtwork();showWarnings();for(const c of target.querySelectorAll('[data-master-check]'))c.checked=v(c.dataset.masterCheck)==='1';};
 }
 for(const input of target.querySelectorAll('[data-master-check]'))input.onchange=()=>{checkpoint();d['pkg.'+input.dataset.masterCheck]=input.checked?'1':'0';derived(doc);saveLocal();drawArtwork();showWarnings();};
 const artSearch=target.querySelector('#masterArtSearch');
 const artSelect=target.querySelector('#masterArtwork');
 const artSuggestions=target.querySelector('#masterArtSuggestions');
 const artPreview=target.querySelector('#masterArtPreview');
 const artHelp=target.querySelector('#masterArtHelp');
 const recommended=suggestedArtwork(doc);
 function artStatus(a){
  if(!a)return 'No artwork selected';
  const flag=a.status==='candidate'?'Candidate · needs contents verification':'Existing artwork · confirm physical accuracy';
  return flag;
 }
 function populateArtwork(){
   const q=artSearch.value.trim().toLowerCase(),known=new Set();
   const all=Cuts.catalog.filter(a=>a?.id&&a?.dataUri);
   const matching=q?all.filter(a=>(a.id+' '+a.name+' '+a.species+' '+(a.category||'')).toLowerCase().includes(q)):recommended.map(r=>r.asset);
   const selectedId=doc.elements.find(e=>e.name==='Hero food illustration')?.assetId||'';
   const items=matching.slice(0,q?45:12);
   if(selectedId&&!items.some(x=>x.id===selectedId)){
     const current=Cuts.byId.get(selectedId);
     if(current)items.unshift(current);
     else if(Cuts.source(doc,selectedId))items.unshift({id:selectedId,name:'Uploaded food image',species:'Custom',dataUri:Cuts.source(doc,selectedId),status:'candidate'});
   }
   const option='<option value="">No artwork · use reviewed text-only layout</option>';
   artSelect.innerHTML=option+items.map(a=>'<option value="'+safe(a.id)+'" '+(a.id===selectedId?'selected':'')+'>'+safe((a.species||'Food')+' / '+a.name)+(a.status==='candidate'?' · candidate':'')+'</option>').join('');
   artSuggestions.innerHTML=items.slice(0,10).map(a=>'<button type="button" class="master-artwork-choice'+(a.id===selectedId?' is-chosen':'')+'" data-art="'+safe(a.id)+'" title="'+safe(a.name)+'"><img alt="" loading="lazy" src="'+safe(a.dataUri)+'"/><span>'+safe(a.name)+'</span><small>'+(a.status==='candidate'?'Candidate':'Existing')+'</small></button>').join('');
   artHelp.textContent=q?matching.length+' matching illustrations; select one and verify its actual contents.':
     recommended.length?recommended.length+' raw-cut candidates; none are auto-approved.':
     'No automatically suggested artwork for this packaged food. Upload an exact black/white transparent food illustration, or explicitly review the text-only option.';
   artSuggestions.querySelectorAll('[data-art]').forEach(b=>b.onclick=()=>chooseArtwork(b.dataset.art));
   const source=Cuts.source(doc,selectedId);
   const item=Cuts.byId.get(selectedId);
   artPreview.innerHTML=source?'<div class="master-artwork-proof"><img alt="Food artwork currently selected" src="'+safe(source)+'"/></div><p>'+safe(artStatus(item))+'; render the label to inspect its white dither halo. No pan, bowl or unrelated ingredients unless packaged.</p>':'<p>No food image selected. The label must remain a draft until a truthful text-only layout is reviewed.</p>';
 }
 function chooseArtwork(id){
   checkpoint();try{
    assignArt(doc,id);
    doc.data['pkg.artStatus']=id?'candidate':'missing';
    doc.data['pkg.artworkReviewed']='0';doc.data['pkg.textOnlyApproved']='0';
    derived(doc);saveLocal();refresh();
   }catch(err){window.alert(err.message);}
 }
 artSearch.oninput=populateArtwork;
 artSelect.onchange=e=>chooseArtwork(e.target.value);
 populateArtwork();
 target.querySelector('#masterArtUpload').onchange=async e=>{
  const f=e.target.files?.[0];if(!f)return;
  try{
   if(f.size>700000||f.type!=='image/png')throw Error('Artwork must be a PNG smaller than 700 KB.');
   const bmp=await createImageBitmap(f);if(bmp.width!==540||bmp.height!==215){bmp.close();throw Error('Artwork must be exactly 540 × 215 pixels.');}
   const cv=document.createElement('canvas');cv.width=540;cv.height=215;const c=cv.getContext('2d',{willReadFrequently:true});c.drawImage(bmp,0,0);bmp.close();
   const data=c.getImageData(0,0,540,215).data;
   for(let i=0;i<data.length;i+=4){const a=data[i+3];if(a!==0&&a!==255)throw Error('Only fully transparent or fully opaque pixels are accepted.');
    if(a===255&&!((data[i]===0&&data[i+1]===0&&data[i+2]===0)||(data[i]===255&&data[i+1]===255&&data[i+2]===255)))throw Error('Only exact black and white pixels are accepted.');
   }
   const id='user-art-'+C.UID();doc.assets[id]={id,name:f.name.slice(0,80),width:540,height:215,origin:'user-upload-v9',dataUri:cv.toDataURL('image/png')};
   checkpoint();assignArt(doc,id);saveLocal();refresh();
  }catch(err){window.alert(err.message);}finally{e.target.value='';}
 };
 showWarnings();
}
})();
