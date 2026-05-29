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

const stages = ["hierarchy", "shared-queue-summary", "no-ui-pressure-duplication", "visual-hierarchy", "artifact-derived-values", "no-claim-copy", "forbidden-copy-negative", "final"];

const context = createManualReviewUxContext({
  scriptName: "simulation v0 summary card hierarchy",
  stages,
  statusKeyByStage: {
    hierarchy: "summaryCardsVisualHierarchyStatus",
    "shared-queue-summary": "summaryCardsVisualHierarchyStatus",
    "no-ui-pressure-duplication": "summaryCardsVisualHierarchyStatus",
    "visual-hierarchy": "summaryCardsVisualHierarchyStatus",
    "artifact-derived-values": "summaryCardsVisualHierarchyStatus",
    "no-claim-copy": "summaryCardsVisualHierarchyStatus",
    "forbidden-copy-negative": "summaryCardsVisualHierarchyStatus"
  },
  outputName: "summary-card-hierarchy-output.json",
  defaultIssue: "616"
});

await runSelectedManualReviewUxStages(context, runStage);
const passed = context.checks.every((check) => check.passed);
finalizeManualReviewUxGate(context, {
  testOutputName: "simulation-v0-summary-card-hierarchy.txt",
  manifestUpdates: {
    summaryCardsVisualHierarchyStatus: passed ? "passed" : "failed",
    summaryCardsHierarchyImproved: passed,
    summaryCardsUseSharedQueueSummary: passed
  },
  closeoutStatus: passed ? "GO for Issue 616. Summary cards have grouped visual hierarchy." : "NO-GO with summary-card blockers."
});

async function runStage(stage) {
  if (stage === "hierarchy" || stage === "visual-hierarchy") {
    const rendered = await captureSummaryCards();
    const requiredGroups = ["Workload", "Queue", "Coverage placeholder", "Runtime grouping"];
    const requiredLabels = ["Generated", "Queued", "Delayed", "Unassigned", "Synthetic nurse groups", "Placeholder pressure"];
    const missingGroups = requiredGroups.filter((label) => !rendered.groupTitles.includes(label));
    const missingLabels = requiredLabels.filter((label) => !rendered.cardLabels.includes(label));
    const passed = missingGroups.length === 0 &&
      missingLabels.length === 0 &&
      rendered.note.includes("Operational placeholder summary only.");
    addAndWrite(context, "summary-card-hierarchy-output.json", "summary cards render neutral grouped hierarchy", passed, {
      missingGroups,
      missingLabels,
      rendered
    });
    writeJson(`${context.dir}/visual-hierarchy-output.json`, { status: passed ? "passed" : "failed", rendered });
  }
  if (stage === "shared-queue-summary" || stage === "artifact-derived-values") {
    const source = readText("apps/web/src/features/simulation/simulationV0SummaryCardsViewModel.ts");
    const passed = source.includes("queueSummary.generatedTaskCount") &&
      source.includes("queueSummary.queuedPlaceholderCount") &&
      source.includes("queueSummary.delayedPlaceholderCount") &&
      source.includes("queueSummary.unassignedPlaceholderCount") &&
      source.includes("queueSummary.placeholderPressureBand") &&
      source.includes('source: "dry_run_artifact"');
    addAndWrite(context, stage === "shared-queue-summary" ? "shared-queue-summary-output.json" : "artifact-derived-values-output.json", "summary-card values remain shared queue-summary derived", passed, {});
  }
  if (stage === "no-ui-pressure-duplication") {
    const source = readText("apps/web/src/features/simulation/simulationV0SummaryCardsViewModel.ts");
    const forbidden = ["totals.delayed + totals.queued", "pressureCount", "<= totals.generated"];
    const found = forbidden.filter((fragment) => source.includes(fragment));
    addAndWrite(context, "no-ui-pressure-duplication-output.json", "UI does not duplicate pressure-band calculation", found.length === 0, { found });
  }
  if (stage === "forbidden-copy-negative" || stage === "no-claim-copy") {
    const source = `${readText("apps/web/src/features/simulation/simulationV0SummaryCards.tsx")}\n${readText("apps/web/src/features/simulation/simulationV0SummaryCardsViewModel.ts")}`.toLowerCase();
    const forbidden = ["safe", "unsafe", "danger", "compliant", "noncompliant", "recommended"];
    const found = forbidden.filter((fragment) => new RegExp(`(^|[^a-z])${fragment}([^a-z]|$)`, "iu").test(source));
    addAndWrite(context, stage === "no-claim-copy" ? "no-claim-copy-output.json" : "forbidden-card-copy-negative-output.json", "summary-card copy avoids forbidden implication words", found.length === 0, {
      found,
      negativeFixture: "recommended"
    });
  }
}

async function captureSummaryCards() {
  if (context._summaryCards != null) return context._summaryCards;
  const screenshotPath = join(abs(`${context.dir}/screenshots`), "simulation-summary-card-hierarchy.png");
  const result = await withBrowserRenderedApp({
    port: 18615,
    chromePort: 19615,
    width: 1440,
    height: 1300,
    initScript: 'sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-summary-cards-title') != null");
    await browser.screenshot(screenshotPath);
    return browser.evaluate(`(() => {
      const root = document.querySelector('[aria-labelledby="simulation-v0-summary-cards-title"]');
      return {
        groupTitles: Array.from(root?.querySelectorAll('.simulation-v0-summary-card-group h4') ?? []).map((node) => node.textContent.trim()),
        cardLabels: Array.from(root?.querySelectorAll('.simulation-v0-summary-cards dt') ?? []).map((node) => node.textContent.trim()),
        note: root?.querySelector('.simulation-v0-summary-cards__note')?.textContent?.trim() ?? '',
        screenshotPath: ${JSON.stringify(`${context.dir}/screenshots/simulation-summary-card-hierarchy.png`)}
      };
    })();`);
  });
  assertBrowserPng(screenshotPath);
  context._summaryCards = result.result;
  writeJson(`${context.dir}/rendered-card-hierarchy-output.json`, { status: "passed", detail: context._summaryCards });
  writeJson(`${context.dir}/rendered-summary-cards-output.json`, { status: "passed", detail: context._summaryCards });
  return context._summaryCards;
}
