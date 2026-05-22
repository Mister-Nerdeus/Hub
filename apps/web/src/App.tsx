const statusItems = [
  "Repo contracts active",
  "API health endpoint ready",
  "Shared fixture parity enabled",
  "Non-PHI scanner configured"
];

export function App() {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

  return (
    <main className="app-shell">
      <section className="workspace-header" aria-labelledby="page-title">
        <div>
          <p className="eyebrow">Operational simulation workspace</p>
          <h1 id="page-title">Nerdeus ER Pod Shift Simulator</h1>
          <p className="lede">
            Foundation shell for room layouts, abstract room load, assignment scoring, and reproducible simulation evidence.
          </p>
        </div>
        <div className="api-pill" aria-label="Configured API base URL">
          <span>API</span>
          <strong>{apiBaseUrl}</strong>
        </div>
      </section>

      <section className="status-grid" aria-label="Foundation status">
        {statusItems.map((item) => (
          <article className="status-card" key={item}>
            <span className="status-dot" aria-hidden="true" />
            <p>{item}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
