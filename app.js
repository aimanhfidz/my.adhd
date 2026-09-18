/* ============================================================
   my.adhd — Brain Dump -> Auto-Triage -> One Task
   Storage: localStorage, always, account or not — the app opens with no
   network and no signup, which is the whole point. An optional account
   adds a second copy in cloud.js so the lists reach your other devices;
   nothing here reads from it.
   ============================================================ */

const STORE_KEY = 'myadhd.v1';
const $ = (id) => document.getElementById(id);

const el = {
  screenHome:   $('screen-home'),
  screenLoad:   $('screen-loading'),
  screenNow:    $('screen-now'),
  input:        $('dump-input'),
  btnSettings:  $('btn-settings'),
  homeWidgets:  $('home-widgets'),
  homeTodayTitle: $('home-today-title'),
  homeTodayMore:  $('home-today-more'),
  homeTodayRows:  $('home-today-rows'),
  homeTodayEmpty: $('home-today-empty'),
  homeStart:    $('home-start'),
  btnStartDump: $('btn-start-dump'),
  loadingText:  $('loading-text'),
  eyebrow:      $('eyebrow'),
  summary:      $('lists-summary'),
  lists:        $('lists'),
  doneBlock:    $('done-block'),
  doneToggle:   $('done-toggle'),
  doneCount:    $('done-count'),
  doneList:     $('done-list'),
  catBar:       $('cat-bar'),
  offlineNote:  $('offline-note'),
  offlineCount: $('offline-count'),
  offlineWord:  $('offline-word'),
  btnResort:    $('btn-resort'),
  dangerZone:   $('danger-zone'),
  btnClearAll:  $('btn-clear-all'),
  clearConfirm: $('clear-confirm'),
  clearText:    $('clear-confirm-text'),
  btnClearGo:   $('btn-clear-go'),
  btnClearNo:   $('btn-clear-cancel'),
  btnDumpAgain: $('btn-dump-again'),
  clearedNote:  $('cleared-note'),
  toast:        $('toast'),
  scroller:     $('app'),

  screenCal:    $('screen-calendar'),
  calMonth:     $('cal-month'),
  calPrev:      $('cal-prev'),
  calNext:      $('cal-next'),
  calMonths:    $('cal-months'),
  calGridBack:  $('cal-grid-prev'),
  calGrid:      $('cal-grid'),
  calGridFwd:   $('cal-grid-next'),
  calToday:     $('cal-today'),
  calAgenda:    $('cal-agenda'),
  calUndated:   $('cal-undated'),
  screenNotes:  $('screen-notes'),
  notesSummary: $('notes-summary'),
  notesList:    $('notes-list'),
  notesEmpty:   $('notes-empty'),
  notesNote:    $('notes-note'),
  btnNoteNew:   $('btn-note-new'),
  btnNoteFirst: $('btn-note-first'),

  /* The editor, a screen of its own. Not in TAB_FOR, so the bar stands
     down while you are writing and the toolbar takes the bottom. */
  screenNote:   $('screen-note'),
  noteHeading:  $('note-heading'),
  noteTitle:    $('note-title'),
  noteBlocks:   $('note-blocks'),
  noteFiles:    $('note-files'),
  noteRemind:   $('note-remind'),
  btnNoteBack:  $('btn-note-back'),
  btnNoteDone:  $('btn-note-done'),
  btnNoteDelete: $('btn-note-delete'),
  noteFileInput: $('note-file-input'),
  toolType:     $('tool-type'),
  toolCheck:    $('tool-check'),
  toolClip:     $('tool-clip'),
  toolBell:     $('tool-bell'),
  sheetFormat:  $('sheet-format'),
  sheetPaper:   $('sheet-paper'),
  paperClose:   $('paper-close'),
  paperRow:     $('paper-row'),
  toolPaper:    $('tool-paper'),
  fmtFont:      $('fmt-font'),
  fmtTypes:     $('fmt-types'),
  fmtMarks:     $('fmt-marks'),
  fmtAlign:     $('fmt-align'),
  fmtClose:     $('fmt-close'),
  sheetRemind:  $('sheet-remind'),
  remDay:       $('rem-day'),
  remTime:      $('rem-time'),
  remRepeat:    $('rem-repeat'),
  remSave:      $('rem-save'),
  remClear:     $('rem-clear'),
  remClose:     $('rem-close'),

  screenSettings: $('screen-settings'),
  btnSettingsBack: $('btn-settings-back'),
  setSub:       $('set-sub'),
  setPro:       $('set-pro'),
  setProTitle:  $('set-pro-title'),
  setProNote:   $('set-pro-note'),
  setRowProfile: $('set-row-profile'),
  setFace:      $('set-face'),
  setProfileNote: $('set-profile-note'),
  setRowFeedback: $('set-row-feedback'),
  setRowShare:  $('set-row-share'),

  screenProfile: $('screen-profile'),
  btnProfileBack: $('btn-profile-back'),

  screenFeedback: $('screen-feedback'),
  btnFeedbackBack: $('btn-feedback-back'),

  screenPlans:  $('screen-plans'),
  btnPlansBack: $('btn-plans-back'),
  plansList:    $('plans-list'),
  plansCurrent: $('plans-current'),
  plansCurrentTitle: $('plans-current-title'),
  plansCurrentState: $('plans-current-state'),
  plansManage:  $('plans-manage'),
  plansNote:    $('plans-note'),
  fbForm:       $('fb-form'),
  fbInput:      $('fb-input'),
  fbCount:      $('fb-count'),
  fbSend:       $('fb-send'),
  fbThanks:     $('fb-thanks'),
  fbThanksText: $('fb-thanks-text'),
  fbGive:       $('fb-give'),
  fbGiveBtn:    $('fb-give-btn'),
  fbGiveQuiet:  $('fb-give-quiet'),
  fbGiveQuietLink: $('fb-give-quiet-link'),
  tabbar:       $('tabbar'),
  tabHome:      $('tab-home'),
  tabCal:       $('tab-calendar'),
  tabAdd:       $('tab-add'),
  tabLists:     $('tab-lists'),
  tabNotes:     $('tab-notes'),
  tabMarkLists: $('tab-mark-lists'),
  tabBadgeCal:  $('tab-badge-cal'),
  composer:     $('composer'),
  compSheet:    document.querySelector('.composer-sheet'),
  compBody:     document.querySelector('.composer-body'),
  compScrim:    $('composer-scrim'),
  compCancel:   $('composer-cancel'),
  compPost:     $('composer-post'),
  compFace:     $('composer-face'),
  compName:     $('composer-name'),
  compInput:    $('composer-input'),
  compDates:    $('composer-dates'),
  compChips:    $('composer-chips'),
  compVoice:    $('composer-voice'),
  compMic:      $('composer-mic'),
  compMicHint:  $('composer-mic-hint'),
  avatarBig:    $('avatar-big'),
  avatarPick:   $('avatar-picker'),
  greeting:     $('profile-greeting'),
  nameInput:    $('profile-name'),
  statOpen:     $('stat-open'),
  statDone:     $('stat-done'),
  statLists:    $('stat-lists'),
  statDated:    $('stat-dated'),
  statOverdue:  $('stat-overdue'),
  statOverdueCard: $('stat-overdue-card'),

  gcalCard:     $('gcal-card'),
  gcalState:    $('gcal-state'),
  gcalNote:     $('gcal-note'),
  gcalBtn:      $('gcal-btn'),
  gcalOpen:     $('gcal-open'),
  gcalOff:      $('gcal-off'),
  gcalDupe:     $('gcal-dupe'),
  gcalDupeNote: $('gcal-dupe-note'),
  gcalDupeBtn:  $('gcal-dupe-btn'),
  localNote:    $('local-note'),

  acctCard:     $('acct-card'),
  acctFace:     $('acct-face'),
  acctTitle:    $('acct-title'),
  acctState:    $('acct-state'),
  acctNote:     $('acct-note'),
  acctBtn:      $('acct-btn'),
  acctHint:     $('acct-hint'),
  acctOut:      $('acct-out'),
  acctDanger:   $('acct-danger'),
  btnAcctDelete:       $('btn-acct-delete'),
  acctDeleteConfirm:   $('acct-delete-confirm'),
  acctDeleteText:      $('acct-delete-text'),
  btnAcctDeleteCancel: $('btn-acct-delete-cancel'),
  btnAcctDeleteGo:     $('btn-acct-delete-go'),
  signupOffer:  $('signup-offer'),
  signupYes:    $('signup-yes'),
  signupNo:     $('signup-no'),
};

/* ---------------- state ---------------- */

let state = {
  tasks: [],          // {id,title,minutes,energy,urgency,firstStep,category,steps,done,skipped}

  /* {id,title,body,createdAt,updatedAt}. Inside this store rather than a
     key of their own, which matters more than it looks: the iOS shell
     patches Storage.setItem and only listens for 'myadhd.v1', so a note
     written to myadhd.notes.v1 would be a write the phone never hears.
     Nothing sorts these, nothing triages them, none of them is a task. */
  notes: [],

  profile: { name: '', avatar: '🧔🏻' },   // this device only — no account behind it
  sentFeedbackOn: null,   // the UTC day of the last note sent from this device

  /* The onboarding offer, once turned down, stays turned down. */
  signupOfferHidden: false,

  /* Calendar events whose task no longer exists to hang them off. A task
     is deleted from the store the moment you remove it, which would strand
     its event in Google for ever — so the event id is dropped here on the
     way out and the sync clears it on the next pass. */
  gcalOrphans: [],
  /* How many tasks were finished on each day, "YYYY-MM-DD" -> n, counted by
     pruneDone() at the moment it deletes them. The tasks themselves only
     live seven days after they are done, so without this the Done widget
     could never show more than a week. Device-local, like the notes. */
  doneCounts: {},
};

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state = Object.assign(state, saved);
      // A store written before the profile existed has no profile key, and
      // one written by a half-finished edit may be missing a field.
      state.profile = Object.assign({ name: '', avatar: '🧔🏻' }, saved.profile || {});

      /* Same reason, one level up: every store written before the notes
         existed has no notes key at all, and the assign above would leave
         whatever was there — including a stray non-array from a hand-edited
         store — for renderNotes() to fall over on. */
      state.notes = Array.isArray(saved.notes) ? saved.notes.map(normalizeNote) : [];

      /* The fuel selector and the matrix are gone, but a store written while
         they existed still carries the choices — and the assign above would
         copy them straight back in and write them out again on the next save.
         They come off once, here. */
      delete state.energy;
      delete state.view;
    }
  } catch (_) { /* corrupt store — start fresh rather than crash */ }
}

/* The store, written and nothing else. cloud.js uses this after a merge:
   the tasks that just came down are already stamped with the timestamps
   they arrived carrying, and running them back through save() would
   restamp them as local edits and bounce them straight up again. */
function persistOnly() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {}
}

function save() {
  /* Before the write, so what lands on disk carries the timestamps the
     other devices will settle conflicts on. Free when signed out — it is
     one hash per task and no network. */
  if (window.cloud) cloud.stamp();
  persistOnly();
  syncSoon();   // no-op unless the calendar is linked
  if (window.cloud) cloud.soon();   // no-op unless there is an account
}

/* How long a finished task stays in the "N done" pile before it is dropped
   for good. Long enough that undo is still there the next day, short
   enough that the store does not grow without limit — every task ever
   ticked was being kept, re-rendered on every visit to the lists, and
   counted on the profile for ever. */
const DONE_TTL = 7 * 24 * 60 * 60 * 1000;

/** How many of the done pile are drawn. The rest are counted, not listed. */
const DONE_SHOWN = 20;

/* Called once at startup, before anything is drawn.

   Tasks stored before `when` and `at` were settled together: the model
   heard "eat at 8am", returned the time and no day, and normalizeTask kept
   the two as independent fields. The result sat under "No date yet" with
   the hour invisible, because every reader downstream keys off `when`.

   They are stamped rather than left, because a time is timing and the
   whole point of this app is not making somebody re-enter what they
   already said. Anything already done is left alone — moving a finished
   task onto tomorrow would be a lie about a thing that has happened.

   Idempotent: once stamped, `when` is set and this never sees them again. */
function stampTimeOnly() {
  let stamped = 0;

  state.tasks.forEach(t => {
    if (t.done || t.when || !t.at) return;
    const day = dayForTime(t.at);
    if (!day) return;
    t.when = day;
    stamped++;
  });

  if (stamped) persistOnly();
  return stamped;
}

/* A store written before doneAt existed has finished tasks with no stamp.
   They are stamped now rather than dropped: a missing timestamp means we
   do not know when it happened, and guessing "long ago" would silently
   delete the pile the first time someone opened the updated app. */
function pruneDone() {
  const now = Date.now();
  let stamped = 0;

  state.tasks.forEach(t => {
    if (t.done && !t.doneAt) { t.doneAt = now; stamped++; }
  });

  const before = state.tasks.length;
  const keep = [];
  if (!state.doneCounts || typeof state.doneCounts !== 'object') state.doneCounts = {};
  state.tasks.forEach(t => {
    if (!t.done || now - t.doneAt < DONE_TTL) { keep.push(t); return; }
    /* Counted on its way out, on the day it was finished. This is the only
       record of it once the row is gone. */
    const day = dayKey(new Date(t.doneAt));
    state.doneCounts[day] = (state.doneCounts[day] || 0) + 1;
    orphanEvent(t);   // it is about to stop existing; its event must not outlive it
  });
  state.tasks = keep;

  /* Bounded: a year and change of small integers, oldest days dropped. */
  const days = Object.keys(state.doneCounts).sort();
  while (days.length > 400) delete state.doneCounts[days.shift()];

  if (stamped || state.tasks.length !== before) save();
}

/* Redraw whatever is on screen, because the lists changed underneath it —
   another device added, edited or removed something. Only ever called
   when a pull actually moved something, so it cannot loop with the save()
   that goToNext() does on its way through. */
function repaintLists() {
  /* Ask which screen is up rather than guessing at the end. The old form
     tested the notes by hand and fell back to home, which was right while
     there were four screens and starts lighting the wrong tab the moment
     there are nine. */
  const on = SCREENS.find(s => !s.classList.contains('is-hidden'));

  if      (on === el.screenNow)      goToNext();
  else if (on === el.screenCal)      renderCalendar();
  else if (on === el.screenHome)     renderHome();
  else if (on === el.screenSettings) paintSettings();
  /* Notes, profile, feedback, the plans and the wait hold nothing a pull
     can move — but the marks on the bar over them still do. */
  else syncTabs(on || el.screenHome);
}

/* ---------------- screens ---------------- */

const SCREENS = [el.screenHome, el.screenLoad, el.screenNow,
                el.screenCal, el.screenNotes, el.screenNote, el.screenSettings,
                el.screenProfile, el.screenFeedback, el.screenPlans];

/* Which tab lights up on which screen, in the order the bar draws them.
   The wait is not a section, and neither is settings or any of the three
   screens under it — the bar hides for all five, so none of them gets an
   entry. Settings especially: it is reached from home rather than from
   the bar, and a lit tab under it would be claiming you are somewhere you
   are not. */
const TAB_FOR = new Map([
  [el.screenHome,  el.tabHome],
  [el.screenCal,   el.tabCal],
  [el.screenNow,   el.tabLists],
  [el.screenNotes, el.tabNotes],
]);

function show(screen) {
  SCREENS.forEach(s => s.classList.add('is-hidden'));
  screen.classList.remove('is-hidden');
  el.scroller.scrollTop = 0;   // the page scrolls inside #app, not the document
  syncTabs(screen);
}

/** Show the bar on every section, hide it on the wait and on settings and
    the screens under it. It stays up on a cold start now: the + in the
    middle of it is the only way to add anything. */
function syncTabs(screen) {
  const current = TAB_FOR.get(screen);
  const show = !!current;
  el.tabbar.classList.toggle('is-hidden', !show);
  document.body.classList.toggle('has-tabbar', show);

  TAB_FOR.forEach(tab => {
    const on = tab === current;
    tab.classList.toggle('is-on', on);
    if (on) tab.setAttribute('aria-current', 'page');
    else tab.removeAttribute('aria-current');
  });

  const today = dayKey();

  /* The lists mark has two states. A plain dot for "there is something over
     there", which is all it needs to say on a good day — and a count the
     moment any of it has gone past its day, because how many you have
     missed is worth a number where merely having tasks is not.

     Overdue things are open things, so the count can never outrun the dot
     and one mark carries both without them contradicting each other.
     Either way it hides once you are on the lists tab. */
  const open = state.tasks.filter(t => !t.done).length;
  const late = overdueTasks(today).length;
  const mark = el.tabMarkLists;

  mark.classList.toggle('tab-dot', late === 0);
  mark.classList.toggle('tab-badge', late > 0);
  mark.classList.toggle('is-late', late > 0);
  mark.textContent = late > 0 ? (late > 99 ? '99+' : String(late)) : '';
  mark.classList.toggle('is-hidden', open === 0 || current === el.tabLists);

  /* The calendar carries a count rather than a dot: how many things have a
     day on them, the same number home counts as "on the calendar".

     That number is lit most of the time, so on its own it would say little
     — which is why the urgency lives in the colour instead. Orange the
     moment any of them is due today or already past, accent otherwise. The
     badge answers "how much is scheduled", the colour answers "does any of
     it want me now". */
  const dated = state.tasks.filter(scheduled);
  const overdue = dated.some(t => t.when <= today);

  el.tabBadgeCal.textContent = dated.length > 99 ? '99+' : String(dated.length);
  el.tabBadgeCal.classList.toggle('is-late', overdue);
  el.tabBadgeCal.classList.toggle('is-hidden', dated.length === 0 || current === el.tabCal);
}

/* Set while the app itself writes the dump buffer — see writeBuffer(). */
let ownWrite = false;

let toastTimer;

/* `action` turns the toast into the undo for whatever just happened:
   {label, fn}. It gets a longer life than a plain message, because a
   message only has to be read and an offer has to be reached. */
function toast(msg, action = null) {
  el.toast.textContent = '';
  const text = document.createElement('span');
  text.textContent = msg;
  el.toast.appendChild(text);

  if (action) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = 'toast-do';
    btn.textContent = action.label;
    btn.addEventListener('click', () => {
      clearTimeout(toastTimer);
      el.toast.classList.add('is-hidden');
      action.fn();
    });
    el.toast.appendChild(btn);
  }

  el.toast.classList.toggle('toast--action', !!action);
  el.toast.classList.remove('is-hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.add('is-hidden'), action ? 6000 : 2600);
}

const LOADING_LINES = [
  'Untangling that…',
  'Sorting the noise from the signal…',
  'Finding the one that matters…',
  'Sizing everything up…',
];
let loadingTimer;

function startLoadingCopy() {
  /* The browser pauses a video inside a display:none screen and does not
     resume it when the screen is shown again, so the wait has to start the
     morph itself. Rewound each time, so every wait opens on beat 01. */
  if (morph && !stillMode) {
    morph.currentTime = 0;
    morph.play().catch(() => {});   // autoplay policy: never fatal, just still
  }
  let i = 0;
  el.loadingText.textContent = LOADING_LINES[0];
  loadingTimer = setInterval(() => {
    i = (i + 1) % LOADING_LINES.length;
    el.loadingText.textContent = LOADING_LINES[i];
  }, 1900);
}
function stopLoadingCopy() {
  clearInterval(loadingTimer);
  if (morph) morph.pause();   // nothing decodes behind the lists
}

/* ---------------- triage ---------------- */

/* Set by the mic when a transcript lands, read once by triage() and then
   thrown away. It is what tells the extractor that these are somebody's
   spoken words rather than their typed ones, which changes how much
   liberty it is allowed to take with them — see api/triage.js.

   Null means typed, and typing is the assumption. Anything that puts new
   text in front of the user without the mic having produced it clears
   this, because inviting repairs on words someone chose themselves means
   watching their own sentences get rewritten under them. */
let spokenDump = null;

/* The app's own way into the buffer. A plain assignment fires no input
   event, but the shell's does — so this sets a flag around the write and
   the listener at the bottom of this file knows the difference between the
   app moving text about and somebody dictating into it. */
function writeBuffer(text) {
  ownWrite = true;
  el.input.value = text;
  ownWrite = false;
}

async function triage() {
  const text = el.input.value.trim();
  /* Only reachable if the buffer was emptied between the composer closing
     and this running — the composer refuses to send an empty sheet. */
  if (!text) { toast('Give me something to work with.'); return; }

  show(el.screenLoad);
  startLoadingCopy();

  const spoken = spokenDump;
  spokenDump = null;

  let tasks;
  try {
    tasks = await parseWithAI(text, spoken);
  } catch (err) {
    console.warn('AI triage unavailable, using local parser:', err.message);
    tasks = parseLocally(text);
    toast('Offline mode — sorted these myself.');
  }
  stopLoadingCopy();

  if (!tasks.length) {
    show(el.screenHome);
    toast("Couldn't find any tasks in there.");
    return;
  }

  // A dump adds to the lists. Nothing you already captured gets thrown away
  // just because you thought of something else.
  const seen = new Set(
    state.tasks.filter(t => !t.done).map(t => t.title.trim().toLowerCase())
  );
  const fresh = tasks.filter(t => !seen.has(t.title.trim().toLowerCase()));
  const dupes = tasks.length - fresh.length;

  state.tasks = state.tasks.concat(fresh);
  save();
  writeBuffer('');
  goToNext();

  if (dupes) {
    toast(dupes === 1
      ? 'Added — one was already on a list.'
      : `Added — ${dupes} were already on a list.`);
  } else if (fresh.length) {
    toast(`Added ${fresh.length} to your lists.`);
  }
}

/** Ask Claude (via the serverless function) to turn a raw dump into structured tasks. */
async function parseWithAI(text, spoken = null) {
  const res = await fetch('/api/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      mode: 'triage', text, today: dayKey(),
      /* Only sent for a dump that was actually spoken. `source` matters as
         much as the flag: a transcript from the audio model is already
         repaired and wants leaving alone, and one from the browser engine
         is the mangled kind that needs reading back phonetically. */
      ...(spoken ? { spoken: spoken.source, lang: spoken.lang, vocab: knownNames() } : {}),
    }),
  });
  if (!res.ok) throw new Error('triage endpoint returned ' + res.status);
  const data = await res.json();
  if (!Array.isArray(data.tasks) || !data.tasks.length) throw new Error('no tasks in response');
  return data.tasks.map(normalizeTask);
}

/* ---------------- dates ----------------
   A task carries two separate fields, not one instant: `when` is a day
   (YYYY-MM-DD) and `at` is a clock time (HH:MM), either of which can be
   null. "9 March" gives a day with no time; "tomorrow at 4" gives both.
   Folding them into one timestamp would force a fake time onto every
   dateless day, and storing that as UTC would shunt half of them onto the
   wrong date. Everything below is deliberately local-time. */

const pad2 = (n) => String(n).padStart(2, '0');

/** The local calendar day as YYYY-MM-DD. Never toISOString — that is UTC. */
function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function keyToDate(key) {
  const [y, m, d] = key.split('-').map(Number);
  return new Date(y, m - 1, d);
}

