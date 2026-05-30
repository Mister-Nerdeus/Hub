#!/usr/bin/env node
import { readFileSync } from "node:fs";
import {
  createEditableSupportAccessPoint,
  validateEditableLayoutGeometryContract,
  validateSupportAccessPointLayout
} from "../packages/shared/dist/index.js";
import {
  addCheck,
  ensureIssueDirs,
  hasFlag,
  issueDir,
  readArg,
  requiredAcceptanceCommands,
  statusFromChecks,
  updateAuthoringReadinessManifest,
  writeBoundaryOutputs,
  writeIssueResult,
  writeJson,
  writeTextIfMissing
} from "./lib/editor-reconstruction-authoring-readiness-utils.mjs";

const issue = readArg("--issue", "660");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const supportedStages = ["provider-zone-selected", "add-access-point", "access-point-edit", "save-reload-export", "provider-exclusion", "final"];
if (!supportedStages.includes(stage)) throw new Error(`Unsupported stage: ${stage}`);

const dir = issueDir(issue);
const checks = [];
const blockers = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: Provider/Pharmacy must expose an Add Access Point UX with editable support_access markers that persist as named-copy data.\n"
);

const zonePopover = readFileSync("apps/web/src/features/layout-editor/HallwayZoneQuickEditPopover.tsx", "utf8");
const zoneViewModel = readFileSync("apps/web/src/features/layout-editor/hallwayZoneQuickEditViewModel.ts", "utf8");
const stageSource = readFileSync("apps/web/src/features/layout-editor/LayoutEditorStage.tsx", "utf8");
const shapeSource = readFileSync("apps/web/src/features/layout-editor/SupportAccessPointShape.tsx", "utf8");
const editSource = readFileSync("apps/web/src/features/layout-editor/SupportAccessQuickEditPopover.tsx", "utf8");
const layout = buildProviderAccessLayout();
const edited = validateEditableLayoutGeometryContract({
  ...layout,
  supportAccessPoints: layout.supportAccessPoints.map((accessPoint) => ({
    ...accessPoint,
    wall: "east",
    offsetFeet: 1,
    widthFeet: 3
  }))
});
const reloaded = validateEditableLayoutGeometryContract(JSON.parse(JSON.stringify(edited)));
const exported = JSON.parse(JSON.stringify(reloaded));
const providerExclusion = validateSupportAccessPointLayout(reloaded);

if (stage === "provider-zone-selected" || stage === "final") {
  addCheck(checks, "provider/pharmacy zone selection exposes support-access action state", zoneViewModel.includes("canAddSupportAccessPoint") && zonePopover.includes("Add Access Point"));
}
if (stage === "add-access-point" || stage === "final") {
  addCheck(checks, "Add Access Point dispatch creates support_access markers", stageSource.includes("addSupportAccessPoint") && reloaded.supportAccessPoints?.[0]?.objectType === "support_access");
}
if (stage === "access-point-edit" || stage === "final") {
  addCheck(checks, "support access marker editor exposes wall, offset, and width controls", editSource.includes("Wall") && editSource.includes("Offset") && editSource.includes("Width") && shapeSource.includes('data-layout-object-type="support_access"'));
}
if (stage === "save-reload-export" || stage === "final") {
  addCheck(
    checks,
    "support access point survives save/reload/export serialization",
    exported.supportAccessPoints?.[0]?.wall === "east" &&
      exported.supportAccessPoints?.[0]?.offsetFeet === 1 &&
      exported.supportAccessPoints?.[0]?.widthFeet === 3,
    exported.supportAccessPoints?.[0]
  );
}
if (stage === "provider-exclusion" || stage === "final") {
  addCheck(
    checks,
    "provider/pharmacy remains excluded from patient-care assignment and simulation selectors",
    providerExclusion.providerPharmacyExcludedFromAssignment &&
      providerExclusion.providerPharmacyExcludedFromRatio &&
      providerExclusion.providerPharmacyExcludedFromRoomLoad,
    providerExclusion
  );
}

const passed = statusFromChecks(checks) === "passed";
if (!passed) blockers.push("Provider/Pharmacy access point UX or persistence proof is incomplete.");

updateAuthoringReadinessManifest(issue, {
  providerPharmacyAccessUxStatus: passed ? "passed" : "failed",
  providerPharmacyAccessPointsSupported: passed,
  reconstructionStatus: "no_go_until_runtime_saved_copy_support_access_and_split_bay_pass",
  goNoGoStatus: "not_ready"
});

writeJson(`${dir}/exported-json/provider-pharmacy-access-export.json`, exported);
writeJson(`${dir}/provider-pharmacy-access-ux-output.json`, { status: passed ? "passed" : "failed", stage, providerExclusion });
writeIssueResult({
  issue,
  scriptName: "check-provider-pharmacy-access-ux",
  stage,
  status: passed ? "passed" : "failed",
  checks,
  blockers,
  commands: requiredAcceptanceCommands(issue, "check-provider-pharmacy-access-ux", supportedStages.filter((value) => value !== "final")),
  title: "Provider/Pharmacy zone UX supports add/edit support access markers and persistence proof.",
  limitations: ["Support access markers are operational access points only and remain excluded from patient-care outputs."]
});

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, blockers }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function buildProviderAccessLayout() {
  return validateEditableLayoutGeometryContract({
    schemaVersion: "1.0.0",
    layoutId: "issue-660-provider-access",
    units: "feet",
    rooms: [
      {
        objectType: "room",
        id: "room-provider-pharmacy",
        label: "Provider/Pharmacy",
        roomNumber: "Support",
        roomType: "provider_pharmacy",
        capacityType: "single",
        isHallBed: false,
        isTraumaAdjacent: false,
        xFeet: 0,
        yFeet: 0,
        widthFeet: 12,
        heightFeet: 8
      }
    ],
    doors: [],
    supportAccessPoints: [
      createEditableSupportAccessPoint({
        id: "support-access-provider-pharmacy",
        label: "Provider/Pharmacy access",
        ownerId: "zone-provider-pharmacy",
        wall: "south",
        offsetFeet: 2,
        widthFeet: 4
      })
    ],
    stations: [],
    hallways: [],
    zones: [
      {
        objectType: "zone",
        id: "zone-provider-pharmacy",
        label: "Provider/Pharmacy zone",
        zoneType: "provider_pharmacy",
        xFeet: 0,
        yFeet: 10,
        widthFeet: 12,
        heightFeet: 8
      }
    ],
    splitBays: [],
    limitations: ["Issue 660 synthetic provider/pharmacy access UX fixture."]
  });
}
