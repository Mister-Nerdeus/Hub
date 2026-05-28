import type { ActivityProfileId } from "../scenarios/activityProfileContract.js";

export const DRY_RUN_TASK_TEMPLATE_SCHEMA_VERSION = "1.0.0" as const;
export const DRY_RUN_TASK_TEMPLATE_CATEGORIES = [
  "room_check",
  "documentation_placeholder",
  "support_coordination_placeholder",
  "turnover_placeholder",
  "observation_placeholder"
] as const;
const DRY_RUN_TASK_TEMPLATE_ACTIVITY_PROFILE_IDS = ["typical", "busy", "slammed"] as const;
export type DryRunTaskTemplateCategory = (typeof DRY_RUN_TASK_TEMPLATE_CATEGORIES)[number];
export type DryRunTaskIntensityBand = "low" | "medium" | "high";

export type DryRunTaskTemplateContract = {
  schemaVersion: typeof DRY_RUN_TASK_TEMPLATE_SCHEMA_VERSION;
  templateId: string;
  category: DryRunTaskTemplateCategory;
  durationBand: {
    minMinutes: number;
    maxMinutes: number;
  };
  intensityBand: DryRunTaskIntensityBand;
  allowedActivityProfileIds: readonly ActivityProfileId[];
  syntheticOperationalPlaceholder: true;
  clinicalClaim: false;
  medicationOrDiagnosisText: false;
  outcomePredictionClaim: false;
  optimizerStatus: "not_started";
};

export const dryRunTaskTemplates: readonly DryRunTaskTemplateContract[] = [
  {
    schemaVersion: DRY_RUN_TASK_TEMPLATE_SCHEMA_VERSION,
    templateId: "dry-run-room-check",
    category: "room_check",
    durationBand: { minMinutes: 5, maxMinutes: 10 },
    intensityBand: "low",
    allowedActivityProfileIds: ["typical", "busy", "slammed"],
    syntheticOperationalPlaceholder: true,
    clinicalClaim: false,
    medicationOrDiagnosisText: false,
    outcomePredictionClaim: false,
    optimizerStatus: "not_started"
  },
  {
    schemaVersion: DRY_RUN_TASK_TEMPLATE_SCHEMA_VERSION,
    templateId: "dry-run-documentation-placeholder",
    category: "documentation_placeholder",
    durationBand: { minMinutes: 5, maxMinutes: 15 },
    intensityBand: "medium",
    allowedActivityProfileIds: ["typical", "busy", "slammed"],
    syntheticOperationalPlaceholder: true,
    clinicalClaim: false,
    medicationOrDiagnosisText: false,
    outcomePredictionClaim: false,
    optimizerStatus: "not_started"
  },
  {
    schemaVersion: DRY_RUN_TASK_TEMPLATE_SCHEMA_VERSION,
    templateId: "dry-run-support-coordination-placeholder",
    category: "support_coordination_placeholder",
    durationBand: { minMinutes: 10, maxMinutes: 20 },
    intensityBand: "medium",
    allowedActivityProfileIds: ["busy", "slammed"],
    syntheticOperationalPlaceholder: true,
    clinicalClaim: false,
    medicationOrDiagnosisText: false,
    outcomePredictionClaim: false,
    optimizerStatus: "not_started"
  },
  {
    schemaVersion: DRY_RUN_TASK_TEMPLATE_SCHEMA_VERSION,
    templateId: "dry-run-turnover-placeholder",
    category: "turnover_placeholder",
    durationBand: { minMinutes: 10, maxMinutes: 25 },
    intensityBand: "high",
    allowedActivityProfileIds: ["typical", "busy", "slammed"],
    syntheticOperationalPlaceholder: true,
    clinicalClaim: false,
    medicationOrDiagnosisText: false,
    outcomePredictionClaim: false,
    optimizerStatus: "not_started"
  },
  {
    schemaVersion: DRY_RUN_TASK_TEMPLATE_SCHEMA_VERSION,
    templateId: "dry-run-observation-placeholder",
    category: "observation_placeholder",
    durationBand: { minMinutes: 5, maxMinutes: 20 },
    intensityBand: "medium",
    allowedActivityProfileIds: ["typical", "busy", "slammed"],
    syntheticOperationalPlaceholder: true,
    clinicalClaim: false,
    medicationOrDiagnosisText: false,
    outcomePredictionClaim: false,
    optimizerStatus: "not_started"
  }
] as const;

