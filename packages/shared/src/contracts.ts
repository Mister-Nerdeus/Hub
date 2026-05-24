import {
  validateOperationalRuntimeText,
  validateOptionalOperationalRuntimeText
} from "./no-phi/runtimeTextGuard.js";

export const ROOM_TYPES = [
  "standard",
  "trauma",
  "isolation",
  "psych",
  "hall_bed",
  "procedure",
  "overflow"
] as const;

export const ZONE_TYPES = [
  "provider_area",
  "pharmacy",
  "ems_entry",
  "hallway",
  "waiting",
  "storage",
  "staff_only"
] as const;

export const PATH_NODE_TYPES = [
  "room_door",
  "hallway",
  "station",
  "entry",
  "zone"
] as const;

export const STATION_TYPES = [
  "primary",
  "secondary",
  "charge",
  "temporary"
] as const;

export const ROOM_OPERATIONAL_CLASSES = [
  "standard",
  "trauma",
  "isolation",
  "behavioral",
  "procedure",
  "hall_bed",
  "overflow"
] as const;

export const ROOM_CAPACITY_CATEGORIES = ["single", "double", "hall", "overflow"] as const;

export const LINE_OF_SIGHT_LEVELS = ["low", "moderate", "high"] as const;

export const TASK_FREQUENCIES = ["none", "low", "medium", "high", "continuous"] as const;

export const BURDEN_LEVELS = ["none", "low", "medium", "high", "very_high"] as const;

export const TURNOVER_LEVELS = ["low", "normal", "high", "surge"] as const;

export const TASK_TYPES = [
  "medication_round",
  "monitoring_check",
  "procedure_support",
  "room_turnover",
  "isolation_prep",
  "behavioral_observation",
  "sitter_observation"
] as const;

export const TASK_FREQUENCY_SOURCES = [
  "room_load_frequency",
  "room_load_burden",
  "room_load_turnover",
  "boolean_trigger"
] as const;

export const TASK_TRIGGERS = [
  "medicationFrequency",
  "monitoringFrequency",
  "procedureBurden",
  "expectedTurnover",
  "isolationActive",
  "behavioralRisk",
  "sitterRequired"
] as const;

export const TASK_BURDEN_CATEGORIES = [
  "medication",
  "monitoring",
  "procedure",
  "turnover",
  "isolation",
  "behavioral",
  "sitter"
] as const;

export const NURSE_ROLES = [
  "primary",
  "charge",
  "float",
  "triage",
  "trauma",
  "preceptor",
  "orientee"
] as const;

export const ASSIGNMENT_TYPES = ["manual", "optimized", "temporary_break_coverage"] as const;

export const WARNING_SEVERITIES = ["info", "warning", "critical"] as const;

export const WARNING_CODES = [
  "OVER_TARGET_RATIO",
  "OVER_MAX_RATIO",
  "TRAUMA_WITH_NON_QUALIFIED_NURSE",
  "UNASSIGNED_OCCUPIED_ROOM",
  "ROOM_WITHOUT_COVERAGE",
  "UNKNOWN_NURSE",
  "UNKNOWN_ROOM",
  "ROOM_ASSIGNED_MULTIPLE_TIMES"
] as const;

export const NURSE_TASK_ASSIGNMENT_REASONS = [
  "manual_room_coverage",
  "optimizer_candidate",
  "charge_coverage",
  "float_coverage",
  "unassigned"
] as const;

export const REPORT_TYPES = [
  "operational_summary",
  "nurse_workload",
  "unassigned_tasks",
  "warnings"
] as const;

export const PLAN_ID_MAX_LENGTH = 64;
export const PLAN_NAME_MAX_LENGTH = 160;
export const PLAN_DESCRIPTION_MAX_LENGTH = 500;

export type RoomType = (typeof ROOM_TYPES)[number];
export type ZoneType = (typeof ZONE_TYPES)[number];
export type PathNodeType = (typeof PATH_NODE_TYPES)[number];
export type StationType = (typeof STATION_TYPES)[number];
export type RoomOperationalClass = (typeof ROOM_OPERATIONAL_CLASSES)[number];
export type RoomCapacityCategory = (typeof ROOM_CAPACITY_CATEGORIES)[number];
export type LineOfSightLevel = (typeof LINE_OF_SIGHT_LEVELS)[number];
export type TaskFrequency = (typeof TASK_FREQUENCIES)[number];
export type BurdenLevel = (typeof BURDEN_LEVELS)[number];
export type TurnoverLevel = (typeof TURNOVER_LEVELS)[number];
export type TaskType = (typeof TASK_TYPES)[number];
export type TaskFrequencySource = (typeof TASK_FREQUENCY_SOURCES)[number];
export type TaskTrigger = (typeof TASK_TRIGGERS)[number];
export type TaskBurdenCategory = (typeof TASK_BURDEN_CATEGORIES)[number];
export type NurseRole = (typeof NURSE_ROLES)[number];
export type AssignmentType = (typeof ASSIGNMENT_TYPES)[number];
export type WarningSeverity = (typeof WARNING_SEVERITIES)[number];
export type WarningCode = (typeof WARNING_CODES)[number];
export type NurseTaskAssignmentReason = (typeof NURSE_TASK_ASSIGNMENT_REASONS)[number];
export type ReportType = (typeof REPORT_TYPES)[number];

export type ScaleSettings = {
  unit: "feet";
  pixelsPerUnit: number;
  gridSizeFeet: number;
  snapToGrid: boolean;
  origin: "top-left";
};

export type Point = {
  x: number;
  y: number;
};

export type OperationalMetadataPlaceholder = Record<string, never>;

export type RoomOperationalMetadata = {
  roomNumber?: string | null;
  roomClass: RoomOperationalClass;
  capacityCategory: RoomCapacityCategory;
  traumaAdjacent: boolean;
  isolationReady: boolean;
  behavioralReady: boolean;
  sitterCapable: boolean;
  lineOfSightLevel: LineOfSightLevel;
};

export type Room = {
  id: string;
  label: string;
  roomType: RoomType;
  x: number;
  y: number;
  widthFeet: number;
  lengthFeet: number;
  maxPatients: number;
  traumaCapable: boolean;
  isolationCapable: boolean;
  doorPoint?: Point | null;
  zoneId?: string | null;
  nearestStationId?: string | null;
  pathNodeId?: string | null;
  roomOperationalMetadata?: RoomOperationalMetadata | null;
  overflowOperationalMetadata?: OperationalMetadataPlaceholder | null;
  adjacencyOperationalMetadata?: OperationalMetadataPlaceholder | null;
};

export type Hallway = {
  id: string;
  label: string;
  widthFeet: number;
  points: Point[];
  hallwayOperationalMetadata?: OperationalMetadataPlaceholder | null;
};

export type Door = {
  id: string;
  label: string;
  roomId: string;
  x: number;
  y: number;
  widthFeet: number;
  pathNodeId?: string | null;
  doorOperationalMetadata?: OperationalMetadataPlaceholder | null;
};

export type NurseStation = {
  id: string;
  label: string;
  stationType: StationType;
  x: number;
  y: number;
  widthFeet: number;
  lengthFeet: number;
  pathNodeId: string;
  stationOperationalMetadata?: OperationalMetadataPlaceholder | null;
};

export type Zone = {
  id: string;
  label: string;
  zoneType: ZoneType;
  color: string;
  x: number;
  y: number;
  widthFeet: number;
  lengthFeet: number;
  travelBlocked: boolean;
  travelPenalty?: number | null;
  zoneOperationalMetadata?: OperationalMetadataPlaceholder | null;
};

export type PathNode = {
  id: string;
  nodeType: PathNodeType;
  x: number;
  y: number;
  linkedObjectId?: string | null;
  entryOperationalMetadata?: OperationalMetadataPlaceholder | null;
};

export type PathEdge = {
  id: string;
  fromNodeId: string;
  toNodeId: string;
  lengthFeet: number;
  hallwayWidthFeet: number;
  congestionFactor: number;
  doorPenaltySeconds: number;
  turnPenaltySeconds: number;
  blocked: boolean;
};

export type PlanContract = {
  schemaVersion: "1.0.0";
  planId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  scale: ScaleSettings;
  rooms: Room[];
  hallways: Hallway[];
  doors: Door[];
  nurseStations: NurseStation[];
  zones: Zone[];
  pathNodes: PathNode[];
  pathEdges: PathEdge[];
};

export type PlanBuilderDefaultsContract = {
  schemaVersion: "1.0.0";
  defaultsId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  planSetup: PlanSetupDefaults;
  roomDefaults: RoomGenerationDefaults;
  hallwayDefaults: HallwayGenerationDefaults;
  doorDefaults: DoorGenerationDefaults;
  nurseStationDefaults: NurseStationGenerationDefaults;
  pathGraphDefaults: PathGraphGenerationDefaults;
  zoneDefaults: ZoneGenerationDefaults;
};

export type DoorWall = "top" | "bottom" | "left" | "right";

export type EdgeLengthStrategy = "manhattan" | "straight_line";

export type StationPlacementMode =
  | "near_hallway_start"
  | "centered_on_hallway"
  | "near_hallway_end";

export type PlanSetupDefaults = {
  planName: string;
  planDescription?: string | null;
  pixelsPerFoot: number;
  gridSizeFeet: number;
  snapToGrid: boolean;
  originX: number;
  originY: number;
};

export type RoomGenerationDefaults = {
  roomCount: number;
  roomsPerRow: number;
  defaultRoomWidthFeet: number;
  defaultRoomLengthFeet: number;
  roomSpacingFeet: number;
  roomLabelPrefix: string;
  defaultRoomType: RoomType;
  defaultMaxPatients: number;
  defaultTraumaCapable: boolean;
  defaultIsolationCapable: boolean;
  startX: number;
  startY: number;
};

export type DoorGenerationDefaults = {
  autoCreateDoors: boolean;
  defaultDoorWidthFeet: number;
  doorWall: DoorWall;
  doorOffsetFeet: number;
  doorPenaltySeconds: number;
  autoCreateDoorPathNodes: boolean;
};

export type HallwayGenerationDefaults = {
  defaultHallwayWidthFeet: number;
  mainHallwayLengthFeet: number;
  mainHallwayStartX: number;
  mainHallwayStartY: number;
  congestionFactor: number;
  defaultBlocked: boolean;
};

export type NurseStationGenerationDefaults = {
  nurseStationCount: number;
  defaultStationWidthFeet: number;
  defaultStationLengthFeet: number;
  stationType: StationType;
  stationPlacementMode: StationPlacementMode;
  autoCreateStationPathNodes: boolean;
};

export type PathGraphGenerationDefaults = {
  autoCreatePathEdges: boolean;
  autoConnectRoomsToHallway: boolean;
  defaultEdgeLengthStrategy: EdgeLengthStrategy;
  defaultHallwayEdgeWidthFeet: number;
  defaultCongestionFactor: number;
  defaultTurnPenaltySeconds: number;
  defaultBlocked: boolean;
};

export type ZoneGenerationDefaults = {
  createDefaultZone: boolean;
  defaultZoneLabel: string;
  defaultZoneType: ZoneType;
  defaultZoneTravelBlocked: boolean;
  defaultZoneTravelPenalty?: number | null;
};

export type RoomLoad = {
  roomId: string;
  occupied: boolean;
  acuity: 1 | 2 | 3 | 4 | 5;
  traumaActive: boolean;
  isolationActive: boolean;
  behavioralRisk: boolean;
  fallRisk: boolean;
  sitterRequired: boolean;
  medicationFrequency: TaskFrequency;
  monitoringFrequency: TaskFrequency;
  procedureBurden: BurdenLevel;
  expectedTurnover: TurnoverLevel;
};

export type RoomWorkloadWeights = {
  acuity: {
    "1": number;
    "2": number;
    "3": number;
    "4": number;
    "5": number;
  };
  traumaActive: number;
  isolationActive: number;
  behavioralRisk: number;
  fallRisk: number;
  sitterRequired: number;
  highMedicationFrequency: number;
  highMonitoringFrequency: number;
  highProcedureBurden: number;
};

export type NurseBurdenWeights = {
  roomSpreadPerAdditionalOccupiedRoom: number;
  overTargetPerRoom: number;
  overMaxPerRoom: number;
  traumaMismatchPerRoom: number;
  activeTaskMinutesPlaceholder: number;
  walkingMinutesPlaceholder: number;
  breakCoveragePenaltyPlaceholder: number;
  interruptionPenaltyPlaceholder: number;
};

export type TaskDurationDefaults = {
  medicationTaskMinutes: number;
  monitoringTaskMinutes: number;
  procedureTaskMinutes: number;
  turnoverTaskMinutes: number;
  isolationTaskMinutes: number;
  behavioralRiskTaskMinutes: number;
  sitterTaskMinutes: number;
};

export type TaskFrequencyMappings = {
  none: number;
  low: number;
  medium: number;
  high: number;
  continuous: number;
};

export type SimulationDefaults = {
  defaultShiftLengthMinutes: number;
  defaultTimestepMinutes: number;
  defaultSeed: number;
};

export type AssumptionsRegisterContract = {
  schemaVersion: "1.0.0";
  assumptionsId: string;
  name: string;
  description?: string | null;
  createdAt: string;
  updatedAt: string;
  roomWorkloadWeights: RoomWorkloadWeights;
  nurseBurdenWeights: NurseBurdenWeights;
  taskDurationDefaults: TaskDurationDefaults;
  taskFrequencyMappings: TaskFrequencyMappings;
  simulationDefaults: SimulationDefaults;
};

export type CareTaskTemplate = {
  id: string;
  taskType: TaskType;
  label: string;
  description?: string | null;
  defaultDurationMinutes: number;
  frequencySource: TaskFrequencySource;
  trigger: TaskTrigger;
  burdenCategory: TaskBurdenCategory;
  interruptive: boolean;
  requiresRoomPresence: boolean;
};

export type TaskTemplateContract = {
  schemaVersion: "1.0.0";
  templateSetId: string;
  name: string;
  description?: string | null;
  taskTemplates: CareTaskTemplate[];
};

export type DayProfileSegment = {
  id: string;
  label: string;
  startMinute: number;
  endMinute: number;
  taskVolumeMultiplier: number;
  turnoverMultiplier: number;
  interruptionMultiplier: number;
  walkingCongestionMultiplier: number;
};

export type DayProfileContract = {
  schemaVersion: "1.0.0";
  dayProfileId: string;
  name: string;
  description?: string | null;
  shiftLengthMinutes: number;
  segments: DayProfileSegment[];
};

export type ShiftScenarioContract = {
  schemaVersion: "1.0.0";
  scenarioId: string;
  planId: string;
  assignmentSetId: string;
  assumptionsId: string;
  taskTemplateSetId: string;
  dayProfileId: string;
  name: string;
  description?: string | null;
  shiftLengthMinutes: number;
  timestepMinutes: number;
  seed: number;
  roomLoads: RoomLoad[];
};

export type ScenarioContract = ShiftScenarioContract;

export type BreakWindow = {
  id: string;
  nurseId: string;
  startMinute: number;
  endMinute: number;
  flexible: boolean;
};

export type Nurse = {
  id: string;
  name: string;
  color: string;
  role: NurseRole;
  homeStationId?: string | null;
  traumaQualified: boolean;
  chargeQualified: boolean;
  psychQualified: boolean;
  triageQualified: boolean;
  maxPatients: number;
  targetPatients: number;
  walkingSpeedFeetPerMinute: number;
  shiftStartMinute: number;
  shiftEndMinute: number;
  breakWindows: BreakWindow[];
};

export type Assignment = {
  id: string;
  nurseId: string;
  roomIds: string[];
  assignmentType: AssignmentType;
  startMinute: number;
  endMinute?: number | null;
};

export type ManualAssignmentContract = {
  schemaVersion: "1.0.0";
  assignmentSetId: string;
  planId: string;
  name: string;
  description?: string | null;
  nurses: Nurse[];
  assignments: Assignment[];
};

export type Warning = {
  id: string;
  severity: WarningSeverity;
  code: WarningCode;
  message: string;
  nurseIds?: string[];
  roomIds?: string[];
  taskIds?: string[];
  minute?: number | null;
};

export type RoomWorkloadScore = {
  roomId: string;
  acuityPoints: number;
  traumaPoints: number;
  isolationPoints: number;
  behavioralPoints: number;
  fallRiskPoints: number;
  sitterPoints: number;
  medicationPoints: number;
  monitoringPoints: number;
  procedurePoints: number;
  totalRoomBurden: number;
};

export type ManualAssignmentValidationResult = {
  warnings: Warning[];
  assignedRoomMap: Record<string, string[]>;
  unassignedOccupiedRoomIds: string[];
  perNurseAssignedOccupiedCounts: Record<string, number>;
};

export type NurseBurdenScore = {
  nurseId: string;
  assignedRoomCount: number;
  occupiedRoomCount: number;
  totalAcuityBurden: number;
  totalSpecialBurden: number;
  activeTaskMinutes: number;
  walkingMinutes: number;
  roomSpreadPenalty: number;
  overRatioPenalty: number;
  traumaMismatchPenalty: number;
  breakCoveragePenalty: number;
  interruptionPenalty: number;
  totalBurden: number;
  warnings: Warning[];
};

export type NurseBurdenResult = {
  nurseScores: NurseBurdenScore[];
  warnings: Warning[];
  validation: ManualAssignmentValidationResult;
};

export type GeneratedOperationalTask = {
  id: string;
  taskType: TaskType;
  roomId: string;
  sourceTemplateId: string;
  scheduledMinute: number;
  estimatedDurationMinutes: number;
  burdenCategory: TaskBurdenCategory;
  interruptive: boolean;
  requiresRoomPresence: boolean;
};

export type GeneratedOperationalTaskSetContract = {
  schemaVersion: "1.0.0";
  generatedTaskSetId: string;
  scenarioId: string;
  seed: number;
  taskCount: number;
  generatedTasks: GeneratedOperationalTask[];
};

export type TaskTimelineBucket = {
  minute: number;
  taskIds: string[];
  taskCount: number;
  totalEstimatedDurationMinutes: number;
  interruptiveTaskCount: number;
  roomIds: string[];
  burdenCategories: Record<TaskBurdenCategory, number>;
};

