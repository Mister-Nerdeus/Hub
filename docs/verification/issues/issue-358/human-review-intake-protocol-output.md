# Human Review Intake Protocol

This protocol controls intake for structured human review records for Plans 2 through 5.

Human review intake is status-only governance. It does not promote corrected saved copies into default fixtures, does not approve clinical safety, and does not claim exact CAD or DOCX parity.

## Countable Records

Only explicit submitted JSON records under `docs/manual-review/submitted/` may count as submitted records:

- `docs/manual-review/submitted/plan-2-review-record.json`
- `docs/manual-review/submitted/plan-3-review-record.json`
- `docs/manual-review/submitted/plan-4-review-record.json`
- `docs/manual-review/submitted/plan-5-review-record.json`

Review packets, templates, Markdown notes, UI helper drafts, generated evidence, sample files, and Codex-authored artifacts cannot count as approval.

## Missing Records

When a submitted record is absent, the plan remains:

- `manualReviewStatus: manual_review_required`
- `reviewerDecisionSource: none`
- `reviewerIdentityStatus: not_required_until_record_exists`
- `reviewerAuthorityStatus: not_required_until_record_exists`
- `promotionReadinessDryRunStatus: blocked_missing_manual_review`
- `canPromote: false`

## Submitted Record Rules

A submitted record must:

- use `recordVersion: "1.0.0"`
- use `reviewRecordKind: "human_visual_review_decision"`
- match the plan ID in its allowed submitted path
- set `sampleRecord: false`
- set `codexClaimedApproval: false`
- include safe pseudonymous reviewer identity metadata
- include reviewer authority metadata
- include a valid ISO 8601 UTC `reviewedAt`
- include a valid review method
- include all required reviewer attestations
- limit scope to `operational_layout_plausibility_only`
- avoid default fixture promotion requests
- avoid private-source payloads and exact source parity claims

## Non-Claims

Human review intake may approve only operational layout plausibility for future promotion-review consideration. It may not approve clinical safety, staffing compliance, legal compliance, exact source parity, or default fixture promotion.
