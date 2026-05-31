import type {
  BedPositionContract,
  HallwayGeometryContract,
  SplitRoomContract,
  SupportStorageAreaContract,
  WallGeometryContract
} from "@nerdeus/shared";

export type GeometryPersistenceProofRecord = {
  hallways: HallwayGeometryContract[];
  walls: WallGeometryContract[];
  supportAreas: SupportStorageAreaContract[];
  splitRooms: SplitRoomContract[];
};

export function saveGeometryPersistenceProof(
  record: GeometryPersistenceProofRecord
): string {
  return JSON.stringify(record);
}

export function reloadGeometryPersistenceProof(
  serialized: string
): GeometryPersistenceProofRecord {
  return JSON.parse(serialized) as GeometryPersistenceProofRecord;
}

export function splitBedPositionsSurviveReload(
  before: GeometryPersistenceProofRecord,
  after: GeometryPersistenceProofRecord
): boolean {
  return stableBedPositionIds(before).join("|") === stableBedPositionIds(after).join("|");
}

export function stableBedPositionIds(record: GeometryPersistenceProofRecord): string[] {
  return record.splitRooms
    .flatMap((splitRoom) => splitRoom.bedPositions)
    .map((bedPosition: BedPositionContract) => bedPosition.bedPositionId)
    .sort();
}
