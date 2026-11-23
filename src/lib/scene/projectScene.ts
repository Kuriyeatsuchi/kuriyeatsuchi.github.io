/**
 * One WebGL canvas fixed behind the home page that places the three project objects.
 *
 * How it works, in plain English:
 * - The camera is set so one unit in the scene equals one CSS pixel on the plane z = 0,
 *   so an object can be put exactly over any empty HTML element ("slot").
 * - Home position. In the hero each object sits in a slot beside the name. While its
 *   project row scrolls up the window, it slides into the empty slot in that row.
 *   Once the project list has scrolled past, the objects "follow" the visitor: each
 *   glides to a random spot in the window that has no text under it (new spots every time).
 *   There, every 10 to 15 seconds, Mizan and Beyond the Streak glitch into another design.
 *   The eye always stays the eye.
 * - Dragging. Grab the middle of an object to move it anywhere; grab near its edge to spin
 *   it. Links and buttons under an object still work (dragging never starts on them).
 *   Scrolling sends every object back to its home position and rotation.
 * - Over text, an object fades so the text reads as if the object were behind it.
 * - Objects never overlap: overlapping pairs are pushed apart along the line between them.
 *   The eye is never pushed; whatever overlaps it moves out of the way.
 * - Idle: after a few seconds without input, objects drift and turn very slowly.
 * - The eye always follows the cursor (hovering its project row widens the pupil). Its shape
 *   never changes; it reacts with its pupil.
 * - Give the eye a retina photo and it runs the stage-1 quality gate on it, right in the
 *   browser (src/lib/quality/real.ts); a small panel beside the eye shows the verdict.
 *   Three example photos sit in the hero: drag one onto the eye, or tap it and it flies in.
 *   A visitor's own photo can be dropped on the eye too. Nothing is uploaded.
 *   The pupil widens for a gradeable photo and narrows for a bad one.
 * - Below 768px only the eye is shown. Reduced motion: no drifting, turning or glitching;
 *   objects still follow scrolling and can be dragged. Drawing stops when the tab is hidden.
 */

import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { makeBars, makeEye, makeTrend, type SceneObject } from './objects';
import { degrade, judge, measure } from '../quality/metrics';
import { REAL_LIMITS, fundusFromFile, fundusFromUrl, type RealFundus } from '../quality/real';
import { ui } from '../../content/site';

type Key = 'mizan' | 'retina' | 'hcgcc';
const KEYS: readonly Key[] = ['mizan', 'retina', 'hcgcc'];
const FOV = 30;
const GLITCH = 0.42; // seconds
const FADED = 0.2;

const clamp = (v: number, lo: number, hi: number): number => Math.min(hi, Math.max(lo, v));
const smooth = (x: number): number => {
  const t = clamp(x, 0, 1);
  return t * t * (3 - 2 * t);
};
const approach = (from: number, to: number, dt: number, speed: number): number =>
  from + (to - from) * Math.min(1, dt * speed);

interface Body {
  key: Key;
  obj: SceneObject;
  hero: HTMLElement | null;
  row: HTMLElement | null;
  free: { x: number; y: number; size: number };
  blend: number; // 0 = hero/row slot, 1 = free spot
  off: { x: number; y: number }; // where the visitor dragged it
  rot: { x: number; y: number }; // how the visitor spun it
  x: number;
  y: number;
  radius: number;
  visible: boolean;
  opacity: number;
  overText: boolean;
  design: number;
  glitch: number; // seconds into a glitch, or -1
  glitchTo: number;
  nextSwitch: number;
  phase: number;
  /** Position before separation (last frame), and the separation offset itself. */
  baseX: number;
  baseY: number;
  sepX: number;
  sepY: number;
}

/** True for an element that directly holds visible text (or is a control or image). */
function holdsText(el: Element): boolean {
  if (el instanceof HTMLImageElement || el instanceof HTMLInputElement || el instanceof HTMLButtonElement) return true;
  for (const n of Array.from(el.childNodes)) if (n.nodeType === Node.TEXT_NODE && n.textContent?.trim()) return true;
  return false;
}

