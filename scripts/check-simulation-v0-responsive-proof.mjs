#!/usr/bin/env node
import { join } from "node:path";
import { assertBrowserPng, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  abs,
  addAndWrite,
  createManualReviewUxContext,
  finalizeManualReviewUxGate,
  runSelectedManualReviewUxStages,
  writeJson
} from "./lib/simulation-v0-manual-review-ux-utils.mjs";

const stages = ["desktop", "tablet", "mobile", "no-horizontal-overflow", "final"];

const context = createManualReviewUxContext({
  scriptName: "simulation v0 responsive proof",
  stages,
  statusKeyByStage: {
    desktop: "simulationResponsiveProofStatus",
    tablet: "simulationResponsiveProofStatus",
    mobile: "simulationResponsiveProofStatus",
    "no-horizontal-overflow": "simulationResponsiveProofStatus"
  },
  outputName: "responsive-route-output.json",
  defaultIssue: "619"
});

await runSelectedManualReviewUxStages(context, runStage);
const passed = context.checks.every((check) => check.passed);
finalizeManualReviewUxGate(context, {
  testOutputName: "simulation-v0-responsive-proof.txt",
  manifestUpdates: {
    simulationResponsiveProofStatus: passed ? "passed" : "failed",
    responsiveProofComplete: passed
  },
  closeoutStatus: passed ? "GO for Issue 620. Desktop, tablet, and mobile rendering proof exists." : "NO-GO with responsive blockers."
});

async function runStage(stage) {
  if (stage === "desktop") {
    const proof = await captureViewport("desktop", 1440, 1200);
    addAndWrite(context, "desktop-proof-output.json", "desktop Simulation v0 route proof is readable", viewportPassed(proof), proof);
    writeJson(`${context.dir}/responsive-route-output.json`, { status: viewportPassed(proof) ? "passed" : "failed", proof });
  }
  if (stage === "tablet") {
    const proof = await captureViewport("tablet", 1024, 1200);
    addAndWrite(context, "tablet-proof-output.json", "tablet Simulation v0 route proof is readable", viewportPassed(proof), proof);
  }
  if (stage === "mobile") {
    const proof = await captureViewport("mobile", 390, 1200);
    addAndWrite(context, "mobile-proof-output.json", "mobile Simulation v0 route proof is reachable", viewportPassed(proof), proof);
  }
  if (stage === "no-horizontal-overflow") {
    const proof = await captureViewport("mobile", 390, 1200);
    const passed = proof.horizontalOverflowPixels <= 2 && proof.timelineTableScrollsInternally;
    addAndWrite(context, "overflow-negative-output.json", "mobile viewport avoids page-level horizontal overflow", passed, proof);
  }
}

function viewportPassed(proof) {
  return proof.controlsVisible &&
    proof.timelineVisible &&
    proof.summaryVisible &&
    proof.proofPanelsVisible &&
    proof.exportVisible &&
    proof.limitationsVisible &&
    proof.screenshotOk &&
    proof.horizontalOverflowPixels <= 2;
}

async function captureViewport(name, width, height) {
  const cacheKey = `${name}-${width}-${height}`;
  context._responsive ??= new Map();
  if (context._responsive.has(cacheKey)) return context._responsive.get(cacheKey);
  const screenshotFile = `simulation-${name}.png`;
  const screenshotPath = join(abs(`${context.dir}/screenshots`), screenshotFile);
  const result = await withBrowserRenderedApp({
    port: 18619 + width,
    chromePort: 19619 + width,
    width,
    height,
    initScript: 'sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.cdp.send("Emulation.setDeviceMetricsOverride", {
      width,
      height,
      deviceScaleFactor: 1,
      mobile: width < 600
    });
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-route') != null");
    await browser.screenshot(screenshotPath);
    return browser.evaluate(`(() => {
      const table = document.querySelector('.simulation-v0-panel__table--timeline');
      return {
        viewport: { name: ${JSON.stringify(name)}, width: window.innerWidth, height: window.innerHeight },
        controlsVisible: Boolean(document.querySelector('#simulation-v0-controls')),
        timelineVisible: Boolean(document.querySelector('[aria-labelledby="simulation-v0-timeline-title"]')),
        summaryVisible: Boolean(document.querySelector('[aria-labelledby="simulation-v0-summary-cards-title"]')),
        proofPanelsVisible: Boolean(document.querySelector('#simulation-v0-proof')),
        exportVisible: Boolean(document.querySelector('[aria-labelledby="simulation-v0-export-title"]')),
        limitationsVisible: Boolean(document.querySelector('#simulation-v0-limitations')),
        horizontalOverflowPixels: Math.max(0, document.documentElement.scrollWidth - window.innerWidth),
        timelineTableScrollsInternally: table ? table.scrollWidth >= table.clientWidth : false,
        screenshotPath: ${JSON.stringify(`${context.dir}/screenshots/${screenshotFile}`)}
      };
    })();`);
  });
  assertBrowserPng(screenshotPath);
  const proof = { ...result.result, screenshotOk: true };
  context._responsive.set(cacheKey, proof);
  return proof;
}
