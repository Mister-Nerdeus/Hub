# Human Review Identity and Authority Rules

Submitted human review records must identify the reviewer with safe project-local metadata only.

Allowed reviewer metadata:

- `reviewerHandle`: a pseudonymous handle such as `layout_lead` or `ops_review`
- `reviewerRole`: `owner`, `operator`, `layout_reviewer`, or `project_reviewer`
- `reviewerAuthorityScope`: `operational_layout_review_only` or `promotion_review_consideration`

Forbidden reviewer metadata:

- real employee IDs
- badge or staff identifiers
- email addresses
- real staff names
- real hospital identifiers

Authority rules:

- `approved_for_promotion_review` requires `promotion_review_consideration`
- `approved_with_notes` may use `promotion_review_consideration` or `operational_layout_review_only`
- `rejected_needs_correction` requires safe reviewer identity and no promotion authorization
- `operator_entered_structured_decision` still requires submitted JSON under `docs/manual-review/submitted/`

Every submitted record must attest that the decision is operational-layout-only and does not approve clinical safety, staffing compliance, legal compliance, exact CAD or DOCX parity, default fixture promotion, or private-source comparison.
