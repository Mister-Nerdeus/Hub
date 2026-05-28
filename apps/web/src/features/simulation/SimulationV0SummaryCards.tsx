import type { SimulationV0SummaryCardsViewModel } from "./simulationV0SummaryCardsViewModel";

type Props = {
  viewModel: SimulationV0SummaryCardsViewModel;
};

export function SimulationV0SummaryCards({ viewModel }: Props) {
  return (
    <section className="simulation-v0-section" aria-labelledby="simulation-v0-summary-cards-title">
      <div className="simulation-v0-section__header">
        <div>
          <h3 id="simulation-v0-summary-cards-title">Queue placeholder summary</h3>
          <p>{viewModel.profileId} / {viewModel.ratioView}</p>
        </div>
      </div>
      <dl className="simulation-v0-summary-cards">
        {viewModel.cards.map((card) => (
          <div key={card.label}>
            <dt>{card.label}</dt>
            <dd>{card.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
