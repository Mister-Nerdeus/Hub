import type {
  GeneratedOperationalTaskSetContract,
  ManualAssignmentContract,
  NurseTaskAssignmentContract,
  ShiftScenarioContract
} from "../contracts.js";

export type SimulationTaskEventAction =
  | "ready"
  | "started"
  | "completed"
  | "delayed"
  | "missed"
  | "unassigned";

export type SimulationMissReason =
  | "unassigned"
  | "not_started_shift_window_exceeded";

export type SimulationNurseEventAction =
  | "started_task"
  | "completed_task"
  | "idle"
  | "queued";

export type SimulationQueueEventAction =
  | "entered_queue"
  | "started_from_queue"
  | "released";

export type SimulationTravelEventAction = "travel_calculated" | "travel_unreachable";

export type SimulationTaskEventContract = {
  eventId: string;
  eventType: "task";
  action: SimulationTaskEventAction;
  taskId: string;
  nurseId?: string | null;
  minute: number;
  scheduledMinute?: number | null;
  startMinute?: number | null;
  completedMinute?: number | null;
  durationMinutes?: number | null;
  delayMinutes?: number | null;
  missReason?: SimulationMissReason | null;
  queueWaitMinutes?: number | null;
  travelMinutes?: number | null;
  routeNodeIds?: string[];
  routeEdgeIds?: string[];
};

export type SimulationNurseEventContract = {
  eventId: string;
  eventType: "nurse";
  action: SimulationNurseEventAction;
  nurseId: string;
  taskId?: string | null;
  minute: number;
  durationMinutes?: number | null;
  busyUntilMinute?: number | null;
};

export type SimulationQueueEventContract = {
  eventId: string;
  eventType: "queue";
  action: SimulationQueueEventAction;
  nurseId: string;
  taskId: string;
  minute: number;
  originalReadyMinute: number;
  enteredQueueMinute: number;
  startedMinute?: number | null;
  waitMinutes?: number | null;
  orderingReason: string;
};

export type SimulationTravelEventContract = {
  eventId: string;
  eventType: "travel";
  action: SimulationTravelEventAction;
  nurseId: string;
  taskId: string;
  minute: number;
  originNodeId: string;
  destinationNodeId: string;
  routeNodeIds: string[];
  routeEdgeIds: string[];
  travelSeconds: number;
  travelMinutes: number;
  warnings: string[];
};

export type SimulationEventContract =
  | SimulationTaskEventContract
  | SimulationNurseEventContract
  | SimulationQueueEventContract
  | SimulationTravelEventContract;

export type SimulationRunSummaryContract = {
  totalTasks: number;
  completedTaskCount: number;
  delayedTaskCount: number;
  missedTaskCount: number;
  unassignedTaskCount: number;
};

export type SimulationRunContract = {
  schemaVersion: "1.0.0";
  simulationRunId: string;
  scenarioId: string;
  generatedTaskSetId: string;
  assignmentSetId: string;
  events: SimulationEventContract[];
  summary: SimulationRunSummaryContract;
  limitations: string[];
};

export type SimulationRunValidationContext = {
  scenario?: ShiftScenarioContract;
  generatedTaskSet?: GeneratedOperationalTaskSetContract;
  nurseTaskAssignmentSet?: NurseTaskAssignmentContract;
  manualAssignmentSet?: ManualAssignmentContract;
};

const TASK_EVENT_ACTIONS = [
  "ready",
  "started",
  "completed",
  "delayed",
  "missed",
  "unassigned"
] as const;

const MISS_REASONS = ["unassigned", "not_started_shift_window_exceeded"] as const;

const NURSE_EVENT_ACTIONS = ["started_task", "completed_task", "idle", "queued"] as const;

const QUEUE_EVENT_ACTIONS = [
  "entered_queue",
  "started_from_queue",
  "released"
] as const;

const TRAVEL_EVENT_ACTIONS = ["travel_calculated", "travel_unreachable"] as const;

const FORBIDDEN_KEYS = new Set([
  ["patient", "name"].join(""),
  ["patient", "id"].join(""),
  ["patient", "identifier"].join(""),
  "diagnosis",
  ["diagnosis", "code"].join(""),
  "medication",
  "ehr",
  ["e", "hr", "id"].join(""),
  "chart",
  "note",
  ["clinical", "note"].join(""),
  ["d", "ob"].join(""),
  ["date", "of", "birth"].join(""),
  ["m", "rn"].join("")
]);