function addDays(d, n) {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/* A clock time on no day at all. The model returns one for "eat at 8am" —
   it heard the time, there was simply no day to attach it to — and until
   this it stayed that way: `at` set, `when` null. Everything downstream
   keys off `when`, so dueAt() called it Infinity, bucketOf() filed it under
   "No date yet", and whenLabel() refused to print the time it did have. A
   task with an hour on it was displayed as a task with no timing at all.

   The next one, not today's. "8am" written at five in the afternoon means
   tomorrow morning; dating it to this morning hands somebody a task that
   arrives already late. Same rule parseDay() uses for a bare time, so the
   two paths cannot disagree. */
function dayForTime(at, now = new Date()) {
  const mins = clockMinutes(at);
  if (mins === null) return null;
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const when = new Date(today);
  when.setHours(Math.floor(mins / 60), mins % 60, 0, 0);
  return dayKey(when > now ? today : addDays(today, 1));
}

/** Minutes past midnight for a normalised "HH:MM", or null. */
function clockMinutes(at) {
  if (!at) return null;
  const [h, m] = String(at).split(':').map(Number);
  return Number.isFinite(h) && Number.isFinite(m) ? h * 60 + m : null;
}

/** Real date, real calendar day — rejects "2026-02-31" and anything malformed. */
function normalizeDay(v) {
  if (typeof v !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = keyToDate(v);
  return Number.isNaN(d.getTime()) || dayKey(d) !== v ? null : v;
}

function normalizeTime(v) {
  if (typeof v !== 'string') return null;
  const m = v.match(/^(\d{1,2}):(\d{2})$/);
  if (!m) return null;
  const h = Number(m[1]), min = Number(m[2]);
  return h > 23 || min > 59 ? null : `${pad2(h)}:${pad2(min)}`;
}

const MONTH_NAMES = ['January', 'February', 'March', 'April', 'May', 'June',
                     'July', 'August', 'September', 'October', 'November', 'December'];
const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

/** "4pm", "09:30", or null for a day with no time on it. */
function timeLabel(at) {
  if (!at) return null;
  const [h, m] = at.split(':').map(Number);
  const suffix = h < 12 ? 'am' : 'pm';
  const hour = h % 12 === 0 ? 12 : h % 12;
  return m === 0 ? `${hour}${suffix}` : `${hour}.${pad2(m)}${suffix}`;
}

/** The same label, fit for the middle of a sentence. "Today" wants
    lowercasing there; "Thu 27 Aug" does not — lowercasing the lot turns it
    into "thu 27 aug". */
function dayPhrase(key, today = dayKey()) {
  const label = dayLabel(key, today);
  return /^(Today|Tomorrow|Yesterday)$/.test(label) ? label.toLowerCase() : label;
}

/** "Today", "Tomorrow", "Mon 9 Mar" — relative where that reads faster. */
function dayLabel(key, today = dayKey()) {
  if (key === today) return 'Today';
  if (key === dayKey(addDays(keyToDate(today), 1))) return 'Tomorrow';
  if (key === dayKey(addDays(keyToDate(today), -1))) return 'Yesterday';
  const d = keyToDate(key);
  const name = DAY_NAMES[d.getDay()].slice(0, 3);
  const month = MONTH_NAMES[d.getMonth()].slice(0, 3);
  const year = d.getFullYear() === keyToDate(today).getFullYear() ? '' : ` ${d.getFullYear()}`;
  return `${name} ${d.getDate()} ${month}${year}`;
}

/** The whole stamp as one string: "Tomorrow · 4pm". */
function whenLabel(task, today = dayKey()) {
  if (!task.when) return null;
  const t = timeLabel(task.at);
  return t ? `${dayLabel(task.when, today)} · ${t}` : dayLabel(task.when, today);
}

const scheduled = (t) => !t.done && !!t.when;

/* ---- the offline date reader ----
   Same standing as the offline task parser: a guess, used only when the
   backend is unreachable. It reads what is written and nothing more — no
   time is invented out of "morning" or "soon", because a wrong time on the
   calendar is worse than no time at all. */

const MONTH_RE = 'jan(?:uary)?|feb(?:ruary)?|mar(?:ch)?|apr(?:il)?|may|jun(?:e)?|jul(?:y)?|aug(?:ust)?|sep(?:t|tember)?|oct(?:ober)?|nov(?:ember)?|dec(?:ember)?';
const MONTH_INDEX = { jan: 0, feb: 1, mar: 2, apr: 3, may: 4, jun: 5,
                      jul: 6, aug: 7, sep: 8, oct: 9, nov: 10, dec: 11 };

function parseClock(line) {
  const t = line.toLowerCase();

  if (/\bnoon\b|\bmidday\b/.test(t)) return '12:00';
  if (/\bmidnight\b/.test(t)) return '00:00';

  // "4pm", "4.30pm", "9:15 am"
  let m = t.match(/\b(\d{1,2})(?:[:.](\d{2}))?\s*(am|pm)\b/);
  if (m) {
    let h = Number(m[1]) % 12;
    if (m[3] === 'pm') h += 12;
    return `${pad2(h)}:${pad2(Number(m[2] || 0))}`;
  }

  // "16:00", "at 9:15" — bare 24-hour, only with a colon so "1 5 things" cannot match
  m = t.match(/\b(\d{1,2}):(\d{2})\b/);
  if (m && Number(m[1]) <= 23 && Number(m[2]) <= 59) {
    return `${pad2(Number(m[1]))}:${pad2(Number(m[2]))}`;
  }
  return null;
}

function parseDay(line, now = new Date()) {
  const t = line.toLowerCase();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  if (/\btoday\b|\btonight\b|\bthis evening\b|\bthis morning\b|\bthis afternoon\b/.test(t)) return dayKey(today);
  if (/\bday after tomorrow\b/.test(t)) return dayKey(addDays(today, 2));
  if (/\btomorrow\b|\btmr\b|\btmrw\b/.test(t)) return dayKey(addDays(today, 1));

  let m = t.match(/\bin\s+(\d{1,3})\s+days?\b/);
  if (m) return dayKey(addDays(today, Number(m[1])));
  if (/\bin\s+a\s+week\b|\bnext\s+week\b/.test(t)) return dayKey(addDays(today, 7));

  // a weekday name: the next one, or the one after that when "next" leads it
  m = t.match(/\b(next\s+)?(sun|mon|tues?|wed(?:nes)?|thur?s?|fri|sat(?:ur)?)(?:day)?\b/);
  if (m) {
    const want = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
      .indexOf(m[2].slice(0, 3).replace('tues', 'tue').replace('thur', 'thu'));
    if (want >= 0) {
      let step = (want - today.getDay() + 7) % 7;
      if (step === 0) step = 7;            // "Friday" said on a Friday means the next one
      if (m[1]) step += (step <= 6 ? 7 : 0);
      return dayKey(addDays(today, step));
    }
  }

  // "9 March" / "March 9" / "9th of March"
  m = t.match(new RegExp(`\\b(\\d{1,2})(?:st|nd|rd|th)?\\s+(?:of\\s+)?(${MONTH_RE})\\b`))
   || t.match(new RegExp(`\\b(${MONTH_RE})\\s+(\\d{1,2})(?:st|nd|rd|th)?\\b`));
  if (m) {
    const numFirst = /^\d/.test(m[1]);
    const day = Number(numFirst ? m[1] : m[2]);
    const mon = MONTH_INDEX[(numFirst ? m[2] : m[1]).slice(0, 3)];
    if (day >= 1 && day <= 31 && mon !== undefined) {
      let d = new Date(today.getFullYear(), mon, day);
      if (d < today) d = new Date(today.getFullYear() + 1, mon, day);   // it has gone: next year
      if (d.getMonth() === mon) return dayKey(d);                        // rejects 31 February
    }
  }

  /* A clock time and no day named at all. "dentist 3pm" is not someday —
     the time IS the timing, and dropping it put three perfectly scheduled
     things under "No date yet" with the hour stranded in the title.

     The next one, not today's: "8am" written at five in the afternoon
     means tomorrow morning, and dating it to this morning would hand
     somebody a task that arrives already late. Anything still ahead today
     stays today.

     Deliberately last. Every named day above wins, so "Friday 9am" is
     still Friday. And parseClock only reads a time with am/pm or a colon
     in it, so "RM9.30" and "30 min" cannot trip this. */
  const clock = parseClock(line);
  if (clock) {
    const [h, mi] = clock.split(':').map(Number);
    const at = new Date(today);
    at.setHours(h, mi, 0, 0);
    return dayKey(at > now ? today : addDays(today, 1));
  }

  return null;
}

/** No-backend fallback: split by line, guess size and urgency from wording. */
/* The offline parser. It runs only when the AI backend is unreachable, and it
   is a guess — but a guess that reads the words in front of it rather than
   defaulting everything to 20 minutes and one bucket. Tasks it produces are
   tagged `local` so the UI can say so and offer to re-sort. */

const WORD_NUM = {
  a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6,
  half: 0.5, couple: 2, few: 3,
};

/** Pull a real duration out of the line when the user wrote one. */
function parseMinutes(line) {
  const t = line.toLowerCase();

  if (/\bhalf an hour\b|\bhalf hour\b/.test(t)) return 30;
  if (/\ball day\b/.test(t)) return 240;
  if (/\ball morning\b|\ball afternoon\b/.test(t)) return 180;

  // "90 min", "45 minutes", "20m"
  let m = t.match(/(\d+)\s*(?:min(?:ute)?s?|m)\b/);
  if (m) return Number(m[1]);

  // "2 hours", "1.5 hr", "an hour", "a couple of hours"
  m = t.match(/(\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|couple|few|half)\s*(?:of\s+)?(?:hour|hr)s?\b/);
  if (m) {
    const n = Number.isNaN(Number(m[1])) ? WORD_NUM[m[1]] : Number(m[1]);
    if (n) return Math.round(n * 60);
  }

  // "2h30", "1h"
  m = t.match(/(\d+)\s*h(?:\s*(\d+))?\b/);
  if (m) return Number(m[1]) * 60 + Number(m[2] || 0);

  return null;
}

const CATEGORY_HINTS = [
  ['money',  /\b(bill|pay|paid|invoice|tax|insurance|bank|rent|mortgage|budget|refund|subscription|salary)\b/i],
  ['health', /\b(dentist|doctor|gp|gym|workout|exercise|run|physio|therapy|prescription|medicine|appointment)\b/i],
  ['home',   /\b(laundry|washing|dishes|clean|tidy|bin|hoover|vacuum|kitchen|bathroom|garden|fix|repair|bed)\b/i],
  ['social', /\b(mum|mom|mother|dad|father|friend|birthday|party|dinner|lunch|visit|text back|catch up|wedding)\b/i],
  ['errand', /\b(pick up|collect|parcel|post office|posting|shop|groceries|drop off|return|delivery|petrol|fuel)\b/i],
  ['work',   /\b(client|report|meeting|deck|slide|presentation|standup|deploy|ticket|pr\b|code|email|boss|contract)\b/i],
  ['admin',  /\b(renew|form|passport|licence|license|register|cancel|book|schedule|paperwork|apply|sign up)\b/i],
];

function guessCategory(line) {
  for (const [name, re] of CATEGORY_HINTS) if (re.test(line)) return name;
  return 'general';
}

/* Fragments that are qualifiers, not new tasks. A comma-split dump like
   "file the tax return, deadline is tomorrow" must stay one task, or the
   urgency ends up attached to a fragment with no action in it.

   Bare days belong here too. "pay rent, friday" used to come back as two
   things, the second of them a task called Friday that nobody wrote and
   nothing removes — a list with something invented on it is worse than a
   list with two errands on one line. When the reading is uncertain the
   fold-back is the safe way to be wrong: the words stay, and re-sorting
   hands the whole line to the model, which splits it properly. */
const QUALIFIER = /^(?:deadline|due|by\b|before|after|at\b|on\b|takes|taking|about|approx|around|roughly|asap|today|tonight|tomorrow|this\s|next\s|maybe|probably|ideally|urgent|i think|apparently|sometime|whenever|no rush|morning|afternoon|evening|(?:mon|tues?|wed(?:nes)?|thur?s?|fri|sat(?:ur)?|sun)(?:day)?\b|\d)/i;

/* Strip a trailing duration clause once it has been read into `minutes`.

   The connective goes with it. Without that group the clause is peeled off
   its own preposition and the word is left hanging on the end — "review doc
   in 2 hours" came back as "Review doc in". */
function tidyTitle(line) {
  return line
    .replace(/[,\s—-]*\b(?:takes?|taking)?\s*(?:in|for|over)?\s*(?:about|approx(?:imately)?|around|roughly)?\s*(?:\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|couple|few|half)\s*(?:of\s+)?(?:hours?|hrs?|min(?:ute)?s?|m|h)\b\.?$/i, '')
    .replace(/[,;\s]+$/, '')
    .trim();
}

/* Strip a trailing when-clause once it has been read into `when`/`at`.
   Sibling of tidyTitle: the stamp is already shown beside the task, so
   leaving it in the title too gives "Dinner with Sara tonight at 7.30pm"
   sitting next to a 7.30pm column. Peeled in a loop because a clause can
   stack ("tonight" + "at 7.30pm"), and only ever from the end, so a date
   in the middle of a real sentence is left alone. */
const TRAILING_WHEN = new RegExp(
  '[,;\\s\u2014-]*\\b(?:on|by|before|at|due|this|next)?\\s*(?:' +
    'today|tonight|tomorrow|tmrw?|this (?:morning|afternoon|evening)|next week|in \\d{1,3} days?|' +
    '(?:next\\s+)?(?:sun|mon|tues?|wed(?:nes)?|thur?s?|fri|sat(?:ur)?)(?:day)?|' +
    '\\d{1,2}(?:st|nd|rd|th)?\\s+(?:of\\s+)?(?:' + MONTH_RE + ')|' +
    '(?:' + MONTH_RE + ')\\s+\\d{1,2}(?:st|nd|rd|th)?|' +
    '\\d{1,2}(?:[:.]\\d{2})?\\s*(?:am|pm)|\\d{1,2}:\\d{2}|noon|midday|midnight' +
  ')\\.?$', 'i');

function tidyWhen(line) {
  let out = line;
  for (let i = 0; i < 4; i++) {
    const next = out.replace(TRAILING_WHEN, '').replace(/[,;\s]+$/, '').trim();
    if (next === out || !next) break;   // never strip a title down to nothing
    out = next;
  }
  return out;
}

/* The 2- and 3-letter verbs a dumped line is allowed to start with. The
   comma rule counts letters to tell an item from a trailing clause, and on
   its own that test threw out the shortest instructions people give
   themselves — "buy milk, pay rent, get petrol" arrived as one task.
   Naming the verbs buys back the split without also splitting off "her
   birthday is on the 12th", which is a note on the task before it. */
const SHORT_VERB = 'do|go|buy|pay|get|ask|fix|see|put|run|cut|add|try|eat|use|dry|mow|bin|top|log|set|pop|tag';

const SPLIT_ON = new RegExp(
  '\\n' +
  '|(?:,\\s+(?:and\\s+then|and|then)\\s+(?=\\w))' +
  '|(?:,\\s(?=(?:\\w{4,}|(?:' + SHORT_VERB + ')\\b)))' +
  '|(?:\\s+•\\s+)' +
  '|(?:;\\s*)'
);

/* Where one thing ends and the next begins. Pulled out of parseLocally so
   the typing preview splits the dump exactly the way the parser will —
   otherwise the chips would promise dates against lines that never end up
   being lines.

   Two things the comma rule has to survive. "and" and "then" ride along
   with the comma in most people's lists, and they are the join, not the
   start of the next item, so they are eaten rather than left to head a
   title. And the lookahead counts letters, which quietly required every
   item to open with a long word: "buy milk, pay rent, get petrol" came
   back as one task, because pay and get are three. SHORT_VERB is the way
   back in for those, and it is a named list rather than a lower letter
   count so that "her birthday is on the 12th" still reads as the note it
   is. Anything that does slip through as a fragment — "due friday", "at
   4pm" — is folded back by QUALIFIER on the next pass. */
function splitDump(text) {
  return text
    .split(SPLIT_ON)
    .map(s => s.replace(/^[\s\-–—*•\d.)]+/, '').trim())
    .filter(s => s.length > 2)
    // fold qualifier fragments back into the task they describe
    .reduce((acc, frag) => {
      if (acc.length && QUALIFIER.test(frag)) acc[acc.length - 1] += ', ' + frag;
      else acc.push(frag);
      return acc;
    }, [])
    .slice(0, 25);
}

function parseLocally(text) {
  const URGENT_HIGH = /\b(today|tonight|asap|urgent|overdue|deadline|due|now|immediately|last chance|expires?)\b/i;
  const URGENT_SOON = /\b(tomorrow|this week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend|soon)\b/i;
  const QUICK  = /\b(email|reply|text|call|book|order|pay|send|renew|confirm|cancel|rsvp)\b/i;
  const BIG    = /\b(write|build|plan|report|design|research|clean|organi[sz]e|prepare|refactor|draft|deep)\b/i;
  /* Things that cost something real if they never happen. Deliberately
     narrower than the model's own reading: money and health only, plus the
     words below. Everything else stays 'low'. A heuristic that called half
     the list important would fill Do now with everything, and this parser
     already announces itself as a rough guess. */
  const WEIGHTY = /\b(bill|rent|tax|insurance|fine|penalty|licen[cs]e|passport|visa|permit|loan|debt|invoice|contract|doctor|dentist|hospital|clinic|medicine|prescription|exam|interview)\b/i;
  const WEIGHTY_CATS = new Set(['money', 'health']);

  return splitDump(text)
    .map(line => {
      const stated = parseMinutes(line);
      const day = parseDay(line);
      /* Both tidiers are anchored to the end of the string, so each can
         uncover a clause for the other: "takes 25 min, tomorrow" only
         offers up its duration once "tomorrow" is off. Alternate until
         neither one bites. */
      let clean = line;
      for (let i = 0; i < 3; i++) {
        const before = clean;
        if (stated !== null) clean = tidyTitle(clean) || clean;
        if (day) clean = tidyWhen(clean) || clean;
        if (clean === before) break;
      }
      clean = clean || line;
      const cat = guessCategory(line);
      return normalizeTask({
        title: clean.charAt(0).toUpperCase() + clean.slice(1),
        minutes: stated !== null ? stated : (QUICK.test(line) ? 10 : BIG.test(line) ? 45 : 20),
        energy:  BIG.test(line) ? 'high' : QUICK.test(line) ? 'low' : 'medium',
        urgency: URGENT_HIGH.test(line) ? 5 : URGENT_SOON.test(line) ? 4 : 3,
        importance: (WEIGHTY_CATS.has(cat) || WEIGHTY.test(line)) ? 'high' : 'low',
        firstStep: 'Open whatever you need for this and look at it for 2 minutes. Nothing more.',
        category: cat,
        when: day,
        // A time with no day is a time on no calendar, so it is dropped
        // rather than parked on today and quietly wrong.
        at: day ? parseClock(line) : null,
        local: true,
      });
    });
}

/** `when` and `at` settled together: a clock time with no day is given the
    next occurrence of that time, and a day with no time stays dateless. */
function timing(when, at) {
  return { when: when || dayForTime(at), at };
}

function normalizeTask(t) {
  const clamp = (n, lo, hi, d) => {
    const v = Number(n);
    return Number.isFinite(v) ? Math.min(hi, Math.max(lo, Math.round(v))) : d;
  };
  return {
    id: 't_' + Math.random().toString(36).slice(2, 9),
    title: String(t.title || 'Untitled').slice(0, 160),
    minutes: clamp(t.minutes, 2, 240, 20),
    energy: ['low', 'medium', 'high'].includes(t.energy) ? t.energy : 'medium',
    urgency: clamp(t.urgency, 1, 5, 3),
    /* How soon (urgency) and what it costs to never do it (importance) are
       different questions. The model still answers both, and a rating it has
       given is kept — but nothing sorts on importance since the matrix came
       out. Unknown lands on 'low': we were never told it mattered. */
    importance: ['low', 'high'].includes(t.importance) ? t.importance : 'low',
    firstStep: String(t.firstStep || t.first_step || 'Open it and look at it for 2 minutes.').slice(0, 240),
    category: String(t.category || 'general').slice(0, 40),
    /* A time with no day gets one. Written as a pair rather than two
       independent fields because that is what they are: `at` without
       `when` is not "sometime", it is a time nobody wrote the day of. */
    ...timing(normalizeDay(t.when), normalizeTime(t.at)),
    steps: Array.isArray(t.steps) ? t.steps.slice(0, 7).map(String) : null,
    local: t.local === true,   // sorted by the offline parser, not the model
    gcal: null,   // { id, sig } once this one has been pushed to Google
    done: false,
    doneAt: null,   // stamped by markDone, read by pruneDone
    skipped: false,
  };
}

/* ---------------- render ---------------- */

/* Display names for the categories the model returns. Anything unexpected
   falls through to a title-cased version of whatever came back. */
const CATEGORY_LABELS = {
  work:    'Work',
  admin:   'Admin',
  money:   'Money',
  health:  'Health',
  home:    'Home',
  social:  'Social',
  errand:  'Errands',
  general: 'Everything else',
};

function categoryLabel(c) {
  return CATEGORY_LABELS[c] || c.charAt(0).toUpperCase() + c.slice(1);
}

function minutesLabel(m) {
  return m < 60 ? `${m} min` : `${Math.round(m / 60 * 10) / 10} hr`;
}

/**
 * Group open tasks by category.
 * Inside a group: most urgent first, then shortest — same instinct as the
 * old scoring, just applied per list instead of picking one winner.
 * Between groups: the list holding the most urgent thing goes on top, so
 * the pressing pile is the one you see first.
 */
const catKey = (t) => String(t.category || 'general').toLowerCase();

/* Which list is showing. 'all' or a category key. Held outside the state
   that gets saved: it is where you are looking, not something about the
   tasks, and it should not follow you onto another device. */
let catFilter = 'all';

/* A deadline as one sortable number. No day means no deadline, which sorts
   last and not first — an undated task is not due now, it is undated. A day
   with no time on it is treated as the end of that day, so it falls in
   behind everything actually booked into it. */
function dueAt(t) {
  if (!t.when) return Infinity;
  return Number(t.when.replace(/-/g, '') + (t.at ? t.at.replace(':', '') : '2359'));
}

/* Four headings, in the order the day presses on you. What puts a task
   under one of them is its deadline and nothing else: that is the one thing
   a heading can say at a glance which a chip on a card cannot, and mixing
   urgency into it would leave a line that says "Today" holding something
   that is not. Urgency still orders what sits underneath. */
const BUCKETS = [
  ['late',    'Late'],
  ['today',   'Today'],
  ['soon',    'Coming up'],
  ['someday', 'No date yet'],
];

function bucketOf(t, today) {
  if (!t.when) return 'someday';
  if (t.when < today) return 'late';
  if (t.when === today) return 'today';
  return 'soon';
}

/* Under a dated heading the clock leads. The heading has already said these
   are all late, or all today, so what is left to know is which comes first.
   Undated has no clock to lead with, so urgency does, and between two of
   equal standing the quicker one — a list you can put a dent in beats one
   you can only stare at. */
function sortBucket(key, items) {
  return items.slice().sort(key === 'someday'
    ? (a, b) => b.urgency - a.urgency || a.minutes - b.minutes
    : (a, b) => dueAt(a) - dueAt(b) || b.urgency - a.urgency || a.minutes - b.minutes);
}

/* Only the headings that have something under them. An empty "Late" is a
   worse thing to read than no heading at all. */
function bucketize(tasks) {
  const today = dayKey();
  const by = new Map(BUCKETS.map(([k]) => [k, []]));
  tasks.forEach(t => by.get(bucketOf(t, today)).push(t));
  return BUCKETS
    .filter(([k]) => by.get(k).length)
    .map(([k, label]) => [k, label, sortBucket(k, by.get(k))]);
}

function groupByCategory(tasks) {
  const groups = new Map();
  tasks.forEach(t => {
    const key = catKey(t);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(t);
  });

  groups.forEach(list => {
    list.sort((a, b) => b.urgency - a.urgency || a.minutes - b.minutes);
  });

  return [...groups.entries()].sort((a, b) => {
    const ua = Math.max(...a[1].map(t => t.urgency));
    const ub = Math.max(...b[1].map(t => t.urgency));
    return ub - ua || b[1].length - a[1].length;
  });
}

function goToNext() {
  show(el.screenNow);
  save();
  paintSignupOffer();   // there is a list now, so the offer has something to offer

  const open = state.tasks.filter(t => !t.done);
  const done = state.tasks.filter(t => t.done);

  if (!open.length) {
    el.lists.classList.add('is-hidden');
    el.eyebrow.classList.add('is-hidden');
    el.summary.classList.add('is-hidden');
    el.doneBlock.classList.add('is-hidden');
    el.dangerZone.classList.toggle('is-hidden', state.tasks.length === 0);
    resetClear();
    el.clearedNote.classList.remove('is-hidden');
    return;
  }

  el.eyebrow.textContent = state.profile.name
    ? `Sorted, ${state.profile.name}.`
    : 'Sorted into lists.';
  el.eyebrow.classList.remove('is-hidden');
  el.summary.classList.remove('is-hidden');
  el.clearedNote.classList.add('is-hidden');

  const localOnes = open.filter(t => t.local);
  el.offlineNote.classList.toggle('is-hidden', localOnes.length === 0);
  if (localOnes.length) {
    el.offlineCount.textContent = localOnes.length;
    el.offlineWord.textContent = localOnes.length === 1 ? 'was' : 'were';
  }

  const groups = groupByCategory(open);
  const totalMin = open.reduce((n, t) => n + t.minutes, 0);
  el.summary.textContent =
    `${open.length} ${open.length === 1 ? 'thing' : 'things'} · ` +
    `${groups.length} ${groups.length === 1 ? 'list' : 'lists'} · ` +
    `about ${minutesLabel(totalMin)} all in`;

  /* A filter has to survive a re-render but not the list it was filtering:
     tick the last thing off Money and the page must not sit there showing
     an empty Money. */
  if (catFilter !== 'all' && !groups.some(([cat]) => cat === catFilter)) catFilter = 'all';
  renderCatBar(groups);

  const shown = catFilter === 'all' ? open : open.filter(t => catKey(t) === catFilter);

  el.lists.classList.remove('is-hidden');
  paintListBody(shown);

  renderDone(done);
  el.dangerZone.classList.toggle('is-hidden', state.tasks.length === 0);
  resetClear();
}

/* Grouped by when, which is the default and the argument the app makes. */
function paintListBody(shown) {
  el.lists.innerHTML = '';
  bucketize(shown).forEach(([key, label, items]) =>
    el.lists.appendChild(renderBucket(key, label, items)));
}

function renderBucket(key, label, items) {
  const section = document.createElement('section');
  section.className = `bucket bucket--${key}`;

  const head = document.createElement('div');
  head.className = 'bucket-head';

  const name = document.createElement('h2');
  name.className = 'bucket-name';
  name.textContent = label;

  const count = document.createElement('span');
  count.className = 'bucket-count';
  count.textContent = items.length;

  head.append(name, count);

  const ul = document.createElement('ul');
  ul.className = 'list-items';
  items.forEach(t => ul.appendChild(renderTask(t)));

  section.append(head, ul);
  return section;
}

/* The lists, as one line you can run your thumb along. One list is no
   choice at all, so the row only appears once there are two. */
function renderCatBar(groups) {
  el.catBar.classList.toggle('is-hidden', groups.length < 2);
  if (groups.length < 2) { el.catBar.innerHTML = ''; return; }

  /* Rebuilding throws the row back to the left. Nothing about the pills has
     moved — only which one is filled — so put the scroll back where the
     thumb left it. */
  const left = el.catBar.scrollLeft;
  el.catBar.innerHTML = '';

  const all = groups.reduce((n, [, items]) => n + items.length, 0);
  [['all', 'All', all], ...groups.map(([cat, items]) => [cat, categoryLabel(cat), items.length])]
    .forEach(([key, label, count]) => el.catBar.appendChild(catPill(key, label, count)));

  el.catBar.scrollLeft = left;
}

function catPill(key, label, count) {
  const on = key === catFilter;

  const b = document.createElement('button');
  b.type = 'button';
  b.className = 'cat-pill' + (on ? ' is-on' : '');
  b.setAttribute('role', 'tab');
  b.setAttribute('aria-selected', String(on));

  const name = document.createElement('span');
  name.textContent = label;

  const n = document.createElement('span');
  n.className = 'cat-pill-n';
  n.textContent = count;

  b.append(name, n);
  b.addEventListener('click', () => {
    if (catFilter === key) return;
    catFilter = key;
    goToNext();
  });
  return b;
}

function renderTask(task) {
  /* The row itself is a div now. The <li> around it is the swipe track —
     see swipeRow(), at the foot of the drag section. */
  const card = document.createElement('div');
  card.className = 'task';
  if (task.urgency >= 5) card.classList.add('task--urgent');

  /* tick it off */
  const check = document.createElement('button');
  check.className = 'task-check';
  check.setAttribute('aria-label', `Mark "${task.title}" done`);
  check.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l5 5L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  check.addEventListener('click', (e) => { e.stopPropagation(); markDone(task.id); });

  const body = document.createElement('div');
  body.className = 'task-body';

  const title = document.createElement('p');
  title.className = 'task-title';
  title.textContent = task.title;

  const meta = document.createElement('div');
  meta.className = 'task-meta';

  const time = document.createElement('span');
  time.className = 'chip chip--time';
  time.textContent = minutesLabel(task.minutes);

  const energy = document.createElement('span');
  energy.className = 'chip';
  energy.textContent = `${task.energy} energy`;

  meta.append(time, energy);

  const stamp = whenLabel(task);
  if (stamp) {
    const when = document.createElement('span');
    when.className = 'chip chip--when';
    when.textContent = stamp;
    if (task.when < dayKey()) when.classList.add('is-late');
    meta.appendChild(when);
  }

  if (task.urgency >= 5) {
    const urgent = document.createElement('span');
    urgent.className = 'chip chip--urgent';
    urgent.textContent = 'urgent';
    meta.appendChild(urgent);
  }

  body.append(title, meta);

  /* the detail only opens when asked — lists stay scannable */
  const detail = document.createElement('div');
  detail.className = 'task-detail is-hidden';

  const step = document.createElement('div');
  step.className = 'first-step';
  const stepLabel = document.createElement('span');
  stepLabel.className = 'first-step-label';
  stepLabel.textContent = 'Start here — 2 minutes';
  const stepText = document.createElement('p');
  stepText.className = 'first-step-text';
  stepText.textContent = task.firstStep;
  step.append(stepLabel, stepText);

  const stepsBlock = document.createElement('div');
  stepsBlock.className = 'steps-block is-hidden';
  const stepsLabel = document.createElement('span');
  stepsLabel.className = 'first-step-label';
  stepsLabel.textContent = 'Broken down';
  const stepsList = document.createElement('ol');
  stepsList.className = 'steps';
  stepsBlock.append(stepsLabel, stepsList);

  const breakBtn = document.createElement('button');
  breakBtn.className = 'btn-soft task-break';
  breakBtn.textContent = 'Too big — break it down';
  breakBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    breakDown(task, { stepText, stepsBlock, stepsList, breakBtn });
  });

  /* Repair, not decoration. The model splits and rewrites, and it gets
     things wrong — without these two the only exits from a bad task are
     lying about it with the tick or clearing the whole store. Both live
     inside the detail so the row itself stays scannable. */
  const fixRow = document.createElement('div');
  fixRow.className = 'task-fix';

  const editBtn = document.createElement('button');
  editBtn.className = 'task-fix-btn';
  editBtn.type = 'button';
  editBtn.textContent = 'Edit';
  editBtn.addEventListener('click', (e) => { e.stopPropagation(); editTitle(task, title, card); });

  const delBtn = document.createElement('button');
  delBtn.className = 'task-fix-btn task-fix-btn--danger';
  delBtn.type = 'button';
  delBtn.textContent = 'Remove';
  delBtn.addEventListener('click', (e) => { e.stopPropagation(); removeTask(task.id); });

  fixRow.append(editBtn, delBtn);

  detail.append(step, stepsBlock, breakBtn, fixRow);
  if (task.steps && task.steps.length) paintSteps(task.steps, stepsBlock, stepsList);

  body.appendChild(detail);

  card.append(check, body);
  card.addEventListener('click', () => {
    if (swiped(card)) return;   // the click a swipe ends with, not a tap
    const open = detail.classList.toggle('is-hidden');
    card.classList.toggle('is-open', !open);
  });

  return swipeRow(card, task, () => keepPlace(goToNext));
}

