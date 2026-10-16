"""Text-to-speech blocks for the listening recordings of one or more mocks.

Usage:
    python3 tools/tts_blocks.py <private-sources-dir> <private-out-dir> tcf-2 tef-2

Writes, in <private-out-dir>:
  tts-blocks.md    the blocks to paste into the text-to-speech tool (one file per block)
  tts-plan.json    which segment of which clip is in which block, to cut the files back into clips

How a script is split into segments:
  - a screen with `voice: n` is read by one voice: the whole script is one segment;
  - a screen with `cast: {LABEL: n}` is a dialogue: each "LABEL : text" line starts a segment,
    and the lines under it (the A, B, C, D options read by the narrator) belong to it.
Voices: 1 and 3 are women, 2 and 4 are men (the same four voices as mock 1).
Blocks hold one voice each, at most 980 characters, segments in clip order; they are sorted by voice.
"""
import json
import re
import sys
from pathlib import Path

import yaml

LIMIT = 980
VOICE_NAMES = {1: "Voix 1 (femme)", 2: "Voix 2 (homme)", 3: "Voix 3 (femme)", 4: "Voix 4 (homme)"}
LABEL = re.compile(r"^([A-ZÀ-ÖØ-Ý][A-ZÀ-ÖØ-Ý' ()0-9-]{1,30})\s*:\s*(.*)$")


def lead_seconds(exam, questions):
    """Silence before the recording starts, so the student can read the question first."""
    if exam == "tcf":
        return 1.5 if questions[0] <= 10 else 3.0
    return 3.0 if len(questions) > 1 else 1.5


def segments(screen):
    script = screen["script"].strip()
    if "voice" in screen:
        return [{"voice": int(screen["voice"]), "text": script}]
    cast = screen.get("cast") or {}
    out = []
    for line in script.split("\n"):
        line = line.strip()
        if not line:
            continue
        m = LABEL.match(line)
        if m and m.group(1).strip() in cast:
            out.append({"voice": int(cast[m.group(1).strip()]), "text": m.group(2).strip()})
        elif out:
            out[-1]["text"] += "\n" + line
        else:
            raise SystemExit(f"{screen['id']}: line without a known speaker: {line!r}")
    return out


def main():
    src_dir, out_dir, mocks = Path(sys.argv[1]), Path(sys.argv[2]), sys.argv[3:]
    out_dir.mkdir(parents=True, exist_ok=True)
    clips, segs = {}, []
    for mock in mocks:
        exam = mock.split("-")[0]
        data = yaml.safe_load((src_dir / mock / "co.yaml").read_text(encoding="utf-8"))
        for screen in data["screens"]:
            key = f"{mock}/{screen['id']}"
            parts = segments(screen)
            qs = [q["n"] for q in screen["questions"]]
            clips[key] = {"file": f"{screen['id']}.mp3", "lead": lead_seconds(exam, qs), "segments": len(parts)}
            for i, p in enumerate(parts):
                if len(p["text"]) > LIMIT:
                    raise SystemExit(f"{key} segment {i + 1} is longer than {LIMIT} characters")
                segs.append({"clip": key, "seg": i, "voice": p["voice"], "text": p["text"]})
    blocks = []
    for v in (1, 2, 3, 4):
        cur, size = [], 0
        for s in [x for x in segs if x["voice"] == v]:
            add = len(s["text"]) + (2 if cur else 0)
            if cur and size + add > LIMIT:
                blocks.append((v, cur))
                cur, size, add = [], 0, len(s["text"])
            cur.append(s)
            size += add
        if cur:
            blocks.append((v, cur))
    plan, md = [], []
    for i, (v, ss) in enumerate(blocks, 1):
        name = f"Bloc {i:02d}"
        text = "\n\n".join(s["text"] for s in ss)
        plan.append({"block": name, "voice": v, "chars": len(text),
                     "segments": [{"clip": s["clip"], "seg": s["seg"], "chars": len(s["text"]), "text": s["text"]} for s in ss]})
        md.append(f"**{name}** — {VOICE_NAMES[v]}\n```\n{text}\n```")
    (out_dir / "tts-plan.json").write_text(json.dumps({"clips": clips, "blocks": plan}, ensure_ascii=False, indent=1), encoding="utf-8")
    (out_dir / "tts-blocks.md").write_text("\n\n".join(md) + "\n", encoding="utf-8")
    by_voice = {v: [b["block"] for b in plan if b["voice"] == v] for v in (1, 2, 3, 4)}
    print(len(segs), "segments in", len(plan), "blocks;",
          ", ".join(f"voice {v}: {b[0][-2:]}–{b[-1][-2:]}" for v, b in by_voice.items() if b))


if __name__ == "__main__":
    main()
