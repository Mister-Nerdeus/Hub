import type { EditableDoorWall } from "@nerdeus/shared";

export type SupportAccessQuickEditViewModel = {
  status: "missing" | "ready";
  accessPointId: string | null;
  label: string;
  ownerId: string | null;
  wall: EditableDoorWall | null;
  offsetFeet: number | null;
  widthFeet: number | null;
  readOnly: boolean;
};

export function buildSupportAccessQuickEdit(input: {
  accessPoint: {
    id: string;
    label: string;
    ownerId: string;
    wall: EditableDoorWall;
    offsetFeet: number;
    widthFeet: number;
  } | null;
  readOnly: boolean;
}): SupportAccessQuickEditViewModel {
  if (input.accessPoint == null) {
    return {
      status: "missing",
      accessPointId: null,
      label: "No support access selected",
      ownerId: null,
      wall: null,
      offsetFeet: null,
      widthFeet: null,
      readOnly: true
    };
  }
  return {
    status: "ready",
    accessPointId: input.accessPoint.id,
    label: input.accessPoint.label,
    ownerId: input.accessPoint.ownerId,
    wall: input.accessPoint.wall,
    offsetFeet: input.accessPoint.offsetFeet,
    widthFeet: input.accessPoint.widthFeet,
    readOnly: input.readOnly
  };
}

const WALLS: readonly EditableDoorWall[] = ["north", "south", "east", "west"];

export function SupportAccessQuickEditPopover({
  viewModel,
  onWallChange,
  onNudge,
  onWidthStep,
  onDelete
}: {
  viewModel: SupportAccessQuickEditViewModel;
  onWallChange: (wall: EditableDoorWall) => void;
  onNudge: (deltaFeet: number) => void;
  onWidthStep: (deltaFeet: number) => void;
  onDelete: () => void;
}) {
  if (viewModel.status !== "ready" || viewModel.wall == null) {
    return <p>No support access selected.</p>;
  }
  return (
    <div className="support-access-quick-edit-popover" data-support-access-quick-edit="ready">
      <dl>
        <div>
          <dt>Owner zone</dt>
          <dd>{viewModel.ownerId}</dd>
        </div>
        <div>
          <dt>Offset</dt>
          <dd>{viewModel.offsetFeet} ft</dd>
        </div>
        <div>
          <dt>Width</dt>
          <dd>{viewModel.widthFeet} ft</dd>
        </div>
      </dl>
      <label>
        Wall
        <select
          value={viewModel.wall}
          disabled={viewModel.readOnly}
          onChange={(event) => onWallChange(event.currentTarget.value as EditableDoorWall)}
        >
          {WALLS.map((wall) => (
            <option key={wall} value={wall}>
              {wall}
            </option>
          ))}
        </select>
      </label>
      <div className="support-access-quick-edit-popover__actions">
        <button type="button" disabled={viewModel.readOnly} onClick={() => onNudge(-1)}>
          Nudge -
        </button>
        <button type="button" disabled={viewModel.readOnly} onClick={() => onNudge(1)}>
          Nudge +
        </button>
        <button type="button" disabled={viewModel.readOnly} onClick={() => onWidthStep(-1)}>
          Width -
        </button>
        <button type="button" disabled={viewModel.readOnly} onClick={() => onWidthStep(1)}>
          Width +
        </button>
        <button type="button" disabled={viewModel.readOnly} onClick={onDelete}>
          Delete access
        </button>
      </div>
    </div>
  );
}
