/* ============ The ASRS-v1.1 self-check ============
   A standalone screener. It is not part of the site: no bar, no footer,
   no pager, nothing to navigate to. One question at a time, because the
   audience for this instrument is the one this whole project is about,
   and eighteen rows of checkboxes on one page is the exact object that
   makes them close the tab.

   THE INSTRUMENT IS NOT OURS AND IS NOT EDITED. The eighteen questions
   below are the Adult ADHD Self-Report Scale (ASRS-v1.1) Symptom
   Checklist, transcribed verbatim from adhd-questionnaire-ASRS111.pdf in
   this repo. Do not reword them, do not reorder them, do not add or drop
   one: a screening instrument's validity is a property of its exact
   wording and its exact scoring, and a "nicer" phrasing is a different
   test with no evidence behind it.

   `band` is the index of the first answer that counts — the leftmost
   darkly-shaded box on that row of the printed form. It is NOT the same
   for every question, which is the part that is easy to get wrong and
   invisible when you do:

     Q1-Q3   shade from "Sometimes" (band 2)
     Q4-Q6   shade from "Often"     (band 3)

   and Part B varies row by row. Every value here was read off a render of
   page 2 of the PDF rather than remembered. If the scoring is ever
   touched, check it against that page again.

   THE MALAY IS A TRANSLATION, NOT A SECOND INSTRUMENT. Bahasa Melayu
   strings live beside the English so a reader can take the screener in
   the language they think in — but the instrument of record, the one the
   evidence is for, is the English ASRS-v1.1 above, and the scoring bands
   are shared: a Malay answer scores exactly as its English row does. The
   Malay questions are a careful rendering written for this page, not the
   validated Malay ASRS-v1.1 used in Malaysian clinical studies. If that
   validated text is ever obtained, replace MS.q below with it verbatim
   and say so here. The intro says all of this to the reader, in Malay. */
