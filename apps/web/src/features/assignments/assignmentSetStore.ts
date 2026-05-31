import {
  createDefaultNurseProfiles,
  isRoomLoadEligibleRoomType,
  validateAssignmentSetContract,
  type ActiveFloorplanContract,
  type AssignmentSetContract,
  type EditableRoomType,
  type RoomLoadContract
} from "@nerdeus/shared";
import {
  readPersistedAssignmentSets,
  writePersistedAssignmentSets,
  type AssignmentSetStorage
} from "./assignmentSetPersistence";

export type AssignmentSetStore = {
  list(): AssignmentSetContract[];
  load(assignmentSetId: string): AssignmentSetContract | null;
  loadForFloorplanVersion(floorplanVersionId: string): AssignmentSetContract | null;
  save(assignmentSet: AssignmentSetContract): AssignmentSetContract;
};

export function createAssignmentSetStore(storage: AssignmentSetStorage | null): AssignmentSetStore {
  let assignmentSets = readPersistedAssignmentSets(storage);

  function persist() {
    writePersistedAssignmentSets(storage, assignmentSets);
  }

  return {
    list() {
      return assignmentSets.map(cloneAssignmentSet);
    },
    load(assignmentSetId) {
      const assignmentSet = assignmentSets.find((candidate) => candidate.assignmentSetId === assignmentSetId);
      return assignmentSet == null ? null : cloneAssignmentSet(assignmentSet);
    },
    loadForFloorplanVersion(floorplanVersionId) {
      const assignmentSet = assignmentSets
        .filter((candidate) => candidate.floorplanVersionId === floorplanVersionId && candidate.status !== "archived")
        .sort((left, right) => right.updatedAt.localeCompare(left.updatedAt))[0];
      return assignmentSet == null ? null : cloneAssignmentSet(assignmentSet);
    },
    save(assignmentSet) {
      const validated = validateAssignmentSetContract(assignmentSet);
      assignmentSets = [
        validated,
        ...assignmentSets.filter((candidate) => candidate.assignmentSetId !== validated.assignmentSetId)
      ];
      persist();
      return cloneAssignmentSet(validated);
    }
  };
}

export function createDefaultAssignmentSetForFloorplan(
  activeFloorplan: ActiveFloorplanContract,
  nowIso = new Date().toISOString()
): AssignmentSetContract {
  const roomLoadsByRoomId = Object.fromEntries(
    activeFloorplan.editableLayout.rooms
      .filter((room) => isRoomLoadEligibleRoomType(room.roomType))
      .map((room) => [room.id, createDefaultRoomLoad(room.id, room.roomNumber, room.roomType)])
  );

  return {
    schemaVersion: "1.0.0",
    assignmentSetId: `assignment-set-${activeFloorplan.activeFloorplanVersionId}`,
    floorplanVersionId: activeFloorplan.activeFloorplanVersionId,
    displayName: `${activeFloorplan.displayName} Assignment Set`,
    status: "draft",
    nurseProfiles: createDefaultNurseProfiles(),
    assignmentsByRoomId: {},
    roomLoadsByRoomId,
    createdAt: nowIso,
    updatedAt: nowIso
  };
}

export function updateAssignmentSetAssignments(
  assignmentSet: AssignmentSetContract,
  assignmentsByRoomId: Record<string, string>,
  updatedAt = new Date().toISOString()
): AssignmentSetContract {
  return validateAssignmentSetContract({
    ...assignmentSet,
    assignmentsByRoomId,
    updatedAt
  });
}

function createDefaultRoomLoad(roomId: string, roomNumber: string, roomType: EditableRoomType): RoomLoadContract {
  const roomIndex = numericRoomIndex(roomNumber, roomId);
  const acuity = (((roomIndex - 1) % 5) + 1) as RoomLoadContract["acuity"];
  const elevated = acuity >= 4;
  return {
    schemaVersion: "1.0.0",
    roomId,
    occupied: true,
    acuity,
    traumaActive: roomType === "trauma",
    isolationActive: roomType === "isolation",
    behavioralRisk: roomType === "behavioral",
    fallRisk: elevated,
    sitterRequired: roomType === "behavioral",
    medicationFrequency: elevated ? "high" : acuity >= 3 ? "medium" : "low",
    monitoringFrequency: elevated ? "high" : acuity >= 3 ? "medium" : "low",
    procedureBurden: roomType === "procedure" ? "high" : "low",
    expectedTurnover: elevated ? "high" : "normal"
  };
}

function numericRoomIndex(roomNumber: string, roomId: string): number {
  const text = roomNumber.match(/\d+/u)?.[0] ?? roomId.match(/\d+/u)?.[0] ?? "1";
  const value = Number(text);
  return Number.isFinite(value) && value > 0 ? value : 1;
}

function cloneAssignmentSet(assignmentSet: AssignmentSetContract): AssignmentSetContract {
  return validateAssignmentSetContract(JSON.parse(JSON.stringify(assignmentSet)));
}
