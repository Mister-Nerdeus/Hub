export const NURSE_PROFILE_ROLES = ["primary", "charge", "float", "triage"] as const;

export type NurseProfileRole = (typeof NURSE_PROFILE_ROLES)[number];

export type NurseProfileContract = {
  schemaVersion: "1.0.0";
  nurseProfileId: string;
  displayLabel: string;
  color: string;
  role: NurseProfileRole;
  targetPatientCount: number;
  maxPatientCount: number;
  traumaQualified: boolean;
  psychQualified: boolean;
  chargeQualified: boolean;
  active: boolean;
};

export const DEFAULT_NURSE_PROFILE_LABELS = [
  "Nurse Blue",
  "Nurse Green",
  "Nurse Orange",
  "Nurse Purple"
] as const;
