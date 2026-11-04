# Label Studio v16.6 — UX update and backend requirements

Date: 2026-11-04  
Scope: front-end selection flow, on-screen print proof clarity, and verification. The label editor remains browser-local; this release adds no backend.

## Audit findings

The live editor identifies itself as v16.5.1, but the canonical master module still creates v15 records. The v16.5 geometry adapter only applies to records already marked v16.5, so its new geometry was skipped for newly made examples and package drafts. The built-in proof lab exposed this mismatch: **85 of 102 checks passed; the 17 default-layout checks failed**, one for each canonical type, with the same obsolete layout/revision assertions.

The workflow itself has separate safe actions: a type's **Preview** opens that type's sample in the data editor, while **Create … package** starts a distinct blank package. The context chip stayed on “Design mode” after the data editor opened, which made a successful selection look like a no-op.

The artwork-versus-printer comparison already supported native-pixel viewing, but that control was buried in the comparison dialog. Its fit-to-screen canvases used nearest-neighbor scaling, which made small text look blocky.

## Front-end changes

1. **Activate the current layout for new work.** New canonical examples and blank package drafts receive revision `v16.6` and the approved 591 × 827 reference geometry. Existing saved package records retain their stored revision and layout. Earlier canonical layouts are kept under Legacy. If that layout is already archived, an untouched seeded example is replaced in place; a customized example stays unchanged, avoiding another full copy in the browser workspace. Print snapshots remain immutable.
2. **Make the active editor explicit.** The context chip follows Design, Label data, Print output, Snapshots, and Print setup. Selecting a sample type continues to open that type in Label data; the separate Create package action remains the only way to start a real package.
3. **Expose pixel inspection.** A Pixel proof shortcut opens the artwork and 576 × 827 printer crop at one image pixel per screen pixel. Fit previews use smooth scaling for legibility. This is a screen inspection mode, not a physical-size or printer-acceptance claim; output geometry, raster bytes, color palette, and print behavior are unchanged.
4. **Align the proof lab with the shipped layout.** The software-only proof lab creates temporary synthetic examples, covers all 17 canonical types, and checks 102 cases. It does not save, approve, archive, or print a package.

## Acceptance criteria

- A direct `?template=master-raw_marinated&view=data` link opens the Marinated raw protein sample with the Label data editor active.
- Previewing any of the 17 types updates the selected sample and keeps the editor in Label data. It does not create a package or change another package's fields.
- Creating a package starts with blank identity, food, quantity, date, source-evidence, allergen, and reviewer values; it carries the current type and layout revision.
- The mode chip always matches the selected editor/task.
- Reloading an already-upgraded workspace reuses its saved prior-layout entries and does not create a second copy of each canonical example or exceed the existing browser storage budget.
- Pixel proof compares the exact 591 × 827 artwork with the 576 × 827 crop; the native-pixel toggle does not resample either image.
- The built-in proof lab reports 102/102 software checks for all 17 current type defaults. Physical printer acceptance remains unverified.
- At 1333 × 897 desktop and 390 × 844 phone, all global navigation links and workflow actions remain reachable without page-level horizontal overflow; the chooser, editor mode, proof shortcut, and print comparison are accessible.

## v16.7 follow-up audit — 2026-11-04

The live v16.7 release was audited after the first phone and print checks exposed three front-end defects:

- Corrected the inspector renderer to select all tab buttons. Label data now activates and renders without a startup error.
- Raised the shared package-ID caption below the QR from 15 px to 17 px. The print audit rule requires at least 16 px.
- Replaced phone-only horizontal navigation rails with a visible three-column site menu and two-column workflow menu.

Verification after the fixes: the live health endpoint returned `ok`; `/version` reported verified source; the 17-label software proof passed **102/102**; the Label data tab rendered as active; and page-level horizontal overflow was absent at 1333 × 897 desktop and 390 × 844 phone. All nine global destinations and four workflow actions fit at the phone width. Physical printing and hardware QR scanning remain unverified.

The update remains browser-local. The backend contracts below are still future implementation requirements; this release does not add server storage or synchronization.

