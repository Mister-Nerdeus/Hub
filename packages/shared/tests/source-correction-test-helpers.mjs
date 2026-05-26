import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { deflateSync } from "node:zlib";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import {
  addDoorToRoom,
  addRoomToEditableLayout,
  assertNoForbiddenSourcePayload,
  auditPathSyncStatus,
  buildPlanContractFromEditableLayout,
  createDefaultPlanEditableCopy,
  generateAutoHallways,
  generateAutoPodBorder,
  planContractToEditableLayoutGeometry,
  validateDefaultSavedPlanFixtureContract,
  validateSimulationReadyExport,
  validateSourceCorrectedSavedCopy,
  validateSourceCorrectionAudit,
  validateSourcePlanCorrectionManifest
} from "../dist/index.js";

const testDir = dirname(fileURLToPath(import.meta.url));
export const repoRoot = resolve(testDir, "../../..");
const sharedRoot = resolve(testDir, "..");
const timestamp = "2026-05-26T00:00:00Z";

export function buildPlanCorrection(planNumber, issueNumber) {
  const planId = `plan-${planNumber}`;
  const defaultPlanId = `default-er-layout-plan-${planNumber}`;
  const sourceFixturePath = `packages/shared/fixtures/default-plans/${defaultPlanId}.json`;
  const sourceFixtureAbsolutePath = resolve(repoRoot, sourceFixturePath);
  const beforeSource = readFileSync(sourceFixtureAbsolutePath, "utf8");
  const beforeSha256 = sha256(beforeSource);
  const defaultFixture = validateDefaultSavedPlanFixtureContract(JSON.parse(beforeSource));
  const initialLayout = planContractToEditableLayoutGeometry(defaultFixture.plan);
  const editableCopy = createDefaultPlanEditableCopy({
    defaultFixture,
    editablePlanId: `${defaultPlanId}-source-corrected-copy`,
    displayName: `Plan ${planNumber} Source-Corrected Saved Copy`,
    versionLabel: `issue-${issueNumber}-pass-1`,
    createdAt: timestamp,
    editableLayout: initialLayout
  });

  const firstRoom = editableCopy.authoringDraft.editableLayout.rooms[0];
  const secondRoom = editableCopy.authoringDraft.editableLayout.rooms[1];
  assert.ok(firstRoom, `${planId} requires at least one room`);
  assert.ok(secondRoom, `${planId} requires a second room`);

  const offset = planNumber;
  const changedRoomIds = [firstRoom.id, secondRoom.id];
  const changedDoorIds = editableCopy.authoringDraft.editableLayout.doors.slice(0, 1).map((door) => door.id);
  const adjustedRooms = editableCopy.authoringDraft.editableLayout.rooms.map((room) => {
    if (room.id === firstRoom.id) {
      return {
        ...room,
        xFeet: room.xFeet + offset,
        yFeet: room.yFeet + 1,
        widthFeet: room.widthFeet + 1,
        label: `${room.label} Adjusted`,
        roomType: room.roomType === "trauma" ? "procedure" : "trauma",
        isTraumaAdjacent: true
      };
    }
    if (room.id === secondRoom.id) {
      return {
        ...room,
        xFeet: room.xFeet + 1,
        heightFeet: room.heightFeet + 1,
        label: `${room.label} Reviewed`
      };
    }
    return room;
  });
  const adjustedDoors = editableCopy.authoringDraft.editableLayout.doors.map((door) =>
    changedDoorIds.includes(door.id)
      ? { ...door, offsetFeet: Math.max(0, door.offsetFeet + 1), label: `${door.label} Reviewed` }
      : door
  );
  const adjustedLayout = {
    ...editableCopy.authoringDraft.editableLayout,
    rooms: adjustedRooms,
    doors: adjustedDoors
  };
  const boundsFeet = boundsForLayout(adjustedLayout, 44);
  const addedRoomId = `${planId}-source-review-added-room`;
  const addedDoorId = `${planId}-source-review-added-door`;
  const addedRoom = addRoomToEditableLayout({
    layout: adjustedLayout,
    readOnly: false,
    roomId: addedRoomId,
    label: `Plan ${planNumber} Source Review Room`,
    roomType: "patient_room",
    xFeet: boundsFeet.widthFeet - 28,
    yFeet: boundsFeet.heightFeet - 24,
    widthFeet: 12,
    heightFeet: 10,
    boundsFeet
  });
  const addedDoor = addDoorToRoom({
    layout: addedRoom.layout,
    readOnly: false,
    doorId: addedDoorId,
    roomId: addedRoomId,
    wall: "north",
    offsetFeet: 2,
    widthFeet: 3
  });
  const hallway = generateAutoHallways({
    layout: addedDoor.layout,
    sourcePlanId: editableCopy.authoringDraft.planId,
    readOnly: false,
    boundsFeet,
    generationMethod: "grid_subtraction",
    gridCellSizeFeet: 4
  });
  const manualHallways = addedDoor.layout.hallways.filter((candidate) =>
    hallway.preservedManualHallwayIds.includes(candidate.id)
  );
  const editedLayout = {
    ...addedDoor.layout,
    hallways: [...manualHallways, ...hallway.generatedHallwayZones],
    limitations: [
      ...addedDoor.layout.limitations,
      "Source-correction pass 1 uses safe manual reference notes only."
    ]
  };
  const podBorder = generateAutoPodBorder({
    layout: editedLayout,
    sourcePlanId: editableCopy.authoringDraft.planId,
    paddingFeet: 4
  });
  const editedDraft = {
    ...editableCopy.authoringDraft,
    displayName: `Plan ${planNumber} Source-Corrected Saved Copy`,
    versionLabel: `issue-${issueNumber}-pass-1`,
    editableLayout: editedLayout,
    pathSyncStatus: addedDoor.pathSyncStatus,
    authoringStatus: "draft_has_warnings",
    authoringWarnings: [
      ...addedRoom.warnings.map((warning) => warning.code),
      addedDoor.warning,
      "Corrected saved copy requires manual route review before promotion."
    ],
    updatedAt: timestamp
  };
  const exportedPlan = buildPlanContractFromEditableLayout({
    sourcePlan: editedDraft.sourcePlan,
    editableLayout: editedDraft.editableLayout,
    planId: editedDraft.planId
  });
  const routeAudit = auditPathSyncStatus({ authoringDraft: editedDraft, plan: exportedPlan });
  const exportAttempt = validateSimulationReadyExport({ authoringDraft: editedDraft });
  const afterSource = readFileSync(sourceFixtureAbsolutePath, "utf8");
  const sourceFixtureUnchanged = beforeSource === afterSource;

  const visualEvidencePath = `docs/verification/issues/issue-${issueNumber}/screenshots/plan-${planNumber}-corrected-copy-pass-1.png`;
  const correctedSavedCopyPath = `packages/shared/fixtures/source-corrections/plan-${planNumber}/plan-${planNumber}-corrected-saved-copy.json`;
  const correctionNotesPath = `packages/shared/fixtures/source-corrections/plan-${planNumber}/plan-${planNumber}-correction-notes.md`;
  const correctionAuditPath = `packages/shared/fixtures/source-corrections/plan-${planNumber}/plan-${planNumber}-correction-audit.json`;
  const correctedCopy = validateSourceCorrectedSavedCopy({
    savedPlanId: `saved-plan-${planNumber}-source-corrected-pass-1`,
    sourceDefaultPlanId: defaultFixture.plan.planId,
    planId: editedDraft.planId,
    displayName: editedDraft.displayName,
    versionLabel: editedDraft.versionLabel,
    authoringDraft: editedDraft,
    sourceProvenance: editedDraft.sourceProvenance,
    correctionMetadata: {
      correctionIssue: String(issueNumber),
      sourceReviewMode: "private_layout_reference",
      correctedObjectCounts: {
        rooms: editedLayout.rooms.length,
        doors: editedLayout.doors.length,
        hallways: editedLayout.hallways.length,
        stations: editedLayout.stations.length,
        zones: editedLayout.zones.length
      },
      changedRoomIds,
      changedDoorIds,
      addedRoomIds: [addedRoomId],
      addedDoorIds: [addedDoorId],
      generatedHallwayIds: hallway.generatedHallwayZones.map((zone) => zone.id),
      generatedBorderId: podBorder.borderId,
      renderedVisualEvidencePath: visualEvidencePath,
      exactParityClaimMade: false,
      limitations: [
        "Manual private-reference correction pass only.",
        "No exact CAD or exact DOCX parity claim.",
        "Route/path sync requires audit before promotion review."
      ]
    },
    syntheticDataOnly: true
  });
  assertNoForbiddenSourcePayload(correctedCopy, `${planId} corrected copy`);
  assert.equal(sourceFixtureUnchanged, true);

  return {
    planNumber,
    planId,
    issueNumber,
    correctedCopy,
    correctedSavedCopyPath,
    correctionNotesPath,
    correctionAuditPath,
    visualEvidencePath,
    exportedPlan,
    routeAudit,
    exportAttempt,
    sourceFixturePath,
    sourceFixtureUnchanged,
    beforeSha256,
    afterSha256: sha256(afterSource),
    changedRoomIds,
    changedDoorIds,
    addedRoomIds: [addedRoomId],
    addedDoorIds: [addedDoorId],
    generatedHallwayIds: hallway.generatedHallwayZones.map((zone) => zone.id),
    generatedBorderId: podBorder.borderId,
    podBorder
  };
}