function paintSteps(steps, stepsBlock, stepsList) {
  stepsList.innerHTML = '';
  steps.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    stepsList.appendChild(li);
  });
  stepsBlock.classList.remove('is-hidden');
}

function renderDone(done) {
  if (!done.length) {
    el.doneBlock.classList.add('is-hidden');
    return;
  }
  el.doneBlock.classList.remove('is-hidden');
  el.doneCount.textContent = done.length === 1 ? '1 done' : `${done.length} done`;
  el.doneList.innerHTML = '';

  /* Newest first, and only the most recent DONE_SHOWN. The pile is there
     to be undone from, and nobody undoes the fortieth thing they ticked
     last Tuesday — past that it is a wall of text to scroll under. */
  const recent = [...done]
    .sort((a, b) => (b.doneAt || 0) - (a.doneAt || 0))
    .slice(0, DONE_SHOWN);
  const hidden = done.length - recent.length;

  recent.forEach(t => {
    const li = document.createElement('li');
    li.className = 'done-item';

    const title = document.createElement('span');
    title.className = 'p-title';
    title.textContent = t.title;

    const undo = document.createElement('button');
    undo.className = 'p-do';
    undo.textContent = 'Undo';
    undo.addEventListener('click', () => {
      t.done = false;
      t.doneAt = null;   // back on the lists, and no longer ageing out
      save();
      goToNext();
    });

    li.append(title, undo);
    el.doneList.appendChild(li);
  });

  if (hidden) {
    const note = document.createElement('li');
    note.className = 'done-note';
    note.textContent = `${hidden} older ${hidden === 1 ? 'one is' : 'ones are'} not shown. Finished tasks clear themselves after a week.`;
    el.doneList.appendChild(note);
  }
}

/* ---------------- clear everything ----------------
   Two confirmations, because there is no undo and no backup: the tasks
   live only in this browser's localStorage. The armed state also times
   out, so a half-pressed confirm can't sit waiting for a stray tap. */

let clearStage = 0;
let clearTimer;

function resetClear() {
  clearStage = 0;
  clearTimeout(clearTimer);
  el.clearConfirm.classList.add('is-hidden');
  el.btnClearAll.classList.remove('is-hidden');
}

function stepClear() {
  const n = state.tasks.length;
  clearStage += 1;

  if (clearStage === 1) {
    el.btnClearAll.classList.add('is-hidden');
    el.clearConfirm.classList.remove('is-hidden');
    el.clearText.textContent =
      `Delete ${n === 1 ? 'the 1 task' : `all ${n} tasks`} on your lists? This cannot be undone.`;
    el.btnClearGo.textContent = 'Yes, clear everything';
    el.clearConfirm.classList.remove('is-final');
  } else if (clearStage === 2) {
    el.clearText.textContent =
      `Last check — this permanently deletes ${n === 1 ? 'it' : 'all ' + n} and there is no backup.`;
    el.btnClearGo.textContent = n === 1 ? 'Delete it' : `Delete all ${n}`;
    el.clearConfirm.classList.add('is-final');
  } else {
    const gone = state.tasks.length;
    state.tasks.forEach(orphanEvent);
    state.tasks = [];
    save();
    resetClear();
    goToNext();
    toast(gone === 1 ? 'Cleared. 1 task gone.' : `Cleared. ${gone} tasks gone.`);
    return;
  }

  // don't leave it armed
  clearTimeout(clearTimer);
  clearTimer = setTimeout(resetClear, 20000);
}

/* ---------------- actions ---------------- */

/** Re-run the AI over the tasks the offline parser guessed at. */
async function resortLocal() {
  const stale = state.tasks.filter(t => !t.done && t.local);
  if (!stale.length) return;

  el.btnResort.disabled = true;
  el.btnResort.textContent = 'Sorting…';

  try {
    const fresh = await parseWithAI(stale.map(dumpLine).join('\n'));

    /* Fewer back than went in means one was swallowed, and there is no
       telling which. Re-sorting is a tidy-up, never a delete, so rather than
       write a list quietly missing a task nobody removed, settle for the
       reading already on it. More back than went in is a line split in two —
       nothing is lost there, so take it; only the day cannot be paired up. */
    if (fresh.length < stale.length) return settleForOffline(stale);
    if (fresh.length === stale.length) fresh.forEach((t, i) => keepDate(t, stale[i]));

    const staleIds = new Set(stale.map(t => t.id));
    state.tasks = state.tasks.filter(t => !staleIds.has(t.id)).concat(fresh);
    save();
    goToNext();
    toast('Sorted properly.');
  } catch (err) {
    /* An empty list is the sorter's considered answer, not a fault on the
       way there: a bare name or a half-written fragment is a line it will
       not turn into a task, however many times it is asked. */
    if (err.message === 'no tasks in response') return settleForOffline(stale);
    console.warn('re-sort failed:', err.message);
    toast(resortProblem(err));
  } finally {
    /* Put the button back however this went. It used to be reset only on the
       way out of a failure, so a re-sort that worked left it disabled and
       still reading "Sorting…" — invisible while the notice is hidden, and
       then dead on arrival the next time an offline dump brings the notice
       back. */
    el.btnResort.disabled = false;
    el.btnResort.textContent = 'Sort these properly';
  }
}

/* Keep the offline reading and stop calling it provisional. Nothing is
   deleted and nothing is rewritten — the one change is that the list stops
   offering to re-sort what the sorter has already declined to touch, which
   is what left the notice sitting there with a button that could not work. */
function settleForOffline(stale) {
  stale.forEach((t) => { t.local = false; });
  save();
  goToNext();
  toast(stale.length === 1
    ? 'Kept as it was — the sorter had nothing to add.'
    : 'Kept as they were — the sorter had nothing to add.');
}

/* A stale task written back out as a line of dump text, date and all.
   The offline reader already resolved the day and time from the original
   wording, and that wording is gone by now. Re-sorting on the bare title
   hands the model a line with no date in it and gets a task with no date
   back, quietly unpicking the one thing the offline pass got right. */
function dumpLine(t) {
  /* A day that has already gone is the one thing not to write down. The
     schema forbids the model to return a past date, and handed a line that
     asks for one it resolves the contradiction by dropping the task
     outright — so an overdue task goes in bare and gets its day back from
     keepDate afterwards. */
  if (!t.when || t.when < dayKey()) return t.title;
  const at = timeLabel(t.at);
  return `${t.title} \u2014 ${dayPhrase(t.when)}${at ? ` at ${at}` : ''}`;
}

/* Put back a day the model was never shown. Only ever fills a blank: if the
   re-sort found a day of its own, that reading is the better one. */
function keepDate(fresh, was) {
  if (fresh.when || !was.when) return;
  fresh.when = was.when;
  fresh.at = was.at;
}

/* Say which way it failed. Every failure used to report the same thing —
   that the backend was unreachable — including the ones where the backend
   answered and said no, which is the case you most need to tell apart from
   a dead connection. */
function resortProblem(err) {
  if (!navigator.onLine) return 'Still offline — no connection.';
  const status = /returned (\d+)/.exec(err.message);
  if (status) return `The sorter answered ${status[1]}. Try again in a moment.`;
  if (err.name === 'TypeError') return 'Cannot reach the backend from here.';
  return 'The sorter sent nothing back. Try again.';
}

/* Edit the title in place rather than re-rendering the lists: a full
   redraw would collapse the detail the button was pressed in. Nothing
   else on the screen is derived from the title, so in-place is safe. */
function editTitle(task, titleEl, li) {
  if (li.querySelector('.task-edit')) return;

  const input = document.createElement('input');
  input.type = 'text';
  input.className = 'task-edit';
  input.value = task.title;
  input.maxLength = 160;
  input.setAttribute('aria-label', 'Edit this task');

  /* The row toggles its own detail on click. Without this, every tap
     into the field would shut the field. */
  ['click', 'pointerdown', 'touchstart'].forEach(ev =>
    input.addEventListener(ev, (e) => e.stopPropagation()));

  let closed = false;
  const finish = (commit) => {
    if (closed) return;
    closed = true;
    const next = input.value.trim();
    if (commit && next && next !== task.title) {
      task.title = next.slice(0, 160);
      save();
      toast('Reworded.');
    }
    titleEl.textContent = task.title;
    input.replaceWith(titleEl);
  };

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') { e.preventDefault(); finish(true); }
    if (e.key === 'Escape') { e.preventDefault(); finish(false); }
  });
  input.addEventListener('blur', () => finish(true));

  titleEl.replaceWith(input);
  input.focus();
  input.select();
}

/* Removing is not completing. The tick means "I did this" and feeds the
   done count; this is for the ones the model invented or split wrongly,
   and it leaves no trace. Undo is the whole safety net, so the task is
   put back at the index it left rather than appended. */
function removeTask(id, after = goToNext) {
  const i = state.tasks.findIndex(t => t.id === id);
  if (i === -1) return;
  const [gone] = state.tasks.splice(i, 1);
  orphanEvent(gone);
  save();
  after();
  toast('Removed.', {
    label: 'Undo',
    fn: () => {
      /* Pull the event back off the death row list if the sync has not got
         to it yet. If it has, unorphan finds nothing, the task comes back
         with a gcal id pointing at a deleted event, and the next push gets
         a 404 and rebuilds it. Either way it ends up right. */
      unorphanEvent(gone);
      state.tasks.splice(Math.min(i, state.tasks.length), 0, gone);
      save();
      /* Not after(): six seconds is long enough to have walked to another
         screen, and the task has to come back on the one being looked at. */
      keepPlace(repaintLists);
    },
  });
}

/* The undo is the same one the done pile carries, brought forward to the
   moment it is needed. The pile is only on the lists screen and only holds
   the last DONE_SHOWN, so a tick from the calendar — or now a swipe, which
   is easy to make by accident — had nothing to take it back with. */
function markDone(id, after = goToNext) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  t.done = true;
  t.doneAt = Date.now();   // what pruneDone() ages it out on
  save();
  toast('Done.', {
    label: 'Undo',
    fn: () => {
      t.done = false;
      t.doneAt = null;   // back on the lists, and no longer ageing out
      save();
      /* Not after(): six seconds is long enough to have walked to another
         screen, and the task has to come back on the one being looked at. */
      keepPlace(repaintLists);
    },
  });
  after();
}

async function breakDown(task, ui) {
  ui.breakBtn.disabled = true;
  ui.breakBtn.textContent = 'Breaking it down…';

  try {
    const res = await fetch('/api/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'breakdown', task: task.title }),
    });
    if (!res.ok) throw new Error('status ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data.steps) || !data.steps.length) throw new Error('no steps');

    task.steps = data.steps.slice(0, 7).map(String);
    if (data.firstStep) task.firstStep = String(data.firstStep);
    save();
    ui.stepText.textContent = task.firstStep;
    paintSteps(task.steps, ui.stepsBlock, ui.stepsList);
    ui.breakBtn.textContent = 'Broken down ✓';
  } catch (err) {
    console.warn('breakdown failed:', err.message);
    ui.breakBtn.disabled = false;
    ui.breakBtn.textContent = 'Too big — break it down';
    toast('Needs the AI backend for this one.');
  }
}

/* ---------------- the composer ----------------
   The + and Dump again both used to swap the whole screen for the dump page,
   which meant losing the list you were reading to add one thing to it. Both
   open this over the top instead, and hand the screen back on cancel. It is a front end for the
   dump box, not a second one: on send it writes into el.input and calls the
   same triage(), so the loading morph, the parser and the de-duping are all
   the one path they were before. */

/* Nothing is stashed to return to: the composer is an overlay, so the screen
   underneath is never hidden and is still exactly where it was — including
   how far down it was scrolled — when the sheet closes. */

function growComposer() {
  // A textarea will not size itself. Reset first, or it only ever grows.
  el.compInput.style.height = 'auto';
  el.compInput.style.height = el.compInput.scrollHeight + 'px';
}

function syncComposer() {
  el.compPost.disabled = el.compInput.value.trim().length === 0;
  growComposer();
  previewDates(el.compInput, el.compDates, el.compChips);

  /* touch-action is what tells the browser whether it might need this
     gesture for a scroll. While there is nothing to scroll to, saying so
     means it stops holding the first pixels of a drag to find out — which
     is the delay that made the sheet feel like it was catching up. */
  el.compBody.style.touchAction =
    el.compBody.scrollHeight > el.compBody.clientHeight ? 'pan-y' : 'none';
}

function openComposer() {
  const { name, avatar } = state.profile;
  el.compFace.textContent = avatarFace(avatar);
  el.compName.textContent = name || 'you';

  // Carries over whatever is sitting in the dump box, so a half-written
  // thought is not lost by reaching for the + instead of the dump screen.
  el.compInput.value = el.input.value;
  resetComposerMotion();
  el.composer.classList.remove('is-hidden');
  document.body.classList.add('is-composing');

  /* Off again as soon as it has played, so no later state change can start
     the entrance over. */
  el.compSheet.classList.add('is-entering');
  const entered = () => el.compSheet.classList.remove('is-entering');
  el.compSheet.addEventListener('animationend', entered, { once: true });
  setTimeout(entered, 500);
  syncComposer();

  /* Deliberately not focused. Focusing here brought the keyboard up with
     the sheet, which covered the mic before it had been seen once — and
     for a one-handed dump the thumb wants the mic, not the caret. The
     keyboard is one tap away and that tap is the whole body: see
     focusComposer. */
  el.composer.classList.remove('is-typing');
  el.compVoice.classList.toggle('is-hidden', !Voice.available());
  restMic();
}

/* Anywhere in the empty space under the text. iOS only raises the
   keyboard for a focus it believes came from a tap, and this one did. */
function focusComposer() {
  el.compInput.focus();
  const end = el.compInput.value.length;
  try { el.compInput.setSelectionRange(end, end); } catch (_) {}
}

/* ---- moving the sheet under its own power ----
   The Web Animations API rather than a class with a CSS transition, because
   a transition has to interpolate from whatever the element's style already
   says — and during a drag that is an inline transform, which no stylesheet
   rule can override. That is what made a release freeze and then vanish: the
   rule said translateY(100%), the style attribute still said 140px, the
   style attribute won, nothing moved, and the sheet was hidden outright when
   the fallback timer ran out.

   An animation takes both ends as arguments. There is nothing to override
   and nothing to out-specify: it starts exactly where the finger left off. */
const EASE_OUT_SHEET = 'cubic-bezier(.33,0,.68,1)';
const EASE_SETTLE = 'cubic-bezier(.32,.72,0,1)';

let sheetAnim = null, scrimAnim = null;

function stillMotion() {
  return matchMedia('(prefers-reduced-motion: reduce)').matches;
}

function slideSheet(fromPx, to, ms, ease, then) {
  sheetAnim?.cancel();
  const dur = stillMotion() ? 1 : ms;
  sheetAnim = el.compSheet.animate(
    [{ transform: `translate3d(0,${fromPx}px,0)` }, { transform: `translate3d(0,${to},0)` }],
    { duration: dur, easing: ease, fill: 'forwards' }
  );
  /* finished rejects when an animation is cancelled — which is exactly what
     happens when the sheet is grabbed again mid-flight, and is not an error. */
  sheetAnim.finished.then(then, () => {});
}

function fadeScrim(to, ms) {
  scrimAnim?.cancel();
  const from = el.compScrim.style.opacity === '' ? 1 : Number(el.compScrim.style.opacity);
  scrimAnim = el.compScrim.animate(
    [{ opacity: from }, { opacity: to }],
    { duration: stillMotion() ? 1 : ms, easing: 'ease', fill: 'forwards' }
  );
  scrimAnim.finished.catch(() => {});
}

/* The safety net under the leave animation, held so it can be called off.
   Reopening inside those 400ms used to let the old timer fire and hide the
   sheet that had just come up. */
let composerCloseTimer = 0;

/** Everything the sheet has to forget between one opening and the next. */
function resetComposerMotion() {
  clearTimeout(composerCloseTimer);
  composerCloseTimer = 0;
  sheetAnim?.cancel(); sheetAnim = null;
  scrimAnim?.cancel(); scrimAnim = null;
  dragging = false;
  dragPending = false;
  el.compSheet.classList.remove('is-entering', 'is-dragging', 'is-settling', 'is-leaving');
  el.compSheet.style.transform = '';
  el.compSheet.style.transitionDuration = '';
  el.compScrim.style.opacity = '';
  el.compScrim.style.transitionDuration = '';
  dragDy = 0;
  el.composer.classList.remove('is-dragging');
}

/* `slide` plays the sheet back down before it goes; a send skips it, because
   the loading screen is what should be arriving, not an empty sheet. */
function closeComposer(slide = false) {
  el.compInput.blur();   // first, so the keyboard drops with the sheet

  const done = () => {
    el.composer.classList.add('is-hidden');
    document.body.classList.remove('is-composing');
    resetComposerMotion();
  };

  if (!slide) { done(); return; }

  clearTimeout(composerCloseTimer);
  el.compSheet.classList.remove('is-dragging', 'is-settling');
  el.compSheet.classList.add('is-leaving');

  const from = dragDy;
  const travel = Math.max(1, el.compSheet.offsetHeight - from);

  /* Carried out at something like the speed it was released at, so letting go
     mid-drag continues the movement rather than restarting it. A sheet let go
     from halfway has half as far to go and should not take as long over it. */
  const speed = Math.min(Math.max(dragSpeed, 0.9), 3.2);   // px per ms
  const ms = Math.round(Math.min(300, Math.max(130, travel / speed)));

  slideSheet(from, '100%', ms, EASE_OUT_SHEET, done);
  fadeScrim(0, ms);

  /* An animation that never finishes must not leave the sheet up: a tab put
     in the background mid-flight stops running its animations, and comes
     back to a composer that will not go away. done() twice is harmless. */
  composerCloseTimer = setTimeout(done, ms + 150);
}

/** Cancel keeps the text — in the dump box, where the dump screen will find it. */
function cancelComposer() {
  /* A hold that is still running when the sheet goes would keep the mic
     open on a screen that no longer exists, and one already on its way to
     be transcribed is a round trip nobody is waiting for the answer to. */
  Voice.abandon();
  restMic();
  writeBuffer(el.compInput.value);
  renderHome();
  closeComposer(true);
}

/* ---- drag it down to put it away ----
   The sheet follows the finger one to one, and on release either carries on
   out or springs back. Threshold is distance OR speed: a slow deliberate
   pull past a third of the way, or a quick flick from anywhere. */
const DRAG_DISMISS_PX = 120;
const DRAG_DISMISS_SPEED = 0.55;   // px per ms
const DRAG_FLICK_WINDOW = 120;     // ms — older than this is not a flick
/* A flick still has to be a movement. Pointer events arrive about every 8ms,
   so a single gentle 4px step already computes to 0.5px/ms — right on the
   threshold. Without a floor on the distance, a small twitch on release
   threw the sheet away. */
const DRAG_FLICK_MIN_PX = 40;
/* And speed is smoothed rather than taken from the last pair of points, so
   one quick sample among slow ones cannot decide the gesture on its own. */
const DRAG_SPEED_SMOOTHING = 0.4;

/* How far the finger has to commit before a drag that started on the text
   counts as a drag. Everywhere else there is nothing to be confused with,
   so the sheet moves from the first pixel. */
const DRAG_CLAIM_PX = 8;
/* How far the sheet has to have actually travelled before the keyboard is
   let go. iOS keeps the caret and the selection handles pinned to a focused
   field, so every frame the sheet moves is a frame it re-places those —
   but this cannot fire on claim, or a tap on the sheet's background would
   put the keyboard away while you were still typing. */
const DRAG_KEYBOARD_PX = 24;

let dragFrom = 0, dragX0 = 0, dragging = false;
let dragPending = false;   // touched the text, has not committed yet
/* A settled drag and a tap both end with the sheet where it started. This
   is what tells them apart, so a short drag does not also raise the
   keyboard on the way back. */
let dragMoved = false;
/* Speed is measured over the last move, not the whole gesture: a drag that
   crawls down and then stops has an average that says "flick" and a finger
   that says otherwise. A hand resting before it lifts should drop the sheet
   back, so a stale last move counts as still. */
let dragLastY = 0, dragLastT = 0, dragSpeed = 0;

/* Written straight from the move handler, deliberately.
   Batching into requestAnimationFrame looks like the careful thing to do and
   was making this worse: a touchmove already arrives just before the frame
   it belongs to, so deferring the write to the next rAF callback posts it a
   whole frame late — every frame. The sheet then trails the finger by a
   fixed gap, which is exactly what "laggy" feels like. Setting one
   compositor-only property twice in a frame costs far less than being a
   frame behind for the whole gesture. */
let dragDy = 0;

function paintDrag(dy) {
  dragDy = dy;
  // translate3d, not translateY: this is the sheet's own layer to move, and
  // the scrim behind it should not be repainted to do it
  el.compSheet.style.transform = `translate3d(0,${dy}px,0)`;
  el.compScrim.style.opacity = String(Math.max(0, 1 - dy / 420));
}

