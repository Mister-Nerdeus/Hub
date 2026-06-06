export type ManualScenarioClock = {
  nowIso(): string;
};

export const MANUAL_SCENARIO_FIXTURE_TIMESTAMP = "2026-06-01T00:00:00.000Z";

export const manualScenarioFixtureClock: ManualScenarioClock = {
  nowIso: () => MANUAL_SCENARIO_FIXTURE_TIMESTAMP
};

export function createManualScenarioSystemClock(): ManualScenarioClock {
  return {
    nowIso: () => new Date().toISOString()
  };
}

export function createManualScenarioSequenceClock(timestamps: readonly string[]): ManualScenarioClock {
  if (timestamps.length === 0) {
    throw new Error("manualScenarioClock timestamps must not be empty");
  }
  const sequence = [...timestamps];
  const finalTimestamp = sequence[sequence.length - 1] ?? MANUAL_SCENARIO_FIXTURE_TIMESTAMP;
  let index = 0;
  return {
    nowIso: () => {
      const value = sequence[index] ?? finalTimestamp;
      index += 1;
      return value;
    }
  };
}
