import type { SimulationV0SummaryCardsViewModel } from "./simulationV0SummaryCardsViewModel";
import { simulationV0Copy } from "./simulationV0Copy";
import "./simulationV0SummaryCardStyles.css";

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
          <p>{simulationV0Copy.summaryCardsExplanation}</p>
        </div>
      </div>
      <p className="simulation-v0-summary-cards__note">{viewModel.note}</p>
      <div className="simulation-v0-summary-card-groups">
        {viewModel.groups.map((group) => (
          <section className="simulation-v0-summary-card-group" key={group.id} aria-labelledby={`simulation-v0-summary-group-${group.id}`}>
            <div className="simulation-v0-summary-card-group__header">
              <h4 id={`simulation-v0-summary-group-${group.id}`}>{group.title}</h4>
              <p>{group.note}</p>
            </div>
            <dl className="simulation-v0-summary-cards">
              {group.cards.map((card) => (
                <div key={card.label} data-source={card.source}>
                  <dt>{card.label}</dt>
                  <dd>{card.value}</dd>
                </div>
              ))}
            </dl>
          </section>
        ))}
      </div>
    </section>
  );
}
