import { ManualAssignmentRoomList } from "./ManualAssignmentRoomList";
import { RoomAssignmentFilters, type RoomAssignmentFilter } from "./RoomAssignmentFilters";
import type { ManualAssignmentRoomCard } from "./manualAssignmentWorkspaceViewModel";

type RoomAssignmentTableProps = {
  rooms: ManualAssignmentRoomCard[];
  totalRoomCount: number;
  activeFilter: RoomAssignmentFilter;
  filterCounts: Record<RoomAssignmentFilter, number>;
  onFilterChange: (filter: RoomAssignmentFilter) => void;
  onRoomClick: (roomId: string) => void;
  onUnassignRoom: (roomId: string) => void;
};

export function RoomAssignmentTable({
  rooms,
  totalRoomCount,
  activeFilter,
  filterCounts,
  onFilterChange,
  onRoomClick,
  onUnassignRoom
}: RoomAssignmentTableProps) {
  return (
    <section
      className="manual-assignment-workspace__panel room-assignment-table"
      aria-labelledby="room-assignment-table-title"
      data-room-assignment-table="manual"
      data-filtered-room-count={rooms.length}
      data-total-room-count={totalRoomCount}
    >
      <div className="manual-assignment-workspace__panel-header">
        <div>
          <p className="eyebrow">Room assignment table</p>
          <h3 id="room-assignment-table-title">Rooms</h3>
        </div>
        <span className="room-assignment-table__filter-label">{activeFilter.replace("-", " ")}</span>
      </div>
      <RoomAssignmentFilters
        activeFilter={activeFilter}
        counts={filterCounts}
        onFilterChange={onFilterChange}
      />
      <ManualAssignmentRoomList
        rooms={rooms}
        onRoomClick={onRoomClick}
        onUnassignRoom={onUnassignRoom}
      />
    </section>
  );
}