function textAt(x: number, y: number, r: number, spread: number): boolean {
  const pts: [number, number][] = [
    [0, 0],
    [spread, 0],
    [-spread, 0],
    [0, spread],
    [0, -spread],
    [spread * 0.7, spread * 0.7],
    [-spread * 0.7, spread * 0.7],
    [spread * 0.7, -spread * 0.7],
    [-spread * 0.7, -spread * 0.7],
  ];
  for (const [dx, dy] of pts) {
    const el = document.elementFromPoint(x + dx * r, y + dy * r);
    if (el && holdsText(el)) return true;
  }
  return false;
}

export function mount(canvas: HTMLCanvasElement): void {
  let renderer: WebGLRenderer;
  try {
    renderer = new WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'low-power' });
  } catch {
    return; // No WebGL: the slots simply stay empty.
  }
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  renderer.setPixelRatio(dpr);
  const scene = new Scene();
  const camera = new PerspectiveCamera(FOV, 1, 1, 10000);

  const pointSize = 2.2 * dpr;
  const eye = makeEye(pointSize);
  const made: Record<Key, SceneObject> = { mizan: makeTrend(pointSize), retina: eye, hcgcc: makeBars(pointSize) };
  const slot = (name: string): HTMLElement | null => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);
  const bodies: Body[] = KEYS.map((key, i) => {
    scene.add(made[key].group);
    return {
      key,
      obj: made[key],
      hero: slot(`hero-${key}`),
      row: slot(`row-${key}`),
      free: { x: 0, y: 0, size: 140 },
      blend: 0,
      off: { x: 0, y: 0 },
      rot: { x: 0, y: 0 },
      x: 0,
      y: 0,
      radius: 0,
      visible: false,
      opacity: 1,
      overText: false,
      design: 0,
      glitch: -1,
      glitchTo: 0,
      nextSwitch: 0,
      phase: i * 2.1 + 0.7,
      baseX: 0,
      baseY: 0,
      sepX: 0,
      sepY: 0,
    };
  });
  const projects = document.getElementById('projects');

  let w = 0;
  let h = 0;
  const resize = (): void => {
    w = window.innerWidth;
    h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, 0, h / 2 / Math.tan((FOV * Math.PI) / 360));
    camera.far = camera.position.z * 4;
    camera.updateProjectionMatrix();
  };
  resize();

  let clock = 0; // seconds since mount
  let time = 0; // drives idle motion; frozen with reduced motion
  let lastInput = 0;
  let returning = false;
  let freeMode = false;
  let frameNo = 0;
  let wander = 0; // 0..1, eases in when idle and out on any input

  /* ---------- hovering project rows ---------- */
  let hovered: Key | null = null;
  for (const row of document.querySelectorAll<HTMLElement>('[data-project]')) {
    const key = row.dataset.project as Key;
    const on = (): void => {
      hovered = key;
      wake();
    };
    const off = (): void => {
      if (hovered === key) hovered = null;
      wake();
    };
    row.addEventListener('pointerenter', on);
    row.addEventListener('pointerleave', off);
    row.addEventListener('focus', on);
    row.addEventListener('blur', off);
  }

  /* ---------- free spots (after the project list) ---------- */
  const pickFreeSpots = (): void => {
    const chosen: Body[] = [];
    for (const b of bodies) {
      if (w < 768 && b.key !== 'retina') continue;
      const size = clamp(w * 0.11, 110, 180);
      const r = size / 2;
      let spot: { x: number; y: number } | null = null;
      for (let i = 0; i < 90 && !spot; i++) {
        const x = r + 16 + Math.random() * Math.max(1, w - 2 * r - 32);
        const y = r + 72 + Math.random() * Math.max(1, h - 2 * r - 88);
        const clear = chosen.every((o) => Math.hypot(o.free.x - x, o.free.y - y) > o.free.size / 2 + r + 24);
        if (clear && !textAt(x, y, r, 0.95)) spot = { x, y };
      }
      b.free = { ...(spot ?? { x: w - r - 24, y: r + 80 + chosen.length * (size + 24) }), size };
      chosen.push(b);
    }
  };

  /* ---------- dragging ---------- */
  type Drag = { body: Body; mode: 'move' | 'rotate'; x: number; y: number; id: number };
  let drag: Drag | null = null;
  const INTERACTIVE = 'a, button, input, select, textarea, label, summary';
  const hit = (x: number, y: number): { body: Body; d: number } | null => {
    let best: { body: Body; d: number } | null = null;
    for (const b of bodies) {
      if (!b.visible) continue;
      const d = Math.hypot(x - b.x, y - b.y);
      if (d < b.radius && (!best || d < best.d)) best = { body: b, d };
    }
    return best;
  };
  const startDrag = (x: number, y: number, id: number, target: EventTarget | null): boolean => {
    if (target instanceof Element && target.closest(INTERACTIVE)) return false;
    const h1 = hit(x, y);
    if (!h1) return false;
    drag = { body: h1.body, mode: h1.d < h1.body.radius * 0.6 ? 'move' : 'rotate', x, y, id };
    returning = false;
    lastInput = clock;
    document.documentElement.style.cursor = drag.mode === 'move' ? 'move' : 'grabbing';
    wake();
    return true;
  };

  window.addEventListener(
    'pointerdown',
    (e) => {
      if (e.button !== 0) return;
      if (startDrag(e.clientX, e.clientY, e.pointerId, e.target)) e.preventDefault();
    },
    { capture: true },
  );
  // Touch: stop the page from scrolling when a finger lands on an object.
  window.addEventListener(
    'touchstart',
    (e) => {
      const t = e.touches[0];
      if (!t || e.touches.length > 1) return;
      if (e.target instanceof Element && e.target.closest(INTERACTIVE)) return;
      if (hit(t.clientX, t.clientY)) e.preventDefault();
    },
    { passive: false, capture: true },
  );

  let pointerX = -1;
  let pointerY = -1;

  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType === 'mouse') {
        pointerX = e.clientX;
        pointerY = e.clientY;
      }
      lastInput = clock;
      if (drag && e.pointerId === drag.id) {
        const dx = e.clientX - drag.x;
        const dy = e.clientY - drag.y;
        drag.x = e.clientX;
        drag.y = e.clientY;
        if (drag.mode === 'move') {
          drag.body.off.x += dx;
          drag.body.off.y += dy;
        } else {
          drag.body.rot.y += dx * 0.012;
          drag.body.rot.x += dy * 0.012;
        }
      } else if (e.pointerType === 'mouse') {
        const over = e.target instanceof Element && e.target.closest(INTERACTIVE);
        const h1 = over ? null : hit(e.clientX, e.clientY);
        document.documentElement.style.cursor = h1 ? (h1.d < h1.body.radius * 0.6 ? 'move' : 'grab') : '';
      }
      wake();
    },
    { passive: true },
  );
  const endDrag = (): void => {
    if (!drag) return;
    drag = null;
    document.documentElement.style.cursor = '';
    wake();
  };
  window.addEventListener('pointerup', endDrag);
  window.addEventListener('pointercancel', endDrag);

  window.addEventListener(
    'scroll',
    () => {
      lastInput = clock;
      if (!drag) {
        returning = true;
        // Unwind idle turning so objects take the short way home.
        for (const b of bodies) b.rot.y = Math.atan2(Math.sin(b.rot.y), Math.cos(b.rot.y));
      }
      wake();
    },
    { passive: true },
  );

  /* ---------- per frame ---------- */
  const place = (dt: number): boolean => {
    let busy = !!drag;
    const narrow = w < 768;

    // Enter / leave "follow" mode once the project list has scrolled past.
    const pr = projects?.getBoundingClientRect();
    const nowFree = !!pr && pr.bottom < h * 0.35;
    if (nowFree !== freeMode) {
      freeMode = nowFree;
      if (freeMode) {
        pickFreeSpots();
        for (const b of bodies) b.nextSwitch = clock + 10 + Math.random() * 5;
      } else {
        for (const b of bodies) if (b.design !== 0) startGlitch(b, 0);
      }
    }

    // Keep objects apart (from last frame's positions). The eye never moves for this, and an
    // object being dragged is only pushed when it is dragged onto the eye.
    const push = new Map<Body, { x: number; y: number }>(bodies.map((b) => [b, { x: 0, y: 0 }]));
    for (let i = 0; i < bodies.length; i++) {
      for (let j = i + 1; j < bodies.length; j++) {
        const a = bodies[i] as Body;
        const c = bodies[j] as Body;
        if (!a.visible || !c.visible) continue;
        let dx = c.baseX - a.baseX;
        let dy = c.baseY - a.baseY;
        let d = Math.hypot(dx, dy);
        if (d < 0.01) [dx, dy, d] = [1, 0, 1];
        const need = a.radius + c.radius + 16 - d;
        if (need <= 0) continue;
        const weight = (o: Body, other: Body): number =>
          o.key === 'retina' ? 0 : drag?.body === o && other.key !== 'retina' ? 0 : 1;
        const wa = weight(a, c);
        const wc = weight(c, a);
        if (wa + wc === 0) continue;
        const pa = push.get(a) as { x: number; y: number };
        const pc = push.get(c) as { x: number; y: number };
        pa.x -= (dx / d) * need * (wa / (wa + wc));
        pa.y -= (dy / d) * need * (wa / (wa + wc));
        pc.x += (dx / d) * need * (wc / (wa + wc));
        pc.y += (dy / d) * need * (wc / (wa + wc));
      }
    }

    const idle = !reduced && clock - lastInput > 2.5 ? 1 : 0;
    wander = approach(wander, idle, dt, idle ? 0.35 : 1.5);
    let anyVisible = false;
    for (const b of bodies) {
      const g = b.obj.group;
      const hr = b.hero?.getBoundingClientRect();
      const rr = b.row?.getBoundingClientRect();
      const heroOk = !!hr && hr.width > 0;
      const rowOk = !!rr && rr.width > 0;
      if (narrow && b.key !== 'retina') {
        g.visible = b.visible = false;
        continue;
      }

      // Slot position: hero, sliding into the row as the row comes up.
      let sx = w + 400;
      let sy = h / 2;
      let ss = 0;
      if (heroOk || rowOk) {
        const t = rowOk && heroOk ? smooth((h - (rr as DOMRect).top) / (h * 0.4)) : rowOk ? 1 : 0;
        const a = (heroOk ? hr : rr) as DOMRect;
        const c = (rowOk ? rr : hr) as DOMRect;
        sx = a.left + a.width / 2 + (c.left + c.width / 2 - (a.left + a.width / 2)) * t;
        sy = a.top + a.height / 2 + (c.top + c.height / 2 - (a.top + a.height / 2)) * t;
        ss = Math.min(a.width, a.height) + (Math.min(c.width, c.height) - Math.min(a.width, a.height)) * t;
      }

      // Blend toward the free spot while following.
      const target = freeMode ? 1 : 0;
      if (Math.abs(b.blend - target) > 0.001) {
        b.blend = reduced ? target : approach(b.blend, target, dt, 2.5);
        busy = true;
      }
      const k = smooth(b.blend);
      let x = sx + (b.free.x - sx) * k;
      let y = sy + (b.free.y - sy) * k;
      const size = ss + (b.free.size - ss) * k;

      // Scrolling sends dragged objects home.
      if (returning && drag?.body !== b) {
        b.off.x = approach(b.off.x, 0, dt, 5);
        b.off.y = approach(b.off.y, 0, dt, 5);
        b.rot.x = approach(b.rot.x, 0, dt, 5);
        b.rot.y = approach(b.rot.y, 0, dt, 5);
        if (Math.abs(b.off.x) + Math.abs(b.off.y) > 0.5 || Math.abs(b.rot.x) + Math.abs(b.rot.y) > 0.005) busy = true;
      }

      // Idle drift: a slow wander and a slow turn.
      const drift = wander;
      if (drag?.body !== b) b.rot.y += dt * 0.05 * wander;
      x += b.off.x + drift * (Math.sin(time * 0.11 + b.phase) * 26 + Math.sin(time * 0.047 + b.phase * 3) * 14);
      y += b.off.y + drift * Math.cos(time * 0.09 + b.phase * 1.7) * 20;

      b.baseX = x;
      b.baseY = y;
      const p = push.get(b) as { x: number; y: number };
      b.sepX = reduced ? p.x : approach(b.sepX, p.x, dt, 10);
      b.sepY = reduced ? p.y : approach(b.sepY, p.y, dt, 10);
      if (Math.abs(b.sepX - p.x) + Math.abs(b.sepY - p.y) > 0.5) busy = true;
      x += b.sepX;
      y += b.sepY;
      b.radius = (size / 2) * 0.82;
      b.x = x;
      b.y = y;
      b.visible = size > 4 && y + b.radius > -40 && y - b.radius < h + 40 && x + b.radius > -40 && x - b.radius < w + 40;
      g.visible = b.visible;
      if (!b.visible) continue;
      anyVisible = true;

      // Auto design switch while following (never the eye).
      if (freeMode && !reduced && b.obj.designCount > 1 && b.glitch < 0 && clock > b.nextSwitch) {
        startGlitch(b, (b.design + 1) % b.obj.designCount);
        b.nextSwitch = clock + 10 + Math.random() * 5;
      }

      // Fade over text (checked every few frames; it reads the page layout).
      if (frameNo % 5 === 0) b.overText = textAt(x, y, b.radius, 0.6);
      const op = b.overText ? FADED : 1;
      if (Math.abs(b.opacity - op) > 0.01) {
        b.opacity = reduced ? op : approach(b.opacity, op, dt, 6);
        busy = true;
      }

      let jitterX = 0;
      let stretch = 1;
      let flicker = 1;
      if (b.glitch >= 0) {
        busy = true;
        b.glitch += dt;
        if (b.glitch >= GLITCH / 2 && b.design !== b.glitchTo) {
          b.design = b.glitchTo;
          b.obj.showDesign(b.design);
        }
        if (b.glitch >= GLITCH) b.glitch = -1;
        else {
          jitterX = (Math.random() - 0.5) * 18;
          stretch = 1 + (Math.random() - 0.5) * 0.5;
          flicker = Math.random() > 0.4 ? 1 : 0.25;
        }
      }

      g.position.set(x - w / 2 + jitterX, h / 2 - y, 0);
      g.scale.set(b.radius * stretch, b.radius, b.radius);
      g.rotation.set(b.rot.x, b.rot.y, 0);
      b.obj.setOpacity(b.opacity * flicker);

      if (b.key === 'retina') {
        // Always follow the cursor. tanh eases toward the limit instead of stopping dead,
        // so the eye keeps responding even when the cursor is far across the screen.
        const lx = pointerX < 0 ? 0 : 0.9 * Math.tanh((pointerX - x) / Math.max(300, w * 0.45));
        const ly = pointerY < 0 ? 0 : 0.6 * Math.tanh((pointerY - y) / Math.max(300, h * 0.55));
        eye.look(lx, ly);
        placePanel(x, y, b.radius);
      }
    }
    if (returning && !busy) returning = false;
    return anyVisible && (busy || !reduced);
  };

  function startGlitch(b: Body, to: number): void {
    if (reduced) {
      b.design = to;
      b.obj.showDesign(to);
      return;
    }
    b.glitch = 0;
    b.glitchTo = to;
  }

  let last = 0;
  let raf = 0;
  const frame = (now: number): void => {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    clock += dt;
    if (!reduced) time += dt;
    frameNo++;
    const keepGoing = place(dt);
    for (const b of bodies) b.obj.update(reduced ? 1 : dt, time, hovered === b.key);
    renderer.render(scene, camera);
    if (keepGoing && document.visibilityState === 'visible') raf = requestAnimationFrame(frame);
  };

  function wake(): void {
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  /* ---------- drop a retina photo on the eye ---------- */
  const G = ui.retinaGate;
  const panel = document.querySelector<HTMLElement>('[data-eye-result]');
  const eyeBody = bodies.find((b) => b.key === 'retina') as Body;
  const overEye = (x: number, y: number): boolean => eyeBody.visible && Math.hypot(x - eyeBody.x, y - eyeBody.y) < eyeBody.radius * 1.25;
  const SAMPLE = 'text/x-eye-sample';
  const hasPayload = (e: DragEvent): boolean =>
    !!e.dataTransfer && Array.from(e.dataTransfer.types).some((t) => t === 'Files' || t === SAMPLE);

  function placePanel(x: number, y: number, r: number): void {
    if (!panel || panel.hidden) return;
    const pw = panel.offsetWidth;
    const ph = panel.offsetHeight;
    const left = x + r + 20 + pw < w - 12 ? x + r + 20 : Math.max(12, x - r - 20 - pw);
    panel.style.left = `${left}px`;
    panel.style.top = `${clamp(y - ph / 2, 72, Math.max(72, h - ph - 12))}px`;
  }

  const showResult = async (source: Promise<RealFundus | null>): Promise<void> => {
    if (!panel) return;
    const q = <T extends Element>(s: string): T => panel.querySelector<T>(s) as T;
    const verdict = q<HTMLElement>('[data-eye-verdict]');
    const warn = q<HTMLElement>('[data-eye-warn]');
    const rows = q<HTMLElement>('[data-eye-rows]');
    const result = await source.catch(() => null);
    panel.hidden = false;
    if (!result) {
      verdict.textContent = G.unreadable;
      rows.replaceChildren();
      warn.hidden = true;
      eye.pupilFor(0.6, 1.5);
      return;
    }
    const f = result.fundus;
    const px = degrade(f, { exposure: 0, contrast: 1, blur: 0 });
    const c = q<HTMLCanvasElement>('[data-eye-canvas]').getContext('2d');
    if (c) {
      const img = c.createImageData(f.size, f.size);
      img.data.set(px);
      c.putImageData(img, 0, 0);
    }
    const m = measure(px, f);
    const problems = judge(m, REAL_LIMITS);
    verdict.textContent = problems.length ? `${G.verdictBad}: ${problems.map((p) => G.reasons[p]).join(', ')}` : G.verdictOk;
    const L = REAL_LIMITS;
    rows.replaceChildren(
      ...[
        [G.brightness, m.brightness.toFixed(0), m.brightness >= L.brightness[0] && m.brightness <= L.brightness[1]],
        [G.contrastCheck, m.contrast.toFixed(2), m.contrast >= L.contrast],
        [G.sharpness, m.sharpness.toFixed(2), m.sharpness >= L.sharpness],
      ].map(([name, value, ok]) => {
        const li = document.createElement('li');
        li.textContent = `${name} ${value} · ${ok ? G.pass : G.fail}`;
        if (!ok) li.className = 'fail';
        return li;
      }),
    );
    warn.hidden = result.looksLikeFundus;
    if (problems.length) {
      eye.pupilFor(0.55, 1.6);
    } else {
      eye.pupilFor(1.9, 1.4);
    }
    wake();
  };

  window.addEventListener('dragover', (e) => {
    if (!hasPayload(e)) return;
    e.preventDefault(); // keep the browser from opening the file
    pointerX = e.clientX;
    pointerY = e.clientY;
    lastInput = clock;
    const on = overEye(e.clientX, e.clientY);
    if (e.dataTransfer) e.dataTransfer.dropEffect = on ? 'copy' : 'none';
    eye.pupilFor(on ? 1.8 : 1.3, 0.25);
    wake();
  });
  window.addEventListener('drop', (e) => {
    if (!hasPayload(e)) return;
    e.preventDefault();
    if (!overEye(e.clientX, e.clientY)) return;
    const sample = e.dataTransfer?.getData(SAMPLE);
    const file = e.dataTransfer?.files[0];
    if (sample) void showResult(fundusFromUrl(sample));
    else if (file) void showResult(fundusFromFile(file));
  });

  // Tap (or click) an example photo: it flies into the eye, then gets checked.
  window.addEventListener('eye:check', (e) => {
    const { url, from } = (e as CustomEvent<{ url: string; from?: HTMLImageElement }>).detail;
    const check = (): void => void showResult(fundusFromUrl(url));
    if (!from || reduced || !eyeBody.visible) return check();
    const a = from.getBoundingClientRect();
    const ghost = from.cloneNode() as HTMLImageElement;
    Object.assign(ghost.style, {
      position: 'fixed', left: `${a.left}px`, top: `${a.top}px`, width: `${a.width}px`, height: `${a.height}px`,
      zIndex: '4', pointerEvents: 'none', borderRadius: '50%',
    });
    document.body.append(ghost);
    const dx = eyeBody.x - (a.left + a.width / 2);
    const dy = eyeBody.y - (a.top + a.height / 2);
    eye.pupilFor(1.8, 0.6);
    wake();
    ghost
      .animate([{ transform: 'none', opacity: 1 }, { transform: `translate(${dx}px, ${dy}px) scale(0.2)`, opacity: 0 }], {
        duration: 520,
        easing: 'cubic-bezier(.5,0,.2,1)',
      })
      .finished.finally(() => {
        ghost.remove();
        check();
      });
  });
  document.documentElement.dataset.eyeReady = '';
  panel?.querySelector('[data-eye-close]')?.addEventListener('click', () => {
    if (panel) panel.hidden = true;
  });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && panel && !panel.hidden) panel.hidden = true;
  });

  window.addEventListener('resize', () => {
    resize();
    if (freeMode) pickFreeSpots();
    wake();
  });
  document.addEventListener('visibilitychange', wake);
  canvas.classList.add('is-ready');
  wake();
}
