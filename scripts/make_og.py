"""Render public/og.png, the 1200 x 630 link-preview image.

How it works, in plain English:
- Draws at double size (2400 x 1260) and shrinks at the end, for smooth edges.
- Background: the site's near-black with a few faint stars.
- Left: the name in Instrument Sans and the tagline in IBM Plex Sans, from the site fonts.
- Right: the eye, drawn the same way as on the site: a shell of points with the far side
  hidden, and a painted iris (radial fibres, pupil edge, darker rim) found per pixel by
  turning each visible point of the ball back into the eye's own coordinates. It glances
  toward the name. Beside it, Mizan's trend lines and the Beyond the Streak bars as points.
Usage: python3 scripts/make_og.py   (from the repo root)
"""
import math
import numpy as np
from PIL import Image, ImageDraw, ImageFont

S = 2
W, H = 1200 * S, 630 * S
BG = (11, 13, 18)
TEXT = (232, 230, 225)
LIGHT = (181, 179, 173)
MID = (154, 152, 144)
DIM = (61, 67, 80)
SCLERA = (111, 112, 118)
rng = np.random.default_rng(11)

im = Image.new('RGB', (W, H), BG)
d = ImageDraw.Draw(im)

# ---------- stars ----------
for _ in range(110):
    x, y = rng.random() * W, rng.random() * H
    a = 0.12 + rng.random() * 0.3
    c = (126, 184, 224) if rng.random() < 0.12 else TEXT
    col = tuple(int(BG[i] + (c[i] - BG[i]) * a) for i in range(3))
    d.rectangle([x, y, x + S, y + S], fill=col)
for _ in range(5):
    x, y = rng.random() * W, rng.random() * H
    col = tuple(int(BG[i] + ((126, 184, 224)[i] - BG[i]) * 0.45) for i in range(3))
    r = 4 * S
    d.rectangle([x - r, y - 1, x + r, y + 1], fill=col)
    d.rectangle([x - 1, y - r, x + 1, y + r], fill=col)


def rot(v, yaw, pitch):
    """Same order as the site: turn about Y (yaw), then about X (pitch)."""
    x, y, z = v
    x1, z1 = x * math.cos(yaw) + z * math.sin(yaw), -x * math.sin(yaw) + z * math.cos(yaw)
    y2, z2 = y * math.cos(pitch) - z1 * math.sin(pitch), y * math.sin(pitch) + z1 * math.cos(pitch)
    return x1, y2, z2


def square(cx, cy, size, col):
    d.rectangle([cx - size / 2, cy - size / 2, cx + size / 2, cy + size / 2], fill=col)


# ---------- the eye ----------
EX, EY, ER = 860 * S, 330 * S, 205 * S
YAW, PITCH = -0.32, 0.06  # glancing left, toward the name
IRIS, PUPIL = 0.42, 0.14

# Painted iris: same recipe as src/lib/scene/objects.ts
TW, TH = 1024, 256
tex = Image.new('RGB', (TW, TH), (5, 6, 8))
td = ImageDraw.Draw(tex, 'RGBA')
top = round(PUPIL / IRIS * TH)
span = TH - top
for yy in range(top, TH):
    t = (yy - top) / span
    if t < 0.65:
        k = t / 0.65
        c = [180 + (134 - 180) * k, 178 + (133 - 178) * k, 172 + (127 - 172) * k]
    else:
        k = (t - 0.65) / 0.35
        c = [134 + (94 - 134) * k, 133 + (94 - 133) * k, 127 + (91 - 127) * k]
    td.line([(0, yy), (TW, yy)], fill=tuple(int(v) for v in c))
for _ in range(640):
    x = rng.random() * TW
    w = 0.8 + rng.random() * 2.4
    a = 0.12 + rng.random() * 0.32
    s0, e0 = rng.random() * 0.3, 0.6 + rng.random() * 0.4
    col = (226, 224, 218, int(255 * a)) if rng.random() < 0.62 else (28, 29, 33, int(255 * a * 0.45))
    td.line([(x, top + s0 * span), (x, top + e0 * span)], fill=col, width=max(1, round(w)))
td.rectangle([0, top, TW, top + 3], fill=(232, 230, 225))
td.rectangle([0, TH - 16, TW, TH], fill=(60, 61, 66))
td.rectangle([0, TH - 18, TW, TH - 16], fill=(181, 179, 173))
T = np.asarray(tex)

