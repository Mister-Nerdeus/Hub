import type { DemoPinGateViewModel } from "./demoPinViewModel";
import { DemoPinGate } from "./DemoPinGate";

type DemoPinEntryScreenProps = {
  viewModel: DemoPinGateViewModel;
  value: string;
  onChange: (value: string) => void;
  onUnlock: () => void;
  onClear: () => void;
};

export function DemoPinEntryScreen({
  viewModel,
  value,
  onChange,
  onUnlock,
  onClear
}: DemoPinEntryScreenProps) {
  return (
    <main className="demo-pin-entry-screen" data-app-lock-state="locked">
      <section className="demo-pin-entry-screen__panel" aria-labelledby="demo-pin-entry-title">
        <p className="eyebrow">{viewModel.productDisplayName}</p>
        <h1 id="demo-pin-entry-title">{viewModel.title}</h1>
        <p className="demo-pin-entry-screen__subtitle">{viewModel.eyebrow}</p>
        <p className="demo-pin-entry-screen__disclaimer">
          {viewModel.caveat}
        </p>
        <DemoPinGate
          viewModel={viewModel}
          value={value}
          onChange={onChange}
          onUnlock={onUnlock}
          onClear={onClear}
        />
      </section>
    </main>
  );
}
