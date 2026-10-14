"""Build the public mock files and the private answer keys.

Usage:
    python3 tools/build.py <private-sources-dir> <private-out-dir>

<private-sources-dir> holds one folder per mock (e.g. tcf-1/) with co.yaml,
ce.yaml, ee.yaml and eo.yaml. Those files contain the answers, so they never
go into this public repository.

Writes:
  mocks/catalog.json                  list of exams, mocks and section status
  mocks/<exam>-<n>/<section>.json     what students see (no answers)
  <out>/FWY Keys.csv                  answer keys to import into the Google Sheet
  <out>/audio-scripts.json            recording list (file, voices, script)
"""
import csv
import json
import re
import sys
from pathlib import Path

import yaml

ROOT = Path(__file__).resolve().parent.parent
MOCKS = ROOT / "mocks"

EXAMS = {
    "tcf": {"name": "TCF Canada"},
    "tef": {"name": "TEF Canada"},
}

# seconds; scale = how the section is reported
SECTIONS = {
    "tcf": {
        "co": {"duration": 35 * 60, "scale": "699"},
        "ce": {"duration": 60 * 60, "scale": "699"},
        "ee": {"duration": 60 * 60, "scale": "20"},
        "eo": {"duration": 12 * 60, "scale": "20"},
    },
    "tef": {
        "co": {"duration": 40 * 60, "scale": "699"},
        "ce": {"duration": 60 * 60, "scale": "699"},
        "ee": {"duration": 60 * 60, "scale": "699"},
        "eo": {"duration": 15 * 60, "scale": "699"},
    },
}

OPINION_OPTIONS = ["Totalement pour.", "Pour, sous certaines conditions.", "Totalement contre.", "Sans opinion."]


def typo(value):
    """French typography: non-breaking space before : ; ! ? » and after «."""
    if isinstance(value, str):
        value = re.sub(r" ([:;!?»])", "\u00a0\\1", value)
        return value.replace("« ", "«\u00a0")
    if isinstance(value, list):
        return [typo(v) for v in value]
    if isinstance(value, dict):
        return {k: typo(v) for k, v in value.items()}
    return value


def tcf_points(n):
    if n <= 4:
        return 3
    if n <= 10:
        return 9
    if n <= 19:
        return 15
    if n <= 29:
        return 21
    if n <= 35:
        return 26
    return 33


def points(exam, n):
    return tcf_points(n) if exam == "tcf" else 1


def build_mcq_section(src, exam, mock, section, keys, audio_list):
    out_screens = []
    count = 0
    for s in src["screens"]:
        kind = s.get("kind", "doc")
        scr = {"id": s["id"], "kind": kind}
        if section == "co":
            scr["audio"] = f"audio/{s['id']}.mp3"
            audio_list.append({
                "file": f"{s['id']}.mp3",
                "label": f"{exam.upper()} {mock} · Compréhension orale · " + (
                    f"Q{s['questions'][0]['n']}" if len(s["questions"]) == 1
                    else f"Q{s['questions'][0]['n']}–{s['questions'][-1]['n']}"),
                "voices": s.get("voices", ""),
                "script": s["script"].strip(),
            })
        for k in ("image", "alt", "prompt", "topic", "speaker", "part", "statement"):
            if s.get(k):
                scr[k] = s[k]
        if s.get("image"):
            scr["image"] = f"img/{s['image']}"
        if s.get("option_images"):
            scr["optionImages"] = [f"img/{f}" for f in s["option_images"]]
            scr["optionAlts"] = s.get("option_alts", [])
        if s.get("gap_sentence"):
            scr["gap"] = s["gap_sentence"]
        if s.get("doc"):
            scr["doc"] = s["doc"]
        qs = []
        for q in s["questions"]:
            count += 1
            n = q["n"]
            pub = {"n": n}
            options = q.get("options")
            if kind == "opinion":
                options = OPINION_OPTIONS
            if kind in ("picture", "audio-options"):
                # the propositions are only heard; the screen shows A B C D
                pass
            else:
                if q.get("question"):
                    pub["q"] = q["question"]
                if options and kind not in ("pictures",) and not s.get("option_images"):
                    pub["options"] = options
            pub = {k: v for k, v in pub.items() if v is not None}
            qs.append(pub)
            keys.append({
                "exam": exam, "mock": mock, "section": section, "q": n,
                "answer": q["answer"], "points": points(exam, n),
                "explanation": q["why"].strip(),
                "options": " | ".join(f"{L}. {t}" for L, t in zip("ABCD", options)) if options else "",
                "question": q.get("question", "") or "",
                "transcript": s.get("script", "").strip() if section == "co" else "",
            })
        scr["questions"] = qs
        out_screens.append(scr)
    maxp = sum(points(exam, k["q"]) for k in keys if k["exam"] == exam and k["mock"] == mock and k["section"] == section)
    return {"screens": out_screens, "count": count, "max": maxp if exam == "tcf" else count}


