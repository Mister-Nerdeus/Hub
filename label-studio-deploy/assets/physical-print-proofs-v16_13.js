/* Nerdeus Label Studio v16.13 — physical artwork proof desk.
   Synthetic proof images; no package writes, no printer commands, no certification. */
(function(){
'use strict';
const RELEASE='16.13';
const SUBJECTS=[
 {id:'resampled_ribeye_v1611',type:'raw_plain',title:'Ribeye steak',status:'Design accepted · print pending'},
 {id:'resampled_lasagna_v1611',type:'cooked_meal',title:'Lasagna',status:'Design accepted · print pending'},
 {id:'resampled_broccoli_v1611',type:'ingredient_single',title:'Broccoli florets',status:'Design accepted · print pending'},
 {id:'resampled_stock_pot_v1611',type:'sauce_stock_concentrate',title:'Stock pot',status:'Category illustration · print pending'}
];
const CHECKS=[
 ['stock','50 × 70 mm red-and-black thermal stock used'],
 ['registration','Red and black channels align correctly'],
 ['detail','Fine black engraving is readable, without blobs'],
 ['edges','Full artwork visible; no cropped text or frame'],
 ['qr','Printed package-ID QR code scans correctly']
];
const id=x=>document.getElementById(x);
function init(){
 const C=window.LabelCore,M=window.LabelMasterV9,FX=window.NerdeusReferenceFixturesV167,
  ART=window.NerdeusArtworkCandidatesV1612,B=window.LabelBackgrounds,K=window.LabelCuts;
 const anchor=id('nls-candidate-actions-v1611')||id('nls-proof-lab-v164')||document.querySelector('.nls-workflow');
 if(!anchor||!C||!M||!FX||!ART||!B||!K||id('nls-v1613-proof-desk'))return;
 const section=document.createElement('section');section.id='nls-v1613-proof-desk';
 section.setAttribute('aria-label','NIIMBOT physical artwork test desk');
 section.innerHTML=`
  <h3>Physical print-proof preparation · four artworks</h3>
  <p class="nls13-info">Download a clearly watermarked, synthetic 300 DPI test label for each reviewed subject. Never use these files as food labels. A software pass or download is <strong>not</strong> a B1 Pro print approval.</p>
  <div id="nls13-buttons" class="nls13-grid"></div>
  <h4>Record what you observe on the actual NIIMBOT B1 Pro print</h4>
  <p class="nls13-info">These are manual observations. They are not automatically verified, not stored in your packages and never unlock production printing.</p>
  <label class="nls13-select">Artwork tested <select id="nls13-subject"></select></label>
  <div id="nls13-checks"></div>
  <label class="nls13-select">Observed result
   <select id="nls13-result"><option value="not-tested">Not tested</option><option value="pass-reported">Passed — user reported</option><option value="fail-reported">Failed — user reported</option></select>
  </label>
  <label class="nls13-select">Printed-label notes <textarea id="nls13-notes" maxlength="750" rows="2" placeholder="e.g. red shifted 1 mm, QR unreadable, ribeye stippling filled in"></textarea></label>
  <button type="button" id="nls13-report">Download observation JSON</button>
  <p role="status" id="nls13-status">Ready for synthetic test-proof downloads. No printer or package action has occurred.</p>`;
 section.style.cssText='margin:14px 18px;padding:16px;border:1px solid #b1bac6;border-left:5px solid #c5291b;border-radius:10px;background:var(--surface,#fff);color:var(--ink,#1c2834);font:13px/1.55 system-ui,Arial,sans-serif';
 const style=document.createElement('style');style.textContent=`
  #nls-v1613-proof-desk h3{margin:0 0 5px;font-size:17px}
  #nls-v1613-proof-desk h4{font-size:14px;margin:15px 0 5px}
  #nls-v1613-proof-desk .nls13-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(190px,1fr));gap:10px;margin:12px 0}
  #nls-v1613-proof-desk .nls13-card{border:1px solid #afb8c5;border-radius:8px;padding:12px;background:var(--surface,#fff)}
  #nls-v1613-proof-desk .nls13-card strong{display:block}
  #nls-v1613-proof-desk small,#nls-v1613-proof-desk .nls13-info{font-size:12px;color:var(--muted,#697483)}
  #nls-v1613-proof-desk button{margin-top:8px;border:1px solid #b0bcc7;border-radius:6px;padding:9px;font-weight:700;background:transparent;color:inherit;cursor:pointer}
  #nls-v1613-proof-desk button:disabled{opacity:.5;cursor:wait}
  #nls-v1613-proof-desk .nls13-select{display:flex;flex-direction:column;margin:8px 0;gap:4px}
  #nls-v1613-proof-desk .nls13-select select,#nls-v1613-proof-desk textarea{width:100%;max-width:680px;box-sizing:border-box;padding:8px;border:1px solid #b3bdc7;border-radius:5px;background:var(--surface,#fff);color:inherit}
  #nls13-checks{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:7px}
  #nls13-checks label{display:flex;gap:7px;align-items:flex-start;font-size:12px}
  #nls13-status{font-weight:600;font-size:12px}
  @media(max-width:650px){#nls-v1613-proof-desk{margin:8px;padding:10px}}`;
 document.head.appendChild(style);
 anchor.insertAdjacentElement('afterend',section);
 const status=id('nls13-status'),cardHost=id('nls13-buttons'),subject=id('nls13-subject');
 function statusText(value){status.textContent=value;}
 async function buildTest(sub){
  const def=M.byId.get(sub.type);if(!def)throw Error('Unknown example type: '+sub.type);
  const label=M.make(def);
  FX.prepare(label,sub.type);
  label.data['pkg.id']='QA-TEST-'+sub.type.replace(/[^a-z]/g,'').slice(0,8).toUpperCase();
  for(let n=1;n<=4;n++)if(label.data['pkg.date'+n+'Type'])label.data['pkg.date'+n]=/use_by|best_quality_by/.test(label.data['pkg.date'+n+'Type'])?'2027-02-01':'2026-11-05';
  M.derived(label);FX.finalize(label);
  const result=ART.attachToDocument(label,sub.id,{sample:true});if(!result.ok)throw Error(result.reason||'Candidate was not attached');
  await Promise.all([B.ensureDocument(label),K.ensureDocument(label)]);
  const canvas=C.render(label),before=C.classify(canvas);
  if(canvas.width!==591||canvas.height!==827||before.other)throw Error('Invalid label raster dimensions or colors');
  const ctx=canvas.getContext('2d',{willReadFrequently:true});
  // Replace real-use instructions in the footer: this output must not look like an approved food label.
  ctx.fillStyle='#000000';ctx.fillRect(9,736,573,86);
  ctx.fillStyle='#FFFFFF';ctx.textAlign='center';ctx.textBaseline='middle';
  ctx.font='bold 27px Arial,sans-serif';ctx.fillText('PRINT TEST ONLY',295,763);
  ctx.font='bold 18px Arial,sans-serif';ctx.fillText('NOT FOR FOOD USE · VERIFY PRINT / QR',295,795,540);
  // Canvas text is antialiased; hard-quantize just this test footer back to 1-bit B/W.
  const footer=ctx.getImageData(9,736,573,86),px=footer.data;
  for(let i=0;i<px.length;i+=4){const on=(px[i]+px[i+1]+px[i+2])/3>=128?255:0;px[i]=px[i+1]=px[i+2]=on;px[i+3]=255;}
  ctx.putImageData(footer,9,736);
  const check=C.classify(canvas),raster=C.makePrinterRaster(canvas),printCheck=C.classify(raster);
  if(check.other||printCheck.other||raster.width!==576||raster.height!==827)throw Error('Noncanonical output or printer raster');
  return {canvas,raster,black:printCheck.black,red:printCheck.red};
 }
 async function downloadProof(sub,btn){
  btn.disabled=true;statusText('Preparing a marked test proof for '+sub.title+'…');
  try{
   const result=await buildTest(sub);
   const name='Nerdeus-'+sub.type+'-B1Pro-PRINT-TEST-591x827-300dpi.png';
   C.download(await C.canvasBlob(result.canvas),name);
   statusText(sub.title+' test proof downloaded (591 × 827, 300 DPI, black '+result.black.toLocaleString()+' / red '+result.red.toLocaleString()+' pixels). No print approval granted.');
  }catch(error){statusText('Could not prepare test proof: '+String(error.message||error));}
  finally{btn.disabled=false;}
 }
 for(const sub of SUBJECTS){
  const card=document.createElement('div');card.className='nls13-card';
  const heading=document.createElement('strong');heading.textContent=sub.title;
  const note=document.createElement('small');note.textContent=sub.status;
  const btn=document.createElement('button');btn.type='button';btn.textContent='Download 300 DPI test label';btn.addEventListener('click',()=>downloadProof(sub,btn));
  card.append(heading,note,btn);cardHost.appendChild(card);
  const opt=document.createElement('option');opt.value=sub.id;opt.textContent=sub.title;subject.appendChild(opt);
 }
 const checks=id('nls13-checks');
 for(const [key,text] of CHECKS){
  const label=document.createElement('label'),control=document.createElement('input');control.type='checkbox';control.dataset.check=key;label.append(control,document.createTextNode(text));checks.appendChild(label);
 }
 id('nls13-report').addEventListener('click',()=>{
  const review=ART.lookup(subject.value),checksState={};
  for(const c of checks.querySelectorAll('input[data-check]'))checksState[c.dataset.check]=c.checked;
  const report={
   schema:'nerdeus.artwork.physical-observation.v1',
   generatedAt:new Date().toISOString(),source:'user-entered observations — NOT app-verified',
   candidate:review?.id||subject.value,sha256:review?.sha256||null,
   currentSoftwareDecision:review?.visualReview?.status||null,
   observedResult:id('nls13-result').value,checks:checksState,notes:id('nls13-notes').value.slice(0,750),
   printer:'NIIMBOT B1 Pro (user must confirm)',stock:'50x70 mm dual-color (user must confirm)',
   sampleLabel:true,productionPrintAuthorized:false,storedInPackage:false
  };
  C.download(new Blob([JSON.stringify(report,null,2)],{type:'application/json'}),'Nerdeus-B1Pro-observation-'+subject.value+'.json');
  statusText('Observation report exported. It is user-reported, not independently certified; no package or artwork status changed.');
 });
 window.NerdeusPhysicalProofV1613={
  version:RELEASE,subjects:SUBJECTS.map(x=>({...x})),downloadSample:buildTest,
  isUnapprovedResampled(doc){
   if(!doc||!Array.isArray(doc.elements))return false;
   const art=doc.elements.find(e=>e.name==='Hero food illustration'&&e.visible!==false);
   if(!art)return false;
   const src=doc.assets?.[art.assetId];
   return /^resampled_/.test(String(art.assetId||''))||/^user-zip-resample/.test(String(src?.origin||''));
  }
 };
}
if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
})();