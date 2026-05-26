import type { ActiveFloorplanState } from "./activeFloorplanState";
import { createActiveFloorplanSummaryViewModel } from "./activeFloorplanState";

export function createOperationalActiveFloorplanViewModel(state: ActiveFloorplanState) {
  const summary = createActiveFloorplanSummaryViewModel(state);
  return {
    ...summary
  };
}