export type TaskTimelineSummary = {
  scenarioId: string;
  generatedTaskSetId: string;
  timestepMinutes: number;
  shiftLengthMinutes: number;
  buckets: TaskTimelineBucket[];
  totalTaskCount: number;
  totalEstimatedDurationMinutes: number;
};

export type NurseTaskAssignment = {
  id: string;
  taskId: string;
  nurseId?: string | null;
  assignmentReason: NurseTaskAssignmentReason;
  minute: number;
};

export type NurseTaskAssignmentContract = {
  schemaVersion: "1.0.0";
  nurseTaskAssignmentSetId: string;
  scenarioId: string;
  assignmentSetId: string;
  generatedTaskSetId: string;
  name: string;
  description?: string | null;
  taskAssignments: NurseTaskAssignment[];
};

export type BasicNurseTaskAssignmentResult = {
  assignmentSet: NurseTaskAssignmentContract;
  warnings: Warning[];
  assignedTaskCount: number;
  unassignedTaskCount: number;
  perNurseTaskCounts: Record<string, number>;
  perNurseEstimatedMinutes: Record<string, number>;
};

export type OperationalReportSummary = {
  totalGeneratedTasks: number;
  assignedTaskCount: number;
  unassignedTaskCount: number;
  totalEstimatedTaskMinutes: number;
  nurseCount: number;
  warningCount: number;
};

export type NurseOperationalSummary = {
  nurseId: string;
  assignedTaskCount: number;
  estimatedTaskMinutes: number;
  warningCount: number;
};

export type ReportTimelineSummary = {
  bucketCount: number;
  busiestMinute: number | null;
  busiestMinuteTaskCount: number;
  totalInterruptiveTasks: number;
};

export type ReportWarningSummary = {
  infoCount: number;
  warningCount: number;
  criticalCount: number;
  warningCodes: Record<string, number>;
};

export type ReportUnassignedTaskSummary = {
  unassignedTaskCount: number;
  taskIds: string[];
  roomIds: string[];
};

export type OperationalReportContract = {
  schemaVersion: "1.0.0";
  reportId: string;
  reportType: ReportType;
  scenarioId: string;
  generatedTaskSetId: string;
  nurseTaskAssignmentSetId: string;
  createdAt: string;
  title: string;
  summary: OperationalReportSummary;
  nurseSummaries: NurseOperationalSummary[];
  timelineSummary: ReportTimelineSummary;
  warningSummary: ReportWarningSummary;
  unassignedTaskSummary: ReportUnassignedTaskSummary;
  limitations: string[];
};

export type OperationalReportValidationContext = {
  scenario?: ShiftScenarioContract;
  generatedTaskSet?: GeneratedOperationalTaskSetContract;
  nurseTaskAssignmentSet?: NurseTaskAssignmentContract;
  manualAssignmentSet?: ManualAssignmentContract;
  warnings?: Warning[];
};

export type ScenarioComparisonItem = {
  reportId: string;
  scenarioId: string;
  label: string;
  isBaseline: boolean;
  totalGeneratedTasks: number;
  assignedTaskCount: number;
  unassignedTaskCount: number;
  totalEstimatedTaskMinutes: number;
  warningCount: number;
  busiestMinute: number | null;
  busiestMinuteTaskCount: number;
};

export type ScenarioComparisonSummary = {
  reportCount: number;
  baselineReportId: string;
  maxGeneratedTasks: number;
  maxAssignedTaskCount: number;
  maxUnassignedTaskCount: number;
  maxEstimatedTaskMinutes: number;
  maxWarningCount: number;
  maxBusiestMinuteTaskCount: number;
};

export type ScenarioComparisonContract = {
  schemaVersion: "1.0.0";
  comparisonId: string;
  comparisonType: "manual_scenario_comparison";
  createdAt: string;
  label: string;
  baselineReportId: string;
  reportIds: string[];
  items: ScenarioComparisonItem[];
  summary: ScenarioComparisonSummary;
  limitations: string[];
};

export type ScenarioComparisonValidationContext = {
  reports?: OperationalReportContract[];
};

export type ReportExportBundleMetadata = {
  appName: string;
  appVersion: string;
  generatedBy: "local-proof";
  source: "synthetic-operational-data";
};

export type ReportExportBundleContract = {
  schemaVersion: "1.0.0";
  exportId: string;
  exportType: "operational_report_bundle";
  createdAt: string;
  label: string;
  reports: OperationalReportContract[];
  comparison?: ScenarioComparisonContract | null;
  limitations: string[];
  metadata: ReportExportBundleMetadata;
};

export type ReportExportBundleImportSummary = {
  exportId: string;
  reportCount: number;
  hasComparison: boolean;
  comparisonId?: string | null;
  scenarioIds: string[];
  reportIds: string[];
  limitations: string[];
};

export type ExportBundleIntegrityContract = {
  schemaVersion: "1.0.0";
  integrityId: string;
  exportId: string;
  createdAt: string;
  algorithm: "sha256";
  canonicalJsonHash: string;
  canonicalJsonLength: number;
  limitations: string[];
};

export type BundleAuditStep = {
  id: string;
  label: string;
  status: "passed" | "failed" | "not_run";
  message: string;
};

export type BundleAuditTrailContract = {
  schemaVersion: "1.0.0";
  auditTrailId: string;
  exportId: string;
  createdAt: string;
  validationStatus: "passed" | "failed";
  integrity: ExportBundleIntegrityContract;
  reviewSteps: BundleAuditStep[];
  warnings: Warning[];
  limitations: string[];
};

type IdSets = {
  roomIds: Set<string>;
  hallwayIds: Set<string>;
  doorIds: Set<string>;
  nurseStationIds: Set<string>;
  zoneIds: Set<string>;
  pathNodeIds: Set<string>;
};

type ReferenceIndex = IdSets & {
  doorsById: Map<string, Door>;
  pathNodesById: Map<string, PathNode>;
};

export function validatePlanContract(value: unknown): PlanContract {
  const plan = requireRecord(value, "plan");
  requireExactKeys(plan, "plan", [
    "schemaVersion",
    "planId",
    "name",
    "description",
    "createdAt",
    "updatedAt",
    "scale",
    "rooms",
    "hallways",
    "doors",
    "nurseStations",
    "zones",
    "pathNodes",
    "pathEdges"
  ]);

  requireLiteral(plan.schemaVersion, "1.0.0", "schemaVersion");
  requireStringMax(plan.planId, "planId", PLAN_ID_MAX_LENGTH);
  validateOperationalRuntimeText(
    requireStringMax(plan.name, "name", PLAN_NAME_MAX_LENGTH),
    "name"
  );
  validateOptionalOperationalRuntimeText(
    requireOptionalStringMax(plan.description, "description", PLAN_DESCRIPTION_MAX_LENGTH),
    "description"
  );
  requireIsoDateTime(plan.createdAt, "createdAt");
  requireIsoDateTime(plan.updatedAt, "updatedAt");
  validateScale(plan.scale);

  const rooms = requireArray(plan.rooms, "rooms").map(validateRoom);
  const hallways = requireArray(plan.hallways, "hallways").map(validateHallway);
  const doors = requireArray(plan.doors, "doors").map(validateDoor);
  const nurseStations = requireArray(plan.nurseStations, "nurseStations").map(
    validateNurseStation
  );
  const zones = requireArray(plan.zones, "zones").map(validateZone);
  const pathNodes = requireArray(plan.pathNodes, "pathNodes").map(validatePathNode);
  const pathEdges = requireArray(plan.pathEdges, "pathEdges").map(validatePathEdge);

  const references: ReferenceIndex = {
    roomIds: requireUnique("room ids", rooms.map((room) => room.id)),
    hallwayIds: requireUnique("hallway ids", hallways.map((hallway) => hallway.id)),
    doorIds: requireUnique("door ids", doors.map((door) => door.id)),
    nurseStationIds: requireUnique(
      "nurse station ids",
      nurseStations.map((station) => station.id)
    ),
    zoneIds: requireUnique("zone ids", zones.map((zone) => zone.id)),
    pathNodeIds: requireUnique("path node ids", pathNodes.map((node) => node.id)),
    doorsById: new Map(doors.map((door) => [door.id, door])),
    pathNodesById: new Map(pathNodes.map((node) => [node.id, node]))
  };
  requireUnique("path edge ids", pathEdges.map((edge) => edge.id));

  rooms.forEach((room, index) => validateRoomReferences(room, index, references));
  doors.forEach((door, index) => validateDoorReferences(door, index, references));
  nurseStations.forEach((station, index) =>
    validateNurseStationReferences(station, index, references)
  );
  pathNodes.forEach((node, index) => validatePathNodeReferences(node, index, references));
  pathEdges.forEach((edge, index) => validatePathEdgeReferences(edge, index, references));

  return plan as PlanContract;
}

export function validatePlanBuilderDefaultsContract(
  value: unknown
): PlanBuilderDefaultsContract {
  const defaults = requireRecord(value, "planBuilderDefaults");
  requireExactKeys(defaults, "planBuilderDefaults", [
    "schemaVersion",
    "defaultsId",
    "name",
    "description",
    "createdAt",
    "updatedAt",
    "planSetup",
    "roomDefaults",
    "hallwayDefaults",
    "doorDefaults",
    "nurseStationDefaults",
    "pathGraphDefaults",
    "zoneDefaults"
  ]);

  requireLiteral(defaults.schemaVersion, "1.0.0", "schemaVersion");
  requireString(defaults.defaultsId, "defaultsId");
  validateOperationalRuntimeText(requireString(defaults.name, "name"), "name");
  validateOptionalOperationalRuntimeText(
    requireOptionalString(defaults.description, "description"),
    "description"
  );
  requireIsoDateTime(defaults.createdAt, "createdAt");
  requireIsoDateTime(defaults.updatedAt, "updatedAt");

  const planSetup = validatePlanSetupDefaults(
    defaults.planSetup,
    "planSetup"
  );
  const roomDefaults = validateRoomGenerationDefaults(
    defaults.roomDefaults,
    "roomDefaults"
  );
  const hallwayDefaults = validateHallwayGenerationDefaults(
    defaults.hallwayDefaults,
    "hallwayDefaults"
  );
  const doorDefaults = validateDoorGenerationDefaults(
    defaults.doorDefaults,
    "doorDefaults",
    roomDefaults
  );
  const nurseStationDefaults = validateNurseStationGenerationDefaults(
    defaults.nurseStationDefaults,
    "nurseStationDefaults"
  );
  const pathGraphDefaults = validatePathGraphGenerationDefaults(
    defaults.pathGraphDefaults,
    "pathGraphDefaults",
    roomDefaults,
    hallwayDefaults,
    doorDefaults
  );
  const zoneDefaults = validateZoneGenerationDefaults(
    defaults.zoneDefaults,
    "zoneDefaults"
  );

  return {
    schemaVersion: "1.0.0",
    defaultsId: defaults.defaultsId,
    name: defaults.name,
    description: defaults.description ?? null,
    createdAt: defaults.createdAt,
    updatedAt: defaults.updatedAt,
    planSetup,
    roomDefaults,
    hallwayDefaults,
    doorDefaults,
    nurseStationDefaults,
    pathGraphDefaults,
    zoneDefaults
  } as PlanBuilderDefaultsContract;
}

export function validateScenarioContract(value: unknown): ScenarioContract {
  return validateShiftScenarioContract(value);
}

function validatePlanSetupDefaults(
  value: unknown,
  label: string
): PlanSetupDefaults {
  const planSetup = requireRecord(value, label);
  requireExactKeys(planSetup, label, [
    "planName",
    "planDescription",
    "pixelsPerFoot",
    "gridSizeFeet",
    "snapToGrid",
    "originX",
    "originY"
  ]);

  const planName = validateOperationalRuntimeText(
    requireString(planSetup.planName, `${label}.planName`),
    `${label}.planName`
  );
  const planDescription = validateOptionalOperationalRuntimeText(
    requireOptionalString(planSetup.planDescription, `${label}.planDescription`),
    `${label}.planDescription`
  );
  const pixelsPerFoot = requirePositiveNumber(planSetup.pixelsPerFoot, `${label}.pixelsPerFoot`);
  const gridSizeFeet = requirePositiveNumber(planSetup.gridSizeFeet, `${label}.gridSizeFeet`);
  const snapToGrid = requireBoolean(planSetup.snapToGrid, `${label}.snapToGrid`);
  const originX = requireNumber(planSetup.originX, `${label}.originX`);
  const originY = requireNumber(planSetup.originY, `${label}.originY`);

  return {
    planName,
    planDescription: planDescription ?? null,
    pixelsPerFoot,
    gridSizeFeet,
    snapToGrid,
    originX,
    originY
  };
}

function validateRoomGenerationDefaults(value: unknown, label: string): RoomGenerationDefaults {
  const roomDefaults = requireRecord(value, label);
  requireExactKeys(roomDefaults, label, [
    "roomCount",
    "roomsPerRow",
    "defaultRoomWidthFeet",
    "defaultRoomLengthFeet",
    "roomSpacingFeet",
    "roomLabelPrefix",
    "defaultRoomType",
    "defaultMaxPatients",
    "defaultTraumaCapable",
    "defaultIsolationCapable",
    "startX",
    "startY"
  ]);

  const roomCount = requirePositiveInteger(roomDefaults.roomCount, `${label}.roomCount`);
  const roomsPerRow = requirePositiveInteger(roomDefaults.roomsPerRow, `${label}.roomsPerRow`);
  if (roomsPerRow > roomCount) {
    throw new Error("roomsPerRow must be less than or equal to roomCount");
  }
  const defaultRoomWidthFeet = requirePositiveNumber(
    roomDefaults.defaultRoomWidthFeet,
    `${label}.defaultRoomWidthFeet`
  );
  const defaultRoomLengthFeet = requirePositiveNumber(
    roomDefaults.defaultRoomLengthFeet,
    `${label}.defaultRoomLengthFeet`
  );
  const roomSpacingFeet = requireNonNegativeNumber(roomDefaults.roomSpacingFeet, `${label}.roomSpacingFeet`);
  const roomLabelPrefix = validateOperationalRuntimeText(
    requireString(roomDefaults.roomLabelPrefix, `${label}.roomLabelPrefix`),
    `${label}.roomLabelPrefix`
  );
  const defaultRoomType = requireEnum(roomDefaults.defaultRoomType, ROOM_TYPES, `${label}.defaultRoomType`);
  const defaultMaxPatients = requirePositiveInteger(
    roomDefaults.defaultMaxPatients,
    `${label}.defaultMaxPatients`
  );
  const defaultTraumaCapable = requireBoolean(roomDefaults.defaultTraumaCapable, `${label}.defaultTraumaCapable`);
  const defaultIsolationCapable = requireBoolean(
    roomDefaults.defaultIsolationCapable,
    `${label}.defaultIsolationCapable`
  );
  const startX = requireNumber(roomDefaults.startX, `${label}.startX`);
  const startY = requireNumber(roomDefaults.startY, `${label}.startY`);

  return {
    roomCount,
    roomsPerRow,
    defaultRoomWidthFeet,
    defaultRoomLengthFeet,
    roomSpacingFeet,
    roomLabelPrefix,
    defaultRoomType,
    defaultMaxPatients,
    defaultTraumaCapable,
    defaultIsolationCapable,
    startX,
    startY
  };
}

function validateHallwayGenerationDefaults(value: unknown, label: string): HallwayGenerationDefaults {
  const hallwayDefaults = requireRecord(value, label);
  requireExactKeys(hallwayDefaults, label, [
    "defaultHallwayWidthFeet",
    "mainHallwayLengthFeet",
    "mainHallwayStartX",
    "mainHallwayStartY",
    "congestionFactor",
    "defaultBlocked"
  ]);

  const defaultHallwayWidthFeet = requirePositiveNumber(
    hallwayDefaults.defaultHallwayWidthFeet,
    `${label}.defaultHallwayWidthFeet`
  );
  const mainHallwayLengthFeet = requirePositiveNumber(
    hallwayDefaults.mainHallwayLengthFeet,
    `${label}.mainHallwayLengthFeet`
  );
  const mainHallwayStartX = requireNumber(hallwayDefaults.mainHallwayStartX, `${label}.mainHallwayStartX`);
  const mainHallwayStartY = requireNumber(hallwayDefaults.mainHallwayStartY, `${label}.mainHallwayStartY`);
  const congestionFactor = requirePositiveNumber(hallwayDefaults.congestionFactor, `${label}.congestionFactor`);
  const defaultBlocked = requireBoolean(hallwayDefaults.defaultBlocked, `${label}.defaultBlocked`);

  return {
    defaultHallwayWidthFeet,
    mainHallwayLengthFeet,
    mainHallwayStartX,
    mainHallwayStartY,
    congestionFactor,
    defaultBlocked
  };
}

function validateDoorGenerationDefaults(
  value: unknown,
  label: string,
  roomDefaults: RoomGenerationDefaults
): DoorGenerationDefaults {
  const doorDefaults = requireRecord(value, label);
  requireExactKeys(doorDefaults, label, [
    "autoCreateDoors",
    "defaultDoorWidthFeet",
    "doorWall",
    "doorOffsetFeet",
    "doorPenaltySeconds",
    "autoCreateDoorPathNodes"
  ]);
  const autoCreateDoors = requireBoolean(doorDefaults.autoCreateDoors, `${label}.autoCreateDoors`);
  const doorWall = requireEnum(doorDefaults.doorWall, ["top", "bottom", "left", "right"], `${label}.doorWall`);
  const defaultDoorWidthFeet = requireNonNegativeNumber(doorDefaults.defaultDoorWidthFeet, `${label}.defaultDoorWidthFeet`);
  if (autoCreateDoors && defaultDoorWidthFeet <= 0) {
    throw new Error("defaultDoorWidthFeet must be positive when autoCreateDoors is true");
  }
  const doorOffsetFeet = requireNonNegativeNumber(doorDefaults.doorOffsetFeet, `${label}.doorOffsetFeet`);
  const wallLength = doorWall === "left" || doorWall === "right"
    ? roomDefaults.defaultRoomLengthFeet
    : roomDefaults.defaultRoomWidthFeet;
  if (autoCreateDoors && doorOffsetFeet > Math.max(0, wallLength - defaultDoorWidthFeet)) {
    throw new Error("doorOffsetFeet would place the door outside the room wall");
  }
  const doorPenaltySeconds = requireNonNegativeNumber(
    doorDefaults.doorPenaltySeconds,
    `${label}.doorPenaltySeconds`
  );
  const autoCreateDoorPathNodes = requireBoolean(doorDefaults.autoCreateDoorPathNodes, `${label}.autoCreateDoorPathNodes`);

  return {
    autoCreateDoors,
    defaultDoorWidthFeet,
    doorWall,
    doorOffsetFeet,
    doorPenaltySeconds,
    autoCreateDoorPathNodes
  };
}

