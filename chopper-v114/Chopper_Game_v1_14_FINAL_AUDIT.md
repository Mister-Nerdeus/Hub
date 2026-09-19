# Chopper Game v1.14 — Final Research Audit

## Decision

**v1.14 research release: PASS**  
**Historical repaired-MCU startup blocker: RESOLVED at independent-model level**  
**Pinned MAME repaired-MCU confirmation: NOT_RUN_ENVIRONMENT_BLOCKED**  
**Rendered title/framebuffer proof: NOT_PROVEN**  
**Canonical MCU gate: BLOCKED**  
**Strict arcade fidelity: NO-GO**  
**VERIFIED promotions created: 0**

The release is intentionally narrower than a MAME/canonical runtime certification.

## Empirical result

The exact historical BAD_DUMP already supplied by the user was repaired only at the three addresses documented by MAME 0.131u2.

An independent 8751 behavioral run, using the protected main program/bank ROMs and the pinned MAME 0.289 external-bus/control contract, reached Z80 BUSREQ deassertion at interpreted MCU instruction **2,177,605**. Immediately before release the firmware wrote:

- PPI control 0x17 = 0xC0;
- port A 0x14 = 0x00;
- port B 0x15 = 0x40;
- port C 0x16 = 0x00.

A second independent Z80 run started from exactly that observed PPI state. It left PC=0, changed PPI B to 0x4C, selected **bank 3**, and executed **1,127,010** interpreted instructions / **8,000,043** nominal cycles over **120** nominal frame-equivalent intervals.

Observed writes:

| Domain | Writes |
| --- | ---: |
| work RAM | 124,246 |
| sprite RAM | 2,048 |
| palette RAM | 2,050 |
| video RAM | 4,116 |

No interpreter exception was reported in the bounded Z80 probe.

## Independent authority pins

- Historical repair authority: MAME `mame0131u2`, commit `befc46f2579cf1835a7065d2e90c954eef13c576`.
- Current target authority: MAME `mame0289`, commit `f34f02505e32c1993c6a782b6814232cbfc74e36`.
- 8751 interpreter: Aimini/js51 `binary_decoder`, commit `7faca5ed5935857e74fd7737d9ed7fea5b819f8a`, with documented MOVX/P2 and SFR adaptations.
- Z80 interpreter: DrGoldfire/Z80.js, commit `2207d7c6a8b42246ea12efbf9dba8b2adf010437`.

## Audit

The completed v1.14 Bible and machine-readable evidence were re-read after publication. **24/24 audit conditions passed**, including:

- release identity is v1.14 and no candidate token remains;
- exact historical repair statements are present in MAME 0.131u2 source;
- current MAME canonical MCU CRC remains `1377a6ef`;
- BUSREQ release is recorded;
- exact PPI initialization is recorded;
- main Z80 leaves PC=0 and enters bank 3;
- RAM/sprite/palette/video mutation is recorded;
- 120 research intervals are recorded;
- `promotion_eligible=false`;
- canonical identity remains false;
- repaired-MAME confirmation is not falsely claimed;
- rendered-title proof is not falsely claimed;
- strict fidelity remains NO-GO.

## Boundaries

The independent model is not a replacement for MAME. It does not model the complete post-release machine, exact System 2 wait states, raster rendering, collision hardware, sound CPU coexecution or cycle-certified 8751 timing. The 120 intervals are nominal research intervals, not a preserved arcade clock proof.

Therefore this release may support **candidate research and implementation planning only**. It may not create a VERIFIED semantic binding, approve a strict gameplay parameter, or close the canonical MCU/protection gate.

## Next strict test

When a native runner is available, execute the repaired lane under the exact pinned MAME 0.289 artifact and capture the same startup transition. Later, an authorized canonical MCU must be used in a disjoint held-out run before strict protection/gameplay semantics can be promoted.
