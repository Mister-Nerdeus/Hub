/* Nerdeus Meals v14.1 acceptance — disposable Chromium browser context.
   No Bluetooth connection, physical printing, network writes or real user data. */
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const mod=process.env.RUNNER_TEMP?path.join(process.env.RUNNER_TEMP,'nls-qa/node_modules/playwright'):'playwright';
const {chromium}=require(mod);
const base=process.env.NLS_LABEL_STUDIO_URL||'https://nerdeus-label-studio-production.up.railway.app';
const artifacts=path.resolve('label-studio-deploy/tests/qa-artifacts');
fs.mkdirSync(artifacts,{recursive:true});
const checks=[];
function mark(name,passed,detail=''){checks.push({name,passed:!!passed,detail:String(detail)});if(!passed)throw Error(name+(detail?' — '+detail:''));}
async function fill(page,key,value){
 const el=page.locator('#nlsV14Flow [data-key="'+key+'"]');
 await el.fill(value);await el.press('Tab');
}
(async()=>{
 const browser=await chromium.launch({headless:true});
 let page;
 const pageErrors=[];
 try{
  const desktop=await browser.newContext({viewport:{width:1440,height:960}});
  page=await desktop.newPage();
  page.on('pageerror',e=>pageErrors.push(String(e.message)));
  const response=await page.goto(base+'/?view=create&release=v14.1',{waitUntil:'domcontentloaded',timeout:60000});
  mark('Production responds with HTTP 200',response&&response.status()===200,response?.status());
  await page.locator('#nlsV14Flow').waitFor({state:'visible',timeout:45000});
  mark('Guided welcome renders',await page.locator('#nlsV14Flow [data-nav="type"]').count()>=1);
  mark('Production status identifies v14.1',(await page.locator('#nlsBootStatus').innerText()).includes('v14.1'));
  await page.locator('#nlsV14Flow [data-nav="type"]').first().click();
  mark('All 17 canonical types selectable',await page.locator('#nlsV14Flow [data-type]').count()===17);
  await page.locator('#nlsV14Flow [data-type="dry_baking_mix"]').click();
  mark('Dry mix demands measured water and oil',await page.locator('#nlsV14Flow [data-key="waterAddition"]').count()===1&&await page.locator('#nlsV14Flow [data-key="oilAddition"]').count()===1);
  const actual={
   food:'White Bread Mix',id:'QA-20261103-A001',metric:'500 g',imperial:'17.6 oz',
   packaging:'VACUUM POUCH',contents:'Flour, yeast, dry milk, butter powder',
   allergens:'wheat, milk',portions:'1 loaf',
   actionText:'Mix thoroughly, knead and bake as directed',
   waterAddition:'300 mL',oilAddition:'15 mL'
  };
  for(const [key,val] of Object.entries(actual))await fill(page,key,val);
  await page.locator('#nlsV14Flow [data-key="storage"]').selectOption('COOL & DRY');
  await fill(page,'date1','2026-11-01');
  await fill(page,'date2','2026-11-02');
  await fill(page,'date3','2027-02-01');
  const footer=await page.evaluate(()=>window.__labelStudioTest.getCurrent().data['pkg.printInstruction']);
  mark('Printed footer includes actual water and oil',footer.includes('300 ML WATER')&&footer.includes('15 ML OIL')&&footer.includes('\n'),footer);
  await page.locator('#nlsV14Flow [data-nav="artwork"]').click();
  mark('Artwork preview is present',await page.locator('#nls14Canvas').count()===1);
  await page.locator('#nlsV14Flow [data-nav="review"]').click();
  await page.locator('#nlsV14Flow [data-review]').first().waitFor({state:'visible'});
  for(const element of await page.locator('#nlsV14Flow [data-review]').all())await element.check();
  await page.waitForFunction(()=>{
   const s=document.getElementById('nls14Preflight')?.textContent||'';
   return /passed software preflight|review issue|preflight failed/i.test(s);
  },null,{timeout:25000});
  const status=await page.locator('#nls14Preflight').innerText();
  mark('Reviewed dry mix passes shared preflight',status.includes('passed software preflight'),status.slice(0,600));
  const raster=await page.evaluate(()=>{
   const c=window.LabelCore,d=window.__labelStudioTest.getCurrent();
   const art=c.render(d),output=c.makePrinterRaster(art),colors=c.classify(output);
   return {art:[art.width,art.height],print:[output.width,output.height],colors};
  });
  mark('Art and print raster have exact dimensions',raster.art.join('x')==='591x827'&&raster.print.join('x')==='576x827',JSON.stringify(raster));
  mark('Print raster contains only pure red, black and white',raster.colors.other===0,JSON.stringify(raster.colors));
  mark('Print button enabled after software review',await page.locator('#nlsV14Flow [data-nav="print"]').isEnabled());
  await page.screenshot({path:path.join(artifacts,'v14_1-guided-reviewed.png'),fullPage:true});
  // Reload from the saved workspace, open the same local package without a backend.
  await page.reload({waitUntil:'domcontentloaded',timeout:60000});
  await page.locator('#nlsV14Flow').waitFor({state:'visible',timeout:45000});
  await page.locator('#nlsV14Flow [data-nav="saved"]').click();
  const saved=page.locator('#nlsV14Flow [data-doc]').filter({hasText:'White Bread Mix'});
  mark('Saved package survives page reload',await saved.count()===1);
  await saved.click();
  mark('Measured additions survive reload',
   await page.locator('#nlsV14Flow [data-key="waterAddition"]').inputValue()==='300 mL'&&
   await page.locator('#nlsV14Flow [data-key="oilAddition"]').inputValue()==='15 mL');
  // Different type must create a new package and keep the existing label.
  await page.locator('#nlsV14Flow [data-nav="type"]').click();
  await page.locator('#nlsV14Flow [data-type="raw_plain"]').click();
  mark('Raw protein fields are conditional',await page.locator('#nlsV14Flow [data-key="protein"]').count()===1&&
    await page.locator('#nlsV14Flow [data-key="cut"]').count()===1&&
    await page.locator('#nlsV14Flow [data-key="actionSource"]').count()===1);
  const raw=await page.evaluate(()=>{
   const state=window.__labelStudioTest.getState(),d=window.__labelStudioTest.getCurrent();
   return {id:d.data['pkg.id'],type:d.data['pkg.type'],count:state.templates.filter(x=>x.data?.['pkg.recordRole']==='package').length};
  });
  mark('New raw label has no borrowed package ID and keeps prior package',raw.id===''&&raw.type==='raw_plain'&&raw.count>=2,JSON.stringify(raw));
  // Importing a reviewed document as editable JSON must reset approvals and clear ID.
  const payload=await page.evaluate(()=>{
   const d=structuredClone(window.__labelStudioTest.getCurrent());
   d.data['pkg.id']='QA-IMPORT-001';
   for(const k of ['identityReviewed','quantityReviewed','storageReviewed','datesReviewed','allergensReviewed','actionVerified','artworkReviewed'])d.data['pkg.'+k]='1';
   d.data['pkg.recordRole']='package';
   return JSON.stringify(d);
  });
  await page.locator('#inputJSON').setInputFiles({name:'synthetic-reviewed-design.json',mimeType:'application/json',buffer:Buffer.from(payload)});
  const imported=await page.evaluate(()=>{
   const d=window.__labelStudioTest.getCurrent();
   return {role:d.data['pkg.recordRole'],id:d.data['pkg.id'],reviews:['identityReviewed','quantityReviewed','storageReviewed','datesReviewed','allergensReviewed','actionVerified','artworkReviewed'].map(k=>d.data['pkg.'+k])};
  });
  mark('Imported design never retains package ID or review approvals',
   imported.role==='design-import'&&imported.id===''&&imported.reviews.every(v=>v==='0'),JSON.stringify(imported));
  // Mobile route smoke test in a separate disposable context.
  const mobile=await browser.newContext({viewport:{width:390,height:844},isMobile:true,hasTouch:true});
  const phone=await mobile.newPage();
  const mobileResponse=await phone.goto(base+'/?view=create&release=v14.1',{waitUntil:'domcontentloaded',timeout:60000});
  await phone.locator('#nlsV14Flow').waitFor({state:'visible',timeout:45000});
  await phone.locator('#nlsV14Flow [data-nav="type"]').first().click();
  await phone.locator('#nlsV14Flow [data-type="raw_plain"]').click();
  mark('Mobile guided form is available',mobileResponse?.status()===200&&await phone.locator('#nlsV14Flow [data-key="protein"]').isVisible());
  await phone.screenshot({path:path.join(artifacts,'v14_1-mobile-raw-draft.png'),fullPage:true});
  mark('No browser JavaScript exceptions during desktop flow',pageErrors.length===0,pageErrors.join(' | ').slice(0,600));
  await mobile.close();await desktop.close();
 }catch(error){
  console.error('BROWSER QA FAILURE:',error.stack||String(error));
  if(page)try{await page.screenshot({path:path.join(artifacts,'v14_1-failure.png'),fullPage:true});}catch(_){}
  process.exitCode=1;
 }finally{
  fs.writeFileSync(path.join(artifacts,'results.json'),JSON.stringify({base,checks,pending:['Physical B1 Pro printing','QR scan','Freezer/condensation durability'],javascriptErrors:pageErrors},null,2));
  console.log('BROWSER ACCEPTANCE RESULTS',JSON.stringify({passed:checks.filter(c=>c.passed).length,total:checks.length,checks}));
  await browser.close();
 }
})().catch(e=>{console.error(e);process.exitCode=1;});
