"""Original illustrations for FWY mock exams (flat SVG).

Run:  python3 tools/drawings.py
Writes the pictures used by TCF Mock 1 (listening Q1-4) and TEF Mock 1
(listening Q1-4, reading Q22) into mocks/<exam>-1/img/.
"""
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
INK = "#1F2A37"
SKIN = ["#F2C9A0", "#C98E62", "#8D5A3B", "#E8B48A"]


def svg(w, h, body, title):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {w} {h}" role="img" '
            f'aria-label="{title}"><title>{title}</title>{body}</svg>')


def person(x, y, shirt, skin=SKIN[0], hair="#3B2A20", legs="#2A3B55", s=1.0,
           arm_l=None, arm_r=None, skirt=False, hat=None, apron=False):
    """Simple standing person; (x, y) = feet centre. Arms: list of (dx, dy) hand offsets."""
    h = 150 * s
    head_r = 17 * s
    top = y - h
    body_w = 40 * s
    parts = []
    # legs
    if skirt:
        parts.append(f'<path d="M{x-24*s} {y-62*s} L{x+24*s} {y-62*s} L{x+30*s} {y-30*s} L{x-30*s} {y-30*s} Z" fill="{shirt}" stroke="{INK}" stroke-width="2.5"/>')
        parts.append(f'<rect x="{x-12*s}" y="{y-30*s}" width="7" height="{30*s}" fill="{skin}" stroke="{INK}" stroke-width="2"/>')
        parts.append(f'<rect x="{x+5*s}" y="{y-30*s}" width="7" height="{30*s}" fill="{skin}" stroke="{INK}" stroke-width="2"/>')
    else:
        parts.append(f'<rect x="{x-17*s}" y="{y-60*s}" width="{15*s}" height="{60*s}" rx="4" fill="{legs}" stroke="{INK}" stroke-width="2.5"/>')
        parts.append(f'<rect x="{x+2*s}" y="{y-60*s}" width="{15*s}" height="{60*s}" rx="4" fill="{legs}" stroke="{INK}" stroke-width="2.5"/>')
    # torso
    parts.append(f'<rect x="{x-body_w/2}" y="{top+2*head_r+4*s}" width="{body_w}" height="{62*s}" rx="{12*s}" fill="{shirt}" stroke="{INK}" stroke-width="2.5"/>')
    if apron:
        parts.append(f'<rect x="{x-14*s}" y="{top+2*head_r+16*s}" width="{28*s}" height="{58*s}" rx="5" fill="#FFFFFF" stroke="{INK}" stroke-width="2"/>')
    shoulder_y = top + 2 * head_r + 14 * s
    for side, arm in ((-1, arm_l), (1, arm_r)):
        sx = x + side * (body_w / 2 - 4 * s)
        hx, hy = arm if arm else (side * 26 * s, 52 * s)
        parts.append(f'<line x1="{sx}" y1="{shoulder_y}" x2="{sx+hx}" y2="{shoulder_y+hy}" stroke="{INK}" stroke-width="{11*s}" stroke-linecap="round"/>')
        parts.append(f'<line x1="{sx}" y1="{shoulder_y}" x2="{sx+hx}" y2="{shoulder_y+hy}" stroke="{shirt}" stroke-width="{7*s}" stroke-linecap="round"/>')
        parts.append(f'<circle cx="{sx+hx}" cy="{shoulder_y+hy}" r="{5.5*s}" fill="{skin}" stroke="{INK}" stroke-width="2"/>')
    # head
    cy = top + head_r + 2 * s
    parts.append(f'<circle cx="{x}" cy="{cy}" r="{head_r}" fill="{skin}" stroke="{INK}" stroke-width="2.5"/>')
    parts.append(f'<path d="M{x-head_r} {cy-2*s} A{head_r} {head_r} 0 0 1 {x+head_r} {cy-2*s} L{x+head_r-3*s} {cy-8*s} Q{x} {cy-14*s} {x-head_r+3*s} {cy-8*s} Z" fill="{hair}" stroke="{INK}" stroke-width="2"/>')
    parts.append(f'<circle cx="{x-6*s}" cy="{cy+2*s}" r="{1.8*s}" fill="{INK}"/><circle cx="{x+6*s}" cy="{cy+2*s}" r="{1.8*s}" fill="{INK}"/>')
    parts.append(f'<path d="M{x-5*s} {cy+9*s} Q{x} {cy+13*s} {x+5*s} {cy+9*s}" fill="none" stroke="{INK}" stroke-width="1.8" stroke-linecap="round"/>')
    if hat == "chef":
        parts.append(f'<path d="M{x-15*s} {cy-12*s} L{x-15*s} {cy-26*s} Q{x-22*s} {cy-42*s} {x-6*s} {cy-38*s} Q{x} {cy-50*s} {x+8*s} {cy-38*s} Q{x+24*s} {cy-42*s} {x+15*s} {cy-26*s} L{x+15*s} {cy-12*s} Z" fill="#FFFFFF" stroke="{INK}" stroke-width="2.2"/>')
    if hat == "tuque":
        parts.append(f'<path d="M{x-head_r-1} {cy-3*s} Q{x} {cy-36*s} {x+head_r+1} {cy-3*s} Z" fill="{shirt}" stroke="{INK}" stroke-width="2.2"/>')
        parts.append(f'<circle cx="{x}" cy="{cy-24*s}" r="{5*s}" fill="#FFFFFF" stroke="{INK}" stroke-width="2"/>')
    return "".join(parts)


