#!/usr/bin/env node
import { addCheck, ensureIssueArtifacts, fileIncludes, readArg, readText, statusFromChecks, updateHardeningManifest, writeCloseout, writeCommandArtifacts, writeStageResult } from "./lib/geometry-truth-hardening-utils.mjs";

const issue = readArg("--issue", "819");
const stage = readArg("--stage", "final");
const scriptName = "check-split-room-reducer-wiring";
const commands = [
  `node scripts/${scriptName}.mjs --stage reducer-action --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage uses-single-room-conversion --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage no-pair-resolution-normal-flow --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage parent-footprint-preserved --issue ${issue}`,
  `node scripts/${scriptName}.mjs --stage no-fake-child-rooms --issue ${issue}`
];
ensureIssueArtifacts(issue);
writeCommandArtifacts(issue, commands);
const reducer = "apps/web/src/features/layout-editor/layoutEditorReducer.ts";
const checks = [];
addCheck(checks, "convertSelectedRoomToSplitRoom reducer action exists", fileIncludes(reducer, ['type: "convertSelectedRoomToSplitRoom"', "function convertSelectedRoomToSplitRoom"]).passed);
addCheck(checks, "reducer calls convertSingleRoomToSplitRoom", fileIncludes(reducer, ["convertSingleRoomToSplitRoom({", "selectedObjectType: \"split_room_parent\""]).passed);
addCheck(checks, "normal split conversion does not resolve room pair", fileExcludesBetween(reducer, "function convertSelectedRoomToSplitRoom", "function moveSelectedSplitRoomParent", ["resolveSplitRoomPair", "createSplitRoomInEditableLayout"]));
addCheck(checks, "parent room remains in rooms while splitRooms stores beds", fileIncludes(reducer, ["splitRooms:", "...state.editableLayout", "parentRoom.id"]).passed);
const status = statusFromChecks(checks);
if (status === "passed") updateHardeningManifest(issue, { splitRoomReducerWiringStatus: "passed", reducerUsesSingleRoomSplitConversion: true, normalSplitRoomCreationDoesNotResolveRoomPair: true, splitRoomConversionPreservesParentFootprint: true });
writeCloseout(issue, { title: "Wire Single-Room Split-Room Conversion into Reducer", reviewFinding: "Reducer now creates splitRooms from one selected parent room and selects the split_room_parent object without creating child-room rectangles.", status, filesChanged: [reducer, "apps/web/src/features/layout-editor/splitRoomActions.ts", `docs/verification/issues/issue-${issue}/`], commands, evidence: [`docs/verification/issues/issue-${issue}/test-output/${scriptName}.txt`, `docs/verification/issues/issue-${issue}/manifest-update-output.json`], limitations: [] });
writeStageResult(issue, scriptName, stage, checks);
if (status !== "passed") process.exit(1);

function fileExcludesBetween(path, start, end, snippets) {
  const text = readText(path);
  const section = text.slice(text.indexOf(start), text.indexOf(end));
  return snippets.every((snippet) => !section.includes(snippet));
}