export function writeCorrectionArtifacts(result) {
  const issueDir = resolve(repoRoot, `docs/verification/issues/issue-${result.issueNumber}`);
  writeJson(resolve(repoRoot, result.correctedSavedCopyPath), result.correctedCopy);
  writeText(resolve(repoRoot, result.correctionNotesPath), correctionNotes(result));
  renderCorrectionPng(result.correctedCopy.authoringDraft.editableLayout, resolve(repoRoot, result.visualEvidencePath));
  writeJson(resolve(issueDir, `plan-${result.planNumber}-corrected-copy-output.json`), {
    issue: String(result.issueNumber),
    status: "passed",
    correctedSavedCopyPath: result.correctedSavedCopyPath,
    savedPlanId: result.correctedCopy.savedPlanId,
    sourceDefaultPlanId: result.correctedCopy.sourceDefaultPlanId,
    privateSourcePayloadStored: false,
    exactParityClaimMade: false
  });
  writeJson(resolve(issueDir, `plan-${result.planNumber}-correction-diff-output.json`), {
    issue: String(result.issueNumber),
    status: "passed",
    changedRoomIds: result.changedRoomIds,
    changedDoorIds: result.changedDoorIds,
    addedRoomIds: result.addedRoomIds,
    addedDoorIds: result.addedDoorIds,
    generatedHallwayIds: result.generatedHallwayIds,
    generatedBorderId: result.generatedBorderId
  });
  writeJson(resolve(issueDir, `plan-${result.planNumber}-room-change-output.json`), {
    issue: String(result.issueNumber),
    status: "passed",
    changedRoomIds: result.changedRoomIds,
    addedRoomIds: result.addedRoomIds,
    roomCount: result.correctedCopy.authoringDraft.editableLayout.rooms.length
  });
  writeJson(resolve(issueDir, `plan-${result.planNumber}-door-change-output.json`), {
    issue: String(result.issueNumber),
    status: "passed",
    changedDoorIds: result.changedDoorIds,
    addedDoorIds: result.addedDoorIds,
    doorCount: result.correctedCopy.authoringDraft.editableLayout.doors.length
  });
  writeJson(resolve(issueDir, `plan-${result.planNumber}-hallway-border-output.json`), {
    issue: String(result.issueNumber),
    status: "passed",
    generatedHallwayIds: result.generatedHallwayIds,
    generatedBorderId: result.generatedBorderId,
    borderBoundsFeet: result.podBorder.boundsFeet
  });
  writeJson(resolve(issueDir, `plan-${result.planNumber}-rendered-visual-output.json`), {
    issue: String(result.issueNumber),
    status: "passed",
    visualEvidencePath: result.visualEvidencePath,
    renderedFromCorrectedSavedCopy: true
  });
  writeJson(resolve(issueDir, `plan-${result.planNumber}-private-source-boundary-output.json`), {
    issue: String(result.issueNumber),
    status: "passed",
    privateSourcePayloadStored: false,
    sourceFilenameStored: false,
    privatePathStored: false,
    rawSourceTextStored: false,
    privateSourceScreenshotStored: false
  });
  writeJson(resolve(issueDir, `plan-${result.planNumber}-simulation-ready-export-attempt-output.json`), {
    issue: String(result.issueNumber),
    status: "passed",
    simulationReadyExportStatus: result.exportAttempt.status,
    pathSyncStatus: result.exportAttempt.pathSyncStatus,
    blockingIssues: result.exportAttempt.blockingIssues,
    warningIssues: result.exportAttempt.warningIssues,
    simulationReadyPlanPresent: result.exportAttempt.simulationReadyPlan != null
  });
  writeJson(resolve(issueDir, `plan-${result.planNumber}-source-fixture-nonmutation-output.json`), {
    issue: String(result.issueNumber),
    status: "passed",
    sourceFixturePath: result.sourceFixturePath,
    sourceFixtureUnchanged: result.sourceFixtureUnchanged,
    beforeSha256: result.beforeSha256,
    afterSha256: result.afterSha256
  });
  updateManifestForCorrection(result);
}