def frame(w, h, bg):
    return f'<rect x="1.5" y="1.5" width="{w-3}" height="{h-3}" rx="14" fill="{bg}" stroke="{INK}" stroke-width="3"/>'


# ---------------------------------------------------------------- TCF scenes
def tcf_bakery():
    w, h = 400, 300
    b = frame(w, h, "#FFF6E8")
    b += '<rect x="20" y="20" width="360" height="40" rx="8" fill="#2A6099" stroke="#1F2A37" stroke-width="2.5"/>'
    b += '<text x="200" y="47" text-anchor="middle" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#fff" letter-spacing="2">BOULANGERIE</text>'
    # shelves with bread
    for i, yy in enumerate((82, 122)):
        b += f'<rect x="30" y="{yy+22}" width="150" height="6" fill="#8A5A36" stroke="#1F2A37" stroke-width="2"/>'
        for k in range(3):
            bx = 45 + k * 45
            b += f'<ellipse cx="{bx+12}" cy="{yy+13}" rx="18" ry="10" fill="#D99A4E" stroke="#1F2A37" stroke-width="2"/>'
            b += f'<path d="M{bx} {yy+11} l6 -5 M{bx+10} {yy+12} l6 -5 M{bx+20} {yy+12} l6 -5" stroke="#1F2A37" stroke-width="1.6"/>'
    # baker behind counter
    b += person(150, 260, "#FFFFFF", skin=SKIN[1], hair="#2B1D14", hat="chef", apron=True,
                arm_r=(52, 6), s=0.95)
    # counter
    b += '<rect x="20" y="200" width="360" height="85" rx="6" fill="#B07A4A" stroke="#1F2A37" stroke-width="3"/>'
    b += '<rect x="20" y="200" width="360" height="14" fill="#8A5A36" stroke="#1F2A37" stroke-width="2.5"/>'
    # baguette passing across
    b += '<rect x="168" y="146" width="110" height="16" rx="8" fill="#E2A75B" stroke="#1F2A37" stroke-width="2.5" transform="rotate(-8 223 154)"/>'
    b += '<path d="M185 152 l8 -7 M205 150 l8 -7 M225 147 l8 -7 M245 144 l8 -7" stroke="#1F2A37" stroke-width="1.8" transform="rotate(-8 223 154)"/>'
    # customer in front (seen from side), dress
    b += person(305, 292, "#C8102E", skin=SKIN[0], hair="#7A4A23", skirt=True,
                arm_l=(-30, -2), s=1.0)
    return svg(w, h, b, "Une femme achète une baguette à la boulangerie")


