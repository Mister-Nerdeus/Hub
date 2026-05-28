import { useMemo, useState } from "react";
import { SimulationV0ActivityProfileSelector } from "./SimulationV0ActivityProfileSelector";
import { SimulationV0ArtifactExport } from "./SimulationV0ArtifactExport";
import { SimulationV0ArtifactProofPanel } from "./SimulationV0ArtifactProofPanel";
import { SimulationV0OccupiedBedProofPanel } from "./SimulationV0OccupiedBedProofPanel";
import { SimulationV0RatioControls } from "./SimulationV0RatioControls";
import { SimulationV0SummaryCards } from "./SimulationV0SummaryCards";
import { SimulationV0TimelineTable } from "./SimulationV0TimelineTable";
import {
  createSimulationV0InternalDryRunViewModel,
  type SimulationV0InternalDryRunViewModel
} from "./simulationV0ViewModel";
import {
  simulationV0DefaultReviewState,
  updateSimulationV0ActivityProfile,
  updateSimulationV0RatioView,
  type SimulationV0ReviewState
} from "./simulationV0ReviewState";

type SimulationV0InternalDryRunPanelProps = {
  viewModel?: SimulationV0InternalDryRunViewModel;
};

export function SimulationV0InternalDryRunPanel({ viewModel }: SimulationV0InternalDryRunPanelProps) {
  const [reviewState, setReviewState] = useState<SimulationV0ReviewState>(
    () => viewModel?.reviewState ?? simulationV0DefaultReviewState
  );
  const activeViewModel = useMemo(
    () => createSimulationV0InternalDryRunViewModel(reviewState),
    [reviewState]
  );

  return (
    <section
      className="simulation-v0-panel"
      id="simulation-v0-route"
      aria-labelledby="simulation-v0-title"
    >
      <div className="simulation-v0-panel__header">
        <div>
          <p className="eyebrow">Simulation v0</p>
          <h2 id="simulation-v0-title">{activeViewModel.title}</h2>
          <p>{activeViewModel.subtitle}</p>
        </div>
        <strong>{activeViewModel.statusLabel}</strong>
      </div>

      <section id="simulation-v0-controls" className="simulation-v0-controls" aria-label="Simulation v0 controls">
        <SimulationV0ActivityProfileSelector
          viewModel={activeViewModel}
          onChange={(activityProfileId) =>
            setReviewState((state) => updateSimulationV0ActivityProfile(state, activityProfileId))
          }
        />
        <SimulationV0RatioControls
          viewModel={activeViewModel}
          onChange={(ratioView) =>
            setReviewState((state) => updateSimulationV0RatioView(state, ratioView))
          }
        />
      </section>

      <section id="simulation-v0-output" className="simulation-v0-output" aria-label="Simulation v0 output">
        <SimulationV0SummaryCards viewModel={activeViewModel.summaryCards} />
        <SimulationV0TimelineTable viewModel={activeViewModel.timeline} />
      </section>

      <section id="simulation-v0-proof" className="simulation-v0-proof-region" aria-label="Simulation v0 proof">
        <SimulationV0OccupiedBedProofPanel viewModel={activeViewModel.occupiedBedProof} />
        <SimulationV0ArtifactProofPanel viewModel={activeViewModel.artifactProof} />
        <SimulationV0ArtifactExport viewModel={activeViewModel.artifactExport} />
      </section>

      <section id="simulation-v0-limitations" className="simulation-v0-section" aria-labelledby="simulation-v0-limitations-title">
        <h3 id="simulation-v0-limitations-title">Limitations</h3>
        <ul className="simulation-v0-panel__limitations">
          {activeViewModel.limitationCopy.map((limitation) => (
            <li key={limitation}>{limitation}</li>
          ))}
        </ul>
      </section>
    </section>
  );
}
