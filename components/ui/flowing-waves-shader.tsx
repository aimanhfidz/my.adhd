/* The landing page's wave field, as a React component.
   Kept in step with waves.js, which is what actually runs on my.adhd today —
   the site is static HTML with no bundler, so nothing imports this yet. It is
   here for the day that changes, and it is only useful if it stays honest, so
   the fragment shader below is the shipped one — the same GLSL statement for
   statement, checked by stripping the comments from both and comparing. The
   vertex shader is the one part that cannot match: waves.js draws a single
   full-screen triangle and computes uv from its own attribute, where three.js
   hands a plane's uv and position over ready-made.

   What it is: a full-screen fragment shader over a 2x2 plane. It computes a
   single scalar intensity and maps it through one three-stop ramp per theme —
   ground, brand, highlight — cross-fading between the two ramps to turn the
   field over. The page's own surface is stop one, so the field comes out of
   the page rather than sitting on it.

   Why it is not the version this started as: that one divided a colour by
   abs(sin(...)) and handled light by flipping the result with 1.0 - colour.
   On grey that is a value inversion; on a hue it is the complement, and the
   complement of a brand blue is orange. The ramp keeps the hue and moves only
   the value.

   Two numbers in here were settled by measurement, not taste, and both have a
   comment at the point of use: the pow(v, 1.6) that keeps the bulk of the
   field on its ground, and the fact that it has to run before the centre dim
   rather than after. Change either and re-measure contrast before shipping.

   The ramps also sit deliberately close to their grounds — night in the deep
   end, day in the pale — because the reader scrim over the copy moves
   brightness, and a field that swings far from its ground leaves a visible
   hole where the scrim erases it. That scrim is CSS on the real site
   (.hero-waves::after), which is also why disableCenterDimming defaults to
   true here: the shader's own dim is a circle struck from the middle of the
   viewport, and running it alongside a tuned ellipse drew two edges. */
import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface WaveRamp {
  /** Stop one. The page's own surface, so the field emerges from it. */
  ground: string;
  mid: string;
  hi: string;
}

export interface InteractiveWaveShaderProps {
  hasActiveReminders?: boolean;
  hasUpcomingReminders?: boolean;
  /** Defaults to true — see the note at the top on why. */
  disableCenterDimming?: boolean;
  /** Omit to follow <html data-theme>, then prefers-color-scheme. */
  theme?: "light" | "dark";
  ink?: WaveRamp;
  paper?: WaveRamp;
  className?: string;
}

/* my.adhd's brand, mirroring the --wave-* tokens in landing.css. Vivid Orange
   is not among them on purpose: theme.css reserves it for the logo mark. */
const INK: WaveRamp = { ground: "#101018", mid: "#3529BF", hi: "#4737FF" };
const PAPER: WaveRamp = { ground: "#FFFFFF", mid: "#E9E7FB", hi: "#D1CDFF" };

/* The two reminder states this component arrived with. Nothing sets them on
   the landing page. Note that the paper pair here predates the move of day's
   ramp into the pale register — if these are ever switched on over small
   text, they need the same treatment, and a contrast pass with them. */
const STATES = {
  active: { mid: "#3E7BFF", hi: "#A9C6FF", paperMid: "#C6D8FF", paperHi: "#1C3AA8" },
  upcoming: { mid: "#2FB86B", hi: "#9BE8BE", paperMid: "#BFEBD3", paperHi: "#12603A" },
} as const;

const VERTEX = `
  varying vec2 vTextureCoord;
  void main() {
    vTextureCoord = uv;
    gl_Position = vec4(position, 1.0);
  }
`;

