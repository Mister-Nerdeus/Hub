# Chopper Game v1.14 MCU Resolution Kit

This directory resolves the **research-runtime** Choplifter 8751 blocker without fabricating or redistributing the canonical 315-5151 MCU dump.

## What was discovered

MAME 0.131 introduced a partial Choplifter 8751 simulation. In MAME 0.131u2, after a decapped 315-5151 dump became available, the System 1 driver replaced that simulation with real 8751 execution but explicitly marked the dump `BAD_DUMP` and applied three in-memory repairs:

- offset `0x0100`: `0xD5 -> 0x55`
- offset `0x027B`: `0xF2 -> 0xFB`
- offset `0x02FF`: set to `0xF6`

The source comment states that these repairs make the bad dump work, while also warning that something remained incorrect. The same repair remained in subsequent releases. Current MAME 0.289 uses a different canonical MCU identity:

- CRC32: `1377a6ef`
- SHA-1: `b85acd7292e5480c98af1a0492b6b5d3f9b1716c`

The user-supplied historical dump is:

- size: 4096 bytes
- CRC32: `7bd11a6c`
- SHA-1: `2d75a2276e572f97f269af062536c1c58e1c8eaf`

## Resolution

Two bounded research bridges are provided:

1. **`repair_bad_mcu.py`** — creates a repaired *copy* of the exact historical bad dump after full SHA-1/CRC/size admission.
2. **`choplift_0131u2_repair.lua`** — applies the same three repairs to MAME's loaded `:mcu` region and schedules a soft reset.

Neither bridge creates a canonical MCU dump. Neither output may satisfy a strict source-identity gate. Evidence from this lane is tagged:

`NONCANONICAL_HISTORICAL_MAME_REPAIR`

and is **never eligible for VERIFIED promotion by itself**.

## Historical authority

- MAME `mame0131`, tag commit `4b7dd3cd0de9a22407105730d933383bc78f96a6`: partial `choplift_i8751_run` simulation.
- MAME `mame0131u2`, tag commit `befc46f2579cf1835a7065d2e90c954eef13c576`: bad decapped MCU dump plus the three-byte repair in `DRIVER_INIT(choplift)`.
- MAME 0.131u2 release notes credit “Choplifter (8751 315-5151)” to The Decapping Project / Aaron Giles.
- MAME `mame0289`, commit `f34f02505e32c1993c6a782b6814232cbfc74e36`: canonical MCU identity above and real MCU interface.

## Evidence policy

Research captures made with the repair bridge may be used to:
- discover candidate sprite/state mappings;
- locate likely RAM fields and code paths;
- design runtime experiments;
- compare against the unprotected clone and later canonical captures.

They may **not** establish:
- exact canonical protection timing;
- canonical MCU instruction behavior;
- final same-tick ordering where MCU timing could matter;
- a VERIFIED semantic binding or strict parameter without a disjoint canonical held-out capture.

## Recommended run

Use the existing v1.13 research ROM bridge to construct the isolated research ROM set. Start official MAME 0.289 with this Lua file as the autoboot script. The script verifies the known repair-site values, patches only the loaded MCU memory region, then requests one soft reset.

The untouched source archive and original MCU bytes remain authoritative provenance and must never be overwritten.
