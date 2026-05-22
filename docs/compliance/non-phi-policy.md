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

## Forbidden

- Real names, MRNs, dates of birth, contact details, visit identifiers, free-text clinical notes, or other patient identifiers.
- EHR import, export, mapping, or sync workflows.
- Diagnosis, chief complaint, or treatment text tied to a real or simulated identity.
- Claims that the simulator certifies safe staffing or predicts patient outcomes.
- Assignment warnings or burden scores presented as clinical safety certification.

If a field could plausibly hold PHI, do not add it without a contract update and a scanner rule.
