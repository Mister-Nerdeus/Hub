# Non-PHI Policy

This repository must not store, generate, import, or display PHI.

## Allowed

- Simulated rooms.
- Abstract occupied room loads.
- Operational burden fields.
- Synthetic fixtures that cannot identify real people.
- Seeded simulation events and generated evidence artifacts.

## Forbidden

- Real names, MRNs, dates of birth, contact details, visit identifiers, free-text clinical notes, or other patient identifiers.
- EHR import, export, mapping, or sync workflows.
- Diagnosis, chief complaint, or treatment text tied to a real or simulated identity.
- Claims that the simulator certifies safe staffing or predicts patient outcomes.

If a field could plausibly hold PHI, do not add it without a contract update and a scanner rule.
