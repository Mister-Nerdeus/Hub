export const NURSE_RATIO_CONTRACT_SCHEMA_VERSION = "1.0.0" as const;
export const NURSE_RATIO_IDS = ["four_to_one", "three_to_one"] as const;
export const NURSE_RATIO_NON_CLAIM_COPY =
  "Operational modeling only, not staffing compliance certification." as const;

export type NurseRatioId = (typeof NURSE_RATIO_IDS)[number];

export type NurseRatioContract = {
  schemaVersion: typeof NURSE_RATIO_CONTRACT_SCHEMA_VERSION;
  ratioId: NurseRatioId;
  label: string;
  maxOccupiedRoomsPerNurse: number;
  targetOccupiedRoomsPerNurse: number;
  warningThresholdOccupiedRooms: number;
  displayCopy: string;
  nonClaimCopy: typeof NURSE_RATIO_NON_CLAIM_COPY;
  syntheticDataOnly: true;
};
