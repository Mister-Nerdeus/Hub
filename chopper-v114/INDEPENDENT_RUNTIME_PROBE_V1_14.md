# Chopper Game v1.14 — Independent repaired-MCU runtime evidence

## Decision

**Research startup blocker: RESOLVED at independent-model level.**  
**Pinned MAME repaired-MCU confirmation: NOT RUN — execution backend unavailable.**  
**Canonical protected-parent fidelity: still BLOCKED by the missing canonical 8751.**  
**VERIFIED promotions created: 0.**

This result does not claim that the repaired BAD_DUMP is canonical.

## What was actually executed

The user-supplied historical MCU (CRC32 `7bd11a6c`, SHA-1 `2d75a2276e572f97f269af062536c1c58e1c8eaf`) was interpreted after applying only the three repairs documented by MAME 0.131u2:

- `0x0100: D5 -> 55`
- `0x027B: F2 -> FB`
- `0x02FF: -> F6`

The independent 8051 interpreter was pinned to Aimini/js51 commit `7faca5ed5935857e74fd7737d9ed7fea5b819f8a`. Its MOVX @Ri external-address handling was adapted so P2 supplies the high address byte, and the external-bus/control behavior was mapped to the pinned MAME 0.289 System 1 driver.

## Repaired MCU result

The repaired firmware reached Z80 BUSREQ deassertion at interpreted MCU instruction **2,177,605**.

Immediately before release it performed this externally visible sequence:

| Interpreted step | External address | Value | Meaning |
| ---: | ---: | ---: | --- |
| 2,177,589 | 0x17 | 0xC0 | 8255 control |
| 2,177,592 | 0x14 | 0x00 | PPI port A |
| 2,177,595 | 0x15 | 0x40 | PPI port B / video-mode latch |
| 2,177,598 | 0x16 | 0x00 | PPI port C |
| 2,177,605 | — | — | P1 control clears BUSREQ |

There were no interpreter errors in the bounded run. The instruction count is **not hardware time**.

## Main Z80 startup result

A second independent probe used DrGoldfire/Z80.js commit `2207d7c6a8b42246ea12efbf9dba8b2adf010437` and initialized the PPI from the exact writes observed above.

The supplied main program immediately:

1. left PC=0;
2. read PPI port B as 0x40;
3. ORed in 0x0C;
4. wrote 0x4C back to port B;
5. selected bank 3;
6. jumped into the banked startup path.

Across 120 nominal frame-equivalent intervals the bounded probe executed:

- **1,127,010** interpreted Z80 instructions;
- **8,000,043** nominal Z80 cycles;
- **49** sampled unique PCs;
- final sampled PC **0x9445**;
- **124,246** work-RAM writes;
- **2,048** sprite-RAM writes;
- **2,050** palette-RAM writes;
- **4,116** video-RAM writes;
- no interpreter exception.

This proves that the repaired-MCU startup handshake is sufficient, in the independent model, to release the protected main CPU and enter the banked initialization path. It does **not** prove rendered title-screen fidelity or complete protection behavior.

## Why this is still research-only

The probe intentionally does not model the complete post-release machine: System 2 rendering, collision hardware, sound CPU coexecution, exact wait states, and concurrent post-release 8751 timing are outside its authority. The Z80 frame cadence is a nominal research schedule, not a cycle-certified System 2 clock proof.

Therefore:

- `promotion_eligible=false`
- no semantic alias is VERIFIED;
- no strict gameplay parameter is approved;
- no canonical source gate is closed;
- no MAME framebuffer/replay comparison is claimed.

The next strict evidence step remains a repaired-lane MAME 0.289 confirmation followed later by a disjoint canonical-MCU capture.
