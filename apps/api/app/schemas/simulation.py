import re
from typing import Any, Literal

from pydantic import Field, model_validator

from app.contracts import StrictModel


PHI_LIKE_KEYS = {
    "patient" + "name",
    "patient" + "id",
    "patient" + "identifier",
    "diagnosis",
    "diagnosis" + "code",
    "medication",
    "chart",
    "note",
    "clinical" + "note",
    "date" + "of" + "birth",
    "d" + "ob",
    "m" + "rn",
    "e" + "hr",
    "e" + "hr" + "id",
}

def forbidden_text_pattern(*parts: str) -> re.Pattern[str]:
    return re.compile(r"\b" + "".join(parts) + r"\b", re.IGNORECASE)


FORBIDDEN_TEXT_PATTERNS = (
    ("".join(("s", "afe")), forbidden_text_pattern("s", "afe")),
    ("".join(("un", "s", "afe")), forbidden_text_pattern("un", "s", "afe")),
    ("".join(("recommend", "ed")), forbidden_text_pattern("recommend", "ed")),
    ("".join(("b", "est")), forbidden_text_pattern("b", "est")),
    (
        " ".join(("clinically", "acceptable")),
        forbidden_text_pattern("clinically", " acceptable"),
    ),
)
TASK_ACTIONS = {"ready", "started", "completed", "delayed", "missed", "unassigned"}
MISS_REASONS = {"unassigned", "not_started_shift_window_exceeded"}
NURSE_ACTIONS = {"started_task", "completed_task", "idle", "queued"}
QUEUE_ACTIONS = {"entered_queue", "started_from_queue", "released"}
TRAVEL_ACTIONS = {"travel_calculated", "travel_unreachable"}
TERMINAL_TASK_ACTIONS = {"completed", "missed", "unassigned"}
PERSISTED_SIMULATION_RUN_INVALID_CODE = "PERSISTED_SIMULATION_RUN_INVALID"
PERSISTED_SIMULATION_RUN_INVALID_MESSAGE = "persisted simulation run failed validation"


class SimulationRunSummary(StrictModel):
    totalTasks: int = Field(ge=0)
    completedTaskCount: int = Field(ge=0)
    delayedTaskCount: int = Field(ge=0)
    missedTaskCount: int = Field(ge=0)
    unassignedTaskCount: int = Field(ge=0)


