import type { SimulationV0TimelineRow } from "./simulationV0TimelineViewModel";

export const simulationV0TimelinePageSize = 25 as const;
export const simulationV0TimelineAllRowsMax = 100 as const;
export type SimulationV0TimelineRowDisplay = "25" | "50" | "all";

export type SimulationV0TimelineFilter =
  | "all_events"
  | "ready"
  | "queued"
  | "delayed"
  | "started"
  | "completed"
  | "unassigned";

export const simulationV0TimelineFilterOptions: readonly {
  id: SimulationV0TimelineFilter;
  label: string;
  eventLabel: SimulationV0TimelineRow["eventLabel"] | null;
}[] = [
  { id: "all_events", label: "All events", eventLabel: null },
  { id: "ready", label: "Ready", eventLabel: "task_placeholder_ready" },
  { id: "queued", label: "Queued", eventLabel: "task_placeholder_queued" },
  { id: "delayed", label: "Delayed", eventLabel: "task_placeholder_delayed" },
  { id: "started", label: "Started", eventLabel: "task_placeholder_started" },
  { id: "completed", label: "Completed", eventLabel: "task_placeholder_completed" },
  { id: "unassigned", label: "Unassigned", eventLabel: "task_placeholder_unassigned" }
];

export type SimulationV0TimelineTableState = {
  filter: SimulationV0TimelineFilter;
  syntheticNurseId: string;
  bedPositionId: string;
  rowDisplay: SimulationV0TimelineRowDisplay;
  pageIndex: number;
};

export const simulationV0DefaultTimelineTableState: SimulationV0TimelineTableState = {
  filter: "all_events",
  syntheticNurseId: "all_synthetic_nurses",
  bedPositionId: "all_bed_positions",
  rowDisplay: "25",
  pageIndex: 0
};

export function filterSimulationV0TimelineRows(
  rows: readonly SimulationV0TimelineRow[],
  filter: SimulationV0TimelineFilter,
  syntheticNurseId = "all_synthetic_nurses",
  bedPositionId = "all_bed_positions"
): readonly SimulationV0TimelineRow[] {
  const option = simulationV0TimelineFilterOptions.find((candidate) => candidate.id === filter);
  return rows.filter((row) => {
    const eventMatches = option == null || option.eventLabel == null || row.eventLabel === option.eventLabel;
    const nurseMatches = syntheticNurseId === "all_synthetic_nurses" || row.syntheticNurseId === syntheticNurseId;
    const bedMatches = bedPositionId === "all_bed_positions" || row.bedPositionId === bedPositionId;
    return eventMatches && nurseMatches && bedMatches;
  });
}

export function paginateSimulationV0TimelineRows(
  rows: readonly SimulationV0TimelineRow[],
  pageIndex: number,
  rowDisplay: SimulationV0TimelineRowDisplay = "25"
): readonly SimulationV0TimelineRow[] {
  if (rowDisplay === "all") return rows.slice(0, simulationV0TimelineAllRowsMax);
  const pageSize = Number(rowDisplay);
  return rows.slice(pageIndex * pageSize, (pageIndex + 1) * pageSize);
}

export function getSimulationV0TimelinePageCount(
  rowCount: number,
  rowDisplay: SimulationV0TimelineRowDisplay = "25"
): number {
  if (rowDisplay === "all") return 1;
  return Math.max(1, Math.ceil(rowCount / Number(rowDisplay)));
}
