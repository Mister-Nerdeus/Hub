export const EXPECTED_EDITOR_CAPABILITIES = {
  saveFloorplan: true,
  saveAsNewVersion: true,
  exportJsonBackup: true,
  activeRecordIdentity: true,
  namedSaveStatus: true,
  runtimeBuildInfo: true
} as const;

export type RuntimeCapabilityCheckResult = {
  matched: boolean;
  missing: string[];
};

export function checkRuntimeEditorCapabilities(root?: ParentNode): RuntimeCapabilityCheckResult {
  const target = root ?? (typeof document === "undefined" ? null : document);
  if (target == null) {
    return { matched: false, missing: ["document runtime"] };
  }
  const missing: string[] = [];
  if (EXPECTED_EDITOR_CAPABILITIES.runtimeBuildInfo && target.querySelector("[data-runtime-build-info='true']") == null) {
    missing.push("runtime build marker");
  }
  const editorLoaded = target.querySelector("[data-editor-command-bar]") != null ||
    target.querySelector("[data-editor-save-status-panel='true']") != null;
  if (!editorLoaded) {
    return {
      matched: missing.length === 0,
      missing
    };
  }
  if (EXPECTED_EDITOR_CAPABILITIES.saveFloorplan && target.querySelector("[data-editor-control='save-working-copy']") == null) {
    missing.push("Save Floorplan control");
  }
  if (EXPECTED_EDITOR_CAPABILITIES.saveAsNewVersion && target.querySelector("[data-editor-control='save-as-new-version']") == null) {
    missing.push("Save as New Version control");
  }
  if (EXPECTED_EDITOR_CAPABILITIES.exportJsonBackup && target.querySelector("[data-editor-control='export-json-backup']") == null) {
    missing.push("Export JSON Backup control");
  }
  if (EXPECTED_EDITOR_CAPABILITIES.activeRecordIdentity && target.querySelector("[data-editor-save-status-panel='true'] [data-active-record-id]") == null) {
    missing.push("active record identity");
  }
  if (EXPECTED_EDITOR_CAPABILITIES.namedSaveStatus && target.querySelector("[data-editor-save-status-panel='true'] [data-named-save-status]") == null) {
    missing.push("named save status");
  }
  return {
    matched: missing.length === 0,
    missing
  };
}
