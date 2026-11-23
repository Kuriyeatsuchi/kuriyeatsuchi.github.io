/**
 * A retina photo drawn entirely by code (CLAUDE.md rule 3: no real retinal images).
 *
 * How it works, in plain English:
 * 1. Paint the orange-red disc of the retina, darker toward the rim (vignetting),
 *    with a darker macula and a bright yellow optic disc, pixel by pixel.
 * 2. Grow vessels with space colonization (`../vessels/colonize.ts`) and stroke them
 *    in dark red, thick near the disc and thin at the tips.
 * 3. Add a little camera grain inside the retina.
 * Returns the pixels plus a mask of which pixels are inside the retina.
 */

import { mulberry32 } from '../mizan/stats';
import { growVessels } from '../vessels/colonize';

export interface Fundus {
  size: number;
  pixels: Uint8ClampedArray;
  /** 1 inside the retina. */
  mask: Uint8Array;
  /** 1 inside 90% of the radius, where quality is measured (avoids the dark rim). */
  inner: Uint8Array;
}

export function drawFundus(size = 320, seed = 42): Fundus {
  const cx = size / 2;
  const cy = size / 2;
  const R = size * 0.47;
  const canvas = document.createElement('canvas');
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas unavailable');

  const img = ctx.createImageData(size, size);
  const d = img.data;
  const mac = { x: cx - 0.32 * R, y: cy + 0.02 * R, r: 0.16 * R };
  const disc = { x: cx + 0.36 * R, y: cy - 0.04 * R };
  const sm = 2 * (0.13 * R) ** 2;
  const so = 2 * (0.085 * R) ** 2;
  const sc = 2 * (0.035 * R) ** 2;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const i = (y * size + x) * 4;
      d[i + 3] = 255;
      const rn = Math.hypot(x - cx, y - cy) / R;
      if (rn > 1) continue;
      let r = 205 - 70 * rn * rn;
      let g = 92 - 40 * rn * rn;
      let b = 46 - 22 * rn * rn;
      const e = Math.min(1, Math.max(0, (rn - 0.75) / 0.25));
      const f = 1 - 0.55 * e * e * (3 - 2 * e);
      r *= f;
      g *= f;
      b *= f;
      const m = Math.exp(-((x - mac.x) ** 2 + (y - mac.y) ** 2) / sm);
      r *= 1 - 0.38 * m;
      g *= 1 - 0.45 * m;
      b *= 1 - 0.4 * m;
      const dd = (x - disc.x) ** 2 + (y - disc.y) ** 2;
      const o = Math.exp(-dd / so);
      r += (255 - r) * 0.85 * o;
      g += (215 - g) * 0.85 * o;
      b += (150 - b) * 0.8 * o;
      const o2 = Math.exp(-dd / sc);
      r += (255 - r) * 0.6 * o2;
      g += (240 - g) * 0.6 * o2;
      b += (205 - b) * 0.6 * o2;
      d[i] = r;
      d[i + 1] = g;
      d[i + 2] = b;
    }
  }
  ctx.putImageData(img, 0, 0);

  const rng = mulberry32(seed);
  const vessels = growVessels(rng, { cx, cy, radius: R, disc, macula: mac });
  ctx.save();
  ctx.beginPath();
  ctx.arc(cx, cy, R - 1, 0, Math.PI * 2);
  ctx.clip();
  ctx.lineCap = 'round';
  for (const s of vessels) {
    ctx.strokeStyle = `rgba(105,18,12,${0.5 + 0.35 * Math.min(1, s.width / 3)})`;
    ctx.lineWidth = s.width;
    ctx.beginPath();
    ctx.moveTo(s.x0, s.y0);
    ctx.lineTo(s.x1, s.y1);
    ctx.stroke();
  }
  ctx.restore();

  const data = ctx.getImageData(0, 0, size, size).data;
  const pixels = new Uint8ClampedArray(data.length);
  const mask = new Uint8Array(size * size);
  const inner = new Uint8Array(size * size);
  for (let p = 0; p < size * size; p++) {
    const q = Math.hypot((p % size) - cx, Math.floor(p / size) - cy);
    mask[p] = q <= R ? 1 : 0;
    inner[p] = q <= R * 0.9 ? 1 : 0;
    const grain = mask[p] ? (rng() - 0.5) * 5 : 0;
    pixels[p * 4] = (data[p * 4] as number) + grain;
    pixels[p * 4 + 1] = (data[p * 4 + 1] as number) + grain;
    pixels[p * 4 + 2] = (data[p * 4 + 2] as number) + grain;
    pixels[p * 4 + 3] = 255;
  }
  return { size, pixels, mask, inner };
}
