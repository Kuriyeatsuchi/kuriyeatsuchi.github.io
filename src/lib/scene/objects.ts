/**
 * The three project objects, built from points and lines (no models, no textures).
 *
 * How it works, in plain English:
 * - Each object fits in a box from -1 to 1, so the scene can place and size it over any
 *   empty spot on the page. The scene moves, scales and (when the visitor drags it)
 *   rotates the outer `group`; the object animates its own `inner` group.
 * - Mizan has three designs it can switch between: 15 rising trend lines (rates spread
 *   across the 0.24 to 0.49 °C per decade range in CONTENT.md, order illustrative), a globe
 *   of points, and a 20 x 20 grid of tests where 5% light up (a fair test's false alarms).
 *   Hovering its project row straightens the trend lines.
 * - The eye: an even shell of points (the white of the eye) around a hidden solid ball, so only
 *   the near side shows, never the back through the front. The iris is made of fine radial
 *   fibres with a crisp pupil edge and a ring at its rim, recomputed from the pupil size, so
 *   the pupil can widen or narrow a little (about ±30%). A small light reflection sits on the
 *   iris. The scene sets where it looks; the eye's shape never changes.
 * - Beyond the Streak has three designs: two bars (users +23%, bookings +8%), a stacked
 *   column of the three plan parts ($81M, $16M, $23M), and two lines that drift apart
 *   (+23% vs +8%). Hovering its row raises the bars.
 * - `setOpacity` lets the scene fade an object when it sits over text.
 */

import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Material,
  Points,
  Mesh,
  MeshBasicMaterial,
  PointsMaterial,
  SphereGeometry,
} from 'three';

export interface SceneObject {
  group: Group;
  designCount: number;
  showDesign(index: number): void;
  setOpacity(opacity: number): void;
  update(dt: number, time: number, hovered: boolean): void;
}

export interface EyeObject extends SceneObject {
  /** Where the eye should look: yaw and pitch in radians. */
  look(yaw: number, pitch: number): void;
  /** Hold the pupil at `size` (1 = normal) for `seconds`. */
  pupilFor(size: number, seconds: number): void;
}

const TEXT = new Color('#E8E6E1');
const LIGHT = new Color('#B5B3AD');
const MID = new Color('#9A9890');
const DIM = new Color('#3D4350');

function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

class Builder {
  positions: number[] = [];
  colors: number[] = [];
  edges: number[] = [];
  point(x: number, y: number, z: number, c: Color): void {
    this.positions.push(x, y, z);
    this.colors.push(c.r, c.g, c.b);
  }
  edge(...xyz: number[]): void {
    this.edges.push(...xyz);
  }
  box(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): void {
    const X = [x0, x1];
    const Y = [y0, y1];
    const Z = [z0, z1];
    for (let a = 0; a < 2; a++)
      for (let b = 0; b < 2; b++) {
        this.edge(X[0] as number, Y[a] as number, Z[b] as number, X[1] as number, Y[a] as number, Z[b] as number);
        this.edge(X[a] as number, Y[0] as number, Z[b] as number, X[a] as number, Y[1] as number, Z[b] as number);
        this.edge(X[a] as number, Y[b] as number, Z[0] as number, X[a] as number, Y[b] as number, Z[1] as number);
      }
  }
  /** Points scattered over the four sides and the top of a box. */
  boxSurface(r: () => number, x0: number, y0: number, w: number, h: number, n: number, c: Color): void {
    const side = w * h;
    const total = side * 4 + w * w;
    for (let i = 0; i < n; i++) {
      const pick = r() * total;
      const s1 = r();
      const s2 = r();
      if (pick < w * w) {
        this.point(x0 + s1 * w, y0 + h, -w / 2 + s2 * w, c);
        continue;
      }
      const face = Math.floor((pick - w * w) / side);
      const y = y0 + s2 * h;
      if (face === 0) this.point(x0 + s1 * w, y, -w / 2, c);
      else if (face === 1) this.point(x0 + s1 * w, y, w / 2, c);
      else if (face === 2) this.point(x0, y, -w / 2 + s1 * w, c);
      else this.point(x0 + w, y, -w / 2 + s1 * w, c);
    }
  }
  build(pointSize: number, materials: Material[]): { group: Group; positions: Float32Array; attr: BufferAttribute } {
    const group = new Group();
    const g = new BufferGeometry();
    const positions = new Float32Array(this.positions);
    const attr = new BufferAttribute(positions, 3);
    g.setAttribute('position', attr);
    g.setAttribute('color', new Float32BufferAttribute(this.colors, 3));
    const pm = new PointsMaterial({ size: pointSize, sizeAttenuation: false, vertexColors: true, transparent: true });
    materials.push(pm);
    group.add(new Points(g, pm));
    if (this.edges.length) {
      const lg = new BufferGeometry();
      lg.setAttribute('position', new Float32BufferAttribute(this.edges, 3));
      const lm = new LineBasicMaterial({ color: DIM, transparent: true });
      materials.push(lm);
      group.add(new LineSegments(lg, lm));
    }
    return { group, positions, attr };
  }
}

