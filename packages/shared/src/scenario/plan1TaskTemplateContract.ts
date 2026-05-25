import {
  PLAN_1_ACUITY_LEVELS,
  PLAN_1_NOTES_CODES,
  assertNoDuplicateStrings,
  requireArray,
  requireBoolean,
  requireEnum,
  requireExactKeys,
  requireLiteralTrue,
  requirePositiveNumber,
  requireRecord,
  requireString,
  type Plan1AcuityLevel,
  type Plan1NotesCode,
  type Plan1RoomLoad
} from "../assignment/plan1AssignmentCommon.js";
import { validatePlan1Limitations, validatePlan1NonClaims } from "./plan1SimulationAssumptions.js";

export const PLAN_1_REQUIRED_TASK_TEMPLATE_IDS = [
  "task-template-rounding",
  "task-template-assessment",
  "task-template-medication-burden",
  "task-template-procedure-support",
  "task-template-isolation-workflow",
  "task-template-behavioral-watch",
  "task-template-turnover",
  "task-template-trauma-response",
  "task-template-interruption",
  "task-template-handoff"
] as const;

export const PLAN_1_TASK_CATEGORIES = [
  "rounding",
  "assessment",
  "medication_burden",
  "procedure_support",
  "isolation_workflow",
  "behavioral_watch",
  "turnover",
  "trauma_response",
  "interruption",
  "handoff"
] as const;

export const PLAN_1_ROOM_LOAD_FIELDS_FOR_TEMPLATES = [
  "occupied",
  "acuityLevel",
  "traumaActive",
  "isolationActive",
  "behavioralRisk",
  "sitterRequired",
  "fallRisk",
  "monitoringIntensity",
  "medicationBurden",
  "procedureBurden",
  "turnoverExpected",
  "notesCode"
] as const;

export type Plan1TaskTemplateId = (typeof PLAN_1_REQUIRED_TASK_TEMPLATE_IDS)[number];
export type Plan1TaskCategory = (typeof PLAN_1_TASK_CATEGORIES)[number];
export type Plan1TaskTemplateRoomLoadField = (typeof PLAN_1_ROOM_LOAD_FIELDS_FOR_TEMPLATES)[number];

export type Plan1TaskTemplate = {
  templateId: Plan1TaskTemplateId;
  label: string;
  taskCategory: Plan1TaskCategory;
  appliesToRoomLoadFields: Plan1TaskTemplateRoomLoadField[];
  baseDurationMinutes: number;
  durationJitterMinutes: number;
  baseFrequencyPerHour: number;
  eligibleAcuityLevels: Plan1AcuityLevel[];
  eligibleNotesCodes: Plan1NotesCode[];
  requiresAssignedNurse: boolean;
  requiresWalkingRoute: boolean;
  syntheticDataOnly: true;
  limitations: string[];
  nonClaims: string[];
};

const TEMPLATE_KEYS = [
  "templateId",
  "label",
  "taskCategory",
  "appliesToRoomLoadFields",
  "baseDurationMinutes",
  "durationJitterMinutes",
  "baseFrequencyPerHour",
  "eligibleAcuityLevels",
  "eligibleNotesCodes",
  "requiresAssignedNurse",
  "requiresWalkingRoute",
  "syntheticDataOnly",
  "limitations",
  "nonClaims"
];

const FORBIDDEN_TEMPLATE_KEYS = [
  "patient" + "Name",
  "m" + "rn",
  "date" + "Of" + "Birth",
  "diagnosis" + "Text",
  "medication" + "Name",
  "clinical" + "Order" + "Text",
  "freeText" + "Clinical" + "Note"
];

