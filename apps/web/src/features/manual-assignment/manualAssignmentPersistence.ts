import {
  validateManualAssignmentSetContract,
  type ManualAssignmentSetContract
} from "@nerdeus/shared";

export function serializeManualAssignmentSet(assignmentSet: ManualAssignmentSetContract): string {
  return JSON.stringify(validateManualAssignmentSetContract(assignmentSet));
}

export function parseManualAssignmentSet(text: string): ManualAssignmentSetContract {
  return validateManualAssignmentSetContract(JSON.parse(text));
}

export function cloneManualAssignmentSet(assignmentSet: ManualAssignmentSetContract): ManualAssignmentSetContract {
  return parseManualAssignmentSet(serializeManualAssignmentSet(assignmentSet));
}
