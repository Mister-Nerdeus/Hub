import {
  OPERATIONAL_METRIC_KINDS,
  validateOperationalMetricContract,
  validateOperationalText,
  type OperationalMetricContract,
  type OperationalMetricDirectionality,
  type OperationalMetricGroup,
  type OperationalMetricKind,
  type OperationalMetricScope,
  type OperationalMetricSource,
  type OperationalMetricUnit
} from "./operationalMetricContract.js";

export const OPERATIONAL_METRIC_REGISTRY_SCHEMA_VERSION = "1.0.0" as const;

export type OperationalMetricDefinition = {
  canonicalMetricId: string;
  aliases: readonly string[];
  label: string;
  group: OperationalMetricGroup;
  unit: OperationalMetricUnit;
  directionality: OperationalMetricDirectionality;
  source: OperationalMetricSource;
  scope: OperationalMetricScope;
  metricKind: OperationalMetricKind;
  purpose: string;
};

export type OperationalMetricRegistryValidation = {
  metricId: string;
  canonicalMetricId: string | null;
  isRegistered: boolean;
};

type DynamicMetricPrefix = {
  prefix: string;
  canonicalMetricId: string;
};

export const OPERATIONAL_METRIC_REGISTRY = [
  {
    canonicalMetricId: "nurse_walk_time",
    aliases: ["nurse-walk-time"],
    label: "Nurse walk time",
    group: "nurse",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "travel_event",
    scope: "nurse",
    metricKind: "time",
    purpose: "Summarizes operational walking time derived from travel events."
  },
  {
    canonicalMetricId: "patient_wait_idle_proxy",
    aliases: ["patient-wait-idle-proxy", "patient-wait-idle", "patient_wait_idle"],
    label: "Patient wait idle proxy",
    group: "patient_flow",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "derived_proxy",
    scope: "simulation",
    metricKind: "pressure",
    purpose: "Summarizes deterministic patient-flow wait and idle operational pressure."
  },
  {
    canonicalMetricId: "task_time",
    aliases: ["task-time"],
    label: "Task time",
    group: "task",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "simulation",
    metricKind: "time",
    purpose: "Summarizes task-time operational burden used for scenario comparison."
  },
  {
    canonicalMetricId: "queue_delay",
    aliases: ["queue-delay"],
    label: "Queue delay",
    group: "patient_flow",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "queue_event",
    scope: "scenario",
    metricKind: "pressure",
    purpose: "Summarizes deterministic queue wait pressure."
  },
  {
    canonicalMetricId: "unit_saturation",
    aliases: ["unit-saturation"],
    label: "Unit saturation",
    group: "unit",
    unit: "percent",
    directionality: "lower_is_better",
    source: "derived_proxy",
    scope: "simulation",
    metricKind: "pressure",
    purpose: "Summarizes operational saturation pressure for a scenario."
  },
  {
    canonicalMetricId: "room_turnover_pressure",
    aliases: ["room-turnover-pressure", "room_pressure_score"],
    label: "Room turnover pressure",
    group: "room",
    unit: "score",
    directionality: "lower_is_better",
    source: "derived_proxy",
    scope: "layout",
    metricKind: "pressure",
    purpose: "Summarizes room turnover and blocked-room operational pressure."
  },
  {
    canonicalMetricId: "nurse_strain_proxy",
    aliases: ["nurse-strain-proxy"],
    label: "Nurse strain proxy",
    group: "nurse",
    unit: "score",
    directionality: "lower_is_better",
    source: "derived_proxy",
    scope: "nurse",
    metricKind: "burden",
    purpose: "Summarizes operational nurse workload burden."
  },
  {
    canonicalMetricId: "layout_friction",
    aliases: ["layout-friction", "layout_friction_score"],
    label: "Layout friction",
    group: "layout",
    unit: "score",
    directionality: "lower_is_better",
    source: "derived_proxy",
    scope: "layout",
    metricKind: "burden",
    purpose: "Summarizes travel-derived layout movement friction."
  },
  {
    canonicalMetricId: "total_walk_minutes",
    aliases: [],
    label: "Total walk minutes",
    group: "nurse",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "travel_event",
    scope: "simulation",
    metricKind: "time",
    purpose: "Summarizes total travel-event walking minutes."
  },
  {
    canonicalMetricId: "total_walk_distance_feet",
    aliases: ["nurse-walk-distance", "nurse_walk_distance"],
    label: "Total walk distance feet",
    group: "nurse",
    unit: "feet",
    directionality: "lower_is_better",
    source: "travel_event",
    scope: "simulation",
    metricKind: "distance",
    purpose: "Summarizes total travel-event walking distance in feet."
  },
  {
    canonicalMetricId: "walk_minutes_by_nurse",
    aliases: [],
    label: "Walk minutes by nurse",
    group: "nurse",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "travel_event",
    scope: "nurse",
    metricKind: "time",
    purpose: "Summarizes travel-event walking minutes for a synthetic nurse ID."
  },
  {
    canonicalMetricId: "walk_distance_feet_by_nurse",
    aliases: [],
    label: "Walk distance feet by nurse",
    group: "nurse",
    unit: "feet",
    directionality: "lower_is_better",
    source: "travel_event",
    scope: "nurse",
    metricKind: "distance",
    purpose: "Summarizes travel-event walking distance for a synthetic nurse ID."
  },
  {
    canonicalMetricId: "walk_events_by_nurse",
    aliases: [],
    label: "Walk events by nurse",
    group: "nurse",
    unit: "count",
    directionality: "lower_is_better",
    source: "travel_event",
    scope: "nurse",
    metricKind: "burden",
    purpose: "Summarizes travel-event count for a synthetic nurse ID."
  },
  {
    canonicalMetricId: "walk_minutes_by_task",
    aliases: [],
    label: "Walk minutes by task",
    group: "task",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "travel_event",
    scope: "task",
    metricKind: "time",
    purpose: "Summarizes travel-event walking minutes for a generated task ID."
  },
  {
    canonicalMetricId: "walk_minutes_by_room",
    aliases: [],
    label: "Walk minutes by room",
    group: "room",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "travel_event",
    scope: "room",
    metricKind: "time",
    purpose: "Summarizes travel-event walking minutes for a synthetic room ID."
  },
  {
    canonicalMetricId: "direct_task_minutes",
    aliases: [],
    label: "Direct task minutes",
    group: "task",
    unit: "minutes",
    directionality: "neutral",
    source: "task_event",
    scope: "simulation",
    metricKind: "time",
    purpose: "Summarizes direct task work minutes without treating lower volume as automatic improvement."
  },
  {
    canonicalMetricId: "queue_wait_minutes",
    aliases: [],
    label: "Queue wait minutes",
    group: "task",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "queue_event",
    scope: "scenario",
    metricKind: "pressure",
    purpose: "Summarizes deterministic queue wait minutes."
  },
  {
    canonicalMetricId: "task_delay_minutes",
    aliases: [],
    label: "Task delay minutes",
    group: "task",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "simulation",
    metricKind: "pressure",
    purpose: "Summarizes deterministic task delay minutes."
  },
  {
    canonicalMetricId: "travel_to_task_minutes",
    aliases: [],
    label: "Travel to task minutes",
    group: "task",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "travel_event",
    scope: "simulation",
    metricKind: "time",
    purpose: "Summarizes travel minutes associated with modeled task events."
  },
  {
    canonicalMetricId: "missed_task_count",
    aliases: [],
    label: "Missed task count",
    group: "task",
    unit: "count",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "simulation",
    metricKind: "pressure",
    purpose: "Summarizes terminal missed task count."
  },
  {
    canonicalMetricId: "task_density_bucket",
    aliases: [],
    label: "Task density bucket",
    group: "task",
    unit: "count",
    directionality: "neutral",
    source: "task_event",
    scope: "scenario",
    metricKind: "density",
    purpose: "Summarizes deterministic task-ready counts by time bucket."
  },
  {
    canonicalMetricId: "first_modeled_task_wait_minutes",
    aliases: [],
    label: "First modeled task wait minutes",
    group: "patient_flow",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "scenario",
    metricKind: "pressure",
    purpose: "Summarizes wait before the first modeled task starts."
  },
  {
    canonicalMetricId: "idle_between_ready_and_start_minutes",
    aliases: [],
    label: "Idle between ready and start minutes",
    group: "patient_flow",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "scenario",
    metricKind: "pressure",
    purpose: "Summarizes time between task ready and start events."
  },
  {
    canonicalMetricId: "delay_exposure_minutes",
    aliases: [],
    label: "Delay exposure minutes",
    group: "patient_flow",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "simulation",
    metricKind: "pressure",
    purpose: "Summarizes delay exposure minutes from task events."
  },
  {
    canonicalMetricId: "missed_unassigned_proxy_penalty_minutes",
    aliases: [],
    label: "Missed unassigned proxy penalty minutes",
    group: "patient_flow",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "simulation",
    metricKind: "pressure",
    purpose: "Summarizes terminal missed or unassigned proxy penalty minutes."
  },
  {
    canonicalMetricId: "projected_missed_task_pressure_minutes",
    aliases: [],
    label: "Projected missed task pressure minutes",
    group: "patient_flow",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "simulation",
    metricKind: "pressure",
    purpose: "Summarizes projected not-started missed task operational pressure."
  },
  {
    canonicalMetricId: "patient_flow_wait_idle_minutes",
    aliases: [],
    label: "Patient-flow wait idle minutes",
    group: "patient_flow",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "derived_proxy",
    scope: "simulation",
    metricKind: "pressure",
    purpose: "Summarizes total patient-flow wait and idle proxy minutes."
  },
  {
    canonicalMetricId: "patient_flow_wait_idle_by_room",
    aliases: [],
    label: "Patient-flow wait idle by room",
    group: "patient_flow",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "derived_proxy",
    scope: "room",
    metricKind: "pressure",
    purpose: "Summarizes patient-flow wait and idle proxy minutes for a synthetic room ID."
  },
  {
    canonicalMetricId: "patient_flow_wait_between_ready_and_start_by_room",
    aliases: [],
    label: "Patient-flow wait between ready and start by room",
    group: "patient_flow",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "room",
    metricKind: "pressure",
    purpose: "Summarizes ready-to-start wait minutes for a synthetic room ID."
  },
  {
    canonicalMetricId: "patient_flow_delay_exposure_by_room",
    aliases: [],
    label: "Patient-flow delay exposure by room",
    group: "patient_flow",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "room",
    metricKind: "pressure",
    purpose: "Summarizes delay exposure minutes for a synthetic room ID."
  },
  {
    canonicalMetricId: "patient_flow_terminal_penalty_by_room",
    aliases: [],
    label: "Patient-flow terminal penalty by room",
    group: "patient_flow",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "room",
    metricKind: "pressure",
    purpose: "Summarizes missed or unassigned terminal penalty minutes for a synthetic room ID."
  },
  {
    canonicalMetricId: "room_turnover_task_minutes",
    aliases: [],
    label: "Room turnover task minutes",
    group: "room",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "simulation",
    metricKind: "time",
    purpose: "Summarizes room turnover task minutes."
  },
  {
    canonicalMetricId: "blocked_room_minutes",
    aliases: ["room-blocked-time"],
    label: "Blocked room minutes",
    group: "room",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "derived_proxy",
    scope: "room",
    metricKind: "pressure",
    purpose: "Summarizes blocked-room operational minutes."
  },
  {
    canonicalMetricId: "delayed_turnover_minutes",
    aliases: [],
    label: "Delayed turnover minutes",
    group: "room",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "room",
    metricKind: "pressure",
    purpose: "Summarizes delayed turnover minutes."
  },
  {
    canonicalMetricId: "missed_turnover_tasks",
    aliases: [],
    label: "Missed turnover tasks",
    group: "room",
    unit: "count",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "room",
    metricKind: "pressure",
    purpose: "Summarizes missed turnover task count."
  },
  {
    canonicalMetricId: "blocked_room_minutes_by_room",
    aliases: [],
    label: "Blocked room minutes by room",
    group: "room",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "derived_proxy",
    scope: "room",
    metricKind: "pressure",
    purpose: "Summarizes blocked minutes for a synthetic room ID."
  },
  {
    canonicalMetricId: "turnover_task_minutes_by_room",
    aliases: [],
    label: "Turnover task minutes by room",
    group: "room",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "room",
    metricKind: "time",
    purpose: "Summarizes turnover task minutes for a synthetic room ID."
  },
  {
    canonicalMetricId: "delayed_turnover_minutes_by_room",
    aliases: [],
    label: "Delayed turnover minutes by room",
    group: "room",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "room",
    metricKind: "pressure",
    purpose: "Summarizes delayed turnover minutes for a synthetic room ID."
  },
  {
    canonicalMetricId: "missed_turnover_tasks_by_room",
    aliases: [],
    label: "Missed turnover tasks by room",
    group: "room",
    unit: "count",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "room",
    metricKind: "pressure",
    purpose: "Summarizes missed turnover task count for a synthetic room ID."
  },
  {
    canonicalMetricId: "room_turnover_pressure_by_room",
    aliases: [],
    label: "Room turnover pressure by room",
    group: "room",
    unit: "score",
    directionality: "lower_is_better",
    source: "derived_proxy",
    scope: "room",
    metricKind: "pressure",
    purpose: "Summarizes room turnover pressure score for a synthetic room ID."
  },
  {
    canonicalMetricId: "direct_task_minutes_by_nurse",
    aliases: [],
    label: "Direct task minutes by nurse",
    group: "nurse",
    unit: "minutes",
    directionality: "neutral",
    source: "task_event",
    scope: "nurse",
    metricKind: "time",
    purpose: "Summarizes direct task work minutes for a synthetic nurse ID without treating lower volume as automatic improvement."
  },
  {
    canonicalMetricId: "completed_task_count_by_nurse",
    aliases: ["completed_task_count_by_nurse_alpha"],
    label: "Completed task count by nurse",
    group: "nurse",
    unit: "count",
    directionality: "neutral",
    source: "task_event",
    scope: "nurse",
    metricKind: "throughput",
    purpose: "Summarizes completed task throughput count for a synthetic nurse ID."
  },
  {
    canonicalMetricId: "delayed_task_count_by_nurse",
    aliases: [],
    label: "Delayed task count by nurse",
    group: "nurse",
    unit: "count",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "nurse",
    metricKind: "pressure",
    purpose: "Summarizes delayed task count for a synthetic nurse ID."
  },
  {
    canonicalMetricId: "missed_task_count_by_nurse",
    aliases: [],
    label: "Missed task count by nurse",
    group: "nurse",
    unit: "count",
    directionality: "lower_is_better",
    source: "task_event",
    scope: "nurse",
    metricKind: "pressure",
    purpose: "Summarizes missed task count for a synthetic nurse ID."
  },
  {
    canonicalMetricId: "queue_wait_minutes_by_nurse",
    aliases: [],
    label: "Queue wait minutes by nurse",
    group: "nurse",
    unit: "minutes",
    directionality: "lower_is_better",
    source: "queue_event",
    scope: "nurse",
    metricKind: "pressure",
    purpose: "Summarizes queue wait minutes for a synthetic nurse ID."
  },
  {
    canonicalMetricId: "assigned_task_count_by_nurse",
    aliases: [],
    label: "Assigned task count by nurse",
    group: "nurse",
    unit: "count",
    directionality: "neutral",
    source: "derived_proxy",
    scope: "nurse",
    metricKind: "throughput",
    purpose: "Summarizes assigned task throughput count for a synthetic nurse ID."
  },
  {
    canonicalMetricId: "comparison_delta",
    aliases: ["comparison-delta"],
    label: "Comparison delta",
    group: "comparison",
    unit: "count",
    directionality: "neutral",
    source: "comparison_delta",
    scope: "comparison",
    metricKind: "comparison",
    purpose: "Summarizes a signed operational comparison delta."
  }
] as const satisfies readonly OperationalMetricDefinition[];

