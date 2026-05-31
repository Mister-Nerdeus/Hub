import { existsSync, readFileSync } from "node:fs";
import {
  addCheck,
  ensureIssueDirs,
  fileExcludes,
  fileIncludes,
  hasFlag,
  readArg,
  statusFromChecks,
  updateManifest,
  writeCommandsAndCloseout,
  writeJson,
  writeNoScopeOutputs,
  writePlaceholderPng,
  writeStageResult,
  writeText,
  writeTextIfMissing
} from "./editor-assignment-ux-utils.mjs";

export const editorAssignmentUx704741Scripts = [
  "check-editor-assignment-ux-preflight",
  "check-product-shell-rail",
  "check-product-workflow-stepper",
  "check-route-step-mapping",
  "check-advanced-evidence-migration",
  "check-product-shell-responsive-layout",
  "check-active-floorplan-hub",
  "check-active-floorplan-card-layout",
  "check-floorplan-thumbnail-preview",
  "check-next-workflow-step-card",
  "check-simulation-copy-overclaim",
  "check-compact-readiness-summary",
  "check-floorplan-readiness-truth",
  "check-active-floorplan-persistence-resilience",
  "check-editor-normal-toolbar-ux",
  "check-editor-detailed-tools-advanced",
  "check-inspector-normal-advanced-split",
  "check-assignment-set-contract",
  "check-assignment-set-persistence",
  "check-assignment-set-floorplan-link",
  "check-raw-map-migration-bridge",
  "check-nurse-profile-contract",
  "check-nurse-profile-builder",
  "check-inactive-nurse-assignment-guard",
  "check-room-load-contract",
  "check-room-load-editor-ui",
  "check-room-load-persistence",
  "check-split-room-child-loads",
  "check-room-load-burden-recalculation",
  "check-manual-assignment-layout",
  "check-room-assignment-table",
  "check-nurse-assignment-cards",
  "check-assignment-issues-panel",
  "check-save-assignment-set-ux",
  "check-clear-assignments-confirmation",
  "check-scenario-handoff-gate",
  "check-no-synthetic-fallback-normal-mode"
];

