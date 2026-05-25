import { RoomTypeEditor } from "./RoomTypeEditor";
import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";

const element = RoomTypeEditor({
  room: layoutEditorProofFixture.rooms[0] ?? null,
  readOnly: false,
  onChangeRoomType: () => undefined
});

if (element == null || element.type !== "section") {
  throw new Error("RoomTypeEditor must render for selected rooms");
}

const empty = RoomTypeEditor({
  room: null,
  readOnly: false,
  onChangeRoomType: () => undefined
});
if (empty !== null) {
  throw new Error("RoomTypeEditor must not render without a selected room");
}
