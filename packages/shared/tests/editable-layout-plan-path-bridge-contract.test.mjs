import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

import {
  EDITABLE_LAYOUT_PLAN_PATH_BRIDGE_MAPPING_STATUSES,
  validateEditableLayoutPlanPathBridgeContract
} from "../dist/index.js";

const fixture = JSON.parse(
  readFileSync(
    new URL("../fixtures/layout-editor/editable-layout-plan-path-bridge-basic.json", import.meta.url),
    "utf8"
  )
);

test("editable layout plan/path bridge contract validates explicit mappings", () => {
  const validated = validateEditableLayoutPlanPathBridgeContract(fixture);

  assert.deepEqual([...EDITABLE_LAYOUT_PLAN_PATH_BRIDGE_MAPPING_STATUSES], [
    "mapped",
    "missing_plan_object",
    "missing_path_reference",
    "not_required"
  ]);
  assert.equal(validated.editableLayoutId, "editable-layout-basic");
  assert.equal(validated.planId, "plan-basic");
  assert.equal(validated.roomMappings[0].mappingStatus, "mapped");
  assert.equal(validated.doorMappings[1].mappingStatus, "missing_path_reference");
  assert.equal(validated.zoneMappings[0].mappingStatus, "not_required");
});

test("editable layout plan/path bridge contract rejects extra keys", () => {
  assert.throws(
    () =>
      validateEditableLayoutPlanPathBridgeContract({
        ...fixture,
        inferredClinicalMeaning: false
      }),
    /not allowed/
  );
});

test("editable layout plan/path bridge contract rejects invalid mapping status", () => {
  assert.throws(
    () =>
      validateEditableLayoutPlanPathBridgeContract({
        ...fixture,
        roomMappings: [
          {
            ...fixture.roomMappings[0],
            mappingStatus: "unknown_status"
          }
        ]
      }),
    /mappingStatus/
  );
});

test("editable layout plan/path bridge contract rejects implicit missing links", () => {
  assert.throws(
    () =>
      validateEditableLayoutPlanPathBridgeContract({
        ...fixture,
        roomMappings: [
          {
            ...fixture.roomMappings[0],
            pathNodeIds: [],
            pathEdgeIds: []
          }
        ]
      }),
    /missing_path_reference/
  );
});
