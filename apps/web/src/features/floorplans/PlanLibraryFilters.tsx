import type { PlanLibraryFilterViewModel } from "./planStatusViewModel";

type PlanLibraryFiltersProps = {
  filters: PlanLibraryFilterViewModel[];
};

export function PlanLibraryFilters({ filters }: PlanLibraryFiltersProps) {
  return (
    <div className="plan-library-filters" aria-label="Plan library filters">
      {filters.map((filter) => (
        <button type="button" key={filter.id} data-filter-id={filter.id}>
          <span>{filter.label}</span>
          <strong>{filter.itemCount}</strong>
        </button>
      ))}
    </div>
  );
}
