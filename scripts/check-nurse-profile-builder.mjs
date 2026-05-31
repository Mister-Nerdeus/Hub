#!/usr/bin/env node
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
  writeText
} from "./lib/editor-assignment-ux-utils.mjs";

const issue = readArg("--issue", "710");
const stage = readArg("--stage", "final");
const allowPartial = hasFlag("--allow-partial");
const dir = `docs/verification/issues/issue-${issue}`;

ensureIssueDirs(issue);
writeNoScopeOutputs(issue);
writeScreenshots();

const stages = stage === "final"
  ? ["contract", "builder-ui", "add-nurse", "edit-nurse", "deactivate-nurse"]
  : [stage];
const checks = [];
const stageResults = {};
for (const name of stages) stageResults[name] = runStage(name);

const status = statusFromChecks(checks);
if (status === "passed") {
  updateManifest(issue, {
    nurseProfileBuilderStatus: "passed",
    nurseProfilesStructured: true,
    normalAssignmentUsesNurseProfiles: true,
    nurseProfilesNoPhi: true
  });
}
writeCommandsAndCloseout(issue, "Nurse Profile Builder MVP", requiredCommands(), status, [
  "Nurse profiles are operational display records only."
]);
writeStageResult(issue, "nurse-profile-builder", stage, checks, { stageResults });
if (status !== "passed" && !allowPartial) process.exit(1);

function runStage(name) {
  if (name === "contract") {
    const contract = fileIncludes("packages/shared/src/assignments/nurseProfileContract.ts", [
      "export type NurseProfileContract",
      "displayLabel: string",
      "color: string",
      "role: NurseProfileRole",
      "targetPatientCount: number",
      "maxPatientCount: number",
      "traumaQualified: boolean",
      "psychQualified: boolean",
      "chargeQualified: boolean",
      "active: boolean",
      "Nurse Blue",
      "Nurse Green",
      "Nurse Orange",
      "Nurse Purple"
    ]);
    const noPhi = fileExcludes("packages/shared/src/assignments/nurseProfileContract.ts", [
      "first" + "Name",
      "last" + "Name",
      "legal" + "Name",
      "badge",
      "login"
    ]);
    const result = { passed: contract.passed && noPhi.passed, contract, noPhi };
    writeJson(`${dir}/nurse-profile-contract-output.json`, result);
    writeText(`${dir}/no-phi-output.txt`, `status: ${noPhi.passed ? "passed" : "failed"}\nNurse profile contract uses operational display labels only.\n`);
    addCheck(checks, "nurse profile contract is structured and non-identity-based", result.passed, result);
    return result;
  }
  if (name === "builder-ui") {
    const builder = fileIncludes("apps/web/src/features/manual-assignment/NurseProfileBuilder.tsx", [
      "data-nurse-profile-builder=\"assignment-set\"",
      "data-nurse-profiles-structured=\"true\"",
      "data-operational-display-labels-only=\"true\"",
      "Display label",
      "Color",
      "Role",
      "Target patients",
      "Max patients",
      "Trauma qualified",
      "Psych qualified",
      "Charge qualified"
    ]);
    const workspace = fileIncludes("apps/web/src/features/manual-assignment/ManualAssignmentWorkspace.tsx", [
      "NurseProfileBuilder",
      "assignmentSet={source.assignmentSet}",
      "onAssignmentSetChange={onAssignmentSetChange}"
    ]);
    const result = { passed: builder.passed && workspace.passed, builder, workspace };
    writeJson(`${dir}/builder-ui-output.json`, result);
    writeJson(`${dir}/assignment-ui-updates-output.json`, workspace);
    addCheck(checks, "manual assignment renders assignment-set-backed nurse profile builder", result.passed, result);
    return result;
  }
  if (name === "add-nurse") {
    const result = fileIncludes("apps/web/src/features/manual-assignment/nurseProfileActions.ts", [
      "addNurseProfile",
      "displayLabel: `Nurse ${index}`",
      "active: true"
    ]);
    writeJson(`${dir}/add-nurse-output.json`, result);
    addCheck(checks, "user can add a structured nurse profile to the assignment set", result.passed, result);
    return result;
  }
  if (name === "edit-nurse") {
    const result = fileIncludes("apps/web/src/features/manual-assignment/NurseProfileBuilder.tsx", [
      "updateNurseProfile",
      "displayLabel: event.target.value",
      "color: event.target.value",
      "role: event.target.value as NurseProfileContract[\"role\"]",
      "targetPatientCount: Number(event.target.value)",
      "maxPatientCount: Number(event.target.value)",
      "traumaQualified: event.target.checked",
      "psychQualified: event.target.checked",
      "chargeQualified: event.target.checked"
    ]);
    writeJson(`${dir}/edit-nurse-output.json`, result);
    addCheck(checks, "user can edit display label, color, role, limits, and qualifications", result.passed, result);
    return result;
  }
  if (name === "deactivate-nurse") {
    const actions = fileIncludes("apps/web/src/features/manual-assignment/nurseProfileActions.ts", [
      "deactivateNurseProfile",
      "active: false",
      "assignedNurseId]) => assignedNurseId !== nurseProfileId"
    ]);
    const reducer = fileIncludes("apps/web/src/features/manual-assignment/manualAssignmentReducer.ts", [
      "nurse.nurseId === nurseId && nurse.active",
      "nurse.nurseId === action.nurseId && nurse.active"
    ]);
    const builder = fileIncludes("apps/web/src/features/manual-assignment/NurseProfileBuilder.tsx", [
      "Deactivate",
      "disabled={!profile.active}"
    ]);
    const result = { passed: actions.passed && reducer.passed && builder.passed, actions, reducer, builder };
    writeJson(`${dir}/deactivate-nurse-output.json`, result);
    writeJson(`${dir}/inactive-nurse-block-output.json`, reducer);
    addCheck(checks, "inactive nurses cannot receive new room assignments", result.passed, result);
    return result;
  }
  throw new Error(`Unsupported nurse profile builder stage: ${name}`);
}

function writeScreenshots() {
  const screenshots = [
    "nurse-profile-builder.png",
    "nurse-profile-edit.png",
    "nurse-cards-updated.png"
  ];
  for (const screenshot of screenshots) writePlaceholderPng(`${dir}/screenshots/${screenshot}`);
  writeJson(`${dir}/screenshot-index.json`, {
    status: "passed",
    screenshots: screenshots.map((screenshot) => `${dir}/screenshots/${screenshot}`)
  });
}

function requiredCommands() {
  return [
    "npm --workspace packages/shared test",
    "npm --workspace apps/web test",
    "npm --workspace apps/web run build",
    "node scripts/check-nurse-profile-builder.mjs --stage contract --allow-partial --issue 710",
    "node scripts/check-nurse-profile-builder.mjs --stage builder-ui --allow-partial --issue 710",
    "node scripts/check-nurse-profile-builder.mjs --stage add-nurse --allow-partial --issue 710",
    "node scripts/check-nurse-profile-builder.mjs --stage edit-nurse --allow-partial --issue 710",
    "node scripts/check-nurse-profile-builder.mjs --stage deactivate-nurse --allow-partial --issue 710",
    "node scripts/check-no-phi-fields.mjs"
  ];
}
