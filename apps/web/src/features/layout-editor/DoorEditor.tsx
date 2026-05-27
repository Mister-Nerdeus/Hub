import {
  assignDoorToAdjacentRoom,
  centerDoorOnWall,
  moveToOppositeWall,
  moveToWall,
  nudgeDoor,
  type EditableDoorGeometry,
  type EditableDoorWall,
  type EditableRoomGeometry
} from "@nerdeus/shared";
import { buildDoorEditorViewModel } from "./doorEditorViewModel";
import { validateDoorPlacementWarning } from "./layoutDoorValidation";

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
  const ownerRoom = rooms.find((room) => room.id === door.ownerId) ?? null;
  const viewModel = buildDoorEditorViewModel({ door, rooms });
  const validationWarning = validateDoorPlacementWarning(door, rooms);
  const applyWallMove = (wall: EditableDoorWall) => {
    if (ownerRoom == null) return;
    const next = moveToWall({ door, room: ownerRoom, wall });
    onMoveDoor(door.id, next.wall, next.offsetFeet);
  };
  const applyNudge = (deltaFeet: number) => {
    if (ownerRoom == null) return;
    const next = nudgeDoor({ door, room: ownerRoom, deltaFeet });
    onMoveDoor(door.id, next.wall, next.offsetFeet);
  };
  const applyCenter = () => {
    if (ownerRoom == null) return;
    const next = centerDoorOnWall({ door, room: ownerRoom });
    onMoveDoor(door.id, next.wall, next.offsetFeet);
  };
  const applyOpposite = () => {
    if (ownerRoom == null) return;
    const next = moveToOppositeWall({ door, room: ownerRoom });
    onMoveDoor(door.id, next.wall, next.offsetFeet);
  };
  const applyAdjacent = () => {
    const next = assignDoorToAdjacentRoom({
      layout: {
        schemaVersion: "1.0.0",
        layoutId: "door-editor-adjacent-preview",
        units: "feet",
        rooms,
        doors: [door],
        stations: [],
        hallways: [],
        zones: [],
        limitations: []
      },
      door
    });
    if (next != null) onAssignDoorToRoom(door.id, next.roomId, next.wall, next.offsetFeet);
  };
  return (
    <section className="door-editor" aria-label="Door editor">
      <header>
        <p className="eyebrow">Door</p>
        <h3>{viewModel?.selectedDoorLabel ?? door.label}</h3>
        <p>{viewModel?.ownerRoomLabel}</p>
      </header>
      <div className="door-editor__group" aria-label="Wall">
        <strong>Wall</strong>
        <select
          aria-label="Door wall"
          value={door.wall}
          disabled={readOnly}
          onChange={(event) => applyWallMove(event.currentTarget.value as EditableDoorWall)}
        >
          {WALLS.map((wall) => (
            <option key={wall} value={wall}>
              {wall}
            </option>
          ))}
        </select>
        <button type="button" disabled={readOnly} onClick={applyOpposite}>
          Opposite
        </button>
      </div>
      <div className="door-editor__group" aria-label="Position">
        <strong>Position</strong>
        <button type="button" disabled={readOnly} onClick={() => applyNudge(-1)}>
          Nudge -
        </button>
        <button type="button" disabled={readOnly} onClick={() => applyNudge(1)}>
          Nudge +
        </button>
        <button type="button" disabled={readOnly} onClick={applyCenter}>
          Center
        </button>
      </div>
      <div className="door-editor__group" aria-label="Owner / Adjacent room">
        <strong>Owner / Adjacent room</strong>
        <select
          aria-label="Door room"
          value={door.ownerId}
          disabled={readOnly}
          onChange={(event) => onAssignDoorToRoom(door.id, event.currentTarget.value, door.wall, door.offsetFeet)}
        >
          {rooms.map((room) => (
            <option key={room.id} value={room.id}>
              {room.label}
            </option>
          ))}
        </select>
        <button type="button" disabled={readOnly || viewModel?.canUseAdjacentRoom !== true} onClick={applyAdjacent}>
          Adjacent
        </button>
      </div>
      {validationWarning == null ? null : (
        <p className="door-editor__warning" role="status">{validationWarning}</p>
      )}
      <div className="door-editor__group door-editor__group--danger" aria-label="Danger zone">
        <strong>Danger zone</strong>
        <button type="button" disabled={readOnly} onClick={() => onDeleteDoor(door.id)}>
          Delete door
        </button>
      </div>
    </section>
  );
}