const FORBIDDEN_KEY_PREFIXES = [
  "patient",
  "diagnosis",
  "medication",
  "ehr",
  "chart",
  ["clinical", "note"].join(""),
  ["d", "ob"].join(""),
  ["date", "of", "birth"].join(""),
  ["m", "rn"].join("")
] as const;

const FORBIDDEN_TEXT_PATTERNS: Array<[string, RegExp]> = [
  ["safe", /\bsafe\b/i],
  ["unsafe", /\bunsafe\b/i],
  ["recommended", /\brecommended\b/i],
  ["best", /\bbest\b/i],
  ["clinically acceptable", /\bclinically acceptable\b/i]
];

export function validateSimulationRunContract(
  value: unknown,
  context: SimulationRunValidationContext = {}
): SimulationRunContract {
  validateNoForbiddenKeysOrText(value, "simulationRun");
  const run = requireRecord(value, "simulationRun");
  requireExactKeys(run, "simulationRun", [
    "schemaVersion",
    "simulationRunId",
    "scenarioId",
    "generatedTaskSetId",
    "assignmentSetId",
    "events",
    "summary",
    "limitations"
  ]);

  requireLiteral(run.schemaVersion, "1.0.0", "schemaVersion");
  const simulationRunId = requireString(run.simulationRunId, "simulationRunId");
  const scenarioId = requireString(run.scenarioId, "scenarioId");
  const generatedTaskSetId = requireString(run.generatedTaskSetId, "generatedTaskSetId");
  const assignmentSetId = requireString(run.assignmentSetId, "assignmentSetId");
  const events = requireArray(run.events, "events").map(validateSimulationEvent);
  requireUnique(
    "simulation event ids",
    events.map((event) => event.eventId)
  );
  const summary = validateSimulationRunSummary(run.summary);
  const limitations = requireArray(run.limitations, "limitations").map((limitation, index) =>
    requireString(limitation, `limitations[${index}]`)
  );

  if (context.scenario != null && scenarioId !== context.scenario.scenarioId) {
    throw new Error("simulationRun.scenarioId must match the referenced scenario");
  }
  if (
    context.generatedTaskSet != null &&
    generatedTaskSetId !== context.generatedTaskSet.generatedTaskSetId
  ) {
    throw new Error("simulationRun.generatedTaskSetId must match the referenced generated task set");
  }
  if (
    context.nurseTaskAssignmentSet != null &&
    assignmentSetId !== context.nurseTaskAssignmentSet.assignmentSetId
  ) {
    throw new Error("simulationRun.assignmentSetId must match the referenced assignment set");
  }
  if (
    context.manualAssignmentSet != null &&
    assignmentSetId !== context.manualAssignmentSet.assignmentSetId
  ) {
    throw new Error("simulationRun.assignmentSetId must match the referenced manual assignment set");
  }
  if (
    context.generatedTaskSet != null &&
    scenarioId !== context.generatedTaskSet.scenarioId
  ) {
    throw new Error("simulationRun.scenarioId must match the generated task set scenarioId");
  }

  validateSimulationEventReferences(events, context);
  validateSimulationSummaryAgainstEvents(summary, events, context.generatedTaskSet);

  return {
    schemaVersion: "1.0.0",
    simulationRunId,
    scenarioId,
    generatedTaskSetId,
    assignmentSetId,
    events,
    summary,
    limitations
  };
}

export function validateSimulationTaskEventContract(
  value: unknown
): SimulationTaskEventContract {
  validateNoForbiddenKeysOrText(value, "taskEvent");
  const event = validateSimulationEvent(value);
  if (event.eventType !== "task") {
    throw new Error("task event must use eventType task");
  }
  return event;
}

export function validateSimulationNurseEventContract(
  value: unknown
): SimulationNurseEventContract {
  validateNoForbiddenKeysOrText(value, "nurseEvent");
  const event = validateSimulationEvent(value);
  if (event.eventType !== "nurse") {
    throw new Error("nurse event must use eventType nurse");
  }
  return event;
}

export function validateSimulationRunSummaryContract(
  value: unknown
): SimulationRunSummaryContract {
  return validateSimulationRunSummary(value);
}

function validateSimulationEvent(value: unknown): SimulationEventContract {
  const event = requireRecord(value, "events[]");
  const eventType = requireString(event.eventType, "eventType");
  if (eventType === "task") {
    return validateTaskEvent(event);
  }
  if (eventType === "nurse") {
    return validateNurseEvent(event);
  }
  if (eventType === "queue") {
    return validateQueueEvent(event);
  }
  if (eventType === "travel") {
    return validateTravelEvent(event);
  }
  throw new Error("eventType must be task, nurse, queue, or travel");
}

