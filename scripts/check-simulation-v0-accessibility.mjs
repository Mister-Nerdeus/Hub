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

const stages = ["semantic-scan", "keyboard-navigation", "focus-order", "final"];

const context = createManualReviewUxContext({
  scriptName: "simulation v0 accessibility",
  stages,
  statusKeyByStage: {
    "semantic-scan": "simulationAccessibilityStatus",
    "keyboard-navigation": "simulationAccessibilityStatus",
    "focus-order": "simulationAccessibilityStatus"
  },
  outputName: "accessibility-scan-output.json",
  defaultIssue: "618"
});

await runSelectedManualReviewUxStages(context, runStage);
const passed = context.checks.every((check) => check.passed);
finalizeManualReviewUxGate(context, {
  testOutputName: "simulation-v0-accessibility.txt",
  manifestUpdates: {
    simulationAccessibilityStatus: passed ? "passed" : "failed",
    accessibilityProofComplete: passed
  },
  closeoutStatus: passed ? "GO for Issue 619. Basic Simulation v0 accessibility proof is complete." : "NO-GO with accessibility blockers."
});

async function runStage(stage) {
  if (stage === "semantic-scan") {
    const proof = await captureAccessibility();
    const passed = proof.fieldsetCount >= 2 &&
      proof.legendTexts.includes("Activity profile") &&
      proof.legendTexts.includes("Ratio planning assumption") &&
      proof.tableHasLabel &&
      proof.namedButtonCount === proof.buttonCount &&
      proof.statusRegionCount >= 1 &&
      proof.limitationsHeading === "Limitations";
    addAndWrite(context, "accessibility-scan-output.json", "Simulation v0 route has basic semantic labels and named controls", passed, proof);
    writeJson(`${context.dir}/aria-label-output.json`, { status: passed ? "passed" : "failed", proof });
  }
  if (stage === "keyboard-navigation") {
    const proof = await captureAccessibility();
    const required = ["Typical", "Busy", "Slammed", "4:1 dry-run", "3:1 dry-run", "Side-by-side comparison", "Download JSON", "Copy summary"];
    const missing = required.filter((label) => !proof.focusableNames.some((name) => name.includes(label)));
    const passed = missing.length === 0 && proof.focusableNames.length >= required.length;
    addAndWrite(context, "keyboard-navigation-output.json", "Simulation v0 controls and export actions are keyboard reachable", passed, {
      missing,
      focusableNames: proof.focusableNames
    });
  }
  if (stage === "focus-order") {
    const proof = await captureAccessibility();
    const source = readText("apps/web/src/styles.css");
    const profileIndex = proof.focusableNames.findIndex((name) => name.includes("Typical"));
    const ratioIndex = proof.focusableNames.findIndex((name) => name.includes("4:1 dry-run"));
    const filterIndex = proof.focusableNames.findIndex((name) => name.includes("All events"));
    const exportIndex = proof.focusableNames.findIndex((name) => name.includes("Download JSON"));
    const passed = profileIndex >= 0 &&
      ratioIndex > profileIndex &&
      filterIndex > ratioIndex &&
      exportIndex > filterIndex &&
      source.includes(":focus-visible");
    addAndWrite(context, "focus-order-output.json", "focus order follows Simulation v0 visual workflow", passed, {
      profileIndex,
      ratioIndex,
      filterIndex,
      exportIndex,
      focusStyle: source.includes(":focus-visible")
    });
  }
}

async function captureAccessibility() {
  if (context._accessibility != null) return context._accessibility;
  const screenshotPath = join(abs(`${context.dir}/screenshots`), "simulation-accessibility-proof.png");
  const result = await withBrowserRenderedApp({
    port: 18618,
    chromePort: 19618,
    width: 1440,
    height: 1400,
    initScript: 'sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-route') != null");
    await browser.screenshot(screenshotPath);
    return browser.evaluate(`(() => {
      const root = document.querySelector('#simulation-v0-route');
      const buttons = Array.from(root?.querySelectorAll('button') ?? []);
      const focusable = Array.from(root?.querySelectorAll('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])') ?? []);
      return {
        fieldsetCount: root?.querySelectorAll('fieldset').length ?? 0,
        legendTexts: Array.from(root?.querySelectorAll('legend') ?? []).map((node) => node.textContent.trim()),
        tableHasLabel: Boolean(root?.querySelector('.simulation-v0-panel__table--timeline[aria-label]')),
        buttonCount: buttons.length,
        namedButtonCount: buttons.filter((node) => (node.textContent || node.getAttribute('aria-label') || '').trim().length > 0).length,
        statusRegionCount: root?.querySelectorAll('[role="status"]').length ?? 0,
        limitationsHeading: root?.querySelector('#simulation-v0-limitations-title')?.textContent?.trim() ?? null,
        focusableNames: focusable.map((node) => (node.textContent || node.getAttribute('aria-label') || '').replace(/\\s+/g, ' ').trim()).filter(Boolean),
        screenshotPath: ${JSON.stringify(`${context.dir}/screenshots/simulation-accessibility-proof.png`)}
      };
    })();`);
  });
  assertBrowserPng(screenshotPath);
  context._accessibility = result.result;
  writeJson(`${context.dir}/rendered-accessibility-output.json`, { status: "passed", detail: context._accessibility });
  return context._accessibility;
}
