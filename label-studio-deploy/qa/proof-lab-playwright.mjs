import { chromium } from "playwright";
import fs from "node:fs/promises";
import path from "node:path";

const outDir = path.resolve("label-studio-deploy/qa/output");
await fs.mkdir(outDir, {recursive:true});
const target="https://nerdeus-label-studio-production.up.railway.app/?view=proof&release=v16.4";
const browser=await chromium.launch({headless:true,args:["--no-sandbox"]});
const context=await browser.newContext({viewport:{width:1440,height:960},acceptDownloads:true,deviceScaleFactor:1});
const page=await context.newPage();
const browserErrors=[];
page.on("pageerror",e=>browserErrors.push("PAGE "+String(e?.stack||e)));
page.on("console",m=>{if(m.type()==="error")browserErrors.push("CONSOLE "+m.text())});
page.on("requestfailed",r=>browserErrors.push("NETWORK "+r.url()+" "+String(r.failure()?.errorText)));
let summary={},report=null;
try {
 const response=await page.goto(target,{waitUntil:"domcontentloaded",timeout:120000});
 summary.httpStatus=response?.status()??null;
 summary.url=page.url();
 summary.startup=await page.locator("#nlsBootStatus").innerText({timeout:60000});
 await page.locator("#nls-proof-lab-v164").waitFor({state:"visible",timeout:120000});
 await page.waitForFunction(()=>document.querySelectorAll("#nlspl-grid canvas").length===17,{}, {timeout:240000});
 summary.renderStatus=await page.locator("#nlspl-status").innerText();
 summary.renderedLabels=await page.locator("#nlspl-grid canvas").count();
 await page.locator("#nlspl-test").click();
 await page.waitForFunction(()=>window.NerdeusProofLabV164?.getResults?.()?.rows?.length===102,{}, {timeout:240000});
 report=await page.evaluate(()=>window.NerdeusProofLabV164.getResults());
 summary.testStatus=await page.locator("#nlspl-status").innerText();
 await fs.writeFile(path.join(outDir,"regression.json"),JSON.stringify(report,null,2));
 await page.locator("#nlspl-details").evaluate(n=>n.open=true);
 await page.locator("#nls-proof-lab-v164").screenshot({path:path.join(outDir,"proof-lab-browser.png"),animations:"disabled",timeout:60000});
 try {
  const downloadPromise=page.waitForEvent("download",{timeout:120000});
  await page.locator("#nlspl-png").click();
  const dl=await downloadPromise;
  await dl.saveAs(path.join(outDir,"17-label-proof-sheet.png"));
  summary.proofSheetSaved=true;
 } catch(e){summary.proofSheetSaved=false;browserErrors.push("PROOF SHEET "+String(e))}
 summary.checks=report?.rows?.length??0;
 summary.passed=report?.passed??null;
 summary.failed=report?.failed??null;
 summary.failedDetails=(report?.rows||[]).filter(r=>!r.pass);
 summary.browserErrors=browserErrors;
} catch(e){
 summary.error=String(e?.stack||e);
 summary.browserErrors=browserErrors;
 await page.screenshot({path:path.join(outDir,"failed-browser.png"),fullPage:true}).catch(()=>{});
} finally {
 await fs.writeFile(path.join(outDir,"summary.json"),JSON.stringify(summary,null,2));
 const lines=[
 "# Nerdeus Meals — Browser regression",
 "",
 "- URL: "+target,
 "- HTTP: "+String(summary.httpStatus),
 "- Startup: "+String(summary.startup),
 "- Rendered: "+String(summary.renderedLabels),
 "- QA: "+String(summary.passed)+"/"+String(summary.checks)+" passed; "+String(summary.failed)+" failed",
 "- Proof sheet saved: "+String(summary.proofSheetSaved),
 "- Browser errors: "+String(browserErrors.length),
 "",
 "## Failures",
 ...(summary.failedDetails||[]).map(r=>"- "+r.type+" | "+r.case+": "+(r.issues||[]).join("; ")),
 ...(summary.error?["","## Test runner error",summary.error]:[]),
 "",
 "## Browser errors",
 ...browserErrors.map(x=>"- "+x)
 ];
 await fs.writeFile(path.join(outDir,"summary.md"),lines.join("\n"));
 console.log(JSON.stringify({httpStatus:summary.httpStatus,renderedLabels:summary.renderedLabels,checks:summary.checks,passed:summary.passed,failed:summary.failed,proofSheetSaved:summary.proofSheetSaved,browserErrors:browserErrors.length,error:summary.error},null,2));
 await browser.close();
}
if(summary.error||summary.renderedLabels!==17||summary.checks!==102||summary.failed>0||!summary.proofSheetSaved)process.exitCode=1;
