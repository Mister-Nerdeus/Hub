import { PlanBuilderAdvancedDefaultsForm } from "./PlanBuilderAdvancedDefaultsForm";
import type { PlanBuilderDefaultsFormState } from "./planBuilderDefaultsFormState";
import "./PlanBuilderDefaultsForm.css";

type Props = {
  state: PlanBuilderDefaultsFormState;
  validationError: string | null;
  onChange: <K extends keyof PlanBuilderDefaultsFormState>(
    key: K,
    value: PlanBuilderDefaultsFormState[K]
  ) => void;
};

export function PlanBuilderDefaultsForm({ state, validationError, onChange }: Props) {
  return (
    <section className="plan-builder-defaults-form" aria-label="Plan builder defaults">
      <div className="plan-builder-defaults-form__header">
        <div>
          <p className="eyebrow">Plan Builder Defaults</p>
          <h2>Generate an ER pod plan</h2>
        </div>
        {validationError ? <p className="plan-builder-defaults-form__error">{validationError}</p> : null}
      </div>

      <div className="plan-builder-defaults-form__section">
        <h3>Plan setup</h3>
        <div className="plan-builder-defaults-form__grid">
          <TextField label="Plan name" name="planName" value={state.planName} onChange={onChange} />
          <TextField label="Description" name="planDescription" value={state.planDescription} onChange={onChange} />
          <NumberField label="Pixels per foot" name="pixelsPerFoot" value={state.pixelsPerFoot} onChange={onChange} />
          <NumberField label="Grid size feet" name="gridSizeFeet" value={state.gridSizeFeet} onChange={onChange} />
          <NumberField label="Origin X" name="originX" value={state.originX} onChange={onChange} />
          <NumberField label="Origin Y" name="originY" value={state.originY} onChange={onChange} />
          <CheckboxField label="Snap to grid" name="snapToGrid" checked={state.snapToGrid} onChange={onChange} />
        </div>
      </div>

      <div className="plan-builder-defaults-form__section">
        <h3>Room defaults</h3>
        <div className="plan-builder-defaults-form__grid">
          <NumberField label="Room count" name="roomCount" value={state.roomCount} onChange={onChange} />
          <NumberField label="Rooms per row" name="roomsPerRow" value={state.roomsPerRow} onChange={onChange} />
          <NumberField label="Room width" name="defaultRoomWidthFeet" value={state.defaultRoomWidthFeet} onChange={onChange} />
          <NumberField label="Room length" name="defaultRoomLengthFeet" value={state.defaultRoomLengthFeet} onChange={onChange} />
          <NumberField label="Room spacing" name="roomSpacingFeet" value={state.roomSpacingFeet} onChange={onChange} />
          <TextField label="Label prefix" name="roomLabelPrefix" value={state.roomLabelPrefix} onChange={onChange} />
          <SelectField label="Room type" name="defaultRoomType" value={state.defaultRoomType} options={["standard", "trauma", "isolation", "psych", "hall_bed", "procedure", "overflow"]} onChange={onChange} />
          <NumberField label="Max patients" name="defaultMaxPatients" value={state.defaultMaxPatients} onChange={onChange} />
          <NumberField label="Start X" name="startX" value={state.startX} onChange={onChange} />
          <NumberField label="Start Y" name="startY" value={state.startY} onChange={onChange} />
          <CheckboxField label="Trauma capable" name="defaultTraumaCapable" checked={state.defaultTraumaCapable} onChange={onChange} />
          <CheckboxField label="Isolation capable" name="defaultIsolationCapable" checked={state.defaultIsolationCapable} onChange={onChange} />
        </div>
      </div>

      <PlanBuilderAdvancedDefaultsForm state={state} onChange={onChange} />
    </section>
  );
}

function TextField<K extends keyof PlanBuilderDefaultsFormState>({
  label,
  name,
  value,
  onChange
}: {
  label: string;
  name: K;
  value: string;
  onChange: Props["onChange"];
}) {
  return (
    <label>
      <span>{label}</span>
      <input value={value} onChange={(event) => onChange(name, event.target.value as PlanBuilderDefaultsFormState[K])} />
    </label>
  );
}

function NumberField<K extends keyof PlanBuilderDefaultsFormState>(props: {
  label: string;
  name: K;
  value: string;
  onChange: Props["onChange"];
}) {
  return <TextField {...props} />;
}

function CheckboxField<K extends keyof PlanBuilderDefaultsFormState>({
  label,
  name,
  checked,
  onChange
}: {
  label: string;
  name: K;
  checked: boolean;
  onChange: Props["onChange"];
}) {
  return (
    <label className="plan-builder-defaults-form__check">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(name, event.target.checked as PlanBuilderDefaultsFormState[K])}
      />
      <span>{label}</span>
    </label>
  );
}

function SelectField<K extends keyof PlanBuilderDefaultsFormState>({
  label,
  name,
  value,
  options,
  onChange
}: {
  label: string;
  name: K;
  value: string;
  options: string[];
  onChange: Props["onChange"];
}) {
  return (
    <label>
      <span>{label}</span>
      <select value={value} onChange={(event) => onChange(name, event.target.value as PlanBuilderDefaultsFormState[K])}>
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
