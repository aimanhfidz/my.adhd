/* ============ my.adhd — the bar's clock ============
   The visitor's own city and the time it is there, at the end of the nav.

   No lookup and no request: the browser's own zone name already carries
   the city, and the last segment of it is the only part a person reads.
   A browser that will not name its zone gets no clock rather than a
   guess, which is why the markup ships hidden and this turns it on.

   Loaded deferred — the bar is chrome, and nothing here needs to land
   before first paint the way the theme stamp does. */
(function () {
  const el = document.querySelector('.nav-clock');
  if (!el) return;

  let zone = '';
  try { zone = Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (_) {}
  if (!zone) return;

  const place = el.querySelector('.nc-place');
  const time = el.querySelector('.nc-time');
  // Asia/Kuala_Lumpur → KUALA LUMPUR (uppercased by the stylesheet, so the
  // title stays readable to anything that reads the text itself)
  const fmt = new Intl.DateTimeFormat(document.documentElement.lang || 'en', {
    hour: 'numeric', minute: '2-digit',
  });

  place.textContent = zone.split('/').pop().replace(/_/g, ' ');

  function tick() {
    time.textContent = fmt.format(new Date());
    el.hidden = false;
  }

  /* On the minute, not a minute after load — a clock that changes at :37
     is a clock that is wrong for most of every minute. */
  let timer;
  function schedule() {
    clearTimeout(timer);
    const now = new Date();
    timer = setTimeout(() => { tick(); schedule(); },
      60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 40);
  }

  tick();
  schedule();

  /* A backgrounded tab has its timers throttled or stopped outright, so
     the bar can come back showing a time from several minutes ago. Repaint
     on the way in rather than trusting the timer to have survived. */
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) { tick(); schedule(); }
  });
})();
