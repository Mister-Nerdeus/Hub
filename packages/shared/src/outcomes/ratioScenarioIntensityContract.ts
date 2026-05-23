import {
  validateMetricLimitations,
  validateOperationalText
} from "./operationalMetricContract.js";
import { roundToTwo } from "./outcomeMetricsBuilder.js";

export const RATIO_SCENARIO_INTENSITY_SCHEMA_VERSION = "1.0.0" as const;

export const RATIO_LABELS = ["3_to_1", "4_to_1"] as const;
export const INTENSITY_LABELS = ["light", "normal", "busy", "slammed"] as const;

export const RATIO_PATIENTS_PER_NURSE = {
  "3_to_1": 3,
  "4_to_1": 4
} as const;

export const INTENSITY_TASK_VOLUME_MULTIPLIERS = {
  light: 0.75,
  normal: 1,
  busy: 1.35,
  slammed: 1.7
} as const;

export const INTENSITY_TURNOVER_MULTIPLIERS = {
  light: 0.8,
  normal: 1,
  busy: 1.25,
  slammed: 1.6
} as const;

export type RatioLabel = (typeof RATIO_LABELS)[number];
export type IntensityLabel = (typeof INTENSITY_LABELS)[number];

export type RatioScenarioIntensityScenario = {
  scenarioKey: string;
  ratioLabel: RatioLabel;
  intensityLabel: IntensityLabel;
  targetOccupiedRoomsPerNurse: number;
  taskVolumeMultiplier: number;
  turnoverMultiplier: number;
  compositeIntensityWeight: number;
  assumptionNotes: string[];
};

export type RatioScenarioIntensityContract = {
  schemaVersion: typeof RATIO_SCENARIO_INTENSITY_SCHEMA_VERSION;
  comparisonSetId: string;
  ratios: RatioLabel[];
  intensities: IntensityLabel[];
  scenarios: RatioScenarioIntensityScenario[];
  limitations: string[];
};

type BuildRatioScenarioIntensityContractInput = {
  comparisonSetId?: string;
  ratios?: RatioLabel[];
  intensities?: IntensityLabel[];
  limitations?: string[];
};

const RATIO_SCENARIO_INTENSITY_LIMITATIONS = [
  "Ratio scenarios are deterministic operational assumptions for occupied room coverage only.",
  "Intensity scenarios apply visible task-volume and turnover multipliers without running a simulation.",
  "Scenario keys are stable comparison inputs and do not change source plans, assignments, or generated tasks."
];

const RATIO_SCENARIO_ASSUMPTION_NOTES = [
  "Ratio label maps to occupied rooms per nurse.",
  "Intensity label maps to task-volume and turnover multipliers.",
  "Composite weight is the rounded average of task-volume and turnover multipliers."
];

export function buildRatioScenarioIntensityContract(
  input: BuildRatioScenarioIntensityContractInput = {}
): RatioScenarioIntensityContract {
  const ratios = normalizeRatioLabels(input.ratios ?? [...RATIO_LABELS], "ratios");
  const intensities = normalizeIntensityLabels(input.intensities ?? [...INTENSITY_LABELS], "intensities");
  const limitations = validateMetricLimitations(
    input.limitations ?? RATIO_SCENARIO_INTENSITY_LIMITATIONS,
    "limitations"
  );

  const scenarios: RatioScenarioIntensityScenario[] = [];

  for (const ratioLabel of ratios) {
    for (const intensityLabel of intensities) {
      const taskVolumeMultiplier = INTENSITY_TASK_VOLUME_MULTIPLIERS[intensityLabel];
      const turnoverMultiplier = INTENSITY_TURNOVER_MULTIPLIERS[intensityLabel];
      scenarios.push({
        scenarioKey: `${ratioLabel}_${intensityLabel}`,
        ratioLabel,
        intensityLabel,
        targetOccupiedRoomsPerNurse: RATIO_PATIENTS_PER_NURSE[ratioLabel],
        taskVolumeMultiplier,
        turnoverMultiplier,
        compositeIntensityWeight: roundToTwo((taskVolumeMultiplier + turnoverMultiplier) / 2),
        assumptionNotes: RATIO_SCENARIO_ASSUMPTION_NOTES.map((note) =>
          validateOperationalText(note, "assumptionNotes")
        )
      });
    }
  }

  return validateRatioScenarioIntensityContract({
    schemaVersion: RATIO_SCENARIO_INTENSITY_SCHEMA_VERSION,
    comparisonSetId: input.comparisonSetId ?? "ratio-scenario-intensity-baseline",
    ratios,
    intensities,
    scenarios,
    limitations
  });
}

