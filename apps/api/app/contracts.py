from typing import Any, Literal

from pydantic import BaseModel, ConfigDict, Field, TypeAdapter, field_validator, model_validator

RoomType = Literal[
    "standard",
    "trauma",
    "isolation",
    "psych",
    "hall_bed",
    "procedure",
    "overflow",
]
ZoneType = Literal[
    "provider_area",
    "pharmacy",
    "ems_entry",
    "hallway",
    "waiting",
    "storage",
    "staff_only",
]
PathNodeType = Literal["room_door", "hallway", "station", "entry", "zone"]
StationType = Literal["primary", "secondary", "charge", "temporary"]
TaskFrequency = Literal["none", "low", "medium", "high", "continuous"]
BurdenLevel = Literal["none", "low", "medium", "high", "very_high"]
TurnoverLevel = Literal["low", "normal", "high", "surge"]
TaskType = Literal[
    "medication_round",
    "monitoring_check",
    "procedure_support",
    "room_turnover",
    "isolation_prep",
    "behavioral_observation",
    "sitter_observation",
]
TaskFrequencySource = Literal[
    "room_load_frequency",
    "room_load_burden",
    "room_load_turnover",
    "boolean_trigger",
]
TaskTrigger = Literal[
    "medicationFrequency",
    "monitoringFrequency",
    "procedureBurden",
    "expectedTurnover",
    "isolationActive",
    "behavioralRisk",
    "sitterRequired",
]
TaskBurdenCategory = Literal[
    "medication",
    "monitoring",
    "procedure",
    "turnover",
    "isolation",
    "behavioral",
    "sitter",
]
NurseRole = Literal[
    "primary",
    "charge",
    "float",
    "triage",
    "trauma",
    "preceptor",
    "orientee",
]
AssignmentType = Literal["manual", "optimized", "temporary_break_coverage"]
WarningSeverity = Literal["info", "warning", "critical"]
WarningCode = Literal[
    "OVER_TARGET_RATIO",
    "OVER_MAX_RATIO",
    "TRAUMA_WITH_NON_QUALIFIED_NURSE",
    "UNASSIGNED_OCCUPIED_ROOM",
    "ROOM_WITHOUT_COVERAGE",
    "UNKNOWN_NURSE",
    "UNKNOWN_ROOM",
    "ROOM_ASSIGNED_MULTIPLE_TIMES",
]

PLAN_ID_MAX_LENGTH = 64
PLAN_NAME_MAX_LENGTH = 160
PLAN_DESCRIPTION_MAX_LENGTH = 500
SAFE_INTEGER_MAX = 9007199254740991


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class ScaleSettings(StrictModel):
    unit: Literal["feet"]
    pixelsPerUnit: float = Field(gt=0)
    gridSizeFeet: float = Field(gt=0)
    snapToGrid: bool
    origin: Literal["top-left"]


class Point(StrictModel):
    x: float
    y: float


class Room(StrictModel):
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    roomType: RoomType
    x: float
    y: float
    widthFeet: float = Field(gt=0)
    lengthFeet: float = Field(gt=0)
    maxPatients: int = Field(gt=0)
    traumaCapable: bool
    isolationCapable: bool
    doorPoint: Point | None = None
    zoneId: str | None = None
    nearestStationId: str | None = None
    pathNodeId: str | None = None


class Hallway(StrictModel):
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    widthFeet: float = Field(gt=0)
    points: list[Point] = Field(min_length=2)


class Door(StrictModel):
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    roomId: str = Field(min_length=1)
    x: float
    y: float
    widthFeet: float = Field(gt=0)
    pathNodeId: str | None = None


class NurseStation(StrictModel):
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    stationType: StationType
    x: float
    y: float
    widthFeet: float = Field(gt=0)
    lengthFeet: float = Field(gt=0)
    pathNodeId: str = Field(min_length=1)


class Zone(StrictModel):
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    zoneType: ZoneType
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    x: float
    y: float
    widthFeet: float = Field(gt=0)
    lengthFeet: float = Field(gt=0)
    travelBlocked: bool
    travelPenalty: float | None = Field(default=None, ge=0)


