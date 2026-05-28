import assert from "node:assert/strict";
import test from "node:test";

import { CANONICAL_SPLIT_BAY_CANDIDATES, splitBayForRoomId } from "../dist/index.js";

test("canonical split-bay candidates have two bed positions and require visual review", () => {
  assert.deepEqual(
    CANONICAL_SPLIT_BAY_CANDIDATES.map((candidate) => candidate.bedPositionRoomIds.join("/")),
    ["room-02/room-03", "room-04/room-05", "room-06/room-07", "room-08/room-09"]
  );
  for (const candidate of CANONICAL_SPLIT_BAY_CANDIDATES) {
    assert.equal(candidate.physicalBayCount, 1);
    assert.equal(candidate.bedPositionCount, 2);
    assert.equal(candidate.dividerSemantics, "shared-divider");
    assert.equal(candidate.finalVisualReviewRequired, true);
  }
});

test("split-bay lookup maps each candidate bed position to its physical bay", () => {
  assert.equal(splitBayForRoomId("room-02")?.splitBayId, "split-bay-02-03");
  assert.equal(splitBayForRoomId("room-09")?.splitBayId, "split-bay-08-09");
  assert.equal(splitBayForRoomId("room-19"), null);
});
