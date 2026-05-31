export type RoomAssignmentFilter = "all" | "unassigned" | "high-burden" | "trauma" | "split-rooms";

type RoomAssignmentFiltersProps = {
  activeFilter: RoomAssignmentFilter;
  counts: Record<RoomAssignmentFilter, number>;
  onFilterChange: (filter: RoomAssignmentFilter) => void;
};

const FILTERS: { id: RoomAssignmentFilter; label: string }[] = [
  { id: "all", label: "All rooms" },
  { id: "unassigned", label: "Unassigned" },
  { id: "high-burden", label: "High burden" },
  { id: "trauma", label: "Trauma" },
  { id: "split-rooms", label: "Split rooms" }
];

export function RoomAssignmentFilters({
  activeFilter,
  counts,
  onFilterChange
}: RoomAssignmentFiltersProps) {
  return (
    <div className="room-assignment-filters" aria-label="Room filters" data-room-assignment-filters="ready">
      {FILTERS.map((filter) => (
        <button
          aria-pressed={activeFilter === filter.id}
          className={activeFilter === filter.id ? "room-assignment-filters__chip room-assignment-filters__chip--active" : "room-assignment-filters__chip"}
          key={filter.id}
          type="button"
          data-room-filter={filter.id}
          onClick={() => onFilterChange(filter.id)}
        >
          {filter.label}
          <span>{counts[filter.id]}</span>
        </button>
      ))}
    </div>
  );
}
