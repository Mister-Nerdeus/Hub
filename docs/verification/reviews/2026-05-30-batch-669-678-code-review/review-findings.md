# Batch 669-678 Code Review Findings

## Finding 1: Shared door mutation contract allowed non-patient targets

Severity: high

`doorAuthoringContract` used the broader door-eligible room rule at the shared mutation boundary. Storage and provider/pharmacy targets were already blocked in UI preflight and candidate eligibility, but a bypassed UI path could still attempt patient-room door mutation against non-patient room types.

Fix: the shared door mutation contract now requires patient-care room targets for patient-room door add/assign operations. Safe wrappers return blocked warning results that preserve the prior valid layout for missing, storage, and provider/pharmacy targets.

## Finding 2: Quick-edit door actions bypassed recovery snapshots

Severity: high

Quick-edit nudge, center, opposite-wall, and adjacent-candidate actions dispatched door mutations directly instead of using the door snapshot wrapper. A failed mutation from these controls could skip the last-valid pre-action snapshot path required by Issue 675.

Fix: those actions now dispatch through the door-stage wrapper, matching the side-panel door actions. The recovery snapshot validator now fails if any door or support-access mutation uses raw `dispatchStage` from the stage component.

## Finding 3: Side-panel adjacent candidate selector preselected the first candidate

Severity: medium

The side-panel `DoorEditor` initialized adjacent candidate selection from the first candidate. That weakened the explicit-candidate invariant by making an assignment target appear selected before operator intent.

Fix: the selector now starts from the neutral placeholder and only dispatches after an explicit user selection. Tests and the candidate eligibility validator now check this behavior.

## Finding 4: Final preflight could not be rerun after Issue 678 GO

Severity: medium

The Issue 669 preflight checker still expected `goNoGoStatus: not_ready`, so the final Issue 678 validator could fail after all real door proof had already promoted the manifest to GO.

Fix: final-audit reruns still require source GO revocation and completed real proof, but accept the completed GO status only for Issue 678 and later. Earlier partial preflight behavior remains strict.
