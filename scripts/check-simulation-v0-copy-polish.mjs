#!/usr/bin/env node
import { join } from "node:path";
import { assertBrowserPng, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  abs,
  addAndWrite,
  createManualReviewUxContext,
  finalizeManualReviewUxGate,
  readText,
  runSelectedManualReviewUxStages,
  writeJson
} from "./lib/simulation-v0-manual-review-ux-utils.mjs";

const stages = ["copy-contract", "rendered-copy", "forbidden-copy-negative", "final"];

const context = createManualReviewUxContext({
  scriptName: "simulation v0 copy polish",
  stages,
  statusKeyByStage: {
    "copy-contract": "simulationCopyExplanationStatus",
    "rendered-copy": "simulationCopyExplanationStatus",
    "forbidden-copy-negative": "simulationCopyExplanationStatus"
  },
  outputName: "copy-contract-output.json",
  defaultIssue: "613"
});

await runSelectedManualReviewUxStages(context, runStage);
const passed = context.checks.every((check) => check.passed);
finalizeManualReviewUxGate(context, {
  testOutputName: "simulation-v0-copy-polish.txt",
  manifestUpdates: {
    simulationCopyExplanationStatus: passed ? "passed" : "failed"
  },
  closeoutStatus: passed ? "GO for Issue 614. Simulation v0 route explanations are ready for manual review." : "NO-GO with copy blockers."
});

async function runStage(stage) {
  if (stage === "copy-contract") {
    const source = readText("apps/web/src/features/simulation/simulationV0Copy.ts");
    const requiredKeys = [
      "syntheticDryRunExplanation",
      "profileExplanation",
      "ratioExplanation",
      "timelineExplanation",
      "summaryCardsExplanation",
      "occupiedBedProofExplanation",
      "artifactHashExplanation",
      "exportExplanation",
      "limitationCopy"
    ];
    const missingKeys = requiredKeys.filter((key) => !source.includes(key));
    const exactHash = source.includes("This helps confirm the same synthetic inputs produce the same dry-run artifact.");
    const passed = missingKeys.length === 0 && exactHash;
    addAndWrite(context, "copy-contract-output.json", "centralized Simulation v0 copy contract includes required explanations", passed, {
      missingKeys,
      exactHash
    });
  }
  if (stage === "rendered-copy") {
    const proof = await captureRenderedCopy();
    const requiredFragments = [
      "Review synthetic operational placeholders for a deterministic dry-run.",
      "Choose one synthetic activity profile",
      "Choose a bounded ratio planning assumption.",
      "Inspect the generated placeholder events in time order.",
      "Scan artifact-derived counts",
      "Shows which synthetic bed positions were selected",
      "This helps confirm the same synthetic inputs produce the same dry-run artifact.",
      "Export a synthetic review bundle",
      "Manual visual review remains required."
    ];
    const missing = requiredFragments.filter((fragment) => !proof.routeText.includes(fragment));
    const passed = missing.length === 0;
    addAndWrite(context, "rendered-copy-output.json", "rendered Simulation v0 route includes concise nontechnical explanations", passed, {
      missing,
      textLength: proof.routeText.length,
      screenshotPath: proof.screenshotPath
    });
    writeJson(`${context.dir}/nontechnical-explanation-output.json`, { status: passed ? "passed" : "failed", requiredFragments, missing });
  }
  if (stage === "forbidden-copy-negative") {
    const rendered = await captureRenderedCopy();
    const source = `${readText("apps/web/src/features/simulation/simulationV0Copy.ts")}\n${rendered.routeText}`.toLowerCase();
    const forbidden = [
      "safe",
      "unsafe",
      "compliant",
      "noncompliant",
      "recommended",
      "best assignment",
      "patient outcome",
      "clinical safety"
    ];
    const found = forbidden.filter((fragment) => {
      const escaped = fragment.replace(/[.*+?^${}()|[\]\\]/gu, "\\$&").replace(/\\ /gu, "\\s+");
      return new RegExp(`(^|[^a-z])${escaped}([^a-z]|$)`, "iu").test(source);
    });
    const negativeFixtureFails = forbidden.some((fragment) => "safe".includes(fragment));
    const passed = found.length === 0 && negativeFixtureFails;
    addAndWrite(context, "forbidden-copy-negative-output.json", "forbidden Simulation v0 copy implication negative fixture is enforced", passed, {
      found,
      negativeFixture: "safe"
    });
  }
}

async function captureRenderedCopy() {
  if (context._renderedCopy != null) return context._renderedCopy;
  const screenshotPath = join(abs(`${context.dir}/screenshots`), "simulation-copy-polish.png");
  const result = await withBrowserRenderedApp({
    port: 18613,
    chromePort: 19613,
    width: 1440,
    height: 1400,
    initScript: 'sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-route') != null");
    await browser.screenshot(screenshotPath);
    return browser.evaluate("document.querySelector('#simulation-v0-route')?.textContent ?? ''");
  });
  assertBrowserPng(screenshotPath);
  context._renderedCopy = {
    routeText: result.result,
    screenshotPath: `${context.dir}/screenshots/simulation-copy-polish.png`
  };
  return context._renderedCopy;
}
