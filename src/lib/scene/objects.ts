/**
 * The three project objects, built from points (no models, no textures).
 *
 * How it works, in plain English:
 * - Each object lives in a box from -1 to 1 on every axis, so the scene can place and size
 *   it to fit any empty slot on the page.
 * - Mizan: 15 rising trend lines, one per area, with scattered "noisy years" around them.
 *   The rates are spread across the 0.24 to 0.49 °C per decade range in CONTENT.md; the
 *   order of the lines is illustrative. Hovering its project row pulls the noise in, so
 *   the lines snap straight.
 * - Eye: a ball of points with iris rings facing the viewer and a few vessels. The iris
 *   points are recomputed each frame from the pupil size, so the pupil can widen.
 *   The scene turns the eye toward the cursor.
 * - Beyond the Streak: two bars of points, users +23% and bookings +8%, at those heights.
 *   Hovering its project row raises them a little.
 * Every object gets `update(dt, time, hovered)`; `time` is 0 when motion is reduced.
 */

import {
  BufferAttribute,
  BufferGeometry,
  Color,
  Float32BufferAttribute,
  Group,
  LineBasicMaterial,
  LineSegments,
  Points,
  PointsMaterial,
} from 'three';

export interface SceneObject {
  group: Group;
  update(dt: number, time: number, hovered: boolean): void;
}

const TEXT = new Color('#E8E6E1');
const MID = new Color('#9A9890');
const DIM = new Color('#3D4350');
const VESSEL = new Color('#5CC8FF');

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

function pointCloud(positions: Float32Array, colors: number[], pointSize: number): Points {
  const g = new BufferGeometry();
  g.setAttribute('position', new BufferAttribute(positions, 3));
  g.setAttribute('color', new Float32BufferAttribute(colors, 3));
  return new Points(g, new PointsMaterial({ size: pointSize, sizeAttenuation: false, vertexColors: true }));
}

function lines(segments: number[]): LineSegments {
  const g = new BufferGeometry();
  g.setAttribute('position', new Float32BufferAttribute(segments, 3));
  return new LineSegments(g, new LineBasicMaterial({ color: DIM }));
}

function boxEdges(x0: number, y0: number, z0: number, x1: number, y1: number, z1: number): number[] {
  const X = [x0, x1];
  const Y = [y0, y1];
  const Z = [z0, z1];
  const out: number[] = [];
  for (let a = 0; a < 2; a++)
    for (let b = 0; b < 2; b++) {
      out.push(X[0] as number, Y[a] as number, Z[b] as number, X[1] as number, Y[a] as number, Z[b] as number);
      out.push(X[a] as number, Y[0] as number, Z[b] as number, X[a] as number, Y[1] as number, Z[b] as number);
      out.push(X[a] as number, Y[b] as number, Z[0] as number, X[a] as number, Y[b] as number, Z[1] as number);
    }
  return out;
}

const approach = (from: number, to: number, dt: number, speed: number): number =>
  from + (to - from) * Math.min(1, dt * speed);

/* ------------------------------------------------------------------ */

export function makeTrend(pointSize: number): SceneObject {
  const r = rng(3);
  const g = (): number => r() + r() + r() - 1.5;
  const base: number[] = [];
  const resid: number[] = [];
  const colors: number[] = [];
  const AREAS = 15;
  for (let a = 0; a < AREAS; a++) {
    const rate = 0.24 + (0.25 * a) / (AREAS - 1);
    const z = -0.7 + (1.4 * a) / (AREAS - 1);
    for (let s = 0; s < 34; s++) {
      const u = s / 33;
      base.push(-0.95 + 1.9 * u, -0.78 + 1.5 * (rate / 0.49) * u, z);
      resid.push(g() * 0.07);
      colors.push(TEXT.r, TEXT.g, TEXT.b);
    }
    for (let s = 0; s < 10; s++) {
      const u = r();
      base.push(-0.95 + 1.9 * u, -0.78 + 1.5 * (rate / 0.49) * u, z);
      resid.push(g() * 0.3);
      colors.push(MID.r, MID.g, MID.b);
    }
  }
  const pos = new Float32Array(base);
  const cloud = pointCloud(pos, colors, pointSize);
  const frame = lines([
    -1, -0.85, -0.8, 1, -0.85, -0.8, 1, -0.85, -0.8, 1, -0.85, 0.8, 1, -0.85, 0.8, -1, -0.85, 0.8, -1, -0.85, 0.8, -1,
    -0.85, -0.8, -1, -0.85, 0.8, -1, 0.85, 0.8,
  ]);
  const group = new Group();
  group.add(cloud, frame);
  let noise = 1;
  const attr = cloud.geometry.getAttribute('position') as BufferAttribute;
  const apply = (): void => {
    for (let i = 0; i < resid.length; i++) pos[i * 3 + 1] = (base[i * 3 + 1] as number) + (resid[i] as number) * noise;
    attr.needsUpdate = true;
  };
  apply();
  return {
    group,
    update(dt, time, hovered) {
      const target = hovered ? 0 : 1;
      if (Math.abs(noise - target) > 0.001) {
        noise = approach(noise, target, dt, 6);
        apply();
      }
      group.rotation.x = 0.32;
      group.rotation.y = -0.55 + 0.4 * Math.sin(time * 0.35);
    },
  };
}

/* ------------------------------------------------------------------ */

export interface EyeObject extends SceneObject {
  /** Where the eye should look: yaw and pitch in radians. */
  look(yaw: number, pitch: number): void;
}

const IRIS = 0.42;

