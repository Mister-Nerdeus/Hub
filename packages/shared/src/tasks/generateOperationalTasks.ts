import type {
  AssumptionsRegisterContract,
  BurdenLevel,
  CareTaskTemplate,
  DayProfileContract,
  DayProfileSegment,
  GeneratedOperationalTask,
  RoomLoad,
  ShiftScenarioContract,
  TaskFrequency,
  TaskFrequencyMappings,
  TaskTemplateContract,
  TaskType,
  TurnoverLevel
} from "../contracts.js";
import {
  validateAssumptionsRegisterContract,
  validateDayProfileContract,
  validateGeneratedOperationalTasks,
  validateShiftScenarioContract,
  validateTaskTemplateContract
} from "../contracts.js";
import { createSeededRandom, type SeededRandom } from "../random/seededRandom.js";

export type GenerateOperationalTasksInput = {
  scenario: ShiftScenarioContract;
  assumptions: AssumptionsRegisterContract;
  taskTemplates: TaskTemplateContract;
  dayProfile: DayProfileContract;
};

export function generateOperationalTasks(
  input: GenerateOperationalTasksInput
): GeneratedOperationalTask[] {
  const assumptions = validateAssumptionsRegisterContract(input.assumptions);
  const taskTemplates = validateTaskTemplateContract(input.taskTemplates);
  const dayProfile = validateDayProfileContract(input.dayProfile);
  const scenario = validateShiftScenarioContract(input.scenario, {
    assumptions,
    taskTemplates,
    dayProfile
  });
  const random = createSeededRandom(scenario.seed);
  const generatedTasks: GeneratedOperationalTask[] = [];
  const sortedRoomLoads = [...scenario.roomLoads].sort((left, right) =>
    left.roomId.localeCompare(right.roomId)
  );
  const sortedTemplates = [...taskTemplates.taskTemplates].sort((left, right) =>
    left.id.localeCompare(right.id)
  );

  for (const roomLoad of sortedRoomLoads) {
    if (!roomLoad.occupied) {
      continue;
    }

    for (const template of sortedTemplates) {
      const baseCount = getBaseTaskCount(roomLoad, template, assumptions.taskFrequencyMappings);
      const adjustedCount = adjustCountForDayProfile(baseCount, template, dayProfile);

      for (let occurrenceIndex = 0; occurrenceIndex < adjustedCount; occurrenceIndex += 1) {
        const segment = pickSegmentForTemplate(random, template, dayProfile);
        const scheduledMinute = pickScheduledMinute(random, segment, scenario);
        generatedTasks.push({
          id: buildTaskId(scenario.scenarioId, roomLoad.roomId, template.id, occurrenceIndex),
          taskType: template.taskType,
          roomId: roomLoad.roomId,
          sourceTemplateId: template.id,
          scheduledMinute,
          estimatedDurationMinutes: durationForTaskType(template.taskType, assumptions),
          burdenCategory: template.burdenCategory,
          interruptive: template.interruptive,
          requiresRoomPresence: template.requiresRoomPresence
        });
      }
    }
  }

  const sortedTasks = generatedTasks.sort((left, right) => {
    const minuteDelta = left.scheduledMinute - right.scheduledMinute;
    if (minuteDelta !== 0) {
      return minuteDelta;
    }
    const roomDelta = left.roomId.localeCompare(right.roomId);
    if (roomDelta !== 0) {
      return roomDelta;
    }
    const templateDelta = left.sourceTemplateId.localeCompare(right.sourceTemplateId);
    if (templateDelta !== 0) {
      return templateDelta;
    }
    return left.id.localeCompare(right.id);
  });

  return validateGeneratedOperationalTasks(sortedTasks, scenario);
}

function getBaseTaskCount(
  roomLoad: RoomLoad,
  template: CareTaskTemplate,
  mappings: TaskFrequencyMappings
): number {
  if (template.frequencySource === "room_load_frequency") {
    const frequency = roomLoad[template.trigger];
    if (frequency !== "none" && frequency !== "low" && frequency !== "medium" && frequency !== "high" && frequency !== "continuous") {
      throw new Error(`template ${template.id} uses a non-frequency trigger`);
    }
    return mappings[frequency];
  }
  if (template.frequencySource === "room_load_burden") {
    return mappings[mapBurdenToFrequency(roomLoad.procedureBurden)];
  }
  if (template.frequencySource === "room_load_turnover") {
    return mappings[mapTurnoverToFrequency(roomLoad.expectedTurnover)];
  }

  const triggerValue = roomLoad[template.trigger];
  if (typeof triggerValue !== "boolean") {
    throw new Error(`template ${template.id} uses a non-boolean trigger`);
  }
  return triggerValue ? 1 : 0;
}