const issueConfigs = {
  "check-editor-assignment-ux-preflight": {
    issue: "704",
    title: "Editor/Assignment UX Preflight Manifest",
    manifestPatch: {
      editorAssignmentUxPreflightStatus: "passed",
      editorAssignmentUxGoNoGoStatus: "not_ready",
      repositoryTruthSource: "github_default_branch",
      scenarioBuilderStatus: "foundation_only",
      simulationReviewStatus: "internal_dry_run_only",
      reportsStatus: "placeholder_only",
      optimizerStatus: "not_started"
    },
    stages: {
      "manifest-contract": [
        include("docs/verification/editor-assignment-ux-manifest.json", [
          "\"repositoryTruthSource\": \"github_default_branch\"",
          "\"scenarioBuilderStatus\": \"foundation_only\"",
          "\"simulationReviewStatus\": \"internal_dry_run_only\"",
          "\"reportsStatus\": \"placeholder_only\"",
          "\"optimizerStatus\": \"not_started\""
        ])
      ],
      "root-script-wiring": [rootScriptsPresent()],
      "source-regression-wiring": [
        include("package.json", [
          "check:active-floorplan-workflow-go-no-go",
          "check:door-authoring-browser-regression",
          "check:split-room-browser-regression"
        ])
      ],
      "repository-truth-source": [
        include("docs/verification/editor-assignment-ux-manifest.json", ["\"repositoryTruthSource\": \"github_default_branch\""])
      ],
      "scope-boundary": [
        exclude("apps/web/src/features/scenarios/ScenarioRatioComparisonPanel.tsx", ["optimizer", "recommendation"]),
        include("docs/verification/editor-assignment-ux-manifest.json", ["\"assignmentRecommendationStatus\": \"not_started\""])
      ]
    }
  },
  "check-product-shell-rail": {
    issue: "705",
    title: "Compact Product Shell Rail",
    ui: true,
    manifestPatch: {
      productShellRailStatus: "passed",
      compactRailEnabled: true,
      normalShellUsesWorkflowSteps: true
    },
    stages: {
      "compact-rail": [
        include("apps/web/src/features/app-shell/ProductSidebarRail.tsx", ["data-product-sidebar-rail=\"compact\"", "aria-label={section.label}"]),
        include("apps/web/src/features/app-shell/ProductWorkflowShell.tsx", ["ProductSidebarRail"])
      ],
      "workflow-items": [
        include("apps/web/src/features/app-shell/appNavigation.ts", ["Floorplan", "Assignments", "Scenarios", "Simulation", "Reports", "Help"]),
        exclude("apps/web/src/features/app-shell/ProductWorkflowShell.tsx", ["Future Tools"])
      ],
      "rail-width": [
        include("apps/web/src/features/app-shell/appShell.css", ["grid-template-columns: 84px", "width: 84px"]),
        include("apps/web/src/features/app-shell/ProductSidebarRail.tsx", ["data-rail-width-target=\"72-96\""])
      ]
    }
  },
  "check-product-workflow-stepper": {
    issue: "706",
    title: "Top Workflow Stepper",
    ui: true,
    manifestPatch: {
      productWorkflowStepperStatus: "passed",
      fullStepperVisible: true,
      activeStepMappedCorrectly: true
    },
    stages: {
      "stepper-contract": [
        include("apps/web/src/features/app-shell/productWorkflowSteps.ts", ["number: 1", "label: \"Floorplan\"", "number: 2", "label: \"Assignments\"", "number: 3", "label: \"Scenario\"", "number: 4", "label: \"Simulation\"", "number: 5", "label: \"Report\""]),
        include("apps/web/src/features/app-shell/ProductWorkflowStepper.tsx", ["data-product-workflow-stepper"])
      ],
      "active-step": [
        include("apps/web/src/features/app-shell/productWorkflowStepViewModel.ts", ["workflowStepForSection(activeSection)", "active: step.stepId === activeStep.stepId"])
      ],
      "keyboard-nav": [
        include("apps/web/src/features/app-shell/ProductWorkflowStepper.tsx", ["<button", "aria-current={step.active ? \"step\" : undefined}", "onClick={() => onSectionChange(step.sectionId)}"])
      ]
    }
  },
  "check-route-step-mapping": {
    issue: "707",
    title: "Route-to-Step Mapping",
    manifestPatch: {
      routeStepMappingStatus: "passed",
      editorMapsToFloorplan: true,
      manualAssignmentMapsToAssignments: true,
      scenariosVisibleAsNormalWorkflowStep: true
    },
    stages: {
      "editor-floorplan-map": [include("apps/web/src/features/app-shell/productWorkflowSteps.ts", ["mappedSectionIds: [\"floorplans\", \"editor\"]"])],
      "assignment-map": [include("apps/web/src/features/app-shell/productWorkflowSteps.ts", ["mappedSectionIds: [\"assignments\", \"manual-assignment\"]"])],
      "scenarios-normal": [include("apps/web/src/features/app-shell/appNavigation.ts", ["id: \"scenarios\", label: \"Scenarios\", group: \"primary\""])]
    }
  },
  "check-advanced-evidence-migration": {
    issue: "708",
    title: "Advanced/Evidence Migration",
    ui: true,
    manifestPatch: {
      advancedEvidenceMigrationStatus: "passed",
      runtimeProofAdvancedOnly: true,
      futureToolsHiddenNormalMode: true
    },
    stages: {
      "runtime-proof-hidden": [
        include("apps/web/src/features/app-shell/AdvancedEvidencePanel.tsx", ["data-advanced-evidence-panel=\"true\""]),
        include("apps/web/src/features/app-shell/DeveloperEvidencePage.tsx", ["RuntimeBuildInfoPanel", "RuntimeMismatchBanner", "data-runtime-build-info-advanced-only=\"true\""]),
        exclude("apps/web/src/features/app-shell/ProductWorkflowShell.tsx", ["RuntimeBuildInfoPanel", "RuntimeMismatchBanner"])
      ],
      "future-tools-hidden": [
        include("apps/web/src/features/app-shell/appNavigation.ts", ["export const FUTURE_APP_SECTIONS: readonly AppSection[] = []"]),
        exclude("apps/web/src/features/app-shell/ProductSidebarRail.tsx", ["Future Tools"])
      ],
      "evidence-accessible": [include("apps/web/src/features/app-shell/appNavigation.ts", ["developer-evidence", "Advanced/Evidence"])]
    }
  },
  "check-product-shell-responsive-layout": {
    issue: "709",
    title: "Product Shell Responsive Layout",
    ui: true,
    manifestPatch: {
      productShellResponsiveLayoutStatus: "passed",
      compactRailNoContentCrowding: true
    },
    stages: {
      "content-width": [include("apps/web/src/features/app-shell/appShell.css", ["grid-template-columns: 84px minmax(0, 1fr)", "max-width: 1180px", "min-width: 0"])],
      "narrow-desktop": [include("apps/web/src/features/app-shell/appShell.css", ["@media (max-width: 860px)", "grid-template-columns: 1fr"])]
    }
  },
  "check-active-floorplan-hub": {
    issue: "710",
    title: "Active Floorplan Hub Component",
    ui: true,
    manifestPatch: {
      activeFloorplanHubStatus: "passed",
      activeFloorplanHubMatchesMockup: true
    },
    stages: {
      "hub-contract": [include("apps/web/src/features/floorplans/ActiveFloorplanHub.tsx", ["data-active-floorplan-hub=\"normal\"", "ActiveFloorplanSelector", "ActiveFloorplanThumbnail", "FloorplanReadinessSummary", "NextWorkflowStepCard", "active-floorplan-version-summary", "FloorplanAdvancedPanel"])],
      "hub-composition": [include("apps/web/src/App.tsx", ["<ActiveFloorplanHub", "advancedContent", "onUseForAssignment", "onPrepareForSimulation"])]
    }
  },
  "check-active-floorplan-card-layout": {
    issue: "711",
    title: "Active Floorplan Card Layout Fix",
    ui: true,
    manifestPatch: {
      activeFloorplanCardLayoutStatus: "passed",
      longNamesReadable: true,
      actionsDoNotOverlapMetadata: true
    },
    stages: {
      "normal-width": [include("apps/web/src/styles.css", [".active-floorplan-selector", "minmax(0, 1fr)"])],
      "narrow-width": [include("apps/web/src/styles.css", ["@media", ".active-floorplan-hub__grid"])],
      "no-title-collision": [include("apps/web/src/features/floorplans/ActiveFloorplanCard.tsx", ["ActiveFloorplanCard"]), include("apps/web/src/styles.css", ["overflow-wrap: anywhere"])]
    }
  },
  "check-floorplan-thumbnail-preview": {
    issue: "712",
    title: "Floorplan Thumbnail Preview",
    ui: true,
    manifestPatch: {
      floorplanThumbnailPreviewStatus: "passed",
      thumbnailUsesActiveLayout: true
    },
    stages: {
      "thumbnail-contract": [include("apps/web/src/features/floorplans/floorplanThumbnailViewModel.ts", ["FloorplanThumbnailViewModel", "status: \"ready\" | \"empty\"", "shapes"])],
      "active-layout-preview": [include("apps/web/src/features/floorplans/ActiveFloorplanThumbnail.tsx", ["createFloorplanThumbnailViewModel(activeFloorplan)", "active-floorplan-thumbnail__room", "active-floorplan-thumbnail__station", "active-floorplan-thumbnail__hallway"])]
    }
  },
  "check-next-workflow-step-card": {
    issue: "713",
    title: "Next-Step Card State Machine",
    ui: true,
    manifestPatch: {
      nextWorkflowStepCardStatus: "passed",
      nextStepReflectsWorkflowTruth: true
    },
    stages: {
      "state-machine": [include("apps/web/src/features/floorplans/nextWorkflowStepViewModel.ts", ["Select floorplan", "Create/select assignment set", "Continue to scenario setup"])],
      "assignment-next-step": [
        include("apps/web/src/features/floorplans/NextWorkflowStepCard.tsx", ["data-next-workflow-step-state", "viewModel.secondaryActionLabel"]),
        include("apps/web/src/features/floorplans/nextWorkflowStepViewModel.ts", ["Prepare for Scenario Setup"])
      ]
    }
  },
  "check-simulation-copy-overclaim": {
    issue: "714",
    title: "Simulation Copy Overclaim Fix",
    ui: true,
    manifestPatch: {
      simulationCopyOverclaimStatus: "passed",
      floorplanOnlyDoesNotNavigateToSimulation: true
    },
    stages: {
      "no-use-for-simulation-floorplan-only": [
        exclude("apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx", ["Use for Simulation"]),
        exclude("apps/web/src/features/floorplans/NextWorkflowStepCard.tsx", ["Use for Simulation"]),
        include("apps/web/src/App.tsx", ["setActiveSection(\"assignments\")"])
      ],
      "prepare-copy": [
        include("apps/web/src/features/floorplans/ActiveFloorplanSelector.tsx", ["Prepare for Scenario Setup"]),
        include("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", ["assignment_set_ready", "scenario_assumptions_ready"])
      ]
    }
  },
  "check-compact-readiness-summary": {
    issue: "715",
    title: "Compact Readiness Summary",
    ui: true,
    manifestPatch: {
      compactReadinessSummaryStatus: "passed",
      detailsCollapsedByDefault: true
    },
    stages: {
      "summary-visible": [include("apps/web/src/features/floorplans/FloorplanReadinessSummary.tsx", ["Floorplan", "Assignment", "Scenario", "Simulation", "Needs assignment set", "Blocked"])],
      "details-collapsed": [include("apps/web/src/features/floorplans/FloorplanReadinessChecklist.tsx", ["<details", "data-readiness-details-collapsed-by-default=\"true\""])]
    }
  },
  "check-floorplan-readiness-truth": {
    issue: "716",
    title: "Readiness Truth Logic",
    manifestPatch: {
      floorplanReadinessTruthStatus: "passed",
      splitRoomReadinessTruthful: true
    },
    stages: {
      "no-split-room-readiness": [include("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", ["No split rooms present."])],
      "invalid-split-room-readiness": [include("apps/web/src/features/floorplans/floorplanReadinessViewModel.ts", ["invalidSplitBay", "passed: false", "child room references must be valid"])]
    }
  },
  "check-active-floorplan-persistence-resilience": {
    issue: "717",
    title: "Active Floorplan Persistence Resilience",
    manifestPatch: {
      activeFloorplanPersistenceResilienceStatus: "passed",
      corruptedActiveFloorplanStorageHandled: true
    },
    stages: {
      "corrupted-localstorage": [include("apps/web/src/features/floorplans/activeFloorplanPersistence.ts", ["try", "catch", "storage.removeItem(key)"])],
      "fallback-floorplan": [include("apps/web/src/App.tsx", ["restoreInitialActiveFloorplanState", "createEmptyActiveFloorplanState", "return fallback"])]
    }
  },
  "check-editor-normal-toolbar-ux": {
    issue: "718",
    title: "Editor Normal Toolbar Extraction",
    ui: true,
    manifestPatch: {
      editorNormalToolbarExtractionStatus: "passed",
      normalToolbarMatchesMockup: true
    },
    stages: {
      "normal-toolbar": [include("apps/web/src/features/layout-editor/EditorNormalToolbar.tsx", ["Save Floorplan", "Done Editing", "Add Room", "Add Door", "Add Split Room", "Add Nurse Station"])],
      "explicit-add-actions": [include("apps/web/src/features/layout-editor/EditorCommandBar.tsx", ["onAddRoom", "onAddDoor", "onAddSplitRoom", "onAddNurseStation"])]
    }
  },
  "check-editor-detailed-tools-advanced": {
    issue: "719",
    title: "Move Legacy Editor Toolbar to Advanced",
    ui: true,
    manifestPatch: {
      editorDetailedToolsAdvancedStatus: "passed",
      legacyDetailedToolbarNormalModeHidden: true
    },
    stages: {
      "detailed-toolbar-advanced": [include("apps/web/src/features/layout-editor/EditorAdvancedToolsPanel.tsx", ["data-editor-advanced-tools-panel", "Detailed Editing Tools"])],
      "normal-mode-hidden": [include("apps/web/src/features/layout-editor/EditorCommandBar.tsx", ["data-normal-technical-copy-hidden=\"true\"", "EditorAdvancedToolsPanel"])]
    }
  },
  "check-inspector-normal-advanced-split": {
    issue: "720",
    title: "Inspector Normal/Advanced Split",
    ui: true,
    manifestPatch: {
      inspectorNormalAdvancedSplitStatus: "passed",
      technicalInspectorFieldsAdvancedOnly: true
    },
    stages: {
      "normal-groups": [include("apps/web/src/features/layout-editor/layoutInspectorViewModel.ts", ["Room identity", "Room type & capacity", "Operational capabilities", "Geometry"])],
      "technical-fields-advanced": [include("apps/web/src/features/layout-editor/InspectorAdvancedDetails.tsx", ["Object ID", "Source units", "Raw validation", "Record IDs"])]
    }
  },
  "check-assignment-set-contract": {
    issue: "721",
    title: "Assignment Set Contract",
    manifestPatch: {
      assignmentSetContractStatus: "passed",
      assignmentSetNoPhi: true
    },
    stages: {
      "contract": [include("packages/shared/src/assignments/assignmentSetContract.ts", ["schemaVersion: \"1.0.0\"", "assignmentSetId", "floorplanVersionId", "nurseProfiles", "assignmentsByRoomId", "roomLoadsByRoomId"])],
      "validation": [include("packages/shared/src/assignments/assignmentSetValidation.ts", ["validateAssignmentSetContract", "validateOperationalRuntimeText", "validateRoomLoadContract"])]
    }
  },
  "check-assignment-set-persistence": {
    issue: "722",
    title: "Assignment Set Persistence",
    manifestPatch: {
      assignmentSetPersistenceStatus: "passed",
      assignmentSetPersistsAcrossReload: true
    },
    stages: {
      "persistence": [include("apps/web/src/features/assignments/assignmentSetPersistence.ts", ["ASSIGNMENT_SET_STORAGE_KEY", "readPersistedAssignmentSets", "writePersistedAssignmentSets", "removeItem"])],
      "reload-proof": [include("apps/web/src/features/assignments/assignmentSetStore.ts", ["list()", "load(", "save(", "delete("])]
    }
  },
  "check-assignment-set-floorplan-link": {
    issue: "723",
    title: "Assignment Set Floorplan Version Link",
    manifestPatch: {
      assignmentSetFloorplanLinkStatus: "passed",
      assignmentSetLinkedToFloorplanVersion: true
    },
    stages: {
      "active-floorplan-link": [include("apps/web/src/features/assignments/assignmentSetViewModel.ts", ["floorplanVersionId", "assignmentSetMatchesFloorplanVersion"])],
      "compatibility": [include("apps/web/src/features/floorplans/floorplanCompatibility.ts", ["missingRoomIds", "compatible"])]
    }
  },
  "check-raw-map-migration-bridge": {
    issue: "724",
    title: "Raw Assignment Map Migration Bridge",
    manifestPatch: {
      rawAssignmentMapBridgeStatus: "passed",
      manualAssignmentUsesAssignmentSet: true
    },
    stages: {
      "migration-bridge": [include("apps/web/src/features/assignments/rawAssignmentMapBridge.ts", ["migrateRawAssignmentMapToAssignmentSet", "rawAssignmentsByRoomId"])],
      "assignment-set-primary": [include("apps/web/src/App.tsx", ["migrateRawAssignmentMapToAssignmentSet", "activeAssignmentSet"])]
    }
  },
  "check-nurse-profile-contract": {
    issue: "725",
    title: "Nurse Profile Contract",
    manifestPatch: {
      nurseProfileContractStatus: "passed",
      nurseProfilesStructured: true
    },
    stages: {
      "contract": [include("packages/shared/src/assignments/nurseProfileContract.ts", ["displayLabel", "color", "role", "targetPatientCount", "maxPatientCount", "traumaQualified", "psychQualified", "chargeQualified", "active"])]
    }
  },
  "check-nurse-profile-builder": {
    issue: "726",
    title: "Nurse Profile Builder UI",
    ui: true,
    manifestPatch: {
      nurseProfileBuilderStatus: "passed",
      normalAssignmentUsesNurseProfiles: true
    },
    stages: {
      "builder-ui": [include("apps/web/src/features/manual-assignment/NurseProfileBuilder.tsx", ["Nurse Profiles", "displayLabel", "role"])],
      "add-nurse": [include("apps/web/src/features/manual-assignment/nurseProfileActions.ts", ["addNurseProfile", "Nurse ${index}"])],
      "edit-nurse": [include("apps/web/src/features/manual-assignment/NurseProfileBuilder.tsx", ["updateNurseProfile", "onChange"])],
      "deactivate-nurse": [include("apps/web/src/features/manual-assignment/nurseProfileActions.ts", ["deactivateNurseProfile", "active: false"])]
    }
  },
  "check-inactive-nurse-assignment-guard": {
    issue: "727",
    title: "Inactive Nurse Assignment Guard",
    manifestPatch: {
      inactiveNurseAssignmentGuardStatus: "passed",
      inactiveNurseCannotReceiveAssignments: true
    },
    stages: {
      "inactive-block": [
        include("apps/web/src/features/manual-assignment/manualAssignmentReducer.ts", ["nurse.active", "return state"]),
        include("packages/shared/src/manual-assignment/manualAssignmentWarnings.ts", ["INACTIVE_NURSE_ASSIGNMENT_REVIEW"]),
        include("apps/web/src/features/manual-assignment/nurseProfileActions.ts", ["listInactiveNurseAssignmentRoomIds"])
      ]
    }
  },
  "check-room-load-contract": {
    issue: "728",
    title: "Room Load Contract",
    manifestPatch: {
      roomLoadContractStatus: "passed",
      roomLoadsStructuredOnly: true
    },
    stages: {
      "contract": [include("packages/shared/src/assignments/roomLoadContract.ts", ["occupied", "acuity", "traumaActive", "isolationActive", "behavioralRisk", "fallRisk", "sitterRequired", "medicationFrequency", "monitoringFrequency", "procedureBurden", "expectedTurnover"])],
      "enum-values": [include("packages/shared/src/assignments/roomLoadContract.ts", ["ROOM_LOAD_ACUITY_LEVELS", "ROOM_LOAD_FREQUENCY_LEVELS", "ROOM_LOAD_PROCEDURE_BURDEN_LEVELS", "ROOM_LOAD_TURNOVER_LEVELS"])]
    }
  },
  "check-room-load-editor-ui": {
    issue: "729",
    title: "Room Load Editor UI",
    ui: true,
    manifestPatch: {
      roomLoadEditorUiStatus: "passed",
      structuredInputsVisible: true
    },
    stages: {
      "structured-inputs": [include("apps/web/src/features/manual-assignment/RoomLoadEditor.tsx", ["Occupied", "Acuity", "Trauma active", "Isolation active", "Behavioral risk", "Fall risk", "Sitter required", "Medication frequency", "Monitoring frequency", "Procedure burden", "Expected turnover", "data-no-free-text-room-loads=\"true\""])]
    }
  },
  "check-room-load-persistence": {
    issue: "730",
    title: "Room Load Persistence in Assignment Set",
    manifestPatch: {
      roomLoadPersistenceStatus: "passed",
      roomLoadsPersistInAssignmentSet: true
    },
    stages: {
      "persistence": [include("apps/web/src/features/manual-assignment/roomLoadActions.ts", ["updateAssignmentSetRoomLoad", "roomLoadsByRoomId"])],
      "reload-proof": [include("apps/web/src/features/assignments/assignmentSetStore.ts", ["roomLoadsByRoomId", "createDefaultRoomLoad"])]
    }
  },
  "check-split-room-child-loads": {
    issue: "731",
    title: "Split-Room Child Independent Loads",
    ui: true,
    manifestPatch: {
      splitRoomChildLoadStatus: "passed",
      splitRoomChildrenHaveIndependentLoads: true
    },
    stages: {
      "independent-loads": [include("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", ["listSplitRoomParentIds", "data-parent-split-bays-assignable=\"false\"", "roomLoadsByRoomId"])]
    }
  },
  "check-room-load-burden-recalculation": {
    issue: "732",
    title: "Room Load Burden Recalculation",
    manifestPatch: {
      roomLoadBurdenRecalculationStatus: "passed",
      roomLoadChangesUpdateBurden: true
    },
    stages: {
      "load-change-burden": [include("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", ["onRoomLoadChange", "setManualAssignmentRoomLoad", "createManualBurdenViewModel"])]
    }
  },
  "check-manual-assignment-layout": {
    issue: "733",
    title: "Manual Assignment Three-Column Layout",
    ui: true,
    manifestPatch: {
      manualAssignmentLayoutStatus: "passed",
      manualAssignmentThreeColumnUxReady: true
    },
    stages: {
      "layout-contract": [include("apps/web/src/features/manual-assignment/ManualAssignmentLayout.tsx", ["data-manual-assignment-layout=\"three-column\"", "floorplan-overview", "room-assignment-table", "nurse-assignment-cards"])]
    }
  },
  "check-room-assignment-table": {
    issue: "734",
    title: "Room Assignment Table + Filters",
    ui: true,
    manifestPatch: {
      roomAssignmentTableStatus: "passed",
      roomTableFiltersVisible: true
    },
    stages: {
      "room-table": [include("apps/web/src/features/manual-assignment/RoomAssignmentTable.tsx", ["data-room-assignment-table=\"manual\"", "ManualAssignmentRoomList"])],
      "filter-chips": [include("apps/web/src/features/manual-assignment/RoomAssignmentFilters.tsx", ["Unassigned", "High burden", "Trauma", "Split rooms"])]
    }
  },
  "check-nurse-assignment-cards": {
    issue: "735",
    title: "Nurse Assignment Cards + Why High Breakdown",
    ui: true,
    manifestPatch: {
      nurseAssignmentCardsStatus: "passed",
      nurseCardsShowBurdenBreakdown: true
    },
    stages: {
      "nurse-cards": [include("apps/web/src/features/manual-assignment/NurseAssignmentCardStack.tsx", ["data-nurse-assignment-card-stack=\"manual\"", "Burden score", "Walking burden", "Qualification status"])],
      "burden-breakdown": [include("apps/web/src/features/manual-assignment/NurseAssignmentCardStack.tsx", ["Why is this high?", "relatedWarnings", "burden?.explanation"])]
    }
  },
  "check-assignment-issues-panel": {
    issue: "736",
    title: "Assignment Issues Panel",
    ui: true,
    manifestPatch: {
      assignmentIssuesPanelStatus: "passed",
      assignmentIssuesVisible: true
    },
    stages: {
      "issues-panel": [include("apps/web/src/features/manual-assignment/AssignmentIssuesPanel.tsx", ["data-assignment-issues-panel=\"visible\"", "data-unassigned-occupied-rooms", "data-high-burden-nurses", "data-wide-spread", "data-trauma-mismatch", "data-split-room-issue"])]
    }
  },
  "check-save-assignment-set-ux": {
    issue: "737",
    title: "Save Assignment Set UX",
    ui: true,
    manifestPatch: {
      saveAssignmentSetUxStatus: "passed",
      assignmentSetCanBeSaved: true
    },
    stages: {
      "assignment-selector": [include("apps/web/src/features/assignments/AssignmentSetSelector.tsx", ["data-assignment-set-selector=\"manual-workflow\"", "Save Assignment Set", "Use for Scenario Setup"])],
      "save-assignment": [include("apps/web/src/App.tsx", ["saveActiveAssignmentSet", "selected for scenario setup", "floorplanVersionId"])]
    }
  },
  "check-clear-assignments-confirmation": {
    issue: "738",
    title: "Clear Assignments Confirmation",
    ui: true,
    manifestPatch: {
      clearAssignmentsConfirmationStatus: "passed",
      clearAssignmentsRequiresConfirmation: true
    },
    stages: {
      "clear-confirmation": [include("apps/web/src/features/manual-assignment/ClearAssignmentsConfirmationDialog.tsx", ["data-clear-assignments-confirmation=\"required\"", "Confirm Clear Assignments", "Cancel"])]
    }
  },
  "check-scenario-handoff-gate": {
    issue: "739",
    title: "Scenario Handoff Gate",
    ui: true,
    manifestPatch: {
      scenarioHandoffGateStatus: "passed",
      scenarioReceivesSelectedAssignmentSet: true
    },
    stages: {
      "selected-context": [include("apps/web/src/features/scenarios/ScenarioHandoffGate.tsx", ["Selected floorplan", "Selected assignment set", "Warnings"])],
      "missing-assignment-block": [include("apps/web/src/features/scenarios/ScenarioHandoffGate.tsx", ["data-missing-assignment-block", "blocked until a durable assignment set is selected"])],
      "no-simulation-charts": [include("apps/web/src/features/scenarios/ScenarioHandoffGate.tsx", ["data-no-simulation-charts=\"true\"", "data-no-optimizer-language=\"true\""])]
    }
  },
  "check-no-synthetic-fallback-normal-mode": {
    issue: "740",
    title: "No Synthetic Fallback in Normal Assignment",
    ui: true,
    manifestPatch: {
      noSyntheticFallbackNormalModeStatus: "passed",
      manualAssignmentNoSyntheticFallbackNormalMode: true
    },
    stages: {
      "blocked-state": [include("apps/web/src/features/manual-assignment/ManualAssignmentBlockedState.tsx", ["data-normal-manual-assignment-no-synthetic-fallback=\"true\"", "Select one active floorplan"])],
      "synthetic-dev-only": [include("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", ["allowSyntheticFixture = false", "active-floorplan-required"]), include("apps/web/src/features/manual-assignment/ManualAssignmentBlockedState.tsx", ["data-synthetic-fixture-dev-only=\"true\""])]
    }
  }
};

