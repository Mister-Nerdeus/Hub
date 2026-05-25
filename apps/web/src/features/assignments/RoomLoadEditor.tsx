import type { Plan1AcuityLevel, Plan1BurdenLevel, Plan1RoomLoad, PlanContract } from "@nerdeus/shared";

const acuityLevels: Plan1AcuityLevel[] = ["low", "medium", "high", "critical"];
const burdenLevels: Plan1BurdenLevel[] = ["none", "low", "medium", "high"];

export function RoomLoadEditor({
  plan,
  roomLoads,
  onUpdateRoomLoad
}: {
  plan: PlanContract;
  roomLoads: Plan1RoomLoad[];
  onUpdateRoomLoad: (roomLoad: Plan1RoomLoad) => void;
}) {
  const loadByRoomId = new Map(roomLoads.map((roomLoad) => [roomLoad.roomId, roomLoad]));
  return (
    <section className="assignment-panel" aria-labelledby="room-load-editor-title" data-assignment-stage="room-loads">
      <h3 id="room-load-editor-title">Synthetic Room Loads</h3>
      <div className="assignment-room-grid">
        {plan.rooms.map((room) => {
          const load = loadByRoomId.get(room.id);
          return (
            <div className="assignment-room-load" key={room.id} data-room-id={room.id}>
              <strong>{room.label}</strong>
              {load == null ? null : (
                <>
                  <label>
                    <input
                      type="checkbox"
                      checked={load.occupied}
                      onChange={(event) => onUpdateRoomLoad({ ...load, occupied: event.target.checked })}
                    />
                    Occupied
                  </label>
                  <select
                    aria-label={`Acuity ${room.label}`}
                    value={load.acuityLevel}
                    onChange={(event) =>
                      onUpdateRoomLoad({ ...load, acuityLevel: event.target.value as Plan1AcuityLevel })
                    }
                  >
                    {acuityLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                  </select>
                  <select
                    aria-label={`Medication burden ${room.label}`}
                    value={load.medicationBurden}
                    onChange={(event) =>
                      onUpdateRoomLoad({ ...load, medicationBurden: event.target.value as Plan1BurdenLevel })
                    }
                  >
                    {burdenLevels.map((level) => <option key={level} value={level}>{level}</option>)}
                  </select>
                </>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
}
