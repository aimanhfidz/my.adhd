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

  screenCal:    $('screen-calendar'),
  screenLoved:  $('screen-loved'),
  screenMe:     $('screen-profile'),
  tabbar:       $('tabbar'),
  tabLists:     $('tab-lists'),
  tabCal:       $('tab-calendar'),
  tabAdd:       $('tab-add'),
  tabLoved:     $('tab-loved'),
  tabMe:        $('tab-profile'),
  tabDot:       $('tab-dot'),
  tabAvatar:    $('tab-avatar'),
  avatarBig:    $('avatar-big'),
  avatarPick:   $('avatar-picker'),
  greeting:     $('profile-greeting'),
  nameInput:    $('profile-name'),
  statOpen:     $('stat-open'),
  statDone:     $('stat-done'),
  statLists:    $('stat-lists'),
};

/* ---------------- state ---------------- */

let state = {
  tasks: [],          // {id,title,minutes,energy,urgency,firstStep,category,steps,done,skipped}
  energy: 'medium',   // how the user feels right now
  profile: { name: '', avatar: '\u{1F642}' },   // this device only — no account behind it
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
  window.scrollTo(0, 0);
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

  const open = state.tasks.filter(t => !t.done).length;
  el.tabDot.classList.toggle('is-hidden', open === 0 || current === el.tabLists);
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
    body: JSON.stringify({ mode: 'triage', text, energy }),
  });
  if (!res.ok) throw new Error('triage endpoint returned ' + res.status);
  const data = await res.json();
  if (!Array.isArray(data.tasks) || !data.tasks.length) throw new Error('no tasks in response');
  return data.tasks.map(normalizeTask);
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

function parseLocally(text) {
  const URGENT_HIGH = /\b(today|tonight|asap|urgent|overdue|deadline|due|now|immediately|last chance|expires?)\b/i;
  const URGENT_SOON = /\b(tomorrow|this week|monday|tuesday|wednesday|thursday|friday|saturday|sunday|weekend|soon)\b/i;
  const QUICK  = /\b(email|reply|text|call|book|order|pay|send|renew|confirm|cancel|rsvp)\b/i;
  const BIG    = /\b(write|build|plan|report|design|research|clean|organi[sz]e|prepare|refactor|draft|deep)\b/i;

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
    .slice(0, 25)
    .map(line => {
      const stated = parseMinutes(line);
      const clean = (stated !== null ? tidyTitle(line) : line) || line;
      return normalizeTask({
        title: clean.charAt(0).toUpperCase() + clean.slice(1),
        minutes: stated !== null ? stated : (QUICK.test(line) ? 10 : BIG.test(line) ? 45 : 20),
        energy:  BIG.test(line) ? 'high' : QUICK.test(line) ? 'low' : 'medium',
        urgency: URGENT_HIGH.test(line) ? 5 : URGENT_SOON.test(line) ? 4 : 3,
        firstStep: 'Open whatever you need for this and look at it for 2 minutes. Nothing more.',
        category: guessCategory(line),
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

function markDone(id) {
  const t = state.tasks.find(x => x.id === id);
  if (!t) return;
  t.done = true;
  save();
  toast('Done. That one is gone.');
  goToNext();
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

function newDump() {
  refreshListsButton();
  show(el.screenDump);
  el.input.focus();
}

/** The shortcut back into the lists — only worth showing when there are some. */
function refreshListsButton() {
  const open = state.tasks.filter(t => !t.done).length;
  el.btnViewLists.classList.toggle('is-hidden', open === 0);
  el.listsBadge.textContent = open;
}

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
  paintProfile();
  show(el.screenMe);
}

/* ---------------- wiring ---------------- */

el.triage.addEventListener('click', triage);
el.btnViewLists.addEventListener('click', goToNext);
el.btnResort.addEventListener('click', resortLocal);
el.btnClearAll.addEventListener('click', stepClear);
el.btnClearGo.addEventListener('click', stepClear);
el.btnClearNo.addEventListener('click', resetClear);
el.btnDumpAgain.addEventListener('click', newDump);

/* The bar. The + is the way back to the dump box, which is the only place
   a new list gets made — so it routes to newDump rather than a screen. */
el.tabLists.addEventListener('click', goToNext);
el.tabCal.addEventListener('click', () => show(el.screenCal));
el.tabAdd.addEventListener('click', newDump);
el.tabLoved.addEventListener('click', () => show(el.screenLoved));
el.tabMe.addEventListener('click', showProfile);

el.nameInput.addEventListener('input', () => {
  state.profile.name = el.nameInput.value.trim().slice(0, 24);
  save();
  paintProfile();
});

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