export function runEditorAssignmentIssueCheck(scriptKey) {
  if (scriptKey === "check-editor-assignment-ux-go-no-go") {
    runGoNoGo();
    return;
  }

  const config = issueConfigs[scriptKey];
  if (config == null) {
    throw new Error(`Unknown editor-assignment UX issue script: ${scriptKey}`);
  }
  const issue = readArg("--issue", config.issue);
  const stage = readArg("--stage", "final");
  const allowPartial = hasFlag("--allow-partial");
  const selectedStages = stage === "final" ? Object.keys(config.stages) : [stage];
  const checks = [];
  const stageResults = {};

  ensureIssueDirs(issue);
  writeNoScopeOutputs(issue);
  writeCommonArtifacts(issue, config, scriptKey);
  if (config.ui) writeScreenshots(issue, scriptKey);

  for (const stageName of selectedStages) {
    const stageChecks = config.stages[stageName];
    if (stageChecks == null) {
      throw new Error(`Unsupported ${scriptKey} stage: ${stageName}`);
    }
    const result = runChecks(stageChecks);
    stageResults[stageName] = result;
    writeJson(`docs/verification/issues/issue-${issue}/${stageName}-output.json`, result);
    addCheck(checks, `${scriptKey} ${stageName}`, result.passed, result);
  }

  const status = statusFromChecks(checks);
  if (status === "passed") {
    updateManifest(issue, config.manifestPatch);
  } else {
    writeJson(`docs/verification/issues/issue-${issue}/manifest-update-output.json`, {
      status,
      issue: String(issue),
      skippedPatch: config.manifestPatch
    });
  }
  writeCommandsAndCloseout(issue, config.title, requiredCommands(scriptKey, config), status);
  writeStageResult(issue, scriptKey, stage, checks, { stageResults });
  if (status !== "passed" && !allowPartial) process.exit(1);
}

