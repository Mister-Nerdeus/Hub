import type { AssignmentSetContract, NurseProfileContract } from "@nerdeus/shared";
import {
  addNurseProfile,
  deactivateNurseProfile,
  updateNurseProfile
} from "./nurseProfileActions";
import { createNurseProfileBuilderViewModel } from "./nurseProfileViewModel";

type NurseProfileBuilderProps = {
  assignmentSet: AssignmentSetContract;
  onAssignmentSetChange: (assignmentSet: AssignmentSetContract) => void;
};

export function NurseProfileBuilder({
  assignmentSet,
  onAssignmentSetChange
}: NurseProfileBuilderProps) {
  const profiles = createNurseProfileBuilderViewModel(assignmentSet.nurseProfiles);

  function updateProfile(
    nurseProfileId: string,
    patch: Partial<NurseProfileContract>
  ) {
    const profile = assignmentSet.nurseProfiles.find((candidate) => candidate.nurseProfileId === nurseProfileId);
    if (profile == null) return;
    const next = { ...profile, ...patch };
    if (next.displayLabel.trim().length === 0) return;
    if (!Number.isFinite(next.targetPatientCount) || next.targetPatientCount < 0) return;
    if (!Number.isFinite(next.maxPatientCount) || next.maxPatientCount < 0) return;
    if (next.maxPatientCount < next.targetPatientCount) {
      next.maxPatientCount = next.targetPatientCount;
    }
    try {
      onAssignmentSetChange(updateNurseProfile(assignmentSet, next));
    } catch {
      return;
    }
  }

  return (
    <section
      className="manual-assignment-workspace__panel nurse-profile-builder"
      aria-labelledby="nurse-profile-builder-title"
      data-nurse-profile-builder="assignment-set"
      data-nurse-profiles-structured="true"
      data-operational-display-labels-only="true"
    >
      <div className="manual-assignment-workspace__panel-header">
        <h3 id="nurse-profile-builder-title">Nurse Profiles</h3>
        <button type="button" onClick={() => onAssignmentSetChange(addNurseProfile(assignmentSet))}>
          Add Nurse
        </button>
      </div>
      <div className="nurse-profile-builder__grid">
        {profiles.map((profile) => (
          <article
            className="nurse-profile-builder__card"
            key={profile.nurseProfileId}
            data-nurse-profile-id={profile.nurseProfileId}
            data-nurse-profile-active={profile.active ? "true" : "false"}
          >
            <label>
              Display label
              <input
                value={profile.displayLabel}
                onChange={(event) => updateProfile(profile.nurseProfileId, { displayLabel: event.target.value })}
              />
            </label>
            <label>
              Color
              <input
                type="color"
                value={profile.color}
                onChange={(event) => updateProfile(profile.nurseProfileId, { color: event.target.value })}
              />
            </label>
            <label>
              Role
              <select
                value={profile.role}
                onChange={(event) => updateProfile(profile.nurseProfileId, { role: event.target.value as NurseProfileContract["role"] })}
              >
                <option value="primary">Primary</option>
                <option value="charge">Charge</option>
                <option value="float">Float</option>
                <option value="triage">Triage</option>
              </select>
            </label>
            <label>
              Target patients
              <input
                min={0}
                type="number"
                value={profile.targetPatientCount}
                onChange={(event) => updateProfile(profile.nurseProfileId, { targetPatientCount: Number(event.target.value) })}
              />
            </label>
            <label>
              Max patients
              <input
                min={0}
                type="number"
                value={profile.maxPatientCount}
                onChange={(event) => updateProfile(profile.nurseProfileId, { maxPatientCount: Number(event.target.value) })}
              />
            </label>
            <label className="nurse-profile-builder__check">
              <input
                checked={profile.traumaQualified}
                type="checkbox"
                onChange={(event) => updateProfile(profile.nurseProfileId, { traumaQualified: event.target.checked })}
              />
              Trauma qualified
            </label>
            <label className="nurse-profile-builder__check">
              <input
                checked={profile.psychQualified}
                type="checkbox"
                onChange={(event) => updateProfile(profile.nurseProfileId, { psychQualified: event.target.checked })}
              />
              Psych qualified
            </label>
            <label className="nurse-profile-builder__check">
              <input
                checked={profile.chargeQualified}
                type="checkbox"
                onChange={(event) => updateProfile(profile.nurseProfileId, { chargeQualified: event.target.checked })}
              />
              Charge qualified
            </label>
            <div className="nurse-profile-builder__status">
              <span>{profile.statusLabel}</span>
              <button
                type="button"
                disabled={!profile.active}
                onClick={() => onAssignmentSetChange(deactivateNurseProfile(assignmentSet, profile.nurseProfileId))}
              >
                Deactivate
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
}
