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

const stages = ["evidence-pack", "route-screenshot", "checklist", "scorecard", "final"];

const context = createManualReviewUxContext({
  scriptName: "simulation v0 manual review evidence",
  stages,
  statusKeyByStage: {
    "evidence-pack": "manualVisualReviewEvidenceStatus",
    "route-screenshot": "manualVisualReviewEvidenceStatus",
    checklist: "manualVisualReviewEvidenceStatus",
    scorecard: "manualVisualReviewEvidenceStatus"
  },
  outputName: "manual-review-evidence-pack-output.json",
  defaultIssue: "611"
});

await runSelectedManualReviewUxStages(context, runStage);
const passed = context.checks.every((check) => check.passed);
finalizeManualReviewUxGate(context, {
  testOutputName: "simulation-v0-manual-review-evidence.txt",
  manifestUpdates: {
    manualVisualReviewEvidenceStatus: passed ? "passed" : "failed",
    manualReviewEvidencePackExists: fileExists("docs/project/simulation-v0-manual-review-evidence-pack.md"),
    manualReviewChecklistExists: fileExists("docs/project/simulation-v0-manual-review-checklist.md"),
    manualReviewScorecardExists: fileExists("docs/project/simulation-v0-manual-review-scorecard.md"),
    humanReviewCompleted: false
  },
  closeoutStatus: passed ? "GO for Issue 612. Human review is still required." : "NO-GO with evidence-pack blockers."
});

async function runStage(stage) {
  if (stage === "evidence-pack") {
    const evidenceDoc = readText("docs/project/simulation-v0-manual-review-evidence-pack.md");
    const required = [
      "Route screenshot",
      "Full route text snapshot",
      "Section inventory",
      "Control inventory",
      "Timeline inventory",
      "Summary-card inventory",
      "Proof-panel inventory",
      "Export-control inventory",
      "No-claim boundary",
      "Known limitations",
      "Reviewer Decision Area"
    ];
    const missing = required.filter((fragment) => !evidenceDoc.includes(fragment));
    const route = await captureRouteEvidence();
    const passed = missing.length === 0 &&
      route.sectionInventory.length >= 5 &&
      route.controlInventory.length >= 2 &&
      route.timelineInventory.visibleRows > 0 &&
      route.summaryCardInventory.length >= 5 &&
      route.proofPanelInventory.length >= 2 &&
      route.exportControlInventory.length >= 2;
    addAndWrite(context, "manual-review-evidence-pack-output.json", "manual review evidence pack covers the required route review inventory", passed, {
      missing,
      sectionCount: route.sectionInventory.length,
      controlCount: route.controlInventory.length,
      timeline: route.timelineInventory,
      summaryCardCount: route.summaryCardInventory.length,
      proofPanelCount: route.proofPanelInventory.length,
      exportControlCount: route.exportControlInventory.length
    });
  }
  if (stage === "route-screenshot") {
    const route = await captureRouteEvidence();
    const screenshotPath = `${context.dir}/screenshots/simulation-v0-manual-review-route.png`;
    assertBrowserPng(abs(screenshotPath));
    addAndWrite(context, "route-screenshot-output.json", "manual review route screenshot and text snapshot exist", fileExists(screenshotPath, 5000) && route.textSnapshot.length > 100, {
      screenshotPath,
      textLength: route.textSnapshot.length
    });
  }
  if (stage === "checklist") {
    const checklist = readText("docs/project/simulation-v0-manual-review-checklist.md");
    const required = [
      "Route screenshot exists",
      "Full route text snapshot exists",
      "Manual visual review is still required",
      "Promotion remains blocked",
      "Reviewer Decision Area",
      "Decision: Pass / Needs repair / Blocked"
    ];
    const missing = required.filter((fragment) => !checklist.includes(fragment));
    const passed = missing.length === 0 && checklist.includes("- [ ]");
    addAndWrite(context, "checklist-output.json", "manual review checklist exists and remains blank for human use", passed, { missing });
  }
  if (stage === "scorecard") {
    const scorecard = readText("docs/project/simulation-v0-manual-review-scorecard.md");
    const required = [
      "Reviewer name",
      "Reviewer role",
      "Review date",
      "Decision: Pass / Needs repair / Blocked",
      "Understandability",
      "Profile selector clarity",
      "Ratio-control clarity",
      "Timeline readability",
      "Summary-card usefulness",
      "Occupied-bed proof clarity",
      "Artifact hash explanation clarity",
      "Export-control clarity",
      "Limitations visibility",
      "No-claim wording safety",
      "Overall manual-review readiness"
    ];
    const missing = required.filter((fragment) => !scorecard.includes(fragment));
    const prefilledPass = /Decision:\s*Pass\s*$/mu.test(scorecard);
    const passed = missing.length === 0 && !prefilledPass;
    addAndWrite(context, "scorecard-output.json", "manual review scorecard exists without pre-filled approval", passed, { missing, prefilledPass });
  }
}

