import { NurseBurdenTable } from "./NurseBurdenTable";
import type { ManualBurdenRow } from "./manualBurdenViewModel";

type BurdenExplanationPanelProps = {
  rows: ManualBurdenRow[];
};

export function BurdenExplanationPanel({ rows }: BurdenExplanationPanelProps) {
  return (
    <section
      className="manual-assignment-workspace__panel burden-explanation-panel"
      aria-labelledby="burden-explanation-title"
      data-burden-explanation-visible="true"
    >
      <div className="manual-assignment-workspace__panel-header">
        <div>
          <p className="eyebrow">Burden explanation</p>
          <h3 id="burden-explanation-title">Burden Breakdown</h3>
        </div>
      </div>
      <NurseBurdenTable rows={rows} />
    </section>
  );
}
