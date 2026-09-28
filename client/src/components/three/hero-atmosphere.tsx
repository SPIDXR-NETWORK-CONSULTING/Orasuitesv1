/**
 * HeroAtmosphere — bespoke WebGL layer for the homepage hero.
 *
 * A single full-screen fragment shader painting two slow-drifting warm-bronze
 * light blooms + a living film grain, composited over the hero video at low
 * alpha. It is the "caught light in the room" feel — atmosphere, never a subject.
 *
 * Loaded lazily (see hero.tsx) so it never blocks first paint. The render loop
 * runs only while the hero is on-screen and the tab is visible, and it does not
 * mount at all under prefers-reduced-motion (the video + overlays stand alone).
 *
 * Colours are the ORÁ bronze token, kept in one place here (shaders can't read
 * CSS vars); everything else on the hero stays token-driven.
 */
import * as React from "react";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import * as THREE from "three";

const BRONZE = new THREE.Color("#b98867");
const WARM = new THREE.Color("#e7c9a3");

const vertexShader = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const fragmentShader = /* glsl */ `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform vec2  uRes;
  uniform vec3  uBronze;
  uniform vec3  uWarm;

  // cheap hash noise for the grain
  float hash(vec2 p) {
    p = fract(p * vec2(123.34, 456.21));
    p += dot(p, p + 45.32);
    return fract(p.x * p.y);
  }

  // soft radial bloom
  float bloom(vec2 uv, vec2 c, float r) {
    float d = length((uv - c) * vec2(uRes.x / uRes.y, 1.0));
    return smoothstep(r, 0.0, d);
  }

  void main() {
    vec2 uv = vUv;
    float t = uTime * 0.06;

    // two drifting warm light sources
    vec2 c1 = vec2(0.28 + 0.06 * sin(t * 1.1), 0.72 + 0.05 * cos(t * 0.9));
    vec2 c2 = vec2(0.78 + 0.05 * cos(t * 0.8), 0.30 + 0.06 * sin(t * 1.3));

    float b1 = bloom(uv, c1, 0.55) * 0.55;
    float b2 = bloom(uv, c2, 0.48) * 0.40;

    vec3 col = uBronze * b1 + uWarm * b2;

    // living grain — very low, keeps the frame from looking digitally flat
    float g = hash(gl_FragCoord.xy + fract(uTime) * 137.0);
    col += (g - 0.5) * 0.05;

    // gentle edge fade so it never crowds the corners / text
    float edge = smoothstep(1.15, 0.35, length(uv - 0.5));
    float alpha = clamp((b1 + b2) * 0.9 + g * 0.02, 0.0, 1.0) * edge * 0.5;

    gl_FragColor = vec4(col, alpha);
  }
`;

function AtmospherePlane() {
  const mat = React.useRef<THREE.ShaderMaterial>(null);
  const { size, viewport } = useThree();

  const uniforms = React.useMemo(
    () => ({
      uTime: { value: 0 },
      uRes: { value: new THREE.Vector2(size.width, size.height) },
      uBronze: { value: BRONZE },
      uWarm: { value: WARM },
    }),
    // uRes is updated below; seed once
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [],
  );

  React.useEffect(() => {
    uniforms.uRes.value.set(size.width, size.height);
  }, [size.width, size.height, uniforms]);

  useFrame((state) => {
    if (mat.current) mat.current.uniforms.uTime.value = state.clock.elapsedTime;
  });

  return (
    <mesh scale={[viewport.width, viewport.height, 1]}>
      <planeGeometry args={[2, 2]} />
      <shaderMaterial
        ref={mat}
        args={[{ vertexShader, fragmentShader, uniforms, transparent: true, depthWrite: false }]}
      />
    </mesh>
  );
}

export default function HeroAtmosphere() {
  const wrap = React.useRef<HTMLDivElement>(null);
  const [running, setRunning] = React.useState(true);

  // pause the loop when the hero scrolls off-screen or the tab is hidden
  React.useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    let onScreen = true;
    const sync = () => setRunning(onScreen && !document.hidden);
    const io = new IntersectionObserver(
      ([e]) => {
        onScreen = e.isIntersecting;
        sync();
      },
      { threshold: 0 },
    );
    io.observe(el);
    document.addEventListener("visibilitychange", sync);
    return () => {
      io.disconnect();
      document.removeEventListener("visibilitychange", sync);
    };
  }, []);

  return (
    <div
      ref={wrap}
      aria-hidden
      className="pointer-events-none absolute inset-0"
      style={{ mixBlendMode: "screen" }}
    >
      <Canvas
        orthographic
        dpr={[1, 1.5]}
        frameloop={running ? "always" : "never"}
        gl={{ alpha: true, antialias: false, powerPreference: "low-power" }}
        camera={{ position: [0, 0, 1], zoom: 1 }}
      >
        <AtmospherePlane />
      </Canvas>
    </div>
  );
}
