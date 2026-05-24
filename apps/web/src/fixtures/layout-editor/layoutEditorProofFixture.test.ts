import { validateEditableLayoutGeometryContract } from "@nerdeus/shared";

import { layoutEditorProofFixture } from "./layoutEditorProofFixture";

const assert = {
  equal<T>(actual: T, expected: T): void {
    if (actual !== expected) {
      throw new Error(`Expected ${JSON.stringify(actual)} to equal ${JSON.stringify(expected)}`);
    }
  },
  deepEqual(actual: unknown, expected: unknown): void {
    if (JSON.stringify(actual) !== JSON.stringify(expected)) {
      throw new Error(`Expected ${JSON.stringify(actual)} to deep equal ${JSON.stringify(expected)}`);
    }
  },
  ok(value: unknown, message: string): void {
    if (!value) {
      throw new Error(message);
    }
  }
};

const validated = validateEditableLayoutGeometryContract(layoutEditorProofFixture);

assert.deepEqual(validated, layoutEditorProofFixture);
assert.equal(layoutEditorProofFixture.units, "feet");
assert.ok(layoutEditorProofFixture.rooms.length >= 1, "proof fixture requires at least one room");
assert.ok(layoutEditorProofFixture.doors.length >= 1, "proof fixture requires at least one door");
assert.ok(layoutEditorProofFixture.stations.length >= 1, "proof fixture requires at least one station");
assert.ok(layoutEditorProofFixture.hallways.length >= 1, "proof fixture requires at least one hallway");
assert.ok(layoutEditorProofFixture.zones.length >= 1, "proof fixture requires at least one zone");

const serialized = JSON.stringify(layoutEditorProofFixture);
assert.equal(serialized.includes("pixel"), false);
assert.equal(serialized.includes("Pixels"), false);
