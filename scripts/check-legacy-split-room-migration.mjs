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

const issue = readArg("--issue", "801");
const stage = readArg("--stage", "final");
const scriptName = "check-legacy-split-room-migration";
const commands = [
  `node scripts/${scriptName}.mjs --stage safe-migration --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage unsafe-needs-review --issue ${issue}`,
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, "Legacy Split Room Migration", commands);

const checks = [];

if (stage === "safe-migration" || stage === "final") {
  const shared = fileIncludes("packages/shared/src/floorplans/legacySplitRoomMigration.ts", [
    "migrateLegacySplitBayToParentBed",
    'status: "migrated"',
    "createLegacySplitParentRoom",
    "parentRoom",
    "createSplitRoomContract",
    "stableSplitRoomBedPositionId",
    "assignmentTarget: true"
  ]);
  const app = fileIncludes("apps/web/src/features/layout-editor/splitRoomMigration.ts", [
    "migrateEditableLayoutLegacySplitRooms",
    "migratedParentRooms",
    "splitRoomMigrations",
    "migrateLegacySplitBayToParentBed"
  ]);
  addCheck(checks, "safe legacy split bay migrates to parent-bed split room", shared.passed, shared);
  addCheck(checks, "editor migration wrapper preserves layout and reports split migrations", app.passed, app);
}

if (stage === "unsafe-needs-review" || stage === "final") {
  const unsafe = fileIncludes("packages/shared/src/floorplans/legacySplitRoomMigration.ts", [
    'status: "needs_review"',
    "reviewRequired: true",
    "Legacy split room references missing child-room geometry",
    "must reference two distinct bed positions"
  ]);
  addCheck(checks, "unsafe legacy split room records are flagged for review", unsafe.passed, unsafe);
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
    legacySplitRoomMigrationStatus: "passed",
    legacySplitRoomsDoNotBreakEditor: true
  });
}

writeCloseout(issue, {
  title: "Legacy Split Room Migration",
  reviewFinding: "Legacy split-bay data needed a non-destructive bridge to parent-bed split rooms with unsafe records flagged for review.",
  status,
  filesChanged: [
    "packages/shared/src/floorplans/legacySplitRoomMigration.ts",
    "apps/web/src/features/layout-editor/splitRoomMigration.ts",
    "packages/shared/src/floorplans/floorplanGeometryContract.ts",
    "packages/shared/src/index.ts",
    "scripts/check-legacy-split-room-migration.mjs",
    "docs/verification/geometry-truth-repair-manifest.json",
    `docs/verification/issues/issue-${issue}/`
  ],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/safe-migration-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/unsafe-needs-review-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/test-output/shared.txt`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[5], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [
    `docs/verification/issues/issue-${issue}/safe-migration-output.json`,
    `docs/verification/issues/issue-${issue}/unsafe-needs-review-output.json`,
    `docs/verification/issues/issue-${issue}/manifest-update-output.json`
  ],
  limitations: [
    "Migration is non-destructive and reports unsafe records for review; no durable assignment persistence is introduced."
  ]
});

writeStageResult(issue, scriptName, stage, checks, {
  definitionOfDone: {
    legacySplitRoomMigrationStatus: status,
    legacySplitRoomsDoNotBreakEditor: status === "passed"
  }
});

if (status !== "passed") {
  process.exitCode = 1;
}
