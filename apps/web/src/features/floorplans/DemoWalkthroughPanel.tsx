import type { DemoWalkthroughViewModel } from "./demoWalkthroughViewModel";

type DemoWalkthroughPanelProps = {
  viewModel: DemoWalkthroughViewModel;
};

export function DemoWalkthroughPanel({ viewModel }: DemoWalkthroughPanelProps) {
  return (
    <section className="demo-walkthrough" aria-labelledby="demo-walkthrough-title">
      <div>
        <p className="eyebrow">Demo walkthrough</p>
        <h3 id="demo-walkthrough-title">Operational Demo Flow</h3>
      </div>
      <ol>
        {viewModel.steps.map((step) => (
          <li key={step.label}>
            <strong>{step.label}</strong>
            <span>{step.status}</span>
          </li>
        ))}
      </ol>
      <ul>
        {viewModel.limitations.map((limitation) => <li key={limitation}>{limitation}</li>)}
      </ul>
    </section>
  );
}
