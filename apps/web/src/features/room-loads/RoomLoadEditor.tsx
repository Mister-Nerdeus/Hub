import type { ManualAssignmentRoomLoad } from "@nerdeus/shared";
import {
  createRoomLoadEditorViewModel,
  type RoomLoadEditorRoom
} from "./roomLoadEditorViewModel";

type RoomLoadEditorProps = {
  rooms: RoomLoadEditorRoom[];
  roomLoads: ManualAssignmentRoomLoad[];
};

export function RoomLoadEditor({ rooms, roomLoads }: RoomLoadEditorProps) {
  const cards = createRoomLoadEditorViewModel(rooms, roomLoads);
  return (
    <section aria-labelledby="room-loads-title" data-room-load-editor="semantic">
      <h3 id="room-loads-title">Structured Room Loads</h3>
      <div>
        {cards.map((card) => (
          <article key={card.roomId} data-room-id={card.roomId} data-room-type={card.roomType}>
            <h4>{card.label}</h4>
            {card.controlsDisabled ? (
              <p data-room-load-disabled-reason={card.roomType}>{card.disabledReason}</p>
            ) : (
              <fieldset disabled={card.roomLoad == null}>
                <label>
                  <input type="checkbox" checked={card.roomLoad?.occupied ?? false} readOnly />
                  Occupied
                </label>
                <label>
                  Acuity
                  <input value={card.roomLoad?.acuity ?? ""} readOnly />
                </label>
              </fieldset>
            )}
          </article>
        ))}
      </div>
    </section>
  );
}
