import assert from "node:assert/strict";
import test from "node:test";

import {
  PLAN_1_DEMO_REQUIRED_SCREEN_IDS,
  buildPlan1DemoRouteMatrix,
  summarizePlan1DemoRouteMatrix,
  validatePlan1DemoRouteMatrix
} from "../dist/index.js";

test("Plan 1 demo route matrix includes every required screen", () => {
  const matrix = buildPlan1DemoRouteMatrix({ sourceIssue: "279" });
  const summary = summarizePlan1DemoRouteMatrix(matrix);

  assert.equal(matrix.planId, "default-er-layout-plan-1");
  assert.equal(summary.screenCount, PLAN_1_DEMO_REQUIRED_SCREEN_IDS.length);
  assert.equal(summary.coveredScreenCount, PLAN_1_DEMO_REQUIRED_SCREEN_IDS.length);
  assert.deepEqual(summary.missingScreenIds, []);
  assert.equal(summary.screenshotRequiredScreenCount, PLAN_1_DEMO_REQUIRED_SCREEN_IDS.length);
  assert.ok(summary.screenshotPaths.every((path) => path.startsWith("docs/verification/issues/issue-279/screenshots/")));
});

test("Plan 1 demo route matrix tracks non-claims on risk-bearing screens", () => {
  const matrix = buildPlan1DemoRouteMatrix({ sourceIssue: "279" });
  const nonClaimScreens = matrix.screens.filter((screen) => screen.nonClaimsRequired);

  assert.ok(nonClaimScreens.length >= 8);
  assert.ok(nonClaimScreens.every((screen) => screen.nonClaims.includes("Synthetic operational modeling only.")));
  assert.ok(nonClaimScreens.every((screen) => screen.nonClaims.includes("Not a patient outcome prediction.")));
});

test("Plan 1 demo route matrix output is deterministic", () => {
  assert.deepEqual(
    buildPlan1DemoRouteMatrix({ sourceIssue: "279" }),
    buildPlan1DemoRouteMatrix({ sourceIssue: "279" })
  );
});

test("Plan 1 demo route matrix rejects missing required content", () => {
  const matrix = buildPlan1DemoRouteMatrix({ sourceIssue: "279" });
  const invalid = {
    ...matrix,
    screens: matrix.screens.map((screen) => screen.screenId === "timeline"
      ? { ...screen, expectedContent: [] }
      : screen)
  };

  assert.throws(
    () => validatePlan1DemoRouteMatrix(invalid),
    /missing expected content/u
  );
});