const DYNAMIC_METRIC_PREFIXES = [
  { prefix: "walk_minutes_by_nurse_", canonicalMetricId: "walk_minutes_by_nurse" },
  { prefix: "walk_distance_feet_by_nurse_", canonicalMetricId: "walk_distance_feet_by_nurse" },
  { prefix: "walk_events_by_nurse_", canonicalMetricId: "walk_events_by_nurse" },
  { prefix: "walk_minutes_by_task_", canonicalMetricId: "walk_minutes_by_task" },
  { prefix: "walk_minutes_by_room_", canonicalMetricId: "walk_minutes_by_room" },
  { prefix: "direct_task_minutes_by_nurse_", canonicalMetricId: "direct_task_minutes_by_nurse" },
  { prefix: "completed_task_count_by_nurse_", canonicalMetricId: "completed_task_count_by_nurse" },
  { prefix: "delayed_task_count_by_nurse_", canonicalMetricId: "delayed_task_count_by_nurse" },
  { prefix: "missed_task_count_by_nurse_", canonicalMetricId: "missed_task_count_by_nurse" },
  { prefix: "assigned_task_count_by_nurse_", canonicalMetricId: "assigned_task_count_by_nurse" },
  { prefix: "queue_wait_minutes_by_nurse_", canonicalMetricId: "queue_wait_minutes_by_nurse" },
  { prefix: "task_density_bucket_", canonicalMetricId: "task_density_bucket" },
  { prefix: "blocked_room_minutes_by_room_", canonicalMetricId: "blocked_room_minutes_by_room" },
  { prefix: "turnover_task_minutes_by_room_", canonicalMetricId: "turnover_task_minutes_by_room" },
  { prefix: "delayed_turnover_minutes_by_room_", canonicalMetricId: "delayed_turnover_minutes_by_room" },
  { prefix: "missed_turnover_tasks_by_room_", canonicalMetricId: "missed_turnover_tasks_by_room" },
  { prefix: "room_turnover_pressure_by_room_", canonicalMetricId: "room_turnover_pressure_by_room" },
  { prefix: "patient_flow_wait_idle_by_room_", canonicalMetricId: "patient_flow_wait_idle_by_room" },
  {
    prefix: "patient_flow_wait_between_ready_and_start_by_room_",
    canonicalMetricId: "patient_flow_wait_between_ready_and_start_by_room"
  },
  { prefix: "patient_flow_delay_exposure_by_room_", canonicalMetricId: "patient_flow_delay_exposure_by_room" },
  { prefix: "patient_flow_terminal_penalty_by_room_", canonicalMetricId: "patient_flow_terminal_penalty_by_room" }
] as const satisfies readonly DynamicMetricPrefix[];

