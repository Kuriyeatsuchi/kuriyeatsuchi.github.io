"""Calibrate the stage-1 quality limits on real fundus photos (runs locally; no images leave the Mac).

Mirrors src/lib/quality/real.ts + metrics.ts exactly:
  1. Downscale so the longest side is 640 px.
  2. Find the retina: pixels brighter than a fixed threshold; bounding box of rows/columns
     that are at least 2% lit gives centre and radius (works for photos cropped top/bottom).
  3. Re-frame so the retina has radius 150 px, centred in a 320 x 320 black square.
  4. Measure inside 90% of the radius: brightness, contrast (std / mean), sharpness
     (Laplacian spread at half size / std).
Usage: python3 calibrate.py <dataset dir> <out.json> <start> <end>
"""
import json, os, sys, glob
from multiprocessing import Pool
import numpy as np
from PIL import Image

THRESH = 15.0
SIZE, R, PAD = 320, 150, 10


def lum(a):
    return 0.299 * a[..., 0] + 0.587 * a[..., 1] + 0.114 * a[..., 2]


def prepare(path):
    im = Image.open(path).convert('RGB')
    k = 640 / max(im.size)
    im = im.resize((max(1, round(im.width * k)), max(1, round(im.height * k))), Image.BILINEAR)
    a = np.asarray(im, dtype=np.float32)
    m = lum(a) > THRESH
    cols = np.where(m.sum(0) > 0.02 * m.shape[0])[0]
    rows = np.where(m.sum(1) > 0.02 * m.shape[1])[0]
    if len(cols) < 10 or len(rows) < 10:
        return None
    x0, x1, y0, y1 = cols[0], cols[-1] + 1, rows[0], rows[-1] + 1
    r = max(x1 - x0, y1 - y0) / 2
    cx, cy = (x0 + x1) / 2, (y0 + y1) / 2
    box = (round(cx - r), round(cy - r), round(cx + r), round(cy + r))
    crop = im.crop(box).resize((2 * R, 2 * R), Image.BILINEAR)
    out = Image.new('RGB', (SIZE, SIZE))
    out.paste(crop, (PAD, PAD))
    px = np.asarray(out, dtype=np.float32)
    yy, xx = np.mgrid[0:SIZE, 0:SIZE]
    d = np.hypot(xx - SIZE / 2, yy - SIZE / 2)
    Y = lum(px)
    mask = (Y > THRESH) & (d <= R)
    inner = mask & (d <= R * 0.9)
    return px, mask, inner


def measure(px, inner):
    Y = lum(px)
    v = Y[inner]
    mean, std = float(v.mean()), float(v.std())
    D = (Y[0::2, 0::2] + Y[0::2, 1::2] + Y[1::2, 0::2] + Y[1::2, 1::2]) / 4
    Dm = inner[0::2, 0::2] & inner[1::2, 1::2]
    ok = Dm[1:-1, 1:-1] & Dm[:-2, 1:-1] & Dm[2:, 1:-1] & Dm[1:-1, :-2] & Dm[1:-1, 2:]
    L = D[:-2, 1:-1] + D[2:, 1:-1] + D[1:-1, :-2] + D[1:-1, 2:] - 4 * D[1:-1, 1:-1]
    lap = float(L[ok].std()) / max(1.0, std)
    return {'brightness': mean, 'contrast': std / max(1.0, mean), 'sharpness': lap, 'coverage': float(inner.mean())}


def box_blur(px, r):
    """Same as metrics.ts: two passes of a separable box blur, edges clamped."""
    out = px.copy()
    for _ in range(2):
        for axis in (1, 0):
            pad = [(0, 0)] * 3
            pad[axis] = (r, r)
            p = np.pad(out, pad, mode='edge')
            c = np.cumsum(p, axis=axis, dtype=np.float64)
            c = np.concatenate([np.zeros_like(np.take(c, [0], axis=axis)), c], axis=axis)
            n = out.shape[axis]
            out = ((np.take(c, range(2 * r + 1, 2 * r + 1 + n), axis=axis) - np.take(c, range(0, n), axis=axis)) / (2 * r + 1)).astype(np.float32)
    return out


def degrade(px, mask, exposure=0.0, contrast=1.0, blur=0):
    src = box_blur(px, blur) if blur > 0 else px
    v = np.minimum(255, src * (2 ** exposure))
    v = np.clip((v - 128) * contrast + 128, 0, 255)
    v[~mask] = 0
    return v


def work(path):
    try:
        p = prepare(path)
        if p is None:
            return {'id': os.path.basename(path), 'fail': 'no retina'}
        px, mask, inner = p
        rec = {'id': os.path.basename(path), **measure(px, inner)}
        rec['blur2'] = measure(degrade(px, mask, blur=2), inner)['sharpness']
        rec['blur4'] = measure(degrade(px, mask, blur=4), inner)['sharpness']
        dark = measure(degrade(px, mask, exposure=-1.8), inner)
        rec['dark_b'] = dark['brightness']
        flat = measure(degrade(px, mask, exposure=0.6, contrast=0.3), inner)
        rec['flat_c'] = flat['contrast']
        return rec
    except Exception as e:  # noqa: BLE001
        return {'id': os.path.basename(path), 'fail': str(e)}


if __name__ == '__main__':
    root, out, a, b = sys.argv[1], sys.argv[2], int(sys.argv[3]), int(sys.argv[4])
    files = sorted(glob.glob(os.path.join(root, '*_images', '*_images', '*.png')))[a:b]
    with Pool(4) as pool:
        res = pool.map(work, files, chunksize=8)
    json.dump(res, open(out, 'w'))
    print(len(res), 'done', sum(1 for r in res if 'fail' in r), 'failed')
