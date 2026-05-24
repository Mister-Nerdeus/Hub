import type { PathNode, PlanContract } from "../contracts.js";
import type { EditableLayoutPlanPathBridgeContract } from "./editableLayoutPlanPathBridgeContract.js";
import { validateEditableLayoutPlanPathBridgeContract } from "./editableLayoutPlanPathBridgeContract.js";
import {
  DOOR_PATH_NODE_GEOMETRY_SYNC_LIMITATIONS,
  deriveDoorCenterFeet,
  type DoorCenterFeet
} from "./doorPathNodeSyncContract.js";
import type {
  EditableDoorGeometry,
  EditableLayoutGeometryContract,
  EditableRectFeet
} from "./editableLayoutGeometryContract.js";

export const DOOR_PATH_NODE_GEOMETRY_SYNC_STATUSES = [
  "synced",
  "skipped_missing_linked_path_node",
  "skipped_missing_path_node",
  "skipped_owner_geometry_missing"
] as const;

export type DoorPathNodeGeometrySyncStatus =
  (typeof DOOR_PATH_NODE_GEOMETRY_SYNC_STATUSES)[number];

export type DoorPathNodeGeometrySyncEntry = {
  doorId: string;
  ownerId: string;
  linkedPathNodeIds: string[];
  derivedDoorCenterFeet: DoorCenterFeet | null;
  syncStatus: DoorPathNodeGeometrySyncStatus;
  limitations: string[];
};

export type DoorPathNodeGeometrySyncResult = {
  editableLayoutId: string;
  planId: string;
  updatedPlan: PlanContract;
  syncedPathNodeIds: string[];
  skippedDoorIds: string[];
  doorResults: DoorPathNodeGeometrySyncEntry[];
  limitations: string[];
};

export type SyncDoorPathNodeGeometryInput = {
  editableLayout: EditableLayoutGeometryContract;
  plan: PlanContract;
  bridge: EditableLayoutPlanPathBridgeContract;
  doorIds?: readonly string[];
};

export function syncDoorPathNodeGeometry(
  input: SyncDoorPathNodeGeometryInput
): DoorPathNodeGeometrySyncResult {
  const bridge = validateEditableLayoutPlanPathBridgeContract(input.bridge);
  if (bridge.editableLayoutId !== input.editableLayout.layoutId) {
    throw new Error("bridge editableLayoutId must match editable layout");
  }
  if (bridge.planId !== input.plan.planId) {
    throw new Error("bridge planId must match plan");
  }

  const pathNodesById = new Map(input.plan.pathNodes.map((node) => [node.id, node]));
  const doorMappingsById = new Map(bridge.doorMappings.map((mapping) => [mapping.editableObjectId, mapping]));
  const selectedDoorIds = input.doorIds == null ? null : new Set(input.doorIds);
  const pathNodeUpdates = new Map<string, DoorCenterFeet>();
  const doorResults = input.editableLayout.doors
    .filter((door) => selectedDoorIds == null || selectedDoorIds.has(door.id))
    .sort((left, right) => left.id.localeCompare(right.id))
    .map((door) => {
      const owner = findDoorOwner(door, input.editableLayout);
      if (owner == null) {
        return createDoorResult({
          door,
          linkedPathNodeIds: doorMappingsById.get(door.id)?.pathNodeIds ?? [],
          derivedDoorCenterFeet: null,
          syncStatus: "skipped_owner_geometry_missing"
        });
      }

      const linkedPathNodeIds = [...(doorMappingsById.get(door.id)?.pathNodeIds ?? [])].sort(
        (left, right) => left.localeCompare(right)
      );
      const derivedDoorCenterFeet = deriveDoorCenterFeet(door, owner);
      if (linkedPathNodeIds.length === 0) {
        return createDoorResult({
          door,
          linkedPathNodeIds,
          derivedDoorCenterFeet,
          syncStatus: "skipped_missing_linked_path_node"
        });
      }
      if (linkedPathNodeIds.some((pathNodeId) => !pathNodesById.has(pathNodeId))) {
        return createDoorResult({
          door,
          linkedPathNodeIds,
          derivedDoorCenterFeet,
          syncStatus: "skipped_missing_path_node"
        });
      }

      for (const pathNodeId of linkedPathNodeIds) {
        pathNodeUpdates.set(pathNodeId, derivedDoorCenterFeet);
      }
      return createDoorResult({
        door,
        linkedPathNodeIds,
        derivedDoorCenterFeet,
        syncStatus: "synced"
      });
    });

  const updatedPlan = {
    ...input.plan,
    rooms: input.plan.rooms.map((room) => ({ ...room })),
    hallways: input.plan.hallways.map((hallway) => ({
      ...hallway,
      points: hallway.points.map((point) => ({ ...point }))
    })),
    doors: input.plan.doors.map((door) => ({ ...door })),
    nurseStations: input.plan.nurseStations.map((station) => ({ ...station })),
    zones: input.plan.zones.map((zone) => ({ ...zone })),
    pathNodes: input.plan.pathNodes.map((node) => updatePathNode(node, pathNodeUpdates)),
    pathEdges: input.plan.pathEdges.map((edge) => ({ ...edge }))
  };

  return {
    editableLayoutId: input.editableLayout.layoutId,
    planId: input.plan.planId,
    updatedPlan,
    syncedPathNodeIds: [...pathNodeUpdates.keys()].sort((left, right) => left.localeCompare(right)),
    skippedDoorIds: doorResults
      .filter((result) => result.syncStatus !== "synced")
      .map((result) => result.doorId),
    doorResults,
    limitations: [...DOOR_PATH_NODE_GEOMETRY_SYNC_LIMITATIONS]
  };
}

function updatePathNode(node: PathNode, updates: ReadonlyMap<string, DoorCenterFeet>): PathNode {
  const update = updates.get(node.id);
  if (update == null) {
    return { ...node };
  }
  return {
    ...node,
    x: update.xFeet,
    y: update.yFeet
  };
}

function createDoorResult(input: {
  door: EditableDoorGeometry;
  linkedPathNodeIds: string[];
  derivedDoorCenterFeet: DoorCenterFeet | null;
  syncStatus: DoorPathNodeGeometrySyncStatus;
}): DoorPathNodeGeometrySyncEntry {
  return {
    doorId: input.door.id,
    ownerId: input.door.ownerId,
    linkedPathNodeIds: input.linkedPathNodeIds,
    derivedDoorCenterFeet: input.derivedDoorCenterFeet,
    syncStatus: input.syncStatus,
    limitations: [...DOOR_PATH_NODE_GEOMETRY_SYNC_LIMITATIONS]
  };
}

function findDoorOwner(
  door: EditableDoorGeometry,
  layout: EditableLayoutGeometryContract
): EditableRectFeet | null {
  return door.ownerKind === "room"
    ? layout.rooms.find((room) => room.id === door.ownerId) ?? null
    : layout.hallways.find((hallway) => hallway.id === door.ownerId) ?? null;
}
