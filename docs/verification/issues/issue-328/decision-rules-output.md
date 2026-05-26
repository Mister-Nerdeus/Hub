# Manual Review Decision Rules

Manual visual review decisions are structured operational-layout decisions.

Allowed statuses:

- `approved_for_promotion_review`
- `approved_with_notes`
- `rejected_needs_correction`
- `manual_review_required`

Allowed reviewer sources:

- `explicit_manual_artifact`
- `operator_entered_structured_decision`
- `none`

Approval-like statuses require a reviewer source other than `none`, `sampleRecord: false`, and `codexClaimedApproval: false`.

Allowed dimensions:

- `roomPlacementPlausibility`
- `doorPlacementPlausibility`
- `hallwayPathConnectivityPlausibility`
- `stationPlacementPlausibility`
- `labelsReadability`
- `knownLimitationsAccepted`

Forbidden outcomes:

- Private-source comparison approval.
- Clinical certification.
- Staffing compliance determination.
- Default fixture promotion.
- Sample approval.
- Codex approval.
