/* ============================================================
   my.adhd — the notes page

   Reads what people sent from the feedback screen. Everything on this
   page is presentation; the access decision belongs to
   /api/admin-feedback and is made there, against ADMIN_EMAILS, on the
   server. Hiding the list from a signed-out visitor is politeness. The
   reason a stranger cannot read the notes is that the API declines to
   send them.

   Which is why a 403 here is rendered as an ordinary answer rather than a
   failure: it is the system working.
   ============================================================ */

(function () {
  const $ = (id) => document.getElementById(id);

  const gate     = $('admin-gate');
  const gateText = $('admin-gate-text');
  const body     = $('admin-body');
  const list     = $('admin-list');
  const who      = $('admin-who');
  const sub      = $('admin-sub');
  const waves    = $('admin-waves');

  function show(view) {
    gate.classList.toggle('is-hidden', view !== 'gate');
    body.classList.toggle('is-hidden', view !== 'body');
    /* Every route out of the body view takes the workbench link with it —
       signing out, a 403, a session that expired while the tab sat open.
       Turning it back on is a single deliberate line further down, after
       the API has answered, rather than the default this would become if
       it were tied to the view. */
    if (view !== 'body') waves.hidden = true;
  }

  /* Local time, and spelled out. A list of notes is read by one person
     glancing at it, so "25 Aug, 14:32" beats an ISO string every time. */
  function stamp(iso) {
    const d = new Date(iso);
    return d.toLocaleString(undefined, {
      day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
    });
  }

  function paintNotes(notes) {
    list.innerHTML = '';

    if (!notes.length) {
      const empty = document.createElement('p');
      empty.className = 'admin-empty';
      empty.textContent = 'Nothing yet. The box is open — nobody has written.';
      list.appendChild(empty);
      sub.textContent = 'No notes yet.';
      return;
    }

    sub.textContent = notes.length === 1
      ? '1 note, newest first.'
      : `${notes.length} notes, newest first.`;

    notes.forEach(n => {
      const card = document.createElement('article');
      card.className = 'note';

      const when = document.createElement('p');
      when.className = 'note-when';
      when.textContent = stamp(n.created_at);

      /* textContent, not innerHTML. This is the one screen in the whole
         project that renders text a stranger typed, so it is the one
         place where getting this wrong would actually matter. */
      const text = document.createElement('p');
      text.className = 'note-body';
      text.textContent = n.body;

      card.appendChild(when);
      card.appendChild(text);
      list.appendChild(card);
    });
  }

  async function load() {
    const token = await auth.token();
    if (!token) { show('gate'); return; }

    who.textContent = (auth.user() && auth.user().email) || '';

    let res;
    try {
      res = await fetch('/api/admin-feedback', {
        headers: { Authorization: 'Bearer ' + token },
      });
    } catch (_) {
      show('body');
      list.innerHTML = '';
      const p = document.createElement('p');
      p.className = 'admin-empty';
      p.textContent = 'Could not reach the server.';
      list.appendChild(p);
      return;
    }

    if (res.status === 401) { await auth.signOut(); show('gate'); return; }

    if (res.status === 403) {
      /* Signed in, but not on the list. Says so plainly rather than
         pretending the page is broken. */
      show('gate');
      gateText.textContent =
        `Signed in as ${(auth.user() && auth.user().email) || 'someone else'}, `
        + 'which is not an account that can read these.';
      $('admin-in').textContent = 'Sign in as someone else';
      return;
    }

    show('body');

    if (!res.ok) {
      list.innerHTML = '';
      const p = document.createElement('p');
      p.className = 'admin-empty';
      p.textContent = res.status === 503
        ? 'Not configured — ADMIN_EMAILS is not set on the server.'
        : 'Could not read the notes.';
      list.appendChild(p);
      return;
    }

    /* The one place this is turned on. Not on `show('body')`, which an
       unreachable server and an unconfigured one both reach as well — and
       a link offered on the strength of a failure is a link that does not
       work. Only a 200 is a yes. */
    waves.hidden = false;

    const data = await res.json().catch(() => ({ notes: [] }));
    paintNotes(data.notes || []);
  }

  $('admin-in').addEventListener('click', () => auth.signIn());
  $('admin-out').addEventListener('click', async () => {
    await auth.signOut();
    show('gate');
    gateText.textContent = 'Sign in to read the notes.';
  });

  (async () => {
    if (!window.auth || !auth.configured()) {
      show('gate');
      gateText.textContent = 'Sign-in is not configured on this build.';
      $('admin-in').classList.add('is-hidden');
      return;
    }
    try { await auth.absorbRedirect(); } catch (_) {}
    if (auth.signedIn()) await load();
    else show('gate');
  })();
})();