class PathNode(StrictModel):
    id: str = Field(min_length=1)
    nodeType: PathNodeType
    x: float
    y: float
    linkedObjectId: str | None = None


class PathEdge(StrictModel):
    id: str = Field(min_length=1)
    fromNodeId: str = Field(min_length=1)
    toNodeId: str = Field(min_length=1)
    lengthFeet: float = Field(gt=0)
    hallwayWidthFeet: float = Field(gt=0)
    congestionFactor: float = Field(gt=0)
    doorPenaltySeconds: float = Field(ge=0)
    turnPenaltySeconds: float = Field(ge=0)
    blocked: bool


class PlanContract(StrictModel):
    schemaVersion: Literal["1.0.0"]
    planId: str = Field(min_length=1, max_length=PLAN_ID_MAX_LENGTH)
    name: str = Field(min_length=1, max_length=PLAN_NAME_MAX_LENGTH)
    description: str | None = Field(default=None, max_length=PLAN_DESCRIPTION_MAX_LENGTH)
    createdAt: str = Field(min_length=1)
    updatedAt: str = Field(min_length=1)
    scale: ScaleSettings
    rooms: list[Room]
    hallways: list[Hallway]
    doors: list[Door]
    nurseStations: list[NurseStation]
    zones: list[Zone]
    pathNodes: list[PathNode]
    pathEdges: list[PathEdge]

    @field_validator("createdAt", "updatedAt")
    @classmethod
    def validate_timestamp(cls, value: str) -> str:
        from datetime import datetime

        try:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError("timestamp must be ISO-compatible") from exc
        return value

    @model_validator(mode="after")
    def validate_references(self) -> "PlanContract":
        room_ids = {room.id for room in self.rooms}
        hallway_ids = {hallway.id for hallway in self.hallways}
        door_ids = {door.id for door in self.doors}
        nurse_station_ids = {station.id for station in self.nurseStations}
        zone_ids = {zone.id for zone in self.zones}
        path_node_ids = {node.id for node in self.pathNodes}

        require_unique("room ids", [room.id for room in self.rooms])
        require_unique("hallway ids", [hallway.id for hallway in self.hallways])
        require_unique("door ids", [door.id for door in self.doors])
        require_unique("nurse station ids", [station.id for station in self.nurseStations])
        require_unique("zone ids", [zone.id for zone in self.zones])
        require_unique("path node ids", [node.id for node in self.pathNodes])
        require_unique("path edge ids", [edge.id for edge in self.pathEdges])

        doors_by_id = {door.id: door for door in self.doors}
        path_nodes_by_id = {node.id: node for node in self.pathNodes}

        for room in self.rooms:
            if room.zoneId is not None and room.zoneId not in zone_ids:
                raise ValueError(f"room {room.id} references unknown zone {room.zoneId}")
            if room.nearestStationId is not None and room.nearestStationId not in nurse_station_ids:
                raise ValueError(
                    f"room {room.id} references unknown nurse station {room.nearestStationId}"
                )
            if room.pathNodeId is not None and room.pathNodeId not in path_node_ids:
                raise ValueError(f"room {room.id} references unknown path node {room.pathNodeId}")
            if room.pathNodeId is not None:
                path_node = path_nodes_by_id[room.pathNodeId]
                if path_node.nodeType != "room_door":
                    raise ValueError(f"room {room.id} path node must be a room_door node")
                linked_door = doors_by_id.get(path_node.linkedObjectId or "")
                if linked_door is None or linked_door.roomId != room.id:
                    raise ValueError(f"room {room.id} path node must link to a door for the room")

        for door in self.doors:
            if door.roomId not in room_ids:
                raise ValueError(f"door {door.id} references unknown room {door.roomId}")
            if door.pathNodeId is not None and door.pathNodeId not in path_node_ids:
                raise ValueError(f"door {door.id} references unknown path node {door.pathNodeId}")
            if door.pathNodeId is not None:
                path_node = path_nodes_by_id[door.pathNodeId]
                if path_node.nodeType != "room_door":
                    raise ValueError(f"door {door.id} path node must be a room_door node")
                if path_node.linkedObjectId != door.id:
                    raise ValueError(f"door {door.id} path node must link back to the same door")

        for station in self.nurseStations:
            if station.pathNodeId not in path_node_ids:
                raise ValueError(
                    f"nurse station {station.id} references unknown path node {station.pathNodeId}"
                )
            path_node = path_nodes_by_id[station.pathNodeId]
            if path_node.nodeType != "station":
                raise ValueError(f"nurse station {station.id} path node must be a station node")
            if path_node.linkedObjectId != station.id:
                raise ValueError(
                    f"nurse station {station.id} path node must link back to the same station"
                )

        for node in self.pathNodes:
            if node.nodeType == "entry":
                if node.linkedObjectId is not None:
                    raise ValueError(f"path node {node.id} cannot link an entry node")
                continue
            if node.linkedObjectId is None:
                raise ValueError(f"path node {node.id} requires linkedObjectId")
            if node.nodeType == "room_door" and node.linkedObjectId not in door_ids:
                raise ValueError(f"path node {node.id} references unknown door")
            if node.nodeType == "hallway" and node.linkedObjectId not in hallway_ids:
                raise ValueError(f"path node {node.id} references unknown hallway")
            if node.nodeType == "station" and node.linkedObjectId not in nurse_station_ids:
                raise ValueError(f"path node {node.id} references unknown nurse station")
            if node.nodeType == "zone" and node.linkedObjectId not in zone_ids:
                raise ValueError(f"path node {node.id} references unknown zone")

        for edge in self.pathEdges:
            if edge.fromNodeId not in path_node_ids:
                raise ValueError(f"path edge {edge.id} references unknown from node")
            if edge.toNodeId not in path_node_ids:
                raise ValueError(f"path edge {edge.id} references unknown to node")

        return self


