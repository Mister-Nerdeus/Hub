import type { Plan1AssignmentWarning } from "@nerdeus/shared";

export function AssignmentValidationPanel({ warnings }: { warnings: Plan1AssignmentWarning[] }) {
  return (
    <section className="assignment-panel" aria-labelledby="assignment-validation-title" data-assignment-stage="validation">
      <h3 id="assignment-validation-title">Assignment Warnings</h3>
      {warnings.length === 0 ? <p>No operational assignment warnings.</p> : null}
      <ul className="assignment-warning-list">
        {warnings.map((warning, index) => (
          <li key={`${warning.code}-${index}`} data-warning-code={warning.code} data-warning-severity={warning.severity}>
            <strong>{warning.severity}</strong>
            <span>{warning.code}</span>
            <p>{warning.summary}</p>
          </li>
        ))}
      </ul>
    </section>
  );
}