export function validateRatioScenarioIntensityContract(
  value: unknown
): RatioScenarioIntensityContract {
  const raw = requireRecord(value, "ratioScenarioIntensity");
  requireExactKeys(raw, "ratioScenarioIntensity", [
    "schemaVersion",
    "comparisonSetId",
    "ratios",
    "intensities",
    "scenarios",
    "limitations"
  ]);

  const contract: RatioScenarioIntensityContract = {
    schemaVersion: requireLiteral(
      raw.schemaVersion,
      RATIO_SCENARIO_INTENSITY_SCHEMA_VERSION,
      "schemaVersion"
    ),
    comparisonSetId: validateOperationalText(raw.comparisonSetId, "comparisonSetId"),
    ratios: normalizeRatioLabels(requireArray(raw.ratios, "ratios"), "ratios"),
    intensities: normalizeIntensityLabels(requireArray(raw.intensities, "intensities"), "intensities"),
    scenarios: requireArray(raw.scenarios, "scenarios").map((scenario, index) =>
      validateRatioScenarioIntensityScenario(scenario, index)
    ),
    limitations: validateMetricLimitations(raw.limitations, "limitations")
  };

  const allowedPairs = new Set(
    contract.ratios.flatMap((ratioLabel) =>
      contract.intensities.map((intensityLabel) => `${ratioLabel}_${intensityLabel}`)
    )
  );
  const scenarioKeys = contract.scenarios.map((scenario) => scenario.scenarioKey);

  if (new Set(scenarioKeys).size !== scenarioKeys.length) {
    throw new Error("scenarios scenarioKey must be unique");
  }

  for (const scenario of contract.scenarios) {
    if (!allowedPairs.has(scenario.scenarioKey)) {
      throw new Error(`scenarios scenarioKey ${scenario.scenarioKey} is not represented by ratios and intensities`);
    }
    if (scenario.scenarioKey !== `${scenario.ratioLabel}_${scenario.intensityLabel}`) {
      throw new Error("scenarios scenarioKey must match ratioLabel and intensityLabel");
    }
  }

  if (scenarioKeys.length !== allowedPairs.size) {
    throw new Error("scenarios must include every ratio and intensity pair");
  }

  return contract;
}

function validateRatioScenarioIntensityScenario(
  value: unknown,
  index: number
): RatioScenarioIntensityScenario {
  const scenario = requireRecord(value, `scenarios[${index}]`);
  requireExactKeys(scenario, `scenarios[${index}]`, [
    "scenarioKey",
    "ratioLabel",
    "intensityLabel",
    "targetOccupiedRoomsPerNurse",
    "taskVolumeMultiplier",
    "turnoverMultiplier",
    "compositeIntensityWeight",
    "assumptionNotes"
  ]);

  const ratioLabel = requireEnum(scenario.ratioLabel, RATIO_LABELS, `scenarios[${index}].ratioLabel`);
  const intensityLabel = requireEnum(
    scenario.intensityLabel,
    INTENSITY_LABELS,
    `scenarios[${index}].intensityLabel`
  );
  const taskVolumeMultiplier = requireNonNegativeNumber(
    scenario.taskVolumeMultiplier,
    `scenarios[${index}].taskVolumeMultiplier`
  );
  const turnoverMultiplier = requireNonNegativeNumber(
    scenario.turnoverMultiplier,
    `scenarios[${index}].turnoverMultiplier`
  );

  if (scenario.targetOccupiedRoomsPerNurse !== RATIO_PATIENTS_PER_NURSE[ratioLabel]) {
    throw new Error(`scenarios[${index}].targetOccupiedRoomsPerNurse must match ratioLabel`);
  }
  if (taskVolumeMultiplier !== INTENSITY_TASK_VOLUME_MULTIPLIERS[intensityLabel]) {
    throw new Error(`scenarios[${index}].taskVolumeMultiplier must match intensityLabel`);
  }
  if (turnoverMultiplier !== INTENSITY_TURNOVER_MULTIPLIERS[intensityLabel]) {
    throw new Error(`scenarios[${index}].turnoverMultiplier must match intensityLabel`);
  }

  return {
    scenarioKey: validateOperationalText(scenario.scenarioKey, `scenarios[${index}].scenarioKey`),
    ratioLabel,
    intensityLabel,
    targetOccupiedRoomsPerNurse: requirePositiveNumber(
      scenario.targetOccupiedRoomsPerNurse,
      `scenarios[${index}].targetOccupiedRoomsPerNurse`
    ),
    taskVolumeMultiplier,
    turnoverMultiplier,
    compositeIntensityWeight: requireNonNegativeNumber(
      scenario.compositeIntensityWeight,
      `scenarios[${index}].compositeIntensityWeight`
    ),
    assumptionNotes: requireArray(
      scenario.assumptionNotes,
      `scenarios[${index}].assumptionNotes`
    ).map((note, noteIndex) =>
      validateOperationalText(note, `scenarios[${index}].assumptionNotes[${noteIndex}]`)
    )
  };
}

function normalizeRatioLabels(value: unknown[], label: string): RatioLabel[] {
  const ratios = value.map((item, index) => requireEnum(item, RATIO_LABELS, `${label}[${index}]`));
  requireUnique(label, ratios);
  if (ratios.length === 0) {
    throw new Error(`${label} requires at least one value`);
  }
  return ratios;
}

function normalizeIntensityLabels(value: unknown[], label: string): IntensityLabel[] {
  const intensities = value.map((item, index) =>
    requireEnum(item, INTENSITY_LABELS, `${label}[${index}]`)
  );
  requireUnique(label, intensities);
  if (intensities.length === 0) {
    throw new Error(`${label} requires at least one value`);
  }
  return intensities;
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function requireEnum<T extends string>(
  value: unknown,
  allowed: readonly T[],
  label: string
): T {
  if (typeof value !== "string" || !allowed.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowed.join(", ")}`);
  }
  return value as T;
}

function requirePositiveNumber(value: unknown, label: string): number {
  const numberValue = requireNonNegativeNumber(value, label);
  if (numberValue <= 0) {
    throw new Error(`${label} must be positive`);
  }
  return numberValue;
}

function requireNonNegativeNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  if (value < 0) {
    throw new Error(`${label} must be non-negative`);
  }
  return value;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireUnique(label: string, values: string[]): void {
  if (new Set(values).size !== values.length) {
    throw new Error(`${label} must be unique`);
  }
}
