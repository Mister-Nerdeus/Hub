import {
  deriveSplitRoomAssignmentTargets,
  type SplitRoomContract
} from "@nerdeus/shared";
import type { GeometryPersistenceProofRecord } from "./geometryPersistenceProof";

export function exportGeometryJson(record: GeometryPersistenceProofRecord): string {
  return JSON.stringify(record, null, 2);
}

export function importGeometryJson(json: string): GeometryPersistenceProofRecord {
  return JSON.parse(json) as GeometryPersistenceProofRecord;
}

export function geometryRoundTripPreservesAssignmentTargets(
  before: GeometryPersistenceProofRecord,
  after: GeometryPersistenceProofRecord
): boolean {
  return splitRoomTargetIds(before.splitRooms).join("|") === splitRoomTargetIds(after.splitRooms).join("|");
}

function splitRoomTargetIds(splitRooms: readonly SplitRoomContract[]): string[] {
  return splitRooms
    .flatMap((splitRoom) => deriveSplitRoomAssignmentTargets(splitRoom))
    .map((target) => target.assignmentTargetId)
    .sort();
}