def tcf_train():
    w, h = 400, 300
    b = frame(w, h, "#EAF1F8")
    # station roof
    b += '<rect x="1.5" y="1.5" width="397" height="34" rx="12" fill="#10233B"/>'
    # sign
    b += '<rect x="250" y="48" width="110" height="34" rx="6" fill="#2A6099" stroke="#1F2A37" stroke-width="2.5"/>'
    b += '<text x="305" y="71" text-anchor="middle" font-family="Arial, sans-serif" font-size="17" font-weight="700" fill="#fff">Quai 2</text>'
    # clock
    b += '<circle cx="70" cy="70" r="24" fill="#fff" stroke="#1F2A37" stroke-width="3"/><line x1="70" y1="70" x2="70" y2="54" stroke="#1F2A37" stroke-width="3"/><line x1="70" y1="70" x2="82" y2="74" stroke="#1F2A37" stroke-width="3"/>'
    # rails
    b += '<rect x="1.5" y="232" width="397" height="66" fill="#9AA3AE"/>'
    b += '<line x1="0" y1="262" x2="400" y2="262" stroke="#5B6675" stroke-width="5"/><line x1="0" y1="286" x2="400" y2="286" stroke="#5B6675" stroke-width="5"/>'
    # train front arriving from left
    b += '<path d="M20 120 Q20 98 44 98 L210 98 Q236 98 236 124 L236 250 L20 250 Z" fill="#C8102E" stroke="#1F2A37" stroke-width="3"/>'
    b += '<rect x="40" y="116" width="74" height="48" rx="6" fill="#CFE3F5" stroke="#1F2A37" stroke-width="2.5"/>'
    b += '<rect x="132" y="116" width="74" height="48" rx="6" fill="#CFE3F5" stroke="#1F2A37" stroke-width="2.5"/>'
    b += '<rect x="20" y="186" width="216" height="12" fill="#fff" stroke="#1F2A37" stroke-width="2"/>'
    b += '<circle cx="50" cy="222" r="9" fill="#FFE27A" stroke="#1F2A37" stroke-width="2.5"/><circle cx="206" cy="222" r="9" fill="#FFE27A" stroke="#1F2A37" stroke-width="2.5"/>'
    # platform edge
    b += '<rect x="236" y="218" width="163" height="18" fill="#D7DDE4" stroke="#1F2A37" stroke-width="2.5"/>'
    # man looking at his watch (left arm raised to face)
    b += person(318, 222, "#2E7D6B", skin=SKIN[2], hair="#111", legs="#33415C", s=0.9,
                arm_l=(8, 8), arm_r=(24, 46))
    b += '<rect x="327" y="114" width="9" height="9" rx="2" fill="#FFE27A" stroke="#1F2A37" stroke-width="2"/>'
    # suitcase
    b += '<rect x="352" y="186" width="28" height="34" rx="4" fill="#B4462B" stroke="#1F2A37" stroke-width="2.5"/><path d="M360 186 v-8 h12 v8" fill="none" stroke="#1F2A37" stroke-width="2.5"/>'
    return svg(w, h, b, "Un homme attend le train sur le quai")


def tcf_snow():
    w, h = 400, 300
    b = frame(w, h, "#DDEBF7")
    for (x, y) in [(40, 40), (90, 70), (150, 30), (210, 60), (270, 35), (330, 70), (370, 30), (60, 110), (300, 110), (180, 100)]:
        b += f'<circle cx="{x}" cy="{y}" r="4" fill="#fff" stroke="#9FB8D0" stroke-width="1"/>'
    b += '<path d="M1.5 210 Q120 180 220 205 T398.5 200 L398.5 296 Q398.5 298.5 396 298.5 L4 298.5 Q1.5 298.5 1.5 296 Z" fill="#fff" stroke="#1F2A37" stroke-width="2.5"/>'
    # snowman
    b += '<circle cx="200" cy="232" r="42" fill="#fff" stroke="#1F2A37" stroke-width="3"/>'
    b += '<circle cx="200" cy="170" r="30" fill="#fff" stroke="#1F2A37" stroke-width="3"/>'
    b += '<circle cx="200" cy="122" r="22" fill="#fff" stroke="#1F2A37" stroke-width="3"/>'
    b += '<path d="M200 124 l22 5 l-22 3 z" fill="#F08A24" stroke="#1F2A37" stroke-width="2"/>'
    b += '<circle cx="193" cy="116" r="2.5" fill="#1F2A37"/><circle cx="207" cy="116" r="2.5" fill="#1F2A37"/>'
    b += '<rect x="184" y="88" width="32" height="16" fill="#1F2A37"/><rect x="176" y="102" width="48" height="5" fill="#1F2A37"/>'
    b += '<path d="M180 140 q20 10 40 0" stroke="#C8102E" stroke-width="9" fill="none" stroke-linecap="round"/>'
    for yy in (160, 178, 222, 244):
        b += f'<circle cx="200" cy="{yy}" r="3.5" fill="#1F2A37"/>'
    b += '<line x1="172" y1="168" x2="140" y2="150" stroke="#6B4A2B" stroke-width="4"/><line x1="228" y1="168" x2="262" y2="150" stroke="#6B4A2B" stroke-width="4"/>'
    # two kids
    b += person(95, 262, "#2A6099", skin=SKIN[0], hair="#E3B04B", legs="#10233B", s=0.78, hat="tuque", arm_r=(30, 4))
    b += person(310, 262, "#C8102E", skin=SKIN[2], hair="#111", legs="#10233B", s=0.72, hat="tuque", arm_l=(-30, 0))
    return svg(w, h, b, "Deux enfants font un bonhomme de neige")


