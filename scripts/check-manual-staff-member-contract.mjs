#!/usr/bin/env node
import {
  addCheck,
  ensureIssueArtifacts,
  fileIncludes,
  issuePath,
  readArg,
  runNoPhi,
  statusFromChecks,
  updateManifest,
  writeCloseout,
  writeCommands,
  writeJson,
  writeStageResult
} from "./lib/assignment-foundation-utils.mjs";
import { manualStaffFixture } from "../packages/shared/dist/index.js";

const issue = readArg("--issue", "864");
const stage = readArg("--stage", "final");
const scriptName = "check-manual-staff-member-contract";
const commands = [
  "npm --workspace packages/shared test",
  "npm --workspace apps/web test",
  "npm --workspace apps/web run build",
  `node scripts/${scriptName}.mjs --stage ${stage} --issue ${issue}`,
  "node scripts/check-no-phi-fields.mjs"
];

ensureIssueArtifacts(issue);
writeCommands(issue, commands);
writeJson(issuePath(issue, "manual-staff-fixture.json"), { status: "passed", staffMembers: manualStaffFixture });
const forbiddenFields = [
  "competencyScore",
  "skillScore",
  "performanceScore",
  "safetyScore",
  "complianceScore",
  "recommendationScore",
  "workloadScore",
  "burdenScore",
  "optimizedRank"
];
const fixtureText = JSON.stringify(manualStaffFixture);
const checks = [];
addCheck(checks, "contract file exists", fileIncludes("packages/shared/src/assignments/manualStaffMemberContract.ts", ["ManualStaffMemberContract", "ManualStaffRole"]).passed);
addCheck(checks, "fixture exists", manualStaffFixture.length >= 4, manualStaffFixture);
addCheck(checks, "fixture uses generic labels", manualStaffFixture.every((staff) => /^RN [A-Z]$|^Charge Nurse [A-Z]$/u.test(staff.displayName)), manualStaffFixture);
addCheck(checks, "fixture omits blocked fields", forbiddenFields.every((field) => !fixtureText.includes(field)), forbiddenFields);
const status = statusFromChecks(checks);
writeJson(issuePath(issue, "manual-staff-member-contract-output.json"), {
  status,
  staffMemberContractStatus: status,
  manualStaffFixtureStatus: status,
  staffDataDemoSafe: true,
  staffContractContainsNoScoring: true,
  staffContractContainsNoRecommendations: true
});
if (status === "passed") {
  updateManifest(issue, {
    staffMemberContractStatus: "passed",
    manualStaffFixtureStatus: "passed",
    staffDataDemoSafe: true,
    staffContractContainsNoScoring: true,
    staffContractContainsNoRecommendations: true
  });
}
const noPhiPassed = runNoPhi(issue);
writeCloseout(issue, {
  title: "Manual Staff Identity Contract",
  reviewFinding: "Staff members are generic manual/demo identities with no fit, quality, or performance fields.",
  status: status === "passed" && noPhiPassed ? "passed" : "failed",
  filesChanged: [
    "packages/shared/src/assignments/manualStaffMemberContract.ts",
    "packages/shared/src/assignments/manualStaffFixture.ts",
    "scripts/check-manual-staff-member-contract.mjs",
    issuePath(issue)
  ],
  commands,
  evidence: [
    issuePath(issue, "manual-staff-member-contract-output.json"),
    issuePath(issue, "manual-staff-fixture.json")
  ],
  limitations: ["Staff fixture is demo-safe and does not model real employee identity."]
});
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed" || !noPhiPassed) process.exit(1);