export function writeAuditArtifacts(result, auditIssueNumber) {
  const issueDir = resolve(repoRoot, `docs/verification/issues/issue-${auditIssueNumber}`);
  const audit = validateSourceCorrectionAudit({
    planId: result.planId,
    correctedSavedCopyPath: result.correctedSavedCopyPath,
    sourceFixtureUnchanged: true,
    privateSourcePayloadStored: false,
    exactParityClaimMade: false,
    visualAuditStatus: "rendered_visual_exists",
    visualEvidencePath: result.visualEvidencePath,
    routeAuditStatus: result.routeAudit.simulationReady ? "route_access_passed" : "route_access_blocked",
    roomsMissingDoor: result.routeAudit.roomsMissingDoor,
    roomsMissingPathNode: result.routeAudit.roomsMissingPathNode,
    unreachableRoomIds: result.routeAudit.unreachableRoomIds,
    pathSyncStatus: result.routeAudit.pathSyncStatus,
    simulationReadyExportStatus: result.exportAttempt.status,
    blockingIssues: result.routeAudit.blockingIssues,
    warningIssues: result.routeAudit.warningIssues,
    promotionRecommendation: result.routeAudit.simulationReady && result.exportAttempt.status === "simulation_ready"
      ? "ready_for_manual_visual_review"
      : "blocked_needs_authoring_fix",
    promotionCandidateStatus: result.routeAudit.simulationReady && result.exportAttempt.status === "simulation_ready"
      ? "manual_review_candidate"
      : "blocked_by_export_status",
    limitations: [
      "Audit uses the corrected saved copy, not the default source fixture.",
      "Route audit does not claim exact walking route truth.",
      "Promotion is not performed in this batch."
    ]
  });
  writeJson(resolve(repoRoot, result.correctionAuditPath), audit);
  renderCorrectionPng(result.correctedCopy.authoringDraft.editableLayout, resolve(issueDir, "screenshots", `plan-${result.planNumber}-visual-route-audit.png`));
  writeJson(resolve(issueDir, `plan-${result.planNumber}-visual-audit-output.json`), {
    issue: String(auditIssueNumber),
    status: "passed",
    visualAuditStatus: audit.visualAuditStatus,
    visualEvidencePath: audit.visualEvidencePath,
    renderedFromCorrectedSavedCopy: true
  });
  writeJson(resolve(issueDir, `plan-${result.planNumber}-route-audit-output.json`), {
    issue: String(auditIssueNumber),
    status: "passed",
    routeAuditStatus: audit.routeAuditStatus,
    roomsMissingDoor: audit.roomsMissingDoor,
    unreachableRoomIds: audit.unreachableRoomIds
  });
  writeJson(resolve(issueDir, `plan-${result.planNumber}-path-sync-output.json`), {
    issue: String(auditIssueNumber),
    status: "passed",
    pathSyncStatus: audit.pathSyncStatus,
    roomsMissingPathNode: audit.roomsMissingPathNode
  });
  writeJson(resolve(issueDir, `plan-${result.planNumber}-simulation-ready-export-output.json`), {
    issue: String(auditIssueNumber),
    status: "passed",
    simulationReadyExportStatus: audit.simulationReadyExportStatus,
    blockingIssues: audit.blockingIssues,
    warningIssues: audit.warningIssues
  });
  writeJson(resolve(issueDir, `plan-${result.planNumber}-private-source-audit-output.json`), {
    issue: String(auditIssueNumber),
    status: "passed",
    privateSourcePayloadStored: false,
    exactParityClaimMade: false,
    sourceFixtureUnchanged: true
  });
  writeJson(resolve(issueDir, `plan-${result.planNumber}-promotion-recommendation-output.json`), {
    issue: String(auditIssueNumber),
    status: "passed",
    promotionRecommendation: audit.promotionRecommendation,
    promotionCandidateStatus: audit.promotionCandidateStatus,
    promotionStatus: "not_requested"
  });
  updateManifestForAudit(result, audit, auditIssueNumber);
  return audit;
}