(function () {
  'use strict';

  var SCALE = ['Never', 'Rarely', 'Sometimes', 'Often', 'Very Often'];

  var PART_A = [
    { q: 'How often do you have trouble wrapping up the final details of a project, once the challenging parts have been done?', band: 2 },
    { q: 'How often do you have difficulty getting things in order when you have to do a task that requires organization?', band: 2 },
    { q: 'How often do you have problems remembering appointments or obligations?', band: 2 },
    { q: 'When you have a task that requires a lot of thought, how often do you avoid or delay getting started?', band: 3 },
    { q: 'How often do you fidget or squirm with your hands or feet when you have to sit down for a long time?', band: 3 },
    { q: 'How often do you feel overly active and compelled to do things, like you were driven by a motor?', band: 3 }
  ];

  var PART_B = [
    { q: 'How often do you make careless mistakes when you have to work on a boring or difficult project?', band: 3 },
    { q: 'How often do you have difficulty keeping your attention when you are doing boring or repetitive work?', band: 3 },
    { q: 'How often do you have difficulty concentrating on what people say to you, even when they are speaking to you directly?', band: 2 },
    { q: 'How often do you misplace or have difficulty finding things at home or at work?', band: 3 },
    { q: 'How often are you distracted by activity or noise around you?', band: 3 },
    { q: 'How often do you leave your seat in meetings or other situations in which you are expected to remain seated?', band: 2 },
    { q: 'How often do you feel restless or fidgety?', band: 3 },
    { q: 'How often do you have difficulty unwinding and relaxing when you have time to yourself?', band: 3 },
    { q: 'How often do you find yourself talking too much when you are in social situations?', band: 3 },
    { q: 'When you’re in a conversation, how often do you find yourself finishing the sentences of the people you are talking to, before they can finish them themselves?', band: 2 },
    { q: 'How often do you have difficulty waiting your turn in situations when turn taking is required?', band: 3 },
    { q: 'How often do you interrupt others when they are busy?', band: 2 }
  ];

  /* ---------- Bahasa Melayu ---------- */
  var MS = {
    scale: ['Tidak pernah', 'Jarang', 'Kadang-kadang', 'Kerap', 'Sangat kerap'],
    a: [
      'Berapa kerapkah anda menghadapi masalah untuk menyiapkan butiran terakhir sesuatu projek, setelah bahagian yang mencabar telah dilakukan?',
      'Berapa kerapkah anda sukar menyusun sesuatu apabila anda perlu melakukan tugasan yang memerlukan organisasi?',
      'Berapa kerapkah anda menghadapi masalah mengingati temu janji atau tanggungjawab?',
      'Apabila anda mempunyai tugasan yang memerlukan banyak pemikiran, berapa kerapkah anda mengelak atau melengahkan untuk memulakannya?',
      'Berapa kerapkah anda menggelisah atau menggerak-gerakkan tangan atau kaki apabila anda perlu duduk untuk masa yang lama?',
      'Berapa kerapkah anda berasa terlalu aktif dan terdorong untuk melakukan sesuatu, seolah-olah anda digerakkan oleh motor?'
    ],
    b: [
      'Berapa kerapkah anda melakukan kesilapan cuai apabila anda perlu mengerjakan projek yang membosankan atau sukar?',
      'Berapa kerapkah anda sukar mengekalkan tumpuan apabila melakukan kerja yang membosankan atau berulang-ulang?',
      'Berapa kerapkah anda sukar memberi tumpuan kepada apa yang orang katakan kepada anda, walaupun mereka bercakap terus kepada anda?',
      'Berapa kerapkah anda tersalah letak atau sukar mencari barang di rumah atau di tempat kerja?',
      'Berapa kerapkah anda terganggu oleh aktiviti atau bunyi di sekeliling anda?',
      'Berapa kerapkah anda meninggalkan tempat duduk dalam mesyuarat atau situasi lain yang anda dijangka kekal duduk?',
      'Berapa kerapkah anda berasa resah atau gelisah?',
      'Berapa kerapkah anda sukar untuk bertenang dan berehat apabila anda mempunyai masa untuk diri sendiri?',
      'Berapa kerapkah anda mendapati diri anda terlalu banyak bercakap dalam situasi sosial?',
      'Apabila anda dalam perbualan, berapa kerapkah anda mendapati diri anda menghabiskan ayat orang yang anda ajak bercakap, sebelum mereka sempat menghabiskannya sendiri?',
      'Berapa kerapkah anda sukar menunggu giliran dalam situasi yang memerlukan giliran?',
      'Berapa kerapkah anda mencelah orang lain ketika mereka sedang sibuk?'
    ]
  };

  /* Every string a screen writes, in both languages. The English column
     is the page as written; the static English is left in the markup and
     harvested from it on load, so English can never drift from itself. */
  var STR = {
    en: {
      qCount: function (n, t) { return 'Question ' + n + ' of ' + t; },
      partA: 'Part A', partB: 'Part B',
      verdictYes: 'Your answers fall within the range that warrants a proper assessment.',
      verdictNo:  'Your answers fall below the range this screener flags.',
      detailYes: 'Four or more of your Part A answers landed in the bands the ASRS treats as significant. On this instrument that means symptoms highly consistent with <span class="adhd-word">ADHD</span> in adults, and that further investigation is warranted — by a psychiatrist or clinical psychologist, who are the only people who can actually diagnose it.',
      detailNo:  'Fewer than four of your Part A answers landed in the bands the ASRS treats as significant. That is not a clean bill of health and it does not rule ADHD out — this screener is six questions, and plenty of people who have <span class="adhd-word">ADHD</span> score below the line. If the way you live still doesn’t match the result, that is worth taking to a professional anyway.'
    },
    ms: {
      qCount: function (n, t) { return 'Soalan ' + n + ' daripada ' + t; },
      partA: 'Bahagian A', partB: 'Bahagian B',
      verdictYes: 'Jawapan anda berada dalam julat yang wajar mendapat penilaian sewajarnya.',
      verdictNo:  'Jawapan anda berada di bawah julat yang ditandakan oleh saringan ini.',
      detailYes: 'Empat atau lebih jawapan Bahagian A anda jatuh dalam julat yang dianggap signifikan oleh ASRS. Pada instrumen ini, itu bermakna simptom yang sangat konsisten dengan <span class="adhd-word">ADHD</span> pada orang dewasa, dan siasatan lanjut adalah wajar — oleh pakar psikiatri atau ahli psikologi klinikal, satu-satunya pihak yang boleh mendiagnosisnya.',
      detailNo:  'Kurang daripada empat jawapan Bahagian A anda jatuh dalam julat yang dianggap signifikan oleh ASRS. Itu bukan bermakna anda bebas daripadanya, dan ia tidak menolak kemungkinan ADHD — saringan ini hanya enam soalan, dan ramai yang mempunyai <span class="adhd-word">ADHD</span> mendapat skor di bawah garisan. Jika cara hidup anda masih tidak sepadan dengan keputusan ini, ia tetap wajar dibawa kepada pakar.',
      /* the static page, by data-i18n key */
      exit: 'Tinggalkan semakan kendiri',
      kicker: 'Semakan kendiri.',
      h1: 'Sepuluh minit, tanpa log masuk, tanpa kos.',
      lede: 'Ini ialah Skala Laporan Kendiri <span class="adhd-word">ADHD</span> Dewasa (ASRS-v1.1) — soal selidik saringan yang digunakan oleh perkhidmatan kesihatan, diterjemahkan di sini untuk bacaan. Jawab dengan jujur tentang <b>enam bulan yang lalu</b> dan anda akan mendapat gambaran jelas sama ada ciri-ciri anda berada dalam julat yang wajar mendapat penilaian sewajarnya.',
      f1k: 'Soalan', f1v: '6, atau 18 jika anda mahu gambaran yang lebih penuh',
      f2k: 'Masa', f2v: 'Kira-kira 5 minit',
      f3k: 'Kos', f3v: 'Percuma, tanpa akaun',
      f4k: 'Jawapan anda', f4v: 'Tidak pernah disimpan, tidak pernah dihantar',
      f5k: 'Apa yang anda dapat', f5v: 'Skor daripada 6, dan maksudnya',
      startA: 'Mulakan saringan 6 soalan',
      startAB: 'Jawab kesemua 18',
      whoH: 'Siapa yang menulis soalan ini',
      who1: 'Lapan belas soalan dalam semakan kendiri ini ialah <b>Senarai Semak Simptom Skala Laporan Kendiri <span class="adhd-word">ADHD</span> Dewasa (ASRS-v1.1)</b>. Versi Bahasa Melayu di halaman ini ialah terjemahan untuk bacaan; instrumen yang menjadi rujukan, dan yang menentukan skor, ialah teks asal dalam bahasa Inggeris, yang MyADHD tidak menulis dan tidak mengubahnya.',
      who2: 'Senarai semak ini dibangunkan bersama <b>Pertubuhan Kesihatan Sedunia (WHO)</b> dan Kumpulan Kerja <span class="adhd-word">ADHD</span> Dewasa, yang terdiri daripada:',
      who3: 'Soalan-soalan ini selaras dengan kriteria DSM-IV dan menyentuh bagaimana simptom <span class="adhd-word">ADHD</span> muncul pada orang dewasa. Pemarkahan yang digunakan di sini ialah pemarkahan instrumen itu sendiri: Bahagian A ialah saringan enam soalan, dan sesuatu jawapan dikira apabila ia jatuh dalam julat berlorek soalan itu pada borang bercetak. Bahagian B tidak mempunyai skor langsung — borang itu menyatakan dengan jelas bahawa “tiada jumlah skor atau kebarangkalian diagnosis digunakan” untuk dua belas soalan itu.',
      notH: 'Apa yang ini bukan',
      not1: '<b>Ini alat saringan, bukan diagnosis.</b> Hanya pakar psikiatri atau ahli psikologi klinikal boleh mendiagnosis <span class="adhd-word">ADHD</span>. Skor yang tinggi ialah sebab untuk membuat temu janji itu, bukan jawapan; skor yang rendah tidak menolak apa-apa.',
      not2: 'Tiada apa yang anda jawab di sini disimpan atau dihantar ke mana-mana. Tiada akaun, tiada analitik ke atas jawapan anda, dan tiada salinan disimpan — ia wujud dalam tab ini semasa ia terbuka dan hilang apabila anda menutupnya.',
      howOften: 'Berapa kerap',
      back: '← Soalan sebelumnya',
      hint: 'Tekan 1–5 untuk menjawab',
      rKicker: 'Keputusan anda.',
      rOf: 'daripada 6 jawapan Bahagian A dalam julat signifikan',
      rB1: 'Anda juga menjawab Bahagian B, di mana',
      rB2: 'daripada 12 jatuh dalam julat berlorek. Bahagian B tidak diberi skor dan tidak mengubah keputusan di atas — ia memberi pakar klinikal petunjuk tambahan untuk ditanya.',
      n1: 'Bawa keputusan ini kepada pakar psikiatri atau ahli psikologi klinikal — ia memberi mereka sesuatu yang konkrit untuk bermula.',
      n2: 'Tuliskan apa yang sebenarnya tidak kena dalam seminggu, dan bawa itu sekali.',
      n3: 'Walau apa pun angka itu, hari ini tetap perlu diselesaikan. <a href="/tools">Lihat apa yang kami bina untuk itu</a>.',
      again: 'Cuba lagi',
      home: 'Kembali ke MyADHD'
    }
  };

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };

  /* ---------- language ----------
     One preference, kept in localStorage under the key the site's bar
     switch also writes, so a language picked on any page follows the
     reader into the screener and back out again. This is the
     one thing the page writes to storage, and it is not an answer: the
     promise at the foot of this file — nothing you answer is kept — still
     holds to the letter. English is harvested from the markup on load, so
     the only place English lives is the HTML. */
  var LANG_KEY = 'myadhd.lang';   /* shared with the site's own switch */
  var lang = 'en';
  try { if (localStorage.getItem(LANG_KEY) === 'ms') lang = 'ms'; } catch (_) {}
  $$('[data-i18n]').forEach(function (el) { STR.en[el.getAttribute('data-i18n')] = el.innerHTML; });
  $$('[data-i18n-aria]').forEach(function (el) { STR.en[el.getAttribute('data-i18n-aria')] = el.getAttribute('aria-label'); });
  function T() { return STR[lang]; }
  function q(i) { return lang === 'ms' ? (i < PART_A.length ? MS.a[i] : MS.b[i - PART_A.length]) : state.list[i].q; }
  function scale() { return lang === 'ms' ? MS.scale : SCALE; }

  function applyLang() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(function (el) { el.innerHTML = T()[el.getAttribute('data-i18n')]; });
    $$('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', T()[el.getAttribute('data-i18n-aria')]); });
    $$('.t-lang button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false'); });
    /* whichever screen is up is redrawn in place — the reader keeps
       their place in the questions */
    if (!screens.quiz.hasAttribute('hidden')) render();
    if (!screens.result.hasAttribute('hidden')) writeResult();
  }
  function setLang(l) {
    lang = l === 'ms' ? 'ms' : 'en';
    try { localStorage.setItem(LANG_KEY, lang); } catch (_) {}
    applyLang();
  }
  $$('.t-lang button').forEach(function (b) {
    b.addEventListener('click', function () { setLang(b.getAttribute('data-lang')); });
  });

  var screens = {
    intro:  $('[data-screen="intro"]'),
    quiz:   $('[data-screen="quiz"]'),
    result: $('[data-screen="result"]')
  };

  var state = {
    list: PART_A.slice(),   /* grows to A+B if the reader opts in */
    answers: [],
    i: 0,
    withB: false
  };
  if (lang !== 'en') applyLang();

  function show(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].toggleAttribute('hidden', k !== name);
    });
    window.scrollTo(0, 0);
    /* Move focus to the top of whatever just appeared, or a keyboard and a
       screen reader are both left standing where the old screen was. */
    var h = screens[name].querySelector('h1, h2, .q-text');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  /* ---------- the question ---------- */
  function render() {
    var item = state.list[state.i];
    var n = state.i + 1;
    var total = state.list.length;

    $('.q-count').textContent = T().qCount(n, total);
    $('.q-part').textContent = state.i < PART_A.length ? T().partA : T().partB;
    $('.q-text').textContent = q(state.i);
    $('.bar-fill').style.width = ((state.i) / total * 100) + '%';

    var box = $('.q-options');
    box.innerHTML = '';
    scale().forEach(function (label, v) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'opt';
      b.textContent = label;
      if (state.answers[state.i] === v) b.setAttribute('aria-pressed', 'true');
      else b.setAttribute('aria-pressed', 'false');
      b.addEventListener('click', function () { answer(v); });
      box.appendChild(b);
    });

    $('.q-back').disabled = state.i === 0;
  }

  function answer(v) {
    state.answers[state.i] = v;
    if (state.i + 1 < state.list.length) { state.i++; render(); }
    else finish();
  }

  $('.q-back').addEventListener('click', function () {
    if (state.i > 0) { state.i--; render(); }
  });

  /* Number keys 1-5 pick an answer. The mouse is the slow way through
     eighteen questions and this instrument is meant to take five minutes. */
  document.addEventListener('keydown', function (e) {
    if (screens.quiz.hasAttribute('hidden')) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 5) { e.preventDefault(); answer(n - 1); }
    if (e.key === 'Backspace' && state.i > 0) { e.preventDefault(); state.i--; render(); }
  });

  /* ---------- the score ----------
     Part A only, and only ever as a count of answers that fall in that
     question's shaded band. Part B carries no score at all — the form says
     so outright: "No total score or diagnostic likelihood is utilized for
     the twelve questions." */
  function scoreA() {
    var n = 0;
    for (var i = 0; i < PART_A.length; i++) {
      if (state.answers[i] >= PART_A[i].band) n++;
    }
    return n;
  }
  function scoreB() {
    var n = 0;
    for (var i = 0; i < PART_B.length; i++) {
      var a = state.answers[PART_A.length + i];
      if (a !== undefined && a >= PART_B[i].band) n++;
    }
    return n;
  }

  function writeResult() {
    var a = scoreA();
    var consistent = a >= 4;

    $('.r-score').textContent = a;
    $('.r-verdict').textContent = consistent ? T().verdictYes : T().verdictNo;
    /* innerHTML, not textContent, for one reason: the word ADHD wears the
       mark's violet everywhere else on the site and would arrive plain
       here. Nothing in these strings comes from the reader — they are
       written above, in full, in both languages, and there is no
       interpolation. */
    $('.r-detail').innerHTML = consistent ? T().detailYes : T().detailNo;

    var bWrap = $('.r-partb');
    if (state.withB) {
      bWrap.hidden = false;
      $('.r-bscore').textContent = scoreB();
    } else {
      bWrap.hidden = true;
    }

  }

  function finish() {
    writeResult();
    $('.bar-fill').style.width = '100%';
    show('result');
  }

  /* ---------- getting in and out ---------- */
  $('.start-a').addEventListener('click', function () {
    state.list = PART_A.slice(); state.withB = false;
    state.answers = []; state.i = 0;
    render(); show('quiz');
  });
  $('.start-ab').addEventListener('click', function () {
    state.list = PART_A.concat(PART_B); state.withB = true;
    state.answers = []; state.i = 0;
    render(); show('quiz');
  });
  $('.r-again').addEventListener('click', function () {
    state.answers = []; state.i = 0;
    $('.bar-fill').style.width = '0%';
    render(); show('quiz');
  });

  /* Nothing you answer is stored and nothing is sent. There is no
     analytics call here, no fetch, and the one localStorage write on this
     page is the language switch above — never an answer: the answers
     exist in this closure while the tab is open and go with it when it
     closes. That is the only honest way to run a mental-health screener
     on somebody else's device, and it is why the page says so. */
})();
