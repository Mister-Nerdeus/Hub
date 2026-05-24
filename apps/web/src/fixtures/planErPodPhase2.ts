import type { PlanContract } from "@nerdeus/shared";

export const planErPodPhase2 = {
  "schemaVersion": "1.0.0",
  "planId": "plan-er-pod-phase2",
  "name": "Phase 2 ER Pod Layout",
  "scale": {
    "unit": "feet",
    "pixelsPerUnit": 8,
    "gridSizeFeet": 1,
    "snapToGrid": true,
    "origin": "top-left"
  },
  "rooms": [
    {
      "id": "room-01",
      "label": "Room 01",
      "x": 4,
      "y": 4,
      "widthFeet": 12,
      "lengthFeet": 10,
      "zoneId": "zone-pod-a",
      "nearestStationId": "station-primary",
      "pathNodeId": "node-door-room-01",
      "roomType": "standard",
      "maxPatients": 1,
      "traumaCapable": false,
      "isolationCapable": false,
      "doorPoint": {
        "x": 10,
        "y": 14
      },
      "roomOperationalMetadata": {
        "roomNumber": "01",
        "roomClass": "standard",
        "capacityCategory": "single",
        "traumaAdjacent": false,
        "isolationReady": false,
        "behavioralReady": false,
        "sitterCapable": false,
        "lineOfSightLevel": "moderate"
      }
    },
    {
      "id": "room-02",
      "label": "Room 02",
      "x": 20,
      "y": 4,
      "widthFeet": 14,
      "lengthFeet": 12,
      "zoneId": "zone-pod-a",
      "nearestStationId": "station-primary",
      "pathNodeId": "node-door-room-02",
      "roomType": "trauma",
      "maxPatients": 1,
      "traumaCapable": true,
      "isolationCapable": false,
      "doorPoint": {
        "x": 27,
        "y": 16
      },
      "roomOperationalMetadata": {
        "roomNumber": "02",
        "roomClass": "trauma",
        "capacityCategory": "single",
        "traumaAdjacent": true,
        "isolationReady": false,
        "behavioralReady": false,
        "sitterCapable": true,
        "lineOfSightLevel": "high"
      },
      "adjacencyOperationalMetadata": {
        "traumaAdjacencyLevel": "direct",
        "behavioralAdjacencyLevel": "none",
        "lineOfSightLevel": "high",
        "nearbySupportZoneIds": [
          "zone-trauma",
          "zone-storage"
        ],
        "nearbyProviderZoneId": "zone-pod-a",
        "nearbyMedicationZoneId": null
      }
    },
    {
      "id": "room-03",
      "label": "Room 03",
      "x": 38,
      "y": 4,
      "widthFeet": 12,
      "lengthFeet": 10,
      "zoneId": "zone-pod-a",
      "nearestStationId": "station-primary",
      "pathNodeId": "node-door-room-03",
      "roomType": "isolation",
      "maxPatients": 1,
      "traumaCapable": false,
      "isolationCapable": true,
      "doorPoint": {
        "x": 44,
        "y": 14
      },
      "roomOperationalMetadata": {
        "roomNumber": "03",
        "roomClass": "isolation",
        "capacityCategory": "single",
        "traumaAdjacent": false,
        "isolationReady": true,
        "behavioralReady": false,
        "sitterCapable": false,
        "lineOfSightLevel": "moderate"
      }
    },
    {
      "id": "room-04",
      "label": "Room 04",
      "x": 54,
      "y": 4,
      "widthFeet": 12,
      "lengthFeet": 10,
      "zoneId": "zone-pod-a",
      "nearestStationId": "station-primary",
      "pathNodeId": "node-door-room-04",
      "roomType": "psych",
      "maxPatients": 1,
      "traumaCapable": false,
      "isolationCapable": false,
      "doorPoint": {
        "x": 60,
        "y": 14
      },
      "roomOperationalMetadata": {
        "roomNumber": "04",
        "roomClass": "behavioral",
        "capacityCategory": "single",
        "traumaAdjacent": false,
        "isolationReady": false,
        "behavioralReady": true,
        "sitterCapable": true,
        "lineOfSightLevel": "high"
      },
      "adjacencyOperationalMetadata": {
        "traumaAdjacencyLevel": "near",
        "behavioralAdjacencyLevel": "direct",
        "lineOfSightLevel": "high",
        "nearbySupportZoneIds": [
          "zone-hallway"
        ],
        "nearbyProviderZoneId": "zone-pod-a",
        "nearbyMedicationZoneId": null
      }
    },
    {
      "id": "room-05",
      "label": "Room 05",
      "x": 4,
      "y": 34,
      "widthFeet": 12,
      "lengthFeet": 10,
      "zoneId": "zone-pod-a",
      "nearestStationId": "station-primary",
      "pathNodeId": "node-door-room-05",
      "roomType": "procedure",
      "maxPatients": 1,
      "traumaCapable": false,
      "isolationCapable": false,
      "doorPoint": {
        "x": 10,
        "y": 34
      },
      "roomOperationalMetadata": {
        "roomNumber": "05",
        "roomClass": "procedure",
        "capacityCategory": "single",
        "traumaAdjacent": false,
        "isolationReady": false,
        "behavioralReady": false,
        "sitterCapable": false,
        "lineOfSightLevel": "moderate"
      }
    },
    {
      "id": "room-06",
      "label": "Room 06",
      "x": 20,
      "y": 34,
      "widthFeet": 12,
      "lengthFeet": 10,
      "zoneId": "zone-pod-a",
      "nearestStationId": "station-primary",
      "pathNodeId": "node-door-room-06",
      "roomType": "overflow",
      "maxPatients": 1,
      "traumaCapable": false,
      "isolationCapable": false,
      "doorPoint": {
        "x": 26,
        "y": 34
      },
      "roomOperationalMetadata": {
        "roomNumber": "06",
        "roomClass": "overflow",
        "capacityCategory": "overflow",
        "traumaAdjacent": false,
        "isolationReady": false,
        "behavioralReady": false,
        "sitterCapable": false,
        "lineOfSightLevel": "low"
      },
      "overflowOperationalMetadata": {
        "overflowClass": "surge_space",
        "visibilityLevel": "low",
        "privacyConstraint": "moderate",
        "portableMonitorNeeded": true,
        "turnoverComplexity": "high",
        "nearbyHallwayId": "hallway-main",
        "nearbyStationId": "station-primary"
      }
    },
    {
      "id": "hall-bed-01",
      "label": "Hall Bed 01",
      "x": 52,
      "y": 23,
      "widthFeet": 10,
      "lengthFeet": 6,
      "zoneId": "zone-hallway",
      "nearestStationId": "station-primary",
      "pathNodeId": "node-door-hall-bed-01",
      "roomType": "hall_bed",
      "maxPatients": 1,
      "traumaCapable": false,
      "isolationCapable": false,
      "doorPoint": {
        "x": 52,
        "y": 26
      },
      "roomOperationalMetadata": {
        "roomNumber": "Hall Bed 01",
        "roomClass": "hall_bed",
        "capacityCategory": "hall",
        "traumaAdjacent": false,
        "isolationReady": false,
        "behavioralReady": false,
        "sitterCapable": true,
        "lineOfSightLevel": "moderate"
      },
      "overflowOperationalMetadata": {
        "overflowClass": "hall_bed",
        "visibilityLevel": "moderate",
        "privacyConstraint": "high",
        "portableMonitorNeeded": true,
        "turnoverComplexity": "normal",
        "nearbyHallwayId": "hallway-main",
        "nearbyStationId": "station-primary"
      },
      "adjacencyOperationalMetadata": {
        "traumaAdjacencyLevel": "near",
        "behavioralAdjacencyLevel": "near",
        "lineOfSightLevel": "moderate",
        "nearbySupportZoneIds": [
          "zone-hallway"
        ],
        "nearbyProviderZoneId": "zone-pod-a",
        "nearbyMedicationZoneId": null
      }
    }
  ],
  "hallways": [
    {
      "id": "hallway-main",
      "label": "Main Hallway",
      "widthFeet": 10,
      "points": [
        {
          "x": 0,
          "y": 24
        },
        {
          "x": 86,
          "y": 24
        }
      ],
      "hallwayOperationalMetadata": {
        "hallwayClass": "main",
        "allowsBedMovement": true,
        "allowsPublicTraffic": true,
        "staffOnly": false,
        "congestionLevel": "moderate",
        "bottleneck": false,
        "throughRoute": true
      }
    },
    {
      "id": "hallway-ems-entry",
      "label": "EMS Entry Hallway",
      "widthFeet": 8,
      "points": [
        {
          "x": 8,
          "y": 50
        },
        {
          "x": 8,
          "y": 24
        }
      ],
      "hallwayOperationalMetadata": {
        "hallwayClass": "ems",
        "allowsBedMovement": true,
        "allowsPublicTraffic": false,
        "staffOnly": false,
        "congestionLevel": "low",
        "bottleneck": false,
        "throughRoute": true
      }
    }
  ],
  "doors": [
    {
      "id": "door-room-01",
      "label": "Door Room 01",
      "roomId": "room-01",
      "x": 10,
      "y": 14,
      "widthFeet": 3,
      "pathNodeId": "node-door-room-01",
      "doorOperationalMetadata": {
        "doorClass": "standard",
        "swingDirection": "unknown",
        "accessRestriction": "none",
        "isolationBoundary": false,
        "behavioralBoundary": false,
        "traumaAccess": false,
        "delayCategory": "none"
      }
    },
    {
      "id": "door-room-02",
      "label": "Door Room 02",
      "roomId": "room-02",
      "x": 27,
      "y": 16,
      "widthFeet": 4,
      "pathNodeId": "node-door-room-02",
      "doorOperationalMetadata": {
        "doorClass": "isolation",
        "swingDirection": "in",
        "accessRestriction": "controlled",
        "isolationBoundary": true,
        "behavioralBoundary": false,
        "traumaAccess": false,
        "delayCategory": "low"
      }
    },
    {
      "id": "door-room-03",
      "label": "Door Room 03",
      "roomId": "room-03",
      "x": 44,
      "y": 14,
      "widthFeet": 3,
      "pathNodeId": "node-door-room-03",
      "doorOperationalMetadata": {
        "doorClass": "behavioral",
        "swingDirection": "out",
        "accessRestriction": "controlled",
        "isolationBoundary": false,
        "behavioralBoundary": true,
        "traumaAccess": false,
        "delayCategory": "moderate"
      }
    },
    {
      "id": "door-room-04",
      "label": "Door Room 04",
      "roomId": "room-04",
      "x": 60,
      "y": 14,
      "widthFeet": 3,
      "pathNodeId": "node-door-room-04",
      "doorOperationalMetadata": {
        "doorClass": "trauma",
        "swingDirection": "sliding",
        "accessRestriction": "none",
        "isolationBoundary": false,
        "behavioralBoundary": false,
        "traumaAccess": true,
        "delayCategory": "low"
      }
    },
    {
      "id": "door-room-05",
      "label": "Door Room 05",
      "roomId": "room-05",
      "x": 10,
      "y": 34,
      "widthFeet": 3,
      "pathNodeId": "node-door-room-05",
      "doorOperationalMetadata": {
        "doorClass": "standard",
        "swingDirection": "unknown",
        "accessRestriction": "none",
        "isolationBoundary": false,
        "behavioralBoundary": false,
        "traumaAccess": false,
        "delayCategory": "none"
      }
    },
    {
      "id": "door-room-06",
      "label": "Door Room 06",
      "roomId": "room-06",
      "x": 26,
      "y": 34,
      "widthFeet": 3,
      "pathNodeId": "node-door-room-06",
      "doorOperationalMetadata": {
        "doorClass": "standard",
        "swingDirection": "unknown",
        "accessRestriction": "staff_only",
        "isolationBoundary": false,
        "behavioralBoundary": false,
        "traumaAccess": false,
        "delayCategory": "low"
      }
    },
    {
      "id": "door-hall-bed-01",
      "label": "Hall Bed Entry",
      "roomId": "hall-bed-01",
      "x": 52,
      "y": 26,
      "widthFeet": 4,
      "pathNodeId": "node-door-hall-bed-01",
      "doorOperationalMetadata": {
        "doorClass": "standard",
        "swingDirection": "unknown",
        "accessRestriction": "none",
        "isolationBoundary": false,
        "behavioralBoundary": false,
        "traumaAccess": false,
        "delayCategory": "none"
      }
    }
  ],
  "nurseStations": [
    {
      "id": "station-primary",
      "label": "Primary Nurse Station",
      "x": 68,
      "y": 18,
      "widthFeet": 14,
      "lengthFeet": 10,
      "pathNodeId": "node-station-primary",
      "stationType": "primary",
      "stationOperationalMetadata": {
        "stationClass": "primary",
        "supportsChargeNurse": true,
        "supportsPrimaryNurse": true,
        "supportsProvider": true,
        "supportsTriage": false,
        "visibilityLevel": "high",
        "defaultWalkingOrigin": true
      }
    }
  ],
  "zones": [
    {
      "id": "zone-pod-a",
      "label": "Pod A",
      "color": "#4f8a67",
      "x": 0,
      "y": 0,
      "widthFeet": 86,
      "lengthFeet": 48,
      "zoneType": "provider_area",
      "travelBlocked": false,
      "travelPenalty": 1.2,
      "zoneOperationalMetadata": {
        "zoneClass": "patient_care",
        "publicAccess": false,
        "staffOnly": false,
        "supportsPatientFlow": true,
        "supportsClinicalOperations": true
      }
    },
    {
      "id": "zone-hallway",
      "label": "Hallway Zone",
      "color": "#8aa0ad",
      "x": 0,
      "y": 18,
      "widthFeet": 86,
      "lengthFeet": 12,
      "zoneType": "hallway",
      "travelBlocked": false,
      "travelPenalty": 1,
      "zoneOperationalMetadata": {
        "zoneClass": "support",
        "publicAccess": true,
        "staffOnly": false,
        "supportsPatientFlow": true,
        "supportsClinicalOperations": false
      }
    },
    {
      "id": "zone-trauma",
      "label": "Trauma Zone",
      "color": "#c85f5f",
      "x": 54,
      "y": 0,
      "widthFeet": 32,
      "lengthFeet": 24,
      "zoneType": "trauma_zone",
      "travelBlocked": false,
      "travelPenalty": 1.1,
      "zoneOperationalMetadata": {
        "zoneClass": "patient_care",
        "publicAccess": false,
        "staffOnly": false,
        "supportsPatientFlow": true,
        "supportsClinicalOperations": true
      }
    },
    {
      "id": "zone-ems",
      "label": "EMS Entry",
      "color": "#b46b33",
      "x": 0,
      "y": 50,
      "widthFeet": 20,
      "lengthFeet": 12,
      "zoneType": "ems_entry",
      "travelBlocked": false,
      "travelPenalty": 1.2,
      "zoneOperationalMetadata": {
        "zoneClass": "entry",
        "publicAccess": false,
        "staffOnly": false,
        "supportsPatientFlow": true,
        "supportsClinicalOperations": true
      }
    },
    {
      "id": "zone-storage",
      "label": "Supply Storage",
      "color": "#6e7c91",
      "x": 68,
      "y": 34,
      "widthFeet": 12,
      "lengthFeet": 10,
      "zoneType": "supply_storage",
      "travelBlocked": true,
      "travelPenalty": 1.2,
      "zoneOperationalMetadata": {
        "zoneClass": "storage",
        "publicAccess": false,
        "staffOnly": true,
        "supportsPatientFlow": false,
        "supportsClinicalOperations": true
      }
    }
  ],
  "pathNodes": [
    {
      "id": "node-door-room-01",
      "x": 10,
      "y": 16,
      "linkedObjectId": "door-room-01",
      "nodeType": "room_door"
    },
    {
      "id": "node-door-room-02",
      "x": 27,
      "y": 18,
      "linkedObjectId": "door-room-02",
      "nodeType": "room_door"
    },
    {
      "id": "node-door-room-03",
      "x": 44,
      "y": 16,
      "linkedObjectId": "door-room-03",
      "nodeType": "room_door"
    },
    {
      "id": "node-door-room-04",
      "x": 60,
      "y": 16,
      "linkedObjectId": "door-room-04",
      "nodeType": "room_door"
    },
    {
      "id": "node-door-room-05",
      "x": 10,
      "y": 32,
      "linkedObjectId": "door-room-05",
      "nodeType": "room_door"
    },
    {
      "id": "node-door-room-06",
      "x": 26,
      "y": 32,
      "linkedObjectId": "door-room-06",
      "nodeType": "room_door"
    },
    {
      "id": "node-door-hall-bed-01",
      "x": 52,
      "y": 26,
      "linkedObjectId": "door-hall-bed-01",
      "nodeType": "room_door"
    },
    {
      "id": "node-hall-west",
      "x": 8,
      "y": 24,
      "linkedObjectId": "hallway-main",
      "nodeType": "hallway"
    },
    {
      "id": "node-hall-mid",
      "x": 36,
      "y": 24,
      "linkedObjectId": "hallway-main",
      "nodeType": "hallway"
    },
    {
      "id": "node-hall-east",
      "x": 64,
      "y": 24,
      "linkedObjectId": "hallway-main",
      "nodeType": "hallway"
    },
    {
      "id": "node-station-primary",
      "x": 68,
      "y": 24,
      "linkedObjectId": "station-primary",
      "nodeType": "station"
    },
    {
      "id": "node-ems-entry",
      "x": 8,
      "y": 50,
      "linkedObjectId": null,
      "nodeType": "entry",
      "entryOperationalMetadata": {
        "entryClass": "ems",
        "preferredFlowDirection": "inbound",
        "preferredTraumaZoneId": "zone-trauma",
        "linkedPathNodeId": "node-ems-entry"
      }
    },
    {
      "id": "node-zone-storage",
      "x": 68,
      "y": 34,
      "linkedObjectId": "zone-storage",
      "nodeType": "zone"
    }
  ],
  "pathEdges": [
    {
      "id": "edge-room-01-hall",
      "fromNodeId": "node-door-room-01",
      "toNodeId": "node-hall-west",
      "lengthFeet": 8,
      "hallwayWidthFeet": 10,
      "congestionFactor": 1,
      "doorPenaltySeconds": 4,
      "turnPenaltySeconds": 2,
      "blocked": false
    },
    {
      "id": "edge-room-02-hall",
      "fromNodeId": "node-door-room-02",
      "toNodeId": "node-hall-mid",
      "lengthFeet": 10,
      "hallwayWidthFeet": 10,
      "congestionFactor": 1.1,
      "doorPenaltySeconds": 6,
      "turnPenaltySeconds": 2,
      "blocked": false
    },
    {
      "id": "edge-room-03-hall",
      "fromNodeId": "node-door-room-03",
      "toNodeId": "node-hall-mid",
      "lengthFeet": 8,
      "hallwayWidthFeet": 10,
      "congestionFactor": 1,
      "doorPenaltySeconds": 5,
      "turnPenaltySeconds": 2,
      "blocked": false
    },
    {
      "id": "edge-room-04-hall",
      "fromNodeId": "node-door-room-04",
      "toNodeId": "node-hall-east",
      "lengthFeet": 8,
      "hallwayWidthFeet": 10,
      "congestionFactor": 1,
      "doorPenaltySeconds": 4,
      "turnPenaltySeconds": 2,
      "blocked": false
    },
    {
      "id": "edge-room-05-hall",
      "fromNodeId": "node-door-room-05",
      "toNodeId": "node-hall-west",
      "lengthFeet": 8,
      "hallwayWidthFeet": 10,
      "congestionFactor": 1,
      "doorPenaltySeconds": 4,
      "turnPenaltySeconds": 2,
      "blocked": false
    },
    {
      "id": "edge-room-06-hall",
      "fromNodeId": "node-door-room-06",
      "toNodeId": "node-hall-mid",
      "lengthFeet": 8,
      "hallwayWidthFeet": 10,
      "congestionFactor": 1,
      "doorPenaltySeconds": 4,
      "turnPenaltySeconds": 2,
      "blocked": false
    },
    {
      "id": "edge-hall-bed-hall",
      "fromNodeId": "node-door-hall-bed-01",
      "toNodeId": "node-hall-east",
      "lengthFeet": 4,
      "hallwayWidthFeet": 10,
      "congestionFactor": 1.2,
      "doorPenaltySeconds": 1,
      "turnPenaltySeconds": 1,
      "blocked": false
    },
    {
      "id": "edge-hall-west-mid",
      "fromNodeId": "node-hall-west",
      "toNodeId": "node-hall-mid",
      "lengthFeet": 28,
      "hallwayWidthFeet": 10,
      "congestionFactor": 1,
      "doorPenaltySeconds": 0,
      "turnPenaltySeconds": 1,
      "blocked": false
    },
    {
      "id": "edge-hall-mid-east",
      "fromNodeId": "node-hall-mid",
      "toNodeId": "node-hall-east",
      "lengthFeet": 28,
      "hallwayWidthFeet": 10,
      "congestionFactor": 1,
      "doorPenaltySeconds": 0,
      "turnPenaltySeconds": 1,
      "blocked": false
    },
    {
      "id": "edge-hall-east-station",
      "fromNodeId": "node-hall-east",
      "toNodeId": "node-station-primary",
      "lengthFeet": 6,
      "hallwayWidthFeet": 10,
      "congestionFactor": 1,
      "doorPenaltySeconds": 0,
      "turnPenaltySeconds": 1,
      "blocked": false
    },
    {
      "id": "edge-ems-hall",
      "fromNodeId": "node-ems-entry",
      "toNodeId": "node-hall-west",
      "lengthFeet": 26,
      "hallwayWidthFeet": 8,
      "congestionFactor": 1.1,
      "doorPenaltySeconds": 3,
      "turnPenaltySeconds": 2,
      "blocked": false
    }
  ],
  "description": "Synthetic Phase 2 ER pod layout for operational simulation.",
  "createdAt": "2026-05-22T00:00:00Z",
  "updatedAt": "2026-05-22T00:00:00Z"
} satisfies PlanContract;
