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
  const selectedCandidate = viewModel.candidates.find((candidate) => candidate.roomId === selectedRoomId)
    ?? viewModel.candidates[0]
    ?? null;
  return (
    <div
      className="adjacent-door-candidate-selector"
      data-adjacent-door-candidate-selector={viewModel.status}
    >
      <label>
        Adjacent room candidate
        <select
          aria-label="Adjacent room candidate"
          disabled={viewModel.readOnly || selectedCandidate == null}
          value={selectedCandidate?.roomId ?? ""}
          onChange={(event) => {
            const candidate = viewModel.candidates.find((item) => item.roomId === event.currentTarget.value);
            if (candidate != null) {
              onSelectCandidate(candidate.roomId, candidate.wall, candidate.previewOffsetFeet);
            }
          }}
        >
          {viewModel.candidates.map((candidate) => (
            <option key={candidate.roomId} value={candidate.roomId}>
              {candidate.roomLabel} / {candidate.wall} / {candidate.relationshipLabel}
            </option>
          ))}
        </select>
      </label>
      {selectedCandidate == null ? (
        <p className="adjacent-door-candidate-selector__reason">{viewModel.disabledReason}</p>
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
