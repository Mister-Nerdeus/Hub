# Chopper Game — Teaching, Gameplay & Asset Bible

**Release:** 1.15 · **Date:** September 19, 2026 · **Stable document ID:** `BIB-CHOP-UE2D-001`  
**Release ID:** `CG-RELEASE-1.15` · **Target:** Unreal Engine 5.8, deterministic 2D reconstruction research  
**Source lineage:** user-supplied `choplift.zip`, previous teaching package v1.4. Choplifter remains the historical game name, not this project's current display name.

> **Current decision:** **v1.15 closes the native repaired-MCU MAME runtime gate while strict arcade fidelity remains NO-GO.** The exact historical MAME 0.131u2 three-byte repair was applied to the user-supplied historical 315-5151 BAD_DUMP *before* starting the pinned MAME 0.289 runtime. Under actual MAME, the protected main Z80 remains at PC=0 during the MCU startup/checksum interval, then releases at emulated time 5.358080 s with bank 3 selected. A dedicated second run captured 120 consecutive MAME screen frame numbers 321–440 with zero frame-number gaps, changing work RAM/palette/video/screen state, and visible `IC CHECK`. A separate 120-second rendered probe progresses through hardware checks, the Choplifter title/licensing screens, an attract/gameplay scene, Game Over, and the `Your Mission / Rescue Hostages` attract message. This evidence is still **NONCANONICAL_HISTORICAL_MAME_REPAIR** with `promotion_eligible=false`; the canonical MCU remains mandatory for disjoint strict held-out verification and no gameplay/semantic fact is promoted from the repaired lane alone.

## A1. How to use this release

Open `Chopper_Game_Asset_Explorer.html` to search by asset ID, source ROM, category, unresolved role or workflow. It includes embedded previews and works offline without fetching a server. The complete package contains raw supplied source, indexed pixel data, all diagnostic PNGs, code maps, teaching diagrams, registries, and tests. The standalone HTML Bible embeds its illustrations. File links to CSV/source data work after extracting the complete ZIP.

A student follows the history/hardware/reverse-engineering chapters in Part R after reading the contracts below. An AI worker starts with `gameplay/workflow_contracts.csv`, selects one workflow, follows its required slots/unknowns/tests, and stops if a strict prerequisite is unresolved. A researcher starts with `assets/source_rom_catalog.csv`, follows a capture plan, then uses `tools/evidence_analysis.py` to produce candidate-only correlations. A separate reviewer and disjoint held-out capture are required before `tools/evidence_promotion.py` can create a VERIFIED proof. A release reviewer runs `tools/validate_chopper.py` and checks the strict gate separately.

**Authority:** observed original behavior with source/config/timing provenance; matching source data; hardware implementation reference; validated static interpretation; secondary documentation; explicit modern design. This ordering does not turn a guessed static meaning into a fact. The new contract layer governs the current release; the inherited research chapters retain historical v1.4 measurements and explanations, clearly labeled as such.

## A2. What is physically present, logically mapped, and still unknown

| Category | Count |
| --- | --- |
| source-rom | 19 |
| tile | 4096 |
| sprite-static-sequence | 212 |
| sprite-candidate-frame | 417 |
| physical-palette-entry | 256 |
| mixer-truth-table-entry | 256 |
| tile-contact-sheet | 8 |
| tile-atlas | 1 |
| palette-swatch | 1 |
| sprite-contact-sheet | 4 |
| sprite-candidate-contact-sheet | 6 |
| teaching-figure | 16 |
| indexed-tile-array | 1 |


These counts total **5,293 logical assets**, not that many unique pictures. The same CSV stores 256 palette entries and another stores 256 mixer records; the source catalog includes one explicitly absent ROM object. There are **4,742 diagnostic image files** and **16 teaching-figure files**. Static sequence count 212 includes 209 visible PNGs and 3 empty/padding objects. The 417 candidate images are heuristic static crops—not 417 approved animation frames.

The independent check compared **262,144 canonical tile pixel indices**, all 4,096 tile diagnostic PNGs, all 626 visible sprite/candidate PNGs and 8,192 tile presentation cells. It recovers 629 sprite canvas/crop records, 13,959 exact source-span rows and 9,074 contact-sheet memberships. These are direct measurements of the supplied package, not original-game runtime observations. `audit/asset_verification_v1_5.json` is the machine-readable result.

The semantic-alias registry is still empty. That is not hidden by a percentage. No named helicopter animation, complete enemy roster, per-stage layout, collision boundary or sound-event meaning has been promoted to runtime-verified status. Each required role instead has a stable `CG-SLOT-*` obligation with explicit evidence requirements.

## A3. Source identity and preservation

The original archive contains 18 actual files against 19 canonical stock-MAME manifest objects in the pinned MAME 0.289 protected-parent profile. **17/19 match exactly.** Of the 16 objects consumed by the current emulator runtime implementation, **15/16** match; of the three PLD audit-only objects, **2/3** match. The supplied `315-5151.ic74` has CRC32 `7bd11a6c` / SHA-1 `2d75a2276e572f97f269af062536c1c58e1c8eaf` and is classified **`HISTORICAL_BAD_DUMP_NOT_CANONICAL`**; the pinned profile requires CRC32 `1377a6ef` / SHA-1 `b85acd7292e5480c98af1a0492b6b5d3f9b1716c`. `315-5139.ic50` is **`MISSING_SOURCE`**. The comparison authority is MAME 0.289 tag `mame0289`, commit `f34f02505e32c1993c6a782b6814232cbfc74e36`. No replacement bytes are downloaded, fabricated or silently normalized.

### A3.1 v1.13 official-emulator research bridge

The emulator side of the earlier environment blocker is now resolved. The official MAME GitHub Actions **CI (Linux)** artifact for commit `f34f02505e32c1993c6a782b6814232cbfc74e36` was downloaded by artifact ID `8778944161`; its published and locally verified artifact SHA-256 is `9dbecc4a0ff77c48bbcf273445d34b2789fe605bc38e14886c85c2df58c5d72b`, and the extracted `mame` executable SHA-256 is `ec3f8c6be33d31ba0b275503506baab3ee120946a4c3158d101bbae554f7c7f3`. It reports `0.289 (mame0289)`. `provenance/runtime_bridge/mame_0289_official_ci_artifact.json` records this chain.

The CI binary expected Qt/SDL_ttf shared libraries that are absent from this container. A generated symbol-only headless loader shim was used solely to satisfy those unused GUI/font linkage points while running with `-video none -sound none`. The shim is **not** gameplay evidence, is not a replacement for MAME emulation code, and must never be used to claim debugger/UI fidelity. Its reproducible source is under `tools/runtime_shims/linux/`.

A temporary research ROM ZIP was constructed from the already user-supplied source set using the exact historical bad MCU and a synthetic zero-filled placeholder only for the missing audit-only PLD. This is classified `CG-SRC-PROFILE-MAME0289-CHOPLIFT-RESEARCH-BRIDGE` / `NONCANONICAL_RESEARCH`. It is intentionally rejected by strict source admission and by every evidence-promotion path. The temporary ROM ZIP itself is not redistributed in this package.

`CG-CAP-RESEARCH-004` then executed `CG-PLAN-001` for 120 captured frames. The collector recorded 120 frame rows, 120 input rows, four low-volume PSG/I/O events and 720 binary state/pixel blobs with zero reported drops. Across those frames the main CPU `PC` remained exactly `0`, bank entry remained `0`, screen pixels were invariant, and work/sprite/palette/video-window state was invariant; the sound CPU and sound RAM continued changing. The bounded conclusion is **the supplied historical bad MCU does not provide usable protected-parent gameplay under the pinned MAME runtime**. This is useful negative research evidence, but it is not evidence of what the canonical MCU does. See `capture/research/CG-CAP-RESEARCH-004/observation_summary.json`.

Source archive SHA-256: `4df1f9f56d4ed06a9159107b39487f68d1e63a1394b2459d023e7b06a0fb08a0`.  
Baseline package SHA-256: `b6e8069bb371ada989f22c46bf00cb15fcd9c884b00a5ec0cf4bcc49ab89c1fb`.

`ROM-MCU-8751` blocks treating the source as the canonical protected arcade set without a documented decision. `ROM-PLD-5139` is an archival/hardware-completeness gap; a missing programmable-logic dump is not by itself proof that a high-level reconstruction cannot work. Decisions must name the selected comparison profile and reference set. A bootleg, unprotected or otherwise different set is not an interchangeable reference merely because its graphics look similar.



### A3.2 v1.14 historical-MAME MCU repair resolution

The statement in v1.13 that the historical bad MCU “cannot take us further” is superseded. It is correct only for the **unmodified** bad dump under current MAME. Historical MAME source provides a bounded repair path.

MAME tag `mame0131` (tag commit `4b7dd3cd0de9a22407105730d933383bc78f96a6`) implemented a partial Choplifter 8751 simulation named `choplift_i8751_run`. It initialized the 8255 PPI and, while active, supplied a small measured state bridge into main/video RAM. This establishes a historical HLE fallback but is not treated as strict protection truth.

MAME tag `mame0131u2` (tag commit `befc46f2579cf1835a7065d2e90c954eef13c576`) then used the same 4096-byte historical MCU dump supplied in this project (CRC32 `7bd11a6c`, SHA-1 `2d75a2276e572f97f269af062536c1c58e1c8eaf`) with real 8751 execution. Its `DRIVER_INIT(choplift)` explicitly repaired three loaded MCU bytes before execution:

| MCU offset | Documented bad value | Historical repair |
| --- | ---: | ---: |
| `0x0100` | `0xD5` | `0x55` |
| `0x027B` | `0xF2` | `0xFB` |
| `0x02FF` | not asserted | `0xF6` |

The historical source says these repairs make the bad dump work, but also notes that the checksum correction means something remained incorrect. MAME 0.131u2 release notes credit the Choplifter 8751 to The Decapping Project / Aaron Giles. The repair remained in subsequent releases including MAME 0.132. Current MAME 0.289 instead requires the canonical MCU CRC32 `1377a6ef` / SHA-1 `b85acd7292e5480c98af1a0492b6b5d3f9b1716c`.

v1.14 therefore adds three explicit evidence lanes:

- **`CG-LANE-CANONICAL-MCU`** — exact canonical MCU + pinned stock MAME; the only lane eligible for strict MCU/protection evidence after all other gates pass. Current status: `BLOCKED_EXTERNAL_SOURCE`.
- **`CG-LANE-HISTORICAL-MCU-REPAIR`** — exact admitted historical BAD_DUMP plus the three public MAME repairs. Current status: `MAME0289_REPAIRED_RUNTIME_PROVEN_NONCANONICAL`. Native pinned-MAME execution now proves main-Z80 release, exact 120 consecutive screen-frame capture and rendered progression into the attract loop. Evidence from this lane remains noncanonical and may create discovery/candidate evidence only.
- **`CG-LANE-HISTORICAL-HLE-0131`** — reproduction of the earlier bounded HLE. Current status: `DOCUMENTED_FALLBACK`, with lower evidence authority than repaired real-MCU execution.

The repair tooling is fail-closed. `repair_bad_mcu.py` admits only the exact historical dump by size + CRC32 + SHA-1, refuses the canonical MCU and unknown inputs, never overwrites the input, and emits a noncanonical evidence manifest. `choplift_0131u2_repair.lua` applies the same three repairs to MAME's loaded `:mcu` region, verifies the documented repair-site fingerprint and post-write values, and requests one soft reset so emulation restarts with the repaired in-memory MCU image.

No repaired output is allowed to satisfy `CG-GATE-SOURCE-REFERENCE` or a VERIFIED promotion. A repaired-run gameplay result must later survive a **disjoint canonical held-out capture** before it can be promoted to strict original behavior. This preserves the value of the historical repair without laundering it into canonical evidence.

The independent startup probe now satisfies the narrower research questions that can be answered without claiming a MAME capture: the repaired 8751 reaches the PPI initialization sequence, clears Z80 BUSREQ, and the protected main program then leaves PC=0, selects bank 3 and mutates work/sprite/palette/video memory. **Rendered boot/title fidelity is not yet proven.** The next emulator-level acceptance test remains a repaired `CG-PLAN-001` under the pinned MAME 0.289 executable; until that is executed, this lane is not `MAME_RUNTIME_PROVEN`.



### A3.3 v1.14 independent repaired-MCU startup execution

Because the native MAME runner is unavailable in this turn, v1.14 does **not** substitute a synthetic success for the missing MAME capture. Instead it executes an independent two-stage research probe whose authority is intentionally narrower than MAME.

#### Repaired 8751 behavioral probe

The 8751 stage uses Aimini/js51 pinned at commit `7faca5ed5935857e74fd7737d9ed7fea5b819f8a`. Its MOVX `@Ri` external-address path was adapted to include P2 as the high address byte, and the external-memory/control mapping was wired to the MAME 0.289 System 1 contract: P1 bit 6 controls Z80 BUSREQ; P1 bits 4/3 select Z80 program, extended main ROM, Z80 I/O or invalid/watchdog space.

Only the three MAME 0.131u2 repair bytes were changed. With the actual user-supplied protected main program/bank ROMs attached, the repaired firmware independently reached **BUSREQ deassertion at interpreted 8751 instruction 2,177,605**. The last externally visible initialization writes before release were:

| Interpreted step | MCU external address | Value | Bounded interpretation |
| ---: | ---: | ---: | --- |
| 2,177,589 | `0x0017` | `0xC0` | 8255 control |
| 2,177,592 | `0x0014` | `0x00` | PPI port A |
| 2,177,595 | `0x0015` | `0x40` | PPI port B / video-mode latch |
| 2,177,598 | `0x0016` | `0x00` | PPI port C |
| 2,177,605 | — | — | P1 bit 6 clears; Z80 BUSREQ released |

The bounded 8751 run observed 155 distinct MCU PCs and no interpreter error. **The instruction number is not hardware time.** The js51 path is an independent semantic interpreter with explicit adaptations; it is not a cycle-certified substitute for MAME.

#### Protected main-Z80 startup probe

The second stage uses DrGoldfire/Z80.js pinned at commit `2207d7c6a8b42246ea12efbf9dba8b2adf010437` (MIT licensed). Its PPI state is initialized from the exact repaired-MCU writes above: control `C0`, A=`00`, B=`40`, C=`00`. Main memory and the four 16 KiB banks use the actual supplied EPR-7124/7125/7126 bytes.

The main program immediately leaves PC=0, reads PPI B=`0x40`, ORs `0x0C`, writes `0x4C` back to port B, selects **bank 3** and enters the banked `0x9400` startup path. Across **120 nominal frame-equivalent intervals**, the bounded probe executed **1,127,010 interpreted Z80 instructions / 8,000,043 nominal Z80 cycles**, observed 49 sampled PC values and ended at sampled PC `0x9445` without an interpreter exception. It recorded:

- **124,246** work-RAM writes;
- **2,048** sprite-RAM writes;
- **2,050** palette-RAM writes;
- **4,116** video-RAM writes;
- one initial I/O read and one I/O write needed for the bank/video-mode setup.

This proves only that the documented historical repairs are sufficient, in the independent model, to progress through the MCU startup handshake, release the protected main CPU and enter nontrivial banked initialization. It does **not** prove a rendered title screen, exact System 2 wait states, collision behavior, sound synchronization, post-release concurrent MCU timing, or canonical protection behavior.

Machine-readable evidence is `chopper-v114/independent_runtime_evidence_v1_14.json`; the human-readable companion is `chopper-v114/INDEPENDENT_RUNTIME_PROBE_V1_14.md`.

#### v1.14 gate disposition

| Gate | Result |
| --- | --- |
| Historical bad-dump identity | PASS |
| Three-site historical repair admission | PASS |
| Independent repaired-8751 progression | PASS |
| Repaired firmware reaches PPI initialization | PASS |
| Repaired firmware releases Z80 BUSREQ | PASS |
| Independent protected-Z80 startup | PASS |
| Work/sprite/palette/video memory mutation | PASS |
| 120 nominal frame-equivalent research intervals | PASS |
| Native pinned-MAME repaired capture | **NOT_RUN_ENVIRONMENT_BLOCKED** |
| Rendered boot/title framebuffer proof | **NOT_PROVEN** |
| Canonical MCU source identity | **BLOCKED** |
| VERIFIED promotions from repaired lane | **0 / prohibited** |
| Strict arcade fidelity | **NO-GO** |

The evidence lane is `INDEPENDENT_RESEARCH_COEMULATION`; `promotion_eligible=false` and `canonical_identity_satisfied=false`. Any semantic candidate discovered here must later be repeated under a pinned MAME capture and survive a disjoint canonical-MCU held-out comparison before strict promotion.


### A3.4 v1.15 native MAME 0.289 repaired-MCU runtime proof

v1.15 executes the historical repair lane under the actual pinned MAME 0.289 binary rather than relying on the independent co-emulation result alone.

**Emulator identity.** The MAME executable reports `0.289 (mame0289)` and has SHA-256 `ec3f8c6be33d31ba0b275503506baab3ee120946a4c3158d101bbae554f7c7f3`. The official CI artifact ZIP supplying it has SHA-256 `9dbecc4a0ff77c48bbcf273445d34b2789fe605bc38e14886c85c2df58c5d72b`. The same loader-only Qt/SDL_ttf linkage shims used in v1.13 are retained; they supply no emulation/game logic.

**Research source identity.** The exact user-supplied historical MCU remains CRC32 `7bd11a6c` / SHA-1 `2d75a2276e572f97f269af062536c1c58e1c8eaf`. Before MAME starts, only the three public 0.131u2 corrections are applied. The resulting noncanonical MCU is CRC32 `7303446b`, SHA-1 `504997a1e9f3e123d84baf2810840a82d01dd6c7`, SHA-256 `6268a868697ba6d429c6ce8d5652424afc03a1687a890d162c5749b19d6019eb`. MAME reports the expected checksum warning because its canonical target remains CRC32 `1377a6ef` / SHA-1 `b85acd7292e5480c98af1a0492b6b5d3f9b1716c`. The missing audit-only PLD also remains noncanonical in the research profile.

#### A3.4.1 Protected main-CPU release

`CG-CAP-RESEARCH-005-MAME0289-REPAIRED` uses MAME's Lua API with `LUA_ON_PERIODIC` sampling. This is deliberate: the earlier headless `add_machine_frame_notifier` collector ceased receiving callbacks during the long MCU startup/checksum interval even though machine time and emulation continued.

The last sampled state with the main Z80 held was:

- emulated time **5.341440 s**;
- main PC `0x0000`, bank 0;
- MCU PC `0x0200`, P1 `0x4F`, DPTR `0xFF8E`.

The first sampled released state was:

- emulated time **5.358080 s**;
- main PC **`0x9419`**, bank **3**;
- MCU PC `0x00F0`, P1 **`0x19`**, DPTR `0x0016`.

Therefore the actual MAME runtime proves that the repaired MCU releases the protected main CPU. The release is bounded to the 16.64 ms interval between those samples.

Immediately around release MAME recorded the following I/O sequence:

| Sequence | Emulated time (s) | Operation | Port | Value |
| ---: | ---: | --- | --- | --- |
| 0 | 5.347713326 | write | `0x17` | `0xC0` |
| 1 | 5.347720826 | write | `0x14` | `0x00` |
| 2 | 5.347728326 | write | `0x15` | `0x40` |
| 3 | 5.347735826 | write | `0x16` | `0x00` |
| 4 | 5.347757500 | read | `0x15` | `0x40` |
| 5 | 5.347762250 | write | `0x15` | `0x4C` |

The final `0x4C` port-B write selects bank 3, matching the protected main program boot path.

The event stream contains **960,411** pass-through events with **zero reported drops**: 716,244 sound-RAM writes, 236,568 work-RAM writes, 4,116 mapped-video writes, 2,050 palette writes, 1,268 PSG writes, 159 sprite writes, five main-I/O writes and one main-I/O read.

#### A3.4.2 Exact 120 MAME video frames

`CG-CAP-RESEARCH-006-MAME0289-REPAIRED-120FRAMES` is a second independent run of the same repaired source profile. It gates each capture on MAME's actual `screen:frame_number()` value rather than equating the periodic callback itself with a frame.

Acceptance result:

| Property | Result |
| --- | --- |
| release screen frame | 321 |
| first captured screen frame | 321 |
| last captured screen frame | 440 |
| captured frames | **120** |
| frame-number gaps | **0** |
| consecutive frame numbers | **PASS** |
| bank during bounded interval | 3 |
| sampled main-PC values | 15 |

Across these exact frames, work RAM has 118 distinct snapshots; palette RAM has 2; the mapped video window has 2; sound RAM has 120; and visible screen pixels have 2. Work RAM, palette RAM and mapped video first differ from the release snapshot at captured frame index 3; visible pixels first differ at frame index 4. Sprite RAM has one net snapshot state during this immediate 120-frame interval even though the longer event capture observes sprite writes. The last captured screen visibly renders **IC CHECK**.

This satisfies the previously open repaired-`CG-PLAN-001` requirement for a clean 120+ frame MAME run after the main CPU leaves PC=0.

#### A3.4.3 Rendered title and attract progression

A separate 120-emulated-second visual probe captured one MAME screenshot per emulated second. It produced **120 screenshots with 87 distinct SHA-256 image states**.

Observed checkpoints include:

- t=30 s — `IC CHECK` / hardware-test pattern;
- t=50 s — Choplifter title logo with Dan Gorlin / Sega reprogramming credit;
- t=60 s — licensing/copyright information screen;
- t=80 s — attract/gameplay scene with helicopter, HUD and `INSERT COIN`;
- t=100 s — `Game Over` attract/game scene;
- t=119 s — `Your Mission / Rescue Hostages` attract message.

The rendered result disproves the earlier *permanent-stall* interpretation of `CG-CAP-RESEARCH-004`. That v1.13 capture remains a valid observation of its early sampled window, but its collector stopped receiving machine-frame callbacks before the repaired MCU could complete its multi-second startup/checksum sequence. The correct current statement is: the **unmodified** BAD_DUMP remains unusable, while the exact historical repaired image progresses through checks, title and attract behavior under MAME 0.289.

#### A3.4.4 Gate disposition

| Gate | v1.15 result |
| --- | --- |
| historical BAD_DUMP identity | PASS |
| exact three-site historical repair | PASS |
| native pinned MAME 0.289 execution | PASS |
| protected main-Z80 release | PASS |
| exact 120 consecutive MAME screen frames | PASS |
| zero captured screen-frame gaps | PASS |
| work/palette/video/screen state change | PASS |
| rendered hardware-check screen | PASS |
| rendered title/licensing screens | PASS |
| rendered attract/gameplay sequence | PASS |
| runtime event stream | 960,411 events / zero reported drops |
| canonical MCU source identity | **BLOCKED** |
| strict VERIFIED promotions from repaired lane | **0 / prohibited** |
| strict arcade fidelity | **NO-GO** |

The repaired lane is now `MAME0289_REPAIRED_RUNTIME_PROVEN_NONCANONICAL`. It is strong discovery/reference evidence, but it is not canonical proof. The next strict dependency is an authorized canonical MCU followed by the same capture protocol as a disjoint held-out run.

## A4. Stable identity and naming migration

The current project is **Chopper Game**. New content uses `/Game/ChopperGame/`; new module specifications use `ChopperGameCore`, `ChopperGameRuntime` and `ChopperGameTests`. The existing short C++ prefix `Chop` may remain to avoid needless source-symbol churn. No Unreal assets have actually been renamed because the package has no Unreal project. `unreal/import_path_migration.csv` records all 4,742 planned import-path updates; `unreal/naming_migration.csv` records component/task mapping edits.

Existing `ROM-*`, `TILE-*`, `IMG-*`, `SPRSEQ-*`, `PAL-*`, `MIX-*`, `SUB-*`, `FUNC-*`, `INS-*`, `GAM-*`, `WFL-*`, `UE-*`, `UNK-*` and `TST-*` identities are retained. New IDs have the `CG-` prefix. A stable ID identifies an object or obligation; the attached evidence can change. An asset's physical-file identity is path-derived, while its SHA-256 identifies that version's bytes. Two identical PNGs retain different semantic candidate identities until evidence permits an alias.

## A5. Asset mapping contract

`assets/asset_catalog.csv` is the logical entry point. Each row names category, physical path/file ID if present, diagnostic image ID, semantic status, evidence level, usage gate, blocking unknown, indexed-data locator and explanatory note. `assets/image_file_audit.csv` adds dimensions and SHA-256 for every diagnostic PNG. `audit/package_file_catalog.csv` inventories every payload file, not only pictures.

`assets/source_span_registry.csv` traces logical objects to supplied ROM IDs and **half-open byte intervals** `[start,end)`. Every interval is in bounds and records interpretation. Each tile has three 8-byte spans, one per bitplane. Each static sequence and candidate has its own precise ROM slice. Palette records have three 1-byte spans. Mixer records have one 1-byte span. A whole-ROM row identifies the actual supplied file. Contact sheets and figures are derived presentation, not independently discovered original ROM objects.

`assets/contact_sheet_membership.csv` gives sheet ID, member ID and exact displayed rectangle for every tile atlas/sheet cell, sprite thumbnail and palette cell. Coordinates are pixels in the sheet image. They are not game-world positions. Tile sheet rectangles are scaled nearest-neighbor copies; sprite thumbnail rectangles can be reduced. The palette hexadecimal label is a text overlay, not part of the original physical color.

### A5.1 Worked trace: one tile

`TILE-0000` → `IMG-TILE-0000` → `assets/tiles/individual/IMG-TILE-0000.png`. The strict indexed locator is `assets/tiles/tile_pixels_uint8.npy[0,0:8,0:8]`. Its source spans are byte 0 through 7 inclusive in each of `ROM-TILE-P0`, `ROM-TILE-P1` and `ROM-TILE-P2`. The linked sheet cells show that same tile, not an inferred stage use. Its stage meaning remains blocked by `UNK-STAGE-TILEMAPS`.

### A5.2 Worked trace: a sprite crop

`SPRSEQ-B0-R000` uses `ROM-SPR-B0` bytes `[0,760)`, stride 20 bytes and 38 static rows. Its diagnostic canvas is 80×38 hardware pixels. The saved crop is `[0,1,72,32)`, producing 72×31 pixels. The offset restores where that crop sits in the static canvas. It does **not** establish a helicopter pivot, collider, animation duration or runtime descriptor.

### A5.3 Strict admission and evidence promotion

A research PNG may appear in the explorer without being eligible for a production level. A strict binding needs the slot ID, exact source assets and hashes, runtime descriptor capture, trace ID, successful runtime comparison record, reviewer, profile and approved status. Animation additionally needs ordered frames, measured clock and durations, facing, source addressing, palette changes, visibility, origin/pivot and interrupt/loop rules. A logically invisible state needs positive evidence of invisibility, not a guessed missing-art fallback.

The current source-to-use chain is: **ROM interval → raw/derived object → sealed original capture → candidate-only analysis → repeated discovery trials → external review → disjoint held-out analysis → VERIFIED proof → semantic binding/strict parameter → target comparison → release gate**. No earlier link implies a later one. `gameplay/binding_contract.json` remains the binding contract; `analysis/promotion_gate_registry.csv` is the executable-admission checklist implemented by `tools/evidence_promotion.py`.

### A5.4 Capture analysis and promotion contract — v1.10

`analysis/subject_recipe_registry.csv` contains **89 evidence recipes**: one for every 63 required asset slot and every 26 strict parameter. Each recipe constrains allowed capture plans, analysis methods, minimum repeat trials, held-out policy and comparison rule. All current recipes require at least **3 distinct discovery captures**; duplicated capture IDs do not satisfy repetition.

`tools/evidence_analysis.py` validates each input capture seal first, preserves exact integer attotime, summarizes byte changes/event signatures/input transitions/framebuffer hashes, and may emit heuristic candidate assets or measured candidate values where the recipe permits. Its output status is candidate-only. A changed byte, descriptor-like address, repeated cadence or candidate score is **not a probability of truth and not a semantic fact**.

`tools/evidence_promotion.py` separates review from analysis. The reviewer may not be the analysis worker. Verification requires **13 gates**: canonical original-source readiness; sealed capture validity; subject/recipe scope; minimum repeated trials; unique discovery captures; stable selected candidate; external approval; disjoint held-out captures; independent held-out match; compatible toolchain/profile/config; explicit synthetic prohibition; no active VERIFIED conflict; and an immutable proof seal. `apply` revalidates the discovery analysis, review and held-out analysis instead of trusting the proof JSON in isolation.

The bundled `analysis/fixtures/CG_ANALYSIS_SYNTHETIC_001` is deliberately synthetic. It demonstrates the analyzer and seal format, but the original-source/no-synthetic gates prevent it from creating a VERIFIED proof. In v1.10 the gameplay evidence registry, promotion registry and semantic-alias registry remain empty; all 63 slots and 26 strict parameters remain unresolved/unapproved.

The proof mechanism uses content hashes and contextual revalidation, **not public-key signatures**. A structurally self-consistent proof copied from an untrusted party is therefore insufficient by itself; promotion requires its bound context, followed by release regeneration/validation. Original-game fact promotion and Unreal target comparison are separate gates.

### A5.5 Canonical source admission and first-run controller — v1.11 (retained)

`tools/source_admission.py` is the only current intake path for additional original source objects. It scans operator-supplied files, directories, or ZIPs by **exact size + CRC32 + SHA-1** against `provenance/mame_0289_choplift_manifest.csv`; filenames are convenience only and cannot authorize a match. It never downloads or synthesizes bytes. ZIP traversal/oversize cases fail closed. `stage` is all-or-nothing: only a complete 19/19 set is copied into an operator-selected external workspace, rescanned, and atomically published. Canonical source bytes are not copied back into the distributable Bible package.

The executed v1.11 admission preflight on the packaged `source/roms` remains **17/19**. `ROM-MCU-8751` is missing as a canonical object even though the historical bad-dump bytes are recognized separately; `ROM-PLD-5139` is missing. `audit/source_admission_preflight_v1_11.json` is the exact machine-readable result. A search of the available prior project package also found the same noncanonical MCU and no missing PLD, so no hidden canonical source was promoted.

`tools/capture_controller.py` turns the 14 capture plans into executable work orders. It independently gates both source admission and the emulator. MAME must identify as version 0.289 and its executable SHA-256 is recorded. `CG-PLAN-001` is the first bounded autonomous job: after both gates pass, it stages canonical source externally, prepares an isolated run, executes at least **120 frames**, finalizes and seals the capture, checks stream-count attestations, and writes an execution receipt. Plans 2–14 remain operator-guided or require a hash-pinned playback input.

The current queue is `capture/execution_queue_registry.csv`; all 14 entries are `BLOCKED_SOURCE` because source admission fails before emulator readiness can matter. `capture/capture_campaign_registry.csv` defines `CG-CAMPAIGN-001` as the boot/title/attract baseline campaign: 3 distinct discovery captures plus 1 disjoint held-out capture for `CG-SLOT-UI-TITLE`. No attempt count has been incremented and no `latest_capture_id` exists. A blocked preflight is an executed negative result, **not** an original-game runtime test.

### A5.6 Exact MAME 0.289 driver/source-role audit — v1.12

`CG-MAME0289-DRIVER-AUDIT-001` resolves an important ambiguity in the earlier 19-object gate. The target remains the protected parent `choplift`, whose MAME 0.289 machine configuration calls `mcu(config)` and whose ROM definition declares canonical `315-5151.ic74`. The unprotected `chopliftu` variant uses different main program ROMs (`EPR-7152/7153/7154`) and is **not** an equivalent replacement for the protected parent.

The same protected parent declares three PLD files under the `plds` ROM region. Current `system1_state` runtime region members reference main program, sprite, lookup-PROM and optional color-PROM regions, but do not reference a `plds` region. Therefore v1.12 separates **runtime-consumed source** from **stock-MAME ROM-audit/source-identity source** without weakening strict staging:

| Gate view | Current | Required | Meaning |
| --- | ---: | ---: | --- |
| Stock MAME protected-parent manifest | 17 | 19 | Strict stock launch/source identity remains incomplete |
| Runtime-consumed source | 15 | 16 | Canonical 8751 MCU is the only missing runtime-semantic source object |
| PLD audit-only source | 2 | 3 | `315-5139.ic50` is missing; current driver does not consume PLD bytes as runtime data |

The board comment describing a DIP40-sized plug-in board containing no MCU is associated with the documented EPR-7152/7153/7154 unprotected board/version and must not be generalized to the protected parent. Strict `CG-PLAN-001` remains fail-closed: **19/19 official stock manifest + verified MAME 0.289 executable** are still required before the run can be called a canonical stock-MAME protected-parent capture.

A Linux build probe found GCC 14.2, clang 17, GNU Make 4.4.1, Ninja 1.12.1 and git 2.47.3, but no complete pinned MAME source tree and no MAME binary. Direct shell acquisition was attempted and failed because this execution environment could not resolve `github.com`; therefore **no MAME build is claimed**. The exact subset-build command is recorded in `tools/v1_12/mame_build_probe.py` and `audit/mame_build_attempt_v1_12.json`.

The canonical run ZIP created later by `tools/source_profile.py` is byte-deterministic (fixed member names, ordering, timestamps, permissions and storage method) and exists only in the run workspace. `capture/session_manifest_schema.json` version 2 additionally binds `source_archive_sha256` and collector frame/event count attestations so a sealed bundle cannot claim streams the collector did not report.

## A6. Gameplay model: rescue loop, not merely shooting

The documented core loop is fly into danger, engage threats, release captives, land in an eligible position, board passengers, return to the safe delivery area, unload and earn the observed benefits, then satisfy the stage-completion predicate and progress. Survival, passenger state, fuel/time pressure, score/lives and enemy activity interact. The original package's `GAM-CORE-001` documents the broad loop; exact numeric rules require observation.

The commonly cited 32 hostages in groups of 8, passenger capacity 8 and 21-rescue progression threshold are retained as **secondary-source hypotheses**. They are not strict engine defaults. In particular, a minimum rescued count may be only one clause of a completion predicate. Remaining captives, deaths, unloading state, time and death precedence must be checked rather than invented.

Represent session state, helicopter movement/facing, individual hostage lifecycle, attacks, enemies, stage data, UI and audio as separate concerns. A state name such as`DAMAGED` is a specification scaffold, not proof that the original has nonfatal hit points. A candidate transition must be removed or refined if runtime evidence contradicts it. Presentation cannot determine simulation collisions, boarding eligibility or score.

### A6.1 Rescue identity and accounting

Each hostage has a stable instance ID and exactly one committed bookkeeping category at a time. For a closed stage roster, `N_initial + N_created - N_removed = N_captive + N_ground + N_aboard + N_rescued + N_dead`, with any spawn/despawn explicitly recorded. Do not hard-code`N_initial=32`. Intermediate animation states must map to one committed bookkeeping category, never double-counting a boarding passenger in both ground and aboard.

A duplicate delivery event must not score/refuel twice. A duplicate death event must not decrement totals twice. Whether a passenger dies before boarding, boards before a same-tick crash, or becomes rescued before a same-tick fuel event is **measured ordering**, not a designer's fairness preference. The reference ledger demonstrates idempotence/atomicity; it deliberately does not choose original event order or award values.

### A6.2 Controls, movement and weapons

Hardware input evidence establishes an 8-way directional control and two attack inputs in the inherited material. Canonical device sampling must specify direction conflicts, edge/hold transitions, control-lock intervals and tick/cycle phase. A modern binding layout is a front-end choice; it does not prove the original second button's exact behavior.

Measure acceleration, neutral motion, velocity limits, reversal, diagonal behavior, turning/facing, muzzle offsets, attack cadence, movement restrictions while firing, landing eligibility and ground interaction. A fixed-step loop makes a chosen algorithm repeatable; it does not prove that the algorithm matches the original. Original M1-dependent CPU timing and sub-frame events must not be replaced with an average cycles-per-frame estimate when phase matters.

### A6.3 Failure and success definitions

Workflow success means the specified observable state/event/output agrees with approved original evidence. Failure includes missing proof, stale hashes, unregistered resources, out-of-range source addressing, nondeterministic ordering, unexpected extra entities, mismatched counts, incorrect frame/timing, or unexplained renderer differences. A test that cannot run is`NOT_RUN`, not pass. A source mismatch remains a mismatch even when the research package correctly reports it.

## A7. All 20 gameplay/workflow contracts

Every contract below links a legacy workflow, gameplay requirements, implementation-system specifications, binding slots, existing acceptance test and unresolved evidence. The detailed 60 baseline/boundary/negative scenario obligations are in`gameplay/runtime_test_scenarios.csv`. None has been run against the original or Unreal in this revision.

### CG-GP-001 · Boot

**Workflow:** `WFL-BOOT-001` · **Acceptance:** `TST-FLOW-BOOT`.  
**Requirements:** `GAM-ATTRACT-001`.  
**Systems:** `UE-GM;UE-SIM-WORLD;UE-AUDIO;UE-HUD`.

**Entry and guard:** ROM/config/profile hashes resolved; title resources may not be substituted silently.

**Committed effect:** Initialize session once; reset per-session state without modifying immutable stage assets.

**Evidence experiment:** Cold boot versus warm reset with identical configuration; test invalid source hash before loading.

**Success:** Title/attract reaches stable state with no unresolved production assets. **Failure:** Crash, nondeterministic checksum, missing asset ID.

**Binding obligations:** `CG-SLOT-UI-TITLE;CG-SLOT-AUDIO-ATTRACT`.  
**Blocking evidence:** `UNK-ATTRACT-FLOW`.

### CG-GP-002 · Input Frame

**Workflow:** `WFL-INPUT-001` · **Acceptance:** `TST-INP-CANON`.  
**Requirements:** `GAM-WPN-001`.  
**Systems:** `UE-PC;UE-INPUT-STATE;UE-REPLAY`.

**Entry and guard:** Device samples quantized at the measured simulation sampling phase; opposite-direction and edge/hold policies explicit.

**Committed effect:** Append one canonical input record per simulation sampling instant; replay bypasses physical devices.

**Evidence experiment:** Press/release on either side of a sample boundary; contradictory directions; held inputs during scene transition.

**Success:** Same device action sequence produces identical canonical frame bits. **Failure:** Analog noise/frame-order changes sim input.

**Binding obligations:** `No direct visual/audio resource; uses canonical state/input/replay data`.  
**Blocking evidence:** `UNK-INPUT-SAMPLING-001`.

### CG-GP-003 · Stage Load

**Workflow:** `WFL-STAGE-LOAD-001` · **Acceptance:** `TST-STAGE-LOAD`.  
**Requirements:** `GAM-STAGE-001`.  
**Systems:** `UE-STAGE-CTRL;UE-STAGE-SIM;UE-STAGE-RENDER;UE-PALETTE`.

**Entry and guard:** Complete capture-backed stage record, world geometry, tile-page state and spawns required.

**Committed effect:** Instantiate deterministic IDs from stage data; no random engine construction order; snapshot initial state.

**Evidence experiment:** Reload each stage from fresh state and from preceding stage; missing tile binding must reject strict loading.

**Success:** State checksum and reference screenshot match approved capture. **Failure:** Missing/ambiguous tile or palette state.

**Binding obligations:** `CG-SLOT-STG-01-MAP;CG-SLOT-STG-01-SCROLL;CG-SLOT-STG-01-PALETTE;CG-SLOT-STG-01-SPAWN;CG-SLOT-STG-01-DYNAMIC;CG-SLOT-STG-02-MAP;CG-SLOT-STG-02-SCROLL;CG-SLOT-STG-02-PALETTE;CG-SLOT-STG-02-SPAWN;CG-SLOT-STG-02-DYNAMIC;CG-SLOT-STG-03-MAP;CG-SLOT-STG-03-SCROLL;CG-SLOT-STG-03-PALETTE;CG-SLOT-STG-03-SPAWN;CG-SLOT-STG-03-DYNAMIC;CG-SLOT-STG-04-MAP;CG-SLOT-STG-04-SCROLL;CG-SLOT-STG-04-PALETTE;CG-SLOT-STG-04-SPAWN;CG-SLOT-STG-04-DYNAMIC`.  
**Blocking evidence:** `UNK-STAGE-TILEMAPS;UNK-PALETTE-RUNTIME`.

### CG-GP-004 · Helicopter Step

**Workflow:** `WFL-HELI-001` · **Acceptance:** `TST-HELI-TRACE`.  
**Requirements:** `GAM-CORE-001`.  
**Systems:** `UE-HELI-SIM;UE-COLLISION;UE-DATA-ANIM`.

**Entry and guard:** Control lock, motion state and facing are separate fields; exact acceleration, limits and guards unmeasured.

**Committed effect:** Resolve input -> measured update order -> displacement -> authoritative contacts; animation observes state only.

**Evidence experiment:** Tap versus hold all directions, neutral coast, reversal, diagonal, landing just above/below measured speed and altitude.

**Success:** Frame-by-frame position/state within verified tolerance. **Failure:** Engine physics/DeltaSeconds changes outcome.

**Binding obligations:** `CG-SLOT-HELI-SPAWN;CG-SLOT-HELI-AIRBORNE;CG-SLOT-HELI-ASCEND;CG-SLOT-HELI-DESCEND;CG-SLOT-HELI-LANDING;CG-SLOT-HELI-LANDED;CG-SLOT-HELI-TAKEOFF;CG-SLOT-HELI-DAMAGED;CG-SLOT-HELI-DYING;CG-SLOT-HELI-DEAD;CG-SLOT-HELI-RESPAWN-LOCK;CG-SLOT-AUDIO-ROTOR`.  
**Blocking evidence:** `UNK-TIME-HELI-ACCEL;UNK-TIME-LANDING;UNK-SPR-PLAYER-HELI`.

### CG-GP-005 · Primary Fire

**Workflow:** `WFL-WEAPON-001` · **Acceptance:** `TST-WPN-PRIMARY`.  
**Requirements:** `GAM-WPN-001`.  
**Systems:** `UE-WEAPON-SYS;UE-PROJECTILE-SYS;UE-COLLISION;UE-SCORE`.

**Entry and guard:** Button identity, edge/hold behavior, cooldown, facing and any firing restrictions measured.

**Committed effect:** Allocate projectile identity once; attach shooter and spawn tick; collision/scoring emitted once.

**Evidence experiment:** Press before/on/after readiness; keep held through facing change, landing, death, and respawn.

**Success:** Projectile frame/timing and result match capture. **Failure:** Different rate/trajectory/event order.

**Binding obligations:** `CG-SLOT-WEAPON-PRIMARY;CG-SLOT-AUDIO-PRIMARY`.  
**Blocking evidence:** `UNK-TIME-WEAPON-CADENCE;UNK-SPR-PROJECTILE`.

### CG-GP-006 · Secondary/Bomb

**Workflow:** `WFL-WEAPON-002` · **Acceptance:** `TST-WPN-SECONDARY`.  
**Requirements:** `GAM-WPN-001`.  
**Systems:** `UE-WEAPON-SYS;UE-PROJECTILE-SYS;UE-COLLISION`.

**Entry and guard:** Second-button semantics are a hypothesis until observed; no automatic bomb physics default.

**Committed effect:** Spawn only the verified secondary effect; use the verified gravity/trajectory and contact ordering.

**Evidence experiment:** Paired button-A/button-B trials with stationary helicopter and identical seed/state.

**Success:** Button semantics and resulting projectile match runtime evidence. **Failure:** Assumed button function shipped without evidence.

**Binding obligations:** `CG-SLOT-WEAPON-SECONDARY;CG-SLOT-AUDIO-SECONDARY`.  
**Blocking evidence:** `UNK-TIME-WEAPON-CADENCE;UNK-SPR-PROJECTILE`.

### CG-GP-007 · Hostage Release

**Workflow:** `WFL-HOSTAGE-001` · **Acceptance:** `TST-HOST-RELEASE`.  
**Requirements:** `GAM-HOST-001`.  
**Systems:** `UE-HOSTAGE-SYS;UE-STAGE-SIM`.

**Entry and guard:** Captive group exists; destruction/release trigger and exact population are measured.

**Committed effect:** Transfer identities captive -> free; do not create duplicates on repeated damage or spawn events.

**Evidence experiment:** Hit same compound twice; release adjacent groups in one tick; interrupted release by player death.

**Success:** Count/state/timing match capture. **Failure:** Spawn count or release timing differs.

**Binding obligations:** `CG-SLOT-HOST-CAPTIVE;CG-SLOT-HOST-RELEASED;CG-SLOT-HOST-RUN-TO-HELI;CG-SLOT-HOST-WAIT;CG-SLOT-HOST-BOARDING;CG-SLOT-HOST-ABOARD;CG-SLOT-HOST-UNLOADING;CG-SLOT-HOST-RESCUED;CG-SLOT-HOST-DEAD`.  
**Blocking evidence:** `UNK-AI-SPAWN-RULES;UNK-SPR-HOSTAGE`.

### CG-GP-008 · Hostage Board

**Workflow:** `WFL-HOSTAGE-002` · **Acceptance:** `TST-HOST-BOARD`.  
**Requirements:** `GAM-HOST-002`.  
**Systems:** `UE-HOSTAGE-SYS;UE-RESCUE;UE-HELI-SIM`.

**Entry and guard:** Landing state, boarding distance, passenger capacity and cadence are capture-backed.

**Committed effect:** Commit each individual boarding once; capacity and displayed totals derived from same authoritative event.

**Evidence experiment:** Capacity-1/capacity/capacity+1 candidates; simultaneous arrivals; helicopter departs during boarding.

**Success:** Boarding order/capacity/timing match capture. **Failure:** Boards while invalid, exceeds capacity, loses deterministic order.

**Binding obligations:** `CG-SLOT-HOST-CAPTIVE;CG-SLOT-HOST-RELEASED;CG-SLOT-HOST-RUN-TO-HELI;CG-SLOT-HOST-WAIT;CG-SLOT-HOST-BOARDING;CG-SLOT-HOST-ABOARD;CG-SLOT-HOST-UNLOADING;CG-SLOT-HOST-RESCUED;CG-SLOT-HOST-DEAD;CG-SLOT-UI-RESCUE;CG-SLOT-AUDIO-BOARD`.  
**Blocking evidence:** `UNK-TIME-LANDING;UNK-SPR-HOSTAGE`.

### CG-GP-009 · Hostage Deliver

**Workflow:** `WFL-HOSTAGE-003` · **Acceptance:** `TST-HOST-DELIVER`.  
**Requirements:** `GAM-HOST-003;GAM-FUEL-001;GAM-SCORE-001`.  
**Systems:** `UE-HOSTAGE-SYS;UE-RESCUE;UE-SCORE;UE-FUEL`.

**Entry and guard:** Return-zone bounds, valid landing, unloading cadence and per-passenger reward timing measured.

**Committed effect:** Transfer identity aboard -> rescued; apply observed score/fuel deltas only once at the measured commit boundary.

**Evidence experiment:** Empty landing, one/full load, departure halfway through unloading, duplicate delivery callback.

**Success:** Unload order and deltas exactly match approved trace. **Failure:** Score/fuel applied twice or in wrong frame.

**Binding obligations:** `CG-SLOT-HOST-CAPTIVE;CG-SLOT-HOST-RELEASED;CG-SLOT-HOST-RUN-TO-HELI;CG-SLOT-HOST-WAIT;CG-SLOT-HOST-BOARDING;CG-SLOT-HOST-ABOARD;CG-SLOT-HOST-UNLOADING;CG-SLOT-HOST-RESCUED;CG-SLOT-HOST-DEAD;CG-SLOT-UI-RESCUE;CG-SLOT-AUDIO-DELIVER`.  
**Blocking evidence:** `UNK-TIME-LANDING;UNK-TIME-FUEL;UNK-SCORE-HOSTAGE-BONUS`.

### CG-GP-010 · Hostage Death

**Workflow:** `WFL-HOSTAGE-004` · **Acceptance:** `TST-HOST-DEATH`.  
**Requirements:** `GAM-HOST-001;GAM-HOST-003`.  
**Systems:** `UE-HOSTAGE-SYS;UE-RESCUE;UE-SCORE`.

**Entry and guard:** Damage owner, susceptible hostage states and death precedence established by paired traces.

**Committed effect:** Transition affected identities once; passenger-loss consequences measured rather than inferred.

**Evidence experiment:** Death and boarding/unloading same tick; player crash with zero/one/full passengers; duplicate hit event.

**Success:** State changes once and totals remain consistent. **Failure:** Negative counts/double-death/unsupported bonus formula.

**Binding obligations:** `CG-SLOT-HOST-CAPTIVE;CG-SLOT-HOST-RELEASED;CG-SLOT-HOST-RUN-TO-HELI;CG-SLOT-HOST-WAIT;CG-SLOT-HOST-BOARDING;CG-SLOT-HOST-ABOARD;CG-SLOT-HOST-UNLOADING;CG-SLOT-HOST-RESCUED;CG-SLOT-HOST-DEAD;CG-SLOT-UI-RESCUE`.  
**Blocking evidence:** `UNK-COLL-ORDER;UNK-COLL-SPRITE-SPRITE;UNK-SCORE-HOSTAGE-BONUS`.

### CG-GP-011 · Fuel

**Workflow:** `WFL-FUEL-001` · **Acceptance:** `TST-FUEL-TRACE`.  
**Requirements:** `GAM-FUEL-001;GAM-TIME-001`.  
**Systems:** `UE-FUEL;UE-HUD;UE-AUDIO`.

**Entry and guard:** Initial fuel, drain schedule, refill policy, warning threshold and fuel-out consequence captured.

**Committed effect:** Update in observed event order; do not assume drain before refill or that zero fuel instantly kills.

**Evidence experiment:** Threshold-1/exact/+1; delivery coincident with drain; zero fuel airborne versus landed; HURRY UP independently.

**Success:** Threshold frames and fuel-out match capture. **Failure:** Frame-rate dependent drain.

**Binding obligations:** `CG-SLOT-UI-FUEL;CG-SLOT-UI-HURRY;CG-SLOT-AUDIO-WARN`.  
**Blocking evidence:** `UNK-TIME-FUEL;UNK-TIME-STAGE-PACING`.

### CG-GP-012 · Enemy Spawn/AI

**Workflow:** `WFL-ENEMY-001` · **Acceptance:** `TST-AI-ARCHETYPES`.  
**Requirements:** `GAM-CORE-001;GAM-DIFF-001`.  
**Systems:** `UE-STAGE-SIM;UE-AI-SYS;UE-WEAPON-SYS`.

**Entry and guard:** Every encountered archetype has captured identity, spawn rule, states, weapon, collision and score mapping.

**Committed effect:** Spawn from deterministic triggers; per-entity state/timer/random draws explicit; no guessed blanket AI.

**Evidence experiment:** Same camera/player path at Easy/Hard, each stage and loop; off-screen enemy re-entry and repeated spawn trigger.

**Success:** Spawn/state transitions match verified trace for each archetype. **Failure:** Behavior Tree randomness or unverified tuning.

**Binding obligations:** `CG-SLOT-ENEMY-ARCHETYPES;CG-SLOT-ENEMY-WEAPONS;CG-SLOT-STG-01-MAP;CG-SLOT-STG-01-SCROLL;CG-SLOT-STG-01-PALETTE;CG-SLOT-STG-01-SPAWN;CG-SLOT-STG-01-DYNAMIC;CG-SLOT-STG-02-MAP;CG-SLOT-STG-02-SCROLL;CG-SLOT-STG-02-PALETTE;CG-SLOT-STG-02-SPAWN;CG-SLOT-STG-02-DYNAMIC;CG-SLOT-STG-03-MAP;CG-SLOT-STG-03-SCROLL;CG-SLOT-STG-03-PALETTE;CG-SLOT-STG-03-SPAWN;CG-SLOT-STG-03-DYNAMIC;CG-SLOT-STG-04-MAP;CG-SLOT-STG-04-SCROLL;CG-SLOT-STG-04-PALETTE;CG-SLOT-STG-04-SPAWN;CG-SLOT-STG-04-DYNAMIC`.  
**Blocking evidence:** `UNK-AI-ARCHETYPES;UNK-AI-SPAWN-RULES;UNK-AI-STATE-TRANSITIONS;UNK-AI-FIRE-RULES;UNK-AI-TARGETING;UNK-AI-DIFFICULTY;UNK-SPR-ENEMY`.

### CG-GP-013 · Collision

**Workflow:** `WFL-COLL-001` · **Acceptance:** `TST-COLL-MATRIX`.  
**Requirements:** `GAM-COLL-001`.  
**Systems:** `UE-COLLISION;UE-PIXELMASK`.

**Entry and guard:** Hardware flag behavior and gameplay consequences are separate evidence layers; exact contact shape unmeasured.

**Committed effect:** Generate contacts in observed ordering; one event per defined contact identity; no automatic alpha-mask assumption.

**Evidence experiment:** Transparent overlap, edge contact, one projectile/two targets, sprite/tile collision concurrent, slot-order swap.

**Success:** Reference collision scenarios match original flags/consequences. **Failure:** Chaos order/substep changes results.

**Binding obligations:** `CG-SLOT-WEAPON-PRIMARY;CG-SLOT-WEAPON-SECONDARY;CG-SLOT-ENEMY-ARCHETYPES;CG-SLOT-ENEMY-WEAPONS;CG-SLOT-AUDIO-IMPACT`.  
**Blocking evidence:** `UNK-COLL-ORDER;UNK-COLL-PRIORITY;UNK-COLL-SPRITE-SPRITE;UNK-COLL-SPRITE-TILE;UNK-COLLISION-GAME-USE`.

### CG-GP-014 · Scoring

**Workflow:** `WFL-SCORE-001` · **Acceptance:** `TST-SCORE-TABLE`.  
**Requirements:** `GAM-SCORE-001;GAM-LIFE-001`.  
**Systems:** `UE-SCORE;UE-DATA-SCORE;UE-HUD`.

**Entry and guard:** Score event values, numeric representation, bonus schedule and eligibility measured.

**Committed effect:** Use event IDs to prevent duplicate deltas; crossing bonus thresholds and digit overflow explicitly modeled.

**Evidence experiment:** Cross one or multiple bonus thresholds; duplicate event; score near display rollover; high-score tie.

**Success:** Every verified event delta matches runtime. **Failure:** Guide-derived number treated as canonical before trace.

**Binding obligations:** `CG-SLOT-UI-SCORE;CG-SLOT-UI-LIVES`.  
**Blocking evidence:** `UNK-SCORE-EVENT-VALUES;UNK-SCORE-BONUS-LIFE;UNK-SCORE-HOSTAGE-BONUS;UNK-SCORE-STAGE-BONUS`.

### CG-GP-015 · Stage Complete

**Workflow:** `WFL-STAGE-END-001` · **Acceptance:** `TST-STAGE-COMPLETE`.  
**Requirements:** `GAM-HOST-003;GAM-STAGE-001`.  
**Systems:** `UE-STAGE-SIM;UE-RESCUE;UE-SCORE`.

**Entry and guard:** Full rescue/death/remaining predicate captured; 21 is an unapproved secondary-source hypothesis.

**Committed effect:** Evaluate completion at measured tick boundary, apply tally once, advance stage/loop per captured flow.

**Evidence experiment:** Rescue 20 versus 21 versus all; many deaths; last rescue simultaneous with crash or fuel-out.

**Success:** 20/21 boundary and transition match runtime capture. **Failure:** Threshold assumption wrong or transition early.

**Binding obligations:** `CG-SLOT-STG-01-MAP;CG-SLOT-STG-01-SCROLL;CG-SLOT-STG-01-PALETTE;CG-SLOT-STG-01-SPAWN;CG-SLOT-STG-01-DYNAMIC;CG-SLOT-STG-02-MAP;CG-SLOT-STG-02-SCROLL;CG-SLOT-STG-02-PALETTE;CG-SLOT-STG-02-SPAWN;CG-SLOT-STG-02-DYNAMIC;CG-SLOT-STG-03-MAP;CG-SLOT-STG-03-SCROLL;CG-SLOT-STG-03-PALETTE;CG-SLOT-STG-03-SPAWN;CG-SLOT-STG-03-DYNAMIC;CG-SLOT-STG-04-MAP;CG-SLOT-STG-04-SCROLL;CG-SLOT-STG-04-PALETTE;CG-SLOT-STG-04-SPAWN;CG-SLOT-STG-04-DYNAMIC;CG-SLOT-UI-TALLY;CG-SLOT-AUDIO-STAGE`.  
**Blocking evidence:** `UNK-STAGE-TILEMAPS;UNK-SCORE-STAGE-BONUS;UNK-TIME-STAGE-PACING`.

### CG-GP-016 · Player Death

**Workflow:** `WFL-DEATH-001` · **Acceptance:** `TST-PLAYER-DEATH`.  
**Requirements:** `GAM-LIFE-001;GAM-CORE-001`.  
**Systems:** `UE-HELI-SIM;UE-GM;UE-AUDIO;UE-HUD`.

**Entry and guard:** Death trigger, vulnerable states, invulnerability/respawn rules and passenger disposition measured.

**Committed effect:** Exactly one life decrement per confirmed death identity; cancel/retain entities according to evidence.

**Evidence experiment:** Multiple lethal contacts one tick; last-life crash; hold fire through respawn; pending boarding/unloading on death.

**Success:** Life/death/restart timing matches trace. **Failure:** Multiple decrements or input accepted during lockout.

**Binding obligations:** `CG-SLOT-HELI-SPAWN;CG-SLOT-HELI-AIRBORNE;CG-SLOT-HELI-ASCEND;CG-SLOT-HELI-DESCEND;CG-SLOT-HELI-LANDING;CG-SLOT-HELI-LANDED;CG-SLOT-HELI-TAKEOFF;CG-SLOT-HELI-DAMAGED;CG-SLOT-HELI-DYING;CG-SLOT-HELI-DEAD;CG-SLOT-HELI-RESPAWN-LOCK;CG-SLOT-UI-LIVES;CG-SLOT-AUDIO-DEATH`.  
**Blocking evidence:** `UNK-COLL-ORDER;UNK-SPR-PLAYER-HELI;UNK-TIME-STAGE-PACING`.

### CG-GP-017 · Game Over

**Workflow:** `WFL-GAMEOVER-001` · **Acceptance:** `TST-GAMEOVER`.  
**Requirements:** `GAM-LIFE-001;GAM-2P-001;GAM-ATTRACT-001`.  
**Systems:** `UE-GM;UE-HUD;UE-SCORE`.

**Entry and guard:** Remaining-life convention, next-player eligibility and game-over timing measured.

**Committed effect:** Resolve next-player/game-over route once; preserve only verified session fields.

**Evidence experiment:** Player 1 last life with Player 2 eligible versus not; coin/start during game-over; reset during transition.

**Success:** State order and input gates deterministic. **Failure:** Stuck state or skipped score entry.

**Binding obligations:** `CG-SLOT-UI-TITLE;CG-SLOT-UI-GAMEOVER`.  
**Blocking evidence:** `UNK-2P-TURNS;UNK-ATTRACT-FLOW`.

### CG-GP-018 · High Score

**Workflow:** `WFL-HISCORE-001` · **Acceptance:** `TST-HISCORE`.  
**Requirements:** `GAM-HISCORE-001`.  
**Systems:** `UE-SCORE;UE-HUD`.

**Entry and guard:** Eligibility, rank/tie order, input behavior, timeout and persistence scope must be captured.

**Committed effect:** Commit a completed entry once; strict persistence never silently extended to disk.

**Evidence experiment:** Score below/equal/above qualification; tie; no input to timeout; reset before/after entry.

**Success:** Ordering/tie behavior match verified original or explicitly modernized mode. **Failure:** Unspecified persistence silently changes arcade behavior.

**Binding obligations:** `CG-SLOT-UI-SCORE;CG-SLOT-UI-NAMEENTRY`.  
**Blocking evidence:** `UNK-ATTRACT-FLOW;UNK-2P-TURNS`.

### CG-GP-019 · Audio Event

**Workflow:** `WFL-AUDIO-001` · **Acceptance:** `TST-AUDIO-EVENTS`.  
**Requirements:** `GAM-AUDIO-001`.  
**Systems:** `UE-AUDIO;UE-DATA-AUDIO`.

**Entry and guard:** Event-to-command mapping and timestamps supplied by runtime capture, not by guessed sound names.

**Committed effect:** Schedule presentation commands with measured ordering; audio callback never mutates simulation.

**Evidence experiment:** Overlapping effects, command retrigger, demo-sound DIP on/off, pause/scene reset, sustained tone interrupt.

**Success:** Event timing/order matches command trace; audio cannot mutate simulation. **Failure:** Audio callback changes gameplay timing.

**Binding obligations:** `CG-SLOT-AUDIO-ROTOR;CG-SLOT-AUDIO-PRIMARY;CG-SLOT-AUDIO-SECONDARY;CG-SLOT-AUDIO-IMPACT;CG-SLOT-AUDIO-BOARD;CG-SLOT-AUDIO-DELIVER;CG-SLOT-AUDIO-WARN;CG-SLOT-AUDIO-DEATH;CG-SLOT-AUDIO-STAGE;CG-SLOT-AUDIO-ATTRACT`.  
**Blocking evidence:** `UNK-AUDIO-COMMANDS;UNK-AUDIO-PSG;UNK-AUDIO-MUSIC;UNK-AUDIO-SFX`.

### CG-GP-020 · Replay

**Workflow:** `WFL-REPLAY-001` · **Acceptance:** `TST-REPLAY-DETERMINISM`.  
**Requirements:** `GAM-CORE-001`.  
**Systems:** `UE-REPLAY;UE-SIM-WORLD`.

**Entry and guard:** Replay header fixes source/config/build hashes, timing, seed/state and input encoding.

**Committed effect:** Record canonical ordered state serialization; report first divergent tick and field without re-baselining.

**Evidence experiment:** Same recording at multiple render rates; altered config rejected; one input bit mutation must diverge.

**Success:** Bit-identical checksums for identical build/data. **Failure:** Any divergence fails CI with first divergent frame.

**Binding obligations:** `No direct visual/audio resource; uses canonical state/input/replay data`.  
**Blocking evidence:** `UNK-RNG-001;UNK-INPUT-SAMPLING-001;UNK-COLL-ORDER`.

## A8. Stages, enemies, scenes, UI and sounds

The four inherited stage slots are`STG-01` Desert,`STG-02` Sea,`STG-03` Caverns and`STG-04` City rooftops. Names/order are secondary-source descriptions pending original runtime confirmation. They do not contain approved world maps. Each stage now has five explicit binding obligations: map, scroll, palette, spawn/placement and dynamic events. Map captures must include page selection, tile IDs and attributes, raw RAM, row-scroll state, palette state, camera transform, collision-relevant geometry, entity spawns and event timestamps. Capture the beginning, every unique region/event, completion, transition and repeated loop conditions.

The enemy registry is deliberately a **category-level contract**, not a claimed exhaustive roster. Every discovered enemy archetype must receive its own stable identity; correlate spawn rule, AI states, target selection, timers, weapon origin/projectile, collision behavior, score/life implications, sprite descriptors and palette. A contact-sheet shape resembling a plane or tower is not sufficient proof of an AI identity. No enemy is named solely from visual resemblance in this release.

UI mapping covers title/attract/credits, score and rank, lives, hostage counts, fuel, FUEL OUT!, HURRY UP, stage tally, game-over/next-player and name entry. A ROM string proves stored text—not its position, duration, font binding, trigger, language layout or relationship to other state. Composite screens require tile/glyph+palette+position+timing captures.

Audio includes the mapped sound-CPU ROM and dual-PSG hardware study. This release contains **no recovered WAV/OGG sound library or verified event-to-command map**. Ten candidate observation slots cover likely gameplay moments without asserting each has a distinct sound. For each actual event, capture the initiating gameplay event, command write/latch, sound-CPU context, timestamped PSG writes and audio output. Confirm retrigger, overlap, interruption, music/effect priority and demo-sounds setting. Do not substitute synthesized approximations and label them original.

### A8.1 Complete binding-obligation index

| ID | Kind | Role | Status |
| --- | --- | --- | --- |
| CG-SLOT-HELI-SPAWN | animation-or-visibility | Helicopter spawn | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HELI-AIRBORNE | animation-or-visibility | Helicopter airborne | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HELI-ASCEND | animation-or-visibility | Helicopter ascend | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HELI-DESCEND | animation-or-visibility | Helicopter descend | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HELI-LANDING | animation-or-visibility | Helicopter landing | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HELI-LANDED | animation-or-visibility | Helicopter landed | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HELI-TAKEOFF | animation-or-visibility | Helicopter takeoff | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HELI-DAMAGED | animation-or-visibility | Helicopter damaged | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HELI-DYING | animation-or-visibility | Helicopter dying | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HELI-DEAD | animation-or-visibility | Helicopter dead | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HELI-RESPAWN-LOCK | animation-or-visibility | Helicopter respawn-lock | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HOST-CAPTIVE | animation-or-visibility | Hostage captive | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HOST-RELEASED | animation-or-visibility | Hostage released | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HOST-RUN-TO-HELI | animation-or-visibility | Hostage run-to-heli | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HOST-WAIT | animation-or-visibility | Hostage wait | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HOST-BOARDING | animation-or-visibility | Hostage boarding | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HOST-ABOARD | animation-or-visibility | Hostage aboard | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HOST-UNLOADING | animation-or-visibility | Hostage unloading | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HOST-RESCUED | animation-or-visibility | Hostage rescued | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-HOST-DEAD | animation-or-visibility | Hostage dead | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-WEAPON-PRIMARY | projectile-animation | Primary attack representation | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-WEAPON-SECONDARY | projectile-animation | Second-button attack representation | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-ENEMY-ARCHETYPES | archetype-catalog | Complete encountered enemy roster | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-ENEMY-WEAPONS | projectile-catalog | Enemy attacks and hit effects | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-01-MAP | stage-layout | STG-01 Tile pages / world layout | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-01-SCROLL | stage-motion | STG-01 Camera / row scroll | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-01-PALETTE | palette-sequence | STG-01 Runtime palette states | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-01-SPAWN | stage-entities | STG-01 Spawn and rescue placement | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-01-DYNAMIC | stage-events | STG-01 Destructibles and scene events | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-02-MAP | stage-layout | STG-02 Tile pages / world layout | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-02-SCROLL | stage-motion | STG-02 Camera / row scroll | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-02-PALETTE | palette-sequence | STG-02 Runtime palette states | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-02-SPAWN | stage-entities | STG-02 Spawn and rescue placement | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-02-DYNAMIC | stage-events | STG-02 Destructibles and scene events | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-03-MAP | stage-layout | STG-03 Tile pages / world layout | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-03-SCROLL | stage-motion | STG-03 Camera / row scroll | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-03-PALETTE | palette-sequence | STG-03 Runtime palette states | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-03-SPAWN | stage-entities | STG-03 Spawn and rescue placement | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-03-DYNAMIC | stage-events | STG-03 Destructibles and scene events | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-04-MAP | stage-layout | STG-04 Tile pages / world layout | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-04-SCROLL | stage-motion | STG-04 Camera / row scroll | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-04-PALETTE | palette-sequence | STG-04 Runtime palette states | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-04-SPAWN | stage-entities | STG-04 Spawn and rescue placement | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-STG-04-DYNAMIC | stage-events | STG-04 Destructibles and scene events | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-UI-TITLE | ui-composition | Title / attract / credits | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-UI-SCORE | ui-composition | Score digits / labels / rank | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-UI-LIVES | ui-composition | Lives display / bonus feedback | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-UI-RESCUE | ui-composition | Aboard / rescued / lost indicators | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-UI-FUEL | ui-composition | Fuel display / FUEL OUT! | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-UI-HURRY | ui-composition | HURRY UP timing / display | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-UI-TALLY | ui-composition | Stage-complete tally / transition | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-UI-GAMEOVER | ui-composition | Game-over / next-player indication | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-UI-NAMEENTRY | ui-composition | High-score name entry | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-AUDIO-ROTOR | audio-event-observation | Engine / rotor candidate | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-AUDIO-PRIMARY | audio-event-observation | Primary-fire candidate | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-AUDIO-SECONDARY | audio-event-observation | Secondary-attack candidate | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-AUDIO-IMPACT | audio-event-observation | Impact / explosion candidate | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-AUDIO-BOARD | audio-event-observation | Boarding candidate | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-AUDIO-DELIVER | audio-event-observation | Delivery candidate | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-AUDIO-WARN | audio-event-observation | Warning candidate | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-AUDIO-DEATH | audio-event-observation | Player-death candidate | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-AUDIO-STAGE | audio-event-observation | Stage-change music/effect candidate | UNRESOLVED_REQUIRED_BINDING |
| CG-SLOT-AUDIO-ATTRACT | audio-event-observation | Attract music/effects candidate | UNRESOLVED_REQUIRED_BINDING |

## A9. Numeric parameters and boundary ownership

Strict values stay empty until measured. The units below specify measurement intent, not a hidden assumption about the original number representation. Clock quanta may be CPU cycles or a rational simulation tick, whichever the observed behavior requires. Every accepted value needs a source/config/capture reference and a boundary test.

| ID | Parameter | Units | Hypothesis | Blocking evidence |
| --- | --- | --- | --- | --- |
| CG-PAR-POPULATION | Initial hostage population | persons | 32 | UNK-AI-SPAWN-RULES |
| CG-PAR-GROUP-SIZE | Hostages per group | persons | 8 | UNK-AI-SPAWN-RULES |
| CG-PAR-CAPACITY | Passenger capacity | persons | 8 | UNK-TIME-LANDING |
| CG-PAR-RESCUE-THRESHOLD | Minimum rescued threshold hypothesis | persons | 21 | UNK-TIME-STAGE-PACING |
| CG-PAR-HELI-ACCEL-X | Horizontal acceleration | hardware-px/tick^2 | Not measured | UNK-TIME-HELI-ACCEL |
| CG-PAR-HELI-ACCEL-Y | Vertical acceleration | hardware-px/tick^2 | Not measured | UNK-TIME-HELI-ACCEL |
| CG-PAR-HELI-SPEED | Velocity limits | hardware-px/tick | Not measured | UNK-TIME-HELI-ACCEL |
| CG-PAR-HELI-DRAG | Neutral damping / friction | measured rational or integer rule | Not measured | UNK-TIME-HELI-ACCEL |
| CG-PAR-LAND-HEIGHT | Landing height / contact tolerance | hardware-px | Not measured | UNK-TIME-LANDING |
| CG-PAR-LAND-SPEED | Landing speed threshold | hardware-px/tick | Not measured | UNK-TIME-LANDING |
| CG-PAR-BOARD-RANGE | Boarding distance / eligibility region | hardware-px | Not measured | UNK-TIME-LANDING |
| CG-PAR-BOARD-CADENCE | Passenger boarding cadence | measured clock quanta | Not measured | UNK-TIME-LANDING |
| CG-PAR-UNLOAD-CADENCE | Passenger unload cadence | measured clock quanta | Not measured | UNK-TIME-LANDING |
| CG-PAR-FUEL-START | Initial / maximum fuel | raw fuel units | Not measured | UNK-TIME-FUEL |
| CG-PAR-FUEL-DRAIN | Fuel drain rule | raw units per measured interval | Not measured | UNK-TIME-FUEL |
| CG-PAR-FUEL-REFILL | Fuel restoration rule | raw fuel units | Not measured | UNK-TIME-FUEL |
| CG-PAR-FUEL-WARN | Fuel warning threshold | raw fuel units | Not measured | UNK-TIME-FUEL |
| CG-PAR-HURRY-TIMER | Stage warning threshold | measured clock quanta | Not measured | UNK-TIME-STAGE-PACING |
| CG-PAR-PRIMARY-CADENCE | Primary attack ready/hold cadence | measured clock quanta | Not measured | UNK-TIME-WEAPON-CADENCE |
| CG-PAR-SECONDARY-MOTION | Secondary trajectory rule | explicit measured units | Not measured | UNK-TIME-WEAPON-CADENCE |
| CG-PAR-ENEMY-SPAWN | Per-archetype spawn parameters | typed tables | Not measured | UNK-AI-SPAWN-RULES |
| CG-PAR-ENEMY-FIRE | Per-archetype attack parameters | typed tables | Not measured | UNK-AI-FIRE-RULES |
| CG-PAR-SCORE-TABLE | Score event values | points/event | Not measured | UNK-SCORE-EVENT-VALUES |
| CG-PAR-RESPAWN-TIMING | Death/respawn/control lock timing | measured clock quanta | Not measured | UNK-TIME-STAGE-PACING |
| CG-PAR-ANIMATION-CLOCK | Clip/frame timing quantum | cycles or rational ticks | Not measured | UNK-SPR-SEMANTICS |
| CG-PAR-RNG | Random state and advancement rules | explicit state words | Not measured | UNK-RNG-001 |

## A10. Math and reference code: why each exists

`CG-SUB-001` independently decodes the tile bitplanes so an incorrect channel significance cannot survive behind matching filenames. For tile`t`, row`y`, column`x`, address=`8t+y`, shift=`7-x`, index=`4*((P0>>shift)&1)+2*((P1>>shift)&1)+((P2>>shift)&1)`. The input domain is 4096 tiles,8 rows,8 columns; output isuint 8 in 0..7.

`CG-SUB-002` reconstructs the prior static sprite interpretation so every saved crop can be audited. Each byte yields high nibble then low nibble;0 is transparent,15 terminates the row, and each other nibble is horizontally duplicated into 2 hardware pixels. This is deliberately **not** the full runtime descriptor renderer, which may use addressing/direction/stride/palette behavior requiring observation.

`CG-SUB-003` preserves crop geometry. A half-open rectangle has width`x1-x0` and height`y1-y0`. Static-canvas coordinates recover as`x_canvas=x_crop+x0`, `y_canvas=y_crop+y0`. The diagnostic pad is 2 pixels, clipped to the canvas. Empty data retains the full canvas and may have no stored PNG. None of this defines game-world placement, pivot or collision shape.

`CG-SUB-004` validates relative paths before extraction/read. A manifest may not escape the package root. The extraction path also bounds total expanded bytes and rejects symbolic-link archive members. NumPy loads use`allow_pickle=False`; the explorer uses escaped text and embedded JSON, not network-loaded code or evaluation of asset contents.

`CG-SUB-005` demonstrates a transactional rescue ledger. State changes and event deduplication commit together only after guards pass. Capacity is explicit input with no default 8. This prevents duplicate boarding/delivery and partial failed mutations but does not implement original movement, score/fuel or event ordering.

`CG-SUB-006` demonstrates fail-closed strict admission. A caller must supply an approved comparison record referring to the same trace. Merely spelling`RUNTIME_VERIFIED` in a JSON field does not manufacture proof. Actual trace hashes, comparison correctness and review remain external proof-registry obligations.

The 32 executable synthetic tests exercise these helpers and invalid inputs. A passing synthetic fixture is not evidence that an original helicopter moves, collides or unloads in the same way. The complete runnable code follows; each ID also appears in the code registry.

```python
"""Chopper Game v1.6 reference algorithms. No original gameplay tuning is invented.
CG-SUB-001..006: deterministic extraction and explicit contract demonstrations.
"""
from pathlib import Path
import numpy as np

# Diagnostic colors only. Never use these as runtime palette evidence.
DIAGNOSTIC_RGBA = np.array([
 (0,0,0,0),(255,255,255,255),(255,70,70,255),(80,220,100,255),
 (80,120,255,255),(255,220,70,255),(230,90,255,255),(60,230,230,255),
 (210,210,210,255),(255,145,60,255),(140,255,90,255),(90,170,255,255),
 (255,90,170,255),(170,120,255,255),(120,245,220,255),(255,255,255,255)
],dtype=np.uint8)

def decode_tiles(p0: bytes, p1: bytes, p2: bytes) -> np.ndarray:
    """CG-SUB-001: recover every 8x8 3bpp tile, MSB first; p0 is bit2."""
    if not all(len(p)==32768 for p in (p0,p1,p2)):
        raise ValueError('Exactly three 32768-byte planes are required')
    shifts=np.arange(7,-1,-1,dtype=np.uint8)
    planes=[((np.frombuffer(p,dtype=np.uint8)[:,None]>>shifts)&1).reshape(4096,8,8) for p in (p0,p1,p2)]
    return (planes[0]<<2)|(planes[1]<<1)|planes[2]

def decode_sprite_diagnostic(data: bytes, start: int, stride: int, rows: int) -> np.ndarray:
    """CG-SUB-002: forward static row interpretation, NOT a runtime sprite renderer.
    A nibble becomes two horizontal hardware pixels. F stops the row; 0 is transparent.
    Explicit bounded sizes reject corrupt records rather than truncating byte slices.
    """
    if any(type(v) is not int for v in (start,stride,rows)):
        raise ValueError('Integer offsets and dimensions required')
    if start<0 or not 1<=stride<=32768 or not 1<=rows<=32768 or start+stride*rows>len(data):
        raise ValueError('Source range outside sprite ROM')
    if stride*4*rows>4_194_304:
        raise ValueError('Diagnostic canvas exceeds 4 Mi pixels')
    out=np.zeros((rows,stride*4),dtype=np.uint8)
    for y in range(rows):
        x=0; stop=False
        for v in data[start+y*stride:start+(y+1)*stride]:
            for nibble in (v>>4,v&15):
                if nibble==15: stop=True;break
                out[y,x:x+2]=nibble;x+=2
            if stop: break
    return out

def crop_bounds(indices: np.ndarray, pad: int=2) -> tuple[int,int,int,int]:
    """CG-SUB-003: half-open diagnostic rectangle, not a gameplay pivot/collider."""
    if indices.ndim!=2 or indices.size==0 or type(pad) is not int or pad<0:
        raise ValueError('Nonempty 2D canvas and nonnegative integer pad required')
    h,w=indices.shape;ys,xs=np.where(indices>0)
    if not len(xs):return (0,0,w,h)
    return (max(0,int(xs.min())-pad),max(0,int(ys.min())-pad),
            min(w,int(xs.max())+pad+1),min(h,int(ys.max())+pad+1))

def safe_path(root: Path, relative: str) -> Path:
    """CG-SUB-004: package file access cannot escape the extraction root."""
    p=Path(relative)
    if p.is_absolute() or '\\' in relative or '..' in p.parts or not relative or ':' in relative or '\x00' in relative:
        raise ValueError('Unsafe package path')
    result=(root/p).resolve()
    if not result.is_relative_to(root.resolve()):raise ValueError('Escaping package path')
    return result

class RescueLedger:
    """CG-SUB-005: teaching-only transactional identity ledger.
    A caller supplies measured capacity and already-resolved event order. This class
    does not define original landing, movement, timers, scoring, or collision rules.
    ABOARD is the abstract committed passenger state, not a measured RAM encoding.
    """
    allowed={'captive':{'ground','dead'},'ground':{'aboard','dead'},
             'aboard':{'rescued','dead'},'rescued':set(),'dead':set()}
    def __init__(self, ids, capacity: int):
        ids=list(ids)
        if type(capacity) is not int or capacity<=0 or len(set(ids))!=len(ids) or any(not isinstance(x,str) or not x for x in ids):
            raise ValueError('Unique nonempty IDs and positive capacity required')
        self.states={i:'captive' for i in ids};self.capacity=capacity;self.events={}
    def apply(self,event_id: str,hostage_id: str,destination: str) -> bool:
        if not event_id or hostage_id not in self.states or destination not in self.allowed:
            raise ValueError('Invalid event')
        payload=(hostage_id,destination)
        if event_id in self.events:
            if self.events[event_id]!=payload:raise ValueError('Event ID collision')
            return False
        origin=self.states[hostage_id]
        if destination not in self.allowed[origin]:raise ValueError('Invalid state transition')
        if destination=='aboard' and sum(s=='aboard' for s in self.states.values())>=self.capacity:
            raise ValueError('Capacity exceeded')
        # Validate first: a rejected event changes neither states nor deduplication map.
        self.states[hostage_id]=destination;self.events[event_id]=payload
        return True

def require_strict_binding(binding: dict, approved_proofs: dict) -> str:
    """CG-SUB-006: fail-closed admission example, NOT an evidence verifier.
    approved_proofs is supplied by the reviewed proof registry, never by a worker's
    self-declared boolean. Actual artifact hashes and runtime comparison are separate gates.
    """
    required=('binding_id','source_asset_id','trace_id','test_run_id','reviewer')
    if binding.get('status')!='RUNTIME_VERIFIED' or any(not binding.get(k) for k in required):
        raise ValueError('Unverified or incomplete binding')
    proof=approved_proofs.get(binding['test_run_id'],{})
    if proof.get('status')!='PASS' or proof.get('trace_id')!=binding['trace_id'] or proof.get('kind')!='RUNTIME_COMPARISON':
        raise ValueError('Missing, failed, or mismatched runtime comparison')
    return binding['source_asset_id']
```

## A11. Modern improvements without corrupting fidelity

The optional modern profile is separate from strict reconstruction. It proposes remappable controls, readable UI scaling, redundant non-color-only warnings, reduced-flash/volume options, explicit pause/training stage selection and privacy-first local operation. No new art, accessibility interface, telemetry subsystem or training mode is implemented by this documentation update. Each proposed feature states whether it changes simulation or only presentation. A modernized output cannot be submitted as a strict framebuffer reference.

For the Unreal architecture, retain a deterministic simulation/data core independent of Actors, frame-rate-dependent presentation and audio callbacks. The planned modules and import paths now use Chopper Game. Paper 2D can present sprites; an owned indexed renderer remains the strict design path. Epic's currently reviewed TileMap documentation labels that feature experimental, so its convenience must not become an unexamined strict-render dependency. This is a documentation-based risk decision, not an engine build test. Public reference URLs and review scope are in `provenance/external_sources.json`.

## A12. Verification tiers, release gates and worker protocol

**Tier 1 — package:** every actual payload file is catalogued with size/hash; logical asset paths resolve or explicitly declare absence; identifiers are unique; all graph endpoints resolve; source intervals fit real ROMs; contact cells fit sheets; registry counts agree. **Tier 2 — extraction:** independently reproduce indexed tiles, sprite diagnostics/crops and tile sheet cells. **Tier 3 — reference algorithms:** execute synthetic normal/boundary/rejection tests. **Tier 4 — original runtime:** run capture plans and comparison scenarios. **Tier 5 — Unreal integration:** compile, run, render, replay and test original-vs-target behavior. **Tier 6 — release/distribution:** close the chosen fidelity profile and separate provenance/rights requirements.

This revision executes Tiers 1–3 plus **synthetic validation of Tier-4 tooling only**. No Tier-4 original-runtime evidence is executed, and Tiers 5–6 are not inferred from tooling success. The 131 inherited unknown records stay open unless their evidence is actually supplied; 66 function candidates remain static hypotheses. The 55 inherited acceptance definitions are retained and marked NOT_RUN in the current-run ledger rather than retroactively claiming their entire procedures executed.

An AI worker selects exactly one workflow/task, identifies requirements and approved inputs, opens every associated slot/unknown/test, and returns a bounded output plus proof. It must not use a plausible crop, a guide value, an engine default or an unobserved control-flow label as a substitute for missing evidence. A research-only diagnostic/tool task can proceed while strict content waits. A gameplay implementation task with unresolved prerequisites returns `BLOCKED` with the exact IDs, not a guessed implementation.

Run `python tools/validate_chopper.py --root .`. Research validation should return 0 only when the package checks and helper tests pass. Run the same command with `--strict`: it must return nonzero while original runtime, semantic bindings, source identity and Unreal integration remain unapproved. The release report names those blockers. A repaired manifest or passing screenshot is never permission to silently re-baseline a golden replay.

For current package-snapshot reproduction, use `python tools/rebuild_chopper.py --output ../Chopper_Game_Rebuild`. It copies the current release tree into a fresh directory and validates that copy; **it is not a fresh ROM-to-package derivation**. Historical deep-derivation tooling remains under `tools/v1_5_base/` and must be executed and recorded separately before anyone claims a from-ROM reproducible build. Byte comparison excludes only explicitly declared self/report manifests.

## A13. Files, navigation and responsibilities

| File or directory | Purpose |
|---|---|
| `Chopper_Game_Bible.md` / `.html` | One current teaching/gameplay/engineering Bible, with the complete inherited research text below |
| `Chopper_Game_Asset_Explorer.html` | Offline searchable preview, raw-source interval and gameplay-binding browser |
| `Chopper_Game_Audit.md` / `.html` | Findings, executed-vs-not-run distinction and release limitations |
| `assets/asset_catalog.csv` | All 5,293 logical assets and usage gates |
| `assets/source_rom_catalog.csv` | Actual, mismatched and missing source objects |
| `assets/source_span_registry.csv` | 13,959 logical-object-to-ROM byte intervals |
| `assets/sprites/sprite_geometry_registry.csv` | 629 static canvases/crops, including empty segments |
| `assets/contact_sheet_membership.csv` | 9,074 sheet/member coordinate mappings |
| `assets/image_file_audit.csv` | 4,742 diagnostic PNG paths, dimensions and hashes |
| `gameplay/` | Workflows, 63 slots, 26 parameters, 45 transition contracts, 60 runtime scenarios, evidence lifecycle and optional modern features |
| `audit/id_registry.csv` / `relations.csv` | Retained legacy identities plus new file/asset/contract graph |
| `audit/ChopperGameEvidence.db` | SQLite nodes, edges and registry tables for reverse queries |
| `audit/package_file_catalog.csv` | Every payload file; self/hash exclusions are explicit |
| `audit/validation_report.json` | Actual verification results and strict gate |
| `code_map/` / `teaching/` / `unreal/` | Full prior code/math/lesson/hardware and modern implementation specifications |
| `source/` | Original user archive and 18 actual ROM payloads |
| `archive/v1_4/` | Original Office editions, prior main text, old reports and authority records; not current approval |
| `provenance/` | Exact baseline ZIP and external-reference scope |
| `analysis/` | 11 analysis methods, 89 subject recipes, 13 promotion gates, schemas and a synthetic non-promotion fixture |
| `tools/` | Portable reference code, exact-hash source admission, capture controller, evidence analysis/promotion, tests, validator and rebuild tooling |


## A14. Current synchronized metrics — v1.12

The table below is generated from current registries during the v1.12 release build. Historical counts in explicitly archived/inherited passages do not override it.

<!-- CG:METRICS:START -->
| Current v1.12 registry | Count / state |
| --- | ---: |
| Master IDs | `385254` |
| Relations | `86916` |
| Logical assets | 5,293 |
| Source spans | 13,959 |
| Workflow contracts | 20 |
| Required asset-binding slots | 63 unresolved |
| Strict gameplay parameters | 26 unapproved |
| Candidate state transitions | 45 |
| Runtime scenario definitions | 60 (`NOT_RUN`) |
| Analysis subjects | 89 (63 asset slots / 26 parameters) |
| Analysis methods | 11 |
| Promotion gates | 13 |
| VERIFIED gameplay evidence records | 0 |
| VERIFIED promotion records | 0 |
| Open unknown records | 131 (52 HIGH / 13 MEDIUM / 66 UNRANKED) |
| Top-level unknown families | 13 |
| Static function candidates | 66 |
| Runtime execution records observed | 0 / 4,942 |
| Capture channels / watchpoints / plans | 20 / 14 / 14 |
| Stock MAME manifest source | 17 / 19 match; canonical MCU absent; PLD 315-5139 absent |
| Runtime-consumed source | 15 / 16 match; canonical MCU is the runtime-semantic blocker |
| PLD audit-only source | 2 / 3 match; 315-5139 absent |
| Source-admission preflight | executed; strict stock gate BLOCKED at 17 / 19; runtime-semantic gate BLOCKED at 15 / 16 |
| Capture execution queue | 14 plans; all BLOCKED_SOURCE; 0 attempts |
| First autonomous plan | `CG-PLAN-001`; 120-frame minimum/recommended baseline controller |
| Original-runtime tests executed | 0 |
| Unreal builds executed | 0 |
<!-- CG:METRICS:END -->

## A15. Current capture → analysis → promotion pipeline

The evidence path is `capture/capture_plan_registry.csv` → `tools/runtime_capture.py` / `tools/mame_chopper_capture.lua` → sealed capture bundle → `tools/evidence_analysis.py` repeated discovery analysis → external review → disjoint held-out analysis → `tools/evidence_promotion.py` 13-gate proof → guarded apply to a working copy → release regeneration/validation. `analysis/subject_recipe_registry.csv` defines the subject-specific evidence recipe; `gameplay/evidence_lifecycle.csv` defines evidence lifecycle states.

The package intentionally separates five statements: **asset bytes mapped**, **runtime behavior observed**, **candidate correlation produced**, **semantic claim reviewed/held-out verified**, and **target implementation matched**. Passing an earlier statement never implies the later ones. Original capture is still blocked: strict stock source is 17/19 and runtime-consumed source is 15/16, so v1.12 records no original-runtime capture. The analysis/promotion layer remains exercised only by synthetic tooling tests.

## R. Complete inherited teaching and engineering research

The following material carries forward the v1.4 history, hardware, memory/I/O, graphics/audio, disassembly, subroutine candidates, math, code examples, experiments and teaching sections. Original ROM names and historic terminology are intentionally retained. Counts explicitly labeled v1.4 describe the baseline, not the enlarged v1.5 graph. Original claims of structural test passes refer to their archived reports, not new execution of a full arcade emulator. The current authority, naming, binding rules and release decision in Parts A1–A15 govern this package. Where inherited text previously contained an active engineering value that conflicted with a current registry, v1.9 corrects that value in place rather than preserving a known error.

## 1. Purpose and authority
This inherited research section is the teaching, engineering, and evidence map for reconstructing the 1985 Sega arcade version of **Choplifter** as a 2D Unreal Engine game. It is designed for bounded AI-worker execution: every production decision must resolve through stable IDs, evidence grades, traceability relations and acceptance gates. Missing arcade behavior is recorded as an unknown; it is never silently invented.

Authority order: **runtime-observed original behavior > matching ROM data > current MAME hardware implementation/notes > validated static code evidence > secondary arcade documentation > modern design choice.**

### 1.1 Engineering foundation inherited from v1.1
- Complete first-class ID coverage: stages, palette colors, code regions, raw bytes, states, schemas, figures and relations are now registered.
- Repair static code graph foreign keys and overlapping entry-point reachability.
- Stop classifying arbitrary 16-bit immediates as memory references; use CPU-specific explicit dereference/I/O evidence.
- Expand runtime capture to raw RAM, row-scroll[32], CPU/cycle/beam provenance and sub-frame event logs.
- Make strict rendering index-driven; diagnostic PNG RGB is explicitly research-only.
- Decompose broad research blockers into granular child unknowns and link them to tests/tasks.
- Add a normalized relation graph, SQLite evidence database and reproducible-build tooling.


## Reader map - four ways to use this Bible
This revision is intentionally both a **course** and a **project specification**. A learner can read from history through hardware and code; a reverse-engineer can jump to runtime labs; an Unreal developer can start at the legacy-to-modern mapping; and an AI worker can continue to use the exact registries, tasks, tests and unknown IDs.

### LES-ORIENT-001 - How to read an evidence-first game Bible
Every important object or claim in this project has two questions attached to it: **what is its stable identity?** and **what level of evidence supports our interpretation of it?** A ROM byte can be certain while our guess about what that byte means is uncertain. A screenshot can show that something appeared while still hiding the RAM state and code path that caused it. The Bible therefore separates immutable IDs, semantic aliases, evidence grades, unknowns, tests and modern design choices.

A useful reading habit is to ask, for every statement: **Is this stored data, hardware behavior, static code evidence, runtime observation, historical testimony, secondary documentation, or a modern implementation choice?** The answer determines what you may safely implement and what experiment must come next.

| Path | Start | Goal |
| --- | --- | --- |
| Historian / designer | Part I | Understand the 1982 original, Sega licensing, the unusual home-to-arcade path, and why the arcade game should be treated as its own design. |
| Hardware / reverse-engineering learner | Parts II-III | Learn the Z80, memory/I/O, tile/sprite/palette/audio hardware, and how to read ROM evidence without overclaiming. |
| Unreal developer | Parts IV-V | Translate observable 1985 behavior into deterministic Unreal systems, indexed rendering, replay and tests. |
| AI implementation worker | Part VI + engineering reference | Follow stable IDs, dependencies, unknowns and acceptance gates; stop instead of guessing when evidence is missing. |

The teaching layer contains **30 lesson IDs**, **25 lab IDs**, **50 glossary terms**, **14 checkpoint questions**, **8 history-event IDs**, and **23 board-component IDs**. These are registered in the same master ID graph as the ROM, code, image, test and Unreal IDs.

![Historical timeline](bible/figures/FIG-HIST-001-timeline.png)

## Part I - History, design lineage, and the arcade context
### LES-HIST-001 - The 1982 home-computer origin
The story starts **before the arcade machine**. Dan Gorlin created the original Choplifter for the Apple II and Brøderbund published it in 1982. Contemporary Brøderbund material places Choplifter among its home-computer software catalog, while later creator interviews describe the game as the product of experimentation with helicopter movement and a rescue-centered objective. [SRC-013][SRC-014][SRC-015]

This matters because the 1985 Sega board should not be approached like a normal arcade original whose home ports came later. Choplifter moved in the opposite direction: a successful home-computer game became a coin-operated arcade redesign. That reversal is unusual enough that it changes how we reason about “the original.” For this project, **the target original is specifically the 1985 Sega arcade behavior**, while the 1982 game is historical/design context rather than the executable specification.

### LES-HIST-002 - Why rescue is the center of the design
Gorlin interviews consistently place the helicopter and the act of rescuing people at the center of the design. Accounts connect the emerging concept to Defender and to the cultural atmosphere around hostage-rescue news, but the safest teaching distinction is: **the creator interview is evidence of influence; it is not evidence that every narrative detail was consciously encoded as a political statement.** [SRC-013][SRC-014][SRC-021]

That design choice is mechanically important. Choplifter is not just “a shooter with hostages added.” The player must expose prisoners, land, wait, transport a limited number, survive the return trip, unload them, manage fuel/time pressure, and decide how much risk to take. Shooting is instrumental to a rescue objective. This is why the Unreal model treats hostage/rescue state as first-class simulation truth instead of a decorative counter.

### LES-HIST-003 - Sega licensed the idea and made a different arcade game
The strongest historical caution in this Bible is that the Sega arcade game is **not Dan Gorlin's Apple II code transplanted into a cabinet**. In the Retro Gamer interview summarized by MobyGames, Gorlin describes the coin-op as a straight licensing arrangement: Sega produced its own design and artwork, and he did not participate in the arcade development. [SRC-010][SRC-013]

The arcade version adds coin-op concerns, a score/high-score structure, expanded environments, different hostage capacity/counts, different audiovisual presentation, and hardware-specific systems. Therefore the ROM study must establish arcade truth from the Sega code/data/hardware, not import numbers from the Apple II release merely because the title is the same.

### LES-HIST-004 - System 2 and a source-labeling lesson
A 1985 Sega advertisement in Game Machine described Choplifter as the first title for the new **Sega System 2** motherboard. MAME's current hardware notes likewise identify the board as System 2. Some public arcade databases loosely group the game under System 1-family labels or conversion classes. [SRC-001][SRC-017]

**Teaching note:** hardware taxonomy is itself a source problem. When sources disagree on a label, prefer the period manufacturer material and inspectable hardware source, record the conflicting labels, and avoid “correcting” evidence silently. The board/assembly IDs `PCB-BOARD-171-5303-01` and `PCB-ASM-834-5795-03` are more precise than a family nickname.

### Timeline evidence ledger
**HIST-1982-ORIGIN - 1982 - Original Apple II Choplifter**  \nDan Gorlin created Choplifter for the Apple II; Brøderbund published it as a home-computer title.  \nSources: SRC-013;SRC-014;SRC-015;SRC-020 | Status: ESTABLISHED

**HIST-1982-DESIGN - 1982 - Rescue-centered design**  \nGorlin interviews describe helicopter fascination, influence from Defender, and a deliberate emphasis on rescuing people rather than merely accumulating kills.  \nSources: SRC-013;SRC-014;SRC-021 | Status: INTERVIEW-SUPPORTED

**HIST-1985-LICENSE - 1985 - Sega licenses Choplifter**  \nThe arcade game was a licensing deal with Sega. Gorlin said he did not participate in the arcade development; Sega created a substantially different design and artwork.  \nSources: SRC-010;SRC-013 | Status: INTERVIEW-SUPPORTED

**HIST-1985-SYSTEM2 - 1985-10 - System 2 showcase**  \nA contemporary Game Machine Sega advertisement calls Choplifter the first title for the Sega System 2 new motherboard.  \nSources: SRC-017 | Status: PRIMARY-SOURCE

**HIST-1985-ARCADE - 1985-10 - Sega arcade release**  \nSega released the arcade Choplifter in Japan in October 1985.  \nSources: SRC-011;SRC-020 | Status: MULTI-SOURCE

**HIST-1985-REVERSE - 1985 - Unusual home-to-arcade migration**  \nChoplifter is a notable 1980s example of a successful home-computer game moving into arcades, reversing the more common arcade-to-home direction.  \nSources: SRC-010;SRC-011;SRC-013 | Status: ESTABLISHED

**HIST-1986-MASTER - 1986 - Arcade lineage continues to home consoles**  \nSega later released a Master System version derived from the arcade-style redesign rather than simply reproducing the original Apple II presentation.  \nSources: SRC-010 | Status: SECONDARY-SUMMARY

**HIST-2012-LEGACY - 2012 - Choplifter HD and retrospective interest**  \nThe series was revisited with Choplifter HD; Gorlin participated in retrospective interviews and advisory work, renewing discussion of the original design.  \nSources: SRC-014 | Status: INTERVIEW-SUPPORTED


## Part II - The cabinet and Sega System 2 hardware
### LES-CAB-001 - What the player and operator touched
The arcade interface is an **8-way joystick plus two action buttons**, with coin/start/service inputs and operator DIP switches. The game supports two players in an alternating/cocktail-style input framework rather than two simultaneous helicopters. [SRC-011][SRC-012][SRC-018][SRC-019]

A cabinet label can help establish intent, but the software still decides exactly when and how a button is sampled. This is why the strict project keeps `UNK-INPUT-SAMPLING-001` open: “Button 1 is fire” may be visually obvious, but edge/hold semantics, sampling phase, interaction with facing/rotation and two-player switching are runtime behaviors.

![Cabinet control model](bible/figures/FIG-CAB-001-controls.png)

### LES-DIG-001 - Minimum digital vocabulary
You only need a small amount of digital-computer vocabulary to read most of this Bible. One **bit** is 0 or 1; eight bits form a **byte**; two bytes often form a 16-bit **word**. Hexadecimal is simply a compact way to write bits: one hex digit represents four bits, so `D800` is easier to read than sixteen binary digits. The Z80 is an 8-bit processor with a 16-bit address space, so normal addresses range from `0000` through `FFFF`.

Z80 16-bit immediate values are little-endian. If ROM bytes are `34 12`, the word is `0x1234`. Do not confuse an address-shaped number with an access: `LD HL,$D012` loads the number `D012`; `LD A,($D012)` actually reads memory at `D012`. That distinction is exactly why v1.1 replaced the old “any 16-bit literal is a touchpoint” heuristic.

### LES-HW-001 - Board architecture as a system
The protected Choplifter board has three obvious processing domains: a **main Z80** for game logic and hardware control, a **sound Z80** for audio command processing, and an **8751-class MCU** used by the protected set. Around them sit RAM, ROM, an 8255 PPI, tile/sprite graphics ROMs, palette/mixer PROMs, collision memories, programmable logic and Sega custom ICs. [SRC-001][SRC-018]

![Board anatomy](bible/figures/FIG-BOARD-001-anatomy.png)

The Bible intentionally refuses to assign precise functions to custom markings such as `315-5011`, `315-5012`, `315-5049`, and `315-5025` unless the evidence supports that specificity. A teaching Bible should demonstrate how to say **“we know this chip is present”** without pretending **“we know exactly what logic is inside it.”**

| Component ID | Marking | Category | Qty | Known role / teaching note | Status |
| --- | --- | --- | --- | --- | --- |
| PCB-BOARD-171-5303-01 | 171-5303-01 | Main PCB | 1 | Physical board identifier in MAME board notes | OBSERVED |
| PCB-ASM-834-5795-03 | 834-5795-03 | Game assembly/board label | 1 | Choplifter board/assembly sticker identifier | OBSERVED |
| PCB-CPU-MAIN | Z80A(1) | CPU | 1 | Main game CPU, approximately 4 MHz | ROLE-KNOWN |
| PCB-CPU-SOUND | Z80A(2) | CPU | 1 | Sound CPU, approximately 4 MHz | ROLE-KNOWN |
| PCB-MCU-8751 | 315-5151 / 8751 | MCU | 1 | Protected-set MCU / control-protection interface | ROLE-PARTIAL |
| PCB-IO-8255 | 8255 | Programmable peripheral interface | 1 | Main-side I/O/control interface used by the board | ROLE-KNOWN |
| PCB-PSG-1 | SN76489(1) | Programmable sound generator | 1 | Tone/noise generator | ROLE-KNOWN |
| PCB-PSG-2 | SN76489(2) | Programmable sound generator | 1 | Second tone/noise generator | ROLE-KNOWN |
| PCB-CUSTOM-5011 | 315-5011 | Sega custom IC | 1 | Custom board logic; package does not assign a more specific function without stronger source evidence. | ROLE-UNRESOLVED |
| PCB-CUSTOM-5012 | 315-5012 | Sega custom IC | 1 | Custom board logic; exact function left unresolved here. | ROLE-UNRESOLVED |
| PCB-CUSTOM-5049 | 315-5049 | Sega custom IC | 1 | Custom board logic; exact function left unresolved here. | ROLE-UNRESOLVED |
| PCB-CUSTOM-5025 | 315-5025 | Sega custom IC | 3 | Repeated custom logic devices in board layout; exact per-device function left unresolved. | ROLE-UNRESOLVED |
| PCB-PLD-5152 | 315-5152 | PAL/PLD | 1 | Programmable logic; supplied dump matches reference. | DUMPED |
| PCB-PLD-5138 | 315-5138 | PAL/PLD | 1 | Programmable logic; supplied dump matches reference. | DUMPED |
| PCB-PLD-5139 | 315-5139 | PLS153/PLD | 1 | Programmable logic listed by reference; missing from supplied archive. | MISSING-SOURCE |
| PCB-ROM-MAIN-FIX | EPR-7124/7152 IC90 | Program ROM socket | 1 | Fixed main Z80 program region. Set/revision naming differs across references; supplied set uses epr-7124.ic90. | ROLE-KNOWN |
| PCB-ROM-MAIN-A | EPR-7125/7153 IC91 | Program ROM socket | 1 | Banked main program A. | ROLE-KNOWN |
| PCB-ROM-MAIN-B | EPR-7126/7154 IC92 | Program ROM socket | 1 | Banked main program B. | ROLE-KNOWN |
| PCB-ROM-SOUND | EPR-7130 IC126 | Program ROM socket | 1 | Sound Z80 program ROM. | ROLE-KNOWN |
| PCB-ROM-TILES | EPR-7127/7128/7129 IC4/5/6 | Graphics ROM sockets | 3 | Three bitplanes for 4096 8x8 tile codes. | ROLE-KNOWN |
| PCB-ROM-SPRITES | EPR-7120..7123 IC86..89 | Graphics ROM sockets | 4 | Four sprite ROM banks using variable-width scanline format. | ROLE-KNOWN |
| PCB-PROM-RGB | PR7117/7118/7119 | Palette PROMs | 3 | Blue/green/red physical color lookup PROMs. | ROLE-KNOWN |
| PCB-PROM-MIX | PR5317 | Lookup PROM | 1 | Layer priority/source selection and mixer collision control. | ROLE-KNOWN |

### LES-HW-002 - Clocks, frames and why 60 is not exactly 60
The main and sound Z80s run at roughly 4 MHz in the current machine model, while the protected MCU runs at roughly 8 MHz. The display refresh is about **60.0952 Hz**, not exactly 60.000. [SRC-001][SRC-018]

A rough teaching estimate is `4,000,000 / 60.0952 ≈ 66,561 CPU cycles per video frame` on average. That number is useful for intuition, but it is **not** a replacement for event traces: CPU stalls, interrupt phase, scanline timing and device interactions mean an exact gameplay event must be measured at the frame/cycle level.

## Part III - CPU, memory, graphics and audio: learning the machine
### LES-CPU-001 - A Z80 mental model
You do not need to become an assembly-language expert to follow Choplifter. Focus on a few patterns: `LD` moves values, arithmetic/logic changes them, `JP/JR` branch, `CALL/RET` create subroutines, `IN/OUT` talk to I/O ports, `PUSH/POP` use the stack, and interrupts jump execution in response to hardware timing/events. Registers `A`, `BC`, `DE`, `HL`, `IX`, `IY`, `SP` and flags are short-term CPU state.

The fixed main ROM begins with a good teaching example:
```text
INS-MAIN-F-0000      0000  F3        DI
INS-MAIN-F-0001      0001  ED56      IM 1
INS-MAIN-F-0003      0003  DB15      IN A,($15)
INS-MAIN-F-0005      0005  F60C      OR $0C
INS-MAIN-F-0007      0007  D315      OUT ($15),A
INS-MAIN-F-0008      0008  15        DEC D
INS-MAIN-F-0009      0009  C30094    JP $9400
INS-MAIN-F-0010      0010  D315      OUT ($15),A
INS-MAIN-F-0012      0012  00        NOP
INS-MAIN-F-0013      0013  00        NOP
INS-MAIN-F-0014      0014  00        NOP
INS-MAIN-F-0015      0015  DB15      IN A,($15)
INS-MAIN-F-0017      0017  CBF7      SET 6,A
INS-MAIN-F-0018      0018  F7        RST $0030
INS-MAIN-F-0019      0019  D315      OUT ($15),A
INS-MAIN-F-001B      001B  C30080    JP $8000
```

Do not overinterpret that listing. We can say, for example, that the code disables interrupts, selects interrupt mode 1, performs port I/O and jumps into another address. We cannot safely call every vector a named gameplay routine without runtime context.

### LES-CPU-002 - Memory space and I/O space are different maps
The main Z80 sees a 64 KiB memory address space. Choplifter divides it into fixed ROM, a banked ROM window, work RAM, sprite RAM, palette RAM, video RAM window and collision windows. Separately, Z80 `IN` and `OUT` instructions address input/output ports such as player inputs, DIP switches and the 8255 PPI.

![Main CPU memory map](bible/figures/FIG-MEM-001-main-map.png)

A common reverse-engineering error is to see `$D800` in an instruction and assume the code touched palette RAM. Only the operand form proves an explicit dereference. The package therefore separates `MXREF-*` memory XREFs from `IMMREF-*` immediate numeric references.

### LES-CPU-003 - Why bank switching exists
A Z80 can directly name only 65,536 addresses, but the program can contain more ROM than fits in one fixed 64 KiB view. Choplifter leaves `0000-7FFF` fixed and maps one 16 KiB bank into `8000-BFFF`. Four bank bodies are represented by the two 32 KiB bank ROMs. The same CPU address such as `9400` can therefore refer to different physical bytes depending on the active bank.

![Bank switching](bible/figures/FIG-BANK-001-window.png)

This is why every runtime PC trace must also record bank state. “Executed address A123” is incomplete evidence when A123 lives inside a banked window.

### LES-GFX-001 - Bitplanes: how three ROM bits become one tile pixel
Each 8x8 tile is stored across **three separate 1-bit planes**. For each pixel, plane 0 contributes value 4, plane 1 contributes value 2, and plane 2 contributes value 1. The sum is an index from 0 through 7:
```text
pixel_index = plane0_bit * 4 + plane1_bit * 2 + plane2_bit
```

![Bitplane lesson](bible/figures/FIG-TILE-TEACH-001-bitplanes.png)

The v1 extraction bug was educational: swapping the significance of plane 0 and plane 2 often preserved the **shape** because zero stayed zero and nonzero stayed nonzero, yet changed the actual numeric indices. That is why a picture that “looks right” is not enough for preservation-grade work.

`TILE-0100` is a compact worked example. Its canonical index matrix is:
```text
0 0 0 0 0 0 0 0
0 0 0 0 0 0 0 0
0 0 2 2 2 0 0 0
0 2 0 0 0 0 0 2
0 2 0 0 2 2 0 2
0 2 0 0 0 2 0 2
0 0 2 2 2 0 0 00 0 0 0 0 0 0 0
```

The 8x8 `IMG-TILE-0100` PNG exists as a diagnostic visualization, but the matrix above is the canonical teaching view. If the strict renderer changes when the diagnostic PNG is recolored, the renderer is wrong.

### LES-GFX-002 - Tile words and the paged world
System 2 uses up to eight pages, each 32x32 tiles. One page is the fixed foreground and four selected pages form the scrolling 64x64 background. Each tile descriptor is two bytes. The game extracts an 11-bit tile code, an 8-bit color/priority field and ultimately a 9-bit logical pen. Row scrolling means the X offset can vary for each group of scanlines, so one global scroll value is insufficient for faithful capture.

### LES-GFX-003 - Why a sprite ROM is not a sprite sheet
System 2 sprites are unusual enough to deserve their own mental model. A live 16-byte descriptor supplies top/bottom Y, X and bank bits, a 16-bit stride and a 16-bit source address. For each row the renderer adds the stride, then reads nibbles until `0xF` ends that row. Nibble `0` is transparent. Address bit 15 changes traversal direction and nibble order. Each visible nibble becomes two horizontal hardware pixels. [SRC-002]

![Sprite row lesson](bible/figures/FIG-SPR-TEACH-001-row.png)

This explains why `IMG-SPR-SEQ-*` and `IMG-SPR-CAND-*` remain research objects. Static repeated geometry can suggest a frame boundary, but only the runtime descriptor tells us which row addresses the game actually combines.

### LES-GFX-004 - Pixel index is not final color
Tiles provide index values 0-7 and sprites provide 4-bit pixel values. Those values first become **logical pens** by combining them with the tile color field or live sprite slot. The selected logical pen addresses one of 0x800 palette-RAM entries; that byte then selects one of 256 physical RGB PROM colors.

![Palette pipeline](bible/figures/FIG-PAL-001-pipeline.png)

This two-step indirection is why runtime palette RAM is mandatory evidence for exact screenshots. The palette PROMs tell us what physical color index 42 means; they do **not** tell us that a given helicopter pixel uses 42 in a particular frame.

### LES-GFX-005 - The mixer PROM is a tiny hardware decision table
At every output pixel the hardware considers whether sprite/fixed/background inputs are transparent plus the priority bits on the tile layers. Those bits form an 8-bit index into the 256-entry mixer PROM. The PROM output selects which source wins and also contributes collision flags. A PROM is therefore a hardware lookup table: the 1985 board avoids a large amount of general-purpose logic by asking a tiny preprogrammed truth table what to do.

### LES-AUD-001 - Sound is another computer inside the cabinet
The main CPU does not synthesize all sound directly. It communicates through a sound latch to a second Z80, which interprets commands/state and writes two SN76489 programmable sound generators. The current static map gives a clean example in the sound NMI path:
```text
INS-SND-0066     0066  F5        PUSH AF
INS-SND-0067     0067  3A00E0    LD A,($E000)
INS-SND-006A     006A  321080    LD ($8010),A
INS-SND-006D     006D  F1        POP AF
INS-SND-006E     006E  FB        EI
INS-SND-006F     006F  ED45      RETN
```

At `0067` the sound CPU reads address `E000`, which the sound memory map identifies as the command/data latch, and stores the byte at `8010`. That is a real static fact. The *meaning* of each byte still requires command/output traces.

![Audio command flow](bible/figures/FIG-AUD-001-flow.png)

### LES-AUD-002 - What a PSG can do
An SN76489-class PSG generates programmable square-wave tones and noise at selected volume levels. It is not a sample player in the modern sense. A sound can nevertheless be surprisingly expressive through rapid register changes, multiple channels and noise. This is also a source-discipline lesson: public descriptions may call an effect “speech” or “digitized,” while the documented board inventory shows PSG hardware and no obvious sample-playback device. The project should trace actual PSG writes before declaring the synthesis method.

### LES-GAME-001 - The rescue loop is a state machine, not a score counter
At a high level the arcade loop is: locate captive hostages -> create a safe opportunity for release -> land in a valid state -> allow hostages to approach and board -> transport them while exposed to danger -> return to the base/drop zone -> unload -> update rescue/fuel/score/session state -> repeat until the verified stage-completion condition is met. Each arrow in that sentence is a state transition with guards, timing and possible failure outcomes.

This is why the modern design stores individual hostage states (`HOST-CAPTIVE`, `HOST-RUN-TO-HELI`, `HOST-ABOARD`, `HOST-RESCUED`, `HOST-DEAD`, and so on) and derives HUD totals from simulation truth. The HUD must never become the source of truth. The same principle applies to stage completion: the displayed count can be presentation, while the state machine decides whether the exact original threshold has been satisfied.

### LES-GAME-002 - Helicopter, weapons, fuel and danger form one coupled system
The helicopter is simultaneously a movement system, weapon platform, landing/boarding platform and transport container. Fuel creates time pressure; enemy behavior changes the risk of landing; weapon use changes threats; rescue capacity changes route planning; damage/death can invalidate a nearly completed trip. Teaching these systems separately is useful, but reproducing the game means testing their **interaction order** as well as each subsystem in isolation.

The Bible therefore avoids tuning a free-form Unreal Pawn “until it feels right.” Movement constants, landing conditions, weapon cadence, projectile paths, fuel changes, rescue timing and collision consequences are data/evidence driven. When a constant is unknown, its `UNK-*` record blocks strict-mode promotion instead of inviting a plausible guess.

## Part IV - Reverse engineering as a scientific method
### LES-CODE-001 - Bytes are evidence; disassembly is an interpretation
A disassembler walks bytes and proposes instructions. If a block of data happens to contain byte values that are legal opcodes, a linear disassembler will happily print convincing nonsense. Conversely, Z80 programs can jump into locations that a different linear walk treated as the middle of another instruction. v1.1 fixed this by keeping raw byte IDs as immutable truth and allowing reachable instruction-start interpretations to coexist.

### LES-CODE-002 - A hardware touchpoint is a clue, not a routine name
Suppose a routine writes `D81C`. The memory map says that address is in palette RAM, so “this routine participates in palette activity” is a justified static observation. Calling it `UpdateHelicopterPalette()` is not justified until runtime tracing repeatedly associates the routine with that semantic event and rules out broader responsibilities.

The same discipline applies to graphics. A sprite candidate that visually resembles a helicopter is a hypothesis. Name the raw image by evidence location; create `SEM-*` aliases only after runtime correlation.

### LES-EVID-001 - The evidence ladder
The Bible orders evidence deliberately. Matching ROM bytes prove what is stored. MAME proves what its hardware model does and documents. Static code proves certain instruction/data relationships. Runtime traces prove what executes under a controlled scenario. Historical interviews prove statements about development history, not RAM addresses. Modern Unreal architecture is a design decision, not an arcade fact.

![Reverse-engineering method](bible/figures/FIG-RE-001-method.png)

A good unknown is not an embarrassment; it is a **work item with a falsifiable closure method**. `UNK-STAGE-TILEMAPS`, for example, says exactly which RAM/pages/registers must be captured before stage data can be canonical.

### LES-RE-001 - A screenshot is not a complete capture
A screenshot tells you the final visible result. It does not tell you which bank was active, which invisible sprites existed, what palette RAM contained, which collision bit was read, what work-RAM state controlled an enemy, or whether a mid-frame register write altered a later scanline. `CAP-MAME-FRAME-001` therefore records full raw state and `CAP-MAME-EVENT-001` records ordered sub-frame events.

### LES-RE-002 / LES-RE-003 - Reconstruct, compare, then promote
For a stage: capture the currently mapped video window plus page/control-write history, selectors, row scroll, Y scroll, palette state and framebuffer checkpoints across traversal; reconstruct the necessary page history, using the instrumented collector only if hidden state remains required. For a sprite: capture live descriptor-bearing state; independently correlate pixels/state; repeat; only then assign object/frame semantics. The procedure is intentionally slower than guessing because it produces reusable truth.

## Part V - Translating 1985 behavior into Unreal Engine 5.8
### LES-UE-001 - Preserve behavior, not obsolete constraints
The arcade board bank-switches because a Z80 cannot directly address all program ROM at once. Unreal does not need to recreate that inconvenience. Likewise, the original board stores collisions in special RAM and uses a mixer PROM because dedicated hardware was efficient in 1985. Modern code should preserve the **observable results and ordering** while representing them with clear deterministic systems.

![Legacy-to-Unreal mapping](bible/figures/FIG-LEGACY-UE-001-map.png)

The exception is when a hardware mechanism affects behavior. Sprite-slot order may affect collision results; row-scroll values affect the visible stage; palette RAM affects exact color. In those cases the behavioral consequence becomes part of the modern contract.

### LES-UE-002 - Strict indexed rendering
Paper2D sprites/flipbooks are useful presentation tools, but strict Choplifter pixels require an owned indexed-data path. Tile/sprite data stays numeric, the correct logical pen is computed, palette RAM and PROM LUTs resolve color, and the mixer determines source priority. Nearest-neighbor/unlit/no-unintended-sRGB rules protect the output from modern rendering “help.” [SRC-003][SRC-004]

### LES-UE-003 - Determinism is the foundation of comparison
If the same input stream can produce different game state because rendering ran at 59 FPS instead of 144 FPS, the project cannot be compared scientifically to the arcade. The simulation therefore uses a fixed step, fixed-point state, canonical per-frame input, explicit RNG policy, deterministic system ordering and periodic checksums. Rendering interpolates presentation; it does not own gameplay time.

![Unreal architecture](bible/figures/FIG-UE-001-architecture.png)

## Part VI - Hands-on curriculum
The labs below are not decorative exercises. They mirror the actual reverse-engineering and implementation work. Each has a stable `LAB-*` ID, prerequisite lesson IDs, a concrete artifact to produce, and a pass rule.

### LAB-EVID-001 - Classify five claims by evidence grade
**Domain:** Evidence | **Lessons:** LES-ORIENT-001;LES-EVID-001
**Resources:** teaching/source_registry.csv;audit/id_registry.csv
**Assignment:** Take one ROM fact, one MAME behavior, one static sprite inference, one historical interview claim and one modern Unreal choice. Assign grade and explain what would promote/demote it.
**Deliverable:** A table with claim, source ID, evidence grade, confidence and next proof.
**Pass rule:** No secondary claim is labeled ROM/RUNTIME proven.

### LAB-HIST-001 - Build a sourced 1982 -> 1985 timeline
**Domain:** History | **Lessons:** LES-HIST-001;LES-HIST-003
**Resources:** teaching/history_event_registry.csv
**Assignment:** Use the source registry to distinguish original Apple II history from Sega arcade development.
**Deliverable:** Timeline citing SRC IDs and noting the Sega licensing boundary.
**Pass rule:** Does not imply Dan Gorlin wrote the 1985 arcade code.

### LAB-CAB-001 - Map physical controls to electrical/software inputs
**Domain:** Cabinet | **Lessons:** LES-CAB-001;LES-CPU-002
**Resources:** audit/io_port_map.csv;unreal/component_registry.csv
**Assignment:** Trace joystick/buttons/start/coin/service -> PORT IDs -> canonical Unreal action bits.
**Deliverable:** Control mapping diagram with unresolved button semantics marked open.
**Pass rule:** No guessed Button1/Button2 gameplay label is promoted to strict truth.

### LAB-HEX-001 - Decode little-endian words and address ranges
**Domain:** Digital fundamentals | **Lessons:** LES-DIG-001
**Resources:** audit/memory_map.csv
**Assignment:** Convert sample bytes to words and classify C000, D000, D800, E000, F000 using memory_map.csv.
**Deliverable:** Correct conversions and region labels.
**Pass rule:** All byte order/address classifications correct.

### LAB-HW-001 - Follow one frame through the board
**Domain:** Hardware | **Lessons:** LES-HW-001
**Resources:** audit/board_component_registry.csv;audit/hardware_registry.csv
**Assignment:** Trace input -> main CPU -> sprite/tile/palette RAM -> mixer -> framebuffer and sound command -> sound CPU -> PSG.
**Deliverable:** Signal/data-flow explanation using stable IDs.
**Pass rule:** Every block is tied to a registry ID; unknown custom-chip roles stay unknown.

### LAB-TIME-001 - Convert frames to cycles
**Domain:** Timing | **Lessons:** LES-HW-002
**Resources:** audit/hardware_registry.csv
**Assignment:** Using ~60.0952 Hz and ~4 MHz, estimate cycles per frame, then explain why the result is only a teaching estimate and not a replacement for cycle traces.
**Deliverable:** Calculation + caveat.
**Pass rule:** Distinguishes nominal average from exact per-event timing.

### LAB-Z80-001 - Annotate the reset/startup bytes
**Domain:** CPU/code | **Lessons:** LES-CPU-001;LES-CODE-001
**Resources:** code_map/instruction_map_reachable.csv
**Assignment:** Read the MAIN-F 0000 code window and label DI, IM 1, IN, OUT and JP without assigning unsupported gameplay semantics.
**Deliverable:** Annotated instruction table.
**Pass rule:** No semantic routine name invented.

### LAB-Z80-002 - Immediate or memory reference?
**Domain:** CPU/code | **Lessons:** LES-CPU-002
**Resources:** code_map/code_immediate_refs.csv;code_map/code_memory_xrefs.csv
**Assignment:** Compare `LD HL,$D012` with `LD A,($D012)` and explain why only the latter is a direct memory dereference.
**Deliverable:** Operand classification with xref type.
**Pass rule:** No numeric literal alone is treated as a memory access.

### LAB-BANK-001 - Resolve one banked address
**Domain:** CPU/code | **Lessons:** LES-CPU-003
**Resources:** code_map/code_region_registry.csv;ROM-MAIN-BANK-A;ROM-MAIN-BANK-B
**Assignment:** For CPU address 9400, list which physical ROM bodies can occupy the bank window and what runtime bank evidence is needed to know which executes.
**Deliverable:** Bank/address mapping.
**Pass rule:** Explains same CPU address can map to multiple ROM bodies.

### LAB-TILE-001 - Decode TILE-0100 by hand
**Domain:** Graphics | **Lessons:** LES-GFX-001
**Resources:** TILE-0100;IMG-TILE-0100;assets/tiles/tile_pixels_uint8.npy
**Assignment:** Use the 3-plane 4/2/1 formula and compare the resulting 8x8 index matrix to canonical tile data.
**Deliverable:** 8x8 index matrix and hash comparison.
**Pass rule:** Matrix matches canonical values; PNG color is treated only as visualization.

### LAB-TILEMAP-001 - Decode a tile word
**Domain:** Graphics | **Lessons:** LES-GFX-002;LES-GFX-004
**Resources:** HW-VID-PAGES;HW-VID-PALETTE
**Assignment:** Given sample byte0/byte1 values, compute tile code, color6 and priority, then form fixed/background palette addresses.
**Deliverable:** Worked formula table.
**Pass rule:** Bit extraction and source palette base are correct.

### LAB-SPR-001 - Decode one sprite ROM row
**Domain:** Graphics | **Lessons:** LES-GFX-003
**Resources:** HW-VID-SPRITES;SRC-002
**Assignment:** Step through nibble order, transparent zero and F terminator. Repeat with address bit15 set to demonstrate reverse traversal.
**Deliverable:** Decoded index row.
**Pass rule:** Direction/nibble order/termination match System 2 renderer.

### LAB-PAL-001 - Walk one pixel through the palette pipeline
**Domain:** Graphics | **Lessons:** LES-GFX-004
**Resources:** PAL-PHYS-000;TST-PALETTE-ADDRESS
**Assignment:** Start with a tile pixel + color6 or sprite slot + pixel4; compute the palette RAM address, physical PROM index and RGB lookup.
**Deliverable:** Complete provenance chain.
**Pass rule:** Never substitutes diagnostic PNG RGB for runtime palette RAM.

### LAB-MIX-001 - Explain one mixer PROM entry
**Domain:** Graphics | **Lessons:** LES-GFX-005
**Resources:** assets/mixer/lookup_prom_truth_table.csv
**Assignment:** Select transparency/priority bits, compute lookup index, inspect MIX-* row and explain visible source/collision outputs.
**Deliverable:** One fully explained mixer row.
**Pass rule:** Input bit meanings and output selection match table.

### LAB-AUD-001 - Trace a sound command path
**Domain:** Audio | **Lessons:** LES-AUD-001
**Resources:** INS-SND-0066;MEM-SND-LATCH;CAP-MAME-EVENT-001
**Assignment:** Use the sound NMI/latch code window to identify the E000 read and storage into sound RAM, then explain what runtime event capture must add.
**Deliverable:** Annotated trace.
**Pass rule:** Distinguishes observed instruction behavior from unknown sound-command semantics.

### LAB-AUD-002 - Model a PSG tone conceptually
**Domain:** Audio | **Lessons:** LES-AUD-002
**Resources:** HW-AUD-PSG1;HW-AUD-PSG2
**Assignment:** Given a hypothetical divider and clock, compute approximate square-wave frequency and identify why exact register writes are needed for faithful recreation.
**Deliverable:** Frequency calculation + evidence caveat.
**Pass rule:** No invented original note/register sequence.

### LAB-CODE-001 - Promote or reject a routine name
**Domain:** Reverse engineering | **Lessons:** LES-CODE-002
**Resources:** code_map/routine_map.csv;code_map/code_xrefs.csv
**Assignment:** Choose one COD-* candidate, inspect xrefs/touchpoints, propose a hypothesis, then list runtime evidence needed before semantic alias promotion.
**Deliverable:** Hypothesis with falsification plan.
**Pass rule:** Routine is not renamed on static touchpoint evidence alone.

### LAB-GAME-001 - Write the hostage transition table
**Domain:** Gameplay | **Lessons:** LES-GAME-001
**Resources:** unreal/state_registry.csv;GAM-HOST-001
**Assignment:** Create guards/events for captive -> released -> run -> board -> aboard -> unload -> rescued/dead using existing state IDs and mark unverified timing.
**Deliverable:** State transition table.
**Pass rule:** Simulation states own truth; HUD values are derived.

### LAB-GAME-002 - Design a helicopter trace experiment
**Domain:** Gameplay | **Lessons:** LES-GAME-002
**Resources:** UNK-TIMING-PHYSICS;CAP-MAME-FRAME-001
**Assignment:** Specify an input sequence to measure acceleration, braking, landing and weapon timing one variable at a time.
**Deliverable:** Controlled experiment protocol.
**Pass rule:** Captures position/state/input per frame and avoids tuning by eye.

### LAB-CAP-001 - Validate one capture fixture
**Domain:** Runtime research | **Lessons:** LES-RE-001
**Resources:** unreal/runtime_capture_schema.json;unreal/runtime_event_schema.json
**Assignment:** Produce/import one CAP-MAME-FRAME-001 record and matching event log; verify ROM/version/bank/RAM/page/scroll provenance.
**Deliverable:** Schema-valid capture fixture.
**Pass rule:** TST-CAPTURE-SCHEMA passes; no required field omitted.

### LAB-STAGE-001 - Reconstruct one viewport
**Domain:** Runtime research | **Lessons:** LES-RE-002
**Resources:** CAP-MAME-FRAME-001;UE-INDEXED-TILE-RENDER
**Assignment:** Use eight pages, selectors, row scroll, Y scroll and palette RAM to independently render one captured frame.
**Deliverable:** Independent viewport image + difference report.
**Pass rule:** Zero unexplained strict pixel differences after approved transform.

### LAB-SPR-002 - Promote one semantic sprite frame
**Domain:** Runtime research | **Lessons:** LES-RE-003
**Resources:** UNK-SPR-SEMANTICS;CAP-MAME-FRAME-001
**Assignment:** Capture a live sprite descriptor twice, independently render it and correlate it with framebuffer/game state before creating a SEM-* alias.
**Deliverable:** Semantic alias record with trace IDs.
**Pass rule:** Two repeated observations support identity/frame order.

### LAB-UE-001 - Translate one hardware feature without emulating it
**Domain:** Unreal | **Lessons:** LES-UE-001
**Resources:** UE-SIM-WORLD;UE-COLLISION;UE-PALETTE
**Assignment:** Choose bank switching, collision RAM or palette PROM and describe the observable behavior to preserve versus hardware mechanism to discard.
**Deliverable:** Legacy->behavior->modern mapping.
**Pass rule:** Preserves observable behavior while avoiding unnecessary hardware emulation.

### LAB-UE-002 - Prove diagnostic colors cannot leak into strict rendering
**Domain:** Unreal | **Lessons:** LES-UE-002
**Resources:** TST-INDEXED-RENDER
**Assignment:** Change a diagnostic tile PNG color while leaving indexed data unchanged and verify strict screenshot hash remains identical.
**Deliverable:** Automated test result.
**Pass rule:** Strict output is unchanged.

### LAB-UE-003 - Replay determinism under variable render rate
**Domain:** Unreal | **Lessons:** LES-UE-003
**Resources:** TST-SIM-DETERMINISM;TST-REPLAY-DETERMINISM
**Assignment:** Run one canonical replay at several render frame rates and compare world checksums each sim frame.
**Deliverable:** Checksum report.
**Pass rule:** All simulation checksums identical.

### Knowledge checkpoints
Use the questions before reading the answer key. The purpose is to detect category errors—especially confusing “looks plausible” with “is proven.”

**QST-001 (LES-HIST-003):** Why is calling the 1985 arcade game a simple source-code port misleading?
**QST-002 (LES-HW-001):** What are the three main processing domains on the protected board?
**QST-003 (LES-CPU-002):** Why is LD HL,$D012 not sufficient evidence of a sprite-RAM access?
**QST-004 (LES-CPU-003):** Why must a trace record bank state for an instruction at 0x9400?
**QST-005 (LES-GFX-001):** What weights do the three tile planes contribute?
**QST-006 (LES-GFX-003):** What do sprite nibble 0 and nibble F mean?
**QST-007 (LES-GFX-004):** Why can the same indexed tile look different at runtime?
**QST-008 (LES-GFX-005):** What does the mixer PROM decide?
**QST-009 (LES-AUD-001):** Why is a sound-latch byte not automatically a named sound effect?
**QST-010 (LES-CODE-001):** Why is raw byte evidence stronger than one disassembly interpretation?
**QST-011 (LES-EVID-001):** What evidence grade is required before a heuristic sprite candidate becomes a strict production semantic frame?
**QST-012 (LES-UE-001):** Why should Unreal not emulate bank switching just because the original board did?
**QST-013 (LES-UE-002):** Why are the tile PNG RGB values forbidden as strict rendering truth?
**QST-014 (LES-UE-003):** What must remain unchanged if render FPS changes in strict mode?

### Answer key
**QST-001:** Because Gorlin described it as a Sega licensing deal he did not develop; Sega created its own design/artwork and arcade-specific behavior.
**QST-002:** Main Z80/game domain, sound Z80/audio domain, and the 8751 MCU/control-protection domain, plus dedicated video/mixer logic.
**QST-003:** It loads the numeric constant into HL; only a later dereference can turn that value into a memory access.
**QST-004:** 0x9400 lies in the banked 0x8000-0xBFFF window; multiple physical ROM bank bodies can occupy that CPU address.
**QST-005:** Plane 0 contributes bit2/value4, plane1 bit1/value2, plane2 bit0/value1.
**QST-006:** 0 is transparent; F terminates the current scanline.
**QST-007:** Its logical pen is mapped through mutable palette RAM to a physical PROM color; changing palette RAM changes displayed RGB without changing tile indices.
**QST-008:** Which source (sprite/fixed/background) supplies the visible pixel and mixer-collision side effects based on transparency/priority inputs.
**QST-009:** The byte is only a command/data value until runtime traces correlate it repeatedly with sound CPU/PSG behavior and an audible event.
**QST-010:** The bytes are immutable ROM truth; instruction boundaries can overlap or be confused with embedded data.
**QST-011:** Runtime-observed evidence with descriptor/frame/state provenance and repeated correlation.
**QST-012:** Bank switching is an implementation constraint; preserve its observable consequences, but use modern data/code organization unless hardware behavior itself affects gameplay.
**QST-013:** They are diagnostic colors used to visualize indices; original runtime color comes from palette RAM and physical PROMs.
**QST-014:** Every deterministic simulation state/checksum for the same canonical input/replay.

## Part VII - Engineering reference and implementation specification
The remainder of the Bible is the exact project reference: ROM audit, formal hardware/video formulas, code maps, gameplay requirements, Unreal contracts, workflows, tests, tasks, runtime-capture schemas, unknowns and appendices. Teaching explanations above never override these machine-readable registries.

## 2. Executive audit verdict
| Area | State | Reason |
| --- | --- | --- |
| Source ROM set | CONDITIONAL PASS | All program/graphics/sound/PROM items match reference except supplied 8751 MCU; PLD 315-5139 remains absent. |
| Tile extraction | PASS | 4096 corrected 8x8 tile-index assets; canonical numeric index data retained separately from diagnostic PNG color. |
| Sprite ROM research | PASS WITH LIMITATION | Static sequences/candidates remain research artifacts; runtime descriptor semantics are still open. |
| Static code graph | PASS v1.1 STATIC | 4,942 reachable starts, zero known routine/block/direct-target dangling references after patch; semantic names remain runtime-gated. |
| Static hardware touchpoints | PASS WITH LIMITATION | Only explicit absolute dereferences/true immediate I/O are classified and CPU address spaces are separated; data-flow/indirect accesses still require runtime/static refinement. |
| Runtime capture contract | PASS DESIGN / ORIGINAL NOT RUN | Frame/event schema v3 plus profile schema v2 reflect the public-Lua capability boundary: exact attotime, mapped video-window snapshots, pass-through collision taps, loss accounting and sealed provenance. |
| Strict Unreal renderer | PASS DESIGN | Production strict path is indexed-data + palette/mixer LUT driven; diagnostic PNGs are prohibited as strict render truth. |
| Traceability/integrity | PASS PACKAGE ENGINEERING | Current ID/relation counts are generated in A14 and validated against `audit/id_registry.csv`, `audit/relations.csv` and `audit/ChopperGameEvidence.db`. |
| Arcade-fidelity content lock | NO-GO YET | Runtime sprite semantics, exact stage data, AI, timing/RNG/input sampling, collision use/order, scoring and audio semantics remain evidence-gated. |

**Historical v1.4 snapshot:** the archived v1.4 master registry contained 257,111 IDs. That historical count is retained only to explain lineage and must not be used as the current project inventory. The current v1.9 counts are generated in A14 from the live registries.

![Evidence pipeline](bible/figures/FIG-EVID-001-pipeline.png)

## 3. Evidence grades and immutable identity
- **ROM-PROVEN:** deterministic result from matching supplied ROM bytes.
- **MAME-PROVEN:** hardware behavior documented by pinned current MAME source/hardware notes. [SRC-001][SRC-002]
- **STATIC-CODE-MAP:** decoded/static control/data-reference evidence; not runtime semantic proof.
- **STATIC-ROM-INFERENCE / HEURISTIC-STATIC-INFERENCE:** useful graphics-ROM structure without live descriptor proof.
- **RUNTIME-OBSERVED:** controlled MAME/original capture with frame/cycle/config provenance; required for final semantic behavior.
- **SECONDARY-ARCADE-SOURCES:** hypothesis/capture planning only when numeric details are not independently verified.
- **MODERN-DESIGN:** Unreal architecture/engineering choice; never represented as original arcade fact.

Raw/object identity is separate from diagnostic representation. `TILE-0100` is the canonical tile object; `IMG-TILE-0100` is its diagnostic image. `SPRSEQ-B0-R004` is a static ROM sequence object; an `IMG-SPR-SEQ-*` PNG is only a visualization. Existing v1 IDs remain valid; v1.4 retains the v1.1 object-ID separation rather than renaming them.

## 4. ID namespaces and relation graph
| Prefix | Meaning |
| --- | --- |
| ROM-* | ROM/PROM/MCU/PLD sources |
| TILE-* | Canonical tile object/code |
| IMG-* | Generated diagnostic/reference image |
| SPRSEQ-* | Static sprite-ROM sequence object |
| PAL-PHYS-* | Physical PROM color index |
| MIX-* | Mixer PROM truth-table entry |
| BYT-* | Raw program byte evidence |
| INS-* | Z80 instruction-start interpretation |
| COD-* / BLK-* | Routine/block static-analysis objects |
| XREF-* / MXREF-* / IOXREF-* / IMMREF-* | Control-flow, explicit memory, I/O and immediate references |
| STATE-* | Simulation/session state scaffold |
| CAP-* | Runtime capture schemas/sets |
| REL-* | Traceability relation |
| GAM-* / STG-* | Gameplay requirement / stage identity |
| UE-* | Unreal component/data/render contracts |
| WFL-* / TST-* / IMP-* / UNK-* | Workflow / test / task / evidence gap |

`audit/relations.csv` is the machine-readable graph. Important relation types include `VERIFIED-BY`, `DEPENDS-ON`, `GATED-BY`, `BLOCKS`, `BLOCKED-BY`, `CHILD-OF`, `HAS-DIAGNOSTIC-IMAGE` and `HEURISTIC-SPLIT-OF`. `audit/ChopperGameEvidence.db` stores the current ID and relation graph with SQLite foreign keys.

## 5. Source ROM audit
<!-- CG:SOURCE-ROM:START -->
| ID | File | Role | Actual CRC | Reference CRC | Current status |
| --- | --- | --- | --- | --- | --- |
| `ROM-MAIN-FIX` | epr-7124.ic90 | main fixed program | 678d5c41 | 678d5c41 | **MATCH** |
| `ROM-MAIN-BANK-A` | epr-7125.ic91 | main banked program A | f5283498 | f5283498 | **MATCH** |
| `ROM-MAIN-BANK-B` | epr-7126.ic92 | main banked program B | dbd192ab | dbd192ab | **MATCH** |
| `ROM-SOUND` | epr-7130.ic126 | sound Z80 program | 346af118 | 346af118 | **MATCH** |
| `ROM-MCU-8751` | 315-5151.ic74 | 8751 MCU program | 7bd11a6c | 1377a6ef | **HISTORICAL_BAD_DUMP_NOT_CANONICAL** |
| `ROM-TILE-P0` | epr-7127.ic4 | tile plane 0 (high significance) | 1e708f6d | 1e708f6d | **MATCH** |
| `ROM-TILE-P1` | epr-7128.ic5 | tile plane 1 | b922e787 | b922e787 | **MATCH** |
| `ROM-TILE-P2` | epr-7129.ic6 | tile plane 2 (low significance) | bd3b6e6e | bd3b6e6e | **MATCH** |
| `ROM-SPR-B0` | epr-7121.ic87 | sprite bank 0 | f2b88f73 | f2b88f73 | **MATCH** |
| `ROM-SPR-B1` | epr-7120.ic86 | sprite bank 1 | 517d7fd3 | 517d7fd3 | **MATCH** |
| `ROM-SPR-B2` | epr-7123.ic89 | sprite bank 2 | 8f16a303 | 8f16a303 | **MATCH** |
| `ROM-SPR-B3` | epr-7122.ic88 | sprite bank 3 | 7c93f160 | 7c93f160 | **MATCH** |
| `ROM-PAL-R` | pr7119.ic20 | red palette PROM | b2a8260f | b2a8260f | **MATCH** |
| `ROM-PAL-G` | pr7118.ic14 | green palette PROM | 693e20c7 | 693e20c7 | **MATCH** |
| `ROM-PAL-B` | pr7117.ic8 | blue palette PROM | 4124307e | 4124307e | **MATCH** |
| `ROM-MIXER` | pr5317.ic28 | priority/collision lookup PROM | 648350b8 | 648350b8 | **MATCH** |
| `ROM-PLD-5152` | 315-5152.bin | PAL16R4 logic | 2c9229b4 | 2c9229b4 | **MATCH** |
| `ROM-PLD-5138` | 315-5138.bin | PAL16R4 logic | dd223015 | dd223015 | **MATCH** |
| `ROM-PLD-5139` | 315-5139.ic50 | PLS153 logic |  | 943d91b0 | **MISSING_SOURCE** |

The pinned comparison profile is MAME 0.289 / `mame0289` / `f34f02505e32c1993c6a782b6814232cbfc74e36`. The supplied MCU is explicitly classified `HISTORICAL_BAD_DUMP_NOT_CANONICAL`; `315-5139.ic50` is `MISSING_SOURCE`. For strict stock-MAME protected-parent staging, both absent canonical objects remain blockers. For runtime semantics, only the canonical MCU is missing: current MAME System 1/2 code does not consume the `plds` region as runtime data. The PLD remains required for the unmodified stock ROM manifest/audit. Matching program/graphics/sound/PROM evidence remains usable for its bounded roles; no replacement bytes are bundled.
<!-- CG:SOURCE-ROM:END -->

![Original hardware architecture](bible/figures/FIG-HW-001-original-system2.png)

## 6. Original hardware contracts
| ID | Type | Name | Original | Role | Evidence |
| --- | --- | --- | --- | --- | --- |
| HW-CPU-MAIN | CPU | Main Z80 | Z80A ~4 MHz | Main game logic, input, video/sprite/palette/collision access, banking | MAME-PROVEN |
| HW-CPU-SOUND | CPU | Sound Z80 | Z80A ~4 MHz | PSG/audio command processing | MAME-PROVEN |
| HW-MCU-8751 | MCU | 8751 MCU | Intel 8751 ~8 MHz | Protection/control interface in protected set; do not port as hardware | MAME-PROVEN; SUPPLIED-DUMP-MISMATCH |
| HW-VID-TILES | Video | 3-plane 8x8 tile graphics | 4096 codes, 3 bpp | Fixed/background tile artwork | ROM+MAME-PROVEN |
| HW-VID-PAGES | Video | System 2 paged tilemap | 8 pages x 32x32 tiles; four selected pages form 64x64 scrolling background; page 0 fixed foreground | Stage composition/scrolling | MAME-PROVEN |
| HW-VID-SPRITES | Video | Sprite engine | Up to 32 live sprites; 16-byte descriptors; 4bpp variable-width scanline ROM format | Helicopter, enemies, hostages, effects | MAME-PROVEN |
| HW-VID-MIXER | Video | Priority/mixer PROM | 256x4 lookup PROM | Select sprite/fixed/background and mixer collision flags | ROM+MAME-PROVEN |
| HW-VID-PALETTE | Video | Palette indirection | 0x800 palette RAM -> 256 physical PROM RGB colors | Runtime logical pen to physical RGB mapping | MAME-PROVEN |
| HW-COL-SPRITE | Collision | Sprite pair collision RAM | 32x32x1 collision relationships | Hardware collision evidence used by game logic | MAME-PROVEN |
| HW-COL-MIXER | Collision | Mixer collision RAM | 2x32 collision flags plus summary | Sprite/tile mixer collision evidence | MAME-PROVEN |
| HW-AUD-PSG1 | Audio | SN76489 #1 | ~4 MHz PSG | Music/SFX tone/noise generation | MAME-PROVEN |
| HW-AUD-PSG2 | Audio | SN76489 #2 | ~2 MHz PSG | Music/SFX tone/noise generation | MAME-PROVEN |
| HW-INP-P1 | Input | P1 controls | 8-way joystick + 2 buttons | Player 1 helicopter control | MAME-PROVEN; button semantics need runtime/manual confirmation |
| HW-INP-P2 | Input | P2 controls | 8-way joystick + 2 buttons/cocktail mapping | Player 2/alternate play | MAME-PROVEN |
| HW-TIME-VSYNC | Timing | Vertical refresh | ~60.0952 Hz measured hardware | Canonical timing reference | MAME-HARDWARE-NOTES |

### 6.1 CPU address map
| ID | CPU | Range | Access | Meaning | Evidence |
| --- | --- | --- | --- | --- | --- |
| MEM-ROM-FIXED | MAIN | 0000-7FFF | R | Fixed program ROM | MAME-PROVEN |
| MEM-ROM-BANK | MAIN | 8000-BFFF | R | 16 KiB banked program window; four banks from epr-7125/epr-7126 | MAME-PROVEN |
| MEM-WORK-RAM | MAIN | C000-CFFF | RW | Main work RAM | MAME-PROVEN |
| MEM-SPRITE-RAM | MAIN | D000-D7FF | RW | 32 x 16-byte sprite descriptors plus area/mirrors | MAME-PROVEN |
| MEM-PALETTE-RAM | MAIN | D800-DFFF | RW | Logical palette indirection RAM | MAME-PROVEN |
| MEM-VIDEO-RAM-WINDOW | MAIN | E000-EFFF | RW | Banked video RAM window | MAME-PROVEN |
| MEM-MIX-COLLISION | MAIN | F000-F7FF | RW | Mixer collision read/clear/summary regions | MAME-PROVEN |
| MEM-SPRITE-COLLISION | MAIN | F800-FFFF | RW | Sprite pair collision read/clear/summary regions | MAME-PROVEN |
| MEM-SND-ROM | SOUND | 0000-7FFF | R | Sound Z80 ROM | MAME-PROVEN |
| MEM-SND-RAM | SOUND | 8000-87FF | RW | Sound RAM (mirrored per hardware map) | MAME-PROVEN |
| MEM-SND-PSG1 | SOUND | A000 | W | SN76489 #1 data | MAME-PROVEN |
| MEM-SND-PSG2 | SOUND | C000 | W | SN76489 #2 data | MAME-PROVEN |
| MEM-SND-LATCH | SOUND | E000 | R | Sound command/data latch | MAME-PROVEN |

### 6.2 Cabinet/DIP configuration — Choplifter-specific, MAME 0.289 pinned

<!-- CG:DIP:START -->
| ID | Physical switch | Values | Meaning | Software port | Mask | Default | Evidence |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `CFG-CABINET` | SWB:1 | Upright(default)=0;Cocktail=1 | Cabinet mode | `SWA` | `0x01` | `0x00` | MAME-0.289-PINNED |
| `CFG-DEMO-SOUND` | SWB:2 | On(default)=0;Off=1 | Demo/attract sounds | `SWA` | `0x02` | `0x00` | MAME-0.289-PINNED |
| `CFG-LIVES` | SWB:3,4 | 2=0x08;3(default)=0x0C;4=0x04;Free Play=0x00 | Starting lives / Free Play mode | `SWA` | `0x0C` | `0x0C` | MAME-0.289-PINNED |
| `CFG-BONUS-LIFE` | SWB:5 | 20k 70k 120k 170k(default)=0x10;50k 100k 150k 200k=0x00 | Bonus-life schedule | `SWA` | `0x10` | `0x10` | MAME-0.289-PINNED |
| `CFG-DIFFICULTY` | SWB:6 | Hard(default)=0x00;Easy=0x20 | Difficulty setting | `SWA` | `0x20` | `0x00` | MAME-0.289-PINNED |
| `CFG-SWB7` | SWB:7 | Unused; raw default bit=0x40 | Unused DIP | `SWA` | `0x40` | `0x40` | MAME-0.289-PINNED |
| `CFG-SWB8` | SWB:8 | Unused; raw default bit=0x80 | Unused DIP | `SWA` | `0x80` | `0x80` | MAME-0.289-PINNED |
| `CFG-COIN-A` | SWA:1,2,3,4 | MAME choplift coinage table; 1 Coin/1 Credit(default)=0x0F | Coin A pricing | `SWB` | `0x0F` | `0x0F` | MAME-0.289-PINNED |
| `CFG-COIN-B` | SWA:5,6,7,8 | MAME choplift coinage table; 1 Coin/1 Credit(default)=0xF0 | Coin B pricing | `SWB` | `0xF0` | `0xF0` | MAME-0.289-PINNED |
<!-- CG:DIP:END -->

> **Port-label note:** the physical DIP-location labels and MAME software port tags are intentionally shown separately. For Choplifter in the pinned driver, physical SWA coinage is exposed through software port `SWB`, while physical SWB cabinet/game settings are exposed through software port `SWA`. Do not “correct” this by swapping the registry fields.

## 7. Exact System 2 video/palette model
System 2 uses eight 32x32 8x8-tile pages. Page 0 is the fixed foreground; four selected pages form the effective 64x64 scrolling background. Choplifter uses the System 2 row-scroll path, so strict capture must preserve **32 row-scroll values**, not one X-scroll scalar. [SRC-001][SRC-002]

### 7.1 Tile word and tile logical pen
```text
tiledata = byte0 | (byte1 << 8)
code      = ((tiledata >> 4) & 0x800) | (tiledata & 0x7FF)
color     = (tiledata >> 5) & 0xFF
priority  = (color >> 6) & 0x03
color6    = color & 0x3F
tile_pen9 = (color6 << 3) | pixel3
fixed_palette_ram_index = 0x200 | tile_pen9
bg_palette_ram_index    = 0x400 | tile_pen9
```
Tile pixel index `0` is transparent for layer composition. The upper two color bits feed priority; the lower six color bits plus the 3-bit tile pixel form the 9-bit tile logical pen. [SRC-002]

### 7.2 Sprite logical pen
```text
sprite_pen9 = (sprite_slot << 4) | pixel4
sprite_palette_ram_index = 0x000 | sprite_pen9
```
The live sprite slot selects the 16-color logical group. Sprite pixel 0 is transparent; nibble F terminates a ROM scanline. Runtime descriptor bank/source/stride/top/bottom/X data is mandatory to establish actual frames. [SRC-002]

### 7.3 Mixer lookup
```text
lookup_index = sprite_transparent
             | (fixed_transparent << 1)
             | (fixed_priority << 2)
             | (background_transparent << 4)
             | (background_priority << 5)
lookup_value = mixer_prom[lookup_index]
```
The low mixer bits select sprite/fixed/background source; upper bits contribute mixer collision flags. The selected 0x800 palette-RAM entry supplies an 8-bit physical PROM index; the three PROMs then produce RGB. `TST-PALETTE-ADDRESS`, `TST-MIXER-256`, `TST-RGB-PROM-256` and `TST-INDEXED-RENDER` jointly gate the strict renderer.

![System 2 sprite descriptor model](bible/figures/FIG-SPR-001-descriptor.png)

## 8. Corrected asset audit
![Corrected 4096-tile diagnostic atlas](assets/tiles/sheets/IMG-SHEET-TILES-ALL.png)

- **4,096 corrected tiles**, canonical as `tile_pixels_uint8.npy`; diagnostic PNG colors are not runtime colors.
- The old plane weighting changed **113,846 / 262,144 pixels (43.4288%)** and affected **3,309 tiles**; v1 extraction is superseded.
- **212** static sprite-ROM sequences and **417** heuristic candidate frames remain research-only pending runtime descriptors.
- `image_import_mapping.csv` now routes all diagnostic PNGs into Research/Reference paths. Strict production rendering consumes indexed numeric data and runtime palette/mixer state; changing diagnostic RGB must not change a strict screenshot.

## 9. Static code map - v1.1 repaired model
The static map remains an evidence index, not a decompilation. v1.1 fixed the reachable walker so direct/vector entry points can start inside a different linear decode span instead of being suppressed by byte-span marking. All routine/block/direct same-region target references are validated by `TST-CODE-GRAPH-FK`.

| Metric | Value |
| --- | --- |
| Raw program bytes | 131,072 |
| Linear instruction starts | 96,340 |
| Reachable instruction starts | 4,942 |
| Routine candidates | 66 |
| Basic-block leaders | 304 |
| Control-flow xrefs | 704 |
| Explicit absolute-memory xrefs | 416 |
| True immediate I/O xrefs | 34 |
| 16-bit immediate references | 1384 |
| Printable strings | 541 |

### 9.1 Hardware-touchpoint policy
A `$NNNN` literal is **not** automatically a memory access. v1.1+ classifies only explicit absolute dereferences such as `LD A,($D012)` as memory touchpoints. A constant such as `LD HL,$D012` remains an `IMMREF-*` until data-flow/runtime evidence proves dereference. Main and sound CPUs use separate address maps, preventing sound routines from inheriting video/palette classifications merely because the numeric ranges overlap.

New maps: `raw_byte_map.csv`, `code_memory_xrefs.csv`, `code_io_xrefs.csv`, and `code_immediate_refs.csv`. Indirect accesses, jump tables and higher-order data-flow remain runtime/static-analysis work rather than guessed semantics.

## 10. Gameplay requirement ledger
| ID | System | Requirement | Evidence | Status |
| --- | --- | --- | --- | --- |
| GAM-CORE-001 | Core | Side-scrolling helicopter rescue game loop: fly, engage threats, rescue hostages, return them safely, progress stages. | ARCADE-DOCUMENTED | BEHAVIORALLY-ESTABLISHED |
| GAM-STAGE-001 | Stage | Arcade version contains four environment/stage themes: desert, sea, caverns, city rooftops. | SECONDARY-ARCADE-SOURCES | NEEDS-RUNTIME-VERIFY |
| GAM-HOST-001 | Hostage | Each stage presents 32 hostages, commonly organized as four groups of eight. | SECONDARY-ARCADE-SOURCES | NEEDS-RUNTIME-VERIFY |
| GAM-HOST-002 | Hostage | Helicopter capacity is 8 hostages. | SECONDARY-ARCADE-SOURCES | NEEDS-RUNTIME-VERIFY |
| GAM-HOST-003 | Hostage | Stage progression requires rescuing more than 20 / at least 21 hostages. | SECONDARY-ARCADE-SOURCES | NEEDS-RUNTIME-VERIFY |
| GAM-FUEL-001 | Fuel | Fuel drains during play; fuel-out state exists (ROM text FUEL OUT!); delivering hostages replenishes fuel per secondary arcade documentation. | ROM-TEXT+SECONDARY | PARTIAL-PROOF |
| GAM-TIME-001 | Timing | HURRY UP warning state exists. | ROM-TEXT-PROVEN | PROVEN-UI-STATE |
| GAM-WPN-001 | Weapons | Two attack controls exist at hardware level; secondary documentation describes machine-gun and bomb attacks. | MAME-INPUT+SECONDARY | NEEDS-BUTTON-MAP-VERIFY |
| GAM-SCORE-001 | Scoring | Conventional score/high-score/rank system exists; exact event values remain unverified. | ROM-TEXT+UI-PROVEN | EXACT-VALUES-OPEN |
| GAM-LIFE-001 | Lives | Lives configuration supports 3/4/5/Infinite; bonus-life schedules configurable by DIP. | MAME-PROVEN | PROVEN-CONFIG |
| GAM-DIFF-001 | Difficulty | Easy/Hard DIP exists; exact changed variables/AI parameters remain unresolved. | MAME-PROVEN | MECHANISM-OPEN |
| GAM-2P-001 | Players | Two-player input and start state exist; exact turn/cocktail behavior must be captured. | MAME+ROM-TEXT | NEEDS-RUNTIME-VERIFY |
| GAM-ATTRACT-001 | Attract | Attract/demo mode exists with optional demo sounds. | MAME-DIP-PROVEN | PROVEN-EXISTENCE |
| GAM-HISCORE-001 | HighScore | High-score specialist/rank/name UI/data exists in ROM. | ROM-TEXT-PROVEN | PROVEN-UI-DATA |
| GAM-AUDIO-001 | Audio | Dual SN76489 PSG hardware drives music/SFX; sound command map unresolved. | MAME-PROVEN | COMMAND-MAP-OPEN |
| GAM-COLL-001 | Collision | Original hardware provides sprite-pair and mixer collision flags; gameplay code can read/clear these regions. | MAME-PROVEN | GAMEPLAY-USE-OPEN |

Secondary-source contradictions remain tests, not decisions. The hostage completion threshold, exact enemy/scoring behavior and stage details remain capture-gated.

## 11. State-machine registry
`unreal/state_registry.csv` gives stable IDs to the helicopter, hostage and session scaffolds. These state IDs are modern test scaffolding; exact transition guards/timers become arcade facts only when a trace closes the corresponding unknown.

| State ID | Family | Name | Contract |
| --- | --- | --- | --- |
| STATE-HELI-SPAWN | HELICOPTER | SPAWN | Strict simulation state scaffold; exact guards/timing are evidence-gated. |
| STATE-HELI-AIRBORNE | HELICOPTER | AIRBORNE | Strict simulation state scaffold; exact guards/timing are evidence-gated. |
| STATE-HELI-ASCEND | HELICOPTER | ASCEND | Strict simulation state scaffold; exact guards/timing are evidence-gated. |
| STATE-HELI-DESCEND | HELICOPTER | DESCEND | Strict simulation state scaffold; exact guards/timing are evidence-gated. |
| STATE-HELI-LANDING | HELICOPTER | LANDING | Strict simulation state scaffold; exact guards/timing are evidence-gated. |
| STATE-HELI-LANDED | HELICOPTER | LANDED | Strict simulation state scaffold; exact guards/timing are evidence-gated. |
| STATE-HELI-TAKEOFF | HELICOPTER | TAKEOFF | Strict simulation state scaffold; exact guards/timing are evidence-gated. |
| STATE-HELI-DAMAGED | HELICOPTER | DAMAGED | Strict simulation state scaffold; exact guards/timing are evidence-gated. |
| STATE-HELI-DYING | HELICOPTER | DYING | Strict simulation state scaffold; exact guards/timing are evidence-gated. |
| STATE-HELI-DEAD | HELICOPTER | DEAD | Strict simulation state scaffold; exact guards/timing are evidence-gated. |
| STATE-HELI-RESPAWN-LOCK | HELICOPTER | RESPAWN-LOCK | Strict simulation state scaffold; exact guards/timing are evidence-gated. |
| STATE-HOST-CAPTIVE | HOSTAGE | CAPTIVE | Hostage lifecycle state; exact transition conditions/timing require runtime evidence. |
| STATE-HOST-RELEASED | HOSTAGE | RELEASED | Hostage lifecycle state; exact transition conditions/timing require runtime evidence. |
| STATE-HOST-RUN-TO-HELI | HOSTAGE | RUN-TO-HELI | Hostage lifecycle state; exact transition conditions/timing require runtime evidence. |
| STATE-HOST-WAIT | HOSTAGE | WAIT | Hostage lifecycle state; exact transition conditions/timing require runtime evidence. |
| STATE-HOST-BOARDING | HOSTAGE | BOARDING | Hostage lifecycle state; exact transition conditions/timing require runtime evidence. |
| STATE-HOST-ABOARD | HOSTAGE | ABOARD | Hostage lifecycle state; exact transition conditions/timing require runtime evidence. |
| STATE-HOST-UNLOADING | HOSTAGE | UNLOADING | Hostage lifecycle state; exact transition conditions/timing require runtime evidence. |
| STATE-HOST-RESCUED | HOSTAGE | RESCUED | Hostage lifecycle state; exact transition conditions/timing require runtime evidence. |
| STATE-HOST-DEAD | HOSTAGE | DEAD | Hostage lifecycle state; exact transition conditions/timing require runtime evidence. |
| STATE-SESSION-BOOT | SESSION | BOOT | High-level session state; exact timing/2P behavior remains evidence-gated. |
| STATE-SESSION-TITLE-ATTRACT | SESSION | TITLE-ATTRACT | High-level session state; exact timing/2P behavior remains evidence-gated. |
| STATE-SESSION-CREDIT-START | SESSION | CREDIT-START | High-level session state; exact timing/2P behavior remains evidence-gated. |
| STATE-SESSION-STAGE-INIT | SESSION | STAGE-INIT | High-level session state; exact timing/2P behavior remains evidence-gated. |
| STATE-SESSION-ACTIVE | SESSION | ACTIVE | High-level session state; exact timing/2P behavior remains evidence-gated. |
| STATE-SESSION-PLAYER-DEATH-RESPAWN | SESSION | PLAYER-DEATH-RESPAWN | High-level session state; exact timing/2P behavior remains evidence-gated. |
| STATE-SESSION-STAGE-COMPLETE | SESSION | STAGE-COMPLETE | High-level session state; exact timing/2P behavior remains evidence-gated. |
| STATE-SESSION-NEXT-STAGE-LOOP | SESSION | NEXT-STAGE-LOOP | High-level session state; exact timing/2P behavior remains evidence-gated. |
| STATE-SESSION-GAME-OVER | SESSION | GAME-OVER | High-level session state; exact timing/2P behavior remains evidence-gated. |
| STATE-SESSION-HIGH-SCORE | SESSION | HIGH-SCORE | High-level session state; exact timing/2P behavior remains evidence-gated. |

## 12. Deterministic simulation contract
Strict simulation must not depend on render `DeltaSeconds`, PaperFlipbook playback time, Blueprint Tick ordering, asynchronous load timing, audio completion callbacks or Chaos contact order. Simulation state uses integer/fixed-point values and an explicit update order. The original board refresh (~60.0952 Hz) is a capture reference, not permission to guess sub-frame input/collision semantics. [SRC-001]

New strict blockers: `UNK-RNG-001`, `UNK-INPUT-SAMPLING-001`, and `UNK-COLLISION-ORDER-001`. The modern replay header must record whichever verified RNG seed/update and input-sampling model is eventually promoted.

![Coordinate model](bible/figures/FIG-COORD-001.png)

## 13. Strict rendering contract
`UE-RENDER-CONTRACT-001` defines three presentation modes: hardware-raster comparison, display-corrected presentation, and optional modern widescreen. Gameplay coordinates remain in one logical space.

- Index data is non-sRGB integer data. Diagnostic PNG RGB is prohibited as strict production truth.
- Strict checkpoint materials are unlit; no unintended tonemapping/post-processing/TAA/TSR/mip/filtering may alter the raster.
- Camera/stage placement is integer/pixel aligned.
- `TST-RGB-PROM-256` verifies every physical PROM color through framebuffer readback.
- `TST-INDEXED-RENDER` proves strict output changes only when index/palette/mixer data changes, not when diagnostic PNG colors change.

## 14. Unreal Engine 5.8 architecture
Paper2D Sprites/Flipbooks remain useful presentation tools, but Epic still lists Paper2D Tile Sets/Tile Maps under Experimental Features in UE 5.8, so the authoritative stage database/renderer remains project-owned. [SRC-003][SRC-004]

Pure deterministic core algorithms should use UE Low-Level Tests/Catch2 where practical; engine integration, gameplay, screenshot and content tests continue through Automation/Functional testing. Primary Data Assets use Asset Manager identity and native Data Validation rules; command-line Data Validation participates in CI. [SRC-006][SRC-007][SRC-008][SRC-009]

![Unreal architecture](bible/figures/FIG-UE-001-architecture.png)

| ID | Kind | Name | Responsibility |
| --- | --- | --- | --- |
| UE-MOD-CORE | Module | ChopperGameCore | Deterministic simulation/data contracts; no rendering dependencies. |
| UE-MOD-GAME | Module | ChopperGameRuntime | Actors, controllers, stage orchestration, presentation bridges. |
| UE-MOD-TEST | Module | ChopperGameTests | Automation/functional/screenshot/replay tests. |
| UE-SIM-CLOCK | C++ | FChopFixedStepClock | Fixed-step accumulator; strict nominal 60.0952 Hz; render interpolation separated. |
| UE-SIM-WORLD | C++ | FChopSimWorld | Owns ordered deterministic entity state and frame number; single authoritative simulation step. |
| UE-SIM-ENTITY | Struct | FChopEntityState | Stable EntityId, type, fixed-point position/velocity, state, timers, health/flags. |
| UE-SIM-FIXED | Struct | FChopFixed | Signed fixed-point 24.8 coordinates/velocities; 256 subunits per logical pixel. |
| UE-GM | Actor | AChopGameMode | Session rules and mode selection; creates stage/session systems. |
| UE-GS | Actor | AChopGameState | Represents score/lives/stage/rescued/fuel for presentation; not source of simulation truth. |
| UE-PC | Actor | AChopPlayerController | Enhanced Input bridge; converts actions to canonical per-frame input bits. |
| UE-INPUT-STATE | Struct | FChopInputFrame | Frame-numbered canonical 8-way + two-button/start inputs; replay-serializable. |
| UE-HELI | Actor | AChopHelicopterActor | Presentation actor for helicopter sim entity; PaperFlipbook visuals only. |
| UE-HELI-SIM | C++ | FChopHelicopterSystem | Movement/orientation/landing/damage/boarding state machine. |
| UE-WEAPON-SYS | C++ | FChopWeaponSystem | Machine-gun/bomb/fire cadence/projectile spawn; parameters data-driven. |
| UE-HOSTAGE | Actor | AChopHostageActor | Presentation for hostage sim entity. |
| UE-HOSTAGE-SYS | C++ | FChopHostageSystem | Captive/released/running/boarding/aboard/unloading/rescued/dead states. |
| UE-ENEMY | Actor | AChopEnemyActor | Generic presentation actor keyed by enemy archetype. |
| UE-AI-SYS | C++ | FChopEnemyAISystem | Deterministic state-machine AI and spawn update; avoid BT nondeterminism for fidelity. |
| UE-PROJECTILE | Actor | AChopProjectileActor | Pooled visual projectile actor. |
| UE-PROJECTILE-SYS | C++ | FChopProjectileSystem | Deterministic projectile integration/lifetime/collision requests. |
| UE-COLLISION | C++ | FChopCollisionSystem | Ordered collision evaluation; supports pixel-mask fidelity and verified simplified shapes. |
| UE-PIXELMASK | Struct | FChopPixelMask | Indexed nonzero sprite/tile mask derived from canonical images; exact mask collision option. |
| UE-STAGE-CTRL | Actor | AChopStageController | Loads stage data, manages stage progression and presentation actors. |
| UE-STAGE-SIM | C++ | FChopStageSystem | Stage triggers, rescue threshold, wave/spawn activation, completion state. |
| UE-STAGE-RENDER | Component | UChopStageRendererComponent | Owned 2D page/tile renderer; does not require Paper2D TileMap production dependency. |
| UE-SPRITE-PRES | Component | UPaperFlipbookComponent | Presentation of verified animation frames; no gameplay state stored here. |
| UE-CAMERA | Actor | AChopOrthoCameraActor | Orthographic camera and integer/pixel-aligned viewport policy. |
| UE-PALETTE | C++ | FChopPaletteSystem | Strict-mode indexed palette mapping; modern mode optional authored recolor. |
| UE-MIXER | C++ | FChopLayerMixer | Strict-mode layer priority using decoded PROM truth table when needed. |
| UE-FUEL | C++ | FChopFuelSystem | Fuel drain/refill/out behavior from verified data. |
| UE-SCORE | C++ | FChopScoreSystem | Event-to-score rules; bonus-life schedule; all tables data-driven. |
| UE-RESCUE | C++ | FChopRescueSystem | Aboard capacity, delivery, rescued/dead accounting, stage threshold. |
| UE-AUDIO | Subsystem | UChopAudioSubsystem | Maps canonical audio event IDs to recreated/imported assets; preserves event timing. |
| UE-HUD | Widget | WBP_ChopHUD | Score, lives, fuel, hostage count/status; presentation-only. |
| UE-MENU | Widget | WBP_ChopFrontEnd | Start/config/strict-vs-modern options. |
| UE-DATA-STAGE | PrimaryDataAsset | UChopStageData | Verified tile/page/world/spawn/rescue data per stage. |
| UE-DATA-ARCHETYPE | PrimaryDataAsset | UChopArchetypeData | Enemy/hostage/helicopter parameters and semantic image/animation IDs. |
| UE-DATA-ANIM | PrimaryDataAsset | UChopAnimationData | Semantic animation states -> image frame IDs + frame duration. |
| UE-DATA-SCORE | PrimaryDataAsset | UChopScoreTable | Score deltas, bonus-life thresholds; source/evidence per rule. |
| UE-DATA-AUDIO | PrimaryDataAsset | UChopAudioEventTable | Original command/event IDs -> modern sound asset/event timing. |
| UE-REPLAY | C++ | FChopReplay | Header + stage seed/config + frame inputs + periodic checksums. |
| UE-TRACE | Subsystem | UChopTraceSubsystem | Exports state per frame for MAME-vs-Unreal comparison. |
| UE-IMPORT | Commandlet | UChopAssetImportCommandlet | Consumes manifests and creates textures/sprites/flipbooks/data assets deterministically. |
| UE-VALIDATE | Commandlet | UChopContentValidationCommandlet | Fails build on missing IDs, unresolved production refs, duplicate ID collisions, bad evidence gates. |
| UE-INDEXED-TILE-LIB | C++ | FChopIndexedTileLibrary | Owns exact 0..7 tile index data; diagnostic PNG RGB is never simulation/render truth. |
| UE-INDEXED-SPRITE-LIB | C++ | FChopIndexedSpriteLibrary | Owns runtime-verified 0..15 sprite index masks/frames after descriptor capture. |
| UE-INDEXED-TILE-RENDER | Component | UChopIndexedTileRendererComponent | Strict indexed tile renderer using tile indices + tile attributes + palette RAM; no diagnostic RGB textures. |
| UE-INDEXED-SPRITE-RENDER | Component | UChopIndexedSpriteRendererComponent | Strict indexed sprite renderer using sprite slot/pixel index and runtime palette RAM. |
| UE-PALETTE-LUT | Data | FChopPaletteLUT | Exact 256 physical PROM RGB entries and 0x800 runtime logical palette mapping. |
| UE-MIXER-LUT | Data | FChopMixerLUT | Exact 256-entry mixer PROM source/collision truth table. |
| UE-RNG | C++ | FChopRngSystem | Original RNG/counter model after runtime/code proof; unresolved strict behavior fails closed. |
| UE-DATA-VALIDATOR | C++ | UChopAssetValidator | Native Unreal Data Validation hooks for PrimaryDataAssets and forbidden research references. |

## 15. Core data contracts
### 15.1 Stage DataAsset
Must store `StageId`, evidence/capture revision, logical bounds, eight page payloads or verified composed data, page selectors, row-scroll model, Y scroll, palette checkpoints/events, spawns/triggers, hostage/base zones, dynamic tile events, completion rule ID and golden checkpoint IDs.

### 15.2 Archetype / Animation / Score / Audio DataAssets
Every row/value carries source evidence IDs. Required strict values cannot remain secondary-only or unverified. Animation aliases reference runtime-verified indexed sprite frames, not heuristic candidate filenames. Score/audio tables are event driven and presentation cannot mutate simulation.

### 15.3 Replay
Replay header records build/data-manifest hash, stage/config, verified simulation frequency, RNG policy/seed and input sampling policy. Body stores canonical frame inputs plus checksums/debug hashes. A mismatch reports the first divergent frame/system/entity.

## 16. End-to-end workflows
### WFL-BOOT-001 - Boot
**Steps:** Start executable -> deterministic config -> load title/attract state.  
**Systems:** UE-GM;UE-SIM-WORLD;UE-AUDIO;UE-HUD  
**Success:** Title/attract reaches stable state with no unresolved production assets.  
**Failure:** Crash, nondeterministic checksum, missing asset ID.  
**Acceptance test:** `TST-FLOW-BOOT`

### WFL-INPUT-001 - Input Frame
**Steps:** Sample Enhanced Input -> quantize 8-way/two buttons -> FChopInputFrame -> append replay.  
**Systems:** UE-PC;UE-INPUT-STATE;UE-REPLAY  
**Success:** Same device action sequence produces identical canonical frame bits.  
**Failure:** Analog noise/frame-order changes sim input.  
**Acceptance test:** `TST-INP-CANON`

### WFL-STAGE-LOAD-001 - Stage Load
**Steps:** Resolve UChopStageData -> tile pages/world/spawns/palette -> initialize deterministic entities.  
**Systems:** UE-STAGE-CTRL;UE-STAGE-SIM;UE-STAGE-RENDER;UE-PALETTE  
**Success:** State checksum and reference screenshot match approved capture.  
**Failure:** Missing/ambiguous tile or palette state.  
**Acceptance test:** `TST-STAGE-LOAD`

### WFL-HELI-001 - Helicopter Step
**Steps:** Read canonical input -> state transition -> acceleration/velocity -> fixed-point integration -> collision -> animation state.  
**Systems:** UE-HELI-SIM;UE-COLLISION;UE-DATA-ANIM  
**Success:** Frame-by-frame position/state within verified tolerance.  
**Failure:** Engine physics/DeltaSeconds changes outcome.  
**Acceptance test:** `TST-HELI-TRACE`

### WFL-WEAPON-001 - Primary Fire
**Steps:** Button edge/hold -> cadence gate -> projectile spawn -> deterministic movement/collision -> score/damage event.  
**Systems:** UE-WEAPON-SYS;UE-PROJECTILE-SYS;UE-COLLISION;UE-SCORE  
**Success:** Projectile frame/timing and result match capture.  
**Failure:** Different rate/trajectory/event order.  
**Acceptance test:** `TST-WPN-PRIMARY`

### WFL-WEAPON-002 - Secondary/Bomb
**Steps:** Second button -> verified bomb/secondary behavior -> deterministic trajectory/collision.  
**Systems:** UE-WEAPON-SYS;UE-PROJECTILE-SYS;UE-COLLISION  
**Success:** Button semantics and resulting projectile match runtime evidence.  
**Failure:** Assumed button function shipped without evidence.  
**Acceptance test:** `TST-WPN-SECONDARY`

### WFL-HOSTAGE-001 - Hostage Release
**Steps:** Compound/event trigger -> captive hostages become released/running entities.  
**Systems:** UE-HOSTAGE-SYS;UE-STAGE-SIM  
**Success:** Count/state/timing match capture.  
**Failure:** Spawn count or release timing differs.  
**Acceptance test:** `TST-HOST-RELEASE`

### WFL-HOSTAGE-002 - Hostage Board
**Steps:** Eligible landed helicopter + nearby hostage -> approach/board -> aboard count <= verified capacity.  
**Systems:** UE-HOSTAGE-SYS;UE-RESCUE;UE-HELI-SIM  
**Success:** Boarding order/capacity/timing match capture.  
**Failure:** Boards while invalid, exceeds capacity, loses deterministic order.  
**Acceptance test:** `TST-HOST-BOARD`

### WFL-HOSTAGE-003 - Hostage Deliver
**Steps:** Return zone + landing -> unload sequence -> rescued count/score/fuel events.  
**Systems:** UE-HOSTAGE-SYS;UE-RESCUE;UE-SCORE;UE-FUEL  
**Success:** Unload order and deltas exactly match approved trace.  
**Failure:** Score/fuel applied twice or in wrong frame.  
**Acceptance test:** `TST-HOST-DELIVER`

### WFL-HOSTAGE-004 - Hostage Death
**Steps:** Damage/collision -> hostage dead -> totals update -> completion/scoring consequences.  
**Systems:** UE-HOSTAGE-SYS;UE-RESCUE;UE-SCORE  
**Success:** State changes once and totals remain consistent.  
**Failure:** Negative counts/double-death/unsupported bonus formula.  
**Acceptance test:** `TST-HOST-DEATH`

### WFL-FUEL-001 - Fuel
**Steps:** Per-frame verified drain -> delivery refill/events -> warning -> fuel-out consequence.  
**Systems:** UE-FUEL;UE-HUD;UE-AUDIO  
**Success:** Threshold frames and fuel-out match capture.  
**Failure:** Frame-rate dependent drain.  
**Acceptance test:** `TST-FUEL-TRACE`

### WFL-ENEMY-001 - Enemy Spawn/AI
**Steps:** Stage triggers -> spawn deterministic archetype -> state machine update -> weapon/movement events.  
**Systems:** UE-STAGE-SIM;UE-AI-SYS;UE-WEAPON-SYS  
**Success:** Spawn/state transitions match verified trace for each archetype.  
**Failure:** Behavior Tree randomness or unverified tuning.  
**Acceptance test:** `TST-AI-ARCHETYPES`

### WFL-COLL-001 - Collision
**Steps:** Build ordered collision candidates -> pixel-mask/verified shape test -> emit collision event IDs -> process once.  
**Systems:** UE-COLLISION;UE-PIXELMASK  
**Success:** Reference collision scenarios match original flags/consequences.  
**Failure:** Chaos order/substep changes results.  
**Acceptance test:** `TST-COLL-MATRIX`

### WFL-SCORE-001 - Scoring
**Steps:** Gameplay event ID -> UChopScoreTable lookup -> score delta -> bonus-life check -> UI event.  
**Systems:** UE-SCORE;UE-DATA-SCORE;UE-HUD  
**Success:** Every verified event delta matches runtime.  
**Failure:** Guide-derived number treated as canonical before trace.  
**Acceptance test:** `TST-SCORE-TABLE`

### WFL-STAGE-END-001 - Stage Complete
**Steps:** Rescue/dead/remaining conditions -> completion gate -> bonus/tally -> next stage loop.  
**Systems:** UE-STAGE-SIM;UE-RESCUE;UE-SCORE  
**Success:** 20/21 boundary and transition match runtime capture.  
**Failure:** Threshold assumption wrong or transition early.  
**Acceptance test:** `TST-STAGE-COMPLETE`

### WFL-DEATH-001 - Player Death
**Steps:** Damage condition -> death animation/events -> life decrement -> restart/game-over.  
**Systems:** UE-HELI-SIM;UE-GM;UE-AUDIO;UE-HUD  
**Success:** Life/death/restart timing matches trace.  
**Failure:** Multiple decrements or input accepted during lockout.  
**Acceptance test:** `TST-PLAYER-DEATH`

### WFL-GAMEOVER-001 - Game Over
**Steps:** Lives exhausted -> game-over UI -> high-score eligibility -> attract/title.  
**Systems:** UE-GM;UE-HUD;UE-SCORE  
**Success:** State order and input gates deterministic.  
**Failure:** Stuck state or skipped score entry.  
**Acceptance test:** `TST-GAMEOVER`

### WFL-HISCORE-001 - High Score
**Steps:** Qualified score -> name-entry/rank update -> session table.  
**Systems:** UE-SCORE;UE-HUD  
**Success:** Ordering/tie behavior match verified original or explicitly modernized mode.  
**Failure:** Unspecified persistence silently changes arcade behavior.  
**Acceptance test:** `TST-HISCORE`

### WFL-AUDIO-001 - Audio Event
**Steps:** Simulation emits canonical audio event -> UChopAudioEventTable -> playback with frame timestamp.  
**Systems:** UE-AUDIO;UE-DATA-AUDIO  
**Success:** Event timing/order matches command trace; audio cannot mutate simulation.  
**Failure:** Audio callback changes gameplay timing.  
**Acceptance test:** `TST-AUDIO-EVENTS`

### WFL-REPLAY-001 - Replay
**Steps:** Record config + stage + frame inputs + checksum -> playback without devices -> compare periodic checksum.  
**Systems:** UE-REPLAY;UE-SIM-WORLD  
**Success:** Bit-identical checksums for identical build/data.  
**Failure:** Any divergence fails CI with first divergent frame.  
**Acceptance test:** `TST-REPLAY-DETERMINISM`

## 17. Test strategy and strict gates
v1.3 retains **40 engineering tests**. Low-level deterministic math/data tests should prefer the UE LLT path; engine/content/screenshot/functional tests use Automation and Data Validation. [SRC-006][SRC-007][SRC-008]

- **TST-ROM-AUDIT [Build] - Source:** Compute CRC/SHA and compare reference manifest **Pass:** All gameplay/graphics/audio ROMs match; known MCU mismatch and missing PLD explicitly reported, never hidden.
- **TST-TILE-DECODE [Unit] - Assets:** Decode all 4096 tiles with plane0=bit2, plane1=bit1, plane2=bit0 **Pass:** Known hashes stable; 4096 8x8 uint8 tiles; indices 0..7 only.
- **TST-MIXER-256 [Unit] - Renderer:** Enumerate all 256 inputs **Pass:** Every input has deterministic 4-bit output/source/collision interpretation.
- **TST-ASSET-ID [Build] - Content:** Validate every output PNG and production DataAsset **Pass:** No duplicate IDs; every file ref resolves; every production sprite semantic reference is runtime-verified.
- **TST-INP-CANON [Unit] - Input:** Quantize thousands of boundary inputs **Pass:** Canonical direction/button bitset is platform-independent and deterministic.
- **TST-SIM-DETERMINISM [Unit] - Simulation:** Run same replay 100 times **Pass:** Frame checksums identical for all runs.
- **TST-FLOW-BOOT [Functional] - Flow:** Boot through title/attract **Pass:** No crash; expected state IDs/timing; screenshots compare to approved reference once captured.
- **TST-STAGE-LOAD [Functional] - Stage:** Load each stage in strict mode **Pass:** Entity counts/page selection/palette and reference screenshot match.
- **TST-HELI-TRACE [Functional] - Helicopter:** Replay same inputs **Pass:** Position/velocity/facing/landing state match each frame within approved integer mapping.
- **TST-WPN-PRIMARY [Functional] - Weapons:** Replay fire sequence **Pass:** Spawn frame, cadence, path, collision and damage match.
- **TST-WPN-SECONDARY [Functional] - Weapons:** Replay sequence **Pass:** Semantics/trajectory/collision match; test cannot be enabled as canonical before capture exists.
- **TST-HOST-RELEASE [Functional] - Hostage:** Trigger release **Pass:** Number, spawn positions and state transitions match.
- **TST-HOST-BOARD [Functional] - Hostage:** Board up to and beyond capacity **Pass:** Timing/order/capacity match, no 9th board if verified capacity=8.
- **TST-HOST-DELIVER [Functional] - Hostage:** Unload group **Pass:** Rescued count, score, fuel and audio deltas match exact frames.
- **TST-HOST-DEATH [Functional] - Hostage:** Kill hostage by each supported cause **Pass:** Exactly one death event; totals and score consequences match.
- **TST-FUEL-TRACE [Functional] - Fuel:** Idle/fly/rescue until warning/out **Pass:** Drain, refill, warning and fuel-out frames match.
- **TST-AI-ARCHETYPES [Functional] - AI:** Replay scene **Pass:** Spawn/state/action path matches trace; no RNG without recorded deterministic seed/rule.
- **TST-COLL-MATRIX [Unit+Functional] - Collision:** Exercise sprite-sprite and sprite-environment edge cases **Pass:** Collision events match approved matrix including transparent pixels and priority where relevant.
- **TST-SCORE-TABLE [Unit+Functional] - Scoring:** Emit every score event **Pass:** Exact deltas/bonus thresholds; unresolved values cause validation failure in strict mode.
- **TST-STAGE-COMPLETE [Functional] - Stage:** Attempt completion at boundary values **Pass:** Exact original threshold and transition behavior match capture.
- **TST-PLAYER-DEATH [Functional] - Flow:** Cause each death condition **Pass:** Animation/event/life decrement/restart timing match.
- **TST-GAMEOVER [Functional] - Flow:** Die then interact **Pass:** Game-over/high-score/title transition matches approved flow.
- **TST-HISCORE [Functional] - UI:** End session and enter initials **Pass:** Qualification/order/tie rules match verified original or explicitly documented modern mode.
- **TST-AUDIO-EVENTS [Functional] - Audio:** Replay event stream **Pass:** Canonical audio event IDs emitted on same frames; output audio asset may differ only if modern mode explicitly selected.
- **TST-REPLAY-DETERMINISM [CI] - Replay:** Run headless automation **Pass:** No checksum divergence; report first divergent frame/entity/system.
- **TST-SCREENSHOT-STRICT [Screenshot] - Rendering:** Render strict-mode checkpoints **Pass:** Pixel-difference result within explicit mask/tolerance; zero unexplained differences.
- **TST-CONTENT-STRESS [Content Stress] - Packaging:** Load all assets/maps and validate IDs **Pass:** No load errors, missing references, or unresolved strict production references.
- **TST-ID-COVERAGE [Build] - Evidence IDs:** Enumerate primary identity columns and compare with master registry **Pass:** Every primary ID appears exactly once in master registry; all registered locations resolve.
- **TST-RELATION-FK [Build] - Traceability:** Validate every from_id/to_id against master registry **Pass:** Zero dangling relation endpoints.
- **TST-CODE-GRAPH-FK [Unit] - Static code map:** Validate routine/block/xref instruction references **Pass:** Zero dangling routine entries, block starts, same-region direct targets, or source instruction IDs.
- **TST-CODE-TOUCHPOINT [Unit] - Static code map:** Check explicit memory/IO touchpoint classification by CPU address space **Pass:** Immediate constants are never treated as memory; SOUND routines cannot map to MAIN RAM categories.
- **TST-CAPTURE-SCHEMA [Build] - Runtime evidence:** Validate v3 frame/event contracts and v2 profile contract against the public-Lua capability boundary. **Pass:** Exact attotime, mapped video-window snapshots, raw inputs/state/framebuffer evidence, pass-through collision taps, globally ordered sub-frame events and loss accounting are present; CPU-local cycles are optional unless sourced.
- **TST-PALETTE-ADDRESS [Unit] - Renderer:** Exhaustively compute logical pen/palette addresses for valid tile and sprite combinations **Pass:** Address/source selection matches independent System 2 oracle for every enumerated case.
- **TST-RGB-PROM-256 [Screenshot+Unit] - Renderer:** Render all 256 physical PROM colors through strict pipeline **Pass:** Framebuffer RGB for all 256 values matches palette PROM table exactly after approved readback encoding.
- **TST-INDEXED-RENDER [Screenshot+Unit] - Renderer:** Render deterministic indexed tile/sprite fixtures **Pass:** Output derives from indices+palette RAM; changing diagnostic PNG RGB cannot change strict framebuffer.
- **TST-RNG-TRACE [Functional] - RNG:** Replay seed/update vectors **Pass:** RNG state/output sequence matches capture; unresolved RNG blocks strict AI behavior.
- **TST-INPUT-SAMPLING [Functional] - Input:** Replay edge/hold changes at measured sampling phases **Pass:** Canonical simulation input reproduces original read semantics and event frames.
- **TST-COLLISION-ORDER [Functional] - Collision:** Reproduce sprite-slot/tie cases **Pass:** Collision event/result ordering matches original slots/read order, not arbitrary EntityId ordering.
- **TST-BUILD-REPRO [Build] - Reproducibility:** Reproduce the current release snapshot with tools/rebuild_chopper.py into fresh directories; compare deterministic payload hashes **Pass:** Deterministic files have identical SHA-256; nondeterministic documents are normalized or explicitly excluded with reason.
- **TST-EVIDENCE-DB-FK [Build] - Evidence DB:** Run PRAGMA foreign_key_check and ID/relation parity queries **Pass:** Zero FK errors; id and relation row counts match CSV truth.

### 17.1 Golden-reference policy
A golden reference records MAME version/commit, ROM-manifest hash, capture-tool version, DIP settings, input stream, frame/cycle range, memory dumps/event logs and framebuffer hash. A failing test is never fixed by silently re-baselining.

## 18. Implementation plan for bounded AI coding workers
A worker executes only a task whose dependency and evidence gates are satisfied. Missing constants produce a referenced `UNK-*` blocker, not a guess. The master controller should query `relations.csv` / `audit/ChopperGameEvidence.db` for what blocks each task and which test closes it.

### IMP-000 - Phase 0: Reproducible evidence-package build
**Depends on:** None  
**Inputs:** choplift.zip + pinned tools  
**Output:** `tools/rebuild_chopper.py` + `tools/validate_chopper.py`  
**Procedure:** Validate and reproduce the current release snapshot with no `/mnt/data` hard-coding. Treat historical deep re-derivation as a separate, explicitly executed workflow rather than silently equating it with snapshot copying.  
**Gate:** TST-BUILD-REPRO;TST-ID-COVERAGE;TST-EVIDENCE-DB-FK

### IMP-001 - Phase 1: Create UE 5.8 C++ project
**Depends on:** None  
**Inputs:** UE 5.8; Bible  
**Output:** Project + source modules  
**Procedure:** Create C++ project; enable Paper2D and Enhanced Input; add ChopperGameCore, ChopperGameRuntime, ChopperGameTests; commit clean baseline.  
**Gate:** Build Development Editor Win64 with zero errors.

### IMP-002 - Phase 1: Add deterministic core types
**Depends on:** IMP-001  
**Inputs:** UE-SIM-* contracts  
**Output:** FChopFixed/FChopEntityId/FChopInputFrame/FChopSimWorld  
**Procedure:** No UObject in core math/state; define serialization/checksum; establish fixed update order.  
**Gate:** Unit tests compile and deterministic type tests pass.

### IMP-003 - Phase 1: Add CI automation shell
**Depends on:** IMP-001  
**Inputs:** TST-* registry  
**Output:** Command-line automation target/report folder  
**Procedure:** Enable required test plugins; add script using Automation RunTest ChopperGame; fail nonzero on test failures.  
**Gate:** Empty/smoke suite runs headlessly and emits report.

### IMP-004 - Phase 1: Low-level C++ test target
**Depends on:** IMP-001  
**Inputs:** ChopperGameCore contracts  
**Output:** UE Low-Level Tests/Catch2 target  
**Procedure:** Use UE low-level tests for fixed-point math, deterministic state, palette/mixer and pure core algorithms; reserve game Automation tests for engine integration.  
**Gate:** Low-level suite runs headlessly and reports through CI.

### IMP-005 - Phase 1: Evidence relation/database validator
**Depends on:** IMP-000  
**Inputs:** id_registry.csv;relations.csv;all registries  
**Output:** SQLite evidence DB + validator  
**Procedure:** Generate `audit/ChopperGameEvidence.db`; enforce relation endpoints and code graph refs; expose controller queries for blockers/coverage.  
**Gate:** TST-RELATION-FK;TST-CODE-GRAPH-FK;TST-EVIDENCE-DB-FK

### IMP-010 - Phase 2: Implement manifest importer
**Depends on:** IMP-001  
**Inputs:** image_import_mapping.csv  
**Output:** Editor commandlet/importer  
**Procedure:** Parse CSV; verify hash/path; import diagnostic PNGs under Research only. Strict tile rendering must consume tile_pixels_uint8.npy/indexed data, never PNG RGB.  
**Gate:** TST-ASSET-ID + TST-TILE-DECODE + TST-INDEXED-RENDER pass.

### IMP-011 - Phase 2: Implement strict indexed tile asset
**Depends on:** IMP-010  
**Inputs:** tile_pixels_uint8.npy/tile manifest  
**Output:** UChopIndexedTileLibrary or generated binary data  
**Procedure:** Preserve 0..7 indices separately from PNG; expose 8x8 masks and tile code lookup.  
**Gate:** 4096 tile codes round-trip byte-exact.

### IMP-012 - Phase 2: Implement palette/mixer data
**Depends on:** IMP-010  
**Inputs:** palette CSV + mixer truth table  
**Output:** FChopPaletteSystem/FChopLayerMixer data  
**Procedure:** Import all 256 physical colors and 256 mixer entries; no guessed runtime palette RAM.  
**Gate:** TST-MIXER-256 passes.

### IMP-013 - Phase 2: Strict indexed renderer data path
**Depends on:** IMP-011;IMP-012  
**Inputs:** tile index library; runtime palette/mixer contracts  
**Output:** Indexed tile/sprite render libraries and materials  
**Procedure:** Build non-sRGB integer index data path; palette/mixer LUT resolution; diagnostic RGB PNGs cannot enter strict framebuffer.  
**Gate:** TST-PALETTE-ADDRESS;TST-RGB-PROM-256;TST-INDEXED-RENDER

### IMP-020 - Phase 3: Fixed-step simulation loop
**Depends on:** IMP-002  
**Inputs:** UE-SIM-CLOCK/WORLD  
**Output:** Central fixed-step driver  
**Procedure:** Use engine frame only to accumulate time; execute zero/N fixed sim steps; systems in fixed order; render reads latest states.  
**Gate:** TST-SIM-DETERMINISM passes under variable render frame rates.

### IMP-021 - Phase 3: Canonical input capture/replay
**Depends on:** IMP-020  
**Inputs:** Enhanced Input + UE-INPUT-STATE  
**Output:** Input mapper + replay writer/reader  
**Procedure:** Map 8-way + two buttons/start; quantize before sim; write frame records; playback bypasses hardware input.  
**Gate:** TST-INP-CANON and TST-REPLAY-DETERMINISM base pass.

### IMP-022 - Phase 3: Original RNG and input sampling bridge
**Depends on:** IMP-021  
**Inputs:** UNK-RNG-001;UNK-INPUT-SAMPLING-001 runtime traces  
**Output:** FChopRngSystem + sampled-input policy  
**Procedure:** Implement only after trace proves seed/update/input-read timing; record rules in replay header.  
**Gate:** TST-RNG-TRACE;TST-INPUT-SAMPLING

### IMP-030 - Phase 4: Stage renderer foundation
**Depends on:** IMP-011;IMP-012  
**Inputs:** Tile library + UChopStageData  
**Output:** Owned page/tile renderer + ortho camera  
**Procedure:** Render fixed/background layers with integer alignment; support four selected pages and scroll; add strict logical coordinate mapping.  
**Gate:** Can render synthetic page fixtures pixel-perfectly.

### IMP-031 - Phase 4: Runtime-capture import format
**Depends on:** IMP-030  
**Inputs:** Bible runtime schemas  
**Output:** JSON/CSV capture importer  
**Procedure:** Define captured VRAM/palette/page/scroll/sprite descriptor schema; importer validates source version/frame/checksum.  
**Gate:** Malformed or incomplete captures fail closed.

### IMP-032 - Phase 4: Instrumented runtime capture tooling
**Depends on:** IMP-031  
**Inputs:** CAP-MAME-FRAME-001 v2;CAP-MAME-EVENT-001  
**Output:** Capture exporter/import fixtures  
**Procedure:** Capture full raw RAM, eight pages, row-scroll[32], CPU/cycle/beam state, collision RAM and sub-frame event stream with version/ROM provenance.  
**Gate:** TST-CAPTURE-SCHEMA passes and one complete fixture round-trips.

### IMP-040 - Phase 5: Helicopter simulation
**Depends on:** IMP-020;IMP-021  
**Inputs:** Verified traces required for final constants  
**Output:** FChopHelicopterSystem + actor presentation  
**Procedure:** Implement states first; parameters remain DataAsset values tagged UNVERIFIED until traces; do not use Chaos movement.  
**Gate:** Synthetic tests pass; strict gate stays blocked until TST-HELI-TRACE has real reference.

### IMP-041 - Phase 5: Weapons/projectiles
**Depends on:** IMP-040  
**Inputs:** Verified button/trajectory traces  
**Output:** Weapon/projectile systems  
**Procedure:** Two canonical action bits; data-driven fire modes; deterministic pool/order/collision query.  
**Gate:** Weapon tests pass when reference traces supplied.

### IMP-050 - Phase 6: Collision engine
**Depends on:** IMP-011;IMP-020  
**Inputs:** Canonical masks + runtime behavior  
**Output:** FChopCollisionSystem  
**Procedure:** Implement deterministic broadphase; exact indexed-pixel overlap option; preserve evidence-driven sprite-slot/contact ordering. Do not choose EntityId order as arcade truth before UNK-COLLISION-ORDER-001 closes.  
**Gate:** TST-COLL-MATRIX passes; TST-COLLISION-ORDER remains blocking until original ordering is captured.

### IMP-051 - Phase 6: Original collision ordering model
**Depends on:** IMP-050  
**Inputs:** UNK-COLLISION-ORDER-001 trace corpus  
**Output:** Evidence-driven collision ordering/tie policy  
**Procedure:** Replace placeholder ordering with sprite-slot/read-order semantics proven from simultaneous-contact captures.  
**Gate:** TST-COLLISION-ORDER passes.

### IMP-060 - Phase 7: Hostage/rescue system
**Depends on:** IMP-050  
**Inputs:** Verified traces  
**Output:** Hostage/rescue systems  
**Procedure:** Implement explicit hostage state enum and transitions; capacity/delivery/rescued/dead totals; all state changes event logged.  
**Gate:** Release/board/deliver/death tests pass.

### IMP-061 - Phase 7: Fuel/scoring/lives
**Depends on:** IMP-060  
**Inputs:** Verified deltas/tables  
**Output:** Fuel/score/life systems  
**Procedure:** Data-driven tables with evidence field; strict mode refuses UNVERIFIED score rules marked required.  
**Gate:** TST-FUEL-TRACE/TST-SCORE-TABLE pass.

### IMP-070 - Phase 8: Enemy archetype framework
**Depends on:** IMP-050  
**Inputs:** Runtime semantic sprite+AI traces  
**Output:** Enemy AI/projectile/spawn systems  
**Procedure:** One deterministic state machine per archetype ID; no generic tuning beyond captured behavior; presentation animation mapped separately.  **Gate:** One test vector per state transition and archetype.

### IMP-071 - Phase 8: Populate all enemy archetypes
**Depends on:** IMP-070  
**Inputs:** Completed UNK-AI-SEMANTICS  
**Output:** Archetype DataAssets + tests  
**Procedure:** For each runtime-observed sprite/entity: assign semantic ID, state diagram, parameters, projectile rules, collision masks, score event.  
**Gate:** No enemy ID remains unresolved for strict-mode stages.

### IMP-080 - Phase 9: Populate four stages
**Depends on:** IMP-031;IMP-071  
**Inputs:** Completed runtime stage captures  
**Output:** Four UChopStageData assets  
**Procedure:** Import tile/page/palette/spawn/trigger data; map checkpoints; add reference screenshots.  
**Gate:** TST-STAGE-LOAD and screenshot tests pass for all stages.

### IMP-090 - Phase 10: Audio event mapping
**Depends on:** IMP-021  
**Inputs:** Sound latch/PSG traces  
**Output:** UChopAudioEventTable + audio assets  
**Procedure:** Map every command/event; decide strict recreation vs modern remaster assets while preserving sim event frames.  
**Gate:** TST-AUDIO-EVENTS passes; no sim dependency on audio playback.

### IMP-100 - Phase 11: HUD/front-end/high score
**Depends on:** IMP-061;IMP-080  
**Inputs:** Verified UI flow/string maps  
**Output:** Widgets + flow states  
**Procedure:** Implement score/lives/fuel/rescue HUD; title/start/game-over/high-score; attract configuration.  
**Gate:** Flow/screenshot tests pass at reference checkpoints.

### IMP-110 - Phase 12: 2-player/configuration
**Depends on:** IMP-100  
**Inputs:** DIP/input behavior traces  
**Output:** Config DataAsset + 2P flow  
**Procedure:** Implement lives/bonus/difficulty/demo-sound settings; alternate/cocktail behavior only after capture.  
**Gate:** All config matrix tests pass.

### IMP-120 - Phase 13: Golden fidelity corpus
**Depends on:** IMP-080;IMP-090;IMP-110  
**Inputs:** Instrumented MAME outputs  
**Output:** Golden replays/traces/screenshots  
**Procedure:** Capture every stage, enemy, rescue edge, death, score event, audio event, attract/2P; version each capture.  
**Gate:** Every strict behavior requirement has at least one positive and negative test vector.

### IMP-121 - Phase 13: Close unknowns
**Depends on:** IMP-120  
**Inputs:** known_unknowns.csv  
**Output:** All HIGH unknowns resolved/waived with reason  
**Procedure:** Update evidence from inferred to runtime-observed; link code/image IDs; prohibit silent assumptions.  
**Gate:** Strict release gate contains zero open HIGH unknowns.

### IMP-130 - Phase 14: Packaging/content validation
**Depends on:** IMP-121  
**Inputs:** All systems/tests  
**Output:** Shipping build  
**Procedure:** Run ID validator, content stress, automation, screenshots, replay corpus, packaged smoke test.  
**Gate:** All tests pass; no Research-only asset referenced by Strict production content.

### IMP-131 - Phase 14: Final reproducibility and evidence freeze
**Depends on:** IMP-130;IMP-000  
**Inputs:** Source archive + final manifests  
**Output:** Rebuilt/frozen current release snapshot + evidence DB + separate deep-rederivation record when executed  
**Procedure:** Rebuild from source, validate hashes/FKs/relations/docs, compare reproducible outputs and freeze manifest.  
**Gate:** TST-BUILD-REPRO and all build-level evidence tests pass.

<!-- CG:RUNTIME:START -->
## 19. Runtime capture plan v3 — current contract

`CAP-MAME-FRAME-001` version **3** is the current per-frame contract; `CAP-MAME-EVENT-001` version **3** is the globally ordered sub-frame event contract; `CG-SCHEMA-CAPTURE-PROFILE-001` version **2** binds source/emulator/collector/config/input identity. The public MAME Lua harness exposes **20 channels, 14 watchpoints and 14 gameplay-aligned capture plans**. The harness has synthetic tooling tests, but **zero original-runtime captures have been executed**.

### 19.1 Required frame evidence
- Capture/profile/collector identity, exact MAME version and binary hash, source-manifest/audit hashes, DIP profile, input recording, frame identity and loss counters.
- Exact emulated time as separate integer seconds and attoseconds. Floating-point time is not canonical evidence.
- Main/sound CPU state entries that MAME actually exposes. A device-local cycle count is optional and must not be invented when the public API does not expose it.
- Raw main work RAM, sprite RAM, palette RAM, sound RAM and the **currently mapped `E000–EFFF` video window**.
- Raw `P1`, `P2`, `SYSTEM`, `SWA` and `SWB` input values; current bank entry; raw visible screen pixels; optional presentation PNG.
- The public-Lua frame contract does **not** claim simultaneous direct access to every hidden video page.

### 19.2 Required event evidence
Record guest-observed bank/control/video/palette/sprite/work-RAM changes, main I/O activity, sound-RAM/latch/PSG activity, and collision-window accesses with `(master_seconds, master_attoseconds, capture_sequence)` ordering plus device identity. `capture_sequence` breaks ties at identical emulated time. Any dropped events disqualify the affected evidence from closing strict timing/order claims.

Strict public-Lua capture **does not poll** the device-backed collision windows `F000–FFFF`. It records existing guest reads/writes using pass-through taps. Any collision snapshot obtained by a different method requires separate proof that the method is non-invasive.

### 19.3 Closure procedure
**Original capture → bundle validation → repeated candidate-only discovery analysis → external review → disjoint held-out analysis → 13-gate proof → evidence promotion → package regeneration → target comparison.** Synthetic fixtures prove tooling only and can never promote gameplay truth.

**Sprites:** capture descriptor-bearing state/events → independently correlate pixels/state → repeat → bind semantic alias.  
**Stages:** capture the mapped video window plus page/control/scroll/palette history throughout traversal → reconstruct the necessary page history → compare framebuffer checkpoints.  
**Code:** correlate PC/bank/state evidence available from the collector or an explicitly instrumented tier; static `FUNC-*` reachability alone never becomes a gameplay name.  
**AI/timing/RNG/input/collision/audio:** run controlled paired/repeated traces and promote only rules that reproduce held-out evidence.
<!-- CG:RUNTIME:END -->


## 20. Open evidence gaps and progress model

<!-- CG:UNKNOWNS:START -->
The current registry contains **131 open unknown records**: **52 HIGH**, **13 MEDIUM**, and **66 UNRANKED**. There are **13 top-level families**. The 66 UNRANKED records are primarily static code-semantic child hypotheses; an unranked child is not evidence that the issue is low importance.

| Top-level ID | Priority | Child records | Gap |
| --- | --- | ---: | --- |
| `UNK-AI-SEMANTICS` | HIGH | 6 | Name and document every AI state, transition, parameter and spawn rule. |
| `UNK-ATTRACT-2P` | MEDIUM | 2 | Document attract sequence and exact 2-player/cocktail turn behavior. |
| `UNK-AUDIO-EVENTS` | MEDIUM | 4 | Map every sound-latch command to PSG/speech event and timing. |
| `UNK-CODE-SEMANTICS` | HIGH | 66 | Resolve runtime semantics/calling contracts for statically identified entry/function candidates. |
| `UNK-COLLISION-GAME-USE` | HIGH | 5 | Determine which hardware collision bits drive which gameplay consequences. |
| `UNK-INPUT-SAMPLING-001` | HIGH | 0 | Determine original input read frequency/phase and whether multiple reads per frame matter. |
| `UNK-MCU-CANONICAL` | HIGH | 0 | Supplied 8751 dump CRC differs from current MAME canonical. |
| `UNK-PALETTE-RUNTIME` | HIGH | 4 | Resolve exact logical palette entry assignments for every scene/state. |
| `UNK-RNG-001` | HIGH | 0 | Determine whether gameplay uses RNG/counter-derived pseudo-randomness, seed state, and update formula. |
| `UNK-SCORING-EXACT` | MEDIUM | 4 | Verify all arcade scoring values and bonus conditions from code/runtime rather than secondary guides. |
| `UNK-SPR-SEMANTICS` | HIGH | 5 | Map every runtime sprite descriptor to helicopter/enemy/hostage/vehicle/effect semantic IDs. |
| `UNK-STAGE-TILEMAPS` | HIGH | 16 | Recover all four arcade stage layouts, page selections, scroll states, priorities, palette RAM states. |
| `UNK-TIMING-PHYSICS` | HIGH | 6 | Measure helicopter acceleration, braking, projectile velocity, fuel drain, enemy timing and stage pacing. |

`UNK-COLLISION-ORDER-001` remains a HIGH child of `UNK-COLLISION-GAME-USE`; it is not a separate top-level family. All status and parentage claims come from `audit/known_unknowns.csv`.
<!-- CG:UNKNOWNS:END -->


## 21. Traceability and evidence database

`audit/relations.csv` and `audit/id_registry.csv` are the canonical graph CSVs; their **current counts are generated in A14**. `audit/ChopperGameEvidence.db` mirrors the node/relation graph with enforced SQLite foreign keys and typed evidence tables. The controller can query requirement → test, unknown → blocking task, task → gate, stage → unresolved evidence, and raw object → diagnostic image. Build gates `TST-ID-COVERAGE`, `TST-RELATION-FK`, `TST-CODE-GRAPH-FK` and `TST-EVIDENCE-DB-FK` prevent dangling references and database drift.

## 22. Reproducibility contract

The supported current entrypoints are `tools/validate_chopper.py` and `tools/rebuild_chopper.py`. The rebuild command is deliberately a **current-release snapshot reproducer**: it copies the current tree to a fresh destination and validates it. It proves that the shipped release can be reproduced byte-for-byte for deterministic payloads from that release tree; it does **not** prove a fresh derivation from `choplift.zip` alone.

Historical extraction/analyzer/build tooling remains packaged for study and deeper re-derivation. A future claim of ROM-to-package reproducibility requires executing that deeper path in a clean environment, recording tool versions/inputs, and comparing derived outputs. `TST-BUILD-REPRO` therefore tests current snapshot reproducibility; deep derivation is a separate evidence obligation and must never be inferred from the snapshot test.


## 23. Definition of arcade-fidelity complete
- Every strict production visual has canonical indexed data and runtime-verified semantic identity where semantics matter.
- All four stages have verified page/tile/scroll/palette/spawn/dynamic-event data and framebuffer checkpoints.
- Every AI/object archetype has verified state transitions, parameters, projectiles, collision behavior, score event and animation aliases.
- Helicopter physics, weapons, fuel, hostage/rescue, scoring/lives/difficulty, RNG, input sampling and collision ordering pass frame/cycle traces.
- Audio command/event timing, attract/2P/game-over/high-score flows are captured and tested.
- Golden replay corpus has zero unexplained deterministic divergence; strict screenshots have zero unexplained differences after the approved transform.
- No HIGH unknown is open; no Research-only asset is referenced by strict production content; all build/evidence FKs and reproducibility gates pass.

## 24. Risks and safeguards
- **Static code/data ambiguity:** raw-byte IDs are truth; decoded instructions are interpretations. Runtime execution trace precedes semantic promotion.
- **Bank ambiguity:** every runtime trace records active bank.
- **Graphics inference:** static sprite splits remain research-only until live descriptor proof.
- **Engine nondeterminism:** fixed simulation, LLTs, replay checksums and evidence-driven collision ordering.
- **Color/render drift:** indexed strict renderer + explicit palette address formulas + RGB PROM framebuffer test.
- **Evidence drift:** relations/SQLite FKs and no silent golden re-baseline.

### 24.1 Intellectual property / release
This package is a technical study of user-supplied ROM data. Analysis/possession does not establish rights to distribute the original Choplifter name, copyrighted art, audio or game content. Obtain appropriate rights/legal review before public/commercial release or maintain a clean-room replacement-art/branding path.

## Part VIII - Code, math, constants, variables, tables, and what remains to be filled
This part exists because an address map is not the same thing as an explained program. v1.4 retains every statically identified entry as a `SUB-*` teaching contract but explicitly separates entry identity from the new `FUNC-*` CFG body hypothesis, gives every formula we can justify a `MATH-*` ID, separates constants/variables/tables into their own registries, and creates `FILL-*` records wherever the evidence is insufficient. **A blank is now an indexed engineering object, not an invitation to guess.**

Current expansion: **66 subroutine teaching records**, **66 explained entry snippets**, **54 math IDs (41 evidence-backed / 13 explicitly unresolved)**, **28 constants**, **26 variables**, **8 tables**, and **84 fill-required records**.

### 25.1 Code-snippet rule
Every code snippet introduced by this revision carries three separate explanations: **why the snippet is included**, **what it proves**, and **what it does not prove**. This prevents a teaching example from silently becoming a semantic claim. A snippet may demonstrate a ROM fact while the routine purpose remains unresolved.

### 25.2 Evidence-backed math registry
#### MATH-ENDIAN-001 - Little-endian 16-bit decode
**Why this math is here:** Needed because addresses/strides/tile words are stored as low byte then high byte.
**Evidence:** ROM/MAME-PROVEN | **Applies to:** General Z80 data decoding
```text
value = byte0 | (byte1 << 8)
```
**Inputs:** byte0,byte1: uint8  
**Output:** value: uint16  
**Worked example:** Bytes 34 12 -> 0x1234

#### MATH-TILE-PIXEL-001 - 3-plane tile pixel index
**Why this math is here:** Correct plane significance fixed the v1 extraction defect.
**Evidence:** ROM+MAME-PROVEN | **Applies to:** Tile graphics decode
```text
pixel3 = (plane0_bit << 2) | (plane1_bit << 1) | plane2_bit
```
**Inputs:** three 1-bit plane samples  
**Output:** pixel3: 0..7  
**Worked example:** 1,0,1 -> 5

#### MATH-TILE-WORD-001 - Tile word assembly
**Why this math is here:** Required before code/color/priority fields can be extracted.
**Evidence:** MAME-PROVEN | **Applies to:** Video RAM tile descriptor
```text
tiledata = byte0 | (byte1 << 8)
```
**Inputs:** two tilemap bytes  
**Output:** tiledata: uint16  
**Worked example:** 0x34,0x12 -> 0x1234

#### MATH-TILE-CODE-001 - Tile code extraction
**Why this math is here:** Maps runtime tile descriptor to the 4096 ROM tile objects.
**Evidence:** MAME-PROVEN | **Applies to:** Tile selection
```text
code = ((tiledata >> 4) & 0x800) | (tiledata & 0x7FF)
```
**Inputs:** tiledata  
**Output:** code: 0..4095  
**Worked example:** 0x1234 -> code derived by formula

#### MATH-TILE-COLOR-001 - Tile color extraction
**Why this math is here:** Separates the attribute byte encoded across the 16-bit tile word.
**Evidence:** MAME-PROVEN | **Applies to:** Tile palette/priority attribute
```text
color = (tiledata >> 5) & 0xFF
```
**Inputs:** tiledata  
**Output:** color: uint8  
**Worked example:** 0x1234 -> 0x91

#### MATH-TILE-PRIORITY-001 - Tile priority extraction
**Why this math is here:** Priority is an input to the mixer PROM, not merely a draw-order guess.
**Evidence:** MAME-PROVEN | **Applies to:** Mixer input
```text
priority = (color >> 6) & 0x03
```
**Inputs:** color  
**Output:** priority: 0..3  
**Worked example:** color 0x91 -> priority 2

#### MATH-TILE-PEN-001 - Tile logical pen
**Why this math is here:** Builds the 9-bit logical tile color before source-bank selection.
**Evidence:** MAME-PROVEN | **Applies to:** Palette addressing
```text
tile_pen9 = ((color & 0x3F) << 3) | pixel3
```
**Inputs:** color,pixel3  
**Output:** 9-bit pen  
**Worked example:** color6=0x11,pixel3=5 -> 0x08D

#### MATH-PAL-FG-ADDR-001 - Fixed-layer palette RAM address
**Why this math is here:** Encodes fixed-layer source into the 0x800-entry palette address.
**Evidence:** MAME-PROVEN | **Applies to:** Palette RAM
```text
index = 0x200 | tile_pen9
```
**Inputs:** tile_pen9  
**Output:** 0x200..0x3FF  
**Worked example:** tile_pen9 0x08D -> 0x28D

#### MATH-PAL-BG-ADDR-001 - Background palette RAM address
**Why this math is here:** Encodes scrolling-background source into palette RAM.
**Evidence:** MAME-PROVEN | **Applies to:** Palette RAM
```text
index = 0x400 | tile_pen9
```
**Inputs:** tile_pen9  
**Output:** 0x400..0x5FF  
**Worked example:** tile_pen9 0x08D -> 0x48D

#### MATH-SPR-PEN-001 - Sprite logical pen
**Why this math is here:** System 2 derives sprite color group from the live sprite slot.
**Evidence:** MAME-PROVEN | **Applies to:** Sprite palette addressing
```text
sprite_pen9 = (sprite_slot << 4) | pixel4
```
**Inputs:** sprite_slot 0..31,pixel4 0..15  
**Output:** 9-bit pen  
**Worked example:** slot 3,pixel 10 -> 0x03A

#### MATH-PAL-SPR-ADDR-001 - Sprite palette RAM address
**Why this math is here:** Sprite source occupies the first 512 logical palette entries.
**Evidence:** MAME-PROVEN | **Applies to:** Palette RAM
```text
index = sprite_pen9
```
**Inputs:** sprite_pen9  
**Output:** 0x000..0x1FF  
**Worked example:** 0x03A -> 0x03A

#### MATH-SPR-SRC-001 - Sprite source address
**Why this math is here:** Locates the current row stream in the selected sprite ROM bank.
**Evidence:** MAME-PROVEN | **Applies to:** Sprite descriptor
```text
srcaddr = byte6 | (byte7 << 8)
```
**Inputs:** descriptor bytes 6,7  
**Output:** uint16  
**Worked example:** 34 12 -> 0x1234

#### MATH-SPR-STRIDE-001 - Sprite stride
**Why this math is here:** Controls how source address advances between sprite rows.
**Evidence:** MAME-PROVEN | **Applies to:** Sprite descriptor
```text
stride = byte4 | (byte5 << 8)
```
**Inputs:** descriptor bytes 4,5  
**Output:** uint16  
**Worked example:** 10 00 -> 0x0010

#### MATH-SPR-ROW-001 - Sprite row address advance
**Why this math is here:** Explains why sequential ROM scanline grouping is not sufficient to recover frames.
**Evidence:** MAME-PROVEN | **Applies to:** Sprite rendering
```text
srcaddr = (srcaddr + stride) & 0xFFFF
```
**Inputs:** srcaddr,stride  
**Output:** uint16 wrap  
**Worked example:** 0xFFF8+0x10 -> 0x0008

#### MATH-SPR-BANK-001 - Sprite bank extraction
**Why this math is here:** Documents the non-contiguous descriptor-bit wiring used by MAME.
**Evidence:** MAME-PROVEN | **Applies to:** Sprite rendering
```text
bank = ((b3 & 0x80) >> 7) | ((b3 & 0x40) >> 5) | ((b3 & 0x20) >> 3)
```
**Inputs:** descriptor byte3  
**Output:** bank bits  
**Worked example:** bits 7,6,5 form sparse bank bits

#### MATH-SPR-X-001 - Sprite X extraction
**Why this math is here:** Maps descriptor bits to hardware raster X.
**Evidence:** MAME-PROVEN | **Applies to:** Sprite placement
```text
xstart = ((byte2 | (byte3 << 8)) & 0x1FF) + xoffset
```
**Inputs:** descriptor bytes2,3  
**Output:** 9-bit X + board offset  
**Worked example:** example depends on descriptor

#### MATH-MIXER-INDEX-001 - Mixer PROM index
**Why this math is here:** Turns five logical inputs into the exact PROM address.
**Evidence:** MAME-PROVEN | **Applies to:** Layer mixer
```text
idx = sprT | (fgT << 1) | (fgPri << 2) | (bgT << 4) | (bgPri << 5)
```
**Inputs:** transparency flags + priorities  
**Output:** 0..255  
**Worked example:** all transparent/zero priority -> 3

#### MATH-PROM-R-001 - Red PROM DAC approximation
**Why this math is here:** Reproduces MAME's measured resistor-weight approximation for System 2 color PROMs.
**Evidence:** MAME-PROVEN | **Applies to:** Physical palette PROM
```text
R = 0x0E*b0 + 0x1F*b1 + 0x43*b2 + 0x8F*b3
```
**Inputs:** red PROM nibble bits  
**Output:** 0..255 RGB  
**Worked example:** 0xF -> 255

#### MATH-PROM-G-001 - Green PROM DAC approximation
**Why this math is here:** Same measured weighting as red for the green PROM.
**Evidence:** MAME-PROVEN | **Applies to:** Physical palette PROM
```text
G = 0x0E*b0 + 0x1F*b1 + 0x43*b2 + 0x8F*b3
```
**Inputs:** green PROM nibble bits  
**Output:** 0..255 RGB  
**Worked example:** 0xF -> 255

#### MATH-PROM-B-001 - Blue PROM DAC approximation
**Why this math is here:** Documents the current MAME System 2 PROM conversion used by this package.
**Evidence:** MAME-PROVEN | **Applies to:** Physical palette PROM
```text
B = 0x0E*b0 + 0x1F*b1 + 0x43*b2 + 0x8F*b3
```
**Inputs:** blue PROM nibble bits  
**Output:** 0..255 RGB  
**Worked example:** 0xF -> 255

#### MATH-FIXED-24_8-001 - Modern 24.8 fixed-point encoding
**Why this math is here:** Keeps strict simulation independent of floating-point/render timing; not claimed as original arcade math.
**Evidence:** MODERN-DESIGN | **Applies to:** Unreal deterministic simulation
```text
raw = logical_pixels * 256; logical = raw / 256
```
**Inputs:** logical pixels  
**Output:** signed int32 raw  
**Worked example:** 12.5 px -> 3200 raw

#### MATH-CYCLES-FRAME-EST-001 - Teaching CPU cycles/frame estimate
**Why this math is here:** Useful for scale intuition only; exact event timing must come from traces.
**Evidence:** TEACHING-ESTIMATE | **Applies to:** Timing intuition
```text
cycles_per_frame ~= cpu_hz / refresh_hz
```
**Inputs:** ~4,000,000 Hz, ~60.0952 Hz  
**Output:** ~66,561 cycles/frame  
**Worked example:** 4,000,000 / 60.0952 ~= 66,561
**Still needs filling:** `FILL-TIMING-CYCLE-PHASE`

### 25.3 Unresolved gameplay math - indexed, not guessed
The following formula IDs intentionally contain `UNRESOLVED - DO NOT GUESS`. Their presence is important: a coding worker must reference the `FILL-*` item instead of choosing a plausible constant.

- **MATH-HELI-X-ACCEL-001 - Horizontal helicopter acceleration/deceleration equation** -> `FILL-MATH-HELI-X-ACCEL`. The formula needs a stable ID now so implementation cannot hide a guessed value inside code.
- **MATH-HELI-Y-ACCEL-001 - Vertical helicopter acceleration/deceleration equation** -> `FILL-MATH-HELI-Y-ACCEL`. The formula needs a stable ID now so implementation cannot hide a guessed value inside code.
- **MATH-HELI-SPEED-CLAMP-001 - Helicopter maximum speed/clamp/wrap behavior** -> `FILL-MATH-HELI-SPEED-CLAMP`. The formula needs a stable ID now so implementation cannot hide a guessed value inside code.
- **MATH-PROJECTILE-PRIMARY-001 - Primary projectile spawn offset, velocity and cadence math** -> `FILL-MATH-PROJECTILE-PRIMARY`. The formula needs a stable ID now so implementation cannot hide a guessed value inside code.
- **MATH-PROJECTILE-SECONDARY-001 - Secondary/bomb trajectory and cadence math** -> `FILL-MATH-PROJECTILE-SECONDARY`. The formula needs a stable ID now so implementation cannot hide a guessed value inside code.
- **MATH-FUEL-DRAIN-001 - Fuel drain update and warning thresholds** -> `FILL-MATH-FUEL-DRAIN`. The formula needs a stable ID now so implementation cannot hide a guessed value inside code.
- **MATH-FUEL-REFILL-001 - Fuel refill per rescue/delivery behavior** -> `FILL-MATH-FUEL-REFILL`. The formula needs a stable ID now so implementation cannot hide a guessed value inside code.
- **MATH-SCORE-EVENTS-001 - Score delta equations/table per event** -> `FILL-MATH-SCORE-EVENTS`. The formula needs a stable ID now so implementation cannot hide a guessed value inside code.
- **MATH-STAGE-COMPLETE-001 - Exact hostage completion threshold/bonus behavior** -> `FILL-MATH-STAGE-COMPLETE`. The formula needs a stable ID now so implementation cannot hide a guessed value inside code.
- **MATH-ENEMY-TIMERS-001 - Enemy spawn/fire/movement timing equations** -> `FILL-MATH-ENEMY-TIMERS`. The formula needs a stable ID now so implementation cannot hide a guessed value inside code.
- **MATH-RNG-NEXT-001 - Original RNG/counter update function and seed** -> `FILL-MATH-RNG-NEXT`. The formula needs a stable ID now so implementation cannot hide a guessed value inside code.
- **MATH-INPUT-SAMPLE-001 - Input sampling phase/frequency model** -> `FILL-MATH-INPUT-SAMPLE`. The formula needs a stable ID now so implementation cannot hide a guessed value inside code.
- **MATH-COLLISION-ORDER-001 - Original collision resolution/slot ordering behavior** -> `FILL-MATH-COLLISION-ORDER`. The formula needs a stable ID now so implementation cannot hide a guessed value inside code.

### 25.4 Known constants
| ID | Name | Value | Unit | Evidence | Why documented |
| --- | --- | ---: | --- | --- | --- |
| CONST-TILE-W-001 | Tile width | 8 | pixels | ROM+MAME-PROVEN | 8x8 tile decoder |
| CONST-TILE-H-001 | Tile height | 8 | pixels | ROM+MAME-PROVEN | 8x8 tile decoder |
| CONST-TILE-COUNT-001 | Tile code count | 4096 | tiles | ROM+MAME-PROVEN | 3 planes x 0x8000 bytes -> 4096 8x8 codes |
| CONST-TILE-BPP-001 | Tile bit depth | 3 | bits/pixel | ROM+MAME-PROVEN | Three separate planes |
| CONST-PAGE-COUNT-001 | System 2 tile pages | 8 | pages | MAME-PROVEN | System 2 video startup |
| CONST-PAGE-TILES-X-001 | Page tile width | 32 | tiles | MAME-PROVEN | System 2 page geometry |
| CONST-PAGE-TILES-Y-001 | Page tile height | 32 | tiles | MAME-PROVEN | System 2 page geometry |
| CONST-BG-COMPOSE-X-001 | Effective BG width | 64 | tiles | MAME-PROVEN | Four selected 32x32 pages form 2x2 arrangement |
| CONST-BG-COMPOSE-Y-001 | Effective BG height | 64 | tiles | MAME-PROVEN | Four selected 32x32 pages form 2x2 arrangement |
| CONST-SPRITE-SLOTS-001 | Maximum live sprite slots | 32 | slots | MAME-PROVEN | draw_sprites loop |
| CONST-SPRITE-DESC-BYTES-001 | Sprite descriptor size | 16 | bytes | MAME-PROVEN | descriptor indexing |
| CONST-SPRITE-TRANSPARENT-001 | Sprite transparent index | 0 | pixel index | MAME-PROVEN | zero is not drawn |
| CONST-SPRITE-ROW-END-001 | Sprite row terminator | 15 / 0xF | nibble | MAME-PROVEN | terminates row |
| CONST-TILE-TRANSPARENT-001 | Tile transparent index | 0 | pixel index | MAME-PROVEN | transparent pen 0 |
| CONST-PALETTE-RAM-ENTRIES-001 | Logical palette entries | 2048 / 0x800 | entries | MAME-PROVEN | source bank + 9-bit pen |
| CONST-PHYSICAL-COLORS-001 | Physical PROM colors | 256 | RGB colors | ROM+MAME-PROVEN | 8-bit PROM index |
| CONST-MIXER-ENTRIES-001 | Mixer truth-table entries | 256 | entries | ROM+MAME-PROVEN | 8-bit lookup address |
| CONST-ROWSCROLL-COUNT-001 | Row-scroll entries | 32 | values | MAME-PROVEN | one value per 8-pixel row band |
| CONST-MAIN-CPU-HZ-APPROX | Main Z80 clock | ~4,000,000 | Hz | MAME-HARDWARE-NOTES | teaching approximation |
| CONST-REFRESH-HZ-APPROX | Vertical refresh | ~60.0952 | Hz | MAME-HARDWARE-NOTES | capture reference |

### 25.5 Known variables/state fields
| ID | Name | Type/range | Storage/source | Meaning | Evidence |
| --- | --- | --- | --- | --- | --- |
| VAR-TILE-BYTE0 | tile byte 0 | uint8 | Video RAM | First byte of 16-bit tile descriptor | MAME-PROVEN |
| VAR-TILE-BYTE1 | tile byte 1 | uint8 | Video RAM | Second byte of 16-bit tile descriptor | MAME-PROVEN |
| VAR-TILE-CODE | tile code | uint12 | Derived | Index into 4096 tile graphics | MAME-PROVEN |
| VAR-TILE-COLOR | tile color attribute | uint8 | Derived | 6 color bits + 2 priority bits | MAME-PROVEN |
| VAR-SPR-SLOT | live sprite slot | 0..31 | Sprite RAM position | Selects sprite palette group and collision identity | MAME-PROVEN |
| VAR-SPR-SRCADDR | sprite source address | uint16 | Sprite descriptor bytes6-7 | Source row stream pointer | MAME-PROVEN |
| VAR-SPR-STRIDE | sprite stride | uint16 | Sprite descriptor bytes4-5 | Added once per rendered row | MAME-PROVEN |
| VAR-SPR-XSTART | sprite X start | 9-bit + offset | Sprite descriptor bytes2-3 | Hardware raster X start | MAME-PROVEN |
| VAR-SPR-TOP | sprite top Y | uint8+1 | Sprite descriptor byte0 | Top scanline | MAME-PROVEN |
| VAR-SPR-BOTTOM | sprite bottom Y | uint8+1 | Sprite descriptor byte1 | Bottom scanline exclusive | MAME-PROVEN |
| VAR-PALETTE-RAM-ENTRY | logical palette entry | uint8 | 0x800 palette RAM | Indexes 256 physical PROM colors | MAME-PROVEN |
| VAR-MIXER-LOOKUP | mixer PROM output | 4-bit | Mixer PROM | Selects visible source and collision behavior | ROM+MAME-PROVEN |
| VAR-ROWSCROLL-ENTRY | background row scroll | 9-bit-ish hardware value | Video RAM registers | X scroll for an 8-pixel row band | MAME-PROVEN |
| VAR-SIM-FRAME | modern simulation frame | uint64 | Unreal strict sim | Monotonic deterministic step index | MODERN-DESIGN |

### 25.6 Tables and table-shaped unknowns
**TABLE-PALETTE-PROM-001 - Physical RGB PROM table**  
Size: 256 entries | Evidence: ROM+MAME-PROVEN  
Why: Maps 8-bit physical color index to RGB.

**TABLE-MIXER-PROM-001 - Layer mixer truth table**  
Size: 256 entries | Evidence: ROM+MAME-PROVEN  
Why: Maps transparency/priority inputs to visible source/collision behavior.

**TABLE-TILE-LIB-001 - Canonical tile library**  
Size: 4096 entries | Evidence: ROM-PROVEN  
Why: Exact 0..7 pixel-index tiles; PNGs are diagnostics.

**TABLE-SPR-STATIC-SEQ-001 - Static sprite ROM sequence research table**  
Size: 212 records | Evidence: STATIC-ROM-INFERENCE  
Why: Research-only terminated-row sequences; not runtime sprite objects.
  
Still needs filling: `FILL-SPR-RUNTIME-DESCRIPTORS`

**TABLE-DIP-B-001 - DIP B settings**  
Size: 5 documented setting groups | Evidence: MAME-PROVEN  
Why: Lives/bonus/difficulty/demo sound plus unresolved SWB8.

**TABLE-SCORE-001 - Arcade score event table**  
Size: UNKNOWN until runtime/code closure | Evidence: OPEN  
Why: Must be derived from score writes/events, not secondary guides.
  
Still needs filling: `FILL-SCORE-TABLE`

**TABLE-AUDIO-CMD-001 - Sound command table**  
Size: UNKNOWN until latch trace | Evidence: OPEN  
Why: Must map latch command values to sound CPU/PSG behavior.
  
Still needs filling: `FILL-AUDIO-COMMAND-TABLE`

**TABLE-ENEMY-PARAM-001 - Enemy archetype parameter tables**  
Size: UNKNOWN | Evidence: OPEN  
Why: Static constants/tables require runtime correlation before semantic naming.
  
Still needs filling: `FILL-ENEMY-TABLES`

### 25.7 Subroutine teaching index - what static analysis can already say
Each record below is deliberately conservative. `Static role hint` is a triage description derived from explicit memory/I/O evidence; it is **not** a canonical routine name. Every unresolved semantic contract has a `FILL-SUB-*` ID.

#### SUB-MAIN-F-R0000 - COD-MAIN-F-R0000 @ MAIN-F:0000
**Static role hint:** I/O/control  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-F:0000; static hint=I/O/control; explicit memory refs=0; I/O refs=2; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-F-R0000-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0000: F3         DI
0001: ED56       IM 1
0003: DB15       IN A,($15)
0005: F60C       OR $0C
0007: D315       OUT ($15),A
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-F-R0000-SEMANTICS.

#### SUB-MAIN-F-R0001 - COD-MAIN-F-R0001 @ MAIN-F:0008
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-F:0008; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=1.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-F-R0001-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0008: 15         DEC D
0009: C30094     JP $9400
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-F-R0001-SEMANTICS.

#### SUB-MAIN-F-R0002 - COD-MAIN-F-R0002 @ MAIN-F:0010
**Static role hint:** I/O/control  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-F:0010; static hint=I/O/control; explicit memory refs=0; I/O refs=2; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-F-R0002-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0010: D315       OUT ($15),A
0012: 00         NOP
0013: 00         NOP
0014: 00         NOP
0015: DB15       IN A,($15)
0017: CBF7       SET 6,A
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-F-R0002-SEMANTICS.

#### SUB-MAIN-F-R0003 - COD-MAIN-F-R0003 @ MAIN-F:0018
**Static role hint:** I/O/control  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-F:0018; static hint=I/O/control; explicit memory refs=0; I/O refs=1; outgoing direct flow refs=2.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-F-R0003-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0018: F7         RST $0030
0019: D315       OUT ($15),A
001B: C30080     JP $8000
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-F-R0003-SEMANTICS.

#### SUB-MAIN-F-R0004 - COD-MAIN-F-R0004 @ MAIN-F:0020
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-F:0020; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-F-R0004-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0020: 00         NOP
0021: 00         NOP
0022: 00         NOP
0023: 00         NOP
0024: 00         NOP
0025: 00         NOP
0026: 00         NOP
0027: 00         NOP
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-F-R0004-SEMANTICS.

#### SUB-MAIN-F-R0005 - COD-MAIN-F-R0005 @ MAIN-F:0028
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-F:0028; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-F-R0005-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0028: 00         NOP
0029: 00         NOP
002A: 00         NOP
002B: 00         NOP
002C: 00         NOP
002D: 00         NOP
002E: 00         NOP
002F: 00         NOP
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-F-R0005-SEMANTICS.

#### SUB-MAIN-F-R0006 - COD-MAIN-F-R0006 @ MAIN-F:0030
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-F:0030; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=1.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-F-R0006-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0030: 00         NOP
0031: 00         NOP
0032: F41B75     CALL P,$751B
0035: 9B         SBC A,E
0036: 9B         SBC A,E
0037: BF         CP A
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-F-R0006-SEMANTICS.

#### SUB-MAIN-F-R0007 - COD-MAIN-F-R0007 @ MAIN-F:0038
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-F:0038; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=1.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-F-R0007-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0038: C37601     JP $0176
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-F-R0007-SEMANTICS.

#### SUB-MAIN-F-R0008 - COD-MAIN-F-R0008 @ MAIN-F:0066
**Static role hint:** game work RAM  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-F:0066; static hint=game work RAM; explicit memory refs=9; I/O refs=0; outgoing direct flow refs=4.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-F-R0008-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0066: CDE202     CALL $02E2
0069: 3E01       LD A,$01
006B: 3210C0     LD ($C010),A
006E: 3A88C0     LD A,($C088)
0071: E6A7       AND $A7
0073: 3D         DEC A
0074: 2804       JR Z,$007A
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-F-R0008-SEMANTICS.

#### SUB-MAIN-F-R0009 - COD-MAIN-F-R0009 @ MAIN-F:016E
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-F:016E; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=19; I/O refs=7; outgoing direct flow refs=20.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-F-R0009-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
016E: ED5F       LD A,R
0170: 6F         LD L,A
0171: 87         ADD A,A
0172: 0F         RRCA
0173: 3D         DEC A
0174: 67         LD H,A
0175: C9         RET
0176: F5         PUSH AF
0177: C5         PUSH BC
0178: D5         PUSH DE
0179: E5         PUSH HL
017A: DDE5       PUSH IX
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-F-R0009-SEMANTICS.

#### SUB-MAIN-F-R0010 - COD-MAIN-F-R0010 @ MAIN-F:02E2
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-F:02E2; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-F-R0010-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
02E2: 76         HALT
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-F-R0010-SEMANTICS.

#### SUB-MAIN-F-R0011 - COD-MAIN-F-R0011 @ MAIN-F:05D2
**Static role hint:** palette state, game work RAM  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-F:05D2; static hint=palette state, game work RAM; explicit memory refs=7; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-F-R0011-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
05D2: 2AE4C0     LD HL,($C0E4)
05D5: 221CD8     LD ($D81C),HL
05D8: 3AE6C0     LD A,($C0E6)
05DB: 321ED8     LD ($D81E),A
05DE: 2A3BC2     LD HL,($C23B)
05E1: 7E         LD A,(HL)
05E2: 3208D8     LD ($D808),A
05E5: 3A34C3     LD A,($C334)
05E8: CB47       BIT 0,A
05EA: C8         RET Z
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-F-R0011-SEMANTICS.

#### SUB-MAIN-F-R0012 - COD-MAIN-F-R0012 @ MAIN-F:07F6
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-F:07F6; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=2.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-F-R0012-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
07F6: 2120C0     LD HL,$C020
07F9: 010800     LD BC,$0008
07FC: 1806       JR $0804
0804: 3600       LD (HL),$00
0806: 0B         DEC BC
0807: 23         INC HL
0808: 78         LD A,B
0809: B1         OR C
080A: 20F8       JR NZ,$0804
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-F-R0012-SEMANTICS.

#### SUB-MAIN-F-R0013 - COD-MAIN-F-R0013 @ MAIN-F:751B
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-F:751B; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=1; I/O refs=0; outgoing direct flow refs=6.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-F-R0013-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
751B: 11BB00     LD DE,$00BB
751E: 98         SBC A,B
751F: 2874       JR Z,$7595
7521: 2A1011     LD HL,($1110)
7524: FF         RST $0038
7525: 00         NOP
7526: 11A521     LD DE,$21A5
7529: A6         AND (HL)
752A: 31A741     LD SP,$41A7
752D: A8         XOR B
752E: 51         LD D,C
752F: A9         XOR C
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-F-R0013-SEMANTICS.

#### SUB-MAIN-B0-R0000 - COD-MAIN-B0-R0000 @ MAIN-B0:8000
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B0:8000; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=5.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B0-R0000-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
8000: 08         EX AF,AF'
8001: 1180AB     LD DE,$AB80
8004: 80         ADD A,B
8005: 9D         SBC A,L
8006: 81         ADD A,C
8007: ED83       DB $ED,$83
8009: ED86       DB $ED,$86
800B: 9D         SBC A,L
800C: 8A         ADC A,D
800D: FD8E0D     ADC A,(IY+13)
8010: 94         SUB H
8011: 10A0       DJNZ $7FB3
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B0-R0000-SEMANTICS.

#### SUB-MAIN-B0-R0001 - COD-MAIN-B0-R0001 @ MAIN-B0:80A8
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B0:80A8; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=11.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B0-R0001-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
80A8: 9C         SBC A,H
80A9: B0         OR B
80AA: 9C         SBC A,H
80AB: 1EA0       LD E,$A0
80AD: B4         OR H
80AE: 9C         SBC A,H
80AF: C0         RET NZ
93A0: 111211     LD DE,$1112
93A3: 13         INC DE
93A4: 111011     LD DE,$1110
93A7: 111112     LD DE,$1211
93AA: 111311     LD DE,$1113
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B0-R0001-SEMANTICS.

#### SUB-MAIN-B0-R0002 - COD-MAIN-B0-R0002 @ MAIN-B0:9400
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B0:9400; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=1; I/O refs=0; outgoing direct flow refs=152.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B0-R0002-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
9400: 111211     LD DE,$1112
9402: 111311     LD DE,$1113
9403: 13         INC DE
9404: 111011     LD DE,$1110
9405: 1011       DJNZ $9418
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B0-R0002-SEMANTICS.

#### SUB-MAIN-B0-R0003 - COD-MAIN-B0-R0003 @ MAIN-B0:A000
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B0:A000; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=4; I/O refs=0; outgoing direct flow refs=221.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B0-R0003-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A000: BA         CP D
A001: 81         ADD A,C
A002: BE         CP (HL)
A003: FF         RST $0038
A004: 03         INC BC
A005: 81         ADD A,C
A006: BB         CP E
A007: 81         ADD A,C
A008: BF         CP A
A009: FF         RST $0038
A00A: 03         INC BC
A00B: 81         ADD A,C
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B0-R0003-SEMANTICS.

#### SUB-MAIN-B1-R0000 - COD-MAIN-B1-R0000 @ MAIN-B1:8000
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B1:8000; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=17.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B1-R0000-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
8000: 010380     LD BC,$8003
8003: 0A         LD A,(BC)
8004: 86         ADD A,(HL)
8005: 2F         CPL
8006: 86         ADD A,(HL)
8007: 5F         LD E,A
8008: 86         ADD A,(HL)
8009: 8F         ADC A,A
800A: 86         ADD A,(HL)
800B: BF         CP A
800C: 86         ADD A,(HL)
800D: EF         RST $0028
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B1-R0000-SEMANTICS.

#### SUB-MAIN-B1-R0001 - COD-MAIN-B1-R0001 @ MAIN-B1:80A8
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B1:80A8; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=43.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B1-R0001-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
80A8: 92         SUB D
80A9: 8F         ADC A,A
80AA: 92         SUB D
80AB: BF         CP A
80AC: 92         SUB D
80AD: EF         RST $0028
80AE: 92         SUB D
80AF: 1F         RRA
80B0: 93         SUB E
80B1: 4F         LD C,A
80B2: 93         SUB E
80B3: 7F         LD A,A
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B1-R0001-SEMANTICS.

#### SUB-MAIN-B1-R0002 - COD-MAIN-B1-R0002 @ MAIN-B1:9400
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B1:9400; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B1-R0002-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
9400: 03         INC BC
9401: C0         RET NZ
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B1-R0002-SEMANTICS.

#### SUB-MAIN-B1-R0003 - COD-MAIN-B1-R0003 @ MAIN-B1:A000
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B1:A000; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=6; I/O refs=0; outgoing direct flow refs=10.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B1-R0003-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A000: 13         INC DE
A001: 8D         ADC A,L
A002: 13         INC DE
A003: 93         SUB E
A004: 13         INC DE
A005: 99         SBC A,C
A006: 13         INC DE
A007: 9F         SBC A,A
A008: FF         RST $0038
A009: 0E03       LD C,$03
A00B: 110320     LD DE,$2003
A00E: 03         INC BC
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B1-R0003-SEMANTICS.

#### SUB-MAIN-B2-R0000 - COD-MAIN-B2-R0000 @ MAIN-B2:8000
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B2:8000; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B2-R0000-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
8000: E0         RET PO
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B2-R0000-SEMANTICS.

#### SUB-MAIN-B2-R0001 - COD-MAIN-B2-R0001 @ MAIN-B2:80A8
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B2:80A8; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B2-R0001-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
80A8: F608       OR $08
80AA: F608       OR $08
80AC: F8         RET M
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B2-R0001-SEMANTICS.

#### SUB-MAIN-B2-R0002 - COD-MAIN-B2-R0002 @ MAIN-B2:9400
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B2:9400; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=314; I/O refs=0; outgoing direct flow refs=75.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B2-R0002-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
9400: FF         RST $0038
9401: 00         NOP
9402: 012201     LD BC,$0122
9405: 220122     LD ($2201),HL
9408: 012201     LD BC,$0122
940B: 220122     LD ($2201),HL
940E: 012201     LD BC,$0122
9411: 220122     LD ($2201),HL
9414: 012201     LD BC,$0122
9417: 220122     LD ($2201),HL
941A: 012201     LD BC,$0122
941D: 22954B     LD ($4B95),HL
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B2-R0002-SEMANTICS.

#### SUB-MAIN-B2-R0003 - COD-MAIN-B2-R0003 @ MAIN-B2:A000
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B2:A000; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=18; I/O refs=0; outgoing direct flow refs=5.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B2-R0003-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.```text
A000: 067C       LD B,$7C
A002: 86         ADD A,(HL)
A003: 62         LD H,D
A004: 05         DEC B
A005: 12         LD (DE),A
A006: 15         DEC D
A007: 1A         LD A,(DE)
A008: FF         RST $0038
A009: 00         NOP
A00A: 012201     LD BC,$0122
A00D: 220122     LD ($2201),HL
A010: 012201     LD BC,$0122
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B2-R0003-SEMANTICS.

#### SUB-MAIN-B3-R0000 - COD-MAIN-B3-R0000 @ MAIN-B3:8000
**Static role hint:** I/O/control, game work RAM  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B3:8000; static hint=I/O/control, game work RAM; explicit memory refs=4; I/O refs=5; outgoing direct flow refs=2.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0000-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
8000: 3100D0     LD SP,$D000
8003: DB15       IN A,($15)
8005: F610       OR $10
8007: D315       OUT ($15),A
8009: 2100C0     LD HL,$C000
800C: 1101C0     LD DE,$C001
800F: 01FD2F     LD BC,$2FFD
8012: 3600       LD (HL),$00
8014: EDB0       LDIR
8016: 210090     LD HL,$9000
8019: 1100DE     LD DE,$DE00
801C: 010002     LD BC,$0200
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0000-SEMANTICS.

#### SUB-MAIN-B3-R0001 - COD-MAIN-B3-R0001 @ MAIN-B3:80A8
**Static role hint:** I/O/control, game work RAM  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B3:80A8; static hint=I/O/control, game work RAM; explicit memory refs=3; I/O refs=1; outgoing direct flow refs=21.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0001-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
80A8: DB08       IN A,($08)
80AA: 47         LD B,A
80AB: 3A01C0     LD A,($C001)
80AE: 4F         LD C,A
80AF: CB58       BIT 3,B
80B1: 2012       JR NZ,$80C5
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0001-SEMANTICS.

#### SUB-MAIN-B3-R0002 - COD-MAIN-B3-R0002 @ MAIN-B3:812F
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:812F; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=4.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0002-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
812F: C5         PUSH BC
8130: E5         PUSH HL
8131: D5         PUSH DE
8132: 7E         LD A,(HL)
8133: FE0F       CP $0F
8135: 2001       JR NZ,$8138
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0002-SEMANTICS.

#### SUB-MAIN-B3-R0003 - COD-MAIN-B3-R0003 @ MAIN-B3:81AA
**Static role hint:** I/O/control, game work RAM  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:81AA; static hint=I/O/control, game work RAM; explicit memory refs=2; I/O refs=1; outgoing direct flow refs=1.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0003-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
81AA: 57         LD D,A
81AB: 3A00C0     LD A,($C000)
81AE: 82         ADD A,D
81AF: FE09       CP $09
81B1: 3802       JR C,$81B5
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0003-SEMANTICS.

#### SUB-MAIN-B3-R0004 - COD-MAIN-B3-R0004 @ MAIN-B3:81BD
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:81BD; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0004-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
81BD: 7E         LD A,(HL)
81BE: A7         AND A
81BF: C8         RET Z
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0004-SEMANTICS.

#### SUB-MAIN-B3-R0005 - COD-MAIN-B3-R0005 @ MAIN-B3:9400
**Static role hint:** palette state, video/tile state  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B3:9400; static hint=palette state, video/tile state; explicit memory refs=8; I/O refs=1; outgoing direct flow refs=24.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0005-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
9400: 2AFEEF     LD HL,($EFFE)
9403: 014F4B     LD BC,$4B4F
9406: B7         OR A
9407: ED42       SBC HL,BC
9409: CA0C00     JP Z,$000C
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0005-SEMANTICS.

#### SUB-MAIN-B3-R0006 - COD-MAIN-B3-R0006 @ MAIN-B3:A000
**Static role hint:** I/O/control  
**Evidence:** BANK-SEED  
**What is known:** Entry=MAIN-B3:A000; static hint=I/O/control; explicit memory refs=0; I/O refs=1; outgoing direct flow refs=5.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0006-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A000: FB         EI
A001: AF         XOR A
A002: D314       OUT ($14),A
A004: CD13A0     CALL $A013
A007: CDDEA0     CALL $A0DE
A00A: CD5CA1     CALL $A15C
A00D: CDF7A1     CALL $A1F7
A010: C30000     JP $0000
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0006-SEMANTICS.

#### SUB-MAIN-B3-R0007 - COD-MAIN-B3-R0007 @ MAIN-B3:A013
**Static role hint:** I/O/control  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A013; static hint=I/O/control; explicit memory refs=0; I/O refs=1; outgoing direct flow refs=4.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0007-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A013: CDF7A1     CALL $A1F7
A016: CD03A2     CALL $A203
A019: AF         XOR A
A01A: DB0C       IN A,($0C)
A01C: D9         EXX
A01D: 4F         LD C,A
A01E: D9         EXX
A01F: CD30A0     CALL $A030
A022: CD70A0     CALL $A070
A025: D8         RET C
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0007-SEMANTICS.

#### SUB-MAIN-B3-R0008 - COD-MAIN-B3-R0008 @ MAIN-B3:A030
**Static role hint:** I/O/control  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A030; static hint=I/O/control; explicit memory refs=0; I/O refs=1; outgoing direct flow refs=4.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0008-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A030: AF         XOR A
A031: DB0C       IN A,($0C)
A033: D9         EXX
A034: B9         CP C
A035: 4F         LD C,A
A036: D9         EXX
A037: C403A2     CALL NZ,$A203
A03A: 217CA2     LD HL,$A27C
A03D: 0607       LD B,$07
A03F: CD44A2     CALL $A244
A042: CD64A0     CALL $A064
A045: 21BDA2     LD HL,$A2BD
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0008-SEMANTICS.

#### SUB-MAIN-B3-R0009 - COD-MAIN-B3-R0009 @ MAIN-B3:A064
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A064; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0009-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A064: D9         EXX
A065: CB41       BIT 0,C
A067: D9         EXX
A068: 110000     LD DE,$0000
A06B: C0         RET NZ
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0009-SEMANTICS.

#### SUB-MAIN-B3-R0010 - COD-MAIN-B3-R0010 @ MAIN-B3:A070
**Static role hint:** I/O/control  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A070; static hint=I/O/control; explicit memory refs=0; I/O refs=1; outgoing direct flow refs=3.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0010-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A070: AF         XOR A
A071: DB08       IN A,($08)
A073: 1166E1     LD DE,$E166
A076: 0606       LD B,$06
A078: 21F6A2     LD HL,$A2F6
A07B: 0F         RRCA
A07C: 3004       JR NC,$A082
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0010-SEMANTICS.

#### SUB-MAIN-B3-R0011 - COD-MAIN-B3-R0011 @ MAIN-B3:A0DE
**Static role hint:** I/O/control  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A0DE; static hint=I/O/control; explicit memory refs=0; I/O refs=3; outgoing direct flow refs=7.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0011-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A0DE: CDF7A1     CALL $A1F7
A0E1: CD03A2     CALL $A203
A0E4: AF         XOR A
A0E5: D316       OUT ($16),A
A0E7: 21FAA2     LD HL,$A2FA
A0EA: 0603       LD B,$03
A0EC: CD44A2     CALL $A244
A0EF: 2113A3     LD HL,$A313
A0F2: AF         XOR A
A0F3: 08         EX AF,AF'
A0F4: 3E10       LD A,$10
A0F6: 1805       JR $A0FD
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0011-SEMANTICS.

#### SUB-MAIN-B3-R0012 - COD-MAIN-B3-R0012 @ MAIN-B3:A112
**Static role hint:** I/O/control  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A112; static hint=I/O/control; explicit memory refs=0; I/O refs=2; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0012-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A112: 3E01       LD A,$01
A114: D316       OUT ($16),A
A116: AF         XOR A
A117: D314       OUT ($14),A
A119: 76         HALT
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0012-SEMANTICS.

#### SUB-MAIN-B3-R0013 - COD-MAIN-B3-R0013 @ MAIN-B3:A15C
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A15C; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=13.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0013-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A15C: CDF7A1     CALL $A1F7
A15F: CD03A2     CALL $A203
A162: 2102E0     LD HL,$E002
A165: 3E21       LD A,$21
A167: 110100     LD DE,$0001
A16A: 43         LD B,E
A16B: CDD7A1     CALL $A1D7
A16E: 061C       LD B,$1C
A170: 3E22       LD A,$22
A172: CDD7A1     CALL $A1D7
A175: 3E23       LD A,$23
A177: 43         LD B,E
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0013-SEMANTICS.

#### SUB-MAIN-B3-R0014 - COD-MAIN-B3-R0014 @ MAIN-B3:A1D7
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A1D7; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=1; outgoing direct flow refs=1.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0014-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A1D7: 77         LD (HL),A
A1D8: 23         INC HL
A1D9: 3600       LD (HL),$00
A1DB: 19         ADD HL,DE
A1DC: 10F9       DJNZ $A1D7
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0014-SEMANTICS.

#### SUB-MAIN-B3-R0015 - COD-MAIN-B3-R0015 @ MAIN-B3:A1F7
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A1F7; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0015-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A1F7: 76         HALT
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0015-SEMANTICS.

#### SUB-MAIN-B3-R0016 - COD-MAIN-B3-R0016 @ MAIN-B3:A203
**Static role hint:** palette state  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A203; static hint=palette state; explicit memory refs=5; I/O refs=0; outgoing direct flow refs=2.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0016-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A203: CD8AA3     CALL $A38A
A206: 2100D0     LD HL,$D000
A209: 1101D0     LD DE,$D001
A20C: 01FF07     LD BC,$07FF
A20F: 3600       LD (HL),$00
A211: EDB0       LDIR
A213: 2100E8     LD HL,$E800
A216: 1101E8     LD DE,$E801
A219: 01FF06     LD BC,$06FF
A21C: 3600       LD (HL),$00
A21E: EDB0       LDIR
A220: 2100E0     LD HL,$E000
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0016-SEMANTICS.

#### SUB-MAIN-B3-R0017 - COD-MAIN-B3-R0017 @ MAIN-B3:A244
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A244; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=2.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0017-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A244: C5         PUSH BC
A245: CD92A3     CALL $A392
A248: C1         POP BC
A249: 10F9       DJNZ $A244
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0017-SEMANTICS.

#### SUB-MAIN-B3-R0018 - COD-MAIN-B3-R0018 @ MAIN-B3:A24C
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A24C; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=2.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0018-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A24C: C5         PUSH BC
A24D: D5         PUSH DE
A24E: 4E         LD C,(HL)
A24F: 23         INC HL
A250: 46         LD B,(HL)
A251: 23         INC HL
A252: EB         EX DE,HL
A253: 09         ADD HL,BC
A254: EB         EX DE,HL
A255: 46         LD B,(HL)
A256: 23         INC HL
A257: CD98A3     CALL $A398
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0018-SEMANTICS.

#### SUB-MAIN-B3-R0019 - COD-MAIN-B3-R0019 @ MAIN-B3:A382
**Static role hint:** I/O/control  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A382; static hint=I/O/control; explicit memory refs=0; I/O refs=2; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0019-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A382: DB15       IN A,($15)
A384: E6EF       AND $EF
A386: D315       OUT ($15),A
A388: FB         EI
A389: C9         RET
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0019-SEMANTICS.

#### SUB-MAIN-B3-R0020 - COD-MAIN-B3-R0020 @ MAIN-B3:A38A
**Static role hint:** I/O/control  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A38A; static hint=I/O/control; explicit memory refs=0; I/O refs=2; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0020-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A38A: F3         DI
A38B: DB15       IN A,($15)
A38D: F610       OR $10
A38F: D315       OUT ($15),A
A391: C9         RET
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0020-SEMANTICS.

#### SUB-MAIN-B3-R0021 - COD-MAIN-B3-R0021 @ MAIN-B3:A392
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A392; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0021-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A392: 5E         LD E,(HL)
A393: 23         INC HL
A394: 56         LD D,(HL)
A395: 23         INC HL
A396: 46         LD B,(HL)
A397: 23         INC HL
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0021-SEMANTICS.

#### SUB-MAIN-B3-R0022 - COD-MAIN-B3-R0022 @ MAIN-B3:A398
**Static role hint:** general/control-flow support; semantic purpose unresolved  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=MAIN-B3:A398; static hint=general/control-flow support; semantic purpose unresolved; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=1.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-MAIN-B3-R0022-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
A398: 7E         LD A,(HL)
A399: 12         LD (DE),A
A39A: 13         INC DE
A39B: 3E08       LD A,$08
A39D: 12         LD (DE),A
A39E: 13         INC DE
A39F: 23         INC HL
A3A0: 10F6       DJNZ $A398
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-MAIN-B3-R0022-SEMANTICS.

#### SUB-SND-R0000 - COD-SND-R0000 @ SND:0000
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0000; static hint=sound-CPU logic; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=1.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0000-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0000: F3         DI
0001: ED56       IM 1
0003: 310084     LD SP,$8400
0006: C30001     JP $0100
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0000-SEMANTICS.

#### SUB-SND-R0001 - COD-SND-R0001 @ SND:0008
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0008; static hint=sound-CPU logic; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0001-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0008: 010000     LD BC,$0000
000B: 00         NOP
000C: 00         NOP
000D: 00         NOP
000E: 00         NOP
000F: 00         NOP
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0001-SEMANTICS.

#### SUB-SND-R0002 - COD-SND-R0002 @ SND:0010
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0010; static hint=sound-CPU logic; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0002-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0010: 00         NOP
0011: 00         NOP
0012: 00         NOP
0013: 00         NOP
0014: 00         NOP
0015: 00         NOP
0016: 00         NOP
0017: 00         NOP
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0002-SEMANTICS.

#### SUB-SND-R0003 - COD-SND-R0003 @ SND:0018
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0018; static hint=sound-CPU logic; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0003-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0018: 00         NOP
0019: 00         NOP
001A: 00         NOP
001B: 00         NOP
001C: 00         NOP
001D: 00         NOP
001E: 00         NOP
001F: 00         NOP
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0003-SEMANTICS.

#### SUB-SND-R0004 - COD-SND-R0004 @ SND:0020
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0020; static hint=sound-CPU logic; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0004-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0020: 00         NOP
0021: 00         NOP
0022: 00         NOP
0023: 00         NOP
0024: 00         NOP
0025: 00         NOP
0026: 00         NOP
0027: 00         NOP
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0004-SEMANTICS.

#### SUB-SND-R0005 - COD-SND-R0005 @ SND:0028
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0028; static hint=sound-CPU logic; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=1.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0005-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0028: 00         NOP
0029: 00         NOP
002A: 00         NOP
002B: 00         NOP
002C: C33B2B     JP $2B3B
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0005-SEMANTICS.

#### SUB-SND-R0006 - COD-SND-R0006 @ SND:0030
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0030; static hint=sound-CPU logic; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=2.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0006-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0030: 4F         LD C,A
0031: 0B         DEC BC
0032: C2292B     JP NZ,$2B29
0035: 0C         INC C
0036: 0D         DEC C
0037: CAF5E5     JP Z,$E5F5
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0006-SEMANTICS.

#### SUB-SND-R0007 - COD-SND-R0007 @ SND:0038
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0038; static hint=sound-CPU logic; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0007-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0038: F5         PUSH AF
0039: E5         PUSH HL
003A: 210080     LD HL,$8000
003D: 35         DEC (HL)
003E: E1         POP HL
003F: F1         POP AF
0040: FB         EI
0041: C9         RET
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0007-SEMANTICS.

#### SUB-SND-R0008 - COD-SND-R0008 @ SND:0066
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0066; static hint=sound-CPU logic; explicit memory refs=2; I/O refs=0; outgoing direct flow refs=7.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0008-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0066: F5         PUSH AF
0067: 3A00E0     LD A,($E000)
006A: 321080     LD ($8010),A
006D: F1         POP AF
006E: FB         EI
006F: ED45       RETN
0100: CDCB0A     CALL $0ACB
0103: 210080     LD HL,$8000
0106: 110180     LD DE,$8001
0109: 01FF03     LD BC,$03FF
010C: 3600       LD (HL),$00
010E: EDB0       LDIR
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0008-SEMANTICS.

#### SUB-SND-R0009 - COD-SND-R0009 @ SND:0139
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0139; static hint=sound-CPU logic; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=3.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0009-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0139: 0E00       LD C,$00
013B: 0606       LD B,$06
013D: 21A081     LD HL,$81A0
0140: 112000     LD DE,$0020
0143: 19         ADD HL,DE
0144: CB7E       BIT 7,(HL)
0146: C25601     JP NZ,$0156
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0009-SEMANTICS.

#### SUB-SND-R0010 - COD-SND-R0010 @ SND:0196
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0196; static hint=sound-CPU logic; explicit memory refs=3; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0010-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0196: 3A1080     LD A,($8010)
0199: E630       AND $30
019B: 0F         RRCA
019C: 0F         RRCA
019D: 0F         RRCA
019E: 0F         RRCA
019F: E603       AND $03
01A1: 0600       LD B,$00
01A3: 4F         LD C,A
01A4: 21D701     LD HL,$01D7
01A7: 09         ADD HL,BC
01A8: 7E         LD A,(HL)
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0010-SEMANTICS.

#### SUB-SND-R0011 - COD-SND-R0011 @ SND:01B0
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:01B0; static hint=sound-CPU logic; explicit memory refs=5; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0011-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
01B0: 3A1080     LD A,($8010)
01B3: E60F       AND $0F
01B5: 0600       LD B,$00
01B7: 4F         LD C,A
01B8: C5         PUSH BC
01B9: 21DB01     LD HL,$01DB
01BC: 09         ADD HL,BC
01BD: 7E         LD A,(HL)
01BE: 324580     LD ($8045),A
01C1: C1         POP BC
01C2: 21EB01     LD HL,$01EB
01C5: 09         ADD HL,BC
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0011-SEMANTICS.

#### SUB-SND-R0012 - COD-SND-R0012 @ SND:0205
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0205; static hint=sound-CPU logic; explicit memory refs=3; I/O refs=0; outgoing direct flow refs=7.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0012-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0205: 3A1080     LD A,($8010)
0208: CB7F       BIT 7,A
020A: CAAA0A     JP Z,$0AAA
020D: FE00       CP $00
020F: C21902     JP NZ,$0219
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0012-SEMANTICS.

#### SUB-SND-R0013 - COD-SND-R0013 @ SND:0700
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0700; static hint=sound-CPU logic; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=1.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0013-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0700: DD5E03     LD E,(IX+3)
0703: DD5604     LD D,(IX+4)
0706: 13         INC DE
0707: DD7303     LD (IX+3),E
070A: DD7204     LD (IX+4),D
070D: DD6E05     LD IXL,(IX+5)
0710: DD6606     LD IXH,(IX+6)
0713: B7         OR A
0714: ED52       SBC HL,DE
0716: CC8608     CALL Z,$0886
0719: DDCB0346   BIT 0,(IX+3)
071D: C0         RET NZ
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0013-SEMANTICS.

#### SUB-SND-R0014 - COD-SND-R0014 @ SND:0886
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0886; static hint=sound-CPU logic; explicit memory refs=2; I/O refs=0; outgoing direct flow refs=7.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0014-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0886: DD5E07     LD E,(IX+7)
0889: DD5608     LD D,(IX+8)
088C: 1A         LD A,(DE)
088D: 13         INC DE
088E: B7         OR A
088F: FA0B09     JP M,$090B
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0014-SEMANTICS.

#### SUB-SND-R0015 - COD-SND-R0015 @ SND:0ACB
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0ACB; static hint=sound-CPU logic; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=0.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0015-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0ACB: 21E20A     LD HL,$0AE2
0ACE: 1100C0     LD DE,$C000
0AD1: 010400     LD BC,$0004
0AD4: EDB0       LDIR
0AD6: 21E20A     LD HL,$0AE2
0AD9: 1100A0     LD DE,$A000
0ADC: 010400     LD BC,$0004
0ADF: EDB0       LDIR
0AE1: C9         RET
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0015-SEMANTICS.

#### SUB-SND-R0016 - COD-SND-R0016 @ SND:0B84
**Static role hint:** sound-CPU logic  
**Evidence:** DIRECT-CALL-OR-VECTOR  
**What is known:** Entry=SND:0B84; static hint=sound-CPU logic; explicit memory refs=0; I/O refs=0; outgoing direct flow refs=3.  
**What must be filled:** Runtime semantic purpose; true inputs/outputs; registers/flags preserved; indirect/table accesses; work-RAM variable meanings; complete call/return conditions; exact math if gameplay-relevant.  
**Fill index:** `FILL-SND-R0016-SEMANTICS`

**Why this code snippet is included:** This entry snippet exists to let a learner verify the routine boundary and inspect the first control/data actions directly from decoded ROM bytes. It is deliberately short so it teaches evidence without implying that the first instructions reveal the whole routine.
```text
0B84: 1600       LD D,$00
0B86: 6A         LD L,D
0B87: 0608       LD B,$08
0B89: 29         ADD HL,HL
0B8A: 3001       JR NC,$0B8D
```
**What the snippet proves:** Proves only the shown instruction bytes/decodes and their direct static references under the recorded region/bank interpretation. Hardware touchpoints listed here are explicit dereferences or I/O, not guessed semantics.  
**What it does not prove:** Does not prove the gameplay meaning, register calling convention, indirect memory use, runtime bank selection, frequency of execution, or complete exit behavior. Those missing facts are indexed by FILL-SND-R0016-SEMANTICS.

### 25.8 Fill-required index
`audit/fill_required_registry.csv` is the authoritative backlog for semantic/code/math gaps introduced by this expansion. A fill item is complete only when its `done_when` condition is met and its linked verification test passes; prose confidence is not enough.

| Fill ID | Parent | Area | Priority |
| --- | --- | --- | --- |
| FILL-AUDIO-COMMAND-TABLE | TABLE-AUDIO-CMD-001 | TABLE | HIGH |
| FILL-ENEMY-TABLES | TABLE-ENEMY-PARAM-001 | TABLE | HIGH |
| FILL-MAIN-B0-R0000-SEMANTICS | SUB-MAIN-B0-R0000 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B0-R0001-SEMANTICS | SUB-MAIN-B0-R0001 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B0-R0002-SEMANTICS | SUB-MAIN-B0-R0002 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B0-R0003-SEMANTICS | SUB-MAIN-B0-R0003 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B1-R0000-SEMANTICS | SUB-MAIN-B1-R0000 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B1-R0001-SEMANTICS | SUB-MAIN-B1-R0001 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B1-R0002-SEMANTICS | SUB-MAIN-B1-R0002 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B1-R0003-SEMANTICS | SUB-MAIN-B1-R0003 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B2-R0000-SEMANTICS | SUB-MAIN-B2-R0000 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B2-R0001-SEMANTICS | SUB-MAIN-B2-R0001 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B2-R0002-SEMANTICS | SUB-MAIN-B2-R0002 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B2-R0003-SEMANTICS | SUB-MAIN-B2-R0003 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0000-SEMANTICS | SUB-MAIN-B3-R0000 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0001-SEMANTICS | SUB-MAIN-B3-R0001 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0002-SEMANTICS | SUB-MAIN-B3-R0002 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0003-SEMANTICS | SUB-MAIN-B3-R0003 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0004-SEMANTICS | SUB-MAIN-B3-R0004 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0005-SEMANTICS | SUB-MAIN-B3-R0005 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0006-SEMANTICS | SUB-MAIN-B3-R0006 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0007-SEMANTICS | SUB-MAIN-B3-R0007 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0008-SEMANTICS | SUB-MAIN-B3-R0008 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0009-SEMANTICS | SUB-MAIN-B3-R0009 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0010-SEMANTICS | SUB-MAIN-B3-R0010 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0011-SEMANTICS | SUB-MAIN-B3-R0011 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0012-SEMANTICS | SUB-MAIN-B3-R0012 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0013-SEMANTICS | SUB-MAIN-B3-R0013 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0014-SEMANTICS | SUB-MAIN-B3-R0014 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0015-SEMANTICS | SUB-MAIN-B3-R0015 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0016-SEMANTICS | SUB-MAIN-B3-R0016 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0017-SEMANTICS | SUB-MAIN-B3-R0017 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0018-SEMANTICS | SUB-MAIN-B3-R0018 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0019-SEMANTICS | SUB-MAIN-B3-R0019 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0020-SEMANTICS | SUB-MAIN-B3-R0020 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0021-SEMANTICS | SUB-MAIN-B3-R0021 | SUBROUTINE | UNRANKED |
| FILL-MAIN-B3-R0022-SEMANTICS | SUB-MAIN-B3-R0022 | SUBROUTINE | UNRANKED |
| FILL-MAIN-F-R0000-SEMANTICS | SUB-MAIN-F-R0000 | SUBROUTINE | UNRANKED |
| FILL-MAIN-F-R0001-SEMANTICS | SUB-MAIN-F-R0001 | SUBROUTINE | UNRANKED |
| FILL-MAIN-F-R0002-SEMANTICS | SUB-MAIN-F-R0002 | SUBROUTINE | UNRANKED |
| FILL-MAIN-F-R0003-SEMANTICS | SUB-MAIN-F-R0003 | SUBROUTINE | UNRANKED |
| FILL-MAIN-F-R0004-SEMANTICS | SUB-MAIN-F-R0004 | SUBROUTINE | UNRANKED |
| FILL-MAIN-F-R0005-SEMANTICS | SUB-MAIN-F-R0005 | SUBROUTINE | UNRANKED |
| FILL-MAIN-F-R0006-SEMANTICS | SUB-MAIN-F-R0006 | SUBROUTINE | UNRANKED |
| FILL-MAIN-F-R0007-SEMANTICS | SUB-MAIN-F-R0007 | SUBROUTINE | UNRANKED |
| FILL-MAIN-F-R0008-SEMANTICS | SUB-MAIN-F-R0008 | SUBROUTINE | UNRANKED |
| FILL-MAIN-F-R0009-SEMANTICS | SUB-MAIN-F-R0009 | SUBROUTINE | UNRANKED |
| FILL-MAIN-F-R0010-SEMANTICS | SUB-MAIN-F-R0010 | SUBROUTINE | UNRANKED |
| FILL-MAIN-F-R0011-SEMANTICS | SUB-MAIN-F-R0011 | SUBROUTINE | UNRANKED |
| FILL-MAIN-F-R0012-SEMANTICS | SUB-MAIN-F-R0012 | SUBROUTINE | UNRANKED |
| FILL-MAIN-F-R0013-SEMANTICS | SUB-MAIN-F-R0013 | SUBROUTINE | UNRANKED |
| FILL-MATH-COLLISION-ORDER | MATH-COLLISION-ORDER-001 | MATH | HIGH |
| FILL-MATH-ENEMY-TIMERS | MATH-ENEMY-TIMERS-001 | MATH | HIGH |
| FILL-MATH-FUEL-DRAIN | MATH-FUEL-DRAIN-001 | MATH | HIGH |
| FILL-MATH-FUEL-REFILL | MATH-FUEL-REFILL-001 | MATH | HIGH |
| FILL-MATH-HELI-SPEED-CLAMP | MATH-HELI-SPEED-CLAMP-001 | MATH | HIGH |
| FILL-MATH-HELI-X-ACCEL | MATH-HELI-X-ACCEL-001 | MATH | HIGH |
| FILL-MATH-HELI-Y-ACCEL | MATH-HELI-Y-ACCEL-001 | MATH | HIGH |
| FILL-MATH-INPUT-SAMPLE | MATH-INPUT-SAMPLE-001 | MATH | HIGH |
| FILL-MATH-PROJECTILE-PRIMARY | MATH-PROJECTILE-PRIMARY-001 | MATH | HIGH |
| FILL-MATH-PROJECTILE-SECONDARY | MATH-PROJECTILE-SECONDARY-001 | MATH | HIGH |
| FILL-MATH-RNG-NEXT | MATH-RNG-NEXT-001 | MATH | HIGH |
| FILL-MATH-SCORE-EVENTS | MATH-SCORE-EVENTS-001 | MATH | HIGH |
| FILL-MATH-STAGE-COMPLETE | MATH-STAGE-COMPLETE-001 | MATH | HIGH |
| FILL-SCORE-TABLE | TABLE-SCORE-001 | TABLE | HIGH |
| FILL-SND-R0000-SEMANTICS | SUB-SND-R0000 | SUBROUTINE | UNRANKED |
| FILL-SND-R0001-SEMANTICS | SUB-SND-R0001 | SUBROUTINE | UNRANKED |
| FILL-SND-R0002-SEMANTICS | SUB-SND-R0002 | SUBROUTINE | UNRANKED |
| FILL-SND-R0003-SEMANTICS | SUB-SND-R0003 | SUBROUTINE | UNRANKED |
| FILL-SND-R0004-SEMANTICS | SUB-SND-R0004 | SUBROUTINE | UNRANKED |
| FILL-SND-R0005-SEMANTICS | SUB-SND-R0005 | SUBROUTINE | UNRANKED |
| FILL-SND-R0006-SEMANTICS | SUB-SND-R0006 | SUBROUTINE | UNRANKED |
| FILL-SND-R0007-SEMANTICS | SUB-SND-R0007 | SUBROUTINE | UNRANKED |
| FILL-SND-R0008-SEMANTICS | SUB-SND-R0008 | SUBROUTINE | UNRANKED |
| FILL-SND-R0009-SEMANTICS | SUB-SND-R0009 | SUBROUTINE | UNRANKED |
| FILL-SND-R0010-SEMANTICS | SUB-SND-R0010 | SUBROUTINE | UNRANKED |
| FILL-SND-R0011-SEMANTICS | SUB-SND-R0011 | SUBROUTINE | UNRANKED |
| FILL-SND-R0012-SEMANTICS | SUB-SND-R0012 | SUBROUTINE | UNRANKED |
| FILL-SND-R0013-SEMANTICS | SUB-SND-R0013 | SUBROUTINE | UNRANKED |
| FILL-SND-R0014-SEMANTICS | SUB-SND-R0014 | SUBROUTINE | UNRANKED |
| FILL-SND-R0015-SEMANTICS | SUB-SND-R0015 | SUBROUTINE | UNRANKED |
| FILL-SND-R0016-SEMANTICS | SUB-SND-R0016 | SUBROUTINE | UNRANKED |
| FILL-SPR-RUNTIME-DESCRIPTORS | TABLE-SPR-STATIC-SEQ-001 | TABLE | HIGH |
| FILL-TIMING-CYCLE-PHASE | MATH-CYCLES-FRAME-EST-001 | MATH | HIGH |

#### 25.8.1 Fill-item teaching records
Each record below states exactly what is missing, why it cannot be guessed, how to obtain the missing evidence, the linked experiment/test/task IDs, and the objective completion condition.

##### FILL-AUDIO-COMMAND-TABLE
**Parent:** `TABLE-AUDIO-CMD-001`  
**Area:** TABLE  
**Priority:** HIGH  
**Missing:** Complete semantic table entries/meaning.  
**How to fill it:** Trace accesses/writes while isolating the related gameplay/audio behavior; correlate address/index/value with observable event.  
**Unknown IDs:** UNK-AUDIO-COMMANDS  
**Experiment IDs:** EXP-AUDIO-COMMAND-TABLE-001  
**Verification tests:** TST-AUDIO-EVENTS  
**Blocks tasks:** IMP-090  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** Every required entry has stable semantic ID, evidence, and test vectors.

##### FILL-ENEMY-TABLES
**Parent:** `TABLE-ENEMY-PARAM-001`  
**Area:** TABLE  
**Priority:** HIGH  
**Missing:** Complete semantic table entries/meaning.  
**How to fill it:** Trace accesses/writes while isolating the related gameplay/audio behavior; correlate address/index/value with observable event.  
**Unknown IDs:** UNK-AI-ARCHETYPES  
**Experiment IDs:** EXP-ENEMY-TABLES-001  
**Verification tests:** TST-AI-ARCHETYPES  
**Blocks tasks:** IMP-071  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** Every required entry has stable semantic ID, evidence, and test vectors.

##### FILL-MAIN-B0-R0000-SEMANTICS
**Parent:** `SUB-MAIN-B0-R0000`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B0:8000 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B0-R0000-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B0-R0000-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B0-R0001-SEMANTICS
**Parent:** `SUB-MAIN-B0-R0001`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B0:80A8 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B0-R0001-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B0-R0001-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B0-R0002-SEMANTICS
**Parent:** `SUB-MAIN-B0-R0002`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B0:9400 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B0-R0002-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B0-R0002-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B0-R0003-SEMANTICS
**Parent:** `SUB-MAIN-B0-R0003`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B0:A000 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  **Unknown IDs:** UNK-MAIN-B0-R0003-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B0-R0003-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B1-R0000-SEMANTICS
**Parent:** `SUB-MAIN-B1-R0000`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B1:8000 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B1-R0000-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B1-R0000-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B1-R0001-SEMANTICS
**Parent:** `SUB-MAIN-B1-R0001`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B1:80A8 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B1-R0001-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B1-R0001-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B1-R0002-SEMANTICS
**Parent:** `SUB-MAIN-B1-R0002`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B1:9400 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B1-R0002-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B1-R0002-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B1-R0003-SEMANTICS
**Parent:** `SUB-MAIN-B1-R0003`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B1:A000 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B1-R0003-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B1-R0003-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B2-R0000-SEMANTICS
**Parent:** `SUB-MAIN-B2-R0000`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B2:8000 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B2-R0000-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B2-R0000-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B2-R0001-SEMANTICS
**Parent:** `SUB-MAIN-B2-R0001`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B2:80A8 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B2-R0001-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B2-R0001-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B2-R0002-SEMANTICS
**Parent:** `SUB-MAIN-B2-R0002`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B2:9400 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B2-R0002-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B2-R0002-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B2-R0003-SEMANTICS
**Parent:** `SUB-MAIN-B2-R0003`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B2:A000 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B2-R0003-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B2-R0003-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0000-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0000`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:8000 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0000-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0000-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0001-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0001`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:80A8 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0001-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0001-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0002-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0002`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:812F with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0002-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0002-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0003-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0003`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:81AA with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0003-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0003-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0004-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0004`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:81BD with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0004-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0004-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0005-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0005`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:9400 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0005-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0005-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0006-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0006`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A000 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0006-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0006-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0007-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0007`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A013 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0007-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0007-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0008-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0008`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A030 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0008-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0008-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0009-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0009`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A064 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0009-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0009-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0010-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0010`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A070 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0010-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0010-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0011-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0011`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A0DE with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0011-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0011-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0012-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0012`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A112 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0012-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0012-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0013-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0013`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A15C with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0013-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0013-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0014-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0014`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A1D7 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0014-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0014-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0015-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0015`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A1F7 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0015-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0015-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0016-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0016`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A203 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0016-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0016-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0017-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0017`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A244 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0017-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0017-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0018-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0018`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A24C with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0018-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0018-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0019-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0019`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A382 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0019-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0019-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0020-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0020`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A38A with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0020-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0020-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0021-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0021`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A392 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0021-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0021-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-B3-R0022-SEMANTICS
**Parent:** `SUB-MAIN-B3-R0022`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-B3:A398 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-B3-R0022-SEMANTICS  
**Experiment IDs:** EXP-MAIN-B3-R0022-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-F-R0000-SEMANTICS
**Parent:** `SUB-MAIN-F-R0000`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-F:0000 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-F-R0000-SEMANTICS  
**Experiment IDs:** EXP-MAIN-F-R0000-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-F-R0001-SEMANTICS
**Parent:** `SUB-MAIN-F-R0001`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-F:0008 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-F-R0001-SEMANTICS  
**Experiment IDs:** EXP-MAIN-F-R0001-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-F-R0002-SEMANTICS
**Parent:** `SUB-MAIN-F-R0002`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-F:0010 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-F-R0002-SEMANTICS  
**Experiment IDs:** EXP-MAIN-F-R0002-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-F-R0003-SEMANTICS
**Parent:** `SUB-MAIN-F-R0003`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-F:0018 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-F-R0003-SEMANTICS  
**Experiment IDs:** EXP-MAIN-F-R0003-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-F-R0004-SEMANTICS
**Parent:** `SUB-MAIN-F-R0004`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-F:0020 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-F-R0004-SEMANTICS  
**Experiment IDs:** EXP-MAIN-F-R0004-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-F-R0005-SEMANTICS
**Parent:** `SUB-MAIN-F-R0005`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-F:0028 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-F-R0005-SEMANTICS  
**Experiment IDs:** EXP-MAIN-F-R0005-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-F-R0006-SEMANTICS
**Parent:** `SUB-MAIN-F-R0006`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-F:0030 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-F-R0006-SEMANTICS  
**Experiment IDs:** EXP-MAIN-F-R0006-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-F-R0007-SEMANTICS
**Parent:** `SUB-MAIN-F-R0007`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-F:0038 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-F-R0007-SEMANTICS  
**Experiment IDs:** EXP-MAIN-F-R0007-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-F-R0008-SEMANTICS
**Parent:** `SUB-MAIN-F-R0008`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-F:0066 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-F-R0008-SEMANTICS  
**Experiment IDs:** EXP-MAIN-F-R0008-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-F-R0009-SEMANTICS
**Parent:** `SUB-MAIN-F-R0009`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-F:016E with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-F-R0009-SEMANTICS  
**Experiment IDs:** EXP-MAIN-F-R0009-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-F-R0010-SEMANTICS
**Parent:** `SUB-MAIN-F-R0010`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-F:02E2 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-F-R0010-SEMANTICS  
**Experiment IDs:** EXP-MAIN-F-R0010-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-F-R0011-SEMANTICS
**Parent:** `SUB-MAIN-F-R0011`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-F:05D2 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-F-R0011-SEMANTICS  
**Experiment IDs:** EXP-MAIN-F-R0011-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-F-R0012-SEMANTICS
**Parent:** `SUB-MAIN-F-R0012`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-F:07F6 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-F-R0012-SEMANTICS  
**Experiment IDs:** EXP-MAIN-F-R0012-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MAIN-F-R0013-SEMANTICS
**Parent:** `SUB-MAIN-F-R0013`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint MAIN-F:751B with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-MAIN-F-R0013-SEMANTICS  
**Experiment IDs:** EXP-MAIN-F-R0013-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-MATH-COLLISION-ORDER
**Parent:** `MATH-COLLISION-ORDER-001`  
**Area:** MATH  
**Priority:** HIGH  
**Missing:** Original collision resolution/slot ordering behavior  
**How to fill it:** Frame/cycle trace controlled input scenarios; identify relevant RAM/code updates; fit integer rule; validate against held-out replay traces.  
**Unknown IDs:** UNK-COLLISION-ORDER-001  
**Experiment IDs:** EXP-MATH-COLLISION-ORDER-001  
**Verification tests:** TST-COLLISION-ORDER  
**Blocks tasks:** IMP-051  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** One explicit formula/table reproduces multiple traces exactly and is linked to code/variable/test IDs.

##### FILL-MATH-ENEMY-TIMERS
**Parent:** `MATH-ENEMY-TIMERS-001`  
**Area:** MATH  
**Priority:** HIGH  
**Missing:** Enemy spawn/fire/movement timing equations  
**How to fill it:** Frame/cycle trace controlled input scenarios; identify relevant RAM/code updates; fit integer rule; validate against held-out replay traces.  
**Unknown IDs:** UNK-TIME-ENEMY-TIMERS  
**Experiment IDs:** EXP-MATH-ENEMY-TIMERS-001  
**Verification tests:** TST-AI-ARCHETYPES  
**Blocks tasks:** IMP-071  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** One explicit formula/table reproduces multiple traces exactly and is linked to code/variable/test IDs.

##### FILL-MATH-FUEL-DRAIN
**Parent:** `MATH-FUEL-DRAIN-001`  
**Area:** MATH  
**Priority:** HIGH  
**Missing:** Fuel drain update and warning thresholds  
**How to fill it:** Frame/cycle trace controlled input scenarios; identify relevant RAM/code updates; fit integer rule; validate against held-out replay traces.  
**Unknown IDs:** UNK-TIME-FUEL  
**Experiment IDs:** EXP-MATH-FUEL-DRAIN-001  
**Verification tests:** TST-FUEL-TRACE  
**Blocks tasks:** IMP-061  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** One explicit formula/table reproduces multiple traces exactly and is linked to code/variable/test IDs.

##### FILL-MATH-FUEL-REFILL
**Parent:** `MATH-FUEL-REFILL-001`  
**Area:** MATH  
**Priority:** HIGH  
**Missing:** Fuel refill per rescue/delivery behavior  
**How to fill it:** Frame/cycle trace controlled input scenarios; identify relevant RAM/code updates; fit integer rule; validate against held-out replay traces.  
**Unknown IDs:** UNK-TIME-FUEL  
**Experiment IDs:** EXP-MATH-FUEL-REFILL-001  
**Verification tests:** TST-FUEL-TRACE  
**Blocks tasks:** IMP-061  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** One explicit formula/table reproduces multiple traces exactly and is linked to code/variable/test IDs.

##### FILL-MATH-HELI-SPEED-CLAMP
**Parent:** `MATH-HELI-SPEED-CLAMP-001`  
**Area:** MATH  
**Priority:** HIGH  
**Missing:** Helicopter maximum speed/clamp/wrap behavior  
**How to fill it:** Frame/cycle trace controlled input scenarios; identify relevant RAM/code updates; fit integer rule; validate against held-out replay traces.  
**Unknown IDs:** UNK-TIME-HELI-ACCEL  
**Experiment IDs:** EXP-MATH-HELI-SPEED-CLAMP-001  
**Verification tests:** TST-HELI-TRACE  
**Blocks tasks:** IMP-040  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** One explicit formula/table reproduces multiple traces exactly and is linked to code/variable/test IDs.

##### FILL-MATH-HELI-X-ACCEL
**Parent:** `MATH-HELI-X-ACCEL-001`  
**Area:** MATH  
**Priority:** HIGH  
**Missing:** Horizontal helicopter acceleration/deceleration equation  
**How to fill it:** Frame/cycle trace controlled input scenarios; identify relevant RAM/code updates; fit integer rule; validate against held-out replay traces.  
**Unknown IDs:** UNK-TIME-HELI-ACCEL  
**Experiment IDs:** EXP-MATH-HELI-X-ACCEL-001  
**Verification tests:** TST-HELI-TRACE  
**Blocks tasks:** IMP-040  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** One explicit formula/table reproduces multiple traces exactly and is linked to code/variable/test IDs.

##### FILL-MATH-HELI-Y-ACCEL
**Parent:** `MATH-HELI-Y-ACCEL-001`  
**Area:** MATH  
**Priority:** HIGH  
**Missing:** Vertical helicopter acceleration/deceleration equation  
**How to fill it:** Frame/cycle trace controlled input scenarios; identify relevant RAM/code updates; fit integer rule; validate against held-out replay traces.  
**Unknown IDs:** UNK-TIME-HELI-ACCEL  
**Experiment IDs:** EXP-MATH-HELI-Y-ACCEL-001  
**Verification tests:** TST-HELI-TRACE  
**Blocks tasks:** IMP-040  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** One explicit formula/table reproduces multiple traces exactly and is linked to code/variable/test IDs.

##### FILL-MATH-INPUT-SAMPLE
**Parent:** `MATH-INPUT-SAMPLE-001`  
**Area:** MATH  
**Priority:** HIGH  
**Missing:** Input sampling phase/frequency model  
**How to fill it:** Frame/cycle trace controlled input scenarios; identify relevant RAM/code updates; fit integer rule; validate against held-out replay traces.  
**Unknown IDs:** UNK-INPUT-SAMPLING-001  
**Experiment IDs:** EXP-MATH-INPUT-SAMPLE-001  
**Verification tests:** TST-INPUT-SAMPLING  
**Blocks tasks:** IMP-022  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** One explicit formula/table reproduces multiple traces exactly and is linked to code/variable/test IDs.

##### FILL-MATH-PROJECTILE-PRIMARY
**Parent:** `MATH-PROJECTILE-PRIMARY-001`  
**Area:** MATH  
**Priority:** HIGH  
**Missing:** Primary projectile spawn offset, velocity and cadence math  
**How to fill it:** Frame/cycle trace controlled input scenarios; identify relevant RAM/code updates; fit integer rule; validate against held-out replay traces.  
**Unknown IDs:** UNK-TIME-WEAPON-CADENCE  
**Experiment IDs:** EXP-MATH-PROJECTILE-PRIMARY-001  
**Verification tests:** TST-WPN-PRIMARY  
**Blocks tasks:** IMP-041  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** One explicit formula/table reproduces multiple traces exactly and is linked to code/variable/test IDs.

##### FILL-MATH-PROJECTILE-SECONDARY
**Parent:** `MATH-PROJECTILE-SECONDARY-001`  
**Area:** MATH  
**Priority:** HIGH  
**Missing:** Secondary/bomb trajectory and cadence math  
**How to fill it:** Frame/cycle trace controlled input scenarios; identify relevant RAM/code updates; fit integer rule; validate against held-out replay traces.  
**Unknown IDs:** UNK-TIME-WEAPON-CADENCE  
**Experiment IDs:** EXP-MATH-PROJECTILE-SECONDARY-001  
**Verification tests:** TST-WPN-SECONDARY  
**Blocks tasks:** IMP-041  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** One explicit formula/table reproduces multiple traces exactly and is linked to code/variable/test IDs.

##### FILL-MATH-RNG-NEXT
**Parent:** `MATH-RNG-NEXT-001`  
**Area:** MATH  
**Priority:** HIGH  
**Missing:** Original RNG/counter update function and seed  
**How to fill it:** Frame/cycle trace controlled input scenarios; identify relevant RAM/code updates; fit integer rule; validate against held-out replay traces.  
**Unknown IDs:** UNK-RNG-001  
**Experiment IDs:** EXP-MATH-RNG-NEXT-001  
**Verification tests:** TST-RNG-TRACE  
**Blocks tasks:** IMP-022;IMP-070  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** One explicit formula/table reproduces multiple traces exactly and is linked to code/variable/test IDs.

##### FILL-MATH-SCORE-EVENTS
**Parent:** `MATH-SCORE-EVENTS-001`  
**Area:** MATH  
**Priority:** HIGH  
**Missing:** Score delta equations/table per event  
**How to fill it:** Frame/cycle trace controlled input scenarios; identify relevant RAM/code updates; fit integer rule; validate against held-out replay traces.  
**Unknown IDs:** UNK-SCORE-EVENT-VALUES  
**Experiment IDs:** EXP-MATH-SCORE-EVENTS-001  
**Verification tests:** TST-SCORE-TABLE  
**Blocks tasks:** IMP-061  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** One explicit formula/table reproduces multiple traces exactly and is linked to code/variable/test IDs.

##### FILL-MATH-STAGE-COMPLETE
**Parent:** `MATH-STAGE-COMPLETE-001`  
**Area:** MATH  
**Priority:** HIGH  
**Missing:** Exact hostage completion threshold/bonus behavior  
**How to fill it:** Frame/cycle trace controlled input scenarios; identify relevant RAM/code updates; fit integer rule; validate against held-out replay traces.  
**Unknown IDs:** UNK-SCORE-STAGE-BONUS  
**Experiment IDs:** EXP-MATH-STAGE-COMPLETE-001  
**Verification tests:** TST-STAGE-COMPLETE  
**Blocks tasks:** IMP-080  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** One explicit formula/table reproduces multiple traces exactly and is linked to code/variable/test IDs.

##### FILL-SCORE-TABLE
**Parent:** `TABLE-SCORE-001`  
**Area:** TABLE  
**Priority:** HIGH  
**Missing:** Complete semantic table entries/meaning.  
**How to fill it:** Trace accesses/writes while isolating the related gameplay/audio behavior; correlate address/index/value with observable event.  
**Unknown IDs:** UNK-SCORE-EVENT-VALUES  
**Experiment IDs:** EXP-SCORE-TABLE-001  
**Verification tests:** TST-SCORE-TABLE  
**Blocks tasks:** IMP-061  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** Every required entry has stable semantic ID, evidence, and test vectors.

##### FILL-SND-R0000-SEMANTICS
**Parent:** `SUB-SND-R0000`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0000 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0000-SEMANTICS  
**Experiment IDs:** EXP-SND-R0000-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0001-SEMANTICS
**Parent:** `SUB-SND-R0001`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0008 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0001-SEMANTICS  
**Experiment IDs:** EXP-SND-R0001-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0002-SEMANTICS
**Parent:** `SUB-SND-R0002`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0010 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0002-SEMANTICS  
**Experiment IDs:** EXP-SND-R0002-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0003-SEMANTICS
**Parent:** `SUB-SND-R0003`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0018 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0003-SEMANTICS  
**Experiment IDs:** EXP-SND-R0003-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0004-SEMANTICS
**Parent:** `SUB-SND-R0004`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0020 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0004-SEMANTICS  
**Experiment IDs:** EXP-SND-R0004-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0005-SEMANTICS
**Parent:** `SUB-SND-R0005`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0028 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0005-SEMANTICS  
**Experiment IDs:** EXP-SND-R0005-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0006-SEMANTICS
**Parent:** `SUB-SND-R0006`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0030 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0006-SEMANTICS  
**Experiment IDs:** EXP-SND-R0006-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0007-SEMANTICS
**Parent:** `SUB-SND-R0007`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0038 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0007-SEMANTICS  
**Experiment IDs:** EXP-SND-R0007-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0008-SEMANTICS
**Parent:** `SUB-SND-R0008`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0066 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0008-SEMANTICS  
**Experiment IDs:** EXP-SND-R0008-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0009-SEMANTICS
**Parent:** `SUB-SND-R0009`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0139 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0009-SEMANTICS  
**Experiment IDs:** EXP-SND-R0009-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0010-SEMANTICS
**Parent:** `SUB-SND-R0010`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0196 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0010-SEMANTICS  
**Experiment IDs:** EXP-SND-R0010-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0011-SEMANTICS
**Parent:** `SUB-SND-R0011`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:01B0 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0011-SEMANTICS  
**Experiment IDs:** EXP-SND-R0011-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0012-SEMANTICS
**Parent:** `SUB-SND-R0012`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0205 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0012-SEMANTICS  
**Experiment IDs:** EXP-SND-R0012-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0013-SEMANTICS
**Parent:** `SUB-SND-R0013`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0700 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0013-SEMANTICS  
**Experiment IDs:** EXP-SND-R0013-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0014-SEMANTICS
**Parent:** `SUB-SND-R0014`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0886 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0014-SEMANTICS  
**Experiment IDs:** EXP-SND-R0014-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0015-SEMANTICS
**Parent:** `SUB-SND-R0015`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0ACB with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0015-SEMANTICS  
**Experiment IDs:** EXP-SND-R0015-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SND-R0016-SEMANTICS
**Parent:** `SUB-SND-R0016`  
**Area:** SUBROUTINE  
**Priority:** UNRANKED  
**Missing:** Semantic purpose, calling contract, runtime execution conditions, indirect/data-table dependencies and gameplay math.  
**How to fill it:** Breakpoint SND:0B84 with active-bank provenance; capture pre/post AF/BC/DE/HL/IX/IY/SP/flags, stack bytes, explicit RAM/I/O references, caller/callee PCs and scenario state in >=2 repeated occurrences.  
**Unknown IDs:** UNK-SND-R0016-SEMANTICS  
**Experiment IDs:** EXP-SND-R0016-TRACE  
**Verification tests:** TST-SUB-CONTRACT-CLOSURE  
**Blocks tasks:** IMP-006;IMP-034  
**Release-priority basis:** Promote based on runtime execution and strict requirement dependency, not CPU alone.  
**Done when:** Purpose and calling contract repeat; claimed memory/table/math effects are linked to stable IDs; TST-SUB-CONTRACT-CLOSURE passes.

##### FILL-SPR-RUNTIME-DESCRIPTORS
**Parent:** `TABLE-SPR-STATIC-SEQ-001`  
**Area:** TABLE  
**Priority:** HIGH  
**Missing:** Complete semantic table entries/meaning.  **How to fill it:** Trace accesses/writes while isolating the related gameplay/audio behavior; correlate address/index/value with observable event.  
**Unknown IDs:** UNK-SPR-SEMANTICS  
**Experiment IDs:** EXP-SPR-RUNTIME-DESCRIPTORS-001  
**Verification tests:** TST-SPRITE-DESCRIPTOR  
**Blocks tasks:** IMP-071;IMP-080  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** Every required entry has stable semantic ID, evidence, and test vectors.

##### FILL-TIMING-CYCLE-PHASE
**Parent:** `MATH-CYCLES-FRAME-EST-001`  
**Area:** MATH  
**Priority:** HIGH  
**Missing:** Exact cycle/phase/event timing relationship for original gameplay.  
**How to fill it:** Capture exact master seconds/attoseconds, frame identity, available CPU state and event ordering across controlled scenes. Record CPU-local cycles only when exposed by a documented or instrumented source; do not fabricate them.  
**Unknown IDs:** UNK-TIME-STAGE-PACING  
**Experiment IDs:** EXP-TIMING-CYCLE-PHASE-001  
**Verification tests:** TST-TIMING-CYCLE-PHASE  
**Blocks tasks:** IMP-040;IMP-071  
**Release-priority basis:** Based on strict gameplay/output dependency.  
**Done when:** Formula reproduces observed event timing, not merely average frame rate.

### 25.9 New registry files
```text
code_map/subroutine_teaching_registry.csv
code_map/code_snippet_registry.csv
teaching/math_registry.csv
teaching/constant_registry.csv
teaching/variable_registry.csv
teaching/table_registry.csv
audit/fill_required_registry.csv
audit/code_math_teaching_summary.json
```


## Part IX - CFG, data flow, runtime coverage, and evidence closure
v1.4 resolves the structural weaknesses found in the v1.3 audit. An **entry point is no longer treated as a proven subroutine body**. The Bible now models four separate layers: raw/decoded instruction evidence (`INS-*`), control-flow blocks (`BLK-*`), statically hypothesized function bodies (`FUNC-*`), and semantic teaching contracts (`SUB-*`). Runtime observation remains the authority that can confirm or correct a `FUNC-*` boundary or semantic name.

Teaching note: a large `FUNC-*` candidate does **not** mean the original programmers wrote one enormous source-language function. It means the static CFG can reach those blocks without crossing a known entry/call boundary. Large candidates are deliberately marked low-confidence until executed-PC traces, code/data classification, and indirect-flow evidence split or confirm them.

### 26.1 Corrected program-structure model
| Layer | Count | What it means | What it does not mean |
| --- | ---: | --- | --- |
| Static-seed-reachable instruction starts | 4,942 | Decodes reached from documented static seeds/direct flow under an explicit CPU/bank context. | Proof that the instruction executed in the arcade. |
| Basic blocks | 1,071 | Maximal straight-line regions split at entries and control-flow boundaries. | Canonical source-language functions. |
| Typed CFG edges | 5,627 | FALLTHROUGH, branches, calls, returns, indirect/terminal edges with target-resolution status. | Resolution of all indirect/table-driven flow. |
| Function candidates | 66 | CFG body hypotheses rooted at the 66 known entry candidates. | Proven semantic routines or calling conventions. |
| Static call edges | 413 | Context-aware CALL/RST relationships when a target entry can be resolved. | Runtime call frequency or bank selection. |

`code_map/function_candidate_registry.csv`, `function_block_membership.csv`, `function_instruction_membership.csv`, `cfg_edges.csv`, and `call_graph.csv` are the authoritative v1.4 static program-structure outputs. `subroutine_teaching_registry.csv` references a `FUNC-*` hypothesis instead of manufacturing a body from “entry to next entry.”

### 26.2 Architectural vector roles we can document now
For the fixed main Z80 and sound Z80, `$0000` is the reset entry; `$0008,$0010,...,$0038` are Z80 restart-vector locations; `$0038` is also the IM1 interrupt vector; and `$0066` is the NMI vector. These are **architectural roles**, not gameplay semantics. The `SUB-*` registry therefore has separate architectural-role, body-confidence, and runtime-semantic fields.

### 26.3 Instruction effects and calling-contract teaching
`code_map/instruction_effects.csv` records conservative per-instruction register/flag/stack effects. `function_dataflow_summary.csv` aggregates those facts as **possible** inputs/clobbers only. The Bible intentionally does not promote this static summary into a calling convention: shared blocks, indirect flow, alternate entries, interrupt behavior, and code/data ambiguity can invalidate a naive contract. `FILL-SUB-*` experiments capture registers, flags, stack bytes, bank state, RAM/I/O and callers/callees before a calling contract can become runtime evidence.

### 26.4 Hardware math newly filled from pinned System 2 evidence
The following formulas were fillable without guessing gameplay because the pinned System 2 implementation specifies them directly. Each formula states why it exists in `math_registry.csv`, and every evidence-backed formula is connected to its source and verification test.

| Math ID | Purpose | Formula |
| --- | --- | --- |
| `MATH-FLIP-SCREEN-001` | Flip-screen test | `flip = (video_mode & 0x80) != 0` |
| `MATH-MIX-COLLISION-INDEX-001` | Mixer collision index | `index = ((lookup_value & 8) << 2) \| sprite_slot` |
| `MATH-SPR-BANK-MOD-001` | Sprite bank clamp | `bank = bank_bits % gfxbanks` |
| `MATH-SPR-COLLISION-INDEX-001` | Sprite-pair collision index | `index = previous_sprite_slot + 32 * current_sprite_slot` |
| `MATH-SPR-DIRECTION-001` | Sprite byte traversal direction | `addrdelta = -1 if (srcaddr & 0x8000) else +1` |
| `MATH-SPR-FLIP-X-001` | Flipped sprite X | `effx = 0x1FE - x_component` |
| `MATH-SPR-FLIP-Y-001` | Flipped sprite vertical bounds | `top2 = 256 - bottom; bottom2 = 256 - top` |
| `MATH-SPR-HEIGHT-001` | Sprite row count | `height = bottom - top` |
| `MATH-SPR-NIBBLE-ORDER-001` | Sprite nibble order | `if bit15=0: color1=byte>>4,color2=byte&0xF; else reversed` |
| `MATH-SPR-X-STEP-001` | Sprite horizontal byte step | `x_next = x + 4` |
| `MATH-SPR-Y-BOTTOM-001` | Sprite bottom Y | `bottom = byte1 + 1` |
| `MATH-SPR-Y-TOP-001` | Sprite top Y | `top = byte0 + 1` |
| `MATH-SYS2-BGX-001` | Background source X | `bgx = ((screen_x - row_scroll) / 2) & 0x1FF` |
| `MATH-SYS2-BGY-001` | Background source Y | `bgy = (screen_y + bgyscroll) & 0x1FF` |
| `MATH-SYS2-PAGESEL-001` | System 2 background page selection | `page[i] = videoram[0x740 + 2*i] & 7, i=0..3` |
| `MATH-SYS2-ROWSCROLL-001` | Choplifter row-scroll decode | `raw = vram[0x7C0+2*r] \| (vram[0x7C1+2*r] << 8); rowscroll[r] = (raw & 0x1FF) - 512 + 10` |
| `MATH-SYS2-YSCROLL-001` | System 2 non-flipped Y scroll | `yscroll = videoram[0x7BA]` |
| `MATH-VIDEO-BLANK-001` | Video blank test | `blank = (video_mode & 0x10) != 0` |
| `MATH-VIDEORAM-BANK-001` | Video RAM banked-window address | `effective_offset = offset \| (0x1000 * ((videoram_bank >> 1) % (tilemap_pages / 2)))` |

**Why these formulas are here:** they define observable hardware behavior needed by the strict renderer/capture importer. They are not tuning suggestions. Their source is the pinned `SRC-002` hardware implementation and their verification gates are registered tests.

### 26.5 Work RAM: raw identity before semantic naming
v1.4 creates **6,144 raw RAM identities** across the main CPU work-RAM window and sound RAM. `ram_symbol_registry.csv` records static reader/writer instruction IDs but starts every semantic alias as unresolved. A byte becomes a semantic variable only after controlled runtime correlation.

### 26.6 Static plausibility versus runtime execution
`code_map/runtime_execution_registry.csv` is a coverage ledger for every static-seed-reachable instruction start. Initial status is `UNOBSERVED`. Runtime import updates execution count, first/last frame, stages, states, bank contexts and trace IDs. This gives the project three explicit evidence states: **raw bytes**, **static plausible code**, and **runtime executed code**.

`code_map/code_data_evidence_map.csv` also classifies every program byte as static-code candidate, printable-string candidate, ambiguous code/string, or unclassified code/data until runtime evidence promotes it. This prevents exhaustive linear disassembly from silently turning all ROM data into “code.”

### 26.7 `FILL-*` is now connected to the project graph
All **84 fill records** now link to an `UNK-*`, an `EXP-*` experiment plan, verification test IDs, and blocking implementation task IDs. The experiment registry contains **84 plans**. Subroutine experiments specify the entry PC, required register/stack/RAM/I/O capture, controlled comparisons, repeatability rule and objective completion condition.

A `FILL-*` status may change from OPEN only when its `done_when` condition is satisfied and its linked verification test passes. Runtime execution can also lower a routine fill to research-only if the entry never appears in strict-required scenarios; priority is no longer derived simply from “main CPU versus sound CPU.”

### 26.8 Formula/variable/constant/table traceability
Known formulas are first-class graph nodes. A formula can `USES` input variables, `USES-CONSTANT` fixed values, `PRODUCES` derived values, be `DERIVED-FROM` a source, `VERIFIED-BY` a test, `IMPLEMENTED-BY` an Unreal component, and `TAUGHT-BY` a lesson. Tables identify concrete data files, hashes and entry counts where an immutable artifact exists.

### 26.9 Runtime experiment coverage and information gain
Every experiment row has fields for newly observed instructions, function candidates, RAM addresses, audio events and trace IDs. As traces are imported, the controller can rank future experiments by information gain instead of repeating already-covered behavior.

### 26.10 New v1.4 tests and teaching work
The engineering matrix now contains **55 tests**, the curriculum contains **38 lessons** and **33 labs**. New lessons/labs cover CFG construction, register def/use, code-versus-data evidence, arithmetic masks/wraparound, formula-to-test traceability, RAM discovery and closing a `FILL-*` record.

**New lesson IDs:** `LES-CODE-003`, `LES-CODE-004`, `LES-CODE-005`, `LES-MATH-001`, `LES-MATH-002`, `LES-MATH-003`, `LES-RAM-001`, `LES-FILL-001`

**New lab IDs:** `LAB-CFG-001`, `LAB-REG-001`, `LAB-CODEDATA-001`, `LAB-MATH-001`, `LAB-MATH-002`, `LAB-MATH-TRACE-001`, `LAB-RAM-001`, `LAB-FILL-001`

### 26.11 Derived-artifact parity is a release gate
`TST-DB-PARITY`, `TST-EXPLORER-CURRENT`, and `TST-VERSION-CONSISTENCY` exist because v1.3 proved that a correct CSV authority can coexist with stale SQLite/explorer/version artifacts. In v1.4, the evidence database and explorer are generated after the final patch layer and must exactly match the master ID/relation sets and package metadata before release.

### 26.12 What still must be filled
Hardware-format math is substantially more complete, but **13 gameplay equations remain explicitly unresolved**. AI/physics/fuel/scoring/RNG/input sampling/collision ordering and semantic routine purposes still require runtime evidence. Their formulas remain `UNRESOLVED - DO NOT GUESS`; their exact experiments/tests/tasks are indexed rather than implied.


## Appendix A - Routine candidate index
Routine hardware touchpoints are now conservative explicit-dereference/I/O hints, not semantic names.

| Routine ID | Region | Entry | Static touchpoints | Evidence |
| --- | --- | --- | --- | --- |
| COD-MAIN-F-R0000 | MAIN-F | 0000 | PORT-PPI-B | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-F-R0001 | MAIN-F | 0008 |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-F-R0002 | MAIN-F | 0010 | PORT-PPI-B | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-F-R0003 | MAIN-F | 0018 | PORT-PPI-B | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-F-R0004 | MAIN-F | 0020 |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-F-R0005 | MAIN-F | 0028 |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-F-R0006 | MAIN-F | 0030 |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-F-R0007 | MAIN-F | 0038 |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-F-R0008 | MAIN-F | 0066 | MEM-WORK-RAM | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-F-R0009 | MAIN-F | 016E |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-F-R0010 | MAIN-F | 02E2 |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-F-R0011 | MAIN-F | 05D2 | MEM-WORK-RAM;MEM-PALETTE-RAM | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-F-R0012 | MAIN-F | 07F6 |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-F-R0013 | MAIN-F | 751B | MEM-ROM-FIXED | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B0-R0000 | MAIN-B0 | 8000 |  | BANK-SEED |
| COD-MAIN-B0-R0001 | MAIN-B0 | 80A8 |  | BANK-SEED |
| COD-MAIN-B0-R0002 | MAIN-B0 | 9400 |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B0-R0003 | MAIN-B0 | A000 | MEM-ROM-FIXED | BANK-SEED |
| COD-MAIN-B1-R0000 | MAIN-B1 | 8000 |  | BANK-SEED |
| COD-MAIN-B1-R0001 | MAIN-B1 | 80A8 |  | BANK-SEED |
| COD-MAIN-B1-R0002 | MAIN-B1 | 9400 |  | BANK-SEED |
| COD-MAIN-B1-R0003 | MAIN-B1 | A000 | MEM-ROM-FIXED | BANK-SEED |
| COD-MAIN-B2-R0000 | MAIN-B2 | 8000 |  | BANK-SEED |
| COD-MAIN-B2-R0001 | MAIN-B2 | 80A8 |  | BANK-SEED |
| COD-MAIN-B2-R0002 | MAIN-B2 | 9400 | MEM-ROM-FIXED | BANK-SEED |
| COD-MAIN-B2-R0003 | MAIN-B2 | A000 | MEM-ROM-FIXED | BANK-SEED |
| COD-MAIN-B3-R0000 | MAIN-B3 | 8000 | MEM-WORK-RAM;PORT-PPI-B;PORT-DIP-SWA;PORT-DIP-SWB-A | BANK-SEED |
| COD-MAIN-B3-R0001 | MAIN-B3 | 80A8 | MEM-WORK-RAM;PORT-SYSTEM | BANK-SEED |
| COD-MAIN-B3-R0002 | MAIN-B3 | 812F |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0003 | MAIN-B3 | 81AA | MEM-WORK-RAM;PORT-PPI-A | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0004 | MAIN-B3 | 81BD |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0005 | MAIN-B3 | 9400 | MEM-VIDEO-RAM-WINDOW;MEM-PALETTE-RAM | BANK-SEED |
| COD-MAIN-B3-R0006 | MAIN-B3 | A000 | PORT-PPI-A | BANK-SEED |
| COD-MAIN-B3-R0007 | MAIN-B3 | A013 | PORT-DIP-SWA | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0008 | MAIN-B3 | A030 | PORT-DIP-SWA | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0009 | MAIN-B3 | A064 |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0010 | MAIN-B3 | A070 | PORT-SYSTEM | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0011 | MAIN-B3 | A0DE | PORT-PPI-C | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0012 | MAIN-B3 | A112 | PORT-PPI-C;PORT-PPI-A | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0013 | MAIN-B3 | A15C |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0014 | MAIN-B3 | A1D7 |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0015 | MAIN-B3 | A1F7 |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0016 | MAIN-B3 | A203 | MEM-PALETTE-RAM | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0017 | MAIN-B3 | A244 |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0018 | MAIN-B3 | A24C |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0019 | MAIN-B3 | A382 | PORT-PPI-B | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0020 | MAIN-B3 | A38A | PORT-PPI-B | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0021 | MAIN-B3 | A392 |  | DIRECT-CALL-OR-VECTOR |
| COD-MAIN-B3-R0022 | MAIN-B3 | A398 |  | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0000 | SND | 0000 |  | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0001 | SND | 0008 |  | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0002 | SND | 0010 |  | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0003 | SND | 0018 |  | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0004 | SND | 0020 |  | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0005 | SND | 0028 |  | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0006 | SND | 0030 |  | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0007 | SND | 0038 |  | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0008 | SND | 0066 | MEM-SND-LATCH;MEM-SND-RAM | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0009 | SND | 0139 |  | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0010 | SND | 0196 | MEM-SND-RAM | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0011 | SND | 01B0 | MEM-SND-RAM | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0012 | SND | 0205 | MEM-SND-RAM | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0013 | SND | 0700 |  | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0014 | SND | 0886 |  | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0015 | SND | 0ACB |  | DIRECT-CALL-OR-VECTOR |
| COD-SND-R0016 | SND | 0B84 |  | DIRECT-CALL-OR-VECTOR |

## Appendix B - Stage registry

| Stage ID | Order | Theme | Data Asset | Status | Notes |
| --- | --- | --- | --- | --- | --- |
| STG-01 | 1 | Desert | DA_Stage_01 | NEEDS-RUNTIME-CAPTURE | Theme from secondary arcade documentation; exact data not yet captured. |
| STG-02 | 2 | Sea | DA_Stage_02 | NEEDS-RUNTIME-CAPTURE | Theme from secondary arcade documentation; exact data not yet captured. |
| STG-03 | 3 | Caverns | DA_Stage_03 | NEEDS-RUNTIME-CAPTURE | Theme from secondary arcade documentation; exact data not yet captured. |
| STG-04 | 4 | City rooftops | DA_Stage_04 | NEEDS-RUNTIME-CAPTURE | Theme from secondary arcade documentation; exact data not yet captured. |

## Appendix C - Current package map
```text
Chopper_Game_v1_9/
  Chopper_Game_Bible.md / .html
  Chopper_Game_Asset_Explorer.html
  Chopper_Game_Audit.md / .html
  assets/                 # logical asset catalog, indexed tile/sprite/palette diagnostics and source spans
  audit/                  # ID/relation graph, ChopperGameEvidence.db, validation, Bible audit and manifests
  capture/                # channel/watchpoint/plan registries, schemas, synthetic tooling fixture
  code_map/               # raw bytes, instructions, CFG/function candidates, address contracts, runtime coverage
  gameplay/               # workflows, slots, parameters, transitions, scenarios, evidence lifecycle
  provenance/             # pinned MAME/source profiles, manifests, authority reconciliation, baseline archives
  source/                 # user-supplied source archive and 18 actual source payloads
  teaching/               # lessons, labs, source registry, math/constants/tables/glossary material
  unreal/                 # engine contracts, states/stages, tests, implementation tasks and runtime schemas
  tools/                  # current validator/rebuilder/capture tooling plus versioned/historical tools
  archive/v1_4/           # historical Office/docs/reports; not current authority
```

The old v1.4 package layout is preserved inside `archive/v1_4/`; its historical `ChoplifterEvidence.db` name and root `build_bible.py` workflow are not current entrypoints.


## Appendix D - Sources
Every source has a stable SRC-* ID. Historical and secondary sources support context and hypotheses; machine/ROM/runtime evidence retains priority for exact behavior.

### SRC-001 - MAME Sega System 1/System 2 main driver
- **Type:** source code
- **Creator/Publisher:** MAMEdev
- **Date:** MAME 0.289 / `mame0289` / `f34f02505e32c1993c6a782b6814232cbfc74e36`
- **Authority:** HIGH-PINNED
- **Used for:** Hardware, ROM set, Choplifter-specific inputs/DIPs, clocks and protected-set identity
- **Link:** [Pinned immutable source](https://github.com/mamedev/mame/blob/f34f02505e32c1993c6a782b6814232cbfc74e36/src/mame/sega/system1.cpp)

### SRC-002 - MAME Sega System 1/System 2 video implementation
- **Type:** source code
- **Creator/Publisher:** MAMEdev
- **Date:** MAME 0.289 / `mame0289` / `f34f02505e32c1993c6a782b6814232cbfc74e36`
- **Authority:** HIGH-PINNED
- **Used for:** Tilemaps, sprites, palette, mixer, collision and scrolling
- **Link:** [Pinned immutable source](https://github.com/mamedev/mame/blob/f34f02505e32c1993c6a782b6814232cbfc74e36/src/mame/sega/system1_v.cpp)

### SRC-003 - Epic Games UE 5.8 Paper 2D Overview
- **Type:** documentation
- **Creator/Publisher:** Epic Games
- **Date:** UE 5.8
- **Authority:** HIGH
- **Used for:** Modern 2D presentation architecture
- **Link:** [Open source](https://dev.epicgames.com/documentation/unreal-engine/paper-2d-overview-in-unreal-engine)

### SRC-004 - Epic Games UE 5.8 Paper 2D Tile Sets / Tile Maps
- **Type:** documentation
- **Creator/Publisher:** Epic Games
- **Date:** UE 5.8
- **Authority:** HIGH
- **Used for:** Experimental TileMap status / implementation risk
- **Link:** [Open source](https://dev.epicgames.com/documentation/unreal-engine/paper-2d-tile-sets-and-tile-maps-in-unreal-engine)

### SRC-005 - Epic Games UE 5.8 Enhanced Input
- **Type:** documentation
- **Creator/Publisher:** Epic Games
- **Date:** UE 5.8
- **Authority:** HIGH
- **Used for:** Input front end
- **Link:** [Open source](https://dev.epicgames.com/documentation/unreal-engine/enhanced-input-in-unreal-engine)

### SRC-006 - Epic Games UE 5.8 Automation Test Framework
- **Type:** documentation
- **Creator/Publisher:** Epic Games
- **Date:** UE 5.8
- **Authority:** HIGH
- **Used for:** Functional/screenshot/content testing
- **Link:** [Open source](https://dev.epicgames.com/documentation/unreal-engine/automation-test-framework-in-unreal-engine)

### SRC-007 - Epic Games UE 5.8 Low-Level Tests
- **Type:** documentation
- **Creator/Publisher:** Epic Games
- **Date:** UE 5.8
- **Authority:** HIGH
- **Used for:** Pure deterministic C++ testing
- **Link:** [Open source](https://dev.epicgames.com/documentation/unreal-engine/write-low-level-tests-in-unreal-engine)

### SRC-008 - Epic Games UE 5.8 Data Validation
- **Type:** documentation
- **Creator/Publisher:** Epic Games
- **Date:** UE 5.8
- **Authority:** HIGH
- **Used for:** Asset/data validation
- **Link:** [Open source](https://dev.epicgames.com/documentation/unreal-engine/data-validation-in-unreal-engine)

### SRC-009 - Epic Games UE 5.8 Asset Management
- **Type:** documentation
- **Creator/Publisher:** Epic Games
- **Date:** UE 5.8
- **Authority:** HIGH
- **Used for:** Primary Data Assets and content organization
- **Link:** [Open source](https://dev.epicgames.com/documentation/unreal-engine/asset-management-in-unreal-engine)

### SRC-010 - MobyGames Choplifter overview/trivia
- **Type:** historical database
- **Creator/Publisher:** MobyGames
- **Date:** n/a
- **Authority:** MEDIUM
- **Used for:** Original game history, Gorlin interview-derived notes, ports
- **Link:** [Open source](https://www.mobygames.com/game/8127/choplifter/)

### SRC-011 - Arcade-History Choplifter Model 834-5795
- **Type:** arcade database
- **Creator/Publisher:** Arcade-History
- **Date:** n/a
- **Authority:** MEDIUM
- **Used for:** Arcade date, controls, gameplay summary
- **Link:** [Open source](https://www.arcade-history.com/game/461/choplifter-model-834-5795)

### SRC-012 - Museum of the Game Choplifter overview
- **Type:** arcade database
- **Creator/Publisher:** International Arcade Museum
- **Date:** n/a
- **Authority:** MEDIUM
- **Used for:** Cabinet/control/gameplay/manual reference
- **Link:** [Open source](https://www.arcade-museum.com/Videogame/choplifter)

### SRC-013 - Retro Gamer Issue 51 - The Making of Choplifter!
- **Type:** magazine interview
- **Creator/Publisher:** Retro Gamer / Dan Gorlin
- **Date:** 2008
- **Authority:** MEDIUM-HIGH
- **Used for:** Creator interview; original design and Sega licensing relationship
- **Link:** [Open source](https://electronicsandbooks.com/edt/manual/Magazine/R/Retro%20Gamer%20UK/51.pdf)

### SRC-014 - Choplifter: From 1982 to 2012
- **Type:** creator interview
- **Creator/Publisher:** Game Developer / Dan Gorlin
- **Date:** 2012
- **Authority:** MEDIUM-HIGH
- **Used for:** Creator history, rescue-centered design philosophy and legacy
- **Link:** [Open source](https://www.gamedeveloper.com/business/-i-choplifter-i-from-1982-to-2012)

### SRC-015 - Our Games are Worlds Apart From the Ordinary
- **Type:** contemporary brochure
- **Creator/Publisher:** Brøderbund Software / Computer History Museum
- **Date:** 1982
- **Authority:** HIGH-HISTORICAL
- **Used for:** Contemporary Brøderbund catalog evidence that Choplifter was a 1982 home-computer product
- **Link:** [Open source](https://www.computerhistory.org/brochures/doc-4372956e3a8d1/)

### SRC-016 - Sega Choplifter sales flyer
- **Type:** contemporary sales flyer
- **Creator/Publisher:** Sega / International Arcade Museum
- **Date:** 1985
- **Authority:** HIGH-HISTORICAL
- **Used for:** Arcade marketing and period presentation
- **Link:** [Open source](https://flyers.arcade-museum.com/videogames/show/191)

### SRC-017 - Game Machine No.270 Sega Choplifter advertisement
- **Type:** contemporary trade publication
- **Creator/Publisher:** Sega / Game Machine
- **Date:** 1985-10-15
- **Authority:** HIGH-HISTORICAL
- **Used for:** Period ad describing Choplifter as first title for Sega System 2 new motherboard
- **Link:** [Open source](https://onitama.tv/gamemachine/pdf/19851015p.pdf)

### SRC-018 - Museum of the Game MAME tech record - Choplifter 8751
- **Type:** technical database
- **Creator/Publisher:** International Arcade Museum / MAME data
- **Date:** n/a
- **Authority:** MEDIUM-HIGH
- **Used for:** Current clocks, resolution, controls and machine configuration summary
- **Link:** [Open source](https://www.arcade-museum.com/tech-center/machine/choplift)

### SRC-019 - Sega Choplifter arcade instruction/manual scan
- **Type:** contemporary manual
- **Creator/Publisher:** Sega
- **Date:** 1985
- **Authority:** HIGH-HISTORICAL
- **Used for:** Operator instructions, DIP/coin settings, cabinet/service context
- **Link:** [Open source](https://www.arcade-museum.com/Videogame/choplifter)

### SRC-020 - MobyGames Choplifter releases
- **Type:** historical database
- **Creator/Publisher:** MobyGames
- **Date:** n/a
- **Authority:** MEDIUM
- **Used for:** 1982 Apple II and October 1985 Sega arcade release records
- **Link:** [Open source](https://www.mobygames.com/game/8127/choplifter/releases/)

### SRC-021 - The History of Defender: The Joys of Difficult Games
- **Type:** historical article quoting Dan Gorlin
- **Creator/Publisher:** Game Developer
- **Date:** n/a
- **Authority:** MEDIUM
- **Used for:** Defender influence and rescue-people design anecdote
- **Link:** [Open source](https://www.gamedeveloper.com/business/the-history-of-i-defender-i-the-joys-of-difficult-games)


## Appendix E - Teaching glossary
| Term ID | Term | Definition |
| --- | --- | --- |
| TERM-0001 | Address | A numeric location in a CPU memory or I/O space. Context matters: the same numeric value can mean different things in different address spaces. |
| TERM-0002 | Bank switching | Mapping one of several physical ROM blocks into the same CPU address window so a 16-bit CPU can access more code/data. |
| TERM-0003 | Bitplane | A bitmap plane containing one significance bit of every pixel. Three tile planes combine to produce a 3-bit pixel index. |
| TERM-0004 | BPP | Bits per pixel. Choplifter tiles are 3 bpp (8 indices); sprites use 4-bit nibbles (up to 16 values including transparency/terminator semantics). |
| TERM-0005 | Byte | Eight bits. The Z80 is an 8-bit CPU, though it also operates on 16-bit register pairs/addresses. |
| TERM-0006 | Word | Here, normally a 16-bit value composed of two bytes. Z80 multi-byte immediates are little-endian. |
| TERM-0007 | Little-endian | Least-significant byte stored first. Bytes 34 12 represent word 0x1234. |
| TERM-0008 | Hexadecimal | Base-16 notation, convenient because one hex digit represents four bits. 0xD800 is the start of Choplifter palette RAM. |
| TERM-0009 | ROM | Read-only memory holding program/graphics data on the original board. |
| TERM-0010 | RAM | Writable memory used for dynamic program, sprite, palette, video, sound and collision state. |
| TERM-0011 | PROM | Programmable read-only memory. Small PROMs on this board implement physical color lookup and layer-mixer truth tables. |
| TERM-0012 | PLD/PAL | Programmable logic device/programmable array logic used to implement board-specific digital logic. |
| TERM-0013 | MCU | Microcontroller unit. The protected Choplifter set includes an Intel 8751-class MCU with Sega marking 315-5151. |
| TERM-0014 | Z80 | Zilog 8-bit CPU family used for both main and sound processing. |
| TERM-0015 | PSG | Programmable sound generator. Choplifter uses two SN76489-class tone/noise chips. |
| TERM-0016 | Sprite | Movable graphic generated independently from tilemap layers. System 2 live sprites are runtime descriptors pointing into scanline-formatted ROM. |
| TERM-0017 | Tile | Small reusable 8x8 indexed graphic referenced by tile code. |
| TERM-0018 | Tilemap | Grid of tile descriptors used to compose a larger layer/world. |
| TERM-0019 | Palette RAM | Runtime indirection table mapping logical layer/color/pixel pens to one of 256 physical PROM colors. |
| TERM-0020 | Logical pen | The source-specific numeric color address formed from tile color/pixel or sprite slot/pixel before palette RAM indirection. |
| TERM-0021 | Mixer PROM | 256-entry logic table selecting sprite/fixed/background source and collision effects from transparency/priority inputs. |
| TERM-0022 | Transparency | Pixel value interpreted as not drawing a source at that position. For tile/sprite composition, index 0 is transparent. |
| TERM-0023 | Priority | Layer ordering information used by the mixer to choose which nontransparent source wins. |
| TERM-0024 | Raster | The scanline-by-scanline display timing/output model of a CRT-era video system. |
| TERM-0025 | VBlank | Vertical blanking interval between displayed frames; commonly used as a timing/interrupt reference. |
| TERM-0026 | Scanline | One horizontal line of raster output. System 2 sprite ROM data is decoded row-by-row. |
| TERM-0027 | Stride | Amount added to a sprite source address between rows; part of the live sprite descriptor. |
| TERM-0028 | Nibble | Four bits, one hexadecimal digit. Sprite ROM bytes contain two 4-bit pixel/control nibbles. |
| TERM-0029 | Interrupt | CPU control transfer caused by hardware/event timing rather than an ordinary CALL instruction. |
| TERM-0030 | NMI | Non-maskable interrupt. The sound CPU uses an NMI path to receive sound-latch activity. |
| TERM-0031 | Port I/O | Z80 IN/OUT address space, separate from normal memory addresses. |
| TERM-0032 | PPI | Programmable Peripheral Interface; the 8255 exposes configurable I/O ports used by the board. |
| TERM-0033 | Disassembly | Translation of machine-code bytes into assembly instructions. It does not by itself prove which bytes execute. |
| TERM-0034 | Control-flow graph | Graph of instruction/basic-block jumps, calls and returns used to reason about code structure. |
| TERM-0035 | XREF | Cross-reference from one code/data object to another, such as a CALL target or memory dereference. |
| TERM-0036 | Static analysis | Analysis without executing the game. Useful but vulnerable to code/data ambiguity, bank ambiguity and indirect behavior. |
| TERM-0037 | Runtime trace | Execution evidence recording actual state/events over time, such as PC, bank, RAM, sprite descriptors and inputs. |
| TERM-0038 | Evidence grade | Classification of how a claim is supported: ROM-proven, MAME-proven, static inference, runtime-observed, secondary or modern design. |
| TERM-0039 | Determinism | Same initial state and input stream produce the same simulation state every step. |
| TERM-0040 | Fixed-step simulation | Gameplay updates at an explicit simulation interval independent of render frame rate. |
| TERM-0041 | Fixed-point | Integer representation of fractional values. The proposed 24.8-style contract uses 256 subunits per logical pixel. |
| TERM-0042 | Replay | Recorded configuration/input stream (plus checksums) used to reproduce simulation exactly. |
| TERM-0043 | Golden reference | Versioned, provenance-rich capture used as a test oracle. It is evidence, not a screenshot casually copied from the web. |
| TERM-0044 | Paper2D | Unreal Engine 2D sprite/flipbook framework used for presentation, not as the source of strict gameplay truth. |
| TERM-0045 | PrimaryDataAsset | Unreal data asset type suitable for stable IDs and Asset Manager workflows. |
| TERM-0046 | LUT | Lookup table. Palette and mixer behavior are naturally represented by small deterministic LUTs. |
| TERM-0047 | Diagnostic image | Human-readable visualization of indexed data. Its RGB colors are not authoritative strict game colors. |
| TERM-0048 | Semantic alias | Human meaning assigned to a raw/stable asset/code ID after sufficient evidence, without changing the raw ID. |
| TERM-0049 | Fail closed | If required evidence is missing, strict mode/build refuses to guess or substitute a plausible value. |
| TERM-0050 | Foreign key | Database/reference constraint requiring a referenced ID to exist, preventing dangling traceability links. |

## Appendix F - Source limitations
MAME is an inspectable hardware reference, but MAME itself documents historical uncertainties in parts of System 1/2 priority/alignment behavior. Real arcade hardware evidence outranks emulator behavior if a controlled disagreement is established. Secondary gameplay sites seed tests only; numeric conflicts are resolved through runtime evidence.

---

# Historical update record — Chopper Game v1.6 audit-remediation milestone

This release resolves the fifteen package/validation findings from the independent v1.5 audit without inventing original-game evidence. Strict arcade-fidelity remains **NO-GO** because semantic bindings, original-runtime captures and Unreal comparison remain incomplete.

## Resolved package issues

1. Current validation uses explicit failures rather than Python `assert` for release gates and is required to behave identically under normal, `-O`, and `-OO` modes.
2. Code maps now distinguish CPU address, region-relative offset and physical-ROM file offset while retaining legacy IDs/fields.
3. Asset source spans are re-derived and content-identity checked, not merely bounds checked.
4. SQLite mirrors and relationship rows are exact-compared; typed relationship endpoint rules are checked.
5. Gameplay CSV is the canonical source; JSON and explorer projections must match it exactly, including evidence/status fields and image key sets.
6. Code bytes, instruction byte streams, palette channels and mixer outputs are independently checked against supplied ROM/PROM bytes.
7. State/scenario references are checked against typed registries and workflow parents.
8. Self-managed reports are parsed/schema-checked and execution attestation is separated from payload hashing.
9. Binding proof joins now scope proof to the exact asset/role/profile/source/capture/config/tool/trace/held-out test; self-issued proof is prohibited.
10. Evidence has an explicit lifecycle: UNRESOLVED → CAPTURED → REVIEWED → VERIFIED, with REJECTED/SUPERSEDED branches.
11. Package paths serialize as POSIX-relative paths; Windows-native filesystem paths are not serialized into registries.
12. IMP-000 now points to current rebuild/validation entrypoints.
13. Runtime event schema v2 identifies device/clock/global order/phase/raw payload/drop accounting.
14. Original capture is separated from later target implementation and held-out comparison; original capture no longer requires Unreal.
15. At v1.6, legacy MAME source-pin claims were downgraded pending an immutable pin. **Superseded by v1.7:** the current pin is MAME 0.289 / `mame0289` / `f34f02505e32c1993c6a782b6814232cbfc74e36`.

## Evidence boundary

These changes improve specification integrity and the ability to reject bad package edits. They do not prove original gameplay semantics. The 63 required asset bindings, strict numeric parameters, runtime scenarios, source-reference issues, and Unreal integration remain evidence-gated.

# Historical update record — v1.7 pinned original-runtime source profile

## CG-SRC-PROFILE-MAME0289-CHOPLIFT — authoritative capture baseline

Strict original-runtime work now has one explicit baseline: MAME 0.289 (`mame0289`, commit `f34f02505e32c1993c6a782b6814232cbfc74e36`) running system shortname `choplift`. The exact 19-object content manifest is `provenance/mame_0289_choplift_manifest.csv`; filename aliases in the research archive do not substitute for content identity. Every capture must additionally record the actual emulator executable SHA-256.

The package currently matches 17 canonical objects. `ROM-MCU-8751` is not treated as an unknown arbitrary mismatch: its supplied CRC/SHA-1 match a historical MAME XML record marked BAD_DUMP. Current MAME 0.289 expects a different MCU dump. `ROM-PLD-5139` is absent. Therefore the protected-set strict source gate remains closed; static analysis of the supplied bytes remains valid within its stated scope.

## CG-DIP-PROFILE-MAME0289-DEFAULT — deterministic configuration

The DIP registry is reconciled to the pinned Choplifter input definition. Physical SWB defaults are Upright, Demo Sounds On, 3 lives, the 20k/70k/120k/170k bonus schedule, Hard difficulty, and default unused-bit states. Physical SWA defaults both coin groups to 1 Coin/1 Credit. In MAME's software port tags these aggregate to `SWA=0xDC` and `SWB=0xFF`. This distinction between physical switch labels and software port tags is now explicit.

The earlier compact registry incorrectly carried values from a different System 2 configuration for lives/bonus/difficulty. Those rows are superseded by `audit/dip_switch_registry.csv`, with the exact migration recorded in `audit/dip_switch_change_v1_7.csv`.

## Local source admission

`tools/source_profile.py` verifies size, CRC32 and SHA-1 for all 19 required objects, accepts the two historical `.bin` PLD filename aliases only as input convenience, and writes canonical MAME filenames only after every content hash passes. It never retrieves source objects. A missing or mismatched object fails closed.



# Historical update record — v1.8 original-runtime capture harness

Chopper Game v1.8 adds the evidence acquisition layer required before static candidates may be promoted to original-game behavior. The public collector is `CG-COLLECTOR-MAME-LUA-001`; its exact channels, watchpoints and 14 workflow-aligned plans are defined under `capture/`.

The time model is now lossless: every frame and event records MAME emulated time as separate whole seconds and attoseconds plus a strictly increasing capture sequence. CPU-local cycle counts are optional and may not be fabricated when the public API does not expose them.

The public Lua collector snapshots the currently mapped E000–EFFF video window and records video/control writes. It **does not** claim simultaneous direct access to every hidden video page. If a remaining strict unknown genuinely requires inaccessible internal state, `CG-COLLECTOR-MAME-INSTRUMENTED-001` is the explicit future path.

The capture pipeline is source-gated and evidence-gated: canonical source audit → pinned MAME binary → capture plan → raw collection → hash/finalize → bundle seal → structural validation → human/technical review → only then possible evidence promotion. The synthetic fixture proves this machinery only; it is prohibited from satisfying gameplay evidence gates.

Current status remains: 0 original-runtime scenarios executed; 63 semantic binding slots unresolved; 26 strict parameters unapproved; no Unreal comparison build.


# Historical update record — v1.10 capture analysis and evidence promotion

v1.10 adds the machine-enforced layer between sealed capture evidence and a strict semantic/parameter claim. The release defines 11 analysis methods, 89 subject recipes and 13 mandatory promotion gates. Candidate analysis is separated from review; discovery captures must be repeated and held-out captures must be disjoint. Synthetic/noncanonical evidence is explicitly prohibited from promotion.

No original-runtime capture was executed and no gameplay claim was promoted in this release. The synthetic analysis fixture is tooling-only, all evidence/promotion/semantic-alias registries remain empty, and strict fidelity remains NO-GO.

# Historical update record — v1.11 canonical source admission and first-run control

v1.11 closes the tooling gap between “source set incomplete” and an executable first original-runtime capture. `CG-SOURCE-ADMISSION-001` performs filename-independent exact-hash intake with atomic external staging. `CG-CAPTURE-CONTROLLER-001` combines that source gate with a verified MAME 0.289 preflight and the 14-plan capture queue. `CG-CAMPAIGN-001` defines the first repeated/held-out boot-title campaign.

The controller was actually preflighted in this release. The result is blocked: the packaged set has 17 of 19 canonical objects, and no MAME 0.289 executable is bundled or available to this run. Consequently **no original-runtime execution occurred** and the 60 runtime scenarios remain `NOT_RUN`. This is an explicit negative gate result, not a skipped verification disguised as success.

No canonical MCU or PLD bytes are embedded by this update. Future user-supplied candidates must pass exact content identity before they can enter the external capture workspace. The release package continues to preserve only the already-supplied research source bytes and the hashes/requirements for the two blockers.



# Historical update record — v1.12 exact MAME source-role audit and build probe

v1.12 keeps the strict 19-object stock-MAME staging rule but corrects what each source object proves. The protected parent explicitly uses the 8751 emulation path, so the canonical MCU is a runtime-semantic dependency. PLD dumps remain official stock-ROM-manifest objects, but current System 1/2 runtime code does not expose a `plds` region pointer; they are therefore audit/source-identity inputs rather than runtime-consumed data. The current package is 17/19 stock-manifest, 15/16 runtime-consumed and 2/3 PLD audit-only.

The environment has suitable compiler versions, but the full pinned MAME source tree could not be materialized through the container network and no MAME 0.289 binary exists locally. This is recorded as `NOT_RUN_ENVIRONMENT_SOURCE_TREE_UNAVAILABLE`, not a successful or failed emulator build. No runtime capture, semantic promotion, or Unreal comparison is claimed.


# Historical update record — v1.13 official MAME runtime bridge and noncanonical capture

v1.13 resolves the emulator acquisition/execution blocker without weakening the evidence model. The official MAME 0.289 Linux CI artifact built from the pinned commit was obtained from the upstream MAME GitHub Actions run and executed successfully in this environment. A small generated headless linkage shim was required because the CI artifact dynamically references Qt/SDL_ttf libraries not installed in the container; the shim provides no emulation logic and is excluded from evidence authority.

The project then exercised the only source bytes actually available here. A research-only ROM bridge uses the user-supplied historical BAD_DUMP MCU and an explicit zero placeholder for the audit-only missing PLD. It can boot the MAME machine sufficiently for bounded observation but **cannot** enter the canonical evidence lane. `CG-CAP-RESEARCH-004` captured 120 frames and showed the protected main CPU fixed at PC=0 with invariant video state, while the sound CPU continued executing. This materially closes the question of whether the historical bad MCU can be used as a practical substitute: for this pinned protected-parent runtime, it cannot.

The strict gate therefore remains narrow and explicit: an authorized candidate matching canonical MCU SHA-1 `b85acd7292e5480c98af1a0492b6b5d3f9b1716c` is required before `CG-PLAN-001` can be executed as `ORIGINAL_RUNTIME` and become eligible for review/promotion. The audit-only PLD is still required for an unmodified stock-MAME 19/19 ROM audit but is not classified as runtime-consumed gameplay data. No canonical ROM bytes were fabricated, downloaded, patched, or inferred.

# Historical update record — v1.14 historical MCU repair and independent startup proof

v1.14 supersedes the v1.13 conclusion that the historical BAD_DUMP could not take the project farther. The unmodified dump remains unusable under MAME 0.289, but historical MAME 0.131u2 documents three in-memory corrections to that exact dump. v1.14 implements those repairs as an explicitly noncanonical, fail-closed research lane.

Independent behavioral execution now demonstrates that the repaired 8751 firmware reaches the expected PPI initialization and deasserts Z80 BUSREQ. A second independent Z80 probe, initialized from those observed PPI writes and using the actual protected main ROMs, leaves PC=0, selects bank 3 and performs substantial work/sprite/palette/video memory initialization across 120 nominal frame-equivalent intervals. No strict semantic promotion follows from this result.

The repaired-lane MAME 0.289 confirmation was not available in v1.14. v1.15 supersedes that pending state with the native execution proof documented above. The canonical MCU remains mandatory for canonical held-out verification.

# Current update record — v1.15 native repaired-MCU MAME proof

v1.15 executes the exact historical repaired-MCU research profile under the pinned MAME 0.289 executable and closes the practical emulator-runtime question left open by v1.14.

The repaired MCU releases the protected main Z80 at emulated time **5.358080 s**; the first sampled released main PC is `0x9419` with bank 3 selected. The surrounding MAME I/O trace records the expected PPI initialization and the protected main program's `0x40 -> 0x4C` port-B transition.

A dedicated follow-up capture records **120 consecutive MAME screen frames, frame numbers 321 through 440, with zero gaps**. Work RAM, palette RAM, mapped video and visible screen pixels change inside that bounded interval. A longer 120-second MAME visual run then progresses through `IC CHECK`, the title/licensing screens and the attract/gameplay loop.

This changes the repaired-lane status to `MAME0289_REPAIRED_RUNTIME_PROVEN_NONCANONICAL`. It does **not** change the canonical evidence policy: `promotion_eligible=false`, canonical MCU identity is still blocked, zero strict semantic/gameplay promotions are created, and strict arcade fidelity remains **NO-GO** until a disjoint canonical-MCU held-out run is available.

