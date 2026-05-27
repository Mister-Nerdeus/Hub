export const manualBurdenWeightRegister = {
  description: "Editable operational assumptions for manual assignment burden scoring; these are not care-certification or staffing-certification facts.",
  acuity: {
    1: 1,
    2: 2,
    3: 4,
    4: 7,
    5: 10
  },
  traumaActive: 8,
  isolationActive: 3,
  behavioralRisk: 4,
  fallRisk: 2,
  sitterRequired: 5,
  highMedicationFrequency: 3,
  highMonitoringFrequency: 3,
  highProcedureBurden: 4,
  overTargetRoom: 5,
  overMaxRoom: 10
} as const;
