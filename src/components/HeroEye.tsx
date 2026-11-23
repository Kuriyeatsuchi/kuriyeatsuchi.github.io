/**
 * Hero scene: noise that assembles into the eye.
 *
 * How it works, in plain English:
 * - About 2,800 points each have two homes: a drifting spot in a noise cloud, and a spot on
 *   the eye (white of the eye, iris rings, a few vessels). A shader moves every point
 *   between its two homes by one number, `uP`, from 0 (noise) to 1 (eye).
 * - Holding the button, the scene, or Space raises `uP`; letting go lowers it. When it
 *   reaches 1 the eye stays formed until the visitor scatters it again.
 * - Once formed, the eye turns toward the cursor, and the pupil widens while the pointer
 *   is over "View work" (the iris points are placed in the shader, so the pupil can change size).
 * - The render loop stops when the hero is off screen or the tab is hidden.
 *   With reduced motion the eye is shown already formed and nothing moves.
 */

import { Canvas, useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';

interface Labels {
  hold: string;
  scatter: string;
  hint: string;
}

interface Shared {
  p: number;
  holding: boolean;
  locked: boolean;
  look: THREE.Vector2;
  lookTarget: THREE.Vector2;
  pupil: number;
  pupilTarget: number;
  reduced: boolean;
  onLock: () => void;
}

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

const R = 1.25;
const IRIS = 0.42;

/** Kind: 0 = white of the eye, 1 = iris (placed in the shader), 2 = vessel. */
function buildGeometry(): THREE.BufferGeometry {
  const r = rng(7);
  const noise: number[] = [];
  const eye: number[] = [];
  const iris: number[] = [];
  const kind: number[] = [];
  const delay: number[] = [];
  const add = (x: number, y: number, z: number, k: number, it = 0, ir = 0): void => {
    noise.push((r() - 0.5) * 7, (r() - 0.5) * 4.2, (r() - 0.5) * 3);
    eye.push(x, y, z);
    iris.push(it, ir);
    kind.push(k);
    delay.push(r() * 0.3);
  };

  // White of the eye: a Fibonacci sphere, minus the cap where the iris sits (facing +z).
  const n = 1900;
  const golden = Math.PI * (3 - Math.sqrt(5));
  for (let i = 0; i < n; i++) {
    const y = 1 - ((i + 0.5) / n) * 2;
    const rr = Math.sqrt(1 - y * y);
    const x = Math.cos(i * golden) * rr;
    const z = Math.sin(i * golden) * rr;
    if (Math.acos(z) < IRIS + 0.04) continue;
    add(x * R, y * R, z * R, 0);
  }
  // Iris: rings from the pupil edge (t = 0) to the iris edge (t = 1), denser at the edges.
  for (let i = 0; i < 900; i++) {
    const t = i < 160 ? 0 : i < 320 ? 1 : r() ** 0.8;
    add(0, 0, R, 1, r() * Math.PI * 2, t);
  }
  // A few vessels on the white of the eye, curving in from the sides toward the iris.
  for (let v = 0; v < 6; v++) {
    const theta0 = (v / 6) * Math.PI * 2 + 0.4;
    for (let s = 0; s < 40; s++) {
      const u = s / 39;
      const alpha = 1.35 - u * 0.8;
      const theta = theta0 + Math.sin(u * 3 + v) * 0.18;
      add(R * Math.sin(alpha) * Math.cos(theta), R * Math.sin(alpha) * Math.sin(theta), R * Math.cos(alpha), 2);
    }
  }

  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(eye, 3));
  g.setAttribute('aNoise', new THREE.Float32BufferAttribute(noise, 3));
  g.setAttribute('aIris', new THREE.Float32BufferAttribute(iris, 2));
  g.setAttribute('aKind', new THREE.Float32BufferAttribute(kind, 1));
  g.setAttribute('aDelay', new THREE.Float32BufferAttribute(delay, 1));
  return g;
}

