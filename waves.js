/* ============ my.adhd — the hero's waves ============
   The flowing-wave field behind the landing hero. Ported straight from the
   three.js component: same fragment shader, same three switches. What was a
   WebGLRenderer + orthographic camera + a 2x2 plane is here a single
   full-screen triangle in raw WebGL, because the whole job was always "run
   this fragment shader over the viewport" and three.js was 600kB of scenery
   around it. There is no bundler on this site and no npm on the machine, so
   a dependency would have had to arrive from a CDN — which the service
   worker skips, and the offline copy is the whole point of the install.

   Two departures from the original, both because this hero is not a black
   page:

   1) invert. The original paints white filaments on near-black, which is
      right on ink and unreadable on paper — this page is light by default
      and the toggle sits in the nav. So the field is flipped for light:
      dark ridges on white. It is done last, after the centre dim, so the
      dim keeps meaning "push this area towards the page's own ground"
      in both themes rather than always "darken".

   2) iMouse is gone. The original declared it, listened on window, and
      never read it in the shader — a mousemove handler that computed
      nothing.

   The legibility work proper is CSS: .hero-waves::after in landing.css
   veils the field and hides it entirely under the nav and the footnote. */
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

  const FRAG = `
    precision mediump float;
    uniform vec2 iResolution;
    uniform float iTime;
    uniform bool hasActiveReminders;
    uniform bool hasUpcomingReminders;
    uniform bool disableCenterDimming;
    uniform float invert;
    varying vec2 vTextureCoord;

    void mainImage(out vec4 fragColor, in vec2 fragCoord) {
      vec2 uv = (2.0 * fragCoord - iResolution.xy) / min(iResolution.x, iResolution.y);

      vec2 center = iResolution.xy * 0.5;
      float dist = distance(fragCoord, center);
      float radius = min(iResolution.x, iResolution.y) * 0.5;

      float centerDim = disableCenterDimming ? 1.0 : smoothstep(radius * 0.3, radius * 0.5, dist);

      for (float i = 1.0; i < 10.0; i++) {
        uv.x += 0.6 / i * cos(i * 2.5 * uv.y + iTime);
        uv.y += 0.6 / i * cos(i * 1.5 * uv.x + iTime);
      }

      if (hasActiveReminders) {
        fragColor = vec4(vec3(0.1, 0.3, 0.6) / abs(sin(iTime - uv.y - uv.x)), 1.0);
      } else if (hasUpcomingReminders) {
        fragColor = vec4(vec3(0.1, 0.5, 0.2) / abs(sin(iTime - uv.y - uv.x)), 1.0);
      } else {
        fragColor = vec4(vec3(0.1) / abs(sin(iTime - uv.y - uv.x)), 1.0);
      }

      if (!disableCenterDimming) {
        fragColor.rgb = mix(fragColor.rgb * 0.3, fragColor.rgb, centerDim);
      }
    }

    void main() {
      vec4 color;
      mainImage(color, vTextureCoord * iResolution);
      /* The division blows past 1.0 wherever sin approaches zero — that
         overshoot is the glow, and the framebuffer clamps it anyway. It has
         to be clamped here too, before the flip, or 1.0 - 8.0 would take a
         bright ridge to a *more* negative black than a dim one and the
         cross-fade between themes would pass through nonsense. */
      color.rgb = clamp(color.rgb, 0.0, 1.0);
      color.rgb = mix(color.rgb, 1.0 - color.rgb, invert);
      gl_FragColor = color;
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
    hasActiveReminders: gl.getUniformLocation(program, 'hasActiveReminders'),
    hasUpcomingReminders: gl.getUniformLocation(program, 'hasUpcomingReminders'),
    disableCenterDimming: gl.getUniformLocation(program, 'disableCenterDimming'),
    invert: gl.getUniformLocation(program, 'invert'),
  };

  const settings = {
    hasActiveReminders: false,
    hasUpcomingReminders: false,
    disableCenterDimming: false,
  };

  host.appendChild(canvas);
  host.setAttribute('data-ready', '');

  /* ---------- size ----------
     iResolution stays in CSS pixels, as it was in the component: the shader
     reasons about the viewport, and the device ratio only decides how finely
     it is sampled. Capped at 2 — this is a full-screen fragment shader with
     nine turns of the loop per pixel, and a phone's third multiplier costs
     2.25x the work for a difference nobody can see through the veil. */
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
      if (resize()) draw(time);
    }).observe(host);
  } else {
    window.addEventListener('resize', () => {
      if (resize()) draw(time);
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
      if (stillness.matches) {
        invert = invertTo;
        draw(time);
      }
    });
  }

  /* ---------- the loop ----------
     Held at a frame that reads well rather than run, when the reader has
     asked for less movement. t=0 is not that frame: sin(-uv.y - uv.x) goes
     to zero right through the middle of the screen, and the division puts a
     white cross behind the headline. */
  const STILL_FRAME = 2.4;

  /* Every appearance of iTime in the shader is a plain `+ iTime` inside a
     sin or a cos, so the whole field is 2*PI-periodic in it and the clock
     can be wrapped there with no visible seam — it is the same frame.

     Which is not a nicety. The fragment shader is declared mediump, and
     that follows iTime in as a uniform: by t=1000 the gap between two
     representable mediump values is about 1.0, so a page left open for a
     quarter of an hour would quantise and then stop moving altogether.
     Wrapped, the clock never leaves [0, 2*PI) and keeps full precision for
     as long as the tab is open. */
  const LOOP = Math.PI * 2;

  let start = 0;
  let last = 0;
  let time = STILL_FRAME;
  let raf = 0;

  function draw(t) {
    /* iResolution is a divisor in the very first line of the shader. Asked
       to paint before the hero has been laid out, it would divide by zero
       and flood the canvas with NaN-white. */
    if (!w || !h) return;
    gl.uniform1f(u.iTime, t % LOOP);
    gl.uniform1i(u.hasActiveReminders, settings.hasActiveReminders ? 1 : 0);
    gl.uniform1i(u.hasUpcomingReminders, settings.hasUpcomingReminders ? 1 : 0);
    gl.uniform1i(u.disableCenterDimming, settings.disableCenterDimming ? 1 : 0);
    gl.uniform1f(u.invert, invert);
    gl.drawArrays(gl.TRIANGLES, 0, 3);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (!start) start = last = now;
    /* Off the wall clock rather than a frame count, so the turn takes 0.35s
       on a 120Hz phone and on a 60Hz monitor alike. Capped, because a tab
       that has been asleep hands back one enormous first delta. */
    const dt = Math.min((now - last) / 1000, 0.05);
    last = now;
    time = (now - start) / 1000;

    if (invert !== invertTo) {
      const step = dt / 0.35;
      invert = Math.abs(invertTo - invert) <= step ? invertTo : invert + Math.sign(invertTo - invert) * step;
    }

    draw(time);
  }

  function play() {
    if (raf || stillness.matches) return;
    start = 0;
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
        time = STILL_FRAME;
        invert = invertTo;
        draw(time);
      } else {
        play();
      }
    });
  }

  /* The switches the component took as props, for whoever wants them next. */
  window.myadhdWaves = {
    set(next) {
      Object.assign(settings, next);
      /* Re-measured, not just repainted: a caller reaching for this may well
         be doing so because something about the page just moved. */
      resize();
      draw(time);
    },
  };

  resize();
  /* Painted once before the first frame is asked for, so the hero never
     shows an empty canvas — and so the held frame is there at all when the
     reader has asked for stillness. */
  draw(time);
  play();
})();
