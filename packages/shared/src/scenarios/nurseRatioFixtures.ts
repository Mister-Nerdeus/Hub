import {
  NURSE_RATIO_CONTRACT_SCHEMA_VERSION,
  NURSE_RATIO_NON_CLAIM_COPY,
  type NurseRatioContract
} from "./nurseRatioContract.js";

export const fourToOneNurseRatio: NurseRatioContract = {
  schemaVersion: NURSE_RATIO_CONTRACT_SCHEMA_VERSION,
  ratioId: "four_to_one",
  label: "4:1",
  maxOccupiedRoomsPerNurse: 4,
  targetOccupiedRoomsPerNurse: 4,
  warningThresholdOccupiedRooms: 4,
  displayCopy: "Four occupied rooms per synthetic nurse group.",
  nonClaimCopy: NURSE_RATIO_NON_CLAIM_COPY,
  syntheticDataOnly: true
};

export const threeToOneNurseRatio: NurseRatioContract = {
  schemaVersion: NURSE_RATIO_CONTRACT_SCHEMA_VERSION,
  ratioId: "three_to_one",
  label: "3:1",
  maxOccupiedRoomsPerNurse: 3,
  targetOccupiedRoomsPerNurse: 3,
  warningThresholdOccupiedRooms: 3,
  displayCopy: "Three occupied rooms per synthetic nurse group.",
  nonClaimCopy: NURSE_RATIO_NON_CLAIM_COPY,
  syntheticDataOnly: true
};

export const nurseRatioFixtures = [fourToOneNurseRatio, threeToOneNurseRatio] as const;
