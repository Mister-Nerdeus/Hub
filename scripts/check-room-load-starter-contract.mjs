#!/usr/bin/env node
import {
  buildRoomLoadStarterContract,
  buildScenarioCapacityIntegration,
  validateRoomLoadStarterContract
} from "../packages/shared/dist/index.js";
import { createCheckContext, finalizeGate, runSelectedStages, writeJson, writeText } from "./lib/scenario-seed-foundation-utils.mjs";

const stages = ["room-load-contract", "eligibility", "excluded-space-negative", "no-simulation", "final"];
const context = createCheckContext({
  scriptName: "room-load starter contract",
  stages,
  statusKeyByStage: {
    "room-load-contract": "roomLoadStarterContractStatus",
    eligibility: "roomLoadStarterContractStatus",
    "excluded-space-negative": "roomLoadStarterContractStatus",
    "no-simulation": "roomLoadStarterContractStatus"
  },
  outputName: "room-load-starter-contract-gate-output.json",
  defaultIssue: "556"
});

const capacity = buildScenarioCapacityIntegration();
const contract = buildRoomLoadStarterContract(capacity, 3);
runSelectedStages(context, runStage);
finalizeGate(context, { testOutputName: "room-load-starter-contract.txt" });

function runStage(stage) {
  if (stage === "room-load-contract") {
    const validated = validateRoomLoadStarterContract(contract, capacity);
    context.add("room-load contract validates", validated.entries.length === capacity.assignmentEligibleCount, validated.entries.length);
    context.add("room-load source is synthetic planning input", validated.source === "synthetic planning input", validated.source);
    writeJson(`${context.dir}/room-load-contract-output.json`, { status: "passed", contract: validated });
    writeJson(`${context.dir}/synthetic-planning-input-output.json`, { status: "passed", source: validated.source });
  }
  if (stage === "eligibility") {
    context.add("entries are assignment eligible", contract.entries.every((entry) => capacity.assignmentEligibleBedPositionIds.includes(entry.loadableBedPositionId)));
    writeJson(`${context.dir}/room-load-eligibility-output.json`, { status: "passed", eligibleCount: capacity.assignmentEligibleCount });
  }
  if (stage === "excluded-space-negative") {
    let rejected = false;
    try {
      validateRoomLoadStarterContract({ ...contract, entries: [{ ...contract.entries[0], loadableBedPositionId: "room-14" }] }, capacity);
    } catch {
      rejected = true;
    }
    context.add("excluded spaces cannot receive room-load assumptions", rejected);
    writeJson(`${context.dir}/excluded-space-load-negative-output.json`, { status: "passed", rejected });
  }
  if (stage === "no-simulation") {
    context.add("room-load does not start simulation", contract.fullShiftSimulationStatus === "not_started", contract.fullShiftSimulationStatus);
    context.add("room-load does not claim outcomes", contract.patientOutcomeStatus === "not_started", contract.patientOutcomeStatus);
    writeText(`${context.dir}/no-patient-outcome-claim-output.txt`, "passed: room-load starter contract does not generate patient outcome claims\n");
  }
}

