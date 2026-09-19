# Chopper Game v1.14-CANDIDATE — MCU Resolution Audit

## Result

**Research-runtime MCU blocker: RESOLVED BY HISTORICAL REPAIR PATH**  
**Canonical protected-parent source identity: STILL BLOCKED BY MISSING CANONICAL MCU**  
**Strict arcade-fidelity release: NO-GO**

The resolution does not fabricate or download missing copyrighted MCU bytes.

## Evidence discovered

1. MAME `mame0131` implemented a bounded `choplift_i8751_run` partial simulation before a usable MCU dump existed.
2. MAME `mame0131u2` used the exact historical bad dump already supplied in this project:
   - CRC32 `7bd11a6c`
   - SHA-1 `2d75a2276e572f97f269af062536c1c58e1c8eaf`
3. MAME 0.131u2 explicitly repaired that loaded MCU image:
   - `0x0100 D5 -> 55`
   - `0x027B F2 -> FB`
   - `0x02FF -> F6`
4. The source comment states those repairs make the bad dump work, while warning that it remained imperfect.
5. Current MAME 0.289 requires canonical MCU SHA-1 `b85acd7292e5480c98af1a0492b6b5d3f9b1716c`.

## Implemented controls

- exact bad-dump size/CRC32/SHA-1 admission;
- canonical-image refusal;
- unknown-input refusal;
- no in-place modification;
- explicit noncanonical lane marker;
- explicit `promotion_eligible=false`;
- exact three-site patch table;
- Lua repair-site fingerprint checks;
- post-write verification;
- one soft reset after in-memory patch;
- canonical held-out comparison remains mandatory for VERIFIED promotion.

## Static audit

The generated resolution kit was re-read from GitHub and checked for 21 required controls. **21/21 passed.**

The reconstructed v1.14-CANDIDATE Bible was re-read and checked for 10 release/integration properties. **10/10 passed.**

## Execution status

The repaired lane is `IMPLEMENTED_PENDING_EXECUTION`, not `RUNTIME_PROVEN`.

A new MAME capture was not claimed in this audit. The local execution backend available to this chat failed before a second run could be performed. The existing v1.13 negative run remains valid for the unmodified bad dump.

## Acceptance required to close research runtime empirically

A repaired `CG-PLAN-001` must demonstrate:
- main CPU PC leaves zero;
- nontrivial main-code coverage;
- changing boot/title video state;
- changing expected RAM/sprite/video state;
- clean 120+ frame capture close;
- explicit `NONCANONICAL_HISTORICAL_MAME_REPAIR` provenance;
- zero VERIFIED promotions from that lane alone.

## Source authority

- `mamedev/mame` `mame0131`, commit `4b7dd3cd0de9a22407105730d933383bc78f96a6`
- `mamedev/mame` `mame0131u2`, commit `befc46f2579cf1835a7065d2e90c954eef13c576`
- `mamedev/build` `whatsnew_0131u2.txt`
- `mamedev/mame` `mame0289`, commit `f34f02505e32c1993c6a782b6814232cbfc74e36`