class RoomLoad(StrictModel):
    roomId: str = Field(min_length=1)
    occupied: bool
    acuity: int = Field(ge=1, le=5)
    traumaActive: bool
    isolationActive: bool
    behavioralRisk: bool
    fallRisk: bool
    sitterRequired: bool
    medicationFrequency: TaskFrequency
    monitoringFrequency: TaskFrequency
    procedureBurden: BurdenLevel
    expectedTurnover: TurnoverLevel


class RoomWorkloadWeights(StrictModel):
    acuity: dict[Literal["1", "2", "3", "4", "5"], float]
    traumaActive: float = Field(ge=0)
    isolationActive: float = Field(ge=0)
    behavioralRisk: float = Field(ge=0)
    fallRisk: float = Field(ge=0)
    sitterRequired: float = Field(ge=0)
    highMedicationFrequency: float = Field(ge=0)
    highMonitoringFrequency: float = Field(ge=0)
    highProcedureBurden: float = Field(ge=0)

    @field_validator("acuity")
    @classmethod
    def validate_acuity(cls, value: dict[str, float]) -> dict[str, float]:
        expected = {"1", "2", "3", "4", "5"}
        if set(value) != expected:
            raise ValueError("acuity weights must include levels 1 through 5")
        if any(weight < 0 for weight in value.values()):
            raise ValueError("acuity weights must be non-negative")
        return value


class NurseBurdenWeights(StrictModel):
    roomSpreadPerAdditionalOccupiedRoom: float = Field(ge=0)
    overTargetPerRoom: float = Field(ge=0)
    overMaxPerRoom: float = Field(ge=0)
    traumaMismatchPerRoom: float = Field(ge=0)
    activeTaskMinutesPlaceholder: float = Field(ge=0)
    walkingMinutesPlaceholder: float = Field(ge=0)
    breakCoveragePenaltyPlaceholder: float = Field(ge=0)
    interruptionPenaltyPlaceholder: float = Field(ge=0)


class TaskDurationDefaults(StrictModel):
    medicationTaskMinutes: float = Field(gt=0)
    monitoringTaskMinutes: float = Field(gt=0)
    procedureTaskMinutes: float = Field(gt=0)
    turnoverTaskMinutes: float = Field(gt=0)
    isolationTaskMinutes: float = Field(gt=0)
    behavioralRiskTaskMinutes: float = Field(gt=0)
    sitterTaskMinutes: float = Field(gt=0)


