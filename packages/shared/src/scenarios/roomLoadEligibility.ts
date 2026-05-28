import {
  ROOM_LOAD_BANDS,
  ROOM_LOAD_OCCUPANCY_STATES,
  ROOM_LOAD_STARTER_SCHEMA_VERSION,
  type RoomLoadStarterContract,
  type RoomLoadStarterEntry
} from "./roomLoadStarterContract.js";
import type { ScenarioCapacityIntegration } from "./scenarioCapacityIntegration.js";

export function buildRoomLoadStarterContract(
  capacity: ScenarioCapacityIntegration,
  occupiedLimit = 0
): RoomLoadStarterContract {
  const entries = capacity.assignmentEligibleBedPositionIds.map((loadableBedPositionId, index) => ({
    loadableBedPositionId,
    occupancyState: index < occupiedLimit ? "occupied" : "unoccupied",
    acuityBandPlaceholder: "placeholder_medium",
    complexityBandPlaceholder: "placeholder_medium",
    supportNeedPlaceholder: "placeholder_low",
    source: "synthetic planning input",
    fullShiftSimulationStatus: "not_started",
    syntheticDataOnly: true
  })) satisfies RoomLoadStarterEntry[];

  return {
    schemaVersion: ROOM_LOAD_STARTER_SCHEMA_VERSION,
    contractId: "room-load-starter-canonical-plan-1",
    canonicalScenarioSeedId: capacity.canonicalScenarioSeedId,
    entries,
    source: "synthetic planning input",
    fullShiftSimulationStatus: "not_started",
    patientOutcomeStatus: "not_started",
    clinicalSafetyScoringStatus: "not_started",
    syntheticDataOnly: true
  };
}

export function validateRoomLoadStarterContract(
  contract: RoomLoadStarterContract,
  capacity: ScenarioCapacityIntegration
): RoomLoadStarterContract {
  if (contract.schemaVersion !== ROOM_LOAD_STARTER_SCHEMA_VERSION) {
    throw new Error("room-load starter schema version is unsupported");
  }
  if (
    contract.fullShiftSimulationStatus !== "not_started" ||
    contract.patientOutcomeStatus !== "not_started" ||
    contract.clinicalSafetyScoringStatus !== "not_started"
  ) {
    throw new Error("room-load starter must not execute simulation, outcomes, or clinical scoring");
  }
  const eligible = new Set(capacity.assignmentEligibleBedPositionIds);
  const excluded = new Set(capacity.excludedObjectIds);
  const seen = new Set<string>();
  for (const entry of contract.entries) {
    validateRoomLoadStarterEntry(entry);
    if (excluded.has(entry.loadableBedPositionId) || !eligible.has(entry.loadableBedPositionId)) {
      throw new Error("room-load starter entry must reference assignment-eligible bed positions only");
    }
    if (seen.has(entry.loadableBedPositionId)) {
      throw new Error("room-load starter entries must be unique by bed position");
    }
    seen.add(entry.loadableBedPositionId);
  }
  return contract;
}

function validateRoomLoadStarterEntry(entry: RoomLoadStarterEntry): void {
  if (!ROOM_LOAD_OCCUPANCY_STATES.includes(entry.occupancyState)) {
    throw new Error("room-load occupancy state is unsupported");
  }
  for (const [label, value] of [
    ["acuity", entry.acuityBandPlaceholder],
    ["complexity", entry.complexityBandPlaceholder],
    ["support", entry.supportNeedPlaceholder]
  ] as const) {
    if (!ROOM_LOAD_BANDS.includes(value)) {
      throw new Error(`room-load ${label} placeholder is unsupported`);
    }
  }
  if (entry.source !== "synthetic planning input" || entry.fullShiftSimulationStatus !== "not_started" || entry.syntheticDataOnly !== true) {
    throw new Error("room-load entry must remain a synthetic planning input");
  }
}

