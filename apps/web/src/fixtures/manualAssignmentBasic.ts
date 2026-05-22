import type { ManualAssignmentContract, RoomLoad } from "@nerdeus/shared";

import { planErPodPhase2 } from "./planErPodPhase2";

export const manualAssignmentRoomLoads: RoomLoad[] = [
  {
    roomId: "room-01",
    occupied: true,
    acuity: 3,
    traumaActive: false,
    isolationActive: false,
    behavioralRisk: false,
    fallRisk: true,
    sitterRequired: false,
    medicationFrequency: "medium",
    monitoringFrequency: "high",
    procedureBurden: "low",
    expectedTurnover: "normal"
  },
  {
    roomId: "room-02",
    occupied: true,
    acuity: 5,
    traumaActive: true,
    isolationActive: false,
    behavioralRisk: false,
    fallRisk: false,
    sitterRequired: false,
    medicationFrequency: "high",
    monitoringFrequency: "continuous",
    procedureBurden: "medium",
    expectedTurnover: "high"
  },
  {
    roomId: "room-03",
    occupied: true,
    acuity: 2,
    traumaActive: false,
    isolationActive: true,
    behavioralRisk: false,
    fallRisk: false,
    sitterRequired: false,
    medicationFrequency: "low",
    monitoringFrequency: "medium",
    procedureBurden: "none",
    expectedTurnover: "low"
  },
  {
    roomId: "room-04",
    occupied: true,
    acuity: 3,
    traumaActive: false,
    isolationActive: false,
    behavioralRisk: true,
    fallRisk: false,
    sitterRequired: true,
    medicationFrequency: "medium",
    monitoringFrequency: "medium",
    procedureBurden: "low",
    expectedTurnover: "normal"
  },
  {
    roomId: "room-05",
    occupied: true,
    acuity: 1,
    traumaActive: false,
    isolationActive: false,
    behavioralRisk: false,
    fallRisk: false,
    sitterRequired: false,
    medicationFrequency: "low",
    monitoringFrequency: "low",
    procedureBurden: "high",
    expectedTurnover: "normal"
  },
  {
    roomId: "room-06",
    occupied: false,
    acuity: 1,
    traumaActive: false,
    isolationActive: false,
    behavioralRisk: false,
    fallRisk: false,
    sitterRequired: false,
    medicationFrequency: "none",
    monitoringFrequency: "none",
    procedureBurden: "none",
    expectedTurnover: "low"
  },
  {
    roomId: "hall-bed-01",
    occupied: true,
    acuity: 4,
    traumaActive: false,
    isolationActive: false,
    behavioralRisk: false,
    fallRisk: true,
    sitterRequired: false,
    medicationFrequency: "medium",
    monitoringFrequency: "high",
    procedureBurden: "medium",
    expectedTurnover: "surge"
  }
];

export const manualAssignmentBasic: ManualAssignmentContract = {
  schemaVersion: "1.0.0",
  assignmentSetId: "manual-assignment-basic",
  planId: planErPodPhase2.planId,
  name: "Basic Manual Assignment",
  description: "Synthetic operational assignment set for Phase 3 proof.",
  nurses: [
    {
      id: "nurse-alpha",
      name: "Nurse Alpha",
      color: "#2563eb",
      role: "primary",
      homeStationId: "station-primary",
      traumaQualified: false,
      chargeQualified: false,
      psychQualified: true,
      triageQualified: false,
      maxPatients: 3,
      targetPatients: 1,
      walkingSpeedFeetPerMinute: 250,
      shiftStartMinute: 0,
      shiftEndMinute: 720,
      breakWindows: [
        {
          id: "break-alpha-1",
          nurseId: "nurse-alpha",
          startMinute: 240,
          endMinute: 270,
          flexible: true
        }
      ]
    },
    {
      id: "nurse-bravo",
      name: "Nurse Bravo",
      color: "#059669",
      role: "float",
      homeStationId: "station-primary",
      traumaQualified: false,
      chargeQualified: false,
      psychQualified: false,
      triageQualified: false,
      maxPatients: 2,
      targetPatients: 1,
      walkingSpeedFeetPerMinute: 240,
      shiftStartMinute: 0,
      shiftEndMinute: 720,
      breakWindows: [
        {
          id: "break-bravo-1",
          nurseId: "nurse-bravo",
          startMinute: 300,
          endMinute: 330,
          flexible: true
        }
      ]
    },
    {
      id: "nurse-charlie",
      name: "Nurse Charlie",
      color: "#b45309",
      role: "trauma",
      homeStationId: "station-primary",
      traumaQualified: true,
      chargeQualified: false,
      psychQualified: false,
      triageQualified: false,
      maxPatients: 2,
      targetPatients: 2,
      walkingSpeedFeetPerMinute: 255,
      shiftStartMinute: 0,
      shiftEndMinute: 720,
      breakWindows: [
        {
          id: "break-charlie-1",
          nurseId: "nurse-charlie",
          startMinute: 360,
          endMinute: 390,
          flexible: false
        }
      ]
    }
  ],
  assignments: [
    {
      id: "assignment-alpha",
      nurseId: "nurse-alpha",
      roomIds: ["room-01", "room-03"],
      assignmentType: "manual",
      startMinute: 0,
      endMinute: null
    },
    {
      id: "assignment-bravo",
      nurseId: "nurse-bravo",
      roomIds: ["room-04"],
      assignmentType: "manual",
      startMinute: 0,
      endMinute: null
    },
    {
      id: "assignment-charlie",
      nurseId: "nurse-charlie",
      roomIds: ["room-02", "room-05"],
      assignmentType: "manual",
      startMinute: 0,
      endMinute: null
    }
  ]
};
