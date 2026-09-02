/* The landing page's wave field, as a React component.
   Kept in step with waves.js, which is what actually runs on my.adhd today —
   the site is static HTML with no bundler, so nothing imports this yet. It is
   here for the day that changes, and it is only useful if it stays honest, so
   the fragment shader below is the shipped one — the same GLSL statement for
   statement, lifted out of waves.js mechanically rather than retyped, and
   checked by stripping the comments from both and comparing token streams.
   The vertex shader is the one part that cannot match: waves.js draws a
   single full-screen triangle and computes uv from its own attribute, where
   three.js hands a plane's uv and position over ready-made.

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

   ---------- what changed, and why this file was wrong ----------
   This component sat on the ORIGINAL single-field shader long after the
   shipped one had grown past it: eight literals spread through the GLSL had
   become uniforms, and one field had become four. Anything reading this to
   learn what my.adhd draws would have learnt the wrong thing, which is the
   only real failure mode a reference file has. It now carries:

     - the seven shape uniforms (layers, warp, freqX, freqY, bands, sharp,
       gamma) and the `pattern` branch, so all four forms are here;
     - PRESETS, the numbers each form is tuned to. `flow` is the original's
       literals to the last decimal, so the default renders exactly the field
       this component always did;
     - `speed`, which deliberately never reaches the GPU — see the note on
       the clock below.

   The other half of the drift is structural rather than visual. waves.js is
   now a mount(host, opts) factory rather than a single bound field, because
   the landing page runs five of them: one behind the hero and one behind
   each screen of the argument. A React component is already that — mounting
   it twice gives two independent fields — so the shape carries over with no
   extra API. What it does need is the props to tell them apart, which is
   what `pattern` and the knob overrides are for.

   Two numbers in here were settled by measurement, not taste, and both have a
   comment at the point of use: the pow(v, gamma) that keeps the bulk of the
   field on its ground, and the fact that it has to run before the centre dim
   rather than after. Change either and re-measure contrast before shipping.

   The ramps also sit deliberately close to their grounds — night in the deep
   end, day in the pale — because the reader scrim over the copy moves
   brightness, and a field that swings far from its ground leaves a visible
   hole where the scrim erases it. That scrim is CSS on the real site
   (.hero-waves::after and .panel-wave::after), which is also why
   disableCenterDimming defaults to true here: the shader's own dim is a
   circle struck from the middle of the viewport, and running it alongside a
   tuned ellipse drew two edges. */
import { useEffect, useRef } from "react";
import * as THREE from "three";

export interface WaveRamp {
  /** Stop one. The page's own surface, so the field emerges from it. */
  ground: string;
  mid: string;
  hi: string;
}

/* The four forms, in the order the shader branches on them — the index IS
   the `pattern` uniform, so this order is load-bearing.

     flow    the original. A diagonal running through space that has been
             kneaded by its own harmonics: marbling, filaments, no grain to
             it in either axis.
     swell   ordered horizontal ridges, each a travelling sum of sines, with
             a slow cross-swell so the stack is not one profile extruded
             sideways. The calm one, quietest in the middle of the screen.
     ripple  rings leaving the centre, their radius pushed about by a few
             angular harmonics so they arrive as weather rather than as a
             target. Watch this one against a centred reader scrim: rings
             and an ellipse can end up agreeing.
     silk    two crossed sets of crests, multiplied. A woven net, and the
             only one of the four with a mesh you can read as a mesh — fewer
             bands and more warp is where it stops looking like a grid. */
export const WAVE_PATTERNS = ["flow", "swell", "ripple", "silk"] as const;
export type WavePattern = (typeof WAVE_PATTERNS)[number];

/** The seven that shape the field, plus the one that never reaches the GPU. */
export interface WaveKnobs {
  /** How many harmonics of the loop get folded in. */
  layers: number;
  /** How far each harmonic pushes the space around. */
  warp: number;
  /** First axis's wavelength — x, or in ripple the angle (whole petals). */
  freqX: number;
  /** Second axis's — y, or in ripple the spiral. */
  freqY: number;
  /** How many crests the field is cut into. */
  bands: number;
  /** The filament's thickness: the numerator over |d|. */
  sharp: number;
  /** How hard the bulk of the page is pushed back to the ground. */
  gamma: number;
  /** Phase advance per second. Accumulated on the CPU — see the clock note. */
  speed: number;
}

/* A form arrives with its own numbers, because the same eight that make flow
   read as marbling make ripple read as a dartboard. flow's row is the
   original's literals to the last decimal, and it is the default, so a bare
   <InteractiveWaveShader /> paints exactly what this file always painted.
   `bands` is the one number the original did not have: at 1.0 it is the
   plain uv.y + uv.x it used to add up. */
