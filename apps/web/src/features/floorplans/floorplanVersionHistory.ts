import type { FloorplanVersionContract } from "@nerdeus/shared";
import type { SavedFloorplanRecord } from "./savedFloorplanStore";
import {
  ACTIVE_FLOORPLAN_ID,
  normalizeFloorplanDisplayName,
  createFloorplanVersionLabel
} from "./floorplanVersionNaming";

export type FloorplanVersionHistoryItem = FloorplanVersionContract & {
  isCurrent: boolean;
};

export function mapSavedRecordsToFloorplanVersions(input: {
  records: readonly SavedFloorplanRecord[];
  currentVersionId: string | null;
  archivedVersionIds?: ReadonlySet<string>;
}): FloorplanVersionHistoryItem[] {
  const archivedVersionIds = input.archivedVersionIds ?? new Set<string>();
  return input.records.map((record, index) => ({
    schemaVersion: "1.0.0",
    versionId: record.recordId,
    floorplanId: ACTIVE_FLOORPLAN_ID,
    displayName: normalizeFloorplanDisplayName(record.displayName),
    versionLabel: createFloorplanVersionLabel({
      versionLabel: record.versionLabel,
      recordId: record.recordId,
      fallbackIndex: index + 1
    }),
    status: archivedVersionIds.has(record.recordId)
      ? "archived"
      : input.currentVersionId === record.recordId
        ? "ready_for_assignment"
        : "saved",
    savedAt: record.updatedAt,
    parentVersionId: index === 0 ? null : input.records[index - 1]?.recordId ?? null,
    authoringDraft: record.authoringDraft,
    isCurrent: input.currentVersionId === record.recordId
  }));
}

export function archiveFloorplanVersion(
  archivedVersionIds: ReadonlySet<string>,
  versionId: string
): Set<string> {
  const next = new Set(archivedVersionIds);
  next.add(versionId);
  return next;
}

export function restoreFloorplanVersion(
  archivedVersionIds: ReadonlySet<string>,
  versionId: string
): Set<string> {
  const next = new Set(archivedVersionIds);
  next.delete(versionId);
  return next;
}
