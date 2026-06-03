import type { ManualScenarioContract } from "@nerdeus/shared";

type ManualScenarioListProps = {
  scenarios: readonly ManualScenarioContract[];
  selectedScenarioId: string | null;
  onSelectScenario: (scenarioId: string) => void;
};

export function ManualScenarioList({
  scenarios,
  selectedScenarioId,
  onSelectScenario
}: ManualScenarioListProps) {
  if (scenarios.length === 0) {
    return <p className="manual-scenario-list__empty">No manual scenarios yet.</p>;
  }
  return (
    <ul className="manual-scenario-list">
      {scenarios.map((scenario) => (
        <li key={scenario.scenarioId}>
          <button
            type="button"
            aria-pressed={scenario.scenarioId === selectedScenarioId}
            onClick={() => onSelectScenario(scenario.scenarioId)}
          >
            <strong>{scenario.label}</strong>
            <span>{scenario.mode}</span>
          </button>
        </li>
      ))}
    </ul>
  );
}