const definitionsByCanonicalId = buildDefinitionsByCanonicalId(OPERATIONAL_METRIC_REGISTRY);
const definitionsByLookupId = buildDefinitionsByLookupId(OPERATIONAL_METRIC_REGISTRY);

export const OPERATIONAL_DASHBOARD_CANONICAL_METRIC_IDS = [
  "nurse_walk_time",
  "patient_wait_idle_proxy",
  "task_time",
  "queue_delay",
  "unit_saturation",
  "room_turnover_pressure",
  "nurse_strain_proxy",
  "layout_friction"
] as const;

export function resolveCanonicalMetricId(metricId: string): string | null {
  const lookupId = requireMetricId(metricId);
  const direct = definitionsByLookupId.get(lookupId);
  if (direct != null) {
    return direct.canonicalMetricId;
  }

  const underscoreId = lookupId.replaceAll("-", "_");
  const normalized = definitionsByLookupId.get(underscoreId);
  if (normalized != null) {
    return normalized.canonicalMetricId;
  }

  return resolveDynamicMetricId(underscoreId);
}

export function getOperationalMetricDefinition(metricId: string): OperationalMetricDefinition | null {
  const canonicalMetricId = resolveCanonicalMetricId(metricId);
  if (canonicalMetricId == null) {
    return null;
  }
  return definitionsByCanonicalId.get(canonicalMetricId) ?? null;
}

