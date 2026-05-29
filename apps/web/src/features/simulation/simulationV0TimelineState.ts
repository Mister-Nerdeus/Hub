import type { SimulationV0TimelineRow } from "./simulationV0TimelineViewModel";

export const simulationV0TimelinePageSize = 25 as const;

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
  pageIndex: number;
};

export const simulationV0DefaultTimelineTableState: SimulationV0TimelineTableState = {
  filter: "all_events",
  pageIndex: 0
};

export function filterSimulationV0TimelineRows(
  rows: readonly SimulationV0TimelineRow[],
  filter: SimulationV0TimelineFilter
): readonly SimulationV0TimelineRow[] {
  const option = simulationV0TimelineFilterOptions.find((candidate) => candidate.id === filter);
  if (option == null || option.eventLabel == null) return rows;
  return rows.filter((row) => row.eventLabel === option.eventLabel);
}

export function paginateSimulationV0TimelineRows(
  rows: readonly SimulationV0TimelineRow[],
  pageIndex: number
): readonly SimulationV0TimelineRow[] {
  return rows.slice(pageIndex * simulationV0TimelinePageSize, (pageIndex + 1) * simulationV0TimelinePageSize);
}

export function getSimulationV0TimelinePageCount(rowCount: number): number {
  return Math.max(1, Math.ceil(rowCount / simulationV0TimelinePageSize));
}
