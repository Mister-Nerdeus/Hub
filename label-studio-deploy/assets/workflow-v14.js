/* Nerdeus Label Studio v14 guided package workflow.
   Browser-local simulation: safety reviews and physical printer output are NOT automated. */
(function(){
'use strict';
const app=window.__labelStudioTest,M=window.LabelMasterV9,Core=window.LabelCore,Bg=window.LabelBackgrounds,Cuts=window.LabelCuts,life=window.LabelPrintLifecycleV14;
const host=document.getElementById('nlsV14Flow'),workspace=document.getElementById('nlsWorkspace');
if(!app||!M||!Core||!Bg||!Cuts||!life||!host||!workspace)return;
const esc=v=>String(v??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state={screen:'home',family:'all',artSearch:'',reviewSeq:0};
const real=()=>life.isPackage(app.getCurrent()),current=()=>app.getCurrent(),type=()=>M.byId.get(current()?.data?.['pkg.type']);
const groups=['type','details','artwork','review'];
const checks=[
 ['identityReviewed','Identity and all packaged contents verified'],
 ['quantityReviewed','Quantity and both printed units verified'],
 ['storageReviewed','Actual storage and packaging verified'],
 ['datesReviewed','Printed dates and quality/use-by events verified'],
 ['allergensReviewed','Actual ingredients and allergens reviewed'],
 ['actionVerified','Handling, cooking, reheating or mixing instructions verified']
];
const retired=/desserts?|pastry|fruit|orchard|pancakes?|parfait|berries/i;
function status(msg,error=false){const target=host.querySelector('#nls14Status');if(target){target.textContent=msg;target.dataset.error=error?'yes':'no';}}
function b(text,act,main=false){return '<button class="nls14-btn'+(main?' primary':'')+'" type="button" data-nav="'+act+'">'+esc(text)+'</button>';}
function head(title,desc){
 return '<div class="nls14-head"><div><small>NERDEUS MEALS · LABELS</small><h2>'+esc(title)+'</h2><p>'+esc(desc)+'</p></div>'+
  b('Advanced designer','close')+'</div><p id="nls14Status" role="status" aria-live="polite"></p>';
}
function progress(){return '<div class="nls14-progress">'+groups.map((v,i)=>
 '<span class="'+(v===state.screen?'selected':'')+'">'+(i+1)+'. '+({type:'Type',details:'Details',artwork:'Artwork',review:'Review'}[v])+'</span>').join('')+'</div>';}
function home(){
 const n=app.getState().templates.filter(life.isPackage).length;
 return head('Create a package label','Guided food storage labeling. Keep the advanced designer available when needed.')+
  '<div class="nls14-actions">'+b('Create new label','type',true)+b('Open saved packages ('+n+')','saved')+'</div>'+
  '<p class="nls14-help">Real dates, allergens and cooking directions must be checked by you. This prototype does not infer shelf life or confirm printing.</p>';
}
function typePicker(){
 const options=M.families;
 const filters='<div class="nls14-filter"><button type="button" data-family="all" aria-pressed="'+(state.family==='all')+'">All 17</button>'+
 options.map(o=>'<button type="button" data-family="'+esc(o.id)+'" aria-pressed="'+(state.family===o.id)+'">'+esc(o.name)+'</button>').join('')+'</div>';
 return head('Choose label type','One label size, with fields matched to the food and preparation state.')+progress()+filters+
 '<div class="nls14-cards">'+M.defs.filter(d=>state.family==='all'||d.familyId===state.family).map(d=>
 '<button type="button" data-type="'+esc(d.id)+'"><strong>'+esc(d.label)+'</strong><small>'+esc(d.food)+' · example only</small></button>').join('')+
 '</div>'+b('Back','home');
}
function packages(){
 const list=app.getState().templates.filter(life.isPackage);
 return head('Saved packages','These are your browser-local package drafts and labels; reusable examples are not included.')+
 '<div class="nls14-cards">'+(list.length?list.map(d=>
 '<button type="button" data-doc="'+esc(d.id)+'"><strong>'+esc(d.data?.['pkg.food']||'Untitled package')+'</strong>'+
 '<small>'+esc(M.byId.get(d.data?.['pkg.type'])?.label||'Package')+' · '+esc(d.data?.['pkg.id']||'ID needed')+'</small></button>').join(''):
 '<p>No saved package records yet.</p>')+'</div>'+b('Create new','type',true)+b('Back','home');
}
function field(key,label,kind='text',options=[],optional=false,help=''){
 const d=current(),value=String(d?.data?.['pkg.'+key]??'');
 const attr=' data-key="'+esc(key)+'" id="nls14-'+esc(key)+'" ';
 const control=kind==='select'?'<select '+attr+'>'+options.map(o=>'<option value="'+esc(o[0])+'" '+(value===o[0]?'selected':'')+'>'+esc(o[1])+'</option>').join('')+'</select>':
 kind==='textarea'?'<textarea '+attr+' rows="2">'+esc(value)+'</textarea>':
 '<input '+attr+' type="'+(kind==='date'?'date':'text')+'" value="'+esc(value)+'"/>';
 return '<label class="nls14-field" for="nls14-'+esc(key)+'"><strong>'+esc(label)+(optional?' (optional)':'')+'</strong>'+
 control+(help?'<small>'+esc(help)+'</small>':'')+'</label>';
}
const stores=[['','Choose storage'],['FROZEN','Frozen'],['REFRIGERATED','Refrigerated'],['COOL & DRY','Cool and dry'],['ROOM TEMPERATURE','Room temperature']];
function details(){
 if(!real())return home();
 const d=current(),def=type(),typeId=def?.id||'',extra=M.typeFields?.[typeId]||[];
 const contentsRequired=['raw_seasoned','raw_marinated','ingredient_combo','raw_meal_kit','dry_baking_mix','seasoning_dry_base'].includes(typeId);
 let fields=[
 field('food','Actual food / product name'),field('id','Unique package ID','text',[],false,'6–20 uppercase letters, digits or hyphens; QR contains this ID only'),
 field('metric','Net quantity — metric','text',[],false,'e.g. 500 g or 250 mL'),field('imperial','Net quantity — imperial','text',[],false,'e.g. 17.6 oz or 8.5 US fl oz'),
 field('storage','Actual storage condition','select',stores),field('packaging','Actual container material'),
 field('portions','Servings / portions','text',[],true),field('attributes','Cut, skin, bone or preparation attributes','text',[],true),
 field('contents','All ingredients and packaged components','textarea',[],!contentsRequired),
 field('allergens','Recorded allergens','text',[],true,'Blank is not an allergen-free claim'),
 field('actionText','Printed handling / cooking / mixing instruction','textarea',[],false,'Must be verified; limit to 54 characters')
 ];
 fields=fields.concat(extra.map(x=>field(x[0],x[1])));
 const dates=[1,2,3,4].map(n=>'<div class="nls14-event">'+field('date'+n+'Type','Event '+n,'select',[['','Not used'],...M.dateTypes.map(k=>[k,M.dateNames[k]])])+
 field('date'+n,'Real date','date',[],true)+'</div>').join('');
 return head('Enter package facts','This is your individual package; no template examples or other package IDs are copied.')+progress()+
 '<div class="nls14-info">'+esc(def?.label||'')+' · '+esc(d.data?.['pkg.food']||'Unnamed package')+'<small>'+esc(d.id)+'</small></div>'+
 '<div class="nls14-fields">'+fields.join('')+'</div><h3>Packaging dates</h3>'+
 '<p class="nls14-help">No expiry or food safety dates are calculated for you.</p>'+
 '<div class="nls14-events">'+dates+'</div><p class="nls14-help">Values save when you finish editing a field.</p>'+
 '<div class="nls14-actions">'+b('Choose another type','type')+b('Continue to artwork','artwork',true)+'</div>';
}
function filteredArt(){
 const q=state.artSearch.trim().toLowerCase();
 return q?Cuts.catalog.filter(a=>(a.id+' '+a.name+' '+a.species).toLowerCase().includes(q)).slice(0,35):
 (M.suggestedArtwork(current())||[]).map(x=>x.asset).slice(0,18);
}
function artwork(){
 if(!real())return home();
 const d=current(),chosen=app.activeBackgroundId(d);
 const bg=Bg.catalog.filter(a=>!retired.test(a.name));
 const selectedBg=Bg.catalog.find(a=>a.id===chosen);
 if(selectedBg&&!bg.some(a=>a.id===selectedBg.id))bg.unshift(selectedBg);
 const illustration=d.elements.find(x=>x.name==='Hero food illustration'&&x.visible!==false);
 const arr=filteredArt();
 return head('Select artwork','Decorative red artwork is separate from a verified black-and-white food silhouette.')+progress()+
 '<div class="nls14-two"><div><h3>Red background</h3>'+
 '<label class="nls14-field"><strong>Background engraving</strong><select id="nls14Background">'+
 bg.map(a=>'<option value="'+esc(a.id)+'" '+(a.id===chosen?'selected':'')+'>'+esc(a.id+' · '+a.name)+(retired.test(a.name)?' · saved legacy':'')+'</option>').join('')+
 '</select></label><p class="nls14-help">Dessert, pastry and fruit-only backgrounds are retired from new guided choices; saved artwork IDs remain intact.</p>'+
 '<h3>Food silhouette (optional)</h3>'+
 '<label class="nls14-field"><strong>Search species or cut</strong><input id="nls14SearchArt" type="search" value="'+esc(state.artSearch)+'" placeholder="chicken breast, ribeye, venison"/></label>'+
 '<label class="nls14-field"><strong>Black-and-white food illustration</strong><select id="nls14Art"><option value="">No food illustration / text only</option>'+
 arr.map(a=>'<option value="'+esc(a.id)+'" '+(illustration?.assetId===a.id?'selected':'')+'>'+esc(a.species+' · '+a.name)+'</option>').join('')+
 (illustration&&!arr.some(x=>x.id===illustration.assetId)?'<option value="'+esc(illustration.assetId)+'" selected>Previously selected art</option>':'')+
 '</select></label><p class="nls14-help">Changing food artwork resets its approval. Verify the depicted species and cut before printing.</p></div>'+
 '<div><h3>Live preview</h3><canvas id="nls14Canvas" width="591" height="827" role="img" aria-label="Exact three-color label preview"></canvas>'+
 '<p class="nls14-help" id="nls14CanvasStatus">Rendering local artwork…</p></div></div>'+
 '<div class="nls14-actions">'+b('Back to details','details')+b('Review package','review',true)+'</div>';
}
function review(){
 if(!real())return home();
 const d=current(),art=d.elements.some(x=>x.name==='Hero food illustration'&&x.visible!==false);
 const reviewChecks=checks.concat([[art?'artworkReviewed':'textOnlyApproved',art?'I verified the selected food illustration is accurate':'I reviewed the truthful text-only layout']]);
 return head('Review before output','The software checks recorded facts and pixels; it cannot attest to real food safety or a physical print.')+
 progress()+'<div class="nls14-two"><div><h3>Manual confirmations</h3>'+
 '<div class="nls14-checks">'+reviewChecks.map(([key,label])=>
 '<label><input type="checkbox" data-review="'+esc(key)+'" '+(d.data?.['pkg.'+key]==='1'?'checked':'')+'/>'+esc(label)+'</label>').join('')+'</div>'+
 '<p class="nls14-help">Only check items you have personally verified from actual package or source data.</p>'+
 '<section id="nls14Preflight" aria-live="polite">Checking required information…</section>'+
 '<div class="nls14-actions">'+b('Save immutable snapshot','snapshot')+b('Add to batch','queue')+b('Printer setup','print')+'</div></div>'+
 '<div><h3>Exact-color output</h3><canvas id="nls14Canvas" width="591" height="827" role="img" aria-label="Exact label output preview"></canvas>'+
 '<p class="nls14-help" id="nls14CanvasStatus">591 × 827 artwork; 576 × 827 printer raster. Print hardware unverified.</p></div></div>'+
 '<div class="nls14-actions">'+b('Edit details','details')+b('Change artwork','artwork')+'</div>';
}
function paint(){
 const canvas=host.querySelector('#nls14Canvas');if(!canvas)return;
 const hint=host.querySelector('#nls14CanvasStatus'),d=current();
 Promise.all([Bg.ensureDocument(d),Cuts.ensureDocument(d)]).then(()=>{
  if(!canvas.isConnected)return;const ctx=canvas.getContext('2d');ctx.clearRect(0,0,canvas.width,canvas.height);
  ctx.drawImage(Core.render(d),0,0);
  if(hint)hint.textContent='Live exact-color preview. No physical printing or QR scans have been verified.';
 }).catch(e=>{if(hint)hint.textContent='Could not render: '+(e?.message||e);});
}
let reviewSerial=0;
async function preflight(){
 const div=host.querySelector('#nls14Preflight');if(!div)return;
 const id=++reviewSerial,packageId=current()?.id;
 try{
  const issues=await life.preflight(current());
  if(!div.isConnected||id!==reviewSerial||packageId!==current()?.id)return;
  div.innerHTML=issues.length?'<strong>'+issues.length+' review issue(s) remain</strong><ul>'+
    issues.slice(0,13).map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul>':
    '<strong>Package data and printer raster passed software preflight.</strong><p>Physical printing, temperature guidance and QR scanning still require real-world verification.</p>';
  host.querySelectorAll('[data-nav="queue"],[data-nav="print"]').forEach(b=>b.disabled=issues.length>0);
 }catch(e){div.textContent='Preflight failed: '+(e?.message||e);}
}
function render(){
 const view=state.screen;
 const html=view==='home'?home():view==='type'?typePicker():view==='saved'?packages():
 view==='details'?details():view==='artwork'?artwork():view==='review'?review():home();
 host.innerHTML='<div class="nls14-sheet">'+html+'</div>';
 if(view==='review')preflight();
 if(view==='artwork'||view==='review')paint();
}
function open(screen='home'){
 state.screen=screen;host.hidden=false;document.body.classList.add('nls-v14-active');
 workspace.setAttribute('aria-hidden','true');render();host.scrollIntoView({block:'start'});
}
function close(){
 host.hidden=true;document.body.classList.remove('nls-v14-active');workspace.removeAttribute('aria-hidden');
 if(real())document.querySelector('[data-tab="data"]')?.click();
}
host.addEventListener('click',async event=>{
 const family=event.target.closest('[data-family]');
 if(family){state.family=family.dataset.family;render();return;}
 const pick=event.target.closest('[data-type]');
 if(pick){try{app.createPackage(pick.dataset.type);state.screen='details';render();status('New blank package saved locally.');}catch(e){status(e?.message||e,true);}return;}
 const selected=event.target.closest('[data-doc]');
 if(selected){try{app.activateDocument(selected.dataset.doc);state.screen='details';render();}catch(e){status(e?.message||e,true);}return;}
 const action=event.target.closest('[data-nav]')?.dataset.nav;if(!action)return;
 if(action==='close'){close();return;}
 if(['home','type','saved','details','artwork','review'].includes(action)){state.screen=action;render();return;}
 if(action==='snapshot'){
  const saved=await app.createSnapshot();if(saved)status(saved.printReview?.approved?
  'Approved data snapshot archived; physical print not yet verified.':'Draft snapshot archived; complete remaining checks.',!saved.printReview?.approved);return;
 }
 if(action==='queue'||action==='print'){
  const problems=await life.preflight(current());if(problems.length){status('Package not ready: '+problems[0],true);return;}
  if(action==='queue'){window.LabelQueueV9?.add?.();status('Queued action requested. Check the mixed-label queue in Advanced designer.');}
  else{close();try{app.openPrinter();}catch(e){window.alert(e?.message||e);}}return;
 }
});
host.addEventListener('change',async e=>{
 const field=e.target.closest('[data-key]');if(field){
  try{app.editField(field.dataset.key,field.value);status('Package saved locally.');}catch(err){status(err?.message||err,true);}return;
 }
 const box=e.target.closest('[data-review]');if(box){try{app.reviewField(box.dataset.review,box.checked);preflight();}catch(err){status(err?.message||err,true);}return;}
 if(e.target.id==='nls14Background'){try{await app.assignBackground(e.target.value);render();status('Red background updated.');}catch(err){status(err?.message||err,true);}return;}
 if(e.target.id==='nls14Art'){try{app.assignFoodArt(e.target.value);render();status('Food artwork changed; approval was reset.');}catch(err){status(err?.message||err,true);}return;}
});
host.addEventListener('input',e=>{
 if(e.target.id!=='nls14SearchArt')return;state.artSearch=e.target.value;
 const sel=host.querySelector('#nls14Art');if(!sel)return;
 const previous=current()?.elements.find(x=>x.name==='Hero food illustration')?.assetId||'';
 const assets=filteredArt();
 sel.innerHTML='<option value="">No food illustration / text only</option>'+
 assets.map(a=>'<option value="'+esc(a.id)+'" '+(previous===a.id?'selected':'')+'>'+esc(a.species+' · '+a.name)+'</option>').join('')+
 (previous&&!assets.some(a=>a.id===previous)?'<option selected value="'+esc(previous)+'">Previously selected art</option>':'');
});
document.getElementById('btnStartV14Flow')?.addEventListener('click',()=>open('type'));
document.querySelectorAll('[data-nls-view]').forEach(b=>b.addEventListener('click',()=>{if(!host.hidden)close();}));
const qp=new URLSearchParams(location.search);
if(qp.get('view')==='create'||(!qp.has('view')&&!qp.has('template')))open('home');
window.NerdeusFlowV14={open,close,getScreen:()=>state.screen};
const css=document.createElement('style');css.textContent="\nbody.nls-v14-active #nlsWorkspace,body.nls-v14-active #nlsSnapshots{display:none!important}\n#nlsV14Flow[hidden]{display:none!important}\n#nlsV14Flow{max-width:1150px;margin:18px auto 35px;padding:0 12px;color:var(--ink,#243444)}\n.nls14-sheet{background:var(--surface,#fff);border:1px solid var(--line,#cad4df);padding:24px;border-radius:13px;box-shadow:0 8px 26px #18263520}\n.nls14-head{display:flex;justify-content:space-between;gap:16px;align-items:flex-start;border-bottom:1px solid var(--line,#cad4df);padding:0 0 14px}\n.nls14-head h2{font-size:23px;margin:5px 0}.nls14-head p{font-size:13px;margin:4px 0;line-height:1.5}\n.nls14-head small{font-weight:800;color:#c23229;letter-spacing:.08em}\n.nls14-btn,.nls14-filter button{cursor:pointer;padding:10px 13px;border:1px solid #a4afbb;border-radius:7px;min-height:42px;background:transparent;color:inherit;font-weight:680;font-size:12px}\n.nls14-btn.primary{background:#c7322e;border-color:#c7322e;color:white}.nls14-btn:disabled{opacity:.45;cursor:not-allowed}\n.nls14-actions,.nls14-filter{display:flex;flex-wrap:wrap;gap:9px;margin:16px 0}\n.nls14-filter button[aria-pressed=true]{background:#292929;color:white}\n.nls14-progress{display:flex;gap:8px;flex-wrap:wrap;margin:16px 0}\n.nls14-progress span{border:1px solid #aebbc7;padding:7px 10px;border-radius:6px;font-size:11px}\n.nls14-progress span.selected{border-color:#c7322e;font-weight:850}\n#nls14Status{min-height:19px;font-size:12px;font-weight:700;color:#34657a}\n#nls14Status[data-error=yes]{color:#b62823}\n.nls14-help{font-size:11px;opacity:.86;line-height:1.6}\n.nls14-cards{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:18px 0}\n.nls14-cards button{border:1px solid #aab6c2;border-radius:9px;padding:16px 12px;text-align:left;background:transparent;color:inherit;cursor:pointer;min-height:90px}\n.nls14-cards button:hover{outline:2px solid #c7322e}\n.nls14-cards strong{display:block;font-size:14px}.nls14-cards small{display:block;font-size:11px;opacity:.78;margin-top:10px}\n.nls14-info{padding:12px;background:rgba(117,140,160,.11);border-radius:8px;font-size:13px}\n.nls14-info small{display:block;margin-top:4px;font-size:10px}\n.nls14-fields{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:18px 0}\n.nls14-field{display:flex;flex-direction:column;min-width:0;gap:6px;font-size:12px}\n.nls14-field strong{font-size:12px}\n.nls14-field input,.nls14-field textarea,.nls14-field select{border:1px solid #9faebe;border-radius:7px;padding:10px;width:100%;min-height:42px;background:var(--surface,#fff);color:inherit;box-sizing:border-box;font-size:13px}\n.nls14-field small{font-size:10px;opacity:.77}\n.nls14-events{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:9px}\n.nls14-event{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:9px;border:1px solid var(--line,#cad4df);border-radius:8px}\n.nls14-two{display:grid;grid-template-columns:minmax(0,1fr) minmax(240px,360px);gap:20px}\n#nls14Canvas{display:block;width:100%;max-width:320px;height:auto;border:1px solid #abb5bf;background:white;margin:8px auto}\n.nls14-checks{display:grid;gap:12px}.nls14-checks label{display:flex;gap:9px;font-size:12px;line-height:1.4;align-items:start}\n.nls14-checks input{width:18px;height:18px;flex:none}\n#nls14Preflight{border-top:1px solid var(--line,#cad4df);padding:13px 0;margin-top:17px;font-size:12px;line-height:1.6}\n#nls14Preflight ul{padding-left:20px;max-height:290px;overflow:auto}\n@media(max-width:840px){.nls14-cards{grid-template-columns:repeat(2,minmax(0,1fr))}}\n@media(max-width:620px){.nls14-sheet{padding:15px}.nls14-head{display:block}.nls14-cards,.nls14-fields,.nls14-events,.nls14-two{grid-template-columns:1fr}.nls14-event{grid-template-columns:1fr 1fr}#nlsV14Flow{padding:0 8px}.nls14-btn{flex:1}}\n";document.head.appendChild(css);
})();