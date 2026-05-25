import type { Plan1ManualAssignmentRecord, Plan1NurseProfile, PlanContract } from "@nerdeus/shared";

export function AssignmentPaintMode({
  plan,
  nurses,
  assignments,
  selectedNurseId,
  onSelectNurse,
  onToggleRoom
}: {
  plan: PlanContract;
  nurses: Plan1NurseProfile[];
  assignments: Plan1ManualAssignmentRecord[];
  selectedNurseId: string;
  onSelectNurse: (nurseId: string) => void;
  onToggleRoom: (roomId: string) => void;
}) {
  const primaryByRoomId = new Map(
    assignments.filter((assignment) => assignment.assignmentType === "primary").map((assignment) => [assignment.roomId, assignment])
  );
  return (
    <section className="assignment-panel" aria-labelledby="assignment-paint-title" data-assignment-stage="manual-assignment">
      <h3 id="assignment-paint-title">Manual Room Assignment</h3>
      <div className="assignment-nurse-picker" aria-label="Selected nurse">
        {nurses.map((nurse) => (
          <button
            className={nurse.nurseId === selectedNurseId ? "assignment-chip assignment-chip--selected" : "assignment-chip"}
            type="button"
            key={nurse.nurseId}
            onClick={() => onSelectNurse(nurse.nurseId)}
          >
            {nurse.displayName}
          </button>
        ))}
      </div>
      <div className="assignment-room-grid">
        {plan.rooms.map((room) => {
          const assignment = primaryByRoomId.get(room.id);
          const nurse = nurses.find((candidate) => candidate.nurseId === assignment?.nurseId);
          return (
            <button
              className="assignment-room-tile"
              type="button"
              key={room.id}
              data-room-id={room.id}
              data-assigned-nurse-id={assignment?.nurseId ?? ""}
              onClick={() => onToggleRoom(room.id)}
              style={{ borderColor: nurse?.color ?? undefined }}
            >
              <strong>{room.label}</strong>
              <span>{nurse?.displayName ?? "Unassigned"}</span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
