import type { SimulationV0InternalDryRunViewModel } from "./simulationV0ViewModel";
import type { SimulationV0ReviewState } from "./simulationV0ReviewState";
import { simulationV0Copy } from "./simulationV0Copy";

type Props = {
  viewModel: Pick<SimulationV0InternalDryRunViewModel, "profileOptions" | "reviewState">;
  onChange: (activityProfileId: SimulationV0ReviewState["activityProfileId"]) => void;
};

export function SimulationV0ActivityProfileSelector({ viewModel, onChange }: Props) {
  return (
    <fieldset className="simulation-v0-control-group" aria-labelledby="simulation-v0-profile-selector-title">
      <legend id="simulation-v0-profile-selector-title">Activity profile</legend>
      <div className="simulation-v0-segmented-control">
        {viewModel.profileOptions.map((option) => (
          <button
            aria-pressed={viewModel.reviewState.activityProfileId === option.id}
            key={option.id}
            onClick={() => onChange(option.id)}
            type="button"
          >
            <strong>{option.label}</strong>
            <span>{option.occupancyPercent}% occupancy</span>
          </button>
        ))}
      </div>
      <p>
        {
          viewModel.profileOptions.find((option) => option.id === viewModel.reviewState.activityProfileId)
            ?.syntheticWorkloadNote
        }
      </p>
      <p>{simulationV0Copy.profileExplanation}</p>
    </fieldset>
  );
}
