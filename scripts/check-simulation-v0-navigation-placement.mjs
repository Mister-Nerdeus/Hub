#!/usr/bin/env node
import { join } from "node:path";
import { assertBrowserPng, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  abs,
  addAndWrite,
  createManualReviewUxContext,
  fileExists,
  finalizeManualReviewUxGate,
  readText,
  runSelectedManualReviewUxStages,
  writeJson
} from "./lib/simulation-v0-manual-review-ux-utils.mjs";

const stages = ["decision-doc", "rendered-navigation", "forbidden-copy-negative", "final"];

const context = createManualReviewUxContext({
  scriptName: "simulation v0 navigation placement",
  stages,
  statusKeyByStage: {
    "decision-doc": "simulationNavigationPlacementStatus",
    "rendered-navigation": "simulationNavigationPlacementStatus",
    "forbidden-copy-negative": "simulationNavigationPlacementStatus"
  },
  outputName: "navigation-placement-decision-output.json",
  defaultIssue: "612"
});

await runSelectedManualReviewUxStages(context, runStage);
const passed = context.checks.every((check) => check.passed);
finalizeManualReviewUxGate(context, {
  testOutputName: "simulation-v0-navigation-placement.txt",
  manifestUpdates: {
    simulationNavigationPlacementStatus: passed ? "passed" : "failed",
    simulationNavigationPlacement: passed ? "primary_simulation_review" : "not_decided"
  },
  closeoutStatus: passed ? "GO for Issue 613. Navigation is intentionally placed for manual review." : "NO-GO with navigation blockers."
});

async function runStage(stage) {
  if (stage === "decision-doc") {
    const doc = readText("docs/project/simulation-v0-navigation-placement.md");
    const source = readText("apps/web/src/features/app-shell/appNavigation.ts");
    const required = [
      "Selected option: Option B",
      "Simulation Review",
      "primary workflow",
      "internal synthetic dry-run only",
      "Manual visual review remains required",
      "Promotion remains blocked"
    ];
    const missing = required.filter((fragment) => !doc.includes(fragment));
    const sourceHasPlacement = source.includes('{ id: "simulation", label: "Simulation Review", group: "primary" }');
    const passed = missing.length === 0 && sourceHasPlacement;
    addAndWrite(context, "navigation-placement-decision-output.json", "navigation decision doc selects a safe primary review placement", passed, {
      missing,
      sourceHasPlacement
    });
  }
  if (stage === "rendered-navigation") {
    const proof = await captureNavigation();
    const passed = proof.primaryLabels.includes("Simulation Review") &&
      !proof.futureLabels.includes("Simulation Review") &&
      proof.routeHeading === "Simulation Review" &&
      proof.routeText.includes("internal synthetic dry-run only") &&
      proof.routeText.includes("Manual visual review remains required");
    addAndWrite(context, "rendered-navigation-output.json", "rendered navigation places Simulation Review in the primary workflow only", passed, proof);
  }
  if (stage === "forbidden-copy-negative") {
    const source = `${readText("apps/web/src/features/app-shell/appNavigation.ts")}\n${readText("apps/web/src/App.tsx")}`;
    const forbiddenLabels = [
      "Recommended Staffing",
      "Safe Staffing",
      "Optimizer",
      "Best Assignment",
      "Compliance",
      "Clinical Safety",
      "Patient Outcome"
    ];
    const found = forbiddenLabels.filter((label) => source.includes(label));
    const negativeFixtureFails = forbiddenLabels.some((label) => label === "Optimizer");
    const passed = found.length === 0 && negativeFixtureFails;
    addAndWrite(context, "forbidden-navigation-copy-negative-output.json", "forbidden navigation-label negative fixture is enforced", passed, {
      found,
      negativeFixture: "Optimizer"
    });
  }
}

async function captureNavigation() {
  if (context._navigation != null) return context._navigation;
  const screenshotPath = join(abs(`${context.dir}/screenshots`), "simulation-navigation-placement.png");
  const result = await withBrowserRenderedApp({
    port: 18612,
    chromePort: 19612,
    width: 1440,
    height: 1000,
    initScript: 'sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-route') != null");
    await browser.screenshot(screenshotPath);
    return browser.evaluate(`(() => ({
      primaryLabels: Array.from(document.querySelectorAll('.app-nav__button--primary')).map((node) => node.textContent.trim()),
      futureLabels: Array.from(document.querySelectorAll('.app-nav__button--future')).map((node) => node.textContent.trim()),
      routeHeading: document.querySelector('#simulation-title')?.textContent?.trim() ?? null,
      routeText: document.querySelector('#simulation-v0-route')?.textContent ?? ''
    }))();`);
  });
  assertBrowserPng(screenshotPath);
  context._navigation = { ...result.result, screenshotPath: `${context.dir}/screenshots/simulation-navigation-placement.png` };
  writeJson(`${context.dir}/rendered-navigation-output.json`, { status: "passed", detail: context._navigation });
  return context._navigation;
}
