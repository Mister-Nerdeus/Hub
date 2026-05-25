import {
  AUTHORING_ROOM_TYPES,
  editableRoomTypeToAuthoringRoomType,
  type AuthoringRoomType,
  type EditableRoomGeometry
} from "@nerdeus/shared";

export type RoomTypeEditorProps = {
  room: EditableRoomGeometry | null;
  readOnly: boolean;
  onChangeRoomType: (roomId: string, roomType: AuthoringRoomType) => void;
};

export function RoomTypeEditor({ room, readOnly, onChangeRoomType }: RoomTypeEditorProps) {
  if (room == null) {
    return null;
  }
  const selected = editableRoomTypeToAuthoringRoomType(room.roomType);
  return (
    <section className="room-type-editor" aria-label="Room type editor">
      <label>
        Room type
        <select
          value={selected}
          disabled={readOnly}
          onChange={(event) => onChangeRoomType(room.id, event.currentTarget.value as AuthoringRoomType)}
        >
          {AUTHORING_ROOM_TYPES.map((roomType) => (
            <option key={roomType} value={roomType}>
              {roomType.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
    </section>
  );
}
