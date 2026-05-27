import { PRODUCT_DISPLAY_NAME } from "@nerdeus/shared";
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
        <p className="eyebrow">{PRODUCT_DISPLAY_NAME}</p>
        <h1 id="demo-pin-entry-title">{PRODUCT_DISPLAY_NAME}</h1>
        <p className="demo-pin-entry-screen__disclaimer">
          Demo-only PIN screen for synthetic operational modeling. PIN 2026 is not production
          authentication, real security, or PHI protection.
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