export function getOperationalMetricDirectionality(
  metricId: string
): OperationalMetricDirectionality | null {
  return getOperationalMetricDefinition(metricId)?.directionality ?? null;
}

export function validateMetricAgainstRegistry(
  metric: unknown
): OperationalMetricRegistryValidation {
  const validatedMetric = validateOperationalMetricContract(metric);
  const definition = getOperationalMetricDefinition(validatedMetric.metricId);

  if (definition == null) {
    return {
      metricId: validatedMetric.metricId,
      canonicalMetricId: null,
      isRegistered: false
    };
  }

  const mismatches = collectRegistryMismatches(validatedMetric, definition);
  if (mismatches.length > 0) {
    throw new Error(
      `metric ${validatedMetric.metricId} does not match operational metric registry: ${mismatches.join("; ")}`
    );
  }

  return {
    metricId: validatedMetric.metricId,
    canonicalMetricId: definition.canonicalMetricId,
    isRegistered: true
  };
}

function buildDefinitionsByCanonicalId(
  definitions: readonly OperationalMetricDefinition[]
): Map<string, OperationalMetricDefinition> {
  const mapped = new Map<string, OperationalMetricDefinition>();

  for (const definition of definitions) {
    validateRegistryDefinition(definition);
    if (mapped.has(definition.canonicalMetricId)) {
      throw new Error(`duplicate canonical operational metric id ${definition.canonicalMetricId}`);
    }
    mapped.set(definition.canonicalMetricId, definition);
  }

  for (const dynamicPrefix of DYNAMIC_METRIC_PREFIXES) {
    if (!mapped.has(dynamicPrefix.canonicalMetricId)) {
      throw new Error(`dynamic metric prefix maps to unknown canonical metric ${dynamicPrefix.canonicalMetricId}`);
    }
  }

  return mapped;
}

