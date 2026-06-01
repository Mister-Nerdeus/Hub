import type { ManualStaffMemberContract } from "@nerdeus/shared";

type StaffListPanelProps = {
  staffMembers: readonly ManualStaffMemberContract[];
  selectedStaffMemberId: string;
  onSelectStaffMember: (staffMemberId: string) => void;
};

export function StaffListPanel({
  staffMembers,
  selectedStaffMemberId,
  onSelectStaffMember
}: StaffListPanelProps) {
  return (
    <section className="manual-foundation-panel" aria-labelledby="manual-staff-title">
      <h3 id="manual-staff-title">Staff</h3>
      <div className="manual-foundation-list" role="list">
        {staffMembers.map((staff) => (
          <button
            aria-pressed={staff.staffMemberId === selectedStaffMemberId}
            className="manual-foundation-list__item"
            data-manual-staff-id={staff.staffMemberId}
            key={staff.staffMemberId}
            type="button"
            onClick={() => onSelectStaffMember(staff.staffMemberId)}
          >
            <strong>{staff.displayName}</strong>
            <span>{staff.role}</span>
          </button>
        ))}
      </div>
    </section>
  );
}
