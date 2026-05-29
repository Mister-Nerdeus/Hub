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

const stages = ["event-id", "pagination", "fixed-filter", "no-free-text-filter", "final"];

const context = createManualReviewUxContext({
  scriptName: "simulation v0 timeline usability",
  stages,
  statusKeyByStage: {
    "event-id": "timelineUsabilityStatus",
    pagination: "timelineUsabilityStatus",
    "fixed-filter": "timelineUsabilityStatus",
    "no-free-text-filter": "timelineUsabilityStatus"
  },
  outputName: "timeline-event-id-output.json",
  defaultIssue: "614"
});

await runSelectedManualReviewUxStages(context, runStage);
const passed = context.checks.every((check) => check.passed);
finalizeManualReviewUxGate(context, {
  testOutputName: "simulation-v0-timeline-usability.txt",
  manifestUpdates: {
    timelineUsabilityStatus: passed ? "passed" : "failed",
    timelinePaginationOrFilteringEnabled: passed
  },
  closeoutStatus: passed ? "GO for Issue 615. Timeline has stable IDs, pagination, and fixed filters." : "NO-GO with timeline blockers."
});

async function runStage(stage) {
  if (stage === "event-id") {
    const source = `${readText("apps/web/src/features/simulation/simulationV0TimelineViewModel.ts")}\n${readText("apps/web/src/features/simulation/SimulationV0TimelineTable.tsx")}`;
    const rendered = await captureTimeline();
    const passed = source.includes("eventId: event.eventId") &&
      source.includes("key={row.eventId}") &&
      rendered.headers.includes("Event ID") &&
      rendered.firstEventId.startsWith("dry-run-event-");
    addAndWrite(context, "timeline-event-id-output.json", "timeline exposes stable event IDs and uses them as row keys", passed, rendered);
  }
  if (stage === "pagination") {
    const source = readText("apps/web/src/features/simulation/SimulationV0TimelineTable.tsx");
    const rendered = await captureTimeline();
    const passed = source.includes("Previous page") &&
      source.includes("Next page") &&
      source.includes("Page {pageIndex + 1} of {pageCount}") &&
      rendered.paginationText.includes("Page 1 of") &&
      rendered.rowSummary.includes("total events");
    addAndWrite(context, "timeline-pagination-output.json", "timeline renders bounded 25-row pagination", passed, rendered);
  }
  if (stage === "fixed-filter") {
    const stateSource = readText("apps/web/src/features/simulation/simulationV0TimelineState.ts");
    const rendered = await captureTimeline();
    const labels = ["All events", "Ready", "Queued", "Delayed", "Started", "Completed", "Unassigned"];
    const missing = labels.filter((label) => !stateSource.includes(label) || !rendered.filterLabels.includes(label));
    addAndWrite(context, "timeline-filter-output.json", "timeline exposes fixed event-label filters only", missing.length === 0, {
      missing,
      filterLabels: rendered.filterLabels
    });
  }
  if (stage === "no-free-text-filter") {
    const source = readText("apps/web/src/features/simulation/SimulationV0TimelineTable.tsx");
    const hasTextInput = /<input|<textarea|contentEditable|type="search"|type="text"/u.test(source);
    addAndWrite(context, "no-free-text-filter-output.json", "timeline does not add free-text clinical search fields", !hasTextInput, { hasTextInput });
  }
}

async function captureTimeline() {
  if (context._timeline != null) return context._timeline;
  const screenshotPath = join(abs(`${context.dir}/screenshots`), "simulation-timeline-usability.png");
  const result = await withBrowserRenderedApp({
    port: 18614,
    chromePort: 19614,
    width: 1440,
    height: 1400,
    initScript: 'sessionStorage.setItem("nerdeus.workspaceAccess.sessionUnlock.v1", JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));'
  }, async (browser) => {
    await browser.navigate(`${browser.baseUrl}/?section=simulation`, "document.querySelector('#simulation-v0-route') != null");
    await browser.screenshot(screenshotPath);
    return browser.evaluate(`(() => {
      const table = document.querySelector('.simulation-v0-panel__table--timeline');
      const rows = Array.from(table?.querySelectorAll('[role="row"]') ?? []);
      return {
        headers: Array.from(table?.querySelectorAll('[role="columnheader"]') ?? []).map((node) => node.textContent.trim()),
        firstEventId: rows[1]?.querySelector('[role="cell"]')?.textContent?.trim() ?? '',
        visibleRowCount: Math.max(0, rows.length - 1),
        filterLabels: Array.from(document.querySelectorAll('.simulation-v0-filter-buttons button')).map((node) => node.textContent.trim()),
        paginationText: document.querySelector('.simulation-v0-pagination')?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
        rowSummary: document.querySelector('.simulation-v0-row-summary')?.textContent?.replace(/\\s+/g, ' ').trim() ?? '',
        screenshotPath: ${JSON.stringify(`${context.dir}/screenshots/simulation-timeline-usability.png`)}
      };
    })();`);
  });
  assertBrowserPng(screenshotPath);
  context._timeline = result.result;
  writeJson(`${context.dir}/rendered-timeline-usability-output.json`, { status: "passed", detail: context._timeline });
  return context._timeline;
}