function validateTaskEvent(event: Record<string, unknown>): SimulationTaskEventContract {
  requireExactKeys(event, "taskEvent", [
    "eventId",
    "eventType",
    "action",
    "taskId",
    "nurseId",
    "minute",
    "scheduledMinute",
    "startMinute",
    "completedMinute",
    "durationMinutes",
    "delayMinutes",
    "missReason",
    "queueWaitMinutes",
    "travelMinutes",
    "routeNodeIds",
    "routeEdgeIds"
  ]);
  requireLiteral(event.eventType, "task", "eventType");
  const taskEvent: SimulationTaskEventContract = {
    eventId: requireString(event.eventId, "eventId"),
    eventType: "task",
    action: requireEnum(event.action, TASK_EVENT_ACTIONS, "action"),
    taskId: requireString(event.taskId, "taskId"),
    minute: requireInteger(event.minute, "minute", 0)
  };
  assignOptionalString(event, taskEvent, "nurseId");
  assignOptionalInteger(event, taskEvent, "scheduledMinute", 0);
  assignOptionalInteger(event, taskEvent, "startMinute", 0);
  assignOptionalInteger(event, taskEvent, "completedMinute", 0);
  assignOptionalNumber(event, taskEvent, "durationMinutes", 0);
  assignOptionalNumber(event, taskEvent, "delayMinutes", 0);
  assignOptionalMissReason(event, taskEvent, "missReason");
  assignOptionalNumber(event, taskEvent, "queueWaitMinutes", 0);
  assignOptionalNumber(event, taskEvent, "travelMinutes", 0);
  assignOptionalStringArray(event, taskEvent, "routeNodeIds");
  assignOptionalStringArray(event, taskEvent, "routeEdgeIds");

  if (taskEvent.action === "completed") {
    const scheduledMinute = taskEvent.scheduledMinute ?? taskEvent.minute;
    const completedMinute = taskEvent.completedMinute ?? taskEvent.minute;
    if (completedMinute < scheduledMinute) {
      throw new Error("completed task event cannot occur before scheduledMinute");
    }
  }
  if (taskEvent.action === "delayed" && (taskEvent.delayMinutes ?? 0) <= 0) {
    throw new Error("delayed task event requires positive delayMinutes");
  }
  if (taskEvent.action === "missed") {
    requireString(taskEvent.missReason, "missReason");
  }
  return taskEvent;
}

function validateNurseEvent(event: Record<string, unknown>): SimulationNurseEventContract {
  requireExactKeys(event, "nurseEvent", [
    "eventId",
    "eventType",
    "action",
    "nurseId",
    "taskId",
    "minute",
    "durationMinutes",
    "busyUntilMinute"
  ]);
  requireLiteral(event.eventType, "nurse", "eventType");
  const nurseEvent: SimulationNurseEventContract = {
    eventId: requireString(event.eventId, "eventId"),
    eventType: "nurse",
    action: requireEnum(event.action, NURSE_EVENT_ACTIONS, "action"),
    nurseId: requireString(event.nurseId, "nurseId"),
    minute: requireInteger(event.minute, "minute", 0)
  };
  assignOptionalString(event, nurseEvent, "taskId");
  assignOptionalNumber(event, nurseEvent, "durationMinutes", 0);
  assignOptionalInteger(event, nurseEvent, "busyUntilMinute", 0);
  return nurseEvent;
}

function validateQueueEvent(event: Record<string, unknown>): SimulationQueueEventContract {
  requireExactKeys(event, "queueEvent", [
    "eventId",
    "eventType",
    "action",
    "nurseId",
    "taskId",
    "minute",
    "originalReadyMinute",
    "enteredQueueMinute",
    "startedMinute",
    "waitMinutes",
    "orderingReason"
  ]);
  requireLiteral(event.eventType, "queue", "eventType");
  const queueEvent: SimulationQueueEventContract = {
    eventId: requireString(event.eventId, "eventId"),
    eventType: "queue",
    action: requireEnum(event.action, QUEUE_EVENT_ACTIONS, "action"),
    nurseId: requireString(event.nurseId, "nurseId"),
    taskId: requireString(event.taskId, "taskId"),
    minute: requireInteger(event.minute, "minute", 0),
    originalReadyMinute: requireInteger(event.originalReadyMinute, "originalReadyMinute", 0),
    enteredQueueMinute: requireInteger(event.enteredQueueMinute, "enteredQueueMinute", 0),
    orderingReason: requireString(event.orderingReason, "orderingReason")
  };
  assignOptionalInteger(event, queueEvent, "startedMinute", 0);
  assignOptionalNumber(event, queueEvent, "waitMinutes", 0);
  if ((queueEvent.waitMinutes ?? 0) > 0 && queueEvent.startedMinute == null) {
    throw new Error("queue wait event requires startedMinute");
  }
  return queueEvent;
}

