import type { PlanContract } from "../contracts.js";

export type DefaultPlanPathNodeCoverageGap = {
  code: string;
  objectId: string;
  message: string;
};

export type DefaultPlanPathNodeCoverageAudit = {
  schemaVersion: "1.0.0";
  planId: string;
  status: "passed" | "failed";
  counts: {
    rooms: number;
    doors: number;
    stations: number;
    hallways: number;
    entries: number;
    pathNodes: number;
  };
  gaps: DefaultPlanPathNodeCoverageGap[];
  limitations: string[];
};

export const DEFAULT_PLAN_PATH_NODE_COVERAGE_LIMITATIONS = [
  "Path-node coverage confirms graph references and anchors only.",
  "It does not prove measured walking distance or exact source geometry."
];

export function auditDefaultPlanPathNodeCoverage(
  planValue: PlanContract
): DefaultPlanPathNodeCoverageAudit {
  const plan = planValue;
  const nodeById = new Map(plan.pathNodes.map((node) => [node.id, node]));
  const doorById = new Map(plan.doors.map((door) => [door.id, door]));
  const gaps: DefaultPlanPathNodeCoverageGap[] = [];

  for (const door of plan.doors) {
    if (door.pathNodeId == null || !nodeById.has(door.pathNodeId)) {
      addGap(gaps, "MISSING_DOOR_PATH_NODE", door.id, "Door pathNodeId must resolve to a path node.");
    }
  }

  for (const room of plan.rooms) {
    if (room.pathNodeId == null) {
      addGap(gaps, "MISSING_ROOM_PATH_NODE", room.id, "Room pathNodeId is required.");
      continue;
    }
    const node = nodeById.get(room.pathNodeId);
    if (node == null || node.nodeType !== "room_door") {
      addGap(gaps, "ROOM_PATH_NODE_NOT_ROOM_DOOR", room.id, "Room pathNodeId must resolve to a room_door path node.");
      continue;
    }
    if (node.linkedObjectId == null) {
      addGap(gaps, "ROOM_DOOR_NODE_MISSING_DOOR_LINK", node.id, "Room door path node must link to a door.");
      continue;
    }
    const door = doorById.get(node.linkedObjectId);
    if (door == null) {
      addGap(gaps, "ROOM_DOOR_NODE_LINKS_MISSING_DOOR", node.id, "Room door path node linkedObjectId must resolve to a door.");
      continue;
    }
    if (door.roomId !== room.id) {
      addGap(gaps, "ROOM_DOOR_NODE_LINKS_WRONG_ROOM", room.id, "Room path node linked door must belong to the same room.");
    }
  }

  for (const node of plan.pathNodes.filter((candidate) => candidate.nodeType === "room_door")) {
    if (node.linkedObjectId == null || !doorById.has(node.linkedObjectId)) {
      addGap(gaps, "ROOM_DOOR_NODE_WITHOUT_DOOR", node.id, "Every room_door path node must link to a door.");
    }
  }

  for (const station of plan.nurseStations) {
    const node = nodeById.get(station.pathNodeId);
    if (node == null || node.nodeType !== "station") {
      addGap(gaps, "STATION_PATH_NODE_NOT_STATION", station.id, "Nurse station pathNodeId must resolve to a station path node.");
    }
  }

  const entryNodes = plan.pathNodes.filter((node) => node.nodeType === "entry");
  const hasEntryMetadata =
    plan.zones.some((zone) => zone.zoneType === "ems_entry" || zone.zoneType === "ambulance_entry") ||
    entryNodes.some((node) => node.entryOperationalMetadata != null);
  if (hasEntryMetadata && entryNodes.length === 0) {
    addGap(gaps, "MISSING_ENTRY_PATH_NODE", plan.planId, "Plan with entry metadata must contain at least one entry path node.");
  }
  for (const node of entryNodes) {
    if (node.entryOperationalMetadata?.linkedPathNodeId === node.id) {
      addGap(gaps, "ENTRY_NODE_SELF_REFERENCE", node.id, "Entry path node must not self-reference.");
    }
  }

  for (const hallway of plan.hallways) {
    const hasAnchor = plan.pathNodes.some(
      (node) => node.nodeType === "hallway" && node.linkedObjectId === hallway.id
    );
    if (!hasAnchor) {
      addGap(gaps, "HALLWAY_WITHOUT_ANCHOR_NODE", hallway.id, "Every hallway must have at least one hallway path node.");
    }
  }

  return {
    schemaVersion: "1.0.0",
    planId: plan.planId,
    status: gaps.length === 0 ? "passed" : "failed",
    counts: {
      rooms: plan.rooms.length,
      doors: plan.doors.length,
      stations: plan.nurseStations.length,
      hallways: plan.hallways.length,
      entries: entryNodes.length,
      pathNodes: plan.pathNodes.length
    },
    gaps,
    limitations: [...DEFAULT_PLAN_PATH_NODE_COVERAGE_LIMITATIONS]
  };
}

function addGap(
  gaps: DefaultPlanPathNodeCoverageGap[],
  code: string,
  objectId: string,
  message: string
): void {
  gaps.push({ code, objectId, message });
}
