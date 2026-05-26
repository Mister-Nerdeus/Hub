import type { ManualAssignmentRoomLoad } from "./manualAssignmentContracts.js";

export const syntheticManualAssignmentRoomLoads: ManualAssignmentRoomLoad[] = [
  {
    roomId: "room-101",
    occupied: true,
    acuity: 3,
    traumaActive: false,
    isolationActive: false,
    behavioralRisk: false,
    fallRisk: true,
    sitterRequired: false,
    medicationFrequency: "medium",
    monitoringFrequency: "medium",
    procedureBurden: "low",
    expectedTurnover: "low",
    syntheticDataOnly: true
  },
  {
    roomId: "room-102",
    occupied: true,
    acuity: 4,
    traumaActive: true,
    isolationActive: false,
    behavioralRisk: false,
    fallRisk: false,
    sitterRequired: false,
    medicationFrequency: "high",
    monitoringFrequency: "high",
    procedureBurden: "medium",
    expectedTurnover: "medium",
    syntheticDataOnly: true
  },
  {
    roomId: "room-103",
    occupied: false,
    acuity: 1,
    traumaActive: false,
    isolationActive: false,
    behavioralRisk: false,
    fallRisk: false,
    sitterRequired: false,
    medicationFrequency: "none",
    monitoringFrequency: "low",
    procedureBurden: "none",
    expectedTurnover: "none",
    syntheticDataOnly: true
  }
];
