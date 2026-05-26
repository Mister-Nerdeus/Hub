# Plans 2-5 Rollback Package

This package is a dry-run prerequisite for any future promotion-review batch. It does not mutate default fixtures and does not promote repaired saved copies.

## Required Before Future Promotion Review

- Record the current default fixture hash for each plan.
- Record the repaired saved-copy hash for each plan.
- Record the simulation-ready export hash for each plan.
- Confirm the explicit manual review decision artifact and hash.
- Confirm no-PHI and private-source boundary gates pass.
- Keep a copy of the pre-promotion default fixture hash in the issue evidence folder.

## Rollback Requirements

- Revert only the promoted default fixture files for the affected plan.
- Restore the recorded pre-promotion hash.
- Re-run default fixture nonmutation and contract validation.
- Re-run no-PHI and private-source gates.
- Preserve the manual review record as review evidence, not as runtime data.