def tcf_kitchen():
    w, h = 400, 300
    b = frame(w, h, "#F3F7F2")
    # cabinets and window
    b += '<rect x="20" y="20" width="160" height="70" rx="6" fill="#2E7D6B" stroke="#1F2A37" stroke-width="2.5"/><line x1="100" y1="20" x2="100" y2="90" stroke="#1F2A37" stroke-width="2.5"/>'
    b += '<rect x="230" y="26" width="140" height="90" rx="6" fill="#CFE3F5" stroke="#1F2A37" stroke-width="3"/><line x1="300" y1="26" x2="300" y2="116" stroke="#1F2A37" stroke-width="2.5"/><line x1="230" y1="71" x2="370" y2="71" stroke="#1F2A37" stroke-width="2.5"/>'
    # counter + stove
    b += '<rect x="20" y="200" width="360" height="85" rx="6" fill="#D7DDE4" stroke="#1F2A37" stroke-width="3"/>'
    b += '<rect x="40" y="186" width="150" height="16" rx="3" fill="#5B6675" stroke="#1F2A37" stroke-width="2.5"/>'
    b += '<rect x="56" y="220" width="118" height="50" rx="5" fill="#fff" stroke="#1F2A37" stroke-width="2.5"/>'
    # pan with food and steam
    b += '<ellipse cx="110" cy="182" rx="44" ry="10" fill="#1F2A37"/><rect x="152" y="178" width="58" height="8" rx="4" fill="#1F2A37" transform="rotate(-6 152 182)"/>'
    b += '<ellipse cx="110" cy="178" rx="36" ry="6" fill="#F2B33D"/><circle cx="98" cy="177" r="4" fill="#C8102E"/><circle cx="118" cy="178" r="4" fill="#2E7D6B"/>'
    for dx in (-14, 2, 18):
        b += f'<path d="M{110+dx} 162 q-8 -12 0 -24 q8 -12 0 -24" fill="none" stroke="#9AA3AE" stroke-width="3" stroke-linecap="round"/>'
    # cook with spatula
    b += person(270, 290, "#B4462B", skin=SKIN[1], hair="#2B1D14", legs="#33415C", apron=True,
                arm_l=(-60, 22), s=1.0)
    b += '<line x1="196" y1="167" x2="150" y2="172" stroke="#1F2A37" stroke-width="4" stroke-linecap="round"/><rect x="136" y="164" width="16" height="12" rx="2" fill="#5B6675" stroke="#1F2A37" stroke-width="2"/>'
    return svg(w, h, b, "Un homme prépare le repas dans la cuisine")


# ---------------------------------------------------------------- TEF objects (300 x 220)
def card(body, title):
    return svg(300, 220, frame(300, 220, "#FFFFFF") + body, title)


def cup(x, y, liquid, saucer=True):
    s = ""
    if saucer:
        s += f'<ellipse cx="{x}" cy="{y+46}" rx="52" ry="10" fill="#EEF3F9" stroke="{INK}" stroke-width="2.5"/>'
    s += f'<path d="M{x-38} {y} L{x+38} {y} L{x+30} {y+44} Q{x} {y+52} {x-30} {y+44} Z" fill="#fff" stroke="{INK}" stroke-width="2.5"/>'
    s += f'<ellipse cx="{x}" cy="{y}" rx="38" ry="8" fill="{liquid}" stroke="{INK}" stroke-width="2.5"/>'
    s += f'<path d="M{x+36} {y+10} q20 2 14 18 q-4 10 -18 8" fill="none" stroke="{INK}" stroke-width="5"/>'
    return s


def steam(x, y):
    return "".join(f'<path d="M{x+d} {y} q-7 -10 0 -20 q7 -10 0 -20" fill="none" stroke="#9AA3AE" stroke-width="3" stroke-linecap="round"/>' for d in (-12, 4, 20))


