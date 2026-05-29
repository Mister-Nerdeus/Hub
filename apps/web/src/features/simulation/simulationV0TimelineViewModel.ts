import type { InternalDryRunExecutorOutput } from "@nerdeus/shared";
import type { SimulationV0ReviewState } from "./simulationV0ReviewState";

export type SimulationV0TimelineRow = {
  eventId: string;
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
  rows: readonly SimulationV0TimelineRow[];
  visibleRows: readonly SimulationV0TimelineRow[];
  totalRowCount: number;
  rowLimit: 25;
  availableSyntheticNurseIds: readonly string[];
  availableBedPositionIds: readonly string[];
};

export function buildSimulationV0TimelineViewModel(input: {
  reviewState: SimulationV0ReviewState;
  run: InternalDryRunExecutorOutput;
}): SimulationV0TimelineViewModel {
  const rows = input.run.timeline.map((event) => ({
    eventId: event.eventId,
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
    rows,
    visibleRows: rows.slice(0, 25),
    totalRowCount: rows.length,
    rowLimit: 25,
    availableSyntheticNurseIds: Array.from(
      new Set(rows.map((row) => row.syntheticNurseId).filter((id): id is string => id != null))
    ).sort(),
    availableBedPositionIds: Array.from(new Set(rows.map((row) => row.bedPositionId))).sort()
  };
}
