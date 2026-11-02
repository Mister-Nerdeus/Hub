/* Label Studio v9 mixed-type queue and canonical record export.
   A queue stores document references and revision fingerprints; editing invalidates its entry.
   No automatic sending, remote uploads or false physical-print confirmations. */
(function(){
'use strict';
const M=window.LabelMasterV9,C=window.LabelCore,Cuts=window.LabelCuts,Bg=window.LabelBackgrounds,app=window.__labelStudioTest;
if(!M||!C||!app)throw Error('Label Queue v9 requires initialized Nerdeus master editor.');
const KEY='nerdeus-label-studio-v9-batch-queue';
const $=q=>document.querySelector(q),slug=s=>String(s||'package').replace(/[^\w-]+/g,'-').replace(/^-+|-+$/g,'').slice(0,55);
let queue=[];
try{const stored=JSON.parse(localStorage.getItem(KEY)||'[]');if(Array.isArray(stored))queue=stored.filter(x=>x&&typeof x.templateId==='string'&&typeof x.fingerprint==='string'&&Number.isInteger(x.copies)&&x.copies>0).slice(0,30);}catch(_){queue=[];}
const current=()=>app.getCurrent(),docs=()=>app.getState().templates,save=()=>{try{localStorage.setItem(KEY,JSON.stringify(queue));}catch(e){console.warn('Batch queue storage unavailable',e);}};
function fingerprint(doc){return JSON.stringify({id:doc.id,data:doc.data,art:doc.elements.filter(x=>x.name==='Hero food illustration').map(x=>[x.assetId,x.haloPreset]),assets:Object.keys(doc.assets||{})});}
function issuesFor(entry){
 const doc=docs().find(x=>x.id===entry.templateId);
 if(!doc)return ['Source template was deleted.'];
 if(!M.isMaster(doc))return ['Queue entry is not a v9 master package.'];
 if(fingerprint(doc)!==entry.fingerprint)return ['This package was changed after queueing. Remove and re-add the revised label.'];
 return M.validate(doc);
}
function allIssues(){const out=[];
 for(const [i,q] of queue.entries())for(const issue of issuesFor(q))out.push('Item '+(i+1)+': '+issue);
 const seen=new Set();for(const [i,q] of queue.entries()){
  const doc=docs().find(t=>t.id===q.templateId);if(!doc)continue;
  const id=doc.data['pkg.id'];if(seen.has(id))out.push('Item '+(i+1)+': the same package ID appears in more than one queue entry. Increase copies on the original item instead.');else seen.add(id);
 }
 return out;
}
function add(){const doc=current();if(!M.isMaster(doc))return show('Select one of the 17 v9 master labels first.',true);
 if(queue.length>=30)return show('Queue limit: 30 distinct packages.',true);
 const same=queue.find(q=>q.templateId===doc.id);
 const id=doc.data['pkg.id'];const duplicate=queue.find(q=>q.templateId!==doc.id&&docs().find(d=>d.id===q.templateId)?.data?.['pkg.id']===id);
 if(duplicate)return show('That package ID is already queued. Use copies for identical labels.',true);
 if(same){if(fingerprint(doc)!==same.fingerprint)return show('This package changed. Remove its old queue entry before adding it again.',true);
  same.copies=Math.min(50,same.copies+1);
 }else queue.push({templateId:doc.id,fingerprint:fingerprint(doc),copies:Math.max(1,Math.min(50,Number($('#masterCopies').value)||1)),addedAt:new Date().toISOString()});
 save();renderQueue();show('Added to the mixed-label queue. Unverified records remain blocked until approved.');
}
const box=document.createElement('section');box.id='masterBatchQueue';box.className='master-batch';
box.innerHTML='<h3>PRINT BATCH · MIXED LABEL TYPES</h3><p>Choose a master type, fill its data, and add packages to one queue. Multiple copies share the same ID.</p><div class="master-batch-actions"><label>Copies <input type="number" id="masterCopies" value="1" min="1" max="50"/></label><button id="masterAddQueue" type="button">+ Add package</button></div><div id="masterQueueItems"></div><p id="masterQueueStatus" aria-live="polite"></p><div class="master-batch-actions"><button id="masterExportRecord" type="button">Record JSON</button><button id="masterExportZip" type="button">Batch PNG ZIP</button></div><div class="master-batch-actions"><button id="masterLoadDriver" type="button">Load driver</button><button id="masterConnectDriver" type="button">Connect printer</button></div><label class="master-stock"><input id="masterStockConfirm" type="checkbox"/> 50 × 70 mm dual-color stock loaded; physical test accepted</label><button id="masterPrintQueue" type="button" class="master-primary">Print validated queue</button><p class="master-disclaimer">Printing requires confirmed B1 Pro model and every package passing review. Driver success is not proof of print or QR quality.</p>';
const wrap=document.querySelector('#templateChoices');if(!wrap)throw Error('Template chooser not found');wrap.parentElement.appendChild(box);
const css=document.createElement('style');css.textContent=`
.master-batch{margin:14px 0;padding:13px;border:1px solid rgba(128,145,160,.38);border-radius:8px;font-size:11px;line-height:1.5}
.master-batch h3{font-size:11px;letter-spacing:.08em;margin:0 0 7px}
.master-batch p{font-size:11px;color:#8f9eab;margin:5px 0 9px}
.master-batch-actions{display:flex;gap:6px;flex-wrap:wrap;margin:8px 0;align-items:center}
.master-batch button{padding:7px 9px;min-height:34px;cursor:pointer;border:1px solid #83909d;border-radius:5px;color:inherit;background:transparent;font-size:11px}
.master-batch input[type=number]{width:45px;min-height:30px}
.master-batch .master-primary{background:#171717;color:#fff;width:100%;margin-top:8px}
.master-batch label{display:flex;align-items:center;gap:5px}
.master-batch .master-stock{line-height:1.5;font-size:11px;margin-top:12px}
.master-batch input[type=checkbox]{width:16px;height:16px;flex:none}
.master-qrow{padding:9px 0;border-bottom:1px solid rgba(128,145,160,.18);display:grid;grid-template-columns:1fr auto;gap:8px}
.master-qrow b{display:block}.master-qrow small{color:#82909b}.master-qrow button{min-height:27px}
.master-batch .master-error{color:#ff7070!important}
.master-form .master-event{display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:6px}
.master-form .master-review{display:grid;gap:9px;margin:12px 0}
.master-form .master-review label{display:flex;align-items:flex-start;gap:8px;font-size:11px;line-height:1.5}
.master-form .master-review input{width:17px;height:17px;min-height:0;flex:none}
.master-form .master-gate{padding:10px;border:1px solid rgba(128,145,160,.3);border-radius:6px;font-size:11px;line-height:1.5}
.master-form .master-gate ul{padding-left:18px;margin-top:6px}.master-form .master-gate li{margin:4px 0}
.master-form input,.master-form textarea,.master-form select{min-height:35px}
`;document.head.appendChild(css);
function show(msg,error=false){const p=$('#masterQueueStatus');p.textContent=msg;p.classList.toggle('master-error',error);}
function renderQueue(){const q=$('#masterQueueItems');
 q.innerHTML=queue.length?queue.map((entry,i)=>{
  const doc=docs().find(x=>x.id===entry.templateId),name=doc?.data?.['pkg.food']||'(missing template)',issues=issuesFor(entry);
  return '<div class="master-qrow"><div><b>'+escapeHtml(name)+'</b><small>'+escapeHtml(doc?.data?.['pkg.id']||'')+' · '+entry.copies+' copies · '+(issues.length?'NEEDS REVIEW':'READY')+'</small></div><button data-remove="'+i+'" title="Remove from queue">×</button></div>';
 }).join(''):'<p>Queue empty. You may mix raw, cooked, ingredients and dry labels.</p>';
 q.querySelectorAll('[data-remove]').forEach(b=>b.onclick=()=>{queue.splice(Number(b.dataset.remove),1);save();renderQueue();show('Queue entry removed.');});
 const problems=allIssues();$('#masterExportZip').disabled=!queue.length||!!problems.length;
 $('#masterPrintQueue').disabled=!queue.length||!!problems.length;
 if(queue.length)show(queue.length+' distinct packages · '+queue.reduce((x,y)=>x+y.copies,0)+' physical labels · '+problems.length+' blocking checks.'+(problems.length?' '+problems[0]:''),!!problems.length);
}
function escapeHtml(x){return String(x||'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function measure(str){const m=/^\s*(\d+(?:\.\d+)?)\s*(g|kg|ml|l|oz|lb|us\s*fl\s*oz|fl\s*oz)\s*$/i.exec(str||'');if(!m)return null;let u=m[2].replace(/\s+/g,'').toLowerCase();return {value:Number(m[1]),unit:u==='ml'?'mL':u==='l'?'L':u==='usfloz'||u==='floz'?'US_fl_oz':u};}
const containerType=s=>({'VACUUM POUCH':'vacuum_pouch','VACUUM BAG':'vacuum_pouch','SEALED BAG':'sealed_bag','RIGID CONTAINER':'rigid_container','TRAY':'tray','JAR':'jar','BOTTLE':'bottle','PACKET':'packet','WRAP':'wrap'}[String(s).toUpperCase()]||'other');
function record(doc){const d=doc.data,v=k=>String(d['pkg.'+k]||''),events=[];
 for(let i=1;i<=4;i++){if(!v('date'+i+'Type'))continue;events.push({kind:v('date'+i+'Type'),date:v('date'+i)||null,verified:v('datesReviewed')==='1',provenance:null});}
 const artwork=doc.elements.find(e=>e.name==='Hero food illustration'&&e.visible!==false);
 const metric=measure(v('metric')),imperial=measure(v('imperial'));
 if(!metric||!imperial)throw Error('Metric and imperial measurements are missing or invalid; no substitute quantity is exported.');
 return {
  schemaVersion:'nerdeus.package-label.v1',recordId:doc.id,labelType:v('type'),
  product:{displayName:v('food'),proteinId:null,cutId:null,preparationState:v('state').toLowerCase()==='dry'?'dry':v('state').toLowerCase()==='opened'?'opened':v('state').toLowerCase()==='cooked'?'cooked':v('state').toLowerCase()==='partially cooked'?'partially_cooked':'raw',storageCondition:({FROZEN:'frozen',REFRIGERATED:'refrigerated','COOL & DRY':'cool_dry','ROOM TEMPERATURE':'room_temperature'})[v('storage')]||'other',attributes:v('attributes').split(/[,;·]+/).map(x=>x.trim()).filter(Boolean),contentsSummary:v('contents').split(/[,;·]+/).map(x=>x.trim()).filter(Boolean),ingredientRefs:[],notes:null},
  quantity:{kind:metric?.unit==='mL'||metric?.unit==='L'?'volume':'mass',metric,imperial,servings:null,portionCount:null},
  package:{packageId:v('id'),containerType:containerType(v('packaging')),batchId:v('batch')||null,inventoryLocation:v('location')||null,recipeRef:v('recipeRef')||null},events,
  allergens:{confirmed:v('allergens').split(/[,;·]+/).map(x=>x.trim()).filter(Boolean),reviewed:v('allergensReviewed')==='1',sourceRef:null},
  handling:{action:({COOK:'cook',REHEAT:'reheat',MIX:'mix',USE:'use',STORE:'store',SERVE:'serve'})[v('action')]||'use',primaryDisplayText:v('actionText')||null,method:null,verified:v('actionVerified')==='1',temperature:null,thawNote:null,additions:[],sourceRef:null},
  artwork:{assetId:artwork?.assetId||null,status:v('artStatus')==='approved'?'approved':artwork?'candidate':'missing',actualContentsReviewed:v('artworkReviewed')==='1',containerDepicted:false,containerIncluded:false,textOnlyApproved:v('textOnlyApproved')==='1',haloPreset:v('halo'),ornamentId:'botanical_side_v9'},
  review:{status:M.validate(doc).length?'draft':'ready_for_print',identity:v('identityReviewed')==='1',quantity:v('quantityReviewed')==='1',storage:v('storageReviewed')==='1',dates:v('datesReviewed')==='1',allergens:v('allergensReviewed')==='1',handling:v('actionVerified')==='1',artwork:v('artworkReviewed')==='1'||v('textOnlyApproved')==='1'},
  render:{profileId:'niimbot_b1pro_50x70_300dpi',templateVersion:'9.0.0',backgroundId:null,pixelPalette:['#FF0000','#000000','#FFFFFF']}
 };
}
function downloadBlob(blob,name){const a=document.createElement('a'),url=URL.createObjectURL(blob);a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),2000);}
async function prepare(){const bad=allIssues();if(!queue.length)throw Error('Queue is empty.');if(bad.length)throw Error('Resolve '+bad.length+' issues before exporting or printing. '+bad[0]);
 const out=[];
 for(const [i,entry] of queue.entries()){
  const doc=docs().find(t=>t.id===entry.templateId);await Promise.all([Bg.ensureDocument(doc),Cuts.ensureDocument(doc)]);
  const canvas=C.render(doc),colors=C.classify(canvas);if(colors.other)throw Error('Item '+(i+1)+' contains non-print colors.');
  const blocking=C.diagnostics(doc).filter(x=>/outside artwork|unresolved data key|QR modules .*prefer|too small|clip vertically/i.test(x));if(blocking.length)throw Error('Item '+(i+1)+': '+blocking.join(' | '));
  const blob=await C.canvasBlob(canvas);out.push({entry,doc,canvas,blob,colors,record:record(doc)});
 }
 return out;
}
function crc32(buf){let c=0xffffffff;for(let i=0;i<buf.length;i++){c^=buf[i];for(let j=0;j<8;j++)c=(c>>>1)^((c&1)?0xedb88320:0);}return (c^0xffffffff)>>>0;}
function makeZip(files){const enc=new TextEncoder(),parts=[],central=[];let offset=0;
 function header(n){let b=new Uint8Array(n);return {b,v:new DataView(b.buffer)};}
 for(const f of files){const fn=enc.encode(f.name),bytes=f.data,crc=crc32(bytes);const h=header(30+fn.length);
  h.v.setUint32(0,0x04034b50,true);h.v.setUint16(4,20,true);h.v.setUint16(8,0,true);h.v.setUint32(14,crc,true);h.v.setUint32(18,bytes.length,true);h.v.setUint32(22,bytes.length,true);h.v.setUint16(26,fn.length,true);h.b.set(fn,30);parts.push(h.b,bytes);
  const c=header(46+fn.length);c.v.setUint32(0,0x02014b50,true);c.v.setUint16(4,20,true);c.v.setUint16(6,20,true);c.v.setUint32(16,crc,true);c.v.setUint32(20,bytes.length,true);c.v.setUint32(24,bytes.length,true);c.v.setUint16(28,fn.length,true);c.v.setUint32(42,offset,true);c.b.set(fn,46);central.push(c.b);
  offset+=h.b.length+bytes.length;
 }
 const centralSize=central.reduce((s,b)=>s+b.length,0),footer=header(22);footer.v.setUint32(0,0x06054b50,true);footer.v.setUint16(8,files.length,true);footer.v.setUint16(10,files.length,true);footer.v.setUint32(12,centralSize,true);footer.v.setUint32(16,offset,true);
 return new Blob([...parts,...central,footer.b],{type:'application/zip'});
}
async function exportZip(){try{show('Validating every package and building exact 300 DPI PNGs…');const entries=await prepare(),files=[],enc=new TextEncoder(),manifest=[];
 for(const item of entries){const binary=new Uint8Array(await item.blob.arrayBuffer());for(let i=1;i<=item.entry.copies;i++)files.push({name:slug(item.doc.data['pkg.id'])+'-copy-'+String(i).padStart(2,'0')+'.png',data:binary});manifest.push(item.record);}
 files.push({name:'package-records.json',data:enc.encode(JSON.stringify({schema:'nerdeus.batch.v1',createdAt:new Date().toISOString(),labels:manifest},null,2))});
 downloadBlob(makeZip(files),'Nerdeus-Labels-v9-Mixed-Batch.zip');show('Downloaded '+files.length+' files in one ZIP. Print on calibrated label stock.');
 }catch(e){show(e.message,true);}}
async function exportRecord(){const doc=current();if(!M.isMaster(doc))return show('Select a v9 master label first.',true);
 try{downloadBlob(new Blob([JSON.stringify(record(doc),null,2)],{type:'application/json'}),slug(doc.data['pkg.id'])+'.package-record.json');show('Canonical record JSON exported. Draft records remain unapproved.');}
 catch(e){show(e.message,true);}}
async function doPrint(){if(!$('#masterStockConfirm').checked)return show('Confirm physical stock before sending prints.',true);
 const driver=window.LabelPrinter;if(!driver?.getState().connected||driver.getState().modelId!==4097)return show('Connect a verified NIIMBOT B1 Pro first.',true);
 try{const entries=await prepare();if(!window.confirm('Print '+queue.reduce((x,q)=>x+q.copies,0)+' physical labels on the verified B1 Pro? Check each label and QR physically.'))return;
 let sent=0;
 for(const item of entries){for(let i=0;i<item.entry.copies;i++){
  const digest=await crypto.subtle.digest('SHA-256',await item.blob.arrayBuffer());const sha=[...new Uint8Array(digest)].map(x=>x.toString(16).padStart(2,'0')).join('');
  const saveRecord={schema:'nerdeus.print-snapshot.v1',rendererVersion:'9.0.0',id:C.UID(),createdAt:new Date().toISOString(),templateId:item.doc.id,name:item.doc.name+' / copy '+(i+1),data:C.clone(item.doc.data),template:C.clone(item.doc),profile:C.clone(item.doc.profile),width:C.W,height:C.H,sha256:sha,counts:item.colors,blob:item.blob};
  await app.dbAction('readwrite',store=>store.put(saveRecord));
  await driver.printPortraitCanvas(item.canvas,{density:3});sent++;show('Driver completed '+sent+' print request(s). Verify output on the printer.');
 }}show('Driver completed '+sent+' print request(s). Archive saved; inspect paper alignment, colors and QR scan.');
 }catch(e){show('Printing stopped: '+e.message,true);}}
$('#masterAddQueue').onclick=add;$('#masterExportZip').onclick=exportZip;$('#masterExportRecord').onclick=exportRecord;$('#masterPrintQueue').onclick=doPrint;
$('#masterLoadDriver').onclick=async()=>{try{await window.LabelPrinter.loadDriver();show('Driver loaded. Click Connect printer next.');}catch(e){show(e.message,true);}};
$('#masterConnectDriver').onclick=async()=>{try{await window.LabelPrinter.connect();show('Connected printer: '+(window.LabelPrinter.getState().modelId===4097?'B1 Pro verified':'unverified model — printing blocked'));}catch(e){show(e.message,true);}};
const oldGetState=app.getState;
window.LabelQueueV9={version:9,getItems:()=>queue.slice(),issues:allIssues,add,prepare,record,makeZip,renderQueue};
renderQueue();
})();
