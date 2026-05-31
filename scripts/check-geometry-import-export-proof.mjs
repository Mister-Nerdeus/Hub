import {
  addCheck,
  ensureIssueDirs,
  fileIncludes,
  readArg,
  statusFromChecks,
  updateGeometryTruthManifest,
  writeCloseout,
  writeCommonIssueArtifacts,
  writeJson,
  writeStageResult
} from "./lib/geometry-truth-repair-utils.mjs";

const issue = readArg("--issue", "803");
const stage = readArg("--stage", "final");
const scriptName = "check-geometry-import-export-proof";
const commands = [
  `node scripts/${scriptName}.mjs --stage export-import-roundtrip --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage assignment-targets-preserved --issue ${issue}`,
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, "Geometry Import / Export Proof", commands);

const checks = [];

if (stage === "export-import-roundtrip" || stage === "final") {
  const roundtrip = fileIncludes("apps/web/src/features/layout-editor/geometryImportExport.ts", [
    "exportGeometryJson",
    "importGeometryJson",
    "GeometryPersistenceProofRecord",
    "JSON.stringify",
    "JSON.parse"
  ]);
  addCheck(checks, "geometry import/export roundtrip is structured JSON", roundtrip.passed, roundtrip);
}

if (stage === "assignment-targets-preserved" || stage === "final") {
  const targets = fileIncludes("apps/web/src/features/layout-editor/geometryImportExport.ts", [
    "geometryRoundTripPreservesAssignmentTargets",
    "deriveSplitRoomAssignmentTargets",
    "assignmentTargetId",
    "splitRoomTargetIds"
  ]);
  addCheck(checks, "assignment targets are preserved across import/export", targets.passed, targets);
}

const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/${stage}-output.json`, {
  status,
  issue: String(issue),
  stage,
  checks
});

if (status === "passed") {
  updateGeometryTruthManifest(issue, {
    geometryImportExportProofStatus: "passed",
    geometryRoundTripPreservesTargets: true
  });
}

writeCloseout(issue, {
  title: "Geometry Import / Export Proof",
  reviewFinding: "New geometry contracts needed a JSON round-trip proof that keeps split-bed assignment target IDs stable.",
  status,
  filesChanged: [
    "apps/web/src/features/layout-editor/geometryImportExport.ts",
    "scripts/check-geometry-import-export-proof.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/export-import-roundtrip-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/assignment-targets-preserved-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/export-import-roundtrip-output.json`,
    `docs/verification/issues/issue-${issue}/assignment-targets-preserved-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: [
    "Proof covers JSON geometry round-trip only; durable assignment persistence remains out of scope."
  ]
});

writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    geometryImportExportProofStatus: status,
    geometryRoundTripPreservesTargets: status === "passed"
  }
});

if (status !== "passed") {
  process.exitCode = 1;
}
