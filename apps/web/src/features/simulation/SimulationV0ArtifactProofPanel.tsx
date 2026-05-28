import type { SimulationV0ArtifactProofViewModel } from "./simulationV0ArtifactProofViewModel";

type Props = {
  viewModel: SimulationV0ArtifactProofViewModel;
};

export function SimulationV0ArtifactProofPanel({ viewModel }: Props) {
  return (
    <section className="simulation-v0-section" aria-labelledby="simulation-v0-artifact-proof-title">
      <div className="simulation-v0-section__header">
        <div>
          <h3 id="simulation-v0-artifact-proof-title">Artifact hash proof</h3>
          <p>{viewModel.reproducibilityStatus.replaceAll("_", " ")}</p>
        </div>
      </div>
      <dl className="simulation-v0-panel__artifact">
        <div>
          <dt>Artifact ID</dt>
          <dd>{viewModel.artifactId}</dd>
        </div>
        <div>
          <dt>Run ID</dt>
          <dd>{viewModel.runId}</dd>
        </div>
        <div>
          <dt>Stable hash</dt>
          <dd>{viewModel.stableArtifactHash}</dd>
        </div>
        <div>
          <dt>Workload seed</dt>
          <dd>{viewModel.neutralWorkloadSeed}</dd>
        </div>
        <div>
          <dt>Runtime seed</dt>
          <dd>{viewModel.ratioRuntimeSeed}</dd>
        </div>
        <div>
          <dt>Hash metadata policy</dt>
          <dd>{viewModel.hashExcludesNondeterministicMetadata ? "excludes variable metadata" : "blocked"}</dd>
        </div>
      </dl>
    </section>
  );
}
