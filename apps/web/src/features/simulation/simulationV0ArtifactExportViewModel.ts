import type { DryRunArtifactBundle } from "@nerdeus/shared";
import type { SimulationV0ReviewState } from "./simulationV0ReviewState";

export type SimulationV0ArtifactExportBundle = {
  exportType: "simulation_v0_internal_dry_run_review_bundle";
  reviewState: SimulationV0ReviewState;
  bundles: readonly DryRunArtifactBundle[];
  limitationsMarkdown: string;
  boundaryStatus: {
    syntheticDataOnly: true;
    optimizerStatus: "not_started";
    assignmentRecommendationStatus: "not_started";
    clinicalSafetyClaim: false;
    staffingComplianceClaim: false;
    patientOutcomePredictionClaim: false;
  };
};

export type SimulationV0ArtifactExportViewModel = {
  fileName: string;
  summaryText: string;
  previewText: string;
  jsonText: string;
  bundle: SimulationV0ArtifactExportBundle;
};

export function buildSimulationV0ArtifactExportViewModel(input: {
  reviewState: SimulationV0ReviewState;
  bundles: readonly DryRunArtifactBundle[];
}): SimulationV0ArtifactExportViewModel {
  const bundle: SimulationV0ArtifactExportBundle = {
    exportType: "simulation_v0_internal_dry_run_review_bundle",
    reviewState: input.reviewState,
    bundles: input.bundles,
    limitationsMarkdown: input.bundles.map((item) => item.limitationsMarkdown).join("\n\n"),
    boundaryStatus: {
      syntheticDataOnly: true,
      optimizerStatus: "not_started",
      assignmentRecommendationStatus: "not_started",
      clinicalSafetyClaim: false,
      staffingComplianceClaim: false,
      patientOutcomePredictionClaim: false
    }
  };
  const summaryText = [
    `Simulation v0 artifact review bundle`,
    `Profile: ${input.reviewState.activityProfileId}`,
    `Ratio view: ${input.reviewState.ratioView}`,
    `Bundle count: ${input.bundles.length}`,
    `Stable hashes: ${input.bundles.map((item) => item.stableArtifactHash).join(", ")}`
  ].join("\n");
  const hashPrefix = input.bundles.at(0)?.stableArtifactHash.slice(0, 8) ?? "nohash";
  return {
    fileName: `simulation-v0-dry-run-${input.reviewState.activityProfileId}-${input.reviewState.ratioView}-${hashPrefix}.json`,
    summaryText,
    previewText: summaryText,
    jsonText: JSON.stringify(bundle, null, 2),
    bundle
  };
}
