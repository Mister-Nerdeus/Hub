import type {
  EditableLayoutGeometryContract
} from "@nerdeus/shared";
import type { LayoutEditorSelectableObjectType } from "./layoutEditorState";

export type DoorRecoverySnapshot = {
  snapshotId: string;
  recordId: string;
  createdAt: string;
  actionType: string;
  doorId?: string;
  roomId?: string;
  editableLayout: EditableLayoutGeometryContract;
  selectedObjectId: string | null;
  selectedObjectType: LayoutEditorSelectableObjectType | null;
};

export type DoorRecoverySnapshotStorage = Pick<Storage, "getItem" | "setItem">;

export const DOOR_RECOVERY_SNAPSHOT_STORAGE_KEY = "nerdeus.layoutEditor.doorRecoverySnapshots.v1";
export const DOOR_RECOVERY_SNAPSHOT_LIMIT_PER_RECORD = 10;

export function createDoorRecoverySnapshot(input: {
  recordId: string;
  actionType: string;
  doorId?: string;
  roomId?: string;
  editableLayout: EditableLayoutGeometryContract;
  selectedObjectId: string | null;
  selectedObjectType: LayoutEditorSelectableObjectType | null;
  now?: Date;
}): DoorRecoverySnapshot {
  const createdAt = (input.now ?? new Date()).toISOString();
  return {
    snapshotId: `${input.recordId}-${input.actionType}-${createdAt}`,
    recordId: input.recordId,
    createdAt,
    actionType: input.actionType,
    doorId: input.doorId,
    roomId: input.roomId,
    editableLayout: cloneEditableLayout(input.editableLayout),
    selectedObjectId: input.selectedObjectId,
    selectedObjectType: input.selectedObjectType
  };
}

export function saveDoorRecoverySnapshot(
  storage: DoorRecoverySnapshotStorage,
  snapshot: DoorRecoverySnapshot
): DoorRecoverySnapshot[] {
  const snapshots = readAllDoorRecoverySnapshots(storage);
  const nextSnapshots = [
    ...snapshots.filter((candidate) => candidate.recordId !== snapshot.recordId),
    ...[...snapshots.filter((candidate) => candidate.recordId === snapshot.recordId), snapshot]
      .sort(compareSnapshotCreatedAt)
      .slice(-DOOR_RECOVERY_SNAPSHOT_LIMIT_PER_RECORD)
  ].sort(compareSnapshotCreatedAt);
  storage.setItem(DOOR_RECOVERY_SNAPSHOT_STORAGE_KEY, JSON.stringify(nextSnapshots));
  return nextSnapshots.filter((candidate) => candidate.recordId === snapshot.recordId);
}

export function loadDoorRecoverySnapshots(
  storage: DoorRecoverySnapshotStorage,
  recordId: string
): DoorRecoverySnapshot[] {
  return readAllDoorRecoverySnapshots(storage)
    .filter((snapshot) => snapshot.recordId === recordId)
    .sort(compareSnapshotCreatedAt);
}

export function loadLatestDoorRecoverySnapshot(
  storage: DoorRecoverySnapshotStorage,
  recordId: string
): DoorRecoverySnapshot | null {
  const snapshots = loadDoorRecoverySnapshots(storage, recordId);
  return snapshots.at(-1) ?? null;
}

function readAllDoorRecoverySnapshots(storage: DoorRecoverySnapshotStorage): DoorRecoverySnapshot[] {
  const raw = storage.getItem(DOOR_RECOVERY_SNAPSHOT_STORAGE_KEY);
  if (raw == null || raw.trim().length === 0) {
    return [];
  }
  try {
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }
    return parsed.flatMap((candidate) => normalizeSnapshot(candidate));
  } catch {
    return [];
  }
}

function normalizeSnapshot(value: unknown): DoorRecoverySnapshot[] {
  if (value == null || typeof value !== "object" || Array.isArray(value)) {
    return [];
  }
  const record = value as Partial<DoorRecoverySnapshot>;
  if (
    typeof record.snapshotId !== "string" ||
    typeof record.recordId !== "string" ||
    typeof record.createdAt !== "string" ||
    typeof record.actionType !== "string" ||
    record.editableLayout == null ||
    typeof record.editableLayout !== "object"
  ) {
    return [];
  }
  return [{
    snapshotId: record.snapshotId,
    recordId: record.recordId,
    createdAt: record.createdAt,
    actionType: record.actionType,
    doorId: typeof record.doorId === "string" ? record.doorId : undefined,
    roomId: typeof record.roomId === "string" ? record.roomId : undefined,
    editableLayout: cloneEditableLayout(record.editableLayout as EditableLayoutGeometryContract),
    selectedObjectId: typeof record.selectedObjectId === "string" ? record.selectedObjectId : null,
    selectedObjectType: typeof record.selectedObjectType === "string"
      ? record.selectedObjectType as LayoutEditorSelectableObjectType
      : null
  }];
}

function cloneEditableLayout(layout: EditableLayoutGeometryContract): EditableLayoutGeometryContract {
  return JSON.parse(JSON.stringify(layout)) as EditableLayoutGeometryContract;
}

function compareSnapshotCreatedAt(left: DoorRecoverySnapshot, right: DoorRecoverySnapshot): number {
  return left.createdAt.localeCompare(right.createdAt) || left.snapshotId.localeCompare(right.snapshotId);
}
