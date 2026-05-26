import type { ManualAssignmentRoomLoad } from "@nerdeus/shared";
import {
  acuityOptions,
  burdenLevelOptions,
  roomLoadBooleanControls,
  taskFrequencyOptions,
  turnoverLevelOptions
} from "./roomLoadControls";

type RoomLoadEditorPanelProps = {
  roomLoads: ManualAssignmentRoomLoad[];
};

export function RoomLoadEditorPanel({ roomLoads }: RoomLoadEditorPanelProps) {
  return (
    <section className="manual-assignment-proof__panel" aria-labelledby="room-load-editor-title" data-assignment-stage="room-load-editor">
      <div className="manual-assignment-proof__section-header">
        <h3 id="room-load-editor-title">Structured Room Loads</h3>
      </div>
      <div className="manual-assignment-proof__cards">
        {roomLoads.map((roomLoad) => (
          <article className="assignment-card" key={roomLoad.roomId} data-room-id={roomLoad.roomId}>
            <div className="assignment-card__header">
              <div>
                <h4>{roomLoad.roomId}</h4>
                <p>Operational controls only</p>
              </div>
            </div>
            <div className="room-load-control-grid">
              {roomLoadBooleanControls.map((control) => (
                <label key={control.field}>
                  <input type="checkbox" checked={Boolean(roomLoad[control.field])} readOnly />
                  {control.label}
                </label>
              ))}
              <label>
                Acuity
                <select value={roomLoad.acuity} disabled>
                  {acuityOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Medication frequency
                <select value={roomLoad.medicationFrequency} disabled>
                  {taskFrequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Monitoring frequency
                <select value={roomLoad.monitoringFrequency} disabled>
                  {taskFrequencyOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Procedure burden
                <select value={roomLoad.procedureBurden} disabled>
                  {burdenLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
              <label>
                Turnover
                <select value={roomLoad.expectedTurnover} disabled>
                  {turnoverLevelOptions.map((option) => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                  ))}
                </select>
              </label>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