function validateNurseStationGenerationDefaults(value: unknown, label: string): NurseStationGenerationDefaults {
  const stationDefaults = requireRecord(value, label);
  requireExactKeys(stationDefaults, label, [
    "nurseStationCount",
    "defaultStationWidthFeet",
    "defaultStationLengthFeet",
    "stationType",
    "stationPlacementMode",
    "autoCreateStationPathNodes"
  ]);

  const nurseStationCount = requireNonNegativeNumber(
    stationDefaults.nurseStationCount,
    `${label}.nurseStationCount`
  );
  if (!Number.isInteger(nurseStationCount)) {
    throw new Error(`${label}.nurseStationCount must be an integer`);
  }
  const defaultStationWidthFeet = nurseStationCount > 0
    ? requirePositiveNumber(
      stationDefaults.defaultStationWidthFeet,
      `${label}.defaultStationWidthFeet`
    )
    : requireNonNegativeNumber(stationDefaults.defaultStationWidthFeet, `${label}.defaultStationWidthFeet`);
  const defaultStationLengthFeet = nurseStationCount > 0
    ? requirePositiveNumber(
      stationDefaults.defaultStationLengthFeet,
      `${label}.defaultStationLengthFeet`
    )
    : requireNonNegativeNumber(stationDefaults.defaultStationLengthFeet, `${label}.defaultStationLengthFeet`);
  const stationType = requireEnum(stationDefaults.stationType, STATION_TYPES, `${label}.stationType`);
  const stationPlacementMode = requireEnum(
    stationDefaults.stationPlacementMode,
    ["near_hallway_start", "centered_on_hallway", "near_hallway_end"],
    `${label}.stationPlacementMode`
  );
  const autoCreateStationPathNodes = requireBoolean(stationDefaults.autoCreateStationPathNodes, `${label}.autoCreateStationPathNodes`);

  return {
    nurseStationCount: Math.trunc(nurseStationCount),
    defaultStationWidthFeet,
    defaultStationLengthFeet,
    stationType,
    stationPlacementMode,
    autoCreateStationPathNodes
  };
}

function validatePathGraphGenerationDefaults(
  value: unknown,
  label: string,
  roomDefaults: RoomGenerationDefaults,
  hallwayDefaults: HallwayGenerationDefaults,
  doorDefaults: DoorGenerationDefaults
): PathGraphGenerationDefaults {
  const pathGraphDefaults = requireRecord(value, label);
  requireExactKeys(pathGraphDefaults, label, [
    "autoCreatePathEdges",
    "autoConnectRoomsToHallway",
    "defaultEdgeLengthStrategy",
    "defaultHallwayEdgeWidthFeet",
    "defaultCongestionFactor",
    "defaultTurnPenaltySeconds",
    "defaultBlocked"
  ]);

  const autoCreatePathEdges = requireBoolean(pathGraphDefaults.autoCreatePathEdges, `${label}.autoCreatePathEdges`);
  const autoConnectRoomsToHallway = requireBoolean(pathGraphDefaults.autoConnectRoomsToHallway, `${label}.autoConnectRoomsToHallway`);
  const defaultEdgeLengthStrategy = requireEnum(
    pathGraphDefaults.defaultEdgeLengthStrategy,
    ["manhattan", "straight_line"],
    `${label}.defaultEdgeLengthStrategy`
  );
  const defaultHallwayEdgeWidthFeet = autoCreatePathEdges
    ? requirePositiveNumber(
        pathGraphDefaults.defaultHallwayEdgeWidthFeet,
        `${label}.defaultHallwayEdgeWidthFeet`
      )
    : requireNonNegativeNumber(
        pathGraphDefaults.defaultHallwayEdgeWidthFeet,
        `${label}.defaultHallwayEdgeWidthFeet`
      );
  const defaultCongestionFactor = requirePositiveNumber(
    pathGraphDefaults.defaultCongestionFactor,
    `${label}.defaultCongestionFactor`
  );
  const defaultTurnPenaltySeconds = requireNonNegativeNumber(
    pathGraphDefaults.defaultTurnPenaltySeconds,
    `${label}.defaultTurnPenaltySeconds`
  );
  const defaultBlocked = requireBoolean(pathGraphDefaults.defaultBlocked, `${label}.defaultBlocked`);

  if (
    autoCreatePathEdges &&
    autoConnectRoomsToHallway &&
    !doorDefaults.autoCreateDoors &&
    roomDefaults.roomCount > 0
  ) {
    throw new Error(
      "autoConnectRoomsToHallway requires autoCreateDoors or path graph generation must be disabled"
    );
  }
  if (autoCreatePathEdges && hallwayDefaults.mainHallwayLengthFeet <= 0) {
    throw new Error("path graph defaults require a valid hallway length");
  }

  return {
    autoCreatePathEdges,
    autoConnectRoomsToHallway,
    defaultEdgeLengthStrategy,
    defaultHallwayEdgeWidthFeet,
    defaultCongestionFactor,
    defaultTurnPenaltySeconds,
    defaultBlocked
  };
}

function validateZoneGenerationDefaults(value: unknown, label: string): ZoneGenerationDefaults {
  const zoneDefaults = requireRecord(value, label);
  requireExactKeys(zoneDefaults, label, [
    "createDefaultZone",
    "defaultZoneLabel",
    "defaultZoneType",
    "defaultZoneTravelBlocked",
    "defaultZoneTravelPenalty"
  ]);

  const createDefaultZone = requireBoolean(zoneDefaults.createDefaultZone, `${label}.createDefaultZone`);
  const defaultZoneLabel =
    zoneDefaults.defaultZoneLabel == null
      ? ""
      : validateOptionalOperationalRuntimeText(
          requireOptionalString(zoneDefaults.defaultZoneLabel, `${label}.defaultZoneLabel`),
          `${label}.defaultZoneLabel`
        ) ?? "";
  const defaultZoneType = requireEnum(
    zoneDefaults.defaultZoneType,
    ZONE_TYPES,
    `${label}.defaultZoneType`
  );
  const defaultZoneTravelBlocked = requireBoolean(
    zoneDefaults.defaultZoneTravelBlocked,
    `${label}.defaultZoneTravelBlocked`
  );
  const defaultZoneTravelPenalty =
    zoneDefaults.defaultZoneTravelPenalty == null
      ? null
      : requireNonNegativeNumber(zoneDefaults.defaultZoneTravelPenalty, `${label}.defaultZoneTravelPenalty`);

  if (createDefaultZone) {
    requireString(defaultZoneLabel, `${label}.defaultZoneLabel`);
  }

  return {
    createDefaultZone,
    defaultZoneLabel,
    defaultZoneType,
    defaultZoneTravelBlocked,
    defaultZoneTravelPenalty
  };
}

export function validateAssumptionsRegisterContract(
  value: unknown
): AssumptionsRegisterContract {
  const assumptions = requireRecord(value, "assumptions");
  requireExactKeys(assumptions, "assumptions", [
    "schemaVersion",
    "assumptionsId",
    "name",
    "description",
    "createdAt",
    "updatedAt",
    "roomWorkloadWeights",
    "nurseBurdenWeights",
    "taskDurationDefaults",
    "taskFrequencyMappings",
    "simulationDefaults"
  ]);

  requireLiteral(assumptions.schemaVersion, "1.0.0", "schemaVersion");
  requireString(assumptions.assumptionsId, "assumptionsId");
  validateOperationalRuntimeText(requireString(assumptions.name, "name"), "name");
  validateOptionalOperationalRuntimeText(
    requireOptionalString(assumptions.description, "description"),
    "description"
  );
  requireIsoDateTime(assumptions.createdAt, "createdAt");
  requireIsoDateTime(assumptions.updatedAt, "updatedAt");
  validateRoomWorkloadWeights(assumptions.roomWorkloadWeights);
  validateNurseBurdenWeights(assumptions.nurseBurdenWeights);
  validateTaskDurationDefaults(assumptions.taskDurationDefaults);
  validateTaskFrequencyMappings(assumptions.taskFrequencyMappings);
  validateSimulationDefaults(assumptions.simulationDefaults);

  return assumptions as AssumptionsRegisterContract;
}

export function validateTaskTemplateContract(value: unknown): TaskTemplateContract {
  const templateSet = requireRecord(value, "taskTemplateContract");
  requireExactKeys(templateSet, "taskTemplateContract", [
    "schemaVersion",
    "templateSetId",
    "name",
    "description",
    "taskTemplates"
  ]);

  requireLiteral(templateSet.schemaVersion, "1.0.0", "schemaVersion");
  requireString(templateSet.templateSetId, "templateSetId");
  validateOperationalRuntimeText(requireString(templateSet.name, "name"), "name");
  validateOperationalText(templateSet.description, "description");
  const taskTemplates = requireArray(templateSet.taskTemplates, "taskTemplates").map(
    validateCareTaskTemplate
  );
  requireUnique(
    "task template ids",
    taskTemplates.map((template) => template.id)
  );

  return templateSet as TaskTemplateContract;
}

export function validateDayProfileContract(value: unknown): DayProfileContract {
  const dayProfile = requireRecord(value, "dayProfile");
  requireExactKeys(dayProfile, "dayProfile", [
    "schemaVersion",
    "dayProfileId",
    "name",
    "description",
    "shiftLengthMinutes",
    "segments"
  ]);

  requireLiteral(dayProfile.schemaVersion, "1.0.0", "schemaVersion");
  requireString(dayProfile.dayProfileId, "dayProfileId");
  validateOperationalRuntimeText(requireString(dayProfile.name, "name"), "name");
  validateOptionalOperationalRuntimeText(
    requireOptionalString(dayProfile.description, "description"),
    "description"
  );
  const shiftLengthMinutes = requirePositiveInteger(
    dayProfile.shiftLengthMinutes,
    "shiftLengthMinutes"
  );
  const segments = requireArray(dayProfile.segments, "segments").map((segment, index) =>
    validateDayProfileSegment(segment, index, shiftLengthMinutes)
  );
  if (segments.length === 0) {
    throw new Error("segments requires at least one segment");
  }
  requireUnique(
    "day profile segment ids",
    segments.map((segment) => segment.id)
  );
  validateFullShiftSegmentCoverage(segments, shiftLengthMinutes);

  return dayProfile as DayProfileContract;
}

export type ShiftScenarioReferences = {
  plan?: PlanContract;
  assignmentSet?: ManualAssignmentContract;
  assumptions?: AssumptionsRegisterContract;
  taskTemplates?: TaskTemplateContract;
  dayProfile?: DayProfileContract;
};

export function validateShiftScenarioContract(
  value: unknown,
  references: ShiftScenarioReferences = {}
): ShiftScenarioContract {
  const scenario = requireRecord(value, "scenario");
  requireExactKeys(scenario, "scenario", [
    "schemaVersion",
    "scenarioId",
    "planId",
    "assignmentSetId",
    "assumptionsId",
    "taskTemplateSetId",
    "dayProfileId",
    "name",
    "description",
    "shiftLengthMinutes",
    "timestepMinutes",
    "seed",
    "roomLoads"
  ]);

  requireLiteral(scenario.schemaVersion, "1.0.0", "schemaVersion");
  requireString(scenario.scenarioId, "scenarioId");
  requireString(scenario.planId, "planId");
  requireString(scenario.assignmentSetId, "assignmentSetId");
  requireString(scenario.assumptionsId, "assumptionsId");
  requireString(scenario.taskTemplateSetId, "taskTemplateSetId");
  requireString(scenario.dayProfileId, "dayProfileId");
  validateOperationalRuntimeText(requireString(scenario.name, "name"), "name");
  validateOptionalOperationalRuntimeText(
    requireOptionalString(scenario.description, "description"),
    "description"
  );
  const shiftLengthMinutes = requirePositiveInteger(
    scenario.shiftLengthMinutes,
    "shiftLengthMinutes"
  );
  const timestepMinutes = requirePositiveInteger(scenario.timestepMinutes, "timestepMinutes");
  requireSafeInteger(scenario.seed, "seed", 0);

  if (shiftLengthMinutes % timestepMinutes !== 0) {
    throw new Error("shiftLengthMinutes must divide evenly by timestepMinutes");
  }

  if (references.plan != null && scenario.planId !== references.plan.planId) {
    throw new Error("scenario.planId must match the referenced plan");
  }
  if (
    references.assignmentSet != null &&
    scenario.assignmentSetId !== references.assignmentSet.assignmentSetId
  ) {
    throw new Error("scenario.assignmentSetId must match the referenced assignment set");
  }
  if (
    references.assumptions != null &&
    scenario.assumptionsId !== references.assumptions.assumptionsId
  ) {
    throw new Error("scenario.assumptionsId must match the referenced assumptions register");
  }
  if (
    references.taskTemplates != null &&
    scenario.taskTemplateSetId !== references.taskTemplates.templateSetId
  ) {
    throw new Error("scenario.taskTemplateSetId must match the referenced task template set");
  }
  if (
    references.dayProfile != null &&
    scenario.dayProfileId !== references.dayProfile.dayProfileId
  ) {
    throw new Error("scenario.dayProfileId must match the referenced day profile");
  }
  if (
    references.dayProfile != null &&
    scenario.shiftLengthMinutes !== references.dayProfile.shiftLengthMinutes
  ) {
    throw new Error("scenario.shiftLengthMinutes must match the referenced day profile");
  }

  validateRoomLoads(scenario.roomLoads, references.plan);

  return scenario as ShiftScenarioContract;
}

export function validateGeneratedOperationalTask(
  value: unknown,
  scenario?: ShiftScenarioContract,
  taskTemplates?: TaskTemplateContract,
  plan?: PlanContract
): GeneratedOperationalTask {
  return validateGeneratedOperationalTaskAt(value, 0, scenario, taskTemplates, plan);
}

export function validateGeneratedOperationalTasks(
  value: unknown,
  scenario?: ShiftScenarioContract,
  taskTemplates?: TaskTemplateContract,
  plan?: PlanContract
): GeneratedOperationalTask[] {
  const tasks = requireArray(value, "generatedOperationalTasks").map((task, index) =>
    validateGeneratedOperationalTaskAt(task, index, scenario, taskTemplates, plan)
  );
  requireUnique(
    "generated operational task ids",
    tasks.map((task) => task.id)
  );
  return tasks;
}

export function validateGeneratedOperationalTaskSet(
  value: unknown,
  scenario?: ShiftScenarioContract,
  taskTemplates?: TaskTemplateContract,
  plan?: PlanContract
): GeneratedOperationalTaskSetContract {
  const taskSet = requireRecord(value, "generatedOperationalTaskSet");
  requireExactKeys(taskSet, "generatedOperationalTaskSet", [
    "schemaVersion",
    "generatedTaskSetId",
    "scenarioId",
    "seed",
    "taskCount",
    "generatedTasks"
  ]);

  requireLiteral(taskSet.schemaVersion, "1.0.0", "schemaVersion");
  requireString(taskSet.generatedTaskSetId, "generatedTaskSetId");
  const scenarioId = requireString(taskSet.scenarioId, "scenarioId");
  const seed = requireSafeInteger(taskSet.seed, "seed", 0);
  const taskCount = requireInteger(taskSet.taskCount, "taskCount", 0);

  if (scenario != null) {
    if (scenarioId !== scenario.scenarioId) {
      throw new Error("generatedOperationalTaskSet.scenarioId must match the referenced scenario");
    }
    if (seed !== scenario.seed) {
      throw new Error("generatedOperationalTaskSet.seed must match the referenced scenario seed");
    }
  }

  const generatedTasks = validateGeneratedOperationalTasks(
    taskSet.generatedTasks,
    scenario,
    taskTemplates,
    plan
  );
  if (taskCount !== generatedTasks.length) {
    throw new Error("generatedOperationalTaskSet.taskCount must equal generatedTasks.length");
  }

  return taskSet as GeneratedOperationalTaskSetContract;
}

export function validateRoomLoads(value: unknown, plan?: PlanContract): RoomLoad[] {
  const roomLoads = requireArray(value, "roomLoads").map(validateRoomLoad);
  requireUnique(
    "room load ids",
    roomLoads.map((roomLoad) => roomLoad.roomId)
  );

  if (plan != null) {
    const roomIds = new Set(plan.rooms.map((room) => room.id));
    roomLoads.forEach((roomLoad, index) => {
      if (!roomIds.has(roomLoad.roomId)) {
        throw new Error(`roomLoads[${index}].roomId references an unknown room`);
      }
    });
  }

  return roomLoads;
}

