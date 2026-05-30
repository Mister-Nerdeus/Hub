import type { DoorAuthoringWarning } from "@nerdeus/shared";
import {
  buildLayoutValidationWarning,
  type LayoutEditorValidationWarning
} from "./layoutValidationWarningContract";

export function buildDoorAuthoringValidationWarning(
  warning: DoorAuthoringWarning
): LayoutEditorValidationWarning {
  const object = warning.doorId != null
    ? { objectType: "door" as const, objectId: warning.doorId }
    : warning.roomId != null
      ? { objectType: "room" as const, objectId: warning.roomId }
      : { objectType: null, objectId: null };
  return buildLayoutValidationWarning({
    code: warning.code,
    severity: warning.severity,
    source: "door_sync",
    message: warning.message,
    objectType: object.objectType,
    objectId: object.objectId,
    isGenerated: true
  });
}
