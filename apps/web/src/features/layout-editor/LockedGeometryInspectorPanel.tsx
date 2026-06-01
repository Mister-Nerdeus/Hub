import type { LayoutInspectorViewModel } from "./layoutInspectorViewModel";

export type LockedGeometryInspectorPanelProps = {
  viewModel: LayoutInspectorViewModel;
};

export function LockedGeometryInspectorPanel({ viewModel }: LockedGeometryInspectorPanelProps) {
  if (!viewModel.lockedGeometry.locked) {
    return null;
  }
  return (
    <aside
      className="locked-geometry-inspector-panel"
      data-locked-geometry-inspector="true"
      data-locked-geometry-selectable="true"
      data-move-controls-visible="false"
      data-delete-controls-visible="false"
      aria-label="Locked geometry inspector"
    >
      <header>
        <p className="eyebrow">Locked geometry</p>
        <h4>{viewModel.title}</h4>
      </header>
      <p>{viewModel.lockedGeometry.reason}</p>
      <dl>
        <div>
          <dt>Selectable</dt>
          <dd>Yes</dd>
        </div>
        <div>
          <dt>Move / delete</dt>
          <dd>Unavailable</dd>
        </div>
      </dl>
    </aside>
  );
}
