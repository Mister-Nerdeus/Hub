import type {
  AssignmentFoundationTargetContract,
  EditableLayoutGeometryContract,
  ManualAssignmentSetContract,
  ManualStaffMemberContract
} from "@nerdeus/shared";
import { AssignmentBadge } from "./AssignmentBadge";

type AssignmentOverlayProps = {
  layout: EditableLayoutGeometryContract | null;
  assignmentTargets: readonly AssignmentFoundationTargetContract[];
  staffMembers: readonly ManualStaffMemberContract[];
  assignmentSet: ManualAssignmentSetContract | null;
  pixelsPerFoot: number;
};

export function AssignmentOverlay({
  layout,
  assignmentTargets,
  staffMembers,
  assignmentSet,
  pixelsPerFoot
}: AssignmentOverlayProps) {
  if (layout == null || assignmentSet == null) return null;
  const staffById = new Map(staffMembers.map((staff) => [staff.staffMemberId, staff]));
  const assignmentsByTargetId = new Map<string, ManualAssignmentSetContract["assignments"]>();
  for (const assignment of assignmentSet.assignments) {
    const assignments = assignmentsByTargetId.get(assignment.assignmentTargetId) ?? [];
    assignments.push(assignment);
    assignmentsByTargetId.set(assignment.assignmentTargetId, assignments);
  }
  return (
    <g className="manual-assignment-overlay" data-manual-assignment-overlay="true">
      {assignmentTargets.map((target) => {
        const position = targetPosition(layout, target, pixelsPerFoot);
        if (position == null) return null;
        const assignments = assignmentsByTargetId.get(target.assignmentTargetId) ?? [];
        const staffLabels = assignments
          .map((assignment) => staffById.get(assignment.staffMemberId)?.displayName ?? null)
          .filter((label): label is string => label != null);
        return (
          <AssignmentBadge
            key={target.assignmentTargetId}
            label={shortTargetLabel(target)}
            staffLabels={staffLabels}
            assignmentState={staffLabels.length === 0 ? "unassigned" : "assigned"}
            x={position.x}
            y={position.y}
          />
        );
      })}
    </g>
  );
}

function shortTargetLabel(target: AssignmentFoundationTargetContract): string {
  if (target.targetKind === "bed_position") {
    const match = target.displayLabel.match(/(\d+[A-Z])$/u);
    return match?.[1] ?? target.displayLabel;
  }
  return target.displayLabel;
}

function targetPosition(
  layout: EditableLayoutGeometryContract,
  target: AssignmentFoundationTargetContract,
  pixelsPerFoot: number
): { x: number; y: number } | null {
  if (target.targetKind === "bed_position") {
    for (const splitRoom of layout.splitRooms ?? []) {
      const bed = splitRoom.bedPositions.find((candidate) => candidate.bedPositionId === target.sourceId);
      const parent = layout.rooms.find((room) => room.id === splitRoom.parentRoomId);
      if (bed != null && parent != null) {
        return {
          x: (parent.xFeet + parent.widthFeet * bed.relativeBounds.xRatio + 0.4) * pixelsPerFoot,
          y: (parent.yFeet + parent.heightFeet * bed.relativeBounds.yRatio + 0.4) * pixelsPerFoot
        };
      }
    }
  }
  const room = layout.rooms.find((candidate) => candidate.id === target.sourceId);
  if (room != null) {
    return {
      x: (room.xFeet + 0.4) * pixelsPerFoot,
      y: (room.yFeet + 0.4) * pixelsPerFoot
    };
  }
  const zone = layout.zones.find((candidate) => candidate.id === target.sourceId);
  if (zone != null) {
    return {
      x: (zone.xFeet + 0.4) * pixelsPerFoot,
      y: (zone.yFeet + 0.4) * pixelsPerFoot
    };
  }
  return null;
}
