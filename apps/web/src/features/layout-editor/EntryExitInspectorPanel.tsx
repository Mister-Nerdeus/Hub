import type {
  EditableHallwayGeometry,
  EditableZoneGeometry,
  EntryExitContract,
  EntryExitDestinationContract
} from "@nerdeus/shared";

type EntryExitInspectorPanelProps = {
  entryExit: EntryExitContract | null;
  hallways: readonly EditableHallwayGeometry[];
  zones: readonly EditableZoneGeometry[];
  readOnly: boolean;
  onDestinationChange: (entryExitId: string, connectsTo: EntryExitDestinationContract) => void;
  onDestinationLabelChange: (entryExitId: string, displayLabel: string) => void;
};

export function EntryExitInspectorPanel({
  entryExit,
  hallways,
  zones,
  readOnly,
  onDestinationChange,
  onDestinationLabelChange
}: EntryExitInspectorPanelProps) {
  if (entryExit == null) {
    return null;
  }
  const options: Array<{
    value: string;
    label: string;
    connectsTo: EntryExitDestinationContract;
  }> = [
    ...hallways.map((hallway) => ({
      value: `hallway:${hallway.id}`,
      label: hallway.label,
      connectsTo: {
        destinationKind: "hallway" as const,
        destinationId: hallway.id,
        displayLabel: hallway.label
      }
    })),
    ...zones
      .filter((zone) => zone.zoneType === "provider_pharmacy")
      .map((zone) => ({
        value: `provider_pharmacy:${zone.id}`,
        label: zone.label,
        connectsTo: {
          destinationKind: "provider_pharmacy" as const,
          destinationId: zone.id,
          displayLabel: zone.label
        }
      })),
    {
      value: "ems:",
      label: "EMS entry",
      connectsTo: { destinationKind: "ems" as const, displayLabel: "EMS entry" }
    },
    {
      value: "external:",
      label: "External exit",
      connectsTo: { destinationKind: "external" as const, displayLabel: "External exit" }
    },
    {
      value: "staff_only:",
      label: "Staff-only area",
      connectsTo: { destinationKind: "staff_only" as const, displayLabel: "Staff-only area" }
    },
    {
      value: "pod:",
      label: "Pod hallway",
      connectsTo: { destinationKind: "pod" as const, displayLabel: "Pod hallway" }
    }
  ];
  const currentValue = `${entryExit.connectsTo.destinationKind}:${entryExit.connectsTo.destinationId ?? ""}`;
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
                <select
                  aria-label="Entry or exit destination kind"
                  value={currentValue}
                  disabled={readOnly}
                  onChange={(event) => {
                    const selected = options.find((option) => option.value === event.currentTarget.value);
                    if (selected != null) {
                      onDestinationChange(entryExit.entryExitId, selected.connectsTo);
                    }
                  }}
                >
                  {options.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
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
