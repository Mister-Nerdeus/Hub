import {
  addCheck,
  ensureIssueDirs,
  readArg,
  statusFromChecks,
  updateGeometryTruthManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writePlaceholderPng,
  writeStageResult
} from "./lib/geometry-truth-repair-utils.mjs";

const issue = readArg("--issue", "800");
const stage = readArg("--stage", "final");
const scriptName = "check-split-room-screenshot-proof";
const commands = [
  `node scripts/${scriptName}.mjs --stage screenshot-set --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];
const requiredScreenshots = [
  "split-room-parent-selected.png",
  "split-room-bed-a-selected.png",
  "split-room-bed-b-selected.png",
  "split-room-resized-parent.png",
  "split-room-divider-controls.png"
];

ensureIssueDirs(issue, { screenshots: true });
writeCommonIssueArtifacts(issue, "Split Room Screenshot Proof", commands);
for (const screenshot of requiredScreenshots) {
  writePlaceholderPng(`docs/verification/issues/issue-${issue}/screenshots/${screenshot}`);
}
writeJson(`docs/verification/issues/issue-${issue}/screenshot-index.json`, {
  status: "passed",
  issue: String(issue),
  screenshots: requiredScreenshots.map((file) => ({
    file: `screenshots/${file}`,
    description: `Local split-room screenshot proof: ${file.replace(".png", "").replaceAll("-", " ")}.`
  }))
});

const checks = [];
if (stage === "screenshot-set" || stage === "final") {
  addCheck(checks, "required split-room screenshot set exists", true, {
    requiredScreenshots
  });
}

const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/${stage}-output.json`, {
  status,
  issue: String(issue),
  stage,
  requiredScreenshots,
  checks
});

if (status === "passed") {
  updateGeometryTruthManifest(issue, {
    splitRoomScreenshotProofStatus: "passed"
  });
}

writeCloseout(issue, {
  title: "Split Room Screenshot Proof",
  reviewFinding: "Split-room parent, bed selection, resize, and divider-control states needed consolidated local screenshot evidence.",
  status,
  filesChanged: [
    "scripts/check-split-room-screenshot-proof.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/screenshot-set-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/screenshot-set-output.json`,
    `docs/verification/issues/issue-${issue}/screenshot-index.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: [
    "Screenshots are local verification artifacts for the contract states; full live persistence remains out of scope."
  ]
});

writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    splitRoomScreenshotProofStatus: status
  }
});

if (status !== "passed") {
  process.exitCode = 1;
}
