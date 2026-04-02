import csv
import struct
from collections import Counter
from pathlib import Path

ROOT = Path("fonts")
OUT = Path("_reports") / "font_license_audit.csv"

NAME_IDS = {
    0: "copyright",
    1: "family",
    2: "subfamily",
    4: "full_name",
    5: "version",
    7: "trademark",
    8: "manufacturer",
    9: "designer",
    13: "license_description",
    14: "license_url",
}

OPEN_KEYWORDS = [
    "open font license",
    "sil ofl",
    "apache license",
    "font exception",
    "ubuntu font licence",
]

RESTRICTED_KEYWORDS = [
    "all rights reserved",
    "adobe systems incorporated",
    "monotype",
    "microsoft",
    "linotype",
    "not for resale",
    "proprietary",
    "may not be distributed",
]

EXTS = {".ttf", ".otf", ".ttc", ".otc"}


def read_u16(data: bytes, offset: int) -> int:
    return struct.unpack_from(">H", data, offset)[0]


def read_u32(data: bytes, offset: int) -> int:
    return struct.unpack_from(">I", data, offset)[0]


def decode_name(platform_id: int, raw: bytes) -> str:
    if platform_id in (0, 3):
        return raw.decode("utf-16-be", errors="replace").strip("\x00").strip()
    return raw.decode("mac_roman", errors="replace").strip("\x00").strip()


def get_sfnt_offsets(data: bytes) -> list[int]:
    if len(data) < 12:
        return []
    if data[:4] == b"ttcf":
        num_fonts = read_u32(data, 8)
        offsets = []
        for i in range(num_fonts):
            entry_offset = 12 + (i * 4)
            if entry_offset + 4 <= len(data):
                offsets.append(read_u32(data, entry_offset))
        return offsets
    return [0]


def parse_name_table(data: bytes, sfnt_offset: int) -> dict[str, str]:
    num_tables = read_u16(data, sfnt_offset + 4)
    table_dir = sfnt_offset + 12

    name_table_offset = None
    for i in range(num_tables):
        record = table_dir + (i * 16)
        if record + 16 > len(data):
            continue
        tag = data[record : record + 4]
        if tag == b"name":
            name_table_offset = read_u32(data, record + 8)
            break

    if name_table_offset is None or name_table_offset + 6 > len(data):
        return {}

    count = read_u16(data, name_table_offset + 2)
    string_offset = read_u16(data, name_table_offset + 4)
    records_start = name_table_offset + 6
    strings_base = name_table_offset + string_offset

    values: dict[int, list[str]] = {key: [] for key in NAME_IDS}

    for i in range(count):
        record = records_start + (i * 12)
        if record + 12 > len(data):
            continue

        platform_id = read_u16(data, record)
        name_id = read_u16(data, record + 6)
        length = read_u16(data, record + 8)
        offset = read_u16(data, record + 10)

        if name_id not in NAME_IDS:
            continue

        start = strings_base + offset
        end = start + length
        if start < 0 or end > len(data) or end <= start:
            continue

        text = decode_name(platform_id, data[start:end])
        if text and text not in values[name_id]:
            values[name_id].append(text)

    return {
        NAME_IDS[name_id]: " | ".join(texts)
        for name_id, texts in values.items()
        if texts
    }


def classify(metadata: dict[str, str]) -> str:
    blob = " ".join(
        str(metadata.get(field, "")).lower()
        for field in (
            "copyright",
            "license_description",
            "license_url",
            "manufacturer",
        )
    )

    if any(keyword in blob for keyword in OPEN_KEYWORDS):
        return "likely-open-source"
    if any(keyword in blob for keyword in RESTRICTED_KEYWORDS):
        return "likely-restricted"
    if blob.strip():
        return "unknown-needs-manual-check"
    return "no-license-metadata"


rows = []
for font_path in sorted(ROOT.glob("*")):
    if not font_path.is_file() or font_path.suffix.lower() not in EXTS:
        continue

    try:
        data = font_path.read_bytes()
        offsets = get_sfnt_offsets(data)
        if not offsets:
            rows.append(
                {
                    "file": font_path.name,
                    "status": "unreadable-font",
                    "classification": "unknown-needs-manual-check",
                }
            )
            continue

        merged: dict[str, str] = {}
        for sfnt_offset in offsets:
            if sfnt_offset + 12 > len(data):
                continue
            metadata = parse_name_table(data, sfnt_offset)
            for key, value in metadata.items():
                if key not in merged:
                    merged[key] = value

        merged["file"] = font_path.name
        merged["status"] = "ok"
        merged["classification"] = classify(merged)
        rows.append(merged)

    except Exception as error:  # noqa: BLE001
        rows.append(
            {
                "file": font_path.name,
                "status": f"error: {error}",
                "classification": "unknown-needs-manual-check",
            }
        )

fieldnames = ["file", "classification", "status"] + [
    NAME_IDS[key] for key in sorted(NAME_IDS.keys())
]
with OUT.open("w", newline="", encoding="utf-8") as output_file:
    writer = csv.DictWriter(output_file, fieldnames=fieldnames)
    writer.writeheader()
    for row in rows:
        writer.writerow({field: row.get(field, "") for field in fieldnames})

counts = Counter(row.get("classification", "unknown") for row in rows)
print(f"Wrote {OUT} with {len(rows)} font entries")
for label in sorted(counts):
    print(f"{label}: {counts[label]}")