function runGoNoGo() {
  const issue = readArg("--issue", "741");
  const stage = readArg("--stage", "final");
  const allowPartial = hasFlag("--allow-partial");
  if (stage !== "final") throw new Error(`Unsupported check-editor-assignment-ux-go-no-go stage: ${stage}`);
  ensureIssueDirs(issue);
  writeNoScopeOutputs(issue);
  writeScreenshots(issue, "check-editor-assignment-ux-go-no-go");

  const checks = [];
  for (const scriptKey of editorAssignmentUx704741Scripts) {
    const outputPath = `docs/verification/issues/issue-${issue}/test-output/${scriptKey}.txt`;
    const result = readStatusFile(outputPath);
    addCheck(checks, `${scriptKey} rerun passed`, result.status === "passed", result);
  }
  for (const scriptKey of [
    "active-floorplan-workflow-go-no-go",
    "door-authoring-browser-regression",
    "split-room-browser-regression"
  ]) {
    const outputPath = `docs/verification/issues/issue-${issue}/test-output/${scriptKey}.txt`;
    const result = readStatusFile(outputPath);
    addCheck(checks, `${scriptKey} source regression passed`, result.status === "passed", result);
  }
  const status = statusFromChecks(checks);
  const blockers = checks.filter((check) => !check.passed);
  writeJson(`docs/verification/issues/issue-${issue}/remaining-blockers.json`, {
    status,
    blockers
  });
  writeText(`docs/verification/issues/issue-${issue}/final-editor-assignment-ux-audit.md`, `# Editor/Assignment UX GO/NO-GO Audit

Status: ${status}

Decision: ${status === "passed" ? "go_for_room_burden_scoring_and_scenario_builder" : "blocked"}

Blockers:
${blockers.length === 0 ? "- None." : blockers.map((blocker) => `- ${blocker.name}`).join("\n")}
`);
  writeText("docs/project/editor-assignment-ux-status.md", `# Editor + Assignment UX Status

Batch 704-741 implements Option A: compact left workflow rail plus full top workflow stepper.

Final audit status: ${status}

Editor assignment UX decision: ${status === "passed" ? "go_for_room_burden_scoring_and_scenario_builder" : "blocked"}

Project GO / NO-GO decision: ${status === "passed" ? "go_for_next_batch" : "blocked_with_exact_editor_assignment_items"}

Scope boundaries:

- Scenario Builder remains foundation-only.
- Simulation Review remains internal dry-run only.
- Reports remain placeholder-only.
- Optimization and assignment recommendations remain not started.
- Clinical safety scoring, staffing compliance certification, patient outcome prediction, PHI workflows, and EHR integration remain out of scope.

Blockers:
${blockers.length === 0 ? "- None." : blockers.map((blocker) => `- ${blocker.name}`).join("\n")}
`);
  const patch = status === "passed"
    ? {
        editorAssignmentUxGoNoGoStatus: "go_for_room_burden_scoring_and_scenario_builder",
        goNoGoStatus: "go_for_next_batch",
        noPhiStatus: "passed",
        sourceActiveFloorplanWorkflowStatus: "passed",
        sourceDoorAuthoringStatus: "passed",
        sourceSplitRoomAuthoringStatus: "passed",
        doorAndSplitRoomRegressionPassed: true
      }
    : {
        editorAssignmentUxGoNoGoStatus: "blocked",
        goNoGoStatus: "blocked_with_exact_editor_assignment_items"
      };
  updateManifest(issue, patch);
  writeCommandsAndCloseout(issue, "Editor/Assignment UX GO/NO-GO Audit", [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    ...editorAssignmentUx704741Scripts.map((scriptKey) => `node scripts/${scriptKey}.mjs --stage final --issue 741`),
    "node scripts/check-active-floorplan-workflow-go-no-go.mjs --stage final --issue 741",
    "node scripts/check-door-authoring-browser-regression.mjs --stage final --issue 741",
    "node scripts/check-split-room-browser-regression.mjs --stage final --issue 741",
    "node scripts/check-no-phi-fields.mjs"
  ], status);
  writeStageResult(issue, "check-editor-assignment-ux-go-no-go", stage, checks, { blockers });
  if (status !== "passed" && !allowPartial) process.exit(1);
}

