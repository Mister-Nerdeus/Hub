from typing import Literal

from pydantic import BaseModel, ConfigDict, Field, model_validator


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid")


class UnitSettings(StrictModel):
    unit: Literal["feet"]
    pixelsPerUnit: float = Field(gt=0)
    gridSizeUnits: float = Field(gt=0)
    origin: Literal["top-left"]


class Point(StrictModel):
    x: float
    y: float


class Room(StrictModel):
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    x: float
    y: float
    width: float = Field(gt=0)
    height: float = Field(gt=0)
    zoneId: str | None = None


class Hallway(StrictModel):
    id: str = Field(min_length=1)
    points: list[Point] = Field(min_length=2)


class Door(StrictModel):
    id: str = Field(min_length=1)
    roomId: str = Field(min_length=1)
    x: float
    y: float


class Station(StrictModel):
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    x: float
    y: float


class Zone(StrictModel):
    id: str = Field(min_length=1)
    label: str = Field(min_length=1)
    color: str = Field(pattern=r"^#[0-9a-fA-F]{6}$")


class PathNode(StrictModel):
    id: str = Field(min_length=1)
    x: float
    y: float


class PathEdge(StrictModel):
    id: str = Field(min_length=1)
    fromNodeId: str = Field(min_length=1)
    toNodeId: str = Field(min_length=1)
    lengthUnits: float | None = Field(default=None, gt=0)


class PlanContract(StrictModel):
    schemaVersion: Literal["1.0.0"]
    planId: str = Field(min_length=1)
    name: str = Field(min_length=1)
    units: UnitSettings
    rooms: list[Room]
    hallways: list[Hallway] = []
    doors: list[Door] = []
    stations: list[Station] = []
    zones: list[Zone] = []
    pathNodes: list[PathNode] = []
    pathEdges: list[PathEdge] = []

    @model_validator(mode="after")
    def validate_references(self) -> "PlanContract":
        room_ids = {room.id for room in self.rooms}
        zone_ids = {zone.id for zone in self.zones}
        path_node_ids = {node.id for node in self.pathNodes}

        require_unique("room ids", [room.id for room in self.rooms])
        require_unique("hallway ids", [hallway.id for hallway in self.hallways])
        require_unique("door ids", [door.id for door in self.doors])
        require_unique("station ids", [station.id for station in self.stations])
        require_unique("zone ids", [zone.id for zone in self.zones])
        require_unique("path node ids", [node.id for node in self.pathNodes])
        require_unique("path edge ids", [edge.id for edge in self.pathEdges])

        for room in self.rooms:
            if room.zoneId is not None and room.zoneId not in zone_ids:
                raise ValueError(f"room {room.id} references unknown zone {room.zoneId}")
        for door in self.doors:
            if door.roomId not in room_ids:
                raise ValueError(f"door {door.id} references unknown room {door.roomId}")
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
