# Private-Source Boundary

Private floor plan references are inputs to manual review only. Runtime and tracked artifacts may store only safe provenance, such as a source reference identifier and privacy flags.

Forbidden tracked or runtime content:

- DOCX binaries or embedded source documents.
- Source images or private-source screenshots.
- OCR dumps, raw source text, or copied source excerpts.
- Source filenames.
- Private source paths.
- Runtime web or API routes that serve source material.
- Exact CAD or exact DOCX parity claims.

Allowed tracked content:

- Corrected saved-copy JSON produced from editable authoring contracts.
- Safe source-provenance flags.
- Correction metadata containing object IDs, counts, limitation text, and evidence paths.
- Rendered visual evidence generated from the corrected saved copy.
- Route audit and simulation-ready export status.

Promotion into default fixtures remains blocked until a separate promotion-review issue is explicitly approved.
