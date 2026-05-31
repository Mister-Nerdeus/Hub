export const MANUAL_ASSIGNMENT_NURSE_ROLES = ["primary", "charge", "float", "triage"] as const;
export const MANUAL_ASSIGNMENT_ACUITY_LEVELS = [1, 2, 3, 4, 5] as const;
export const MANUAL_ASSIGNMENT_TASK_FREQUENCY_LEVELS = ["none", "low", "medium", "high"] as const;
export const MANUAL_ASSIGNMENT_BURDEN_LEVELS = ["none", "low", "medium", "high"] as const;
export const MANUAL_ASSIGNMENT_TURNOVER_LEVELS = ["none", "low", "medium", "high"] as const;
export const MANUAL_ASSIGNMENT_WARNING_CODES = [
  "OVER_TARGET_RATIO",
  "OVER_MAX_RATIO",
  "TRAUMA_QUALIFICATION_MISMATCH",
  "HIGH_ACUITY_CLUSTER",
  "ROOMS_TOO_SPREAD_OUT",
  "UNASSIGNED_OCCUPIED_ROOM",
  "INACTIVE_NURSE_ASSIGNMENT_REVIEW",
  "UNSUPPORTED_ASSIGNMENT_REFERENCE"
] as const;
export const MANUAL_ASSIGNMENT_WARNING_SEVERITIES = ["info", "warning", "blocking"] as const;
export const MANUAL_ASSIGNMENT_SYNTHETIC_LABELS = [
  "Nurse Blue",
  "Nurse Green",
  "Nurse Purple",
  "Nurse Orange"
] as const;

export type ManualAssignmentNurseRole = (typeof MANUAL_ASSIGNMENT_NURSE_ROLES)[number];
export type ManualAssignmentAcuityLevel = (typeof MANUAL_ASSIGNMENT_ACUITY_LEVELS)[number];
export type ManualAssignmentTaskFrequencyLevel = (typeof MANUAL_ASSIGNMENT_TASK_FREQUENCY_LEVELS)[number];
export type ManualAssignmentBurdenLevel = (typeof MANUAL_ASSIGNMENT_BURDEN_LEVELS)[number];
export type ManualAssignmentTurnoverLevel = (typeof MANUAL_ASSIGNMENT_TURNOVER_LEVELS)[number];
export type ManualAssignmentWarningCode = (typeof MANUAL_ASSIGNMENT_WARNING_CODES)[number];
export type ManualAssignmentWarningSeverity = (typeof MANUAL_ASSIGNMENT_WARNING_SEVERITIES)[number];
export type ManualAssignmentSyntheticLabel = (typeof MANUAL_ASSIGNMENT_SYNTHETIC_LABELS)[number];

export type ManualAssignmentNurse = {
  nurseId: string;
  displayLabel: string;
  color: string;
  role: ManualAssignmentNurseRole;
  targetPatientCount: number;
  maxPatientCount: number;
  traumaQualified: boolean;
  psychQualified: boolean;
  chargeQualified: boolean;
  active: boolean;
  syntheticDataOnly: true;
};

export type ManualAssignmentRoomLoad = {
  roomId: string;
  occupied: boolean;
  acuity: ManualAssignmentAcuityLevel;
  traumaActive: boolean;
  isolationActive: boolean;
  behavioralRisk: boolean;
  fallRisk: boolean;
  sitterRequired: boolean;
  medicationFrequency: ManualAssignmentTaskFrequencyLevel;
  monitoringFrequency: ManualAssignmentTaskFrequencyLevel;
  procedureBurden: ManualAssignmentBurdenLevel;
  expectedTurnover: ManualAssignmentTurnoverLevel;
  syntheticDataOnly: true;
};

export type ManualRoomAssignment = {
  assignmentId: string;
  roomId: string;
  nurseId: string;
  primary: true;
  syntheticDataOnly: true;
};

export type ManualAssignmentWarning = {
  code: ManualAssignmentWarningCode;
  severity: ManualAssignmentWarningSeverity;
  summary: string;
  nurseIds: string[];
  roomIds: string[];
  visibleComponents: string[];
  syntheticDataOnly: true;
};

export type ManualNurseBurdenScore = {
  nurseId: string;
  assignedRoomCount: number;
  occupiedRoomCount: number;
  acuityBurden: number;
  traumaBurden: number;
  specialBurden: number;
  walkingBurden: number;
  roomSpreadPenalty: number;
  overRatioPenalty: number;
  totalBurden: number;
  visibleComponents: string[];
  syntheticDataOnly: true;
};

export type ManualAssignmentSet = {
  assignmentSetId: string;
  nurses: ManualAssignmentNurse[];
  roomLoads: ManualAssignmentRoomLoad[];
  assignments: ManualRoomAssignment[];
  warnings: ManualAssignmentWarning[];
  burdenScores: ManualNurseBurdenScore[];
  syntheticDataOnly: true;
};
