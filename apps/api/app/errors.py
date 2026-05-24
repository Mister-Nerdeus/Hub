from typing import Any

from fastapi import HTTPException, Request
from fastapi.exceptions import RequestValidationError

PLAN_NOT_FOUND = "PLAN_NOT_FOUND"
PLAN_ALREADY_EXISTS = "PLAN_ALREADY_EXISTS"
PLAN_ID_MISMATCH = "PLAN_ID_MISMATCH"
PLAN_CONTRACT_INVALID = "PLAN_CONTRACT_INVALID"
SIMULATION_RUN_NOT_FOUND = "SIMULATION_RUN_NOT_FOUND"
SIMULATION_RUN_ALREADY_EXISTS = "SIMULATION_RUN_ALREADY_EXISTS"
SIMULATION_RUN_CONTRACT_INVALID = "SIMULATION_RUN_CONTRACT_INVALID"
PERSISTED_SIMULATION_RUN_INVALID = "PERSISTED_SIMULATION_RUN_INVALID"
NO_PHI_RUNTIME_REJECTION = "NO_PHI_RUNTIME_REJECTION"
REQUEST_VALIDATION_FAILED = "REQUEST_VALIDATION_FAILED"

ERROR_MESSAGES = {
    PLAN_NOT_FOUND: "plan not found",
    PLAN_ALREADY_EXISTS: "plan already exists",
    PLAN_ID_MISMATCH: "layout.planId must match route plan_id",
    PLAN_CONTRACT_INVALID: "plan contract invalid",
    SIMULATION_RUN_NOT_FOUND: "simulation run not found",
    SIMULATION_RUN_ALREADY_EXISTS: "simulation run already exists",
    SIMULATION_RUN_CONTRACT_INVALID: "simulation run contract invalid",
    PERSISTED_SIMULATION_RUN_INVALID: "persisted simulation run failed validation",
    NO_PHI_RUNTIME_REJECTION: "runtime no-PHI validation rejected the request",
    REQUEST_VALIDATION_FAILED: "request validation failed",
}


def error_detail(code: str, message: str | None = None, **extra: Any) -> dict[str, Any]:
    detail: dict[str, Any] = {
        "code": code,
        "message": message or ERROR_MESSAGES[code],
    }
    detail.update(extra)
    return detail


def api_error(status_code: int, code: str, message: str | None = None) -> HTTPException:
    return HTTPException(status_code=status_code, detail=error_detail(code, message))


def validation_error_detail(request: Request, exc: RequestValidationError) -> dict[str, Any]:
    errors = sanitized_validation_errors(exc)
    code = validation_error_code(request, errors)
    return error_detail(code, errors=errors)


def sanitized_validation_errors(exc: RequestValidationError) -> list[dict[str, Any]]:
    return [
        {
            "type": error.get("type", "value_error"),
            "loc": error.get("loc", ()),
            "msg": error.get("msg", "Invalid request"),
        }
        for error in exc.errors()
    ]


def validation_error_code(request: Request, errors: list[dict[str, Any]]) -> str:
    if any(NO_PHI_RUNTIME_REJECTION in str(error.get("msg", "")) for error in errors):
        return NO_PHI_RUNTIME_REJECTION
    if not any(error.get("loc", [None])[0] == "body" for error in errors):
        return REQUEST_VALIDATION_FAILED
    path = request.url.path
    if path.startswith("/v1/plans"):
        return PLAN_CONTRACT_INVALID
    if path.startswith("/v1/simulation"):
        return SIMULATION_RUN_CONTRACT_INVALID
    return REQUEST_VALIDATION_FAILED
