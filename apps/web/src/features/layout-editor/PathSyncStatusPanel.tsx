import type { PathSyncAuditResult } from "@nerdeus/shared";

export type PathSyncStatusPanelProps = {
  audit: PathSyncAuditResult | null;
};

export function PathSyncStatusPanel({ audit }: PathSyncStatusPanelProps) {
  if (audit == null) {
    return (
      <section className="path-sync-status-panel" aria-label="Path sync status">
        <h3>Path sync</h3>
        <p role="status">No editable floorplan loaded</p>
      </section>
    );
  }

  return (
    <section
      className="path-sync-status-panel"
      aria-label="Path sync status"
      data-path-sync-status={audit.pathSyncStatus}
      data-simulation-ready={audit.simulationReady ? "true" : "false"}
    >
      <h3>Path sync</h3>
      <p role="status">{audit.pathSyncStatus}</p>
      <p>{audit.simulationReady ? "Simulation-ready export eligible" : "Simulation-ready export blocked"}</p>
      <dl>
        <div>
          <dt>Rooms</dt>
          <dd>{audit.roomCount}</dd>
        </div>
        <div>
          <dt>Door access</dt>
          <dd>{audit.roomsWithDoorCount}</dd>
        </div>
        <div>
          <dt>Path nodes</dt>
          <dd>{audit.roomsWithPathNodeCount}</dd>
        </div>
      </dl>
      <IssueList label="Blocking" values={audit.blockingIssues} />
      <IssueList label="Warnings" values={audit.warningIssues} />
      <IssueList label="Missing doors" values={audit.roomsMissingDoor} />
      <IssueList label="Missing path nodes" values={audit.roomsMissingPathNode} />
      <IssueList label="Unreachable rooms" values={audit.unreachableRoomIds} />
      <IssueList label="Limitations" values={audit.limitations} />
    </section>
  );
}

function IssueList({ label, values }: { label: string; values: readonly string[] }) {
  return (
    <div>
      <h4>{label}</h4>
      {values.length === 0 ? (
        <p>None</p>
      ) : (
        <ul>
          {values.map((value) => (
            <li key={value}>{value}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
