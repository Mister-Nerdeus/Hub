import {
  ASSIGNMENT_TEMPLATE_SCHEMA_VERSION,
  type AssignmentScenarioTemplateContract
} from "./assignmentScenarioTemplateContract.js";
import { CANONICAL_ER_POD_FLOORPLAN_ID } from "./scenarioSeedContract.js";

export const fourToOneAssignmentScenarioTemplate: AssignmentScenarioTemplateContract = {
  schemaVersion: ASSIGNMENT_TEMPLATE_SCHEMA_VERSION,
  assignmentTemplateId: "assignment-template-canonical-er-pod-4-to-1",
  label: "Canonical ER pod 4:1 assignment template",
  canonicalFloorplanId: CANONICAL_ER_POD_FLOORPLAN_ID,
  ratioConfigurationId: "four_to_one",
  nurseGroups: [
    {
      nurseGroupId: "synthetic-nurse-group-blue",
      syntheticNurseLabel: "Nurse Blue",
      roomIds: ["room-level-1-trauma", "room-02", "room-03", "room-04"],
      syntheticDataOnly: true
    },
    {
      nurseGroupId: "synthetic-nurse-group-green",
      syntheticNurseLabel: "Nurse Green",
      roomIds: ["room-05", "room-06", "room-07", "room-08"],
      syntheticDataOnly: true
    },
    {
      nurseGroupId: "synthetic-nurse-group-purple",
      syntheticNurseLabel: "Nurse Purple",
      roomIds: ["room-09", "room-10", "room-11", "room-12"],
      syntheticDataOnly: true
    },
    {
      nurseGroupId: "synthetic-nurse-group-orange",
      syntheticNurseLabel: "Nurse Orange",
      roomIds: ["room-13", "room-14", "room-15", "room-16"],
      syntheticDataOnly: true
    },
    {
      nurseGroupId: "synthetic-nurse-group-teal",
      syntheticNurseLabel: "Nurse Teal",
      roomIds: ["room-17", "room-19", "room-20", "room-21"],
      syntheticDataOnly: true
    },
    {
      nurseGroupId: "synthetic-nurse-group-slate",
      syntheticNurseLabel: "Nurse Slate",
      roomIds: ["room-22", "room-23", "room-24"],
      syntheticDataOnly: true
    }
  ],
  syntheticDataOnly: true
};

export const threeToOneAssignmentScenarioTemplate: AssignmentScenarioTemplateContract = {
  schemaVersion: ASSIGNMENT_TEMPLATE_SCHEMA_VERSION,
  assignmentTemplateId: "assignment-template-canonical-er-pod-3-to-1",
  label: "Canonical ER pod 3:1 assignment template",
  canonicalFloorplanId: CANONICAL_ER_POD_FLOORPLAN_ID,
  ratioConfigurationId: "three_to_one",
  nurseGroups: [
    {
      nurseGroupId: "synthetic-nurse-group-blue",
      syntheticNurseLabel: "Nurse Blue",
      roomIds: ["room-level-1-trauma", "room-02", "room-03"],
      syntheticDataOnly: true
    },
    {
      nurseGroupId: "synthetic-nurse-group-green",
      syntheticNurseLabel: "Nurse Green",
      roomIds: ["room-04", "room-05", "room-06"],
      syntheticDataOnly: true
    },
    {
      nurseGroupId: "synthetic-nurse-group-purple",
      syntheticNurseLabel: "Nurse Purple",
      roomIds: ["room-07", "room-08", "room-09"],
      syntheticDataOnly: true
    },
    {
      nurseGroupId: "synthetic-nurse-group-orange",
      syntheticNurseLabel: "Nurse Orange",
      roomIds: ["room-10", "room-11", "room-12"],
      syntheticDataOnly: true
    },
    {
      nurseGroupId: "synthetic-nurse-group-teal",
      syntheticNurseLabel: "Nurse Teal",
      roomIds: ["room-13", "room-14", "room-15"],
      syntheticDataOnly: true
    },
    {
      nurseGroupId: "synthetic-nurse-group-slate",
      syntheticNurseLabel: "Nurse Slate",
      roomIds: ["room-16", "room-17", "room-19"],
      syntheticDataOnly: true
    },
    {
      nurseGroupId: "synthetic-nurse-group-cyan",
      syntheticNurseLabel: "Nurse Cyan",
      roomIds: ["room-20", "room-21", "room-22"],
      syntheticDataOnly: true
    },
    {
      nurseGroupId: "synthetic-nurse-group-gold",
      syntheticNurseLabel: "Nurse Gold",
      roomIds: ["room-23", "room-24"],
      syntheticDataOnly: true
    }
  ],
  syntheticDataOnly: true
};

export const assignmentScenarioTemplateFixtures = [
  fourToOneAssignmentScenarioTemplate,
  threeToOneAssignmentScenarioTemplate
] as const;