export function validateManualAssignmentContract(
  value: unknown,
  plan?: PlanContract
): ManualAssignmentContract {
  const assignmentSet = requireRecord(value, "manualAssignment");
  requireExactKeys(assignmentSet, "manualAssignment", [
    "schemaVersion",
    "assignmentSetId",
    "planId",
    "name",
    "description",
    "nurses",
    "assignments"
  ]);

  requireLiteral(assignmentSet.schemaVersion, "1.0.0", "schemaVersion");
  requireString(assignmentSet.assignmentSetId, "assignmentSetId");
  requireString(assignmentSet.planId, "planId");
  validateOperationalRuntimeText(requireString(assignmentSet.name, "name"), "name");
  validateOptionalOperationalRuntimeText(
    requireOptionalString(assignmentSet.description, "description"),
    "description"
  );

  if (plan != null && assignmentSet.planId !== plan.planId) {
    throw new Error("manualAssignment.planId must match the referenced plan");
  }

  const nurses = requireArray(assignmentSet.nurses, "nurses").map(validateNurse);
  const assignments = requireArray(assignmentSet.assignments, "assignments").map(
    validateAssignment
  );

  const nurseIds = requireUnique(
    "nurse ids",
    nurses.map((nurse) => nurse.id)
  );
  requireUnique(
    "assignment ids",
    assignments.map((assignment) => assignment.id)
  );

  const breakWindowIds = nurses.flatMap((nurse) =>
    nurse.breakWindows.map((breakWindow) => breakWindow.id)
  );
  requireUnique("break window ids", breakWindowIds);

  assignments.forEach((assignment, index) => {
    if (!nurseIds.has(assignment.nurseId)) {
      throw new Error(`assignments[${index}].nurseId references an unknown nurse`);
    }
  });

  const assignedRoomIds = assignments.flatMap((assignment) => assignment.roomIds);
  requireUnique("assigned room ids", assignedRoomIds);

  if (plan != null) {
    const roomIds = new Set(plan.rooms.map((room) => room.id));
    assignments.forEach((assignment, assignmentIndex) => {
      assignment.roomIds.forEach((roomId, roomIndex) => {
        if (!roomIds.has(roomId)) {
          throw new Error(
            `assignments[${assignmentIndex}].roomIds[${roomIndex}] references an unknown room`
          );
        }
      });
    });
  }

  return assignmentSet as ManualAssignmentContract;
}

export function validateNurseTaskAssignmentContract(
  value: unknown,
  scenario?: ShiftScenarioContract,
  assignmentSet?: ManualAssignmentContract,
  generatedTaskSet?: GeneratedOperationalTaskSetContract
): NurseTaskAssignmentContract {
  const contract = requireRecord(value, "nurseTaskAssignment");
  requireExactKeys(contract, "nurseTaskAssignment", [
    "schemaVersion",
    "nurseTaskAssignmentSetId",
    "scenarioId",
    "assignmentSetId",
    "generatedTaskSetId",
    "name",
    "description",
    "taskAssignments"
  ]);

  requireLiteral(contract.schemaVersion, "1.0.0", "schemaVersion");
  requireString(contract.nurseTaskAssignmentSetId, "nurseTaskAssignmentSetId");
  const scenarioId = requireString(contract.scenarioId, "scenarioId");
  const assignmentSetId = requireString(contract.assignmentSetId, "assignmentSetId");
  const generatedTaskSetId = requireString(contract.generatedTaskSetId, "generatedTaskSetId");
  validateOperationalRuntimeText(requireString(contract.name, "name"), "name");
  validateOptionalOperationalRuntimeText(
    requireOptionalString(contract.description, "description"),
    "description"
  );

  if (scenario != null && scenarioId !== scenario.scenarioId) {
    throw new Error("nurseTaskAssignment.scenarioId must match the referenced scenario");
  }
  if (assignmentSet != null && assignmentSetId !== assignmentSet.assignmentSetId) {
    throw new Error("nurseTaskAssignment.assignmentSetId must match the referenced assignment set");
  }
  if (generatedTaskSet != null && generatedTaskSetId !== generatedTaskSet.generatedTaskSetId) {
    throw new Error(
      "nurseTaskAssignment.generatedTaskSetId must match the referenced generated task set"
    );
  }
  if (generatedTaskSet != null && scenarioId !== generatedTaskSet.scenarioId) {
    throw new Error(
      "nurseTaskAssignment.scenarioId must match the referenced generated task set scenarioId"
    );
  }

  const taskAssignments = requireArray(contract.taskAssignments, "taskAssignments").map(
    validateNurseTaskAssignment
  );
  requireUnique(
    "nurse task assignment ids",
    taskAssignments.map((assignment) => assignment.id)
  );
  requireUnique(
    "nurse task assignment task ids",
    taskAssignments.map((assignment) => assignment.taskId)
  );

  const nurseIds = new Set(assignmentSet?.nurses.map((nurse) => nurse.id) ?? []);
  const generatedTaskById = new Map(
    generatedTaskSet?.generatedTasks.map((task) => [task.id, task]) ?? []
  );

  taskAssignments.forEach((assignment, index) => {
    if (assignment.assignmentReason === "unassigned") {
      if (assignment.nurseId != null) {
        throw new Error(`taskAssignments[${index}].nurseId must be null or absent when unassigned`);
      }
    } else {
      if (assignment.nurseId == null) {
        throw new Error(`taskAssignments[${index}].nurseId is required unless unassigned`);
      }
      if (assignmentSet != null && !nurseIds.has(assignment.nurseId)) {
        throw new Error(`taskAssignments[${index}].nurseId references an unknown nurse`);
      }
    }

    if (generatedTaskSet != null) {
      const generatedTask = generatedTaskById.get(assignment.taskId);
      if (generatedTask == null) {
        throw new Error(`taskAssignments[${index}].taskId references an unknown generated task`);
      }
      if (assignment.minute !== generatedTask.scheduledMinute) {
        throw new Error(
          `taskAssignments[${index}].minute must match the generated task scheduledMinute`
        );
      }
    }
  });

  return contract as NurseTaskAssignmentContract;
}

export function validateOperationalReportContract(
  value: unknown,
  context: OperationalReportValidationContext = {}
): OperationalReportContract {
  const report = requireRecord(value, "operationalReport");
  requireExactKeys(report, "operationalReport", [
    "schemaVersion",
    "reportId",
    "reportType",
    "scenarioId",
    "generatedTaskSetId",
    "nurseTaskAssignmentSetId",
    "createdAt",
    "title",
    "summary",
    "nurseSummaries",
    "timelineSummary",
    "warningSummary",
    "unassignedTaskSummary",
    "limitations"
  ]);

  requireLiteral(report.schemaVersion, "1.0.0", "schemaVersion");
  requireString(report.reportId, "reportId");
  requireEnum(report.reportType, REPORT_TYPES, "reportType");
  requireString(report.scenarioId, "scenarioId");
  requireString(report.generatedTaskSetId, "generatedTaskSetId");
  requireString(report.nurseTaskAssignmentSetId, "nurseTaskAssignmentSetId");
  requireIsoDateTime(report.createdAt, "createdAt");
  validateReportText(report.title, "title");

  const summary = validateOperationalReportSummary(report.summary);
  const nurseSummaries = requireArray(report.nurseSummaries, "nurseSummaries").map(
    validateNurseOperationalSummary
  );
  requireUnique(
    "report nurse summary ids",
    nurseSummaries.map((nurseSummary) => nurseSummary.nurseId)
  );
  const timelineSummary = validateReportTimelineSummary(report.timelineSummary);
  const warningSummary = validateReportWarningSummary(report.warningSummary);
  const unassignedTaskSummary = validateReportUnassignedTaskSummary(
    report.unassignedTaskSummary
  );
  const limitations = requireArray(report.limitations, "limitations").map((limitation, index) =>
    validateReportText(limitation, `limitations[${index}]`)
  );
  validateRequiredReportLimitations(limitations);

  if (summary.assignedTaskCount + summary.unassignedTaskCount !== summary.totalGeneratedTasks) {
    throw new Error(
      "summary.assignedTaskCount plus summary.unassignedTaskCount must equal totalGeneratedTasks"
    );
  }
  if (summary.nurseCount !== nurseSummaries.length) {
    throw new Error("summary.nurseCount must equal nurseSummaries.length");
  }
  if (summary.warningCount !== warningSummary.infoCount + warningSummary.warningCount + warningSummary.criticalCount) {
    throw new Error("summary.warningCount must equal warning severity counts");
  }
  if (summary.unassignedTaskCount !== unassignedTaskSummary.unassignedTaskCount) {
    throw new Error("summary.unassignedTaskCount must equal unassignedTaskSummary.unassignedTaskCount");
  }
  if (timelineSummary.busiestMinute == null && timelineSummary.busiestMinuteTaskCount !== 0) {
    throw new Error("timelineSummary.busiestMinuteTaskCount must be 0 when busiestMinute is null");
  }

  validateOperationalReportReferences(
    report as OperationalReportContract,
    {
      summary,
      nurseSummaries,
      timelineSummary,
      warningSummary,
      unassignedTaskSummary
    },
    context
  );

  return report as OperationalReportContract;
}

export function validateScenarioComparisonContract(
  value: unknown,
  context: ScenarioComparisonValidationContext = {}
): ScenarioComparisonContract {
  const comparison = requireRecord(value, "scenarioComparison");
  requireExactKeys(comparison, "scenarioComparison", [
    "schemaVersion",
    "comparisonId",
    "comparisonType",
    "createdAt",
    "label",
    "baselineReportId",
    "reportIds",
    "items",
    "summary",
    "limitations"
  ]);

  requireLiteral(comparison.schemaVersion, "1.0.0", "schemaVersion");
  requireString(comparison.comparisonId, "comparisonId");
  requireLiteral(
    comparison.comparisonType,
    "manual_scenario_comparison",
    "comparisonType"
  );
  requireIsoDateTime(comparison.createdAt, "createdAt");
  validateReportText(comparison.label, "label");
  const baselineReportId = requireString(comparison.baselineReportId, "baselineReportId");
  const reportIds = requireArray(comparison.reportIds, "reportIds").map((reportId, index) =>
    requireString(reportId, `reportIds[${index}]`)
  );
  if (reportIds.length === 0) {
    throw new Error("reportIds requires at least one report");
  }
  requireUnique("comparison report ids", reportIds);
  if (reportIds[0] !== baselineReportId) {
    throw new Error("reportIds must list the baseline report first");
  }
  if (!reportIds.includes(baselineReportId)) {
    throw new Error("baselineReportId must reference a comparison report");
  }

  const items = requireArray(comparison.items, "items").map(validateScenarioComparisonItem);
  if (items.length === 0) {
    throw new Error("items requires at least one comparison item");
  }
  const itemReportIds = items.map((item) => item.reportId);
  requireUnique("comparison item report ids", itemReportIds);
  if (!sameStringArray(itemReportIds, reportIds)) {
    throw new Error("items must match reportIds in deterministic order");
  }
  if (items[0]?.reportId !== baselineReportId || items[0].isBaseline !== true) {
    throw new Error("items must list the baseline report first");
  }
  for (const item of items) {
    if (item.isBaseline !== (item.reportId === baselineReportId)) {
      throw new Error("comparison item baseline flags must match baselineReportId");
    }
  }

  const summary = validateScenarioComparisonSummary(comparison.summary);
  const limitations = requireArray(comparison.limitations, "limitations").map(
    (limitation, index) => validateReportText(limitation, `limitations[${index}]`)
  );
  validateRequiredComparisonLimitations(limitations);
  validateScenarioComparisonSummaryValues(summary, baselineReportId, items);

  if (context.reports != null) {
    validateScenarioComparisonAgainstReports(
      comparison as ScenarioComparisonContract,
      items,
      context.reports
    );
  }

  return comparison as ScenarioComparisonContract;
}

export function validateReportExportBundleContract(
  value: unknown
): ReportExportBundleContract {
  const bundle = requireRecord(value, "reportExportBundle");
  requireExactKeys(bundle, "reportExportBundle", [
    "schemaVersion",
    "exportId",
    "exportType",
    "createdAt",
    "label",
    "reports",
    "comparison",
    "limitations",
    "metadata"
  ]);

  requireLiteral(bundle.schemaVersion, "1.0.0", "schemaVersion");
  requireString(bundle.exportId, "exportId");
  requireLiteral(bundle.exportType, "operational_report_bundle", "exportType");
  requireIsoDateTime(bundle.createdAt, "createdAt");
  validateReportText(bundle.label, "label");

  const reports = requireArray(bundle.reports, "reports").map((report) =>
    validateOperationalReportContract(report)
  );
  if (reports.length === 0) {
    throw new Error("reports requires at least one operational report");
  }
  requireUnique(
    "export bundle report ids",
    reports.map((report) => report.reportId)
  );

  let comparison: ScenarioComparisonContract | null = null;
  if (bundle.comparison != null) {
    comparison = validateScenarioComparisonContract(bundle.comparison, { reports });
  }

  const limitations = requireArray(bundle.limitations, "limitations").map(
    (limitation, index) => validateReportText(limitation, `limitations[${index}]`)
  );
  validateRequiredExportBundleLimitations(limitations);
  validateReportExportBundleMetadata(bundle.metadata);

  return {
    ...(bundle as ReportExportBundleContract),
    reports,
    comparison,
    limitations,
    metadata: bundle.metadata as ReportExportBundleMetadata
  };
}

export function validateBundleAuditTrailContract(
  value: unknown
): BundleAuditTrailContract {
  const auditTrail = requireRecord(value, "bundleAuditTrail");
  requireExactKeys(auditTrail, "bundleAuditTrail", [
    "schemaVersion",
    "auditTrailId",
    "exportId",
    "createdAt",
    "validationStatus",
    "integrity",
    "reviewSteps",
    "warnings",
    "limitations"
  ]);

  requireLiteral(auditTrail.schemaVersion, "1.0.0", "schemaVersion");
  requireString(auditTrail.auditTrailId, "auditTrailId");
  const exportId = requireString(auditTrail.exportId, "exportId");
  requireIsoDateTime(auditTrail.createdAt, "createdAt");
  const validationStatus = requireEnum(
    auditTrail.validationStatus,
    ["passed", "failed"] as const,
    "validationStatus"
  );
  const integrity = validateExportBundleIntegrityShape(auditTrail.integrity, "integrity");
  if (integrity.exportId !== exportId) {
    throw new Error("exportId must match integrity.exportId");
  }

  const reviewSteps = requireArray(auditTrail.reviewSteps, "reviewSteps").map(
    validateBundleAuditStep
  );
  if (reviewSteps.length === 0) {
    throw new Error("reviewSteps requires at least one step");
  }
  requireUnique(
    "bundle audit step ids",
    reviewSteps.map((step) => step.id)
  );
  const hasFailedStep = reviewSteps.some((step) => step.status === "failed");
  if ((validationStatus === "failed") !== hasFailedStep) {
    throw new Error("validationStatus must reflect failed review steps");
  }

  const warnings = requireArray(auditTrail.warnings, "warnings").map(validateWarning);
  requireUnique(
    "bundle audit warning ids",
    warnings.map((warning) => warning.id)
  );
  const limitations = requireArray(auditTrail.limitations, "limitations").map(
    (limitation, index) => validateProofLimitationText(limitation, `limitations[${index}]`)
  );
  validateRequiredAuditTrailLimitations(limitations);

  return {
    ...(auditTrail as BundleAuditTrailContract),
    integrity,
    reviewSteps,
    warnings,
    limitations
  };
}

function validateExportBundleIntegrityShape(
  value: unknown,
  label: string
): ExportBundleIntegrityContract {
  const integrity = requireRecord(value, label);
  requireExactKeys(integrity, label, [
    "schemaVersion",
    "integrityId",
    "exportId",
    "createdAt",
    "algorithm",
    "canonicalJsonHash",
    "canonicalJsonLength",
    "limitations"
  ]);

  requireLiteral(integrity.schemaVersion, "1.0.0", `${label}.schemaVersion`);
  requireString(integrity.integrityId, `${label}.integrityId`);
  requireString(integrity.exportId, `${label}.exportId`);
  requireIsoDateTime(integrity.createdAt, `${label}.createdAt`);
  requireLiteral(integrity.algorithm, "sha256", `${label}.algorithm`);
  const hash = requireString(integrity.canonicalJsonHash, `${label}.canonicalJsonHash`);
  if (!/^[0-9a-f]{64}$/.test(hash)) {
    throw new Error(`${label}.canonicalJsonHash must be lowercase sha256 hex`);
  }
  requireInteger(integrity.canonicalJsonLength, `${label}.canonicalJsonLength`, 0);
  const limitations = requireArray(integrity.limitations, `${label}.limitations`).map(
    (limitation, index) =>
      validateProofLimitationText(limitation, `${label}.limitations[${index}]`)
  );
  validateRequiredIntegrityLimitations(limitations);

  return {
    ...(integrity as ExportBundleIntegrityContract),
    limitations
  };
}

function validateBundleAuditStep(value: unknown, index: number): BundleAuditStep {
  const step = requireRecord(value, `reviewSteps[${index}]`);
  requireExactKeys(step, `reviewSteps[${index}]`, ["id", "label", "status", "message"]);
  requireString(step.id, `reviewSteps[${index}].id`);
  validateProofLimitationText(step.label, `reviewSteps[${index}].label`);
  requireEnum(
    step.status,
    ["passed", "failed", "not_run"] as const,
    `reviewSteps[${index}].status`
  );
  validateProofLimitationText(step.message, `reviewSteps[${index}].message`);
  return step as BundleAuditStep;
}

function validateWarning(value: unknown, index: number): Warning {
  const warning = requireRecord(value, `warnings[${index}]`);
  requireExactKeys(warning, `warnings[${index}]`, [
    "id",
    "severity",
    "code",
    "message",
    "nurseIds",
    "roomIds",
    "taskIds",
    "minute"
  ]);
  requireString(warning.id, `warnings[${index}].id`);
  requireEnum(warning.severity, WARNING_SEVERITIES, `warnings[${index}].severity`);
  requireEnum(warning.code, WARNING_CODES, `warnings[${index}].code`);
  validateProofLimitationText(warning.message, `warnings[${index}].message`);
  validateOptionalStringArray(warning.nurseIds, `warnings[${index}].nurseIds`);
  validateOptionalStringArray(warning.roomIds, `warnings[${index}].roomIds`);
  validateOptionalStringArray(warning.taskIds, `warnings[${index}].taskIds`);
  if (warning.minute != null) {
    requireInteger(warning.minute, `warnings[${index}].minute`, 0);
  }
  return warning as Warning;
}

function validateOptionalStringArray(value: unknown, label: string): void {
  if (value == null) {
    return;
  }
  const values = requireArray(value, label).map((item, index) =>
    requireString(item, `${label}[${index}]`)
  );
  requireUnique(label, values);
}