def tef_food():
    a = cup(95, 95, "#6B3E1F") + steam(95, 82)
    a += '<path d="M180 150 L250 150 L250 120 Z" fill="#F7D9A8" stroke="#1F2A37" stroke-width="2.5"/><path d="M180 150 L250 120 L250 112 L180 142 Z" fill="#8A4B2A" stroke="#1F2A37" stroke-width="2.5"/><circle cx="238" cy="112" r="6" fill="#C8102E" stroke="#1F2A37" stroke-width="2"/>'
    b = cup(95, 95, "#C98A2E") + steam(95, 82)
    b += '<path d="M101 95 a14 14 0 0 1 26 0 Z" fill="#F7E04A" stroke="#1F2A37" stroke-width="2"/><path d="M106 95 l9 -11 l9 11" fill="none" stroke="#1F2A37" stroke-width="1.6"/>'
    b += ('<path d="M168 150 Q170 104 216 98 Q262 104 264 150 Q256 156 248 150 Q244 124 216 122 Q188 124 184 150 Q176 156 168 150 Z" '
          'fill="#E3A24E" stroke="#1F2A37" stroke-width="2.5"/>'
          '<path d="M190 106 L198 126 M216 98 L216 122 M242 106 L234 126" stroke="#1F2A37" stroke-width="2" fill="none"/>')
    c = '<path d="M60 70 L120 70 L112 160 L68 160 Z" fill="#F7A21B" stroke="#1F2A37" stroke-width="2.5"/><path d="M60 70 L120 70 L118 90 L62 90 Z" fill="#FFF" fill-opacity=".35"/><circle cx="118" cy="66" r="12" fill="#F7A21B" stroke="#1F2A37" stroke-width="2.2"/><line x1="100" y1="40" x2="92" y2="140" stroke="#C8102E" stroke-width="4"/>'
    c += '<path d="M165 150 L255 150 L210 92 Z" fill="#F4E3C3" stroke="#1F2A37" stroke-width="2.5"/><path d="M172 140 L248 140" stroke="#2E7D6B" stroke-width="7"/><path d="M178 130 L242 130" stroke="#C8102E" stroke-width="5"/>'
    d = '<path d="M40 100 L150 100 Q150 160 95 160 Q40 160 40 100 Z" fill="#fff" stroke="#1F2A37" stroke-width="2.5"/><ellipse cx="95" cy="100" rx="55" ry="10" fill="#E07A2E" stroke="#1F2A37" stroke-width="2.5"/>' + steam(95, 86)
    d += '<rect x="175" y="110" width="90" height="40" rx="18" fill="#D99A4E" stroke="#1F2A37" stroke-width="2.5"/><path d="M190 120 l10 -8 M212 122 l10 -8 M234 122 l10 -8" stroke="#1F2A37" stroke-width="2"/>'
    return [card(a, "Un café et une part de gâteau"), card(b, "Un thé au citron et un croissant"),
            card(c, "Un jus d'orange et un sandwich"), card(d, "Un bol de soupe et du pain")]


