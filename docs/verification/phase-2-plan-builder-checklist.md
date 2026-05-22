# Phase 2 Plan Builder Checklist

## Initial Checklist Before Evidence Collection

| Gate | Initial status |
| --- | --- |
| Docker runtime uses reassigned non-conflicting ports | Missing |
| API health proves configured API host port | Missing |
| Recreated ER pod screenshot exists | Missing |
| Reload proof screenshot exists | Missing |
| Exported plan JSON exists | Missing |
| Exported plan JSON validates through CLI | Missing |
| API tests pass | Missing |
| Web build passes | Missing |
| Shared contract tests pass | Missing |
| Non-PHI scanner passes | Missing |
| Docs contract check passes | Missing |

## Final Checklist

| Gate | Final status | Evidence |
| --- | --- | --- |
| Docker runtime uses reassigned non-conflicting ports | Pass | `docs/verification/issues/issue-015/docker-compose-config.txt` |
| API health proves configured API host port | Pass | `docs/verification/issues/issue-015/api-health.json` |
| Recreated ER pod screenshot exists | Pass | `docs/verification/issues/issue-024/screenshots/recreated-er-pod-plan.png` |
| Reload proof screenshot exists | Pass | `docs/verification/issues/issue-024/screenshots/reload-proof.png` |
| Exported plan JSON exists | Pass | `docs/verification/issues/issue-024/sample-json/exported-er-pod-plan.json` |
| Exported plan JSON validates through CLI | Pass | `docs/verification/issues/issue-024/validation-output.txt` |
| API tests pass | Pass | `docs/verification/issues/issue-017/commands.txt` |
| Web build passes | Pass | `docs/verification/issues/issue-020/commands.txt` |
| Shared contract tests pass | Pass | `docs/verification/issues/issue-016/shared-test-output.txt` |
| Non-PHI scanner passes | Pass | `docs/verification/issues/issue-024/commands.txt` |
| Docs contract check passes | Pass | `docs/verification/issues/issue-024/commands.txt` |