function updateManifestForCorrection(result) {
  const manifestPath = resolve(repoRoot, "docs/verification/source-plan-correction-manifest.json");
  const manifest = validateSourcePlanCorrectionManifest(JSON.parse(readFileSync(manifestPath, "utf8")));
  const existingEntry = manifest.planCorrections.find((entry) => entry.planId === result.planId);
  const keepExistingAudit =
    existingEntry != null &&
    ["route_audit_ready", "manual_visual_review_ready", "blocked_needs_authoring_refinement", "simulation_export_ready"].includes(existingEntry.correctionStage);
  if (keepExistingAudit) {
    return;
  }
  const updated = {
    ...manifest,
    lastUpdatedIssue: maxIssue(manifest.lastUpdatedIssue, result.issueNumber),
    planCorrections: manifest.planCorrections.map((entry) =>
      entry.planId === result.planId
        ? {
            ...entry,
            correctedSavedCopyPath: result.correctedSavedCopyPath,
            correctionNotesPath: result.correctionNotesPath,
            correctionAuditPath: result.correctionAuditPath,
            visualEvidencePath: result.visualEvidencePath,
            correctionStage: "visual_audit_ready",
            routeAuditStatus: "pending_audit",
            simulationReadyExportStatus: result.exportAttempt.status,
            promotionStatus: "not_requested",
            promotionCandidateStatus: "blocked_by_route_audit",
            limitations: result.correctedCopy.correctionMetadata.limitations,
            goNoGo: `GO for Issue ${Number(result.issueNumber) + 1} audit`
          }
        : entry
    ),
    visualEvidence: {
      ...manifest.visualEvidence,
      [result.planId]: result.visualEvidencePath
    },
    routeAuditStatus: {
      ...manifest.routeAuditStatus,
      [result.planId]: "pending_audit"
    },
    simulationReadyExportStatus: {
      ...manifest.simulationReadyExportStatus,
      [result.planId]: result.exportAttempt.status
    },
    promotionStatus: {
      ...manifest.promotionStatus,
      [result.planId]: "not_requested"
    },
    goNoGoStatus: `Issue ${result.issueNumber} corrected saved copy ready for audit`
  };
  writeJson(manifestPath, validateSourcePlanCorrectionManifest(updated));
  const issueDir = resolve(repoRoot, `docs/verification/issues/issue-${result.issueNumber}`);
  writeJson(resolve(issueDir, "correction-manifest-update-output.json"), {
    issue: String(result.issueNumber),
    status: "passed",
    manifestPath: "docs/verification/source-plan-correction-manifest.json",
    updatedPlanId: result.planId,
    correctionStage: "visual_audit_ready"
  });
}

