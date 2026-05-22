import json
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[4]
FIXTURE_PATH = ROOT / "packages" / "shared" / "fixtures" / "plan-er-pod-phase2.json"


def load_phase2_plan() -> dict[str, Any]:
    with FIXTURE_PATH.open(encoding="utf-8") as fixture:
        return json.load(fixture)
