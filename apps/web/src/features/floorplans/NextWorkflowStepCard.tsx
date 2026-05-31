type NextWorkflowStepCardProps = {
  canUseForAssignment: boolean;
  canPrepareForSimulation: boolean;
  onUseForAssignment: () => void;
  onPrepareForSimulation: () => void;
};

export function NextWorkflowStepCard({
  canUseForAssignment,
  canPrepareForSimulation,
  onUseForAssignment,
  onPrepareForSimulation
}: NextWorkflowStepCardProps) {
  return (
    <section className="next-workflow-step-card" aria-labelledby="next-workflow-step-title">
      <div>
        <p className="eyebrow">What do I do next?</p>
        <h3 id="next-workflow-step-title">Build the assignment set</h3>
        <p>Use this floorplan for manual nurse assignments, then send the saved assignment set to scenario setup.</p>
      </div>
      <div className="next-workflow-step-card__actions">
        <button type="button" disabled={!canUseForAssignment} onClick={onUseForAssignment}>
          Start Assignments
        </button>
        <button type="button" disabled={!canPrepareForSimulation} onClick={onPrepareForSimulation}>
          Prepare for Simulation
        </button>
      </div>
    </section>
  );
}
