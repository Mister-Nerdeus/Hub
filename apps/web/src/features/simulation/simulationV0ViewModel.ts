import {
  buildCanonicalCapacityCountReport,
  buildScenarioCapacityIntegration,
  generateDryRunArtifactBundle,
  selectOccupiedBedPositionsForActivityProfile,
  executeInternalDryRun,
  type DryRunArtifactBundle,
  type InternalDryRunExecutorOutput,
  type RatioPresetContract
} from "@nerdeus/shared";
import type { SimulationV0RouteViewModel } from "./simulationV0RouteContract";
import {
  simulationV0DefaultReviewState,
  type SimulationV0ReviewState
} from "./simulationV0ReviewState";
import {
  buildNeutralWorkloadSeedForActivityProfile,
  getSimulationV0ActivityProfile,
  simulationV0ActivityProfileMetadata
} from "./simulationV0ProfileState";
import {
  buildRatioRuntimeSeedForReviewState,
  ratioPresetsForView,
  simulationV0RatioOptions
} from "./simulationV0RatioState";
import {
  buildSimulationV0TimelineViewModel,
  type SimulationV0TimelineViewModel
} from "./simulationV0TimelineViewModel";
import {
  buildSimulationV0SummaryCardsViewModel,
  type SimulationV0SummaryCardsViewModel
} from "./simulationV0SummaryCardsViewModel";
import {
  buildSimulationV0OccupiedBedProofViewModel,
  type SimulationV0OccupiedBedProofViewModel
} from "./simulationV0OccupiedBedProofViewModel";
import {
  buildSimulationV0ArtifactProofViewModel,
  type SimulationV0ArtifactProofViewModel
} from "./simulationV0ArtifactProofViewModel";
import {
  buildSimulationV0ArtifactExportViewModel,
  type SimulationV0ArtifactExportViewModel
} from "./simulationV0ArtifactExportViewModel";
import { simulationV0Copy } from "./simulationV0Copy";

export type SimulationV0DryRunReview = {
  ratioPreset: RatioPresetContract;
  run: InternalDryRunExecutorOutput;
  bundle: DryRunArtifactBundle;
  repeatedBundle: DryRunArtifactBundle;
};

export type SimulationV0InternalDryRunViewModel = SimulationV0RouteViewModel & {
  statusLabel: string;
  profileOptions: typeof simulationV0ActivityProfileMetadata;
  ratioOptions: typeof simulationV0RatioOptions;
  dryRunReviews: readonly SimulationV0DryRunReview[];
  timeline: SimulationV0TimelineViewModel;
  summaryCards: SimulationV0SummaryCardsViewModel;
  occupiedBedProof: SimulationV0OccupiedBedProofViewModel;
  artifactProof: SimulationV0ArtifactProofViewModel;
  artifactExport: SimulationV0ArtifactExportViewModel;
};

export function createSimulationV0InternalDryRunViewModel(
  reviewState: SimulationV0ReviewState = simulationV0DefaultReviewState
): SimulationV0InternalDryRunViewModel {
  return createSimulationV0RouteViewModel(reviewState);
}

export function createSimulationV0RouteViewModel(
  reviewState: SimulationV0ReviewState = simulationV0DefaultReviewState
): SimulationV0InternalDryRunViewModel {
  const capacity = buildScenarioCapacityIntegration();
  const activityProfile = getSimulationV0ActivityProfile(reviewState.activityProfileId);
  const neutralWorkloadSeed = buildNeutralWorkloadSeedForActivityProfile(reviewState.activityProfileId);
  const occupancySelection = selectOccupiedBedPositionsForActivityProfile({
    capacity,
    activityProfile,
    neutralWorkloadSeed
  });
  const dryRunReviews = ratioPresetsForView(reviewState.ratioView).map((ratioPreset) =>
    buildDryRunReview({ activityProfile, neutralWorkloadSeed, ratioPreset })
  );
  const primaryReview = dryRunReviews[0];
  if (primaryReview == null) {
    throw new Error("Simulation v0 review state must produce at least one dry-run review");
  }
  const runs = dryRunReviews.map((review) => review.run);
  const bundles = dryRunReviews.map((review) => review.bundle);

  return {
    status: "internal_synthetic_dry_run_only",
    statusLabel: "internal synthetic dry-run only",
    title: "Simulation v0 Review",
    subtitle: simulationV0Copy.syntheticDryRunExplanation,
    reviewState,
    controlsRegion: {
      landmarkId: "simulation-v0-controls",
      profileSelectorVisible: true,
      ratioControlsVisible: true
    },
    outputRegion: {
      landmarkId: "simulation-v0-output",
      timelineVisible: true,
      summaryCardsVisible: true
    },
    proofRegion: {
      landmarkId: "simulation-v0-proof",
      occupiedBedProofVisible: true,
      artifactHashProofVisible: true,
      artifactExportAvailable: true
    },
    limitationCopy: [...simulationV0Copy.limitationCopy],
    forbiddenClaims: {
      optimizer: false,
      assignmentRecommendation: false,
      clinicalSafety: false,
      staffingCompliance: false,
      patientOutcome: false
    },
    profileOptions: simulationV0ActivityProfileMetadata,
    ratioOptions: simulationV0RatioOptions,
    dryRunReviews,
    timeline: buildSimulationV0TimelineViewModel({ reviewState, run: primaryReview.run }),
    summaryCards: buildSimulationV0SummaryCardsViewModel({ reviewState, runs }),
    occupiedBedProof: buildSimulationV0OccupiedBedProofViewModel({
      reviewState,
      activityProfile,
      occupancySelection,
      capacityReport: buildCanonicalCapacityCountReport()
    }),
    artifactProof: buildSimulationV0ArtifactProofViewModel({
      reviewState,
      run: primaryReview.run,
      bundle: primaryReview.bundle,
      repeatedBundle: primaryReview.repeatedBundle
    }),
    artifactExport: buildSimulationV0ArtifactExportViewModel({ reviewState, bundles })
  };
}

function buildDryRunReview(input: {
  activityProfile: ReturnType<typeof getSimulationV0ActivityProfile>;
  neutralWorkloadSeed: ReturnType<typeof buildNeutralWorkloadSeedForActivityProfile>;
  ratioPreset: RatioPresetContract;
}): SimulationV0DryRunReview {
  const ratioRuntimeSeed = buildRatioRuntimeSeedForReviewState({
    activityProfileId: input.activityProfile.profileId,
    ratioPresetId: input.ratioPreset.presetId
  });
  const run = executeInternalDryRun({
    activityProfile: input.activityProfile,
    neutralWorkloadSeed: input.neutralWorkloadSeed,
    ratioPreset: input.ratioPreset,
    ratioRuntimeSeed
  });
  const repeatedRun = executeInternalDryRun({
    activityProfile: input.activityProfile,
    neutralWorkloadSeed: input.neutralWorkloadSeed,
    ratioPreset: input.ratioPreset,
    ratioRuntimeSeed
  });
  return {
    ratioPreset: input.ratioPreset,
    run,
    bundle: generateDryRunArtifactBundle(run),
    repeatedBundle: generateDryRunArtifactBundle(repeatedRun)
  };
}
