import {
  validateManualStaffMembers,
  type ManualStaffMemberContract
} from "./manualStaffMemberContract.js";

export const manualStaffFixture: ManualStaffMemberContract[] = validateManualStaffMembers([
  {
    staffMemberId: "staff-rn-a",
    displayName: "RN A",
    role: "rn",
    active: true
  },
  {
    staffMemberId: "staff-rn-b",
    displayName: "RN B",
    role: "rn",
    active: true
  },
  {
    staffMemberId: "staff-rn-c",
    displayName: "RN C",
    role: "rn",
    active: true
  },
  {
    staffMemberId: "staff-charge-a",
    displayName: "Charge Nurse A",
    role: "charge_nurse",
    active: true
  }
]);
