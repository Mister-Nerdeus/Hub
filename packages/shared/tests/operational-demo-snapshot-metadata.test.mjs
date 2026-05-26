import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";

const snapshot = JSON.parse(
  readFileSync("../../apps/web/src/features/floorplans/generated/planBuilderReviewFlowSnapshot.json", "utf8")
);

test("operational demo review-flow snapshot metadata is unambiguous", () => {
  assert.equal(snapshot.originBatch, "331-340");
  assert.equal(snapshot.currentConsumerBatch, "371-380");
  assert.match(snapshot.lastValidatedByIssue, /^37[0-9]|380$/u);
  assert.equal(snapshot.generatedAt, "2026-05-26T00:00:00Z");
  assert.equal(Array.isArray(snapshot.generatedFromManifests), true);
  assert.equal(snapshot.generatedFromManifests.length >= 2, true);
  assert.equal(Object.hasOwn(snapshot, "batch"), false);
  assert.equal(Object.hasOwn(snapshot, "lastUpdatedIssue"), false);
  assert.equal(Object.hasOwn(snapshot, "generatedFrom"), false);
});

test("old mixed metadata shape is rejected by the contract test", () => {
  const oldShape = {
    snapshotVersion: "1.0.0",
    batch: "331-340",
    lastUpdatedIssue: "374",
    generatedFrom: {}
  };
  assert.equal(Object.hasOwn(oldShape, "originBatch"), false);
  assert.notEqual(oldShape.batch, "371-380");
});
