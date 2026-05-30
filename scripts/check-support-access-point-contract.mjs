#!/usr/bin/env node
import {
  createEditableSupportAccessPoint,
  summarizeSupportAccessPointContract,
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

const issue = readArg("--issue", "659");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const supportedStages = ["contract", "provider-pharmacy-zone-owner", "solid-wall-negative", "non-patient-exclusion", "final"];
if (!supportedStages.includes(stage)) throw new Error(`Unsupported stage: ${stage}`);

const dir = issueDir(issue);
const checks = [];
const blockers = [];

ensureIssueDirs(issue);
writeBoundaryOutputs(issue);
writeTextIfMissing(
  `${dir}/first-failure.txt`,
  "Failure class: support access points must be dedicated support_access objects owned by support zones, not patient-room doors.\n"
);

const layout = buildSupportAccessLayout();
const validation = validateSupportAccessPointLayout(layout);
const contract = summarizeSupportAccessPointContract({
  supportAccessPoints: layout.supportAccessPoints,
  zones: layout.zones,
  patientRoomDoorCount: layout.doors.length
});

if (stage === "contract" || stage === "final") {
  addCheck(checks, "support access contract validates dedicated support_access geometry", validation.status === "passed" && contract.status === "passed", { validation, contract });
}
if (stage === "provider-pharmacy-zone-owner" || stage === "final") {
  addCheck(checks, "provider/pharmacy access point is owned by a provider/pharmacy zone", validation.providerPharmacyAccessPointCount === 1, validation);
}
if (stage === "solid-wall-negative" || stage === "final") {
  let negativePassed = false;
  try {
    validateEditableLayoutGeometryContract({
      ...layout,
      doors: [
        ...layout.doors,
        {
          objectType: "door",
          id: "door-solid-wall-negative",
          label: "Blocked wall door negative",
          ownerKind: "room",
          ownerId: "room-solid-wall",
          wall: "north",
          offsetFeet: 1,
          widthFeet: 3
        }
      ]
    });
  } catch (error) {
    negativePassed = error instanceof Error && /solid_wall/u.test(error.message);
  }
  addCheck(checks, "solid-wall room remains ineligible for normal doors", negativePassed);
}
if (stage === "non-patient-exclusion" || stage === "final") {
  addCheck(
    checks,
    "provider/pharmacy remains excluded from assignment, ratio, and room-load selectors",
    validation.providerPharmacyExcludedFromAssignment &&
      validation.providerPharmacyExcludedFromRatio &&
      validation.providerPharmacyExcludedFromRoomLoad,
    validation
  );
}

const passed = statusFromChecks(checks) === "passed";
if (!passed) blockers.push("Support access point contract did not satisfy one or more local checks.");

updateAuthoringReadinessManifest(issue, {
  supportAccessContractStatus: passed ? "passed" : "failed",
  supportAccessPointContractSupported: passed,
  reconstructionStatus: "no_go_until_runtime_saved_copy_support_access_and_split_bay_pass",
  goNoGoStatus: "not_ready"
});

writeJson(`${dir}/support-access-point-contract-output.json`, { status: passed ? "passed" : "failed", stage, validation, contract });
writeIssueResult({
  issue,
  scriptName: "check-support-access-point-contract",
  stage,
  status: passed ? "passed" : "failed",
  checks,
  blockers,
  commands: requiredAcceptanceCommands(issue, "check-support-access-point-contract", supportedStages.filter((value) => value !== "final")),
  title: "Support access points use a dedicated support_access contract and keep Provider/Pharmacy non-patient.",
  limitations: ["Support access points are operational access markers only."]
});

console.log(JSON.stringify({ status: passed ? "passed" : "failed", issue, stage, blockers }, null, 2));
if (!passed && !allowPartial) process.exit(1);

function buildSupportAccessLayout() {
  return validateEditableLayoutGeometryContract({
    schemaVersion: "1.0.0",
    layoutId: "issue-659-support-access",
    units: "feet",
    rooms: [
      room("room-01", "Room 01", "01", "standard", 0, 0),
      room("room-provider-pharmacy", "Provider/Pharmacy", "Support", "provider_pharmacy", 16, 0),
      room("room-solid-wall", "Blocked wall", "Wall", "solid_wall", 32, 0)
    ],
    doors: [
      {
        objectType: "door",
        id: "door-room-01",
        label: "Room 01 door",
        ownerKind: "room",
        ownerId: "room-01",
        wall: "south",
        offsetFeet: 2,
        widthFeet: 4
      }
    ],
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
        xFeet: 16,
        yFeet: 12,
        widthFeet: 14,
        heightFeet: 8
      }
    ],
    splitBays: [],
    limitations: ["Issue 659 synthetic support-access contract fixture."]
  });
}

function room(id, label, roomNumber, roomType, xFeet, yFeet) {
  return {
    objectType: "room",
    id,
    label,
    roomNumber,
    roomType,
    capacityType: "single",
    isHallBed: false,
    isTraumaAdjacent: false,
    xFeet,
    yFeet,
    widthFeet: 10,
    heightFeet: 8
  };
}
