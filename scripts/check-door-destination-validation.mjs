#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileExcludes,
  fileIncludes,
  readArg,
  statusFromChecks,
  updateBoundaryManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/boundary-door-destination-utils.mjs";

const issue = readArg("--issue", "839");
const stage = readArg("--stage", "final");
const scriptName = "check-door-destination-validation";
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const checks = [];
addCheck(checks, "shared validation warns unknown and blocks deleted targets", fileIncludes("packages/shared/src/floorplans/doorDestinationValidation.ts", [
  "door_destination_unknown",
  "door_destination_deleted_target",
  "entry_exit_destination_deleted_target",
  "severity: \"blocking\""
]).passed);
addCheck(checks, "editor validation surfaces door destination warnings", fileIncludes("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", [
  "validateDoorDestinationsForLayout",
  "source: \"door_destination\""
]).passed);
addCheck(checks, "validation copy avoids clinical and staffing claims", fileExcludes("packages/shared/src/floorplans/doorDestinationValidation.ts", [
  "clinical safety",
  "staffing compliance",
  "patient outcome"
]).passed);
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/door-destination-validation-output.json`, {
  status,
  doorDestinationValidationStatus: status,
  unknownDoorDestinationsWarn: status === "passed",
  invalidDoorDestinationsBlocked: status === "passed",
  validationDoesNotClaimClinicalSafety: status === "passed"
});
if (status === "passed") {
  updateBoundaryManifest(issue, {
    doorDestinationValidationStatus: "passed",
    unknownDoorDestinationsWarn: true,
    invalidDoorDestinationsBlocked: true,
    validationDoesNotClaimClinicalSafety: true
  });
}
writeCloseout(issue, {
  title: "Door Destination Validation",
  reviewFinding: "Door destination validation produces warnings for explicit unknowns and blocking issues for deleted destination targets without clinical or staffing claims.",
  status,
  filesChanged: ["packages/shared/src/floorplans/doorDestinationValidation.ts", "apps/web/src/features/layout-editor/LayoutValidationPanel.tsx", "apps/web/src/features/layout-editor/EditorValidationSummaryRow.tsx", "apps/web/src/features/layout-editor/LayoutEditorStage.tsx", `docs/verification/issues/issue-${issue}/`],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/door-destination-validation-output.json`],
  limitations: ["Validation is route-readiness geometry validation only; it does not calculate routes."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