function validateTravelEvent(event: Record<string, unknown>): SimulationTravelEventContract {
  requireExactKeys(event, "travelEvent", [
    "eventId",
    "eventType",
    "action",
    "nurseId",
    "taskId",
    "minute",
    "originNodeId",
    "destinationNodeId",
    "routeNodeIds",
    "routeEdgeIds",
    "travelSeconds",
    "travelMinutes",
    "warnings"
  ]);
  requireLiteral(event.eventType, "travel", "eventType");
  return {
    eventId: requireString(event.eventId, "eventId"),
    eventType: "travel",
    action: requireEnum(event.action, TRAVEL_EVENT_ACTIONS, "action"),
    nurseId: requireString(event.nurseId, "nurseId"),
    taskId: requireString(event.taskId, "taskId"),
    minute: requireInteger(event.minute, "minute", 0),
    originNodeId: requireString(event.originNodeId, "originNodeId"),
    destinationNodeId: requireString(event.destinationNodeId, "destinationNodeId"),
    routeNodeIds: validateStringArray(event.routeNodeIds, "routeNodeIds"),
    routeEdgeIds: validateStringArray(event.routeEdgeIds, "routeEdgeIds"),
    travelSeconds: requireNumber(event.travelSeconds, "travelSeconds", 0),
    travelMinutes: requireInteger(event.travelMinutes, "travelMinutes", 0),
    warnings: validateStringArray(event.warnings, "warnings")
  };
}

function validateSimulationRunSummary(value: unknown): SimulationRunSummaryContract {
  const summary = requireRecord(value, "summary");
  requireExactKeys(summary, "summary", [
    "totalTasks",
    "completedTaskCount",
    "delayedTaskCount",
    "missedTaskCount",
    "unassignedTaskCount"
  ]);
  return {
    totalTasks: requireInteger(summary.totalTasks, "summary.totalTasks", 0),
    completedTaskCount: requireInteger(
      summary.completedTaskCount,
      "summary.completedTaskCount",
      0
    ),
    delayedTaskCount: requireInteger(summary.delayedTaskCount, "summary.delayedTaskCount", 0),
    missedTaskCount: requireInteger(summary.missedTaskCount, "summary.missedTaskCount", 0),
    unassignedTaskCount: requireInteger(
      summary.unassignedTaskCount,
      "summary.unassignedTaskCount",
      0
    )
  };
}

function validateSimulationEventReferences(
  events: SimulationEventContract[],
  context: SimulationRunValidationContext
): void {
  const taskEventIds = new Set(
    events
      .filter((event): event is SimulationTaskEventContract => event.eventType === "task")
      .map((event) => event.taskId)
  );
  const generatedTaskIds = new Set(
    context.generatedTaskSet?.generatedTasks.map((task) => task.id) ?? []
  );
  const nurseIds = new Set(context.manualAssignmentSet?.nurses.map((nurse) => nurse.id) ?? []);
  for (const assignment of context.nurseTaskAssignmentSet?.taskAssignments ?? []) {
    if (assignment.nurseId != null) {
      nurseIds.add(assignment.nurseId);
    }
  }
  for (const [index, event] of events.entries()) {
    const taskId = "taskId" in event ? event.taskId : null;
    if (typeof taskId === "string" && event.eventType !== "task" && !taskEventIds.has(taskId)) {
      throw new Error(`events[${index}].taskId must reference the task-event stream`);
    }
    if (typeof taskId === "string" && generatedTaskIds.size > 0 && !generatedTaskIds.has(taskId)) {
      throw new Error(`events[${index}].taskId references an unknown generated task`);
    }
    const nurseId = "nurseId" in event ? event.nurseId : null;
    if (typeof nurseId === "string" && nurseIds.size > 0 && !nurseIds.has(nurseId)) {
      throw new Error(`events[${index}].nurseId references an unknown nurse`);
    }
  }
}

