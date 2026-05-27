import {
  getRoomTypeRule,
  type ManualAssignmentRoomLoad,
  type SemanticRoomType
} from "@nerdeus/shared";
import {
  acuityOptions,
  burdenLevelOptions,
  roomLoadBooleanControls,
  taskFrequencyOptions,
  turnoverLevelOptions
} from "./roomLoadControls";

type RoomLoadEditorPanelProps = {
  roomLoads: ManualAssignmentRoomLoad[];
  roomTypesByRoomId?: Record<string, SemanticRoomType>;
};

export function RoomLoadEditorPanel({ roomLoads, roomTypesByRoomId = {} }: RoomLoadEditorPanelProps) {
  return (
    <section className="manual-assignment-proof__panel" aria-labelledby="room-load-editor-title" data-assignment-stage="room-load-editor">
      <div className="manual-assignment-proof__section-header">
        <h3 id="room-load-editor-title">Structured Room Loads</h3>
      </div>
      <div className="manual-assignment-proof__cards">
        {roomLoads.map((roomLoad) => {
          const roomType = roomTypesByRoomId[roomLoad.roomId] ?? "standard";
          const disabledReason = getRoomLoadDisabledReason(roomType);
          return (
          <article className="assignment-card" key={roomLoad.roomId} data-room-id={roomLoad.roomId}>
            <div className="assignment-card__header">
              <div>
                <h4>{roomLoad.roomId}</h4>
                <p>{disabledReason ?? "Operational controls only"}</p>
              </div>
            </div>
            <div className="room-load-control-grid" aria-disabled={disabledReason == null ? undefined : true}>
              {roomLoadBooleanControls.map((control) => (
                <label key={control.field}>
                  <input type="checkbox" checked={Boolean(roomLoad[control.field])} disabled={disabledReason != null} readOnly />
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
          );
        })}
      </div>
    </section>
  );
}

function getRoomLoadDisabledReason(roomType: SemanticRoomType): string | null {
  if (roomType === "storage") return "Storage is excluded from room-load inputs.";
  if (roomType === "solid_wall") return "Solid wall / blocked area is excluded from room-load inputs.";
  return getRoomTypeRule(roomType).roomLoadEligible ? null : "Room type is excluded from room-load inputs.";
}
