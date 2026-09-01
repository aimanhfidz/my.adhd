/* ============ my.adhd — the hero's waves ============
   The flowing-wave field behind the landing hero. Ported straight from the
   three.js component: same fragment shader, same three switches. What was a
   WebGLRenderer + orthographic camera + a 2x2 plane is here a single
   full-screen triangle in raw WebGL, because the whole job was always "run
   this fragment shader over the viewport" and three.js was 600kB of scenery
   around it. There is no bundler on this site and no npm on the machine, so
   a dependency would have had to arrive from a CDN — which the service
   worker skips, and the offline copy is the whole point of the install.

   Three departures from the original, the first two because this hero is
   not a black page:

   1) A ramp instead of a colour. The original divides a colour by
      abs(sin(...)) and lets the channels clip where the divisor nears zero,
      which is why its filaments blow out white. That works for one fixed
      look on a black page. This one has to carry the brand on both a white
      page and a near-black one, so the shader computes a single scalar
      intensity and each theme maps it through its own three-stop ramp:
      ground, brand, highlight. The page's own surface is stop one, so the
      field emerges out of the page rather than sitting on it.

      This replaces an earlier trick that flipped the field for light with
      1.0 - colour. That is a per-channel inversion: it is fine for grey,
      but it takes a hue to its complement, and the complement of the brand
      blue is orange — which on this site belongs to the logo mark and
      nothing else. The ramp keeps the hue and moves only the value, and
      the centre dim now pulls intensity toward stop one, which means the
      same thing in both themes without any special-casing.

   2) iMouse is gone. The original declared it, listened on window, and
      never read it in the shader — a mousemove handler that computed
      nothing.

   3) The field is one of four, and its shape is eight numbers rather than
      eight literals. The original's constants were spread through the
      shader — 9 turns, 0.6 of push, 2.5 and 1.5 for the two frequencies,
      0.1 over the sine, a 1.6 curve — so the only way to ask what a
      different wave looked like was to edit GLSL and reload. They are
      uniforms now, the loop's readout is shared, and a form is the dozen
      lines that compute one scalar. See the patterns block below; the
      landing page still runs the first one on the original numbers, so
      nothing about the shipping hero moved.

   The legibility work proper is CSS: .hero-waves::after in landing.css
   veils the field and hides it entirely under the nav and the footnote.

   waves-lab.html drives all of it with sliders. It is a workbench, not a
   page of the site: nothing links to it and it is not in the service
   worker's shell. */
