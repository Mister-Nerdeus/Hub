# Chopper Game — v1.14 MCU Resolution Addendum

Document ID: BIB-CHOP-UE2D-001  
Status: **MCU research-runtime blocker resolved; canonical identity gate remains external**  
Supersedes: v1.13 MCU blocker discussion only

## 1. Resolution finding

The project previously treated the supplied historical 315-5151 dump as unusable because an unmodified MAME 0.289 research run held the main Z80 at PC=0 for 120 frames.

A historical-source audit now establishes two independent MAME-era recovery paths:

### A. MAME 0.131 partial HLE

MAME tag `mame0131` implemented `choplift_i8751_run` without an MCU dump. On initialization it configured the 8255 PPI. On active vblank it wrote a small set of observed values into main RAM/video RAM, including a 16-byte copy from main ROM offset `0x1f8e`.

This proves that a bounded behavioral bridge was historically sufficient for useful Choplifter emulation before the MCU dump became available.

### B. MAME 0.131u2 historical bad-dump repair

MAME tag `mame0131u2` changed Choplifter to real 8751 execution using the same historical dump supplied in this project:

- CRC32 `7bd11a6c`
- SHA-1 `2d75a2276e572f97f269af062536c1c58e1c8eaf`

The driver explicitly labeled it `BAD_DUMP` and applied these three in-memory repairs in `DRIVER_INIT(choplift)`:

| Offset | Historical bad byte | Repair byte |
|---|---:|---:|
| `0x0100` | `0xD5` | `0x55` |
| `0x027B` | `0xF2` | `0xFB` |
| `0x02FF` | not asserted by source comment | `0xF6` |

The MAME source comment states: **“the ROM dump we have is bad; the following patches make it work”**, while also noting the checksum correction means something still remained incorrect.

The same repair is present in later releases including MAME 0.132.

## 2. Current MAME authority

Pinned strict reference remains:

- MAME `mame0289`
- commit `f34f02505e32c1993c6a782b6814232cbfc74e36`
- canonical MCU CRC32 `1377a6ef`
- canonical MCU SHA-1 `b85acd7292e5480c98af1a0492b6b5d3f9b1716c`

MAME 0.289 runs the real 8751 interface. The protected Choplifter machine configuration still requires MCU-mediated BUSREQ, main-Z80 interrupt control, and MOVX access to main program/banked ROM/I/O spaces.

The missing PLD `315-5139.ic50` remains a stock-MAME ROM-audit completeness item and is not treated as runtime-consumed protection code.

## 3. New evidence lanes

### CG-LANE-CANONICAL-MCU

Requirements:
- exact canonical MCU identity;
- stock pinned MAME;
- complete strict source gate.

Promotion:
- eligible for strict runtime evidence and, after all other gates, VERIFIED promotion.

Current state:
- **BLOCKED_EXTERNAL_SOURCE**.

### CG-LANE-HISTORICAL-MCU-REPAIR

Requirements:
- exact historical bad dump identity;
- three repairs above;
- source and repair manifest sealed;
- current MAME binary identity sealed.

Promotion:
- **never sufficient alone for VERIFIED**.
- may produce DISCOVERY/CANDIDATE evidence.
- any semantic or numeric conclusion must later survive a disjoint canonical held-out comparison.

Current state:
- **IMPLEMENTED_AS_REPAIR_KIT**.

### CG-LANE-HISTORICAL-HLE-0131

Requirements:
- no MCU dump;
- exact MAME 0.131 HLE behavior reproduced.

Promotion:
- research/discovery only.
- lower authority than repaired real-MCU execution.

Current state:
- **DOCUMENTED_FALLBACK**.

## 4. Added tooling

`repair_bad_mcu.py`
- admits only the exact historical bad dump by size + CRC32 + SHA-1;
- refuses the canonical MCU;
- refuses unknown inputs;
- never overwrites the input;
- writes a repaired research copy and evidence manifest;
- explicitly sets `canonical_identity_satisfied=false` and `promotion_eligible=false`.

`choplift_0131u2_repair.lua`
- reproduces the historical three-byte repair in the loaded MAME `:mcu` region;
- verifies documented repair-site bytes before mutation;
- verifies writes after mutation;
- requests one soft reset so execution restarts with repaired in-memory MCU code;
- prints the research-lane label and promotion prohibition.

## 5. Required next execution

Re-run `CG-PLAN-001` using the repaired-MCU research lane.

Acceptance for a useful repaired run:
1. main Z80 PC must leave 0;
2. main Z80 must execute a nontrivial set of addresses;
3. screen or relevant video state must cease being invariant;
4. work/sprite/video state must show expected boot/title activity;
5. MAME session must close cleanly;
6. capture must be labeled `NONCANONICAL_HISTORICAL_MAME_REPAIR`;
7. no VERIFIED promotion may result.

If that run succeeds, the practical runtime blocker is closed for research mapping. Canonical protection timing remains a separate strict-fidelity gate.

## 6. Historical source references

- `mamedev/mame` tag `mame0131`, tag commit `4b7dd3cd0de9a22407105730d933383bc78f96a6`: partial Choplifter 8751 simulation.
- `mamedev/mame` tag `mame0131u2`, tag commit `befc46f2579cf1835a7065d2e90c954eef13c576`: historical bad dump + three-byte repair.
- `mamedev/build` `whatsnew_0131u2.txt`: Choplifter 8751 credited to The Decapping Project / Aaron Giles.
- `mamedev/mame` tag `mame0289`, commit `f34f02505e32c1993c6a782b6814232cbfc74e36`: current pinned strict reference.

## 7. Audit disposition

The earlier statement “the bad MCU cannot take us further” is now **superseded**.

Correct statement:

> The unmodified historical bad MCU cannot execute the protected parent correctly under MAME 0.289. Public historical MAME evidence provides a bounded three-byte repair that was specifically used to make that dump work. That repair may unblock research-runtime capture, but it does not convert the dump into the canonical MCU and cannot establish strict protection fidelity by itself.

This distinction is mandatory in every future release.
