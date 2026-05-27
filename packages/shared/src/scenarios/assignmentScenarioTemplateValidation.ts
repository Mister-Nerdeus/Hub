import {
  ASSIGNMENT_TEMPLATE_SCHEMA_VERSION,
  CANONICAL_SCENARIO_ROOM_IDS,
  type AssignmentScenarioNurseGroup,
  type AssignmentScenarioTemplateContract,
  type CanonicalScenarioRoomId
} from "./assignmentScenarioTemplateContract.js";
import { NURSE_RATIO_IDS, type NurseRatioId } from "./nurseRatioContract.js";
import { CANONICAL_ER_POD_FLOORPLAN_ID } from "./scenarioSeedContract.js";
import {
  assertScenarioUnique,
  requireScenarioArray,
  requireScenarioEnum,
  requireScenarioExactKeys,
  requireScenarioLiteralTrue,
  requireScenarioRecord,
  requireScenarioString
} from "./scenarioValidationUtils.js";

const assignmentTemplateKeys = [
  "schemaVersion",
  "assignmentTemplateId",
  "label",
  "canonicalFloorplanId",
  "ratioConfigurationId",
  "nurseGroups",
  "syntheticDataOnly"
] as const;
const nurseGroupKeys = [
  "nurseGroupId",
  "syntheticNurseLabel",
  "roomIds",
  "syntheticDataOnly"
] as const;
const syntheticNurseLabels = [
  "Nurse Blue",
  "Nurse Green",
  "Nurse Purple",
  "Nurse Orange",
  "Nurse Teal",
  "Nurse Slate",
  "Nurse Cyan",
  "Nurse Gold"
] as const;

export function validateAssignmentScenarioTemplateContract(
  value: unknown
): AssignmentScenarioTemplateContract {
  const record = requireScenarioRecord(value, "assignmentTemplate");
  requireScenarioExactKeys(record, "assignmentTemplate", assignmentTemplateKeys);
  if (record.schemaVersion !== ASSIGNMENT_TEMPLATE_SCHEMA_VERSION) {
    throw new Error("assignmentTemplate.schemaVersion is unsupported");
  }
  if (record.canonicalFloorplanId !== CANONICAL_ER_POD_FLOORPLAN_ID) {
    throw new Error("assignmentTemplate.canonicalFloorplanId must reference the canonical ER pod floorplan");
  }
  const ratioConfigurationId = requireScenarioEnum(
    record.ratioConfigurationId,
    NURSE_RATIO_IDS,
    "assignmentTemplate.ratioConfigurationId"
  );
  const nurseGroups = requireScenarioArray(record.nurseGroups, "assignmentTemplate.nurseGroups").map(
    (group, index) => validateAssignmentScenarioNurseGroup(group, index, ratioConfigurationId)
  );
  assertScenarioUnique(nurseGroups.map((group) => group.nurseGroupId), "nurse group IDs");
  const roomIds = nurseGroups.flatMap((group) => group.roomIds);
  assertScenarioUnique(roomIds, "assignment template room IDs");
  return {
    schemaVersion: ASSIGNMENT_TEMPLATE_SCHEMA_VERSION,
    assignmentTemplateId: requireScenarioString(record.assignmentTemplateId, "assignmentTemplate.assignmentTemplateId"),
    label: requireScenarioString(record.label, "assignmentTemplate.label"),
    canonicalFloorplanId: CANONICAL_ER_POD_FLOORPLAN_ID,
    ratioConfigurationId,
    nurseGroups,
    syntheticDataOnly: requireScenarioLiteralTrue(record.syntheticDataOnly, "assignmentTemplate.syntheticDataOnly")
  };
}

function validateAssignmentScenarioNurseGroup(
  value: unknown,
  index: number,
  ratioConfigurationId: NurseRatioId
): AssignmentScenarioNurseGroup {
  const label = `assignmentTemplate.nurseGroups[${index}]`;
  const record = requireScenarioRecord(value, label);
  requireScenarioExactKeys(record, label, nurseGroupKeys);
  const roomIds = requireScenarioArray(record.roomIds, `${label}.roomIds`).map((roomId, roomIndex) =>
    requireScenarioEnum(roomId, CANONICAL_SCENARIO_ROOM_IDS, `${label}.roomIds[${roomIndex}]`)
  ) as CanonicalScenarioRoomId[];
  if (roomIds.length === 0) {
    throw new Error(`${label}.roomIds must include at least one canonical room`);
  }
  const maxRooms = ratioConfigurationId === "four_to_one" ? 4 : 3;
  if (roomIds.length > maxRooms) {
    throw new Error(`${label}.roomIds exceeds ${ratioConfigurationId} ratio capacity`);
  }
  return {
    nurseGroupId: requireScenarioString(record.nurseGroupId, `${label}.nurseGroupId`),
    syntheticNurseLabel: requireScenarioEnum(record.syntheticNurseLabel, syntheticNurseLabels, `${label}.syntheticNurseLabel`),
    roomIds,
    syntheticDataOnly: requireScenarioLiteralTrue(record.syntheticDataOnly, `${label}.syntheticDataOnly`)
  };
}
