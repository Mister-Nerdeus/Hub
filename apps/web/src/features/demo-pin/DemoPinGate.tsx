import type { DemoPinGateViewModel } from "./demoPinViewModel";

type DemoPinGateProps = {
  viewModel: DemoPinGateViewModel;
  value: string;
  onChange: (value: string) => void;
  onUnlock: () => void;
  onClear: () => void;
};

export function DemoPinGate({
  viewModel,
  value,
  onChange,
  onUnlock,
  onClear
}: DemoPinGateProps) {
  return (
    <section
      className="demo-pin-gate"
      aria-labelledby="demo-pin-gate-title"
      data-demo-pin-state={viewModel.stateLabel.toLowerCase()}
      data-demo-pin-countdown={viewModel.countdownLabel == null ? "none" : "visible"}
    >
      <div className="demo-pin-gate__copy">
        <p className="eyebrow">Demo-only entry gate</p>
        <h2 id="demo-pin-gate-title">{viewModel.title}</h2>
        <p>{viewModel.copy}</p>
      </div>
      <form
        className="demo-pin-gate__form"
        onSubmit={(event) => {
          event.preventDefault();
          onUnlock();
        }}
      >
        <label>
          <span>{viewModel.inputLabel}</span>
          <input
            aria-label={viewModel.inputLabel}
            inputMode="numeric"
            type="password"
            value={value}
            disabled={viewModel.inputDisabled}
            onChange={(event) => onChange(event.currentTarget.value)}
          />
        </label>
        <button type="submit" disabled={!viewModel.canSubmit}>{viewModel.unlockLabel}</button>
        <button type="button" onClick={onClear}>{viewModel.clearLabel}</button>
      </form>
      <p className="demo-pin-gate__status" role="status">
        <span>{viewModel.stateLabel}</span>
        <span>{viewModel.message}</span>
        {viewModel.countdownLabel == null ? null : <span>{viewModel.countdownLabel}</span>}
      </p>
      <ul className="demo-pin-gate__actions" aria-label="Protected demo actions">
        {viewModel.protectedActions.map((action) => (
          <li key={action.actionId}>
            <button type="button" data-protected-action-id={action.actionId} disabled={action.disabled}>
              {action.label}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
