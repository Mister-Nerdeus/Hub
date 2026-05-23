import {
  type Door,
  type Hallway,
  type NurseStation,
  type PathEdge,
  type PathNode,
  type PlanContract,
  type Room,
  type ScaleSettings
} from "@nerdeus/shared";

import { applyValidatedPlanDraft } from "./planBuilderValidation";

export type PlanDraftAction =
  | { type: "replacePlan"; plan: PlanContract }
  | { type: "addRoom"; room: Room }
  | { type: "updateRoom"; roomId: string; changes: Partial<Omit<Room, "id">> }
  | { type: "moveRoom"; roomId: string; x: number; y: number }
  | { type: "addHallway"; hallway: Hallway }
  | { type: "updateHallway"; hallwayId: string; changes: Partial<Omit<Hallway, "id">> }
  | { type: "addDoor"; door: Door }
  | { type: "addNurseStation"; nurseStation: NurseStation }
  | { type: "addPathNode"; pathNode: PathNode }
  | { type: "addPathEdge"; pathEdge: PathEdge }
  | { type: "updateScale"; scale: ScaleSettings };

export function planDraftReducer(state: PlanContract, action: PlanDraftAction): PlanContract {
  switch (action.type) {
    case "replacePlan":
      return validatedDraft(state, action.plan);
    case "addRoom":
      return validatedDraft(state, { ...state, rooms: [...state.rooms, action.room] });
    case "updateRoom":
      return validatedDraft(state, {
        ...state,
        rooms: state.rooms.map((room) =>
          room.id === action.roomId ? { ...room, ...action.changes, id: room.id } : room
        )
      });
    case "moveRoom":
      return validatedDraft(state, {
        ...state,
        rooms: state.rooms.map((room) =>
          room.id === action.roomId ? { ...room, x: action.x, y: action.y } : room
        )
      });
    case "addHallway":
      return validatedDraft(state, { ...state, hallways: [...state.hallways, action.hallway] });
    case "updateHallway":
      return validatedDraft(state, {
        ...state,
        hallways: state.hallways.map((hallway) =>
          hallway.id === action.hallwayId
            ? { ...hallway, ...action.changes, id: hallway.id }
            : hallway
        )
      });
    case "addDoor":
      return validatedDraft(state, { ...state, doors: [...state.doors, action.door] });
    case "addNurseStation":
      return validatedDraft(state, {
        ...state,
        nurseStations: [...state.nurseStations, action.nurseStation]
      });
    case "addPathNode":
      return validatedDraft(state, { ...state, pathNodes: [...state.pathNodes, action.pathNode] });
    case "addPathEdge":
      return validatedDraft(state, { ...state, pathEdges: [...state.pathEdges, action.pathEdge] });
    case "updateScale":
      return validatedDraft(state, { ...state, scale: action.scale });
  }
}

function validatedDraft(previous: PlanContract, next: PlanContract): PlanContract {
  return applyValidatedPlanDraft(previous, next).plan;
}
