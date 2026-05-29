export type SimulationV0ArtifactExportStatus =
  | "idle"
  | "download_ready"
  | "download_started"
  | "download_failed"
  | "copy_started"
  | "copy_succeeded"
  | "copy_failed";

export const simulationV0ArtifactExportStatusCopy: Record<SimulationV0ArtifactExportStatus, string> = {
  idle: "Export contains synthetic operational data only.",
  download_ready: "JSON download prepared.",
  download_started: "JSON download started.",
  download_failed: "Download failed. Use Copy summary instead.",
  copy_started: "Copy started.",
  copy_succeeded: "Artifact summary copied.",
  copy_failed: "Copy failed. Use Download JSON instead."
};
