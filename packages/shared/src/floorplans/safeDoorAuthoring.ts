import type {
  EditableLayoutGeometryContract
} from "../layout-editor/editableLayoutGeometryContract.js";
import { validateEditableLayoutGeometryContract } from "../layout-editor/editableLayoutGeometryContract.js";
import {
  addDoorToRoom,
  assignDoorToRoom,
  deleteDoor,
  markPathSyncStale,
  moveDoor,
  updateDoorWidth,
  type DoorAuthoringResult
} from "./doorAuthoringContract.js";

export type DoorAuthoringActionType =
  | "addDoor"
  | "moveDoor"
  | "updateDoorWidth"
  | "assignDoor"
  | "deleteDoor"
  | "supportAccessAdd"
  | "supportAccessMove"
  | "supportAccessWidth"
  | "supportAccessDelete";

export type DoorAuthoringWarning = {
  code: string;
  severity: "warning" | "blocking";
  actionType: DoorAuthoringActionType;
  message: string;
  doorId?: string;
  roomId?: string;
  ownerId?: string;
};

export type SafeDoorAuthoringResult =
  | {
      status: "applied";
      layout: EditableLayoutGeometryContract;
      selectedDoorId: string | null;
      pathSyncStatus: "stale_warning";
      pathSyncWarning: string;
      warning?: null;
    }
  | {
      status: "blocked";
      layout: EditableLayoutGeometryContract;
      selectedDoorId: null;
      warning: DoorAuthoringWarning;
    };

type DoorAuthoringInput = {
  layout: EditableLayoutGeometryContract;
  readOnly: boolean;
  doorId?: string;
  roomId?: string;
  ownerId?: string;
};

export function safeAddDoorToRoom(
  input: Parameters<typeof addDoorToRoom>[0]
): SafeDoorAuthoringResult {
  return runDoorAuthoring({
    actionType: "addDoor",
    input,
    apply: () => addDoorToRoom(input)
  });
}

export function safeMoveDoor(
  input: Parameters<typeof moveDoor>[0]
): SafeDoorAuthoringResult {
  return runDoorAuthoring({
    actionType: "moveDoor",
    input,
    apply: () => moveDoor(input)
  });
}

export function safeUpdateDoorWidth(
  input: Parameters<typeof updateDoorWidth>[0]
): SafeDoorAuthoringResult {
  return runDoorAuthoring({
    actionType: "updateDoorWidth",
    input,
    apply: () => updateDoorWidth(input)
  });
}

export function safeAssignDoorToRoom(
  input: Parameters<typeof assignDoorToRoom>[0]
): SafeDoorAuthoringResult {
  return runDoorAuthoring({
    actionType: "assignDoor",
    input,
    apply: () => assignDoorToRoom(input)
  });
}

export function safeDeleteDoor(
  input: Parameters<typeof deleteDoor>[0]
): SafeDoorAuthoringResult {
  try {
    if (input.readOnly) {
      throw new Error("door authoring is blocked for read-only default plans");
    }
    if (!input.layout.doors.some((door) => door.id === input.doorId)) {
      throw new Error("doorId must reference an existing door");
    }
    return toAppliedResult(
      markPathSyncStale({
        layout: validateEditableLayoutGeometryContract({
          ...input.layout,
          doors: input.layout.doors.filter((door) => door.id !== input.doorId)
        }),
        selectedDoorId: null
      })
    );
  } catch (error) {
    return buildBlockedDoorAuthoringResult({
      layout: input.layout,
      actionType: "deleteDoor",
      doorId: input.doorId,
      message: `Door action blocked: ${messageFromError(error)}`
    });
  }
}

export function buildBlockedDoorAuthoringResult(input: {
  layout: EditableLayoutGeometryContract;
  actionType: DoorAuthoringActionType;
  message: string;
  doorId?: string;
  roomId?: string;
  ownerId?: string;
  severity?: DoorAuthoringWarning["severity"];
  code?: string;
}): SafeDoorAuthoringResult {
  return {
    status: "blocked",
    layout: input.layout,
    selectedDoorId: null,
    warning: {
      code: input.code ?? "door_authoring_action_blocked",
      severity: input.severity ?? "blocking",
      actionType: input.actionType,
      message: input.message,
      doorId: input.doorId,
      roomId: input.roomId,
      ownerId: input.ownerId
    }
  };
}

function runDoorAuthoring(input: {
  actionType: DoorAuthoringActionType;
  input: DoorAuthoringInput;
  apply: () => DoorAuthoringResult;
}): SafeDoorAuthoringResult {
  try {
    return toAppliedResult(input.apply());
  } catch (error) {
    return buildBlockedDoorAuthoringResult({
      layout: input.input.layout,
      actionType: input.actionType,
      doorId: input.input.doorId,
      roomId: input.input.roomId,
      ownerId: input.input.ownerId,
      message: `Door action blocked: ${messageFromError(error)}`
    });
  }
}

function toAppliedResult(result: DoorAuthoringResult): SafeDoorAuthoringResult {
  return {
    status: "applied",
    layout: result.layout,
    selectedDoorId: result.selectedDoorId,
    pathSyncStatus: result.pathSyncStatus,
    pathSyncWarning: result.warning,
    warning: null
  };
}

function messageFromError(error: unknown): string {
  if (error instanceof Error && error.message.trim().length > 0) {
    return error.message.trim();
  }
  return "door geometry could not be applied; previous layout was preserved";
}
