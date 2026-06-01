import type {
  DoorDestinationContract,
  EditableDoorGeometry,
  EditableHallwayGeometry,
  EditableRoomGeometry,
  EditableSupportAccessPointGeometry,
  EntryExitContract,
  EditableZoneGeometry
} from "@nerdeus/shared";

type DoorDestinationInspectorPanelProps = {
  door: EditableDoorGeometry | EditableSupportAccessPointGeometry | null;
  destination: DoorDestinationContract | null;
  rooms: readonly EditableRoomGeometry[];
  hallways: readonly EditableHallwayGeometry[];
  zones: readonly EditableZoneGeometry[];
  entryExits: readonly EntryExitContract[];
  readOnly: boolean;
  onChange: (destination: DoorDestinationContract) => void;
};

export function DoorDestinationInspectorPanel({
  door,
  destination,
  rooms,
  hallways,
  zones,
  entryExits,
  readOnly,
  onChange
}: DoorDestinationInspectorPanelProps) {
  if (door == null) {
    return null;
  }
  const current = destination ?? {
    doorId: door.id,
    ownerKind: door.ownerKind,
    ownerId: door.ownerId,
    leadsToKind: "unknown" as const,
    leadsToLabel: "Unknown destination",
    travelRole: "unknown" as const
  };
  const options: Array<{
    value: string;
    label: string;
    kind: DoorDestinationContract["leadsToKind"];
    id?: string;
    text: string;
  }> = [
    { value: "unknown:", label: "Unknown destination", kind: "unknown" as const, text: "Unknown destination" },
    ...hallways.map((hallway) => ({
      value: `hallway:${hallway.id}`,
      label: hallway.label,
      kind: "hallway" as const,
      id: hallway.id,
      text: hallway.label
    })),
    ...rooms
      .filter((room) => room.id !== door.ownerId)
      .map((room) => ({
        value: `room:${room.id}`,
        label: `${room.roomNumber} - ${room.label}`,
        kind: "room" as const,
        id: room.id,
        text: `${room.roomNumber} - ${room.label}`
      })),
    ...zones.map((zone) => ({
      value: `zone:${zone.id}`,
      label: zone.label,
      kind: "zone" as const,
      id: zone.id,
      text: zone.label
    })),
    ...entryExits.map((entryExit) => ({
      value: `entry_exit:${entryExit.entryExitId}`,
      label: entryExit.label,
      kind: "entry_exit" as const,
      id: entryExit.entryExitId,
      text: entryExit.label
    })),
    { value: "external:", label: "External exit", kind: "external" as const, text: "External exit" }
  ];
  const currentValue = `${current.leadsToKind}:${current.leadsToId ?? ""}`;

  return (
    <section
      className="layout-inspector-panel__section"
      data-door-destination-inspector="normal"
      data-door-destination-warning={current.leadsToKind === "unknown" ? "true" : "false"}
    >
      <h4>Door destination / access destination</h4>
      <label>
        <span>Leads to</span>
        <select
          value={currentValue}
          disabled={readOnly}
          onChange={(event) => {
            const selected = options.find((option) => option.value === event.currentTarget.value);
            if (selected == null) {
              return;
            }
            onChange({
              doorId: door.id,
              ownerKind: door.ownerKind,
              ownerId: door.ownerId,
              leadsToKind: selected.kind,
              ...(selected.id == null ? {} : { leadsToId: selected.id }),
              leadsToLabel: selected.text,
              travelRole: selected.kind === "unknown" ? "unknown" : "patient_flow"
            });
          }}
        >
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
      </label>
      {current.leadsToKind === "unknown" ? (
        <p className="layout-inspector-panel__field-error" role="status">
          Unknown destination: route connectivity will warn until this door has a destination.
        </p>
      ) : null}
    </section>
  );
}
