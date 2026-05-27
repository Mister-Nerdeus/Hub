import type { PlanContract } from "@nerdeus/shared";
import { defaultPlan1RenderProofFixture } from "../../../fixtures/defaultPlans";
import {
  buildPathNodeEditorValidationViewModel,
  buildPathNodeRoomOptions
} from "../pathNodeEditorViewModel";

const plan1 = defaultPlan1RenderProofFixture.plan;
const options = buildPathNodeRoomOptions(plan1);

if (options.some((option) => option.roomId === "room-14")) {
  throw new Error("storage must be excluded from path-node patient-care room options");
}
if (!options.some((option) => option.roomId === "room-level-1-trauma")) {
  throw new Error("patient-care rooms must remain path-node routing options");
}

const baseRoom = plan1.rooms[0];
const baseDoor = plan1.doors[0];
if (baseRoom == null || baseDoor == null) {
  throw new Error("Plan 1 proof fixture must include a room and door");
}

const invalidSolidWallPlan: PlanContract = {
  ...plan1,
  rooms: [
    ...plan1.rooms,
    {
      ...baseRoom,
      id: "solid-wall-proof",
      label: "Solid Wall Proof",
      roomType: "solid_wall" as const,
      pathNodeId: "node-door-solid-wall-proof"
    }
  ],
  doors: [
    ...plan1.doors,
    {
      ...baseDoor,
      id: "door-solid-wall-proof",
      label: "Solid Wall Door Proof",
      roomId: "solid-wall-proof",
      pathNodeId: "node-door-solid-wall-proof"
    }
  ],
  pathNodes: [
    ...plan1.pathNodes,
    {
      id: "node-door-solid-wall-proof",
      nodeType: "room_door" as const,
      x: 1,
      y: 1,
      linkedObjectId: "door-solid-wall-proof",
      entryOperationalMetadata: null
    }
  ]
};

const validation = buildPathNodeEditorValidationViewModel(invalidSolidWallPlan);
if (!validation.solidWallPathNodeBlocked) {
  throw new Error("path-node editor validation must block solid-wall path nodes");
}
if (!validation.storageExcludedFromPatientCareRouting) {
  throw new Error("path-node editor validation must exclude storage from patient-care routing");
}
