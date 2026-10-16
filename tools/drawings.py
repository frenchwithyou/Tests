"""Drawings for FWY mock exams, in the black-and-white print style of the exam pictures.

Run:  python3 tools/drawings.py
Writes the graphs of TEF reading Q22 (mocks 1 and 2) and the clocks of TEF mock 2, listening Q3.
The other listening pictures are black-and-white illustrations prepared with tools/pictures.py.
"""
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INK = "#111111"


def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" '
            f'aria-label="{title}"><title>{title}</title>{body}</svg>')


# ---------------------------------------------------------------- charts (TEF reading Q22)
def chart(values, title, letter, ylabel="Passagers"):
    w, h = 320, 220
    x0, y0, x1, y1 = 46, 26, 300, 176
    body = f'<rect x="0" y="0" width="{w}" height="{h}" fill="#fff"/>'
    body += f'<text x="16" y="22" font-family="Georgia, Times New Roman, serif" font-size="14" font-weight="700" fill="{INK}">Graphique {letter}</text>'
    body += f'<line x1="{x0}" y1="{y1}" x2="{x1}" y2="{y1}" stroke="{INK}" stroke-width="2"/><line x1="{x0}" y1="{y0}" x2="{x0}" y2="{y1}" stroke="{INK}" stroke-width="2"/>'
    for i in range(1, 5):
        gy = y1 - i * (y1 - y0) / 5
        body += f'<line x1="{x0}" y1="{gy}" x2="{x1}" y2="{gy}" stroke="#BDBDBD" stroke-width="0.8" stroke-dasharray="3 3"/>'
    months = "JFMAMJJASOND"
    step = (x1 - x0 - 10) / 11
    pts = []
    for i, v in enumerate(values):
        px = x0 + 6 + i * step
        py = y1 - v * (y1 - y0)
        pts.append(f"{px:.1f},{py:.1f}")
        body += f'<text x="{px:.1f}" y="{y1+16}" text-anchor="middle" font-family="Georgia, Times New Roman, serif" font-size="11" fill="#333">{months[i]}</text>'
    body += f'<polyline points="{" ".join(pts)}" fill="none" stroke="#111" stroke-width="3" stroke-linejoin="round" stroke-linecap="round"/>'
    body += f'<text x="14" y="{(y0+y1)/2}" font-family="Georgia, Times New Roman, serif" font-size="11" fill="#333" transform="rotate(-90 14 {(y0+y1)/2})" text-anchor="middle">{ylabel}</text>'
    return svg(w, h, body, title)


def charts():
    a = [.18, .18, .19, .18, .19, .2, .19, .2, .3, .5, .72, .9]
    b = [.9, .84, .8, .74, .68, .62, .56, .5, .44, .38, .32, .26]
    c = [.15, .5, .82, .84, .83, .84, .85, .84, .83, .84, .84, .85]
    d = [.1, .17, .24, .31, .38, .45, .52, .59, .66, .73, .8, .87]
    return [chart(a, "Stable, puis forte hausse à la fin de l'année", "A"),
            chart(b, "Baisse régulière", "B"),
            chart(c, "Forte hausse au début de l'année, puis stabilité", "C"),
            chart(d, "Hausse régulière toute l'année", "D")]


def charts_tef2():
    a = [.12, .2, .27, .34, .41, .48, .55, .62, .69, .76, .83, .9]
    b = [.62, .63, .62, .64, .63, .62, .63, .64, .62, .55, .3, .14]
    c = [.88, .82, .76, .7, .64, .58, .52, .46, .4, .34, .28, .22]
    d = [.5, .51, .5, .52, .5, .34, .22, .2, .4, .6, .78, .9]
    return [chart(a, "Hausse régulière toute l'année", "A", "Ventes"),
            chart(b, "Stable, puis forte baisse à la fin de l'année", "B", "Ventes"),
            chart(c, "Baisse régulière", "C", "Ventes"),
            chart(d, "Baisse pendant l'été, puis forte hausse à la fin de l'année", "D", "Ventes")]


# ---------------------------------------------------------------- clocks (TEF mock 2, listening Q3)
def clock(hour, minute, title):
    w = h = 300
    cx, cy, r = 150, 150, 118
    body = f'<rect x="0" y="0" width="{w}" height="{h}" fill="#fff"/>'
    body += f'<circle cx="{cx}" cy="{cy}" r="{r + 10}" fill="#fff" stroke="{INK}" stroke-width="7"/>'
    body += f'<circle cx="{cx}" cy="{cy}" r="{r - 4}" fill="none" stroke="{INK}" stroke-width="1.2"/>'
    for i in range(60):
        a = math.radians(i * 6)
        long_tick = i % 5 == 0
        r1 = r - (16 if long_tick else 8)
        x1, y1 = cx + r1 * math.sin(a), cy - r1 * math.cos(a)
        x2, y2 = cx + (r - 4) * math.sin(a), cy - (r - 4) * math.cos(a)
        body += (f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{INK}" '
                 f'stroke-width="{4 if long_tick else 1.5}" stroke-linecap="round"/>')
    for n in range(1, 13):
        a = math.radians(n * 30)
        rx, ry = cx + (r - 38) * math.sin(a), cy - (r - 38) * math.cos(a) + 9
        body += (f'<text x="{rx:.1f}" y="{ry:.1f}" text-anchor="middle" font-family="Georgia, Times New Roman, serif" '
                 f'font-size="26" font-weight="700" fill="{INK}">{n}</text>')
    ha = math.radians((hour % 12) * 30 + minute * 0.5)
    ma = math.radians(minute * 6)
    body += (f'<line x1="{cx}" y1="{cy}" x2="{cx + 58 * math.sin(ha):.1f}" y2="{cy - 58 * math.cos(ha):.1f}" '
             f'stroke="{INK}" stroke-width="11" stroke-linecap="round"/>')
    body += (f'<line x1="{cx}" y1="{cy}" x2="{cx + 92 * math.sin(ma):.1f}" y2="{cy - 92 * math.cos(ma):.1f}" '
             f'stroke="{INK}" stroke-width="6" stroke-linecap="round"/>')
    body += f'<circle cx="{cx}" cy="{cy}" r="9" fill="{INK}"/>'
    return svg(w, h, body, title)


def clocks_tef2():
    return [clock(3, 0, "Une horloge qui indique trois heures"),
            clock(2, 30, "Une horloge qui indique deux heures et demie"),
            clock(4, 30, "Une horloge qui indique quatre heures et demie"),
            clock(3, 30, "Une horloge qui indique trois heures et demie")]


def write(path, content):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def main():
    for letter, content in zip("abcd", charts()):
        write(f"mocks/tef-1/img/ce-22-{letter}.svg", content)
    for letter, content in zip("abcd", charts_tef2()):
        write(f"mocks/tef-2/img/ce-22-{letter}.svg", content)
    for letter, content in zip("abcd", clocks_tef2()):
        write(f"mocks/tef-2/img/co-03-{letter}.svg", content)
    print("drawings written")


if __name__ == "__main__":
    main()
