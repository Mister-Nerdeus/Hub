import type { LayoutInspectorViewModel } from "./layoutInspectorViewModel";

type InspectorAdvancedDetailsProps = {
  viewModel: LayoutInspectorViewModel;
};

export function InspectorAdvancedDetails({ viewModel }: InspectorAdvancedDetailsProps) {
  return (
    <details
      className="layout-inspector-panel__advanced"
      data-inspector-advanced-details="technical-fields"
    >
      <summary>Advanced</summary>
      <dl>
        <div>
          <dt>Object ID</dt>
          <dd>{viewModel.objectId ?? "none"}</dd>
        </div>
        <div>
          <dt>Source units</dt>
          <dd>{viewModel.sourceUnits}</dd>
        </div>
        <div>
          <dt>Raw validation</dt>
          <dd>{viewModel.status}</dd>
        </div>
        <div>
          <dt>Record IDs</dt>
          <dd>{viewModel.objectType ?? "none"}</dd>
        </div>
      </dl>
    </details>
  );
}