function validateScenarioComparisonItem(
  value: unknown,
  index: number
): ScenarioComparisonItem {
  const item = requireRecord(value, `items[${index}]`);
  requireExactKeys(item, `items[${index}]`, [
    "reportId",
    "scenarioId",
    "label",
    "isBaseline",
    "totalGeneratedTasks",
    "assignedTaskCount",
    "unassignedTaskCount",
    "totalEstimatedTaskMinutes",
    "warningCount",
    "busiestMinute",
    "busiestMinuteTaskCount"
  ]);

  requireString(item.reportId, `items[${index}].reportId`);
  requireString(item.scenarioId, `items[${index}].scenarioId`);
  validateReportText(item.label, `items[${index}].label`);
  requireBoolean(item.isBaseline, `items[${index}].isBaseline`);
  const totalGeneratedTasks = requireInteger(
    item.totalGeneratedTasks,
    `items[${index}].totalGeneratedTasks`,
    0
  );
  const assignedTaskCount = requireInteger(
    item.assignedTaskCount,
    `items[${index}].assignedTaskCount`,
    0
  );
  const unassignedTaskCount = requireInteger(
    item.unassignedTaskCount,
    `items[${index}].unassignedTaskCount`,
    0
  );
  requireNonNegativeNumber(
    item.totalEstimatedTaskMinutes,
    `items[${index}].totalEstimatedTaskMinutes`
  );
  requireInteger(item.warningCount, `items[${index}].warningCount`, 0);
  const busiestMinute =
    item.busiestMinute == null
      ? null
      : requireInteger(item.busiestMinute, `items[${index}].busiestMinute`, 0);
  const busiestMinuteTaskCount = requireInteger(
    item.busiestMinuteTaskCount,
    `items[${index}].busiestMinuteTaskCount`,
    0
  );
  if (busiestMinute == null && busiestMinuteTaskCount !== 0) {
    throw new Error(
      `items[${index}].busiestMinuteTaskCount must be 0 when busiestMinute is null`
    );
  }
  if (assignedTaskCount + unassignedTaskCount !== totalGeneratedTasks) {
    throw new Error(
      `items[${index}].assignedTaskCount plus unassignedTaskCount must equal totalGeneratedTasks`
    );
  }
  return item as ScenarioComparisonItem;
}

function validateScenarioComparisonSummary(value: unknown): ScenarioComparisonSummary {
  const summary = requireRecord(value, "summary");
  requireExactKeys(summary, "summary", [
    "reportCount",
    "baselineReportId",
    "maxGeneratedTasks",
    "maxAssignedTaskCount",
    "maxUnassignedTaskCount",
    "maxEstimatedTaskMinutes",
    "maxWarningCount",
    "maxBusiestMinuteTaskCount"
  ]);
  requireInteger(summary.reportCount, "summary.reportCount", 1);
  requireString(summary.baselineReportId, "summary.baselineReportId");
  requireInteger(summary.maxGeneratedTasks, "summary.maxGeneratedTasks", 0);
  requireInteger(summary.maxAssignedTaskCount, "summary.maxAssignedTaskCount", 0);
  requireInteger(summary.maxUnassignedTaskCount, "summary.maxUnassignedTaskCount", 0);
  requireNonNegativeNumber(summary.maxEstimatedTaskMinutes, "summary.maxEstimatedTaskMinutes");
  requireInteger(summary.maxWarningCount, "summary.maxWarningCount", 0);
  requireInteger(
    summary.maxBusiestMinuteTaskCount,
    "summary.maxBusiestMinuteTaskCount",
    0
  );
  return summary as ScenarioComparisonSummary;
}

function validateScenarioComparisonSummaryValues(
  summary: ScenarioComparisonSummary,
  baselineReportId: string,
  items: ScenarioComparisonItem[]
): void {
  if (summary.reportCount !== items.length) {
    throw new Error("summary.reportCount must equal items.length");
  }
  if (summary.baselineReportId !== baselineReportId) {
    throw new Error("summary.baselineReportId must match baselineReportId");
  }
  const expected = summarizeScenarioComparisonItems(items);
  if (summary.maxGeneratedTasks !== expected.maxGeneratedTasks) {
    throw new Error("summary.maxGeneratedTasks must match comparison items");
  }
  if (summary.maxAssignedTaskCount !== expected.maxAssignedTaskCount) {
    throw new Error("summary.maxAssignedTaskCount must match comparison items");
  }
  if (summary.maxUnassignedTaskCount !== expected.maxUnassignedTaskCount) {
    throw new Error("summary.maxUnassignedTaskCount must match comparison items");
  }
  if (summary.maxEstimatedTaskMinutes !== expected.maxEstimatedTaskMinutes) {
    throw new Error("summary.maxEstimatedTaskMinutes must match comparison items");
  }
  if (summary.maxWarningCount !== expected.maxWarningCount) {
    throw new Error("summary.maxWarningCount must match comparison items");
  }
  if (summary.maxBusiestMinuteTaskCount !== expected.maxBusiestMinuteTaskCount) {
    throw new Error("summary.maxBusiestMinuteTaskCount must match comparison items");
  }
}

function validateScenarioComparisonAgainstReports(
  comparison: ScenarioComparisonContract,
  items: ScenarioComparisonItem[],
  reports: OperationalReportContract[]
): void {
  const reportById = new Map(
    reports.map((report) => [report.reportId, validateOperationalReportContract(report)])
  );
  for (const reportId of comparison.reportIds) {
    if (!reportById.has(reportId)) {
      throw new Error("scenario comparison reportIds must reference included reports");
    }
  }
  for (const item of items) {
    const report = reportById.get(item.reportId);
    if (report == null) {
      throw new Error("scenario comparison items must reference included reports");
    }
    if (item.scenarioId !== report.scenarioId) {
      throw new Error("scenario comparison item scenarioId must match report");
    }
    if (item.label !== report.title) {
      throw new Error("scenario comparison item label must match report title");
    }
    if (item.totalGeneratedTasks !== report.summary.totalGeneratedTasks) {
      throw new Error("scenario comparison totalGeneratedTasks must match report");
    }
    if (item.assignedTaskCount !== report.summary.assignedTaskCount) {
      throw new Error("scenario comparison assignedTaskCount must match report");
    }
    if (item.unassignedTaskCount !== report.summary.unassignedTaskCount) {
      throw new Error("scenario comparison unassignedTaskCount must match report");
    }
    if (item.totalEstimatedTaskMinutes !== report.summary.totalEstimatedTaskMinutes) {
      throw new Error("scenario comparison totalEstimatedTaskMinutes must match report");
    }
    if (item.warningCount !== report.summary.warningCount) {
      throw new Error("scenario comparison warningCount must match report");
    }
    if (item.busiestMinute !== report.timelineSummary.busiestMinute) {
      throw new Error("scenario comparison busiestMinute must match report");
    }
    if (item.busiestMinuteTaskCount !== report.timelineSummary.busiestMinuteTaskCount) {
      throw new Error("scenario comparison busiestMinuteTaskCount must match report");
    }
  }
}

function summarizeScenarioComparisonItems(
  items: ScenarioComparisonItem[]
): Omit<ScenarioComparisonSummary, "reportCount" | "baselineReportId"> {
  return {
    maxGeneratedTasks: Math.max(...items.map((item) => item.totalGeneratedTasks)),
    maxAssignedTaskCount: Math.max(...items.map((item) => item.assignedTaskCount)),
    maxUnassignedTaskCount: Math.max(...items.map((item) => item.unassignedTaskCount)),
    maxEstimatedTaskMinutes: Math.max(
      ...items.map((item) => item.totalEstimatedTaskMinutes)
    ),
    maxWarningCount: Math.max(...items.map((item) => item.warningCount)),
    maxBusiestMinuteTaskCount: Math.max(
      ...items.map((item) => item.busiestMinuteTaskCount)
    )
  };
}

function validateRequiredComparisonLimitations(limitations: string[]): void {
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  const text = limitations.join(" ").toLowerCase();
  const requiredPhrases: Array<[string, RegExp]> = [
    ["operational-only", /\boperational[- ]only\b/],
    ["no optimizer", /\bno optimizer\b/],
    ["no recommendation", /\bno scenario recommendation\b|\bno recommendation\b/],
    ["no clinical safety claim", /\bno clinical safety claim\b|\bno clinical safety claims\b/]
  ];
  for (const [label, pattern] of requiredPhrases) {
    if (!pattern.test(text)) {
      throw new Error(`limitations must include ${label} language`);
    }
  }
}

function validateRequiredExportBundleLimitations(limitations: string[]): void {
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  const text = limitations.join(" ").toLowerCase();
  const requiredPhrases: Array<[string, RegExp]> = [
    ["operational-only", /\boperational[- ]only\b/],
    ["no optimizer", /\bno optimizer\b/],
    ["no recommendation", /\bno scenario recommendation\b|\bno recommendation\b/],
    ["no clinical safety claim", /\bno clinical safety claim\b|\bno clinical safety claims\b/]
  ];
  for (const [label, pattern] of requiredPhrases) {
    if (!pattern.test(text)) {
      throw new Error(`limitations must include ${label} language`);
    }
  }
}

function validateRequiredIntegrityLimitations(limitations: string[]): void {
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  const text = limitations.join(" ").toLowerCase();
  const requiredPhrases: Array<[string, RegExp]> = [
    ["operational-only integrity proof", /\boperational[- ]only\b[\s\S]{0,80}\bintegrity proof\b/],
    ["no tamper-proof claim", /\bno\b[\s\S]{0,40}\btamper[- ]proof\b[\s\S]{0,30}\bclaim\b/],
    [
      "no legal/compliance claim",
      /\bno\b[\s\S]{0,40}\blegal(?:\/| or | )compliance\b[\s\S]{0,30}\bclaim\b/
    ],
    ["no clinical safety claim", /\bno clinical safety claims?\b/]
  ];
  for (const [label, pattern] of requiredPhrases) {
    if (!pattern.test(text)) {
      throw new Error(`limitations must include ${label} language`);
    }
  }
}

function validateRequiredAuditTrailLimitations(limitations: string[]): void {
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  const text = limitations.join(" ").toLowerCase();
  const requiredPhrases: Array<[string, RegExp]> = [
    ["local proof only", /\blocal proof only\b/],
    [
      "no legal compliance claim",
      /\bno\b[\s\S]{0,40}\blegal(?:\/| or | )compliance\b[\s\S]{0,30}\bclaim\b/
    ],
    ["no tamper-proof claim", /\bno\b[\s\S]{0,40}\btamper[- ]proof\b[\s\S]{0,30}\bclaim\b/],
    ["no clinical safety claim", /\bno clinical safety claims?\b/]
  ];
  for (const [label, pattern] of requiredPhrases) {
    if (!pattern.test(text)) {
      throw new Error(`limitations must include ${label} language`);
    }
  }
}

function validateReportExportBundleMetadata(value: unknown): ReportExportBundleMetadata {
  const metadata = requireRecord(value, "metadata");
  requireExactKeys(metadata, "metadata", [
    "appName",
    "appVersion",
    "generatedBy",
    "source"
  ]);
  validateReportText(metadata.appName, "metadata.appName");
  requireString(metadata.appVersion, "metadata.appVersion");
  requireLiteral(metadata.generatedBy, "local-proof", "metadata.generatedBy");
  requireLiteral(
    metadata.source,
    "synthetic-operational-data",
    "metadata.source"
  );
  return metadata as ReportExportBundleMetadata;
}

function validateOperationalReportSummary(value: unknown): OperationalReportSummary {
  const summary = requireRecord(value, "summary");
  requireExactKeys(summary, "summary", [
    "totalGeneratedTasks",
    "assignedTaskCount",
    "unassignedTaskCount",
    "totalEstimatedTaskMinutes",
    "nurseCount",
    "warningCount"
  ]);
  requireInteger(summary.totalGeneratedTasks, "summary.totalGeneratedTasks", 0);
  requireInteger(summary.assignedTaskCount, "summary.assignedTaskCount", 0);
  requireInteger(summary.unassignedTaskCount, "summary.unassignedTaskCount", 0);
  requireNonNegativeNumber(summary.totalEstimatedTaskMinutes, "summary.totalEstimatedTaskMinutes");
  requireInteger(summary.nurseCount, "summary.nurseCount", 0);
  requireInteger(summary.warningCount, "summary.warningCount", 0);
  return summary as OperationalReportSummary;
}

function validateNurseOperationalSummary(value: unknown, index: number): NurseOperationalSummary {
  const summary = requireRecord(value, `nurseSummaries[${index}]`);
  requireExactKeys(summary, `nurseSummaries[${index}]`, [
    "nurseId",
    "assignedTaskCount",
    "estimatedTaskMinutes",
    "warningCount"
  ]);
  requireString(summary.nurseId, `nurseSummaries[${index}].nurseId`);
  requireInteger(summary.assignedTaskCount, `nurseSummaries[${index}].assignedTaskCount`, 0);
  requireNonNegativeNumber(
    summary.estimatedTaskMinutes,
    `nurseSummaries[${index}].estimatedTaskMinutes`
  );
  requireInteger(summary.warningCount, `nurseSummaries[${index}].warningCount`, 0);
  return summary as NurseOperationalSummary;
}

function validateReportTimelineSummary(value: unknown): ReportTimelineSummary {
  const summary = requireRecord(value, "timelineSummary");
  requireExactKeys(summary, "timelineSummary", [
    "bucketCount",
    "busiestMinute",
    "busiestMinuteTaskCount",
    "totalInterruptiveTasks"
  ]);
  requireInteger(summary.bucketCount, "timelineSummary.bucketCount", 0);
  if (summary.busiestMinute != null) {
    requireInteger(summary.busiestMinute, "timelineSummary.busiestMinute", 0);
  }
  requireInteger(summary.busiestMinuteTaskCount, "timelineSummary.busiestMinuteTaskCount", 0);
  requireInteger(summary.totalInterruptiveTasks, "timelineSummary.totalInterruptiveTasks", 0);
  return summary as ReportTimelineSummary;
}

function validateReportWarningSummary(value: unknown): ReportWarningSummary {
  const summary = requireRecord(value, "warningSummary");
  requireExactKeys(summary, "warningSummary", [
    "infoCount",
    "warningCount",
    "criticalCount",
    "warningCodes"
  ]);
  requireInteger(summary.infoCount, "warningSummary.infoCount", 0);
  requireInteger(summary.warningCount, "warningSummary.warningCount", 0);
  requireInteger(summary.criticalCount, "warningSummary.criticalCount", 0);
  const warningCodes = requireRecord(summary.warningCodes, "warningSummary.warningCodes");
  for (const [code, count] of Object.entries(warningCodes)) {
    requireString(code, "warningSummary.warningCodes key");
    requireInteger(count, `warningSummary.warningCodes.${code}`, 0);
  }
  return summary as ReportWarningSummary;
}

function validateReportUnassignedTaskSummary(value: unknown): ReportUnassignedTaskSummary {
  const summary = requireRecord(value, "unassignedTaskSummary");
  requireExactKeys(summary, "unassignedTaskSummary", [
    "unassignedTaskCount",
    "taskIds",
    "roomIds"
  ]);
  requireInteger(summary.unassignedTaskCount, "unassignedTaskSummary.unassignedTaskCount", 0);
  const taskIds = requireArray(summary.taskIds, "unassignedTaskSummary.taskIds").map(
    (taskId, index) => requireString(taskId, `unassignedTaskSummary.taskIds[${index}]`)
  );
  const roomIds = requireArray(summary.roomIds, "unassignedTaskSummary.roomIds").map(
    (roomId, index) => requireString(roomId, `unassignedTaskSummary.roomIds[${index}]`)
  );
  requireUnique("unassigned report task ids", taskIds);
  requireUnique("unassigned report room ids", roomIds);
  if (summary.unassignedTaskCount !== taskIds.length) {
    throw new Error("unassignedTaskSummary.unassignedTaskCount must equal taskIds.length");
  }
  return summary as ReportUnassignedTaskSummary;
}

function validateRequiredReportLimitations(limitations: string[]): void {
  if (limitations.length === 0) {
    throw new Error("limitations requires at least one entry");
  }
  const text = limitations.join(" ").toLowerCase();
  const requiredPhrases: Array<[string, RegExp]> = [
    ["operational-only", /\boperational[- ]only\b|\boperational inspection summary\b/],
    ["no optimizer", /\bno optimizer\b/],
    ["no task-completion simulation", /\bno task[- ]completion simulation\b/],
    ["no walking route calculation", /\bno walking route calculation\b/]
  ];
  for (const [label, pattern] of requiredPhrases) {
    if (!pattern.test(text)) {
      throw new Error(`limitations must include ${label} language`);
    }
  }
}

function validateReportText(value: unknown, label: string): string {
  const text = validateOperationalRuntimeText(requireString(value, label), label);
  const lowerText = text.toLowerCase();
  const forbiddenPhrases = [
    "safe staffing",
    "safe-staffing",
    "clinical adequacy",
    "staffing certification",
    "certifies staffing",
    "safety certification",
    "certifies safety",
    "certified safe",
    "clinically safe",
    "patient outcome",
    "optimized assignment",
    "recommended scenario",
    "recommend this scenario",
    "recommend scenario",
    "best scenario",
    "preferred scenario",
    "optimal scenario",
    "safest scenario",
    "should choose",
    "completed work",
    "walking route accuracy",
    "delay prediction",
    "diagnosis",
    "treatment",
    "clinical note",
    "patient name",
    "ehr"
  ];
  if (forbiddenPhrases.some((phrase) => lowerText.includes(phrase))) {
    throw new Error(`${label} must remain an operational inspection summary only`);
  }
  return text;
}