class TaskFrequencyMappings(StrictModel):
    none: int = Field(ge=0)
    low: int = Field(ge=0)
    medium: int = Field(ge=0)
    high: int = Field(ge=0)
    continuous: int = Field(ge=0)


class SimulationDefaults(StrictModel):
    defaultShiftLengthMinutes: int = Field(gt=0)
    defaultTimestepMinutes: int = Field(gt=0)
    defaultSeed: int = Field(ge=0, le=SAFE_INTEGER_MAX)

    @model_validator(mode="after")
    def validate_defaults(self) -> "SimulationDefaults":
        if self.defaultShiftLengthMinutes % self.defaultTimestepMinutes != 0:
            raise ValueError("defaultShiftLengthMinutes must divide evenly by defaultTimestepMinutes")
        return self


class AssumptionsRegisterContract(StrictModel):
    schemaVersion: Literal["1.0.0"]
    assumptionsId: str = Field(min_length=1)
    name: str = Field(min_length=1)
    description: str | None = None
    createdAt: str = Field(min_length=1)
    updatedAt: str = Field(min_length=1)
    roomWorkloadWeights: RoomWorkloadWeights
    nurseBurdenWeights: NurseBurdenWeights
    taskDurationDefaults: TaskDurationDefaults
    taskFrequencyMappings: TaskFrequencyMappings
    simulationDefaults: SimulationDefaults

    @field_validator("createdAt", "updatedAt")
    @classmethod
    def validate_timestamp(cls, value: str) -> str:
        from datetime import datetime

        try:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError("timestamp must be ISO-compatible") from exc
        return value


class CareTaskTemplate(StrictModel):
    id: str = Field(min_length=1)
    taskType: TaskType
    label: str = Field(min_length=1)
    description: str | None = None
    defaultDurationMinutes: float = Field(gt=0)
    frequencySource: TaskFrequencySource
    trigger: TaskTrigger
    burdenCategory: TaskBurdenCategory
    interruptive: bool
    requiresRoomPresence: bool

    @field_validator("label", "description")
    @classmethod
    def validate_operational_text(cls, value: str | None) -> str | None:
        if value is None:
            return value
        forbidden_phrases = [
            "diagnosis",
            "clinical note",
            "clinical order",
            "treatment plan",
            "real identity",
        ]
        if any(phrase in value.lower() for phrase in forbidden_phrases):
            raise ValueError("task template text must remain operational-only")
        return value

    @model_validator(mode="after")
    def validate_frequency_source(self) -> "CareTaskTemplate":
        expected = expected_frequency_source_for_trigger(self.trigger)
        if self.frequencySource != expected:
            raise ValueError(
                f"frequencySource must be {expected} for trigger {self.trigger}"
            )
        return self


class TaskTemplateContract(StrictModel):
    schemaVersion: Literal["1.0.0"]
    templateSetId: str = Field(min_length=1)
    name: str = Field(min_length=1)
    description: str | None = None
    taskTemplates: list[CareTaskTemplate]

    @field_validator("description")
    @classmethod
    def validate_description(cls, value: str | None) -> str | None:
        return CareTaskTemplate.validate_operational_text(value)

    @model_validator(mode="after")
    def validate_template_ids(self) -> "TaskTemplateContract":
        require_unique("task template ids", [template.id for template in self.taskTemplates])
        return self


class DayProfileSegment(StrictModel):
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    startMinute: int = Field(ge=0)
    endMinute: int = Field(gt=0)
    taskVolumeMultiplier: float = Field(gt=0)
    turnoverMultiplier: float = Field(gt=0)
    interruptionMultiplier: float = Field(gt=0)
    walkingCongestionMultiplier: float = Field(gt=0)

    @model_validator(mode="after")
    def validate_range(self) -> "DayProfileSegment":
        if self.endMinute <= self.startMinute:
            raise ValueError("segment endMinute must be greater than startMinute")
        return self


