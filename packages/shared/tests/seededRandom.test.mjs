import assert from "node:assert/strict";
import test from "node:test";

import { createSeededRandom } from "../dist/index.js";

test("same seed produces the same float sequence", () => {
  const left = createSeededRandom(20260522);
  const right = createSeededRandom(20260522);

  assert.deepEqual(
    Array.from({ length: 6 }, () => left.nextFloat()),
    Array.from({ length: 6 }, () => right.nextFloat())
  );
});

test("different seeds produce different float sequences", () => {
  const left = createSeededRandom(20260522);
  const right = createSeededRandom(20260523);

  assert.notDeepEqual(
    Array.from({ length: 6 }, () => left.nextFloat()),
    Array.from({ length: 6 }, () => right.nextFloat())
  );
});

test("nextFloat returns values in [0, 1)", () => {
  const random = createSeededRandom(1);

  for (let index = 0; index < 100; index += 1) {
    const value = random.nextFloat();
    assert.ok(value >= 0);
    assert.ok(value < 1);
  }
});

test("nextInt uses an exclusive upper bound", () => {
  const random = createSeededRandom(20260522);
  const values = Array.from({ length: 100 }, () => random.nextInt(3, 7));

  assert.ok(values.every((value) => value >= 3 && value < 7));
  assert.ok(values.includes(3));
  assert.ok(values.includes(6));
  assert.equal(values.includes(7), false);
});

test("pick is deterministic and rejects empty arrays", () => {
  const left = createSeededRandom(20260522);
  const right = createSeededRandom(20260522);

  assert.equal(left.pick(["alpha", "bravo", "charlie"]), right.pick(["alpha", "bravo", "charlie"]));
  assert.throws(() => createSeededRandom(1).pick([]), /at least one item/);
});

test("shuffle is deterministic and does not mutate input", () => {
  const input = ["alpha", "bravo", "charlie", "delta", "echo"];
  const left = createSeededRandom(20260522);
  const right = createSeededRandom(20260522);

  const shuffledLeft = left.shuffle(input);
  const shuffledRight = right.shuffle(input);

  assert.deepEqual(shuffledLeft, shuffledRight);
  assert.deepEqual(input, ["alpha", "bravo", "charlie", "delta", "echo"]);
  assert.notDeepEqual(shuffledLeft, input);
});
