import {
  manualScenarioStaffRosterIdFor,
  validateManualScenarioStaffRosterContract,
  type ManualScenarioStaffRosterContract
} from "./manualScenarioStaffRosterContract.js";

export const manualScenarioStaffRosterFixture: ManualScenarioStaffRosterContract =
  validateManualScenarioStaffRosterContract({
    staffRosterId: manualScenarioStaffRosterIdFor({ stableSeed: "manual-scenario-roster" }),
    label: "Manual Scenario Roster",
    createdAtIso: "2026-06-01T00:00:00.000Z",
    updatedAtIso: "2026-06-01T00:00:00.000Z",
    staffMembers: [
      {
        staffMemberId: "manual-staff-blue",
        displayName: "Nurse Blue",
        role: "rn",
        active: true
      },
      {
        staffMemberId: "manual-staff-green",
        displayName: "Tech Green",
        role: "tech",
        active: true
      }
    ],
    mode: "manual_roster"
  });
