import {
  createDoorRecoverySnapshot,
  DOOR_RECOVERY_SNAPSHOT_LIMIT_PER_RECORD,
  loadDoorRecoverySnapshots,
  loadLatestDoorRecoverySnapshot,
  saveDoorRecoverySnapshot
} from "../layoutDoorRecoverySnapshots";
import { layoutEditorReducer } from "../layoutEditorReducer";
import { createLayoutEditorState } from "../layoutEditorState";
import { layoutEditorProofFixture } from "../../../fixtures/layout-editor/layoutEditorProofFixture";

const storage = memoryStorage();
const baseTime = Date.parse("2026-05-30T12:00:00.000Z");
for (let index = 0; index < DOOR_RECOVERY_SNAPSHOT_LIMIT_PER_RECORD + 2; index += 1) {
  saveDoorRecoverySnapshot(
    storage,
    createDoorRecoverySnapshot({
      recordId: "record-01",
      actionType: index === 0 ? "addDoor" : "moveDoor",
      doorId: `door-${index}`,
      roomId: "room-01",
      editableLayout: layoutEditorProofFixture,
      selectedObjectId: "door-01",
      selectedObjectType: "door",
      now: new Date(baseTime + index * 1000)
    })
  );
}

const snapshots = loadDoorRecoverySnapshots(storage, "record-01");
if (snapshots.length !== DOOR_RECOVERY_SNAPSHOT_LIMIT_PER_RECORD) {
  throw new Error("door recovery snapshots must retain the last 10 snapshots per record");
}
const latest = loadLatestDoorRecoverySnapshot(storage, "record-01");
if (latest?.doorId !== `door-${DOOR_RECOVERY_SNAPSHOT_LIMIT_PER_RECORD + 1}`) {
  throw new Error("latest door recovery snapshot should be loaded by record id");
}
if (latest.selectedObjectId !== "door-01" || latest.selectedObjectType !== "door") {
  throw new Error("door recovery snapshot must include selected object context");
}

saveDoorRecoverySnapshot(
  storage,
  createDoorRecoverySnapshot({
    recordId: "record-02",
    actionType: "deleteDoor",
    doorId: "door-other",
    editableLayout: layoutEditorProofFixture,
    selectedObjectId: null,
    selectedObjectType: null,
    now: new Date(baseTime + 30_000)
  })
);
if (loadDoorRecoverySnapshots(storage, "record-01").length !== DOOR_RECOVERY_SNAPSHOT_LIMIT_PER_RECORD) {
  throw new Error("door recovery snapshots must be scoped by active record");
}

const editorState = createLayoutEditorState({
  editableLayout: layoutEditorProofFixture,
  selectedObjectType: "door",
  selectedObjectId: "door-01"
});
const before = JSON.stringify(editorState.editableLayout);
const blocked = layoutEditorReducer(editorState, {
  type: "moveDoor",
  doorId: "missing-door",
  wall: "north",
  offsetFeet: 1
});
if (JSON.stringify(blocked.editableLayout) !== before) {
  throw new Error("failed door mutation must preserve the previous valid editable layout");
}
if (!blocked.validationWarnings.some((warning) => warning.code.startsWith("door_authoring_"))) {
  throw new Error("failed door mutation must append a door authoring warning");
}

function memoryStorage(): Storage {
  const values = new Map<string, string>();
  return {
    get length() {
      return values.size;
    },
    clear: () => values.clear(),
    getItem: (key: string) => values.get(key) ?? null,
    key: (index: number) => [...values.keys()][index] ?? null,
    removeItem: (key: string) => {
      values.delete(key);
    },
    setItem: (key: string, value: string) => {
      values.set(key, value);
    }
  };
}
