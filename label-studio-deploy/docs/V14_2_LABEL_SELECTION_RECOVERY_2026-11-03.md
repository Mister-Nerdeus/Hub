# Nerdeus Label Studio v14.2 — Label selection response and recovery
Date: 2026-11-03
Production: https://nerdeus-label-studio-production.up.railway.app/?view=create&release=v14.2
Advanced: https://nerdeus-label-studio-production.up.railway.app/?template=master-cooked_meal&view=data&release=v14.2

## User-reported issue
"When I select a label. It does nothing."

## Evidence and root causes addressed
1. The advanced editor’s label-family selector only filtered results. In the connected browser the active sample was Complete cooked meal while the visible filter was Whole & prepped ingredients. The two actions were not clearly distinguished. The interface now labels the filter as a browse-only control and gives two separate actions per current type: **Preview this label** and **Create [type] package**.
2. Advanced label cards previously attached per-element click handlers after each HTML rebuild. v14.2 uses a single delegated handler on the persistent template list, so filtering, searching and refreshing cannot silently detach label-selection actions.
3. The guided type cards previously rebuilt the next screen without moving the viewport, so selecting a card farther down the page could leave the user looking at the middle of the new form. The guided navigation now scrolls to the newly opened step and focuses its heading, with a visible package confirmation.
4. Browser quota/save failures previously caused createPackageV14 to throw before refreshing the page even though the draft had already been added in memory; this could look like a dead click. v14.2 still opens the unsaved draft with an explicit storage warning. Print preflight continues to block unpersisted work.
5. The 17-type inspector dropdown now shows explicit "Previewing [label]" feedback after changing the active sample.

## Source/rollout
- New HTML: label-studio-deploy/index-v14_2.html (Git blob cfb4ee97fb9918c0362d5893d979e9778c9df477; commit 3fea56b4999be2e827ed96c28656999cec3275f9)
- Guided flow: label-studio-deploy/assets/workflow-v14_2.js (Git blob d492b9d874ab00666244dd3a2c35d5ebb6bed6fe; commit 1d39eb80fec0edaea5f21cd2286e62d5ec698165)
- Existing v14.1 label master, batch queue, backgrounds and illustrations remain pinned and unchanged.
- Railway production deployment 81aaa164-9b3f-412d-a7df-a1edba567425 was SUCCESS, service online, no reported critical/warning issues or recent failures. Logs confirm the new HTML and guided workflow Git blob hashes.

## Verification
- All 11 inline HTML JS scripts and guided workflow module compiled successfully.
- Isolated advanced picker tests passed: previewing a different type changes activeId, refreshes the editor, reports visible feedback and scrolls to preview; Create package opens guided details.
- Isolated guided flow test passed: open home -> choose type -> choose Prepped ingredient -> editable package details displayed, viewport scrolls and heading receives focus.
- **Not yet performed**: actual click validation in the user’s connected browser. The available Browser integration in this chat is read-only; the open tab must be refreshed from v14.1 to v14.2. Do not claim live visual click testing without a controllable browser.
- Physical NIIMBOT B1 Pro output is unrelated to this selection fix and remains unverified.

## Manual acceptance
1. Refresh the editor using Ctrl+Shift+R, or open the guided v14.2 link in a new tab.
2. Choose Create package label → select any one of the 17 types. Details heading and the selected type’s conditional fields should appear immediately and be scrolled into view.
3. In Advanced Designer, change the category filter. Expect only the visible choices to change; the current label identity should stay pinned.
4. Choose a specific Preview card. The active label should change, show a toast/status and scroll to its data/preview.
5. Choose Create package under that type. A separate blank package should open in guided Details, without copying a demo ID or existing review approvals.
6. Verify save failures are shown as an explicit warning, not a silent dead click. Recovered/saved historical layouts remain accessible.
