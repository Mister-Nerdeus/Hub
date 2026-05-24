import assert from "node:assert/strict";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import test from "node:test";

import {
  NO_PHI_RUNTIME_REJECTION_CODE,
  validateManualAssignmentContract,
  validateOperationalReportContract,
  validateOperationalRuntimeText,
  validatePlanContract,
  validateShiftScenarioContract
} from "../dist/index.js";

const repoRoot = fileURLToPath(new URL("../../../", import.meta.url));
const fixturesDir = join(repoRoot, "packages", "shared", "fixtures");
const reportFixturesDir = join(fixturesDir, "reports");
const evidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-189");
const issue197EvidenceDir = join(repoRoot, "docs", "verification", "issues", "issue-197");

const blockedIdentityLabel = ["John", "Smith"].join(" ");
const blockedRecordLabel = ["M", "RN 12345"].join("");
const blockedClinicalLabel = ["Chest pain", "patient"].join(" ");
const blockedSafetyLabel = "Clinically safe 4:1 assignment";
const blockedBirthDateIdentifier = ["D", "OB 01/02/1980"].join("");
const blockedGovernmentIdentifier = ["S", "SN 123-45-6789"].join("");
const blockedContactIdentifier = "phone number 555-0100";
const blockedLocationIdentifier = "home address 100 Main Street";
const blockedInsuranceIdentifier = "insurance member ABC123";
const blockedWorkflowIdentifier = "encounter number ABC123";
const blockedLabIdentifier = "lab result ABC123";
const blockedDischargeIdentifier = "discharge summary ABC123";

function readFixture(name) {
  return JSON.parse(readFileSync(join(fixturesDir, name), "utf8"));
}

function readReportFixture(name) {
  return JSON.parse(readFileSync(join(reportFixturesDir, name), "utf8"));
}

