import type { FloorplanVersionHistoryItem } from "./floorplanVersionHistory";
import { formatFloorplanSavedTime } from "./floorplanVersionNaming";

type FloorplanVersionHistoryPanelProps = {
  versions: readonly FloorplanVersionHistoryItem[];
  onRestoreVersion: (versionId: string) => void;
  onArchiveVersion: (versionId: string) => void;
};

export function FloorplanVersionHistoryPanel({
  versions,
  onRestoreVersion,
  onArchiveVersion
}: FloorplanVersionHistoryPanelProps) {
  return (
    <section className="floorplan-version-history" aria-labelledby="floorplan-version-history-title">
      <h3 id="floorplan-version-history-title">Saved versions</h3>
      {versions.length === 0 ? (
        <p>No saved versions yet.</p>
      ) : (
        <ul>
          {versions.map((version) => (
            <li key={version.versionId} data-version-id={version.versionId}>
              <strong>{version.versionLabel}</strong>
              <span>{version.displayName}</span>
              <span>{formatFloorplanSavedTime(version.savedAt)}</span>
              <span>{version.status}</span>
              <span>Internal record: {version.versionId}</span>
              <button type="button" disabled={version.isCurrent} onClick={() => onRestoreVersion(version.versionId)}>
                Restore version
              </button>
              <button type="button" disabled={version.status === "archived"} onClick={() => onArchiveVersion(version.versionId)}>
                Archive version
              </button>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
