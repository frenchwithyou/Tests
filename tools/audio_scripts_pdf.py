"""Make the teacher's recording sheet (PDF, FWY house style) from audio-scripts.json.

Usage: python3 tools/audio_scripts_pdf.py <audio-scripts.json> <out.pdf>
"""
import json
import re
import sys
from pathlib import Path

from reportlab.lib.colors import HexColor, white, black
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.platypus import (BaseDocTemplate, Frame, KeepTogether, PageBreak, PageTemplate, Paragraph, Spacer,
                                Table, TableStyle)

ROOT = Path(__file__).resolve().parent.parent
LOGO = str(ROOT / "assets/img/fwy-logo.png")
W, H = A4
BLUE, RULE, NAVY, RED, GREY, TINT, GRID = (HexColor(c) for c in ("#2A6099", "#3465A4", "#10233B", "#C8102E", "#5B6675", "#EEF3F9", "#C9D3E0"))

F = "/usr/share/fonts/truetype/"
for name, path in [("Serif", "liberation/LiberationSerif-Regular.ttf"), ("Serif-B", "liberation/LiberationSerif-Bold.ttf"),
                   ("Serif-BI", "liberation/LiberationSerif-BoldItalic.ttf"), ("Serif-I", "liberation/LiberationSerif-Italic.ttf"),
                   ("Sans-B", "dejavu/DejaVuSans-Bold.ttf"), ("Body", "crosextra/Caladea-Regular.ttf"), ("Body-B", "crosextra/Caladea-Bold.ttf")]:
    pdfmetrics.registerFont(TTFont(name, F + path))

ST = {
    "title": ParagraphStyle("title", fontName="Serif-B", fontSize=20, textColor=BLUE, alignment=TA_CENTER, leading=24, spaceAfter=10),
    "h": ParagraphStyle("h", fontName="Serif-B", fontSize=15, textColor=BLUE, leading=19, spaceBefore=8, spaceAfter=4),
    "body": ParagraphStyle("body", fontName="Body", fontSize=13.5, leading=18.5, spaceAfter=5),
    "small": ParagraphStyle("small", fontName="Body", fontSize=11, leading=14.5, textColor=GREY),
    "script": ParagraphStyle("script", fontName="Body", fontSize=13.5, leading=18.5, spaceAfter=3),
    "warn": ParagraphStyle("warn", fontName="Body-B", fontSize=11.5, leading=15, textColor=RED),
}


def cover(c, doc):
    c.saveState()
    c.linearGradient(0, H, W, 0, (HexColor("#000000"), HexColor("#10233B"), HexColor("#2A6099")), extend=False)
    c.drawImage(LOGO, 62, H - 61 - 60, width=110, height=60, mask="auto")
    c.setFillColor(white)
    c.setFont("Sans-B", 18); c.drawString(184, H - 84, "FRENCH"); c.drawString(184, H - 106, "WITH YOU")
    c.setFont("Serif-BI", 18); c.drawString(184, H - 130, "Speak French confidently!")
    c.setFont("Serif-B", 36); c.drawString(57, H - 228, "Audio scripts")
    c.setFillColor(HexColor("#6FA0FF")); c.drawString(57, H - 270, "TCF 1 and TEF 1")
    c.setStrokeColor(RULE); c.setLineWidth(3); c.line(57, H - 290, 200, H - 290)
    c.setFillColor(white); c.setFont("Serif-B", 18)
    c.drawString(57, H - 330, "Every listening recording for the two")
    c.drawString(57, H - 354, "first mock exams, ready to record.")
    c.setFont("Serif-B", 14); c.setFillColor(HexColor("#FF8A80"))
    c.drawString(57, H - 400, "Teacher only — these scripts contain the answers.")
    c.setFillColor(white); c.setFont("Serif-I", 16)
    c.drawString(57, 120, "Prepared for:"); c.drawString(57, 98, "Gelo"); c.drawString(57, 76, "— FrenchWithYou.")
    c.restoreState()


def page(c, doc):
    c.saveState()
    p = c.beginPath()
    for i, (x, y) in enumerate([(0, 58), (317, 58), (283, 117), (34, 117)]):
        (p.moveTo if i == 0 else p.lineTo)(x, H - y)
    p.close(); c.setFillColor(black); c.drawPath(p, fill=1, stroke=0)
    c.drawImage(LOGO, 52, H - 108, width=66, height=36, mask="auto")
    c.setFillColor(white); c.setFont("Sans-B", 14); c.drawString(126, H - 84, "FRENCH WITH YOU")
    c.setFont("Serif-BI", 12); c.drawString(126, H - 101, "Speak French confidently!")
    c.setStrokeColor(RULE); c.setLineWidth(3); c.line(0, H - 122, 490, H - 122)
    c.setFillColor(black); c.rect(0, 0, W, 21, fill=1, stroke=0)
    c.roundRect(W - 78, 6, 58, 40, 9, fill=1, stroke=0)
    c.setFillColor(white); c.setFont("Sans-B", 20); c.drawCentredString(W - 49, 18, "%02d" % (doc.page - 1))
    c.restoreState()


