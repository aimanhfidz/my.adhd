/* ============ The ASRS-v1.1 self-check ============
   A standalone screener. It is not part of the site: no bar, no footer,
   no pager. One question at a time, because the audience for this
   instrument is the one this whole project is about, and eighteen rows of
   checkboxes on one page is the exact object that makes them close the
   tab.

   It used to say "nothing to navigate to", and there are now exactly two
   links off it: the Terms and the Privacy Notice, in the consent label.
   Both open in a new tab. A person cannot agree to a notice they are not
   allowed to read, and sending them away to read it would cost them the
   form they had just filled in.

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
      detailNo:  'Fewer than four of your Part A answers landed in the bands the ASRS treats as significant. That is not a clean bill of health and it does not rule ADHD out — this screener is six questions, and plenty of people who have <span class="adhd-word">ADHD</span> score below the line. If the way you live still doesn’t match the result, that is worth taking to a professional anyway.',

      /* The gate's own strings. These are the exception to "English is
         harvested from the markup": an error message has no element to
         live in until there is something wrong, so both languages are
         written here. Every one of them is set with textContent. */
      eAge: 'Put your age in as a number — just the digits.',
      eAgeHigh: 'That age looks wrong. Check the digits?',
      eName: 'We need something to call you — two letters or more.',
      eGender: 'Pick one of the three.',
      eConsent: 'The first two boxes are the ones we cannot go on without.',
      ePhone: 'That does not look like a phone number we could dial. Leave it blank if you would rather not give one.',
      savedOk: 'Saved to your account.',
      savedNo: 'We could not save this one — the result above is still yours.'
    },
    ms: {
      qCount: function (n, t) { return 'Soalan ' + n + ' daripada ' + t; },
      partA: 'Bahagian A', partB: 'Bahagian B',
      verdictYes: 'Jawapan awak berada dalam julat yang wajar mendapat penilaian penuh.',
      verdictNo:  'Jawapan awak berada di bawah julat yang ditandakan oleh saringan ini.',
      detailYes: 'Empat atau lebih jawapan Bahagian A awak jatuh dalam julat yang dianggap signifikan oleh ASRS. Pada instrumen ini, itu bermakna simptom yang sangat konsisten dengan <span class="adhd-word">ADHD</span> pada orang dewasa, dan siasatan lanjut adalah wajar — oleh pakar psikiatri atau ahli psikologi klinikal, satu-satunya pihak yang boleh mendiagnosisnya.',
      detailNo:  'Kurang daripada empat jawapan Bahagian A awak jatuh dalam julat yang dianggap signifikan oleh ASRS. Itu bukan bermakna awak bebas daripadanya, dan ia tidak menolak kemungkinan ADHD — saringan ini hanya enam soalan, dan ramai yang mempunyai <span class="adhd-word">ADHD</span> mendapat skor di bawah garisan. Jika cara hidup awak masih tidak sepadan dengan keputusan ini, ia tetap wajar dibawa kepada pakar.',
      /* the static page, by data-i18n key */
      exit: 'Tinggalkan semakan kendiri',
      kicker: 'Semakan kendiri.',
      h1: 'Sepuluh minit, percuma, dan salinan yang kekal milik awak.',
      lede: 'Ini ialah Skala Laporan Kendiri <span class="adhd-word">ADHD</span> Dewasa (ASRS-v1.1) — soal selidik saringan yang digunakan perkhidmatan kesihatan, diterjemahkan di sini untuk bacaan. Jawab jujur tentang <b>enam bulan yang lalu</b>, dan awak dapat gambaran jelas sama ada ciri-ciri awak cukup kuat untuk pergi buat penilaian penuh.',
      f1k: 'Soalan', f1v: '6, atau 18 kalau awak nak gambaran yang lebih penuh',
      f2k: 'Masa', f2v: 'Kira-kira 5 minit',
      f3k: 'Kos', f3v: 'Percuma. Perlu log masuk Google',
      f4k: 'Jawapan awak', f4v: 'Disimpan dalam akaun awak. Padam bila-bila masa.',
      f5k: 'Apa yang awak dapat', f5v: 'Skor daripada 6, dan maksudnya',
      startA: 'Mula saringan 6 soalan',
      startAB: 'Jawab kesemua 18',
      whoH: 'Siapa yang menulis soalan ini',
      who1: 'Lapan belas soalan dalam semakan kendiri ini ialah <b>Senarai Semak Simptom Skala Laporan Kendiri <span class="adhd-word">ADHD</span> Dewasa (ASRS-v1.1)</b>. Versi Bahasa Melayu di halaman ini ialah terjemahan untuk bacaan; instrumen yang menjadi rujukan, dan yang menentukan skor, ialah teks asal dalam bahasa Inggeris, yang MyADHD tidak menulis dan tidak mengubahnya.',
      who2: 'Senarai semak ini dibangunkan bersama <b>Pertubuhan Kesihatan Sedunia (WHO)</b> dan Kumpulan Kerja <span class="adhd-word">ADHD</span> Dewasa, yang terdiri daripada:',
      who3: 'Soalan-soalan ini selaras dengan kriteria DSM-IV dan menyentuh bagaimana simptom <span class="adhd-word">ADHD</span> muncul pada orang dewasa. Pemarkahan yang digunakan di sini ialah pemarkahan instrumen itu sendiri: Bahagian A ialah saringan enam soalan, dan sesuatu jawapan dikira apabila ia jatuh dalam julat berlorek soalan itu pada borang bercetak. Bahagian B tidak mempunyai skor langsung — borang itu menyatakan dengan jelas bahawa “tiada jumlah skor atau kebarangkalian diagnosis digunakan” untuk dua belas soalan itu.',
      notH: 'Apa yang ini bukan',
      not1: '<b>Ini alat saringan, bukan diagnosis.</b> Hanya pakar psikiatri atau ahli psikologi klinikal boleh mendiagnosis <span class="adhd-word">ADHD</span>. Skor yang tinggi ialah sebab untuk membuat temu janji itu, bukan jawapan; skor yang rendah tidak menolak apa-apa.',
      not2: 'Jawapan anda disimpan, dan inilah maksudnya. Apabila anda selesai, jawapan anda, skor Bahagian A anda dan butiran yang anda berikan &mdash; nama, umur, jantina, dan nombor telefon jika anda memberikannya &mdash; disimpan di bawah akaun Google anda dalam pangkalan data kami di Supabase. Ia untuk tiga perkara sahaja: untuk menghubungi anda tentang sokongan ADHD jika anda memintanya, supaya anda boleh mencari dan memadam rekod anda sendiri, dan, setelah nama dan setiap butiran pengenalan lain dibuang, untuk mengira bagaimana rakyat Malaysia mendapat skor. Kami menyimpannya selama 24 bulan selepas semakan kendiri terakhir anda dan kemudian ia dipadam secara automatik. <a href="/privacy" target="_blank" rel="noopener">Notis privasi</a> menerangkannya sepenuhnya, dalam Bahasa Inggeris dan Bahasa Melayu.',
      howOften: 'Berapa kerap',
      back: '← Soalan sebelumnya',
      hint: 'Tekan 1–5 untuk menjawab',
      rKicker: 'Keputusan awak.',
      rOf: 'daripada 6 jawapan Bahagian A dalam julat signifikan',
      rB1: 'Awak juga jawab Bahagian B, di mana',
      rB2: 'daripada 12 jatuh dalam julat berlorek. Bahagian B tidak diberi skor dan tidak mengubah keputusan di atas — ia memberi pakar klinikal petunjuk tambahan untuk ditanya.',
      n1: 'Bawa keputusan ini kepada pakar psikiatri atau ahli psikologi klinikal — ia bagi mereka sesuatu yang kukuh untuk dimulakan.',
      n2: 'Tulis apa yang betul-betul tak kena dalam masa seminggu, dan bawa sekali.',
      n3: 'Apa pun angkanya, hari ini tetap kena dihabiskan. <a href="/tools">Tengok apa yang kami bina untuk tu</a>.',
      again: 'Cuba lagi',
      home: 'Kembali ke MyADHD',

      /* ---------- the gate, the form, the door that stays shut ---------- */
      gKicker: 'Sebelum awak mula.',
      gH: 'Yang pertama: keputusan ini milik siapa.',
      gLede: 'Semakan kendiri ni simpan keputusan awak, jadi ia kena tahu keputusan siapa. Maksudnya log masuk Google &mdash; untuk nama dan e-mel awak, dan takde apa-apa lagi. Ia tak minta kalendar atau kenalan awak.',
      gGo: 'Teruskan dengan Google',
      gBack: 'Kembali',
      gFine: 'Saringan ni percuma dan akan kekal percuma. Log masuk ialah cara keputusan tu disimpan untuk awak &mdash; dan cara awak boleh padam ia nanti. Skrin seterusnya ialah skrin Google sendiri; awak akan balik ke sini lepas tu.',

      dKicker: 'Hampir sampai.',
      dH: 'Beberapa butiran, kemudian kita mula.',
      dLede: 'Ini yang disimpan bersama jawapan awak. Baca notis di bawahnya sebelum awak tanda apa-apa &mdash; ia pendek, dan itulah bahagian yang betul-betul penting.',
      dName: 'Nama awak',
      dNamePh: 'Nak kami panggil awak apa?',
      dPhone: 'Nombor telefon <span class="f-opt" data-i18n="dPhoneOpt">pilihan</span>',
      dPhoneOpt: 'pilihan',
      dPhonePh: '012-345 6789',
      dAge: 'Umur awak',
      dAgePh: 'cth. 28',
      dGender: 'Jantina',
      gMale: 'Lelaki',
      gFemale: 'Perempuan',
      gNone: 'Tidak mahu nyatakan',
      dGo: 'Mula saringan',

      /* The notice is shown in both languages at once and neither copy is
         behind the switch, so these two keys deliberately hold the same
         text as the markup rather than a translation of it: applyLang()
         still writes them, and writing the English copy in Malay would
         leave the reader without the English the Act also asks for. */
      cNoticeEn: null,
      cNoticeMs: null,

      cTerms: 'Saya telah membaca dan bersetuju dengan <a href="/terms" target="_blank" rel="noopener">Terma Penggunaan</a> dan <a href="/privacy" target="_blank" rel="noopener">Notis Privasi</a>.',
      cHealth: 'Saya memberi kebenaran nyata kepada MyADHD untuk memproses jawapan saya kepada soalan kesihatan ini &mdash; data peribadi sensitif di bawah PDPA &mdash; bagi tiga tujuan di atas.',
      cContact: 'Anda boleh menghubungi saya tentang sokongan, sumber dan acara ADHD. <span class="f-opt" data-i18n="cContactOpt">pilihan</span>',
      cContactOpt: 'pilihan',

      yKicker: 'Bukan yang ini.',
      yH: 'Yang ini untuk orang dewasa.',
      yLede: 'ASRS ialah skala laporan kendiri <strong>Dewasa</strong>. Ia ditulis untuk mereka yang berumur 18 tahun ke atas, dan pemarkahannya hanya pernah diuji pada mereka &mdash; jadi angka daripadanya takkan bermakna untuk awak. Ini bukan penolakan. Ini instrumen itu bersikap jujur tentang apa dirinya.',
      yHelp: 'Kalau tumpuan, keresahan atau nak mula sesuatu terasa berat sekarang, orang yang patut dirujuk ialah doktor atau kaunselor sekolah, yang boleh rujuk awak kepada pihak yang menilai golongan muda. Kalau awak perlu bercakap dengan seseorang hari ini, <strong>Talian Kasih 15999</strong> menjawab 24 jam, percuma, dalam Bahasa Melayu dan Bahasa Inggeris (WhatsApp 019-261 5999).',
      yNothing: 'Takde apa yang awak taip dihantar ke mana-mana, dan takde apa yang disimpan.',
      yHome: 'Kembali ke MyADHD',

      eAge: 'Masukkan umur awak sebagai nombor — angka je.',
      eAgeHigh: 'Umur itu nampak tidak betul. Semak semula angkanya?',
      eName: 'Kami perlukan sesuatu untuk panggil awak — dua huruf atau lebih.',
      eGender: 'Pilih salah satu daripada tiga.',
      eConsent: 'Dua kotak pertama itulah yang kami tidak boleh teruskan tanpanya.',
      ePhone: 'Itu tak nampak macam nombor telefon yang boleh kami hubungi. Biar kosong kalau awak tak nak bagi.',
      savedOk: 'Disimpan dalam akaun awak.',
      savedNo: 'Kami tak dapat simpan yang ni — keputusan di atas tetap milik awak.'
    }
  };

  var $ = function (s) { return document.querySelector(s); };
  var $$ = function (s) { return [].slice.call(document.querySelectorAll(s)); };

  /* ---------- language ----------
     One preference, kept in localStorage under the key the site's bar
     switch also writes, so a language picked on any page follows the
     reader into the screener and back out again. English is harvested
     from the markup on load, so the only place English lives is the HTML.

     Three harvest/apply pairs, not one, because applyLang() works by
     writing innerHTML and innerHTML cannot reach everything:

       data-i18n       the element's own markup
       data-i18n-aria  an aria-label, which is an attribute
       data-i18n-ph    a placeholder, likewise

     The third exists for the details form. Note what it is NOT used for:
     every field has a real visible <span class="field-label">, and a
     placeholder here only ever carries a format hint ("012-345 6789").
     A placeholder standing in for a label disappears the moment somebody
     types, which is precisely when a person filling in a form about
     themselves most wants to check what was being asked.

     And the rule that keeps this working: data-i18n never goes on an
     element that contains a form control. It goes on a span beside it, so
     an innerHTML write can never blow away an <input> and the value
     inside it. */
  var LANG_KEY = 'myadhd.lang';   /* shared with the site's own switch */
  var lang = 'en';
  try { if (localStorage.getItem(LANG_KEY) === 'ms') lang = 'ms'; } catch (_) {}
  $$('[data-i18n]').forEach(function (el) { STR.en[el.getAttribute('data-i18n')] = el.innerHTML; });
  $$('[data-i18n-aria]').forEach(function (el) { STR.en[el.getAttribute('data-i18n-aria')] = el.getAttribute('aria-label'); });
  $$('[data-i18n-ph]').forEach(function (el) { STR.en[el.getAttribute('data-i18n-ph')] = el.getAttribute('placeholder'); });
  function T() { return STR[lang]; }

  /* A string by key, falling back to the English rather than to nothing.
     Two reasons. A Malay key that has not been written yet should leave
     the English in place, not blank the element — a half-translated page
     is survivable and an empty one is not. And the two halves of the s.7
     notice are deliberately null in the Malay table: they are shown in
     both languages at once, so each must keep the text the markup gave
     it, in the language it was written in. */
  function str(key) {
    var v = T()[key];
    return (v === undefined || v === null) ? STR.en[key] : v;
  }
  function q(i) { return lang === 'ms' ? (i < PART_A.length ? MS.a[i] : MS.b[i - PART_A.length]) : state.list[i].q; }
  function scale() { return lang === 'ms' ? MS.scale : SCALE; }

  function applyLang() {
    document.documentElement.lang = lang;
    $$('[data-i18n]').forEach(function (el) { el.innerHTML = str(el.getAttribute('data-i18n')); });
    $$('[data-i18n-aria]').forEach(function (el) { el.setAttribute('aria-label', str(el.getAttribute('data-i18n-aria'))); });
    $$('[data-i18n-ph]').forEach(function (el) { el.setAttribute('placeholder', str(el.getAttribute('data-i18n-ph'))); });
    $$('.t-lang button').forEach(function (b) { b.setAttribute('aria-pressed', b.getAttribute('data-lang') === lang ? 'true' : 'false'); });
    /* whichever screen is up is redrawn in place — the reader keeps
       their place in the questions */
    if (!screens.quiz.hasAttribute('hidden')) render();
    if (!screens.result.hasAttribute('hidden')) writeResult();
    /* An error is cleared rather than translated. Somebody who switches
       language mid-form should not be left holding a sentence in the
       language they just left, and re-rendering it in the new one would
       mean telling them off a second time for something they have not
       had a chance to fix yet. */
    clearErrors();
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
    intro:   $('[data-screen="intro"]'),
    gate:    $('[data-screen="gate"]'),
    details: $('[data-screen="details"]'),
    young:   $('[data-screen="young"]'),
    quiz:    $('[data-screen="quiz"]'),
    result:  $('[data-screen="result"]')
  };

  var state = {
    list: PART_A.slice(),   /* grows to A+B if the reader opts in */
    answers: [],
    i: 0,
    withB: false,
    /* Filled in on the details screen and sent once, from finish(). Held
       here rather than read back off the form at submit time because the
       form is still on the page and still editable while the questions
       are being answered — what gets saved must be what was consented
       to, not whatever the inputs happen to say afterwards. */
    details: null
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

    /* The result is on the screen before this opens a socket, and that
       ordering is the whole guarantee. Somebody who has just answered
       eighteen questions about their own attention is not made to watch a
       spinner to find out their score, and a network they do not control
       cannot take the result away from them. Never awaited, never
       retried; its only visible effect is one line underneath. */
    submit();
  }


  /* ============ the gate ============
     Between pressing start and the first question there is now a door in
     two screens: one that offers the sign-in and does nothing else, then
     Google, then one that asks who you are and what may be kept.
     Everything in this block exists to make that door work without ever
     standing between a reader and a result they have already earned.

     GATE_ON is false when auth.js has nothing to talk to — no Supabase
     project configured, which is what `python3 serve.py` looks like. The
     screener then runs exactly as it did before any of this: no sign-in,
     no form, and nothing sent. That is a development convenience and a
     divergence from what the page's own copy promises, so it must never
     be true in production; config.js is the thing that decides, and it is
     deployed. */
  var GATE_ON = !!(window.auth && window.auth.configured());

  /* Which screener they pressed, kept across a full-page redirect to
     Google and back. sessionStorage rather than localStorage: it survives
     the navigation, it is scoped to this tab, and it leaves nothing
     behind on a shared machine. Both keys are read once at boot and
     removed immediately, so a later reload cannot replay the flow.

     Not the query string — auth.signIn() builds its return URL from
     origin + pathname and drops the search, so ?part=ab would not come
     back. */
  var INTENT_KEY = 'myadhd.selfcheck.intent';

  function stash(k, v) { try { sessionStorage.setItem(k, v); } catch (_) {} }
  function unstash(k) {
    try {
      var v = sessionStorage.getItem(k);
      sessionStorage.removeItem(k);
      return v;
    } catch (_) { return null; }
  }

  function setIntent(which) {
    state.withB = which === 'ab';
    state.list = state.withB ? PART_A.concat(PART_B) : PART_A.slice();
    state.answers = [];
    state.i = 0;
  }

  function begin() {
    $('.bar-fill').style.width = '0%';
    render();
    show('quiz');
  }

  /* ---------- errors ----------
     textContent, not innerHTML. The note above writeResult() explains why
     that file's one innerHTML is safe: nothing in those strings comes
     from the reader. These strings can quote what somebody typed, so the
     same reasoning does not carry and the method has to be the safe one. */
  function setErr(sel, msg) {
    var el = $(sel);
    if (!el) return;
    el.textContent = msg;
    el.hidden = !msg;
  }
  function clearErrors() {
    $$('.f-err').forEach(function (el) { el.textContent = ''; el.hidden = true; });
    $$('[aria-invalid]').forEach(function (el) { el.removeAttribute('aria-invalid'); });
  }
  function markBad(input) { if (input) input.setAttribute('aria-invalid', 'true'); }

  function readAge(input) {
    var raw = String(input.value || '').trim();
    if (!/^\d{1,3}$/.test(raw)) return null;
    return parseInt(raw, 10);
  }

  /* The door that stays shut. Its own screen, and no network call on the
     way to it — nothing typed here has been sent, which is what the
     screen says and has to remain true.

     signOut() rather than deleteAccount(): somebody under 18 who already
     uses the app has lists of their own, and taking those away because
     they typed an age into a different page would be a punishment for
     honesty. Since the sign-in now comes first, everybody who reaches
     this is signed in, and the sign-out below is the whole of what we
     can do about it — the age is asked as early as we can ask it, which
     is the first screen we have a form on. Nothing they typed is sent. */
  function tooYoung() {
    state.details = null;
    unstash(INTENT_KEY);
    clearErrors();
    var f = $('.d-name'); if (f) f.value = '';
    var p = $('.d-phone'); if (p) p.value = '';
    $$('.c-block input[type="checkbox"]').forEach(function (c) { c.checked = false; });
    show('young');
    if (GATE_ON && window.auth.signedIn()) { try { window.auth.signOut(); } catch (_) {} }
  }

  /* ---------- pressing start ----------
     Start goes to the sign-in screen, not to Google. Leaving the site is
     a thing a person should press a button to do, knowing that is what
     the button does — a start button that turns into Google's own page
     without warning reads as a hijack, however ordinary the destination.
     So there is a screen in between, it says what the sign-in is for, and
     its one button is the one that leaves.

     Nothing is asked on it. Age, name, gender and the consent ticks are
     asked once, together, on the details screen on the way back. */
  function start(which) {
    if (!GATE_ON) { setIntent(which); begin(); return; }
    setIntent(which);
    if (!window.auth.signedIn()) {
      stash(INTENT_KEY, which);
      clearErrors();
      show('gate');
      return;
    }
    resume();
  }

  $('.start-a').addEventListener('click', function () { start('a'); });
  $('.start-ab').addEventListener('click', function () { start('ab'); });

  /* Deliberately not routed through start(): a retake is by somebody who
     has already signed in, already consented and already answered, and
     asking again at that moment would read as the page forgetting them.
     It reuses state.list and state.withB from the run just finished. */
  $('.r-again').addEventListener('click', function () {
    state.answers = []; state.i = 0;
    $('.bar-fill').style.width = '0%';
    $('.r-saved').hidden = true;
    render(); show('quiz');
  });

  /* ---------- the gate screen ----------
     One button and nothing to fill in: this screen exists to be the place
     the reader chooses to leave for Google from, and a form on it would
     only be a second thing to get wrong before they could.

     Whichever screener they pressed is already stashed by start(). The
     re-stash below is for the other way in — a token that expired under
     resume(), where nobody pressed start this time round — and it reads
     the intent back off the state that run left behind. */
  var gateGo = $('.g-go');
  if (gateGo) {
    gateGo.addEventListener('click', function () {
      clearErrors();
      stash(INTENT_KEY, state.withB ? 'ab' : 'a');
      /* Identity only. See the note on signIn() in auth.js: the calendar
         scope belongs to the app, not to a screener. */
      window.auth.signIn({ scopes: '', offline: false });
    });
  }

  /* The way out that is not Google. A door with one button and no way
     back is a trap, and the header's "Leave the self-check" link leaves
     the site entirely — too big a step for somebody who only wants to
     reread what they are agreeing to. This drops the stashed intent on
     the way: they are no longer mid-flow, and a reload should not think
     they are. */
  var gateBack = $('.g-back');
  if (gateBack) {
    gateBack.addEventListener('click', function () {
      unstash(INTENT_KEY);
      clearErrors();
      show('intro');
    });
  }

  /* ---------- the details screen ---------- */
  function readDetails() {
    clearErrors();

    /* Age before the name, though the name is the field above it. This is
       the first form on the page and so the first chance to find out that
       somebody is 15; making them fix a blank name before we tell them
       would be the page wasting their time on a form it is about to throw
       away. */
    var ageEl = $('.d-age');
    var age = readAge(ageEl);
    if (age === null) { markBad(ageEl); setErr('.d-age-err', T().eAge); return null; }
    if (age > 100)    { markBad(ageEl); setErr('.d-age-err', T().eAgeHigh); return null; }
    if (age < 18)     { tooYoung(); return null; }

    var nameEl = $('.d-name');
    var name = String(nameEl.value || '').trim();
    if (name.length < 2 || name.length > 80) {
      markBad(nameEl); setErr('.d-name-err', T().eName); return null;
    }

    var picked = $('.c-block') && $('input[name="gender"]:checked');
    if (!picked) { setErr('.d-gender-err', T().eGender); return null; }

    var terms = $('.c-terms').checked;
    var health = $('.c-health').checked;
    if (!terms || !health) { setErr('.c-err', T().eConsent); return null; }

    return {
      name: name,
      phone: String($('.d-phone').value || '').trim(),
      age: age,
      gender: picked.value,
      contact: $('.c-contact').checked
    };
  }

  var detailsGo = $('.d-go');
  if (detailsGo) {
    detailsGo.addEventListener('click', function () {
      var d = readDetails();
      if (!d) return;
      state.details = d;
      begin();
    });
  }

  /* ---------- coming back ----------
     Called once the reader is known to be signed in. Asks the server
     whether it already holds a consent against the current notice; if it
     does, straight to the questions, and if it does not, the form.

     A failed request falls through to the form. Failing toward asking
     again is always safe; failing toward skipping consent is not, and
     that asymmetry is the reason there is no retry here. */
  function resume() {
    clearErrors();
    var me = null;
    return window.auth.token()
      .then(function (token) {
        if (!token) { show('gate'); return null; }
        return fetch('/api/self-check', {
          headers: { Authorization: 'Bearer ' + token }
        });
      })
      .then(function (res) {
        if (!res) return null;
        if (res.status === 401) { show('gate'); return null; }
        return res.ok ? res.json() : null;
      })
      .then(function (data) {
        if (data === null && !screens.gate.hasAttribute('hidden')) return;
        me = data;
        if (me && me.needsConsent === false) { begin(); return; }
        prefill(me);
        show('details');
      })
      .catch(function () {
        prefill(null);
        show('details');
      });
  }

  function prefill(me) {
    var p = (me && me.profile) || null;
    var user = GATE_ON ? window.auth.user() : null;

    var nameEl = $('.d-name');
    if (nameEl && !nameEl.value) {
      nameEl.value = (p && p.name) || (user && user.name) || '';
    }
    var phoneEl = $('.d-phone');
    if (phoneEl && !phoneEl.value && p && p.phone) phoneEl.value = p.phone;

    var ageEl = $('.d-age');
    if (ageEl && !ageEl.value) {
      ageEl.value = (p && p.age) || '';
    }
    if (p && p.gender) {
      var r = $('input[name="gender"][value="' + p.gender + '"]');
      if (r) r.checked = true;
    }
    /* The consent boxes are never prefilled, even for somebody we have a
       consent on file for. If they are being shown this screen at all it
       is because the notice they agreed to is not the notice in front of
       them now, and a pre-ticked box is not agreement to anything. */
  }

  /* ---------- sending it ----------
     Fire and forget, after the result is already up. */
  function submit() {
    if (!GATE_ON || !window.auth.signedIn() || !state.details) return;

    var d = state.details;
    var body = {
      name: d.name,
      phone: d.phone,
      age: d.age,
      gender: d.gender,
      part: state.withB ? 'ab' : 'a',
      answers: state.answers.slice(0, state.list.length),
      lang: lang,
      consent: { terms: true, health: true, contact: !!d.contact, version: CONSENT_VERSION }
    };

    window.auth.token()
      .then(function (token) {
        if (!token) return null;
        return fetch('/api/self-check', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: 'Bearer ' + token
          },
          body: JSON.stringify(body)
        });
      })
      .then(function (res) { said(!!(res && res.ok)); })
      .catch(function () { said(false); });
  }

  function said(ok) {
    var el = $('.r-saved');
    if (!el) return;
    el.textContent = ok ? T().savedOk : T().savedNo;
    el.hidden = false;
  }

  /* The version of the notice these ticks were given against. It must
     match the constant in api/self-check.js — the server refuses a
     mismatch rather than guessing, which is what makes "if the notice
     changes you are asked again" true rather than aspirational. */
  var CONSENT_VERSION = 'pdpa-2026-09';

  /* ---------- boot ----------
     Everything above is wiring and runs synchronously. This is the only
     part that waits on anything, and it runs last so that nothing it does
     can leave the page half-built. The intro is already what the markup
     shows, so there is no flicker to avoid. */
  (function boot() {
    if (!GATE_ON) return;

    window.auth.absorbRedirect()
      .catch(function () {})
      .then(function () {
        var intent = unstash(INTENT_KEY);
        /* No intent means an ordinary visit — somebody who opened the
           page rather than somebody coming back from Google. Leave the
           intro alone. */
        if (!intent) return;
        /* An intent but no session means they went to Google and came
           back without signing in. Also the intro: pushing them at the
           door again would be the page arguing with them. */
        if (!window.auth.signedIn()) return;
        setIntent(intent);
        return resume();
      });
  })();

  /* ---------- what leaves this page, and when ----------
     This used to say that nothing did. It does now, and the honest
     version is worth as much space as the old promise had.

     One request, from finish(), after the result is already on screen:
     the answers, the score the server recomputes from them, and the
     details given on the form. It goes only when somebody has signed in
     and ticked the two mandatory boxes, and it is never retried — a
     result belongs to the person who earned it whether or not our
     database was reachable at that moment.

     What still does not leave: anything typed by somebody who turns out
     to be under 18, and anything at all when the gate is off. The
     under-18 branch sends nothing it was told — no name, no age, no
     answers, no row in our own tables — but it is no longer true that it
     touches no network, because the sign-in came first: an auth account
     exists by then, and tooYoung() signs it straight back out. That is
     the cost of asking for the age on the form rather than at the door,
     and it is the reason the age is the earliest thing that form checks.
     There is no analytics call here, and no third-party script on this
     page — the sign-in works by navigating away to Google and coming
     back, which is a different thing from embedding them.

     Storage is two keys and no answers: myadhd.lang in localStorage, and
     one sessionStorage key carrying which screener was pressed across the
     redirect, removed the moment it is read. The
     answers themselves still live in this closure and go with the tab
     when it closes; what outlives it is the copy on the server, which
     exists because somebody asked for it and can be deleted because they
     did. The page says all of this before it asks, in both languages,
     which is the only honest way to run a mental-health screener on
     somebody else's device. */
})();