/** Commit to the gesture: from here the sheet is on the finger. */
function claimDrag(e) {
  dragging = true;
  dragPending = false;
  // rebased to where the finger is now, so committing does not jump the
  // sheet by the distance it took to decide
  dragFrom = dragLastY = e.clientY;
  dragLastT = performance.now();
  dragSpeed = 0;
  el.compSheet.classList.remove('is-entering');   // the finger has it now
  sheetAnim?.cancel(); sheetAnim = null;
  scrimAnim?.cancel(); scrimAnim = null;
  el.compSheet.classList.add('is-dragging');
  el.composer.classList.add('is-dragging');
  // capture keeps mouse moves coming if the cursor slides off the sheet; a
  // touch is already captured by the element it started on, and a pointer
  // the element never really owned would throw
  if (e.pointerId >= 0) {
    try { el.compSheet.setPointerCapture(e.pointerId); } catch (_) {}
  }
}

/* Safari builds its Pointer Events on top of its Touch Events, and hands
   them over later — noticeably later, on a gesture the eye is tracking. The
   touch stream is the one the platform actually has first, so a touch device
   is driven by that and the pointer path is left for a mouse. */
function touchPos(e) {
  const t = e.touches && e.touches[0] ? e.touches[0] : e.changedTouches[0];
  return { clientX: t.clientX, clientY: t.clientY, target: t.target };
}

function dragStart(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (e.target.closest('button')) return;                    // taps are theirs
  // a body scrolled off its top is being read, not dragged
  if (el.compBody.contains(e.target) && el.compBody.scrollTop > 0) return;

  dragFrom = dragLastY = e.clientY;
  dragX0 = e.clientX;
  dragMoved = false;

  /* The text is the one surface with something else to do with a touch — a
     tap has to land a caret, a sideways drag has to select. So it waits to
     see which way the finger goes; the header, the avatar and the whole
     empty page below take the gesture immediately. */
  if (e.target.closest('.composer-input')) { dragPending = true; return; }
  claimDrag(e);
}

function dragMove(e) {
  if (dragPending) {
    const dy = e.clientY - dragFrom;
    const dx = Math.abs(e.clientX - dragX0);
    if (dy > DRAG_CLAIM_PX && dy > dx) claimDrag(e);          // down: ours
    else if (dx > DRAG_CLAIM_PX || dy < -DRAG_CLAIM_PX) dragPending = false;
    return;                                                   // sideways: theirs
  }
  if (!dragging) return;

  if (Math.abs(e.clientY - dragFrom) > DRAG_CLAIM_PX ||
      Math.abs(e.clientX - dragX0) > DRAG_CLAIM_PX) dragMoved = true;

  // down only: dragging up must not lift the sheet off the top of the screen
  const dy = Math.max(0, e.clientY - dragFrom);
  const now = performance.now();
  if (now > dragLastT) {
    const instant = (e.clientY - dragLastY) / (now - dragLastT);
    dragSpeed += (instant - dragSpeed) * DRAG_SPEED_SMOOTHING;
    dragLastY = e.clientY;
    dragLastT = now;
  }
  // past a real movement this is a drag, not a tap — and dragging a sheet
  // down is how the platform puts a keyboard away anyway
  if (dy > DRAG_KEYBOARD_PX && document.activeElement === el.compInput) {
    el.compInput.blur();
  }
  paintDrag(dy);
}

function dragEnd(e) {
  dragPending = false;
  if (!dragging) return;
  dragging = false;
  el.compSheet.classList.remove('is-dragging');
  el.composer.classList.remove('is-dragging');

  const dy = Math.max(0, e.clientY - dragFrom);
  const fresh = performance.now() - dragLastT < DRAG_FLICK_WINDOW;
  const speed = fresh ? dragSpeed : 0;

  const flicked = dy > DRAG_FLICK_MIN_PX && speed > DRAG_DISMISS_SPEED;
  if (dy > DRAG_DISMISS_PX || flicked) {
    cancelComposer();       // same as Cancel: the text is kept
    return;
  }

  // not far enough — put it back
  const settled = () => {
    if (el.compSheet.classList.contains('is-leaving')) return;   // gone already
    el.compSheet.classList.remove('is-settling');
    sheetAnim?.cancel(); sheetAnim = null;
    scrimAnim?.cancel(); scrimAnim = null;
    el.compSheet.style.transform = '';
    el.compScrim.style.opacity = '';
    dragDy = 0;
  };
  el.compScrim.style.opacity = '';

  // A press that never moved has nothing to animate back, and a transition
  // with no distance fires no transitionend — which used to leave the class
  // on, and its transition with it, for the next drag to fight.
  if (dy === 0) { settled(); return; }

  el.compSheet.classList.add('is-settling');
  slideSheet(dy, '0px', 280, EASE_SETTLE, settled);
  fadeScrim(1, 280);
  setTimeout(settled, 430);   // same net as the exit's
}

function sendComposer() {
  const text = el.compInput.value.trim();
  if (!text) { el.compInput.focus(); return; }
  writeBuffer(el.compInput.value);
  // Closed before triage, so the loading screen is what comes up behind it
  // rather than the sheet sitting over the morph.
  closeComposer();
  triage();
}

/* ---------------- the calendar ----------------
   Only ever a view of the lists. A task lands here because the dump said
   when it was — nothing is created on this screen, and a task with a day
   is still on its list. That is the whole integration: say a time in the
   dump box and the thing shows up on a day.

   The month grid is for orientation; the agenda under it is the part you
   read. Today is selected on arrival, and its agenda opens with anything
   that has already gone past, because an overdue task nobody surfaces is
   the exact failure this app exists to prevent. */

let calCursor = null;     // the month on screen: a Date on the 1st
let calPicked = null;     // the selected day, as a YYYY-MM-DD key

function tasksOn(key) {
  return state.tasks
    .filter(t => scheduled(t) && t.when === key)
    .sort((a, b) => (a.at || '99:99').localeCompare(b.at || '99:99')
                 || b.urgency - a.urgency);
}

function overdueTasks(today = dayKey()) {
  return state.tasks
    .filter(t => scheduled(t) && t.when < today)
    .sort((a, b) => a.when.localeCompare(b.when));
}

function showCalendar() {
  const today = dayKey();
  if (!calPicked) calPicked = today;
  if (!calCursor) calCursor = keyToDate(calPicked.slice(0, 8) + '01');
  /* Up first, then painted. Centring the month scroller needs a width to
     measure, and a hidden screen is display:none — it has none. */
  show(el.screenCal);
  renderCalendar();
}

/* One month of cells, painted into one pane of the scroller.

   The middle pane is live: real buttons, a click that picks the day, and
   the data-day that a dragged row aims at. The two either side exist so a
   sideways swipe pulls a drawn month in rather than a blank space, so they
   are inert spans — nothing to tab into, and no way to drop a task onto a
   month that is half off the edge of the screen. Whichever one you land on
   is repainted as the live middle the moment the scroll settles. */
function paintMonth(grid, cursor, today, live) {
  /* Weeks start on Monday. getDay() counts from Sunday, so the leading
     blanks are (day + 6) % 7 rather than day. */
  const first = new Date(cursor.getFullYear(), cursor.getMonth(), 1);
  const blanks = (first.getDay() + 6) % 7;
  const days = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 0).getDate();

  grid.innerHTML = '';
  for (let i = 0; i < blanks; i++) {
    const gap = document.createElement('span');
    gap.className = 'cal-day is-blank';
    grid.appendChild(gap);
  }

  for (let d = 1; d <= days; d++) {
    const key = dayKey(new Date(cursor.getFullYear(), cursor.getMonth(), d));
    const items = tasksOn(key);

    const cell = document.createElement(live ? 'button' : 'span');
    cell.className = 'cal-day';
    cell.textContent = d;
    cell.classList.toggle('is-today', key === today);
    cell.classList.toggle('is-picked', key === calPicked);
    /* tasksOn sorts timed things ahead of loose ones, so the first with a
       clock on it is the earliest of the day. */
    const firstTimed = items.find(t => t.at);

    if (live) {
      cell.type = 'button';
      cell.dataset.day = key;      // the drop target reads this
      cell.setAttribute('aria-pressed', String(key === calPicked));
      cell.setAttribute('aria-label',
        `${dayLabel(key, today)}${items.length ? `, ${items.length} ${items.length === 1 ? 'thing' : 'things'}` : ', nothing'}` +
        (firstTimed ? `, from ${timeLabel(firstTimed.at)}` : ''));
    }

    if (items.length) {
      cell.classList.add('has-items');
      if (key < today) cell.classList.add('is-late');

      /* The cell already says which day it is, so the time is the half of
         the stamp worth printing. A day with things but no time on any of
         them falls back to the dot — there is nothing to show, and an
         invented "12am" would read as an appointment. */
      const mark = document.createElement('span');
      if (firstTimed) {
        mark.className = 'cal-time';
        mark.textContent = timeLabel(firstTimed.at);
      } else {
        mark.className = 'cal-dot';
      }
      cell.appendChild(mark);
    }

    if (live) {
      cell.addEventListener('click', () => {
        calPicked = key;
        renderCalendar();
      });
    }
    grid.appendChild(cell);
  }
}

function renderCalendar() {
  const today = dayKey();
  el.calMonth.textContent =
    `${MONTH_NAMES[calCursor.getMonth()]} ${calCursor.getFullYear()}`;

  paintMonth(el.calGridBack,
    new Date(calCursor.getFullYear(), calCursor.getMonth() - 1, 1), today, false);
  paintMonth(el.calGrid, calCursor, today, true);
  paintMonth(el.calGridFwd,
    new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 1), today, false);
  centreMonths();
  measureMonths();

  el.calToday.classList.toggle('is-hidden',
    calPicked === today && calCursor.getMonth() === keyToDate(today).getMonth()
                        && calCursor.getFullYear() === keyToDate(today).getFullYear());

  renderAgenda(today);

  const undated = state.tasks.filter(t => !t.done && !t.when).length;
  el.calUndated.classList.toggle('is-hidden', undated === 0);
  if (undated) {
    el.calUndated.textContent = undated === 1
      ? '1 more thing has no day on it — it is waiting on your lists.'
      : `${undated} more things have no day on them — they are waiting on your lists.`;
  }
}

function renderAgenda(today) {
  el.calAgenda.innerHTML = '';

  // Anything already missed rides on top of today, never buried in the past
  // where you would have to go looking for it.
  if (calPicked === today) {
    const late = overdueTasks(today);
    if (late.length) {
      el.calAgenda.appendChild(
        agendaGroup(`${late.length} overdue`, late, today, true));
    }
  }

  const items = tasksOn(calPicked);

  if (!items.length) {
    const empty = document.createElement('p');
    empty.className = 'cal-empty';
    empty.textContent = calPicked === today
      ? 'Nothing on today. Say a day in the dump box and it lands here.'
      : `Nothing on ${dayPhrase(calPicked, today)}.`;
    el.calAgenda.appendChild(empty);
    return;
  }
  el.calAgenda.appendChild(agendaGroup(dayLabel(calPicked, today), items, today, false));
}

function agendaGroup(heading, items, today, late) {
  const section = document.createElement('section');
  section.className = 'cal-group' + (late ? ' cal-group--late' : '');

  const head = document.createElement('h3');
  head.className = 'cal-group-head';
  head.textContent = heading;
  section.appendChild(head);

  const list = document.createElement('ul');
  list.className = 'cal-items';

  items.forEach(task => {
    const card = document.createElement('div');
    card.className = 'cal-item';

    const check = document.createElement('button');
    check.className = 'task-check';
    check.setAttribute('aria-label', `Mark "${task.title}" done`);
    check.innerHTML = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l5 5L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';
    check.addEventListener('click', () => markDone(task.id, renderCalendar));

    const slot = document.createElement('span');
    slot.className = 'cal-slot';
    // A day with no time is not a 00:00 appointment, and should not read as one.
    slot.textContent = timeLabel(task.at) || 'any time';
    if (!task.at) slot.classList.add('is-loose');

    const body = document.createElement('div');
    body.className = 'cal-item-body';
    const title = document.createElement('p');
    title.className = 'cal-item-title';
    title.textContent = task.title;
    const meta = document.createElement('p');
    meta.className = 'cal-item-meta';
    meta.textContent = late
      ? `${dayLabel(task.when, today)} · ${minutesLabel(task.minutes)}`
      : `${minutesLabel(task.minutes)} · ${task.energy} energy`;
    body.append(title, meta);

    card.append(check, slot, body);
    list.appendChild(swipeRow(card, task, renderCalendar));
  });

  section.appendChild(list);
  return section;
}

function stepMonth(n) {
  calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + n, 1);
  renderCalendar();
}

/* ---- swiping between months ----
   The scroller holds last month, this month and next month, and rests one
   pane in. Swipe to a neighbour and the settle handler steps the month,
   which repaints all three with the month you landed on in the middle and
   puts the scroller back where it started. Both happen before the next
   paint, so the two cancel out: the month you pulled in does not move.

   That is also why this is a real scroller rather than a swipe gesture.
   The finger-following, the rubber band at the ends, the momentum, the
   snap and the trackpad all come from the browser, and none of them have
   to be re-invented badly. */
const CAL_SETTLE_MS = 110;

/* The arrows travel the same distance a swipe does, so they move the same
   way: one pane, in the time and on the curve the motion spec gives a
   swipe — 200-250ms, decelerating. A jump cut between two months reads as
   a redraw; a glide reads as the same calendar moving, which is the whole
   point of the scroller. */
const CAL_GLIDE_MS = 220;

/* cubic-bezier(0, 0, .2, 1) — the decelerate curve, as a progress function.
   Newton on x, which settles in a couple of passes on a curve this shallow.
   The CSS height transition below uses the same numbers, so the frame and
   the month arrive together instead of on two different eases. */
function bezier(x1, y1, x2, y2) {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const atX = t => ((ax * t + bx) * t + cx) * t;
  const slope = t => (3 * ax * t + 2 * bx) * t + cx;
  return (x) => {
    let t = x;
    for (let i = 0; i < 5; i++) {
      const d = slope(t);
      if (!d) break;
      t -= (atX(t) - x) / d;
    }
    return ((ay * t + by) * t + cy) * t;
  };
}
const decelerate = bezier(0, 0, .2, 1);

const stillness = window.matchMedia?.('(prefers-reduced-motion: reduce)');

let calSettle = null;   // the "scrolling has stopped" timer
let calHeld = false;    // a finger is still on the scroller
let calGlide = null;    // the frame request of an arrow's glide, while one runs

function centreMonths() {
  const pane = el.calMonths.clientWidth;
  if (!pane) return;    // screen still hidden; showCalendar paints once it is up
  clearTimeout(calSettle);
  el.calMonths.scrollLeft = pane;
  /* A clipped neighbour leaves the scroller overflowing downwards, which is
     an offset find-in-page can move even though a finger cannot. */
  el.calMonths.scrollTop = 0;
}

/* ---- the scroller is as tall as the month you are on ----
   Not as tall as the tallest of the three. Left to size itself the frame
   would be six rows all the way through August, and a five-week September
   would carry a row of white space it has no use for, just because the
   month next door needs one.

   So the height is pinned to one pane and the other two are clipped, and
   it moves a row earlier than you might expect: the fit follows whichever
   pane is nearest, so a taller month has grown into its sixth row by the
   time you are halfway across to it, rather than snapping open once it
   lands.

   Measured rather than counted off the calendar, because a row is however
   tall the cells work out at this width. */
let calPaneH = [];   // the natural height of each pane, this width, this month
let calChrome = 0;   // the scroller's own block padding, which a pinned height eats
let calFit = -1;     // the pane the height is currently set from

function measureMonths() {
  /* Nothing can be measured while the screen is display:none — the panes
     are all zero — and clearing the height to find that out is what does
     the damage: it leaves the scroller sizing itself to the TALLEST of the
     three panes, which is a five-week month carrying an empty sixth row
     because the month next door needs one. That is the whole bug this
     pinning exists to prevent, so a render that cannot measure keeps the
     height it already has and waits for one that can. */
  if (!el.calMonths.clientWidth) return;

  el.calMonths.style.height = '';        // back to sizing itself, to be read
  calPaneH = Array.from(el.calMonths.children, p => p.offsetHeight);
  /* Sizing itself, the scroller is the tallest pane plus its own padding —
     which is how much has to be added back once the height is pinned. The
     box is border-box, so a bare pane height would swallow the few pixels
     that keep a focus ring on the top row off the clipped edge. */
  calChrome = el.calMonths.offsetHeight - Math.max(...calPaneH, 0);
  calFit = -1;
  fitMonths(1);
}

function fitMonths(i) {
  if (i === calFit || !calPaneH[i]) return;
  calFit = i;
  el.calMonths.style.height = `${calPaneH[i] + calChrome}px`;
}

/* Which pane is nearest right now — the one the height should be cut to,
   and the one a scroll that stopped here has landed on. */
function nearestPane() {
  const pane = el.calMonths.clientWidth;
  return pane ? Math.min(2, Math.max(0, Math.round(el.calMonths.scrollLeft / pane))) : -1;
}

/* Which pane it came to rest on. Landing on a neighbour is the arrows by
   another route; landing back in the middle is a swipe that changed its
   mind, and only needs tidying up after. */
function settleMonths() {
  if (calHeld || calGlide) return;   // still moving, on a finger or on the clock
  const i = nearestPane();
  if (i < 0) return;
  if (i !== 1) stepMonth(i - 1);
  else centreMonths();
}

function waitForStop() {
  const i = nearestPane();
  if (i >= 0) fitMonths(i);      // grow into the month before it arrives
  clearTimeout(calSettle);
  calSettle = setTimeout(settleMonths, CAL_SETTLE_MS);
}

/* An arrow, moving the way a swipe does. The snap has to come off for the
   duration: mandatory snapping rounds every scrollLeft written to it back
   to a pane edge, so a tween under it lands on nothing but the two ends.

   The month is not stepped until the glide arrives. Up to then the pane
   being pulled in is the neighbour that was already drawn, exactly as it
   would be under a finger, and the commit at the end swaps it into the
   middle and re-centres in one frame — so nothing moves at the join. */
function slideMonth(n) {
  const pane = el.calMonths.clientWidth;
  if (!pane || stillness?.matches) { stepMonth(n); return; }

  cancelAnimationFrame(calGlide);
  const from = el.calMonths.scrollLeft;
  const to = pane * (1 + n);
  const t0 = performance.now();
  el.calMonths.style.scrollSnapType = 'none';

  const tick = (now) => {
    const p = Math.min(1, (now - t0) / CAL_GLIDE_MS);
    el.calMonths.scrollLeft = from + (to - from) * decelerate(p);
    if (p < 1) { calGlide = requestAnimationFrame(tick); return; }
    calGlide = null;
    el.calMonths.style.scrollSnapType = '';
    stepMonth(n);
  };
  calGlide = requestAnimationFrame(tick);
}

/* A finger resting mid-swipe stops the scroll events, and settling then
   would haul the month back out from under it. Touch events rather than
   pointer events because the browser cancels the pointer the instant it
   decides the gesture is a scroll — which is exactly the stretch that has
   to be waited out. A mouse or trackpad never sets this, and falls through
   to the timer on its own. */
el.calMonths.addEventListener('touchstart',  () => { calHeld = true; }, { passive: true });
el.calMonths.addEventListener('touchend',    () => { calHeld = false; waitForStop(); }, { passive: true });
el.calMonths.addEventListener('touchcancel', () => { calHeld = false; waitForStop(); }, { passive: true });
el.calMonths.addEventListener('scroll', waitForStop, { passive: true });

/* The browser saying "the scroll is over" beats guessing at it with a timer:
   the month commits as the snap lands rather than a tenth of a second after,
   which is the pause that made a swipe feel like it finished twice. The
   timer above stays for the browsers that do not fire this yet. */
if ('onscrollend' in el.calMonths) {
  el.calMonths.addEventListener('scrollend', () => {
    clearTimeout(calSettle);
    settleMonths();
  });
}

/* A pane is a viewport wide and a row is a fraction of one, so a rotation
   leaves both the resting offset and the measured heights stale. */
window.addEventListener('resize', () => {
  if (el.screenCal.classList.contains('is-hidden')) return;
  centreMonths();
  measureMonths();
});

/* ---------------- feedback ----------------
   Anonymous, and one a day. The limit is enforced twice on purpose: this
   side so the box tells you before you type a paragraph you cannot send,
   and the server side by a unique index, which is the one that actually
   holds — anything here can be cleared by wiping site data.

   The day is UTC on both sides. Using the local day would let anyone with
   a timezone get a second go, and would drift out of step with the index
   that does the real work. */

function utcDay(d = new Date()) {
  return d.toISOString().slice(0, 10);
}

function feedbackSentToday() {
  return state.sentFeedbackOn === utcDay();
}

function paintFeedback() {
  const spent = feedbackSentToday();
  el.fbForm.classList.toggle('is-hidden', spent);
  el.fbThanks.classList.toggle('is-hidden', !spent);

  /* The tin only exists if a link was set. No link, no ask — and the
     thanks card is exactly what it was before. */
  const give = (window.MYADHD_DONATE_URL || '').trim();
  if (give) { el.fbGiveBtn.href = give; el.fbGiveQuietLink.href = give; }
  el.fbGive.classList.toggle('is-hidden', !give);
  el.fbGiveQuiet.classList.toggle('is-hidden', !give);
  if (!spent) {
    el.fbCount.textContent = `${el.fbInput.value.trim().length} / 2000`;
    el.fbSend.disabled = el.fbInput.value.trim().length < 4;
  }
}

async function sendFeedback() {
  const body = el.fbInput.value.trim();
  if (body.length < 4) { el.fbInput.focus(); return; }

  el.fbSend.disabled = true;
  el.fbSend.querySelector('.btn-text').textContent = 'Sending…';

  try {
    /* The reason goes to the console and no further. A fetch that rejects
       has not been refused by anything — the request never left, so the
       only words on offer are the engine's own, and they are "Failed to
       fetch" on Chrome and "Load failed" on Safari. Neither is a sentence
       to put in front of someone who has just written you a note. */
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    }).catch((err) => { console.warn('feedback, in full:', err.message); return null; });

    /* Offline is an ordinary state in this app, not a fault, and the box
       still holds what they typed — so the copy says both. */
    if (!res) throw new Error('no signal. Your note is still here');

    if (res.ok || res.status === 429) {
      // 429 means the server already has one from today. Either way this
      // device is spent for the day, and the thanks screen is honest.
      state.sentFeedbackOn = utcDay();
      save();
      el.fbInput.value = '';
      el.fbThanksText.textContent = res.status === 429
        ? 'Looks like one already came through from here today — the box opens again tomorrow.'
        : 'That is your one for today — the box opens again tomorrow.';
      paintFeedback();
      return;
    }

    if (res.status === 503) throw new Error('the feedback box is not wired up yet');
    throw new Error('something broke on our end');
  } catch (err) {
    console.warn('feedback failed:', err.message);
    toast(`Could not send — ${err.message}.`);
    el.fbSend.disabled = false;
  } finally {
    el.fbSend.querySelector('.btn-text').textContent = 'Send it';
  }
}

/* ---------------- swipe a row ----------------

   Two exits, moved under the thumb. Left is the tick the row already had.
   Right is Remove, which until now was two taps down inside the detail —
   nowhere near where you notice the sorter has invented something.

   Nothing commits without saying so first. The rail behind the row names
   what letting go would do, and it only fills — colour, and a tick of
   haptic — once the row is far enough over that letting go acts. Short of
   that it springs back and the rail fades with it. Remove lands in a toast
   holding an undo; done lands in the pile at the foot of the lists, which
   is what that pile is for.

   The row rides on a track: the <li> holds the two rails and clips them,
   the card slides over the top. That is what keeps the colour inside the
   row's own rounded edge instead of painting a band across the list. */

const SWIPE_SLOP  = 12;    // across, before this is a swipe and not a scroll
const SWIPE_ARM   = .20;   // of the row's width — past this, letting go acts
const SWIPE_ARM_MAX = 96;  // and never further than this, whatever the row's width
const SWIPE_LIMIT = .58;   // and this is as far as the card will travel
const SWIPE_FLICK = .55;   // px/ms — a flick this fast counts, short of the mark
const SWIPE_OUT   = 180;   // the card leaves in this, then the list redraws

let swipe = null;         // a finger on a row, not yet certainly a swipe
let swipeLeaving = false; // a row on its way out; no second one until it lands
let swipeGuard = null;    // {card, until} — the click a finished swipe leaves

/* A swipe ends in a click on the row it just moved. Rows ask this before
   acting on one — without it, everything you swiped and let go of would
   open its detail on the way back. Held against the one row, so a tap on
   a different one in the same half second is still a tap. */
function swiped(card) {
  return !!swipeGuard && swipeGuard.card === card && Date.now() < swipeGuard.until;
}

const RAIL_REMOVE = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4.5 7h15M10 7V5.6A1.6 1.6 0 0 1 11.6 4h.8A1.6 1.6 0 0 1 14 5.6V7m3 0v12.4A1.6 1.6 0 0 1 15.4 21H8.6A1.6 1.6 0 0 1 7 19.4V7" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const RAIL_DONE   = '<svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M5 12.5l5 5L19 7" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/></svg>';

/* Both rails lie across the whole row and only the one the gap has
   uncovered is ever shown. Sizing a rail to the gap instead would be a
   second thing to keep in step with the card, for a band nobody can see
   past it. Hidden from the reader: they double for buttons that are still
   on the row and still reachable. */
