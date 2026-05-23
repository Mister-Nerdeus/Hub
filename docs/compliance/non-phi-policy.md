# Non-PHI Policy

This repository must not store, generate, import, or display PHI.

## Allowed

- Simulated rooms.
- Abstract occupied room loads.
- Operational burden fields.
- Enum-based room workload fields such as task frequency, procedure burden, turnover level, and acuity level.
- Synthetic nurse roles, qualifications, colors, break windows, and room assignments.
- Synthetic fixtures that cannot identify real people.
- Seeded simulation events and generated evidence artifacts.
- Visible assumptions registers for operational scoring and task timing.
- Abstract operational task templates and generated operational task sets.
- Generated operational task-set IDs, task IDs, scheduled minutes, durations, task burden categories, and nurse-task assignment IDs.
- Deterministic timeline aggregation summaries and manual-coverage task assignment proof artifacts.
- Operational inspection report contracts, report summaries, warning summaries, unassigned task summaries, and deterministic report proof artifacts using synthetic data.
- Deterministic scenario comparison proof artifacts based on operational report summaries.
- Operational report export JSON bundles using synthetic operational data.
- Deterministic export bundle integrity hashes for local proof review.
- Local bundle audit trails that record synthetic export IDs, deterministic validation steps, warnings, and limitations without reviewer identity.
- Synthetic day profiles and shift scenarios.

## Forbidden

- Real names, MRNs, dates of birth, contact details, visit identifiers, free-text clinical notes, or other patient identifiers.
- EHR import, export, mapping, or sync workflows.
- Diagnosis, chief complaint, or treatment text tied to a real or simulated identity.
- Claims that the simulator certifies safe staffing or predicts patient outcomes.
- Assignment warnings or burden scores presented as clinical safety certification.
- Generated operational tasks presented as clinical orders or care instructions.
- Nurse-task assignment output presented as clinical staffing safety certification.
- Operational reports presented as safe-staffing certification, clinical adequacy, patient outcome prediction, completed work, route accuracy, delay prediction, clinical documentation, or EHR artifacts.
- Scenario comparisons or report export bundles presented as recommendations, optimization output, clinical safety claims, patient outcome predictions, clinical documentation, or EHR artifacts.
- Integrity hashes or audit trails presented as tamper-proof security, legal compliance, chain-of-custody, non-repudiation, clinical safety certification, or reviewer/user identity proof.

If a field could plausibly hold PHI, do not add it without a contract update and a scanner rule.