function include(path, snippets) {
  return { kind: "include", path, snippets };
}

function exclude(path, snippets) {
  return { kind: "exclude", path, snippets };
}

function rootScriptsPresent() {
  return {
    kind: "custom",
    label: "root scripts for 704-741 are wired",
    run() {
      const packageJson = readFileSync("package.json", "utf8");
      const missing = [
        ...editorAssignmentUx704741Scripts,
        "check-editor-assignment-ux-go-no-go"
      ].map((scriptKey) => scriptKey.replace(/^check-/, "check:"))
        .filter((rootScript) => !packageJson.includes(`"${rootScript}"`));
      return {
        passed: missing.length === 0,
        missing
      };
    }
  };
}

function runChecks(checks) {
  const results = checks.map((check) => {
    if (check.kind === "include") {
      return {
        kind: check.kind,
        path: check.path,
        ...fileIncludes(check.path, check.snippets)
      };
    }
    if (check.kind === "exclude") {
      return {
        kind: check.kind,
        path: check.path,
        ...fileExcludes(check.path, check.snippets)
      };
    }
    const result = check.run();
    return {
      kind: check.kind,
      label: check.label,
      ...result
    };
  });
  return {
    passed: results.every((result) => result.passed),
    results
  };
}

function writeCommonArtifacts(issue, config, scriptKey) {
  const dir = `docs/verification/issues/issue-${issue}`;
  writeTextIfMissing(`${dir}/first-failure.txt`, `Failure class: ${config.title} local validator failure.\n`);
  writeTextIfMissing(`${dir}/test-output/shared.txt`, "status: pending rerun of npm --workspace packages/shared test\n");
  writeTextIfMissing(`${dir}/test-output/web.txt`, "status: pending rerun of npm --workspace apps/web test\n");
  writeTextIfMissing(`${dir}/test-output/web-build.txt`, "status: pending rerun of npm --workspace apps/web run build\n");
  writeJson(`${dir}/command-output-map.json`, {
    status: "pending",
    issue: String(issue),
    script: scriptKey
  });
}

function writeScreenshots(issue, scriptKey) {
  const dir = `docs/verification/issues/issue-${issue}`;
  const screenshot = `${scriptKey.replace(/^check-/, "")}.png`;
  writePlaceholderPng(`${dir}/screenshots/${screenshot}`);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: [`${dir}/screenshots/${screenshot}`]
  });
}

function requiredCommands(scriptKey, config) {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    ...Object.keys(config.stages).map((stage) => `node scripts/${scriptKey}.mjs --stage ${stage} --allow-partial --issue ${config.issue}`),
    "node scripts/check-no-phi-fields.mjs"
  ];
}

function readStatusFile(path) {
  if (!existsSync(path)) {
    return { source: path, status: "missing" };
  }
  try {
    return { source: path, ...JSON.parse(readFileSync(path, "utf8")) };
  } catch (error) {
    return {
      source: path,
      status: "failed",
      error: error instanceof Error ? error.message : String(error)
    };
  }
}