function swipeRails() {
  const rails = document.createElement('div');
  rails.className = 'swipe-rails';
  rails.setAttribute('aria-hidden', 'true');

  const remove = document.createElement('span');
  remove.className = 'swipe-rail swipe-rail--remove';
  remove.innerHTML = `${RAIL_REMOVE}<span>Remove</span>`;

  const done = document.createElement('span');
  done.className = 'swipe-rail swipe-rail--done';
  done.innerHTML = `<span>Done</span>${RAIL_DONE}`;

  rails.append(remove, done);
  return rails;
}

/** Puts a rendered card on a track and arms the gesture. Hands back the
    <li> that goes in the list. */
function swipeRow(card, task, after) {
  const track = document.createElement('li');
  track.className = 'swipe';
  card.classList.add('swipe-card');
  track.append(swipeRails(), card);

  card.addEventListener('pointerdown', (e) => swipeStart(e, track, card, task, after));
  card.addEventListener('pointermove', swipeMove);
  return track;
}

/* The end of a swipe is watched from the document, not from the row. The
   up can land anywhere — the capture can be taken off us, the finger can
   leave over the tab bar — and a gesture that never hears the end of
   itself leaves its row parked half open and deaf to the next touch.
   One pair of listeners for every row there will ever be, and they fire
   once a gesture, so this costs nothing per move. */
document.addEventListener('pointerup', swipeEnd);
document.addEventListener('pointercancel', swipeCancel);

function swipeStart(e, track, card, task, after) {
  if (e.button > 0) return;                   // right-click and friends
  if (swipe || drag || swipeLeaving) return;
  /* Anything you can press is not a handle: the tick, Edit and Remove in
     the detail, the title while it is being reworded. */
  if (e.target.closest('button, input, a')) return;

  clearTimeout(track._swipeSettle);           // swiped again mid-spring-back
  track.classList.remove('is-settling');

  swipe = {
    track, card, task, after,
    id: e.pointerId,
    x: e.clientX, y: e.clientY,
    lastX: e.clientX, lastT: e.timeStamp,
    dx: 0, vx: 0, live: false, armed: false,
    w: card.getBoundingClientRect().width || 1,
  };
}

function swipeMove(e) {
  if (!swipe || e.pointerId !== swipe.id) return;
  if (drag) {                           // the long press got there first
    const { track, card, live } = swipe;
    swipe = null;
    if (live) { track.classList.remove('is-swiping'); settleSwipe(track, card); }
    return;
  }

  const dy = e.clientY - swipe.y;
  let dx = e.clientX - swipe.x;

  if (!swipe.live) {
    /* Down the page belongs to the list and stays there: only a move that
       is plainly sideways takes the row. */
    if (Math.abs(dy) >= Math.abs(dx)) {
      if (Math.abs(dy) > SWIPE_SLOP) swipe = null;
      return;
    }
    if (Math.abs(dx) < SWIPE_SLOP) return;

    swipe.live = true;
    swipe.x += Math.sign(dx) * SWIPE_SLOP;    // carry on from here, not from a jump
    dx -= Math.sign(dx) * SWIPE_SLOP;
    /* A touch captures to the row on its own; a mouse does not, and
       without this a fast drag leaves the card and the row stops
       following the pointer. Not worth a gesture if the pointer has
       already gone — hence the catch. */
    try { swipe.card.setPointerCapture(swipe.id); } catch (_) {}
    swipe.track.classList.add('is-swiping');
  }

  /* Speed off the last few frames rather than the last pair of them. Two
     moves can arrive inside the same millisecond, and a pair that close
     is either a divide by zero or a number with no information in it. */
  const dt = e.timeStamp - swipe.lastT;
  if (dt >= 8) {
    swipe.vx = (e.clientX - swipe.lastX) / dt;
    swipe.lastX = e.clientX;
    swipe.lastT = e.timeStamp;
  }

  paintSwipe(dx);
}

/* Follows the finger to the limit and then resists, so the row cannot be
   thrown off the side and left there. The gesture stays reversible right
   up to the moment it is not. */
function paintSwipe(raw) {
  const { track, card, w } = swipe;
  const limit = w * SWIPE_LIMIT;
  const past = Math.abs(raw) - limit;
  const dx = Math.sign(raw) * (past > 0 ? limit + past * .3 : Math.abs(raw));
  swipe.dx = dx;

  /* A share of the row, capped. A share on its own reads right on a phone
     and turns into a haul on anything wider — the column runs to 720px,
     where a fifth of it is most of a thumb's reach. */
  const p = Math.min(1, Math.abs(dx) / Math.min(w * SWIPE_ARM, SWIPE_ARM_MAX));
  card.style.transform = `translate3d(${dx.toFixed(1)}px,0,0)`;
  track.style.setProperty('--p', (.35 + p * .65).toFixed(3));
  /* How much of the row is actually uncovered. The rail's word waits on
     this: a narrow gap gets the icon and nothing cut in half. */
  track.style.setProperty('--gap', Math.round(Math.abs(dx)));
  track.classList.toggle('is-right', dx > 0);
  track.classList.toggle('is-left',  dx < 0);

  const armed = p >= 1;
  if (armed !== swipe.armed) {
    swipe.armed = armed;
    track.classList.toggle('is-armed', armed);
    if (armed) navigator.vibrate?.(8);   // the mark, felt rather than read
  }
}

function swipeEnd(e) {
  if (!swipe || e.pointerId !== swipe.id) return;
  const { track, card, task, after, dx, vx, armed, live, lastT } = swipe;
  swipe = null;
  if (!live) return;                    // never claimed — that was a tap

  releaseSwipe(card, e.pointerId);
  track.classList.remove('is-swiping');
  swipeGuard = { card, until: Date.now() + 350 };   // for the click on its way

  /* A short, fast flick reads as decided; it is the slow short push that
     is a change of mind. A row held still before the finger came off is
     neither, whatever it was doing on the way there. */
  const flick = e.timeStamp - lastT < 90
             && Math.abs(vx) > SWIPE_FLICK
             && Math.sign(vx) === Math.sign(dx)
             && Math.abs(dx) > SWIPE_SLOP * 3;

  if (armed || flick) leaveSwipe(track, card, task, after, dx < 0);
  else settleSwipe(track, card);
}

/* A cancel is the browser taking the gesture back — the page scrolled
   under it, or a call came in. Nothing was decided, so nothing happens. */
function swipeCancel(e) {
  if (!swipe || e.pointerId !== swipe.id) return;
  const { track, card, live } = swipe;
  swipe = null;
  if (!live) return;
  releaseSwipe(card, e.pointerId);
  track.classList.remove('is-swiping');
  settleSwipe(track, card);
}

function releaseSwipe(card, id) {
  try { if (card.hasPointerCapture(id)) card.releasePointerCapture(id); } catch (_) {}
}

/* Short of the mark: back where it was, and the rail goes out with it.
   The direction classes are held until the spring has landed, or the
   colour would vanish a frame after you let go and the row would slide
   home over nothing. */
function settleSwipe(track, card) {
  track.classList.add('is-settling');
  track.classList.remove('is-armed');
  card.style.transform = '';
  track.style.setProperty('--p', '0');
  track._swipeSettle = setTimeout(() => {
    track.classList.remove('is-settling', 'is-left', 'is-right');
  }, 240);
}

/* Past it: the card leaves the way it was pushed, and the list redraws
   without it. The row is off the screen before the store is touched — the
   wait is the movement, not a spinner over a finished decision. */
function leaveSwipe(track, card, task, after, done) {
  swipeLeaving = true;
  track.classList.add('is-leaving', 'is-armed');
  track.style.setProperty('--p', '1');
  track.style.setProperty('--gap', '999');   // it is all gap from here
  card.style.transform =
    `translate3d(${done ? '-' : ''}${Math.round(track.offsetWidth + 40)}px,0,0)`;

  setTimeout(() => {
    swipeLeaving = false;
    if (done) markDone(task.id, after);
    else removeTask(task.id, after);
  }, stillMotion() ? 0 : SWIPE_OUT);
}

/* goToNext() goes through show(), which rewinds the scroller: right when
   you have just arrived from another screen, wrong when a row four lists
   down has gone and the next one should be under the thumb that swiped
   it. */
function keepPlace(render) {
  const y = el.scroller.scrollTop;
  render();
  el.scroller.scrollTop = y;
}

/* ---------------- Google Calendar ----------------
   One direction only: the app is the source of truth and the calendar is
   a view of it. Whatever is on your agenda — still to do, and carrying a
   day — gets an event; everything else does not. Tick something off,
   delete it, or clear the lists, and the event goes with it. Nothing is
   ever read back out of Google, so an event you edit over there will be
   put back the next time the task it came from changes.

   The push is a reconcile, not a queue of operations. Each task remembers
   the id of its event and a signature of the fields the event is built
   from; a pass compares what should exist against that record and fixes
   the difference. It costs one loop over the tasks and it is idempotent,
   which is what makes it survive the things that actually go wrong here —
   a closed laptop mid-sync, a dead tunnel, a token that aged out between
   two calls. Nothing is lost by running it again.

   None of this touches the calendars you already had. The scope the app
   asks for only lets it create and edit its own. See gcal.js. */

/* Long enough to swallow a burst — a triage lands eight tasks with eight
   save() calls — short enough that a single edit feels immediate. */
const SYNC_DEBOUNCE = 1200;

/* A cap per pass, so a first link with a big backlog does not fire two
   hundred requests at once and trip Google's rate limiter. What is left
   over is picked up by the pass this one schedules on its way out. */
const SYNC_BATCH = 24;

let syncTimer = null;
let syncing = false;
let syncState = 'idle';   // idle | working | stale | error
let syncError = null;

/** Belongs on the calendar: still to do, and pinned to a day. */
const syncable = (t) => !t.done && !!t.when;

/* The fields the event is actually built from. If none of these moved,
   the event on Google is still correct and the pass skips it — which is
   why re-rendering, ticking a different task, or renaming yourself does
   not generate any traffic at all. */
function eventSig(t) {
  return [t.title, t.when, t.at || '', t.minutes, t.firstStep || ''].join(' :: ');
}

function localStamp(d) {
  return `${dayKey(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}:00`;
}

function eventBody(t) {
  const body = {
    summary: t.title,
    /* The first step is the whole point of the app, so it travels with the
       event: seeing "Open the letter and read the first line" in a phone
       notification is worth far more than seeing the task title again. */
    description: [
      t.firstStep ? `First step: ${t.firstStep}` : null,
      `${minutesLabel(t.minutes)} · ${t.energy} energy · ${categoryLabel(t.category)}`,
      '',
      'Added by my.adhd. Tick it off in the app and this disappears.',
    ].filter(line => line !== null).join('\n'),
    /* Stamped so an event can be traced back to its task from the Google
       side — and so a future two-way sync has something to match on that
       does not depend on the title. */
    extendedProperties: { private: { myadhdId: t.id } },
  };

  if (t.at) {
    const [h, m] = t.at.split(':').map(Number);
    const start = keyToDate(t.when);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + t.minutes * 60000);
    body.start = { dateTime: localStamp(start), timeZone: gcal.timeZone() };
    body.end   = { dateTime: localStamp(end),   timeZone: gcal.timeZone() };
  } else {
    /* A day with no time is an all-day event, not an invented 9am. The end
       date on an all-day event is exclusive, hence the +1. */
    body.start = { date: t.when };
    body.end   = { date: dayKey(addDays(keyToDate(t.when), 1)) };
  }

  return body;
}

/** Send a task's event id to be deleted, because the task is going away. */
function orphanEvent(t) {
  if (t && t.gcal && t.gcal.id && !state.gcalOrphans.includes(t.gcal.id)) {
    state.gcalOrphans.push(t.gcal.id);
  }
}

/** Undo's half of that, for a removal that gets taken back in time. */
function unorphanEvent(t) {
  if (!t || !t.gcal || !t.gcal.id) return;
  state.gcalOrphans = state.gcalOrphans.filter(id => id !== t.gcal.id);
}

/* save() calls this on every write. It has to be free for everyone who
   never turns the calendar on, which is the common case. */
function syncSoon() {
  if (syncing) return;                        // the pass re-checks on its way out
  if (!window.gcal || !gcal.connected()) return;
  clearTimeout(syncTimer);
  syncTimer = setTimeout(syncNow, SYNC_DEBOUNCE);
}

async function syncNow() {
  if (syncing || !window.gcal || !gcal.connected()) return;

  /* Work out what needs doing before anything is awaited. The store can be
     written to while a request is in flight — the plan is a snapshot, and
     each step re-checks the task it is about to touch. */
  const plan = [];
  for (const t of state.tasks) {
    if (syncable(t)) {
      if (!t.gcal) plan.push({ op: 'add', t });
      else if (t.gcal.sig !== eventSig(t)) plan.push({ op: 'edit', t });
    } else if (t.gcal) {
      plan.push({ op: 'drop', t });           // ticked off, or its day was taken away
    }
  }
  for (const id of state.gcalOrphans) plan.push({ op: 'kill', id });

  if (!plan.length) { markSync('idle'); return; }

  syncing = true;
  markSync('working');

  const batch = plan.slice(0, SYNC_BATCH);
  let dirty = false;
  let failure = null;

  try {
    /* A live token first, so a whole batch does not fail one call at a
       time when the hour is simply up. */
    const live = await gcal.warm();
    if (!live) throw new Error('reconnect');

    for (const step of batch) {
      try {
        if (step.op === 'add') {
          if (!syncable(step.t)) continue;    // changed under us; the next pass has it
          const sig = eventSig(step.t);
          step.t.gcal = { id: await gcal.insert(eventBody(step.t)), sig };
          dirty = true;

        } else if (step.op === 'edit') {
          if (!syncable(step.t) || !step.t.gcal) continue;
          const sig = eventSig(step.t);
          try {
            await gcal.patch(step.t.gcal.id, eventBody(step.t));
            step.t.gcal.sig = sig;
          } catch (err) {
            if (err.status !== 404 && err.status !== 410) throw err;
            /* Deleted on the Google side. Rebuild it rather than carrying
               a dead id around for ever. */
            step.t.gcal = { id: await gcal.insert(eventBody(step.t)), sig };
          }
          dirty = true;

        } else if (step.op === 'drop') {
          if (syncable(step.t) || !step.t.gcal) continue;
          await gcal.remove(step.t.gcal.id);
          step.t.gcal = null;
          dirty = true;

        } else {
          await gcal.remove(step.id);
          state.gcalOrphans = state.gcalOrphans.filter(x => x !== step.id);
          dirty = true;
        }
      } catch (err) {
        /* Rate limiting is not a failure, it is a "later". Stop the batch
           and let the next pass carry on from where this one got to — the
           plan is rebuilt from scratch each time, so nothing is skipped. */
        if (err.status === 403 || err.status === 429) { failure = err; break; }
        throw err;
      }
    }
  } catch (err) {
    failure = err;
  } finally {
    syncing = false;
    /* Written directly rather than through save(), which would call
       syncSoon() straight back round. The scheduling below is the
       deliberate version of that. */
    if (dirty) { try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {} }
  }

  if (failure) {
    syncError = failure.message;
    /* An expired grant is the one worth telling the user about, because
       they are the only one who can fix it. The rest is worth retrying
       quietly rather than nagging about. */
    markSync(/reconnect|interaction_required|invalid_grant|401/.test(failure.message)
      ? 'stale' : 'error');
    return;
  }

  markSync('idle');
  if (plan.length > batch.length) syncTimer = setTimeout(syncNow, 400);
  else syncSoon();   // catches anything written while the batch was in flight
}

function markSync(next) {
  if (next !== 'error' && next !== 'stale') syncError = null;
  if (syncState === next) return;
  syncState = next;
  if (el.screenSettings && !el.screenSettings.classList.contains('is-hidden')) {
    paintGoogle();
    paintAccount();   // it owns the button that drives this now
  }
}

/* ---------------- the duplicate calendars ----------------
   Ours to offer to clean up, because ours to have made: for a while every
   device that linked ran its own find-or-create, and two that linked close
   together both found nothing and both created one.

   The check is cheap and quiet — it costs one list call when the profile
   screen opens, and says nothing at all in the normal case where there is
   only ever one. */

let strayCals = [];

async function checkDuplicateCalendars() {
  if (!window.gcal || !gcal.connected()) { strayCals = []; return; }
  try {
    strayCals = await gcal.strays();
  } catch (_) {
    strayCals = [];
  }
  paintGoogle();
}

/* Two stages, like clearing the lists: the first press says what it found
   and what it is about to do, the second does it. A calendar is somebody's
   data even when we are the ones who put it there. */
let dupeArmed = false;

async function removeDuplicateCalendar() {
  const stray = strayCals[0];
  if (!stray) return;

  if (!dupeArmed) {
    dupeArmed = true;
    el.gcalDupeBtn.textContent = 'Checking what is in it…';
    el.gcalDupeBtn.disabled = true;

    let found;
    try {
      found = await gcal.inspect(stray.id);
    } catch (err) {
      dupeArmed = false;
      el.gcalDupeBtn.disabled = false;
      el.gcalDupeBtn.textContent = 'Remove the spare';
      toast('Could not look inside it. Nothing was touched.');
      return;
    }

    /* The one thing that stops this. Everything the app puts in a calendar
       carries the id of the task it came from; anything without one was
       put there by a person, and a person's event is not ours to delete
       along with the calendar holding it. */
    if (found.foreign > 0) {
      dupeArmed = false;
      el.gcalDupeBtn.classList.add('is-hidden');
      el.gcalDupeNote.textContent =
        `That spare calendar has ${found.foreign === 1 ? 'an event' : found.foreign + ' events'} `
        + 'in it that did not come from this app, so it is not mine to delete. '
        + 'Have a look in Google and remove it there if you want it gone.';
      return;
    }

    el.gcalDupeBtn.disabled = false;
    el.gcalDupeBtn.textContent = found.total
      ? `Delete it and its ${found.total === 1 ? 'event' : found.total + ' events'}`
      : 'Delete it — it is empty';
    el.gcalDupeNote.textContent = found.total
      ? 'Everything in it came from your lists, so it will all come back on the '
        + 'calendar you are keeping. Press again to go ahead.'
      : 'Nothing is in it. Press again to go ahead.';
    strayCals[0].found = found;
    return;
  }

  el.gcalDupeBtn.disabled = true;
  el.gcalDupeBtn.textContent = 'Removing…';

  try {
    await gcal.drop(stray.id);
  } catch (err) {
    dupeArmed = false;
    el.gcalDupeBtn.disabled = false;
    el.gcalDupeBtn.textContent = 'Remove the spare';
    toast(`Could not remove it — ${err.message}.`);
    return;
  }

  /* The events in it are gone with it, so every task that had one is now
     carrying a dead id. Clearing it is what puts them back: the next pass
     sees a dated task with no event and makes one, on the calendar we are
     keeping. Without this they would quietly stay missing — an unchanged
     task is never re-sent, so nothing would ever notice. */
  const orphaned = new Set((stray.found && stray.found.ours) || []);
  let rebuilding = 0;
  state.tasks.forEach(t => {
    if (t.gcal && orphaned.has(t.id)) { t.gcal = null; rebuilding++; }
  });
  state.gcalOrphans = state.gcalOrphans.filter(id => !orphaned.has(id));
  save();

  dupeArmed = false;
  strayCals = strayCals.slice(1);
  el.gcalDupeBtn.disabled = false;
  el.gcalDupeBtn.textContent = 'Remove the spare';
  paintGoogle();

  toast(rebuilding
    ? `Gone. ${rebuilding === 1 ? '1 task is' : rebuilding + ' tasks are'} moving to the one you kept.`
    : 'Gone. One my.adhd calendar left.');

  if (rebuilding) await syncNow();
  paintGoogle();
}

/* ---- the card on the profile ---- */

async function connectGoogle() {
  /* Already linked, so the button is a "go on then" for anyone watching a
     change and wondering whether it went. */
  if (gcal.connected() && syncState !== 'stale') {
    el.gcalBtn.disabled = true;
    await syncNow();
    paintGoogle();
    return;
  }

  el.gcalBtn.disabled = true;
  el.gcalBtn.textContent = 'Opening Google…';

  try {
    await gcal.connect();
    markSync('idle');
    paintGoogle();
    toast('Linked. Anything with a date on it goes to your calendar.');
    await syncNow();
    paintGoogle();
  } catch (err) {
    /* Closing the popup is a decision, not a fault, and it should not come
       back looking like something broke. */
    const quiet = /popup_closed|access_denied|already open/.test(err.message);
    if (!quiet) console.warn('google link failed:', err.message);
    paintGoogle();
    toast(quiet ? 'No problem — nothing was linked.' : `Could not link — ${err.message}.`);
  }
}

async function disconnectGoogle() {
  await gcal.disconnect();
  /* The events stay in Google; what goes is this device's memory of them.
     Clearing the ids means linking again rebuilds from scratch rather than
     patching events it can no longer prove it owns. */
  state.tasks.forEach(t => { t.gcal = null; });
  state.gcalOrphans = [];
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {}
  markSync('idle');
  paintGoogle();
  toast('Unlinked. The events already in Google were left where they are.');
}

function paintGoogle() {
  if (!el.gcalCard) return;

  /* No client ID in config.js means this build cannot do it at all, and a
     button that can only ever fail is worse than no button. The note under
     it goes back to the unqualified promise, because with the card gone
     that promise is once again the whole truth. */
  if (!window.gcal || !gcal.configured()) {
    el.gcalCard.classList.add('is-hidden');
    paintLocalNote();   // with the card gone the note has a shorter truth to tell
    return;
  }
  el.gcalCard.classList.remove('is-hidden');

  const on = gcal.connected();
  const dated = state.tasks.filter(syncable).length;

  el.gcalCard.classList.toggle('is-on', on);
  el.gcalCard.classList.toggle('is-stale', on && syncState === 'stale');
  el.gcalBtn.disabled = syncState === 'working';
  el.gcalOpen.classList.toggle('is-hidden', !on);
  el.gcalOff.classList.toggle('is-hidden', !on);

  if (!on) {
    /* Not linked yet, so this is the button that links it — nothing else
       on the screen offers that. */
    el.gcalDupe.classList.add('is-hidden');
    el.gcalBtn.classList.remove('is-hidden');
    el.gcalState.textContent = 'Not linked';
    el.gcalNote.textContent =
      'Put your dated tasks straight into Google Calendar. The app makes its own ' +
      '“my.adhd” calendar and is only allowed to touch that one — the calendars ' +
      'you already have stay off limits.';
    el.gcalBtn.textContent = 'Link Google Calendar';
    return;
  }

  /* The duplicate goes. Signed in, the account card's button already
     pushes this card too, and two buttons a thumb apart both saying Sync
     now is a question the screen should never have asked.

     It comes back for the one thing that button cannot do: reconnecting.
     That is not a sync, it is Google asking for consent again, and it
     needs the popup this click opens. Signed out there is no account
     button at all, so the card keeps its own. */
  const merged = window.auth && auth.configured() && auth.signedIn();
  el.gcalBtn.classList.toggle('is-hidden', merged && syncState !== 'stale');

  /* Only ever visible because of a bug of ours, and it says which one. */
  const spare = strayCals.length;
  el.gcalDupe.classList.toggle('is-hidden', spare === 0);
  if (spare && !dupeArmed) {
    el.gcalDupeNote.textContent =
      `There ${spare === 1 ? 'is a second calendar' : `are ${spare} more calendars`} called `
      + '“my.adhd” in your Google account. That was my fault — for a while two devices '
      + `linking close together could each make one. Your tasks are on the one above; `
      + `${spare === 1 ? 'the spare is' : 'the spares are'} leftovers.`;
    el.gcalDupeBtn.textContent = 'Remove the spare';
    el.gcalDupeBtn.disabled = false;
  }

  el.gcalState.textContent =
    syncState === 'working' ? 'Syncing…' :
    syncState === 'stale'   ? 'Needs reconnecting' :
    syncState === 'error'   ? 'Sync paused' : 'Linked';

  el.gcalNote.textContent =
    syncState === 'stale'
      ? 'Google wants you to sign in again before the next change can go over.'
      : syncState === 'error'
      ? `The last try did not go through${syncError ? ` — ${syncError}` : ''}. It keeps trying.`
      : dated === 0
      ? 'Nothing on your lists has a date yet. Anything that gets one turns up in your “my.adhd” calendar.'
      : `${dated === 1 ? '1 dated task is' : `${dated} dated tasks are`} kept in your “my.adhd” calendar. Tick one off and it goes from there too.`;

  el.gcalBtn.textContent = syncState === 'stale' ? 'Reconnect' : 'Sync now';
}

/* ---------------- the account ----------------
   Optional, and it has to stay that way. Everything below runs only when
   someone has chosen to sign in; a signed-out user sees the same app that
   existed before any of this, works offline, and is never asked twice.

   Signing in buys exactly two things, and the copy says so rather than
   implying a third: your lists follow you to another device, and the
   calendar link stops expiring — because the refresh token then lives on
   our server, where iOS cannot get in the way of renewing it. */

/* Dismissed once, never shown again. Sits in the same store as everything
   else so clearing the site clears this too. */
function offerDismissed() { return state.signupOfferHidden === true; }

function paintSignupOffer() {
  if (!el.signupOffer) return;
  const worth = window.auth && auth.configured()
    && !auth.signedIn()
    && !offerDismissed()
    && state.tasks.some(t => !t.done);
  el.signupOffer.classList.toggle('is-hidden', !worth);
}

