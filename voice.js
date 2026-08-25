/* ============================================================
   my.adhd — hold to talk

   What this file is for: the thought you have on the bus is gone by the
   time you have found a keyboard. Typing is the narrowest part of the
   funnel in an app whose whole loop is "get it out of your head", so
   there is a second way in.

   This used to be SpeechRecognition and nothing else. That was free and
   it was local-ish, and it was wrong about roughly every third word that
   mattered. The engine takes exactly one language, so a Malay sentence
   with three English words in it comes back half phonetic; it has no
   vocabulary, so an apartment block, a clinic or a person's name comes
   back as whatever it rhymed with; and on an iPhone saved to the home
   screen it did not run at all — the users least likely to be near a
   keyboard were the ones with no mic.

   So the audio now goes to Gemini, which listens to the recording rather
   than to a stream of phonemes: it code-switches inside a sentence, it
   can be handed the names this person already uses, and it runs the same
   on an iPhone as anywhere else. What is captured here is what it needs
   and nothing more — 16 kHz mono, which is the floor for speech and a
   sixth of the bytes of what the mic actually hands over.

   The browser engine is still here, but demoted. It runs alongside the
   recording purely so there is text in the box while you are still
   talking, because a mic that shows nothing for two seconds after you
   let go reads as a mic that did not work. Whatever it guessed gets
   replaced by the real transcript on release. Where it does not exist
   — an iPhone, mainly — you get the level ring instead and the same
   final answer.

   Two things it still does that ordinary dictation does not:

   It does not stop for silence. A dump is "the rent thing... uh... and
   the car insurance" with five seconds in the middle, and every engine
   treats five seconds of nothing as the end of the sentence. The only
   thing that ends a recording here is letting go of the button.

   And it never loses the hold. If the network is gone or the endpoint
   fails, stop() falls back to whatever the browser engine heard rather
   than handing back nothing. A worse transcript beats a lost thought.
   ============================================================ */

