import { addCheck, ensureIssueDirs, fileIncludes, readArg, statusFromChecks, updateGeometryTruthManifest, writeCloseout, writeCommonIssueArtifacts, writeJson, writeStageResult } from "./lib/geometry-truth-repair-utils.mjs";

const issue = readArg("--issue", "804");
const stage = readArg("--stage", "final");
const scriptName = "check-geometry-validation-summary-integration";
const commands = [
  `node scripts/${scriptName}.mjs --stage summary-row --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage detailed-panel --issue ${issue}`,
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueDirs(issue);
writeCommonIssueArtifacts(issue, "Geometry Validation Summary Integration", commands);
const checks = [];
if (stage === "summary-row" || stage === "final") {
  addCheck(checks, "compact validation row surfaces geometry truth warnings", fileIncludes("apps/web/src/features/layout-editor/EditorValidationSummaryRow.tsx", ["data-geometry-truth-validation-summary"]).passed);
  addCheck(checks, "shared geometry validation warning summary exists", fileIncludes("packages/shared/src/floorplans/geometryValidation.ts", ["GEOMETRY_TRUTH_WARNING_CODES", "summarizeGeometryTruthWarnings"]).passed);
}
if (stage === "detailed-panel" || stage === "final") {
  addCheck(checks, "detailed validation panel surfaces geometry truth warnings", fileIncludes("apps/web/src/features/layout-editor/LayoutValidationPanel.tsx", ["data-geometry-truth-validation-panel"]).passed);
}
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/${stage}-output.json`, { status, issue: String(issue), stage, checks });
if (status === "passed") updateGeometryTruthManifest(issue, { geometryValidationSummaryIntegrationStatus: "passed", geometryTruthWarningsSurfaceInValidation: true });
writeCloseout(issue, {
  title: "Geometry Validation Summary Integration",
  reviewFinding: "Geometry-truth warning codes needed a compact-row and detailed-panel surface.",
  status,
  filesChanged: ["apps/web/src/features/layout-editor/EditorValidationSummaryRow.tsx", "apps/web/src/features/layout-editor/LayoutValidationPanel.tsx", "packages/shared/src/floorplans/geometryValidation.ts", "scripts/check-geometry-validation-summary-integration.mjs", "docs/verification/geometry-truth-repair-manifest.json", `docs/verification/issues/issue-${issue}/`],
  commands,
  commandOutputMap: [
    { command: commands[0], outputs: [`docs/verification/issues/issue-${issue}/summary-row-output.json`] },
    { command: commands[1], outputs: [`docs/verification/issues/issue-${issue}/detailed-panel-output.json`] },
    { command: commands[2], outputs: [`docs/verification/issues/issue-${issue}/test-output/web.txt`] },
    { command: commands[3], outputs: [`docs/verification/issues/issue-${issue}/test-output/web-build.txt`] },
    { command: commands[4], outputs: [`docs/verification/issues/issue-${issue}/no-phi-output.txt`] }
  ],
  evidence: [`docs/verification/issues/issue-${issue}/summary-row-output.json`, `docs/verification/issues/issue-${issue}/detailed-panel-output.json`, `docs/verification/issues/issue-${issue}/manifest-update-output.json`],
  limitations: ["This surfaces geometry truth warning categories; it does not introduce assignment persistence."]
});
writeStageResult(issue, scriptName, stage, checks, { definitionOfDone: { geometryValidationSummaryIntegrationStatus: status, geometryTruthWarningsSurfaceInValidation: status === "passed" } });
if (status !== "passed") process.exitCode = 1;
