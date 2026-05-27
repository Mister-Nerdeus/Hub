import { PRODUCT_DISPLAY_NAME, type DefaultSavedPlanFixtureContract } from "@nerdeus/shared";

import { defaultFloorplanLibraryFixtures } from "../../fixtures/defaultPlans";
import type { ActiveFloorplanSummaryViewModel } from "./activeFloorplanState";
import type { SavedFloorplanRecord } from "./savedFloorplanStore";

export const CANONICAL_FLOORPLAN_ID = "default-er-layout-plan-1";

export type DefaultFloorplanClassification = "canonical-default" | "legacy-default";

export type CanonicalFloorplanProductViewModel = {
  productDisplayName: typeof PRODUCT_DISPLAY_NAME;
  floorplanModelStatus: "single_canonical_floorplan";
  canonicalPlanId: string;
  activeCanonicalFloorplanId: typeof CANONICAL_FLOORPLAN_ID;
  canonicalPlanName: string;
  visibleDefaultPlanIds: string[];
  legacyDefaultPlanIds: string[];
  legacyContainmentCopy: string;
  productCopy: string;
};

export function classifyDefaultFloorplan(
  fixture: DefaultSavedPlanFixtureContract
): DefaultFloorplanClassification {
  return fixture.plan.planId === CANONICAL_FLOORPLAN_ID ? "canonical-default" : "legacy-default";
}

export function createCanonicalFloorplanProductViewModel(
  fixtures: DefaultSavedPlanFixtureContract[] = defaultFloorplanLibraryFixtures
): CanonicalFloorplanProductViewModel {
  const canonical = fixtures.find((fixture) => classifyDefaultFloorplan(fixture) === "canonical-default");
  if (canonical == null) {
    throw new Error(`canonical floorplan fixture is missing: ${CANONICAL_FLOORPLAN_ID}`);
  }
  const legacyDefaultPlanIds = fixtures
    .filter((fixture) => classifyDefaultFloorplan(fixture) === "legacy-default")
    .map((fixture) => fixture.plan.planId)
    .sort();

  return {
    productDisplayName: PRODUCT_DISPLAY_NAME,
    floorplanModelStatus: "single_canonical_floorplan",
    canonicalPlanId: canonical.plan.planId,
    activeCanonicalFloorplanId: CANONICAL_FLOORPLAN_ID,
    canonicalPlanName: canonical.plan.name,
    visibleDefaultPlanIds: [canonical.plan.planId],
    legacyDefaultPlanIds,
    legacyContainmentCopy: "Legacy fixtures are retained for verification only.",
    productCopy: "This workspace uses one canonical ER pod floorplan. Scenario and ratio comparisons layer onto this floorplan."
  };
}

export type CanonicalFloorplanHeaderViewModel = {
  title: "Canonical ER Pod Floorplan";
  activeFloorplanName: string;
  activeFloorplanStatus: string;
  editableCopyStatus: string;
  savedCopyCount: number;
  ratioLayeringCopy: "4:1 / 3:1 scenarios use this same floorplan.";
  operationalApproximationCopy: "Operational approximation only.";
  exactCadNonClaim: "Not exact CAD.";
  staffingComplianceNonClaim: "Not staffing compliance certification.";
};

export function createCanonicalFloorplanHeaderViewModel(options: {
  activeFloorplan: ActiveFloorplanSummaryViewModel;
  savedFloorplans: SavedFloorplanRecord[];
}): CanonicalFloorplanHeaderViewModel {
  const active = options.activeFloorplan;
  const isEditableCopy = active.hasActiveFloorplan && active.sourceKind === "saved-json";
  return {
    title: "Canonical ER Pod Floorplan",
    activeFloorplanName: active.hasActiveFloorplan ? active.name : "Canonical default ready",
    activeFloorplanStatus: active.hasActiveFloorplan
      ? `Active map: ${active.name}`
      : "Active map: default-er-layout-plan-1",
    editableCopyStatus: isEditableCopy ? "Editable working copy active" : "Locked canonical fixture available",
    savedCopyCount: options.savedFloorplans.length,
    ratioLayeringCopy: "4:1 / 3:1 scenarios use this same floorplan.",
    operationalApproximationCopy: "Operational approximation only.",
    exactCadNonClaim: "Not exact CAD.",
    staffingComplianceNonClaim: "Not staffing compliance certification."
  };
}
