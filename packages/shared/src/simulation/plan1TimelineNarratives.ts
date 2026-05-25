import type { Plan1TimelineViewModel } from "./plan1TimelineViewModel.js";
import type { Plan1WarningExplanation } from "./plan1WarningExplainability.js";

export type Plan1TimelineCallout = {
  calloutId: "highest-queue" | "deferred-tasks" | "walking-load";
  label: string;
  summary: string;
  detail: string;
  metricLabel: string;
  metricValue: string;
};

export type Plan1WarningCardNarrative = {
  warningCode: string;
  label: string;
  severity: Plan1WarningExplanation["severity"];
  source: Plan1WarningExplanation["source"];
  explanation: string;
  operationalMeaning: string;
  nonClaim: string;
};

export type Plan1TimelineNarratives = {
  operationalOnlyLabel: "Operational-only Plan 1 timeline review";
  highestQueueCallout: Plan1TimelineCallout;
  deferredTasksCallout: Plan1TimelineCallout;
  walkingLoadCallout: Plan1TimelineCallout;
  warningCards: Plan1WarningCardNarrative[];
  limitations: string[];
  nonClaims: string[];
  syntheticDataOnly: true;
};

const PROHIBITED_CLAIM_PATTERNS = [
  /\bsafe staffing\b/iu,
  /\bunsafe staffing\b/iu,
  /\bstaffing compliant\b/iu,
  /\bclinically safe\b/iu,
  /\bclinically unsafe\b/iu,
  /\bpatient harm\b/iu,
  /\bpatient outcome prediction\b/iu,
  /\brequired nurse ratio\b/iu,
  /\bcertified staffing recommendation\b/iu
];

export function buildPlan1TimelineNarratives(
  viewModel: Plan1TimelineViewModel,
  warningExplanations: Plan1WarningExplanation[]
): Plan1TimelineNarratives {
  const highestQueueNurses = joinList(viewModel.queueDepthSummary.nurseIdsAtMaxQueueDepth);
  const deferredRooms = joinList(viewModel.deferredTaskSummary.roomIdsWithDeferredTasks);
  const callouts: Pick<
    Plan1TimelineNarratives,
    "highestQueueCallout" | "deferredTasksCallout" | "walkingLoadCallout"
  > = {
    highestQueueCallout: {
      calloutId: "highest-queue",
      label: "Highest queue signal",
      summary: `${highestQueueNurses} had the highest queue-depth signal in this deterministic dry-run.`,
      detail: "Use this as an operational pressure signal for synthetic task sequencing only.",
      metricLabel: "Max queue depth",
      metricValue: String(viewModel.queueDepthSummary.maxQueueDepth)
    },
    deferredTasksCallout: {
      calloutId: "deferred-tasks",
      label: "Deferred synthetic work",
      summary: `${deferredRooms} had deferred synthetic tasks in this timeline.`,
      detail: "Deferred work reflects task timing and duration assumptions inside the seeded scenario.",
      metricLabel: "Deferred tasks",
      metricValue: String(viewModel.deferredTaskSummary.totalDeferredTaskCount)
    },
    walkingLoadCallout: {
      calloutId: "walking-load",
      label: "Approximate walking load",
      summary: `${viewModel.walkingLoadSummary.totalApproxWalkingFeet} approximate feet came from Plan 1 route assumptions.`,
      detail: `${viewModel.walkingLoadSummary.pathBasedTaskCount} path-based tasks, ${viewModel.walkingLoadSummary.fallbackTaskCount} fallback tasks, and ${viewModel.walkingLoadSummary.missingRouteTaskCount} missing-route tasks are represented.`,
      metricLabel: "Approximate feet",
      metricValue: String(viewModel.walkingLoadSummary.totalApproxWalkingFeet)
    }
  };
  const warningCards = warningExplanations.map((entry) => ({
    warningCode: entry.warningCode,
    label: entry.label,
    severity: entry.severity,
    source: entry.source,
    explanation: entry.plainLanguageExplanation,
    operationalMeaning: entry.operationalInterpretation,
    nonClaim: entry.nonClaim
  }));
  const narratives: Plan1TimelineNarratives = {
    operationalOnlyLabel: "Operational-only Plan 1 timeline review",
    ...callouts,
    warningCards,
    limitations: [...viewModel.limitations],
    nonClaims: [...viewModel.nonClaims],
    syntheticDataOnly: true
  };
  assertPlan1TimelineNarrativesHaveNoProhibitedClaims(narratives);
  return narratives;
}

export function assertPlan1TimelineNarrativesHaveNoProhibitedClaims(value: Plan1TimelineNarratives): void {
  const claimBearingText = [
    value.operationalOnlyLabel,
    value.highestQueueCallout.summary,
    value.highestQueueCallout.detail,
    value.deferredTasksCallout.summary,
    value.deferredTasksCallout.detail,
    value.walkingLoadCallout.summary,
    value.walkingLoadCallout.detail,
    ...value.warningCards.flatMap((card) => [card.explanation, card.operationalMeaning])
  ].join(" ");
  for (const pattern of PROHIBITED_CLAIM_PATTERNS) {
    if (pattern.test(claimBearingText)) {
      throw new Error("Plan 1 timeline narratives must not include staffing, clinical, compliance, or outcome claims");
    }
  }
}

function joinList(values: string[]): string {
  if (values.length === 0) {
    return "No rooms or nurses";
  }
  return values.join(", ");
}
