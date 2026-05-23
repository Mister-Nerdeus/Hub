import type { GeneratedOperationalTask } from "../contracts.js";

export type NurseQueueItemContract = {
  taskId: string;
  originalReadyMinute: number;
  minuteEnteredQueue: number;
  minuteStarted: number;
  waitMinutes: number;
  interruptible: boolean;
  operationalUrgencyScore: number;
  reasonForOrdering: string;
};

export type NurseQueueContract = {
  schemaVersion: "1.0.0";
  queueId: string;
  nurseId: string;
  taskIdsInQueueOrder: string[];
  items: NurseQueueItemContract[];
  limitations: string[];
};

export type NurseQueueTaskInput = Pick<
  GeneratedOperationalTask,
  "id" | "scheduledMinute" | "estimatedDurationMinutes" | "burdenCategory" | "interruptive"
>;

const FORBIDDEN_TEXT_PATTERNS: Array<[string, RegExp]> = [
  ["clinical priority", /\bclinical priority\b/i],
  ["safe", /\bsafe\b/i],
  ["unsafe", /\bunsafe\b/i],
  ["recommended", /\brecommended\b/i],
  ["best", /\bbest\b/i]
];

export function validateNurseQueueContract(value: unknown): NurseQueueContract {
  const queue = requireRecord(value, "nurseQueue");
  requireExactKeys(queue, "nurseQueue", [
    "schemaVersion",
    "queueId",
    "nurseId",
    "taskIdsInQueueOrder",
    "items",
    "limitations"
  ]);
  requireLiteral(queue.schemaVersion, "1.0.0", "schemaVersion");
  const queueId = requireString(queue.queueId, "queueId");
  const nurseId = requireString(queue.nurseId, "nurseId");
  const taskIdsInQueueOrder = validateStringArray(
    queue.taskIdsInQueueOrder,
    "taskIdsInQueueOrder"
  );
  const items = requireArray(queue.items, "items").map(validateNurseQueueItem);
  requireUnique(
    "queue item task ids",
    items.map((item) => item.taskId)
  );
  if (!sameStringArray(taskIdsInQueueOrder, items.map((item) => item.taskId))) {
    throw new Error("taskIdsInQueueOrder must match items order");
  }
  const limitations = requireArray(queue.limitations, "limitations").map((limitation, index) =>
    validateOperationalText(limitation, `limitations[${index}]`)
  );
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  return {
    schemaVersion: "1.0.0",
    queueId,
    nurseId,
    taskIdsInQueueOrder,
    items,
    limitations
  };
}

function validateNurseQueueItem(value: unknown, index: number): NurseQueueItemContract {
  const item = requireRecord(value, `items[${index}]`);
  requireExactKeys(item, `items[${index}]`, [
    "taskId",
    "originalReadyMinute",
    "minuteEnteredQueue",
    "minuteStarted",
    "waitMinutes",
    "interruptible",
    "operationalUrgencyScore",
    "reasonForOrdering"
  ]);
  const originalReadyMinute = requireInteger(
    item.originalReadyMinute,
    `items[${index}].originalReadyMinute`,
    0
  );
  const minuteEnteredQueue = requireInteger(
    item.minuteEnteredQueue,
    `items[${index}].minuteEnteredQueue`,
    0
  );
  const minuteStarted = requireInteger(item.minuteStarted, `items[${index}].minuteStarted`, 0);
  const waitMinutes = requireNumber(item.waitMinutes, `items[${index}].waitMinutes`, 0);
  if (minuteStarted < originalReadyMinute) {
    throw new Error(`items[${index}].minuteStarted cannot precede originalReadyMinute`);
  }
  if (waitMinutes !== minuteStarted - originalReadyMinute) {
    throw new Error(`items[${index}].waitMinutes must equal minuteStarted minus originalReadyMinute`);
  }
  return {
    taskId: requireString(item.taskId, `items[${index}].taskId`),
    originalReadyMinute,
    minuteEnteredQueue,
    minuteStarted,
    waitMinutes,
    interruptible: requireBoolean(item.interruptible, `items[${index}].interruptible`),
    operationalUrgencyScore: requireNumber(
      item.operationalUrgencyScore,
      `items[${index}].operationalUrgencyScore`,
      0
    ),
    reasonForOrdering: validateOperationalText(
      item.reasonForOrdering,
      `items[${index}].reasonForOrdering`
    )
  };
}

function validateOperationalText(value: unknown, label: string): string {
  const text = requireString(value, label);
  for (const [name, pattern] of FORBIDDEN_TEXT_PATTERNS) {
    if (pattern.test(text)) {
      throw new Error(`${label} must not include ${name} language`);
    }
  }
  return text;
}

function sameStringArray(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function validateStringArray(value: unknown, label: string): string[] {
  const values = requireArray(value, label).map((item, index) =>
    requireString(item, `${label}[${index}]`)
  );
  requireUnique(label, values);
  return values;
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
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireNumber(value: unknown, label: string, min?: number): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`${label} must be greater than or equal to ${min}`);
  }
  return value;
}

function requireInteger(value: unknown, label: string, min?: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`${label} must be greater than or equal to ${min}`);
  }
  return value;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireUnique(label: string, values: string[]): Set<string> {
  const valueSet = new Set(values);
  if (valueSet.size !== values.length) {
    throw new Error(`duplicate ${label} are not allowed`);
  }
  return valueSet;
}