(function () {
  const host = document.querySelector('.hero-waves');
  if (!host) return;

  /* Uv comes off the triangle rather than off a mesh's attribute, but it is
     the same 0..1 the plane's uv gave the original. */
  const VERT = `
    attribute vec2 aPosition;
    varying vec2 vTextureCoord;
    void main() {
      vTextureCoord = aPosition * 0.5 + 0.5;
      gl_Position = vec4(aPosition, 0.0, 1.0);
    }
  `;

  /* ---------- the patterns ----------
     Four fields, one readout. Every branch below computes a single scalar
     d that passes through zero along the crest of each filament, and
     everything after it — the overshoot at the crossing, the curve, the
     centre dim, the two ramps — is shared. That is what makes a new form
     cheap: a dozen lines of GLSL, not a second shader and a second canvas.

     The seven numbers in the shader mean the same thing in all four, which
     is what makes the sliders worth having — you can carry a look from one
     form to the next:

       layers  how many harmonics of the loop get folded in
       warp    how far each harmonic pushes the space around
       freqX   the first axis's wavelength (x — or, in ripple, the angle)
       freqY   the second's                (y — or, in ripple, the spiral)
       bands   how many crests the field is cut into
       sharp   the filament's thickness: the numerator over |d|
       gamma   how hard the bulk of the page is pushed back to the ground

     The eighth, speed, never reaches the GPU — see the loop, which owns
     the clock for reasons of precision.

       flow    the original. A diagonal running through space that has been
               kneaded by its own harmonics: marbling, filaments, no grain
               to it in either axis.
       swell   ordered horizontal ridges, each one a travelling sum of
               sines, with a slow cross-swell so the stack is not one
               profile extruded sideways. The calm one, and the one that
               leaves the middle of the screen quietest.
       ripple  rings leaving the centre, their radius pushed about by a few
               angular harmonics so they arrive as weather rather than as a
               target. Watch this one against the reader pool: the pool is
               centred too, and rings and an ellipse can end up agreeing.
       silk    two crossed sets of crests, multiplied. A woven net, and the
               only one of the four with a mesh you can read as a mesh —
               fewer bands and more warp is where it stops being a grid. */
  const FRAG = `
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

      /* The loop bound is a constant because ES 2.0 insists on one; the
         count is a uniform, so it leaves early instead. */
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
        /* The angular multiple has to be a whole number or the harmonic
           does not close on itself: atan jumps from PI to -PI along the
           negative x axis, and any fraction of a turn leaves a hard seam
           running out of the centre to the left edge — visible as a step
           through every ring it crosses. So freqX is rounded here, and
           what it counts in this form is petals. Half a petal is not a
           thing, which is why the slider looks like it sticks. */
        float k = max(1.0, floor(freqX + 0.5));
        for (float i = 1.0; i < 10.0; i++) {
          if (i > layers) break;
          w += warp / i * cos(i * k * a + i * freqY * r + t);
        }
        /* Every angular harmonic meets itself at r = 0 — atan has nothing
           to tell them apart there — and the pinch that leaves is a
           starburst behind the headline, which is not weather. Fading the
           warp in over the first two thirds of the way out keeps the rings
           round where the copy sits and lets them break up at the corners,
           which is where you want a ripple to stop looking drawn. */
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

      /* The original's numerator, kept as a scalar. It runs away wherever
         the field passes zero — that overshoot is the filament, and
         clamping it here is what the framebuffer used to do on its own.
         The floor under |d| is not the clamp's job: it keeps a sharp of
         zero from asking for 0/0 and painting NaN across the hero. */
      float v = clamp(sharp / max(abs(d), 1e-4), 0.0, 1.0);

      /* The intensity never falls below sharp — sharp/|d| bottoms out where
         the field is at full height — and on the original's numbers two
         thirds of the screen sits under 0.2. Run straight into a linear
         ramp that puts most of the page 40% of the way to full brand, which
         lifts the whole field and hands the near-black reader pool a bright
         surround to be an oval against. The curve pushes that bulk back
         down onto the ground and leaves the colour where the filaments are,
         which is where the old white-hot version carried it too. */
      v = pow(v, gamma);

      /* Shapes the field first, attenuates second. The other way round the
         curve compounds the dim — 0.3 becomes 0.3^1.6, near enough half
         again — and the centre pulls away from its surround hard enough to
         draw a ring. Left off by default here anyway: see waves.js's own
         note on why the stylesheet owns this now. */
      if (!disableCenterDimming) v = mix(v * 0.3, v, centerDim);

      gl_FragColor = vec4(mix(ramp(v, inkGround, inkMid, inkHi),
                              ramp(v, paperGround, paperMid, paperHi), invert), 1.0);
    }
  `;

  const canvas = document.createElement('canvas');
  const gl =
    canvas.getContext('webgl', { antialias: true, alpha: false, depth: false, stencil: false }) ||
    canvas.getContext('experimental-webgl', { antialias: true, alpha: false, depth: false, stencil: false });

  /* No WebGL is not a failure state worth announcing. The hero already has
     a background — the two brand glows — and it looks finished without us. */
  if (!gl) return;

  function compile(type, src) {
    const s = gl.createShader(type);
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) {
      console.error('waves: shader failed to compile', gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  const vs = compile(gl.VERTEX_SHADER, VERT);
  const fs = compile(gl.FRAGMENT_SHADER, FRAG);
  if (!vs || !fs) return;

  const program = gl.createProgram();
  gl.attachShader(program, vs);
  gl.attachShader(program, fs);
  gl.linkProgram(program);
  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    console.error('waves: program failed to link', gl.getProgramInfoLog(program));
    return;
  }
  gl.useProgram(program);

  /* One triangle big enough to cover the clip cube, not two making a quad:
     no seam down the diagonal and one fewer vertex to think about. */
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 3, -1, -1, 3]), gl.STATIC_DRAW);
  const aPosition = gl.getAttribLocation(program, 'aPosition');
  gl.enableVertexAttribArray(aPosition);
  gl.vertexAttribPointer(aPosition, 2, gl.FLOAT, false, 0, 0);

  const u = {
    iResolution: gl.getUniformLocation(program, 'iResolution'),
    iTime: gl.getUniformLocation(program, 'iTime'),
    disableCenterDimming: gl.getUniformLocation(program, 'disableCenterDimming'),
    invert: gl.getUniformLocation(program, 'invert'),
    inkGround: gl.getUniformLocation(program, 'inkGround'),
    inkMid: gl.getUniformLocation(program, 'inkMid'),
    inkHi: gl.getUniformLocation(program, 'inkHi'),
    paperGround: gl.getUniformLocation(program, 'paperGround'),
    paperMid: gl.getUniformLocation(program, 'paperMid'),
    paperHi: gl.getUniformLocation(program, 'paperHi'),
    pattern: gl.getUniformLocation(program, 'pattern'),
    layers: gl.getUniformLocation(program, 'layers'),
    warp: gl.getUniformLocation(program, 'warp'),
    freqX: gl.getUniformLocation(program, 'freqX'),
    freqY: gl.getUniformLocation(program, 'freqY'),
    bands: gl.getUniformLocation(program, 'bands'),
    sharp: gl.getUniformLocation(program, 'sharp'),
    gamma: gl.getUniformLocation(program, 'gamma'),
  };

  /* ---------- the palette ----------
     Read out of the stylesheet rather than written here, so the brand lives
     in exactly one place. The six tokens are declared unthemed on purpose:
     the shader cross-fades between both ramps to turn the field over, so it
     needs the ink colours while the page is on paper and the other way
     round, and a themed token only ever answers for the theme in force. */
  const css = getComputedStyle(document.documentElement);

  function colour(token, fallback) {
    const raw = (css.getPropertyValue(token) || '').trim() || fallback;
    let hex = raw.replace('#', '');
    if (hex.length === 3) hex = hex.replace(/./g, (c) => c + c);
    if (/^[0-9a-f]{6}$/i.test(hex)) {
      const n = parseInt(hex, 16);
      return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255];
    }
    const p = raw.match(/[\d.]+/g);
    return p && p.length >= 3 ? [p[0] / 255, p[1] / 255, p[2] / 255] : [0, 0, 0];
  }

  const brand = {
    inkGround: colour('--wave-ink-ground', '#101018'),
    inkMid: colour('--wave-ink-mid', '#4737FF'),
    inkHi: colour('--wave-ink-hi', '#ACA5FF'),
    paperGround: colour('--wave-paper-ground', '#FFFFFF'),
    paperMid: colour('--wave-paper-mid', '#D1CDFF'),
    paperHi: colour('--wave-paper-hi', '#3529BF'),
  };

  /* The two reminder states the component arrived with. Nothing on this site
     sets them — the landing page is always the neutral brand — but the props
     are part of its API, so they still mean something. Blue is the brand and
     already the resting state, so active reads as a colder, harder blue and
     upcoming keeps the original's green. */
  const STATES = {
    active: { mid: '#3E7BFF', hi: '#A9C6FF', paperMid: '#C6D8FF', paperHi: '#1C3AA8' },
    upcoming: { mid: '#2FB86B', hi: '#9BE8BE', paperMid: '#BFEBD3', paperHi: '#12603A' },
  };

  function palette() {
    const s = settings.hasActiveReminders
      ? STATES.active
      : settings.hasUpcomingReminders
      ? STATES.upcoming
      : null;
    if (!s) return brand;
    return {
      inkGround: brand.inkGround,
      inkMid: colour('', s.mid),
      inkHi: colour('', s.hi),
      paperGround: brand.paperGround,
      paperMid: colour('', s.paperMid),
      paperHi: colour('', s.paperHi),
    };
  }

  /* ---------- the forms ----------
     A pattern is its index in this list — the shader branches on the
     number — and a set of numbers that suit it. Switching form adopts
     those numbers, because the same eight that make flow read as marbling
     make ripple read as a dartboard; passing knobs alongside the switch
     overrides them one at a time.

     flow's row is the original's literals to the last decimal, and it is
     the default, so index.html paints exactly the hero it painted before
     any of this existed. bands is the one number the original did not
     have: at 1.0 it is the plain uv.y + uv.x it used to add up. */
  const PATTERNS = ['flow', 'swell', 'ripple', 'silk'];

  const PRESETS = {
    flow:   { layers: 9, warp: 0.60, freqX: 2.5, freqY: 1.5, bands: 1.0, sharp: 0.10, gamma: 1.6, speed: 1.0 },
    swell:  { layers: 4, warp: 0.28, freqX: 2.0, freqY: 1.2, bands: 6.0, sharp: 0.09, gamma: 1.5, speed: 0.8 },
    ripple: { layers: 3, warp: 0.16, freqX: 3.0, freqY: 0.8, bands: 9.0, sharp: 0.09, gamma: 1.6, speed: 0.9 },
    silk:   { layers: 2, warp: 0.20, freqX: 2.0, freqY: 1.4, bands: 5.0, sharp: 0.05, gamma: 1.7, speed: 0.7 },
  };

  const settings = Object.assign(
    {
      hasActiveReminders: false,
      hasUpcomingReminders: false,
      /* On by default here, where the component had it off. Its centre dim
         is a circle struck from the middle of the viewport, and this hero's
         copy is not a circle — .hero-waves::after already lays an ellipse
         over the column, sized to the text and measured against it. Running
         both put a second, tighter, rounder edge inside the first, which on
         paper read as a bright ring around the headline. One mechanism, the
         tuned one. */
      disableCenterDimming: true,
      pattern: 'flow',
    },
    PRESETS.flow
  );

  host.appendChild(canvas);
  host.setAttribute('data-ready', '');

  /* ---------- size ----------
     iResolution stays in CSS pixels, as it was in the component: the shader
     reasons about the viewport, and the device ratio only decides how finely
     it is sampled. Capped at 2 — this is a full-screen fragment shader with
     up to nine turns of the loop per pixel, and a phone's third multiplier
     costs 2.25x the work for a difference nobody can see through the veil. */
  let w = 0;
  let h = 0;

  function resize() {
    const next = { w: host.clientWidth, h: host.clientHeight };
    if (!next.w || !next.h) return false;
    if (next.w === w && next.h === h) return false;

    w = next.w;
    h = next.h;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(w * dpr);
    canvas.height = Math.round(h * dpr);
    canvas.style.width = w + 'px';
    canvas.style.height = h + 'px';
    gl.viewport(0, 0, canvas.width, canvas.height);
    gl.uniform2f(u.iResolution, w, h);
    return true;
  }

  /* The hero is 100dvh, which moves on its own as a phone's URL bar slides
     away — an observer on the box catches that where a window resize does
     not. */
  if (typeof ResizeObserver === 'function') {
    new ResizeObserver(() => {
      if (resize()) draw();
    }).observe(host);
  } else {
    window.addEventListener('resize', () => {
      if (resize()) draw();
    });
  }

  /* ---------- theme ----------
     Eased rather than snapped, so the toggle turns the field over instead
     of blinking it. */
  const stillness = window.matchMedia('(prefers-reduced-motion: reduce)');
  let invert = 0;
  let invertTo = 0;

  function readTheme() {
    const dark =
      (window.myadhdTheme && window.myadhdTheme.active() === 'dark') ||
      document.documentElement.dataset.theme === 'dark';
    invertTo = dark ? 0 : 1;
  }

  readTheme();
  invert = invertTo;

  if (window.myadhdTheme && window.myadhdTheme.onChange) {
    window.myadhdTheme.onChange(() => {
      readTheme();
      /* The cross-fade is a step per frame, so it only happens if frames
         are happening. With the loop stopped — reduced motion, or a caller
         that has paused us — the turn has to be taken here or the field
         keeps the old theme's ramp under the new theme's page. */
      if (!raf) {
        invert = invertTo;
        draw();
      }
    });
  }

  /* ---------- the loop ----------
     Held at a frame that reads well rather than run, when the reader has
     asked for less movement. Phase 0 is not that frame: in flow,
     sin(-uv.y - uv.x) goes to zero right through the middle of the screen,
     and the division puts a white cross behind the headline. */
  const STILL_FRAME = 2.4;

  /* Every appearance of t in the shader is a plain + or - t inside a sin or
     a cos, and every coefficient on it is a whole number, so the whole
     field is 2*PI-periodic in it and the clock can be wrapped there with no
     visible seam — it is the same frame.

     Which is not a nicety. The fragment shader is declared mediump, and
     that follows iTime in as a uniform: by t=1000 the gap between two
     representable mediump values is about 1.0, so a page left open for a
     quarter of an hour would quantise and then stop moving altogether.
     Wrapped, the clock never leaves [0, 2*PI) and keeps full precision for
     as long as the tab is open.

     It is also why speed is not a uniform and the phase is accumulated
     here rather than read off the wall clock. A shader that multiplied
     iTime by 0.8 would take the wrap with it, and 2*PI * 0.8 is not a whole
     turn of anything — the field would jump every few seconds. Scaling the
     step before the wrap keeps the seam where the sines put it. */
  const LOOP = Math.PI * 2;

  let last = 0;
  let phase = STILL_FRAME;
  let raf = 0;

  function draw() {
    /* iResolution is a divisor in the very first line of the shader. Asked
       to paint before the hero has been laid out, it would divide by zero
       and flood the canvas with NaN-white. */
    if (!w || !h) return;
    const p = palette();
    gl.uniform1f(u.iTime, phase);
    gl.uniform1i(u.disableCenterDimming, settings.disableCenterDimming ? 1 : 0);
    gl.uniform1f(u.invert, invert);
    gl.uniform3fv(u.inkGround, p.inkGround);
    gl.uniform3fv(u.inkMid, p.inkMid);
    gl.uniform3fv(u.inkHi, p.inkHi);
    gl.uniform3fv(u.paperGround, p.paperGround);
    gl.uniform3fv(u.paperMid, p.paperMid);
    gl.uniform3fv(u.paperHi, p.paperHi);
    gl.uniform1i(u.pattern, Math.max(0, PATTERNS.indexOf(settings.pattern)));
    gl.uniform1f(u.layers, settings.layers);
    gl.uniform1f(u.warp, settings.warp);
    gl.uniform1f(u.freqX, settings.freqX);
    gl.uniform1f(u.freqY, settings.freqY);
    gl.uniform1f(u.bands, settings.bands);
    gl.uniform1f(u.sharp, settings.sharp);
    gl.uniform1f(u.gamma, settings.gamma);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!last) last = now;
    /* Off the wall clock rather than a frame count, so the turn takes 0.35s
       on a 120Hz phone and on a 60Hz monitor alike. Capped, because a tab
       that has been asleep hands back one enormous first delta. */
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;

    phase = (phase + dt * settings.speed) % LOOP;
    if (phase < 0) phase += LOOP;

    if (invert !== invertTo) {
      const step = dt / 0.35;
      invert = Math.abs(invertTo - invert) <= step ? invertTo : invert + Math.sign(invertTo - invert) * step;
    }

    draw();
  }

  function play() {
    if (raf || stillness.matches) return;
    /* Not zero-ing the phase: it is the field's position, and picking the
       loop back up after a hidden tab or a scrub should carry on from where
       the field was, not snap it back to the held frame. Only the delta's
       origin resets, or the first step would be the whole gap. */
    last = 0;
    raf = requestAnimationFrame(frame);
  }

  function pause() {
    if (!raf) return;
    cancelAnimationFrame(raf);
    raf = 0;
  }

  /* Nothing behind a hidden tab is worth a GPU. */
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else play();
  });

  if (stillness.addEventListener) {
    stillness.addEventListener('change', () => {
      if (stillness.matches) {
        pause();
        phase = STILL_FRAME;
        invert = invertTo;
        draw();
      } else {
        play();
      }
    });
  }

  /* The switches the component took as props, and the eight the shader
     grew — for the lab, and for whoever wants them next. */
  window.myadhdWaves = {
    patterns: PATTERNS.slice(),
    presets() {
      const out = {};
      PATTERNS.forEach((name) => (out[name] = Object.assign({}, PRESETS[name])));
      return out;
    },
    get() {
      return Object.assign({}, settings);
    },
    /* A form arrives with its own numbers; anything passed alongside it
       wins over them, so set({pattern:'silk', bands:4}) means what it
       looks like it means. */
    set(next) {
      if (next && next.pattern && next.pattern !== settings.pattern && PRESETS[next.pattern]) {
        Object.assign(settings, PRESETS[next.pattern]);
      }
      Object.assign(settings, next);
      /* Re-measured, not just repainted: a caller reaching for this may well
         be doing so because something about the page just moved. */
      resize();
      draw();
    },
    /* One frame at one phase. The reduced-motion hold is this with the
       still frame; the lab's scrubber is this with a slider. */
    seek(t) {
      phase = ((t % LOOP) + LOOP) % LOOP;
      draw();
    },
    play,
    pause,
    phase() {
      return phase;
    },
  };

  resize();
  /* Painted once before the first frame is asked for, so the hero never
     shows an empty canvas — and so the held frame is there at all when the
     reader has asked for stillness. */
  draw();
  play();
})();
