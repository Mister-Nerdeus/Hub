import {
  ROOM_LOAD_ACUITY_LEVELS,
  ROOM_LOAD_FREQUENCY_LEVELS,
  ROOM_LOAD_PROCEDURE_BURDEN_LEVELS,
  ROOM_LOAD_TURNOVER_LEVELS,
  type AssignmentSetContract,
  type RoomLoadContract
} from "@nerdeus/shared";
import { updateAssignmentSetRoomLoad } from "./roomLoadActions";
import { createRoomLoadViewModel } from "./roomLoadViewModel";

type RoomLoadEditorProps = {
  assignmentSet: AssignmentSetContract;
  onAssignmentSetChange: (assignmentSet: AssignmentSetContract) => void;
  onRoomLoadChange?: (roomLoad: RoomLoadContract) => void;
};

export function RoomLoadEditor({
  assignmentSet,
  onAssignmentSetChange,
  onRoomLoadChange
}: RoomLoadEditorProps) {
  const viewModel = createRoomLoadViewModel(assignmentSet);

  function updateRoomLoad(roomId: string, patch: Partial<RoomLoadContract>) {
    const roomLoad = assignmentSet.roomLoadsByRoomId[roomId];
    if (roomLoad == null) return;
    const nextRoomLoad = { ...roomLoad, ...patch };
    const nextAssignmentSet = updateAssignmentSetRoomLoad(assignmentSet, nextRoomLoad);
    onAssignmentSetChange(nextAssignmentSet);
    onRoomLoadChange?.(nextRoomLoad);
  }

  return (
    <section
      className="manual-assignment-workspace__panel room-load-editor"
      aria-labelledby="room-load-editor-title"
      data-room-load-editor="assignment-set"
      data-room-loads-structured-only="true"
      data-no-free-text-room-loads="true"
    >
      <div className="manual-assignment-workspace__panel-header">
        <h3 id="room-load-editor-title">Room Loads</h3>
      </div>
      <div className="room-load-editor__grid">
        {viewModel.cards.map((roomLoad) => (
          <article
            className="room-load-editor__card"
            key={roomLoad.roomId}
            data-room-load-room-id={roomLoad.roomId}
            data-room-load-occupied={roomLoad.occupied ? "true" : "false"}
          >
            <div className="room-load-editor__card-header">
              <strong>{roomLoad.roomId}</strong>
              <span>{roomLoad.riskLabels.length > 0 ? roomLoad.riskLabels.join(", ") : "Standard load"}</span>
            </div>
            <label className="room-load-editor__check">
              <input
                checked={roomLoad.occupied}
                type="checkbox"
                onChange={(event) => updateRoomLoad(roomLoad.roomId, { occupied: event.target.checked })}
              />
              Occupied
            </label>
            <label>
              Acuity
              <select
                value={roomLoad.acuity}
                onChange={(event) => updateRoomLoad(roomLoad.roomId, { acuity: Number(event.target.value) as RoomLoadContract["acuity"] })}
              >
                {ROOM_LOAD_ACUITY_LEVELS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <label className="room-load-editor__check">
              <input
                checked={roomLoad.traumaActive}
                type="checkbox"
                onChange={(event) => updateRoomLoad(roomLoad.roomId, { traumaActive: event.target.checked })}
              />
              Trauma active
            </label>
            <label className="room-load-editor__check">
              <input
                checked={roomLoad.isolationActive}
                type="checkbox"
                onChange={(event) => updateRoomLoad(roomLoad.roomId, { isolationActive: event.target.checked })}
              />
              Isolation active
            </label>
            <label className="room-load-editor__check">
              <input
                checked={roomLoad.behavioralRisk}
                type="checkbox"
                onChange={(event) => updateRoomLoad(roomLoad.roomId, { behavioralRisk: event.target.checked })}
              />
              Behavioral risk
            </label>
            <label className="room-load-editor__check">
              <input
                checked={roomLoad.fallRisk}
                type="checkbox"
                onChange={(event) => updateRoomLoad(roomLoad.roomId, { fallRisk: event.target.checked })}
              />
              Fall risk
            </label>
            <label className="room-load-editor__check">
              <input
                checked={roomLoad.sitterRequired}
                type="checkbox"
                onChange={(event) => updateRoomLoad(roomLoad.roomId, { sitterRequired: event.target.checked })}
              />
              Sitter required
            </label>
            <label>
              Medication frequency
              <select
                value={roomLoad.medicationFrequency}
                onChange={(event) => updateRoomLoad(roomLoad.roomId, { medicationFrequency: event.target.value as RoomLoadContract["medicationFrequency"] })}
              >
                {ROOM_LOAD_FREQUENCY_LEVELS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Monitoring frequency
              <select
                value={roomLoad.monitoringFrequency}
                onChange={(event) => updateRoomLoad(roomLoad.roomId, { monitoringFrequency: event.target.value as RoomLoadContract["monitoringFrequency"] })}
              >
                {ROOM_LOAD_FREQUENCY_LEVELS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Procedure burden
              <select
                value={roomLoad.procedureBurden}
                onChange={(event) => updateRoomLoad(roomLoad.roomId, { procedureBurden: event.target.value as RoomLoadContract["procedureBurden"] })}
              >
                {ROOM_LOAD_PROCEDURE_BURDEN_LEVELS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
            <label>
              Expected turnover
              <select
                value={roomLoad.expectedTurnover}
                onChange={(event) => updateRoomLoad(roomLoad.roomId, { expectedTurnover: event.target.value as RoomLoadContract["expectedTurnover"] })}
              >
                {ROOM_LOAD_TURNOVER_LEVELS.map((value) => (
                  <option key={value} value={value}>{value}</option>
                ))}
              </select>
            </label>
          </article>
        ))}
      </div>
    </section>
  );
}
