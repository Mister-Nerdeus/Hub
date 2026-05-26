# Manual Visual Review Protocol

This protocol governs repaired corrected Plans 2-5. It is an operational layout plausibility workflow only.

## Authority

- Codex cannot approve visual correctness.
- A manual decision requires an explicit structured artifact.
- Missing reviewer artifacts keep the plan status at `manual_review_required`.
- Sample records and templates cannot satisfy review approval.
- Manual review may authorize only future promotion-review consideration.

## Review Scope

Allowed review dimensions:

- Room placement plausibility.
- Door placement plausibility.
- Hallway/path connectivity plausibility.
- Station placement plausibility.
- Labels/readability.
- Known limitations accepted.

## Boundaries

- Do not mutate default source fixtures.
- Do not promote corrected saved copies into defaults; manual review must not promote default fixtures.
- Do not store private-source payloads, screenshots, paths, raw text, or embedded documents.
- Do not claim private-source comparison approval.
- Do not claim clinical certification or staffing compliance.
- Do not add optimizer behavior or simulation scoring behavior.

## Intake Rules

Manual review records must be JSON records that pass the shared manual review decision contract. The reviewer source must be `explicit_manual_artifact` or `operator_entered_structured_decision` before any approved status can be accepted. If the source is `none`, the only valid status is `manual_review_required`.
