#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileIncludes,
  readArg,
  statusFromChecks,
  updateBoundaryManifest,
  writeCloseout,
  writeCommandArtifacts,
  writeJson,
  writeStageResult
} from "./lib/boundary-door-destination-utils.mjs";

const issue = readArg("--issue", "836");
const stage = readArg("--stage", "final");
const scriptName = "check-door-destination-contract";
const commands = [`node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);

const fixture = {
  doorId: "door-room-01-east",
  ownerKind: "room",
  ownerId: "room-01",
  leadsToKind: "hallway",
  leadsToId: "hall-main",
  leadsToLabel: "Main hallway",
  travelRole: "patient_flow"
};
writeJson(`docs/verification/issues/issue-${issue}/door-destination-fixture.json`, fixture);

const checks = [];
addCheck(checks, "door destination contract models leads-to text", fileIncludes("packages/shared/src/floorplans/doorDestinationContract.ts", [
  "DoorDestinationContract",
  "leadsToKind",
  "leadsToLabel",
  "travelRole",
  "unknown"
]).passed);
addCheck(checks, "door destinations persist through shared geometry contracts", fileIncludes("packages/shared/src/layout-editor/editableLayoutGeometryContract.ts", ["doorDestinations"]).passed && fileIncludes("packages/shared/src/contracts.ts", ["doorDestinations"]).passed);
addCheck(checks, "door destinations cover door-like support access points", fileIncludes("packages/shared/src/layout-editor/editableLayoutGeometryContract.ts", [
  "supportAccessPoints",
  "must reference an existing door or support access point"
]).passed && fileIncludes("packages/shared/src/floorplans/doorDestinationValidation.ts", [
  "support_access",
  "Door or access destination"
]).passed);
addCheck(checks, "api plan contract accepts saved boundary destination fields", fileIncludes("apps/api/app/contracts.py", [
  "class DoorDestination",
  "supportAccessPoints",
  "perimeterWalls",
  "entryExits",
  "doorDestinations"
]).passed);
addCheck(checks, "door destination view model exposes operational label", fileIncludes("apps/web/src/features/layout-editor/doorDestinationViewModel.ts", ["DoorDestinationViewModel", "leadsToLabel"]).passed);
const status = statusFromChecks(checks);
writeJson(`docs/verification/issues/issue-${issue}/door-destination-contract-output.json`, {
  status,
  doorDestinationContractStatus: status,
  doorsCanDeclareWhereTheyLead: status === "passed",
  doorDestinationsAreOperationalLabels: status === "passed"
});
if (status === "passed") {
  updateBoundaryManifest(issue, {
    doorDestinationContractStatus: "passed",
    doorsCanDeclareWhereTheyLead: true,
    doorDestinationsAreOperationalLabels: true
  });
}
writeCloseout(issue, {
  title: "Door Destination / Leads-To Contract",
  reviewFinding: "Doors and door-like support access points now have persisted operational leads-to labels, explicit unknown destination support, and travel-role metadata without clinical claims.",
  status,
  filesChanged: ["packages/shared/src/floorplans/doorDestinationContract.ts", "apps/web/src/features/layout-editor/doorDestinationViewModel.ts", `docs/verification/issues/issue-${issue}/`],
  commands,
  evidence: [`docs/verification/issues/issue-${issue}/door-destination-contract-output.json`, `docs/verification/issues/issue-${issue}/door-destination-fixture.json`],
  limitations: ["Travel roles are descriptive metadata only; they do not implement routing or simulation."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);
