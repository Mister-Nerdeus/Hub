# Issue 301 Review Findings

Finding: `validateSourceCorrectedSavedCopy` validated the nested `authoringDraft.sourceProvenance` but did not validate that the required top-level `sourceProvenance` field matched it.

Impact: A corrected saved-copy artifact could carry inconsistent safe provenance metadata while still passing the source-correction manifest validation.

Fix: Exported the existing source provenance validator, validated the top-level field, and rejected corrected saved copies when top-level and nested provenance differ.
