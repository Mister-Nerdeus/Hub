import { validatePlan1NonClaims } from "../scenario/plan1SimulationAssumptions.js";
import type { Plan1AssumptionViewModel } from "../scenario/plan1AssumptionViewModel.js";
import type { Plan1ScenarioBuilderState } from "../scenario/plan1ScenarioBuilderState.js";
import type { Plan1GeneratedTaskSet } from "../scenario/plan1ScenarioValidation.js";
import type { Plan1ShiftDryRunOutput } from "./plan1ShiftDryRun.js";
import type { Plan1TimelineViewModel } from "./plan1TimelineViewModel.js";
import type { Plan1WarningExplanation } from "./plan1WarningExplainability.js";
import type { Plan1ScenarioComparisonViewModel } from "./plan1ScenarioComparisonViewModel.js";

export type Plan1SimulationProofReport = {
  reportId: string;
  planId: "default-er-layout-plan-1";
  sections: {
    scenarioIdentity: {
      scenarioId: string;
      profileId: string;
      seed: number;
      durationMinutes: number;
    };
    assumptionsSummary: {
      assumptionsId: string;
      sectionLabels: string[];
    };
    assignmentSummary: {
      nurseCount: number;
      roomLoadCount: number;
      assignmentCount: number;
    };
    generatedTaskSummary: {
      taskSetId: string;
      taskCount: number;
      walkingTaskCount: number;
    };
    dryRunSummary: {
      dryRunId: string;
      completedTaskCount: number;
      deferredTaskCount: number;
      pathBasedTaskCount: number;
      fallbackTaskCount: number;
      missingRouteTaskCount: number;
      warningCodes: string[];
    };
    timelineSummary: Plan1TimelineViewModel["walkingLoadSummary"] & {
      nurseTimelineCount: number;
      roomTimelineCount: number;
      warningTimelineCount: number;
    };
    warningExplanations: Plan1WarningExplanation[];
    scenarioComparisonSummary: {
      comparisonId: string;
      rowCount: number;
      plainLanguageSummaries: string[];
    };
    determinismProof: {
      sameInputProducesSameReport: boolean;
      deterministicKey: string;
    };
    limitations: string[];
    nonClaims: string[];
  };
  syntheticDataOnly: true;
};

export function buildPlan1SimulationProofReport(input: {
  reportId: string;
  scenarioState: Plan1ScenarioBuilderState;
  assumptionsViewModel: Plan1AssumptionViewModel;
  generatedTaskSet: Plan1GeneratedTaskSet;
  dryRun: Plan1ShiftDryRunOutput;
  timelineViewModel: Plan1TimelineViewModel;
  warningExplanations: Plan1WarningExplanation[];
  comparisonViewModel: Plan1ScenarioComparisonViewModel;
}): Plan1SimulationProofReport {
  const report = buildReport(input, false);
  const replay = buildReport(input, false);
  report.sections.determinismProof.sameInputProducesSameReport = JSON.stringify(report) === JSON.stringify(replay);
  return report;
}

function buildReport(
  input: Parameters<typeof buildPlan1SimulationProofReport>[0],
  sameInputProducesSameReport: boolean
): Plan1SimulationProofReport {
  const limitations = [
    ...input.scenarioState.limitations,
    ...input.assumptionsViewModel.limitations,
    ...input.dryRun.limitations,
    ...input.comparisonViewModel.limitations
  ];
  const nonClaims = validatePlan1NonClaims([
    ...input.scenarioState.nonClaims,
    ...input.assumptionsViewModel.nonClaims,
    ...input.dryRun.nonClaims,
    ...input.comparisonViewModel.nonClaims
  ], "proofReport.nonClaims");
  return {
    reportId: input.reportId,
    planId: "default-er-layout-plan-1",
    sections: {
      scenarioIdentity: {
        scenarioId: input.scenarioState.scenarioId,
        profileId: input.scenarioState.intensityProfileId,
        seed: input.scenarioState.seed,
        durationMinutes: input.scenarioState.durationMinutes
      },
      assumptionsSummary: {
        assumptionsId: input.assumptionsViewModel.assumptionsId,
        sectionLabels: input.assumptionsViewModel.sections.map((section) => section.label)
      },
      assignmentSummary: {
        nurseCount: input.scenarioState.assignmentWorkflowState.nurses.length,
        roomLoadCount: input.scenarioState.assignmentWorkflowState.roomLoads.length,
        assignmentCount: input.scenarioState.assignmentWorkflowState.assignments.length
      },
      generatedTaskSummary: {
        taskSetId: input.generatedTaskSet.taskSetId,
        taskCount: input.generatedTaskSet.tasks.length,
        walkingTaskCount: input.generatedTaskSet.tasks.filter((task) => task.requiresWalkingRoute).length
      },
      dryRunSummary: {
        dryRunId: input.dryRun.dryRunId,
        completedTaskCount: input.dryRun.completedTaskCount,
        deferredTaskCount: input.dryRun.deferredTaskCount,
        pathBasedTaskCount: input.dryRun.pathBasedTaskCount,
        fallbackTaskCount: input.dryRun.fallbackTaskCount,
        missingRouteTaskCount: input.dryRun.missingRouteTaskCount,
        warningCodes: [...input.dryRun.warningCodes]
      },
      timelineSummary: {
        ...input.timelineViewModel.walkingLoadSummary,
        nurseTimelineCount: input.timelineViewModel.nurseTimelineSummary.length,
        roomTimelineCount: input.timelineViewModel.roomTimelineSummary.length,
        warningTimelineCount: input.timelineViewModel.warningTimelineSummary.length
      },
      warningExplanations: [...input.warningExplanations],
      scenarioComparisonSummary: {
        comparisonId: input.comparisonViewModel.comparisonId,
        rowCount: input.comparisonViewModel.rows.length,
        plainLanguageSummaries: input.comparisonViewModel.rows.map((row) => row.plainLanguageSummary)
      },
      determinismProof: {
        sameInputProducesSameReport,
        deterministicKey: [
          input.scenarioState.scenarioId,
          input.scenarioState.seed,
          input.scenarioState.durationMinutes,
          input.generatedTaskSet.taskSetId,
          input.dryRun.dryRunId
        ].join("|")
      },
      limitations: [...new Set(limitations)].sort(),
      nonClaims: [...new Set(nonClaims)].sort()
    },
    syntheticDataOnly: true
  };
}
