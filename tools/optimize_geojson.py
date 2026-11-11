#!/usr/bin/env python3
import json
from pathlib import Path


FILES = (
    "hydrography.geojson",
    "water-bodies.geojson",
    "roads.geojson",
    "place-labels.geojson",
    "communes.geojson",
)
SOURCE_DIR = Path(__file__).resolve().parent.parent / "data" / "maps"
OUTPUT_DIR = SOURCE_DIR / "optimized"


def round_coordinates(coordinates):
    if not isinstance(coordinates, list):
        return
    if len(coordinates) >= 2 and all(
        isinstance(value, (int, float)) and not isinstance(value, bool)
        for value in coordinates[:2]
    ):
        coordinates[0] = round(coordinates[0], 6)
        coordinates[1] = round(coordinates[1], 6)
        return
    for item in coordinates:
        round_coordinates(item)


def optimize_geometry(geometry):
    if not isinstance(geometry, dict):
        return
    if "coordinates" in geometry:
        round_coordinates(geometry["coordinates"])
    for child in geometry.get("geometries", []):
        optimize_geometry(child)


def main():
    OUTPUT_DIR.mkdir(parents=True, exist_ok=True)
    for filename in FILES:
        source_path = SOURCE_DIR / filename
        output_path = OUTPUT_DIR / filename
        source_bytes = source_path.read_bytes()
        data = json.loads(source_bytes)
        features_before = len(data["features"])

        for feature in data["features"]:
            optimize_geometry(feature.get("geometry"))

        with output_path.open("w", encoding="utf-8", newline="") as output_file:
            json.dump(data, output_file, ensure_ascii=False, separators=(",", ":"))

        features_after = len(data["features"])
        if features_before != features_after:
            raise RuntimeError(
                f"{filename}: conteggio feature cambiato "
                f"({features_before} -> {features_after})"
            )

        output_bytes = output_path.stat().st_size
        print(
            f"{filename}: {len(source_bytes)} -> {output_bytes} byte; "
            f"{features_before} -> {features_after} feature"
        )


if __name__ == "__main__":
    main()
