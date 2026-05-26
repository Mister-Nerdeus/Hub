import type { ManualAssignmentRoomCard } from "./manualAssignmentWorkspaceViewModel";

type ManualAssignmentRoomListProps = {
  rooms: ManualAssignmentRoomCard[];
  onRoomClick: (roomId: string) => void;
  onUnassignRoom: (roomId: string) => void;
};

export function ManualAssignmentRoomList({
  rooms,
  onRoomClick,
  onUnassignRoom
}: ManualAssignmentRoomListProps) {
  return (
    <div className="manual-room-list" data-assignment-stage="assignment-ui">
      {rooms.map((room) => (
        <article
          className={[
            "manual-room-card",
            room.occupied ? "manual-room-card--occupied" : "manual-room-card--open",
            room.unassignedOccupied ? "manual-room-card--unassigned" : ""
          ].join(" ")}
          key={room.roomId}
          style={room.assignedColor ? { borderColor: room.assignedColor } : undefined}
        >
          <button
            className="manual-room-card__assign-button"
            type="button"
            onClick={() => onRoomClick(room.roomId)}
            aria-label={room.controlLabel}
          >
            <span className="manual-room-card__title">{room.label}</span>
            <span className="manual-room-card__meta">Acuity {room.acuity}</span>
            <span className="manual-room-card__status">{room.occupied ? "Occupied" : "Open"}</span>
            <span className="manual-room-card__nurse">
              {room.assignedColor ? (
                <span className="manual-room-card__swatch" style={{ background: room.assignedColor }} />
              ) : null}
              {room.assignedNurseLabel}
            </span>
          </button>
          {room.assignedNurseId ? (
            <button className="manual-room-card__unassign-button" type="button" onClick={() => onUnassignRoom(room.roomId)}>
              Unassign
            </button>
          ) : null}
        </article>
      ))}
    </div>
  );
}
