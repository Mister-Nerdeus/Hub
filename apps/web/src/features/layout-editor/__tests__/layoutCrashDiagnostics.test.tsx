import { LayoutEditorRecoveryScreen } from "../LayoutEditorRecoveryScreen";
import {
  buildLayoutCrashDiagnostics,
  serializeLayoutCrashDiagnostics
} from "../layoutCrashDiagnostics";
import type { LayoutEditorFloorplanInput } from "../layoutEditorState";

const diagnostics = buildLayoutCrashDiagnostics({
  errorMessage: "Forced layout editor crash for local recovery verification.",
  activeFloorplan: {
    recordId: "record-01",
    planId: "plan-01",
    name: "Operational Layout",
    sourceKind: "saved-json",
    readOnly: false,
    parentDefaultPlanId: null,
    plan: {}
  } as unknown as LayoutEditorFloorplanInput,
  selectedObjectId: "door-01",
  selectedObjectType: "door",
  lastDoorAction: "moveDoor",
  draftAvailable: true,
  lastValidSnapshotAvailable: true
});

if (diagnostics.activeRecordId !== "record-01" || diagnostics.activePlanId !== "plan-01") {
  throw new Error("diagnostics must expose active record and plan IDs");
}
if (diagnostics.selectedObjectId !== "door-01" || diagnostics.lastDoorAction !== "moveDoor") {
  throw new Error("diagnostics must expose selected object and last door action");
}
const serialized = serializeLayoutCrashDiagnostics(diagnostics);
const restrictedRecordAcronym = ["m", "r", "n"].join("");
for (const forbidden of ["patient", "medical record", "chart", restrictedRecordAcronym]) {
  if (serialized.toLowerCase().includes(forbidden)) {
    throw new Error("diagnostics serialization must not include private payload terms");
  }
}

const calls: string[] = [];
const element = LayoutEditorRecoveryScreen({
  activeFloorplan: null,
  diagnostics,
  draftAvailable: true,
  lastValidSnapshotAvailable: true,
  onRestoreLatestDraft: () => calls.push("restore-draft"),
  onRestoreLastValidSnapshot: () => calls.push("restore-snapshot"),
  onCopyDiagnostics: () => calls.push("copy"),
  onExportDraftJson: () => calls.push("export-draft"),
  onExportCrashDiagnostics: () => calls.push("export-diagnostics"),
  onExportLastValidSnapshot: () => calls.push("export-snapshot"),
  onDiscardDraft: () => calls.push("discard"),
  onReturnToLibrary: () => calls.push("library")
});

if (element.type !== "section") {
  throw new Error("recovery screen should render diagnostics section");
}
const actionButtons = element.props.children[4].props.children;
actionButtons[0].props.onClick();
actionButtons[1].props.onClick();
actionButtons[4].props.onClick();
actionButtons[5].props.onClick();
if (calls.join(",") !== "copy,export-diagnostics,restore-snapshot,export-snapshot") {
  throw new Error("recovery screen diagnostics actions must be wired");
}
