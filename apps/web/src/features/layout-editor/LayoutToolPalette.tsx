import { AUTHORING_ROOM_TYPES, type AuthoringRoomType } from "@nerdeus/shared";

export type LayoutToolMode = "select" | "add_room" | "add_door";

export type LayoutToolPaletteProps = {
  mode: LayoutToolMode;
  selectedRoomType: AuthoringRoomType;
  readOnly: boolean;
  onCreateWorkingCopy?: () => void;
  onModeChange: (mode: LayoutToolMode) => void;
  onRoomTypeChange: (roomType: AuthoringRoomType) => void;
  onGenerateHallways: () => void;
};

export function LayoutToolPalette({
  mode,
  selectedRoomType,
  readOnly,
  onCreateWorkingCopy,
  onModeChange,
  onRoomTypeChange,
  onGenerateHallways
}: LayoutToolPaletteProps) {
  return (
    <section className="layout-tool-palette" aria-label="Layout tool palette">
      <button type="button" aria-pressed={mode === "select"} onClick={() => onModeChange("select")}>
        Select
      </button>
      <button
        type="button"
        aria-pressed={mode === "add_room"}
        disabled={readOnly}
        onClick={() => onModeChange("add_room")}
      >
        Add room
      </button>
      <button
        type="button"
        aria-pressed={mode === "add_door"}
        disabled={readOnly}
        onClick={() => onModeChange("add_door")}
      >
        Add door
      </button>
      <label>
        New room type
        <select
          value={selectedRoomType}
          disabled={readOnly}
          onChange={(event) => onRoomTypeChange(event.currentTarget.value as AuthoringRoomType)}
        >
          {AUTHORING_ROOM_TYPES.map((roomType) => (
            <option key={roomType} value={roomType}>
              {roomType.replaceAll("_", " ")}
            </option>
          ))}
        </select>
      </label>
      <button type="button" disabled={readOnly} onClick={onGenerateHallways}>
        Auto hallways
      </button>
      {readOnly ? (
        <p className="layout-tool-palette__read-only-note" role="note">
          Canonical fixture is read-only. Create a working copy to edit geometry.
          {onCreateWorkingCopy == null ? null : (
            <button type="button" onClick={onCreateWorkingCopy}>
              Create working copy
            </button>
          )}
        </p>
      ) : null}
    </section>
  );
}