export function validateDryRunTaskTemplateSet(
  value: unknown
): DryRunTaskTemplateContract[] {
  const templates = requireArray(value, "dryRunTaskTemplates").map(validateDryRunTaskTemplate);
  requireUnique(
    "dry-run task template ids",
    templates.map((template) => template.templateId)
  );
  return templates;
}

export function validateDryRunTaskTemplate(value: unknown): DryRunTaskTemplateContract {
  const template = requireRecord(value, "dryRunTaskTemplate");
  requireExactKeys(template, "dryRunTaskTemplate", [
    "schemaVersion",
    "templateId",
    "category",
    "durationBand",
    "intensityBand",
    "allowedActivityProfileIds",
    "syntheticOperationalPlaceholder",
    "clinicalClaim",
    "medicationOrDiagnosisText",
    "outcomePredictionClaim",
    "optimizerStatus"
  ]);
  const templateId = requireString(template.templateId, "templateId");
  assertNoForbiddenTaskText(templateId, "templateId");
  const category = requireEnum(
    template.category,
    DRY_RUN_TASK_TEMPLATE_CATEGORIES,
    "category"
  );
  const durationBand = validateDurationBand(template.durationBand);
  const allowedActivityProfileIds = requireArray(
    template.allowedActivityProfileIds,
    "allowedActivityProfileIds"
  ).map((profileId, index) =>
    requireEnum(
      profileId,
      DRY_RUN_TASK_TEMPLATE_ACTIVITY_PROFILE_IDS,
      `allowedActivityProfileIds[${index}]`
    )
  );
  requireUnique("allowed activity profile ids", allowedActivityProfileIds);

  return {
    schemaVersion: requireLiteral(
      template.schemaVersion,
      DRY_RUN_TASK_TEMPLATE_SCHEMA_VERSION,
      "schemaVersion"
    ),
    templateId,
    category,
    durationBand,
    intensityBand: requireEnum(template.intensityBand, ["low", "medium", "high"], "intensityBand"),
    allowedActivityProfileIds,
    syntheticOperationalPlaceholder: requireBooleanLiteral(
      template.syntheticOperationalPlaceholder,
      true,
      "syntheticOperationalPlaceholder"
    ),
    clinicalClaim: requireBooleanLiteral(template.clinicalClaim, false, "clinicalClaim"),
    medicationOrDiagnosisText: requireBooleanLiteral(
      template.medicationOrDiagnosisText,
      false,
      "medicationOrDiagnosisText"
    ),
    outcomePredictionClaim: requireBooleanLiteral(
      template.outcomePredictionClaim,
      false,
      "outcomePredictionClaim"
    ),
    optimizerStatus: requireLiteral(template.optimizerStatus, "not_started", "optimizerStatus")
  };
}

function validateDurationBand(value: unknown): DryRunTaskTemplateContract["durationBand"] {
  const band = requireRecord(value, "durationBand");
  requireExactKeys(band, "durationBand", ["minMinutes", "maxMinutes"]);
  const minMinutes = requireInteger(band.minMinutes, "durationBand.minMinutes", 1);
  const maxMinutes = requireInteger(band.maxMinutes, "durationBand.maxMinutes", minMinutes);
  if (maxMinutes > 60) throw new Error("durationBand.maxMinutes must stay bounded");
  return { minMinutes, maxMinutes };
}

function assertNoForbiddenTaskText(value: string, label: string): void {
  const forbiddenPatterns: Array<[string, RegExp]> = [
    ["medication", /\bmedication\b|\bmed\b/iu],
    ["diagnosis", /\bdiagnosis\b|\bdx\b/iu],
    ["order", /\border\b/iu],
    ["protocol", /\bprotocol\b/iu],
    ["outcome", /\boutcome\b/iu]
  ];
  for (const [name, pattern] of forbiddenPatterns) {
    if (pattern.test(value)) throw new Error(`${label} must not include ${name} text`);
  }
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) throw new Error(`${label}.${key} is not allowed`);
  }
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) throw new Error(`${label} must be an array`);
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireInteger(value: unknown, label: string, min: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  if (value < min) throw new Error(`${label} must be greater than or equal to ${min}`);
  return value;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) throw new Error(`${label} must be ${expected}`);
  return expected;
}

function requireBooleanLiteral<T extends boolean>(value: unknown, expected: T, label: string): T {
  if (value !== expected) throw new Error(`${label} must be ${String(expected)}`);
  return expected;
}

function requireEnum<T extends string>(value: unknown, allowed: readonly T[], label: string): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}

function requireUnique(label: string, values: string[]): void {
  if (new Set(values).size !== values.length) throw new Error(`duplicate ${label} are not allowed`);
}
