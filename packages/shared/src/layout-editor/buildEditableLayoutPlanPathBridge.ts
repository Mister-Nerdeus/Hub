import type {
  Door,
  Hallway,
  NurseStation,
  PathEdge,
  PathNode,
  PlanContract,
  Room,
  Zone
} from "../contracts.js";
import {
  validateEditableLayoutGeometryContract,
  type EditableDoorGeometry,
  type EditableHallwayGeometry,
  type EditableLayoutGeometryContract,
  type EditableRoomGeometry,
  type EditableStationGeometry,
  type EditableZoneGeometry
} from "./editableLayoutGeometryContract.js";
import {
  EDITABLE_LAYOUT_PLAN_PATH_BRIDGE_ADAPTER_LIMITATIONS,
  validateEditableLayoutPlanPathBridgeContract,
  type EditableLayoutPlanPathBridgeContract,
  type EditableLayoutPlanPathBridgeMapping,
  type EditableLayoutPlanPathBridgeMappingStatus
} from "./editableLayoutPlanPathBridgeContract.js";

type BridgeObjectKind = "rooms" | "doors" | "stations" | "hallways" | "zones";

export type EditableLayoutPlanPathBridgeExplicitMappings = Partial<
  Record<BridgeObjectKind, Readonly<Record<string, string>>>
>;

export type BuildEditableLayoutPlanPathBridgeInput = {
  editableLayout: EditableLayoutGeometryContract;
  plan: PlanContract;
  explicitMappings?: EditableLayoutPlanPathBridgeExplicitMappings;
};

type PlanObjectWithId = Room | Door | NurseStation | Hallway | Zone;

type BuildMappingsInput<TEditable extends { id: string }, TPlan extends PlanObjectWithId> = {
  editableObjects: readonly TEditable[];
  planObjects: readonly TPlan[];
  explicitMap: Readonly<Record<string, string>> | undefined;
  pathNodes: readonly PathNode[];
  pathEdges: readonly PathEdge[];
  getDirectPathNodeId: (planObject: TPlan) => string | null;
};

export function buildEditableLayoutPlanPathBridge(
  input: BuildEditableLayoutPlanPathBridgeInput
): EditableLayoutPlanPathBridgeContract {
  const editableLayout = validateEditableLayoutGeometryContract(input.editableLayout);
  const explicitMappings = input.explicitMappings ?? {};
  const pathNodes = [...input.plan.pathNodes];
  const pathEdges = [...input.plan.pathEdges];

  return validateEditableLayoutPlanPathBridgeContract({
    editableLayoutId: editableLayout.layoutId,
    planId: requireNonEmptyString(input.plan.planId, "plan.planId"),
    roomMappings: buildMappedObjectMappings<EditableRoomGeometry, Room>({
      editableObjects: editableLayout.rooms,
      planObjects: input.plan.rooms,
      explicitMap: explicitMappings.rooms,
      pathNodes,
      pathEdges,
      getDirectPathNodeId: (room) => room.pathNodeId ?? null
    }),
    doorMappings: buildMappedObjectMappings<EditableDoorGeometry, Door>({
      editableObjects: editableLayout.doors,
      planObjects: input.plan.doors,
      explicitMap: explicitMappings.doors,
      pathNodes,
      pathEdges,
      getDirectPathNodeId: (door) => door.pathNodeId ?? null
    }),
    stationMappings: buildMappedObjectMappings<EditableStationGeometry, NurseStation>({
      editableObjects: editableLayout.stations,
      planObjects: input.plan.nurseStations,
      explicitMap: explicitMappings.stations,
      pathNodes,
      pathEdges,
      getDirectPathNodeId: (station) => station.pathNodeId
    }),
    hallwayMappings: buildMappedObjectMappings<EditableHallwayGeometry, Hallway>({
      editableObjects: editableLayout.hallways,
      planObjects: input.plan.hallways,
      explicitMap: explicitMappings.hallways,
      pathNodes,
      pathEdges,
      getDirectPathNodeId: () => null
    }),
    zoneMappings: buildZoneMappings({
      editableObjects: editableLayout.zones,
      planObjects: input.plan.zones,
      explicitMap: explicitMappings.zones,
      pathNodes,
      pathEdges
    }),
    limitations: [...EDITABLE_LAYOUT_PLAN_PATH_BRIDGE_ADAPTER_LIMITATIONS]
  });
}