(function () {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  const canCapture = !!(navigator.mediaDevices &&
                        navigator.mediaDevices.getUserMedia && Ctx);

  /* Speech models are trained at 16 kHz and gain nothing above it, while
     the mic will happily hand over 48. Resampling on the way out is three
     quarters of the upload gone for no loss of anything anyone can hear. */
  const RATE = 16000;

  /* 16-bit mono at 16 kHz is 32 KB a second, and the function this posts
     to takes a 4.5 MB body — so the cap is not a judgement about how long
     a thought should be, it is that number divided by this one.

     It used to be 90, because the WAV went up as base64 inside JSON and
     that costs a third of the budget in padding. The bytes go up raw now,
     which buys back the third: 130 seconds is 4.16 MB, still inside the
     limit, and the metadata rides in a header instead. */
  const MAX_SECONDS = 130;
  const WARN_SECONDS = 115;

  /* The rough live text. One line to turn off if running two captures of
     the same microphone ever turns out to upset a browser. */
  const PREVIEW = true;

  let live = false;          // the finger is still down
  let opened = false;        // the microphone actually got open
  let hooks = {};
  let holdId = 0;            // bumped per hold, so a late result can be dropped

  /* ---- capture ---- */
  let stream = null;
  let source = null;
  let tap = null;             // worklet or script processor
  let sink = null;            // muted gain, only for the script processor path
  let chunks = [];
  let frames = 0;
  let capRate = RATE;         // what the context actually gave us
  let capTimer = null;
  let warnTimer = null;

  /* The context and its worklet module survive between holds. Building
     them costs 20-odd milliseconds, which is not much until you notice it
     sits between pressing the button and the mic being live. */
  let ctx = null;
  let workletReady = null;

  /* ---- the browser engine, preview only ---- */
  let rec = null;
  let settled = '';
  let previewOff = false;    // it refused; stop asking for the rest of the session
  let legs = 0;              // restarts within this hold
  let legStart = 0;

  /* ============ the recorder ============ */

  /* An AudioWorklet needs a module URL and this project has no build step,
     so the module is a blob. It buffers to 2048 frames before posting:
     the render quantum is 128, and 375 messages a second to the main
     thread to draw one ring is a waste of both. */
  const WORKLET_SRC = `
    class Tap extends AudioWorkletProcessor {
      constructor() { super(); this.buf = new Float32Array(2048); this.n = 0; }
      process(inputs) {
        const ch = inputs[0] && inputs[0][0];
        if (!ch) return true;
        for (let i = 0; i < ch.length; i++) {
          this.buf[this.n++] = ch[i];
          if (this.n === this.buf.length) this.flush();
        }
        return true;
      }
      flush() {
        if (!this.n) return;
        const out = this.buf.slice(0, this.n);
        this.n = 0;
        this.port.postMessage(out, [out.buffer]);
      }
    }
    registerProcessor('tap', Tap);
  `;

  function audioCtx() {
    if (ctx && ctx.state !== 'closed') return ctx;
    /* Asking for 16 kHz up front lets the browser do the resampling in
       native code. It is allowed to ignore us, which is what capRate is
       for — resample() below picks up whatever we actually got. */
    try { ctx = new Ctx({ sampleRate: RATE }); }
    catch (_) { ctx = new Ctx(); }
    workletReady = null;
    return ctx;
  }

  function loadWorklet(c) {
    if (workletReady) return workletReady;
    if (!c.audioWorklet) return (workletReady = Promise.reject(new Error('no worklet')));
    const url = URL.createObjectURL(new Blob([WORKLET_SRC], { type: 'text/javascript' }));
    workletReady = c.audioWorklet.addModule(url).finally(() => URL.revokeObjectURL(url));
    return workletReady;
  }

  /* Every chunk that arrives, from either path, lands here. */
  function took(block) {
    if (!live) return;
    chunks.push(block);
    frames += block.length;
    if (!hooks.onLevel) return;
    let sum = 0;
    for (let i = 0; i < block.length; i++) sum += block[i] * block[i];
    hooks.onLevel(Math.min(1, Math.sqrt(sum / block.length) * 4));
  }

  async function openMic() {
    stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        channelCount: 1,
        /* The browser's own cleanup is better than anything worth writing
           here, and a brain dump is usually one person in a noisy room. */
        echoCancellation: true,
        noiseSuppression: true,
        autoGainControl: true,
      },
    });

    const c = audioCtx();
    if (c.state === 'suspended') await c.resume();   // iOS, from the gesture
    capRate = c.sampleRate;
    source = c.createMediaStreamSource(stream);

    try {
      await loadWorklet(c);
      tap = new AudioWorkletNode(c, 'tap');
      tap.port.onmessage = (e) => took(e.data);
      source.connect(tap);
    } catch (_) {
      /* Older Safari. Deprecated, does its work on the main thread, and
         entirely good enough for one mono channel of speech. It also has
         to reach a destination before some browsers will pump it at all,
         hence the silent gain on the end. */
      tap = c.createScriptProcessor(4096, 1, 1);
      tap.onaudioprocess = (e) => took(new Float32Array(e.inputBuffer.getChannelData(0)));
      sink = c.createGain();
      sink.gain.value = 0;
      source.connect(tap);
      tap.connect(sink);
      sink.connect(c.destination);
    }
  }

  function closeMic() {
    try { source && source.disconnect(); } catch (_) {}
    try { tap && tap.disconnect(); } catch (_) {}
    try { sink && sink.disconnect(); } catch (_) {}
    if (tap) { tap.port ? (tap.port.onmessage = null) : (tap.onaudioprocess = null); }
    /* Stopping the tracks is what puts out the recording light. Leaving
       the stream open between holds would shave a few milliseconds off
       the next one and leave every user of this app with a permanently
       lit microphone indicator, which is not a trade worth making. */
    if (stream) stream.getTracks().forEach((t) => { try { t.stop(); } catch (_) {} });
    source = tap = sink = stream = null;
    clearTimeout(capTimer); clearTimeout(warnTimer);
    capTimer = warnTimer = null;
  }

  /* ---- turning what we caught into a file ---- */

  function joined() {
    const all = new Float32Array(frames);
    let o = 0;
    for (const c of chunks) { all.set(c, o); o += c.length; }
    return all;
  }

  /* Box averaging, not point sampling. Dropping two of every three samples
     folds everything above 8 kHz back down into the speech band as hiss,
     and hiss is exactly what a transcriber does not need. */
  function resample(input, from, to) {
    if (from === to) return input;
    const ratio = from / to;
    const out = new Float32Array(Math.floor(input.length / ratio));
    for (let i = 0; i < out.length; i++) {
      const start = Math.floor(i * ratio);
      const end = Math.min(Math.floor((i + 1) * ratio), input.length);
      let sum = 0;
      for (let j = start; j < end; j++) sum += input[j];
      out[i] = sum / Math.max(1, end - start);
    }
    return out;
  }

  /* Gemini takes wav, mp3, aiff, aac, ogg or flac, and MediaRecorder gives
     Chrome webm and Safari mp4 — neither of which is on that list. So the
     samples are collected raw and the 44-byte header is written by hand.
     It is the least code of any route that works on both. */
  function toWav(pcm, rate) {
    const buf = new ArrayBuffer(44 + pcm.length * 2);
    const v = new DataView(buf);
    const tag = (o, s) => { for (let i = 0; i < s.length; i++) v.setUint8(o + i, s.charCodeAt(i)); };

    tag(0, 'RIFF');  v.setUint32(4, 36 + pcm.length * 2, true);
    tag(8, 'WAVE');
    tag(12, 'fmt '); v.setUint32(16, 16, true);
    v.setUint16(20, 1, true);        // PCM
    v.setUint16(22, 1, true);        // mono
    v.setUint32(24, rate, true);
    v.setUint32(28, rate * 2, true); // bytes per second
    v.setUint16(32, 2, true);        // block align
    v.setUint16(34, 16, true);       // bits
    tag(36, 'data'); v.setUint32(40, pcm.length * 2, true);

    let o = 44;
    for (let i = 0; i < pcm.length; i++, o += 2) {
      const s = Math.max(-1, Math.min(1, pcm[i]));
      v.setInt16(o, s < 0 ? s * 0x8000 : s * 0x7fff, true);
    }
    return new Uint8Array(buf);
  }

  /* btoa on a 3 MB string built with spread or map blows the stack, and
     the one-character-at-a-time loop is slow enough to be felt. Chunks of
     32k are neither. */
  function base64(bytes) {
    let s = '';
    for (let i = 0; i < bytes.length; i += 0x8000) {
      s += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(s);
  }

  /* Near-silence is a tapped button or a hold in a pocket, and there is no
     sense paying for a round trip to be told so. Anything genuinely quiet
     but real still clears this — it is a floor, not a gate. */
  function heardAnything(pcm) {
    let peak = 0;
    for (let i = 0; i < pcm.length; i++) {
      const a = Math.abs(pcm[i]);
      if (a > peak) peak = a;
    }
    return peak > 0.01;
  }

  /* ============ the browser engine, for the live preview only ============ */

  function buildRec() {
    const r = new Rec();
    r.continuous = true;
    r.interimResults = true;
    /* It takes one language and there is no mixed mode, which is the whole
       reason it is no longer the thing that decides what you said. The
       transcript that counts comes from the recording, where nobody has to
       choose. This one is set to the interface language and is allowed to
       be wrong — it is a placeholder with a two-second lifespan. */
    r.lang = document.documentElement.lang || navigator.language || 'en-US';

    r.onresult = (e) => {
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const said = e.results[i][0].transcript;
        if (e.results[i].isFinal) settled += said;
        else interim += said;
      }
      hooks.onText && hooks.onText(clean(settled + interim));
    };

    /* Nothing this engine does is worth interrupting a hold for. The
       recording is the real capture and it has its own error path; a
       preview that dies quietly just means the ring carries the wait.

       Except for a refusal. A browser can allow getUserMedia and still say
       no to this — they are separate permissions in Chrome, and its engine
       is a network service that can be turned off on its own. A refusal
       ends instantly, and "restart whenever it ends" would then be a tight
       loop for as long as the finger is down. */
    r.onerror = (e) => {
      if (e.error === 'not-allowed' || e.error === 'service-not-allowed') previewOff = true;
    };

    r.onend = () => {
      if (!live || previewOff) return;
      /* The silence stop is the case worth restarting for, and it takes a
         second or two to happen. Anything that ends the moment it started
         is failing, not listening — a few of those in one hold and this
         engine has nothing to offer. */
      if (performance.now() - legStart < 250 && ++legs > 3) { previewOff = true; return; }
      try { rec = buildRec(); legStart = performance.now(); rec.start(); }
      catch (_) { rec = null; previewOff = true; }
    };
    return r;
  }

  function startPreview() {
    if (!PREVIEW || !Rec || previewOff) return;
    settled = '';
    legs = 0;
    try { rec = buildRec(); legStart = performance.now(); rec.start(); }
    catch (_) { rec = null; }
  }

  function stopPreview() {
    try { rec && rec.stop(); } catch (_) {}
    rec = null;
  }

  /* Engines run words together across restarts and leave leading spaces on
     each leg. One space between things, none at the front. */
  function clean(s) {
    return s.replace(/\s+/g, ' ').replace(/^\s+/, '');
  }

  /* ============ the round trip ============ */

  async function transcribe(pcm, seconds, vocab) {
    /* The WAV is the body and nothing else is, because base64 in JSON was
       costing a third of the request budget to say the same thing. What
       is left to send — how long it was, and the names this person uses —
       goes in a header, encoded because those names are the whole point
       and some of them are not ASCII. */
    const meta = base64(new TextEncoder().encode(JSON.stringify({
      seconds: Math.round(seconds),
      vocab: Array.isArray(vocab) ? vocab.slice(0, 40) : [],
    })));

    const res = await fetch('/api/transcribe', {
      method: 'POST',
      headers: { 'Content-Type': 'audio/wav', 'X-Voice-Meta': meta },
      body: toWav(pcm, RATE),
    });
    if (!res.ok) throw new Error('transcribe returned ' + res.status);
    const data = await res.json();
    return { text: clean(String(data.text || '')), lang: data.lang || null };
  }

  /* ============ what app.js sees ============ */

  window.Voice = {
    /** False means app.js never shows the button at all. */
    available: () => canCapture,

    /** True while a hold is in progress. */
    live: () => live,

    /**
     * Begin a hold. Resolves once the mic is actually open, so the caller
     * can wait for the permission prompt before promising anyone it is
     * listening.
     *
     * @param {{
     *   onLive:()=>void,              the mic is genuinely open now
     *   onText:(text:string)=>void,   rough live text, may never fire
     *   onLevel:(level:number)=>void, 0-1, roughly every 40ms
     *   onWarn:()=>void,              the cap is close
     *   onCap:()=>void,               the cap was hit; the hold has ended
     *   onError:(why:string)=>void,
     *   vocab:string[],
     * }} on
     */
    async start(on) {
      if (!canCapture || live) return;
      hooks = on || {};
      chunks = [];
      frames = 0;
      settled = '';
      live = true;
      opened = false;
      const id = ++holdId;

      try {
        await openMic();
      } catch (err) {
        if (id !== holdId) return;               // let go during the prompt
        live = false;
        closeMic();
        const denied = err && (err.name === 'NotAllowedError' ||
                               err.name === 'SecurityError');
        hooks.onError && hooks.onError(denied ? 'mic-denied' : 'failed');
        return;
      }

      /* Let go while the permission sheet was up. The mic opened into a
         hold that is already over, so shut it again and say nothing. */
      if (id !== holdId || !live) { closeMic(); return; }

      /* Only now is it true. Everything between pressing the button and
         this line is the browser deciding whether to allow a microphone,
         which the first time is a dialog and a person reading it. */
      opened = true;
      hooks.onLive && hooks.onLive();

      startPreview();
      warnTimer = setTimeout(() => hooks.onWarn && hooks.onWarn(), WARN_SECONDS * 1000);
      capTimer = setTimeout(() => {
        if (!live) return;
        hooks.onCap && hooks.onCap();            // app.js calls stop() itself
      }, MAX_SECONDS * 1000);
    },

    /**
     * Let go. Resolves to the finished text, which may be empty.
     *
     * There is a wait in here — the upload and the model — and the caller
     * is expected to say so on screen. If any of it fails, this resolves
     * with whatever the browser engine managed rather than rejecting: the
     * point of the button is that the thought gets out of your head.
     *
     * @returns {Promise<{text:string, source:'model'|'browser'|'none'|'no-mic', lang:?string}>}
     */
    async stop() {
      if (!live) return { text: clean(settled), source: settled ? 'browser' : 'none', lang: null };
      const id = holdId;
      live = false;

      stopPreview();
      /* joined() is already a full second copy of the recording, and at
         130 seconds of 48 kHz input that is 25 MB apiece. Dropping the
         chunk list before resampling lets the first one go rather than
         holding three at once on a phone. */
      const raw = joined();
      chunks = [];
      const pcm = resample(raw, capRate, RATE);
      const rough = clean(settled);
      closeMic();

      const seconds = pcm.length / RATE;
      if (!pcm.length || !heardAnything(pcm)) {
        /* Nothing was captured. Whether that is because they said nothing
           or because the microphone never opened is not a distinction the
           caller can make from an empty string, and the two want opposite
           advice — one is "hold it down and talk", the other is "your
           browser is not letting us hear you". */
        const why = opened ? 'none' : 'no-mic';
        return { text: rough, source: rough ? 'browser' : why, lang: null };
      }

      try {
        const out = await transcribe(pcm, seconds, hooks.vocab);
        if (id !== holdId) return { text: '', source: 'none', lang: null };  // superseded
        if (!out.text) return { text: rough, source: rough ? 'browser' : 'none', lang: null };
        return { text: out.text, source: 'model', lang: out.lang };
      } catch (err) {
        console.warn('transcription unavailable, keeping the rough one:', err.message);
        return { text: rough, source: rough ? 'browser' : 'none', lang: null };
      }
    },

    /** Throw the hold away without transcribing it — the sheet is closing. */
    abandon() {
      if (!live) return;
      live = false;
      opened = false;
      holdId++;
      stopPreview();
      closeMic();
      chunks = [];
      frames = 0;
      settled = '';
    },
  };
})();
