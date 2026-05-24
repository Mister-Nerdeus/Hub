import type { LayoutMoveDeltaFeet } from "./layoutSnapEngine";

export type RoomDragSnapAccumulator = {
  remainderXFeet: number;
  remainderYFeet: number;
  snapSizeFeet: number;
};

export type CreateRoomDragSnapAccumulatorInput = {
  remainderXFeet?: number;
  remainderYFeet?: number;
  snapSizeFeet: number;
};

export type AccumulateRoomDragDeltaResult = {
  accumulator: RoomDragSnapAccumulator;
  emittedDelta: LayoutMoveDeltaFeet;
};

export function createRoomDragSnapAccumulator({
  remainderXFeet = 0,
  remainderYFeet = 0,
  snapSizeFeet
}: CreateRoomDragSnapAccumulatorInput): RoomDragSnapAccumulator {
  return {
    remainderXFeet: normalizeSignedZero(roundFeet(requireFinite(remainderXFeet, "remainderXFeet"))),
    remainderYFeet: normalizeSignedZero(roundFeet(requireFinite(remainderYFeet, "remainderYFeet"))),
    snapSizeFeet: requirePositive(snapSizeFeet, "snapSizeFeet")
  };
}

export function accumulateRoomDragDelta(
  accumulator: RoomDragSnapAccumulator,
  delta: LayoutMoveDeltaFeet
): AccumulateRoomDragDeltaResult {
  const normalizedAccumulator = createRoomDragSnapAccumulator(accumulator);
  const deltaXFeet = requireFinite(delta.deltaXFeet, "delta.deltaXFeet");
  const deltaYFeet = requireFinite(delta.deltaYFeet, "delta.deltaYFeet");
  const accumulatedXFeet = roundFeet(normalizedAccumulator.remainderXFeet + deltaXFeet);
  const accumulatedYFeet = roundFeet(normalizedAccumulator.remainderYFeet + deltaYFeet);
  const emittedDelta = {
    deltaXFeet: snapAccumulatedFeet(accumulatedXFeet, normalizedAccumulator.snapSizeFeet),
    deltaYFeet: snapAccumulatedFeet(accumulatedYFeet, normalizedAccumulator.snapSizeFeet)
  };

  return {
    accumulator: {
      ...normalizedAccumulator,
      remainderXFeet: normalizeSignedZero(roundFeet(accumulatedXFeet - emittedDelta.deltaXFeet)),
      remainderYFeet: normalizeSignedZero(roundFeet(accumulatedYFeet - emittedDelta.deltaYFeet))
    },
    emittedDelta
  };
}

export function resetRoomDragSnapAccumulator(
  accumulator: RoomDragSnapAccumulator
): RoomDragSnapAccumulator {
  const normalizedAccumulator = createRoomDragSnapAccumulator(accumulator);
  return {
    remainderXFeet: 0,
    remainderYFeet: 0,
    snapSizeFeet: normalizedAccumulator.snapSizeFeet
  };
}

function snapAccumulatedFeet(valueFeet: number, snapSizeFeet: number): number {
  const steps = valueFeet < 0
    ? Math.ceil(valueFeet / snapSizeFeet)
    : Math.floor(valueFeet / snapSizeFeet);
  return normalizeSignedZero(roundFeet(steps * snapSizeFeet));
}

function roundFeet(value: number): number {
  return Number(value.toFixed(6));
}

function normalizeSignedZero(value: number): number {
  return Object.is(value, -0) ? 0 : value;
}

function requirePositive(value: number, label: string): number {
  const finite = requireFinite(value, label);
  if (finite <= 0) {
    throw new Error(`${label} must be greater than 0`);
  }
  return finite;
}

function requireFinite(value: number, label: string): number {
  if (!Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}
