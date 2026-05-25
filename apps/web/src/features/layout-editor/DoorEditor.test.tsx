import { DoorEditor } from "./DoorEditor";
import { layoutEditorProofFixture } from "../../fixtures/layout-editor/layoutEditorProofFixture";

const element = DoorEditor({
  door: layoutEditorProofFixture.doors[0] ?? null,
  rooms: layoutEditorProofFixture.rooms,
  readOnly: false,
  onMoveDoor: () => undefined,
  onDeleteDoor: () => undefined,
  onAssignDoorToRoom: () => undefined
});

if (element == null || element.type !== "section") {
  throw new Error("DoorEditor must render for selected doors");
}
