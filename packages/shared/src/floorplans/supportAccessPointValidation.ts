import {
  validateEditableLayoutGeometryContract,
  type EditableLayoutGeometryContract
} from "../layout-editor/editableLayoutGeometryContract.js";
import { isNurseAssignableRoomType, isRatioCountEligibleRoomType, isRoomLoadEligibleRoomType } from "./roomTypeRules.js";
import { summarizeSupportAccessPointContract } from "./supportAccessPointContract.js";

export type SupportAccessPointValidationResult = ReturnType<typeof summarizeSupportAccessPointContract> & {
  providerPharmacyExcludedFromAssignment: boolean;
  providerPharmacyExcludedFromRatio: boolean;
  providerPharmacyExcludedFromRoomLoad: boolean;
};

export function validateSupportAccessPointLayout(
  layoutValue: EditableLayoutGeometryContract
): SupportAccessPointValidationResult {
  const layout = validateEditableLayoutGeometryContract(layoutValue);
  const providerPharmacyRooms = layout.rooms.filter((room) => room.roomType === "provider_pharmacy");
  const contract = summarizeSupportAccessPointContract({
    supportAccessPoints: layout.supportAccessPoints ?? [],
    zones: layout.zones,
    patientRoomDoorCount: layout.doors.length
  });
  return {
    ...contract,
    providerPharmacyExcludedFromAssignment: providerPharmacyRooms.every((room) => !isNurseAssignableRoomType(room.roomType)),
    providerPharmacyExcludedFromRatio: providerPharmacyRooms.every((room) => !isRatioCountEligibleRoomType(room.roomType)),
    providerPharmacyExcludedFromRoomLoad: providerPharmacyRooms.every((room) => !isRoomLoadEligibleRoomType(room.roomType))
  };
}