const vertexShader = /* glsl */ `
  uniform float uP;
  uniform float uTime;
  uniform float uPupil;
  uniform vec2 uLook;
  uniform float uSize;
  attribute vec3 aNoise;
  attribute vec2 aIris;
  attribute float aKind;
  attribute float aDelay;
  varying float vShade;
  varying float vKind;

  mat3 rotY(float a) { float c = cos(a), s = sin(a); return mat3(c, 0., -s, 0., 1., 0., s, 0., c); }
  mat3 rotX(float a) { float c = cos(a), s = sin(a); return mat3(1., 0., 0., 0., c, s, 0., -s, c); }

  void main() {
    float t = clamp((uP - aDelay) / 0.7, 0., 1.);
    t = t * t * (3. - 2. * t);

    vec3 drift = aNoise + 0.18 * vec3(
      sin(uTime * 0.31 + aDelay * 41.),
      cos(uTime * 0.27 + aDelay * 29.),
      sin(uTime * 0.23 + aDelay * 17.));

    vec3 eye = position;
    if (aKind > 0.5 && aKind < 1.5) {
      float a = mix(0.13 * uPupil, ${IRIS.toFixed(2)}, aIris.y);
      eye = ${R.toFixed(2)} * vec3(sin(a) * cos(aIris.x), sin(a) * sin(aIris.x), cos(a));
    }
    eye = rotY(uLook.x) * rotX(uLook.y) * eye;

    vec3 pos = mix(drift, eye, t);
    vec4 mv = modelViewMatrix * vec4(pos, 1.);
    gl_Position = projectionMatrix * mv;

    float facing = clamp(0.5 + 0.5 * (eye.z / ${R.toFixed(2)}), 0., 1.);
    float bright = aKind > 0.5 && aKind < 1.5 ? 1. : (aKind > 1.5 ? 0.55 : 0.42);
    vShade = mix(0.28, bright * mix(0.35, 1., facing), t);
    vKind = aKind * step(0.5, t);
    gl_PointSize = uSize * (1. + 0.5 * t * step(0.5, aKind) * step(aKind, 1.5)) / -mv.z;
  }
`;

const fragmentShader = /* glsl */ `
  uniform vec3 uDim;
  uniform vec3 uBright;
  uniform vec3 uVessel;
  varying float vShade;
  varying float vKind;
  void main() {
    vec2 c = gl_PointCoord - 0.5;
    if (dot(c, c) > 0.25) discard;
    vec3 col = mix(uDim, uBright, vShade);
    if (vKind > 1.5) col = mix(col, uVessel, 0.55);
    gl_FragColor = vec4(col, 1.);
  }
`;

function Eye({ shared }: { shared: Shared }) {
  const geometry = useMemo(buildGeometry, []);
  const uniforms = useMemo(
    () => ({
      uP: { value: shared.p },
      uTime: { value: 0 },
      uPupil: { value: 1 },
      uLook: { value: new THREE.Vector2() },
      uSize: { value: 14 },
      uDim: { value: new THREE.Color('#0B0D12') },
      uBright: { value: new THREE.Color('#E8E6E1') },
      uVessel: { value: new THREE.Color('#5CC8FF') },
    }),
    [shared],
  );

  useFrame((state, dt) => {
    const s = shared;
    const step = Math.min(dt, 0.05);
    if (!s.locked) {
      s.p = s.holding ? Math.min(1, s.p + step / 1.3) : Math.max(0, s.p - step / 0.7);
      if (s.p >= 1) {
        s.locked = true;
        s.holding = false;
        s.onLock();
      }
    }
    s.look.lerp(s.lookTarget, Math.min(1, step * 5));
    s.pupil += (s.pupilTarget - s.pupil) * Math.min(1, step * 6);
    uniforms.uP.value = s.p;
    uniforms.uTime.value = s.reduced ? 0 : state.clock.elapsedTime;
    uniforms.uPupil.value = s.pupil;
    uniforms.uLook.value.copy(s.look).multiplyScalar(s.p);
    uniforms.uSize.value = 14 * state.gl.getPixelRatio();
  });

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} uniforms={uniforms} />
    </points>
  );
}