function buildDefinitionsByLookupId(
  definitions: readonly OperationalMetricDefinition[]
): Map<string, OperationalMetricDefinition> {
  const mapped = new Map<string, OperationalMetricDefinition>();

  for (const definition of definitions) {
    addLookupId(mapped, definition.canonicalMetricId, definition);
    for (const alias of definition.aliases) {
      addLookupId(mapped, alias, definition);
    }
  }

  return mapped;
}

function addLookupId(
  mapped: Map<string, OperationalMetricDefinition>,
  metricId: string,
  definition: OperationalMetricDefinition
): void {
  const lookupId = requireMetricId(metricId);
  const existing = mapped.get(lookupId);
  if (existing != null) {
    throw new Error(
      `operational metric id ${lookupId} maps to both ${existing.canonicalMetricId} and ${definition.canonicalMetricId}`
    );
  }
  mapped.set(lookupId, definition);
}

function validateRegistryDefinition(definition: OperationalMetricDefinition): void {
  requireMetricId(definition.canonicalMetricId);
  validateOperationalText(definition.label, `${definition.canonicalMetricId}.label`);
  validateOperationalText(definition.purpose, `${definition.canonicalMetricId}.purpose`);
  if (!OPERATIONAL_METRIC_KINDS.includes(definition.metricKind)) {
    throw new Error(`${definition.canonicalMetricId}.metricKind must be a supported operational metric kind`);
  }
  if (definition.metricKind === "throughput" && definition.directionality !== "neutral") {
    throw new Error(`${definition.canonicalMetricId} throughput metrics must use neutral directionality`);
  }
  if (
    (definition.canonicalMetricId === "completed_task_count_by_nurse" ||
      definition.canonicalMetricId === "assigned_task_count_by_nurse") &&
    definition.directionality === "lower_is_better"
  ) {
    throw new Error(`${definition.canonicalMetricId} cannot be lower_is_better`);
  }
  if (
    (definition.canonicalMetricId === "direct_task_minutes" ||
      definition.canonicalMetricId === "direct_task_minutes_by_nurse") &&
    definition.directionality === "lower_is_better"
  ) {
    throw new Error(`${definition.canonicalMetricId} cannot treat lower direct work minutes as automatic improvement`);
  }
}

