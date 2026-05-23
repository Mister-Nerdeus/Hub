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

FORBIDDEN_TEXT = (" safe ", " unsafe ", "recommended", " best ", "clinically acceptable")


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
    originalReadyMinute: int | None = Field(default=None, ge=0)
    enteredQueueMinute: int | None = Field(default=None, ge=0)
    startedMinute: int | None = Field(default=None, ge=0)
    waitMinutes: float | None = Field(default=None, ge=0)
    orderingReason: str | None = None
    originNodeId: str | None = None
    destinationNodeId: str | None = None
    routeNodeIds: list[str] | None = None
    routeEdgeIds: list[str] | None = None
    travelSeconds: float | None = Field(default=None, ge=0)
    warnings: list[str] | None = None

    @model_validator(mode="after")
    def validate_event_references(self) -> "SimulationEvent":
        if self.eventType == "task" and self.taskId is None:
            raise ValueError("task events require taskId")
        if self.eventType == "nurse" and self.nurseId is None:
            raise ValueError("nurse events require nurseId")
        if self.eventType in {"queue", "travel"} and (self.taskId is None or self.nurseId is None):
            raise ValueError("queue and travel events require taskId and nurseId")
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
        task_events = [event for event in self.events if event.eventType == "task" and event.taskId is not None]
        task_ids = {event.taskId for event in task_events}
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


def reject_phi_like_keys(value: Any) -> None:
    if isinstance(value, list):
        for item in value:
            reject_phi_like_keys(item)
        return
    if isinstance(value, dict):
        for key, child in value.items():
            normalized = key.replace("_", "").lower()
            if normalized in PHI_LIKE_KEYS:
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
        normalized = f" {value.lower()} "
        if any(phrase in normalized for phrase in FORBIDDEN_TEXT):
            raise ValueError("recommendation or clinical claim language is not allowed")