class DayProfileContract(StrictModel):
    schemaVersion: Literal["1.0.0"]
    dayProfileId: str = Field(min_length=1)
    name: str = Field(min_length=1)
    description: str | None = None
    shiftLengthMinutes: int = Field(gt=0)
    segments: list[DayProfileSegment] = Field(min_length=1)

    @model_validator(mode="after")
    def validate_segments(self) -> "DayProfileContract":
        require_unique("day profile segment ids", [segment.id for segment in self.segments])
        sorted_segments = sorted(self.segments, key=lambda segment: segment.startMinute)
        expected_start = 0
        for segment in sorted_segments:
            if segment.endMinute > self.shiftLengthMinutes:
                raise ValueError("day profile segments must stay within shift bounds")
            if segment.startMinute != expected_start:
                raise ValueError(
                    "day profile segments must cover the full shift without gaps or overlaps"
                )
            expected_start = segment.endMinute
        if expected_start != self.shiftLengthMinutes:
            raise ValueError("day profile segments must cover the full shift")
        return self


class ScenarioContract(StrictModel):
    schemaVersion: Literal["1.0.0"]
    scenarioId: str = Field(min_length=1)
    planId: str = Field(min_length=1)
    assignmentSetId: str = Field(min_length=1)
    assumptionsId: str = Field(min_length=1)
    taskTemplateSetId: str = Field(min_length=1)
    dayProfileId: str = Field(min_length=1)
    name: str = Field(min_length=1)
    description: str | None = None
    shiftLengthMinutes: int = Field(gt=0)
    timestepMinutes: int = Field(gt=0)
    seed: int = Field(ge=0, le=SAFE_INTEGER_MAX)
    roomLoads: list[RoomLoad]

    @model_validator(mode="after")
    def validate_timestep(self) -> "ScenarioContract":
        if self.shiftLengthMinutes % self.timestepMinutes != 0:
            raise ValueError("shiftLengthMinutes must divide evenly by timestepMinutes")
        require_unique("room load ids", [load.roomId for load in self.roomLoads])
        return self


class BreakWindow(StrictModel):
    id: str = Field(min_length=1)
    nurseId: str = Field(min_length=1)
    startMinute: int = Field(ge=0)
    endMinute: int = Field(ge=0)
    flexible: bool

    @model_validator(mode="after")
    def validate_window(self) -> "BreakWindow":
        if self.endMinute <= self.startMinute:
            raise ValueError("break endMinute must be greater than startMinute")
        return self


class Nurse(StrictModel):
    id: str = Field(min_length=1)
    name: str = Field(min_length=1)
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")
    role: NurseRole
    homeStationId: str | None = None
    traumaQualified: bool
    chargeQualified: bool
    psychQualified: bool
    triageQualified: bool
    maxPatients: int = Field(gt=0)
    targetPatients: int = Field(gt=0)
    walkingSpeedFeetPerMinute: float = Field(gt=0)
    shiftStartMinute: int = Field(ge=0)
    shiftEndMinute: int = Field(ge=0)
    breakWindows: list[BreakWindow]

    @model_validator(mode="after")
    def validate_nurse(self) -> "Nurse":
        if self.maxPatients < self.targetPatients:
            raise ValueError("maxPatients must be greater than or equal to targetPatients")
        if self.shiftEndMinute <= self.shiftStartMinute:
            raise ValueError("shiftEndMinute must be greater than shiftStartMinute")
        for break_window in self.breakWindows:
            if break_window.nurseId != self.id:
                raise ValueError("break window nurseId must reference its parent nurse")
        return self


class Assignment(StrictModel):
    id: str = Field(min_length=1)
    nurseId: str = Field(min_length=1)
    roomIds: list[str] = Field(min_length=1)
    assignmentType: AssignmentType
    startMinute: int = Field(ge=0)
    endMinute: int | None = None

    @field_validator("roomIds")
    @classmethod
    def validate_room_ids(cls, value: list[str]) -> list[str]:
        require_unique("assignment room ids", value)
        if any(room_id == "" for room_id in value):
            raise ValueError("assignment room ids must be non-empty")
        return value

    @model_validator(mode="after")
    def validate_assignment(self) -> "Assignment":
        if self.endMinute is not None and self.endMinute <= self.startMinute:
            raise ValueError("assignment endMinute must be greater than startMinute")
        return self


