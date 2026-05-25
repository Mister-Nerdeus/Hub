import type { Plan1AssignmentWalkingPreview } from "@nerdeus/shared";

export function AssignmentWalkingPreview({ preview }: { preview: Plan1AssignmentWalkingPreview }) {
  return (
    <div className="assignment-walking-preview" data-assignment-stage="walking-preview">
      <dl>
        <div><dt>Approx feet</dt><dd>{preview.totalApproxDistanceFeet}</dd></div>
        <div><dt>Approx seconds</dt><dd>{preview.totalApproxTravelSeconds}</dd></div>
        <div><dt>Unreachable</dt><dd>{preview.unreachableRoomCount}</dd></div>
      </dl>
      <p>{preview.limitations.join(" ")}</p>
    </div>
  );
}