# Per pixel on the visible half of the ball: back into eye coordinates, then the iris texture.
arr = np.asarray(im).copy()
ys, xs = np.mgrid[EY - ER:EY + ER, EX - ER:EX + ER]
nx, ny = (xs - EX) / ER, -(ys - EY) / ER
inside = nx ** 2 + ny ** 2 <= 1
nz = np.sqrt(np.clip(1 - nx ** 2 - ny ** 2, 0, 1))
# inverse rotation: undo pitch (about X), then undo yaw (about Y)
cp, sp, cy, sy = math.cos(PITCH), math.sin(PITCH), math.cos(YAW), math.sin(YAW)
y1 = ny * cp + nz * sp
z1 = -ny * sp + nz * cp
xl = nx * cy - z1 * sy
zl = nx * sy + z1 * cy
yl = y1
theta = np.arccos(np.clip(zl, -1, 1))
on_iris = inside & (theta < IRIS)
ang = (np.arctan2(yl, xl) % (2 * math.pi)) / (2 * math.pi)
tv = np.clip((theta / IRIS * (TH - 1)).astype(int), 0, TH - 1)
tu = np.clip((ang * (TW - 1)).astype(int), 0, TW - 1)
patch = arr[EY - ER:EY + ER, EX - ER:EX + ER]
patch[on_iris] = T[tv[on_iris], tu[on_iris]]
arr[EY - ER:EY + ER, EX - ER:EX + ER] = patch
im = Image.fromarray(arr)
d = ImageDraw.Draw(im)

golden = math.pi * (3 - math.sqrt(5))
for i in range(1500):
    y = 1 - (i + 0.5) / 1500 * 2
    rr = math.sqrt(1 - y * y)
    x, z = math.cos(i * golden) * rr, math.sin(i * golden) * rr
    if math.acos(z) < IRIS + 0.03:
        continue
    px, py, pz = rot((x, y, z), YAW, PITCH)
    if pz < 0:
        continue
    square(EX + px * ER, EY - py * ER, 2.4 * S, SCLERA)
gx, gy, gz = rot((-0.16 / 1.0, 0.18, 0.97), YAW, PITCH)
gr = 0.045 * ER
d.ellipse([EX + gx * ER - gr, EY - gy * ER - gr, EX + gx * ER + gr, EY - gy * ER + gr], fill=(255, 255, 255))

# ---------- Mizan: 15 trend lines ----------
MX, MY, MR = 1112 * S, 92 * S, 70 * S
for a in range(15):
    rate = 0.24 + 0.25 * a / 14
    z = -0.7 + 1.4 * a / 14
    for s in range(44):
        on = s < 34
        u = s / 33 if on else rng.random()
        res = (rng.random() + rng.random() + rng.random() - 1.5) * (0.07 if on else 0.3)
        p = rot((-0.95 + 1.9 * u, -0.78 + 1.5 * (rate / 0.49) * u + res, z), -0.55, 0.32)
        square(MX + p[0] * MR, MY - p[1] * MR, 2.2 * S, TEXT if on else MID)

# ---------- Beyond the Streak: users +23% vs bookings +8% ----------
BX, BY, BR = 1100 * S, 540 * S, 78 * S


def bar(x0, h, n, col):
    w = 0.5
    for _ in range(n):
        pick = rng.random() * (w * h * 4 + w * w)
        s1, s2 = rng.random(), rng.random()
        if pick < w * w:
            v = (x0 + s1 * w, -0.8 + h, -w / 2 + s2 * w)
        else:
            f = int((pick - w * w) // (w * h))
            yv = -0.8 + s2 * h
            v = [(x0 + s1 * w, yv, -w / 2), (x0 + s1 * w, yv, w / 2), (x0, yv, -w / 2 + s1 * w), (x0 + w, yv, -w / 2 + s1 * w)][min(f, 3)]
        p = rot(v, 0.6, 0.3)
        square(BX + p[0] * BR, BY - p[1] * BR, 2.2 * S, col)


bar(-0.6, 1.6, 560, TEXT)
bar(0.1, 1.6 * 8 / 23, 200, MID)

# ---------- text ----------
name = ImageFont.truetype('public/fonts/InstrumentSans-SemiBold.woff2', 76 * S)
body = ImageFont.truetype('public/fonts/IBMPlexSans-Regular.woff2', 36 * S)
small = ImageFont.truetype('public/fonts/IBMPlexSans-Regular.woff2', 24 * S)
d.text((72 * S, 215 * S), 'Yousef Alsharif', font=name, fill=TEXT)
d.text((72 * S, 320 * S), 'High school student in computer', font=body, fill=TEXT)
d.text((72 * S, 366 * S), 'science and machine learning.', font=body, fill=TEXT)
# the moon logo + address
mx, my, mr = 86 * S, 548 * S, 14 * S
d.ellipse([mx - mr, my - mr, mx + mr, my + mr], fill=TEXT)
cr = mr * 0.86
d.ellipse([mx + mr * 0.45 - cr, my - mr * 0.45 - cr, mx + mr * 0.45 + cr, my - mr * 0.45 + cr], fill=BG)
d.text((112 * S, 532 * S), 'yousefalsharif.me', font=small, fill=MID)

im.resize((1200, 630), Image.LANCZOS).save('public/og.png', optimize=True)
print('wrote public/og.png')