const approach = (from: number, to: number, dt: number, speed: number): number =>
  from + (to - from) * Math.min(1, dt * speed);

/** Shared plumbing: outer group, inner group, design switching, opacity. */
function shell(designs: Group[], materials: Material[]) {
  const group = new Group();
  const inner = new Group();
  group.add(inner);
  designs.forEach((d, i) => {
    d.visible = i === 0;
    inner.add(d);
  });
  return {
    group,
    inner,
    designCount: designs.length,
    showDesign(index: number): void {
      designs.forEach((d, i) => (d.visible = i === index % designs.length));
    },
    setOpacity(opacity: number): void {
      for (const m of materials) m.opacity = opacity;
    },
  };
}

/* ------------------------------------------------------------------ */
/* Mizan                                                               */
/* ------------------------------------------------------------------ */

export function makeTrend(pointSize: number): SceneObject {
  const r = rng(3);
  const g = (): number => r() + r() + r() - 1.5;
  const materials: Material[] = [];

  // Design 0: 15 trend lines with noisy years around them.
  const t = new Builder();
  const resid: number[] = [];
  for (let a = 0; a < 15; a++) {
    const rate = 0.24 + (0.25 * a) / 14;
    const z = -0.7 + (1.4 * a) / 14;
    for (let s = 0; s < 44; s++) {
      const onLine = s < 34;
      const u = onLine ? s / 33 : r();
      t.point(-0.95 + 1.9 * u, -0.78 + 1.5 * (rate / 0.49) * u, z, onLine ? TEXT : MID);
      resid.push(g() * (onLine ? 0.07 : 0.3));
    }
  }
  t.edge(-1, -0.85, -0.8, 1, -0.85, -0.8, 1, -0.85, -0.8, 1, -0.85, 0.8, 1, -0.85, 0.8, -1, -0.85, 0.8);
  t.edge(-1, -0.85, 0.8, -1, -0.85, -0.8, -1, -0.85, 0.8, -1, 0.85, 0.8);
  const base = t.positions.slice();
  const trend = t.build(pointSize, materials);

  // Design 1: a globe with one bright patch facing the viewer.
  const gl = new Builder();
  const golden = Math.PI * (3 - Math.sqrt(5));
  const dir = [0, 0.26, 0.966];
  for (let i = 0; i < 1000; i++) {
    const y = 1 - ((i + 0.5) / 1000) * 2;
    const rr = Math.sqrt(1 - y * y);
    const x = Math.cos(i * golden) * rr;
    const z = Math.sin(i * golden) * rr;
    const near = x * (dir[0] as number) + y * (dir[1] as number) + z * (dir[2] as number) > Math.cos(0.3);
    gl.point(x * 0.95, y * 0.95, z * 0.95, near ? TEXT : z > 0 ? MID : DIM);
  }
  const globe = gl.build(pointSize, materials);

  // Design 2: 400 tests on pure noise, 5% light up (a fair test's false alarms).
  const gr = new Builder();
  const fooled = new Set<number>();
  while (fooled.size < 20) fooled.add(Math.floor(r() * 400));
  for (let i = 0; i < 400; i++) {
    const x = -0.9 + ((i % 20) / 19) * 1.8;
    const y = -0.9 + (Math.floor(i / 20) / 19) * 1.8;
    gr.point(x, y, fooled.has(i) ? 0.18 : 0, fooled.has(i) ? TEXT : DIM);
  }
  const grid = gr.build(pointSize * 1.3, materials);

  const s = shell([trend.group, globe.group, grid.group], materials);
  let noise = 1;
  const apply = (): void => {
    for (let i = 0; i < resid.length; i++) trend.positions[i * 3 + 1] = (base[i * 3 + 1] as number) + (resid[i] as number) * noise;
    trend.attr.needsUpdate = true;
  };
  apply();
  return {
    ...s,
    update(dt, time, hovered) {
      const target = hovered ? 0 : 1;
      if (Math.abs(noise - target) > 0.001) {
        noise = approach(noise, target, dt, 6);
        apply();
      }
      s.inner.rotation.x = 0.32;
      s.inner.rotation.y = -0.55 + 0.4 * Math.sin(time * 0.35);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Eye                                                                 */
/* ------------------------------------------------------------------ */

const IRIS = 0.42;
const PUPIL = 0.14;
const SCLERA = new Color('#6F7076');

export function makeEye(pointSize: number): EyeObject {
  const r = rng(7);
  const materials: Material[] = [];

  // A hidden ball in the background colour: it hides the far side of the shell.
  const occluderMaterial = new MeshBasicMaterial({ color: '#0B0D12', transparent: true });
  materials.push(occluderMaterial);
  const occluder = new Mesh(new SphereGeometry(0.965, 40, 28), occluderMaterial);
  occluder.renderOrder = -1;

  // White of the eye: an even Fibonacci shell in one tone, open where the iris sits (+z).
  const b = new Builder();
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < 1500; i++) {
    const y = 1 - ((i + 0.5) / 1500) * 2;
    const rr = Math.sqrt(1 - y * y);
    const x = Math.cos(i * golden) * rr;
    const z = Math.sin(i * golden) * rr;
    if (Math.acos(z) < IRIS + 0.035) continue;
    b.point(x, y, z, SCLERA);
  }

  // Iris: radial fibres from the pupil edge (t = 0) to the rim (t = 1), a dense pupil edge,
  // and a ring at the rim (the limbus).
  const irisStart = b.positions.length / 3;
  const irisT: number[] = [];
  const irisA: number[] = [];
  const addIris = (t: number, a: number, c: Color): void => {
    irisT.push(t);
    irisA.push(a);
    b.point(0, 0, 1, c);
  };
  const SPOKES = 96;
  for (let k = 0; k < SPOKES; k++) {
    const a0 = (k / SPOKES) * Math.PI * 2;
    const c = r() < 0.5 ? TEXT : LIGHT;
    for (let j = 0; j < 8; j++) addIris(0.08 + (j / 8) * 0.86 + r() * 0.05, a0 + (r() - 0.5) * 0.03, c);
  }
  for (let k = 0; k < 110; k++) addIris(0, (k / 110) * Math.PI * 2, TEXT);
  for (let k = 0; k < 150; k++) addIris(1, (k / 150) * Math.PI * 2, LIGHT);

  const eye = b.build(pointSize * 1.05, materials);

  // A small light reflection on the upper-left of the iris; it turns with the eye.
  const cl = new Builder();
  for (let i = 0; i < 26; i++) {
    const a = r() * Math.PI * 2;
    const d = Math.sqrt(r()) * 0.045;
    cl.point(-0.16 + Math.cos(a) * d, 0.18 + Math.sin(a) * d, 1.02, new Color('#FFFFFF'));
  }
  const catchlight = cl.build(pointSize * 1.15, materials).group;

  const s = shell([eye.group], materials);
  s.inner.add(occluder);
  s.inner.add(catchlight);

  let pupil = 1;
  let lastPupil = -1;
  let yaw = 0;
  let pitch = 0;
  let yawTarget = 0;
  let pitchTarget = 0;
  let holdSize = 1;
  let holdFor = 0;
  const placeIris = (): void => {
    const p = PUPIL * pupil;
    for (let i = 0; i < irisT.length; i++) {
      const a = p + (IRIS - p) * (irisT[i] as number);
      const j = (irisStart + i) * 3;
      eye.positions[j] = Math.sin(a) * Math.cos(irisA[i] as number);
      eye.positions[j + 1] = Math.sin(a) * Math.sin(irisA[i] as number);
      eye.positions[j + 2] = Math.cos(a);
    }
    eye.attr.needsUpdate = true;
    lastPupil = pupil;
  };
  placeIris();

  return {
    ...s,
    look(y, p) {
      yawTarget = y;
      pitchTarget = p;
    },
    pupilFor(size, seconds) {
      holdSize = size;
      holdFor = seconds;
    },
    update(dt, _time, hovered) {
      holdFor -= dt;
      pupil = approach(pupil, holdFor > 0 ? holdSize : hovered ? 1.2 : 1, dt, 4);
      if (Math.abs(pupil - lastPupil) > 0.002) placeIris();
      yaw = approach(yaw, yawTarget, dt, 6);
      pitch = approach(pitch, pitchTarget, dt, 6);
      s.inner.rotation.set(pitch, yaw, 0);
    },
  };
}

/* ------------------------------------------------------------------ */
/* Beyond the Streak                                                   */
/* ------------------------------------------------------------------ */

export function makeBars(pointSize: number): SceneObject {
  const r = rng(11);
  const materials: Material[] = [];
  const FLOOR = -0.8;

  // Design 0: users +23% vs bookings +8%.
  const bb = new Builder();
  const W = 0.5;
  const users = 1.6;
  const bookings = (1.6 * 8) / 23;
  bb.boxSurface(r, -0.6, FLOOR, W, users, 560, TEXT);
  bb.boxSurface(r, 0.1, FLOOR, W, bookings, 200, MID);
  bb.box(-0.6, FLOOR, -W / 2, -0.6 + W, FLOOR + users, W / 2);
  bb.box(0.1, FLOOR, -W / 2, 0.1 + W, FLOOR + bookings, W / 2);
  bb.edge(-0.9, FLOOR, -0.5, 0.9, FLOOR, -0.5, 0.9, FLOOR, -0.5, 0.9, FLOOR, 0.5, 0.9, FLOOR, 0.5, -0.9, FLOOR, 0.5, -0.9, FLOOR, 0.5, -0.9, FLOOR, -0.5);
  const barsBuilt = bb.build(pointSize, materials);
  // Raise from the floor, not the middle.
  const bars = new Group();
  bars.position.y = FLOOR;
  barsBuilt.group.position.y = -FLOOR;
  bars.add(barsBuilt.group);
  const barsDesign = new Group();
  barsDesign.add(bars);

  // Design 1: the plan's three parts stacked: $81M, $16M, $23M of $120M.
  const st = new Builder();
  const SW = 0.6;
  let y0 = FLOOR;
  const parts = [
    { m: 81, c: TEXT },
    { m: 16, c: LIGHT },
    { m: 23, c: MID },
  ];
  for (const p of parts) {
    const h = (p.m / 120) * 1.7;
    st.boxSurface(r, -SW / 2, y0, SW, h, Math.round(p.m * 8), p.c);
    st.box(-SW / 2, y0, -SW / 2, SW / 2, y0 + h, SW / 2);
    y0 += h;
  }
  const stack = st.build(pointSize, materials);

  // Design 2: daily users and bookings drifting apart (+23% vs +8%).
  const dv = new Builder();
  for (let i = 0; i < 90; i++) {
    const u = i / 89;
    const x = -0.9 + 1.8 * u;
    const yu = -0.6 + 1.3 * u;
    const yb = -0.6 + 1.3 * u * (8 / 23);
    dv.point(x, yu, 0.12, TEXT);
    dv.point(x, yb, -0.12, MID);
    for (let k = 0; k < 2; k++) dv.point(x, yb + (yu - yb) * r(), (r() - 0.5) * 0.24, DIM);
  }
  dv.edge(-0.95, -0.7, 0, 0.95, -0.7, 0);
  const diverge = dv.build(pointSize, materials);

  const s = shell([barsDesign, stack.group, diverge.group], materials);
  let lift = 1;
  return {
    ...s,
    update(dt, time, hovered) {
      lift = approach(lift, hovered ? 1.15 : 1, dt, 6);
      bars.scale.y = lift;
      s.inner.rotation.x = 0.3;
      s.inner.rotation.y = 0.6 + 0.4 * Math.sin(time * 0.3 + 1.5);
    },
  };
}