class ManualAssignmentContract(StrictModel):
    schemaVersion: Literal["1.0.0"]
    assignmentSetId: str = Field(min_length=1)
    planId: str = Field(min_length=1)
    name: str = Field(min_length=1)
    description: str | None = None
    nurses: list[Nurse]
    assignments: list[Assignment]

    @model_validator(mode="after")
    def validate_assignment_set(self) -> "ManualAssignmentContract":
        nurse_ids = {nurse.id for nurse in self.nurses}
        require_unique("nurse ids", [nurse.id for nurse in self.nurses])
        require_unique("assignment ids", [assignment.id for assignment in self.assignments])
        require_unique(
            "break window ids",
            [break_window.id for nurse in self.nurses for break_window in nurse.breakWindows],
        )

        for assignment in self.assignments:
            if assignment.nurseId not in nurse_ids:
                raise ValueError(f"assignment {assignment.id} references an unknown nurse")

        assigned_room_ids = [
            room_id for assignment in self.assignments for room_id in assignment.roomIds
        ]
        require_unique("assigned room ids", assigned_room_ids)
        return self


class Warning(StrictModel):
    id: str = Field(min_length=1)
    severity: WarningSeverity
    code: WarningCode
    message: str = Field(min_length=1)
    nurseIds: list[str] | None = None
    roomIds: list[str] | None = None
    taskIds: list[str] | None = None
    minute: int | None = None


def validate_room_loads(value: Any, plan: PlanContract | None = None) -> list[RoomLoad]:
    room_loads = TypeAdapter(list[RoomLoad]).validate_python(value)
    require_unique("room load ids", [load.roomId for load in room_loads])

    if plan is not None:
        room_ids = {room.id for room in plan.rooms}
        for load in room_loads:
            if load.roomId not in room_ids:
                raise ValueError(f"room load {load.roomId} references an unknown room")

    return room_loads


def validate_manual_assignment_contract(
    value: Any, plan: PlanContract | None = None
) -> ManualAssignmentContract:
    assignment_set = ManualAssignmentContract.model_validate(value)

    if plan is not None:
        if assignment_set.planId != plan.planId:
            raise ValueError("manual assignment planId must match the referenced plan")
        room_ids = {room.id for room in plan.rooms}
        for assignment in assignment_set.assignments:
            for room_id in assignment.roomIds:
                if room_id not in room_ids:
                    raise ValueError(f"assignment {assignment.id} references unknown room {room_id}")

    return assignment_set


def validate_shift_scenario_contract(
    value: Any,
    plan: PlanContract | None = None,
    assignment_set: ManualAssignmentContract | None = None,
    assumptions: AssumptionsRegisterContract | None = None,
    task_templates: TaskTemplateContract | None = None,
    day_profile: DayProfileContract | None = None,
) -> ScenarioContract:
    scenario = ScenarioContract.model_validate(value)

    if plan is not None and scenario.planId != plan.planId:
        raise ValueError("scenario planId must match the referenced plan")
    if assignment_set is not None and scenario.assignmentSetId != assignment_set.assignmentSetId:
        raise ValueError("scenario assignmentSetId must match the referenced assignment set")
    if assumptions is not None and scenario.assumptionsId != assumptions.assumptionsId:
        raise ValueError("scenario assumptionsId must match the referenced assumptions register")
    if task_templates is not None and scenario.taskTemplateSetId != task_templates.templateSetId:
        raise ValueError("scenario taskTemplateSetId must match the referenced task template set")
    if day_profile is not None:
        if scenario.dayProfileId != day_profile.dayProfileId:
            raise ValueError("scenario dayProfileId must match the referenced day profile")
        if scenario.shiftLengthMinutes != day_profile.shiftLengthMinutes:
            raise ValueError("scenario shiftLengthMinutes must match the referenced day profile")
    validate_room_loads([load.model_dump() for load in scenario.roomLoads], plan)

    return scenario


def expected_frequency_source_for_trigger(trigger: TaskTrigger) -> TaskFrequencySource:
    if trigger in {"medicationFrequency", "monitoringFrequency"}:
        return "room_load_frequency"
    if trigger == "procedureBurden":
        return "room_load_burden"
    if trigger == "expectedTurnover":
        return "room_load_turnover"
    return "boolean_trigger"


def require_unique(label: str, values: list[str]) -> None:
    if len(values) != len(set(values)):
        raise ValueError(f"duplicate {label} are not allowed")
