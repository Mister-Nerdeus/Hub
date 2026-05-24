# API Error Contract

API errors expose stable machine-readable codes in `detail.code` with a short `detail.message`.

## Shape

```json
{
  "detail": {
    "code": "REQUEST_VALIDATION_FAILED",
    "message": "request validation failed"
  }
}
```

Validation responses may include a sanitized `detail.errors` array. Rejected input values and full payloads must not be returned.

## Codes

| Code | Meaning |
| --- | --- |
| `PLAN_NOT_FOUND` | Requested plan does not exist. |
| `PLAN_ALREADY_EXISTS` | Plan create conflicts with an existing plan ID. |
| `PLAN_ID_MISMATCH` | Route plan ID and request layout plan ID differ. |
| `PLAN_CONTRACT_INVALID` | Plan request body failed contract validation. |
| `SIMULATION_RUN_NOT_FOUND` | Requested simulation run does not exist. |
| `SIMULATION_RUN_ALREADY_EXISTS` | Simulation run create conflicts with an existing run ID. |
| `SIMULATION_RUN_CONTRACT_INVALID` | Simulation run request body failed contract validation. |
| `PERSISTED_SIMULATION_RUN_INVALID` | Stored simulation run JSON failed validation on read. |
| `NO_PHI_RUNTIME_REJECTION` | Runtime no-PHI validation rejected request text. |
| `REQUEST_VALIDATION_FAILED` | Generic request validation failed outside body contract validation. |

## Non-Claims

This contract does not add auth, new resources, PHI support, or clinical safety claims.
