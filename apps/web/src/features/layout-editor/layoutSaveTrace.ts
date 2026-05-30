import type {
  AuthoringDraftContract,
  EditableLayoutGeometryContract,
  PlanContract,
  SavedPlanRecordContract
} from "@nerdeus/shared";

export type RoomDoorProbe = {
  roomId: string;
  roomX: number;
  roomY: number;
  roomWidth: number;
  roomHeight: number;
  doorId: string | null;
  doorRoomId: string | null;
  doorX?: number;
  doorY?: number;
  doorWall?: string;
  doorOffsetFeet?: number;
  doorWidthFeet?: number;
  doorCount: number;
};

export type LayoutSaveTrace = {
  traceId: string;
  buildCommit: string;
  recordId: string;
  planId: string;
  beforeEdit?: RoomDoorProbe;
  afterVisibleEdit?: RoomDoorProbe;
  editableLayoutBeforeSave?: RoomDoorProbe;
  authoringDraftBeforeSave?: RoomDoorProbe;
  afterEditEditableLayout?: RoomDoorProbe;
  draftBeforeSave?: RoomDoorProbe;
  saveHandlerInput?: RoomDoorProbe;
  savedRecordPayload?: RoomDoorProbe;
  savedFloorplanStorePayload?: RoomDoorProbe;
  localStoragePayload?: RoomDoorProbe;
  persistedLocalStoragePayload?: RoomDoorProbe;
  reopenedPlan?: RoomDoorProbe;
  reopenedEditableLayout?: RoomDoorProbe;
  exportedJsonAfterReload?: RoomDoorProbe;
  failureStage: string | null;
};

type LayoutSaveTraceStage = Exclude<keyof LayoutSaveTrace, "traceId" | "recordId" | "planId">;

declare global {
  interface Window {
    __nerdeusLayoutSaveTraceEnabled?: boolean;
    __nerdeusLayoutSaveTrace?: LayoutSaveTrace;
  }
}

export function recordEditableLayoutTraceStage(
  stage: LayoutSaveTraceStage,
  options: {
    recordId: string;
    planId: string;
    editableLayout: EditableLayoutGeometryContract;
    roomId?: string;
    doorId?: string;
  }
): void {
  recordLayoutSaveTraceStage(stage, {
    recordId: options.recordId,
    planId: options.planId,
    probe: probeEditableLayout(options.editableLayout, options.roomId, options.doorId)
  });
}

export function recordDraftTraceStage(
  stage: LayoutSaveTraceStage,
  options: {
    recordId: string;
    draft: AuthoringDraftContract;
    roomId?: string;
    doorId?: string;
  }
): void {
  recordLayoutSaveTraceStage(stage, {
    recordId: options.recordId,
    planId: options.draft.planId,
    probe: probeEditableLayout(options.draft.editableLayout, options.roomId, options.doorId)
  });
}

export function recordSavedRecordTraceStage(
  stage: LayoutSaveTraceStage,
  record: SavedPlanRecordContract,
  options: { roomId?: string; doorId?: string } = {}
): void {
  recordLayoutSaveTraceStage(stage, {
    recordId: record.savedPlanId,
    planId: record.planId,
    probe: probeEditableLayout(record.authoringDraft.editableLayout, options.roomId, options.doorId)
  });
}

export function recordPlanTraceStage(
  stage: LayoutSaveTraceStage,
  options: {
    recordId: string;
    plan: PlanContract;
    roomId?: string;
    doorId?: string;
  }
): void {
  recordLayoutSaveTraceStage(stage, {
    recordId: options.recordId,
    planId: options.plan.planId,
    probe: probePlan(options.plan, options.roomId, options.doorId)
  });
}

export function probeEditableLayout(
  editableLayout: EditableLayoutGeometryContract,
  roomId = "room-02",
  doorId = "door-02"
): RoomDoorProbe {
  const room = editableLayout.rooms.find((candidate) => candidate.id === roomId) ?? editableLayout.rooms[0];
  if (room == null) {
    throw new Error("layout save trace requires at least one room");
  }
  const door = editableLayout.doors.find((candidate) => candidate.id === doorId) ??
    editableLayout.doors.find((candidate) => candidate.ownerId === room.id) ??
    editableLayout.doors[0] ??
    null;
  return {
    roomId: room.id,
    roomX: room.xFeet,
    roomY: room.yFeet,
    roomWidth: room.widthFeet,
    roomHeight: room.heightFeet,
    doorId: door?.id ?? null,
    doorRoomId: door?.ownerId ?? null,
    doorWall: door?.wall,
    doorOffsetFeet: door?.offsetFeet,
    doorWidthFeet: door?.widthFeet,
    doorCount: editableLayout.doors.length
  };
}

export function probePlan(
  plan: PlanContract,
  roomId = "room-02",
  doorId = "door-02"
): RoomDoorProbe {
  const room = plan.rooms.find((candidate) => candidate.id === roomId) ?? plan.rooms[0];
  if (room == null) {
    throw new Error("layout save trace requires at least one plan room");
  }
  const door = plan.doors.find((candidate) => candidate.id === doorId) ??
    plan.doors.find((candidate) => candidate.roomId === room.id) ??
    plan.doors[0] ??
    null;
  return {
    roomId: room.id,
    roomX: room.x,
    roomY: room.y,
    roomWidth: room.widthFeet,
    roomHeight: room.lengthFeet,
    doorId: door?.id ?? null,
    doorRoomId: door?.roomId ?? null,
    doorX: door?.x,
    doorY: door?.y,
    doorWidthFeet: door?.widthFeet,
    doorCount: plan.doors.length
  };
}

function recordLayoutSaveTraceStage(
  stage: LayoutSaveTraceStage,
  options: { recordId: string; planId: string; probe: RoomDoorProbe }
): void {
  if (typeof window === "undefined") {
    return;
  }
  if (window.__nerdeusLayoutSaveTraceEnabled !== true && window.__nerdeusLayoutSaveTrace == null) {
    return;
  }
  const trace = window.__nerdeusLayoutSaveTrace ?? {
    traceId: `layout-save-trace-${Date.now()}`,
    buildCommit: import.meta.env.VITE_BUILD_COMMIT?.trim() || "local-dev",
    recordId: options.recordId,
    planId: options.planId,
    failureStage: null
  };
  const aliases = aliasStages(stage, options.probe);
  window.__nerdeusLayoutSaveTrace = {
    ...trace,
    recordId: options.recordId,
    planId: options.planId,
    [stage]: options.probe,
    ...aliases,
    failureStage: null
  };
}

function aliasStages(stage: LayoutSaveTraceStage, probe: RoomDoorProbe): Partial<LayoutSaveTrace> {
  if (stage === "afterEditEditableLayout") {
    return {
      afterVisibleEdit: probe,
      editableLayoutBeforeSave: probe
    };
  }
  if (stage === "draftBeforeSave") {
    return {
      authoringDraftBeforeSave: probe
    };
  }
  if (stage === "savedRecordPayload") {
    return {
      savedFloorplanStorePayload: probe
    };
  }
  if (stage === "persistedLocalStoragePayload") {
    return {
      localStoragePayload: probe
    };
  }
  return {};
}
