# Batch 227-236 Code Review Findings

## Findings

1. Resolved: Docker/Linux CSS import casing risk.

   `apps/web/src/features/app-shell/AppShell.tsx` imports `./appShell.css`, while the committed stylesheet was `AppShell.css`. Windows builds passed, but Linux Docker builds use a case-sensitive filesystem. The file was renamed to `appShell.css`.

2. Resolved: duplicate app-shell styling lived in global and feature CSS.

   Shell selectors were present in `apps/web/src/styles.css` and `apps/web/src/features/app-shell/appShell.css`. The duplicate global block was removed and the `.app-shell` wrapper style was kept with the feature-owned stylesheet.

3. Resolved: Docker context did not explicitly exclude private DOCX artifacts.

   `.gitignore` blocked future committed DOCX files, but `.dockerignore` did not block local DOCX files from Docker build context. `.dockerignore` now excludes `*.docx` and `docs/floorplans/*.docx`.

4. Blocking for full Batch 227-236 completion: Issues 229-236 are not implemented or evidenced in this tree.

   Evidence folders for `issue-229` through `issue-236` are absent. The active floorplan state still uses the older `default-json` / `saved-json` shape instead of the required `ActiveFloorplanSourceType`, `dirty`, `readOnly`, `lastValidationStatus`, and action contract. Normal Routes still renders placeholder text, and current floorplan import/export remains editor-local rather than active-app-state-driven.

## GO / NO-GO

NO-GO for claiming Batch 227-236 complete.

GO for committing the cleanup fixes for Issues 227-228 and Docker/local hygiene.
