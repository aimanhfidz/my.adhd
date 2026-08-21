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
  nowTitle:     $('now-title'),
  nowTime:      $('now-time'),
  nowEnergy:    $('now-energy'),
  nowReason:    $('now-reason'),
  firstStep:    $('now-first-step'),
  stepsBlock:   $('steps-block'),
  stepsList:    $('steps-list'),
  nowCard:      $('now-card'),
  btnDone:      $('btn-done'),
  btnSkip:      $('btn-skip'),
  btnBreak:     $('btn-breakdown'),
  btnNewDump:   $('btn-new-dump'),
  btnDumpAgain: $('btn-dump-again'),
  eyebrow:      $('eyebrow'),
  parkedBlock:  $('parked-block'),
  parkedToggle: $('parked-toggle'),
  parkedCount:  $('parked-count'),
  parkedList:   $('parked-list'),
  clearedNote:  $('cleared-note'),
  toast:        $('toast'),
};

/* ---------------- state ---------------- */

let state = {
  tasks: [],          // {id,title,minutes,energy,urgency,firstStep,category,steps,done,skipped}
  energy: 'medium',   // how the user feels right now
  currentId: null,
  pinnedId: null,     // set when the user picks a task by hand; outranks scoring
};

function load() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) state = Object.assign(state, JSON.parse(raw));
  } catch (_) { /* corrupt store — start fresh rather than crash */ }
}

function save() {
  try { localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (_) {}
}

/* ---------------- screens ---------------- */

function show(screen) {
  [el.screenDump, el.screenLoad, el.screenNow].forEach(s => s.classList.add('is-hidden'));
  screen.classList.remove('is-hidden');
  window.scrollTo(0, 0);
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
  let i = 0;
  el.loadingText.textContent = LOADING_LINES[0];
  loadingTimer = setInterval(() => {
    i = (i + 1) % LOADING_LINES.length;
    el.loadingText.textContent = LOADING_LINES[i];
  }, 1900);
}
function stopLoadingCopy() { clearInterval(loadingTimer); }

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

  // A fresh dump replaces the queue — carrying old noise forward defeats the point.
  state.tasks = tasks;
  state.currentId = null;
  state.pinnedId = null;
  save();
  el.input.value = '';
  goToNext();
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
function parseLocally(text) {
  const URGENT = /\b(today|tonight|asap|urgent|overdue|deadline|due|tomorrow|friday|monday|late|now)\b/i;
  const QUICK  = /\b(email|reply|text|call|book|order|pay|send|renew|confirm|cancel|rsvp)\b/i;
  const BIG    = /\b(write|build|plan|report|design|research|clean|organi[sz]e|prepare|refactor|draft)\b/i;

  return text
    .split(/\n|(?:,\s(?=\w{4,}))|(?:\s+•\s+)|(?:;\s*)/)
    .map(s => s.replace(/^[\s\-–—*•\d.)]+/, '').trim())
    .filter(s => s.length > 2)
    .slice(0, 25)
    .map(line => normalizeTask({
      title: line.charAt(0).toUpperCase() + line.slice(1),
      minutes: QUICK.test(line) ? 10 : BIG.test(line) ? 45 : 20,
      energy:  QUICK.test(line) ? 'low' : BIG.test(line) ? 'high' : 'medium',
      urgency: URGENT.test(line) ? 5 : 3,
      firstStep: 'Open whatever you need for this and look at it for 2 minutes. Nothing more.',
      category: 'general',
    }));
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
    done: false,
    skipped: false,
  };
}

/* ---------------- picking the ONE ---------------- */

const ENERGY_RANK = { low: 1, medium: 2, high: 3 };

/**
 * Score a task against how the user actually feels right now.
 * Urgency matters, but a task the user has no fuel for is worse than useless —
 * it's the thing they'll stare at and then close the app.
 */
function score(task, fuel) {
  const need = ENERGY_RANK[task.energy];
  const have = ENERGY_RANK[fuel];

  let s = task.urgency * 10;                       // deadlines still lead
  s -= Math.max(0, need - have) * 14;              // asking for more fuel than you have: heavy penalty
  s -= Math.min(task.minutes, 120) * 0.18;         // short things win ties — momentum beats optimality
  if (task.skipped) s -= 40;                       // already said no once
  return s;
}

function pickNext() {
  const open = state.tasks.filter(t => !t.done);
  if (!open.length) return null;
  return open.slice().sort((a, b) => score(b, state.energy) - score(a, state.energy))[0];
}

function reasonFor(task) {
  const need = ENERGY_RANK[task.energy], have = ENERGY_RANK[state.energy];
  if (task.urgency >= 5) return 'most urgent';
  if (task.minutes <= 10) return 'quickest win';
  if (need < have) return 'easy on your fuel';
  if (need === have) return 'matches your fuel';
  return 'best of what is left';
}

/* ---------------- render ---------------- */

