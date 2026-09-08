"""Generate the static telemetry payloads consumed by the dashboard.

Run this script after adding or changing a ``Tail_666_9/*.mat`` source file.
SciPy and NumPy are authoring dependencies only; they are not deployed.
"""

from __future__ import annotations

import json
from pathlib import Path

import numpy as np
import scipy.io


ROOT = Path(__file__).resolve().parents[1]
SOURCE_DIR = ROOT / "Tail_666_9"
OUTPUT_DIR = ROOT / "public" / "data"
PARAMETERS = ("ALT", "CAS", "PTCH", "ROLL", "VRTG")
TRIMMED_PARAMETERS = {"CAS", "PTCH", "ROLL"}
MAX_POINTS = 2_000


def trim_trailing_zeros(values: np.ndarray, epsilon: float = 1e-9) -> np.ndarray:
    """Remove zero padding without discarding an intentionally all-zero signal."""
    for index in range(len(values) - 1, -1, -1):
        if abs(float(values[index])) > epsilon:
            return values[: index + 1]
    return values


def convert(source: Path) -> dict[str, object]:
    mat = scipy.io.loadmat(
        source,
        variable_names=list(PARAMETERS),
        squeeze_me=True,
    )
    result: dict[str, object] = {}

    for parameter in PARAMETERS:
        if parameter not in mat:
            continue

        struct = mat[parameter]
        values = struct["data"].item()
        step = max(1, (len(values) + MAX_POINTS - 1) // MAX_POINTS)
        values = values[::step]

        if parameter in TRIMMED_PARAMETERS:
            values = trim_trailing_zeros(values)

        np.round(values, 3, out=values)
        names = struct.dtype.names or ()
        result[parameter] = {
            "data": values.tolist(),
            "rate": float(struct["Rate"].item()) if "Rate" in names else 1.0,
            "units": str(struct["Units"].item()) if "Units" in names else "",
            "description": (
                str(struct["Description"].item())
                if "Description" in names
                else parameter
            ),
            "step": step,
        }

    return result


def main() -> None:
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    files = sorted(SOURCE_DIR.glob("*.mat"))

    for source in files:
        destination = OUTPUT_DIR / f"{source.name}.json"
        destination.write_text(
            json.dumps(convert(source), separators=(",", ":")),
            encoding="utf-8",
        )

    (OUTPUT_DIR / "files.json").write_text(
        json.dumps({"files": [source.name for source in files]}, separators=(",", ":")),
        encoding="utf-8",
    )
    print(f"Generated {len(files)} datasets in {OUTPUT_DIR}")


if __name__ == "__main__":
    main()