function validateProofLimitationText(value: unknown, label: string): string {
  const text = validateReportText(value, label);
  const lowerText = text.toLowerCase();
  const hasNegatedTamperClaim =
    /\bno\b[\s\S]{0,40}\btamper[- ]proof\b[\s\S]{0,30}\bclaim\b/.test(lowerText);
  const hasNegatedLegalComplianceClaim =
    /\bno\b[\s\S]{0,40}\blegal(?:\/| or | )compliance\b[\s\S]{0,30}\bclaim\b/.test(
      lowerText
    );

  if (/\btamper[- ]proof\b/.test(lowerText) && !hasNegatedTamperClaim) {
    throw new Error(`${label} must not claim tamper-proof integrity`);
  }
  if (
    /\blegal(?:\/| or | )compliance\b/.test(lowerText) &&
    !hasNegatedLegalComplianceClaim
  ) {
    throw new Error(`${label} must not claim legal or compliance status`);
  }

  const forbiddenProofClaims = [
    "legal audit",
    "audit compliance",
    "chain-of-custody",
    "chain of custody",
    "non-repudiation",
    "non repudiation",
    "digital signature",
    "signed evidence",
    "security certification",
    "security guarantee",
    "legally binding",
    "tamper evident",
    "tamper-evident",
    "encrypted proof"
  ];
  if (forbiddenProofClaims.some((phrase) => lowerText.includes(phrase))) {
    throw new Error(`${label} must remain a local deterministic proof only`);
  }
  return text;
}

function validateOperationalReportReferences(
  report: OperationalReportContract,
  validated: {
    summary: OperationalReportSummary;
    nurseSummaries: NurseOperationalSummary[];
    timelineSummary: ReportTimelineSummary;
    warningSummary: ReportWarningSummary;
    unassignedTaskSummary: ReportUnassignedTaskSummary;
  },
  context: OperationalReportValidationContext
): void {
  if (context.scenario != null && report.scenarioId !== context.scenario.scenarioId) {
    throw new Error("operationalReport.scenarioId must match the referenced scenario");
  }

  if (
    context.generatedTaskSet != null &&
    report.generatedTaskSetId !== context.generatedTaskSet.generatedTaskSetId
  ) {
    throw new Error(
      "operationalReport.generatedTaskSetId must match the referenced generated task set"
    );
  }

  if (
    context.nurseTaskAssignmentSet != null &&
    report.nurseTaskAssignmentSetId !== context.nurseTaskAssignmentSet.nurseTaskAssignmentSetId
  ) {
    throw new Error(
      "operationalReport.nurseTaskAssignmentSetId must match the referenced nurse task assignment set"
    );
  }

  if (context.generatedTaskSet != null) {
    validateReportAgainstGeneratedTaskSet(report, validated, context.generatedTaskSet);
  }
  if (context.nurseTaskAssignmentSet != null) {
    validateReportAgainstNurseTaskAssignmentSet(report, validated, context);
  }
  if (context.manualAssignmentSet != null) {
    validateReportAgainstManualAssignmentSet(validated.nurseSummaries, context.manualAssignmentSet);
  }
  if (context.warnings != null) {
    validateReportAgainstWarnings(report, validated, context.warnings);
  }
}

function validateReportAgainstGeneratedTaskSet(
  report: OperationalReportContract,
  validated: {
    summary: OperationalReportSummary;
    timelineSummary: ReportTimelineSummary;
    unassignedTaskSummary: ReportUnassignedTaskSummary;
  },
  generatedTaskSet: GeneratedOperationalTaskSetContract
): void {
  if (report.scenarioId !== generatedTaskSet.scenarioId) {
    throw new Error("operationalReport.scenarioId must match the generated task set scenarioId");
  }
  const generatedTaskById = new Map(generatedTaskSet.generatedTasks.map((task) => [task.id, task]));
  const totalEstimatedTaskMinutes = generatedTaskSet.generatedTasks.reduce(
    (total, task) => total + task.estimatedDurationMinutes,
    0
  );
  if (validated.summary.totalGeneratedTasks !== generatedTaskSet.generatedTasks.length) {
    throw new Error("summary.totalGeneratedTasks must match the generated task set");
  }
  if (validated.summary.totalEstimatedTaskMinutes !== totalEstimatedTaskMinutes) {
    throw new Error("summary.totalEstimatedTaskMinutes must match generated task durations");
  }

  const expectedTimelineSummary = summarizeGeneratedTaskTimeline(generatedTaskSet);
  if (validated.timelineSummary.bucketCount !== expectedTimelineSummary.bucketCount) {
    throw new Error("timelineSummary.bucketCount must match generated task scheduled minutes");
  }
  if (validated.timelineSummary.busiestMinute !== expectedTimelineSummary.busiestMinute) {
    throw new Error("timelineSummary.busiestMinute must match generated task scheduled minutes");
  }
  if (
    validated.timelineSummary.busiestMinuteTaskCount !==
    expectedTimelineSummary.busiestMinuteTaskCount
  ) {
    throw new Error(
      "timelineSummary.busiestMinuteTaskCount must match generated task scheduled minutes"
    );
  }
  if (validated.timelineSummary.totalInterruptiveTasks !== expectedTimelineSummary.totalInterruptiveTasks) {
    throw new Error("timelineSummary.totalInterruptiveTasks must match generated tasks");
  }

  for (const taskId of validated.unassignedTaskSummary.taskIds) {
    if (!generatedTaskById.has(taskId)) {
      throw new Error("unassignedTaskSummary.taskIds references an unknown generated task");
    }
  }
}

function validateReportAgainstNurseTaskAssignmentSet(
  report: OperationalReportContract,
  validated: {
    summary: OperationalReportSummary;
    nurseSummaries: NurseOperationalSummary[];
    unassignedTaskSummary: ReportUnassignedTaskSummary;
  },
  context: OperationalReportValidationContext
): void {
  const assignmentSet = validateNurseTaskAssignmentContract(
    context.nurseTaskAssignmentSet,
    context.scenario,
    context.manualAssignmentSet,
    context.generatedTaskSet
  );
  if (report.scenarioId !== assignmentSet.scenarioId) {
    throw new Error("operationalReport.scenarioId must match the nurse task assignment set");
  }
  if (report.generatedTaskSetId !== assignmentSet.generatedTaskSetId) {
    throw new Error("operationalReport.generatedTaskSetId must match the nurse task assignment set");
  }

  const assignedAssignments = assignmentSet.taskAssignments.filter(
    (assignment) => assignment.assignmentReason !== "unassigned"
  );
  const unassignedAssignments = assignmentSet.taskAssignments.filter(
    (assignment) => assignment.assignmentReason === "unassigned"
  );
  if (validated.summary.assignedTaskCount !== assignedAssignments.length) {
    throw new Error("summary.assignedTaskCount must match assigned task assignments");
  }
  if (validated.summary.unassignedTaskCount !== unassignedAssignments.length) {
    throw new Error("summary.unassignedTaskCount must match unassigned task assignments");
  }

  const generatedTaskById = new Map(
    context.generatedTaskSet?.generatedTasks.map((task) => [task.id, task]) ?? []
  );
  const expectedUnassignedTaskIds = unassignedAssignments.map((assignment) => assignment.taskId).sort();
  const expectedUnassignedRoomIds = [
    ...new Set(
      expectedUnassignedTaskIds.map((taskId) => generatedTaskById.get(taskId)?.roomId).filter(isString)
    )
  ].sort();
  if (!sameStringArray(validated.unassignedTaskSummary.taskIds, expectedUnassignedTaskIds)) {
    throw new Error("unassignedTaskSummary.taskIds must match unassigned task assignments");
  }
  if (
    context.generatedTaskSet != null &&
    !sameStringArray(validated.unassignedTaskSummary.roomIds, expectedUnassignedRoomIds)
  ) {
    throw new Error("unassignedTaskSummary.roomIds must match unassigned generated task rooms");
  }

  if (context.generatedTaskSet != null) {
    const expectedByNurse = summarizeNurseAssignments(
      assignmentSet,
      context.generatedTaskSet,
      context.manualAssignmentSet
    );
    for (const nurseSummary of validated.nurseSummaries) {
      const expected = expectedByNurse.get(nurseSummary.nurseId);
      if (expected == null) {
        continue;
      }
      if (nurseSummary.assignedTaskCount !== expected.assignedTaskCount) {
        throw new Error(`nurseSummaries.${nurseSummary.nurseId}.assignedTaskCount must match task assignments`);
      }
      if (nurseSummary.estimatedTaskMinutes !== expected.estimatedTaskMinutes) {
        throw new Error(`nurseSummaries.${nurseSummary.nurseId}.estimatedTaskMinutes must match generated tasks`);
      }
    }
  }
}

function validateReportAgainstManualAssignmentSet(
  nurseSummaries: NurseOperationalSummary[],
  manualAssignmentSet: ManualAssignmentContract
): void {
  const nurseIds = new Set(manualAssignmentSet.nurses.map((nurse) => nurse.id));
  for (const nurseSummary of nurseSummaries) {
    if (!nurseIds.has(nurseSummary.nurseId)) {
      throw new Error("nurseSummaries.nurseId references an unknown nurse");
    }
  }
  const expectedNurseIds = manualAssignmentSet.nurses.map((nurse) => nurse.id).sort();
  const actualNurseIds = nurseSummaries.map((nurseSummary) => nurseSummary.nurseId).sort();
  if (!sameStringArray(actualNurseIds, expectedNurseIds)) {
    throw new Error("nurseSummaries must include every manual assignment nurse");
  }
}

function validateReportAgainstWarnings(
  report: OperationalReportContract,
  validated: {
    summary: OperationalReportSummary;
    nurseSummaries: NurseOperationalSummary[];
    warningSummary: ReportWarningSummary;
  },
  warnings: Warning[]
): void {
  const warningSummary = summarizeWarnings(warnings);
  if (report.summary.warningCount !== warnings.length) {
    throw new Error("summary.warningCount must match supplied warnings");
  }
  if (validated.warningSummary.infoCount !== warningSummary.infoCount) {
    throw new Error("warningSummary.infoCount must match supplied warnings");
  }
  if (validated.warningSummary.warningCount !== warningSummary.warningCount) {
    throw new Error("warningSummary.warningCount must match supplied warnings");
  }
  if (validated.warningSummary.criticalCount !== warningSummary.criticalCount) {
    throw new Error("warningSummary.criticalCount must match supplied warnings");
  }
  if (!sameRecord(validated.warningSummary.warningCodes, warningSummary.warningCodes)) {
    throw new Error("warningSummary.warningCodes must match supplied warnings");
  }
  for (const nurseSummary of validated.nurseSummaries) {
    const expectedWarningCount = warnings.filter((warning) =>
      warning.nurseIds?.includes(nurseSummary.nurseId)
    ).length;
    if (nurseSummary.warningCount !== expectedWarningCount) {
      throw new Error(`nurseSummaries.${nurseSummary.nurseId}.warningCount must match supplied warnings`);
    }
  }
}

function summarizeGeneratedTaskTimeline(
  generatedTaskSet: GeneratedOperationalTaskSetContract
): ReportTimelineSummary {
  const countsByMinute = new Map<number, number>();
  let totalInterruptiveTasks = 0;
  for (const task of generatedTaskSet.generatedTasks) {
    countsByMinute.set(task.scheduledMinute, (countsByMinute.get(task.scheduledMinute) ?? 0) + 1);
    if (task.interruptive) {
      totalInterruptiveTasks += 1;
    }
  }

  let busiestMinute: number | null = null;
  let busiestMinuteTaskCount = 0;
  for (const [minute, count] of [...countsByMinute.entries()].sort(
    ([leftMinute], [rightMinute]) => leftMinute - rightMinute
  )) {
    if (count > busiestMinuteTaskCount) {
      busiestMinute = minute;
      busiestMinuteTaskCount = count;
    }
  }

  return {
    bucketCount: countsByMinute.size,
    busiestMinute,
    busiestMinuteTaskCount,
    totalInterruptiveTasks
  };
}

function summarizeNurseAssignments(
  assignmentSet: NurseTaskAssignmentContract,
  generatedTaskSet: GeneratedOperationalTaskSetContract,
  manualAssignmentSet?: ManualAssignmentContract
): Map<string, { assignedTaskCount: number; estimatedTaskMinutes: number }> {
  const taskById = new Map(generatedTaskSet.generatedTasks.map((task) => [task.id, task]));
  const nurseIds = manualAssignmentSet?.nurses.map((nurse) => nurse.id) ?? [
    ...new Set(assignmentSet.taskAssignments.map((assignment) => assignment.nurseId).filter(isString))
  ];
  const summaries = new Map(
    nurseIds.map((nurseId) => [nurseId, { assignedTaskCount: 0, estimatedTaskMinutes: 0 }])
  );

  for (const assignment of assignmentSet.taskAssignments) {
    if (assignment.nurseId == null) {
      continue;
    }
    const summary = summaries.get(assignment.nurseId) ?? {
      assignedTaskCount: 0,
      estimatedTaskMinutes: 0
    };
    summary.assignedTaskCount += 1;
    summary.estimatedTaskMinutes += taskById.get(assignment.taskId)?.estimatedDurationMinutes ?? 0;
    summaries.set(assignment.nurseId, summary);
  }
  return summaries;
}

function summarizeWarnings(warnings: Warning[]): ReportWarningSummary {
  const warningCodes: Record<string, number> = {};
  const summary: ReportWarningSummary = {
    infoCount: 0,
    warningCount: 0,
    criticalCount: 0,
    warningCodes
  };
  for (const warning of [...warnings].sort((left, right) => left.id.localeCompare(right.id))) {
    if (warning.severity === "info") {
      summary.infoCount += 1;
    }
    if (warning.severity === "warning") {
      summary.warningCount += 1;
    }
    if (warning.severity === "critical") {
      summary.criticalCount += 1;
    }
    warningCodes[warning.code] = (warningCodes[warning.code] ?? 0) + 1;
  }
  return summary;
}

function sameStringArray(left: string[], right: string[]): boolean {
  return left.length === right.length && left.every((value, index) => value === right[index]);
}