export function validatePlan1TaskTemplate(value: unknown, index = 0): Plan1TaskTemplate {
  const label = `taskTemplates[${index}]`;
  const record = requireRecord(value, label);
  rejectForbiddenTemplateKeys(record, label);
  requireExactKeys(record, label, TEMPLATE_KEYS);
  const templateId = requireString(record.templateId, `${label}.templateId`);
  if (!(PLAN_1_REQUIRED_TASK_TEMPLATE_IDS as readonly string[]).includes(templateId)) {
    throw new Error(`${label}.templateId must be a required Plan 1 template id`);
  }
  const durationJitterMinutes = requireNonNegativeFiniteNumber(
    record.durationJitterMinutes,
    `${label}.durationJitterMinutes`
  );
  return {
    templateId: templateId as Plan1TaskTemplateId,
    label: requireString(record.label, `${label}.label`),
    taskCategory: requireEnum(record.taskCategory, PLAN_1_TASK_CATEGORIES, `${label}.taskCategory`),
    appliesToRoomLoadFields: validateStringEnumArray(
      record.appliesToRoomLoadFields,
      PLAN_1_ROOM_LOAD_FIELDS_FOR_TEMPLATES,
      `${label}.appliesToRoomLoadFields`
    ),
    baseDurationMinutes: requirePositiveNumber(record.baseDurationMinutes, `${label}.baseDurationMinutes`),
    durationJitterMinutes,
    baseFrequencyPerHour: requireNonNegativeFiniteNumber(record.baseFrequencyPerHour, `${label}.baseFrequencyPerHour`),
    eligibleAcuityLevels: validateStringEnumArray(
      record.eligibleAcuityLevels,
      PLAN_1_ACUITY_LEVELS,
      `${label}.eligibleAcuityLevels`
    ),
    eligibleNotesCodes: validateStringEnumArray(
      record.eligibleNotesCodes,
      PLAN_1_NOTES_CODES,
      `${label}.eligibleNotesCodes`
    ),
    requiresAssignedNurse: requireBoolean(record.requiresAssignedNurse, `${label}.requiresAssignedNurse`),
    requiresWalkingRoute: requireBoolean(record.requiresWalkingRoute, `${label}.requiresWalkingRoute`),
    syntheticDataOnly: requireLiteralTrue(record.syntheticDataOnly, `${label}.syntheticDataOnly`),
    limitations: validatePlan1Limitations(record.limitations, `${label}.limitations`),
    nonClaims: validatePlan1NonClaims(record.nonClaims, `${label}.nonClaims`)
  };
}

export function validatePlan1TaskTemplates(value: unknown): Plan1TaskTemplate[] {
  const record = requireRecord(value, "taskTemplateFixture");
  requireExactKeys(record, "taskTemplateFixture", ["schemaVersion", "planId", "assumptionsId", "taskTemplates"]);
  if (requireString(record.planId, "taskTemplateFixture.planId") !== "default-er-layout-plan-1") {
    throw new Error("taskTemplateFixture.planId must be default-er-layout-plan-1");
  }
  if (!Array.isArray(record.taskTemplates)) {
    throw new Error("taskTemplateFixture.taskTemplates must be an array");
  }
  const templates = record.taskTemplates.map((template, index) => validatePlan1TaskTemplate(template, index));
  assertNoDuplicateStrings(templates.map((template) => template.templateId), "templateId");
  for (const requiredId of PLAN_1_REQUIRED_TASK_TEMPLATE_IDS) {
    if (!templates.some((template) => template.templateId === requiredId)) {
      throw new Error(`missing required Plan 1 task template ${requiredId}`);
    }
  }
  return templates;
}

export function plan1TaskTemplateAppliesToRoomLoad(
  template: Plan1TaskTemplate,
  roomLoad: Plan1RoomLoad
): boolean {
  if (!roomLoad.occupied && template.requiresAssignedNurse) {
    return false;
  }
  if (
    template.eligibleAcuityLevels.length > 0 &&
    !template.eligibleAcuityLevels.includes(roomLoad.acuityLevel)
  ) {
    return false;
  }
  if (template.eligibleNotesCodes.length > 0 && !template.eligibleNotesCodes.includes(roomLoad.notesCode)) {
    return false;
  }
  return template.appliesToRoomLoadFields.some((field) => {
    const value = roomLoad[field];
    if (field === "medicationBurden" || field === "procedureBurden" || field === "monitoringIntensity") {
      return value !== "none";
    }
    return Boolean(value);
  });
}

function rejectForbiddenTemplateKeys(record: Record<string, unknown>, label: string): void {
  for (const key of FORBIDDEN_TEMPLATE_KEYS) {
    if (Object.hasOwn(record, key)) {
      throw new Error(`${label} contains a forbidden PHI-like or clinical-action field`);
    }
  }
}

function validateStringEnumArray<T extends string>(value: unknown, allowed: readonly T[], label: string): T[] {
  const entries = requireArray(value, label).map((entry, index) => requireEnum(entry, allowed, `${label}[${index}]`));
  assertNoDuplicateStrings(entries, label);
  return entries;
}

function requireNonNegativeFiniteNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < 0) {
    throw new Error(`${label} must be a non-negative finite number`);
  }
  return value;
}