const FRAGMENT = `
  precision mediump float;
  uniform vec2 iResolution;
  uniform float iTime;
  uniform bool disableCenterDimming;
  uniform float invert;
  uniform vec3 inkGround, inkMid, inkHi;
  uniform vec3 paperGround, paperMid, paperHi;
  varying vec2 vTextureCoord;

  vec3 ramp(float v, vec3 g, vec3 m, vec3 h) {
    return v < 0.5 ? mix(g, m, v * 2.0) : mix(m, h, (v - 0.5) * 2.0);
  }

  void main() {
    vec2 fragCoord = vTextureCoord * iResolution;
    vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

    vec2 center = iResolution.xy * 0.5;
    float dist = distance(fragCoord, center);
    float radius = min(iResolution.x, iResolution.y) * 0.5;

    float centerDim = disableCenterDimming ? 1.0 : smoothstep(radius * 0.3, radius * 0.5, dist);

    for (float i = 1.0; i < 10.0; i++) {
      uv.x += 0.6 / i * cos(i * 2.5 * uv.y + iTime);
      uv.y += 0.6 / i * cos(i * 1.5 * uv.x + iTime);
    }

    /* The original's numerator, kept as a scalar. It runs away wherever the
       sine passes zero — that overshoot is the filament, and clamping it here
       is what the framebuffer used to do on its own. */
    float v = clamp(0.1 / abs(sin(iTime - uv.y - uv.x)), 0.0, 1.0);

    /* The intensity never falls below 0.1 — 0.1/abs(sin) bottoms out where the
       sine is at full height — and two thirds of the screen sits under 0.2.
       Run straight into a linear ramp that puts most of the page 40% of the
       way to full brand, which lifts the whole field and hands the reader
       scrim a bright surround to be an oval against. The curve pushes that
       bulk back down onto the ground and leaves the colour in the filaments. */
    v = pow(v, 1.6);

    /* Shapes the field first, attenuates second. The other way round the curve
       compounds the dim — 0.3 becomes 0.3^1.6, near enough half again — and
       the centre pulls away from its surround hard enough to draw a ring. */
    if (!disableCenterDimming) v = mix(v * 0.3, v, centerDim);

    gl_FragColor = vec4(mix(ramp(v, inkGround, inkMid, inkHi),
                            ramp(v, paperGround, paperMid, paperHi), invert), 1.0);
  }
`;

/* Every use of iTime is a plain `+ iTime` inside a sin or a cos, so the field
   is 2*PI-periodic and the wrap is the same frame. It is not decoration: the
   shader is mediump, and by t=1000 the gap between representable values is
   about 1.0 — a page left open a quarter of an hour would quantise and stop. */
const LOOP = Math.PI * 2;

/* Held rather than run when the reader has asked for less movement. t=0 is not
   that frame: sin(-uv.y - uv.x) goes to zero through the middle of the screen
   and the division puts a cross behind whatever sits there. */
const STILL_FRAME = 2.4;

