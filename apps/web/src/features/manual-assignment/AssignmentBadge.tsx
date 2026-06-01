type AssignmentBadgeProps = {
  label: string;
  staffLabel: string | null;
  x: number;
  y: number;
};

export function AssignmentBadge({ label, staffLabel, x, y }: AssignmentBadgeProps) {
  return (
    <g
      className="manual-assignment-overlay__badge"
      data-manual-assignment-badge="true"
      data-manual-assignment-label={label}
    >
      <rect x={x} y={y} width={118} height={28} rx={4} />
      <text x={x + 8} y={y + 18}>
        {staffLabel == null ? `${label}: Unassigned` : `${label}: ${staffLabel}`}
      </text>
    </g>
  );
}
