/**
 * One WebGL canvas fixed behind the home page that places the three project objects.
 *
 * How it works, in plain English:
 * - The camera is set so that one unit in the 3D scene equals one CSS pixel on the plane
 *   z = 0. That lets the scene put an object exactly over any empty HTML element ("slot").
 * - Each object has two slots: one beside the name in the hero, and one in its row in the
 *   project list. Every frame the scene reads both slots' positions on screen. While the
 *   row scrolls up from the bottom of the window, the object slides from its hero slot to
 *   its row slot; after that it rides along with the row. Scrolling stays completely
 *   normal: the page is never moved by script.
 * - The eye turns toward the cursor. Hovering (or focusing) a project row triggers that
 *   object's reaction.
 * - Below 768px only the eye is shown. With reduced motion nothing turns on its own; the
 *   scene redraws only when the page scrolls or resizes. Drawing stops while the tab is
 *   hidden or no slot is on screen.
 */

import { PerspectiveCamera, Scene, WebGLRenderer } from 'three';
import { makeBars, makeEye, makeTrend, type SceneObject } from './objects';

type Key = 'mizan' | 'retina' | 'hcgcc';
const KEYS: readonly Key[] = ['mizan', 'retina', 'hcgcc'];
const FOV = 30;

const smooth = (x: number): number => {
  const t = Math.min(1, Math.max(0, x));
  return t * t * (3 - 2 * t);
};

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
  const objects: Record<Key, SceneObject> = { mizan: makeTrend(pointSize), retina: eye, hcgcc: makeBars(pointSize) };
  for (const k of KEYS) scene.add(objects[k].group);

  const slot = (name: string): HTMLElement | null => document.querySelector<HTMLElement>(`[data-slot="${name}"]`);
  const slots = KEYS.map((k) => ({ key: k, hero: slot(`hero-${k}`), row: slot(`row-${k}`) }));

  let w = 0;
  let h = 0;
  const resize = (): void => {
    w = window.innerWidth;
    h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.position.set(0, 0, h / 2 / Math.tan((FOV * Math.PI) / 360));
    camera.near = 1;
    camera.far = camera.position.z * 4;
    camera.updateProjectionMatrix();
  };
  resize();

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

  let pointerX = w / 2;
  let pointerY = h / 2;
  window.addEventListener(
    'pointermove',
    (e) => {
      if (e.pointerType !== 'mouse') return;
      pointerX = e.clientX;
      pointerY = e.clientY;
      wake();
    },
    { passive: true },
  );

  let last = 0;
  let time = 0;
  let raf = 0;

  /** Place every object; returns true if any is on screen. */
  const place = (): boolean => {
    const narrow = w < 768;
    let anyVisible = false;
    for (const s of slots) {
      const g = objects[s.key].group;
      const hr = s.hero?.getBoundingClientRect();
      const rr = s.row?.getBoundingClientRect();
      const heroOk = !!hr && hr.width > 0;
      const rowOk = !!rr && rr.width > 0;
      if ((narrow && s.key !== 'retina') || (!heroOk && !rowOk)) {
        g.visible = false;
        continue;
      }
      // 0 while the row is below the window, 1 once its slot is in the lower 55% of it.
      const t = rowOk && heroOk ? smooth((h - (rr as DOMRect).top) / (h * 0.55)) : rowOk ? 1 : 0;
      const a = (heroOk ? hr : rr) as DOMRect;
      const b = (rowOk ? rr : hr) as DOMRect;
      const cx = a.left + a.width / 2 + (b.left + b.width / 2 - (a.left + a.width / 2)) * t;
      const cy = a.top + a.height / 2 + (b.top + b.height / 2 - (a.top + a.height / 2)) * t;
      const size = Math.min(a.width, a.height) + (Math.min(b.width, b.height) - Math.min(a.width, a.height)) * t;
      const radius = (size / 2) * 0.82;
      g.position.set(cx - w / 2, h / 2 - cy, 0);
      g.scale.setScalar(radius);
      g.visible = cy + radius > -40 && cy - radius < h + 40;
      anyVisible ||= g.visible;
      if (s.key === 'retina') {
        const dx = (pointerX - cx) / Math.max(200, w * 0.4);
        const dy = (pointerY - cy) / Math.max(200, h * 0.5);
        eye.look(Math.max(-0.7, Math.min(0.7, dx)), Math.max(-0.5, Math.min(0.5, dy)));
      }
    }
    return anyVisible;
  };

  const frame = (now: number): void => {
    raf = 0;
    const dt = last ? Math.min(0.05, (now - last) / 1000) : 0.016;
    last = now;
    if (!reduced) time += dt;
    const visible = place();
    for (const k of KEYS) objects[k].update(reduced ? 1 : dt, time, hovered === k);
    renderer.render(scene, camera);
    // Keep animating only while something is on screen and motion is allowed.
    if (visible && !reduced && document.visibilityState === 'visible') raf = requestAnimationFrame(frame);
  };

  function wake(): void {
    if (!raf) {
      last = 0;
      raf = requestAnimationFrame(frame);
    }
  }

  window.addEventListener('scroll', wake, { passive: true });
  window.addEventListener('resize', () => {
    resize();
    wake();
  });
  document.addEventListener('visibilitychange', wake);
  canvas.classList.add('is-ready');
  wake();
}
