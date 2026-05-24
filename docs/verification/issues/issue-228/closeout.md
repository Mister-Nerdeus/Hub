# Issue 228 Closeout

Summary
- Added an app shell with first-class workflow navigation and separate Developer/Evidence mode.
- Kept normal workflow focused on floorplans, editor, and placeholders for future sections.
- Moved proof-only modules into `DeveloperEvidencePage` and kept them out of the default shell sections.
- Kept existing layout/route proof modules available in developer/evidence mode without deleting modules.

Files Changed
- apps/web/src/features/app-shell/AppShell.tsx
- apps/web/src/features/app-shell/appNavigation.ts
- apps/web/src/features/app-shell/AppShell.test.ts
- apps/web/src/features/app-shell/DeveloperEvidencePage.tsx
- apps/web/src/App.tsx
- apps/web/src/App.test.ts
- docs/verification/issues/issue-228/app-shell-output.json
- docs/verification/issues/issue-228/developer-evidence-mode-output.json
- docs/verification/issues/issue-228/navigation-contract-output.json
- docs/verification/issues/issue-228/proof-wall-negative-output.json

Commands Run
- npm --workspace apps/web test
- npm --workspace apps/web run build
- node scripts/check-docs-contracts.mjs

Tests Passed / Failed
- `npm --workspace apps/web test`: passed
- `npm --workspace apps/web run build`: passed
- `node scripts/check-docs-contracts.mjs`: passed

Evidence
- `app-shell-output.json`: shell layout and proof-text isolation checks.
- `navigation-contract-output.json`: section model and default routing to Floorplans.
- `developer-evidence-mode-output.json`: proof modules remain in developer/evidence mode.
- `proof-wall-negative-output.json`: verifies proof-only text is not in normal app source.

Known Limitations
- Placeholder workflow sections are still informational and not yet wired to assignments/simulation/reporting engines.
- Route preview currently in normal mode uses placeholder text until Issue 234 equivalent functionality is finalized.

Non-PHI Confirmation
- No new PHI-shaped fields were introduced in the shell or navigation layer.
- Proof module strings do not include DOCX references or source-document payloads.

Next Recommended Issue
- Issue 229: Active Floorplan State Contract and Reducer

GO / NO-GO for Issue 229
- GO: App shell separation is complete; continue with active-floorplan workflow contract work.