const InteractiveWaveShader = ({
  hasActiveReminders = false,
  hasUpcomingReminders = false,
  disableCenterDimming = true,
  theme,
  ink = INK,
  paper = PAPER,
  className,
}: InteractiveWaveShaderProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const invertToRef = useRef(0);

  /* Read once per change rather than per frame. */
  const resolvedTheme = (): "light" | "dark" => {
    if (theme) return theme;
    if (typeof document !== "undefined") {
      const stamped = document.documentElement.dataset.theme;
      if (stamped === "light" || stamped === "dark") return stamped;
    }
    if (typeof window !== "undefined" && window.matchMedia) {
      return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    }
    return "light";
  };

  useEffect(() => {
    const m = materialRef.current;
    if (m) m.uniforms.disableCenterDimming.value = disableCenterDimming;
  }, [disableCenterDimming]);

  /* The reminder states pick different mid and hi stops; the grounds never
     move, because the ground is the page and the page has not changed. */
  useEffect(() => {
    const m = materialRef.current;
    if (!m) return;
    const s = hasActiveReminders ? STATES.active : hasUpcomingReminders ? STATES.upcoming : null;
    m.uniforms.inkGround.value.set(ink.ground);
    m.uniforms.paperGround.value.set(paper.ground);
    m.uniforms.inkMid.value.set(s ? s.mid : ink.mid);
    m.uniforms.inkHi.value.set(s ? s.hi : ink.hi);
    m.uniforms.paperMid.value.set(s ? s.paperMid : paper.mid);
    m.uniforms.paperHi.value.set(s ? s.paperHi : paper.hi);
  }, [hasActiveReminders, hasUpcomingReminders, ink, paper]);

  useEffect(() => {
    invertToRef.current = resolvedTheme() === "dark" ? 0 : 1;
    const m = materialRef.current;
    /* Snap rather than ease when the reader has asked for stillness — there is
       no loop running to ease it. */
    if (m && window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      m.uniforms.invert.value = invertToRef.current;
    }
  }, [theme]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
      /* Capped: this is a full-screen fragment shader with nine turns of a loop
         per pixel, and a phone's third multiplier costs 2.25x for a difference
         nobody can see through the scrim. */
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
      container.appendChild(renderer.domElement);
    } catch (err) {
      /* No WebGL is not a failure worth announcing. The page it sits behind has
         its own background and looks finished without this. */
      console.error("waves: WebGL unavailable", err);
      return;
    }

    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const clock = new THREE.Clock();

    const startInvert = resolvedTheme() === "dark" ? 0 : 1;
    invertToRef.current = startInvert;

    const uniforms = {
      iTime: { value: STILL_FRAME },
      iResolution: { value: new THREE.Vector2() },
      invert: { value: startInvert },
      disableCenterDimming: { value: disableCenterDimming },
      inkGround: { value: new THREE.Color(ink.ground) },
      inkMid: { value: new THREE.Color(ink.mid) },
      inkHi: { value: new THREE.Color(ink.hi) },
      paperGround: { value: new THREE.Color(paper.ground) },
      paperMid: { value: new THREE.Color(paper.mid) },
      paperHi: { value: new THREE.Color(paper.hi) },
    };

    const material = new THREE.ShaderMaterial({
      vertexShader: VERTEX,
      fragmentShader: FRAGMENT,
      uniforms,
    });
    materialRef.current = material;

    const geometry = new THREE.PlaneGeometry(2, 2);
    scene.add(new THREE.Mesh(geometry, material));

    /* iResolution stays in CSS pixels: the shader reasons about the viewport,
       and the device ratio only decides how finely it is sampled. */
    const resize = () => {
      const w = container.clientWidth;
      const h = container.clientHeight;
      if (!w || !h) return;
      renderer.setSize(w, h);
      uniforms.iResolution.value.set(w, h);
    };

    /* An observer on the box, not a window listener: a 100dvh hero moves on its
       own as a phone's URL bar slides away. */
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(container);
    else window.addEventListener("resize", resize);
    resize();

    const stillness = window.matchMedia("(prefers-reduced-motion: reduce)");

    const render = () => {
      uniforms.iTime.value = (stillness.matches ? STILL_FRAME : clock.getElapsedTime()) % LOOP;

      /* ~0.35s to turn the field over, framerate-independently. */
      const to = invertToRef.current;
      const at = uniforms.invert.value as number;
      if (at !== to) {
        const step = 1 / 0.35 / 60;
        uniforms.invert.value =
          Math.abs(to - at) <= step ? to : at + Math.sign(to - at) * step;
      }
      renderer.render(scene, camera);
    };

    /* Painted once before any frame is asked for, so the field is never an
       empty canvas — and so the held frame is there at all when the reader has
       asked for stillness. */
    render();
    if (!stillness.matches) renderer.setAnimationLoop(render);

    /* Nothing behind a hidden tab is worth a GPU. */
    const onVisibility = () => {
      if (document.hidden) renderer.setAnimationLoop(null);
      else if (!stillness.matches) renderer.setAnimationLoop(render);
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onStillness = () => {
      if (stillness.matches) {
        renderer.setAnimationLoop(null);
        uniforms.invert.value = invertToRef.current;
        render();
      } else {
        renderer.setAnimationLoop(render);
      }
    };
    stillness.addEventListener?.("change", onStillness);

    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stillness.removeEventListener?.("change", onStillness);
      if (ro) ro.disconnect();
      else window.removeEventListener("resize", resize);
      renderer.setAnimationLoop(null);
      renderer.domElement.parentNode?.removeChild(renderer.domElement);
      material.dispose();
      geometry.dispose();
      renderer.dispose();
      materialRef.current = null;
    };
    // Mounted once; the effects above carry later prop changes into the uniforms.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      ref={containerRef}
      className={className}
      style={{ position: "absolute", inset: 0, overflow: "hidden", pointerEvents: "none" }}
      aria-hidden="true"
    />
  );
};

export default InteractiveWaveShader;