SPEAKER = re.compile(r"^([A-ZÀ-ÖØ-Ý][A-ZÀ-ÖØ-Ý' ()0-9-]{1,30})\s*:\s*(.*)$")


def script_paras(text):
    out = []
    for line in text.split("\n"):
        line = line.strip()
        if not line:
            continue
        line = line.replace("&", "&amp;").replace("<", "&lt;").replace(">", "&gt;")
        m = SPEAKER.match(line)
        if m:
            out.append(Paragraph(f'<font name="Body-B" color="#2A6099">{m.group(1).strip()}</font>&nbsp;: {m.group(2)}', ST["script"]))
        else:
            out.append(Paragraph(line, ST["script"]))
    return out


def clip_name(mock, file):
    exam, n = mock.split("-")
    return f"{exam.upper()}{n} CO {file.split('-')[1].split('.')[0]}"


def build(data, out):
    doc = BaseDocTemplate(out, pagesize=A4, leftMargin=36, rightMargin=36, topMargin=150, bottomMargin=60,
                          title="FWY Audio scripts — TCF 1 and TEF 1", author="FrenchWithYou")
    frame = Frame(36, 60, W - 72, H - 150 - 60, id="f")
    doc.addPageTemplates([PageTemplate(id="cover", frames=[frame], onPage=cover), PageTemplate(id="page", frames=[frame], onPage=page)])
    total = sum(len(v) for v in data.values())
    story = [Spacer(1, 1)]
    from reportlab.platypus.doctemplate import NextPageTemplate
    story += [NextPageTemplate("page"), PageBreak()]
    story.append(Paragraph("How to record", ST["title"]))
    tips = [
        f"<b>{total} short clips</b>: {len(data.get('tcf-1', []))} for TCF 1 and {len(data.get('tef-1', []))} for TEF 1. One file per clip.",
        "<b>Name each file</b> with the clip name in blue (e.g. <i>TCF1 CO 05</i>). Any format is fine: phone voice memo, m4a, mp3, wav.",
        "<b>Quiet room</b>, phone about 20–30 cm from your mouth. Read naturally, at normal speed; read the first TCF clips (A1–A2) a little slower.",
        "<b>Dialogues</b>: both voices in the same file, one after the other, with a short natural pause between turns. Use different people when you can.",
        "<b>Lines in capitals</b> (NARRATRICE, ANNONCE…) show who speaks. Don't read the labels aloud.",
        "<b>No silence needed at the start or end</b>: I add the reading time and trim each file.",
        "<b>Text-to-speech instead?</b> Paste each script into the tool, choose one voice per speaker, export as MP3, and check that your plan allows commercial use.",
        "<b>Send everything here</b> in this chat (a zip is fine). I convert, check and put them online.",
    ]
    for tip in tips:
        story.append(Paragraph("• " + tip, ST["body"]))
    story.append(Spacer(1, 8))
    story.append(Paragraph("Teacher only. Never share these scripts with students: they contain the answers.", ST["warn"]))
    for mock, clips in data.items():
        story.append(PageBreak())
        story.append(Paragraph(("TCF Canada" if mock.startswith("tcf") else "TEF Canada") + " — Mock exam 1 — Listening", ST["title"]))
        rows = [[Paragraph("<b>Clip</b>", ST["small"]), Paragraph("<b>Questions</b>", ST["small"]), Paragraph("<b>Voices</b>", ST["small"])]]
        for c in clips:
            rows.append([Paragraph(clip_name(mock, c["file"]), ST["small"]), Paragraph(c["label"].split("· ")[-1], ST["small"]), Paragraph(c["voices"], ST["small"])])
        t = Table(rows, colWidths=[78, 70, W - 72 - 148], repeatRows=1)
        t.setStyle(TableStyle([("GRID", (0, 0), (-1, -1), 0.5, GRID), ("BACKGROUND", (0, 0), (-1, 0), TINT), ("VALIGN", (0, 0), (-1, -1), "TOP")]))
        story.append(t)
        story.append(PageBreak())
        for c in clips:
            block = [Paragraph(f'{clip_name(mock, c["file"])} <font name="Body" size="11" color="#5B6675">— {c["label"].split("· ")[-1]}</font>', ST["h"]),
                     Paragraph("Voices: " + c["voices"], ST["small"]), Spacer(1, 4)]
            block += script_paras(c["script"])
            block.append(Spacer(1, 10))
            story.append(KeepTogether(block))
    doc.build(story)


if __name__ == "__main__":
    build(json.loads(Path(sys.argv[1]).read_text(encoding="utf-8")), sys.argv[2])
    print("written", sys.argv[2])