def build_task_section(src):
    tasks = []
    for t in src["tasks"]:
        task = {k: t[k] for k in ("n", "title", "level", "prompt") if k in t}
        for k in ("words", "advice_minutes", "docs", "prep", "speak", "cues", "poster"):
            if k in t:
                task[k] = t[k]
        tasks.append(task)
    return {"tasks": tasks, "count": len(tasks)}


def main():
    src_dir = Path(sys.argv[1])
    out_dir = Path(sys.argv[2])
    out_dir.mkdir(parents=True, exist_ok=True)
    keys, audio_all = [], {}
    catalog = {"exams": []}
    for exam, info in EXAMS.items():
        entry = {"id": exam, "name": info["name"], "mocks": []}
        for mock_dir in sorted(src_dir.glob(f"{exam}-*")):
            mock = int(mock_dir.name.split("-")[1])
            target = MOCKS / f"{exam}-{mock}"
            sections = {}
            audio_list = []
            for section in ("co", "ce", "ee", "eo"):
                src = typo(yaml.safe_load((mock_dir / f"{section}.yaml").read_text(encoding="utf-8")))
                meta = dict(SECTIONS[exam][section])
                if section in ("co", "ce"):
                    body = build_mcq_section(src, exam, mock, section, keys, audio_list)
                else:
                    body = build_task_section(src)
                data = {"exam": exam, "mock": mock, "section": section, **meta, **body}
                target.mkdir(parents=True, exist_ok=True)
                (target / f"{section}.json").write_text(json.dumps(data, ensure_ascii=False, indent=1), encoding="utf-8")
                ready = True
                if section == "co":
                    missing = [a["file"] for a in audio_list if not (target / "audio" / a["file"]).exists()]
                    ready = not missing
                sections[section] = {"ready": ready, "count": data["count"], "duration": meta["duration"],
                                     "scale": meta["scale"], **({"max": data["max"]} if "max" in data else {})}
            audio_all[f"{exam}-{mock}"] = audio_list
            entry["mocks"].append({"n": mock, "sections": sections})
        catalog["exams"].append(entry)
    (MOCKS / "catalog.json").write_text(json.dumps(catalog, ensure_ascii=False, indent=1), encoding="utf-8")

    with open(out_dir / "FWY Keys.csv", "w", newline="", encoding="utf-8") as f:
        cols = ["exam", "mock", "section", "q", "answer", "points", "explanation", "options", "question", "transcript"]
        w = csv.DictWriter(f, fieldnames=cols)
        w.writeheader()
        for k in keys:
            w.writerow(k)
    (out_dir / "audio-scripts.json").write_text(json.dumps(audio_all, ensure_ascii=False, indent=1), encoding="utf-8")
    print(f"{len(keys)} keys; audio clips:", {k: len(v) for k, v in audio_all.items()})


if __name__ == "__main__":
    main()
