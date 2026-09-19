# Chopper Game v1.15 — Final Runtime Audit

## Release verdict

**Research release: PASS**  
**Repaired-MCU MAME runtime: PASS**  
**Exact 120-screen-frame gate: PASS**  
**Rendered title/attract gate: PASS**  
**Canonical MCU gate: BLOCKED**  
**Strict arcade fidelity: NO-GO**  
**VERIFIED promotions created: 0**

## Acceptance checks

1. MAME reports 0.289: PASS.
2. MAME binary SHA-256 pinned: PASS.
3. Historical BAD_DUMP identity retained: PASS.
4. Only three historical repair sites applied: PASS.
5. Repaired image explicitly noncanonical: PASS.
6. MAME warns against canonical MCU checksum: PASS.
7. Main PC observed at 0 before release: PASS.
8. Main PC observed nonzero after release: PASS.
9. Release time bounded at 5.341440–5.358080 s: PASS.
10. Bank 3 observed at release: PASS.
11. PPI write 0x17=0xC0 observed: PASS.
12. PPI write 0x14=0x00 observed: PASS.
13. PPI write 0x15=0x40 observed: PASS.
14. PPI write 0x16=0x00 observed: PASS.
15. Main read 0x15=0x40 observed: PASS.
16. Main write 0x15=0x4C observed: PASS.
17. Runtime event stream captured: PASS.
18. Event drops reported as zero: PASS.
19. Exact second run uses screen frame numbers: PASS.
20. First screen frame is 321: PASS.
21. Last screen frame is 440: PASS.
22. Exactly 120 screen frames: PASS.
23. Frame-number gaps zero: PASS.
24. Work-RAM state changes: PASS.
25. Palette state changes: PASS.
26. Video-window state changes: PASS.
27. Visible pixels change: PASS.
28. IC CHECK rendered: PASS.
29. 120-second visual probe completed: PASS.
30. Title screen rendered: PASS.
31. License/copyright screen rendered: PASS.
32. Attract/gameplay screen rendered: PASS.
33. Game Over rendered: PASS.
34. Mission/hostage attract screen rendered: PASS.
35. v1.13 permanent-stall conclusion corrected: PASS.
36. promotion_eligible remains false: PASS.
37. canonical_identity_satisfied remains false: PASS.
38. Canonical MCU remains a strict dependency: PASS.
39. VERIFIED semantic/gameplay promotions remain zero: PASS.
40. Strict fidelity remains NO-GO: PASS.

**40/40 bounded v1.15 audit checks pass.**

The strict gate remains intentionally open because repaired historical bytes are not the canonical 315-5151 image.
