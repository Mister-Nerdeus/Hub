import type { InternalDryRunExecutorOutput } from "@nerdeus/shared";
import type { SimulationV0ReviewState } from "./simulationV0ReviewState";

export type SimulationV0TimelineRow = {
  minute: number;
  eventLabel: string;
  taskInstanceId: string;
  bedPositionId: string;
  syntheticNurseId: string | null;
  status: "internal_dry_run_only";
};

export type SimulationV0TimelineViewModel = {
  profileId: SimulationV0ReviewState["activityProfileId"];
  ratioView: SimulationV0ReviewState["ratioView"];
  visibleRows: readonly SimulationV0TimelineRow[];
  totalRowCount: number;
  rowLimit: 25;
};

export function buildSimulationV0TimelineViewModel(input: {
  reviewState: SimulationV0ReviewState;
  run: InternalDryRunExecutorOutput;
}): SimulationV0TimelineViewModel {
  const rows = input.run.timeline.map((event) => ({
    minute: event.syntheticMinuteOffset,
    eventLabel: event.eventLabel,
    taskInstanceId: event.taskInstanceId,
    bedPositionId: event.loadableBedPositionId,
    syntheticNurseId: event.syntheticNurseId,
    status: event.dryRunStatus
  }));
  return {
    profileId: input.reviewState.activityProfileId,
    ratioView: input.reviewState.ratioView,
    visibleRows: rows.slice(0, 25),
    totalRowCount: rows.length,
    rowLimit: 25
  };
}
