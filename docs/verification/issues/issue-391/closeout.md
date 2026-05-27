# Issue 391 Closeout

## Summary

Completed a post-batch code review against the Manual Assignment Workflow Foundation requirements. The review found that manual-assignment screenshot evidence was placeholder-sized and the manual-assignment gates did not reject it. The repair adds browser-rendered screenshot capture and hardens the manual-assignment UI, burden, and foundation gates to reject missing or placeholder-like screenshot evidence.

## Files Changed

- scripts/capture-manual-assignment-screenshots.mjs
- scripts/check-manual-assignment-foundation.mjs
- scripts/check-manual-assignment-ui.mjs
- scripts/check-manual-assignment-burden.mjs
- docs/verification/issues/issue-383/screenshots/nurse-profile-panel.png
- docs/verification/issues/issue-384/screenshots/room-load-editor-panel.png
- docs/verification/issues/issue-386/screenshots/
- docs/verification/issues/issue-388/screenshots/
- docs/verification/issues/issue-389/screenshots/four-patient-comparison-panel.png
- docs/verification/issues/issue-390/screenshots/
- docs/verification/issues/issue-390/manual-assignment-screenshot-manifest-output.json
- docs/verification/issues/issue-391/

## Commands Run

- See commands.txt and command-output-map.json.

## Tests Passed/Failed

- Passed: shared tests, web tests, web build, no-PHI, private-source artifacts, canonical gates, manual-assignment contracts, UI, burden, final foundation gate, default fixture nonmutation, real-browser proof, docs gate, Docker-backed verify-local, and git diff check.
- Failed/reproduced first: docs gate initially failed before Issue 391 closeout/index files existed, and the code review found placeholder screenshot evidence before the gate hardening.

## Evidence Artifacts

- docs/verification/issues/issue-391/test-output/
- docs/verification/issues/issue-390/manual-assignment-screenshot-manifest-output.json
- docs/verification/issues/issue-390/screenshots/

## Known Limitations

- Manual visual approval remains missing and is not claimed.
- Promotion remains blocked.
- The screenshots prove browser rendering only; they do not approve visual correctness on behalf of a human.

## Non-PHI Confirmation

- Non-PHI rules still pass.
- No PHI, EHR data, real patient identity, real nurse names, employee IDs, diagnosis text, medication names, clinical notes, optimizer behavior, full-shift simulation behavior, clinical safety scoring, or staffing compliance certification were introduced.

## Next Recommended Issue

Manual Assignment Refinement and Scenario Builder Foundation remains the next eligible direction; promotion and manual visual approval remain blocked until explicit structured human review exists.