function goToNext() {
  // A hand-picked task outranks the score — the user overrode us on purpose.
  const pinned = state.pinnedId
    ? state.tasks.find(t => t.id === state.pinnedId && !t.done)
    : null;
  const task = pinned || pickNext();
  show(el.screenNow);

  if (!task) {
    // Nothing left: strip the screen to the one message that matters.
    el.nowCard.classList.add('is-hidden');
    el.eyebrow.classList.add('is-hidden');
    el.parkedBlock.classList.add('is-hidden');
    el.clearedNote.classList.remove('is-hidden');
    return;
  }

  el.nowCard.classList.remove('is-hidden');
  el.eyebrow.classList.remove('is-hidden');
  el.parkedBlock.classList.remove('is-hidden');
  el.clearedNote.classList.add('is-hidden');

  state.currentId = task.id;
  save();

  el.nowTitle.textContent = task.title;
  el.nowTime.textContent = task.minutes < 60
    ? `${task.minutes} min`
    : `${Math.round(task.minutes / 60 * 10) / 10} hr`;
  el.nowEnergy.textContent = `${task.energy} energy`;
  el.nowReason.textContent = reasonFor(task);
  el.firstStep.textContent = task.firstStep;

  el.btnBreak.disabled = false;
  el.btnBreak.textContent = 'Too big — break it down';

  if (task.steps && task.steps.length) {
    renderSteps(task.steps);
  } else {
    el.stepsBlock.classList.add('is-hidden');
  }

  // Re-run the entrance animation so each new task lands as its own moment.
  el.nowCard.style.animation = 'none';
  void el.nowCard.offsetWidth;
  el.nowCard.style.animation = '';

  renderParked();
}

function renderSteps(steps) {
  el.stepsList.innerHTML = '';
  steps.forEach(s => {
    const li = document.createElement('li');
    li.textContent = s;
    el.stepsList.appendChild(li);
  });
  el.stepsBlock.classList.remove('is-hidden');
}

function renderParked() {
  const parked = state.tasks.filter(t => !t.done && t.id !== state.currentId);
  el.parkedCount.textContent = parked.length === 1 ? '1 parked' : `${parked.length} parked`;
  el.parkedList.innerHTML = '';

  parked.forEach(t => {
    const li = document.createElement('li');
    li.className = 'parked-item';

    const title = document.createElement('span');
    title.className = 'p-title';
    title.textContent = t.title;

    const time = document.createElement('span');
    time.className = 'p-time';
    time.textContent = `${t.minutes}m`;

    const doBtn = document.createElement('button');
    doBtn.className = 'p-do';
    doBtn.textContent = 'Do this';
    doBtn.addEventListener('click', () => renderCurrent(t));

    li.append(title, time, doBtn);
    el.parkedList.appendChild(li);
  });
}

/** Force a specific task onto the Now screen (used by "Do this" in the parked list). */
function renderCurrent(task) {
  state.pinnedId = task.id;
  task.skipped = false;
  save();
  goToNext();
}

/* ---------------- actions ---------------- */

function markDone() {
  const t = state.tasks.find(x => x.id === state.currentId);
  if (t) t.done = true;
  if (state.pinnedId === state.currentId) state.pinnedId = null;
  save();
  toast('Done. That one is gone.');
  goToNext();
}

function skip() {
  const t = state.tasks.find(x => x.id === state.currentId);
  if (!t) return;
  if (state.tasks.filter(x => !x.done).length === 1) {
    toast('It is the only one left.');
    return;
  }
  t.skipped = true;
  if (state.pinnedId === t.id) state.pinnedId = null;
  save();
  goToNext();
}

async function breakDown() {
  const t = state.tasks.find(x => x.id === state.currentId);
  if (!t) return;

  el.btnBreak.disabled = true;
  el.btnBreak.textContent = 'Breaking it down…';

  try {
    const res = await fetch('/api/triage', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mode: 'breakdown', task: t.title, energy: state.energy }),
    });
    if (!res.ok) throw new Error('status ' + res.status);
    const data = await res.json();
    if (!Array.isArray(data.steps) || !data.steps.length) throw new Error('no steps');

    t.steps = data.steps.slice(0, 7).map(String);
    if (data.firstStep) t.firstStep = String(data.firstStep);
    save();
    el.firstStep.textContent = t.firstStep;
    renderSteps(t.steps);
    el.btnBreak.textContent = 'Broken down ✓';
  } catch (err) {
    console.warn('breakdown failed:', err.message);
    el.btnBreak.disabled = false;
    el.btnBreak.textContent = 'Too big — break it down';
    toast('Needs the AI backend for this one.');
  }
}

function newDump() {
  show(el.screenDump);
  el.input.focus();
}

/* ---------------- wiring ---------------- */

el.triage.addEventListener('click', triage);
el.btnDone.addEventListener('click', markDone);
el.btnSkip.addEventListener('click', skip);
el.btnBreak.addEventListener('click', breakDown);
el.btnNewDump.addEventListener('click', newDump);
el.btnDumpAgain.addEventListener('click', newDump);

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

el.parkedToggle.addEventListener('click', () => {
  const open = el.parkedToggle.getAttribute('aria-expanded') === 'true';
  el.parkedToggle.setAttribute('aria-expanded', String(!open));
  el.parkedList.classList.toggle('is-hidden', open);
});

/* ---------------- boot ---------------- */

load();

document.querySelectorAll('.energy-opt').forEach(b => {
  const on = b.dataset.energy === state.energy;
  b.classList.toggle('is-on', on);
  b.setAttribute('aria-checked', String(on));
});

if (state.tasks.some(t => !t.done)) {
  goToNext();          // pick up exactly where they left off
} else {
  show(el.screenDump);
  el.input.focus();
}
