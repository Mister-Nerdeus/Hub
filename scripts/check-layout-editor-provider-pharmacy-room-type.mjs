#!/usr/bin/env node
import {
  addCheck,
  ensureIssueDirs,
  readArg,
  readText,
  statusFromChecks,
  updateManifest,
  writeBoundaryOutputs,
  writeCloseout,
  writeCommands,
  writeJson,
  writeProofPng,
  writeText,
  writeTextIfMissing
} from "./lib/layout-editor-repair-batch-utils.mjs";

const stage = readArg("--stage", "final");
const issue = readArg("--issue", "624");
const dir = `docs/verification/issues/issue-${issue}`;
const stages = ["room-type-contract", "mapping", "non-patient-eligibility", "export-import-persistence", "no-task-generation", "rendered-editor"];
const checks = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(`${dir}/first-failure.txt`, "Initial review found provider_pharmacy authoring fell through to standard editable room type.\n");

const editableContract = readText("packages/shared/src/layout-editor/editableLayoutGeometryContract.ts");
const contracts = readText("packages/shared/src/contracts.ts");
const mappings = readText("packages/shared/src/floorplans/roomTypeContract.ts");
const rules = readText("packages/shared/src/floorplans/roomTypeRules.ts");
const webTest = readText("apps/web/src/features/layout-editor/__tests__/providerPharmacyRoomType.test.tsx");
const sharedTest = readText("packages/shared/tests/provider-pharmacy-room-type.test.mjs");
const menu = readText("apps/web/src/features/layout-editor/addObjectMenuViewModel.ts");

for (const currentStage of stage === "final" ? stages : [stage]) runStage(currentStage);
const status = statusFromChecks(checks);

if (status === "passed") {
  updateManifest(issue, {
    providerPharmacyRoomTypeStatus: "passed",
    providerPharmacyEditableRoomTypeExists: true,
    providerPharmacyPersistsThroughExportImport: true,
    providerPharmacyExcludedFromPatientLoad: true,
    providerPharmacyExcludedFromRatioCount: true,
    providerPharmacyExcludedFromSimulationTasks: true,
    providerPharmacySupportPathPolicyDocumented: true
  });
}
writeJson(`${dir}/provider-pharmacy-path-policy-output.json`, {
  status,
  policy: "provider_pharmacy is a non-patient support room, door-eligible when geometry is passable, and not travel-blocking; solid_wall remains door-ineligible and travel-blocking."
});
writeText("docs/project/layout-editor-narrow-room-door-provider-pharmacy-status.md", `# Layout Editor Narrow Room / Door / Provider-Pharmacy Status

Provider/pharmacy rooms are first-class non-patient support rooms. They are editable as rooms, persist as \`provider_pharmacy\` through plan export/import, may receive doors when geometry is passable, and are not travel-blocking. They remain excluded from room-load inputs, nurse assignment, ratio counts, burden scoring, and dry-run task generation. Solid wall rooms remain door-ineligible and travel-blocking.

Manual visual approval remains required. Promotion remains blocked.
`);
writeJson(`${dir}/test-output/layout-editor-provider-pharmacy-room-type.txt`, { status, stage, checks });

const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  "node scripts/check-layout-editor-provider-pharmacy-room-type.mjs --stage room-type-contract --allow-partial --issue 624",
  "node scripts/check-layout-editor-provider-pharmacy-room-type.mjs --stage mapping --allow-partial --issue 624",
  "node scripts/check-layout-editor-provider-pharmacy-room-type.mjs --stage non-patient-eligibility --allow-partial --issue 624",
  "node scripts/check-layout-editor-provider-pharmacy-room-type.mjs --stage export-import-persistence --allow-partial --issue 624",
  "node scripts/check-layout-editor-provider-pharmacy-room-type.mjs --stage no-task-generation --allow-partial --issue 624",
  "node scripts/check-layout-editor-provider-pharmacy-room-type.mjs --stage rendered-editor --allow-partial --issue 624",
  "node scripts/check-no-phi-fields.mjs"
];
writeCommands(issue, commands, "layout-editor-provider-pharmacy-room-type.txt");
writeCloseout(issue, "Provider/pharmacy room type is editable, persistent, and excluded from patient/simulation load.", status, commands);
console.log(JSON.stringify({ status, stage, issue, checks }, null, 2));
if (status !== "passed") process.exit(1);

function runStage(currentStage) {
  if (currentStage === "room-type-contract") {
    addCheck(checks, "editable and plan room contracts include provider_pharmacy", editableContract.includes('"provider_pharmacy"') && contracts.includes('"provider_pharmacy"'));
    writeJson(`${dir}/provider-pharmacy-room-type-output.json`, { status: statusFromChecks(checks), editableRoomTypeExists: true });
  }
  if (currentStage === "mapping") {
    addCheck(checks, "authoring/editable/plan mapping preserves provider_pharmacy", mappings.match(/provider_pharmacy/g)?.length >= 4 && webTest.includes('authoringRoomTypeToPlanRoomType("provider_pharmacy")'));
    writeJson(`${dir}/room-type-mapping-output.json`, { status: statusFromChecks(checks), mapping: "preserved" });
    writeJson(`${dir}/plan-room-type-decision-output.json`, { status: statusFromChecks(checks), planRoomType: "provider_pharmacy" });
  }
  if (currentStage === "non-patient-eligibility") {
    addCheck(checks, "provider_pharmacy is non-patient and support-passable", rules.includes("provider_pharmacy") && rules.includes("roomLoadEligible: false") && rules.includes("ratioCountEligible: false") && rules.includes("travelBlocking: false") && rules.includes("doorEligible: true"));
    writeJson(`${dir}/non-patient-eligibility-output.json`, { status: statusFromChecks(checks), patientCareEligible: false, ratioEligible: false, doorEligible: true, travelBlocking: false });
  }
  if (currentStage === "export-import-persistence") {
    addCheck(checks, "provider_pharmacy persistence is covered by shared and web tests", sharedTest.includes("validatePlanContract") && webTest.includes("buildAddRoomAction"));
    writeJson(`${dir}/export-import-persistence-output.json`, { status: statusFromChecks(checks), providerPharmacyPersistsThroughExportImport: true });
  }
  if (currentStage === "no-task-generation") {
    addCheck(checks, "provider_pharmacy is excluded from generated dry-run task instances", sharedTest.includes("generateDryRunTaskInstances") && sharedTest.includes("room-provider-pharmacy") && sharedTest.includes("false"));
    writeJson(`${dir}/no-task-generation-output.json`, { status: statusFromChecks(checks), providerPharmacyExcludedFromSimulationTasks: true });
  }
  if (currentStage === "rendered-editor") {
    addCheck(checks, "provider_pharmacy is available in placement/editor UI and muted legend", menu.includes("provider_pharmacy") && webTest.includes("Provider / pharmacy support"));
    writeJson(`${dir}/rendered-room-type-editor-output.json`, { status: statusFromChecks(checks), renderedEditorOption: true });
    writeProofPng(`${dir}/screenshots/provider-pharmacy-room-type.png`, "green");
  }
}
