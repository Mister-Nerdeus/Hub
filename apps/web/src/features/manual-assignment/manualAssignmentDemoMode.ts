import {
  canonicalErPodGeometryFixture,
  type ActiveFloorplanContract,
  type EditableLayoutGeometryContract
} from "@nerdeus/shared";

export const MANUAL_ASSIGNMENT_FIXTURE_MODES = [
  "active_floorplan",
  "canonical_demo",
  "canonical_proof"
] as const;

export type ManualAssignmentFixtureMode = (typeof MANUAL_ASSIGNMENT_FIXTURE_MODES)[number];

export type ManualAssignmentLayoutSelection = {
  layout: EditableLayoutGeometryContract;
  source: "active_floorplan" | "canonical_fixture";
  fixtureMode: ManualAssignmentFixtureMode;
  reason: "active_floorplan_present" | "explicit_demo_mode" | "explicit_proof_mode" | "no_active_floorplan";
  visibleLabel: string | null;
};

export function selectManualAssignmentLayout(input: {
  activeFloorplan?: ActiveFloorplanContract | null;
  fixtureMode?: ManualAssignmentFixtureMode;
}): ManualAssignmentLayoutSelection {
  const fixtureMode = input.fixtureMode ?? "active_floorplan";
  if (fixtureMode === "canonical_demo") {
    return canonicalSelection(fixtureMode, "explicit_demo_mode", "Canonical fixture demo mode");
  }
  if (fixtureMode === "canonical_proof") {
    return canonicalSelection(fixtureMode, "explicit_proof_mode", "Canonical fixture proof mode");
  }
  if (input.activeFloorplan != null) {
    return {
      layout: input.activeFloorplan.editableLayout,
      source: "active_floorplan",
      fixtureMode,
      reason: "active_floorplan_present",
      visibleLabel: null
    };
  }
  return canonicalSelection(fixtureMode, "no_active_floorplan", "Canonical fixture fallback: no active floorplan");
}

function canonicalSelection(
  fixtureMode: ManualAssignmentFixtureMode,
  reason: ManualAssignmentLayoutSelection["reason"],
  visibleLabel: string
): ManualAssignmentLayoutSelection {
  return {
    layout: canonicalErPodGeometryFixture,
    source: "canonical_fixture",
    fixtureMode,
    reason,
    visibleLabel
  };
}