function writeEvidence(name, payload) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(join(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function writeIssue197Evidence(name, payload) {
  mkdirSync(issue197EvidenceDir, { recursive: true });
  writeFileSync(join(issue197EvidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

function assertRuntimeRejection(action, rejectedValue) {
  assert.throws(
    action,
    (error) => {
      assert.match(error.message, new RegExp(NO_PHI_RUNTIME_REJECTION_CODE));
      assert.equal(error.message.includes(rejectedValue), false);
      return true;
    }
  );
}

test("runtime no-PHI text guard allows operational labels", () => {
  const allowedLabels = [
    "Room 14",
    "Nurse Blue",
    "Door Room 14",
    "Station Alpha",
    "Zone Fast Track",
    "Operational layout rehearsal"
  ];

  for (const label of allowedLabels) {
    assert.equal(validateOperationalRuntimeText(label, "label"), label);
  }

  writeEvidence("allowed-operational-labels-output.json", {
    issue: "189",
    status: "passed",
    guard: "runtime operational text",
    allowedLabelCount: allowedLabels.length
  });
});

test("runtime no-PHI text guard allows operational labels after identifier expansion", () => {
  const allowedLabels = [
    "Room 14",
    "Nurse Blue",
    "Door Room 14",
    "Station Alpha",
    "Zone Fast Track",
    "EMS Entry",
    "Main Hallway",
    "Hall Bed 01",
    "Operational layout rehearsal"
  ];

  for (const label of allowedLabels) {
    assert.equal(validateOperationalRuntimeText(label, "label"), label);
  }

  writeIssue197Evidence("allowed-operational-labels-output.json", {
    issue: "197",
    status: "passed",
    guard: "runtime operational text",
    allowedLabelCount: allowedLabels.length
  });
});

test("runtime no-PHI text guard rejects risky labels without echoing values", () => {
  const rejectedLabels = [
    { category: "identity-like", value: blockedIdentityLabel },
    { category: "record-identifier", value: blockedRecordLabel },
    { category: "clinical-note", value: blockedClinicalLabel },
    { category: "clinical-safety", value: blockedSafetyLabel }
  ];

  for (const rejected of rejectedLabels) {
    assertRuntimeRejection(
      () => validateOperationalRuntimeText(rejected.value, "label"),
      rejected.value
    );
  }

  writeEvidence("rejected-labels-output.json", {
    issue: "189",
    status: "passed",
    guard: "runtime operational text",
    rejectedCategories: rejectedLabels.map((rejected) => rejected.category),
    rejectionCode: NO_PHI_RUNTIME_REJECTION_CODE,
    echoesRejectedValues: false
  });
});

test("runtime no-PHI text guard rejects expanded identifier categories without echoing values", () => {
  const rejectedLabels = [
    { category: "birth-date identifier", value: blockedBirthDateIdentifier },
    { category: "government identifier", value: blockedGovernmentIdentifier },
    { category: "contact identifier", value: blockedContactIdentifier },
    { category: "location identifier", value: blockedLocationIdentifier },
    { category: "insurance identifier", value: blockedInsuranceIdentifier },
    { category: "encounter workflow identifier", value: blockedWorkflowIdentifier },
    { category: "lab workflow identifier", value: blockedLabIdentifier },
    { category: "discharge workflow identifier", value: blockedDischargeIdentifier }
  ];

  for (const rejected of rejectedLabels) {
    assertRuntimeRejection(
      () => validateOperationalRuntimeText(rejected.value, "label"),
      rejected.value
    );
  }

  writeIssue197Evidence("rejected-identifier-text-output.json", {
    issue: "197",
    status: "passed",
    guard: "runtime operational text",
    rejectedCategories: rejectedLabels.map((rejected) => rejected.category),
    rejectionCode: NO_PHI_RUNTIME_REJECTION_CODE,
    echoesRejectedValues: false
  });
});

test("runtime no-PHI text guard is enforced by major shared contracts", () => {
  const planWithBadRoomLabel = readFixture("plan-basic.json");
  planWithBadRoomLabel.rooms[0].label = blockedIdentityLabel;
  assertRuntimeRejection(() => validatePlanContract(planWithBadRoomLabel), blockedIdentityLabel);

  const planWithBadDescription = readFixture("plan-basic.json");
  planWithBadDescription.description = blockedRecordLabel;
  assertRuntimeRejection(() => validatePlanContract(planWithBadDescription), blockedRecordLabel);

  const scenarioWithBadName = readFixture("shift-scenario-basic.json");
  scenarioWithBadName.name = blockedClinicalLabel;
  assertRuntimeRejection(
    () => validateShiftScenarioContract(scenarioWithBadName),
    blockedClinicalLabel
  );

  const assignmentWithBadNurse = readFixture("manual-assignment-basic.json");
  assignmentWithBadNurse.nurses[0].name = blockedIdentityLabel;
  assertRuntimeRejection(
    () => validateManualAssignmentContract(assignmentWithBadNurse),
    blockedIdentityLabel
  );

  const reportWithBadTitle = readReportFixture("operational-report-basic.json");
  reportWithBadTitle.title = blockedSafetyLabel;
  assertRuntimeRejection(
    () => validateOperationalReportContract(reportWithBadTitle),
    blockedSafetyLabel
  );

  assert.doesNotThrow(() => validatePlanContract(readFixture("plan-basic.json")));
  assert.doesNotThrow(() => validateShiftScenarioContract(readFixture("shift-scenario-basic.json")));
  assert.doesNotThrow(() => validateManualAssignmentContract(readFixture("manual-assignment-basic.json")));
  assert.doesNotThrow(() => validateOperationalReportContract(readReportFixture("operational-report-basic.json")));

  writeEvidence("no-phi-runtime-output.json", {
    issue: "189",
    status: "passed",
    sharedContractsCovered: [
      "plan",
      "scenario",
      "manual assignment",
      "operational report"
    ],
    rejectionCode: NO_PHI_RUNTIME_REJECTION_CODE,
    allowedOperationalFixturesPass: true,
    rejectedValuesEchoed: false
  });
});