class SimulationEvent(StrictModel):
    eventId: str = Field(min_length=1)
    eventType: Literal["task", "nurse", "queue", "travel"]
    action: str = Field(min_length=1)
    taskId: str | None = None
    nurseId: str | None = None
    minute: int = Field(ge=0)
    scheduledMinute: int | None = Field(default=None, ge=0)
    startMinute: int | None = Field(default=None, ge=0)
    completedMinute: int | None = Field(default=None, ge=0)
    durationMinutes: float | None = Field(default=None, ge=0)
    delayMinutes: float | None = Field(default=None, ge=0)
    missReason: str | None = None
    queueWaitMinutes: float | None = Field(default=None, ge=0)
    travelMinutes: int | None = Field(default=None, ge=0)
    projectedStartMinute: int | None = Field(default=None, ge=0)
    projectedTravelMinutes: int | None = Field(default=None, ge=0)
    projectedCompletionMinute: int | None = Field(default=None, ge=0)
    shiftDurationMinutes: int | None = Field(default=None, ge=0)
    busyUntilMinute: int | None = Field(default=None, ge=0)
    originalReadyMinute: int | None = Field(default=None, ge=0)
    enteredQueueMinute: int | None = Field(default=None, ge=0)
    startedMinute: int | None = Field(default=None, ge=0)
    waitMinutes: float | None = Field(default=None, ge=0)
    orderingReason: str | None = None
    originNodeId: str | None = None
    destinationNodeId: str | None = None
    routeNodeIds: list[str] | None = None
    routeEdgeIds: list[str] | None = None
    travelDistanceFeet: float | None = Field(default=None, ge=0)
    travelSeconds: float | None = Field(default=None, ge=0)
    warnings: list[str] | None = None

    @model_validator(mode="before")
    @classmethod
    def validate_event_key_set(cls, value: Any) -> Any:
        if not isinstance(value, dict):
            return value
        event_type = value.get("eventType")
        allowed_keys_by_type = {
            "task": {
                "eventId",
                "eventType",
                "action",
                "taskId",
                "nurseId",
                "minute",
                "scheduledMinute",
                "startMinute",
                "completedMinute",
                "durationMinutes",
                "delayMinutes",
                "missReason",
                "queueWaitMinutes",
                "travelMinutes",
                "projectedStartMinute",
                "projectedTravelMinutes",
                "projectedCompletionMinute",
                "shiftDurationMinutes",
                "routeNodeIds",
                "routeEdgeIds",
            },
            "nurse": {
                "eventId",
                "eventType",
                "action",
                "nurseId",
                "taskId",
                "minute",
                "durationMinutes",
                "busyUntilMinute",
            },
            "queue": {
                "eventId",
                "eventType",
                "action",
                "nurseId",
                "taskId",
                "minute",
                "originalReadyMinute",
                "enteredQueueMinute",
                "startedMinute",
                "waitMinutes",
                "orderingReason",
            },
            "travel": {
                "eventId",
                "eventType",
                "action",
                "nurseId",
                "taskId",
                "minute",
                "originNodeId",
                "destinationNodeId",
                "routeNodeIds",
                "routeEdgeIds",
                "travelDistanceFeet",
                "travelSeconds",
                "travelMinutes",
                "warnings",
            },
        }
        allowed_keys = allowed_keys_by_type.get(event_type)
        if allowed_keys is None:
            return value
        unsupported_keys = sorted(set(value) - allowed_keys)
        if unsupported_keys:
            raise ValueError(f"{event_type} event contains unsupported fields")
        return value

    @model_validator(mode="after")
    def validate_event_references(self) -> "SimulationEvent":
        if self.eventType == "task":
            if self.action not in TASK_ACTIONS:
                raise ValueError("task event action is not allowed")
            if self.taskId is None:
                raise ValueError("task events require taskId")
            if self.action == "delayed" and (self.delayMinutes is None or self.delayMinutes <= 0):
                raise ValueError("delayed task events require positive delayMinutes")
            if self.action == "missed" and self.missReason is None:
                raise ValueError("missed task events require missReason")
            if self.missReason is not None and self.missReason not in MISS_REASONS:
                raise ValueError("task event missReason is not allowed")
            if self.missReason == "not_started_shift_window_exceeded":
                if (
                    self.projectedStartMinute is None
                    or self.projectedTravelMinutes is None
                    or self.projectedCompletionMinute is None
                    or self.shiftDurationMinutes is None
                ):
                    raise ValueError("not-started missed task events require projected timing fields")
        if self.eventType == "nurse":
            if self.action not in NURSE_ACTIONS:
                raise ValueError("nurse event action is not allowed")
            if self.nurseId is None:
                raise ValueError("nurse events require nurseId")
        if self.eventType == "queue":
            if self.action not in QUEUE_ACTIONS:
                raise ValueError("queue event action is not allowed")
            if self.taskId is None or self.nurseId is None:
                raise ValueError("queue events require taskId and nurseId")
            if self.originalReadyMinute is None or self.enteredQueueMinute is None:
                raise ValueError("queue events require ready and entered queue minutes")
            if self.orderingReason is None:
                raise ValueError("queue events require orderingReason")
            if self.waitMinutes is not None and self.waitMinutes > 0 and self.startedMinute is None:
                raise ValueError("queue wait events require startedMinute")
        if self.eventType == "travel":
            if self.action not in TRAVEL_ACTIONS:
                raise ValueError("travel event action is not allowed")
            if self.taskId is None or self.nurseId is None:
                raise ValueError("travel events require taskId and nurseId")
            if (
                self.originNodeId is None
                or self.destinationNodeId is None
                or self.routeNodeIds is None
                or self.routeEdgeIds is None
                or self.travelDistanceFeet is None
                or self.travelSeconds is None
                or self.travelMinutes is None
                or self.warnings is None
            ):
                raise ValueError("travel events require route and travel fields")
        if self.action == "completed" and self.completedMinute is not None and self.scheduledMinute is not None:
            if self.completedMinute < self.scheduledMinute:
                raise ValueError("completed task event cannot precede scheduled minute")
        return self


class SimulationRunContract(StrictModel):
    schemaVersion: Literal["1.0.0"]
    simulationRunId: str = Field(min_length=1)
    scenarioId: str = Field(min_length=1)
    generatedTaskSetId: str = Field(min_length=1)
    assignmentSetId: str = Field(min_length=1)
    events: list[SimulationEvent]
    summary: SimulationRunSummary
    limitations: list[str]

    @model_validator(mode="before")
    @classmethod
    def reject_phi_like_keys(cls, value: Any) -> Any:
        reject_phi_like_keys(value)
        reject_forbidden_text(value)
        return value

    @model_validator(mode="after")
    def validate_summary(self) -> "SimulationRunContract":
        event_ids = [event.eventId for event in self.events]
        if len(set(event_ids)) != len(event_ids):
            raise ValueError("eventId values must be unique")
        task_events = [event for event in self.events if event.eventType == "task" and event.taskId is not None]
        task_ids = {event.taskId for event in task_events}
        for index, event in enumerate(self.events):
            if event.eventType != "task" and event.taskId is not None and event.taskId not in task_ids:
                raise ValueError(f"events[{index}].taskId must reference the task-event stream")
        validate_task_lifecycle(task_events)
        completed = {event.taskId for event in task_events if event.action == "completed"}
        delayed = {event.taskId for event in task_events if event.action == "delayed"}
        missed = {event.taskId for event in task_events if event.action == "missed"}
        unassigned = {event.taskId for event in task_events if event.action == "unassigned"}

        if self.summary.totalTasks != len(task_ids):
            raise ValueError("summary.totalTasks must match task events")
        if self.summary.completedTaskCount != len(completed):
            raise ValueError("summary.completedTaskCount must match events")
        if self.summary.delayedTaskCount != len(delayed):
            raise ValueError("summary.delayedTaskCount must match events")
        if self.summary.missedTaskCount != len(missed):
            raise ValueError("summary.missedTaskCount must match events")
        if self.summary.unassignedTaskCount != len(unassigned):
            raise ValueError("summary.unassignedTaskCount must match events")
        return self


