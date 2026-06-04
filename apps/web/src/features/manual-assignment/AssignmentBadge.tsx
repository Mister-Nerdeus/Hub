type AssignmentBadgeProps = {
  label: string;
  staffLabels: readonly string[];
  assignmentState: "assigned" | "unassigned";
  x: number;
  y: number;
};

export function AssignmentBadge({ label, staffLabels, assignmentState, x, y }: AssignmentBadgeProps) {
  const badgeText = staffLabels.length === 0
    ? `${label}: Unassigned`
    : staffLabels.length === 1
      ? `${label}: ${staffLabels[0]}`
      : `${label}: ${staffLabels[0]} +${staffLabels.length - 1}`;
  const fullText = staffLabels.length <= 1 ? badgeText : `${label}: ${staffLabels.join(", ")}`;
  return (
    <g
      className="manual-assignment-overlay__badge"
      data-manual-assignment-badge="true"
      data-manual-assignment-state={assignmentState}
      data-manual-assignment-label={label}
      data-manual-assignment-staff-count={staffLabels.length}
    >
      <title>{fullText}</title>
      <rect x={x} y={y} width={118} height={28} rx={4} />
      <text x={x + 8} y={y + 18}>
        {badgeText}
      </text>
    </g>
  );
}
