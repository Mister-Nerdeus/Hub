import type { EditableLayoutGeometryContract } from "../layout-editor/editableLayoutGeometryContract.js";
import type { DoorDestinationContract } from "./doorDestinationContract.js";

export type DoorDestinationValidationSeverity = "warning" | "blocking";

export type DoorDestinationValidationIssue = {
  code:
    | "door_destination_unknown"
    | "door_destination_missing"
    | "door_destination_deleted_target"
    | "entry_exit_destination_missing"
    | "entry_exit_destination_deleted_target";
  severity: DoorDestinationValidationSeverity;
  objectType: "door" | "entry_exit";
  objectId: string;
  message: string;
};

export type DoorDestinationValidationResult = {
  status: "passed" | "warning" | "failed";
  issues: DoorDestinationValidationIssue[];
};

export function validateDoorDestinationsForLayout(
  layout: EditableLayoutGeometryContract
): DoorDestinationValidationResult {
  const issues: DoorDestinationValidationIssue[] = [];
  const destinationsByDoorId = new Map(
    (layout.doorDestinations ?? []).map((destination) => [destination.doorId, destination])
  );

  for (const door of layout.doors) {
    const destination = destinationsByDoorId.get(door.id);
    if (destination == null) {
      issues.push({
        code: "door_destination_missing",
        severity: "warning",
        objectType: "door",
        objectId: door.id,
        message: "Door destination is missing; mark it unknown or select where it leads."
      });
      continue;
    }
    if (destination.leadsToKind === "unknown") {
      issues.push({
        code: "door_destination_unknown",
        severity: "warning",
        objectType: "door",
        objectId: door.id,
        message: "Door destination is explicitly unknown."
      });
      continue;
    }
    if (!destinationTargetExists(layout, destination)) {
      issues.push({
        code: "door_destination_deleted_target",
        severity: "blocking",
        objectType: "door",
        objectId: door.id,
        message: "Door destination points to a deleted or unavailable layout object."
      });
    }
  }

  for (const entryExit of layout.entryExits ?? []) {
    if (entryExit.connectsTo.displayLabel.trim().length === 0) {
      issues.push({
        code: "entry_exit_destination_missing",
        severity: "blocking",
        objectType: "entry_exit",
        objectId: entryExit.entryExitId,
        message: "Entry or exit destination label is required."
      });
    }
    if (
      entryExit.connectsTo.destinationId != null &&
      !entryExitDestinationTargetExists(layout, entryExit.connectsTo.destinationKind, entryExit.connectsTo.destinationId)
    ) {
      issues.push({
        code: "entry_exit_destination_deleted_target",
        severity: "blocking",
        objectType: "entry_exit",
        objectId: entryExit.entryExitId,
        message: "Entry or exit destination points to a deleted or unavailable layout object."
      });
    }
  }

  const hasBlocking = issues.some((issue) => issue.severity === "blocking");
  return {
    status: hasBlocking ? "failed" : issues.length === 0 ? "passed" : "warning",
    issues
  };
}

function destinationTargetExists(
  layout: EditableLayoutGeometryContract,
  destination: DoorDestinationContract
): boolean {
  if (destination.leadsToKind === "external") {
    return true;
  }
  if (destination.leadsToId == null) {
    return false;
  }
  switch (destination.leadsToKind) {
    case "hallway":
      return layout.hallways.some((hallway) => hallway.id === destination.leadsToId);
    case "room":
      return layout.rooms.some((room) => room.id === destination.leadsToId);
    case "zone":
      return layout.zones.some((zone) => zone.id === destination.leadsToId);
    case "entry_exit":
      return (layout.entryExits ?? []).some((entryExit) => entryExit.entryExitId === destination.leadsToId);
    case "unknown":
      return true;
  }
}

function entryExitDestinationTargetExists(
  layout: EditableLayoutGeometryContract,
  destinationKind: string,
  destinationId: string
): boolean {
  switch (destinationKind) {
    case "hallway":
      return layout.hallways.some((hallway) => hallway.id === destinationId);
    case "provider_pharmacy":
      return layout.zones.some((zone) => zone.id === destinationId || zone.zoneType === "provider_pharmacy");
    case "ems":
    case "external":
    case "staff_only":
    case "pod":
      return true;
    default:
      return false;
  }
}