function validateSimulationSummaryAgainstEvents(
  summary: SimulationRunSummaryContract,
  events: SimulationEventContract[],
  generatedTaskSet?: GeneratedOperationalTaskSetContract
): void {
  const taskEvents = events.filter(
    (event): event is SimulationTaskEventContract => event.eventType === "task"
  );
  const taskIds = new Set(taskEvents.map((event) => event.taskId));
  const expectedTotalTasks = generatedTaskSet?.generatedTasks.length ?? taskIds.size;
  const completedTaskIds = new Set(
    taskEvents.filter((event) => event.action === "completed").map((event) => event.taskId)
  );
  const delayedTaskIds = new Set(
    taskEvents.filter((event) => event.action === "delayed").map((event) => event.taskId)
  );
  const missedTaskIds = new Set(
    taskEvents.filter((event) => event.action === "missed").map((event) => event.taskId)
  );
  const unassignedTaskIds = new Set(
    taskEvents.filter((event) => event.action === "unassigned").map((event) => event.taskId)
  );

  if (summary.totalTasks !== expectedTotalTasks) {
    throw new Error("summary.totalTasks must match generated tasks or task events");
  }
  if (summary.completedTaskCount !== completedTaskIds.size) {
    throw new Error("summary.completedTaskCount must match completed task events");
  }
  if (summary.delayedTaskCount !== delayedTaskIds.size) {
    throw new Error("summary.delayedTaskCount must match delayed task events");
  }
  if (summary.missedTaskCount !== missedTaskIds.size) {
    throw new Error("summary.missedTaskCount must match missed task events");
  }
  if (summary.unassignedTaskCount !== unassignedTaskIds.size) {
    throw new Error("summary.unassignedTaskCount must match unassigned task events");
  }
}

function validateNoForbiddenKeysOrText(value: unknown, label: string): void {
  if (Array.isArray(value)) {
    value.forEach((item, index) => validateNoForbiddenKeysOrText(item, `${label}[${index}]`));
    return;
  }
  if (value !== null && typeof value === "object") {
    for (const [key, child] of Object.entries(value as Record<string, unknown>)) {
      const normalizedKey = normalizeKey(key);
      if (FORBIDDEN_KEYS.has(normalizedKey) || startsWithForbiddenKeyPrefix(normalizedKey)) {
        throw new Error(`${label}.${key} is not allowed in simulation output`);
      }
      validateNoForbiddenKeysOrText(child, `${label}.${key}`);
    }
    return;
  }
  if (typeof value === "string") {
    for (const [name, pattern] of FORBIDDEN_TEXT_PATTERNS) {
      if (pattern.test(value)) {
        throw new Error(`${label} must not include ${name} language`);
      }
    }
  }
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, "");
}

function startsWithForbiddenKeyPrefix(normalizedKey: string): boolean {
  return (
    FORBIDDEN_KEY_PREFIXES.some((prefix) => normalizedKey.startsWith(prefix)) ||
    normalizedKey === "notes"
  );
}

function assignOptionalString(
  source: Record<string, unknown>,
  target: object,
  key: string
): void {
  if (source[key] !== undefined) {
    (target as Record<string, unknown>)[key] =
      source[key] == null ? null : requireString(source[key], key);
  }
}

function assignOptionalMissReason(
  source: Record<string, unknown>,
  target: object,
  key: string
): void {
  if (source[key] !== undefined) {
    (target as Record<string, unknown>)[key] =
      source[key] == null ? null : requireEnum(source[key], MISS_REASONS, key);
  }
}

function assignOptionalInteger(
  source: Record<string, unknown>,
  target: object,
  key: string,
  min?: number
): void {
  if (source[key] !== undefined) {
    (target as Record<string, unknown>)[key] =
      source[key] == null ? null : requireInteger(source[key], key, min);
  }
}

function assignOptionalNumber(
  source: Record<string, unknown>,
  target: object,
  key: string,
  min?: number
): void {
  if (source[key] !== undefined) {
    (target as Record<string, unknown>)[key] =
      source[key] == null ? null : requireNumber(source[key], key, min);
  }
}

function assignOptionalStringArray(
  source: Record<string, unknown>,
  target: object,
  key: string
): void {
  if (source[key] !== undefined) {
    (target as Record<string, unknown>)[key] = validateStringArray(source[key], key);
  }
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

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  label: string
): T {
  if (typeof value !== "string" || !allowedValues.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowedValues.join(", ")}`);
  }
  return value as T;
}

function requireUnique(label: string, values: string[]): Set<string> {
  const valueSet = new Set(values);
  if (valueSet.size !== values.length) {
    throw new Error(`duplicate ${label} are not allowed`);
  }
  return valueSet;
}
