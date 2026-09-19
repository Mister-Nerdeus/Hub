#!/usr/bin/env python3
"""Create a NONCANONICAL research copy of the historical Choplifter 315-5151 dump.

This reproduces the three in-memory repairs used by MAME 0.131u2-era
DRIVER_INIT(choplift). It never modifies the input file in place and it
never labels the result canonical.

Known historical bad dump:
  size  0x1000
  CRC32 7bd11a6c
  SHA1  2d75a2276e572f97f269af062536c1c58e1c8eaf

Current canonical MAME identity (do not patch):
  CRC32 1377a6ef
  SHA1  b85acd7292e5480c98af1a0492b6b5d3f9b1716c
"""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path
import sys
import zlib

BAD_SIZE = 0x1000
BAD_CRC32 = "7bd11a6c"
BAD_SHA1 = "2d75a2276e572f97f269af062536c1c58e1c8eaf"
CANONICAL_CRC32 = "1377a6ef"
CANONICAL_SHA1 = "b85acd7292e5480c98af1a0492b6b5d3f9b1716c"

PATCHES = (
    (0x0100, 0xD5, 0x55),
    (0x027B, 0xF2, 0xFB),
    (0x02FF, None, 0xF6),
)

LANE = "NONCANONICAL_HISTORICAL_MAME_REPAIR"
AUTHORITY = "MAME mame0131u2 DRIVER_INIT(choplift)"


def digests(data: bytes) -> dict[str, object]:
    return {
        "size": len(data),
        "crc32": f"{zlib.crc32(data) & 0xffffffff:08x}",
        "sha1": hashlib.sha1(data).hexdigest(),
        "sha256": hashlib.sha256(data).hexdigest(),
    }


def repair(data: bytes) -> tuple[bytes, list[dict[str, object]]]:
    before = digests(data)

    if before["sha1"] == CANONICAL_SHA1 and before["crc32"] == CANONICAL_CRC32:
        raise ValueError("input is already the canonical MCU; refusing to patch it")

    if before["size"] != BAD_SIZE or before["crc32"] != BAD_CRC32 or before["sha1"] != BAD_SHA1:
        raise ValueError(
            "input is not the admitted historical bad dump; "
            f"observed size={before['size']} crc32={before['crc32']} sha1={before['sha1']}"
        )

    buf = bytearray(data)
    changes: list[dict[str, object]] = []
    for offset, expected_old, new_value in PATCHES:
        old_value = buf[offset]
        if expected_old is not None and old_value != expected_old:
            raise ValueError(
                f"historical repair-site mismatch at 0x{offset:04x}: "
                f"expected 0x{expected_old:02x}, found 0x{old_value:02x}"
            )
        buf[offset] = new_value
        changes.append(
            {
                "offset_hex": f"0x{offset:04x}",
                "before_hex": f"0x{old_value:02x}",
                "after_hex": f"0x{new_value:02x}",
            }
        )

    return bytes(buf), changes


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("input", type=Path)
    ap.add_argument("output", type=Path)
    ap.add_argument("--manifest", type=Path)
    ns = ap.parse_args()

    src = ns.input.read_bytes()
    before = digests(src)
    try:
        repaired, changes = repair(src)
    except ValueError as exc:
        print(f"FAIL: {exc}", file=sys.stderr)
        return 2

    after = digests(repaired)
    ns.output.parent.mkdir(parents=True, exist_ok=True)
    if ns.output.resolve() == ns.input.resolve():
        print("FAIL: output must not overwrite input", file=sys.stderr)
        return 2
    ns.output.write_bytes(repaired)

    manifest = {
        "schema": "CG-HISTORICAL-MCU-REPAIR-1.0",
        "lane": LANE,
        "promotion_eligible": False,
        "canonical_identity_satisfied": False,
        "authority": AUTHORITY,
        "input": before,
        "repairs": changes,
        "output": after,
        "canonical_reference": {
            "size": BAD_SIZE,
            "crc32": CANONICAL_CRC32,
            "sha1": CANONICAL_SHA1,
        },
        "warning": (
            "This output is a research repair of a historical BAD_DUMP. "
            "It is not the canonical 315-5151 MCU and must not pass a strict source gate."
        ),
    }

    manifest_path = ns.manifest or ns.output.with_suffix(ns.output.suffix + ".research.json")
    manifest_path.write_text(json.dumps(manifest, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(manifest, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