def validate_persisted_simulation_run(value: Any) -> dict[str, Any]:
    SimulationRunContract.model_validate(value)
    if not isinstance(value, dict):
        raise ValueError("persisted simulation run must be an object")
    return value


def persisted_simulation_run_invalid_detail() -> dict[str, str]:
    return {
        "code": PERSISTED_SIMULATION_RUN_INVALID_CODE,
        "message": PERSISTED_SIMULATION_RUN_INVALID_MESSAGE,
    }


def validate_task_lifecycle(task_events: list[SimulationEvent]) -> None:
    task_events_by_task_id: dict[str, list[SimulationEvent]] = {}
    for event in task_events:
        if event.taskId is None:
            continue
        task_events_by_task_id.setdefault(event.taskId, []).append(event)

    for task_id, events in task_events_by_task_id.items():
        ready_events = [event for event in events if event.action == "ready"]
        started_events = [event for event in events if event.action == "started"]
        completed_events = [event for event in events if event.action == "completed"]
        delayed_events = [event for event in events if event.action == "delayed"]
        missed_events = [event for event in events if event.action == "missed"]
        terminal_events = [event for event in events if event.action in TERMINAL_TASK_ACTIONS]

        if started_events and not ready_events:
            raise ValueError(f"task {task_id} lifecycle has started without ready")
        if completed_events and not started_events:
            raise ValueError(f"task {task_id} lifecycle has completed without started")
        if len(terminal_events) > 1:
            raise ValueError(f"task {task_id} lifecycle has multiple terminal states")

        if ready_events:
            earliest_ready_minute = min(task_ready_minute(event) for event in ready_events)
            for event in started_events:
                if task_start_minute(event) < earliest_ready_minute:
                    raise ValueError(f"task {task_id} lifecycle cannot start before ready")

        if started_events:
            earliest_start_minute = min(task_start_minute(event) for event in started_events)
            for event in completed_events:
                if task_completed_minute(event) < earliest_start_minute:
                    raise ValueError(f"task {task_id} lifecycle cannot complete before started")

        if delayed_events and not started_events and not missed_events:
            raise ValueError(f"task {task_id} lifecycle delayed event requires started or missed outcome")


def task_ready_minute(event: SimulationEvent) -> int:
    return event.scheduledMinute if event.scheduledMinute is not None else event.minute


def task_start_minute(event: SimulationEvent) -> int:
    return event.startMinute if event.startMinute is not None else event.minute


def task_completed_minute(event: SimulationEvent) -> int:
    return event.completedMinute if event.completedMinute is not None else event.minute


def reject_phi_like_keys(value: Any) -> None:
    if isinstance(value, list):
        for item in value:
            reject_phi_like_keys(item)
        return
    if isinstance(value, dict):
        for key, child in value.items():
            normalized = normalize_key(key)
            if normalized in PHI_LIKE_KEYS or starts_with_phi_like_token(normalized):
                raise ValueError(f"{key} is not allowed")
            reject_phi_like_keys(child)


def reject_forbidden_text(value: Any) -> None:
    if isinstance(value, list):
        for item in value:
            reject_forbidden_text(item)
        return
    if isinstance(value, dict):
        for child in value.values():
            reject_forbidden_text(child)
        return
    if isinstance(value, str):
        for name, pattern in FORBIDDEN_TEXT_PATTERNS:
            if pattern.search(value):
                raise ValueError(f"{name} language is not allowed")


def normalize_key(key: str) -> str:
    return re.sub(r"[^a-z0-9]", "", key.lower())


def starts_with_phi_like_token(normalized_key: str) -> bool:
    prefixes = (
        "patient",
        "diagnosis",
        "medication",
        "e" + "hr",
        "chart",
        "clinical" + "note",
        "d" + "ob",
        "date" + "of" + "birth",
        "m" + "rn",
    )
    return normalized_key.startswith(prefixes) or normalized_key in {"note", "notes"}