export const WAVE_PRESETS: Record<WavePattern, WaveKnobs> = {
  flow:   { layers: 9, warp: 0.60, freqX: 2.5, freqY: 1.5, bands: 1.0, sharp: 0.10, gamma: 1.6, speed: 1.0 },
  swell:  { layers: 4, warp: 0.28, freqX: 2.0, freqY: 1.2, bands: 6.0, sharp: 0.09, gamma: 1.5, speed: 0.8 },
  ripple: { layers: 3, warp: 0.16, freqX: 3.0, freqY: 0.8, bands: 9.0, sharp: 0.09, gamma: 1.6, speed: 0.9 },
  silk:   { layers: 2, warp: 0.20, freqX: 2.0, freqY: 1.4, bands: 5.0, sharp: 0.05, gamma: 1.7, speed: 0.7 },
};

export interface InteractiveWaveShaderProps extends Partial<WaveKnobs> {
  hasActiveReminders?: boolean;
  hasUpcomingReminders?: boolean;
  /** Defaults to true — see the note at the top on why. */
  disableCenterDimming?: boolean;
  /** Which of the four forms. Its preset supplies any knob not passed. */
  pattern?: WavePattern;
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

/* Lifted from waves.js unchanged. Every branch computes a single scalar `d`
   that passes through zero along the crest of each filament, and everything
   after it — the overshoot at the crossing, the curve, the centre dim, the
   two ramps — is shared. That is what makes a new form cheap: a dozen lines
   of GLSL, not a second shader and a second canvas.

   Three things in here are not obvious:

   The loop bound is a constant because ES 2.0 insists on one; `layers` is a
   uniform, so the loop leaves early instead of running a variable count.

   In ripple the angular multiple is rounded, because a harmonic that is not
   a whole number of turns does not close on itself: atan jumps from PI to
   -PI along the negative x axis and any fraction leaves a hard seam running
   out of the centre to the left edge. What freqX counts there is petals, and
   half a petal is not a thing — which is why that slider looks like it
   sticks. Its warp also fades in over the first two thirds of the radius,
   because every angular harmonic meets itself at r = 0 and the pinch that
   leaves is a starburst behind the copy.

   The floor under |d| is not the clamp's job: it keeps a `sharp` of zero
   from asking for 0/0 and painting NaN across the field. */
const FRAGMENT = `
  precision mediump float;
  uniform vec2 iResolution;
  uniform float iTime;
  uniform bool disableCenterDimming;
  uniform float invert;
  uniform vec3 inkGround, inkMid, inkHi;
  uniform vec3 paperGround, paperMid, paperHi;
  uniform int pattern;
  uniform float layers, warp, freqX, freqY, bands, sharp, gamma;
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

    float t = iTime;
    float d = 0.0;

    if (pattern == 0) {
      for (float i = 1.0; i < 10.0; i++) {
        if (i > layers) break;
        uv.x += warp / i * cos(i * freqX * uv.y + t);
        uv.y += warp / i * cos(i * freqY * uv.x + t);
      }
      d = sin(t - (uv.y + uv.x) * bands);
    } else if (pattern == 1) {
      float h = 0.0;
      for (float i = 1.0; i < 10.0; i++) {
        if (i > layers) break;
        h += warp / i * sin(i * freqX * uv.x + t);
        h += warp / i * sin(i * freqY * uv.y - t) * 0.35;
      }
      d = sin((uv.y + h) * bands);
    } else if (pattern == 2) {
      float r = length(uv);
      float a = atan(uv.y, uv.x);
      float w = 0.0;
      float k = max(1.0, floor(freqX + 0.5));
      for (float i = 1.0; i < 10.0; i++) {
        if (i > layers) break;
        w += warp / i * cos(i * k * a + i * freqY * r + t);
      }
      d = sin((r + w * smoothstep(0.0, 0.66, r)) * bands - t);
    } else {
      vec2 p = uv;
      for (float i = 1.0; i < 10.0; i++) {
        if (i > layers) break;
        p.x += warp / i * sin(i * freqY * p.y + t);
        p.y += warp / i * sin(i * freqX * p.x - t);
      }
      d = sin(p.x * bands + t) * sin(p.y * bands - t);
    }

    float v = clamp(sharp / max(abs(d), 1e-4), 0.0, 1.0);
    v = pow(v, gamma);
    if (!disableCenterDimming) v = mix(v * 0.3, v, centerDim);

    gl_FragColor = vec4(mix(ramp(v, inkGround, inkMid, inkHi),
                            ramp(v, paperGround, paperMid, paperHi), invert), 1.0);
  }
`;

/* Every appearance of t in the shader is a plain + or - t inside a sin or a
   cos, and every coefficient on it is a whole number, so the field is
   2*PI-periodic in it and the clock can be wrapped there with no visible
   seam — it is the same frame. It is not decoration: the shader is mediump,
   and by t=1000 the gap between representable values is about 1.0, so a page
   left open a quarter of an hour would quantise and then stop moving.

   It is also why `speed` is not a uniform and the phase is accumulated here
   rather than read off a clock. A shader that multiplied iTime by 0.8 would
   take the wrap with it, and 2*PI * 0.8 is not a whole turn of anything —
   the field would jump every few seconds. Scaling the step before the wrap
   keeps the seam where the sines put it. */
const LOOP = Math.PI * 2;

/* Held rather than run when the reader has asked for less movement. t=0 is not
   that frame: in flow, sin(-uv.y - uv.x) goes to zero through the middle of
   the screen and the division puts a cross behind whatever sits there. */
const STILL_FRAME = 2.4;

const InteractiveWaveShader = ({
  hasActiveReminders = false,
  hasUpcomingReminders = false,
  disableCenterDimming = true,
  pattern = "flow",
  theme,
  ink = INK,
  paper = PAPER,
  className,
  ...knobs
}: InteractiveWaveShaderProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const materialRef = useRef<THREE.ShaderMaterial | null>(null);
  const invertToRef = useRef(0);
  /* The phase lives here rather than on a THREE.Clock, so `speed` can scale
     the step before the wrap — see the note on LOOP. */
  const phaseRef = useRef(STILL_FRAME);

  /* The form's own numbers, with anything passed alongside winning over them,
     so <InteractiveWaveShader pattern="silk" bands={4} /> means what it looks
     like it means. */
  const shape: WaveKnobs = { ...WAVE_PRESETS[pattern], ...knobs };

  /* The render loop is created once and closes over whatever `shape` was at
     mount, so `speed` — the one knob that never becomes a uniform and is read
     every frame on the CPU — has to be reached through a ref or a later
     change would never take. The seven that ARE uniforms do not need this:
     the effect above writes them straight into the material. */
  const shapeRef = useRef(shape);
  shapeRef.current = shape;

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

  /* Switching form adopts that form's numbers; a knob passed alongside still
     wins, because `shape` was merged that way above. */
  useEffect(() => {
    const m = materialRef.current;
    if (!m) return;
    m.uniforms.pattern.value = WAVE_PATTERNS.indexOf(pattern);
    m.uniforms.layers.value = shape.layers;
    m.uniforms.warp.value = shape.warp;
    m.uniforms.freqX.value = shape.freqX;
    m.uniforms.freqY.value = shape.freqY;
    m.uniforms.bands.value = shape.bands;
    m.uniforms.sharp.value = shape.sharp;
    m.uniforms.gamma.value = shape.gamma;
  }, [pattern, shape.layers, shape.warp, shape.freqX, shape.freqY, shape.bands, shape.sharp, shape.gamma]);

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
      /* Capped: this is a full-screen fragment shader with up to nine turns of
         a loop per pixel, and a phone's third multiplier costs 2.25x for a
         difference nobody can see through the scrim. */
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

    const startInvert = resolvedTheme() === "dark" ? 0 : 1;
    invertToRef.current = startInvert;

    const uniforms = {
      iTime: { value: phaseRef.current },
      iResolution: { value: new THREE.Vector2() },
      invert: { value: startInvert },
      disableCenterDimming: { value: disableCenterDimming },
      inkGround: { value: new THREE.Color(ink.ground) },
      inkMid: { value: new THREE.Color(ink.mid) },
      inkHi: { value: new THREE.Color(ink.hi) },
      paperGround: { value: new THREE.Color(paper.ground) },
      paperMid: { value: new THREE.Color(paper.mid) },
      paperHi: { value: new THREE.Color(paper.hi) },
      pattern: { value: WAVE_PATTERNS.indexOf(pattern) },
      layers: { value: shape.layers },
      warp: { value: shape.warp },
      freqX: { value: shape.freqX },
      freqY: { value: shape.freqY },
      bands: { value: shape.bands },
      sharp: { value: shape.sharp },
      gamma: { value: shape.gamma },
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

    /* An observer on the box, not a window listener: a 100dvh screen moves on
       its own as a phone's URL bar slides away. */
    const ro = typeof ResizeObserver === "function" ? new ResizeObserver(resize) : null;
    if (ro) ro.observe(container);
    else window.addEventListener("resize", resize);
    resize();

    const stillness = window.matchMedia("(prefers-reduced-motion: reduce)");
    let last = 0;

    const render = (now = 0) => {
      if (stillness.matches) {
        uniforms.iTime.value = STILL_FRAME;
      } else {
        if (!last) last = now;
        /* Off the wall clock rather than a frame count, and capped, because a
           tab that has been asleep hands back one enormous first delta. */
        const dt = Math.min((now - last) / 1000, 0.05);
        last = now;
        let p = (phaseRef.current + dt * shapeRef.current.speed) % LOOP;
        if (p < 0) p += LOOP;
        phaseRef.current = p;
        uniforms.iTime.value = p;
      }

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
      /* `last` is cleared, not the phase: picking the loop back up should carry
         on from where the field was, not snap it to the held frame. */
      else if (!stillness.matches) { last = 0; renderer.setAnimationLoop(render); }
    };
    document.addEventListener("visibilitychange", onVisibility);

    const onStillness = () => {
      if (stillness.matches) {
        renderer.setAnimationLoop(null);
        phaseRef.current = STILL_FRAME;
        uniforms.invert.value = invertToRef.current;
        render();
      } else {
        last = 0;
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