function paintAccount() {
  if (!el.acctCard) return;

  if (!window.auth || !auth.configured()) {
    el.acctCard.classList.add('is-hidden');
    return;
  }
  el.acctCard.classList.remove('is-hidden');

  const user = auth.user();
  el.acctCard.classList.toggle('is-on', !!user);
  el.acctOut.classList.toggle('is-hidden', !user);
  /* Signed out there is no account to end, and a confirm box left armed
     from before would be asking about something that is already gone. */
  el.acctDanger.classList.toggle('is-hidden', !user);
  if (!user) resetAcctDelete();

  if (!user) {
    el.acctFace.textContent = '\u{1F464}';
    el.acctTitle.textContent = 'Just this device';
    el.acctState.textContent = 'Not signed in';
    el.acctNote.textContent =
      'Your lists live in this browser alone, so your phone and your laptop '
      + 'each keep a separate one. Sign in and they become the same list — and '
      + 'the calendar link stops asking you to reconnect.';
    el.acctBtn.textContent = 'Sign in with Google';
    el.acctBtn.classList.remove('is-hidden');
    el.acctHint.textContent = '';
    el.acctCard.classList.remove('is-stale');
    paintLocalNote();
    return;
  }

  el.acctFace.textContent = '\u{2713}';
  el.acctTitle.textContent = user.name || 'Signed in';
  el.acctState.textContent = user.email || '';
  /* When the calendar is linked this button drives that too, and the note
     is the only place that can say so — the card it used to have its own
     button on is below this one. */
  el.acctNote.textContent =
    window.gcal && gcal.connected() && syncState !== 'stale'
      ? 'Your lists sync to every device you sign in on, and the calendar link '
        + 'renews itself. Sync now pushes both.'
      : 'Your lists sync to every device you sign in on, and the calendar link '
        + 'renews itself.';
  /* Signed in, the button that offered sign-in becomes the one that forces
     everything through: the lists to the account, and the dated ones on to
     Google. It exists because of the failure it is named after — a device
     that has not checked in for a while is indistinguishable, from the
     outside, from a device whose lists are simply up to date, and
     "eventually" is no use to somebody standing in front of a screen that
     is wrong.

     One button rather than the two that were here, because two buttons
     with the same word on them, one above the other, is a question nobody
     should have to answer to press either. The calendar card keeps its own
     only for the thing this one cannot do — see paintGoogle(). */
  const listsBusy = window.cloud && cloud.state() === 'working';
  const calBusy = syncState === 'working';

  el.acctBtn.classList.remove('is-hidden');
  el.acctBtn.disabled = listsBusy || calBusy;
  el.acctBtn.textContent = listsBusy || calBusy ? 'Syncing…' : 'Sync now';

  /* The hint line doubles as the sync's only report. It says the reassuring
     thing almost always, because almost always that is the true thing —
     and it says so plainly when a pass is failing, since a list quietly
     not travelling is the exact bug this file was written to end. */
  const cloudState = window.cloud ? cloud.state() : 'idle';
  el.acctHint.textContent =
    cloudState === 'working'
      ? 'Bringing this device up to date…'
      : cloudState === 'error'
      ? `Your lists are not travelling right now${cloud.error() ? ` — ${cloud.error()}` : ''}. It keeps trying.`
      : 'Signing out leaves this device’s copy alone.';
  el.acctCard.classList.toggle('is-stale', cloudState === 'error');
  paintLocalNote();
}

/* The line at the bottom of the profile, which is a promise and therefore
   has to keep being true. Signed out it is the flat one it always was.
   Signed in it cannot be — the lists are in the account, that is the whole
   point of the account — so it says so rather than quietly going on
   claiming otherwise. */
function paintLocalNote() {
  if (!el.localNote) return;

  const gcalOn = window.gcal && gcal.configured();
  const signedIn = window.auth && auth.configured() && auth.signedIn();

  el.localNote.textContent = signedIn
    ? 'Your lists are on this device and in your account, which is how they '
      + 'reach your other devices. Your name, your face and the calendar link '
      + 'stay on this device only.'
    : gcalOn
    ? 'Your tasks live in this browser only \u2014 no account, no server. The '
      + 'calendar link above is the one exception, and only while it is '
      + 'switched on.'
    : 'This lives in this browser only \u2014 no account, no sync, nothing '
      + 'leaves the device.';
}

/* One button, two jobs, decided by whether there is an account behind it. */
async function acctAction() {
  if (window.auth && auth.signedIn()) return syncEverything();

  el.acctBtn.disabled = true;
  el.acctBtn.textContent = 'Taking you to Google…';
  auth.signIn();     // leaves the page
}

/* Everything the profile screen can push, in one press.

   The lists go first and the calendar second, and that order is the whole
   reason this is one button rather than two run at the same time: a pass
   can bring a dated task down from the other device, and doing Google
   second means that task reaches the calendar in the same press rather
   than waiting for the next one.

   paintAccount() already draws what both halves are doing, so the only
   thing to add is the answer at the end — a pass that finds nothing looks
   exactly like a pass that never ran, and being told is the entire reason
   to press it. */
async function syncEverything() {
  const before = state.tasks.length;
  const linked = window.gcal && gcal.connected();

  paintAccount();
  if (window.cloud) await cloud.now();
  paintAccount();

  const listsBroke = window.cloud && cloud.state() === 'error';
  if (linked && !listsBroke) { await syncNow(); paintAccount(); paintGoogle(); }

  if (listsBroke) { toast('Could not reach your lists. It keeps trying.'); return; }
  if (linked && syncState === 'error') {
    toast('Lists are up to date. Google did not answer — it keeps trying.');
    return;
  }
  if (linked && syncState === 'stale') {
    toast('Lists are up to date. Google wants you to sign in again.');
    return;
  }

  const added = state.tasks.length - before;
  toast(
    added > 0  ? `Up to date. ${added === 1 ? '1 task' : `${added} tasks`} came over.`
  : added < 0  ? 'Up to date. Your other device had removed some.'
  : 'Already up to date.'
  );
}

async function signOutHere() {
  await auth.signOut();
  if (window.cloud) cloud.forget();
  paintAccount();
  paintSignupOffer();
  toast('Signed out. Your lists are still here.');
}

/* ---------------- ending the account ----------------
   Guideline 5.1.1(v): an app that offers accounts has to let people end
   them from inside it, and says in as many words that pointing at an
   email address does not count. privacy.html pointed at an email address.

   Deliberately the same two-stage shape as Clear everything on the lists
   screen, because it is the same kind of moment and the app should not
   keep two vocabularies for "are you sure". What differs is the stake,
   and the copy carries it: clearing takes the tasks, this takes only the
   copy of them, and it says so at both steps. */

let acctDeleteStage = 0;
let acctDeleteTimer;

function resetAcctDelete() {
  acctDeleteStage = 0;
  clearTimeout(acctDeleteTimer);
  if (!el.acctDeleteConfirm) return;
  el.acctDeleteConfirm.classList.add('is-hidden');
  el.acctDeleteConfirm.classList.remove('is-final');
  el.btnAcctDelete.classList.remove('is-hidden');
  el.btnAcctDeleteGo.disabled = false;
}

async function stepAcctDelete() {
  acctDeleteStage += 1;

  if (acctDeleteStage === 1) {
    el.btnAcctDelete.classList.add('is-hidden');
    el.acctDeleteConfirm.classList.remove('is-hidden');
    el.acctDeleteConfirm.classList.remove('is-final');
    el.acctDeleteText.textContent =
      'Delete your account? Your lists stay on this device. What goes is the '
      + 'copy that lets your devices meet — and the Google Calendar link with it.';
    el.btnAcctDeleteGo.textContent = 'Yes, delete my account';
  } else if (acctDeleteStage === 2) {
    el.acctDeleteConfirm.classList.add('is-final');
    el.acctDeleteText.textContent =
      'Last check — this ends the account for good. Signing in again starts a '
      + 'new empty one; it cannot bring this one back.';
    el.btnAcctDeleteGo.textContent = 'Delete my account';
  } else {
    clearTimeout(acctDeleteTimer);
    el.btnAcctDeleteGo.disabled = true;
    el.btnAcctDeleteGo.textContent = 'Deleting…';

    try {
      await auth.deleteAccount();
    } catch (_) {
      /* Back to the last armed step rather than all the way out. The
         answer to a delete that failed is usually to press it again, and
         making somebody walk both stages a second time reads as though
         the app were arguing with them. */
      acctDeleteStage = 2;
      el.btnAcctDeleteGo.disabled = false;
      el.btnAcctDeleteGo.textContent = 'Delete my account';
      clearTimeout(acctDeleteTimer);
      acctDeleteTimer = setTimeout(resetAcctDelete, 20000);
      toast('Could not delete the account. Nothing has changed.');
      return;
    }

    if (window.cloud) cloud.forget();
    resetAcctDelete();
    paintAccount();
    paintSignupOffer();
    toast('Account deleted. Your lists are still on this device.');
    return;
  }

  // don't leave it armed
  clearTimeout(acctDeleteTimer);
  acctDeleteTimer = setTimeout(resetAcctDelete, 20000);
}

/* Runs once at boot, before anything is drawn. Two jobs: catch the tokens
   coming back from Google, and — if there is an account — tell gcal.js it
   can stop asking the browser for tokens and ask the server instead. */
async function wakeAccount() {
  if (!window.auth || !auth.configured()) return;

  let arrived = false;
  try { arrived = await auth.absorbRedirect(); } catch (_) {}

  if (auth.signedIn() && window.gcal && gcal.configured()) {
    try { await gcal.adopt(); } catch (_) { /* the card reports it */ }

    /* Two devices that linked before the account settled which calendar is
       ours each kept their own. This is where they stop disagreeing: the
       account names one, and the device that was using the other one lets
       go of it here.

       Everything this device put in the calendar it just left has to be
       forgotten along with it — an event id is only meaningful inside the
       calendar it was made in, and a task still holding one would never be
       re-sent, so it would simply stop appearing. Cleared, they are rebuilt
       on the shared calendar by the next pass. */
    try {
      const gaveUp = await gcal.reconcile();
      if (gaveUp) {
        let moving = 0;
        state.tasks.forEach(t => { if (t.gcal) { t.gcal = null; moving++; } });
        state.gcalOrphans = [];   // they lived on the calendar we no longer read
        if (moving) { save(); syncSoon(); }
      }
    } catch (_) { /* next boot tries again */ }
  }

  paintAccount();
  paintSignupOffer();

  if (arrived) {
    toast('Signed in. Bringing your lists together…');
    syncSoon();
  }

  /* Whether the session arrived just now or came off disk, this is the
     first moment there is one — so it is the first moment the lists can
     be merged with the other devices'. */
  if (auth.signedIn() && window.cloud) cloud.now();
}

/* ---------------- profile ----------------
   Local and deliberately small: a name to be greeted by, a face to
   recognise the tab by, and a count of what you have got through. It rides
   in the same localStorage record as the tasks, so clearing the site
   clears all of it together. */

const AVATARS = ['🧔🏻', '🧔🏻‍♂️', '👨🏻', '👱🏻‍♂️', '👨🏻‍🦲', '👨🏼‍🦱',
                 '👩🏻', '🧑🏻', '👩🏻‍🦱', '👱🏻‍♀️', '👩🏻‍🦳', '🧑🏻‍🦰'];

/* The one place a stored avatar becomes something to draw.

   A profile is written once and read by every version of the app that
   comes after it, so the value in it is not guaranteed to be one this
   build offers — a store can outlive the list that filled it. Handed
   something unrecognised, textContent will happily print it: a face slot
   with a word in it, wide enough to overflow its circle and sit on top of
   the name beside it.

   A function rather than a line in each painter, because three places
   draw this face — the row on settings, the profile card behind it, and
   the composer — and a guard written into one of them is a guard the
   other two do not have. Anything that shows the avatar goes through
   here.

   The substitution is at the point of drawing and nowhere else. Writing a
   corrected value back to the store would be the tidier-looking fix and
   the wrong one: it would overwrite a choice somebody made, on a device
   that merely happens to be running an older list than the one they made
   it from. What they chose stays saved; only what is on screen changes. */
function avatarFace(avatar) {
  return AVATARS.includes(avatar) ? avatar : AVATARS[0];
}

function paintProfile() {
  const { name, avatar } = state.profile;
  const face = avatarFace(avatar);

  /* The row on settings wears the face too, so the way into the profile
     screen looks like the thing it opens. */
  if (el.setFace) el.setFace.textContent = face;
  if (el.setProfileNote) el.setProfileNote.textContent = name ? `Hey ${name}.` : 'Hey there.';

  el.avatarBig.textContent = face;
  el.greeting.textContent = name ? `Hey ${name}.` : 'Hey there.';
  if (el.nameInput.value !== name) el.nameInput.value = name;
  [...el.avatarPick.children].forEach(b => {
    const on = b.dataset.avatar === face;
    b.classList.toggle('is-on', on);
    b.setAttribute('aria-pressed', String(on));
  });
}

function buildAvatarPicker() {
  AVATARS.forEach(face => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'avatar-opt';
    b.dataset.avatar = face;
    b.textContent = face;
    b.setAttribute('aria-label', `Use ${face} as your face`);
    b.addEventListener('click', () => {
      state.profile.avatar = face;
      save();
      paintProfile();
    });
    el.avatarPick.appendChild(b);
  });
}

/* Everything settings draws, without showing it. Split out so a cloud pull
   can repaint the screen underneath somebody rather than navigating them
   to it. paintFeedback() comes along because the feedback box lives here
   now — moving it did not change a line of what it does, the donate guard
   included. */
function paintSettings() {
  paintSubscription();
  paintProfile();
  paintGoogle();
  paintAccount();
  paintFeedback();
}

function showSettings() {
  paintSettings();
  show(el.screenSettings);

  /* Behind the screen, like everything else on this card. One list call,
     and in the ordinary case it finds nothing and says nothing. */
  checkDuplicateCalendars();
}


/* ---------------- the plans ----------------
   The subscription rail has existed since b34b0e0 and has never had a
   door. This is the door: a card on settings, and a screen behind it.

   Two things worth knowing before reading the rest.

   The whole thing is behind MYADHD_BILLING_ENABLED, which is the same
   switch config.js uses for the donation tin and it is here for the same
   reason — Apple wants In-App Purchase for anything unlocked inside an
   app, and the iOS shell needs to be able to close this from its own
   side without touching a line of web code.

   And billing.js fails closed on purpose: a read that could not happen
   reports not-entitled, which is indistinguishable from a free account.
   So nothing here may say "Upgrade" until a read has actually landed.
   state().loaded is the difference between "you have not paid" and "I do
   not know yet", and showing the first when you mean the second is how
   you tell somebody who paid that the app forgot. */

function billingOn() {
  return !!window.billing && !!window.MYADHD_BILLING_ENABLED;
}

/** What a plan is called once it is bought. */
function planLabel(plan) {
  return plan === 'lifetime' ? 'Lifetime'
       : plan === 'annual'   ? 'Annual'
       : plan === 'weekly'   ? 'Weekly'
       : 'Pro';
}

function paintSubscription() {
  if (!el.setSub) return;

  if (!billingOn()) {
    el.setSub.classList.add('is-hidden');
    return;
  }
  el.setSub.classList.remove('is-hidden');

  const s = billing.state();

  /* Not known yet. Say so plainly rather than guessing downwards. */
  if (!s.loaded) {
    el.setProTitle.textContent = 'my.adhd Pro';
    el.setProNote.textContent = 'Checking your plan…';
    return;
  }

  if (s.entitled) {
    el.setProTitle.textContent = planLabel(s.plan);
    el.setProNote.textContent = s.currentPeriodEnd
      ? (s.cancelAtPeriodEnd ? 'Ends ' : 'Renews ') + dayLabel(dayKey(s.currentPeriodEnd))
      : 'Yours, for good.';
    return;
  }

  el.setProTitle.textContent = 'Upgrade to Pro';
  el.setProNote.textContent = 'Annual plan for RM49.90/year';
}

function paintPlans() {
  if (!billingOn()) return;
  const s = billing.state();
  const has = s.loaded && s.entitled;

  el.plansCurrent.classList.toggle('is-hidden', !has);
  el.plansList.classList.toggle('is-hidden', has);

  if (has) {
    el.plansCurrentTitle.textContent = planLabel(s.plan);
    el.plansCurrentState.textContent = s.currentPeriodEnd
      ? (s.cancelAtPeriodEnd ? 'Ends ' : 'Renews ') + dayLabel(dayKey(s.currentPeriodEnd))
      : 'Lifetime — nothing to renew';
    /* The portal only opens for somebody Stripe has a customer for. */
    el.plansManage.classList.toggle('is-hidden', s.plan === null);
  }

  el.plansNote.classList.toggle('is-hidden', has);
}

function showPlans() {
  paintPlans();
  show(el.screenPlans);
  /* The card on settings may have been painted from a stale read, and
     this is the screen where being wrong actually costs something. */
  if (billingOn()) billing.refresh().then(() => { paintPlans(); paintSubscription(); });
}

/** Hand the browser to Stripe. Everything that can go wrong here is worth
    saying out loud: an unconfigured plan answers 503, and signing out
    mid-tap answers 401, and both are silent failures otherwise. */
async function buyPlan(plan, btn) {
  if (!billingOn()) return;

  const was = btn.textContent;
  btn.disabled = true;
  btn.textContent = 'Opening…';

  try {
    await billing.checkout(plan, 'app');   // leaves the page when it works
  } catch (err) {
    btn.disabled = false;
    btn.textContent = was;
    toast(/50\d/.test(err.message)
      ? 'Plans are not switched on yet. Nothing was charged.'
      : 'Could not open checkout. Nothing was charged.');
  }
}

async function manageBilling() {
  try {
    await billing.portal();
  } catch (_) {
    toast('Nothing to manage yet.');
  }
}


/* ---------------- settings, one tap deeper ----------------
   Three screens rather than three panes inside one. They each want the
   scroll reset and the hidden bar that show() already does, and a pane
   would have meant three mutually exclusive classes on one screen to get
   the same thing worse. */

function showProfileScreen() {
  paintProfile();
  show(el.screenProfile);
}

function showFeedbackScreen() {
  paintFeedback();
  show(el.screenFeedback);
}

/* The one row that does not go anywhere. Three ways down, because the
   share sheet is the newest of the three APIs here and the oldest browser
   that opens this app has none of them.

   A cancelled share rejects with AbortError, which is a person changing
   their mind and not an error — so nothing is said about it. */
async function shareApp() {
  const url = 'https://myadhd.my';
  const text = 'my.adhd — dump everything on your mind, get back one thing to do.';

  if (navigator.share) {
    try {
      await navigator.share({ title: 'my.adhd', text, url });
      return;
    } catch (err) {
      if (err && err.name === 'AbortError') return;
      /* Anything else falls through to the clipboard. */
    }
  }

  try {
    await navigator.clipboard.writeText(url);
    toast('Link copied.');
  } catch (_) {
    window.open(url, '_blank', 'noopener');
  }
}


/* ---------------- home ----------------
   The dump box and everything under it. The box is first and stays first:
   it is what people came for, and it is also the thing the iOS shell
   reaches for by id on a fresh load.

   Everything below it is a widget, and every widget is one entry in
   HOME_WIDGETS. Adding the next one is a block of markup in app.html, a
   paint function here, and a line in that array — nothing else in the app
   knows how many there are or what order they come in. */

const HOME_WIDGETS = [paintToday, paintStats];

/* A first visit has nothing to show, and an empty dashboard is worse than
   no dashboard — five zeroes and a heading that says "nothing" is a worse
   welcome than a blank page. So the widgets wait until there is something
   to be a summary of, and the cold start gets the meme, the question and
   one button instead.

   The bar no longer waits with them. It used to hide here, back when the
   box was on this screen and a first visit had something to do without
   it; now the + is the only way anything gets added, and hiding it would
   leave a new arrival on a page with no way in.

   Clearing everything puts you back here, which is right: there is nothing
   to summarise then either. */
function coldStart() {
  return state.tasks.length === 0 && state.notes.length === 0;
}

function renderHome() {
  const cold = coldStart();
  el.homeWidgets.classList.toggle('is-hidden', cold);
  el.homeStart.classList.toggle('is-hidden', !cold);
  if (!cold) HOME_WIDGETS.forEach(fn => fn());
}

function showHome() {
  renderHome();
  show(el.screenHome);
}

/* What is actually next, in the order the day presses on you: anything
   late, then anything dated today, then whatever is simply open. Three at
   most — this is the answer to "what now", and a list of ten is the
   question again. The lists tab is one tap away and says everything. */
function paintToday() {
  const today = dayKey();
  const open = state.tasks.filter(t => !t.done);
  const late = overdueTasks(today);
  const now = tasksOn(today);

  const seen = new Set();
  const next = [];
  [late, now, [...open].sort((a, b) => dueAt(a) - dueAt(b) || b.urgency - a.urgency)]
    .forEach(group => group.forEach(t => {
      if (next.length < 3 && !seen.has(t.id)) { seen.add(t.id); next.push(t); }
    }));

  /* The heading carries the bad news, because it is the line that gets
     read whether or not the rows below it do. */
  el.homeTodayTitle.textContent = late.length
    ? (late.length === 1 ? '1 late' : `${late.length} late`)
    : now.length ? 'Today' : 'Next up';
  el.homeTodayTitle.classList.toggle('is-late', late.length > 0);

  el.homeTodayRows.textContent = '';
  next.forEach(t => el.homeTodayRows.appendChild(homeTaskRow(t, today)));

  el.homeTodayEmpty.classList.toggle('is-hidden', next.length > 0);
  el.homeTodayMore.classList.toggle('is-hidden', open.length <= next.length);
}

/* Read-only on purpose. A tick here would be a second .task-check with a
   second undo path behind it, and the row is a signpost — tapping it takes
   you to the place where the task can actually be worked on. */
function homeTaskRow(t, today) {
  const row = document.createElement('button');
  row.type = 'button';
  row.className = 'home-today-row';
  if (t.when && t.when < today) row.classList.add('is-late');

  const title = document.createElement('span');
  title.className = 'home-today-title';
  title.textContent = t.title;
  row.appendChild(title);

  const meta = document.createElement('span');
  meta.className = 'home-today-meta';
  const when = whenLabel(t, today);
  meta.textContent = [when, `${t.minutes} min`].filter(Boolean).join(' · ');
  row.appendChild(meta);

  row.addEventListener('click', goToNext);
  return row;
}

/* The five numbers, lifted out of the profile screen unchanged. They are a
   thing to see on the way in, not something to go looking for. */
function paintStats() {
  const open = state.tasks.filter(t => !t.done);
  const done = state.tasks.filter(t => t.done);
  el.statOpen.textContent = open.length;
  el.statDone.textContent = done.length;
  el.statLists.textContent = groupByCategory(open).length;
  // "on the calendar" is the same set the calendar screen draws: still to
  // do, and carrying a day.
  el.statDated.textContent = open.filter(t => t.when).length;

  /* Overdue is a subset of that, and the only card here that is ever bad
     news — so it is the only one that changes colour. It is shown at zero
     rather than hidden: "0 overdue" is worth reading, and a card that only
     appears when things have gone wrong makes its own arrival alarming.
     overdueTasks() is strict about the boundary — today is not late yet. */
  const late = overdueTasks().length;
  el.statOverdue.textContent = late;
  el.statOverdueCard.classList.toggle('is-late', late > 0);
}


/* ---------------- notes ----------------
   Not the lists, and nothing like them. A task is a thing the app has an
   opinion about: it gets a length, an energy, a first step, a day, and it
   wants to be finished. A note is a thing you wrote down. Nothing sorts
   it, nothing triages it, nothing asks it when it is due, and it never
   becomes a task.

   They live in state.notes, inside the same store as everything else,
   because the iOS shell listens for writes to 'myadhd.v1' and a note
   written anywhere else would be a write the phone never hears.

   A note is a list of BLOCKS, not a string of HTML, and that is a security
   decision rather than a modelling preference. The reason it is acceptable
   to keep a Google access token in localStorage is that no task or note
   text ever reaches innerHTML — every write to the DOM in this file goes
   through textContent or createElement. Storing what contenteditable
   produces would end that, so the editor serialises back out to

     { type, text, marks, done, align }

   on every keystroke, and paints it again from createElement on the way
   in. n.body stays as the flattened plain text so the cards, the search
   and anything reading the store from Swift keep working unchanged. */

const BLOCK_TYPES = ['p', 'h', 'ul', 'ol', 'check'];
const NOTE_FILE_MAX = 3;        // pictures per note
const NOTE_FILE_EDGE = 1024;    // longest side, px
const NOTE_FILE_Q = 0.72;       // jpeg quality

function normalizeBlock(b) {
  const text = String(b && b.text || '').slice(0, 2000);
  const marks = Array.isArray(b && b.marks) ? b.marks
    .map(m => ({
      s: Math.max(0, Math.min(text.length, Number(m.s) | 0)),
      e: Math.max(0, Math.min(text.length, Number(m.e) | 0)),
      b: m.b === true, i: m.i === true, u: m.u === true, strike: m.strike === true,
    }))
    .filter(m => m.e > m.s && (m.b || m.i || m.u || m.strike))
    .slice(0, 60) : [];
  return {
    type: BLOCK_TYPES.includes(b && b.type) ? b.type : 'p',
    text,
    marks,
    done: b && b.done === true,
    align: ['center', 'right'].includes(b && b.align) ? b.align : 'left',
  };
}