export default function HeroEye({ labels }: { labels: Labels }) {
  const reduced = useMemo(
    () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
    [],
  );
  const [locked, setLocked] = useState(reduced);
  const [running, setRunning] = useState(true);
  const wrap = useRef<HTMLDivElement>(null);
  const shared = useMemo<Shared>(
    () => ({
      p: reduced ? 1 : 0,
      holding: false,
      locked: reduced,
      look: new THREE.Vector2(),
      lookTarget: new THREE.Vector2(),
      pupil: 1,
      pupilTarget: 1,
      reduced,
      onLock: () => setLocked(true),
    }),
    [reduced],
  );

  // Pause when the hero is off screen or the tab is hidden.
  useEffect(() => {
    const el = wrap.current;
    if (!el || reduced) return;
    let visible = true;
    const update = (): void => setRunning(visible && document.visibilityState === 'visible');
    const io = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      update();
    });
    io.observe(el);
    document.addEventListener('visibilitychange', update);
    return () => {
      io.disconnect();
      document.removeEventListener('visibilitychange', update);
    };
  }, [reduced]);

  // Follow the cursor; widen the pupil over "View work"; release a hold anywhere.
  useEffect(() => {
    if (reduced) return;
    const move = (e: PointerEvent): void => {
      shared.lookTarget.set(((e.clientX / window.innerWidth) * 2 - 1) * 0.55, ((e.clientY / window.innerHeight) * 2 - 1) * 0.4);
    };
    const release = (): void => {
      shared.holding = false;
    };
    const cta = document.getElementById('view-work');
    const dilate = (): void => {
      shared.pupilTarget = 1.7;
    };
    const relax = (): void => {
      shared.pupilTarget = 1;
    };
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', release);
    window.addEventListener('blur', release);
    cta?.addEventListener('pointerenter', dilate);
    cta?.addEventListener('pointerleave', relax);
    cta?.addEventListener('focus', dilate);
    cta?.addEventListener('blur', relax);
    return () => {
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', release);
      window.removeEventListener('blur', release);
      cta?.removeEventListener('pointerenter', dilate);
      cta?.removeEventListener('pointerleave', relax);
      cta?.removeEventListener('focus', dilate);
      cta?.removeEventListener('blur', relax);
    };
  }, [reduced, shared]);

  const startHold = (): void => {
    if (!shared.locked) shared.holding = true;
  };
  const stopHold = (): void => {
    shared.holding = false;
  };
  const scatter = (): void => {
    shared.locked = false;
    shared.holding = false;
    setLocked(false);
  };

  return (
    <div className="hero-eye" ref={wrap}>
      <div
        className="hero-eye__stage"
        aria-hidden="true"
        onPointerDown={(e) => {
          if (e.button === 0) startHold();
        }}
        onPointerUp={stopHold}
        onPointerCancel={stopHold}
        onContextMenu={(e) => e.preventDefault()}
      >
        <Canvas
          dpr={[1, 1.5]}
          frameloop={reduced ? 'demand' : running ? 'always' : 'never'}
          camera={{ position: [0, 0, 5.2], fov: 45 }}
          gl={{ antialias: false, alpha: true, powerPreference: 'low-power' }}
        >
          <Eye shared={shared} />
        </Canvas>
      </div>
      {!reduced && (
        <div className="hero-eye__controls">
          {locked ? (
            <button type="button" className="hero-eye__btn" onClick={scatter}>
              {labels.scatter}
            </button>
          ) : (
            <button
              type="button"
              className="hero-eye__btn"
              aria-describedby="hero-eye-hint"
              onPointerDown={(e) => {
                if (e.button === 0) startHold();
              }}
              onPointerUp={stopHold}
              onPointerCancel={stopHold}
              onKeyDown={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  startHold();
                }
              }}
              onKeyUp={(e) => {
                if (e.key === ' ' || e.key === 'Enter') {
                  e.preventDefault();
                  stopHold();
                }
              }}
              onContextMenu={(e) => e.preventDefault()}
            >
              {labels.hold}
            </button>
          )}
          <p id="hero-eye-hint" className="hero-eye__hint">
            {labels.hint}
          </p>
        </div>
      )}
    </div>
  );
}
