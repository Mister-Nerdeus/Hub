#!/usr/bin/env node
import { existsSync, statSync } from "node:fs";
import { waitForExpression, withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  statusFromChecks,
  updateRepairManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeRepairScreenshotIndex,
  writeStageResult
} from "./lib/workspace-ux-repair-utils.mjs";

const issue = readArg("--issue", "763");
const stage = readArg("--stage", "repaired-layout");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editor-screenshot-proof";
const title = "Repaired Editor Screenshot Proof";
const commands = [
  "node scripts/check-editor-screenshot-proof.mjs --stage repaired-layout --issue 763",
  "node scripts/check-editor-screenshot-proof.mjs --stage repaired-bottom-details --issue 763",
  "node scripts/check-editor-screenshot-proof.mjs --stage no-horizontal-overflow --issue 763"
];
const requiredScreenshots = [
  "editor-repaired-normal.png",
  "editor-repaired-bottom-details-compact.png",
  "editor-repaired-advanced-open.png",
  "editor-repaired-narrow-desktop.png"
];

if (!["repaired-layout", "repaired-bottom-details", "no-horizontal-overflow", "final"].includes(stage)) {
  throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
}

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
const proof = await captureScreenshotsAndMetrics();

const checks = [];
const screenshotChecks = requiredScreenshots.map((name) => {
  const path = `docs/verification/issues/issue-${issue}/screenshots/${name}`;
  return { name, path, passed: existsSync(path) && statSync(path).size > 5000 };
});
addCheck(checks, "screenshot set exists", screenshotChecks.every((check) => check.passed), { screenshots: screenshotChecks });
if (stage === "repaired-layout" || stage === "final") {
  addCheck(checks, "canvas dominates viewport", proof.normal.canvasDominates, proof.normal.layoutMetrics);
  addCheck(checks, "no permanent right inspector", proof.normal.noPermanentRightInspector, proof.normal.layoutMetrics);
}
if (stage === "repaired-bottom-details" || stage === "final") {
  addCheck(checks, "bottom details compact", proof.bottomOpen.bottomDetailsCompact, proof.bottomOpen.layoutMetrics);
  addCheck(checks, "normal details hide technical fields", proof.bottomOpen.normalDetailsTechnicalFree, proof.bottomOpen.textMetrics);
}
if (stage === "no-horizontal-overflow" || stage === "final") {
  addCheck(checks, "normal has no horizontal overflow", proof.normal.maxOverflow <= 1, proof.normal.overflowMetrics);
  addCheck(checks, "narrow has no horizontal overflow", proof.narrow.maxOverflow <= 1, proof.narrow.overflowMetrics);
}

const status = statusFromChecks(checks);
writeRepairScreenshotIndex(issue, requiredScreenshots, status, proof);
writeJson(`docs/verification/issues/issue-${issue}/${stage}-output.json`, { status, proof });

if (status === "passed") {
  updateRepairManifest(issue, {
    repairedEditorScreenshotProofStatus: "passed",
    editorScreenshotCanvasDominates: true,
    editorScreenshotNoHorizontalOverflow: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      repairedEditorScreenshotProofStatus: "passed",
      editorScreenshotCanvasDominates: true,
      editorScreenshotNoHorizontalOverflow: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The prior editor screenshot gate only proved files existed; the repair gate measures canvas dominance, compact bottom details, hidden normal technical fields, and page overflow.",
  filesChanged: [
    "scripts/check-editor-screenshot-proof.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    ...requiredScreenshots.map((name) => `docs/verification/issues/issue-${issue}/screenshots/${name}`)
  ],
  limitations: ["Screenshot assertions are viewport-specific local browser checks."]
});

writeStageResult(issue, scriptName, stage, checks, { proof });
if (status !== "passed" && !allowPartial) process.exit(1);

async function captureScreenshotsAndMetrics() {
  const initScript = `sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));`;
  return withBrowserRenderedApp(
    {
      port: 7630,
      chromePort: 9963,
      width: 1440,
      height: 1000,
      initScript
    },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-normal-toolbar="true"]') != null`);
      await waitForExpression(browser, `document.querySelector('[data-bottom-details-panel="true"]') != null`, 10_000);
      const normal = await readEditorMetrics(browser);
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/editor-repaired-normal.png`);

      await browser.evaluate(`document.querySelector('[data-editor-details-toggle="true"][aria-expanded="false"]')?.click()`);
      await waitForExpression(browser, `document.querySelector('[data-selected-object-details-visible="true"]') != null`, 10_000);
      const bottomOpen = await readEditorMetrics(browser);
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/editor-repaired-bottom-details-compact.png`);

      await browser.evaluate(`document.querySelector('.editor-normal-toolbar__advanced summary')?.click()`);
      await waitForExpression(browser, `document.querySelector('.editor-normal-toolbar__advanced[open]') != null`, 10_000);
      const advancedOpen = await readEditorMetrics(browser);
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/editor-repaired-advanced-open.png`);

      await browser.cdp.send("Emulation.setDeviceMetricsOverride", {
        width: 1024,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
      });
      await waitForExpression(browser, `window.innerWidth === 1024`, 10_000);
      const narrow = await readEditorMetrics(browser);
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/editor-repaired-narrow-desktop.png`);
      return { normal, bottomOpen, advancedOpen, narrow };
    }
  ).then((run) => run.result);
}

async function readEditorMetrics(browser) {
  return browser.evaluate(`(() => {
    const scrolling = document.scrollingElement;
    const canvas = document.querySelector('.layout-editor-stage__shell')?.getBoundingClientRect();
    const details = document.querySelector('[data-bottom-details-panel="true"]')?.getBoundingClientRect();
    const sidePanels = document.querySelector('.layout-editor-stage__side-panels')?.getBoundingClientRect();
    const body = document.querySelector('[data-selected-object-details-visible="true"]');
    const bodyText = body?.innerText ?? "";
    const maxOverflow = Math.max(
      (scrolling?.scrollWidth ?? 0) - (scrolling?.clientWidth ?? 0),
      document.body.scrollWidth - document.body.clientWidth
    );
    const forbidden = [
      "Selection type",
      "Owner ID",
      "Split bay ID",
      "Object ID",
      "Source units",
      "Raw validation",
      "Record IDs"
    ];
    const layoutMetrics = {
      viewportHeight: window.innerHeight,
      canvasHeight: canvas?.height ?? 0,
      detailsHeight: details?.height ?? 0,
      sidePanelsWidth: sidePanels?.width ?? 0
    };
    return {
      maxOverflow,
      overflowMetrics: {
        viewportWidth: window.innerWidth,
        documentScrollWidth: scrolling?.scrollWidth ?? 0,
        documentClientWidth: scrolling?.clientWidth ?? 0,
        bodyScrollWidth: document.body.scrollWidth,
        bodyClientWidth: document.body.clientWidth
      },
      layoutMetrics,
      textMetrics: {
        forbiddenPresent: forbidden.filter((label) => bodyText.includes(label))
      },
      canvasDominates: layoutMetrics.canvasHeight >= window.innerHeight * 0.54,
      noPermanentRightInspector: layoutMetrics.sidePanelsWidth <= 1,
      bottomDetailsCompact: layoutMetrics.detailsHeight <= 330,
      normalDetailsTechnicalFree: forbidden.every((label) => !bodyText.includes(label))
    };
  })()`);
}
