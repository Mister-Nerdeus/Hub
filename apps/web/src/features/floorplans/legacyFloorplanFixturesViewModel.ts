import { createFloorplanLibraryViewModel, type FloorplanLibraryCardViewModel } from "./floorplanLibraryViewModel";

export type LegacyFloorplanFixtureViewModel = FloorplanLibraryCardViewModel & {
  legacyLabel: "Legacy fixture - not used for current scenario/ratio comparison workflow.";
  activeScenarioUseDisabled: true;
};

export type LegacyFloorplanFixturesPanelViewModel = {
  title: "Legacy Floorplan Fixtures";
  floorplans: LegacyFloorplanFixtureViewModel[];
  evidenceCopy: "Plans 2-5 are retained as evidence fixtures only.";
};

export function createLegacyFloorplanFixturesPanelViewModel(): LegacyFloorplanFixturesPanelViewModel {
  return {
    title: "Legacy Floorplan Fixtures",
    floorplans: createFloorplanLibraryViewModel().legacyDefaultFloorplans.map((floorplan) => ({
      ...floorplan,
      legacyLabel: "Legacy fixture - not used for current scenario/ratio comparison workflow.",
      activeScenarioUseDisabled: true
    })),
    evidenceCopy: "Plans 2-5 are retained as evidence fixtures only."
  };
}
