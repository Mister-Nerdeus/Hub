export type Plan1WarningExplanation = {
  warningCode: string;
  label: string;
  severity: "info" | "warning";
  source: "assignment" | "dry_run" | "walking";
  plainLanguageExplanation: string;
  operationalInterpretation: string;
  nonClaim: string;
};

const NON_CLAIM = "Operational modeling notice only; no guidance or prediction is implied.";

export const PLAN_1_WARNING_EXPLANATIONS: Plan1WarningExplanation[] = [
  explanation("BUSY_MINUTES_WARNING", "High busy-minute estimate", "warning", "dry_run", "A nurse timeline reached the configured busy-minute threshold.", "Review the synthetic task load and timing assumptions for this scenario."),
  explanation("QUEUE_DEPTH_WARNING", "Queue depth threshold reached", "warning", "dry_run", "Queued synthetic tasks accumulated behind already scheduled work.", "Use this as an operational pressure signal for the dry-run timeline."),
  explanation("ROOM_DEFERRED_TASKS", "Room has deferred tasks", "warning", "dry_run", "At least one synthetic task tied to a room falls outside the simulated duration.", "Inspect the room timeline and task timing assumptions."),
  explanation("WALKING_LOAD_WARNING", "Walking load threshold reached", "warning", "walking", "Estimated walking distance reached the configured operational threshold.", "Review route assumptions, path graph coverage, and scenario walking friction."),
  explanation("DEFERRED_TASK_WARNING", "Deferred task ratio threshold reached", "warning", "dry_run", "A nurse timeline deferred enough synthetic tasks to reach the configured ratio.", "Inspect the deterministic timeline for schedule pressure."),
  explanation("TRAUMA_WORKLOAD_NOTICE", "Trauma-heavy profile notice", "info", "dry_run", "The selected synthetic profile applies elevated trauma-response task volume.", "Compare this profile against typical to understand scenario pressure."),
  explanation("TASK_ROUTE_DISTANCE_FALLBACK", "Fallback walking distance used", "warning", "walking", "A task needed a route distance but used an explicitly labeled fallback constant.", "Treat the distance as approximate until Plan 1 route lookup resolves."),
  explanation("TASK_ROUTE_DISTANCE_MISSING", "Task route distance missing", "warning", "walking", "A task needed a route distance but no station-to-room route could be resolved.", "Inspect home station, room path node, walking baseline, and path graph references."),
  explanation("STALE_PATH_SYNC", "Stale path sync", "warning", "walking", "The assignment or path state reports stale path synchronization.", "Refresh or inspect path references before using route-derived estimates for review."),
  explanation("APPROXIMATE_GRAPH_ONLY", "Approximate graph route", "info", "walking", "The distance comes from the Plan 1 fixture graph or walking baseline.", "Use as deterministic operational route context, not measured walking truth.")
];

export function getPlan1WarningExplanation(warningCode: string): Plan1WarningExplanation {
  const explanation = PLAN_1_WARNING_EXPLANATIONS.find((entry) => entry.warningCode === warningCode);
  if (explanation == null) {
    throw new Error(`Missing Plan 1 warning explanation for ${warningCode}`);
  }
  assertPlan1WarningExplanationHasNoClaims(explanation);
  return explanation;
}

export function explainPlan1Warnings(warningCodes: string[]): Plan1WarningExplanation[] {
  return [...new Set(warningCodes)].sort().map(getPlan1WarningExplanation);
}

export function assertRequiredPlan1WarningExplanations(): void {
  const required = [
    "BUSY_MINUTES_WARNING",
    "QUEUE_DEPTH_WARNING",
    "ROOM_DEFERRED_TASKS",
    "WALKING_LOAD_WARNING",
    "DEFERRED_TASK_WARNING",
    "TRAUMA_WORKLOAD_NOTICE",
    "TASK_ROUTE_DISTANCE_FALLBACK",
    "TASK_ROUTE_DISTANCE_MISSING",
    "STALE_PATH_SYNC",
    "APPROXIMATE_GRAPH_ONLY"
  ];
  for (const warningCode of required) {
    getPlan1WarningExplanation(warningCode);
  }
}

export function assertPlan1WarningExplanationHasNoClaims(explanationValue: Plan1WarningExplanation): void {
  const combined = JSON.stringify(explanationValue).toLowerCase();
  if (/\bsafe staffing\b|\bstaffing recommendation\b|\bclinical adequacy\b|\bcare quality\b|\bpatient outcome\b|\bcertif/u.test(combined)) {
    throw new Error("Plan 1 warning explanations must not include clinical, staffing, compliance, or outcome claims");
  }
}

function explanation(
  warningCode: string,
  label: string,
  severity: "info" | "warning",
  source: "assignment" | "dry_run" | "walking",
  plainLanguageExplanation: string,
  operationalInterpretation: string
): Plan1WarningExplanation {
  return {
    warningCode,
    label,
    severity,
    source,
    plainLanguageExplanation,
    operationalInterpretation,
    nonClaim: NON_CLAIM
  };
}
