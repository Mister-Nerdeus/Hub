// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { mkdirSync, writeFileSync } from "node:fs";
// @ts-expect-error The web test runner executes in Node but does not include Node types.
import { resolve } from "node:path";

import { defaultPlanFixtures } from "../../fixtures/defaultPlans";
import type { DefaultSavedPlanFixtureContract } from "@nerdeus/shared";
import {
  createActiveFloorplanSummaryViewModel,
  createEmptyActiveFloorplanState,
  openDefaultFloorplan,
  type ActiveFloorplanState
} from "./activeFloorplanState";

declare const process: { cwd(): string };

const repoRoot = resolve(process.cwd(), "../..");
const evidenceDir = resolve(repoRoot, "docs/verification/issues/issue-220");

function writeEvidence(name: string, payload: unknown) {
  mkdirSync(evidenceDir, { recursive: true });
  writeFileSync(resolve(evidenceDir, name), `${JSON.stringify(payload, null, 2)}\n`);
}

let state = createEmptyActiveFloorplanState();
const openedPlanIds: string[] = [];

for (const fixture of defaultPlanFixtures) {
  const nextState = openDefaultFloorplan(state, fixture.plan.planId);
  if (nextState.activeFloorplan?.planId !== fixture.plan.planId) {
    throw new Error(`active floorplan did not open ${fixture.plan.planId}`);
  }
  if (nextState.activeFloorplan.plan !== fixture.plan) {
    throw new Error(`active floorplan must reference the loaded JSON fixture for ${fixture.plan.planId}`);
  }
  if (nextState.activeFloorplan.readOnly !== true) {
    throw new Error(`default floorplan must remain read-only for ${fixture.plan.planId}`);
  }
  if (nextState.selection.selectedObjectId !== null || nextState.selection.routePreviewDraft !== null) {
    throw new Error(`opening ${fixture.plan.planId} must reset selection-specific state`);
  }
  if (nextState.sequence !== state.sequence + 1) {
    throw new Error(`active floorplan sequence must advance deterministically for ${fixture.plan.planId}`);
  }
  openedPlanIds.push(nextState.activeFloorplan.planId);
  state = nextState;
}

const selectedState: ActiveFloorplanState = {
  ...state,
  selection: {
    selectedObjectId: "room-01",
    routePreviewDraft: null
  }
};
const switchedState = openDefaultFloorplan(selectedState, "default-er-layout-plan-2");
if (switchedState.activeFloorplan?.planId !== "default-er-layout-plan-2") {
  throw new Error("switching plans must replace active floorplan state");
}
if (switchedState.selection.selectedObjectId !== null) {
  throw new Error("switching plans must clear selected object state");
}

const summary = createActiveFloorplanSummaryViewModel(switchedState);
if (!summary.hasActiveFloorplan || summary.planId !== "default-er-layout-plan-2") {
  throw new Error("active floorplan summary must reflect opened default plan");
}
if (summary.readOnly !== true || summary.sourceKind !== "default-json") {
  throw new Error("active floorplan summary must preserve read-only JSON default state");
}
if (summary.objectCounts == null || summary.objectCounts.rooms <= 0 || summary.objectCounts.pathEdges <= 0) {
  throw new Error("active floorplan summary must expose JSON plan object counts");
}

const baseFixture = defaultPlanFixtures[0];
if (baseFixture == null) {
  throw new Error("expected at least one default plan fixture");
}
const invalidFixture: DefaultSavedPlanFixtureContract = {
  ...baseFixture,
  importStatus: "draft_converted"
};
if (!throws(() => openDefaultFloorplan(createEmptyActiveFloorplanState(), invalidFixture.plan.planId, [invalidFixture]))) {
  throw new Error("opening must reject non-validated default plans");
}

const serialized = JSON.stringify({ state: switchedState, summary });
const prohibitedFragments = [
  `.${"docx"}`,
  `docs/${"floorplans"}`,
  `sourceDocument${"Path"}`,
  "sourceFilename",
  "ER Layout_plan",
  "download",
  "preview link"
];
for (const fragment of prohibitedFragments) {
  if (serialized.includes(fragment)) {
    throw new Error(`active floorplan state must not expose ${fragment}`);
  }
}

writeEvidence("open-default-floorplan-output.json", {
  issue: "220",
  status: "passed",
  openedPlanIds,
  openedDefaultPlanCount: openedPlanIds.length,
  openedPlansRemainReadOnly: true,
  validatedDefaultsOnly: true
});

writeEvidence("active-floorplan-state-output.json", {
  issue: "220",
  status: "passed",
  finalActivePlanId: switchedState.activeFloorplan?.planId,
  sequence: switchedState.sequence,
  selectionResetOnSwitch: switchedState.selection.selectedObjectId === null,
  summary
});

writeEvidence("no-docx-open-output.json", {
  issue: "220",
  status: "passed",
  prohibitedFragments,
  serializedActiveStateExposesDocx: false
});

function throws(callback: () => void): boolean {
  try {
    callback();
    return false;
  } catch {
    return true;
  }
}
