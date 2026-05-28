import {
  buildDryRunReproducibilityStatus,
  buildSimulationV0ComparisonArtifact
} from "@nerdeus/shared";

export type SimulationV0InternalDryRunViewModel = {
  status: string;
  canonicalSeed: string;
  activityProfile: string;
  ratioPresets: string[];
  taskCount: number;
  queueRows: Array<{
    ratioLabel: string;
    queued: number;
    delayed: number;
    unassigned: number;
    nurseGroups: number;
    pressure: string;
  }>;
  comparisonArtifactStatus: string;
  reproducibilityStatus: string;
  limitations: string[];
};

export function createSimulationV0InternalDryRunViewModel(): SimulationV0InternalDryRunViewModel {
  const artifact = buildSimulationV0ComparisonArtifact();
  const reproducibility = buildDryRunReproducibilityStatus();
  return {
    status: "internal synthetic dry-run only",
    canonicalSeed: artifact.sharedWorkload.neutralWorkloadSeedId,
    activityProfile: artifact.sharedWorkload.activityProfileId,
    ratioPresets: artifact.runs.map((run) => run.ratioLabel),
    taskCount: artifact.sharedWorkload.generatedTaskCount,
    queueRows: artifact.runs.map((run) => ({
      ratioLabel: run.ratioLabel,
      queued: run.queuedPlaceholderCount,
      delayed: run.delayedPlaceholderCount,
      unassigned: run.unassignedPlaceholderCount,
      nurseGroups: run.syntheticNurseRuntimeGroupCount,
      pressure: run.placeholderPressureBand.replace("placeholder_", "")
    })),
    comparisonArtifactStatus: artifact.artifactId,
    reproducibilityStatus: reproducibility.label,
    limitations: [
      "Internal synthetic dry-run only.",
      "No optimizer.",
      "No assignment recommendation.",
      "No clinical safety score.",
      "No staffing compliance certification.",
      "No patient outcome prediction."
    ]
  };
}
