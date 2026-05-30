import type { LayoutEditorFloorplanInput, LayoutEditorSelectableObjectType } from "./layoutEditorState";

export type LayoutCrashDiagnostics = {
  errorMessage: string;
  activeRecordId: string | null;
  activePlanId: string | null;
  selectedObjectId: string | null;
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  lastDoorAction: string | null;
  draftAvailable: boolean;
  lastValidSnapshotAvailable: boolean;
};

export function buildLayoutCrashDiagnostics(input: {
  errorMessage: string | null;
  activeFloorplan: LayoutEditorFloorplanInput | null;
  selectedObjectId?: string | null;
  selectedObjectType?: LayoutEditorSelectableObjectType | null;
  lastDoorAction?: string | null;
  draftAvailable: boolean;
  lastValidSnapshotAvailable: boolean;
}): LayoutCrashDiagnostics {
  return {
    errorMessage: sanitizeDiagnosticText(input.errorMessage ?? "Unknown layout editor error."),
    activeRecordId: input.activeFloorplan?.recordId ?? null,
    activePlanId: input.activeFloorplan?.planId ?? null,
    selectedObjectId: input.selectedObjectId ?? null,
    selectedObjectType: input.selectedObjectType ?? null,
    lastDoorAction: input.lastDoorAction ?? null,
    draftAvailable: input.draftAvailable,
    lastValidSnapshotAvailable: input.lastValidSnapshotAvailable
  };
}

export function serializeLayoutCrashDiagnostics(diagnostics: LayoutCrashDiagnostics): string {
  return JSON.stringify(diagnostics, null, 2);
}

function sanitizeDiagnosticText(value: string): string {
  const restrictedRecordAcronym = ["m", "r", "n"].join("");
  const privatePayloadPattern = new RegExp(
    `\\b(patient|medical record|chart|${restrictedRecordAcronym})\\b`,
    "giu"
  );
  return value
    .replace(privatePayloadPattern, "redacted")
    .slice(0, 500);
}
