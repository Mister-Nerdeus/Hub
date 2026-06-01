import type { EntryExitContract } from "@nerdeus/shared";

type EntryExitInspectorPanelProps = {
  entryExit: EntryExitContract | null;
  readOnly: boolean;
  onDestinationLabelChange: (entryExitId: string, displayLabel: string) => void;
};

export function EntryExitInspectorPanel({
  entryExit,
  readOnly,
  onDestinationLabelChange
}: EntryExitInspectorPanelProps) {
  if (entryExit == null) {
    return null;
  }
  return (
    <aside
      className="layout-inspector-panel"
      aria-label="Entry and exit inspector"
      data-entry-exit-inspector="normal"
    >
      <header className="layout-inspector-panel__header">
        <p className="eyebrow">Inspector</p>
        <h3>{entryExit.label}</h3>
      </header>
      <div className="layout-inspector-panel__sections">
        <section className="layout-inspector-panel__section">
          <h4>Entry / exit</h4>
          <dl>
            <div>
              <dt>Type</dt>
              <dd>{entryExit.kind.replaceAll("_", " ")}</dd>
            </div>
            <div>
              <dt>Destination</dt>
              <dd>
                <input
                  aria-label="Entry or exit destination"
                  value={entryExit.connectsTo.displayLabel}
                  disabled={readOnly}
                  onChange={(event) =>
                    onDestinationLabelChange(entryExit.entryExitId, event.currentTarget.value)
                  }
                />
              </dd>
            </div>
          </dl>
        </section>
      </div>
    </aside>
  );
}
