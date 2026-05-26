# Source-Correction Protocol

Batch 291-300 corrects default floor plan layouts through saved editable copies only. Private source references may guide manual authoring outside runtime, but source payloads must never be stored, served, embedded, or copied into repository artifacts.

## Required Workflow

1. Review the private source reference outside runtime.
2. Create a saved editable copy from the default plan fixture.
3. Apply source-driven layout corrections only to that saved copy.
4. Render visual evidence from the corrected saved copy.
5. Run route/path sync audit against the corrected saved copy or reviewed export.
6. Attempt simulation-ready export and record the explicit status.
7. Keep the default source fixture unchanged.
8. Record GO / NO-GO for the corrected saved copy.

## Required Rules

- Private source reference only.
- Saved editable copy only.
- No direct default fixture mutation.
- No raw source payload storage.
- No source binary storage.
- No source filename or private path storage.
- No OCR dump or raw source text storage.
- No private-source screenshot storage.
- No exact CAD or exact DOCX parity claim.
- Rendered visual evidence must come from the corrected saved copy.
- Route audit is required.
- Simulation-ready export status is required.
- Promotion requires a separate explicit issue.

## Non-Claims

Corrected saved copies are operational authoring artifacts. They do not claim exact CAD parity, exact DOCX parity, clinical safety certification, EHR integration, or optimizer output.
