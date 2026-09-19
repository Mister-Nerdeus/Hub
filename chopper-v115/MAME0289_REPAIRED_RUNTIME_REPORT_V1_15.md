# Chopper Game v1.15 — Native MAME 0.289 repaired-MCU proof

## Result

**Repaired historical MCU under pinned MAME 0.289: PASS**  
**Protected main-Z80 release: PASS**  
**120 consecutive MAME screen frames: PASS**  
**Rendered title/attract progression: PASS**  
**Canonical MCU identity: BLOCKED**  
**VERIFIED promotions: 0**  
**Strict arcade fidelity: NO-GO**

The run uses the exact three historical MAME 0.131u2 repairs on the user-supplied historical BAD_DUMP. The repaired image remains noncanonical and is explicitly `promotion_eligible=false`.

## Main CPU release

The last sampled held state occurs at **5.341440 s** with main PC `0x0000`, bank 0, MCU PC `0x0200`, P1 `0x4F`. The first sampled released state occurs at **5.358080 s** with main PC **`0x9419`**, bank **3**, MCU PC `0x00F0`, P1 **`0x19`**.

The surrounding MAME I/O sequence is:

| Seq | Time (s) | Op | Port | Value |
| ---: | ---: | --- | --- | --- |
| 0 | 5.347713326 | write | 0x17 | 0xC0 |
| 1 | 5.347720826 | write | 0x14 | 0x00 |
| 2 | 5.347728326 | write | 0x15 | 0x40 |
| 3 | 5.347735826 | write | 0x16 | 0x00 |
| 4 | 5.347757500 | read | 0x15 | 0x40 |
| 5 | 5.347762250 | write | 0x15 | 0x4C |

## Exact 120-frame proof

A second run gates capture on MAME `screen:frame_number()`.

- release frame: 321
- captured frames: **321–440 inclusive**
- frame count: **120**
- frame-number gaps: **0**
- bank: 3
- sampled main-PC values: 15

Work RAM has 118 distinct frame snapshots, palette RAM 2, mapped video 2, sound RAM 120 and visible screen pixels 2. The last bounded frame visibly renders **IC CHECK**.

## Event capture

The repaired runtime capture recorded **960,411 events with zero reported drops**:

- 716,244 sound-RAM writes
- 236,568 work-RAM writes
- 4,116 video writes
- 2,050 palette writes
- 1,268 PSG writes
- 159 sprite writes
- 5 main-I/O writes
- 1 main-I/O read

## Rendered progression

A separate 120-emulated-second MAME visual probe produced 120 screenshots / 87 distinct image hashes. It visibly reaches:

- 30 s: IC CHECK / test pattern
- 50 s: Choplifter title screen
- 60 s: license/copyright screen
- 80 s: attract/gameplay scene with INSERT COIN
- 100 s: Game Over
- 119 s: Your Mission / Rescue Hostages

## Correction to v1.13

The earlier PC=0 result is retained only as an observation of its early sampled interval. The headless machine-frame callback stopped delivering collector callbacks before the multi-second repaired-MCU startup/checksum sequence completed. Periodic sampling showed emulation continuing until the MCU released the Z80.

## Boundary

This is `NONCANONICAL_HISTORICAL_MAME_REPAIR` evidence. It may support discovery and implementation planning, but it cannot close canonical protection/gameplay claims. The remaining strict dependency is an authorized canonical MCU matching SHA-1 `b85acd7292e5480c98af1a0492b6b5d3f9b1716c`, followed by a disjoint held-out capture.
