import type { InternalDryRunExecutorOutput } from "@nerdeus/shared";
import type { SimulationV0ReviewState } from "./simulationV0ReviewState";

export type SimulationV0SummaryCard = {
  label: string;
  value: string;
  source: "dry_run_artifact";
};

export type SimulationV0SummaryCardsViewModel = {
  profileId: SimulationV0ReviewState["activityProfileId"];
  ratioView: SimulationV0ReviewState["ratioView"];
  cards: readonly SimulationV0SummaryCard[];
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
  return {
    profileId: input.reviewState.activityProfileId,
    ratioView: input.reviewState.ratioView,
    cards: [
      card("Generated task placeholders", totals.generated),
      card("Queued placeholders", totals.queued),
      card("Delayed placeholders", totals.delayed),
      card("Unassigned placeholders", totals.unassigned),
      card("Synthetic nurse groups", totals.nurseGroups),
      { label: "Placeholder pressure band", value: pressureBand, source: "dry_run_artifact" }
    ]
  };
}

function card(label: string, value: number): SimulationV0SummaryCard {
  return { label, value: String(value), source: "dry_run_artifact" };
}
