import { isRoomLoadEligibleRoomType, type SemanticRoomType } from "./roomTypeRules.js";
import {
  getBedCountContributionForRoomId,
  getPhysicalRoomCountContributionForRoomId,
  getSplitBayFixtureOccupancyBridge,
  isAssignmentEligibleByFixtureBridge,
  isRatioEligibleByFixtureBridge
} from "./splitBayFixtureBridge.js";

export type StorageRawFieldAuditInput = {
  id: string;
  roomType: string;
  maxPatients?: number;
  pathNodeId?: string | null;
  roomOperationalMetadata?: {
    capacityCategory?: string | null;
    roomClass?: string | null;
  } | null;
};

export type StorageRawFieldGuardReport = {
  schemaVersion: "1.0.0";
  storageRoomId: string;
  rawFieldRiskPresent: boolean;
  rawFieldAudit: {
    hasMaxPatients: boolean;
    maxPatients: number | null;
    hasPathNodeId: boolean;
    capacityCategory: string | null;
    roomClass: string | null;
  };
  selectorExclusion: {
    occupancyType: string;
    bedCountContribution: number;
    physicalRoomCountContribution: number;
    assignmentEligible: boolean;
    ratioEligible: boolean;
    roomLoadEligible: boolean;
  };
  futureDriftNegative: {
    storageWithRoomLikeRawFieldsStillExcluded: boolean;
  };
};

export function buildStorageRawFieldGuardReport(storageRoom: StorageRawFieldAuditInput): StorageRawFieldGuardReport {
  const bridge = getSplitBayFixtureOccupancyBridge(storageRoom.id);
  const rawFieldAudit = {
    hasMaxPatients: typeof storageRoom.maxPatients === "number",
    maxPatients: typeof storageRoom.maxPatients === "number" ? storageRoom.maxPatients : null,
    hasPathNodeId: typeof storageRoom.pathNodeId === "string" && storageRoom.pathNodeId.length > 0,
    capacityCategory: storageRoom.roomOperationalMetadata?.capacityCategory ?? null,
    roomClass: storageRoom.roomOperationalMetadata?.roomClass ?? null
  };
  const selectorExclusion = {
    occupancyType: bridge.occupancyType,
    bedCountContribution: getBedCountContributionForRoomId(storageRoom.id),
    physicalRoomCountContribution: getPhysicalRoomCountContributionForRoomId(storageRoom.id),
    assignmentEligible: isAssignmentEligibleByFixtureBridge(storageRoom.id),
    ratioEligible: isRatioEligibleByFixtureBridge(storageRoom.id),
    roomLoadEligible: isRoomLoadEligibleRoomType(storageRoom.roomType as SemanticRoomType)
  };

  return {
    schemaVersion: "1.0.0",
    storageRoomId: storageRoom.id,
    rawFieldRiskPresent:
      rawFieldAudit.hasMaxPatients ||
      rawFieldAudit.hasPathNodeId ||
      rawFieldAudit.capacityCategory === "single",
    rawFieldAudit,
    selectorExclusion,
    futureDriftNegative: {
      storageWithRoomLikeRawFieldsStillExcluded:
        selectorExclusion.occupancyType === "storage" &&
        selectorExclusion.bedCountContribution === 0 &&
        selectorExclusion.physicalRoomCountContribution === 0 &&
        selectorExclusion.assignmentEligible === false &&
        selectorExclusion.ratioEligible === false &&
        selectorExclusion.roomLoadEligible === false
    }
  };
}
