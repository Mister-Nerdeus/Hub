import type { AuthoringWarningCode } from "@nerdeus/shared";

export type DoorPathNodeSyncControlsProps = {
  readOnly: boolean;
  generatedNodeCount: number;
  generatedEdgeCount: number;
  pathSyncStatus: "fresh" | "stale_warning" | null;
  warningCodes: readonly AuthoringWarningCode[];
  onGenerate: () => void;
};

export function DoorPathNodeSyncControls({
  readOnly,
  generatedNodeCount,
  generatedEdgeCount,
  pathSyncStatus,
  warningCodes,
  onGenerate
}: DoorPathNodeSyncControlsProps) {
  return (
    <section className="door-path-node-sync-controls" aria-label="Door path-node sync controls">
      <button type="button" disabled={readOnly} onClick={onGenerate}>
        Generate door path nodes
      </button>
      <p role="status">{pathSyncStatus ?? "not generated"}</p>
      <dl>
        <div>
          <dt>Generated nodes</dt>
          <dd>{generatedNodeCount}</dd>
        </div>
        <div>
          <dt>Generated edges</dt>
          <dd>{generatedEdgeCount}</dd>
        </div>
      </dl>
      {warningCodes.length === 0 ? (
        <p>No manual review warnings</p>
      ) : (
        <ul>
          {warningCodes.map((code) => (
            <li key={code}>{code}</li>
          ))}
        </ul>
      )}
    </section>
  );
}