function normalizeNote(n) {
  const now = Date.now();
  const body = String(n && n.body || '').slice(0, 20000);

  /* A note written before blocks existed has only a body. It becomes one
     block per line rather than one block holding newlines, because that is
     what the editor would have made of it had it always been there. */
  const blocks = Array.isArray(n && n.blocks) && n.blocks.length
    ? n.blocks.slice(0, 300).map(normalizeBlock)
    : body.split('\n').map(line => normalizeBlock({ text: line }));

  return {
    id: String(n && n.id || ('n_' + Math.random().toString(36).slice(2, 9))),
    title: String(n && n.title || '').slice(0, 160),
    body: blocks.map(b => b.text).join('\n').slice(0, 20000),
    blocks,
    /* A day and a clock time, kept apart for the same reason a task keeps
       them apart: a time with no day is a time on no calendar. */
    remindOn: normalizeDay(n && n.remindOn),
    remindAt: normalizeTime(n && n.remindAt),
    repeat: ['daily', 'weekly', 'monthly'].includes(n && n.repeat) ? n.repeat : '',
    files: Array.isArray(n && n.files)
      ? n.files.slice(0, NOTE_FILE_MAX)
          .filter(f => f && typeof f.src === 'string' && f.src.startsWith('data:image/'))
          .map(f => ({ id: String(f.id || ('f_' + Math.random().toString(36).slice(2, 9))), src: f.src }))
      : [],
    /* How the note looks: which paper, which face. Nothing about the
       words. A note from before this existed gets the paper and the face
       every note has always had. */
    look: normalizeLook(n && n.look),
    createdAt: Number(n && n.createdAt) || now,
    updatedAt: Number(n && n.updatedAt) || Number(n && n.createdAt) || now,
  };
}

const PAPERS = ['lavender', 'violet', 'blue', 'orange', 'red', 'stone', 'white'];
const FONTS  = ['baloo', 'sans', 'mono'];

function normalizeLook(l) {
  return {
    paper: PAPERS.includes(l && l.paper) ? l.paper : 'lavender',
    font:  FONTS.includes(l && l.font)   ? l.font  : 'baloo',
  };
}

/* The canvas and the rail's swatch wear the open note's look. Lavender and
   Baloo are the defaults and are spelled as "no attribute", so a note that
   has never been touched renders exactly as it did before looks existed. */
function applyLook(n) {
  const canvas = document.getElementById('note-canvas');
  const dot = document.getElementById('tool-paper');
  if (!canvas) return;
  if (n.look.paper === 'lavender') delete canvas.dataset.paper; else canvas.dataset.paper = n.look.paper;
  if (n.look.font === 'baloo')     delete canvas.dataset.font;  else canvas.dataset.font  = n.look.font;
  if (dot) { if (n.look.paper === 'lavender') delete dot.dataset.paper; else dot.dataset.paper = n.look.paper; }
}

let openNoteId = null;
let fmtBlock = 0;        // which block the format sheet is pointed at

/* Newest edit first. There is no pinning and no sorting to choose: the
   thing you touched last is the thing you are most likely to want. */
function notesByRecent() {
  return [...state.notes].sort((a, b) => b.updatedAt - a.updatedAt);
}

function noteTitleOf(n) {
  return n.title.trim() || firstLine(n.body) || 'Untitled';
}

function firstLine(body) {
  const line = body.trim().split('\n', 1)[0].trim();
  return line.length > 80 ? line.slice(0, 79) + '…' : line;
}

function noteIsBlank(n) {
  return !n.title.trim() && !n.body.trim() && !n.files.length;
}

/* ---- the index ---- */

function renderNotes() {
  const notes = notesByRecent();

  el.notesSummary.textContent = notes.length
    ? (notes.length === 1 ? '1 note' : `${notes.length} notes`)
    : '';

  el.notesList.textContent = '';
  notes.forEach(n => el.notesList.appendChild(noteCard(n)));

  const empty = notes.length === 0;
  el.notesEmpty.classList.toggle('is-hidden', !empty);
  el.notesList.classList.toggle('is-hidden', empty);
  el.btnNoteNew.classList.toggle('is-hidden', empty);
  el.notesNote.classList.toggle('is-hidden', empty);
  el.notesSummary.classList.toggle('is-hidden', empty);
}

function noteCard(n) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'note-card';
  if (n.look && n.look.paper !== 'lavender') card.dataset.paper = n.look.paper;

  const title = document.createElement('span');
  title.className = 'note-card-title';
  title.textContent = noteTitleOf(n);
  card.appendChild(title);

  /* The first couple of lines of the body, minus whatever is already
     serving as the title — repeating it is a card that says one thing
     twice and tells you nothing about what is inside. */
  const rest = n.title.trim() ? n.body : n.body.trim().split('\n').slice(1).join('\n');
  const preview = rest.trim();
  if (preview) {
    const p = document.createElement('span');
    p.className = 'note-card-preview';
    p.textContent = preview;
    card.appendChild(p);
  }

  const foot = document.createElement('span');
  foot.className = 'note-card-foot';

  const when = document.createElement('span');
  when.className = 'note-card-when';
  when.textContent = noteWhen(n.updatedAt);
  foot.appendChild(when);

  if (n.files.length) foot.appendChild(noteCardTag('icon-clip', String(n.files.length)));
  if (n.remindOn)     foot.appendChild(noteCardTag('icon-bell', whenLabel({ when: n.remindOn, at: n.remindAt })));

  card.appendChild(foot);
  card.addEventListener('click', () => openNote(n.id));
  return card;
}

function noteCardTag(icon, label) {
  const tag = document.createElement('span');
  tag.className = 'note-card-tag';
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  const use = document.createElementNS('http://www.w3.org/2000/svg', 'use');
  use.setAttribute('href', '#' + icon);
  svg.appendChild(use);
  tag.appendChild(svg);
  const t = document.createElement('span');
  t.textContent = label;
  tag.appendChild(t);
  return tag;
}

/* Relative for the first week, because "3 days ago" is what you actually
   remember about a note, and a date after that, because "23 days ago" is
   not. */
function noteWhen(ms) {
  const at = new Date(ms);
  const day = dayKey(at);
  const today = dayKey();
  if (day === today) return timeLabel(at.toTimeString().slice(0, 5)) || 'Today';

  const gap = Math.round((keyToDate(today) - keyToDate(day)) / 86400000);
  if (gap === 1) return 'Yesterday';
  if (gap > 1 && gap < 7) return `${gap} days ago`;
  return dayLabel(day, today);
}

/* ---- painting a block, without innerHTML ----

   Marks are ranges over the block's own text, so the same character can be
   covered by more than one. Cutting at every boundary turns overlapping
   ranges into a flat run of segments, and each segment is then wrapped in
   whichever tags cover it. Text only ever arrives as a TextNode. */

function paintBlockText(host, text, marks) {
  host.textContent = '';
  if (!text) return;
  if (!marks.length) { host.textContent = text; return; }

  const cuts = new Set([0, text.length]);
  marks.forEach(m => { cuts.add(m.s); cuts.add(m.e); });
  const pts = [...cuts].sort((a, b) => a - b);

  for (let i = 0; i < pts.length - 1; i++) {
    const s = pts[i], e = pts[i + 1];
    if (e <= s) continue;
    const on = marks.filter(m => m.s <= s && m.e >= e);
    let node = document.createTextNode(text.slice(s, e));
    [['strike', 's'], ['u', 'u'], ['i', 'i'], ['b', 'b']].forEach(([flag, tag]) => {
      if (!on.some(m => m[flag])) return;
      const wrap = document.createElement(tag);
      wrap.appendChild(node);
      node = wrap;
    });
    host.appendChild(node);
  }
}

/* ---- reading a block back out ----

   The browser is allowed to produce whatever it likes inside the editable
   — execCommand emits <b> on one engine and <span style="font-weight:700">
   on another — and none of it is stored. The walk turns any of it back
   into text plus offsets, and that is the only thing that reaches the
   store. */

function readBlockText(host) {
  const out = [];
  const marks = [];
  let at = 0;

  (function walk(node, flags) {
    node.childNodes.forEach(child => {
      if (child.nodeType === 3) {
        const s = child.nodeValue || '';
        if (!s) return;
        out.push(s);
        if (flags.b || flags.i || flags.u || flags.strike) {
          marks.push({ s: at, e: at + s.length, b: !!flags.b, i: !!flags.i, u: !!flags.u, strike: !!flags.strike });
        }
        at += s.length;
        return;
      }
      if (child.nodeType !== 1) return;

      const tag = child.tagName.toLowerCase();
      if (tag === 'br') { out.push('\n'); at += 1; return; }

      const next = Object.assign({}, flags);
      if (tag === 'b' || tag === 'strong') next.b = true;
      if (tag === 'i' || tag === 'em') next.i = true;
      if (tag === 'u' || tag === 'ins') next.u = true;
      if (tag === 's' || tag === 'strike' || tag === 'del') next.strike = true;

      const st = child.style;
      if (st) {
        const dec = `${st.textDecoration || ''} ${st.textDecorationLine || ''}`;
        if (/bold|^[6-9]00$/.test(String(st.fontWeight || ''))) next.b = true;
        if (st.fontStyle === 'italic') next.i = true;
        if (/underline/.test(dec)) next.u = true;
        if (/line-through/.test(dec)) next.strike = true;
      }
      walk(child, next);
    });
  })(host, {});

  return { text: out.join(''), marks: mergeMarks(marks) };
}

/* Adjacent runs wearing the same flags are one mark. Without this a note
   grows a mark per keystroke and the store fills with fragments. */
function mergeMarks(marks) {
  const out = [];
  marks.forEach(m => {
    const last = out[out.length - 1];
    if (last && last.e === m.s && last.b === m.b && last.i === m.i && last.u === m.u && last.strike === m.strike) {
      last.e = m.e;
      return;
    }
    out.push(m);
  });
  return out;
}

/* ---- the editor ---- */

function currentNote() {
  return state.notes.find(x => x.id === openNoteId) || null;
}

function paintNoteEditor() {
  const n = currentNote();
  if (!n) return;

  el.noteTitle.value = n.title;
  el.noteHeading.textContent = n.title.trim() || 'Note';

  el.noteBlocks.textContent = '';
  let ordinal = 0;
  n.blocks.forEach((b, i) => {
    if (b.type === 'ol') ordinal += 1; else ordinal = 0;
    el.noteBlocks.appendChild(renderBlock(b, i, ordinal));
  });

  paintNoteFiles(n);
  paintNoteRemind(n);
  applyLook(n);
}

function renderBlock(b, i, ordinal) {
  const row = document.createElement('div');
  row.className = `nb nb--${b.type}`;
  row.dataset.i = String(i);

  if (b.type === 'check') {
    const box = document.createElement('button');
    box.type = 'button';
    box.className = 'nb-box' + (b.done ? ' is-done' : '');
    box.setAttribute('aria-label', b.done ? 'Tick off' : 'Not done');
    box.addEventListener('click', () => {
      const n = currentNote();
      if (!n) return;
      n.blocks[i].done = !n.blocks[i].done;
      touchNote(n);
      paintNoteEditor();
    });
    row.appendChild(box);
  } else if (b.type === 'ul') {
    const dot = document.createElement('span');
    dot.className = 'nb-lead';
    dot.textContent = '•';
    row.appendChild(dot);
  } else if (b.type === 'ol') {
    const num = document.createElement('span');
    num.className = 'nb-lead';
    num.textContent = `${ordinal}.`;
    row.appendChild(num);
  }

  const text = document.createElement('div');
  text.className = 'nb-text';
  text.contentEditable = 'true';
  text.spellcheck = true;
  text.dataset.i = String(i);
  text.style.textAlign = b.align;
  if (b.done) text.classList.add('is-done');
  if (i === 0 && !b.text) text.dataset.hint = 'Write something';
  paintBlockText(text, b.text, b.marks);

  text.addEventListener('input', () => readNoteFromDom());
  text.addEventListener('keydown', (e) => blockKey(e, i));
  text.addEventListener('focus', () => { fmtBlock = i; paintFormatSheet(); });

  row.appendChild(text);
  return row;
}

/* Every keystroke reads every block back. A note is a few hundred
   characters and this is cheaper than tracking which one changed and
   getting it wrong — and it is the only place the store is written from,
   so there is one path in and one path out. */
function readNoteFromDom() {
  const n = currentNote();
  if (!n) return;
  el.noteBlocks.querySelectorAll('.nb-text').forEach(host => {
    const i = Number(host.dataset.i);
    const b = n.blocks[i];
    if (!b) return;
    const { text, marks } = readBlockText(host);
    b.text = text.slice(0, 2000);
    b.marks = marks;
  });
  touchNote(n);
}

/* Typing writes straight through, so nothing is ever lost to a closed tab
   — but through persistOnly() rather than save(). save() stamps the tasks
   for the cloud and pokes both sync timers, none of which has anything to
   do with a note, and running it on every keystroke would make the iOS
   shell rebuild its reminders once per letter. save() happens when the
   editor closes. */
function touchNote(n) {
  n.body = n.blocks.map(b => b.text).join('\n').slice(0, 20000);
  n.updatedAt = Date.now();
  persistOnly();
}

/* Enter splits the line into two blocks rather than dropping a <br> into
   one, because a checkbox or a bullet is a property of a line and a line
   has to be a thing before it can carry one. Backspace at the start of an
   empty line takes it away again. */
function blockKey(e, i) {
  const n = currentNote();
  if (!n) return;

  if (e.key === 'Enter' && !e.shiftKey) {
    e.preventDefault();
    const host = e.currentTarget;
    const at = caretOffset(host);
    const b = n.blocks[i];
    const head = b.text.slice(0, at);
    const tail = b.text.slice(at);

    const carry = (b.type === 'ul' || b.type === 'ol' || b.type === 'check');
    /* Enter on an empty bullet ends the list rather than making another
       one, which is what every editor does and what the hand expects. */
    if (carry && !b.text) {
      b.type = 'p';
      b.done = false;
      touchNote(n);
      paintNoteEditor();
      focusBlock(i, 0);
      return;
    }

    b.text = head;
    b.marks = b.marks.filter(m => m.s < head.length).map(m => ({ ...m, e: Math.min(m.e, head.length) }));
    n.blocks.splice(i + 1, 0, normalizeBlock({
      text: tail,
      type: carry ? b.type : 'p',
      align: b.align,
    }));
    touchNote(n);
    paintNoteEditor();
    focusBlock(i + 1, 0);
    return;
  }

  if (e.key === 'Backspace' && i > 0 && caretOffset(e.currentTarget) === 0) {
    e.preventDefault();
    const prev = n.blocks[i - 1];
    const here = n.blocks[i];
    const at = prev.text.length;
    prev.text = (prev.text + here.text).slice(0, 2000);
    here.marks.forEach(m => prev.marks.push({ ...m, s: m.s + at, e: m.e + at }));
    prev.marks = mergeMarks(prev.marks);
    n.blocks.splice(i, 1);
    touchNote(n);
    paintNoteEditor();
    focusBlock(i - 1, at);
  }
}

/* How many characters sit before the caret in this block. Measured with a
   range rather than by counting nodes, so it is right whatever shape the
   browser left the markup in. */
function caretOffset(host) {
  const sel = window.getSelection();
  if (!sel || !sel.rangeCount) return 0;
  const r = sel.getRangeAt(0).cloneRange();
  r.selectNodeContents(host);
  r.setEnd(sel.getRangeAt(0).endContainer, sel.getRangeAt(0).endOffset);
  return r.toString().length;
}

function focusBlock(i, offset) {
  const host = el.noteBlocks.querySelector(`.nb-text[data-i="${i}"]`);
  if (!host) return;
  host.focus();
  fmtBlock = i;

  const sel = window.getSelection();
  const r = document.createRange();
  let left = offset;
  let placed = false;

  (function walk(node) {
    if (placed) return;
    node.childNodes.forEach(child => {
      if (placed) return;
      if (child.nodeType === 3) {
        const len = (child.nodeValue || '').length;
        if (left <= len) { r.setStart(child, left); placed = true; return; }
        left -= len;
      } else if (child.nodeType === 1) {
        walk(child);
      }
    });
  })(host);

  if (!placed) r.selectNodeContents(host), r.collapse(false);
  else r.collapse(true);
  sel.removeAllRanges();
  sel.addRange(r);
}

/* ---- the format sheet ---- */

function paintFormatSheet() {
  const n = currentNote();
  const b = n && n.blocks[fmtBlock];
  if (!b) return;
  el.fmtTypes.querySelectorAll('[data-type]').forEach(btn =>
    btn.classList.toggle('is-on', btn.dataset.type === b.type));
  el.fmtFont.querySelectorAll('[data-font]').forEach(btn =>
    btn.classList.toggle('is-on', btn.dataset.font === (currentNote() || { look: { font: 'baloo' } }).look.font));
  el.fmtAlign.querySelectorAll('[data-align]').forEach(btn =>
    btn.classList.toggle('is-on', btn.dataset.align === b.align));
}

function setBlockType(type) {
  const n = currentNote();
  const b = n && n.blocks[fmtBlock];
  if (!b) return;
  b.type = b.type === type ? 'p' : type;
  if (b.type !== 'check') b.done = false;
  touchNote(n);
  paintNoteEditor();
  focusBlock(fmtBlock, b.text.length);
  paintFormatSheet();
}

function setBlockAlign(align) {
  const n = currentNote();
  const b = n && n.blocks[fmtBlock];
  if (!b) return;
  b.align = align;
  touchNote(n);
  paintNoteEditor();
  focusBlock(fmtBlock, b.text.length);
  paintFormatSheet();
}

/* B/I/U/S go through execCommand because the browser already knows how to
   apply a style to a selection across element boundaries, and whatever it
   emits is read straight back out by readBlockText and thrown away. The
   buttons cancel their own pointerdown so the caret never leaves the text
   — a toolbar that steals focus has nothing to format. */
function applyMark(kind) {
  const cmd = { b: 'bold', i: 'italic', u: 'underline', strike: 'strikeThrough' }[kind];
  if (!cmd) return;
  try {
    document.execCommand('styleWithCSS', false, 'false');
    document.execCommand(cmd, false, null);
  } catch (_) { /* nothing to format */ }
  readNoteFromDom();
}

/* ---- pictures ---- */

function paintNoteFiles(n) {
  el.noteFiles.textContent = '';
  el.noteFiles.classList.toggle('is-hidden', !n.files.length);
  n.files.forEach(f => {
    const wrap = document.createElement('div');
    wrap.className = 'note-file';

    const img = document.createElement('img');
    img.src = f.src;
    img.alt = '';
    wrap.appendChild(img);

    const x = document.createElement('button');
    x.type = 'button';
    x.className = 'note-file-x';
    x.setAttribute('aria-label', 'Remove this picture');
    x.textContent = '×';
    x.addEventListener('click', () => {
      const cur = currentNote();
      if (!cur) return;
      cur.files = cur.files.filter(o => o.id !== f.id);
      touchNote(cur);
      paintNoteFiles(cur);
    });
    wrap.appendChild(x);

    el.noteFiles.appendChild(wrap);
  });
}

/* Downscaled and re-encoded before it is kept, because a note lives in
   localStorage and localStorage is about five megabytes for everything the
   app owns. A phone photo straight off the camera would spend the lot. */
function shrinkImage(file) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      URL.revokeObjectURL(url);
      const scale = Math.min(1, NOTE_FILE_EDGE / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.max(1, Math.round(img.width * scale));
      c.height = Math.max(1, Math.round(img.height * scale));
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', NOTE_FILE_Q));
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('not an image')); };
    img.src = url;
  });
}

async function addNoteFiles(files) {
  const n = currentNote();
  if (!n) return;
  const room = NOTE_FILE_MAX - n.files.length;
  if (room <= 0) { toast(`A note holds ${NOTE_FILE_MAX} pictures.`); return; }

  const take = [...files].slice(0, room);
  for (const file of take) {
    try {
      const src = await shrinkImage(file);
      n.files.push({ id: 'f_' + Math.random().toString(36).slice(2, 9), src });
    } catch (_) { /* not something we can draw — skip it quietly */ }
  }

  try {
    touchNote(n);
  } catch (_) {
    /* Over quota. Put it back rather than leaving a note that cannot be
       written, and say so — a silent failure here loses the writing too. */
    n.files = n.files.slice(0, n.files.length - take.length);
    toast('No room left on this device for that picture.');
  }
  paintNoteFiles(n);
  if (files.length > room) toast(`A note holds ${NOTE_FILE_MAX} pictures.`);
}

/* ---- the reminder ---- */

function paintNoteRemind(n) {
  const on = !!n.remindOn;
  el.noteRemind.classList.toggle('is-hidden', !on);
  el.toolBell.classList.toggle('is-on', on);
  if (!on) return;
  const when = whenLabel({ when: n.remindOn, at: n.remindAt });
  const every = { daily: ', every day', weekly: ', every week', monthly: ', every month' }[n.repeat] || '';
  el.noteRemind.textContent = `Reminder ${when}${every}`;
}

function openRemindSheet() {
  const n = currentNote();
  if (!n) return;
  el.remDay.value = n.remindOn || dayKey();
  el.remTime.value = n.remindAt || '09:00';
  el.remRepeat.value = n.repeat || '';
  el.sheetRemind.classList.remove('is-hidden');
}

function saveRemind() {
  const n = currentNote();
  if (!n) return;
  n.remindOn = normalizeDay(el.remDay.value);
  n.remindAt = n.remindOn ? normalizeTime(el.remTime.value) : null;
  n.repeat = n.remindOn ? el.remRepeat.value : '';
  touchNote(n);
  save();
  paintNoteRemind(n);
  el.sheetRemind.classList.add('is-hidden');
}

function clearRemind() {
  const n = currentNote();
  if (!n) return;
  n.remindOn = null;
  n.remindAt = null;
  n.repeat = '';
  touchNote(n);
  save();
  paintNoteRemind(n);
  el.sheetRemind.classList.add('is-hidden');
}

/* ---- open, close, new, delete ---- */

function openNote(id) {
  const n = state.notes.find(x => x.id === id);
  if (!n) return;
  openNoteId = id;
  fmtBlock = 0;
  el.sheetFormat.classList.add('is-hidden');
  el.sheetRemind.classList.add('is-hidden');
  paintNoteEditor();
  show(el.screenNote);
  if (!n.title.trim() && !n.body.trim()) el.noteTitle.focus();
  else focusBlock(n.blocks.length - 1, n.blocks[n.blocks.length - 1].text.length);
}

/* Leaving the editor. A note nobody typed anything into is not a note —
   it is the button press that opened it, and keeping it would fill the
   screen with blanks for anyone who taps New and changes their mind. */
function closeNote() {
  if (!openNoteId) return;
  const n = currentNote();
  if (n && noteIsBlank(n)) state.notes = state.notes.filter(x => x.id !== openNoteId);
  openNoteId = null;
  save();
}

function leaveNote() {
  closeNote();
  renderNotes();
  show(el.screenNotes);
}

function newNote() {
  const n = normalizeNote({});
  state.notes.push(n);
  save();
  openNote(n.id);
}

function deleteNote() {
  const id = openNoteId;
  const n = state.notes.find(x => x.id === id);
  if (!n) return;

  const at = state.notes.indexOf(n);
  state.notes.splice(at, 1);
  openNoteId = null;
  save();
  renderNotes();
  show(el.screenNotes);

  toast('Note deleted', { label: 'Undo', fn: () => {
    state.notes.splice(at, 0, n);
    save();
    renderNotes();
  }});
}

function showNotes() {
  closeNote();      // tapping the tab while editing always lands on the index
  renderNotes();
  show(el.screenNotes);
}

/* ---------------- the typing preview ----------------
   Shows what the app has spotted a day in, while the dump is still being
   written. It runs the offline date reader, not the model — that is the
   point: it is instant and costs nothing, so it can run on every
   keystroke. The model does the real extraction on submit and may read a
   line differently, which is why the label says "heading for" rather than
   promising a result.

   Only days appear. A line the reader finds nothing in stays silent
   rather than getting a chip saying so — the strip is there to confirm a
   date landed, not to nag about the ones that did not. */

const PREVIEW_MAX = 4;

function previewDates(src, box, chips) {
  // Cheap on any realistic dump, but the reader runs a fistful of regexes
  // per line and this fires on every keystroke, so the input is capped.
  const text = src.value.slice(0, 4000);
  const seen = new Map();

  if (text.trim().length > 2) {
    for (const line of splitDump(text)) {
      const when = parseDay(line);
      if (!when) continue;
      const at = parseClock(line);
      const key = `${when}|${at || ''}`;
      if (!seen.has(key)) seen.set(key, { when, at });
    }
  }

  const found = [...seen.values()]
    .sort((a, b) => a.when.localeCompare(b.when)
                 || (a.at || '99:99').localeCompare(b.at || '99:99'));

  box.classList.toggle('is-hidden', found.length === 0);
  chips.innerHTML = '';          // cleared even when hiding: a live region
  if (!found.length) return;     // should not keep announcing stale chips

  found.slice(0, PREVIEW_MAX).forEach(d => {
    const chip = document.createElement('span');
    chip.className = 'chip chip--when';
    chip.textContent = whenLabel(d);
    chips.appendChild(chip);
  });

  if (found.length > PREVIEW_MAX) {
    const more = document.createElement('span');
    more.className = 'dump-more';
    more.textContent = `+${found.length - PREVIEW_MAX} more`;
    chips.appendChild(more);
  }
}

/* ---------------- wiring ---------------- */

/* The cold start's one button. It opens the composer rather than running
   triage: there is nothing in the buffer yet to sort. */
el.btnStartDump.addEventListener('click', openComposer);
el.btnResort.addEventListener('click', resortLocal);

/* Saved to the home screen, the app is the whole window. There is no tab
   to come back on, so a lockup that leaves for the site would replace the
   app with a page whose only way back is that page's own nav. Standalone
   keeps the mark as a mark; in a browser tab it still goes home. */