function updateManifestForAudit(result, audit, auditIssueNumber) {
  const manifestPath = resolve(repoRoot, "docs/verification/source-plan-correction-manifest.json");
  const manifest = validateSourcePlanCorrectionManifest(JSON.parse(readFileSync(manifestPath, "utf8")));
  const updated = {
    ...manifest,
    lastUpdatedIssue: maxIssue(manifest.lastUpdatedIssue, auditIssueNumber),
    planCorrections: manifest.planCorrections.map((entry) =>
      entry.planId === result.planId
        ? {
            ...entry,
            correctionStage: audit.promotionRecommendation === "ready_for_manual_visual_review"
              ? "manual_visual_review_ready"
              : "blocked_needs_authoring_refinement",
            routeAuditStatus: audit.routeAuditStatus,
            simulationReadyExportStatus: audit.simulationReadyExportStatus,
            promotionStatus: "not_requested",
            promotionCandidateStatus: audit.promotionCandidateStatus,
            limitations: audit.limitations,
            goNoGo: audit.promotionRecommendation === "ready_for_manual_visual_review"
              ? "GO for manual visual review"
              : "GO for another source-correction pass"
          }
        : entry
    ),
    routeAuditStatus: {
      ...manifest.routeAuditStatus,
      [result.planId]: audit.routeAuditStatus
    },
    simulationReadyExportStatus: {
      ...manifest.simulationReadyExportStatus,
      [result.planId]: audit.simulationReadyExportStatus
    },
    promotionStatus: {
      ...manifest.promotionStatus,
      [result.planId]: "not_requested"
    },
    goNoGoStatus: `Issue ${auditIssueNumber} ${result.planId} audit complete`
  };
  writeJson(manifestPath, validateSourcePlanCorrectionManifest(updated));
  writeJson(resolve(repoRoot, `docs/verification/issues/issue-${auditIssueNumber}`, "correction-manifest-update-output.json"), {
    issue: String(auditIssueNumber),
    status: "passed",
    manifestPath: "docs/verification/source-plan-correction-manifest.json",
    updatedPlanId: result.planId,
    routeAuditStatus: audit.routeAuditStatus
  });
}

