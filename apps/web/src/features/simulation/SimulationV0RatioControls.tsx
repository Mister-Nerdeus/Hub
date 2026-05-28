import type { SimulationV0InternalDryRunViewModel } from "./simulationV0ViewModel";
import type { SimulationV0RatioView } from "./simulationV0ReviewState";

type Props = {
  viewModel: Pick<SimulationV0InternalDryRunViewModel, "ratioOptions" | "reviewState">;
  onChange: (ratioView: SimulationV0RatioView) => void;
};

export function SimulationV0RatioControls({ viewModel, onChange }: Props) {
  return (
    <fieldset className="simulation-v0-control-group" aria-labelledby="simulation-v0-ratio-controls-title">
      <legend id="simulation-v0-ratio-controls-title">Ratio planning assumption</legend>
      <div className="simulation-v0-segmented-control">
        {viewModel.ratioOptions.map((option) => (
          <button
            aria-pressed={viewModel.reviewState.ratioView === option.id}
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            <strong>{option.label}</strong>
            <span>{option.note}</span>
          </button>
        ))}
      </div>
    </fieldset>
  );
}
