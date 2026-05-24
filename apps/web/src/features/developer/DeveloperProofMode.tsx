import type { ReactNode } from "react";

import type { DeveloperProofModeViewModel } from "./developerProofModeState";

type DeveloperProofModeProps = {
  viewModel: DeveloperProofModeViewModel;
  onToggle: () => void;
  children: ReactNode;
};

export function DeveloperProofMode({ viewModel, onToggle, children }: DeveloperProofModeProps) {
  return (
    <section
      className="developer-proof-mode"
      aria-labelledby="developer-proof-mode-title"
      data-proof-mode-enabled={viewModel.enabled ? "true" : "false"}
    >
      <div className="developer-proof-mode__header">
        <h2 id="developer-proof-mode-title">Developer Proof Mode</h2>
        <button type="button" aria-pressed={viewModel.enabled} onClick={onToggle}>
          {viewModel.toggleLabel}
        </button>
      </div>
      {viewModel.proofPanelsVisible ? (
        <div className="developer-proof-mode__content">{children}</div>
      ) : null}
    </section>
  );
}
