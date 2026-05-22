import type {
  GeneratedOperationalTaskSetContract,
  ManualAssignmentContract,
  PlanContract,
  ShiftScenarioContract
} from "@nerdeus/shared";

import { manualAssignmentBasic, manualAssignmentRoomLoads } from "./manualAssignmentBasic";
import { planErPodPhase2 } from "./planErPodPhase2";

export type Phase6ReportProofFixture = {
  plan: PlanContract;
  scenario: ShiftScenarioContract;
  manualAssignmentSet: ManualAssignmentContract;
  generatedTaskSet: GeneratedOperationalTaskSetContract;
};

export const phase6ReportProofFixture: Phase6ReportProofFixture = {
  plan: planErPodPhase2,
  scenario: {
    schemaVersion: "1.0.0",
    scenarioId: "shift-scenario-basic",
    planId: planErPodPhase2.planId,
    assignmentSetId: manualAssignmentBasic.assignmentSetId,
    assumptionsId: "assumptions-basic",
    taskTemplateSetId: "task-templates-basic",
    dayProfileId: "day-profile-typical",
    name: "Basic Deterministic Shift Scenario",
    description: "Synthetic operational scenario for Phase 6 report proof.",
    shiftLengthMinutes: 720,
    timestepMinutes: 15,
    seed: 20260522,
    roomLoads: manualAssignmentRoomLoads
  },
  manualAssignmentSet: manualAssignmentBasic,
  generatedTaskSet: {
    schemaVersion: "1.0.0",
    generatedTaskSetId: "generated-task-set-basic",
    scenarioId: "shift-scenario-basic",
    seed: 20260522,
    taskCount: 6,
    generatedTasks: [
      {
        id: "task-basic-room-01-medication-001",
        taskType: "medication_round",
        roomId: "room-01",
        sourceTemplateId: "template-medication-round",
        scheduledMinute: 0,
        estimatedDurationMinutes: 10,
        burdenCategory: "medication",
        interruptive: false,
        requiresRoomPresence: true
      },
      {
        id: "task-basic-room-02-monitoring-001",
        taskType: "monitoring_check",
        roomId: "room-02",
        sourceTemplateId: "template-monitoring-check",
        scheduledMinute: 0,
        estimatedDurationMinutes: 5,
        burdenCategory: "monitoring",
        interruptive: false,
        requiresRoomPresence: true
      },
      {
        id: "task-basic-hall-bed-01-turnover-001",
        taskType: "room_turnover",
        roomId: "hall-bed-01",
        sourceTemplateId: "template-room-turnover",
        scheduledMinute: 15,
        estimatedDurationMinutes: 15,
        burdenCategory: "turnover",
        interruptive: false,
        requiresRoomPresence: true
      },
      {
        id: "task-basic-room-03-isolation-001",
        taskType: "isolation_prep",
        roomId: "room-03",
        sourceTemplateId: "template-isolation-prep",
        scheduledMinute: 30,
        estimatedDurationMinutes: 8,
        burdenCategory: "isolation",
        interruptive: true,
        requiresRoomPresence: true
      },
      {
        id: "task-basic-room-04-behavioral-001",
        taskType: "behavioral_observation",
        roomId: "room-04",
        sourceTemplateId: "template-behavioral-observation",
        scheduledMinute: 30,
        estimatedDurationMinutes: 15,
        burdenCategory: "behavioral",
        interruptive: true,
        requiresRoomPresence: true
      },
      {
        id: "task-basic-room-05-procedure-001",
        taskType: "procedure_support",
        roomId: "room-05",
        sourceTemplateId: "template-procedure-support",
        scheduledMinute: 45,
        estimatedDurationMinutes: 20,
        burdenCategory: "procedure",
        interruptive: false,
        requiresRoomPresence: true
      }
    ]
  }
};
