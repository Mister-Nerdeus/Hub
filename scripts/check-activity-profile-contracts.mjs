#!/usr/bin/env node
import {
  busyActivityProfile,
  slammedActivityProfile,
  typicalActivityProfile,
  validateActivityProfileContract
} from "../packages/shared/dist/index.js";
import { createCheckContext, finalizeGate, runSelectedStages, writeJson, writeText } from "./lib/scenario-seed-foundation-utils.mjs";

const stages = ["typical", "busy", "slammed", "bounded-values", "no-outcome-claims", "final"];
const context = createCheckContext({
  scriptName: "activity profile contracts",
  stages,
  statusKeyByStage: {
    typical: "activityProfileContractStatus",
    busy: "activityProfileContractStatus",
    slammed: "activityProfileContractStatus",
    "bounded-values": "activityProfileContractStatus",
    "no-outcome-claims": "activityProfileContractStatus"
  },
  outputName: "activity-profile-contracts-gate-output.json",
  defaultIssue: "557"
});

runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "activity-profile-contracts.txt" });

function runStage(stage) {
  if (stage === "typical") {
    const profile = validateActivityProfileContract(typicalActivityProfile);
    context.add("Typical profile validates", profile.profileId === "typical", profile);
    writeJson(`${context.dir}/typical-profile-output.json`, { status: "passed", profile });
  }
  if (stage === "busy") {
    const profile = validateActivityProfileContract(busyActivityProfile);
    context.add("Busy profile validates", profile.profileId === "busy", profile);
    writeJson(`${context.dir}/busy-profile-output.json`, { status: "passed", profile });
  }
  if (stage === "slammed") {
    const profile = validateActivityProfileContract(slammedActivityProfile);
    context.add("Slammed profile validates", profile.profileId === "slammed", profile);
    writeJson(`${context.dir}/slammed-profile-output.json`, { status: "passed", profile });
  }
  if (stage === "bounded-values") {
    for (const profile of [typicalActivityProfile, busyActivityProfile, slammedActivityProfile]) {
      context.add(`${profile.profileId} bounded occupancy`, profile.occupancyPercent >= 0 && profile.occupancyPercent <= 100, profile.occupancyPercent);
    }
    writeJson(`${context.dir}/bounded-profile-validation-output.json`, { status: "passed" });
  }
  if (stage === "no-outcome-claims") {
    for (const profile of [typicalActivityProfile, busyActivityProfile, slammedActivityProfile]) {
      context.add(`${profile.profileId} has no outcome or compliance claim`, !profile.outcomeClaim && !profile.staffingComplianceClaim, profile);
    }
    writeText(`${context.dir}/no-outcome-claims-output.txt`, "passed: activity profiles are synthetic planning inputs and do not claim outcomes\n");
    writeText(`${context.dir}/no-compliance-claim-output.txt`, "passed: activity profiles do not claim staffing compliance\n");
  }
}

