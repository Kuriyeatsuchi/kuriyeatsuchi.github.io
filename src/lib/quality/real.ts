/**
 * Real retina photos: find the retina, frame it, and judge it with calibrated limits.
 *
 * How it works, in plain English:
 * 1. Shrink the photo so its longest side is 640 px.
 * 2. Find the retina: in a fundus photo it is a bright disc on black. Columns and rows that
 *    are at least 2% lit give the disc's edges, so its centre and radius (this also works
 *    when the camera cropped the top and bottom of the disc).
 * 3. Re-frame the photo so the retina has radius 150 px in the middle of a 320 x 320 square.
 *    Every photo is then measured at the same scale, whatever camera took it.
 * 4. The limits were calibrated on the project's 1,450 clinician-graded photos
 *    with scripts/calibrate_quality.py, which repeats these exact steps: 98.5% of those photos
 *    pass, while 97% of the same photos blurred by 2 px, and all of them darkened by 1.8 stops,
 *    are rejected.
 * 5. A photo with no dark border probably isn't a fundus photo at all (a selfie, say);
 *    `looksLikeFundus` is false then, so the page can say the result means little.
 */

import type { Fundus } from './fundus';
import type { Limits } from './metrics';

const THRESH = 15;
const SIZE = 320;
const R = 150;
const PAD = 10;

export const REAL_LIMITS: Limits = { brightness: [45, 150], contrast: 0.08, sharpness: 0.18 };
export const CALIBRATION = { photos: 1450, passRate: 98.5 } as const;

const lum = (d: Uint8ClampedArray, i: number): number =>
  0.299 * (d[i] as number) + 0.587 * (d[i + 1] as number) + 0.114 * (d[i + 2] as number);

export interface RealFundus {
  fundus: Fundus;
  looksLikeFundus: boolean;
}

export function fundusFromImage(src: CanvasImageSource, width: number, height: number): RealFundus | null {
  const k = 640 / Math.max(width, height);
  const w = Math.max(1, Math.round(width * k));
  const h = Math.max(1, Math.round(height * k));
  const c1 = document.createElement('canvas');
  c1.width = w;
  c1.height = h;
  const x1 = c1.getContext('2d', { willReadFrequently: true });
  if (!x1) return null;
  x1.drawImage(src, 0, 0, w, h);
  const d1 = x1.getImageData(0, 0, w, h).data;

  const colCount = new Uint32Array(w);
  const rowCount = new Uint32Array(h);
  let corners = 0;
  let cornerDark = 0;
  const cw = Math.round(w * 0.08);
  const ch = Math.round(h * 0.08);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const lit = lum(d1, (y * w + x) * 4) > THRESH;
      if (lit) {
        colCount[x] = (colCount[x] as number) + 1;
        rowCount[y] = (rowCount[y] as number) + 1;
      }
      if ((x < cw || x >= w - cw) && (y < ch || y >= h - ch)) {
        corners++;
        if (!lit) cornerDark++;
      }
    }
  }
  const cols: number[] = [];
  const rows: number[] = [];
  colCount.forEach((n, x) => n > 0.02 * h && cols.push(x));
  rowCount.forEach((n, y) => n > 0.02 * w && rows.push(y));
  if (cols.length < 10 || rows.length < 10) return null;
  const x0 = cols[0] as number;
  const xe = (cols[cols.length - 1] as number) + 1;
  const y0 = rows[0] as number;
  const ye = (rows[rows.length - 1] as number) + 1;
  const r = Math.max(xe - x0, ye - y0) / 2;
  const cx = (x0 + xe) / 2;
  const cy = (y0 + ye) / 2;

  const c2 = document.createElement('canvas');
  c2.width = SIZE;
  c2.height = SIZE;
  const x2 = c2.getContext('2d', { willReadFrequently: true });
  if (!x2) return null;
  x2.fillStyle = '#000';
  x2.fillRect(0, 0, SIZE, SIZE);
  const sx = Math.round(cx - r);
  const sy = Math.round(cy - r);
  const side = Math.round(cx + r) - sx;
  // Draw only the part of the square that lies inside the photo; the rest stays black.
  const ax = Math.max(0, sx);
  const ay = Math.max(0, sy);
  const bx = Math.min(w, sx + side);
  const by = Math.min(h, sy + side);
  const scale = (2 * R) / side;
  if (bx > ax && by > ay) {
    x2.drawImage(c1, ax, ay, bx - ax, by - ay, PAD + (ax - sx) * scale, PAD + (ay - sy) * scale, (bx - ax) * scale, (by - ay) * scale);
  }
  const data = x2.getImageData(0, 0, SIZE, SIZE).data;
  const pixels = new Uint8ClampedArray(data);
  const mask = new Uint8Array(SIZE * SIZE);
  const inner = new Uint8Array(SIZE * SIZE);
  for (let p = 0; p < SIZE * SIZE; p++) {
    const dist = Math.hypot((p % SIZE) - SIZE / 2, Math.floor(p / SIZE) - SIZE / 2);
    const m = lum(pixels, p * 4) > THRESH && dist <= R ? 1 : 0;
    mask[p] = m;
    inner[p] = m && dist <= R * 0.9 ? 1 : 0;
  }
  return { fundus: { size: SIZE, pixels, mask, inner }, looksLikeFundus: corners > 0 && cornerDark / corners > 0.6 };
}

/** Decode a dropped or chosen file into a framed retina. */
export async function fundusFromFile(file: File): Promise<RealFundus | null> {
  if (!file.type.startsWith('image/')) return null;
  const bitmap = await createImageBitmap(file);
  try {
    return fundusFromImage(bitmap, bitmap.width, bitmap.height);
  } finally {
    bitmap.close();
  }
}

export async function fundusFromUrl(url: string): Promise<RealFundus | null> {
  const img = new Image();
  img.decoding = 'async';
  img.src = url;
  await img.decode();
  return fundusFromImage(img, img.naturalWidth, img.naturalHeight);
}
