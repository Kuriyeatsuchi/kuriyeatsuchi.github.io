/**
 * Retinal blood vessels grown by space colonization.
 *
 * How it works, in plain English:
 * 1. Scatter "attractor" points over the retina: places a vessel would like to reach.
 *    The macula (the dark spot used for sharp vision) gets none, so vessels curve around it.
 * 2. Start a few vessel tips at the optic disc.
 * 3. Repeat: every attractor pulls on its nearest vessel node (if it is close enough).
 *    Each pulled node grows one short step toward the average direction of its pulls.
 *    Attractors that a vessel has reached are removed.
 * 4. Stop when nothing is left to reach. Then make each segment as thick as the tree
 *    it feeds (pipe model: a parent's radius squared is the sum of its children's),
 *    so trunks near the disc are thick and tips are thin.
 * The result is a list of line segments with widths, drawn by `fundus.ts`.
 */

import type { Rng } from '../mizan/stats';

export interface VesselSegment {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
}

export interface ColonizeOptions {
  cx: number;
  cy: number;
  radius: number;
  disc: { x: number; y: number };
  macula: { x: number; y: number; r: number };
  attractors?: number;
  step?: number;
  influence?: number;
  kill?: number;
  maxIterations?: number;
}

interface Node {
  x: number;
  y: number;
  parent: number;
  children: number;
  r2: number;
}

export function growVessels(rng: Rng, o: ColonizeOptions): VesselSegment[] {
  const step = o.step ?? o.radius * 0.022;
  const influence = o.influence ?? o.radius * 0.35;
  const kill = o.kill ?? step * 1.6;
  const maxIterations = o.maxIterations ?? 260;

  // 1. Attractors inside the retina, outside the macula and the disc.
  const ax: number[] = [];
  const ay: number[] = [];
  const want = o.attractors ?? 700;
  while (ax.length < want) {
    const a = rng() * Math.PI * 2;
    const r = Math.sqrt(rng()) * o.radius * 0.97;
    const x = o.cx + Math.cos(a) * r;
    const y = o.cy + Math.sin(a) * r;
    if (Math.hypot(x - o.macula.x, y - o.macula.y) < o.macula.r) continue;
    if (Math.hypot(x - o.disc.x, y - o.disc.y) < o.radius * 0.12) continue;
    ax.push(x);
    ay.push(y);
  }
  const alive = new Uint8Array(ax.length).fill(1);

  // 2. Roots at the optic disc, one per main vessel direction.
  const nodes: Node[] = [];
  const rootAngles = [-2.2, 2.2, -2.75, 2.75, -0.8, 0.8, -1.5, 1.5];
  for (const ang of rootAngles) {
    nodes.push({ x: o.disc.x, y: o.disc.y, parent: -1, children: 0, r2: 0 });
    const root = nodes.length - 1;
    nodes.push({
      x: o.disc.x + Math.cos(ang) * step * 2,
      y: o.disc.y + Math.sin(ang) * step * 2,
      parent: root,
      children: 0,
      r2: 0,
    });
    (nodes[root] as Node).children++;
  }

  // 3. Grow.
  for (let it = 0; it < maxIterations; it++) {
    const n = nodes.length;
    const dx = new Float32Array(n);
    const dy = new Float32Array(n);
    const pulls = new Uint16Array(n);
    let any = false;
    for (let i = 0; i < ax.length; i++) {
      if (!alive[i]) continue;
      let best = -1;
      let bestD = influence;
      for (let k = 0; k < n; k++) {
        const nd = nodes[k] as Node;
        const d = Math.hypot((ax[i] as number) - nd.x, (ay[i] as number) - nd.y);
        if (d < kill) {
          alive[i] = 0;
          best = -1;
          break;
        }
        if (d < bestD) {
          bestD = d;
          best = k;
        }
      }
      if (best < 0) continue;
      const nd = nodes[best] as Node;
      dx[best] = (dx[best] as number) + ((ax[i] as number) - nd.x) / bestD;
      dy[best] = (dy[best] as number) + ((ay[i] as number) - nd.y) / bestD;
      pulls[best] = (pulls[best] as number) + 1;
      any = true;
    }
    if (!any) break;
    for (let k = 0; k < n; k++) {
      if (!pulls[k]) continue;
      const nd = nodes[k] as Node;
      // Keep some of the current heading so vessels curve smoothly instead of zig-zagging.
      let hx = dx[k] as number;
      let hy = dy[k] as number;
      if (nd.parent >= 0) {
        const p = nodes[nd.parent] as Node;
        const pl = Math.hypot(nd.x - p.x, nd.y - p.y) || 1;
        hx += ((nd.x - p.x) / pl) * (pulls[k] as number) * 0.8;
        hy += ((nd.y - p.y) / pl) * (pulls[k] as number) * 0.8;
      }
      const l = Math.hypot(hx, hy) || 1;
      const x = nd.x + (hx / l) * step;
      const y = nd.y + (hy / l) * step;
      if (Math.hypot(x - o.cx, y - o.cy) > o.radius * 0.98) continue;
      nodes.push({ x, y, parent: k, children: 0, r2: 0 });
      nd.children++;
    }
  }

  // 4. Thickness by the pipe model, from the tips back to the roots.
  const tip = 0.55;
  for (let k = nodes.length - 1; k >= 0; k--) {
    const nd = nodes[k] as Node;
    if (nd.children === 0) nd.r2 = tip * tip;
    if (nd.parent >= 0) (nodes[nd.parent] as Node).r2 += nd.r2;
  }
  const segments: VesselSegment[] = [];
  for (const nd of nodes) {
    if (nd.parent < 0) continue;
    const p = nodes[nd.parent] as Node;
    segments.push({ x0: p.x, y0: p.y, x1: nd.x, y1: nd.y, width: Math.min(3.6, Math.sqrt(nd.r2) * 0.42 + 0.5) });
  }
  return segments;
}
