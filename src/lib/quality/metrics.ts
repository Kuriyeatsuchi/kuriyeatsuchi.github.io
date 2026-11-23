/**
 * Stage-1 image quality checks, the same idea as the sorter's first stage.
 *
 * How it works, in plain English:
 * - `degrade` ruins a photo the way real cameras do: blur (a repeated box blur, close to
 *   an out-of-focus lens), exposure (multiply brightness, clipping at white) and contrast
 *   (squash or stretch values around mid-grey). Pixels outside the retina stay black.
 * - `measure` looks only inside the retina:
 *   brightness = average luminance;
 *   contrast   = spread of luminance divided by its average (so a dim but clear photo passes);
 *   sharpness  = how strongly the image changes between neighbouring pixels (the Laplacian),
 *                measured at half size so camera grain doesn't count as detail, and divided
 *                by the spread so it doesn't depend on exposure.
 * - `judge` compares each number with limits set relative to the clean photo.
 * - `fingerprint` hashes the pixels (FNV-1a). Identical files give identical fingerprints,
 *   which is how exact duplicates are flagged.
 */

import type { Fundus } from './fundus';

export interface Settings {
  /** Exposure in stops (EV). */
  exposure: number;
  /** Contrast multiplier around mid-grey. */
  contrast: number;
  /** Blur radius in pixels. */
  blur: number;
}

export interface Measures {
  brightness: number;
  contrast: number;
  sharpness: number;
}

function boxBlur(src: Float32Array, size: number, r: number): Float32Array {
  const tmp = new Float32Array(src.length);
  const out = new Float32Array(src.length);
  const pass = (a: Float32Array, b: Float32Array, horizontal: boolean): void => {
    const at = (line: number, k: number): number => (horizontal ? line * size + k : k * size + line);
    for (let line = 0; line < size; line++) {
      for (let ch = 0; ch < 3; ch++) {
        let acc = 0;
        for (let k = -r; k <= r; k++) acc += a[at(line, Math.min(size - 1, Math.max(0, k))) * 4 + ch] as number;
        for (let j = 0; j < size; j++) {
          b[at(line, j) * 4 + ch] = acc / (2 * r + 1);
          acc += (a[at(line, Math.min(size - 1, j + r + 1)) * 4 + ch] as number) - (a[at(line, Math.max(0, j - r)) * 4 + ch] as number);
        }
      }
    }
  };
  pass(src, tmp, true);
  pass(tmp, out, false);
  pass(out, tmp, true);
  pass(tmp, out, false);
  return out;
}

export function degrade(f: Fundus, s: Settings): Uint8ClampedArray {
  let src: Float32Array = Float32Array.from(f.pixels);
  if (s.blur > 0) src = boxBlur(src, f.size, Math.round(s.blur));
  const k = 2 ** s.exposure;
  const out = new Uint8ClampedArray(f.pixels.length);
  for (let p = 0; p < f.size * f.size; p++) {
    const j = p * 4;
    out[j + 3] = 255;
    if (!f.mask[p]) continue;
    for (let ch = 0; ch < 3; ch++) {
      const v = Math.min(255, (src[j + ch] as number) * k);
      out[j + ch] = (v - 128) * s.contrast + 128;
    }
  }
  return out;
}

export function measure(px: Uint8ClampedArray, f: Fundus): Measures {
  const size = f.size;
  const half = size / 2;
  const Y = new Float32Array(size * size);
  let n = 0;
  let sum = 0;
  let sq = 0;
  for (let p = 0; p < size * size; p++) {
    const j = p * 4;
    const v = 0.299 * (px[j] as number) + 0.587 * (px[j + 1] as number) + 0.114 * (px[j + 2] as number);
    Y[p] = v;
    if (f.inner[p]) {
      n++;
      sum += v;
      sq += v * v;
    }
  }
  const mean = sum / n;
  const std = Math.sqrt(Math.max(0, sq / n - mean * mean));

  const D = new Float32Array(half * half);
  const Dm = new Uint8Array(half * half);
  for (let y = 0; y < half; y++) {
    for (let x = 0; x < half; x++) {
      const a = 2 * y * size + 2 * x;
      D[y * half + x] = ((Y[a] as number) + (Y[a + 1] as number) + (Y[a + size] as number) + (Y[a + size + 1] as number)) / 4;
      Dm[y * half + x] = f.inner[a] && f.inner[a + size + 1] ? 1 : 0;
    }
  }
  let ln = 0;
  let ls = 0;
  let lq = 0;
  for (let y = 1; y < half - 1; y++) {
    for (let x = 1; x < half - 1; x++) {
      const q = y * half + x;
      if (!Dm[q] || !Dm[q - 1] || !Dm[q + 1] || !Dm[q - half] || !Dm[q + half]) continue;
      const L = (D[q - 1] as number) + (D[q + 1] as number) + (D[q - half] as number) + (D[q + half] as number) - 4 * (D[q] as number);
      ln++;
      ls += L;
      lq += L * L;
    }
  }
  const lm = ls / ln;
  return {
    brightness: mean,
    contrast: std / Math.max(1, mean),
    sharpness: Math.sqrt(Math.max(0, lq / ln - lm * lm)) / Math.max(1, std),
  };
}

export interface Limits {
  brightness: [number, number];
  contrast: number;
  sharpness: number;
}

/** Limits relative to the clean photo, tuned so each preset fails exactly one check. */
export function limitsFrom(clean: Measures): Limits {
  return {
    brightness: [0.45 * clean.brightness, Math.min(1.9 * clean.brightness, 200)],
    contrast: 0.5 * clean.contrast,
    sharpness: 0.35 * clean.sharpness,
  };
}

export type Problem = 'too dark' | 'too bright' | 'too flat' | 'too blurry';

export function judge(m: Measures, l: Limits): Problem[] {
  const out: Problem[] = [];
  if (m.brightness < l.brightness[0]) out.push('too dark');
  if (m.brightness > l.brightness[1]) out.push('too bright');
  if (m.contrast < l.contrast) out.push('too flat');
  if (m.sharpness < l.sharpness) out.push('too blurry');
  return out;
}

export function fingerprint(px: Uint8ClampedArray): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < px.length; i += 3) {
    h ^= px[i] as number;
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(16).padStart(8, '0');
}