export function makeEye(pointSize: number): EyeObject {
  const r = rng(7);
  const positions: number[] = [];
  const colors: number[] = [];
  const golden = Math.PI * (3 - Math.sqrt(5));
  const n = 1300;
  for (let i = 0; i < n; i++) {
    const y = 1 - ((i + 0.5) / n) * 2;
    const rr = Math.sqrt(1 - y * y);
    const x = Math.cos(i * golden) * rr;
    const z = Math.sin(i * golden) * rr;
    if (Math.acos(z) < IRIS + 0.05) continue;
    positions.push(x, y, z);
    const c = z > 0.2 ? MID : DIM;
    colors.push(c.r, c.g, c.b);
  }
  // Vessels on the white of the eye, curving in from the sides toward the iris.
  for (let v = 0; v < 6; v++) {
    const theta0 = (v / 6) * Math.PI * 2 + 0.4;
    for (let s = 0; s < 34; s++) {
      const u = s / 33;
      const alpha = 1.35 - u * 0.8;
      const theta = theta0 + Math.sin(u * 3 + v) * 0.18;
      positions.push(Math.sin(alpha) * Math.cos(theta), Math.sin(alpha) * Math.sin(theta), Math.cos(alpha));
      const c = MID.clone().lerp(VESSEL, 0.6);
      colors.push(c.r, c.g, c.b);
    }
  }
  // Iris: angle around the view axis and position from pupil edge (0) to iris edge (1).
  const irisStart = positions.length / 3;
  const irisT: number[] = [];
  const irisA: number[] = [];
  for (let i = 0; i < 700; i++) {
    const t = i < 140 ? 0 : i < 260 ? 1 : r() ** 0.8;
    irisT.push(t);
    irisA.push(r() * Math.PI * 2);
    positions.push(0, 0, 1);
    colors.push(TEXT.r, TEXT.g, TEXT.b);
  }
  const pos = new Float32Array(positions);
  const cloud = pointCloud(pos, colors, pointSize * 1.1);
  const attr = cloud.geometry.getAttribute('position') as BufferAttribute;
  const group = new Group();
  group.add(cloud);

  let pupil = 1;
  let lastPupil = -1;
  let yaw = 0;
  let pitch = 0;
  let yawTarget = 0;
  let pitchTarget = 0;
  const placeIris = (): void => {
    for (let i = 0; i < irisT.length; i++) {
      const a = 0.13 * pupil + (IRIS - 0.13 * pupil) * (irisT[i] as number);
      const j = (irisStart + i) * 3;
      pos[j] = Math.sin(a) * Math.cos(irisA[i] as number);
      pos[j + 1] = Math.sin(a) * Math.sin(irisA[i] as number);
      pos[j + 2] = Math.cos(a);
    }
    attr.needsUpdate = true;
    lastPupil = pupil;
  };
  placeIris();

  return {
    group,
    look(y, p) {
      yawTarget = y;
      pitchTarget = p;
    },
    update(dt, _time, hovered) {
      pupil = approach(pupil, hovered ? 1.7 : 1, dt, 6);
      if (Math.abs(pupil - lastPupil) > 0.002) placeIris();
      yaw = approach(yaw, yawTarget, dt, 6);
      pitch = approach(pitch, pitchTarget, dt, 6);
      group.rotation.set(pitch, yaw, 0);
    },
  };
}

/* ------------------------------------------------------------------ */

export function makeBars(pointSize: number): SceneObject {
  const r = rng(11);
  const FLOOR = -0.8;
  const W = 0.5;
  const users = 1.6;
  const bookings = (1.6 * 8) / 23;
  const bars = [
    { x0: -0.6, h: users, n: 560 },
    { x0: 0.1, h: bookings, n: 200 },
  ];
  const positions: number[] = [];
  const colors: number[] = [];
  const edges: number[] = [];
  for (const b of bars) {
    const side = W * b.h;
    const top = W * W;
    const total = side * 4 + top;
    for (let i = 0; i < b.n; i++) {
      const pick = r() * total;
      const s1 = r();
      const s2 = r();
      let x: number;
      let y: number;
      let z: number;
      if (pick < top) {
        x = b.x0 + s1 * W;
        y = FLOOR + b.h;
        z = -W / 2 + s2 * W;
      } else {
        const face = Math.floor((pick - top) / side);
        y = FLOOR + s2 * b.h;
        if (face === 0) [x, z] = [b.x0 + s1 * W, -W / 2];
        else if (face === 1) [x, z] = [b.x0 + s1 * W, W / 2];
        else if (face === 2) [x, z] = [b.x0, -W / 2 + s1 * W];
        else [x, z] = [b.x0 + W, -W / 2 + s1 * W];
      }
      positions.push(x, y, z);
      const c = b.h === users ? TEXT : MID;
      colors.push(c.r, c.g, c.b);
    }
    edges.push(...boxEdges(b.x0, FLOOR, -W / 2, b.x0 + W, FLOOR + b.h, W / 2));
  }
  edges.push(-0.9, FLOOR, -0.5, 0.9, FLOOR, -0.5, 0.9, FLOOR, -0.5, 0.9, FLOOR, 0.5, 0.9, FLOOR, 0.5, -0.9, FLOOR, 0.5, -0.9, FLOOR, 0.5, -0.9, FLOOR, -0.5);
  const inner = new Group();
  inner.add(pointCloud(new Float32Array(positions), colors, pointSize), lines(edges));
  // Grow from the floor, not the middle.
  inner.position.y = FLOOR;
  inner.children.forEach((c) => (c.position.y = -FLOOR));
  const group = new Group();
  group.add(inner);
  let lift = 1;
  return {
    group,
    update(dt, time, hovered) {
      lift = approach(lift, hovered ? 1.15 : 1, dt, 6);
      inner.scale.y = lift;
      group.rotation.x = 0.3;
      group.rotation.y = 0.6 + 0.4 * Math.sin(time * 0.3 + 1.5);
    },
  };
}
