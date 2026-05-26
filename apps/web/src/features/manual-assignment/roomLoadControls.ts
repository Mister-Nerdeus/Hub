import {
  MANUAL_ASSIGNMENT_ACUITY_LEVELS,
  MANUAL_ASSIGNMENT_BURDEN_LEVELS,
  MANUAL_ASSIGNMENT_TASK_FREQUENCY_LEVELS,
  MANUAL_ASSIGNMENT_TURNOVER_LEVELS
} from "@nerdeus/shared";

export const acuityOptions = MANUAL_ASSIGNMENT_ACUITY_LEVELS.map((value) => ({ value, label: `Acuity ${value}` }));
export const taskFrequencyOptions = MANUAL_ASSIGNMENT_TASK_FREQUENCY_LEVELS.map((value) => ({ value, label: value }));
export const burdenLevelOptions = MANUAL_ASSIGNMENT_BURDEN_LEVELS.map((value) => ({ value, label: value }));
export const turnoverLevelOptions = MANUAL_ASSIGNMENT_TURNOVER_LEVELS.map((value) => ({ value, label: value }));

export const roomLoadBooleanControls = [
  { field: "occupied", label: "Occupied" },
  { field: "traumaActive", label: "Trauma" },
  { field: "isolationActive", label: "Isolation" },
  { field: "behavioralRisk", label: "Behavioral risk" },
  { field: "fallRisk", label: "Fall risk" },
  { field: "sitterRequired", label: "Sitter" }
] as const;
