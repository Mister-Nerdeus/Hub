export const EDITOR_RUNTIME_BATCH_MARKER = "641-650-editor-runtime-save-layout";

export type RuntimeBuildInfo = {
  buildCommit: string;
  buildTime: string;
  runtimeMode: "local-dev" | "production-build";
  editorSaveUx: "enabled";
  batchMarker: typeof EDITOR_RUNTIME_BATCH_MARKER;
};

const moduleLoadedAt = new Date().toISOString();

export function getRuntimeBuildInfo(): RuntimeBuildInfo {
  const buildCommit = import.meta.env.VITE_BUILD_COMMIT?.trim() || "local-dev";
  const buildTime = import.meta.env.VITE_BUILD_TIME?.trim() || moduleLoadedAt;
  return {
    buildCommit,
    buildTime,
    runtimeMode: import.meta.env.DEV ? "local-dev" : "production-build",
    editorSaveUx: "enabled",
    batchMarker: EDITOR_RUNTIME_BATCH_MARKER
  };
}