if (matchMedia('(display-mode: standalone)').matches || navigator.standalone === true) {
  document.querySelectorAll('.brand-lockup[href]').forEach(a => {
    a.removeAttribute('href');
    a.setAttribute('role', 'img');
    a.setAttribute('aria-label', 'my.adhd');
  });
}
el.btnClearAll.addEventListener('click', stepClear);
el.btnClearGo.addEventListener('click', stepClear);
el.btnClearNo.addEventListener('click', resetClear);
el.btnDumpAgain.addEventListener('click', openComposer);

/* The bar, wired in the order it is drawn. The + opens the composer over
   whatever is on screen — the dump box is still the only place a new list
   gets made, but reaching it should not cost you the page you were on. It
   stays pointed at the composer on the notes screen too: the + means "sort
   this out for me", which is the one thing a note is for not doing. */
el.tabHome.addEventListener('click', showHome);
el.tabCal.addEventListener('click', showCalendar);
el.calPrev.addEventListener('click', () => slideMonth(-1));
el.calNext.addEventListener('click', () => slideMonth(1));
el.calToday.addEventListener('click', () => {
  calPicked = dayKey();
  calCursor = keyToDate(calPicked.slice(0, 8) + '01');
  renderCalendar();
});
el.tabAdd.addEventListener('click', openComposer);
el.tabLists.addEventListener('click', goToNext);
el.tabNotes.addEventListener('click', showNotes);

/* The gear, and the way back out of it. Settings has no tab under it, so
   this button is the only exit — see TAB_FOR. */
el.btnSettings.addEventListener('click', showSettings);
el.btnSettingsBack.addEventListener('click', showHome);

/* The rows that go one tap deeper, and the three ways back. Every back
   button lands on settings rather than on history: the app has no router,
   so there is no history to go back through. */
el.setRowProfile.addEventListener('click', showProfileScreen);
el.setRowFeedback.addEventListener('click', showFeedbackScreen);
el.setRowShare.addEventListener('click', shareApp);
el.btnProfileBack.addEventListener('click', showSettings);
el.btnFeedbackBack.addEventListener('click', showSettings);
el.btnPlansBack.addEventListener('click', showSettings);

/* The plans, and only if there are any. Wiring a dead card would leave a
   row that looks tappable and is not. */
if (window.billing && window.MYADHD_BILLING_ENABLED) {
  el.setPro.addEventListener('click', showPlans);
  el.plansManage.addEventListener('click', manageBilling);
  el.plansList.querySelectorAll('[data-plan]').forEach(btn => {
    btn.addEventListener('click', () => buyPlan(btn.dataset.plan, btn));
  });

  /* The card and the screen both read the same state, and it arrives
     late — once on load, and again whenever the account changes. */
  billing.onChange(() => {
    paintSubscription();
    if (!el.screenPlans.classList.contains('is-hidden')) paintPlans();
  });
}

/* The notes. Typing writes through on every keystroke; see touchNote(). */
el.btnNoteNew.addEventListener('click', newNote);
el.btnNoteFirst.addEventListener('click', newNote);
el.btnNoteBack.addEventListener('click', leaveNote);
el.btnNoteDone.addEventListener('click', leaveNote);
el.btnNoteDelete.addEventListener('click', deleteNote);

el.noteTitle.addEventListener('input', () => {
  const n = currentNote();
  if (!n) return;
  n.title = el.noteTitle.value.slice(0, 160);
  el.noteHeading.textContent = n.title.trim() || 'Note';
  touchNote(n);
});
/* Enter in the title drops into the writing rather than submitting
   anything — there is no form here and nothing to submit to. */
el.noteTitle.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter') return;
  e.preventDefault();
  focusBlock(0, 0);
});

/* Tapping under the last line puts the caret at the end of it, the way a
   sheet of paper behaves. Without this the bottom half of the canvas is
   dead space on a phone. */
el.noteBlocks.addEventListener('pointerdown', (e) => {
  if (e.target !== el.noteBlocks) return;
  const n = currentNote();
  if (!n || !n.blocks.length) return;
  e.preventDefault();
  const last = n.blocks.length - 1;
  focusBlock(last, n.blocks[last].text.length);
});

/* ---- the note toolbar ----
   Every button cancels its own pointerdown. A toolbar that takes focus
   has nothing left to format, and on a phone it would also shut the
   keyboard under itself between one tap and the next. */
[el.toolType, el.toolCheck, el.toolClip, el.toolBell].forEach(b =>
  b.addEventListener('pointerdown', (e) => e.preventDefault()));

function paintPaperSheet() {
  const n = currentNote();
  el.paperRow.querySelectorAll('[data-paper]').forEach(btn =>
    btn.classList.toggle('is-on', !!n && btn.dataset.paper === n.look.paper));
}
el.toolPaper.addEventListener('click', () => {
  const open = !el.sheetPaper.classList.contains('is-hidden');
  el.sheetPaper.classList.toggle('is-hidden', open);
  el.sheetFormat.classList.add('is-hidden');
  el.sheetRemind.classList.add('is-hidden');
  if (!open) paintPaperSheet();
});
el.paperClose.addEventListener('click', () => el.sheetPaper.classList.add('is-hidden'));
el.paperRow.addEventListener('click', (e) => {
  const b = e.target.closest('[data-paper]');
  const n = currentNote();
  if (!b || !n) return;
  n.look.paper = b.dataset.paper;
  applyLook(n);
  paintPaperSheet();
  touchNote(n);
});
el.fmtFont.addEventListener('click', (e) => {
  const b = e.target.closest('[data-font]');
  const n = currentNote();
  if (!b || !n) return;
  n.look.font = b.dataset.font;
  applyLook(n);
  paintFormatSheet();
  touchNote(n);
});

el.toolType.addEventListener('click', () => {
  const open = !el.sheetFormat.classList.contains('is-hidden');
  el.sheetFormat.classList.toggle('is-hidden', open);
  el.sheetRemind.classList.add('is-hidden');
  el.sheetPaper.classList.add('is-hidden');
  if (!open) paintFormatSheet();
});
el.toolCheck.addEventListener('click', () => setBlockType('check'));
el.toolClip.addEventListener('click', () => el.noteFileInput.click());
el.toolBell.addEventListener('click', () => {
  el.sheetPaper.classList.add('is-hidden');
  el.sheetFormat.classList.add('is-hidden');
  openRemindSheet();
});

el.noteFileInput.addEventListener('change', () => {
  if (el.noteFileInput.files && el.noteFileInput.files.length) addNoteFiles(el.noteFileInput.files);
  el.noteFileInput.value = '';   // so the same picture can be picked twice
});

el.fmtClose.addEventListener('click', () => el.sheetFormat.classList.add('is-hidden'));
el.sheetFormat.addEventListener('pointerdown', (e) => {
  if (e.target.closest('button')) e.preventDefault();
});
el.fmtTypes.addEventListener('click', (e) => {
  const b = e.target.closest('[data-type]');
  if (b) setBlockType(b.dataset.type);
});
el.fmtMarks.addEventListener('click', (e) => {
  const b = e.target.closest('[data-mark]');
  if (b) applyMark(b.dataset.mark);
});
el.fmtAlign.addEventListener('click', (e) => {
  const b = e.target.closest('[data-align]');
  if (b) setBlockAlign(b.dataset.align);
});

el.remClose.addEventListener('click', () => el.sheetRemind.classList.add('is-hidden'));
el.remSave.addEventListener('click', saveRemind);
el.remClear.addEventListener('click', clearRemind);
el.homeTodayMore.addEventListener('click', goToNext);
/* ---- tap the empty space to get the keyboard ----
   The textarea is one line tall at the top of a full-height sheet, so
   aiming for it is a two-handed job. The whole body is the target
   instead; the buttons and the text keep their own taps, and a drag
   that came back is not a tap. */
el.compBody.addEventListener('click', (e) => {
  if (dragMoved) return;
  if (e.target.closest('button')) return;
  if (e.target.closest('.composer-input')) return;   // its own caret
  if (e.target.closest('.dump-chips')) return;
  focusComposer();
});

/* The keyboard and the mic cannot both have the bottom of the screen. */
el.compInput.addEventListener('focus', () => {
  el.composer.classList.add('is-typing');
});
el.compInput.addEventListener('blur', () => {
  el.composer.classList.remove('is-typing');
  syncComposer();
});

/* ---- hold to talk ----
   Press and hold, not tap-to-toggle. A toggle leaves the app listening
   after you have walked away from it, and needs you to remember it is
   on; a hold cannot be left running, and letting go is the same gesture
   as being finished.

   Letting go is no longer the end of it. The recording goes off to be
   transcribed and comes back a second or two later, so there is a third
   state between listening and resting — see micWorking. What is in the
   box during that second is the browser engine's rough guess, where the
   browser has one; the good version lands on top of it. */
let micBase = '';       // what was in the box before this hold
let micHeld = 0;        // when the finger landed
let micBusy = false;    // a transcript is in the air

function restMic() {
  micBusy = false;
  el.compMic.classList.remove('is-live', 'is-working');
  el.compVoice.classList.remove('is-live', 'is-working');
  el.compMic.style.removeProperty('--mic-level');
  el.compMicHint.textContent = 'hold to talk';
}

/* The names this person already uses. A transcriber that has seen how
   they spell their own road, their landlord or their clinic will pick
   that over whatever the sound rhymed with, and everything in here came
   out of a task they kept.

   Capitalised runs only, and never the first word of a title — those are
   verbs, because every title starts with one. */
function knownNames() {
  const seen = new Set();
  for (const t of state.tasks) {
    const words = String(t.title || '').split(/[^\p{L}\p{N}'’-]+/u).filter(Boolean);
    let run = [];
    words.forEach((w, i) => {
      const proper = i > 0 && /^\p{Lu}/u.test(w) && w.length > 2;
      if (proper) { run.push(w); return; }
      if (run.length) { seen.add(run.join(' ')); run = []; }
    });
    if (run.length) seen.add(run.join(' '));
    if (seen.size >= 40) break;
  }
  return [...seen].slice(0, 40);
}

async function micDown(e) {
  if (!Voice.available() || Voice.live() || micBusy) return;
  e.preventDefault();              // no long-press menu, no text selection

  /* Pin the gesture to the button. A dump takes half a minute and a thumb
     does not hold still for it — it rolls, it slides, it ends up half off
     a 76px circle without the person having any idea they moved. Without
     capture that is pointerleave, and pointerleave used to end the
     recording in the middle of a sentence. With it, every pointer event
     including the release comes back here no matter where the finger has
     wandered to, and the only thing that stops a recording is letting go. */
  if (e.pointerId !== undefined && el.compMic.setPointerCapture) {
    try { el.compMic.setPointerCapture(e.pointerId); } catch (_) {}
  }

  micHeld = performance.now();
  micBase = el.compInput.value.trim();

  el.compMic.classList.add('is-live');
  el.compVoice.classList.add('is-live');
  /* Not "listening" yet. The first hold of all goes through a permission
     dialog, and telling someone the app is listening while the browser is
     still asking whether it may is a lie about two seconds long — which
     is exactly long enough to say the thing into. */
  el.compMicHint.textContent = 'opening the mic…';

  Voice.start({
    vocab: knownNames(),

    /* Now it is true. On every hold after the first this arrives within a
       few milliseconds and the line above is never really read. */
    onLive() {
      if (Voice.live()) el.compMicHint.textContent = 'listening… let go when done';
    },

    /* The rough live text, where the browser has an engine for it.
       Waiting until release to show anything makes the first hold feel
       like nothing happened. */
    onText(text) {
      if (!Voice.live()) return;
      el.compInput.value = micBase ? micBase + ' ' + text : text;
      syncComposer();
    },

    /* Drives the ring. Without a preview this is the only sign the app
       can hear anything at all, so it is not decoration. */
    onLevel(level) {
      el.compMic.style.setProperty('--mic-level', level.toFixed(2));
    },

    onWarn() {
      if (Voice.live()) el.compMicHint.textContent = 'nearly at the limit — wrap it up';
    },

    /* The cap. Ending it here rather than throwing it away means the two
       minutes someone just said still becomes tasks. */
    onCap() {
      micUp();
      toast('That was the limit — got what you said so far.');
    },

    onError(why) {
      restMic();
      toast(why === 'mic-denied'
        ? 'no mic access — allow it in your browser settings'
        : "couldn't start the mic, try again");
    },
  });
}

async function micUp() {
  if (!Voice.live()) { if (!micBusy) restMic(); return; }
  const quick = performance.now() - micHeld < 400;

  /* Tapped it rather than held it. Nothing was said, so nothing is sent —
     say what the button wants instead of spinning for a second first. */
  if (quick) {
    Voice.abandon();
    restMic();
    el.compInput.value = micBase;
    syncComposer();
    el.compMicHint.textContent = 'hold it down while you talk';
    return;
  }

  micBusy = true;
  el.compMic.classList.remove('is-live');
  el.compMic.classList.add('is-working');
  el.compVoice.classList.remove('is-live');
  el.compVoice.classList.add('is-working');
  el.compMic.style.removeProperty('--mic-level');
  el.compMicHint.textContent = 'writing it down…';

  const { text, source, lang } = await Voice.stop();

  /* The sheet was closed, or another hold started, while that was in the
     air. Whatever came back belongs to a moment that has gone. */
  if (!micBusy) return;
  restMic();

  /* Only ever written when there is something to write. The old line put
     micBase back on an empty result, which on a phone meant a long dump
     the preview had been filling in live vanished the moment anything
     went wrong — the worst possible ending for the one feature whose
     entire job is not losing what you just thought of. Nothing came back,
     so nothing is touched, and whatever the preview heard stays on screen
     to be edited. */
  if (text) {
    el.compInput.value = micBase ? micBase + ' ' + text : text;
  }
  syncComposer();

  if (!text) {
    if (source === 'no-mic') {
      el.compMicHint.textContent = 'the mic never opened';
      toast('Your browser did not let us open the mic — check its site permissions.');
    } else {
      el.compMicHint.textContent = "didn't catch anything that time";
    }
    return;
  }

  /* Which model heard it decides what triage is told about the text —
     see spokenDump. A browser transcript needs the repair pass; a
     Gemini one has already had it. */
  spokenDump = { source, lang };

  if (source === 'browser') {
    toast("Couldn't reach the transcriber — that's the rough version.");
  }
}

el.compMic.addEventListener('pointerdown', micDown);
el.compMic.addEventListener('pointerup', micUp);
/* The gesture being taken away — the system stepping in, the pointer dying
   under us — ends the hold like a release rather than throwing it away.
   Something was said, and a partial transcript beats none. */
el.compMic.addEventListener('pointercancel', micUp);
/* No pointerleave. It used to be here on the reasoning that a finger
   sliding off the button has released it somewhere; on a phone a finger
   slides off the button constantly without releasing anything, and this
   was cutting long dumps off mid-word. Capture makes it moot. */

/* Deliberately nothing on visibilitychange. Ending a live hold when the
   page hides looks right on paper — a backgrounded tab cannot record —
   but a permission prompt, a keyboard and an app switcher all hide the
   page on some browser somewhere, and every one of those would cut a
   recording off mid-sentence. That is the bug this pass exists to fix,
   and it is not worth reintroducing from another direction. Letting go
   is the only thing that ends a hold; if the phone goes away mid-dump
   the pointer is released too, and that path already works. */
/* Space and Enter on a focused button fire a click, not a hold, so the
   keyboard path is a plain toggle. */
el.compMic.addEventListener('keydown', (e) => {
  if (e.key !== ' ' && e.key !== 'Enter') return;
  e.preventDefault();
  if (Voice.live()) micUp(); else micDown(e);
});
el.compCancel.addEventListener('click', cancelComposer);
el.compScrim.addEventListener('click', cancelComposer);
el.compPost.addEventListener('click', sendComposer);
el.compInput.addEventListener('input', syncComposer);
/* Touch first, pointer only for a mouse — see touchPos. The move listener is
   deliberately not passive: once the gesture is ours, preventDefault stops
   Safari doing anything else with it. */
el.compSheet.addEventListener('touchstart', (e) => {
  const p = touchPos(e);
  dragStart({ clientX: p.clientX, clientY: p.clientY, target: p.target, pointerId: -1 });
}, { passive: true });

el.compSheet.addEventListener('touchmove', (e) => {
  const p = touchPos(e);
  dragMove({ clientX: p.clientX, clientY: p.clientY, target: p.target });
  if (dragging && e.cancelable) e.preventDefault();
}, { passive: false });

const endFromTouch = (e) => {
  const p = touchPos(e);
  dragEnd({ clientX: p.clientX, clientY: p.clientY, target: p.target });
};
el.compSheet.addEventListener('touchend', endFromTouch);
el.compSheet.addEventListener('touchcancel', endFromTouch);

el.compSheet.addEventListener('pointerdown', (e) => {
  if (e.pointerType !== 'mouse') return;   // the touch listeners have it
  dragStart(e);
});
el.compSheet.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse') return;
  dragMove(e);
});
el.compSheet.addEventListener('pointerup', (e) => {
  if (e.pointerType !== 'mouse') return;
  dragEnd(e);
});
el.compSheet.addEventListener('pointercancel', (e) => {
  if (e.pointerType !== 'mouse') return;
  dragEnd(e);
});
el.compInput.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); sendComposer(); }
});
document.addEventListener('keydown', (e) => {
  if (e.key !== 'Escape') return;
  if (!el.composer.classList.contains('is-hidden')) { cancelComposer(); return; }
  /* In the editor, Escape shuts whichever sheet is over it before it
     shuts the note — otherwise the one press does two things at once. */
  if (!el.screenNote.classList.contains('is-hidden')) {
    if (!el.sheetFormat.classList.contains('is-hidden')) { el.sheetFormat.classList.add('is-hidden'); return; }
    if (!el.sheetRemind.classList.contains('is-hidden')) { el.sheetRemind.classList.add('is-hidden'); return; }
    leaveNote();
    return;
  }
  /* One level up rather than out. Escape on a screen under settings means
     the same thing the back button does. */
  if (!el.screenProfile.classList.contains('is-hidden')
   || !el.screenFeedback.classList.contains('is-hidden')
   || !el.screenPlans.classList.contains('is-hidden')) { showSettings(); return; }
  if (!el.screenSettings.classList.contains('is-hidden')) showHome();
});
el.fbSend.addEventListener('click', sendFeedback);
el.fbInput.addEventListener('input', paintFeedback);

if (el.acctBtn) {
  el.acctBtn.addEventListener('click', acctAction);
  if (el.gcalDupeBtn) el.gcalDupeBtn.addEventListener('click', removeDuplicateCalendar);
  el.acctOut.addEventListener('click', signOutHere);
  el.btnAcctDelete.addEventListener('click', stepAcctDelete);
  el.btnAcctDeleteGo.addEventListener('click', stepAcctDelete);
  el.btnAcctDeleteCancel.addEventListener('click', resetAcctDelete);
}

if (el.signupYes) {
  el.signupYes.addEventListener('click', () => {
    el.signupYes.disabled = true;
    el.signupYes.textContent = 'Taking you to Google…';
    auth.signIn();
  });
  el.signupNo.addEventListener('click', () => {
    state.signupOfferHidden = true;
    save();
    paintSignupOffer();
  });
}

el.nameInput.addEventListener('input', () => {
  state.profile.name = el.nameInput.value.trim().slice(0, 24);
  save();
  paintProfile();
});

if (el.gcalBtn) {
  el.gcalBtn.addEventListener('click', connectGoogle);
  el.gcalOff.addEventListener('click', disconnectGoogle);
  el.gcalOpen.addEventListener('click', () => {
    /* Straight to the calendar in Google rather than to a settings page:
       the point of linking is to see the thing over there. */
    window.open('https://calendar.google.com/', '_blank', 'noopener');
  });
}

/* Coming back to the tab is the moment worth catching. A phone that has
   been asleep since yesterday has an hour-old token and a store that may
   have been edited on another device's copy of the app; both are sorted
   by one quiet pass. */
document.addEventListener('visibilitychange', () => {
  if (!document.hidden) syncSoon();
});
window.addEventListener('online', syncSoon);

/* Nobody can type into the buffer — it is off screen. So an input event on
   it is somebody else's writing, and there is only one of those: the iOS
   shell's fillDumpBox(), which is how "Hey Siri, dump a thought" and
   myadhd://dump?text= arrive. It fills the box and trusts it is on screen,
   which stopped being true when the box left home — so this opens the
   composer over the text instead, and the promise holds without a line of
   ios/ changing.

   ownWrite guards the app's own passes through the buffer: the composer
   writes into it on send and on cancel, and neither of those is somebody
   asking for the composer to open. It is declared with the other module
   state near the top, because writeBuffer() is defined long before here. */

el.input.addEventListener('input', () => {
  if (ownWrite) return;
  spokenDump = null;
  const text = el.input.value;
  if (!text.trim()) return;
  if (el.composer.classList.contains('is-hidden')) openComposer();
  /* openComposer() copies the buffer in by itself; this only covers text
     that lands while the sheet is already up. */
  if (el.compInput.value !== text) {
    el.compInput.value = text;
    previewDates(el.compInput, el.compDates, el.compChips);
  }
  el.compInput.focus();
});

el.doneToggle.addEventListener('click', () => {
  const open = el.doneToggle.getAttribute('aria-expanded') === 'true';
  el.doneToggle.setAttribute('aria-expanded', String(!open));
  el.doneList.classList.toggle('is-hidden', open);
});

/* ---------------- day / night ----------------
   Three states, not two: "light", "dark", and no stored choice at all,
   which means the OS decides and keeps deciding. Clicking always flips
   away from what is on screen right now, and that lands in the third
   state's place — so a user who matches their system can get back to
   following it only by clearing the site's storage. That is the usual
   trade, and it beats a three-way button nobody reads. */

/* theme.js owns the stored choice, the <html> stamp, the meta colour and
   the toggle buttons — on every page. The app only adds what is its own:
   the loading morph has to be re-pointed when the theme moves. */

function activeTheme() { return window.myadhdTheme.active(); }

/* The loading morph is an mp4, and H.264 carries no alpha — so the ground is
   baked into the file and there is one render per theme, each on that theme's
   --surface. Anything else puts a coloured square in the middle of the page. */
const morph = document.getElementById('loading-morph');
const stillMode = matchMedia('(prefers-reduced-motion: reduce)').matches;

function paintMorph() {
  if (!morph) return;
  const src = `animation/app/morph-${activeTheme()}.mp4`;
  if (morph.getAttribute('src') === src) return;   // reloads the video, so guard it
  morph.setAttribute('src', src);
  if (stillMode) {
    // Held on the first frame — the full mark. The screen loses the motion,
    // not the logo, same as the SVG did when its clock was paused.
    morph.autoplay = false;
    morph.addEventListener('loadeddata', () => { morph.currentTime = 0; morph.pause(); },
                           { once: true });
  }
}

window.myadhdTheme.onChange(paintMorph);


/* ---------------- boot ---------------- */

load();

/* Before pruneDone(), which deletes and therefore needs the bookkeeping in
   place to leave tombstones behind rather than silently dropping tasks
   that would come straight back down on the next pull. */
if (window.cloud) {
  cloud.attach({
    read:    () => state.tasks,
    write:   (tasks) => { state.tasks = tasks; },
    persist: persistOnly,
    repaint: repaintLists,
  });
  cloud.onChange(() => {
    // Only the account card reads this, and only while it is on screen.
    if (!el.screenSettings.classList.contains('is-hidden')) paintAccount();
  });
  if (cloud.stamp()) persistOnly();
}

pruneDone();
/* After pruneDone, so a task that was about to be deleted is not first
   given a date it will never see. */
stampTimeOnly();
paintMorph();

/* Opening the app always lands on home, and the dump box is the first
   thing on it — that is the thing you came to do, and everything else on
   the screen is underneath it.

   It is also a promise to the phone. ios/MyADHD/AppConfig.swift says a
   fresh load of /app lands on the dump box, and BridgeScript's
   fillDumpBox() switches no screen: it fills #dump-input and trusts that
   is the one on view. "Hey Siri, dump a thought" and myadhd://dump?text=
   are both built on that. Landing anywhere else here breaks both of them
   from this side, silently, with nothing in ios/ changed to explain it. */
buildAvatarPicker();
paintProfile();
showHome();

/* Back from Stripe. The webhook is what grants the entitlement and it
   lands a second or two behind the redirect, so one read here would
   usually be a read of the old row — /billing already learned this and
   polls; this does the same, quietly, and stops early once the answer
   changes. The parameter is dropped from the URL either way, so a reload
   or a shared link does not replay it. */
(function absorbCheckout() {
  const q = new URLSearchParams(location.search);
  if (!q.has('paid')) return;

  const paid = q.get('paid') === '1';
  history.replaceState(null, '', location.pathname);

  if (!paid) { toast('Nothing was charged.'); return; }
  if (!window.billing || !window.MYADHD_BILLING_ENABLED) return;

  showSettings();
  toast('Thank you. Sorting out your plan…');

  let tries = 0;
  (function poll() {
    billing.refresh().then((s) => {
      paintSubscription();
      if (!el.screenPlans.classList.contains('is-hidden')) paintPlans();
      if (s.entitled) { toast('You are on ' + planLabel(s.plan) + '.'); return; }
      if (++tries < 6) setTimeout(poll, 1500);
      else toast('Payment went through. The plan will show up shortly.');
    });
  })();
})();

/* The account and the calendar both catch up in the background, behind the
   screen the user actually came for. Nothing here is allowed to hold up the
   dump box, and a failure is silent — the profile cards are where the state
   is reported, and the only place someone can do anything about it.

   wakeAccount() runs first because it is what turns a fresh redirect from
   Google into a session, and gcal.js asks that session for its tokens. */
wakeAccount().finally(() => {
  if (window.gcal && gcal.connected()) syncSoon();
});
