import type { EditableDoorWall } from "@nerdeus/shared";
import type { AdjacentDoorCandidateViewModel } from "./adjacentDoorCandidateViewModel";

export type AdjacentDoorCandidateSelectorProps = {
  viewModel: AdjacentDoorCandidateViewModel;
  selectedRoomId?: string | null;
  onSelectCandidate: (roomId: string, wall: EditableDoorWall, offsetFeet: number) => void;
};

export function AdjacentDoorCandidateSelector({
  viewModel,
  selectedRoomId = null,
  onSelectCandidate
}: AdjacentDoorCandidateSelectorProps) {
  const selectedCandidate = viewModel.candidates.find((candidate) => candidate.roomId === selectedRoomId) ?? null;
  return (
    <div
      className="adjacent-door-candidate-selector"
      data-adjacent-door-candidate-selector={viewModel.status}
    >
      <label>
        Adjacent room candidate
        <select
          aria-label="Adjacent room candidate"
          disabled={viewModel.readOnly || viewModel.candidates.length === 0}
          value={selectedCandidate?.roomId ?? ""}
          onChange={(event) => {
            if (event.currentTarget.value === "") {
              return;
            }
            const candidate = viewModel.candidates.find((item) => item.roomId === event.currentTarget.value);
            if (candidate != null && !candidate.disabled) {
              onSelectCandidate(candidate.roomId, candidate.wall, candidate.previewOffsetFeet);
            }
          }}
        >
          <option value="">Select candidate...</option>
          {viewModel.candidates.map((candidate) => (
            <option key={candidate.roomId} value={candidate.roomId} disabled={candidate.disabled}>
              {candidate.roomLabel} / {candidate.wall} / {candidate.relationshipLabel}
              {candidate.disabled && candidate.disabledReason != null ? ` - ${candidate.disabledReason}` : ""}
            </option>
          ))}
        </select>
      </label>
      {selectedCandidate == null ? (
        <p className="adjacent-door-candidate-selector__reason">
          {viewModel.disabledReason ?? "Select an adjacent room candidate."}
        </p>
      ) : (
        <dl>
          <div>
            <dt>Candidate wall</dt>
            <dd>{selectedCandidate.wall}</dd>
          </div>
          <div>
            <dt>Relationship</dt>
            <dd>{selectedCandidate.relationshipLabel}</dd>
          </div>
          <div>
            <dt>Preview offset</dt>
            <dd>{selectedCandidate.previewOffsetFeet} ft</dd>
          </div>
        </dl>
      )}
    </div>
  );
}
