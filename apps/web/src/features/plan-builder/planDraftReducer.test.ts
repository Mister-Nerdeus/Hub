import { validatePlanContract, type PlanContract } from "@nerdeus/shared";

import { planErPodPhase2 } from "../../fixtures/planErPodPhase2";
import { planDraftReducer } from "./planDraftReducer";

const basePlan: PlanContract = validatePlanContract(planErPodPhase2);

const addedRoom = {
  id: "room-07",
  label: "Room 07",
  type: "standard",
  x: 36,
  y: 34,
  widthFeet: 12,
  lengthFeet: 10,
  zoneId: "zone-pod-a",
  nearestStationId: "station-primary",
  pathNodeId: null
} as const;

const withRoom = planDraftReducer(basePlan, { type: "addRoom", room: addedRoom });
if (withRoom === basePlan || !withRoom.rooms.some((room) => room.id === "room-07")) {
  throw new Error("addRoom must add a valid room immutably");
}
validatePlanContract(withRoom);

const resized = planDraftReducer(withRoom, {
  type: "updateRoom",
  roomId: "room-07",
  changes: { widthFeet: 14, lengthFeet: 11 }
});
if (resized.rooms.find((room) => room.id === "room-07")?.widthFeet !== 14) {
  throw new Error("updateRoom must update room dimensions");
}
validatePlanContract(resized);

const invalidEdge = planDraftReducer(resized, {
  type: "addPathEdge",
  pathEdge: {
    id: "edge-invalid",
    fromNodeId: "node-station-primary",
    toNodeId: "node-missing",
    lengthFeet: 5,
    hallwayWidthFeet: 8,
    congestionFactor: 1,
    doorPenaltySeconds: 0,
    turnPenaltySeconds: 0,
    blocked: false
  }
});
if (invalidEdge !== resized) {
  throw new Error("addPathEdge with missing node must fail safely");
}

const duplicateRoom = planDraftReducer(resized, { type: "addRoom", room: addedRoom });
if (duplicateRoom !== resized) {
  throw new Error("duplicate IDs must fail safely");
}