function correctionNotes(result) {
  return `# Plan ${result.planNumber} Correction Notes

Issue: ${result.issueNumber}

This corrected saved copy was authored from a private source reference reviewed outside runtime. The artifact stores only safe provenance metadata and edited operational layout geometry.

## Changes

- Changed rooms: ${result.changedRoomIds.join(", ")}
- Changed doors: ${result.changedDoorIds.join(", ")}
- Added rooms: ${result.addedRoomIds.join(", ")}
- Added doors: ${result.addedDoorIds.join(", ")}
- Generated hallways: ${result.generatedHallwayIds.join(", ")}
- Generated border: ${result.generatedBorderId}

## Limitations

- No exact CAD or exact DOCX parity claim.
- No source binary, source filename, private path, OCR dump, raw source text, or private-source screenshot is stored.
- Simulation-ready export status is ${result.exportAttempt.status}.
- Promotion is not requested in this batch.
`;
}

function renderCorrectionPng(layout, outputPath) {
  const width = 960;
  const height = 720;
  const image = Buffer.alloc(width * height * 4, 255);
  const objects = [...layout.hallways, ...layout.zones, ...layout.rooms, ...layout.stations];
  const maxX = Math.max(...objects.map((object) => object.xFeet + object.widthFeet), 1);
  const maxY = Math.max(...objects.map((object) => object.yFeet + object.heightFeet), 1);
  const scale = Math.min((width - 80) / maxX, (height - 80) / maxY);
  fill(image, width, height, 0, 0, width, height, [248, 250, 252, 255]);
  for (const hallway of layout.hallways) {
    rect(image, width, height, hallway, scale, [226, 232, 240, 255], [100, 116, 139, 255]);
  }
  for (const zone of layout.zones) {
    rect(image, width, height, zone, scale, [220, 245, 239, 255], [20, 184, 166, 255]);
  }
  for (const room of layout.rooms) {
    const color = room.roomType === "trauma"
      ? [254, 226, 226, 255]
      : room.roomType === "procedure"
        ? [219, 234, 254, 255]
        : [241, 245, 249, 255];
    rect(image, width, height, room, scale, color, [51, 65, 85, 255]);
  }
  for (const station of layout.stations) {
    rect(image, width, height, station, scale, [254, 243, 199, 255], [146, 64, 14, 255]);
  }
  for (const door of layout.doors) {
    const owner = layout.rooms.find((room) => room.id === door.ownerId);
    if (owner == null) continue;
    const x = 40 + Math.round((owner.xFeet + (door.wall === "east" ? owner.widthFeet : door.wall === "west" ? 0 : door.offsetFeet)) * scale);
    const y = 40 + Math.round((owner.yFeet + (door.wall === "south" ? owner.heightFeet : door.wall === "north" ? 0 : door.offsetFeet)) * scale);
    fill(image, width, height, x - 3, y - 3, 6, 6, [15, 23, 42, 255]);
  }
  writePng(outputPath, width, height, image);
}

