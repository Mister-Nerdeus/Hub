import type { ChangeEvent } from "react";

import type { PlanBuilderDefaultsFormState } from "./planBuilderDefaultsFormState";
import "./PlanBuilderAdvancedDefaultsForm.css";

type Props = {
  state: PlanBuilderDefaultsFormState;
  onChange: <K extends keyof PlanBuilderDefaultsFormState>(
    key: K,
    value: PlanBuilderDefaultsFormState[K]
  ) => void;
};

export function PlanBuilderAdvancedDefaultsForm({ state, onChange }: Props) {
  return (
    <section className="plan-builder-advanced-defaults" aria-label="Advanced plan defaults">
      <h3>Hallway, door, station, path, and zone defaults</h3>
      <div className="plan-builder-advanced-defaults__grid">
        <NumberField label="Hallway width" name="defaultHallwayWidthFeet" value={state.defaultHallwayWidthFeet} onChange={onChange} />
        <NumberField label="Hallway length" name="mainHallwayLengthFeet" value={state.mainHallwayLengthFeet} onChange={onChange} />
        <NumberField label="Hallway start X" name="mainHallwayStartX" value={state.mainHallwayStartX} onChange={onChange} />
        <NumberField label="Hallway start Y" name="mainHallwayStartY" value={state.mainHallwayStartY} onChange={onChange} />
        <NumberField label="Congestion factor" name="congestionFactor" value={state.congestionFactor} onChange={onChange} />
        <CheckboxField label="Blocked hallway" name="defaultBlocked" checked={state.defaultBlocked} onChange={onChange} />

        <CheckboxField label="Auto-create doors" name="autoCreateDoors" checked={state.autoCreateDoors} onChange={onChange} />
        <NumberField label="Door width" name="defaultDoorWidthFeet" value={state.defaultDoorWidthFeet} onChange={onChange} />
        <SelectField label="Door wall" name="doorWall" value={state.doorWall} options={["top", "bottom", "left", "right"]} onChange={onChange} />
        <NumberField label="Door offset" name="doorOffsetFeet" value={state.doorOffsetFeet} onChange={onChange} />
        <NumberField label="Door penalty seconds" name="doorPenaltySeconds" value={state.doorPenaltySeconds} onChange={onChange} />
        <CheckboxField label="Door path nodes" name="autoCreateDoorPathNodes" checked={state.autoCreateDoorPathNodes} onChange={onChange} />

        <NumberField label="Station count" name="nurseStationCount" value={state.nurseStationCount} onChange={onChange} />
        <NumberField label="Station width" name="defaultStationWidthFeet" value={state.defaultStationWidthFeet} onChange={onChange} />
        <NumberField label="Station length" name="defaultStationLengthFeet" value={state.defaultStationLengthFeet} onChange={onChange} />
        <SelectField label="Station type" name="stationType" value={state.stationType} options={["primary", "secondary", "charge", "temporary"]} onChange={onChange} />
        <SelectField label="Station placement" name="stationPlacementMode" value={state.stationPlacementMode} options={["near_hallway_start", "centered_on_hallway", "near_hallway_end"]} onChange={onChange} />
        <CheckboxField label="Station path nodes" name="autoCreateStationPathNodes" checked={state.autoCreateStationPathNodes} onChange={onChange} />

        <CheckboxField label="Auto-create path edges" name="autoCreatePathEdges" checked={state.autoCreatePathEdges} onChange={onChange} />
        <CheckboxField label="Connect rooms to hallway" name="autoConnectRoomsToHallway" checked={state.autoConnectRoomsToHallway} onChange={onChange} />
        <SelectField label="Edge length strategy" name="defaultEdgeLengthStrategy" value={state.defaultEdgeLengthStrategy} options={["manhattan", "straight_line"]} onChange={onChange} />
        <NumberField label="Path edge width" name="defaultHallwayEdgeWidthFeet" value={state.defaultHallwayEdgeWidthFeet} onChange={onChange} />
        <NumberField label="Path congestion" name="defaultCongestionFactor" value={state.defaultCongestionFactor} onChange={onChange} />
        <NumberField label="Turn penalty seconds" name="defaultTurnPenaltySeconds" value={state.defaultTurnPenaltySeconds} onChange={onChange} />
        <CheckboxField label="Blocked path edges" name="pathGraphDefaultBlocked" checked={state.pathGraphDefaultBlocked} onChange={onChange} />

        <CheckboxField label="Create default zone" name="createDefaultZone" checked={state.createDefaultZone} onChange={onChange} />
        <TextField label="Zone label" name="defaultZoneLabel" value={state.defaultZoneLabel} onChange={onChange} />
        <SelectField label="Zone type" name="defaultZoneType" value={state.defaultZoneType} options={["provider_area", "pharmacy", "ems_entry", "hallway", "waiting", "storage", "staff_only"]} onChange={onChange} />
        <CheckboxField label="Zone travel blocked" name="defaultZoneTravelBlocked" checked={state.defaultZoneTravelBlocked} onChange={onChange} />
        <NumberField label="Zone travel penalty" name="defaultZoneTravelPenalty" value={state.defaultZoneTravelPenalty} onChange={onChange} />
      </div>
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
    <label className="plan-builder-advanced-defaults__check">
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
      <select
        value={value}
        onChange={(event: ChangeEvent<HTMLSelectElement>) =>
          onChange(name, event.target.value as PlanBuilderDefaultsFormState[K])
        }
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </label>
  );
}
