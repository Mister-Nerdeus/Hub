import { validateOperationalRuntimeText } from "../no-phi/runtimeTextGuard.js";

export type ScenarioValidationRecord = Record<string, unknown>;

const forbiddenScenarioFieldPatterns = [
  new RegExp("^" + "pat" + "ient" + "(?:" + "Na" + "me|I" + "d|Identifier|Record|D" + "ob|D" + "OB)$", "iu"),
  new RegExp("^m" + "rn$", "iu"),
  new RegExp("^d" + "ob$", "iu"),
  new RegExp("date" + "Of" + "Birth", "iu"),
  new RegExp("medical" + "Record", "iu"),
  new RegExp("clinical" + "Note", "iu"),
  new RegExp("chief" + "Complaint", "iu"),
  new RegExp("diagnosis", "iu"),
  new RegExp("medication" + "Name", "iu"),
  new RegExp("^e" + "hr", "iu"),
  /employee/iu,
  /payroll/iu,
  /legalName/iu,
  /realName/iu,
  /hospital/iu
];

export function requireScenarioRecord(value: unknown, label: string): ScenarioValidationRecord {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  const record = value as ScenarioValidationRecord;
  for (const key of Object.keys(record)) {
    if (forbiddenScenarioFieldPatterns.some((pattern) => pattern.test(key))) {
      throw new Error(`${label}.${key} is forbidden identity, clinical, staff, or source-system data`);
    }
  }
  return record;
}

export function requireScenarioExactKeys(
  value: ScenarioValidationRecord,
  label: string,
  allowedKeys: readonly string[]
): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

export function requireScenarioString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return validateOperationalRuntimeText(value, label);
}

export function requireScenarioBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}

export function requireScenarioLiteralTrue(value: unknown, label: string): true {
  if (value !== true) {
    throw new Error(`${label} must be true`);
  }
  return true;
}

export function requireScenarioInteger(
  value: unknown,
  label: string,
  min = Number.MIN_SAFE_INTEGER,
  max = Number.MAX_SAFE_INTEGER
): number {
  if (typeof value !== "number" || !Number.isInteger(value) || value < min || value > max) {
    throw new Error(`${label} must be an integer from ${min} through ${max}`);
  }
  return value;
}

export function requireScenarioNumber(
  value: unknown,
  label: string,
  min = Number.NEGATIVE_INFINITY,
  max = Number.POSITIVE_INFINITY
): number {
  if (typeof value !== "number" || !Number.isFinite(value) || value < min || value > max) {
    throw new Error(`${label} must be a finite number from ${min} through ${max}`);
  }
  return value;
}

export function requireScenarioEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  label: string
): T {
  if (typeof value !== "string" || !allowedValues.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowedValues.join(", ")}`);
  }
  return value as T;
}

export function requireScenarioArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

export function requireScenarioStringArray(value: unknown, label: string): string[] {
  return requireScenarioArray(value, label).map((entry, index) =>
    requireScenarioString(entry, `${label}[${index}]`)
  );
}

export function assertScenarioUnique(values: readonly string[], label: string): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique`);
  }
}
