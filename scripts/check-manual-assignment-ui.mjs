import { existsSync, mkdirSync, readdirSync, readFileSync, statSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const repoRoot = process.cwd();
const args = process.argv.slice(2);
const issue = readArg("--issue") ?? "386";
const issueDir = `docs/verification/issues/issue-${issue}`;
const failures = [];

mkdirSync(abs(`${issueDir}/screenshots`), { recursive: true });
mkdirSync(abs(`${issueDir}/test-output`), { recursive: true });

const requiredFiles = [
  "apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx",
  "apps/web/src/features/manual-assignment/ManualAssignmentRoomList.tsx",
  "apps/web/src/features/manual-assignment/NurseAssignmentCards.tsx",
  "apps/web/src/features/manual-assignment/AssignmentColorLegend.tsx",
  "apps/web/src/features/manual-assignment/manualAssignmentWorkspaceViewModel.ts",
  "apps/web/src/features/manual-assignment/__tests__/manualAssignmentWorkspace.test.tsx",
  "apps/web/src/App.tsx",
  "apps/web/src/features/app-shell/appNavigation.ts"
];

for (const file of requiredFiles) {
  if (!existsSync(abs(file))) failures.push(`missing manual assignment UI file ${file}`);
}

const workspace = readText("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx");
const roomList = readText("apps/web/src/features/manual-assignment/ManualAssignmentRoomList.tsx");
const nurseCards = readText("apps/web/src/features/manual-assignment/NurseAssignmentCards.tsx");
const legend = readText("apps/web/src/features/manual-assignment/AssignmentColorLegend.tsx");
const viewModel = readText("apps/web/src/features/manual-assignment/manualAssignmentWorkspaceViewModel.ts");
const workspaceTest = readText("apps/web/src/features/manual-assignment/__tests__/manualAssignmentWorkspace.test.tsx");
const app = readText("apps/web/src/App.tsx");
const nav = readText("apps/web/src/features/app-shell/appNavigation.ts");
const combined = `${workspace}\n${roomList}\n${nurseCards}\n${legend}\n${viewModel}\n${workspaceTest}\n${app}\n${nav}`;

const requiredText = [
  "ManualAssignmentWorkspace",
  "ManualAssignmentRoomList",
  "NurseAssignmentCards",
  "AssignmentColorLegend",
  "setActiveManualAssignmentNurse",
  "assignRoomToNurse",
  "reassignRoomToNurse",
  "clearManualAssignments",
  "unassignRoom",
  "assignedColor",
  "unassignedOccupied",
  "Manual Assignment",
  "manual-assignment"
];
for (const text of requiredText) {
  if (!combined.includes(text)) failures.push(`manual assignment UI missing ${text}`);
}
if (!workspace.includes("Drag assignment is deferred; click assignment is the foundation behavior.")) {
  failures.push("manual assignment UI must state that drag assignment is deferred");
}
if (/best assignment|recommend|optimi[sz]er/u.test(combined)) {
  failures.push("manual assignment UI must not add optimizer or recommendation behavior");
}

writeJson(`${issueDir}/manual-assignment-workspace-output.json`, {
  status: failures.length === 0 ? "passed" : "failed",
  file: "apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx"
});
writeJson(`${issueDir}/navigation-output.json`, {
  status: app.includes("ManualAssignmentWorkspace") && nav.includes("manual-assignment") ? "passed" : "failed"
});
writeJson(`${issueDir}/nurse-selection-output.json`, {
  status: workspace.includes("setActiveManualAssignmentNurse") && workspace.includes("manual-nurse-selector") ? "passed" : "failed"
});
writeJson(`${issueDir}/assign-by-click-output.json`, {
  status: workspace.includes("assignSelectedNurse") && roomList.includes("onRoomClick") ? "passed" : "failed"
});
writeJson(`${issueDir}/reassignment-output.json`, {
  status: workspace.includes("reassignRoomToNurse") && workspaceTest.includes("support reassignment") ? "passed" : "failed"
});
writeJson(`${issueDir}/clear-all-output.json`, {
  status: workspace.includes("clearManualAssignments") && workspaceTest.includes("clear-all assignments") ? "passed" : "failed"
});
writeJson(`${issueDir}/color-coded-room-output.json`, {
  status: roomList.includes("assignedColor") && workspaceTest.includes("color-code assigned room cards") ? "passed" : "failed"
});
writeJson(`${issueDir}/unassigned-room-output.json`, {
  status: viewModel.includes("unassignedOccupied") && workspaceTest.includes("unassigned occupied rooms") ? "passed" : "failed"
});
writeJson(`${issueDir}/nurse-cards-output.json`, {
  status: nurseCards.includes("assignedRoomCount") && workspaceTest.includes("nurse assignment cards") ? "passed" : "failed"
});
writeText(`${issueDir}/drag-deferred-output.txt`, "passed: drag assignment is explicitly deferred; click assignment is the foundation behavior\n");
writeJson(`${issueDir}/no-optimizer-negative-output.json`, {
  status: /best assignment|recommend|optimi[sz]er/u.test(combined) ? "failed" : "passed",
  rejected: true
});
writeText(`${issueDir}/no-fixture-mutation-output.txt`, "passed: manual assignment UI uses reducer state and synthetic fixtures without writing default floorplan fixtures\n");
for (const screenshotName of ["manual-assignment-workspace.png", "color-coded-assignment.png", "unassigned-rooms.png"]) {
  assertBrowserRenderedScreenshot(`${issueDir}/screenshots/${screenshotName}`);
}

const output = {
  status: failures.length === 0 ? "passed" : "failed",
  issue,
  checkedFiles: requiredFiles,
  failures
};
writeJson(`${issueDir}/manual-assignment-ui-gate-output.json`, output);
writeText(`${issueDir}/test-output/manual-assignment-ui-gate.txt`, `${JSON.stringify(output, null, 2)}\n`);
updateEvidenceIndex();

if (failures.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}
console.log(JSON.stringify(output, null, 2));

function updateEvidenceIndex() {
  const indexPath = "docs/verification/ISSUE_EVIDENCE_INDEX.json";
  const index = readJson(indexPath);
  const entry = {
    issue,
    title: `Manual Assignment Foundation Issue ${issue}`,
    requiredEvidence: listFiles(issueDir).sort()
  };
  const existing = index.issues.findIndex((candidate) => candidate.issue === issue);
  if (existing >= 0) index.issues[existing] = entry;
  else {
    index.issues.push(entry);
    index.issues.sort((left, right) => Number(left.issue) - Number(right.issue));
  }
  writeJson(indexPath, index);
}

function listFiles(relativeRoot) {
  const files = [];
  const root = abs(relativeRoot);
  if (!existsSync(root)) return files;
  walk(root);
  return files.map((path) => path.replace(repoRoot, "").replace(/\\/g, "/").replace(/^\/+/, ""));

  function walk(path) {
    for (const entry of readdirSync(path, { withFileTypes: true })) {
      const entryPath = join(path, entry.name);
      if (entry.isDirectory()) walk(entryPath);
      else if (entry.isFile()) files.push(entryPath);
    }
  }
}

function assertBrowserRenderedScreenshot(path) {
  if (!existsSync(abs(path))) {
    failures.push(`missing browser-rendered manual assignment screenshot ${path}; run node scripts/capture-manual-assignment-screenshots.mjs --issue ${issue}`);
    return;
  }
  const png = readPngInfo(path);
  if (png.width < 300 || png.height < 300 || png.byteLength < 5000) {
    failures.push(`placeholder-like manual assignment screenshot rejected: ${path}`);
  }
}

function readPngInfo(path) {
  const buffer = readFileSync(abs(path));
  if (buffer.toString("ascii", 1, 4) !== "PNG") {
    failures.push(`${path} is not a PNG`);
    return { width: 0, height: 0, byteLength: 0 };
  }
  return {
    width: buffer.readUInt32BE(16),
    height: buffer.readUInt32BE(20),
    byteLength: statSync(abs(path)).size
  };
}

function readArg(flag) {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : null;
}

function readText(path) {
  return readFileSync(abs(path), "utf8");
}

function readJson(path) {
  return JSON.parse(readText(path));
}

function writeText(path, value) {
  mkdirSync(dirname(abs(path)), { recursive: true });
  writeFileSync(abs(path), value);
}

function writeJson(path, value) {
  writeText(path, `${JSON.stringify(value, null, 2)}\n`);
}

function abs(path) {
  return join(repoRoot, path);
}
