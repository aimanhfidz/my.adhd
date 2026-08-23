/* ============================================================
   my.adhd — MVP feature: Brain Dump -> Auto-Triage -> One Task
   Storage: localStorage only. No accounts, no sync, no friction.
   ============================================================ */

const STORE_KEY = 'myadhd.v1';
const $ = (id) => document.getElementById(id);

const el = {
  screenDump:   $('screen-dump'),
  screenLoad:   $('screen-loading'),
  screenNow:    $('screen-now'),
  input:        $('dump-input'),
  dumpDates:    $('dump-dates'),
  dumpChips:    $('dump-chips'),
  triage:       $('btn-triage'),
  loadingText:  $('loading-text'),
  eyebrow:      $('eyebrow'),
  summary:      $('lists-summary'),
  lists:        $('lists'),
  doneBlock:    $('done-block'),
  doneToggle:   $('done-toggle'),
  doneCount:    $('done-count'),
  doneList:     $('done-list'),
  btnViewLists: $('btn-view-lists'),
  listsBadge:   $('lists-badge'),
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
  calGrid:      $('cal-grid'),
  calToday:     $('cal-today'),
  calAgenda:    $('cal-agenda'),
  calTip:       $('cal-tip'),
  calUndated:   $('cal-undated'),
  screenLoved:  $('screen-loved'),
  fbForm:       $('fb-form'),
  fbInput:      $('fb-input'),
  fbCount:      $('fb-count'),
  fbSend:       $('fb-send'),
  fbThanks:     $('fb-thanks'),
  fbThanksText: $('fb-thanks-text'),
  screenMe:     $('screen-profile'),
  tabbar:       $('tabbar'),
  tabLists:     $('tab-lists'),
  tabCal:       $('tab-calendar'),
  tabAdd:       $('tab-add'),
  tabLoved:     $('tab-loved'),
  tabMe:        $('tab-profile'),
  tabMarkLists: $('tab-mark-lists'),
  tabBadgeCal:  $('tab-badge-cal'),
  tabAvatar:    $('tab-avatar'),
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
};

/* ---------------- state ---------------- */

let state = {
  tasks: [],          // {id,title,minutes,energy,urgency,firstStep,category,steps,done,skipped}
  energy: 'medium',   // how the user feels right now
  profile: { name: '', avatar: '\u{1F642}' },   // this device only — no account behind it
  sentFeedbackOn: null,   // the UTC day of the last note sent from this device
};

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) {
      const saved = JSON.parse(raw);
      state = Object.assign(state, saved);
      // A store written before the profile existed has no profile key, and
      // one written by a half-finished edit may be missing a field.
      state.profile = Object.assign({ name: '', avatar: '\u{1F642}' }, saved.profile || {});
    }
  } catch (_) { /* corrupt store — start fresh rather than crash */ }
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {}
}

/* ---------------- screens ---------------- */

const SCREENS = [el.screenDump, el.screenLoad, el.screenNow,
                el.screenCal, el.screenLoved, el.screenMe];

/* Which tab lights up on which screen. The dump and the wait are not
   sections — the bar hides for both, so neither gets an entry. */
const TAB_FOR = new Map([
  [el.screenNow,   el.tabLists],
  [el.screenCal,   el.tabCal],
  [el.screenLoved, el.tabLoved],
  [el.screenMe,    el.tabMe],
]);

function show(screen) {
  SCREENS.forEach(s => s.classList.add('is-hidden'));
  screen.classList.remove('is-hidden');
  el.scroller.scrollTop = 0;   // the page scrolls inside #app, not the document
  syncTabs(screen);
}

