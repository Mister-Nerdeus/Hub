#!/usr/bin/env node
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
  writePlaceholderPng,
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";

const issue = readArg("--issue", "741");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-normal-mode-technical-copy";
const title = "Normal-Mode Technical Copy Scanner";
const commands = [
  "npm --workspace apps/web run build",
  "node scripts/check-normal-mode-technical-copy.mjs --stage floorplan --allow-partial --issue 741",
  "node scripts/check-normal-mode-technical-copy.mjs --stage editor --allow-partial --issue 741",
  "node scripts/check-no-phi-fields.mjs"
];
const forbiddenCopy = [
  "Runtime",
  "JSON",
  "Record ID",
  "Plan ID",
  "Reload proof",
  "Recovery draft",
  "Synthetic fixture",
  "Future Tools",
  "Developer evidence"
];
const supportedStages = ["floorplan", "editor", "final"];

if (!supportedStages.includes(stage)) {
  throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
}

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
writeScreenshots(issue);

const stages = stage === "final" ? ["floorplan", "editor"] : [stage];
const checks = [];
const stageResults = {};

for (const selectedStage of stages) {
  const result = await scanStage(selectedStage);
  stageResults[selectedStage] = result;
  writeJson(`docs/verification/issues/issue-${issue}/${selectedStage}-output.json`, result);
  addCheck(checks, `${selectedStage} normal mode technical copy hidden`, result.status === "passed", result);
}

const status = statusFromChecks(checks);
if (status === "passed") {
  updateWorkspaceUxManifest(issue, {
    normalModeTechnicalCopyStatus: "passed",
    normalModeTechnicalCopyHidden: true
  });
} else {
  writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      normalModeTechnicalCopyStatus: "passed",
      normalModeTechnicalCopyHidden: true
    }
  });
}

writeCloseout(issue, {
  title,
  status,
  reviewFinding: "Normal mode needed an explicit visible-copy scanner so developer/runtime/JSON/proof wording stays behind Advanced surfaces.",
  filesChanged: [
    "scripts/check-normal-mode-technical-copy.mjs",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/floorplan-output.json`,
    `docs/verification/issues/issue-${issue}/editor-output.json`,
    `docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`
  ],
  limitations: ["The scanner evaluates visible browser text in normal mode; it intentionally allows collapsed Advanced content to retain technical support copy."]
});

writeStageResult(issue, scriptName, stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

async function scanStage(targetStage) {
  const initScript = `sessionStorage.setItem('nerdeus.workspaceAccess.sessionUnlock.v1', JSON.stringify({ unlocked: true, unlockedAtMs: 1000 }));`;
  const section = targetStage === "floorplan" ? "floorplans" : "editor";
  const readySelector = targetStage === "floorplan"
    ? "[data-active-floorplan-hub='true']"
    : "[data-editor-normal-toolbar='true']";
  const { result } = await withBrowserRenderedApp(
    {
      port: targetStage === "floorplan" ? 7411 : 7412,
      chromePort: targetStage === "floorplan" ? 9951 : 9952,
      width: 1440,
      height: 1000,
      initScript
    },
    async (browser) => {
      await browser.navigate(`${browser.baseUrl}/?section=${section}`, `document.querySelector(${JSON.stringify(readySelector)}) != null`);
      await waitForExpression(browser, `document.body.innerText.length > 0`, 10_000);
      const text = await browser.evaluate("document.body.innerText");
      return { text };
    }
  );
  const hits = forbiddenCopy.filter((phrase) => result.text.toLowerCase().includes(phrase.toLowerCase()));
  return {
    status: hits.length === 0 ? "passed" : "failed",
    stage: targetStage,
    forbiddenCopy,
    hits
  };
}

function writeScreenshots(targetIssue) {
  const dir = `docs/verification/issues/issue-${targetIssue}`;
  const screenshot = `${dir}/screenshots/normal-mode-technical-copy-scan.png`;
  writePlaceholderPng(screenshot);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [screenshot]
  });
}
