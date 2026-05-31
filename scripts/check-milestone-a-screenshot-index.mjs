#!/usr/bin/env node
import { copyFileSync, existsSync, statSync } from "node:fs";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  readArg,
  statusFromChecks,
  updateWorkspaceUxManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/workspace-ux-foundation-utils.mjs";

const issue = readArg("--issue", "746");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const scriptName = "check-milestone-a-screenshot-index";
const title = "Final Screenshot Index";
const commands = [
  "node scripts/check-milestone-a-screenshot-index.mjs --stage final --issue 746",
  "node scripts/check-no-phi-fields.mjs"
];
const screenshotSet = [
  {
    group: "Shell",
    source: "docs/verification/issues/issue-740/screenshots/floorplan-hub-normal.png",
    target: "shell-floorplan-hub-normal.png"
  },
  {
    group: "Floorplan hub",
    source: "docs/verification/issues/issue-740/screenshots/floorplan-hub-readiness-details-open.png",
    target: "floorplan-hub-readiness-details-open.png"
  },
  {
    group: "Editor normal",
    source: "docs/verification/issues/issue-739/screenshots/editor-full-page-normal.png",
    target: "editor-full-page-normal.png"
  },
  {
    group: "Editor bottom details",
    source: "docs/verification/issues/issue-739/screenshots/editor-bottom-details-open.png",
    target: "editor-bottom-details-open.png"
  },
  {
    group: "Advanced/Evidence",
    source: "docs/verification/issues/issue-740/screenshots/floorplan-hub-advanced-open.png",
    target: "floorplan-hub-advanced-open.png"
  },
  {
    group: "Advanced/Evidence",
    source: "docs/verification/issues/issue-739/screenshots/editor-advanced-tools-open.png",
    target: "editor-advanced-tools-open.png"
  },
  {
    group: "Narrow desktop",
    source: "docs/verification/issues/issue-740/screenshots/floorplan-hub-narrow-desktop.png",
    target: "floorplan-hub-narrow-desktop.png"
  },
  {
    group: "Narrow desktop",
    source: "docs/verification/issues/issue-739/screenshots/editor-narrow-desktop.png",
    target: "editor-narrow-desktop.png"
  }
];

if (stage !== "final") {
  throw new Error(`Unsupported ${scriptName} stage: ${stage}`);
}

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, title, commands);
writeBoundaryOutputs(issue);

const dir = `docs/verification/issues/issue-${issue}`;
const checks = [];
const copiedScreenshots = [];
const missingSources = [];
const undersizedSources = [];

for (const screenshot of screenshotSet) {
  if (!existsSync(screenshot.source)) {
    missingSources.push(screenshot.source);
    continue;
  }
  const sourceSize = statSync(screenshot.source).size;
  if (sourceSize <= 1000) {
    undersizedSources.push({ source: screenshot.source, sourceSize });
    continue;
  }
  const target = `${dir}/screenshots/${screenshot.target}`;
  copyFileSync(screenshot.source, target);
  copiedScreenshots.push({
    group: screenshot.group,
    source: screenshot.source,
    target,
    bytes: sourceSize
  });
}

const requiredGroups = ["Shell", "Floorplan hub", "Editor normal", "Editor bottom details", "Advanced/Evidence", "Narrow desktop"];
const presentGroups = new Set(copiedScreenshots.map((screenshot) => screenshot.group));
const missingGroups = requiredGroups.filter((group) => !presentGroups.has(group));

addCheck(checks, "all source screenshots exist", missingSources.length === 0, { missingSources });
addCheck(checks, "source screenshots are real captures, not placeholders", undersizedSources.length === 0, { undersizedSources });
addCheck(checks, "final screenshot index covers required groups", missingGroups.length === 0, { missingGroups });

const status = statusFromChecks(checks);
const screenshotIndex = {
  status,
  groups: requiredGroups.map((group) => ({
    group,
    screenshots: copiedScreenshots
      .filter((screenshot) => screenshot.group === group)
      .map((screenshot) => screenshot.target)
  }))
};
writeJson(`${dir}/screenshot-index.json`, screenshotIndex);

if (status === "passed") {
  updateWorkspaceUxManifest(issue, {
    milestoneAScreenshotIndexStatus: "passed"
  });
} else {
  writeJson(`${dir}/manifest-update-output.json`, {
    status,
    issue: String(issue),
    skippedPatch: {
      milestoneAScreenshotIndexStatus: "passed"
    }
  });
}

writeJson(`${dir}/screenshot-index-output.json`, {
  status,
  copiedScreenshots
});
writeCloseout(issue, {
  title,
  status,
  reviewFinding: status === "passed"
    ? "Final screenshot index covers shell, floorplan hub, editor, Advanced/Evidence, and narrow desktop evidence."
    : "Final screenshot index is missing one or more required visual evidence groups.",
  filesChanged: [
    "scripts/check-milestone-a-screenshot-index.mjs",
    "docs/verification/workspace-ux-foundation-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  evidence: [
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/screenshot-index-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`,
    `docs/verification/issues/issue-${issue}/closeout.md`
  ],
  limitations: [
    "This index aggregates existing local screenshots from issues 739 and 740; it does not introduce new UI behavior."
  ]
});
writeStageResult(issue, scriptName, stage, checks, { screenshotIndex });
if (status !== "passed" && !allowPartial) process.exit(1);
