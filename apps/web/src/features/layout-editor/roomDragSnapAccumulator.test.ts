import {
  accumulateRoomDragDelta,
  createRoomDragSnapAccumulator,
  resetRoomDragSnapAccumulator
} from "./roomDragSnapAccumulator";

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
  throws(fn: () => void, pattern: RegExp): void {
    try {
      fn();
    } catch (error) {
      if (error instanceof Error && pattern.test(error.message)) {
        return;
      }
      throw error;
    }
    throw new Error(`Expected function to throw ${pattern}`);
  }
};

const defaultAccumulator = createRoomDragSnapAccumulator({ snapSizeFeet: 1 });
let defaultResult = accumulateRoomDragDelta(defaultAccumulator, { deltaXFeet: 0.4, deltaYFeet: 0 });
assert.deepEqual(defaultResult.emittedDelta, { deltaXFeet: 0, deltaYFeet: 0 });
defaultResult = accumulateRoomDragDelta(defaultResult.accumulator, { deltaXFeet: 0.4, deltaYFeet: 0 });
assert.deepEqual(defaultResult.emittedDelta, { deltaXFeet: 0, deltaYFeet: 0 });
defaultResult = accumulateRoomDragDelta(defaultResult.accumulator, { deltaXFeet: 0.4, deltaYFeet: 0 });
assert.deepEqual(defaultResult.emittedDelta, { deltaXFeet: 1, deltaYFeet: 0 });
assert.equal(defaultResult.accumulator.remainderXFeet, 0.2);
assert.equal(defaultResult.accumulator.remainderYFeet, 0);

const negativeAccumulator = createRoomDragSnapAccumulator({ snapSizeFeet: 1 });
let negativeResult = accumulateRoomDragDelta(negativeAccumulator, { deltaXFeet: -0.4, deltaYFeet: 0 });
assert.deepEqual(negativeResult.emittedDelta, { deltaXFeet: 0, deltaYFeet: 0 });
negativeResult = accumulateRoomDragDelta(negativeResult.accumulator, { deltaXFeet: -0.4, deltaYFeet: 0 });
assert.deepEqual(negativeResult.emittedDelta, { deltaXFeet: 0, deltaYFeet: 0 });
negativeResult = accumulateRoomDragDelta(negativeResult.accumulator, { deltaXFeet: -0.4, deltaYFeet: 0 });
assert.deepEqual(negativeResult.emittedDelta, { deltaXFeet: -1, deltaYFeet: 0 });
assert.equal(negativeResult.accumulator.remainderXFeet, -0.2);
assert.equal(negativeResult.accumulator.remainderYFeet, 0);

const fineAccumulator = createRoomDragSnapAccumulator({ snapSizeFeet: 0.5 });
let fineResult = accumulateRoomDragDelta(fineAccumulator, { deltaXFeet: 0.2, deltaYFeet: -0.2 });
assert.deepEqual(fineResult.emittedDelta, { deltaXFeet: 0, deltaYFeet: 0 });
fineResult = accumulateRoomDragDelta(fineResult.accumulator, { deltaXFeet: 0.2, deltaYFeet: -0.2 });
assert.deepEqual(fineResult.emittedDelta, { deltaXFeet: 0, deltaYFeet: 0 });
fineResult = accumulateRoomDragDelta(fineResult.accumulator, { deltaXFeet: 0.2, deltaYFeet: -0.2 });
assert.deepEqual(fineResult.emittedDelta, { deltaXFeet: 0.5, deltaYFeet: -0.5 });
assert.equal(fineResult.accumulator.remainderXFeet, 0.1);
assert.equal(fineResult.accumulator.remainderYFeet, -0.1);

const zeroResult = accumulateRoomDragDelta(
  createRoomDragSnapAccumulator({ snapSizeFeet: 1 }),
  { deltaXFeet: 0, deltaYFeet: 0 }
);
assert.deepEqual(zeroResult.emittedDelta, { deltaXFeet: 0, deltaYFeet: 0 });
assert.equal(zeroResult.accumulator.remainderXFeet, 0);
assert.equal(zeroResult.accumulator.remainderYFeet, 0);

const resetResult = resetRoomDragSnapAccumulator(
  createRoomDragSnapAccumulator({
    remainderXFeet: 0.25,
    remainderYFeet: -0.25,
    snapSizeFeet: 0.5
  })
);
assert.deepEqual(resetResult, {
  remainderXFeet: 0,
  remainderYFeet: 0,
  snapSizeFeet: 0.5
});

assert.throws(
  () => createRoomDragSnapAccumulator({ snapSizeFeet: 0 }),
  /snapSizeFeet/
);
