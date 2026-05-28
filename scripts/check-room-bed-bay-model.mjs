#!/usr/bin/env node
import { addCheck, finalizeGate, parseArgs, readText } from "./lib/canonical-floorplan-fidelity-utils.mjs";

const stages = [
  "room-bed-bay-contract",
  "split-bay-semantics",
  "capacity-eligibility",
  "assignment-eligibility",
  "final"
];
const args = parseArgs();
const stage = args.stage ?? "final";
const issue = args.issue ?? "513";
const allowPartial = args["allow-partial"] === true;
if (!stages.includes(stage)) throw new Error(`Unsupported room/bed/bay model stage: ${stage}`);
const checks = [];

function run(currentStage) {
  if (currentStage === "room-bed-bay-contract") {
    const types = readText("packages/shared/src/floorplans/roomBedBayTypes.ts");
    addCheck(checks, "occupancy type includes room", types.includes('"room"'), "roomBedBayTypes.ts");
    addCheck(checks, "occupancy type includes bed_position", types.includes('"bed_position"'), "roomBedBayTypes.ts");
    addCheck(checks, "occupancy type includes split_bay", types.includes('"split_bay"'), "roomBedBayTypes.ts");
    addCheck(checks, "occupancy type includes storage/support/hallway", types.includes('"storage"') && types.includes('"support_area"') && types.includes('"hallway"'), "roomBedBayTypes.ts");
  }
  if (currentStage === "split-bay-semantics") {
    const split = readText("packages/shared/src/floorplans/splitBayContract.ts");
    for (const pair of ["room-02\", \"room-03", "room-04\", \"room-05", "room-06\", \"room-07", "room-08\", \"room-09"]) {
      addCheck(checks, `split bay pair ${pair} exists`, split.includes(pair), "splitBayContract.ts");
    }
    addCheck(checks, "manual visual review remains required", split.includes("finalVisualReviewRequired: true"), "splitBayContract.ts");
  }
  if (currentStage === "capacity-eligibility") {
    const rules = readText("packages/shared/src/floorplans/roomBedBayRules.ts");
    addCheck(checks, "storage excluded from bed and ratio counts", /storage:[\s\S]*bedCountEligible:\s*false[\s\S]*ratioEligible:\s*false/.test(rules), "roomBedBayRules.ts");
    addCheck(checks, "support area excluded from patient math", /support_area:[\s\S]*patientCareEligible:\s*false/.test(rules), "roomBedBayRules.ts");
    addCheck(checks, "hallway excluded from patient math", /hallway:[\s\S]*patientCareEligible:\s*false/.test(rules), "roomBedBayRules.ts");
  }
  if (currentStage === "assignment-eligibility") {
    const rules = readText("packages/shared/src/floorplans/roomBedBayRules.ts");
    addCheck(checks, "bed positions assignment eligible", rules.includes("bed_position") && rules.includes("...patientCare") && rules.includes("assignmentEligible: true"), "roomBedBayRules.ts");
    addCheck(checks, "storage assignment excluded", /storage:[\s\S]*assignmentEligible:\s*false/.test(rules), "roomBedBayRules.ts");
  }
}

for (const currentStage of stage === "final" ? stages.slice(0, -1) : [stage]) run(currentStage);

finalizeGate({
  stage,
  issue,
  allowPartial,
  checks,
  outputName: "room-bed-bay-model-output.json",
  manifestUpdates: {
    roomBedBayModelStatus: "passed",
    splitBaySemanticsStatus: "passed",
    storageLabelContractStatus: "passed"
  }
});
