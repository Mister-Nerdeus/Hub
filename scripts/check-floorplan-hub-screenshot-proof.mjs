#!/usr/bin/env node
import { existsSync, statSync } from "node:fs";
import {
  waitForExpression,
  withBrowserRenderedApp
} from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  statusFromChecks,
  updateWorkspaceUxManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";

const issue = readArg("--issue", "740");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-floorplan-hub-screenshot-proof";
const title = "Floorplan Hub Screenshot Proof";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-floorplan-hub-screenshot-proof.mjs --stage screenshot-set --allow-partial --issue 740",
  "node scripts/check-no-phi-fields.mjs"
];
const requiredScreenshots = [
  "floorplan-hub-normal.png",
  "floorplan-hub-readiness-details-open.png",
  "floorplan-hub-advanced-open.png",
  "floorplan-hub-narrow-desktop.png"
];

if (stage !== "screenshot-set" && stage !== "final") {
  throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
}

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
await captureScreenshots();

const checks = [];
const screenshotChecks = requiredScreenshots.map((name) => {
  const path = `docs/verification/issues/issue-${issue}/screenshots/${name}`;
  return {
    name,
    path,
    passed: existsSync(path) && statSync(path).size > 100
  };
});
addCheck(checks, "floorplan hub screenshot set exists", screenshotChecks.every((check) => check.passed), { screenshots: screenshotChecks });

const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, {
  status,
  screenshots: requiredScreenshots.map((name) => `docs/verification/issues/issue-${issue}/screenshots/${name}`)
});
writeJson(`docs/verification/issues/issue-${issue}/screenshot-set-output.json`, {
  status,
  screenshots: screenshotChecks
});

if (status === "passed") {
  updateWorkspaceUxManifest(issue, {
    floorplanHubScreenshotProofStatus: "passed"
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      floorplanHubScreenshotProofStatus: "passed"
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The floorplan hub redesign needed local visual proof for normal, readiness details, Advanced/Evidence, and narrow desktop states; this issue captures those browser screenshots.",
  filesChanged: [
    "scripts/check-floorplan-hub-screenshot-proof.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    ...requiredScreenshots.map((name) => `docs/verification/issues/issue-${issue}/screenshots/${name}`)
  ],
  limitations: ["Screenshots are local browser proof artifacts and do not imply assignment, simulation, optimizer, report, or clinical readiness."]
});

writeStageResult(issue, scriptName, stage, checks, { screenshots: screenshotChecks });
if (status !== "passed" && !allowPartial) process.exit(1);

async function captureScreenshots() {
  const initScript = `sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));`;
  await withBrowserRenderedApp(
    {
      port: 7400,
      chromePort: 9940,
      width: 1440,
      height: 1000,
      initScript
    },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=floorplans`, `document.querySelector('[data-active-floorplan-hub="true"]') != null`);
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/floorplan-hub-normal.png`);

      await browser.evaluate(`document.querySelector('.floorplan-readiness-summary__details summary')?.click()`);
      await waitForExpression(browser, `document.querySelector('.floorplan-readiness-summary__details[open]') != null`, 10_000);
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/floorplan-hub-readiness-details-open.png`);

      await browser.evaluate(`document.querySelector('.active-floorplan-hub__advanced summary')?.click()`);
      await waitForExpression(browser, `document.querySelector('.active-floorplan-hub__advanced[open]') != null`, 10_000);
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/floorplan-hub-advanced-open.png`);

      await browser.cdp.send("Emulation.setDeviceMetricsOverride", {
        width: 1024,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
      });
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/floorplan-hub-narrow-desktop.png`);
    }
  );
}
