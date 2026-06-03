import type { RouteGraphContract } from "../floorplans/routeGraphContract.js";
import {
  validateAssignmentTargetConnectivity,
  type AssignmentTargetValidationResult
} from "./assignmentTargetValidation.js";
import type { AssignmentTargetContract } from "./assignmentTargetContract.js";
import type { ManualStaffMemberContract } from "./manualStaffMemberContract.js";
import {
  validateManualAssignmentSetContract,
  type ManualAssignmentContract,
  type ManualAssignmentSetContract
} from "./manualAssignmentSetContract.js";

export type ManualAssignmentValidationSeverity = "error" | "warning";

export type ManualAssignmentValidationIssue = {
  severity: ManualAssignmentValidationSeverity;
  code:
    | "missing_staff_member"
    | "missing_assignment_target"
    | "inactive_staff_member"
    | "inactive_assignment_target"
    | "duplicate_assignment"
    | "multiple_staff_on_restricted_target"
    | "target_not_found_in_active_floorplan"
    | "split_bed_target_not_found"
    | "target_not_connected_in_route_graph";
  message: string;
  assignmentId?: string;
};

export type ManualAssignmentValidationResult = {
  status: "passed" | "failed";
  issues: ManualAssignmentValidationIssue[];
  targetResults: AssignmentTargetValidationResult[];
};

export function validateManualAssignmentSetReferences(input: {
  assignmentSet: ManualAssignmentSetContract;
  staffMembers: readonly ManualStaffMemberContract[];
  assignmentTargets: readonly AssignmentTargetContract[];
  routeGraph?: RouteGraphContract | null;
}): ManualAssignmentValidationResult {
  const assignmentSet = validateManualAssignmentSetContract(input.assignmentSet);
  const staffById = new Map(input.staffMembers.map((staff) => [staff.staffMemberId, staff]));
  const targetsById = new Map(input.assignmentTargets.map((target) => [target.assignmentTargetId, target]));
  const activeTargetIds = new Set(input.assignmentTargets.map((target) => target.assignmentTargetId));
  const issues: ManualAssignmentValidationIssue[] = [];
  const seenExactAssignments = new Set<string>();
  const assignmentsByTargetId = new Map<string, ManualAssignmentContract[]>();
  const targetResults: AssignmentTargetValidationResult[] = [];

  for (const assignment of assignmentSet.assignments) {
    const targetAssignments = assignmentsByTargetId.get(assignment.assignmentTargetId) ?? [];
    targetAssignments.push(assignment);
    assignmentsByTargetId.set(assignment.assignmentTargetId, targetAssignments);

    const duplicateKey = exactAssignmentKey(assignment);
    if (seenExactAssignments.has(duplicateKey)) {
      issues.push(issue("warning", "duplicate_assignment", "Duplicate assignment", assignment.assignmentId));
    }
    seenExactAssignments.add(duplicateKey);

    const staff = staffById.get(assignment.staffMemberId);
    if (staff == null) {
      issues.push(issue("error", "missing_staff_member", "Missing staff member", assignment.assignmentId));
    } else if (!staff.active) {
      issues.push(issue("warning", "inactive_staff_member", "Inactive staff member", assignment.assignmentId));
    }

    const target = targetsById.get(assignment.assignmentTargetId) ?? null;
    if (target == null) {
      issues.push(issue("error", "missing_assignment_target", "Missing assignment target", assignment.assignmentId));
      if (assignment.assignmentTargetKind === "bed_position") {
        issues.push(issue("error", "split_bed_target_not_found", "Split bed target not found", assignment.assignmentId));
      }
      continue;
    }
    if (!target.active) {
      issues.push(issue("warning", "inactive_assignment_target", "Inactive assignment target", assignment.assignmentId));
    }
    const targetResult = validateAssignmentTargetConnectivity({
      target,
      activeTargetIds,
      routeGraph: input.routeGraph
    });
    targetResults.push(targetResult);
    for (const message of targetResult.messages) {
      if (message === "Target not found in active floorplan") {
        issues.push(issue("error", "target_not_found_in_active_floorplan", message, assignment.assignmentId));
      }
      if (message === "Assignment target not connected in route graph") {
        issues.push(issue("warning", "target_not_connected_in_route_graph", message, assignment.assignmentId));
      }
      if (message === "Inactive assignment target") {
        issues.push(issue("warning", "inactive_assignment_target", message, assignment.assignmentId));
      }
    }
  }

  for (const [assignmentTargetId, targetAssignments] of assignmentsByTargetId) {
    if (targetAssignments.length <= 1) continue;
    const target = targetsById.get(assignmentTargetId) ?? null;
    const targetKind = target?.targetKind ?? targetAssignments[0]?.assignmentTargetKind ?? null;
    if (targetKind === "room" || targetKind === "bed_position" || targetKind === "hall_bed") {
      issues.push(issue(
        "warning",
        "multiple_staff_on_restricted_target",
        "Multiple manual staff on one target",
        targetAssignments[0]?.assignmentId
      ));
    }
  }

  return {
    status: issues.some((candidate) => candidate.severity === "error") ? "failed" : "passed",
    issues,
    targetResults
  };
}

function exactAssignmentKey(assignment: ManualAssignmentContract): string {
  return `${assignment.staffMemberId}\u0000${assignment.assignmentTargetId}`;
}

function issue(
  severity: ManualAssignmentValidationSeverity,
  code: ManualAssignmentValidationIssue["code"],
  message: string,
  assignmentId?: string
): ManualAssignmentValidationIssue {
  return {
    severity,
    code,
    message,
    ...(assignmentId == null ? {} : { assignmentId })
  };
}
