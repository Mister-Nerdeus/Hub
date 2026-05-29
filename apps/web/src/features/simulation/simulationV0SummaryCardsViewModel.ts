import type { InternalDryRunExecutorOutput } from "@nerdeus/shared";
import type { SimulationV0ReviewState } from "./simulationV0ReviewState";

export type SimulationV0SummaryCard = {
  label: string;
  value: string;
  groupId: "workload" | "queue" | "coverage_placeholder" | "runtime";
  source: "dry_run_artifact";
};

export type SimulationV0SummaryCardGroup = {
  id: SimulationV0SummaryCard["groupId"];
  title: string;
  note: string;
  cards: readonly SimulationV0SummaryCard[];
};

export type SimulationV0SummaryCardsViewModel = {
  profileId: SimulationV0ReviewState["activityProfileId"];
  ratioView: SimulationV0ReviewState["ratioView"];
  cards: readonly SimulationV0SummaryCard[];
  groups: readonly SimulationV0SummaryCardGroup[];
  note: "Operational placeholder summary only.";
};

export function buildSimulationV0SummaryCardsViewModel(input: {
  reviewState: SimulationV0ReviewState;
  runs: readonly InternalDryRunExecutorOutput[];
}): SimulationV0SummaryCardsViewModel {
  const totals = input.runs.reduce(
    (sum, run) => ({
      generated: sum.generated + run.summaryCounts.generatedTaskCount,
      queued: sum.queued + run.summaryCounts.queuedPlaceholderCount,
      delayed: sum.delayed + run.summaryCounts.delayedPlaceholderCount,
      unassigned: sum.unassigned + run.summaryCounts.unassignedPlaceholderCount,
      nurseGroups: sum.nurseGroups + run.nurseRuntimeSnapshots.length
    }),
    { generated: 0, queued: 0, delayed: 0, unassigned: 0, nurseGroups: 0 }
  );
  const pressureBand = totals.delayed + totals.queued === 0
    ? "placeholder light"
    : totals.delayed + totals.queued <= totals.generated * 0.45
      ? "placeholder moderate"
      : "placeholder heavy";
  const cards: SimulationV0SummaryCard[] = [
    card("Generated", totals.generated, "workload"),
    card("Queued", totals.queued, "queue"),
    card("Delayed", totals.delayed, "queue"),
    card("Unassigned", totals.unassigned, "coverage_placeholder"),
    card("Synthetic nurse groups", totals.nurseGroups, "runtime"),
    { label: "Placeholder pressure", value: pressureBand, groupId: "runtime", source: "dry_run_artifact" as const }
  ];
  const groups: SimulationV0SummaryCardGroup[] = [
    group("workload", "Workload", "Generated placeholder volume.", cards),
    group("queue", "Queue", "Queued and delayed placeholder events.", cards),
    group("coverage_placeholder", "Coverage placeholder", "Unassigned placeholder events only.", cards),
    group("runtime", "Runtime grouping", "Synthetic nurse groups and placeholder pressure.", cards)
  ];
  return {
    profileId: input.reviewState.activityProfileId,
    ratioView: input.reviewState.ratioView,
    cards,
    groups,
    note: "Operational placeholder summary only."
  };
}

function card(label: string, value: number, groupId: SimulationV0SummaryCard["groupId"]): SimulationV0SummaryCard {
  return { label, value: String(value), groupId, source: "dry_run_artifact" };
}

function group(
  id: SimulationV0SummaryCardGroup["id"],
  title: string,
  note: string,
  cards: readonly SimulationV0SummaryCard[]
): SimulationV0SummaryCardGroup {
  return {
    id,
    title,
    note,
    cards: cards.filter((cardItem) => cardItem.groupId === id)
  };
}
