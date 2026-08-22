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
  btnNewDump:   $('btn-new-dump'),
  btnDumpAgain: $('btn-dump-again'),
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
  state.currentId = null;
  save();

  const open = state.tasks.filter(t => !t.done);
  const done = state.tasks.filter(t => t.done);

  if (!open.length) {
    el.lists.classList.add('is-hidden');
    el.eyebrow.classList.add('is-hidden');
    el.summary.classList.add('is-hidden');
    el.doneBlock.classList.add('is-hidden');
    el.clearedNote.classList.remove('is-hidden');
    return;
  }

  el.lists.classList.remove('is-hidden');
  el.eyebrow.classList.remove('is-hidden');
  el.summary.classList.remove('is-hidden');
  el.clearedNote.classList.add('is-hidden');

  const groups = groupByCategory(open);
  const totalMin = open.reduce((n, t) => n + t.minutes, 0);
  el.summary.textContent =
    `${open.length} ${open.length === 1 ? 'thing' : 'things'} · ` +
    `${groups.length} ${groups.length === 1 ? 'list' : 'lists'} · ` +
    `about ${minutesLabel(totalMin)} all in`;

  el.lists.innerHTML = '';
  groups.forEach(([cat, items]) => el.lists.appendChild(renderGroup(cat, items)));

  renderDone(done);
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

/* ---------------- actions ---------------- */

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
  show(el.screenDump);
  el.input.focus();
}

/* ---------------- wiring ---------------- */

el.triage.addEventListener('click', triage);
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

el.doneToggle.addEventListener('click', () => {
  const open = el.doneToggle.getAttribute('aria-expanded') === 'true';
  el.doneToggle.setAttribute('aria-expanded', String(!open));
  el.doneList.classList.toggle('is-hidden', open);
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
