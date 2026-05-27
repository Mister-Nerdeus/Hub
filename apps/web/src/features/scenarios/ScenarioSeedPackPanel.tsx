import type { Plan1DemoSeedPack } from "@nerdeus/shared";
import { Plan1DemoSeedPanel } from "../demo/Plan1DemoSeedPanel";

type ScenarioSeedPackPanelProps = {
  seedPack: Plan1DemoSeedPack;
};

export function ScenarioSeedPackPanel({ seedPack }: ScenarioSeedPackPanelProps) {
  return (
    <details className="scenario-seed-pack-panel" data-seed-pack-placement="advanced-evidence">
      <summary>Scenario seed pack evidence</summary>
      <Plan1DemoSeedPanel seedPack={seedPack} />
    </details>
  );
}
