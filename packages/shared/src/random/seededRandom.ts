export type SeededRandom = {
  nextFloat(): number;
  nextInt(minInclusive: number, maxExclusive: number): number;
  pick<T>(items: T[]): T;
  shuffle<T>(items: T[]): T[];
};

export function createSeededRandom(seed: number): SeededRandom {
  if (!Number.isSafeInteger(seed) || seed < 0) {
    throw new Error("seed must be a non-negative safe integer");
  }

  const mask64 = (1n << 64n) - 1n;
  let state = BigInt(seed) & mask64;

  function nextFloat(): number {
    state = (state + 0x9e3779b97f4a7c15n) & mask64;
    let value = state;
    value = ((value ^ (value >> 30n)) * 0xbf58476d1ce4e5b9n) & mask64;
    value = ((value ^ (value >> 27n)) * 0x94d049bb133111ebn) & mask64;
    value = value ^ (value >> 31n);
    return Number(value >> 11n) / 9007199254740992;
  }

  function nextInt(minInclusive: number, maxExclusive: number): number {
    if (!Number.isSafeInteger(minInclusive) || !Number.isSafeInteger(maxExclusive)) {
      throw new Error("nextInt bounds must be safe integers");
    }
    if (maxExclusive <= minInclusive) {
      throw new Error("nextInt maxExclusive must be greater than minInclusive");
    }
    return Math.floor(nextFloat() * (maxExclusive - minInclusive)) + minInclusive;
  }

  function pick<T>(items: T[]): T {
    if (items.length === 0) {
      throw new Error("pick requires at least one item");
    }
    const item = items[nextInt(0, items.length)];
    if (item === undefined) {
      throw new Error("pick selected an unavailable item");
    }
    return item;
  }

  function shuffle<T>(items: T[]): T[] {
    const shuffled = [...items];
    for (let index = shuffled.length - 1; index > 0; index -= 1) {
      const swapIndex = nextInt(0, index + 1);
      const current = shuffled[index];
      const swap = shuffled[swapIndex];
      if (current === undefined || swap === undefined) {
        throw new Error("shuffle selected an unavailable item");
      }
      shuffled[index] = swap;
      shuffled[swapIndex] = current;
    }
    return shuffled;
  }

  return {
    nextFloat,
    nextInt,
    pick,
    shuffle
  };
}