/** Show the bar on every section, hide it on the dump and the wait. */
function syncTabs(screen) {
  const current = TAB_FOR.get(screen);
  el.tabbar.classList.toggle('is-hidden', !current);
  document.body.classList.toggle('has-tabbar', !!current);

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
     day on them, the same number the profile calls "on the calendar".

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

let toastTimer;
function toast(msg) {
  el.toast.textContent = msg;
  el.toast.classList.remove('is-hidden');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.toast.classList.add('is-hidden'), 2600);
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

async function triage() {
  const text = el.input.value.trim();
  if (!text) { el.input.focus(); toast('Give me something to work with.'); return; }

  show(el.screenLoad);
  startLoadingCopy();

  let tasks;
  try {
    tasks = await parseWithAI(text, state.energy);
  } catch (err) {
    console.warn('AI triage unavailable, using local parser:', err.message);
    tasks = parseLocally(text);
    toast('Offline mode — sorted these myself.');
  }
  stopLoadingCopy();

  if (!tasks.length) {
    show(el.screenDump);
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
  el.input.value = '';
  previewDates();
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
async function parseWithAI(text, energy) {
  const res = await fetch('/api/triage', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ mode: 'triage', text, energy, today: dayKey() }),
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
   urgency ends up attached to a fragment with no action in it. */
const QUALIFIER = /^(?:deadline|due|by\b|before|after|takes|taking|about|approx|around|roughly|asap|today|tonight|tomorrow|this\s|next\s|maybe|probably|ideally|urgent|i think|apparently|\d)/i;

/** Strip a trailing duration clause once it has been read into `minutes`. */
function tidyTitle(line) {
  return line
    .replace(/[,\s—-]*\b(?:takes?|taking)?\s*(?:about|approx(?:imately)?|around|roughly)?\s*(?:\d+(?:\.\d+)?|a|an|one|two|three|four|five|six|couple|few|half)\s*(?:of\s+)?(?:hours?|hrs?|min(?:ute)?s?|m|h)\b\.?$/i, '')
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

/* Where one thing ends and the next begins. Pulled out of parseLocally so
   the typing preview splits the dump exactly the way the parser will —
   otherwise the chips would promise dates against lines that never end up
   being lines. */
function splitDump(text) {
  return text
    .split(/\n|(?:,\s(?=\w{4,}))|(?:\s+•\s+)|(?:;\s*)/)
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
      return normalizeTask({
        title: clean.charAt(0).toUpperCase() + clean.slice(1),
        minutes: stated !== null ? stated : (QUICK.test(line) ? 10 : BIG.test(line) ? 45 : 20),
        energy:  BIG.test(line) ? 'high' : QUICK.test(line) ? 'low' : 'medium',
        urgency: URGENT_HIGH.test(line) ? 5 : URGENT_SOON.test(line) ? 4 : 3,
        firstStep: 'Open whatever you need for this and look at it for 2 minutes. Nothing more.',
        category: guessCategory(line),
        when: day,
        // A time with no day is a time on no calendar, so it is dropped
        // rather than parked on today and quietly wrong.
        at: day ? parseClock(line) : null,
        local: true,
      });
    });
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
    firstStep: String(t.firstStep || t.first_step || 'Open it and look at it for 2 minutes.').slice(0, 240),
    category: String(t.category || 'general').slice(0, 40),
    when: normalizeDay(t.when),   // a day, or null
    at:   normalizeTime(t.at),    // a clock time on that day, or null
    steps: Array.isArray(t.steps) ? t.steps.slice(0, 7).map(String) : null,
    local: t.local === true,   // sorted by the offline parser, not the model
    done: false,
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
function groupByCategory(tasks) {
  const groups = new Map();
  tasks.forEach(t => {
    const key = String(t.category || 'general').toLowerCase();
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

  el.lists.classList.remove('is-hidden');
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

  el.lists.innerHTML = '';
  groups.forEach(([cat, items]) => el.lists.appendChild(renderGroup(cat, items)));

  renderDone(done);
  el.dangerZone.classList.toggle('is-hidden', state.tasks.length === 0);
  resetClear();
}

function renderGroup(cat, items) {
  const section = document.createElement('section');
  section.className = 'list-group';

  const head = document.createElement('div');
  head.className = 'list-head';

  const name = document.createElement('h2');
  name.className = 'list-name';
  name.textContent = categoryLabel(cat);

  const count = document.createElement('span');
  count.className = 'list-count';
  count.textContent = items.length;

  head.append(name, count);

  const ul = document.createElement('ul');
  ul.className = 'list-items';
  items.forEach(t => ul.appendChild(renderTask(t)));

  section.append(head, ul);
  return section;
}

function renderTask(task) {
  const li = document.createElement('li');
  li.className = 'task';
  if (task.urgency >= 5) li.classList.add('task--urgent');

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

  detail.append(step, stepsBlock, breakBtn);
  if (task.steps && task.steps.length) paintSteps(task.steps, stepsBlock, stepsList);

  body.appendChild(detail);

  li.append(check, body);
  li.addEventListener('click', () => {
    const open = detail.classList.toggle('is-hidden');
    li.classList.toggle('is-open', !open);
  });

  return li;
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
  done.forEach(t => {
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
      save();
      goToNext();
    });

    li.append(title, undo);
    el.doneList.appendChild(li);
  });
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
    const fresh = await parseWithAI(stale.map(t => t.title).join('\n'), state.energy);
    if (!fresh.length) throw new Error('nothing came back');

    const staleIds = new Set(stale.map(t => t.id));
    state.tasks = state.tasks.filter(t => !staleIds.has(t.id)).concat(fresh);
    save();
    goToNext();
    toast('Sorted properly.');
  } catch (err) {
    console.warn('re-sort failed:', err.message);
    el.btnResort.disabled = false;
    el.btnResort.textContent = 'Sort these properly';
    toast('Still cannot reach the backend.');
  }
}

function markDone(id, after = goToNext) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  t.done = true;
  save();
  toast('Done. That one is gone.');
  after();
}

async function breakDown(task, ui) {
  ui.breakBtn.disabled = true;
  ui.breakBtn.textContent = 'Breaking it down…';

  try {
    const res = await fetch('/api/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'breakdown', task: task.title, energy: state.energy }),
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
  el.compFace.textContent = avatar;
  el.compName.textContent = name || 'you';

  // Carries over whatever is sitting in the dump box, so a half-written
  // thought is not lost by reaching for the + instead of the dump screen.
  el.compInput.value = el.input.value;
  resetComposerMotion();
  el.composer.classList.remove('is-hidden');
  document.body.classList.add('is-composing');
  syncComposer();

  /* iOS only raises the keyboard for a focus it believes came from the tap,
     and the sheet is still animating in on this frame — focusing after the
     paint is what makes the keyboard actually come up. */
  requestAnimationFrame(() => el.compInput.focus());
}

/* The safety net under the leave animation, held so it can be called off.
   Reopening inside those 400ms used to let the old timer fire and hide the
   sheet that had just come up. */
let composerCloseTimer = 0;

/** Everything the sheet has to forget between one opening and the next. */
function resetComposerMotion() {
  clearTimeout(composerCloseTimer);
  composerCloseTimer = 0;
  if (dragRaf) { cancelAnimationFrame(dragRaf); dragRaf = 0; }
  dragging = false;
  dragPending = false;
  el.compSheet.classList.remove('is-dragging', 'is-settling', 'is-leaving');
  el.compSheet.style.transform = '';
  el.compScrim.style.opacity = '';
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
  el.compScrim.style.opacity = '0';
  el.compSheet.addEventListener('transitionend', done, { once: true });
  // a transition that never runs — reduced motion, a backgrounded tab — must
  // not leave the sheet stuck open
  composerCloseTimer = setTimeout(done, 400);
}

/** Cancel keeps the text — in the dump box, where the dump screen will find it. */
function cancelComposer() {
  el.input.value = el.compInput.value;
  previewDates();
  refreshListsButton();
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
/* Speed is measured over the last move, not the whole gesture: a drag that
   crawls down and then stops has an average that says "flick" and a finger
   that says otherwise. A hand resting before it lifts should drop the sheet
   back, so a stale last move counts as still. */
let dragLastY = 0, dragLastT = 0, dragSpeed = 0;

/* Pointer events arrive faster than the screen redraws — 120Hz of them on a
   recent iPhone against 60 frames. Writing the transform on each one queues
   style work that will never be seen, and the frames that do land come late:
   the sheet lags the finger and then catches up in a jump. One write per
   frame, with the newest position, is what tracks. */
let dragRaf = 0, dragDy = 0;

function paintDrag() {
  dragRaf = 0;
  // translate3d, not translateY: this is the sheet's own layer to move, and
  // the scrim behind it should not be repainted to do it
  el.compSheet.style.transform = `translate3d(0,${dragDy}px,0)`;
  el.compScrim.style.opacity = String(Math.max(0, 1 - dragDy / 420));
}

function queueDrag(dy) {
  dragDy = dy;
  if (!dragRaf) dragRaf = requestAnimationFrame(paintDrag);
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
  el.compSheet.classList.add('is-dragging');
  el.composer.classList.add('is-dragging');
  // capture keeps the moves coming if the finger slides off the sheet;
  // a pointer the element never really owned throws, and that is harmless
  try { el.compSheet.setPointerCapture(e.pointerId); } catch (_) {}
}

function dragStart(e) {
  if (e.pointerType === 'mouse' && e.button !== 0) return;
  if (e.target.closest('button')) return;                    // taps are theirs
  // a body scrolled off its top is being read, not dragged
  if (el.compBody.contains(e.target) && el.compBody.scrollTop > 0) return;

  dragFrom = dragLastY = e.clientY;
  dragX0 = e.clientX;

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
  queueDrag(dy);
}

function dragEnd(e) {
  dragPending = false;
  if (!dragging) return;
  dragging = false;
  if (dragRaf) { cancelAnimationFrame(dragRaf); dragRaf = 0; }
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
    el.compSheet.style.transform = '';
  };
  el.compScrim.style.opacity = '';

  // A press that never moved has nothing to animate back, and a transition
  // with no distance fires no transitionend — which used to leave the class
  // on, and its transition with it, for the next drag to fight.
  if (dy === 0) { settled(); return; }

  el.compSheet.classList.add('is-settling');
  el.compSheet.style.transform = 'translateY(0)';
  el.compSheet.addEventListener('transitionend', settled, { once: true });
  setTimeout(settled, 400);
}

function sendComposer() {
  const text = el.compInput.value.trim();
  if (!text) { el.compInput.focus(); return; }
  el.input.value = el.compInput.value;
  // Closed before triage, so the loading screen is what comes up behind it
  // rather than the sheet sitting over the morph.
  closeComposer();
  triage();
}

/** The shortcut back into the lists — only worth showing when there are some. */
function refreshListsButton() {
  const open = state.tasks.filter(t => !t.done).length;
  el.btnViewLists.classList.toggle('is-hidden', open === 0);
  el.listsBadge.textContent = open;
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
  renderCalendar();
  show(el.screenCal);
}

function renderCalendar() {
  const today = dayKey();
  el.calMonth.textContent =
    `${MONTH_NAMES[calCursor.getMonth()]} ${calCursor.getFullYear()}`;

  /* Weeks start on Monday. getDay() counts from Sunday, so the leading
     blanks are (day + 6) % 7 rather than day. */
  const first = new Date(calCursor.getFullYear(), calCursor.getMonth(), 1);
  const blanks = (first.getDay() + 6) % 7;
  const days = new Date(calCursor.getFullYear(), calCursor.getMonth() + 1, 0).getDate();

  el.calGrid.innerHTML = '';
  for (let i = 0; i < blanks; i++) {
    const gap = document.createElement('span');
    gap.className = 'cal-day is-blank';
    el.calGrid.appendChild(gap);
  }

  for (let d = 1; d <= days; d++) {
    const key = dayKey(new Date(calCursor.getFullYear(), calCursor.getMonth(), d));
    const items = tasksOn(key);

    const cell = document.createElement('button');
    cell.type = 'button';
    cell.className = 'cal-day';
    cell.dataset.day = key;      // the drop target reads this
    cell.textContent = d;
    cell.classList.toggle('is-today', key === today);
    cell.classList.toggle('is-picked', key === calPicked);
    cell.setAttribute('aria-pressed', String(key === calPicked));
    /* tasksOn sorts timed things ahead of loose ones, so the first with a
       clock on it is the earliest of the day. */
    const firstTimed = items.find(t => t.at);

    cell.setAttribute('aria-label',
      `${dayLabel(key, today)}${items.length ? `, ${items.length} ${items.length === 1 ? 'thing' : 'things'}` : ', nothing'}` +
      (firstTimed ? `, from ${timeLabel(firstTimed.at)}` : ''));

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

    cell.addEventListener('click', () => {
      calPicked = key;
      renderCalendar();
    });
    el.calGrid.appendChild(cell);
  }

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
  el.calTip.classList.toggle('is-hidden', !items.length && calPicked !== today);

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
    const li = document.createElement('li');
    li.className = 'cal-item';

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

    li.append(check, slot, body);
    li.addEventListener('pointerdown', (e) => watchPress(e, task, li));
    list.appendChild(li);
  });

  section.appendChild(list);
  return section;
}

function stepMonth(n) {
  calCursor = new Date(calCursor.getFullYear(), calCursor.getMonth() + n, 1);
  renderCalendar();
}

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

function showFeedback() {
  paintFeedback();
  show(el.screenLoved);
}

function paintFeedback() {
  const spent = feedbackSentToday();
  el.fbForm.classList.toggle('is-hidden', spent);
  el.fbThanks.classList.toggle('is-hidden', !spent);
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
    const res = await fetch('/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ body }),
    });

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

/* ---------------- drag a row onto a day ----------------
   Rescheduling without a date picker: hold a row, drag it up onto a cell,
   let go. Only the day moves — a 4pm thing dropped on Friday is still 4pm.

   Built on pointer events rather than HTML5 drag-and-drop, which does not
   exist on iOS Safari, and this is a phone app first.

   The press has to be held before it lifts, because the agenda lives in a
   scroller: a drag that started instantly would steal every upward swipe.
   Move further than a few pixels before the hold is up and it is read as
   what it almost certainly was — a scroll — and the lift is called off. */

const LIFT_MS = 320;
const SLOP = 8;

let press = null;   // a finger down, not yet committed to either reading
let drag = null;    // a row in the air

function watchPress(e, task, row) {
  if (e.button > 0) return;                       // right-click and friends
  if (e.target.closest('.task-check')) return;    // ticking off is not dragging
  if (press || drag) return;

  press = {
    task, row, x: e.clientX, y: e.clientY,
    timer: setTimeout(() => lift(), LIFT_MS),
  };
  row.classList.add('is-pressed');
}

function dropPress() {
  if (!press) return;
  clearTimeout(press.timer);
  press.row.classList.remove('is-pressed');
  press = null;
}

function lift() {
  if (!press) return;
  const { task, row, x, y } = press;
  press.row.classList.remove('is-pressed');
  press = null;

  /* A compact chip rather than a clone of the row. A full-width copy is
     wider than the whole week and sits straight on top of the cells you
     are aiming at, hiding the very ring that says where it would land. */
  const ghost = document.createElement('div');
  ghost.className = 'cal-ghost';
  ghost.textContent = task.at ? `${timeLabel(task.at)} · ${task.title}` : task.title;
  document.body.appendChild(ghost);

  drag = { task, row, ghost, cell: null };
  placeGhost(x, y);
  row.classList.add('is-lifted');
  document.body.classList.add('is-dragging');
  navigator.vibrate?.(8);   // only some phones; never fatal
}

/* Centred on the pointer and lifted clear of it, so a fingertip is not
   parked on top of the answer. */
function placeGhost(x, y) {
  const g = drag.ghost.getBoundingClientRect();
  drag.ghost.style.left = `${x - g.width / 2}px`;
  drag.ghost.style.top  = `${y - g.height - 18}px`;
}

function overCell(x, y) {
  /* The ghost is pointer-events:none, so it does not shadow the cell it is
     sitting on top of. */
  const el = document.elementFromPoint(x, y);
  return el ? el.closest('.cal-day[data-day]') : null;
}

document.addEventListener('pointermove', (e) => {
  if (press) {
    // Enough movement before the hold is up means this was a scroll.
    if (Math.hypot(e.clientX - press.x, e.clientY - press.y) > SLOP) dropPress();
    return;
  }
  if (!drag) return;

  placeGhost(e.clientX, e.clientY);
  const cell = overCell(e.clientX, e.clientY);
  if (cell !== drag.cell) {
    drag.cell?.classList.remove('is-drop');
    drag.cell = cell;
    cell?.classList.add('is-drop');
  }
});

/* Pointer events cannot call off a scroll on their own, and touch-action
   set mid-gesture comes too late. Killing touchmove while a row is in the
   air is what actually holds the page still under it. */
document.addEventListener('touchmove', (e) => {
  if (drag) e.preventDefault();
}, { passive: false });

function endDrag(commit) {
  if (!drag) return;
  const { task, row, ghost, cell } = drag;
  ghost.remove();
  row.classList.remove('is-lifted');
  document.body.classList.remove('is-dragging');
  cell?.classList.remove('is-drop');
  drag = null;

  if (!commit || !cell) return;

  const day = cell.dataset.day;
  if (day === task.when) return;    // dropped back where it started

  task.when = day;
  save();
  calPicked = day;                  // follow it, so you land where it landed
  renderCalendar();
  toast(`Moved to ${dayPhrase(day)}.`);
}

document.addEventListener('pointerup',     () => { dropPress(); endDrag(true); });
document.addEventListener('pointercancel', () => { dropPress(); endDrag(false); });

/* ---------------- profile ----------------
   Local and deliberately small: a name to be greeted by, a face to
   recognise the tab by, and a count of what you have got through. It rides
   in the same localStorage record as the tasks, so clearing the site
   clears all of it together. */

const AVATARS = ['\u{1F642}', '\u{1F60E}', '\u{1F984}', '\u{1F431}', '\u{1F436}',
                 '\u{1F338}', '\u{1F680}', '\u{1F9E0}', '\u{2B50}', '\u{1F525}'];

function paintProfile() {
  const { name, avatar } = state.profile;
  el.tabAvatar.textContent = avatar;
  el.avatarBig.textContent = avatar;
  el.greeting.textContent = name ? `Hey ${name}.` : 'Hey there.';
  if (el.nameInput.value !== name) el.nameInput.value = name;
  [...el.avatarPick.children].forEach(b => {
    const on = b.dataset.avatar === avatar;
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

function showProfile() {
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
  paintProfile();
  show(el.screenMe);
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

function previewDates(src = el.input, box = el.dumpDates, chips = el.dumpChips) {
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
    el.dumpChips.appendChild(more);
  }
}

/* ---------------- wiring ---------------- */

el.triage.addEventListener('click', triage);
el.btnViewLists.addEventListener('click', goToNext);
el.btnResort.addEventListener('click', resortLocal);
el.btnClearAll.addEventListener('click', stepClear);
el.btnClearGo.addEventListener('click', stepClear);
el.btnClearNo.addEventListener('click', resetClear);
el.btnDumpAgain.addEventListener('click', openComposer);

/* The bar. The + opens the composer over whatever is on screen — the dump
   box is still the only place a new list gets made, but reaching it should
   not cost you the page you were on. */
el.tabLists.addEventListener('click', goToNext);
el.tabCal.addEventListener('click', showCalendar);
el.calPrev.addEventListener('click', () => stepMonth(-1));
el.calNext.addEventListener('click', () => stepMonth(1));
el.calToday.addEventListener('click', () => {
  calPicked = dayKey();
  calCursor = keyToDate(calPicked.slice(0, 8) + '01');
  renderCalendar();
});
el.tabAdd.addEventListener('click', openComposer);
el.compCancel.addEventListener('click', cancelComposer);
el.compScrim.addEventListener('click', cancelComposer);
el.compPost.addEventListener('click', sendComposer);
el.compInput.addEventListener('input', syncComposer);
el.compSheet.addEventListener('pointerdown', dragStart);
el.compSheet.addEventListener('pointermove', dragMove);
el.compSheet.addEventListener('pointerup', dragEnd);
el.compSheet.addEventListener('pointercancel', dragEnd);
el.compInput.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); sendComposer(); }
});
document.addEventListener('keydown', (e) => {
  if (e.key === 'Escape' && !el.composer.classList.contains('is-hidden')) cancelComposer();
});
el.tabLoved.addEventListener('click', showFeedback);
el.fbSend.addEventListener('click', sendFeedback);
el.fbInput.addEventListener('input', paintFeedback);
el.tabMe.addEventListener('click', showProfile);

el.nameInput.addEventListener('input', () => {
  state.profile.name = el.nameInput.value.trim().slice(0, 24);
  save();
  paintProfile();
});

el.input.addEventListener('input', previewDates);

el.input.addEventListener('keydown', (e) => {
  if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') { e.preventDefault(); triage(); }
});

document.querySelectorAll('.energy-opt').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.energy-opt').forEach(b => {
      b.classList.remove('is-on');
      b.setAttribute('aria-checked', 'false');
    });
    btn.classList.add('is-on');
    btn.setAttribute('aria-checked', 'true');
    state.energy = btn.dataset.energy;
    save();
  });
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
paintMorph();

document.querySelectorAll('.energy-opt').forEach(b => {
  const on = b.dataset.energy === state.energy;
  b.classList.toggle('is-on', on);
  b.setAttribute('aria-checked', String(on));
});

// Opening the app always lands on the dump box — that is the thing you came
// to do. The lists are one tap away when you want them.
refreshListsButton();
buildAvatarPicker();
paintProfile();
show(el.screenDump);
el.input.focus();