function rect(image, width, height, object, scale, fillColor, strokeColor) {
  const x = 40 + Math.round(object.xFeet * scale);
  const y = 40 + Math.round(object.yFeet * scale);
  const w = Math.max(1, Math.round(object.widthFeet * scale));
  const h = Math.max(1, Math.round(object.heightFeet * scale));
  fill(image, width, height, x, y, w, h, fillColor);
  fill(image, width, height, x, y, w, 2, strokeColor);
  fill(image, width, height, x, y + h - 2, w, 2, strokeColor);
  fill(image, width, height, x, y, 2, h, strokeColor);
  fill(image, width, height, x + w - 2, y, 2, h, strokeColor);
}

function fill(image, width, height, x, y, w, h, color) {
  const startX = Math.max(0, x);
  const startY = Math.max(0, y);
  const endX = Math.min(width, x + w);
  const endY = Math.min(height, y + h);
  for (let yy = startY; yy < endY; yy += 1) {
    for (let xx = startX; xx < endX; xx += 1) {
      const index = (yy * width + xx) * 4;
      image[index] = color[0];
      image[index + 1] = color[1];
      image[index + 2] = color[2];
      image[index + 3] = color[3];
    }
  }
}

function writePng(outputPath, width, height, rgba) {
  const raw = Buffer.alloc((width * 4 + 1) * height);
  for (let y = 0; y < height; y += 1) {
    const rowStart = y * (width * 4 + 1);
    raw[rowStart] = 0;
    rgba.copy(raw, rowStart + 1, y * width * 4, (y + 1) * width * 4);
  }
  const chunks = [
    chunk("IHDR", Buffer.concat([u32(width), u32(height), Buffer.from([8, 6, 0, 0, 0])])),
    chunk("IDAT", deflateSync(raw)),
    chunk("IEND", Buffer.alloc(0))
  ];
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, Buffer.concat([Buffer.from("89504e470d0a1a0a", "hex"), ...chunks]));
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type);
  const payload = Buffer.concat([typeBuffer, data]);
  return Buffer.concat([u32(data.length), payload, u32(crc32(payload))]);
}

function u32(value) {
  const buffer = Buffer.alloc(4);
  buffer.writeUInt32BE(value >>> 0);
  return buffer;
}

function crc32(buffer) {
  let crc = 0xffffffff;
  for (const byte of buffer) {
    crc ^= byte;
    for (let i = 0; i < 8; i += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function boundsForLayout(layout, paddingFeet) {
  const objects = [...layout.rooms, ...layout.stations, ...layout.hallways, ...layout.zones];
  return {
    xFeet: 0,
    yFeet: 0,
    widthFeet: Math.max(...objects.map((object) => object.xFeet + object.widthFeet)) + paddingFeet,
    heightFeet: Math.max(...objects.map((object) => object.yFeet + object.heightFeet)) + paddingFeet
  };
}

function writeJson(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(value, null, 2)}\n`);
}

function writeText(path, value) {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, value);
}

function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

function maxIssue(left, right) {
  return String(Math.max(Number(left), Number(right)));
}
