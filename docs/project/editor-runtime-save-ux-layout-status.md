# Editor Runtime Save UX Layout Status

Decision: go_for_additional_editor_runtime_save_layout_repair

Runtime identity, stale runtime detection, named-copy save UX, active record identity, room/door save-reload proof, save pipeline trace, canvas height parity, and popup docking have local verification artifacts.

## Remaining Blockers
- node scripts/check-editor-runtime-version-proof.mjs --stage final --issue 650 exited 1
- node scripts/check-editor-stale-runtime-detection.mjs --stage final --issue 650 exited 1
- saveControlsRenderedInBrowser missing
- Runtime mismatch: localhost does not match expected editor save UX. Stop the dev server, pull latest source, restart npm run dev, hard refresh the browser, and verify batch marker and build commit before testing saves.

## Out Of Scope
- Collaboration, WebSockets, live sessions, optimizer work, assignment recommendations, clinical safety scoring, staffing compliance, patient outcome prediction, PHI, and EHR integration remain not started.
