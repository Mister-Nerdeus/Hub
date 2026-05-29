export type SimulationV0ArtifactExportStatus =
  | "idle"
  | "download_ready"
  | "copy_succeeded"
  | "copy_failed";

export const simulationV0ArtifactExportStatusCopy: Record<SimulationV0ArtifactExportStatus, string> = {
  idle: "Synthetic review bundle only.",
  download_ready: "Download prepared for synthetic review bundle.",
  copy_succeeded: "Copy succeeded.",
  copy_failed: "Copy failed."
};
