#!/usr/bin/env node
import { withBrowserRenderedApp } from "./lib/app-browser-proof.mjs";
import {
  addCheck,
  checkAll,
  ensureIssueDirs,
  fileExcludes,
  fileIncludes,
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

const issue = readArg("--issue", "750");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-global-horizontal-overflow";
const title = "Global Horizontal Overflow Repair";
const commands = [
  "node scripts/check-global-horizontal-overflow.mjs --stage shell --issue 750",
  "node scripts/check-global-horizontal-overflow.mjs --stage floorplan-hub --issue 750",
  "node scripts/check-global-horizontal-overflow.mjs --stage editor --issue 750",
  "node scripts/check-global-horizontal-overflow.mjs --stage narrow-desktop --issue 750"
];

const stages = {
  shell: checkShell,
  "floorplan-hub": () => checkBrowserRoute("floorplan-hub", "/?section=floorplans", 1440, 1000, "[data-active-floorplan-hub=\"true\"]"),
  editor: () => checkBrowserRoute("editor", "/?section=editor", 1440, 1000, "[data-editor-normal-toolbar=\"true\"]"),
  "narrow-desktop": () => checkBrowserRoute("narrow-desktop", "/?section=floorplans", 1024, 900, "[data-active-floorplan-hub=\"true\"]")
};

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);

const selectedStages = stage === "final" ? Object.keys(stages) : [stage];
const checks = [];
const stageResults = {};
const screenshots = [];

for (const stageName of selectedStages) {
  const result = await stages[stageName]?.();
  if (result == null) throw new Error(`Unsupported ${scriptName} stage: ${stageName}`);
  if (result.screenshotName != null) screenshots.push(result.screenshotName);
  stageResults[stageName] = result;
  writeJson(`docs/verification/issues/issue-${issue}/${stageName}-output.json`, result);
  addCheck(checks, stageName, result.passed, result);
}

const status = statusFromChecks(checks);
writeRepairScreenshotIndex(issue, screenshots, status);
const patch = {
  globalHorizontalOverflowStatus: "passed",
  bodyRootMarginReset: true,
  normalModeHorizontalScrollbarAbsent: true
};
if (status === "passed") updateRepairManifest(issue, patch);
else writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, { status, issue: String(issue), skippedPatch: patch });

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "The shell used viewport-width sizing and lacked a complete root reset; the repair uses 100% width, root margin reset, and overflow containment for the shell and editor.",
  filesChanged: [
    "apps/web/src/styles.css",
    "apps/web/src/features/app-shell/appShell.css",
    "apps/web/src/features/layout-editor/LayoutEditorStage.css",
    "scripts/check-global-horizontal-overflow.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["Browser checks validate page-level overflow at the tested desktop and narrow desktop sizes."]
});
writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function checkShell() {
  return checkAll([
    fileIncludes("apps/web/src/styles.css", [
      "html,\nbody,\n#root",
      "margin: 0;",
      "overflow-x: hidden;",
      "width: 100%;"
    ]),
    fileIncludes("apps/web/src/features/app-shell/appShell.css", [
      "max-width: 100%;",
      "overflow-x: hidden;",
      "width: 100%;"
    ]),
    fileExcludes("apps/web/src/features/app-shell/appShell.css", ["width: 100vw;"])
  ]);
}

async function checkBrowserRoute(name, path, width, height, readySelector) {
  const screenshotName = `global-overflow-${name}.png`;
  const initScript = `sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));`;
  const result = await withBrowserRenderedApp(
    {
      port: 7500 + selectedStageOffset(name),
      chromePort: 9950 + selectedStageOffset(name),
      width,
      height,
      initScript
    },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}${path}`, `document.querySelector(${JSON.stringify(readySelector)}) != null`);
      const metrics = await browser.evaluate(`(() => {
        const scrolling = document.scrollingElement;
        const body = document.body;
        const root = document.getElementById("root");
        return {
          viewportWidth: window.innerWidth,
          documentClientWidth: scrolling?.clientWidth ?? 0,
          documentScrollWidth: scrolling?.scrollWidth ?? 0,
          bodyClientWidth: body.clientWidth,
          bodyScrollWidth: body.scrollWidth,
          rootClientWidth: root?.clientWidth ?? 0,
          rootScrollWidth: root?.scrollWidth ?? 0
        };
      })()`);
      await browser.screenshot(`docs/verification/issues/issue-${issue}/screenshots/${screenshotName}`);
      return metrics;
    }
  );
  const metrics = result.result;
  const maxOverflow = Math.max(
    metrics.documentScrollWidth - metrics.documentClientWidth,
    metrics.bodyScrollWidth - metrics.bodyClientWidth,
    metrics.rootScrollWidth - metrics.rootClientWidth
  );
  return {
    passed: maxOverflow <= 1,
    screenshotName,
    maxOverflow,
    metrics
  };
}

function selectedStageOffset(name) {
  return { "floorplan-hub": 1, editor: 2, "narrow-desktop": 3 }[name] ?? 0;
}