function resolveDynamicMetricId(metricId: string): string | null {
  for (const dynamicPrefix of DYNAMIC_METRIC_PREFIXES) {
    if (metricId.startsWith(dynamicPrefix.prefix) && metricId.length > dynamicPrefix.prefix.length) {
      return dynamicPrefix.canonicalMetricId;
    }
  }
  return null;
}

function collectRegistryMismatches(
  metric: OperationalMetricContract,
  definition: OperationalMetricDefinition
): string[] {
  const mismatches: string[] = [];
  if (metric.group !== definition.group) {
    mismatches.push(`group must be ${definition.group}`);
  }
  if (metric.unit !== definition.unit) {
    mismatches.push(`unit must be ${definition.unit}`);
  }
  if (metric.directionality !== definition.directionality) {
    mismatches.push(`directionality must be ${definition.directionality}`);
  }
  if (metric.source !== definition.source) {
    mismatches.push(`source must be ${definition.source}`);
  }
  if (metric.scope !== definition.scope) {
    mismatches.push(`scope must be ${definition.scope}`);
  }
  return mismatches;
}

function requireMetricId(metricId: string): string {
  if (typeof metricId !== "string" || metricId.length === 0) {
    throw new Error("metricId must be a non-empty string");
  }
  return metricId;
}
