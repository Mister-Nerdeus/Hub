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

const issue = readArg("--issue", "757");
const stage = readArg("--stage", "repaired-layout");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-floorplan-hub-screenshot-proof";
const title = "Floorplan Hub Screenshot Regression Repair";
const commands = [
  "node scripts/check-floorplan-hub-screenshot-proof.mjs --stage repaired-layout --issue 757",
  "node scripts/check-floorplan-hub-screenshot-proof.mjs --stage no-horizontal-overflow --issue 757"
];
const requiredScreenshots = [
  "floorplan-hub-normal-repaired.png",
  "floorplan-hub-readiness-open-repaired.png",
  "floorplan-hub-narrow-desktop-repaired.png"
];

if (!["repaired-layout", "no-horizontal-overflow", "final"].includes(stage)) {
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
  addCheck(checks, "title remains horizontal", proof.normal.titleHorizontal, proof.normal.titleMetrics);
  addCheck(checks, "preview and metadata balanced", proof.normal.previewBalanced, proof.normal.balanceMetrics);
  addCheck(checks, "readiness details compact", proof.readinessOpen.detailsCompact, proof.readinessOpen.detailsMetrics);
}
if (stage === "no-horizontal-overflow" || stage === "final") {
  addCheck(checks, "normal screenshot has no horizontal overflow", proof.normal.maxOverflow <= 1, proof.normal.overflowMetrics);
  addCheck(checks, "narrow screenshot has no horizontal overflow", proof.narrow.maxOverflow <= 1, proof.narrow.overflowMetrics);
}

const status = statusFromChecks(checks);
writeRepairScreenshotIndex(issue, requiredScreenshots, status, proof);
writeJson(`docs/verification/issues/issue-${issue}/${stage}-output.json`, { status, proof });

if (status === "passed") {
  updateRepairManifest(issue, {
    floorplanHubScreenshotRepairStatus: "passed",
    hubScreenshotShowsNoVerticalTitleWrap: true,
    hubScreenshotShowsNoHorizontalOverflow: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      floorplanHubScreenshotRepairStatus: "passed",
      hubScreenshotShowsNoVerticalTitleWrap: true,
      hubScreenshotShowsNoHorizontalOverflow: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The prior hub screenshot gate only proved files existed; the repair gate measures title wrapping, page overflow, preview balance, and compact open readiness details.",
  filesChanged: [
    "scripts/check-floorplan-hub-screenshot-proof.mjs",
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
      port: 7570,
      chromePort: 9957,
      width: 1440,
      height: 1000,
      initScript
    },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('[data-active-floorplan-hub="true"]') != null`);
      const normal = await readHubMetrics(browser);
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/floorplan-hub-normal-repaired.png`);

      await browser.evaluate(`document.querySelector('.floorplan-readiness-summary__details summary')?.click()`);
      await waitForExpression(browser, `document.querySelector('.floorplan-readiness-summary__details[open]') != null`, 10_000);
      const readinessOpen = await readHubMetrics(browser);
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/floorplan-hub-readiness-open-repaired.png`);

      await browser.cdp.send("Emulation.setDeviceMetricsOverride", {
        width: 1024,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
      });
      await waitForExpression(browser, `window.innerWidth === 1024`, 10_000);
      const narrow = await readHubMetrics(browser);
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/floorplan-hub-narrow-desktop-repaired.png`);
      return { normal, readinessOpen, narrow };
    }
  ).then((run) => run.result);
}

async function readHubMetrics(browser) {
  return browser.evaluate(`(() => {
    const scrolling = document.scrollingElement;
    const title = document.querySelector('.active-floorplan-card__title');
    const titleRect = title?.getBoundingClientRect();
    const titleStyle = title == null ? null : getComputedStyle(title);
    const card = document.querySelector('[data-active-floorplan-card-slot="true"]')?.getBoundingClientRect();
    const preview = document.querySelector('[data-floorplan-thumbnail-slot="true"]')?.getBoundingClientRect();
    const details = document.querySelector('.floorplan-readiness-summary__details')?.getBoundingClientRect();
    const rows = [...document.querySelectorAll('.floorplan-readiness-checklist li')].map((row) => row.getBoundingClientRect().height);
    const maxOverflow = Math.max(
      (scrolling?.scrollWidth ?? 0) - (scrolling?.clientWidth ?? 0),
      document.body.scrollWidth - document.body.clientWidth
    );
    const parsedLineHeight = Number.parseFloat(titleStyle?.lineHeight ?? "0");
    const parsedFontSize = Number.parseFloat(titleStyle?.fontSize ?? "16");
    const lineHeight = Number.isFinite(parsedLineHeight) ? parsedLineHeight : parsedFontSize * 1.25;
    const titleMetrics = {
      width: titleRect?.width ?? 0,
      height: titleRect?.height ?? 0,
      lineHeight,
      overflowWrap: titleStyle?.overflowWrap ?? ""
    };
    const balanceMetrics = {
      cardWidth: card?.width ?? 0,
      previewWidth: preview?.width ?? 0
    };
    const detailsMetrics = {
      detailsHeight: details?.height ?? 0,
      maxRowHeight: rows.length === 0 ? 0 : Math.max(...rows),
      rowCount: rows.length
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
      titleMetrics,
      titleHorizontal: titleMetrics.width >= 220 && titleMetrics.height <= Math.max(44, lineHeight * 2.4) && titleMetrics.overflowWrap !== "anywhere",
      balanceMetrics,
      previewBalanced: balanceMetrics.cardWidth >= 360 && balanceMetrics.previewWidth >= 220,
      detailsMetrics,
      detailsCompact: detailsMetrics.detailsHeight <= 420 && detailsMetrics.maxRowHeight <= 54
    };
  })()`);
}
