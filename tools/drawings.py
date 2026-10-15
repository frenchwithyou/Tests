"""Graphs for FWY mock exams, in the black-and-white print style of the exam pictures.

Run:  python3 tools/drawings.py
Writes the four graphs of TEF Mock 1, reading Q22, into mocks/tef-1/img/.
The listening pictures are black-and-white illustrations prepared with tools/pictures.py.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INK = "#111111"


def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" '
            f'aria-label="{title}"><title>{title}</title>{body}</svg>')


# ---------------------------------------------------------------- charts (TEF reading Q22)
def chart(values, title, letter):
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
    body += f'<text x="14" y="{(y0+y1)/2}" font-family="Georgia, Times New Roman, serif" font-size="11" fill="#333" transform="rotate(-90 14 {(y0+y1)/2})" text-anchor="middle">Passagers</text>'
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


def write(path, content):
    p = ROOT / path
    p.parent.mkdir(parents=True, exist_ok=True)
    p.write_text(content, encoding="utf-8")


def main():
    for letter, content in zip("abcd", charts()):
        write(f"mocks/tef-1/img/ce-22-{letter}.svg", content)
    print("graphs written")


if __name__ == "__main__":
    main()