## Later backend requirements (recorded for implementation)

### Versioned type registry

Keep the canonical IDs stable and return the six families with each definition. Type definitions and layout revisions must be immutable once referenced by a saved draft or snapshot.

Suggested read contract:

```http
GET /api/v1/label-types
GET /api/v1/label-types/{typeId}/revisions/{templateRevision}
```

Return the type ID, family ID, display name, supported data fields, validation rules, default artwork references, output profile, and template/layout revision. Unknown or retired IDs must remain resolvable for historical records.

### Independent package drafts and concurrency

Each package is its own record, even when multiple drafts use the same recipe or label type. Creating or switching drafts must never mutate a type example or another package.

Suggested contracts:

```http
POST  /api/v1/package-drafts
GET   /api/v1/package-drafts/{draftId}
PATCH /api/v1/package-drafts/{draftId}
POST  /api/v1/package-drafts/{draftId}/validate
```

A draft stores its stable ID, canonical type ID, type family, template revision, current record revision, status, package fields, recipe/source references, source evidence, selected artwork IDs, and review state. Updates require an `If-Match` revision or equivalent. A stale update returns **409 Conflict** with the latest revision and a merge/reload choice; it must never silently replace another tab's draft. Create/update requests accept an idempotency key so retries do not duplicate drafts.

### Food facts, evidence, and review state

Keep user-entered facts separate from verified source evidence and reviewer attestations. The server must not infer allergens, food-safety dates, temperatures, thaw times, cooking instructions, or use-by dates from a label type or artwork. Validation returns field-scoped errors and warnings with reason codes, source requirements, and the relevant type/revision.

A review attestation records the reviewer identity, reviewed field set, source references, timestamp, and the exact draft revision reviewed. Editing a reviewed field clears only the affected attestation. Imported or restored drafts start unreviewed unless a trusted, verifiable signature is defined later.

### Immutable snapshots and print attempts

A print snapshot is immutable and includes the package data revision, canonical type/layout revision, exact artwork PNG bytes and SHA-256, printer raster bytes and dimensions, palette, crop/profile definition, source evidence references, and review attestations. Reprinting retrieves these exact bytes; it does not regenerate from the latest template.

Suggested contracts:

```http
POST /api/v1/package-drafts/{draftId}/snapshots
GET  /api/v1/print-snapshots/{snapshotId}
POST /api/v1/print-snapshots/{snapshotId}/attempts
PATCH /api/v1/print-attempts/{attemptId}
```

Keep print attempts separate from snapshots. Record requested, connected, sent, driver-complete, user-verified, and failed states, including device/profile, timestamps, driver result, and retry linkage. A software-rendered proof is never evidence that a physical label was printed or accepted.

### Workspace sync, backup, and recovery

Store workspaces per authenticated user and support multiple unfinished drafts for one type or recipe. Sync uses revisions/ETags and surfaces conflicts; it must not implement last-write-wins over a stale browser. Offline edits remain locally recoverable and are synced explicitly after conflict resolution. Provide export/restore with schema version, checksums, provenance, and a pre-restore backup. Keep browser-local records readable until a verified migration completes. Surface approximate record and storage use before browser quota is reached, distinguish saved, pending, and failed states, and offer an export before migration or restore. Never prune prior layouts or unfinished drafts silently.

### Security, privacy, and operations

- Authorize every read/write by workspace ownership; use opaque IDs and avoid exposing private package facts in URLs.
- Keep QR payloads package-ID-only. Resolve package detail only through an authorized app session.
- Log draft/snapshot revisions and print attempts without logging sensitive food notes or full label contents by default.
- Define retention and deletion separately for active drafts, user exports, immutable print snapshots, and operational logs.
- Expose health/version metadata for the API and registry; do not make a backend outage erase or block access to a locally recoverable draft.

## Not included in this release

No backend service or cross-device sync is implemented. A calibrated 50 × 80 mm profile, physical B1 Pro print acceptance, QR scan validation on hardware, and real food-source verification remain separate work.
