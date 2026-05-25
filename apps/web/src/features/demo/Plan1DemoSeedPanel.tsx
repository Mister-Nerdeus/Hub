import type { Plan1DemoSeedPack } from "@nerdeus/shared";
import { buildPlan1DemoSeedPackSummary } from "@nerdeus/shared";

type Plan1DemoSeedPanelProps = {
  seedPack: Plan1DemoSeedPack;
};

export function Plan1DemoSeedPanel({ seedPack }: Plan1DemoSeedPanelProps) {
  const summary = buildPlan1DemoSeedPackSummary(seedPack);

  return (
    <section
      className="plan-1-demo-seed-panel"
      aria-labelledby="plan-1-demo-seed-panel-title"
      data-demo-seed-panel="plan-1"
      data-demo-seed-count={summary.seedCount}
    >
      <div className="plan-1-demo-seed-panel__header">
        <div>
          <p className="eyebrow">Deterministic seed pack</p>
          <h3 id="plan-1-demo-seed-panel-title">Plan 1 demo seeds</h3>
        </div>
        <span>synthetic data only</span>
      </div>

      <div className="plan-1-demo-seed-panel__grid">
        {seedPack.seeds.map((seed) => (
          <article
            className="plan-1-demo-seed-card"
            key={seed.demoSeedId}
            data-demo-seed={seed.demoSeedId}
          >
            <div>
              <strong>{seed.label}</strong>
              <p>{seed.description}</p>
            </div>
            <dl>
              <div>
                <dt>Profile</dt>
                <dd>{seed.profileId}</dd>
              </div>
              <div>
                <dt>Seed</dt>
                <dd>{seed.seed}</dd>
              </div>
              <div>
                <dt>Duration</dt>
                <dd>{seed.durationMinutes} minutes</dd>
              </div>
            </dl>
            <ul aria-label={`${seed.label} expected signals`}>
              {seed.expectedSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </article>
        ))}
      </div>

      <div className="plan-1-demo-seed-panel__notes">
        <section aria-labelledby="plan-1-demo-seed-limitations-title">
          <h4 id="plan-1-demo-seed-limitations-title">Limitations</h4>
          <ul>
            {summary.limitations.map((limitation) => (
              <li key={limitation}>{limitation}</li>
            ))}
          </ul>
        </section>
        <section
          aria-labelledby="plan-1-demo-seed-non-claims-title"
          data-demo-seed-non-claims="visible"
        >
          <h4 id="plan-1-demo-seed-non-claims-title">Non-claims</h4>
          <ul>
            {summary.nonClaims.map((claim) => (
              <li key={claim}>{claim}</li>
            ))}
          </ul>
        </section>
      </div>
    </section>
  );
}