function adjustCountForDayProfile(
  baseCount: number,
  template: CareTaskTemplate,
  dayProfile: DayProfileContract
): number {
  if (baseCount === 0) {
    return 0;
  }
  const totalWeight = dayProfile.segments.reduce(
    (total, segment) =>
      total + (segment.endMinute - segment.startMinute) * multiplierForTemplate(segment, template),
    0
  );
  const averageMultiplier = totalWeight / dayProfile.shiftLengthMinutes;
  return Math.max(1, Math.round(baseCount * averageMultiplier));
}

function pickSegmentForTemplate(
  random: SeededRandom,
  template: CareTaskTemplate,
  dayProfile: DayProfileContract
): DayProfileSegment {
  const weightedSegments = dayProfile.segments.map((segment) => ({
    segment,
    weight: (segment.endMinute - segment.startMinute) * multiplierForTemplate(segment, template)
  }));
  const totalWeight = weightedSegments.reduce((total, segment) => total + segment.weight, 0);
  let threshold = random.nextFloat() * totalWeight;
  for (const weightedSegment of weightedSegments) {
    threshold -= weightedSegment.weight;
    if (threshold <= 0) {
      return weightedSegment.segment;
    }
  }
  const fallback = weightedSegments.at(-1)?.segment;
  if (fallback == null) {
    throw new Error("day profile requires at least one segment");
  }
  return fallback;
}

function pickScheduledMinute(
  random: SeededRandom,
  segment: DayProfileSegment,
  scenario: ShiftScenarioContract
): number {
  const rawMinute = segment.startMinute + random.nextInt(0, segment.endMinute - segment.startMinute);
  const alignedMinute = Math.floor(rawMinute / scenario.timestepMinutes) * scenario.timestepMinutes;
  return Math.min(alignedMinute, scenario.shiftLengthMinutes - scenario.timestepMinutes);
}

function multiplierForTemplate(
  segment: DayProfileSegment,
  template: CareTaskTemplate
): number {
  if (template.frequencySource === "room_load_turnover") {
    return segment.turnoverMultiplier;
  }
  if (template.interruptive) {
    return segment.interruptionMultiplier;
  }
  return segment.taskVolumeMultiplier;
}

function durationForTaskType(
  taskType: TaskType,
  assumptions: AssumptionsRegisterContract
): number {
  switch (taskType) {
    case "medication_round":
      return assumptions.taskDurationDefaults.medicationTaskMinutes;
    case "monitoring_check":
      return assumptions.taskDurationDefaults.monitoringTaskMinutes;
    case "procedure_support":
      return assumptions.taskDurationDefaults.procedureTaskMinutes;
    case "room_turnover":
      return assumptions.taskDurationDefaults.turnoverTaskMinutes;
    case "isolation_prep":
      return assumptions.taskDurationDefaults.isolationTaskMinutes;
    case "behavioral_observation":
      return assumptions.taskDurationDefaults.behavioralRiskTaskMinutes;
    case "sitter_observation":
      return assumptions.taskDurationDefaults.sitterTaskMinutes;
  }
}

function mapBurdenToFrequency(value: BurdenLevel): TaskFrequency {
  if (value === "very_high") {
    return "continuous";
  }
  return value;
}

function mapTurnoverToFrequency(value: TurnoverLevel): TaskFrequency {
  if (value === "low") {
    return "none";
  }
  if (value === "normal") {
    return "low";
  }
  if (value === "high") {
    return "medium";
  }
  return "high";
}

function buildTaskId(
  scenarioId: string,
  roomId: string,
  templateId: string,
  occurrenceIndex: number
): string {
  return `task-${scenarioId}-${roomId}-${templateId}-${String(occurrenceIndex + 1).padStart(3, "0")}`;
}
