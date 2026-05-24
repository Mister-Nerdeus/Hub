import type { EditableRoomGeometry } from "@nerdeus/shared";

import {
  ROOM_INSPECTOR_DIMENSION_FIELDS,
  type RoomInspectorDimensionField,
  type RoomInspectorDimensionChanges
} from "./roomInspectorDimensionEdit";

export type RoomInspectorDimensionDraftFieldState = {
  value: string;
  error: string | null;
};

export type RoomInspectorDimensionDraftState = {
  roomId: string | null;
  fields: Record<RoomInspectorDimensionField, RoomInspectorDimensionDraftFieldState>;
};

export type CommitRoomInspectorDimensionDraftResult =
  | {
      status: "valid";
      draft: RoomInspectorDimensionDraftState;
      changes: RoomInspectorDimensionChanges;
    }
  | {
      status: "invalid";
      draft: RoomInspectorDimensionDraftState;
      changes: null;
    };

const COMPLETE_FEET_VALUE_PATTERN = /^-?(?:\d+|\d+\.\d+|\.\d+)$/;

export function createRoomInspectorDimensionDraft(
  room: Pick<
    EditableRoomGeometry,
    "id" | "xFeet" | "yFeet" | "widthFeet" | "heightFeet"
  > | null
): RoomInspectorDimensionDraftState {
  return {
    roomId: room?.id ?? null,
    fields: Object.fromEntries(
      ROOM_INSPECTOR_DIMENSION_FIELDS.map((field) => [
        field,
        {
          value: room == null ? "" : formatDraftFeet(room[field]),
          error: null
        }
      ])
    ) as Record<RoomInspectorDimensionField, RoomInspectorDimensionDraftFieldState>
  };
}

export function updateRoomInspectorDimensionDraft(
  draft: RoomInspectorDimensionDraftState,
  field: RoomInspectorDimensionField,
  value: string
): RoomInspectorDimensionDraftState {
  requireDraftField(field);
  return {
    ...draft,
    fields: {
      ...draft.fields,
      [field]: {
        value,
        error: null
      }
    }
  };
}

export function commitRoomInspectorDimensionDraftField(
  draft: RoomInspectorDimensionDraftState,
  field: RoomInspectorDimensionField
): CommitRoomInspectorDimensionDraftResult {
  requireDraftField(field);
  const fieldState = draft.fields[field];
  const parsed = parseRoomInspectorDimensionDraftValue(fieldState.value);

  if (parsed == null) {
    return {
      status: "invalid",
      draft: setDraftFieldError(draft, field, "Enter a complete feet value."),
      changes: null
    };
  }

  return {
    status: "valid",
    draft: {
      ...draft,
      fields: {
        ...draft.fields,
        [field]: {
          value: formatDraftFeet(parsed),
          error: null
        }
      }
    },
    changes: { [field]: parsed }
  };
}

export function cancelRoomInspectorDimensionDraftField(
  draft: RoomInspectorDimensionDraftState,
  room: Pick<EditableRoomGeometry, "id" | RoomInspectorDimensionField> | null,
  field: RoomInspectorDimensionField
): RoomInspectorDimensionDraftState {
  requireDraftField(field);
  if (room == null || draft.roomId !== room.id) {
    return draft;
  }
  return {
    ...draft,
    fields: {
      ...draft.fields,
      [field]: {
        value: formatDraftFeet(room[field]),
        error: null
      }
    }
  };
}

export function parseRoomInspectorDimensionDraftValue(value: string): number | null {
  const trimmed = value.trim();
  if (!COMPLETE_FEET_VALUE_PATTERN.test(trimmed)) {
    return null;
  }
  const parsed = Number(trimmed);
  return Number.isFinite(parsed) ? parsed : null;
}

function setDraftFieldError(
  draft: RoomInspectorDimensionDraftState,
  field: RoomInspectorDimensionField,
  error: string
): RoomInspectorDimensionDraftState {
  return {
    ...draft,
    fields: {
      ...draft.fields,
      [field]: {
        ...draft.fields[field],
        error
      }
    }
  };
}

function formatDraftFeet(value: number): string {
  return String(value);
}

function requireDraftField(field: RoomInspectorDimensionField): void {
  if (!ROOM_INSPECTOR_DIMENSION_FIELDS.includes(field)) {
    throw new Error("room inspector dimension draft field must be supported");
  }
}
