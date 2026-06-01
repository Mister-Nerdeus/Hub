import type { ManualAssignmentFoundationValidationResult } from "@nerdeus/shared";

export type AssignmentValidationViewModel = {
  title: "Validation";
  items: { code: string; message: string; severity: string }[];
};

export function createAssignmentValidationViewModel(
  result: ManualAssignmentFoundationValidationResult
): AssignmentValidationViewModel {
  return {
    title: "Validation",
    items: result.issues.map((issue) => ({
      code: issue.code,
      message: issue.message,
      severity: issue.severity
    }))
  };
}