function sameRecord(left: Record<string, number>, right: Record<string, number>): boolean {
  const leftKeys = Object.keys(left).sort();
  const rightKeys = Object.keys(right).sort();
  if (!sameStringArray(leftKeys, rightKeys)) {
    return false;
  }
  return leftKeys.every((key) => left[key] === right[key]);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function validateRoomWorkloadWeights(value: unknown): RoomWorkloadWeights {
  const weights = requireRecord(value, "roomWorkloadWeights");
  requireExactKeys(weights, "roomWorkloadWeights", [
    "acuity",
    "traumaActive",
    "isolationActive",
    "behavioralRisk",
    "fallRisk",
    "sitterRequired",
    "highMedicationFrequency",
    "highMonitoringFrequency",
    "highProcedureBurden"
  ]);
  const acuity = requireRecord(weights.acuity, "roomWorkloadWeights.acuity");
  requireExactKeys(acuity, "roomWorkloadWeights.acuity", ["1", "2", "3", "4", "5"]);
  for (const key of ["1", "2", "3", "4", "5"] as const) {
    requireNonNegativeNumber(acuity[key], `roomWorkloadWeights.acuity.${key}`);
  }
  for (const key of [
    "traumaActive",
    "isolationActive",
    "behavioralRisk",
    "fallRisk",
    "sitterRequired",
    "highMedicationFrequency",
    "highMonitoringFrequency",
    "highProcedureBurden"
  ] as const) {
    requireNonNegativeNumber(weights[key], `roomWorkloadWeights.${key}`);
  }
  return weights as RoomWorkloadWeights;
}

function validateNurseBurdenWeights(value: unknown): NurseBurdenWeights {
  const weights = requireRecord(value, "nurseBurdenWeights");
  requireExactKeys(weights, "nurseBurdenWeights", [
    "roomSpreadPerAdditionalOccupiedRoom",
    "overTargetPerRoom",
    "overMaxPerRoom",
    "traumaMismatchPerRoom",
    "activeTaskMinutesPlaceholder",
    "walkingMinutesPlaceholder",
    "breakCoveragePenaltyPlaceholder",
    "interruptionPenaltyPlaceholder"
  ]);
  for (const key of [
    "roomSpreadPerAdditionalOccupiedRoom",
    "overTargetPerRoom",
    "overMaxPerRoom",
    "traumaMismatchPerRoom",
    "activeTaskMinutesPlaceholder",
    "walkingMinutesPlaceholder",
    "breakCoveragePenaltyPlaceholder",
    "interruptionPenaltyPlaceholder"
  ] as const) {
    requireNonNegativeNumber(weights[key], `nurseBurdenWeights.${key}`);
  }
  return weights as NurseBurdenWeights;
}

function validateTaskDurationDefaults(value: unknown): TaskDurationDefaults {
  const durations = requireRecord(value, "taskDurationDefaults");
  requireExactKeys(durations, "taskDurationDefaults", [
    "medicationTaskMinutes",
    "monitoringTaskMinutes",
    "procedureTaskMinutes",
    "turnoverTaskMinutes",
    "isolationTaskMinutes",
    "behavioralRiskTaskMinutes",
    "sitterTaskMinutes"
  ]);
  for (const key of [
    "medicationTaskMinutes",
    "monitoringTaskMinutes",
    "procedureTaskMinutes",
    "turnoverTaskMinutes",
    "isolationTaskMinutes",
    "behavioralRiskTaskMinutes",
    "sitterTaskMinutes"
  ] as const) {
    requirePositiveNumber(durations[key], `taskDurationDefaults.${key}`);
  }
  return durations as TaskDurationDefaults;
}

function validateTaskFrequencyMappings(value: unknown): TaskFrequencyMappings {
  const mappings = requireRecord(value, "taskFrequencyMappings");
  requireExactKeys(mappings, "taskFrequencyMappings", [
    "none",
    "low",
    "medium",
    "high",
    "continuous"
  ]);
  for (const key of TASK_FREQUENCIES) {
    requireInteger(mappings[key], `taskFrequencyMappings.${key}`, 0);
  }
  return mappings as TaskFrequencyMappings;
}

function validateSimulationDefaults(value: unknown): SimulationDefaults {
  const defaults = requireRecord(value, "simulationDefaults");
  requireExactKeys(defaults, "simulationDefaults", [
    "defaultShiftLengthMinutes",
    "defaultTimestepMinutes",
    "defaultSeed"
  ]);
  const defaultShiftLengthMinutes = requirePositiveInteger(
    defaults.defaultShiftLengthMinutes,
    "simulationDefaults.defaultShiftLengthMinutes"
  );
  const defaultTimestepMinutes = requirePositiveInteger(
    defaults.defaultTimestepMinutes,
    "simulationDefaults.defaultTimestepMinutes"
  );
  if (defaultShiftLengthMinutes % defaultTimestepMinutes !== 0) {
    throw new Error("simulationDefaults.defaultShiftLengthMinutes must divide evenly by defaultTimestepMinutes");
  }
  requireSafeInteger(defaults.defaultSeed, "simulationDefaults.defaultSeed", 0);
  return defaults as SimulationDefaults;
}

function validateCareTaskTemplate(value: unknown, index: number): CareTaskTemplate {
  const template = requireRecord(value, `taskTemplates[${index}]`);
  requireExactKeys(template, `taskTemplates[${index}]`, [
    "id",
    "taskType",
    "label",
    "description",
    "defaultDurationMinutes",
    "frequencySource",
    "trigger",
    "burdenCategory",
    "interruptive",
    "requiresRoomPresence"
  ]);
  requireString(template.id, `taskTemplates[${index}].id`);
  requireEnum(template.taskType, TASK_TYPES, `taskTemplates[${index}].taskType`);
  validateOperationalText(template.label, `taskTemplates[${index}].label`);
  validateOperationalText(template.description, `taskTemplates[${index}].description`);
  requirePositiveNumber(
    template.defaultDurationMinutes,
    `taskTemplates[${index}].defaultDurationMinutes`
  );
  const frequencySource = requireEnum(
    template.frequencySource,
    TASK_FREQUENCY_SOURCES,
    `taskTemplates[${index}].frequencySource`
  );
  const trigger = requireEnum(template.trigger, TASK_TRIGGERS, `taskTemplates[${index}].trigger`);
  requireEnum(
    template.burdenCategory,
    TASK_BURDEN_CATEGORIES,
    `taskTemplates[${index}].burdenCategory`
  );
  requireBoolean(template.interruptive, `taskTemplates[${index}].interruptive`);
  requireBoolean(template.requiresRoomPresence, `taskTemplates[${index}].requiresRoomPresence`);

  const expectedFrequencySource = expectedFrequencySourceForTrigger(trigger);
  if (frequencySource !== expectedFrequencySource) {
    throw new Error(
      `taskTemplates[${index}].frequencySource must be ${expectedFrequencySource} for trigger ${trigger}`
    );
  }

  return template as CareTaskTemplate;
}

function validateOperationalText(value: unknown, label: string): string | null | undefined {
  const text = requireOptionalString(value, label);
  if (text == null) {
    return text;
  }
  validateOperationalRuntimeText(text, label);
  const lowerText = text.toLowerCase();
  const forbiddenPhrases = [
    "diagnosis",
    "clinical note",
    "clinical order",
    "treatment plan",
    "real identity"
  ];
  if (forbiddenPhrases.some((phrase) => lowerText.includes(phrase))) {
    throw new Error(`${label} must remain operational-only`);
  }
  return text;
}

function expectedFrequencySourceForTrigger(trigger: TaskTrigger): TaskFrequencySource {
  if (trigger === "medicationFrequency" || trigger === "monitoringFrequency") {
    return "room_load_frequency";
  }
  if (trigger === "procedureBurden") {
    return "room_load_burden";
  }
  if (trigger === "expectedTurnover") {
    return "room_load_turnover";
  }
  return "boolean_trigger";
}

function validateDayProfileSegment(
  value: unknown,
  index: number,
  shiftLengthMinutes: number
): DayProfileSegment {
  const segment = requireRecord(value, `segments[${index}]`);
  requireExactKeys(segment, `segments[${index}]`, [
    "id",
    "label",
    "startMinute",
    "endMinute",
    "taskVolumeMultiplier",
    "turnoverMultiplier",
    "interruptionMultiplier",
    "walkingCongestionMultiplier"
  ]);
  requireString(segment.id, `segments[${index}].id`);
  requireString(segment.label, `segments[${index}].label`);
  const startMinute = requireInteger(segment.startMinute, `segments[${index}].startMinute`, 0);
  const endMinute = requireInteger(segment.endMinute, `segments[${index}].endMinute`, 0);
  if (endMinute <= startMinute) {
    throw new Error(`segments[${index}].endMinute must be greater than startMinute`);
  }
  if (endMinute > shiftLengthMinutes) {
    throw new Error(`segments[${index}] must stay within shift bounds`);
  }
  requirePositiveNumber(segment.taskVolumeMultiplier, `segments[${index}].taskVolumeMultiplier`);
  requirePositiveNumber(segment.turnoverMultiplier, `segments[${index}].turnoverMultiplier`);
  requirePositiveNumber(
    segment.interruptionMultiplier,
    `segments[${index}].interruptionMultiplier`
  );
  requirePositiveNumber(
    segment.walkingCongestionMultiplier,
    `segments[${index}].walkingCongestionMultiplier`
  );
  return segment as DayProfileSegment;
}

function validateFullShiftSegmentCoverage(
  segments: DayProfileSegment[],
  shiftLengthMinutes: number
): void {
  const sortedSegments = [...segments].sort((left, right) => left.startMinute - right.startMinute);
  let expectedStartMinute = 0;
  for (const segment of sortedSegments) {
    if (segment.startMinute !== expectedStartMinute) {
      throw new Error("day profile segments must cover the full shift without gaps or overlaps");
    }
    expectedStartMinute = segment.endMinute;
  }
  if (expectedStartMinute !== shiftLengthMinutes) {
    throw new Error("day profile segments must cover the full shift");
  }
}

function validateGeneratedOperationalTaskAt(
  value: unknown,
  index: number,
  scenario?: ShiftScenarioContract,
  taskTemplates?: TaskTemplateContract,
  plan?: PlanContract
): GeneratedOperationalTask {
  const task = requireRecord(value, `generatedOperationalTasks[${index}]`);
  requireExactKeys(task, `generatedOperationalTasks[${index}]`, [
    "id",
    "taskType",
    "roomId",
    "sourceTemplateId",
    "scheduledMinute",
    "estimatedDurationMinutes",
    "burdenCategory",
    "interruptive",
    "requiresRoomPresence"
  ]);
  requireString(task.id, `generatedOperationalTasks[${index}].id`);
  requireEnum(task.taskType, TASK_TYPES, `generatedOperationalTasks[${index}].taskType`);
  const roomId = requireString(task.roomId, `generatedOperationalTasks[${index}].roomId`);
  const sourceTemplateId = requireString(
    task.sourceTemplateId,
    `generatedOperationalTasks[${index}].sourceTemplateId`
  );
  const scheduledMinute = requireInteger(
    task.scheduledMinute,
    `generatedOperationalTasks[${index}].scheduledMinute`,
    0
  );
  requirePositiveNumber(
    task.estimatedDurationMinutes,
    `generatedOperationalTasks[${index}].estimatedDurationMinutes`
  );
  requireEnum(
    task.burdenCategory,
    TASK_BURDEN_CATEGORIES,
    `generatedOperationalTasks[${index}].burdenCategory`
  );
  requireBoolean(task.interruptive, `generatedOperationalTasks[${index}].interruptive`);
  requireBoolean(
    task.requiresRoomPresence,
    `generatedOperationalTasks[${index}].requiresRoomPresence`
  );

  if (scenario != null) {
    if (scheduledMinute >= scenario.shiftLengthMinutes) {
      throw new Error(`generatedOperationalTasks[${index}].scheduledMinute must be within shift bounds`);
    }
    if (scheduledMinute % scenario.timestepMinutes !== 0) {
      throw new Error(
        `generatedOperationalTasks[${index}].scheduledMinute must align to scenario.timestepMinutes`
      );
    }
    if (!scenario.roomLoads.some((roomLoad) => roomLoad.roomId === roomId)) {
      throw new Error(`generatedOperationalTasks[${index}].roomId references an unknown scenario room`);
    }
  }
  if (plan != null && !plan.rooms.some((room) => room.id === roomId)) {
    throw new Error(`generatedOperationalTasks[${index}].roomId references an unknown plan room`);
  }
  if (taskTemplates != null) {
    const template = taskTemplates.taskTemplates.find((candidate) => candidate.id === sourceTemplateId);
    if (template == null) {
      throw new Error(
        `generatedOperationalTasks[${index}].sourceTemplateId references an unknown task template`
      );
    }
    if (template.taskType !== task.taskType) {
      throw new Error(
        `generatedOperationalTasks[${index}].taskType must match the referenced task template`
      );
    }
    if (template.burdenCategory !== task.burdenCategory) {
      throw new Error(
        `generatedOperationalTasks[${index}].burdenCategory must match the referenced task template`
      );
    }
  }

  return task as GeneratedOperationalTask;
}

function validateScale(value: unknown): ScaleSettings {
  const scale = requireRecord(value, "scale");
  requireExactKeys(scale, "scale", [
    "unit",
    "pixelsPerUnit",
    "gridSizeFeet",
    "snapToGrid",
    "origin"
  ]);
  requireLiteral(scale.unit, "feet", "scale.unit");
  requirePositiveNumber(scale.pixelsPerUnit, "scale.pixelsPerUnit");
  requirePositiveNumber(scale.gridSizeFeet, "scale.gridSizeFeet");
  requireBoolean(scale.snapToGrid, "scale.snapToGrid");
  requireLiteral(scale.origin, "top-left", "scale.origin");
  return scale as ScaleSettings;
}

function validateRoom(value: unknown, index: number): Room {
  const room = requireRecord(value, `rooms[${index}]`);
  requireExactKeys(room, `rooms[${index}]`, [
    "id",
    "label",
    "roomType",
    "x",
    "y",
    "widthFeet",
    "lengthFeet",
    "maxPatients",
    "traumaCapable",
    "isolationCapable",
    "doorPoint",
    "zoneId",
    "nearestStationId",
    "pathNodeId",
    "roomOperationalMetadata",
    "overflowOperationalMetadata",
    "adjacencyOperationalMetadata"
  ]);
  requireString(room.id, `rooms[${index}].id`);
  validateOperationalRuntimeText(
    requireString(room.label, `rooms[${index}].label`),
    `rooms[${index}].label`
  );
  requireEnum(room.roomType, ROOM_TYPES, `rooms[${index}].roomType`);
  requireNumber(room.x, `rooms[${index}].x`);
  requireNumber(room.y, `rooms[${index}].y`);
  requirePositiveNumber(room.widthFeet, `rooms[${index}].widthFeet`);
  requirePositiveNumber(room.lengthFeet, `rooms[${index}].lengthFeet`);
  requirePositiveInteger(room.maxPatients, `rooms[${index}].maxPatients`);
  requireBoolean(room.traumaCapable, `rooms[${index}].traumaCapable`);
  requireBoolean(room.isolationCapable, `rooms[${index}].isolationCapable`);
  if (room.doorPoint != null) {
    validatePoint(room.doorPoint, `rooms[${index}].doorPoint`);
  }
  requireOptionalString(room.zoneId, `rooms[${index}].zoneId`);
  requireOptionalString(room.nearestStationId, `rooms[${index}].nearestStationId`);
  requireOptionalString(room.pathNodeId, `rooms[${index}].pathNodeId`);
  validateOptionalRoomOperationalMetadata(
    room.roomOperationalMetadata,
    `rooms[${index}].roomOperationalMetadata`
  );
  validateOptionalOperationalMetadataPlaceholder(
    room.overflowOperationalMetadata,
    `rooms[${index}].overflowOperationalMetadata`
  );
  validateOptionalOperationalMetadataPlaceholder(
    room.adjacencyOperationalMetadata,
    `rooms[${index}].adjacencyOperationalMetadata`
  );
  return room as Room;
}

function validateHallway(value: unknown, index: number): Hallway {
  const hallway = requireRecord(value, `hallways[${index}]`);
  requireExactKeys(hallway, `hallways[${index}]`, [
    "id",
    "label",
    "widthFeet",
    "points",
    "hallwayOperationalMetadata"
  ]);
  requireString(hallway.id, `hallways[${index}].id`);
  validateOperationalRuntimeText(
    requireString(hallway.label, `hallways[${index}].label`),
    `hallways[${index}].label`
  );
  requirePositiveNumber(hallway.widthFeet, `hallways[${index}].widthFeet`);
  const points = requireArray(hallway.points, `hallways[${index}].points`);
  if (points.length < 2) {
    throw new Error(`hallways[${index}].points requires at least two points`);
  }
  points.forEach((point, pointIndex) =>
    validatePoint(point, `hallways[${index}].points[${pointIndex}]`)
  );
  validateOptionalOperationalMetadataPlaceholder(
    hallway.hallwayOperationalMetadata,
    `hallways[${index}].hallwayOperationalMetadata`
  );
  return hallway as Hallway;
}

function validateDoor(value: unknown, index: number): Door {
  const door = requireRecord(value, `doors[${index}]`);
  requireExactKeys(door, `doors[${index}]`, [
    "id",
    "label",
    "roomId",
    "x",
    "y",
    "widthFeet",
    "pathNodeId",
    "doorOperationalMetadata"
  ]);
  requireString(door.id, `doors[${index}].id`);
  validateOperationalRuntimeText(
    requireString(door.label, `doors[${index}].label`),
    `doors[${index}].label`
  );
  requireString(door.roomId, `doors[${index}].roomId`);
  requireNumber(door.x, `doors[${index}].x`);
  requireNumber(door.y, `doors[${index}].y`);
  requirePositiveNumber(door.widthFeet, `doors[${index}].widthFeet`);
  requireOptionalString(door.pathNodeId, `doors[${index}].pathNodeId`);
  validateOptionalOperationalMetadataPlaceholder(
    door.doorOperationalMetadata,
    `doors[${index}].doorOperationalMetadata`
  );
  return door as Door;
}

function validateNurseStation(value: unknown, index: number): NurseStation {
  const station = requireRecord(value, `nurseStations[${index}]`);
  requireExactKeys(station, `nurseStations[${index}]`, [
    "id",
    "label",
    "stationType",
    "x",
    "y",
    "widthFeet",
    "lengthFeet",
    "pathNodeId",
    "stationOperationalMetadata"
  ]);
  requireString(station.id, `nurseStations[${index}].id`);
  validateOperationalRuntimeText(
    requireString(station.label, `nurseStations[${index}].label`),
    `nurseStations[${index}].label`
  );
  requireEnum(station.stationType, STATION_TYPES, `nurseStations[${index}].stationType`);
  requireNumber(station.x, `nurseStations[${index}].x`);
  requireNumber(station.y, `nurseStations[${index}].y`);
  requirePositiveNumber(station.widthFeet, `nurseStations[${index}].widthFeet`);
  requirePositiveNumber(station.lengthFeet, `nurseStations[${index}].lengthFeet`);
  requireString(station.pathNodeId, `nurseStations[${index}].pathNodeId`);
  validateOptionalOperationalMetadataPlaceholder(
    station.stationOperationalMetadata,
    `nurseStations[${index}].stationOperationalMetadata`
  );
  return station as NurseStation;
}

function validateZone(value: unknown, index: number): Zone {
  const zone = requireRecord(value, `zones[${index}]`);
  requireExactKeys(zone, `zones[${index}]`, [
    "id",
    "label",
    "zoneType",
    "color",
    "x",
    "y",
    "widthFeet",
    "lengthFeet",
    "travelBlocked",
    "travelPenalty",
    "zoneOperationalMetadata"
  ]);
  requireString(zone.id, `zones[${index}].id`);
  validateOperationalRuntimeText(
    requireString(zone.label, `zones[${index}].label`),
    `zones[${index}].label`
  );
  requireEnum(zone.zoneType, ZONE_TYPES, `zones[${index}].zoneType`);
  const color = requireString(zone.color, `zones[${index}].color`);
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new Error(`zones[${index}].color must be a hex color`);
  }
  requireNumber(zone.x, `zones[${index}].x`);
  requireNumber(zone.y, `zones[${index}].y`);
  requirePositiveNumber(zone.widthFeet, `zones[${index}].widthFeet`);
  requirePositiveNumber(zone.lengthFeet, `zones[${index}].lengthFeet`);
  requireBoolean(zone.travelBlocked, `zones[${index}].travelBlocked`);
  if (zone.travelPenalty != null) {
    requireNonNegativeNumber(zone.travelPenalty, `zones[${index}].travelPenalty`);
  }
  validateOptionalOperationalMetadataPlaceholder(
    zone.zoneOperationalMetadata,
    `zones[${index}].zoneOperationalMetadata`
  );
  return zone as Zone;
}

function validatePathNode(value: unknown, index: number): PathNode {
  const node = requireRecord(value, `pathNodes[${index}]`);
  requireExactKeys(node, `pathNodes[${index}]`, [
    "id",
    "nodeType",
    "x",
    "y",
    "linkedObjectId",
    "entryOperationalMetadata"
  ]);
  requireString(node.id, `pathNodes[${index}].id`);
  requireEnum(node.nodeType, PATH_NODE_TYPES, `pathNodes[${index}].nodeType`);
  requireNumber(node.x, `pathNodes[${index}].x`);
  requireNumber(node.y, `pathNodes[${index}].y`);
  requireOptionalString(node.linkedObjectId, `pathNodes[${index}].linkedObjectId`);
  validateOptionalOperationalMetadataPlaceholder(
    node.entryOperationalMetadata,
    `pathNodes[${index}].entryOperationalMetadata`
  );
  return node as PathNode;
}

function validatePathEdge(value: unknown, index: number): PathEdge {
  const edge = requireRecord(value, `pathEdges[${index}]`);
  requireExactKeys(edge, `pathEdges[${index}]`, [
    "id",
    "fromNodeId",
    "toNodeId",
    "lengthFeet",
    "hallwayWidthFeet",
    "congestionFactor",
    "doorPenaltySeconds",
    "turnPenaltySeconds",
    "blocked"
  ]);
  requireString(edge.id, `pathEdges[${index}].id`);
  requireString(edge.fromNodeId, `pathEdges[${index}].fromNodeId`);
  requireString(edge.toNodeId, `pathEdges[${index}].toNodeId`);
  requirePositiveNumber(edge.lengthFeet, `pathEdges[${index}].lengthFeet`);
  requirePositiveNumber(edge.hallwayWidthFeet, `pathEdges[${index}].hallwayWidthFeet`);
  requirePositiveNumber(edge.congestionFactor, `pathEdges[${index}].congestionFactor`);
  requireNonNegativeNumber(edge.doorPenaltySeconds, `pathEdges[${index}].doorPenaltySeconds`);
  requireNonNegativeNumber(edge.turnPenaltySeconds, `pathEdges[${index}].turnPenaltySeconds`);
  requireBoolean(edge.blocked, `pathEdges[${index}].blocked`);
  return edge as PathEdge;
}

