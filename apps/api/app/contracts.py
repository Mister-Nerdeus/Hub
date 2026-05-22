from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, field_validator, model_validator

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

PLAN_ID_MAX_LENGTH = 64
PLAN_NAME_MAX_LENGTH = 160
PLAN_DESCRIPTION_MAX_LENGTH = 500


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


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
    acuityScore: int = Field(ge=1, le=5)
    traumaActive: bool
    isolationActive: bool
    behavioralRisk: bool
    fallRisk: bool
    sitterRequired: bool
    medicationFrequency: int = Field(ge=0)
    monitoringFrequency: int = Field(ge=0)
    procedureBurden: int = Field(ge=0)
    turnoverBurden: int = Field(ge=0)


class ScenarioContract(StrictModel):
    schemaVersion: Literal["1.0.0"]
    scenarioId: str = Field(min_length=1)
    planId: str = Field(min_length=1)
    name: str = Field(min_length=1)
    shiftLengthMinutes: int = Field(gt=0)
    timestepMinutes: int = Field(gt=0)
    seed: int = Field(ge=0)
    roomLoads: list[RoomLoad]

    @model_validator(mode="after")
    def validate_timestep(self) -> "ScenarioContract":
        if self.shiftLengthMinutes % self.timestepMinutes != 0:
            raise ValueError("shiftLengthMinutes must divide evenly by timestepMinutes")
        require_unique("room load ids", [load.roomId for load in self.roomLoads])
        return self


def require_unique(label: str, values: list[str]) -> None:
    if len(values) != len(set(values)):
        raise ValueError(f"duplicate {label} are not allowed")
