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

const issue = readArg("--issue", "739");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-editor-screenshot-proof";
const title = "Editor Screenshot Proof";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-editor-screenshot-proof.mjs --stage screenshot-set --allow-partial --issue 739",
  "node scripts/check-no-phi-fields.mjs"
];
const requiredScreenshots = [
  "editor-full-page-normal.png",
  "editor-bottom-details-open.png",
  "editor-advanced-tools-open.png",
  "editor-narrow-desktop.png"
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
addCheck(checks, "editor screenshot set exists", screenshotChecks.every((check) => check.passed), { screenshots: screenshotChecks });

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
    editorScreenshotProofStatus: "passed"
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      editorScreenshotProofStatus: "passed"
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The editor redesign needed visual proof for normal, bottom details, advanced tools, and narrow desktop states; this issue captures those browser screenshots locally.",
  filesChanged: [
    "scripts/check-editor-screenshot-proof.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    ...requiredScreenshots.map((name) => `docs/verification/issues/issue-${issue}/screenshots/${name}`)
  ],
  limitations: ["Screenshots are local browser proof artifacts and do not imply clinical safety or staffing compliance readiness."]
});

writeStageResult(issue, scriptName, stage, checks, { screenshots: screenshotChecks });
if (status !== "passed" && !allowPartial) process.exit(1);

async function captureScreenshots() {
  const initScript = `sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));`;
  await withBrowserRenderedApp(
    {
      port: 7390,
      chromePort: 9939,
      width: 1440,
      height: 1000,
      initScript
    },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=editor`, `document.querySelector('[data-editor-normal-toolbar="true"]') != null`);
      await waitForExpression(browser, `document.querySelector('[data-bottom-details-panel="true"]') != null`, 10_000);
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/editor-full-page-normal.png`);

      await browser.evaluate(`document.querySelector('[data-editor-details-toggle="true"][aria-expanded="false"]')?.click()`);
      await waitForExpression(browser, `document.querySelector('[data-selected-object-details-visible="true"]') != null`, 10_000);
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/editor-bottom-details-open.png`);

      await browser.evaluate(`document.querySelector('.editor-normal-toolbar__advanced summary')?.click()`);
      await waitForExpression(browser, `document.querySelector('.editor-normal-toolbar__advanced[open]') != null`, 10_000);
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/editor-advanced-tools-open.png`);

      await browser.cdp.send("Emulation.setDeviceMetricsOverride", {
        width: 1024,
        height: 900,
        deviceScaleFactor: 1,
        mobile: false
      });
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/editor-narrow-desktop.png`);
    }
  );
}