async function captureRouteEvidence() {
  if (context._routeEvidence != null) return context._routeEvidence;
  const screenshotPath = join(abs(`${context.dir}/screenshots`), "simulation-v0-manual-review-route.png");
  const result = await withBrowserRenderedApp({
    port: 18611,
    chromePort: 19611,
    width: 1440,
    height: 1400,
    initScript: 'sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-route') != null");
    await browser.screenshot(screenshotPath);
    return browser.evaluate(`(() => {
      const root = document.querySelector('#simulation-v0-route');
      const textSnapshot = root?.textContent?.replace(/\\s+/g, ' ').trim() ?? '';
      const sectionInventory = Array.from(root?.querySelectorAll('section[id], fieldset, .simulation-v0-section') ?? []).map((node) => ({
        id: node.id || null,
        label: node.getAttribute('aria-label') || node.querySelector('h3, legend')?.textContent?.trim() || null
      }));
      const controlInventory = Array.from(root?.querySelectorAll('button, select, input, textarea') ?? []).map((node) => ({
        tag: node.tagName.toLowerCase(),
        text: node.textContent?.replace(/\\s+/g, ' ').trim() || node.getAttribute('aria-label') || null
      }));
      const timelineRows = Array.from(root?.querySelectorAll('.simulation-v0-panel__table--timeline tbody tr') ?? []);
      const summaryCardInventory = Array.from(root?.querySelectorAll('.simulation-v0-summary-cards div') ?? []).map((node) => ({
        label: node.querySelector('dt')?.textContent?.trim(),
        value: node.querySelector('dd')?.textContent?.trim()
      }));
      const proofPanelInventory = Array.from(root?.querySelectorAll('#simulation-v0-proof .simulation-v0-section') ?? []).map((node) => ({
        id: node.id || null,
        title: node.querySelector('h3')?.textContent?.trim()
      }));
      const exportControlInventory = Array.from(root?.querySelectorAll('[aria-labelledby="simulation-v0-export-title"] button') ?? []).map((node) => node.textContent?.trim());
      return {
        textSnapshot,
        sectionInventory,
        controlInventory,
        timelineInventory: {
          headerCells: Array.from(root?.querySelectorAll('.simulation-v0-panel__table--timeline th[scope="col"]') ?? []).map((node) => node.textContent?.trim()),
          visibleRows: Math.max(0, timelineRows.length - 1)
        },
        summaryCardInventory,
        proofPanelInventory,
        exportControlInventory
      };
    })();`);
  });
  assertBrowserPng(screenshotPath);
  const route = result.result;
  context._routeEvidence = route;
  writeJson(`${context.dir}/route-text-snapshot-output.json`, { status: "passed", textSnapshot: route.textSnapshot });
  writeJson(`${context.dir}/section-inventory-output.json`, { status: "passed", sections: route.sectionInventory });
  writeJson(`${context.dir}/no-claim-boundary-output.json`, {
    status: "passed",
    manualReviewRequired: route.textSnapshot.includes("Manual visual review remains required"),
    promotionBlocked: route.textSnapshot.includes("Promotion remains blocked"),
    noAutomatedApprovalClaim: !route.textSnapshot.includes("Manual review passed"),
    noProductionReadinessClaim: !route.textSnapshot.includes("Production ready")
  });
  return route;
}