function buildMappedObjectMappings<TEditable extends { id: string }, TPlan extends PlanObjectWithId>(
  input: BuildMappingsInput<TEditable, TPlan>
): EditableLayoutPlanPathBridgeMapping[] {
  const planObjectsById = indexById(input.planObjects);
  return input.editableObjects
    .map((editableObject) => {
      const planObject = resolvePlanObject(editableObject.id, input.explicitMap, planObjectsById);
      if (planObject == null) {
        return createMissingPlanObjectMapping(editableObject.id);
      }
      const pathRefs = collectPathReferences({
        pathNodes: input.pathNodes,
        pathEdges: input.pathEdges,
        planObjectId: planObject.id,
        directPathNodeId: input.getDirectPathNodeId(planObject)
      });
      return createPathBackedMapping(editableObject.id, planObject.id, pathRefs);
    })
    .sort(compareMappings);
}

function buildZoneMappings(input: {
  editableObjects: readonly EditableZoneGeometry[];
  planObjects: readonly Zone[];
  explicitMap: Readonly<Record<string, string>> | undefined;
  pathNodes: readonly PathNode[];
  pathEdges: readonly PathEdge[];
}): EditableLayoutPlanPathBridgeMapping[] {
  const planObjectsById = indexById(input.planObjects);
  return input.editableObjects
    .map((editableObject) => {
      const planObject = resolvePlanObject(editableObject.id, input.explicitMap, planObjectsById);
      if (planObject == null) {
        return createMissingPlanObjectMapping(editableObject.id);
      }
      const pathRefs = collectPathReferences({
        pathNodes: input.pathNodes,
        pathEdges: input.pathEdges,
        planObjectId: planObject.id,
        directPathNodeId: null
      });
      if (pathRefs.pathNodeIds.length === 0 && pathRefs.pathEdgeIds.length === 0) {
        return createNotRequiredMapping(editableObject.id, planObject.id);
      }
      return createPathBackedMapping(editableObject.id, planObject.id, pathRefs);
    })
    .sort(compareMappings);
}

function createMissingPlanObjectMapping(editableObjectId: string): EditableLayoutPlanPathBridgeMapping {
  return {
    editableObjectId,
    planObjectId: null,
    pathNodeIds: [],
    pathEdgeIds: [],
    mappingStatus: "missing_plan_object"
  };
}

function createNotRequiredMapping(
  editableObjectId: string,
  planObjectId: string | null
): EditableLayoutPlanPathBridgeMapping {
  return {
    editableObjectId,
    planObjectId,
    pathNodeIds: [],
    pathEdgeIds: [],
    mappingStatus: "not_required"
  };
}

function createPathBackedMapping(
  editableObjectId: string,
  planObjectId: string,
  pathRefs: { pathNodeIds: string[]; pathEdgeIds: string[] }
): EditableLayoutPlanPathBridgeMapping {
  const mappingStatus: EditableLayoutPlanPathBridgeMappingStatus =
    pathRefs.pathNodeIds.length > 0 || pathRefs.pathEdgeIds.length > 0
      ? "mapped"
      : "missing_path_reference";
  return {
    editableObjectId,
    planObjectId,
    pathNodeIds: pathRefs.pathNodeIds,
    pathEdgeIds: pathRefs.pathEdgeIds,
    mappingStatus
  };
}

function collectPathReferences(input: {
  pathNodes: readonly PathNode[];
  pathEdges: readonly PathEdge[];
  planObjectId: string;
  directPathNodeId: string | null;
}): { pathNodeIds: string[]; pathEdgeIds: string[] } {
  const pathNodeIds = uniqueSorted(
    input.pathNodes
      .filter((node) => node.linkedObjectId === input.planObjectId || node.id === input.directPathNodeId)
      .map((node) => node.id)
  );
  const nodeIdSet = new Set(pathNodeIds);
  const pathEdgeIds = uniqueSorted(
    input.pathEdges
      .filter((edge) => nodeIdSet.has(edge.fromNodeId) || nodeIdSet.has(edge.toNodeId))
      .map((edge) => edge.id)
  );
  return { pathNodeIds, pathEdgeIds };
}

function resolvePlanObject<TPlan extends PlanObjectWithId>(
  editableObjectId: string,
  explicitMap: Readonly<Record<string, string>> | undefined,
  planObjectsById: ReadonlyMap<string, TPlan>
): TPlan | null {
  const planObjectId = explicitMap?.[editableObjectId] ?? editableObjectId;
  return planObjectsById.get(planObjectId) ?? null;
}

function indexById<TPlan extends PlanObjectWithId>(planObjects: readonly TPlan[]): Map<string, TPlan> {
  return new Map(planObjects.map((planObject) => [planObject.id, planObject]));
}

function compareMappings(
  left: EditableLayoutPlanPathBridgeMapping,
  right: EditableLayoutPlanPathBridgeMapping
): number {
  return left.editableObjectId.localeCompare(right.editableObjectId);
}

function uniqueSorted(values: readonly string[]): string[] {
  return [...new Set(values)].sort((left, right) => left.localeCompare(right));
}

function requireNonEmptyString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}
