import type { EditableDoorGeometry, EditableDoorWall, EditableRoomGeometry } from "@nerdeus/shared";

export type DoorEditorProps = {
  door: EditableDoorGeometry | null;
  rooms: EditableRoomGeometry[];
  readOnly: boolean;
  onMoveDoor: (doorId: string, wall: EditableDoorWall, offsetFeet: number) => void;
  onDeleteDoor: (doorId: string) => void;
  onAssignDoorToRoom: (
    doorId: string,
    roomId: string,
    wall: EditableDoorWall,
    offsetFeet: number
  ) => void;
};

const WALLS: EditableDoorWall[] = ["north", "south", "east", "west"];

export function DoorEditor({
  door,
  rooms,
  readOnly,
  onMoveDoor,
  onDeleteDoor,
  onAssignDoorToRoom
}: DoorEditorProps) {
  if (door == null) {
    return null;
  }
  return (
    <section className="door-editor" aria-label="Door editor">
      <label>
        Door wall
        <select
          value={door.wall}
          disabled={readOnly}
          onChange={(event) => onMoveDoor(door.id, event.currentTarget.value as EditableDoorWall, door.offsetFeet)}
        >
          {WALLS.map((wall) => (
            <option key={wall} value={wall}>
              {wall}
            </option>
          ))}
        </select>
      </label>
      <label>
        Door room
        <select
          value={door.ownerId}
          disabled={readOnly}
          onChange={(event) => onAssignDoorToRoom(door.id, event.currentTarget.value, door.wall, 0)}
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.label}
            </option>
          ))}
        </select>
      </label>
      <button type="button" disabled={readOnly} onClick={() => onDeleteDoor(door.id)}>
        Delete door
      </button>
    </section>
  );
}