def tef_weather():
    sun = '<circle cx="90" cy="90" r="34" fill="#F7C531" stroke="#1F2A37" stroke-width="2.5"/>' + "".join(
        f'<line x1="{90+48*c}" y1="{90+48*s}" x2="{90+64*c}" y2="{90+64*s}" stroke="#F7A21B" stroke-width="5" stroke-linecap="round"/>'
        for c, s in [(1, 0), (-1, 0), (0, 1), (0, -1), (.7, .7), (-.7, .7), (.7, -.7), (-.7, -.7)])
    a = sun + '<g transform="translate(160 120)"><rect x="0" y="0" width="46" height="30" rx="12" fill="#10233B" stroke="#1F2A37" stroke-width="2.5"/><rect x="62" y="0" width="46" height="30" rx="12" fill="#10233B" stroke="#1F2A37" stroke-width="2.5"/><path d="M46 10 q8 -8 16 0" fill="none" stroke="#1F2A37" stroke-width="4"/></g>'
    flakes = "".join(f'<g transform="translate({x} {y})" stroke="#2A6099" stroke-width="3" stroke-linecap="round"><line x1="-10" y1="0" x2="10" y2="0"/><line x1="-5" y1="-9" x2="5" y2="9"/><line x1="5" y1="-9" x2="-5" y2="9"/></g>' for x, y in [(50, 50), (100, 80), (60, 120), (130, 40), (120, 140)])
    b = flakes + '<path d="M190 160 L190 100 Q190 80 210 80 Q230 80 230 100 L230 160 Z" fill="#C8102E" stroke="#1F2A37" stroke-width="2.5"/><path d="M190 115 Q172 112 174 95 Q178 84 190 92" fill="#C8102E" stroke="#1F2A37" stroke-width="2.5"/><rect x="186" y="150" width="48" height="14" rx="4" fill="#fff" stroke="#1F2A37" stroke-width="2.5"/>'
    c = "".join(f'<path d="M30 {y} q40 -14 80 0 t80 0" fill="none" stroke="#9AA3AE" stroke-width="5" stroke-linecap="round"/>' for y in (70, 100, 130))
    c += '<path d="M220 40 L262 80 L220 120 L178 80 Z" fill="#2E7D6B" stroke="#1F2A37" stroke-width="2.5"/><line x1="178" y1="80" x2="262" y2="80" stroke="#1F2A37" stroke-width="2"/><line x1="220" y1="40" x2="220" y2="120" stroke="#1F2A37" stroke-width="2"/><path d="M220 120 q-10 20 4 34 q-12 12 0 30" fill="none" stroke="#1F2A37" stroke-width="2.5"/>'
    d = '<path d="M40 90 a26 26 0 0 1 48 -18 a30 30 0 0 1 56 6 a22 22 0 0 1 4 44 L50 122 a20 20 0 0 1 -10 -32 Z" fill="#9AA3AE" stroke="#1F2A37" stroke-width="2.5"/>'
    d += "".join(f'<line x1="{x}" y1="140" x2="{x-8}" y2="165" stroke="#2A6099" stroke-width="4" stroke-linecap="round"/>' for x in (60, 85, 110, 135))
    d += '<path d="M175 110 Q222 50 270 110 Q258 102 246 110 Q234 102 222 110 Q210 102 198 110 Q187 102 175 110 Z" fill="#2A6099" stroke="#1F2A37" stroke-width="2.5"/><path d="M222 110 L222 168 q0 12 -12 12 q-10 0 -10 -10" fill="none" stroke="#1F2A37" stroke-width="4"/>'
    return [card(a, "Le soleil et des lunettes de soleil"), card(b, "La neige et des mitaines"),
            card(c, "Le vent et un cerf-volant"), card(d, "Un nuage de pluie et un parapluie")]


def tef_transport():
    a = '<path d="M30 112 L240 100 Q272 100 272 112 Q272 124 240 124 L30 118 Z" fill="#EEF3F9" stroke="#1F2A37" stroke-width="2.5"/><path d="M120 106 L170 56 L190 56 L160 104 Z" fill="#2A6099" stroke="#1F2A37" stroke-width="2.5"/><path d="M122 118 L170 168 L190 168 L160 120 Z" fill="#2A6099" stroke="#1F2A37" stroke-width="2.5"/><path d="M34 112 L22 84 L40 84 L62 110 Z" fill="#C8102E" stroke="#1F2A37" stroke-width="2.5"/>'
    a += "".join(f'<circle cx="{x}" cy="111" r="3.5" fill="#2A6099"/>' for x in range(190, 240, 12))
    b = '<rect x="30" y="60" width="240" height="100" rx="16" fill="#F7C531" stroke="#1F2A37" stroke-width="2.5"/>' + "".join(f'<rect x="{x}" y="76" width="40" height="34" rx="4" fill="#CFE3F5" stroke="#1F2A37" stroke-width="2"/>' for x in (46, 96, 146, 196))
    b += '<rect x="226" y="76" width="30" height="60" rx="3" fill="#CFE3F5" stroke="#1F2A37" stroke-width="2"/><circle cx="80" cy="162" r="16" fill="#1F2A37"/><circle cx="220" cy="162" r="16" fill="#1F2A37"/><text x="150" y="146" text-anchor="middle" font-family="Arial" font-size="18" font-weight="700" fill="#1F2A37">BUS</text>'
    c = '<path d="M40 70 Q40 50 64 50 L236 50 Q262 50 262 76 L262 158 L40 158 Z" fill="#C8102E" stroke="#1F2A37" stroke-width="2.5"/>' + "".join(f'<rect x="{x}" y="66" width="44" height="34" rx="4" fill="#CFE3F5" stroke="#1F2A37" stroke-width="2"/>' for x in (56, 116, 176))
    c += '<rect x="40" y="118" width="222" height="10" fill="#fff" stroke="#1F2A37" stroke-width="2"/><line x1="20" y1="176" x2="280" y2="176" stroke="#5B6675" stroke-width="5"/><circle cx="80" cy="162" r="11" fill="#1F2A37"/><circle cx="130" cy="162" r="11" fill="#1F2A37"/><circle cx="180" cy="162" r="11" fill="#1F2A37"/><circle cx="230" cy="162" r="11" fill="#1F2A37"/>'
    d = '<path d="M40 140 L40 112 Q44 100 60 98 L94 72 Q102 66 114 66 L190 66 Q202 66 210 74 L238 98 Q260 100 262 114 L262 140 Z" fill="#F7C531" stroke="#1F2A37" stroke-width="2.5"/><rect x="128" y="48" width="44" height="18" rx="4" fill="#1F2A37"/><text x="150" y="62" text-anchor="middle" font-family="Arial" font-size="12" font-weight="700" fill="#F7C531">TAXI</text>'
    d += '<path d="M104 96 L120 78 L148 78 L148 96 Z M156 96 L156 78 L192 78 L210 96 Z" fill="#CFE3F5" stroke="#1F2A37" stroke-width="2"/><circle cx="90" cy="142" r="18" fill="#1F2A37"/><circle cx="214" cy="142" r="18" fill="#1F2A37"/><circle cx="90" cy="142" r="7" fill="#9AA3AE"/><circle cx="214" cy="142" r="7" fill="#9AA3AE"/>'
    return [card(a, "Un avion"), card(b, "Un autobus"), card(c, "Un train"), card(d, "Un taxi")]


