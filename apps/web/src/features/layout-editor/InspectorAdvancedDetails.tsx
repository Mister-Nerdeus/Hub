import type { LayoutInspectorViewModel } from "./layoutInspectorViewModel";

export type InspectorAdvancedDetailsProps = {
  viewModel: LayoutInspectorViewModel;
};

export function InspectorAdvancedDetails({ viewModel }: InspectorAdvancedDetailsProps) {
  return (
    <dl
      className="inspector-advanced-details"
      aria-label="Advanced inspector details"
      data-technical-inspector-fields-advanced="true"
    >
      <div>
        <dt>Object ID</dt>
        <dd>{viewModel.objectId ?? "none"}</dd>
      </div>
      <div>
        <dt>Source units</dt>
        <dd>{viewModel.sourceUnits}</dd>
      </div>
      <div>
        <dt>Object type</dt>
        <dd>{viewModel.objectType ?? "none"}</dd>
      </div>
      <div>
        <dt>Raw validation state</dt>
        <dd>{viewModel.status}</dd>
      </div>
    </dl>
  );
}
