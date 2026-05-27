# Local Draft Persistence Truth

Current classification: `pre_existing_local_draft_persistence`.

The editor has existing local draft persistence through `saveLayoutLocalDraft`, `loadLayoutLocalDraft`, and `resetLayoutLocalDraft` in `apps/web/src/features/layout-editor/layoutLocalDraftPersistence.ts`.

What is saved:

- Editable layout geometry.
- Viewport state.
- Snap mode.
- Edit audit trail.
- Dirty-state metadata.

When it is saved:

- `LayoutEditorStage` calls `saveLayoutLocalDraft` from a React effect when editable layout state, viewport, snap mode, audit trail, or dirty state changes.
- The batch does not add new autosave behavior or draft recovery UI.

Where it is saved:

- Browser `localStorage` under the layout editor local draft key.

Whether it is automatic:

- The existing behavior is automatic local browser draft persistence.
- It is not classified as debounced autosave.

Whether it is production persistence:

- It is not server persistence.
- It is not EHR integration.
- It is not a promoted default fixture.

Whether it protects real data:

- No. This repository and editor must use synthetic operational layout data only.
- It is not a PHI protection feature, clinical safety feature, audit guarantee, or recovery guarantee.
