export type DeveloperProofModeState = {
  enabled: boolean;
};

export type DeveloperProofModeViewModel = {
  enabled: boolean;
  toggleLabel: "Show Developer Proof Mode" | "Hide Developer Proof Mode";
  proofPanelsVisible: boolean;
  proofPanelIds: readonly string[];
};

export const DEVELOPER_PROOF_PANEL_IDS = [
  "simulation-retrieval-proof",
  "manual-assignment-proof",
  "operational-reports-proof",
  "operational-outcome-dashboard-proof",
  "route-preview-proof",
  "scenario-comparison-proof",
  "export-bundle-review-proof",
  "bundle-audit-proof",
  "simulation-timeline-proof",
  "optimizer-proof",
  "plan-builder-defaults",
  "generated-plan-preview",
  "plan-draft-panel",
  "plan-save-load-panel",
  "plan-import-export-panel",
  "plan-renderer"
] as const;

export function createDeveloperProofModeState(
  overrides: Partial<DeveloperProofModeState> = {}
): DeveloperProofModeState {
  return {
    enabled: overrides.enabled ?? false
  };
}

export function setDeveloperProofModeEnabled(
  state: DeveloperProofModeState,
  enabled: boolean
): DeveloperProofModeState {
  return {
    ...state,
    enabled
  };
}

export function toggleDeveloperProofMode(
  state: DeveloperProofModeState
): DeveloperProofModeState {
  return setDeveloperProofModeEnabled(state, !state.enabled);
}

export function createDeveloperProofModeViewModel(
  state: DeveloperProofModeState
): DeveloperProofModeViewModel {
  return {
    enabled: state.enabled,
    toggleLabel: state.enabled ? "Hide Developer Proof Mode" : "Show Developer Proof Mode",
    proofPanelsVisible: state.enabled,
    proofPanelIds: DEVELOPER_PROOF_PANEL_IDS
  };
}
