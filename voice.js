/* ============================================================
   my.adhd — hold to talk

   What this file is for: the thought you have on the bus is gone by the
   time you have found a keyboard. Typing is the narrowest part of the
   funnel in an app whose whole loop is "get it out of your head", so
   there is a second way in.

   The browser does the transcribing. There is no audio upload, no
   third-party API and no key: SpeechRecognition runs on the platform's
   own engine and hands back text. That keeps the promise the rest of
   the app makes — opening it touches nothing — and it keeps this
   feature free.

   The cost of that is coverage. SpeechRecognition is Chrome, Edge and
   Safari, and on an iPhone saved to the home screen it is unreliable
   enough not to be worth promising. So this file answers one question
   first — available() — and app.js hides the button outright when the
   answer is no. Nobody is shown a mic that will not work.

   One deliberate difference from ordinary dictation: it does not stop
   for silence. A dump is "the rent thing... uh... and the car
   insurance" with five seconds in the middle, and every engine treats
   five seconds of nothing as the end of the sentence. Here the only
   thing that ends a recording is letting go of the button, so onend
   during a live hold restarts rather than finishes.
   ============================================================ */

(function () {
  const Rec = window.SpeechRecognition || window.webkitSpeechRecognition;

  let rec = null;
  let live = false;          // the finger is still down
  let settled = '';          // everything the engine has called final
  let hooks = {};

  /* Restarting on a silence-stop makes for a lot of onend/onstart churn,
     and Chrome will refuse a start() that lands while the previous
     instance is still winding down. A fresh instance per leg sidesteps
     the whole question. */
  function build() {
    const r = new Rec();
    r.continuous = true;
    r.interimResults = true;
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

    r.onerror = (e) => {
      /* no-speech is the engine saying it heard nothing yet, which on a
         held button is not an error — it is a pause. Everything else
         ends the hold and is worth telling someone about. */
      if (e.error === 'no-speech' || e.error === 'aborted') return;
      live = false;
      hooks.onError && hooks.onError(
        e.error === 'not-allowed' || e.error === 'service-not-allowed'
          ? 'mic-denied'
          : 'failed'
      );
    };

    /* The silence stop. Still holding means it is not over. */
    r.onend = () => {
      if (!live) return;
      try { rec = build(); rec.start(); }
      catch (_) { live = false; hooks.onError && hooks.onError('failed'); }
    };

    return r;
  }

  /* Engines run words together across restarts and leave leading spaces
     on each leg. One space between things, none at the front. */
  function clean(s) {
    return s.replace(/\s+/g, ' ').replace(/^\s+/, '');
  }

  window.Voice = {
    /** False means app.js never shows the button at all. */
    available: () => !!Rec,

    /** True while a hold is in progress. */
    live: () => live,

    /**
     * Begin a hold.
     * @param {{onText:(text:string)=>void, onError:(why:string)=>void}} on
     */
    start(on) {
      if (!Rec || live) return;
      hooks = on || {};
      settled = '';
      live = true;
      try { rec = build(); rec.start(); }
      catch (_) { live = false; hooks.onError && hooks.onError('failed'); }
    },

    /** Let go. Returns the final text, which may be empty. */
    stop() {
      if (!live) return clean(settled);
      live = false;
      try { rec && rec.stop(); } catch (_) {}
      rec = null;
      return clean(settled);
    },
  };
})();
