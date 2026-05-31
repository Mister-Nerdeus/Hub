import type { NurseProfileContract } from "./nurseProfileContract.js";
import type { RoomLoadContract } from "./roomLoadContract.js";

export const ASSIGNMENT_SET_STATUSES = ["draft", "ready_for_scenario", "archived"] as const;

export type AssignmentSetStatus = (typeof ASSIGNMENT_SET_STATUSES)[number];

export type AssignmentSetContract = {
  schemaVersion: "1.0.0";
  assignmentSetId: string;
  floorplanVersionId: string;
  displayName: string;
  status: AssignmentSetStatus;
  nurseProfiles: NurseProfileContract[];
  assignmentsByRoomId: Record<string, string>;
  roomLoadsByRoomId: Record<string, RoomLoadContract>;
  createdAt: string;
  updatedAt: string;
};