def building(x, y, w, floors, color, balconies=False):
    s = f'<rect x="{x}" y="{y-floors*34}" width="{w}" height="{floors*34}" fill="{color}" stroke="{INK}" stroke-width="2.5"/>'
    for f in range(floors):
        fy = y - (f + 1) * 34 + 8
        for k in range(3):
            wx = x + 12 + k * (w - 24) / 3
            s += f'<rect x="{wx}" y="{fy}" width="{(w-24)/3-10}" height="18" rx="2" fill="#CFE3F5" stroke="{INK}" stroke-width="1.8"/>'
        if balconies and f > 0:
            s += f'<rect x="{x-8}" y="{fy+16}" width="{w+16}" height="7" fill="#10233B" stroke="{INK}" stroke-width="1.5"/>'
            s += "".join(f'<line x1="{bx}" y1="{fy+10}" x2="{bx}" y2="{fy+16}" stroke="{INK}" stroke-width="1.5"/>' for bx in range(int(x - 6), int(x + w + 8), 10))
    return s


def tef_housing():
    ground = '<line x1="10" y1="186" x2="290" y2="186" stroke="#1F2A37" stroke-width="2.5"/>'
    a = ground + building(60, 186, 120, 4, "#E8C9A0", balconies=True)
    a += '<rect x="214" y="70" width="44" height="44" rx="8" fill="#2A6099" stroke="#1F2A37" stroke-width="2.5"/><text x="236" y="102" text-anchor="middle" font-family="Arial" font-size="28" font-weight="700" fill="#fff">M</text><line x1="236" y1="114" x2="236" y2="186" stroke="#1F2A37" stroke-width="4"/><path d="M206 186 L218 160 L254 160 L266 186" fill="#5B6675" stroke="#1F2A37" stroke-width="2"/>'
    b = ground + '<path d="M70 186 L70 110 L130 70 L190 110 L190 186 Z" fill="#F3DDBA" stroke="#1F2A37" stroke-width="2.5"/><path d="M58 112 L130 62 L202 112" fill="none" stroke="#B4462B" stroke-width="8" stroke-linejoin="round"/><rect x="116" y="140" width="28" height="46" fill="#8A5A36" stroke="#1F2A37" stroke-width="2"/><rect x="82" y="124" width="24" height="22" fill="#CFE3F5" stroke="#1F2A37" stroke-width="2"/><rect x="154" y="124" width="24" height="22" fill="#CFE3F5" stroke="#1F2A37" stroke-width="2"/>'
    b += '<rect x="224" y="140" width="10" height="46" fill="#8A5A36" stroke="#1F2A37" stroke-width="2"/><circle cx="229" cy="122" r="28" fill="#2E7D6B" stroke="#1F2A37" stroke-width="2.5"/>' + "".join(f'<rect x="{x}" y="166" width="6" height="20" fill="#fff" stroke="#1F2A37" stroke-width="1.5"/>' for x in range(14, 66, 12)) + "".join(f'<circle cx="{x}" cy="184" r="5" fill="#C8102E"/>' for x in (200, 256, 270))
    c = ground + building(40, 186, 120, 4, "#CBD5E1")
    c += '<rect x="180" y="126" width="96" height="60" fill="#9AA3AE" stroke="#1F2A37" stroke-width="2.5"/><path d="M190 186 L190 146 L266 146 L266 186" fill="#5B6675" stroke="#1F2A37" stroke-width="2"/>' + "".join(f'<line x1="190" y1="{y}" x2="266" y2="{y}" stroke="#1F2A37" stroke-width="1.5"/>' for y in (156, 166, 176)) + '<rect x="210" y="96" width="36" height="36" rx="6" fill="#2A6099" stroke="#1F2A37" stroke-width="2.5"/><text x="228" y="124" text-anchor="middle" font-family="Arial" font-size="26" font-weight="700" fill="#fff">P</text>'
    d = ground + building(40, 186, 120, 4, "#D9E7D2")
    d += '<path d="M176 186 L176 170 L280 170 L280 186 Z" fill="#7FC4E8" stroke="#1F2A37" stroke-width="2.5"/>' + "".join(f'<path d="M{x} 178 q6 -5 12 0 t12 0" fill="none" stroke="#fff" stroke-width="2"/>' for x in (186, 220, 250)) + '<path d="M262 170 L262 132 M274 170 L274 132 M262 144 L274 144 M262 156 L274 156" stroke="#1F2A37" stroke-width="2.5"/>'
    return [card(a, "Un immeuble avec balcons, près d'une station de métro"), card(b, "Une maison avec un jardin"),
            card(c, "Un immeuble avec un stationnement"), card(d, "Un immeuble avec une piscine")]


