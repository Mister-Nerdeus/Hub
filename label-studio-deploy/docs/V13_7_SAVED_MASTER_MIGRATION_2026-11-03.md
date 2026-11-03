# Label Studio v13.7 — Saved v9 masters overriding current Heritage content

**Incident:** November 3, 2026  
**Live editor:** https://nerdeus-label-studio-production.up.railway.app/?template=master-cooked_meal&view=data&release=v13.7  
**Railway service:** `0a49ac30-6184-4a48-bf89-e4eec3bc5de8`  
**Successful deployment:** `dfe085fa-b44c-4a32-ab2a-133a3a5ee0e0`  
**Pinned source commit:** `b611b68cdb7503efeaadb69492215a7f7ceda5c1`  
**Page path:** `label-studio-deploy/index-v13_7.html`  
**Git blob SHA:** `01799fab7806f6a0e88ad7a83a14bbc82d7f96e6`

## What the user's actual connected browser showed

The user's browser had opened the URL `release=v13.5`, but Railway was already serving v13.6. `release` is only a query parameter, not a deployment selection. Browser text read verified:

- Startup message said **Label editor ready**, with **17 available master template choices** and **101 backgrounds**.
- The app rendered **30 layers** for `master-cooked_meal`.
- The document description read **v9 standard engraved packaging · cooked_food** instead of the expected Heritage v13 layout.
- The page displayed the button **Upgrade this label to Heritage v13**.
- The background library populated 101 tiles. The browser's page text contained **BG-002 applied**, and the current background layer was **Vintage Red Bakery Engraving**.
- The old v9 document included a visible `Central white dither knockout` and lacked the latest food-art layers, making applied artwork less apparent.

Therefore, not all controls were broken. A significant ongoing issue was **old browser-saved content shadowing the current master templates**.

## Root cause

In `loadLocal()`, saved templates were read from `nerdeus-label-studio-v2`. The code appended current defaults **only if a matching template ID was missing**:

```js
const known=new Set(docs.map(d=>d.id));
for(const fresh of defaultTemplates)if(!known.has(fresh.id))docs.push(fresh);
```

An older saved document using the canonical ID `master-cooked_meal` took precedence indefinitely, even after new master code deployed. New script assets, QA and other code changes could be live while the visible label stayed on the earlier v9 template. The obsolete white center knockout could further conceal background changes.

This behavior was separate from two earlier repaired startup faults: the incorrect single-element `.forEach` selector and the 109 appended cut-art entries lacking legacy `subtitle` data.

## v13.7 fix

1. Introduced `isCurrentHeritageMaster()`: a canonical master must declare `pkg.layoutStyle='heritage-v13'` and have the actual `Heritage second header` element.
2. On startup, an obsolete saved canonical `master-*` is **cloned and preserved**, assigned a unique `previous-master-*` ID, given `pkg.recordRole='legacy'`, and labeled **Saved previous layout**.
3. The canonical ID (e.g. `master-cooked_meal`) is occupied by the current Heritage master default. This restores the current source-defined red/black header, hidden center knockout, 33-layer cooked-meal layout, and candidate food artwork.
4. The **Legacy and custom (advanced)** filter includes preserved old masters, while **17 reusable label types** shows only current canonical examples. Existing `package-*` records and user-customized current Heritage documents remain unchanged.
5. The migrated state is saved locally without deleting existing saved package data or IndexedDB snapshots. If saving is unavailable, the original stored data remains untouched and an error is indicated.
6. The background library now has persistent text **Current background: BG-...**, and thumbnails expose `aria-pressed` for the selected image.
7. The startup banner says **v13.7** and shows how many previous layouts were preserved. When available, the address bar's `release` query parameter is normalized to the running version so stale shared links cannot mislead users.

## Verification

- Railway deployment `dfe085fa-b44c-4a32-ab2a-133a3a5ee0e0`: **SUCCESS**, online, no reported warnings or failed deployments.
- Executed actual v13.7 inline/external scripts in order with all 123 cut-art entries and 101 synthetic background images.
- Fresh profile: 17 master choices, 101 background buttons, template switch to `master-raw_plain`, background click selection to `BG-013`, no startup exceptions.
- Legacy profile: seeded an old `master-cooked_meal` with a custom food name and recipe reference. Startup restored Heritage v13 under the canonical ID and preserved the custom original in a separate legacy entry; no data loss. Reloading the saved state did not create duplicate preserved entries.
- Test code: `label-studio-deploy/qa/boot-harness-v13_7.js`.
- **Not confirmed:** a real click in the user's live browser after refreshing v13.7, actual background pixels as seen on their display, hardware print alignment, freezer durability or physical QR scan. The connected Browser integration is read-only. Do not conflate these with mock DOM tests.

## Review procedure

Open https://nerdeus-label-studio-production.up.railway.app/?template=master-cooked_meal&view=data&release=v13.7 in a new tab or hard refresh. Look for **v13.7 · Label editor ready**. The cooked-meal inspector should show **Heritage v13 layout active** (not **Upgrade this label to Heritage v13**). The normal workspace should show **Current background: BG-101 ...** or another selected background.

Choose a background tile such as BG-013 and confirm the persistent **Current background** field changes. Select a different master and return. Any prior v9 work is available under **Legacy and custom (advanced)**, not deleted. For new package records, use the separate **Create new empty package** action.

If a status error appears, capture the *first* error. Avoid deleting browser localStorage or IndexedDB, because these hold private editable designs and immutable print snapshots.
