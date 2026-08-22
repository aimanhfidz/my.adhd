/* ============ my.adhd — the theme, for every page ============
   One controller so the landing page, the guide and the app agree on
   what "light" means and share a single stored choice.

   Loaded synchronously from <head>: the data-theme stamp has to land
   before first paint, or a saved dark choice arrives as a white flash.

   Light is the default. The system preference does not decide — the
   toggle does, and until it is used every page stays light. */
(function () {
  const KEY = 'myadhd.theme';
  const listeners = [];

  function stored() {
    try {
      const t = localStorage.getItem(KEY);
      return t === 'dark' || t === 'light' ? t : null;
    } catch (_) { return null; }
  }

  function active() { return stored() || 'light'; }

  function paint(theme) {
    document.documentElement.dataset.theme = theme;
    // The status bar and the rubber-band area read this, not the stylesheet.
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', theme === 'dark' ? '#101018' : '#FFFFFF');
    document.querySelectorAll('.theme-toggle').forEach((b) => {
      b.setAttribute('aria-label', theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode');
    });
    listeners.forEach((fn) => fn(theme));
  }

  function set(theme) {
    try { localStorage.setItem(KEY, theme); } catch (_) {}
    paint(theme);
  }

  window.myadhdTheme = {
    active,
    set,
    toggle() { set(active() === 'dark' ? 'light' : 'dark'); },
    /** Called on every change, and once as soon as the page is ready. */
    onChange(fn) { listeners.push(fn); },
  };

  // before paint — only the stamp, the DOM is not up yet
  document.documentElement.dataset.theme = active();

  document.addEventListener('DOMContentLoaded', () => {
    paint(active());
    document.querySelectorAll('.theme-toggle').forEach((b) => {
      b.addEventListener('click', () => window.myadhdTheme.toggle());
    });
  });
})();