function validateRoomReferences(room: Room, index: number, references: ReferenceIndex): void {
  if (room.zoneId != null && !references.zoneIds.has(room.zoneId)) {
    throw new Error(`rooms[${index}].zoneId references an unknown zone`);
  }
  if (room.nearestStationId != null && !references.nurseStationIds.has(room.nearestStationId)) {
    throw new Error(`rooms[${index}].nearestStationId references an unknown nurse station`);
  }
  if (room.pathNodeId != null) {
    const pathNode = references.pathNodesById.get(room.pathNodeId);
    if (pathNode == null) {
      throw new Error(`rooms[${index}].pathNodeId references an unknown path node`);
    }
    if (pathNode.nodeType !== "room_door") {
      throw new Error(`rooms[${index}].pathNodeId must reference a room_door path node`);
    }
    const linkedDoor = references.doorsById.get(pathNode.linkedObjectId ?? "");
    if (linkedDoor == null || linkedDoor.roomId !== room.id) {
      throw new Error(`rooms[${index}].pathNodeId must reference a door for the same room`);
    }
  }
}

function validateDoorReferences(door: Door, index: number, references: ReferenceIndex): void {
  if (!references.roomIds.has(door.roomId)) {
    throw new Error(`doors[${index}].roomId references an unknown room`);
  }
  if (door.pathNodeId != null) {
    const pathNode = references.pathNodesById.get(door.pathNodeId);
    if (pathNode == null) {
      throw new Error(`doors[${index}].pathNodeId references an unknown path node`);
    }
    if (pathNode.nodeType !== "room_door") {
      throw new Error(`doors[${index}].pathNodeId must reference a room_door path node`);
    }
    if (pathNode.linkedObjectId !== door.id) {
      throw new Error(`doors[${index}].pathNodeId must link back to the same door`);
    }
  }
}

function validateNurseStationReferences(
  station: NurseStation,
  index: number,
  references: ReferenceIndex
): void {
  const pathNode = references.pathNodesById.get(station.pathNodeId);
  if (pathNode == null) {
    throw new Error(`nurseStations[${index}].pathNodeId references an unknown path node`);
  }
  if (pathNode.nodeType !== "station") {
    throw new Error(`nurseStations[${index}].pathNodeId must reference a station path node`);
  }
  if (pathNode.linkedObjectId !== station.id) {
    throw new Error(`nurseStations[${index}].pathNodeId must link back to the same station`);
  }
}

function validatePathNodeReferences(node: PathNode, index: number, idSets: IdSets): void {
  if (node.nodeType === "entry") {
    if (node.linkedObjectId != null) {
      throw new Error(`pathNodes[${index}].linkedObjectId is not allowed for entry nodes`);
    }
    return;
  }

  const linkedObjectId = requireString(
    node.linkedObjectId,
    `pathNodes[${index}].linkedObjectId`
  );

  if (node.nodeType === "room_door" && !idSets.doorIds.has(linkedObjectId)) {
    throw new Error(`pathNodes[${index}].linkedObjectId references an unknown door`);
  }
  if (node.nodeType === "hallway" && !idSets.hallwayIds.has(linkedObjectId)) {
    throw new Error(`pathNodes[${index}].linkedObjectId references an unknown hallway`);
  }
  if (node.nodeType === "station" && !idSets.nurseStationIds.has(linkedObjectId)) {
    throw new Error(`pathNodes[${index}].linkedObjectId references an unknown nurse station`);
  }
  if (node.nodeType === "zone" && !idSets.zoneIds.has(linkedObjectId)) {
    throw new Error(`pathNodes[${index}].linkedObjectId references an unknown zone`);
  }
}

function validatePathEdgeReferences(edge: PathEdge, index: number, idSets: IdSets): void {
  if (!idSets.pathNodeIds.has(edge.fromNodeId)) {
    throw new Error(`pathEdges[${index}].fromNodeId references an unknown path node`);
  }
  if (!idSets.pathNodeIds.has(edge.toNodeId)) {
    throw new Error(`pathEdges[${index}].toNodeId references an unknown path node`);
  }
}

function validateRoomLoad(value: unknown, index: number): RoomLoad {
  const roomLoad = requireRecord(value, `roomLoads[${index}]`);
  requireExactKeys(roomLoad, `roomLoads[${index}]`, [
    "roomId",
    "occupied",
    "acuity",
    "traumaActive",
    "isolationActive",
    "behavioralRisk",
    "fallRisk",
    "sitterRequired",
    "medicationFrequency",
    "monitoringFrequency",
    "procedureBurden",
    "expectedTurnover"
  ]);
  requireString(roomLoad.roomId, `roomLoads[${index}].roomId`);
  requireBoolean(roomLoad.occupied, `roomLoads[${index}].occupied`);
  requireInteger(roomLoad.acuity, `roomLoads[${index}].acuity`, 1, 5);
  requireBoolean(roomLoad.traumaActive, `roomLoads[${index}].traumaActive`);
  requireBoolean(roomLoad.isolationActive, `roomLoads[${index}].isolationActive`);
  requireBoolean(roomLoad.behavioralRisk, `roomLoads[${index}].behavioralRisk`);
  requireBoolean(roomLoad.fallRisk, `roomLoads[${index}].fallRisk`);
  requireBoolean(roomLoad.sitterRequired, `roomLoads[${index}].sitterRequired`);
  requireEnum(
    roomLoad.medicationFrequency,
    TASK_FREQUENCIES,
    `roomLoads[${index}].medicationFrequency`
  );
  requireEnum(
    roomLoad.monitoringFrequency,
    TASK_FREQUENCIES,
    `roomLoads[${index}].monitoringFrequency`
  );
  requireEnum(roomLoad.procedureBurden, BURDEN_LEVELS, `roomLoads[${index}].procedureBurden`);
  requireEnum(roomLoad.expectedTurnover, TURNOVER_LEVELS, `roomLoads[${index}].expectedTurnover`);
  return roomLoad as RoomLoad;
}

function validateNurse(value: unknown, index: number): Nurse {
  const nurse = requireRecord(value, `nurses[${index}]`);
  requireExactKeys(nurse, `nurses[${index}]`, [
    "id",
    "name",
    "color",
    "role",
    "homeStationId",
    "traumaQualified",
    "chargeQualified",
    "psychQualified",
    "triageQualified",
    "maxPatients",
    "targetPatients",
    "walkingSpeedFeetPerMinute",
    "shiftStartMinute",
    "shiftEndMinute",
    "breakWindows"
  ]);
  const nurseId = requireString(nurse.id, `nurses[${index}].id`);
  validateOperationalRuntimeText(
    requireString(nurse.name, `nurses[${index}].name`),
    `nurses[${index}].name`
  );
  const color = requireString(nurse.color, `nurses[${index}].color`);
  if (!/^#[0-9a-fA-F]{6}$/.test(color)) {
    throw new Error(`nurses[${index}].color must be a hex color`);
  }
  requireEnum(nurse.role, NURSE_ROLES, `nurses[${index}].role`);
  requireOptionalString(nurse.homeStationId, `nurses[${index}].homeStationId`);
  requireBoolean(nurse.traumaQualified, `nurses[${index}].traumaQualified`);
  requireBoolean(nurse.chargeQualified, `nurses[${index}].chargeQualified`);
  requireBoolean(nurse.psychQualified, `nurses[${index}].psychQualified`);
  requireBoolean(nurse.triageQualified, `nurses[${index}].triageQualified`);
  const maxPatients = requirePositiveInteger(nurse.maxPatients, `nurses[${index}].maxPatients`);
  const targetPatients = requirePositiveInteger(
    nurse.targetPatients,
    `nurses[${index}].targetPatients`
  );
  if (maxPatients < targetPatients) {
    throw new Error(`nurses[${index}].maxPatients must be greater than or equal to targetPatients`);
  }
  requirePositiveNumber(
    nurse.walkingSpeedFeetPerMinute,
    `nurses[${index}].walkingSpeedFeetPerMinute`
  );
  const shiftStartMinute = requireInteger(
    nurse.shiftStartMinute,
    `nurses[${index}].shiftStartMinute`,
    0
  );
  const shiftEndMinute = requireInteger(
    nurse.shiftEndMinute,
    `nurses[${index}].shiftEndMinute`,
    0
  );
  if (shiftEndMinute <= shiftStartMinute) {
    throw new Error(`nurses[${index}].shiftEndMinute must be greater than shiftStartMinute`);
  }
  requireArray(nurse.breakWindows, `nurses[${index}].breakWindows`).forEach(
    (breakWindow, breakWindowIndex) =>
      validateBreakWindow(breakWindow, breakWindowIndex, nurseId, `nurses[${index}].breakWindows`)
  );
  return nurse as Nurse;
}

function validateBreakWindow(
  value: unknown,
  index: number,
  nurseId: string,
  parentLabel: string
): BreakWindow {
  const label = `${parentLabel}[${index}]`;
  const breakWindow = requireRecord(value, label);
  requireExactKeys(breakWindow, label, ["id", "nurseId", "startMinute", "endMinute", "flexible"]);
  requireString(breakWindow.id, `${label}.id`);
  const referencedNurseId = requireString(breakWindow.nurseId, `${label}.nurseId`);
  if (referencedNurseId !== nurseId) {
    throw new Error(`${label}.nurseId must reference its parent nurse`);
  }
  const startMinute = requireInteger(breakWindow.startMinute, `${label}.startMinute`, 0);
  const endMinute = requireInteger(breakWindow.endMinute, `${label}.endMinute`, 0);
  if (endMinute <= startMinute) {
    throw new Error(`${label}.endMinute must be greater than startMinute`);
  }
  requireBoolean(breakWindow.flexible, `${label}.flexible`);
  return breakWindow as BreakWindow;
}

function validateAssignment(value: unknown, index: number): Assignment {
  const assignment = requireRecord(value, `assignments[${index}]`);
  requireExactKeys(assignment, `assignments[${index}]`, [
    "id",
    "nurseId",
    "roomIds",
    "assignmentType",
    "startMinute",
    "endMinute"
  ]);
  requireString(assignment.id, `assignments[${index}].id`);
  requireString(assignment.nurseId, `assignments[${index}].nurseId`);
  const roomIds = requireArray(assignment.roomIds, `assignments[${index}].roomIds`);
  if (roomIds.length === 0) {
    throw new Error(`assignments[${index}].roomIds requires at least one room`);
  }
  roomIds.forEach((roomId, roomIndex) =>
    requireString(roomId, `assignments[${index}].roomIds[${roomIndex}]`)
  );
  requireUnique("assignment room ids", roomIds as string[]);
  requireEnum(assignment.assignmentType, ASSIGNMENT_TYPES, `assignments[${index}].assignmentType`);
  const startMinute = requireInteger(assignment.startMinute, `assignments[${index}].startMinute`, 0);
  if (assignment.endMinute != null) {
    const endMinute = requireInteger(assignment.endMinute, `assignments[${index}].endMinute`, 0);
    if (endMinute <= startMinute) {
      throw new Error(`assignments[${index}].endMinute must be greater than startMinute`);
    }
  }
  return assignment as Assignment;
}

function validateNurseTaskAssignment(value: unknown, index: number): NurseTaskAssignment {
  const assignment = requireRecord(value, `taskAssignments[${index}]`);
  requireExactKeys(assignment, `taskAssignments[${index}]`, [
    "id",
    "taskId",
    "nurseId",
    "assignmentReason",
    "minute"
  ]);
  requireString(assignment.id, `taskAssignments[${index}].id`);
  requireString(assignment.taskId, `taskAssignments[${index}].taskId`);
  requireOptionalString(assignment.nurseId, `taskAssignments[${index}].nurseId`);
  requireEnum(
    assignment.assignmentReason,
    NURSE_TASK_ASSIGNMENT_REASONS,
    `taskAssignments[${index}].assignmentReason`
  );
  requireInteger(assignment.minute, `taskAssignments[${index}].minute`, 0);
  return assignment as NurseTaskAssignment;
}

function validatePoint(value: unknown, label: string): Point {
  const point = requireRecord(value, label);
  requireExactKeys(point, label, ["x", "y"]);
  requireNumber(point.x, `${label}.x`);
  requireNumber(point.y, `${label}.y`);
  return point as Point;
}

function validateOptionalRoomOperationalMetadata(value: unknown, label: string): void {
  if (value == null) {
    return;
  }
  const metadata = requireRecord(value, label);
  requireExactKeys(metadata, label, [
    "roomNumber",
    "roomClass",
    "capacityCategory",
    "traumaAdjacent",
    "isolationReady",
    "behavioralReady",
    "sitterCapable",
    "lineOfSightLevel"
  ]);
  if (metadata.roomNumber != null) {
    validateOperationalRuntimeText(
      requireString(metadata.roomNumber, `${label}.roomNumber`),
      `${label}.roomNumber`
    );
  }
  requireEnum(metadata.roomClass, ROOM_OPERATIONAL_CLASSES, `${label}.roomClass`);
  requireEnum(metadata.capacityCategory, ROOM_CAPACITY_CATEGORIES, `${label}.capacityCategory`);
  requireBoolean(metadata.traumaAdjacent, `${label}.traumaAdjacent`);
  requireBoolean(metadata.isolationReady, `${label}.isolationReady`);
  requireBoolean(metadata.behavioralReady, `${label}.behavioralReady`);
  requireBoolean(metadata.sitterCapable, `${label}.sitterCapable`);
  requireEnum(metadata.lineOfSightLevel, LINE_OF_SIGHT_LEVELS, `${label}.lineOfSightLevel`);
}

function validateOptionalOperationalMetadataPlaceholder(value: unknown, label: string): void {
  if (value == null) {
    return;
  }
  const metadata = requireRecord(value, label);
  requireExactKeys(metadata, label, []);
}

function requireRecord(value: unknown, label: string): Record<string, unknown> {
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    throw new Error(`${label} must be an object`);
  }
  return value as Record<string, unknown>;
}

function requireExactKeys(value: Record<string, unknown>, label: string, allowedKeys: string[]): void {
  const allowed = new Set(allowedKeys);
  for (const key of Object.keys(value)) {
    if (!allowed.has(key)) {
      throw new Error(`${label}.${key} is not allowed`);
    }
  }
}

function requireArray(value: unknown, label: string): unknown[] {
  if (!Array.isArray(value)) {
    throw new Error(`${label} must be an array`);
  }
  return value;
}

function requireString(value: unknown, label: string): string {
  if (typeof value !== "string" || value.length === 0) {
    throw new Error(`${label} must be a non-empty string`);
  }
  return value;
}

function requireStringMax(value: unknown, label: string, maxLength: number): string {
  const stringValue = requireString(value, label);
  if (stringValue.length > maxLength) {
    throw new Error(`${label} must be ${maxLength} characters or fewer`);
  }
  return stringValue;
}

function requireOptionalString(value: unknown, label: string): string | null | undefined {
  if (value == null) {
    return value;
  }
  return requireString(value, label);
}

function requireOptionalStringMax(
  value: unknown,
  label: string,
  maxLength: number
): string | null | undefined {
  if (value == null) {
    return value;
  }
  return requireStringMax(value, label, maxLength);
}

function requireNumber(value: unknown, label: string): number {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    throw new Error(`${label} must be a finite number`);
  }
  return value;
}

function requirePositiveNumber(value: unknown, label: string): number {
  const numberValue = requireNumber(value, label);
  if (numberValue <= 0) {
    throw new Error(`${label} must be positive`);
  }
  return numberValue;
}

function requireNonNegativeNumber(value: unknown, label: string): number {
  const numberValue = requireNumber(value, label);
  if (numberValue < 0) {
    throw new Error(`${label} must be non-negative`);
  }
  return numberValue;
}

function requireInteger(value: unknown, label: string, min?: number, max?: number): number {
  if (typeof value !== "number" || !Number.isInteger(value)) {
    throw new Error(`${label} must be an integer`);
  }
  if (min !== undefined && value < min) {
    throw new Error(`${label} must be greater than or equal to ${min}`);
  }
  if (max !== undefined && value > max) {
    throw new Error(`${label} must be less than or equal to ${max}`);
  }
  return value;
}

function requireSafeInteger(value: unknown, label: string, min?: number, max?: number): number {
  const integerValue = requireInteger(value, label, min, max);
  if (!Number.isSafeInteger(integerValue)) {
    throw new Error(`${label} must be a safe integer`);
  }
  return integerValue;
}

function requirePositiveInteger(value: unknown, label: string): number {
  const integerValue = requireInteger(value, label);
  if (integerValue <= 0) {
    throw new Error(`${label} must be positive`);
  }
  return integerValue;
}

function requireBoolean(value: unknown, label: string): boolean {
  if (typeof value !== "boolean") {
    throw new Error(`${label} must be a boolean`);
  }
  return value;
}

function requireLiteral<T extends string>(value: unknown, expected: T, label: string): T {
  if (value !== expected) {
    throw new Error(`${label} must be ${expected}`);
  }
  return expected;
}

function requireIsoDateTime(value: unknown, label: string): string {
  const stringValue = requireString(value, label);
  if (Number.isNaN(Date.parse(stringValue))) {
    throw new Error(`${label} must be an ISO-compatible timestamp`);
  }
  return stringValue;
}

function requireEnum<T extends string>(
  value: unknown,
  allowedValues: readonly T[],
  label: string
): T {
  if (typeof value !== "string" || !allowedValues.includes(value as T)) {
    throw new Error(`${label} must be one of ${allowedValues.join(", ")}`);
  }
  return value as T;
}

function requireUnique(label: string, values: string[]): Set<string> {
  const valueSet = new Set(values);
  if (valueSet.size !== values.length) {
    throw new Error(`duplicate ${label} are not allowed`);
  }
  return valueSet;
}
