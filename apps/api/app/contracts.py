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
NurseTaskAssignmentReason = Literal[
    "manual_room_coverage",
    "charge_coverage",
    "float_coverage",
    "unassigned",
]
ReportType = Literal[
    "operational_summary",
    "nurse_workload",
    "unassigned_tasks",
    "warnings",
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


class GeneratedOperationalTask(StrictModel):
    id: str = Field(min_length=1)
    taskType: TaskType
    roomId: str = Field(min_length=1)
    sourceTemplateId: str = Field(min_length=1)
    scheduledMinute: int = Field(ge=0)
    estimatedDurationMinutes: float = Field(gt=0)
    burdenCategory: TaskBurdenCategory
    interruptive: bool
    requiresRoomPresence: bool


class GeneratedOperationalTaskSetContract(StrictModel):
    schemaVersion: Literal["1.0.0"]
    generatedTaskSetId: str = Field(min_length=1)
    scenarioId: str = Field(min_length=1)
    seed: int = Field(ge=0, le=SAFE_INTEGER_MAX)
    taskCount: int = Field(ge=0)
    generatedTasks: list[GeneratedOperationalTask]

    @model_validator(mode="after")
    def validate_task_set(self) -> "GeneratedOperationalTaskSetContract":
        require_unique("generated operational task ids", [task.id for task in self.generatedTasks])
        if self.taskCount != len(self.generatedTasks):
            raise ValueError("generated task set taskCount must equal generatedTasks length")
        return self


class NurseTaskAssignment(StrictModel):
    id: str = Field(min_length=1)
    taskId: str = Field(min_length=1)
    nurseId: str | None = None
    assignmentReason: NurseTaskAssignmentReason
    minute: int = Field(ge=0)


class NurseTaskAssignmentContract(StrictModel):
    schemaVersion: Literal["1.0.0"]
    nurseTaskAssignmentSetId: str = Field(min_length=1)
    scenarioId: str = Field(min_length=1)
    assignmentSetId: str = Field(min_length=1)
    generatedTaskSetId: str = Field(min_length=1)
    name: str = Field(min_length=1)
    description: str | None = None
    taskAssignments: list[NurseTaskAssignment]

    @model_validator(mode="after")
    def validate_assignment_set(self) -> "NurseTaskAssignmentContract":
        require_unique(
            "nurse task assignment ids",
            [assignment.id for assignment in self.taskAssignments],
        )
        require_unique(
            "nurse task assignment task ids",
            [assignment.taskId for assignment in self.taskAssignments],
        )
        for assignment in self.taskAssignments:
            if assignment.assignmentReason == "unassigned" and assignment.nurseId is not None:
                raise ValueError("unassigned nurse task assignments must not include nurseId")
            if assignment.assignmentReason != "unassigned" and assignment.nurseId is None:
                raise ValueError("assigned nurse task assignments require nurseId")
        return self


class OperationalReportSummary(StrictModel):
    totalGeneratedTasks: int = Field(ge=0)
    assignedTaskCount: int = Field(ge=0)
    unassignedTaskCount: int = Field(ge=0)
    totalEstimatedTaskMinutes: float = Field(ge=0)
    nurseCount: int = Field(ge=0)
    warningCount: int = Field(ge=0)


class NurseOperationalSummary(StrictModel):
    nurseId: str = Field(min_length=1)
    assignedTaskCount: int = Field(ge=0)
    estimatedTaskMinutes: float = Field(ge=0)
    warningCount: int = Field(ge=0)


class ReportTimelineSummary(StrictModel):
    bucketCount: int = Field(ge=0)
    busiestMinute: int | None = Field(default=None, ge=0)
    busiestMinuteTaskCount: int = Field(ge=0)
    totalInterruptiveTasks: int = Field(ge=0)


class ReportWarningSummary(StrictModel):
    infoCount: int = Field(ge=0)
    warningCount: int = Field(ge=0)
    criticalCount: int = Field(ge=0)
    warningCodes: dict[str, int]

    @field_validator("warningCodes")
    @classmethod
    def validate_warning_codes(cls, value: dict[str, int]) -> dict[str, int]:
        for code, count in value.items():
            if code == "":
                raise ValueError("warning code keys must be non-empty")
            if count < 0:
                raise ValueError("warning code counts must be non-negative")
        return value


class ReportUnassignedTaskSummary(StrictModel):
    unassignedTaskCount: int = Field(ge=0)
    taskIds: list[str]
    roomIds: list[str]

    @field_validator("taskIds", "roomIds")
    @classmethod
    def validate_ids(cls, value: list[str]) -> list[str]:
        if any(item == "" for item in value):
            raise ValueError("report IDs must be non-empty")
        require_unique("report IDs", value)
        return value

    @model_validator(mode="after")
    def validate_count(self) -> "ReportUnassignedTaskSummary":
        if self.unassignedTaskCount != len(self.taskIds):
            raise ValueError("unassignedTaskCount must equal taskIds length")
        return self


class OperationalReportContract(StrictModel):
    schemaVersion: Literal["1.0.0"]
    reportId: str = Field(min_length=1)
    reportType: ReportType
    scenarioId: str = Field(min_length=1)
    generatedTaskSetId: str = Field(min_length=1)
    nurseTaskAssignmentSetId: str = Field(min_length=1)
    createdAt: str = Field(min_length=1)
    title: str = Field(min_length=1)
    summary: OperationalReportSummary
    nurseSummaries: list[NurseOperationalSummary]
    timelineSummary: ReportTimelineSummary
    warningSummary: ReportWarningSummary
    unassignedTaskSummary: ReportUnassignedTaskSummary
    limitations: list[str] = Field(min_length=1)

    @field_validator("createdAt")
    @classmethod
    def validate_timestamp(cls, value: str) -> str:
        from datetime import datetime

        try:
            datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError as exc:
            raise ValueError("timestamp must be ISO-compatible") from exc
        return value

    @field_validator("title")
    @classmethod
    def validate_title(cls, value: str) -> str:
        return validate_report_text(value, "title")

    @field_validator("limitations")
    @classmethod
    def validate_limitations(cls, value: list[str]) -> list[str]:
        for index, limitation in enumerate(value):
            validate_report_text(limitation, f"limitations[{index}]")
        validate_required_report_limitations(value)
        return value

    @model_validator(mode="after")
    def validate_counts(self) -> "OperationalReportContract":
        if (
            self.summary.assignedTaskCount + self.summary.unassignedTaskCount
            != self.summary.totalGeneratedTasks
        ):
            raise ValueError("assignedTaskCount plus unassignedTaskCount must equal totalGeneratedTasks")
        if self.summary.nurseCount != len(self.nurseSummaries):
            raise ValueError("nurseCount must equal nurseSummaries length")
        if (
            self.summary.warningCount
            != self.warningSummary.infoCount
            + self.warningSummary.warningCount
            + self.warningSummary.criticalCount
        ):
            raise ValueError("warningCount must equal warning severity counts")
        if self.summary.unassignedTaskCount != self.unassignedTaskSummary.unassignedTaskCount:
            raise ValueError("summary unassignedTaskCount must equal unassigned summary")
        if self.timelineSummary.busiestMinute is None and self.timelineSummary.busiestMinuteTaskCount != 0:
            raise ValueError("busiestMinuteTaskCount must be 0 when busiestMinute is null")
        require_unique("report nurse summary ids", [summary.nurseId for summary in self.nurseSummaries])
        return self


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


def validate_generated_operational_tasks(
    value: Any,
    scenario: ScenarioContract | None = None,
    task_templates: TaskTemplateContract | None = None,
    plan: PlanContract | None = None,
) -> list[GeneratedOperationalTask]:
    tasks = TypeAdapter(list[GeneratedOperationalTask]).validate_python(value)
    require_unique("generated operational task ids", [task.id for task in tasks])

    room_ids = {room.id for room in plan.rooms} if plan is not None else set()
    scenario_room_ids = {room_load.roomId for room_load in scenario.roomLoads} if scenario else set()
    templates_by_id = (
        {template.id: template for template in task_templates.taskTemplates}
        if task_templates is not None
        else {}
    )

    for task in tasks:
        if scenario is not None:
            if task.scheduledMinute >= scenario.shiftLengthMinutes:
                raise ValueError("generated task scheduledMinute must be within shift bounds")
            if task.scheduledMinute % scenario.timestepMinutes != 0:
                raise ValueError("generated task scheduledMinute must align to timestepMinutes")
            if task.roomId not in scenario_room_ids:
                raise ValueError(f"generated task {task.id} references unknown scenario room")
        if plan is not None and task.roomId not in room_ids:
            raise ValueError(f"generated task {task.id} references unknown plan room")
        if task_templates is not None:
            template = templates_by_id.get(task.sourceTemplateId)
            if template is None:
                raise ValueError(f"generated task {task.id} references unknown task template")
            if template.taskType != task.taskType:
                raise ValueError(f"generated task {task.id} taskType must match task template")
            if template.burdenCategory != task.burdenCategory:
                raise ValueError(
                    f"generated task {task.id} burdenCategory must match task template"
                )

    return tasks


def validate_generated_operational_task_set(
    value: Any,
    scenario: ScenarioContract | None = None,
    task_templates: TaskTemplateContract | None = None,
    plan: PlanContract | None = None,
) -> GeneratedOperationalTaskSetContract:
    task_set = GeneratedOperationalTaskSetContract.model_validate(value)

    if scenario is not None:
        if task_set.scenarioId != scenario.scenarioId:
            raise ValueError("generated task set scenarioId must match the referenced scenario")
        if task_set.seed != scenario.seed:
            raise ValueError("generated task set seed must match the referenced scenario")
    validate_generated_operational_tasks(
        [task.model_dump() for task in task_set.generatedTasks],
        scenario=scenario,
        task_templates=task_templates,
        plan=plan,
    )

    return task_set


def validate_nurse_task_assignment_contract(
    value: Any,
    scenario: ScenarioContract | None = None,
    assignment_set: ManualAssignmentContract | None = None,
    generated_task_set: GeneratedOperationalTaskSetContract | None = None,
) -> NurseTaskAssignmentContract:
    nurse_task_assignment = NurseTaskAssignmentContract.model_validate(value)

    if scenario is not None and nurse_task_assignment.scenarioId != scenario.scenarioId:
        raise ValueError("nurse task assignment scenarioId must match the referenced scenario")
    if (
        assignment_set is not None
        and nurse_task_assignment.assignmentSetId != assignment_set.assignmentSetId
    ):
        raise ValueError(
            "nurse task assignment assignmentSetId must match the referenced assignment set"
        )
    if (
        generated_task_set is not None
        and nurse_task_assignment.generatedTaskSetId != generated_task_set.generatedTaskSetId
    ):
        raise ValueError(
            "nurse task assignment generatedTaskSetId must match the referenced generated task set"
        )
    if (
        generated_task_set is not None
        and nurse_task_assignment.scenarioId != generated_task_set.scenarioId
    ):
        raise ValueError(
            "nurse task assignment scenarioId must match the referenced generated task set scenarioId"
        )

    nurse_ids = {nurse.id for nurse in assignment_set.nurses} if assignment_set else set()
    tasks_by_id = (
        {task.id: task for task in generated_task_set.generatedTasks}
        if generated_task_set is not None
        else {}
    )
    for assignment in nurse_task_assignment.taskAssignments:
        if assignment.nurseId is not None and assignment_set is not None:
            if assignment.nurseId not in nurse_ids:
                raise ValueError(f"nurse task assignment {assignment.id} references unknown nurse")
        if generated_task_set is not None:
            generated_task = tasks_by_id.get(assignment.taskId)
            if generated_task is None:
                raise ValueError(
                    f"nurse task assignment {assignment.id} references unknown generated task"
                )
            if assignment.minute != generated_task.scheduledMinute:
                raise ValueError(
                    f"nurse task assignment {assignment.id} minute must match generated task"
                )

    return nurse_task_assignment


def validate_operational_report_contract(
    value: Any,
    scenario: ScenarioContract | None = None,
    generated_task_set: GeneratedOperationalTaskSetContract | None = None,
    nurse_task_assignment_set: NurseTaskAssignmentContract | None = None,
    manual_assignment_set: ManualAssignmentContract | None = None,
    warnings: list[Warning] | None = None,
) -> OperationalReportContract:
    report = OperationalReportContract.model_validate(value)

    if scenario is not None and report.scenarioId != scenario.scenarioId:
        raise ValueError("operational report scenarioId must match the referenced scenario")
    if (
        generated_task_set is not None
        and report.generatedTaskSetId != generated_task_set.generatedTaskSetId
    ):
        raise ValueError(
            "operational report generatedTaskSetId must match the referenced generated task set"
        )
    if (
        nurse_task_assignment_set is not None
        and report.nurseTaskAssignmentSetId
        != nurse_task_assignment_set.nurseTaskAssignmentSetId
    ):
        raise ValueError(
            "operational report nurseTaskAssignmentSetId must match the referenced assignment set"
        )

    if generated_task_set is not None:
        validate_report_against_generated_task_set(report, generated_task_set)
    if nurse_task_assignment_set is not None:
        validate_report_against_nurse_task_assignment_set(
            report,
            nurse_task_assignment_set,
            scenario,
            generated_task_set,
            manual_assignment_set,
        )
    if manual_assignment_set is not None:
        nurse_ids = {nurse.id for nurse in manual_assignment_set.nurses}
        for nurse_summary in report.nurseSummaries:
            if nurse_summary.nurseId not in nurse_ids:
                raise ValueError("report nurse summary references unknown nurse")
        expected_nurse_ids = sorted(nurse.id for nurse in manual_assignment_set.nurses)
        actual_nurse_ids = sorted(summary.nurseId for summary in report.nurseSummaries)
        if actual_nurse_ids != expected_nurse_ids:
            raise ValueError("report nurse summaries must include every manual assignment nurse")
    if warnings is not None:
        validate_report_against_warnings(report, warnings)

    return report


def validate_report_against_generated_task_set(
    report: OperationalReportContract,
    generated_task_set: GeneratedOperationalTaskSetContract,
) -> None:
    if report.scenarioId != generated_task_set.scenarioId:
        raise ValueError("report scenarioId must match generated task set scenarioId")
    task_by_id = {task.id: task for task in generated_task_set.generatedTasks}
    total_estimated_minutes = sum(task.estimatedDurationMinutes for task in generated_task_set.generatedTasks)
    if report.summary.totalGeneratedTasks != len(generated_task_set.generatedTasks):
        raise ValueError("report totalGeneratedTasks must match generated task set")
    if report.summary.totalEstimatedTaskMinutes != total_estimated_minutes:
        raise ValueError("report totalEstimatedTaskMinutes must match generated task durations")

    timeline_summary = summarize_generated_task_timeline(generated_task_set)
    if report.timelineSummary != timeline_summary:
        raise ValueError("report timeline summary must match generated tasks")

    for task_id in report.unassignedTaskSummary.taskIds:
        if task_id not in task_by_id:
            raise ValueError("unassigned task summary references unknown generated task")


def validate_report_against_nurse_task_assignment_set(
    report: OperationalReportContract,
    nurse_task_assignment_set: NurseTaskAssignmentContract,
    scenario: ScenarioContract | None,
    generated_task_set: GeneratedOperationalTaskSetContract | None,
    manual_assignment_set: ManualAssignmentContract | None,
) -> None:
    assignment_set = validate_nurse_task_assignment_contract(
        nurse_task_assignment_set.model_dump(),
        scenario=scenario,
        assignment_set=manual_assignment_set,
        generated_task_set=generated_task_set,
    )
    if report.scenarioId != assignment_set.scenarioId:
        raise ValueError("report scenarioId must match nurse task assignment set")
    if report.generatedTaskSetId != assignment_set.generatedTaskSetId:
        raise ValueError("report generatedTaskSetId must match nurse task assignment set")

    assigned_assignments = [
        assignment
        for assignment in assignment_set.taskAssignments
        if assignment.assignmentReason != "unassigned"
    ]
    unassigned_assignments = [
        assignment
        for assignment in assignment_set.taskAssignments
        if assignment.assignmentReason == "unassigned"
    ]
    if report.summary.assignedTaskCount != len(assigned_assignments):
        raise ValueError("report assignedTaskCount must match task assignments")
    if report.summary.unassignedTaskCount != len(unassigned_assignments):
        raise ValueError("report unassignedTaskCount must match task assignments")

    expected_unassigned_task_ids = sorted(assignment.taskId for assignment in unassigned_assignments)
    if report.unassignedTaskSummary.taskIds != expected_unassigned_task_ids:
        raise ValueError("report unassigned task IDs must match task assignments")

    if generated_task_set is not None:
        task_by_id = {task.id: task for task in generated_task_set.generatedTasks}
        expected_unassigned_room_ids = sorted(
            {
                task_by_id[task_id].roomId
                for task_id in expected_unassigned_task_ids
                if task_id in task_by_id
            }
        )
        if report.unassignedTaskSummary.roomIds != expected_unassigned_room_ids:
            raise ValueError("report unassigned room IDs must match generated tasks")

        expected_nurse_summaries = summarize_nurse_assignments(
            assignment_set,
            generated_task_set,
            manual_assignment_set,
        )
        for nurse_summary in report.nurseSummaries:
            expected = expected_nurse_summaries.get(nurse_summary.nurseId)
            if expected is None:
                continue
            if nurse_summary.assignedTaskCount != expected["assignedTaskCount"]:
                raise ValueError("report nurse assigned task count must match task assignments")
            if nurse_summary.estimatedTaskMinutes != expected["estimatedTaskMinutes"]:
                raise ValueError("report nurse estimated minutes must match generated tasks")


def validate_report_against_warnings(
    report: OperationalReportContract,
    warnings: list[Warning],
) -> None:
    warning_summary = summarize_warnings(warnings)
    if report.summary.warningCount != len(warnings):
        raise ValueError("report warningCount must match supplied warnings")
    if report.warningSummary != warning_summary:
        raise ValueError("report warning summary must match supplied warnings")
    for nurse_summary in report.nurseSummaries:
        expected_warning_count = len(
            [
                warning
                for warning in warnings
                if warning.nurseIds is not None and nurse_summary.nurseId in warning.nurseIds
            ]
        )
        if nurse_summary.warningCount != expected_warning_count:
            raise ValueError("report nurse warning count must match supplied warnings")


def validate_report_text(value: str, label: str) -> str:
    lower_value = value.lower()
    forbidden_phrases = [
        "safe staffing",
        "safe-staffing",
        "clinical adequacy",
        "staffing certification",
        "certifies staffing",
        "safety certification",
        "patient outcome",
        "optimized assignment",
        "completed work",
        "walking route accuracy",
        "delay prediction",
        "diagnosis",
        "treatment",
        "clinical note",
        "patient name",
        "ehr",
    ]
    if any(phrase in lower_value for phrase in forbidden_phrases):
        raise ValueError(f"{label} must remain an operational inspection summary only")
    return value


def validate_required_report_limitations(limitations: list[str]) -> None:
    text = " ".join(limitations).lower()
    required = [
        ("operational-only", ("operational-only", "operational only", "operational inspection summary")),
        ("no optimizer", ("no optimizer",)),
        ("no task-completion simulation", ("no task-completion simulation", "no task completion simulation")),
        ("no walking route calculation", ("no walking route calculation",)),
    ]
    for label, accepted_phrases in required:
        if not any(phrase in text for phrase in accepted_phrases):
            raise ValueError(f"limitations must include {label} language")


def summarize_generated_task_timeline(
    generated_task_set: GeneratedOperationalTaskSetContract,
) -> ReportTimelineSummary:
    counts_by_minute: dict[int, int] = {}
    total_interruptive_tasks = 0
    for task in generated_task_set.generatedTasks:
        counts_by_minute[task.scheduledMinute] = counts_by_minute.get(task.scheduledMinute, 0) + 1
        if task.interruptive:
            total_interruptive_tasks += 1

    busiest_minute = None
    busiest_minute_task_count = 0
    for minute in sorted(counts_by_minute):
        count = counts_by_minute[minute]
        if count > busiest_minute_task_count:
            busiest_minute = minute
            busiest_minute_task_count = count

    return ReportTimelineSummary(
        bucketCount=len(counts_by_minute),
        busiestMinute=busiest_minute,
        busiestMinuteTaskCount=busiest_minute_task_count,
        totalInterruptiveTasks=total_interruptive_tasks,
    )


def summarize_nurse_assignments(
    assignment_set: NurseTaskAssignmentContract,
    generated_task_set: GeneratedOperationalTaskSetContract,
    manual_assignment_set: ManualAssignmentContract | None,
) -> dict[str, dict[str, float]]:
    task_by_id = {task.id: task for task in generated_task_set.generatedTasks}
    nurse_ids = (
        [nurse.id for nurse in manual_assignment_set.nurses]
        if manual_assignment_set is not None
        else sorted(
            {
                assignment.nurseId
                for assignment in assignment_set.taskAssignments
                if assignment.nurseId is not None
            }
        )
    )
    summaries = {
        nurse_id: {"assignedTaskCount": 0, "estimatedTaskMinutes": 0.0}
        for nurse_id in nurse_ids
    }
    for assignment in assignment_set.taskAssignments:
        if assignment.nurseId is None:
            continue
        summary = summaries.setdefault(
            assignment.nurseId,
            {"assignedTaskCount": 0, "estimatedTaskMinutes": 0.0},
        )
        summary["assignedTaskCount"] += 1
        task = task_by_id.get(assignment.taskId)
        summary["estimatedTaskMinutes"] += task.estimatedDurationMinutes if task is not None else 0
    return summaries


def summarize_warnings(warnings: list[Warning]) -> ReportWarningSummary:
    warning_codes: dict[str, int] = {}
    info_count = 0
    warning_count = 0
    critical_count = 0
    for warning in sorted(warnings, key=lambda item: item.id):
        if warning.severity == "info":
            info_count += 1
        if warning.severity == "warning":
            warning_count += 1
        if warning.severity == "critical":
            critical_count += 1
        warning_codes[warning.code] = warning_codes.get(warning.code, 0) + 1
    return ReportWarningSummary(
        infoCount=info_count,
        warningCount=warning_count,
        criticalCount=critical_count,
        warningCodes=warning_codes,
    )


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
