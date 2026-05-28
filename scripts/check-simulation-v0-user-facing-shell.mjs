#!/usr/bin/env node
import { join } from "node:path";
import { assertBrowserPng, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  abs,
  createRepairContext,
  finalizeRepairGate,
  readText,
  runSelectedRepairStages,
  writeJson
} from "./lib/simulation-v0-repair-utils.mjs";

const stages = ["route-shell-contract", "review-state-contract", "rendered-route", "no-claims", "final"];
const context = createRepairContext({
  scriptName: "simulation v0 user-facing shell",
  stages,
  statusKeyByStage: {
    "route-shell-contract": "simulationRouteShellStatus",
    "review-state-contract": "simulationReviewStateContractStatus",
    "rendered-route": "simulationRouteShellStatus",
    "no-claims": "simulationRouteShellStatus"
  },
  outputName: "route-shell-contract-output.json",
  defaultIssue: "602"
});

await runSelectedRepairStages(context, runStage);
const passed = context.checks.every((check) => check.passed);
finalizeRepairGate(context, {
  testOutputName: "simulation-v0-user-facing-shell.txt",
  manifestUpdates: {
    simulationReviewStateContractStatus: passed ? "passed" : "failed",
    simulationRouteShellStatus: passed ? "passed" : "failed"
  }
});

async function runStage(stage) {
  if (stage === "route-shell-contract") {
    const source = readText("apps/web/src/features/simulation/simulationV0RouteContract.ts");
    const required = ["SimulationV0RouteViewModel", "internal_synthetic_dry_run_only", "controlsRegion", "outputRegion", "proofRegion", "forbiddenClaims"];
    const missing = required.filter((fragment) => !source.includes(fragment));
    context.add("Simulation v0 route shell contract exists", missing.length === 0, { missing });
    writeJson(`${context.dir}/route-shell-contract-output.json`, { status: missing.length === 0 ? "passed" : "failed", missing });
  }
  if (stage === "review-state-contract") {
    const source = readText("apps/web/src/features/simulation/simulationV0ReviewState.ts");
    const required = ["SimulationV0ReviewState", "activityProfileId", "ratioView", "typical", "busy", "slammed", "comparison"];
    const missing = required.filter((fragment) => !source.includes(fragment));
    context.add("Simulation v0 shared review state exists", missing.length === 0, { missing });
    writeJson(`${context.dir}/review-state-contract-output.json`, { status: missing.length === 0 ? "passed" : "failed", missing });
  }
  if (stage === "rendered-route") {
    const proof = await renderSimulationRoute("simulation-route-shell.png");
    const passed = proof.dom.route && proof.dom.controls && proof.dom.output && proof.dom.proof && proof.dom.limitations;
    context.add("rendered Simulation v0 route exposes stable landmarks", passed, proof.dom);
    writeJson(`${context.dir}/rendered-simulation-route-output.json`, { status: passed ? "passed" : "failed", ...proof });
  }
  if (stage === "no-claims") {
    const source = [
      readText("apps/web/src/features/simulation/simulationV0ViewModel.ts"),
      readText("apps/web/src/features/simulation/SimulationV0RatioControls.tsx")
    ].join("\n");
    const forbidden = ["recommended assignment", "best assignment", "compliant staffing"];
    const found = forbidden.filter((fragment) => source.toLowerCase().includes(fragment));
    context.add("Simulation v0 shell source avoids forbidden claim copy", found.length === 0, { found });
    writeJson(`${context.dir}/no-claim-copy-output.json`, { status: found.length === 0 ? "passed" : "failed", found });
    writeJson(`${context.dir}/limitation-copy-output.json`, { status: "passed", limitationCopyPresent: source.includes("Manual visual review remains required.") });
    writeJson(`${context.dir}/visible-copy-output.json`, { status: found.length === 0 ? "passed" : "failed", found });
  }
}

async function renderSimulationRoute(fileName) {
  const screenshotPath = join(abs(`${context.dir}/screenshots`), fileName);
  const result = await withBrowserRenderedApp({
    port: 18100 + Number(context.issue),
    chromePort: 19100 + Number(context.issue),
    width: 1440,
    height: 1200,
    initScript: 'sessionStorage.setItem("nerdeus.demoPin.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-route') != null");
    await browser.screenshot(screenshotPath);
    return browser.evaluate(`(() => ({
      route: document.querySelector('#simulation-v0-route') != null,
      controls: document.querySelector('#simulation-v0-controls') != null,
      output: document.querySelector('#simulation-v0-output') != null,
      proof: document.querySelector('#simulation-v0-proof') != null,
      limitations: document.querySelector('#simulation-v0-limitations') != null,
      text: document.body.textContent
    }))();`);
  });
  assertBrowserPng(screenshotPath);
  return { dom: result.result, screenshotPath };
}
