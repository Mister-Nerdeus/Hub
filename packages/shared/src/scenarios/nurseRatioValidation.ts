import {
  NURSE_RATIO_CONTRACT_SCHEMA_VERSION,
  NURSE_RATIO_IDS,
  NURSE_RATIO_NON_CLAIM_COPY,
  type NurseRatioContract
} from "./nurseRatioContract.js";
import {
  requireScenarioEnum,
  requireScenarioExactKeys,
  requireScenarioInteger,
  requireScenarioLiteralTrue,
  requireScenarioRecord,
  requireScenarioString
} from "./scenarioValidationUtils.js";

const nurseRatioKeys = [
  "schemaVersion",
  "ratioId",
  "label",
  "maxOccupiedRoomsPerNurse",
  "targetOccupiedRoomsPerNurse",
  "warningThresholdOccupiedRooms",
  "displayCopy",
  "nonClaimCopy",
  "syntheticDataOnly"
] as const;

export function validateNurseRatioContract(value: unknown): NurseRatioContract {
  const record = requireScenarioRecord(value, "nurseRatio");
  requireScenarioExactKeys(record, "nurseRatio", nurseRatioKeys);
  const ratioId = requireScenarioEnum(record.ratioId, NURSE_RATIO_IDS, "nurseRatio.ratioId");
  const maxOccupiedRoomsPerNurse = requireScenarioInteger(
    record.maxOccupiedRoomsPerNurse,
    "nurseRatio.maxOccupiedRoomsPerNurse",
    1,
    8
  );
  const targetOccupiedRoomsPerNurse = requireScenarioInteger(
    record.targetOccupiedRoomsPerNurse,
    "nurseRatio.targetOccupiedRoomsPerNurse",
    1,
    maxOccupiedRoomsPerNurse
  );
  const warningThresholdOccupiedRooms = requireScenarioInteger(
    record.warningThresholdOccupiedRooms,
    "nurseRatio.warningThresholdOccupiedRooms",
    targetOccupiedRoomsPerNurse,
    maxOccupiedRoomsPerNurse
  );
  const expectedRoomCount = ratioId === "four_to_one" ? 4 : 3;
  if (maxOccupiedRoomsPerNurse !== expectedRoomCount || targetOccupiedRoomsPerNurse !== expectedRoomCount) {
    throw new Error("nurseRatio must match its declared ratioId room count");
  }
  if (record.schemaVersion !== NURSE_RATIO_CONTRACT_SCHEMA_VERSION) {
    throw new Error("nurseRatio.schemaVersion is unsupported");
  }
  if (record.nonClaimCopy !== NURSE_RATIO_NON_CLAIM_COPY) {
    throw new Error("nurseRatio.nonClaimCopy must preserve operational-only non-claim language");
  }
  return {
    schemaVersion: NURSE_RATIO_CONTRACT_SCHEMA_VERSION,
    ratioId,
    label: requireScenarioString(record.label, "nurseRatio.label"),
    maxOccupiedRoomsPerNurse,
    targetOccupiedRoomsPerNurse,
    warningThresholdOccupiedRooms,
    displayCopy: requireScenarioString(record.displayCopy, "nurseRatio.displayCopy"),
    nonClaimCopy: NURSE_RATIO_NON_CLAIM_COPY,
    syntheticDataOnly: requireScenarioLiteralTrue(record.syntheticDataOnly, "nurseRatio.syntheticDataOnly")
  };
}
