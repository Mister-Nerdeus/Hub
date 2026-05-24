import type {
  LayoutValidationWarningSeverity,
  LayoutValidationWarningSource
} from "./layoutValidationWarningContract";

export function formatLayoutValidationSeverity(
  severity: LayoutValidationWarningSeverity
): string {
  switch (severity) {
    case "info":
      return "Info";
    case "warning":
      return "Warning";
    case "blocking":
      return "Blocking";
  }
}

export function formatLayoutValidationSource(source: LayoutValidationWarningSource): string {
  switch (source) {
    case "bounds":
      return "Bounds";
    case "collision":
      return "Collision";
    case "resize":
      return "Resize";
    case "door_sync":
      return "Door sync";
    case "path_sync":
      return "Path sync";
    case "inspector_edit":
      return "Inspector edit";
    case "audit":
      return "Audit";
    case "delta_preview":
      return "Delta preview";
    case "unknown":
      return "Unknown";
  }
}
