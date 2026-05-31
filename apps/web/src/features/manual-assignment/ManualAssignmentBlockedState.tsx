type ManualAssignmentBlockedStateProps = {
  reason: "active_floorplan_required" | "assignment_set_required";
  activeLayoutId: string | null;
  activeFloorplanVersionId: string | null;
};

export function ManualAssignmentBlockedState({
  reason,
  activeLayoutId,
  activeFloorplanVersionId
}: ManualAssignmentBlockedStateProps) {
  return (
    <section
      className="manual-assignment-workspace manual-assignment-blocked-state"
      aria-labelledby="manual-assignment-workspace-title"
      data-manual-assignment-source={reason}
      data-normal-manual-assignment-no-synthetic-fallback="true"
      data-synthetic-fixture-dev-only="true"
      data-active-layout-id={activeLayoutId ?? ""}
      data-active-floorplan-version-id={activeFloorplanVersionId ?? ""}
    >
      <div className="manual-assignment-workspace__header">
        <div>
          <p className="eyebrow">Durable assignment set</p>
          <h2 id="manual-assignment-workspace-title">Manual Assignment</h2>
        </div>
      </div>
      <p className="manual-assignment-workspace__note">
        {reason === "active_floorplan_required"
          ? "Select one active floorplan before assigning rooms."
          : "Create or load a durable assignment set for this active floorplan version."}
      </p>
    </section>
  );
}
