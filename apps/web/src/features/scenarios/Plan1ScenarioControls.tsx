import type { Plan1ScenarioControlState, Plan1ScenarioIntensityProfile, Plan1TaskTemplate } from "@nerdeus/shared";

export function Plan1ScenarioControls({
  controlState,
  profiles,
  taskTemplates
}: {
  controlState: Plan1ScenarioControlState;
  profiles: Plan1ScenarioIntensityProfile[];
  taskTemplates: Plan1TaskTemplate[];
}) {
  return (
    <section className="assignment-panel" aria-labelledby="plan-1-scenario-controls-title" data-scenario-stage="scenario-controls">
      <h3 id="plan-1-scenario-controls-title">Scenario Controls</h3>
      <dl className="scenario-metric-grid">
        <div>
          <dt>Profile</dt>
          <dd>
            <select value={controlState.selectedProfileId} disabled aria-label="Scenario profile selector">
              {profiles.map((profile) => (
                <option key={profile.profileId} value={profile.profileId}>{profile.label}</option>
              ))}
            </select>
          </dd>
        </div>
        <div>
          <dt>Seed</dt>
          <dd><input aria-label="Scenario seed" type="number" value={controlState.seed} readOnly /></dd>
        </div>
        <div>
          <dt>Duration</dt>
          <dd><input aria-label="Scenario duration minutes" type="number" value={controlState.durationMinutes} readOnly /></dd>
        </div>
        <div><dt>Validation</dt><dd>{controlState.validationStatus}</dd></div>
      </dl>
      <button type="button">Reset to baseline</button>
      <ul>
        {taskTemplates.map((template) => (
          <li key={template.templateId}>
            <label>
              <input type="checkbox" checked={controlState.selectedTaskTemplateIds.includes(template.templateId)} readOnly />
              {template.label}
            </label>
          </li>
        ))}
      </ul>
      {controlState.validationMessages.length > 0 ? <p>{controlState.validationMessages.join(" ")}</p> : null}
      <p>{controlState.limitations.join(" ")}</p>
      <p>{controlState.nonClaims.join(" ")}</p>
    </section>
  );
}
