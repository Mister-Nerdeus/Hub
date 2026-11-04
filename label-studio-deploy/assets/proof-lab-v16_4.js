/* Nerdeus Meals v16.4 — read-only heritage visual proof lab.
   All documents created here are temporary examples, never saved or approved for food packaging. */
(function(){
'use strict';
const VERSION='16.4';
const DEMO_DATE='2026-11-02', DEMO_BEST='2027-02-01';
const escapeHtml=s=>String(s??'').replace(/[&<>"']/g,x=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[x]));
const delay=()=>new Promise(resolve=>setTimeout(resolve,0));
function init(){
 const M=window.LabelMasterV9,C=window.LabelCore,B=window.LabelBackgrounds,K=window.LabelCuts;
 if(!M?.defs?.length||!C?.render||!B?.ensureDocument||!K?.ensureDocument)return;
 if(document.getElementById('nls-proof-lab-v164'))return;
 const anchor=document.querySelector('.nls-app-spec')||document.querySelector('.nls-workflow');
 if(!anchor)return;
 const box=document.createElement('section');
 box.id='nls-proof-lab-v164';
 box.setAttribute('aria-label','17-label visual proof lab');
 box.innerHTML='<div class="nlspl-top"><div><strong>Approved Heritage — 17-label visual proof lab</strong><p>Uses the live label renderer. Example names, dates and QR IDs are synthetic. Never use these proofs as food labels.</p></div><div class="nlspl-actions"><button type="button" id="nlspl-build">Generate 17 labels</button><button type="button" id="nlspl-test">Run 102 checks</button><button type="button" id="nlspl-png" disabled>Download proof sheet PNG</button><button type="button" id="nlspl-json" disabled>Download QA results</button></div></div><p id="nlspl-status" role="status" aria-live="polite">Ready. Nothing has been printed or saved.</p><details id="nlspl-details"><summary>View 17 label proofs and findings</summary><div class="nlspl-grid" id="nlspl-grid"></div><div id="nlspl-results"></div></details>';
 const css=document.createElement('style');
 css.textContent='#nls-proof-lab-v164{margin:14px 18px 16px;padding:16px;background:var(--surface,#fff);color:var(--ink,#1a2634);border:1px solid #b0bdc8;border-left:5px solid #c72420;border-radius:10px;font:13px/1.5 system-ui,Arial,sans-serif}.nlspl-top{display:flex;justify-content:space-between;gap:18px;flex-wrap:wrap}.nlspl-top strong{font-size:17px;display:block}.nlspl-top p{margin:3px 0 10px;max-width:600px}.nlspl-actions{display:flex;gap:8px;flex-wrap:wrap;align-items:center}.nlspl-actions button{padding:10px 12px;min-height:40px;border:1px solid #9fabb7;border-radius:7px;background:transparent;color:inherit;cursor:pointer;font-weight:700}.nlspl-actions button:first-child{background:#bc211d;color:white;border-color:#bc211d}.nlspl-actions button:disabled{opacity:.45;cursor:not-allowed}#nlspl-status{font-size:12px;font-weight:650}.nlspl-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(175px,1fr));gap:13px;margin-top:14px}.nlspl-card{padding:8px;border:1px solid #b6c0ca;border-radius:8px;background:#fff;color:#111}.nlspl-card strong{display:block;font-size:12px;margin-bottom:5px}.nlspl-card canvas{display:block;width:100%;height:auto;background:#fff;image-rendering:pixelated}.nlspl-card small{display:block;font-size:10px;color:#555;margin-top:5px}.nlspl-error{color:#a3241c;font-weight:bold}#nlspl-results{white-space:pre-wrap;font:12px/1.5 ui-monospace,monospace;max-height:300px;overflow:auto;margin-top:10px}@media(max-width:650px){#nls-proof-lab-v164{margin:8px;padding:10px}.nlspl-grid{grid-template-columns:repeat(2,minmax(0,1fr))}}';
 document.head.appendChild(css);
 anchor.insertAdjacentElement('afterend',box);
 const find=s=>box.querySelector(s),status=find('#nlspl-status'),grid=find('#nlspl-grid'),resultNode=find('#nlspl-results'),details=find('#nlspl-details');
 const buildBtn=find('#nlspl-build'),testBtn=find('#nlspl-test'),pngBtn=find('#nlspl-png'),jsonBtn=find('#nlspl-json');
 let examples=[],qa=null,busy=false;
 const lookup=(doc,name)=>doc.elements.find(e=>e.name===name);
 function sample(def,index){
  const doc=M.make(def);
  const d=doc.data;
  d['pkg.id']='QA-'+String(index+1).padStart(3,'0')+'-V164';
  // Demo dates exist only inside this temporary preview. No real package record is touched.
  for(let n=1;n<=4;n++){
   if(!d['pkg.date'+n+'Type'])continue;
   d['pkg.date'+n]=/use_by|best_quality_by/.test(d['pkg.date'+n+'Type'])?DEMO_BEST:DEMO_DATE;
  }
  M.derived(doc);
  return doc;
 }
 function checkBase(doc){
  const out=[],require=(ok,message)=>{if(!ok)out.push(message)};
  const get=name=>lookup(doc,name);
  require(doc.data['pkg.templateRevision']==='v16.1','Default revision is not v16.1');
  require(get('Artwork edge botanicals')?.assetId==='BG-102','BG-102 botanical side art not selected');
  require(get('Main product title')?.maxLines===2,'Product title is not two-line capable');
  require(get('Main product title')?.color==='white','Product title is not white');
  require(get('Red product header')?.radius===0,'Red header is not square-cornered');
  require(get('Black condition strip')?.radius===0,'Black state bar is not square-cornered');
  require(get('Black instruction footer')?.radius===0,'Black footer is not square-cornered');
  require(get('Metric quantity')?.fontSize===get('Imperial quantity')?.fontSize,'Metric and imperial font sizes differ');
  require(get('QR: package ID')?.text==='{{pkg.id}}','QR does not bind to package ID');
  require(get('Reference allergen capsules')?.showWhen==='pkg.allergens','Allergen pills are not conditional');
  return out;
 }
 async function build(){
  if(busy)return;busy=true;buildBtn.disabled=testBtn.disabled=true;
  pngBtn.disabled=true;examples=[];grid.textContent='';resultNode.textContent='';
  try{
   for(let i=0;i<M.defs.length;i++){
    const def=M.defs[i],doc=sample(def,i);
    await Promise.all([B.ensureDocument(doc),K.ensureDocument(doc)]);
    const image=C.render(doc),printer=C.makePrinterRaster(image),colors=C.classify(printer);
    if(image.width!==591||image.height!==827||printer.width!==576||printer.height!==827||colors.other)throw Error(def.id+': unexpected raster geometry or colors');
    examples.push({def,doc,canvas:image,printer,colors});
    const card=document.createElement('article');card.className='nlspl-card';
    const title=document.createElement('strong');title.textContent=(i+1)+'. '+def.label;
    const preview=document.createElement('canvas');preview.width=591;preview.height=827;
    preview.getContext('2d').drawImage(image,0,0);
    const note=document.createElement('small');note.textContent='SAMPLE / NOT FOR PACKAGING · '+def.id;
    card.append(title,preview,note);grid.appendChild(card);
    status.textContent='Rendered '+(i+1)+' / '+M.defs.length+' labels.';
    await delay();
   }
   details.open=true;
   status.textContent='Rendered '+examples.length+' actual label previews. Demo-only data; printer and QR scan remain unverified.';
   pngBtn.disabled=false;
  }catch(error){status.textContent='Proof generation failed: '+String(error.message||error);resultNode.textContent='Nothing was written to saved packages or print archives.';}
  finally{busy=false;buildBtn.disabled=testBtn.disabled=false;}
 }
 async function runQA(){
  if(busy)return;busy=true;buildBtn.disabled=testBtn.disabled=true;jsonBtn.disabled=true;
  const rows=[];
  try{
   for(let i=0;i<M.defs.length;i++){
    const def=M.defs[i],sampleDoc=sample(def,i);
    const base=checkBase(sampleDoc);
    try{
     await Promise.all([B.ensureDocument(sampleDoc),K.ensureDocument(sampleDoc)]);
     const c=C.render(sampleDoc),r=C.makePrinterRaster(c),color=C.classify(r);
     if(c.width!==591||c.height!==827||r.width!==576||r.height!==827)base.push('Wrong raster dimensions');
     if(color.other||color.red===0||color.black===0)base.push('Missing or unexpected thermal color');
     const qr=lookup(sampleDoc,'QR: package ID');
     if(qr&&window.LabelQR){
      const matrix=window.LabelQR.matrix(sampleDoc.data['pkg.id']);
      const modulePx=Math.floor(Math.min(qr.w,qr.h)/(matrix.n+8));
      if(modulePx<3)base.push('QR module is below 3px');
     }
     base.push(...C.diagnostics(sampleDoc).filter(v=>/outside artwork bounds|text may clip vertically|text exceeds|font .* too small|QR modules|unresolved data key/i.test(v)));
    }catch(error){base.push('Render failed: '+String(error.message||error));}
    rows.push({type:def.id,case:'default composition and exact raster',pass:base.length===0,issues:base});
    const long=sample(def,i);long.data['pkg.food']='EXTRA LONG FAMILY STYLE '+def.food+' WITH ADDITIONAL PREPARATION DETAILS';M.derived(long);
    let invalid=M.validate(long);rows.push({type:def.id,case:'long product name blocked',pass:invalid.some(x=>/product name is too long|reference label header/i.test(x)),issues:invalid.filter(x=>/product name|header/i.test(x))});
    const allergens=sample(def,i);allergens.data['pkg.allergens']='WHEAT, MILK, EGGS, SOY, FISH, SHELLFISH, SESAME, PEANUTS';M.derived(allergens);
    invalid=M.validate(allergens);rows.push({type:def.id,case:'allergen overflow flagged',pass:invalid.some(x=>/allergen list cannot fit/i.test(x)),issues:invalid.filter(x=>/allergen/i.test(x))});
    const four=sample(def,i);for(let n=1;n<=4;n++){four.data['pkg.date'+n+'Type']=['prepared','packed','frozen','best_quality_by'][n-1];four.data['pkg.date'+n]=n===4?DEMO_BEST:DEMO_DATE;}M.derived(four);
    const dates=[1,2,3,4].every(n=>!!four.data['pkg.date'+n+'Display']&&!!lookup(four,'Event '+n+' date'));
    rows.push({type:def.id,case:'four date rows',pass:dates,issues:dates?[]:['Dated event display missing']});
    const noArt=sample(def,i);noArt.elements=noArt.elements.filter(e=>e.name!=='Hero food illustration');noArt.data['pkg.artworkPlaceholder']='ARTWORK NOT SELECTED';noArt.data['pkg.textOnlyApproved']='0';M.derived(noArt);
    rows.push({type:def.id,case:'no-artwork state',pass:!lookup(noArt,'Hero food illustration')&&!!lookup(noArt,'Unapproved artwork placeholder'),issues:[]});
    const longFooter=sample(def,i);longFooter.data['pkg.actionText']='UNVERIFIED LONG PREPARATION DIRECTIONS THAT CANNOT FIT IN A SMALL PRINTED INSTRUCTION FOOTER';M.derived(longFooter);
    invalid=M.validate(longFooter);rows.push({type:def.id,case:'footer overflow blocked',pass:invalid.some(x=>/footer|handling instruction/i.test(x)),issues:invalid.filter(x=>/footer|handling instruction/i.test(x))});
    status.textContent='Checked '+(i+1)+' / '+M.defs.length+' types.';
    await delay();
   }
   const passed=rows.filter(r=>r.pass).length;
   qa={suite:'Nerdeus heritage proof v16.4',createdAt:new Date().toISOString(),cases:rows.length,passed,failed:rows.length-passed,physicalPrinterVerified:false,syntheticDataOnly:true,rows};
   resultNode.textContent=rows.filter(r=>!r.pass).map(r=>r.type+' — '+r.case+': '+(r.issues.join(' | ')||'Check failed')).join('\n')||'All programmed checks passed. Visual review and physical print are still required.';
   status.textContent=passed+'/'+rows.length+' software checks passed. '+(rows.length-passed)+' failed. Physical label printing not verified.';
   jsonBtn.disabled=false;details.open=true;
  }catch(error){status.textContent='QA interrupted: '+String(error.message||error);}
  finally{busy=false;buildBtn.disabled=testBtn.disabled=false;}
 }
 function download(blob,filename){if(!blob)throw Error('No output bytes');const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),15000);}
 async function sheet(){
  if(examples.length!==M.defs.length)throw Error('Generate all 17 proofs first.');
  // No label artwork is resampled. Large sheet is for review, NOT direct thermal printing.
  const columns=3,gutter=24,header=82,rowHeight=827+header+gutter,rows=Math.ceil(examples.length/columns);
  const canvas=document.createElement('canvas');canvas.width=columns*(591+gutter)+gutter;canvas.height=rows*rowHeight+gutter;
  const g=canvas.getContext('2d');g.fillStyle='#fff';g.fillRect(0,0,canvas.width,canvas.height);g.textBaseline='top';g.fillStyle='#000';
  for(let i=0;i<examples.length;i++){
   const item=examples[i],x=gutter+(i%columns)*(591+gutter),y=gutter+Math.floor(i/columns)*rowHeight;
   g.font='bold 23px Arial,sans-serif';g.fillText(String(i+1).padStart(2,'0')+' · '+item.def.label,x,y,585);
   g.font='bold 17px Arial,sans-serif';g.fillText('SAMPLE DATA ONLY · NOT FOR FOOD PACKAGING',x,y+32,585);
   g.drawImage(item.canvas,x,y+header); // exact 591 x 827 pixels
  }
  const blob=await new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('PNG encoding failed')),'image/png'));
  download(blob,'Nerdeus-17-Label-Heritage-Proof-v16.4.png');
 }
 buildBtn.addEventListener('click',build);
 testBtn.addEventListener('click',runQA);
 pngBtn.addEventListener('click',()=>sheet().catch(e=>{status.textContent='Proof export failed: '+String(e.message||e)}));
 jsonBtn.addEventListener('click',()=>{if(qa)download(new Blob([JSON.stringify(qa,null,2)],{type:'application/json'}),'Nerdeus-Heritage-102-Case-QA-v16.4.json')});
 window.NerdeusProofLabV164={version:VERSION,run:build,runQA,getResults:()=>qa};
 if(new URLSearchParams(location.search).get('view')==='proof'){details.open=true;build();}
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();