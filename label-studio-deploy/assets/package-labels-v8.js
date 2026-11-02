/* Nerdeus Meals Label Studio v8 - conditional packaging templates and data validation.
   New templates are additive. No backend connection, no automatic expiry or cooking claims.
   Artwork must represent actual contents. Pans/plates never substituted for food. */
(function(){
'use strict';
const C=window.LabelCore;
if(!C||!window.LabelCuts)throw Error('Package designer requires LabelCore and LabelCuts');
const oldInitial=C.initialTemplates;
const specs=[
{id:'pkg-raw-protein',name:'Raw protein',category:'RAW PROTEIN',state:'RAW',nameSample:'Boneless Chicken Breast',metric:'650 g',imperial:'22.9 oz',storage:'REFRIGERATED',action:'COOK',instructions:'Cook using verified cut instructions',temp:'SET TEMPERATURE',allergens:'',portions:'',contents:'',cut:'chicken_breast_boneless_skinless'},
{id:'pkg-prepped-raw',name:'Prepped raw ingredient',category:'PREPPED RAW',state:'RAW',nameSample:'Diced Yellow Onion',metric:'450 g',imperial:'15.9 oz',storage:'FROZEN',action:'USE',instructions:'Use in recipe; cook as required',temp:'',allergens:'',portions:'',contents:'Diced onion'},
{id:'pkg-raw-combo',name:'Raw ingredient combination',category:'RAW INGREDIENT COMBO',state:'RAW',nameSample:'Diced Onions & Peppers',metric:'450 g',imperial:'15.9 oz',storage:'FROZEN',action:'USE',instructions:'Use in recipe; cook as required',temp:'',allergens:'',portions:'',contents:'Onion · Red bell pepper · Green bell pepper'},
{id:'pkg-raw-kit',name:'Raw meal kit',category:'RAW MEAL KIT',state:'RAW',nameSample:'Fajita Meal Kit',metric:'850 g',imperial:'30.0 oz',storage:'FROZEN',action:'COOK',instructions:'Fully cook all raw components; follow recipe',temp:'',allergens:'',portions:'4 portions',contents:'Chicken · peppers · onion'},
{id:'pkg-cooked-ingredient',name:'Cooked ingredient / component',category:'COOKED COMPONENT',state:'COOKED',nameSample:'Sautéed Peppers & Onion',metric:'400 g',imperial:'14.1 oz',storage:'REFRIGERATED',action:'REHEAT',instructions:'Reheat using validated recipe method',temp:'165°F / 74°C',allergens:'',portions:'',contents:'Peppers · Onion'},
{id:'pkg-cooked-side',name:'Cooked side dish',category:'COOKED SIDE',state:'COOKED',nameSample:'Garlic Mashed Potatoes',metric:'500 g',imperial:'17.6 oz',storage:'FROZEN',action:'REHEAT',instructions:'Reheat using verified method',temp:'165°F / 74°C',allergens:'MILK',portions:'4 portions',contents:''},
{id:'pkg-cooked-meal',name:'Complete cooked meal',category:'COOKED MEAL',state:'COOKED',nameSample:'Beef Lasagna',metric:'400 g',imperial:'14.1 oz',storage:'FROZEN',action:'REHEAT',instructions:'Oven: follow verified recipe time',temp:'165°F / 74°C',allergens:'WHEAT · MILK',portions:'1 serving',contents:''},
{id:'pkg-leftovers',name:'Leftovers',category:'LEFTOVERS',state:'COOKED',nameSample:'Sunday Pot Roast',metric:'450 g',imperial:'15.9 oz',storage:'REFRIGERATED',action:'REHEAT',instructions:'Reheat thoroughly; verify center temperature',temp:'165°F / 74°C',allergens:'',portions:'2 portions',contents:''},
{id:'pkg-soup-stew',name:'Soup / stew',category:'SOUP OR STEW',state:'COOKED',nameSample:'Beef Stew',metric:'500 g',imperial:'17.6 oz',storage:'FROZEN',action:'REHEAT',instructions:'Reheat using verified recipe method',temp:'165°F / 74°C',allergens:'',portions:'2 portions',contents:''},
{id:'pkg-sauce',name:'Sauce / concentrate',category:'SAUCE / CONCENTRATE',state:'COOKED',nameSample:'Tomato Pasta Sauce',metric:'500 ml',imperial:'16.9 fl oz',storage:'FROZEN',action:'REHEAT',instructions:'Heat per recipe; dilute if specified',temp:'',allergens:'',portions:'',contents:''},
{id:'pkg-dry-mix',name:'Dry bread / meal mix',category:'DRY MIX',state:'DRY',nameSample:'Herb Bread Dry Mix',metric:'650 g',imperial:'22.9 oz',storage:'COOL & DRY',action:'PREPARE',instructions:'Add water and oil per recipe instructions',temp:'',allergens:'WHEAT · MILK',portions:'1 loaf mix',contents:''},
{id:'pkg-pantry',name:'Pantry ingredient',category:'PANTRY INGREDIENT',state:'DRY',nameSample:'Smoked Paprika',metric:'340 g',imperial:'12.0 oz',storage:'COOL & DRY',action:'STORE',instructions:'Keep closed and dry',temp:'',allergens:'',portions:'',contents:''}
];
const byId=new Map(specs.map(s=>[s.id,s]));
function el(type,name,x,y,w,h,props={}){return C.el(type,name,x,y,w,h,props);}
function text(name,content,x,y,w,h,size,color='black',props={}){return el('text',name,x,y,w,h,{text:content,fontFamily:'Arial',fontSize:size,bold:true,align:'left',lineHeight:1.12,color,autoFit:true,maxLines:2,...props});}
function box(name,x,y,w,h,fill='white',props={}){return el('rect',name,x,y,w,h,{fill,stroke:'none',...props});}
function line(name,x,y,w,color='black',strokeWidth=2){return el('line',name,x,y,w,2,{color,strokeWidth});}
function cal(label,x,y,color){return [
 el('rect',label+' icon',x,y,23,23,{fill:'none',stroke:color,strokeWidth:2,radius:2}),
 line(label+' bar',x+3,y+7,17,color,2),
 line(label+' ring1',x+6,y+2,1,color,2),
 line(label+' ring2',x+17,y+2,1,color,2)
];}
function dateCaption(storage){return storage==='FROZEN'?'BEST QUALITY BY':storage==='COOL & DRY'?'BEST BY':'USE BY';}
function conditionText(d){return (d['pkg.state']||'').toUpperCase()+' · '+(d['pkg.storage']||'').toUpperCase();}
function make(spec){
 const d={
 'pkg.type':spec.id,'pkg.food':spec.nameSample,'pkg.state':spec.state,'pkg.condition':spec.state+' · '+spec.storage,
 'pkg.contents':spec.contents,'pkg.metric':spec.metric,'pkg.imperial':spec.imperial,'pkg.portions':spec.portions,
 'pkg.storage':spec.storage,'pkg.packed':'','pkg.date':'','pkg.dateCaption':dateCaption(spec.storage),
 'pkg.action':spec.action,'pkg.instructions':spec.instructions,'pkg.temp':spec.temp,'pkg.thaw':spec.storage==='FROZEN'?'Thaw safely in refrigerator if required':'',
 'pkg.allergens':spec.allergens,'pkg.id':'DEMO-PKG-'+spec.id.slice(4).toUpperCase(),
 'pkg.packaging':'Vacuum pouch','pkg.recipeRef':'','pkg.location':'',
 'pkg.reviewed':'0','pkg.allergensReviewed':'0','pkg.artworkReviewed':'0','pkg.sampleFlag':'SAMPLE · VERIFY DATA'
 };
 const A=[
 box('White printable substrate',0,0,591,827,'white'),
 box('Top red stripe',0,0,591,10,'red'),
 text('Package family','NERDEUS / '+spec.category,34,32,521,25,17,'red',{maxLines:1}),
 text('Packaged food name','{{pkg.food}}',34,75,523,89,45,'black',{maxLines:2}),
 text('Condition','{{pkg.condition}}',34,165,520,25,18,'red',{maxLines:1}),
 text('Proof status','{{pkg.sampleFlag}}',399,34,157,20,12,'red',{showWhen:'pkg.sampleFlag',maxLines:1,align:'right'}),
 text('Contents caption','CONTENTS',34,206,244,18,13,'black',{showWhen:'pkg.contents',maxLines:1}),
 text('Contents','{{pkg.contents}}',34,231,519,80,25,'black',{showWhen:'pkg.contents',maxLines:3}),
 line('Food information divider',34,325,522,'black',2),
 text('Quantity heading','NET QUANTITY',34,342,240,21,14,'black',{maxLines:1}),
 text('Storage heading','STORAGE',308,342,248,21,14,'black',{maxLines:1}),
 text('Metric and imperial quantity','{{pkg.metric}}  /  {{pkg.imperial}}',34,369,264,38,25,'black',{maxLines:1}),
 text('Storage state','{{pkg.storage}}',308,369,246,38,24,'red',{maxLines:1}),
 text('Servings or portions','{{pkg.portions}}',34,402,250,21,16,'black',{showWhen:'pkg.portions',maxLines:1}),
 line('Dates divider',34,420,522,'black',2),
 ...cal('Pack calendar',35,440,'black'),
 ...cal('Date calendar',308,440,'red'),
 text('Packed date heading','PACKED / PREPPED',67,441,219,19,14,'black',{maxLines:1}),
 text('Use by date heading','{{pkg.dateCaption}}',340,441,218,19,14,'red',{maxLines:1}),
 text('Packed date','{{pkg.packed}}',34,473,252,33,22,'black',{maxLines:1,format:'date'}),
 text('Quality or use-by date','{{pkg.date}}',308,473,248,33,22,'red',{maxLines:1,format:'date'}),
 line('Directions divider',34,514,522,'black',2),
 text('Directions heading','{{pkg.action}}',34,527,522,21,15,'red',{maxLines:1}),
 text('Basic handling method','{{pkg.instructions}}',34,551,521,46,21,'black',{maxLines:2}),
 text('Cooking or reheat temperature','{{pkg.temp}}',34,600,523,30,21,'black',{showWhen:'pkg.temp',maxLines:1}),
 text('Optional thaw note','{{pkg.thaw}}',34,632,523,24,16,'black',{showWhen:'pkg.thaw',maxLines:1}),
 text('Allergen caption','ALLERGENS',34,662,520,19,14,'red',{showWhen:'pkg.allergens',maxLines:1}),
 text('Allergen bullets','{{pkg.allergens}}',34,681,520,20,17,'red',{showWhen:'pkg.allergens',format:'allergenBullets',maxLines:1}),
 box('Black information footer',0,705,591,122,'black'),
 text('Package ID heading','PACKAGE ID',34,721,366,19,14,'white',{maxLines:1}),
 text('Actual package ID','{{pkg.id}}',34,749,395,31,24,'white',{maxLines:1}),
 text('QR explanation','QR = PACKAGE ID ONLY',34,786,345,18,12,'white',{maxLines:1}),
 el('qr','ID-only QR',448,700,106,96,{text:'{{pkg.id}}',color:'black'})
 ];
 if(spec.cut)A.splice(5,0,el('illustration','Actual raw cut illustration',84,191,428,125,{assetId:spec.cut,locked:false}));
 return {schema:C.SCHEMA,id:spec.id,name:spec.name,kind:'package',description:spec.category+' · identification, storage and handling · edit data before use',profile:C.clone(C.initialTemplates?.()[0]?.profile||{artWidth:591,artHeight:827,printerWidth:576,printerHeight:827,rotation:'none',cropLeft:7,cropRight:8,stock:'50 × 70 mm',dpi:300,safeInset:30}),data:d,assets:{},elements:A,nlsDesignVersion:8};
}
const defaults=specs.map(make);
C.initialTemplates=()=>defaults.concat(oldInitial());
function isPackage(doc){return !!doc&&doc.nlsDesignVersion===8&&Object.hasOwn(doc.data||{},'pkg.type');}
function calculatePair(metric,imperial){
 const a=/^\s*(\d+(?:\.\d+)?)\s*(g|kg|ml|l)\s*$/i.exec(metric||'');
 const b=/^\s*(\d+(?:\.\d+)?)\s*(US\s*fl\s*oz|fl\s*oz|oz|lb)\s*$/i.exec(imperial||'');
 if(!a||!b)return 'Enter a measurable amount in both g/kg or ml/L and oz/lb/fl oz.';
 const unit=a[2].toLowerCase(),other=b[2].toLowerCase().replace(/\s+/g,'');
 const grams=unit==='g'?Number(a[1]):unit==='kg'?Number(a[1])*1000:null;
 const ml=unit==='ml'?Number(a[1]):unit==='l'?Number(a[1])*1000:null;
 const expected=grams!==null?(other==='oz'?grams/28.349523125:other==='lb'?grams/453.59237:null):((other==='floz'||other==='usfloz')?ml/29.5735295625:null);
 if(expected===null)return 'Weight and volume units do not match.';
 const actual=Number(b[1]);
 if(!Number.isFinite(actual)||actual<=0||Number(a[1])<=0)return 'Quantity must be greater than zero.';
 const tolerance=Math.max(expected*.035,other==='lb'?.05:.16);
 if(Math.abs(expected-actual)>tolerance)return 'Metric and imperial quantities differ beyond the rounding tolerance.';
 return null;
}
function dateValue(x){return /^\d{4}-\d{2}-\d{2}$/.test(x||'')&&!Number.isNaN(Date.parse(x+'T12:00:00Z'))&&new Date(x+'T12:00:00Z').toISOString().slice(0,10)===x;}
function validate(doc,requireReview=true){
 if(!isPackage(doc))return [];
 const d=doc.data,issues=[];const val=k=>String(d['pkg.'+k]||'').trim();
 for(const key of ['food','metric','imperial','storage','instructions','id'])if(!val(key))issues.push('Complete '+key.replace(/([A-Z])/g,' $1')+'.');
 const pair=calculatePair(val('metric'),val('imperial'));if(pair)issues.push(pair);
 if(!dateValue(val('packed')))issues.push('Enter a real packed/prepared date in YYYY-MM-DD format.');
 if(!dateValue(val('date')))issues.push('Enter a real use-by or best-quality date in YYYY-MM-DD format.');
 if(dateValue(val('packed'))&&dateValue(val('date'))&&val('date')<val('packed'))issues.push('The chosen end date precedes the packed/prepared date.');
 if(!/^[A-Z0-9][A-Z0-9-]{5,39}$/.test(val('id'))||/^(?:DEMO|SAMPLE|TEST|TEMP)[-_]/i.test(val('id')))issues.push('Replace the demo ID with a unique real package ID (6–40 uppercase letters, digits or hyphens).');
 if(['pkg-raw-combo','pkg-raw-kit'].includes(val('type'))&&!val('contents'))issues.push('List the contents of the raw combination or kit.');
 if(val('type')==='pkg-raw-protein'&&!/\d+(?:\.\d+)?\s*°?\s*F.*\d+(?:\.\d+)?\s*°?\s*C/i.test(val('temp')))issues.push('Raw protein requires a verified cut-specific °F / °C cooking target.');
 if(val('action')==='REHEAT'&&!/\d+(?:\.\d+)?\s*°?\s*F.*\d+(?:\.\d+)?\s*°?\s*C/i.test(val('temp')))issues.push('Reheatable food requires a verified reheating target in °F and °C.');
 if(['NONE','NO ALLERGENS','UNKNOWN'].includes(val('allergens').toUpperCase()))issues.push('Leave the allergen field blank if none are recorded; never print a no-allergen claim.');
 if(!doc.elements.some(e=>e.type==='qr'&&e.text==='{{pkg.id}}'))issues.push('A package-ID-only QR code is required.');
 if(requireReview){
  if(val('reviewed')!=='1')issues.push('Confirm the actual food identity, quantities, dates, storage and instructions were reviewed.');
  if(val('allergensReviewed')!=='1')issues.push('Confirm ingredients and allergens were reviewed (blank is not an allergen-free claim).');
  if(doc.elements.some(e=>e.type==='illustration'&&e.visible!==false)&&val('artworkReviewed')!=='1')issues.push('Confirm the chosen artwork depicts the actual package contents without cookware or unrelated food.');
 }
 return issues;
}
function refreshSampleFlag(doc){
 if(!isPackage(doc))return;
 doc.data['pkg.sampleFlag']=validate(doc,true).length?'SAMPLE · VERIFY DATA':'';
}
function change(doc,key,value){
 if(!isPackage(doc))return;
 const d=doc.data;
 d[key]=String(value??'').slice(0,1000);
 if(key==='pkg.storage'){d['pkg.dateCaption']=dateCaption(value);d['pkg.condition']=conditionText(d);}
 if(key==='pkg.allergens'&&/^\s*(none|no allergens)\s*$/i.test(value))d[key]='';
 if(!['pkg.reviewed','pkg.allergensReviewed','pkg.artworkReviewed'].includes(key)){
   d['pkg.reviewed']='0';d['pkg.allergensReviewed']='0';d['pkg.artworkReviewed']='0';
 }
 refreshSampleFlag(doc);
}
function panel({doc,target,esc,checkpoint,saveLocal,drawArtwork,renderInspector,refresh,setActive}){
 const d=doc.data,val=k=>d['pkg.'+k]||'',safe=esc;
 const rows=[
 ['food','Food or packaged recipe name','text',true],
 ['contents','Contents (raw combinations / kits)','textarea',false],
 ['metric','Metric quantity (g / kg / ml / L)','text',true],
 ['imperial','Imperial quantity (oz / lb / fl oz)','text',true],
 ['portions','Portions / servings','text',false],
 ['storage','Storage condition','select',true],
 ['packed','Packed / prepared date (YYYY-MM-DD)','date',true],
 ['date','Use-by or best-quality date (YYYY-MM-DD)','date',true],
 ['instructions','Basic cooking, reheating or use instructions','textarea',true],
 ['temp','Verified cook/reheat target (°F / °C)','text',false],
 ['thaw','Thaw guidance (only when relevant)','text',false],
 ['allergens','Confirmed allergens (blank hides this area)','text',false],
 ['id','Unique package ID (QR encodes this only)','text',true],
 ['packaging','Package/container (record only)','text',false],
 ['recipeRef','Recipe reference (record only)','text',false],
 ['location','Pantry/freezer location (record only)','text',false]
 ];
 function field([key,title,type,required]){
  if(['contents'].includes(key)&&!['pkg-raw-combo','pkg-raw-kit','pkg-prepped-raw','pkg-cooked-ingredient'].includes(val('type')))return '';
  if(key==='temp'&&!['COOK','REHEAT'].includes(val('action')))return '';
  if(key==='thaw'&&val('storage')!=='FROZEN')return '';
  const name='pkg.'+key,cur=val(key);
  let control=type==='textarea'?'<textarea rows="2" data-package-key="'+name+'">'+safe(cur)+'</textarea>':
    type==='select'?'<select data-package-key="'+name+'">'+['FROZEN','REFRIGERATED','COOL & DRY','ROOM TEMPERATURE'].map(opt=>'<option value="'+opt+'" '+(opt===cur?'selected':'')+'>'+opt+'</option>').join('')+'</select>':
    '<input type="'+type+'" data-package-key="'+name+'" value="'+safe(cur)+'" placeholder="'+(type==='date'?'YYYY-MM-DD':'Enter value')+'"/>';
  return '<div class="field"><label>'+safe(title)+(required?' *':'')+'</label>'+control+'</div>';
 }
 target.innerHTML='<div class="pkg-editor"><h3>Packaging information</h3><p class="pkg-summary">Identifies the actual contents. All values here are editable demonstration data until reviewed.</p>'+
  '<div class="field"><label>Package category</label><select id="packageTypeSelect">'+specs.map(s=>'<option value="'+s.id+'" '+(s.id===val('type')?'selected':'')+'>'+safe(s.name)+'</option>').join('')+'</select></div>'+
  '<div class="pkg-summary">Changing category opens its separate saved template; use “New copy” to create another package.</div>'+
  '<div class="pkg-grid">'+rows.map(field).join('')+'</div>'+
  '<div class="pkg-summary">State: <b>'+safe(val('state'))+'</b> · Action: <b>'+safe(val('action'))+'</b> · Date label: <b>'+safe(val('dateCaption'))+'</b>. Frozen dates are quality dates, not automatic safety deadlines. No shelf-life calculation is performed.</div>'+
  '<div class="pkg-reviews"><label><input type="checkbox" data-package-check="pkg.allergensReviewed" '+(val('allergensReviewed')==='1'?'checked':'')+'/> I reviewed actual ingredients and allergens.</label>'+
  '<label><input type="checkbox" data-package-check="pkg.artworkReviewed" '+(val('artworkReviewed')==='1'?'checked':'')+'/> Artwork depicts only the actual packaged food, if included.</label>'+
  '<label><input type="checkbox" data-package-check="pkg.reviewed" '+(val('reviewed')==='1'?'checked':'')+'/> I verified identity, measurements, dates, storage and instructions.</label></div>'+
  '<div id="packageWarnings" class="pkg-errors"></div>'+
  '<div class="form-tip">This editor has no inventory/backend integration. The QR stores only the package ID; it does not automatically open a recipe URL. Manual review does not establish date or food-safety accuracy.</div></div>';
 const warnings=target.querySelector('#packageWarnings');
 function updateWarnings(){const issues=validate(doc,true);warnings.innerHTML='<b>Physical print checks ('+issues.length+')</b>'+(issues.length?'<ul>'+issues.slice(0,12).map(x=>'<li>'+safe(x)+'</li>').join('')+'</ul>':'<p>Data checks passed. Printer and real food safety still require verification.</p>');}
 target.querySelector('#packageTypeSelect').onchange=e=>setActive(e.target.value);
 for(const input of target.querySelectorAll('[data-package-key]')){
  input.addEventListener('focus',checkpoint,{once:true});
  input.addEventListener('input',()=>{
   change(doc,input.dataset.packageKey,input.value);
   for(const cb of target.querySelectorAll('[data-package-check]'))cb.checked=doc.data[cb.dataset.packageCheck]==='1';
   saveLocal();drawArtwork();updateWarnings();
  });
  if(input.tagName==='SELECT')input.addEventListener('change',()=>renderInspector());
 }
 for(const cb of target.querySelectorAll('[data-package-check]')){
  cb.addEventListener('change',()=>{checkpoint();doc.data[cb.dataset.packageCheck]=cb.checked?'1':'0';refreshSampleFlag(doc);saveLocal();drawArtwork();updateWarnings();});
 }
 updateWarnings();
}
window.LabelPackages={version:8,specs,byId,defaults,isPackage,make,validate,change,refreshSampleFlag,panel,dateCaption,calculatePair};
})();