export const ACTIVE_FLOORPLAN_ID = "er-pod-main-layout";
export const ACTIVE_FLOORPLAN_DISPLAY_NAME = "ER Pod Main Layout";

const COPY_SUFFIX_PATTERN = /(\s+copy)+$/iu;
const WORKING_COPY_SUFFIX_PATTERN = /\s+working\s+copy$/iu;
const INTERNAL_ID_PATTERN = /^(saved|editable)-default-er-layout-plan-1(?:-\d+)?$/iu;
const DEFAULT_PLAN_1_PATTERN = /\b(default\s*)?er\s*layout\s*plan\s*1\b/iu;

export function normalizeFloorplanDisplayName(value: string | null | undefined): string {
  const input = value?.trim() ?? "";
  if (input.length === 0 || INTERNAL_ID_PATTERN.test(input) || DEFAULT_PLAN_1_PATTERN.test(input)) {
    return ACTIVE_FLOORPLAN_DISPLAY_NAME;
  }

  const cleaned = input
    .replace(WORKING_COPY_SUFFIX_PATTERN, "")
    .replace(COPY_SUFFIX_PATTERN, "")
    .trim();

  return cleaned.length === 0 ? ACTIVE_FLOORPLAN_DISPLAY_NAME : cleaned;
}

export function createFloorplanVersionLabel(input: {
  versionLabel?: string | null;
  recordId?: string | null;
  fallbackIndex?: number;
}): string {
  const existing = input.versionLabel?.trim() ?? "";
  const existingNumber = existing.match(/^v(?:ersion)?\s*(\d+)$/iu)?.[1];
  if (existingNumber != null) {
    return `Version ${Number(existingNumber)}`;
  }
  if (/^version\s+\d+$/iu.test(existing)) {
    return existing.replace(/^version/iu, "Version");
  }

  const recordSequence = input.recordId?.match(/-(\d+)$/u)?.[1];
  const sequence = Number(recordSequence ?? input.fallbackIndex ?? 1);
  return `Version ${Number.isFinite(sequence) && sequence > 0 ? sequence : 1}`;
}

export function formatFloorplanSavedTime(value: string | null | undefined): string {
  if (value == null) {
    return "Not saved this session";
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return "Saved time unavailable";
  }
  return date.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" });
}

export function buildDraftSavedLabel(value: string | null | undefined): string {
  return `Draft saved ${formatFloorplanSavedTime(value)}`;
}