# ---------------------------------------------------------------- charts (TEF reading Q22)
def chart(values, title, letter):
    w, h = 320, 220
    x0, y0, x1, y1 = 46, 26, 300, 176
    body = f'<rect x="1.5" y="1.5" width="{w-3}" height="{h-3}" rx="12" fill="#fff" stroke="{INK}" stroke-width="2.5"/>'
    body += f'<text x="16" y="22" font-family="Arial" font-size="13" font-weight="700" fill="{INK}">Graphique {letter}</text>'
    body += f'<line x1="{x0}" y1="{y1}" x2="{x1}" y2="{y1}" stroke="{INK}" stroke-width="2"/><line x1="{x0}" y1="{y0}" x2="{x0}" y2="{y1}" stroke="{INK}" stroke-width="2"/>'
    for i in range(1, 5):
        gy = y1 - i * (y1 - y0) / 5
        body += f'<line x1="{x0}" y1="{gy}" x2="{x1}" y2="{gy}" stroke="#C9D3E0" stroke-width="1"/>'
    months = "JFMAMJJASOND"
    step = (x1 - x0 - 10) / 11
    pts = []
    for i, v in enumerate(values):
        px = x0 + 6 + i * step
        py = y1 - v * (y1 - y0)
        pts.append(f"{px:.1f},{py:.1f}")
        body += f'<text x="{px:.1f}" y="{y1+16}" text-anchor="middle" font-family="Arial" font-size="11" fill="#5B6675">{months[i]}</text>'
    body += f'<polyline points="{" ".join(pts)}" fill="none" stroke="#2A6099" stroke-width="4" stroke-linejoin="round" stroke-linecap="round"/>'
    body += f'<text x="14" y="{(y0+y1)/2}" font-family="Arial" font-size="11" fill="#5B6675" transform="rotate(-90 14 {(y0+y1)/2})" text-anchor="middle">Passagers</text>'
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
    for i, fn in enumerate((tcf_bakery, tcf_train, tcf_snow, tcf_kitchen), start=1):
        write(f"mocks/tcf-1/img/co-{i:02d}.svg", fn())
    for i, fn in enumerate((tef_food, tef_weather, tef_transport, tef_housing), start=1):
        for letter, content in zip("abcd", fn()):
            write(f"mocks/tef-1/img/co-{i:02d}-{letter}.svg", content)
    for letter, content in zip("abcd", charts()):
        write(f"mocks/tef-1/img/ce-22-{letter}.svg", content)
    print("drawings written")


if __name__ == "__main__":
    main()
