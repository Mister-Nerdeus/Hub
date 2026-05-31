import type { LayoutInspectorViewModel } from "./layoutInspectorViewModel";

export type InspectorAdvancedDetailsProps = {
  viewModel: LayoutInspectorViewModel;
};

export function InspectorAdvancedDetails({ viewModel }: InspectorAdvancedDetailsProps) {
  return (
    <div data-technical-inspector-fields-advanced="true">
      {viewModel.advancedSections.map((section) => (
        <section key={section.title} className="inspector-advanced-details__section">
          <h4>{section.title}</h4>
          <dl className="inspector-advanced-details" aria-label="Advanced inspector details">
            {section.fields.map((field) => (
              <div key={field.label}>
                <dt>{field.label}</dt>
                <dd>{field.value}</dd>
              </div>
            ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
