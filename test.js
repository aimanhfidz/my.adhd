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
      goTo: function (n) { return 'Go to question ' + n; },
      inBand: 'in the shaded band',
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
      eDx: 'Pick the one closest to where you are — or prefer not to say.',
      eConsent: 'The first two boxes are the ones we cannot go on without.',
      ePhone: 'That does not look like a phone number we could dial. Leave it blank if you would rather not give one.',
      savedOk: 'Saved to your account.',
      savedNo: 'We could not save this one — the result above is still yours.'
    },
    ms: {
      qCount: function (n, t) { return 'Soalan ' + n + ' daripada ' + t; },
      partA: 'Bahagian A', partB: 'Bahagian B',
      goTo: function (n) { return 'Pergi ke soalan ' + n; },
      inBand: 'dalam julat berlorek',
      verdictYes: 'Jawapan awak berada dalam julat yang wajar mendapat penilaian penuh.',
      verdictNo:  'Jawapan awak berada di bawah julat yang ditandakan oleh saringan ini.',
      detailYes: 'Empat atau lebih jawapan Bahagian A awak jatuh dalam julat yang dianggap signifikan oleh ASRS. Pada instrumen ini, itu bermakna simptom yang sangat konsisten dengan <span class="adhd-word">ADHD</span> pada orang dewasa, dan siasatan lanjut adalah wajar — oleh pakar psikiatri atau ahli psikologi klinikal, satu-satunya pihak yang boleh mendiagnosisnya.',
      detailNo:  'Kurang daripada empat jawapan Bahagian A awak jatuh dalam julat yang dianggap signifikan oleh ASRS. Itu bukan bermakna awak bebas daripadanya, dan ia tidak menolak kemungkinan ADHD — saringan ini hanya enam soalan, dan ramai yang mempunyai <span class="adhd-word">ADHD</span> mendapat skor di bawah garisan. Jika cara hidup awak masih tidak sepadan dengan keputusan ini, ia tetap wajar dibawa kepada pakar.',
      /* the static page, by data-i18n key */
      exit: 'Tinggalkan semakan kendiri',
      kicker: 'Semakan kendiri.',
      h1: 'Sepuluh minit, percuma, dan salinan yang kekal milik awak.',
      lede: 'Ini ialah Skala Laporan Kendiri <span class="adhd-word">ADHD</span> Dewasa (ASRS-v1.1) — soal selidik saringan yang digunakan perkhidmatan kesihatan, diterjemahkan di sini untuk bacaan.',
      lede2: 'Jawab dengan jujur tentang <b>enam bulan lepas</b>. Awak akan dapat gambaran jelas sama ada ciri-ciri awak berada dalam julat yang wajar mendapat penilaian penuh.',
      /* The intro's points, button and meta line, and everything new
         since the redesign of 2026-10-04, are in the baku register of
         docs/bahasa-melayu-reference.md: `anda`, `tidak`. The older
         strings around them still say `awak` and are due the same pass. */
      p1t: 'Fikirkan enam bulan yang lepas',
      p1d: 'Bukan minggu ini sahaja, tetapi keadaan anda yang biasa.',
      p2t: 'Jawab mengikut keadaan sebenar',
      p2d: 'Bukan seperti yang anda harapkan, atau seperti yang dilihat orang lain.',
      start: 'Mulakan semakan kendiri',
      meta: 'Kira-kira 5 minit &middot; 6 soalan, kemudian 12 lagi jika anda mahu &middot; Percuma',
      metaSub: 'Tidak perlu log masuk untuk bermula. Di akhir, log masuk dengan Google untuk mendapatkan laporan penuh anda. Ini bukan diagnosis.',
      whoH: 'Siapa yang menulis soalan ini',
      who1: 'Lapan belas soalan dalam semakan kendiri ini ialah <b>Senarai Semak Simptom Skala Laporan Kendiri <span class="adhd-word">ADHD</span> Dewasa (ASRS-v1.1)</b>. Versi Bahasa Melayu di halaman ini ialah terjemahan untuk bacaan; instrumen yang menjadi rujukan, dan yang menentukan skor, ialah teks asal dalam bahasa Inggeris, yang MyADHD tidak menulis dan tidak mengubahnya.',
      who2: 'Senarai semak ini dibangunkan bersama <b>Pertubuhan Kesihatan Sedunia (WHO)</b> dan Kumpulan Kerja <span class="adhd-word">ADHD</span> Dewasa, yang terdiri daripada:',
      who3: 'Soalan-soalan ini selaras dengan kriteria DSM-IV dan menyentuh bagaimana simptom <span class="adhd-word">ADHD</span> muncul pada orang dewasa.',
      who4: 'Pemarkahan yang digunakan ialah pemarkahan instrumen itu sendiri. Bahagian A ialah saringan enam soalan, dan sesuatu jawapan dikira apabila ia jatuh dalam julat berlorek soalan itu pada borang bercetak.',
      who5: 'Bahagian B tidak mempunyai skor langsung. Borang itu menyatakan dengan jelas bahawa &ldquo;tiada jumlah skor atau kebarangkalian diagnosis digunakan&rdquo; untuk dua belas soalan itu.',
      /* The result's own credit line. It stands in for who1/who2 and not2
         there, which now live on the intro only — the full attribution and
         the full storage notice are read before anybody answers, not after.
         The instrument's name is left in English on purpose: it is the
         title of the instrument, and who1 above already says the English
         text is the one that scores.

         `anda`, not `awak`, and that is not a slip. This table runs both:
         the result's own copy speaks in `awak` like the rest of the site,
         and the attribution and storage lines — who1, not2, the PDPA
         notice — keep `anda`. This line is the second kind. */
      rCredit: 'Diskor menggunakan Adult <span class="adhd-word">ADHD</span> Self-Report Scale (ASRS-v1.1), yang dibangunkan bersama <b>Pertubuhan Kesihatan Sedunia (WHO)</b>. Jawapan anda telah disimpan &mdash; <a href="/privacy" target="_blank" rel="noopener">notis privasi</a> menyatakan apa yang disimpan, dan untuk berapa lama.',

      notH: 'Apa yang ini bukan',
      not1: '<b>Ini alat saringan, bukan diagnosis.</b> Hanya pakar psikiatri atau ahli psikologi klinikal boleh mendiagnosis <span class="adhd-word">ADHD</span>. Skor yang tinggi ialah sebab untuk membuat temu janji itu, bukan jawapan; skor yang rendah tidak menolak apa-apa.',
      not2: 'Jawapan anda disimpan, dan inilah maksudnya.',
      nk1: '<b>Apa yang disimpan</b> &mdash; hanya jika anda log masuk di akhir dan bersetuju: jawapan anda, skor Bahagian A anda, dan butiran yang anda berikan &mdash; nama, umur, jantina, maklumat diagnosis, dan nombor telefon jika anda memberikannya. Sebelum itu, tiada apa-apa keluar dari pelayar ini.',
      nk2: '<b>Di mana</b> &mdash; di bawah akaun Google anda, dalam pangkalan data kami di Supabase.',
      nk3: '<b>Untuk apa</b> &mdash; tiga perkara sahaja:',
      nk3a: 'untuk menghubungi anda tentang sokongan ADHD jika anda memintanya;',
      nk3b: 'supaya anda boleh mencari dan memadam rekod anda sendiri;',
      nk3c: 'dan, setelah nama dan setiap butiran pengenalan lain dibuang, untuk mengira bagaimana rakyat Malaysia mendapat skor.',
      nk4: '<b>Berapa lama</b> &mdash; 24 bulan selepas semakan kendiri terakhir anda, kemudian ia dipadam secara automatik.',
      not3: '<a href="/privacy" target="_blank" rel="noopener">Notis privasi</a> menerangkannya sepenuhnya, dalam Bahasa Inggeris dan Bahasa Melayu.',
      stepsNav: 'Soalan',
      enShow: 'Tunjukkan teks asal dalam bahasa Inggeris',
      bKicker: 'Bahagian A, selesai.',
      bH: 'Itulah saringannya. Tarik nafas dahulu.',
      bP: 'Skor anda datang daripada enam soalan tadi. Dua belas soalan lagi memberi pakar klinikal konteks tambahan &mdash; ia tidak mengubah skor, dan mengambil masa kira-kira tiga minit.',
      bSee: 'Lihat keputusan saya',
      bMore: 'Jawab 12 lagi',
      rPrint: 'Cetak atau simpan sebagai PDF',
      rAnswers: 'Jawapan anda',
      rAnswersNote: 'Jawapan yang ditanda berada dalam julat berlorek soalan itu &mdash; yang akan ditanya dahulu oleh pakar klinikal.',
      back: '← Soalan sebelumnya',
      hint: 'Tekan 1–5 untuk menjawab',
      rKicker: 'Keputusan awak.',
      rOf: 'daripada 6 jawapan Bahagian A dalam julat signifikan',
      rB1: 'Awak juga jawab Bahagian B, di mana',
      rB2: 'daripada 12 jatuh dalam julat berlorek. Bahagian B tidak diberi skor dan tidak mengubah keputusan di atas — ia memberi pakar klinikal petunjuk tambahan untuk ditanya.',
      n1Dx: 'Bawa laporan ini ke temu janji anda yang seterusnya &mdash; ia menunjukkan keadaan anda sepanjang enam bulan yang lepas.',
      n1: 'Bawa keputusan ini kepada pakar psikiatri atau ahli psikologi klinikal — ia bagi mereka sesuatu yang kukuh untuk dimulakan.',
      n2: 'Tulis apa yang betul-betul tak kena dalam masa seminggu, dan bawa sekali.',
      n3: 'Apa pun angkanya, hari ini tetap kena dihabiskan. <a href="/tools">Tengok apa yang kami bina untuk tu</a>.',
      again: 'Cuba lagi',
      home: 'Kembali ke MyADHD',

      /* ---------- the gate, the form, the door that stays shut ---------- */
      /* Three quick things, before the questions */
      aKicker: 'Sebelum soalan.',
      aH: 'Tiga perkara ringkas.',
      aLede: 'Maklumat ini kekal dalam pelayar ini bersama jawapan anda. Tiada apa-apa dihantar melainkan anda log masuk di akhir dan bersetuju.',
      aDx: 'Adakah anda pernah didiagnosis dengan <span class="adhd-word">ADHD</span>?',
      dxNever: 'Tidak, saya belum pernah berjumpa sesiapa tentangnya',
      dxConsidering: 'Belum &mdash; saya sedang mempertimbangkan penilaian',
      dxDiagnosed: 'Ya, saya telah didiagnosis',
      dxTreatment: 'Ya, dan saya sedang menerima rawatan',
      dxNone: 'Tidak mahu nyatakan',
      aGo: 'Mulakan soalan',

      /* The unlock, after the questions */
      uKicker: 'Keputusan anda sudah sedia.',
      uH: 'Log masuk untuk mendapatkan laporan penuh anda.',
      u1t: 'Laporan penuh',
      u1d: 'Maksud skor anda, setiap jawapan ditanda seperti yang dibaca oleh pakar klinikal, dan Bahagian B jika anda menjawabnya.',
      u2t: 'Salinan untuk dibawa',
      u2d: 'Cetak, atau simpan sebagai PDF, untuk temu janji anda.',
      u3t: 'Disimpan dalam akaun anda, bukan dalam pelayar ini',
      u3d: 'Disimpan di bawah akaun Google anda. Minta kami memadamnya pada bila-bila masa.',
      u4t: 'Sokongan, hanya jika anda minta',
      u4d: 'Satu tanda pilihan dan kami akan menghubungi anda tentang sokongan ADHD. Tanpanya, kami tidak akan menghubungi anda.',
      gGo: 'Teruskan dengan Google',
      uFine: 'Google memberi kami nama dan e-mel anda &mdash; bukan kalendar, kenalan atau apa-apa yang lain. Kami tidak menjualnya, dan tiada surat berita. Skrin seterusnya ialah skrin Google sendiri; anda akan kembali terus ke laporan anda.',
      uLeave: 'Keluar tanpa menyimpan',

      dKicker: 'Langkah terakhir.',
      dH: 'Apa yang kami simpan, dan hak anda terhadapnya.',
      dLede: 'Laporan anda hanya satu tekanan lagi. Inilah yang disimpan bersamanya. Baca notis sebelum anda menanda apa-apa &mdash; ia pendek, dan itulah bahagian yang paling penting.',
      dName: 'Nama awak',
      dNamePh: 'Nak kami panggil awak apa?',
      dPhone: 'Nombor telefon <span class="f-opt" data-i18n="dPhoneOpt">pilihan</span>',
      dPhoneOpt: 'pilihan',
      dPhonePh: '012-345 6789',
      dAge: 'Umur anda',
      dAgePh: 'cth. 28',
      dGender: 'Jantina',
      gMale: 'Lelaki',
      gFemale: 'Perempuan',
      gNone: 'Tidak mahu nyatakan',
      dGo: 'Dapatkan laporan saya',

      /* The notice is shown in both languages at once and neither copy is
         behind the switch, so these two keys deliberately hold the same
         text as the markup rather than a translation of it: applyLang()
         still writes them, and writing the English copy in Malay would
         leave the reader without the English the Act also asks for. */
      cNoticeEn: null,
      cNoticeMs: null,

      cTerms: 'Saya telah membaca dan bersetuju dengan <a href="/terms" target="_blank" rel="noopener">Terma Penggunaan</a> dan <a href="/privacy" target="_blank" rel="noopener">Notis Privasi</a>.',
      cHealth: 'Saya memberi kebenaran nyata kepada MyADHD untuk memproses jawapan saya kepada soalan kesihatan ini dan maklumat diagnosis yang saya berikan &mdash; data peribadi sensitif di bawah PDPA &mdash; bagi tiga tujuan di atas.',
      cContact: 'Anda boleh menghubungi saya tentang sokongan, sumber dan acara ADHD. <span class="f-opt" data-i18n="cContactOpt">pilihan</span>',
      cContactOpt: 'pilihan',

      yKicker: 'Bukan yang ini.',
      yH: 'Yang ini untuk orang dewasa.',
      yLede: 'ASRS ialah skala laporan kendiri <strong>Dewasa</strong>. Ia ditulis untuk mereka yang berumur 18 tahun ke atas, dan pemarkahannya hanya pernah diuji pada mereka.',
      yLede2: 'Jadi angka daripadanya takkan bermakna untuk awak. Ini bukan penolakan &mdash; ini instrumen itu berlaku jujur tentang apa dirinya.',
      yHelp: 'Kalau tumpuan, keresahan atau nak mula sesuatu terasa berat sekarang, orang yang patut dirujuk ialah doktor atau kaunselor sekolah. Mereka boleh rujuk awak kepada pihak yang menilai golongan muda.',
      yHelp2: 'Kalau awak perlu bercakap dengan seseorang hari ini, <strong>Talian Kasih 15999</strong> menjawab 24 jam, percuma, dalam Bahasa Melayu dan Bahasa Inggeris (WhatsApp 019-261 5999).',
      yNothing: 'Takde apa yang awak taip dihantar ke mana-mana, dan takde apa yang disimpan.',
      yHome: 'Kembali ke MyADHD',

      eAge: 'Masukkan umur awak sebagai nombor — angka je.',
      eAgeHigh: 'Umur itu nampak tidak betul. Semak semula angkanya?',
      eName: 'Kami perlukan sesuatu untuk panggil awak — dua huruf atau lebih.',
      eGender: 'Pilih salah satu daripada tiga.',
      eDx: 'Pilih yang paling hampir dengan keadaan anda — atau pilih tidak mahu nyatakan.',
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
    /* The PDPA notice is the one thing the switch does not translate: both
       languages stay on the page, because the Act asks for both. All this
       moves is which of the two is expanded — see the comment over them in
       self-check.html. Opening the other by hand is allowed and is not
       undone until the switch is used again. */
    var nEn = $('#notice-en'), nMs = $('#notice-ms');
    if (nEn && nMs) { nEn.open = lang === 'en'; nMs.open = lang === 'ms'; }
    /* whichever screen is up is redrawn in place — the reader keeps
       their place in the questions */
    if (!screens.quiz.hasAttribute('hidden')) render();
    if (!screens.result.hasAttribute('hidden')) writeResult();
    if (!screens.gate.hasAttribute('hidden')) paintPreview();
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
    about:   $('[data-screen="about"]'),
    gate:    $('[data-screen="gate"]'),
    details: $('[data-screen="details"]'),
    young:   $('[data-screen="young"]'),
    quiz:    $('[data-screen="quiz"]'),
    breath:  $('[data-screen="breath"]'),
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
  /* Between a pick and the next question. The pick is drawn first and
     the question changes a beat later, so the reader sees what they
     chose — and while that beat runs, a second tap or a held-down key
     cannot quietly answer the next question for them. */
  var busy = false;
  var PICK_MS = 380;
  /* Whether the original English is showing under a Malay question.
     Kept across questions: somebody who needed it for one will want it
     for the next. */
  var showEn = false;
  if (lang !== 'en') applyLang();

  function show(name) {
    Object.keys(screens).forEach(function (k) {
      screens[k].toggleAttribute('hidden', k !== name);
    });
    /* On the body as well, so the stylesheet can change the furniture
       around a screen — the bar, the count in the head — without
       reaching for :has(). */
    document.body.setAttribute('data-view', name);
    window.scrollTo(0, 0);
    /* Move focus to the top of whatever just appeared, or a keyboard and a
       screen reader are both left standing where the old screen was. */
    var h = screens[name].querySelector('h1, h2, .q-text');
    if (h) { h.setAttribute('tabindex', '-1'); h.focus({ preventScroll: true }); }
  }

  /* ---------- the question ---------- */
  function answered(k) { return state.answers[k] !== undefined; }
  /* The first question with no answer — the furthest the navigator will
     let anybody go. */
  function reach() {
    for (var k = 0; k < state.list.length; k++) if (!answered(k)) return k;
    return state.list.length;
  }

  function paintProgress() {
    var done = 0;
    for (var k = 0; k < state.list.length; k++) if (answered(k)) done++;
    $('.bar-fill').style.width = (done / state.list.length * 100) + '%';
  }

  function paintSteps() {
    var nav = $('.q-steps');
    var far = reach();
    nav.textContent = '';
    state.list.forEach(function (_, k) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'q-step' +
        (k >= PART_A.length ? ' q-step--b' : '') +
        (answered(k) ? ' is-done' : '') +
        (k === state.i ? ' is-here' : '');
      b.setAttribute('aria-label', T().goTo(k + 1));
      if (k === state.i) b.setAttribute('aria-current', 'step');
      if (k > far) b.disabled = true;
      b.addEventListener('click', function () {
        if (busy || k === state.i) return;
        state.i = k; render(); focusQ();
      });
      nav.appendChild(b);
    });
  }

  function paintEn() {
    var open = lang === 'ms' && showEn;
    $('.q-en').hidden = lang !== 'ms';
    $('.q-en').setAttribute('aria-expanded', open ? 'true' : 'false');
    $('.q-en-text').hidden = !open;
  }

  function focusQ() {
    window.scrollTo(0, 0);
    var h = $('.q-text');
    h.setAttribute('tabindex', '-1');
    h.focus({ preventScroll: true });
  }

  function render() {
    var item = state.list[state.i];
    var n = state.i + 1;
    var inA = state.i < PART_A.length;

    $('.t-count').textContent = n + ' / ' + state.list.length;
    $('.q-meta').textContent = (inA ? T().partA : T().partB) + ' · ' +
      T().qCount(inA ? n : n - PART_A.length, inA ? PART_A.length : PART_B.length);
    $('.q-text').textContent = q(state.i);
    $('.q-en-text').textContent = item.q;
    paintEn();

    var box = $('.q-options');
    box.innerHTML = '';
    scale().forEach(function (label, v) {
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'ans';
      b.setAttribute('aria-pressed', state.answers[state.i] === v ? 'true' : 'false');
      var num = document.createElement('span');
      num.className = 'ans-n';
      num.setAttribute('aria-hidden', 'true');
      num.textContent = v + 1;
      var txt = document.createElement('span');
      txt.className = 'ans-l';
      txt.textContent = label;
      b.appendChild(num); b.appendChild(txt);
      b.addEventListener('click', function () { answer(v); });
      box.appendChild(b);
    });

    $('.q-back').disabled = state.i === 0;
    paintProgress();
    paintSteps();

    /* The question arrives rather than appears: the same short rise every
       time, restarted by taking the class off and forcing a layout. The
       reduced-motion rule at the foot of test.css flattens it. */
    screens.quiz.classList.remove('is-in');
    void screens.quiz.offsetWidth;
    screens.quiz.classList.add('is-in');
  }

  function answer(v) {
    if (busy) return;
    state.answers[state.i] = v;
    $$('.q-options .ans').forEach(function (b, k) {
      b.setAttribute('aria-pressed', k === v ? 'true' : 'false');
    });
    paintProgress();
    paintSteps();
    busy = true;
    setTimeout(function () { busy = false; advance(); }, PICK_MS);
  }

  /* On to the next question; after the sixth, to the breather unless
     Part B has already been taken on; after the last, the result. */
  function advance() {
    if (screens.quiz.hasAttribute('hidden')) return;
    if (state.i + 1 < state.list.length) { state.i++; render(); focusQ(); return; }
    if (!state.withB) { show('breath'); return; }
    finish();
  }

  function back() {
    if (busy || state.i === 0) return;
    state.i--; render(); focusQ();
  }
  $('.q-back').addEventListener('click', back);

  $('.q-en').addEventListener('click', function () { showEn = !showEn; paintEn(); });

  /* Number keys 1-5 pick an answer. The mouse is the slow way through
     eighteen questions and this instrument is meant to take five minutes. */
  document.addEventListener('keydown', function (e) {
    if (screens.quiz.hasAttribute('hidden')) return;
    if (e.metaKey || e.ctrlKey || e.altKey) return;
    var n = parseInt(e.key, 10);
    if (n >= 1 && n <= 5) { e.preventDefault(); answer(n - 1); }
    if (e.key === 'Backspace') { e.preventDefault(); back(); }
    if (e.key === 'Escape' && showEn) { showEn = false; paintEn(); }
  });

  /* ---------- the breather ----------
     The score is settled by question six. Going on is offered here,
     where it means something, and not before. */
  $('.b-see').addEventListener('click', function () { finish(); });
  $('.b-more').addEventListener('click', function () {
    state.withB = true;
    state.list = PART_A.concat(PART_B);
    state.i = PART_A.length;
    render(); show('quiz');
  });
  $('.b-back').addEventListener('click', function () {
    state.i = PART_A.length - 1;
    render(); show('quiz');
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

  /* One pip per question, the first `filled` of them lit. Rebuilt from
     scratch each time rather than toggled, because the result screen is
     also reached by Take it again and a stale pip is a wrong answer. */
  function paintMeter(el, filled) {
    if (!el) return;
    var total = Number(el.getAttribute('data-total')) || 0;
    el.textContent = '';
    for (var i = 0; i < total; i++) {
      var pip = document.createElement('span');
      pip.className = 'pip' + (i < filled ? ' is-on' : '');
      el.appendChild(pip);
    }
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

    /* The pips say the same thing as the number beside them. Drawn rather
       than written because a row of six you can take in at a glance is the
       difference between reading a result and seeing one — and because the
       person reading it has just answered eighteen questions. */
    paintMeter($('.r-meter'), a);

    var bWrap = $('.r-partb');
    if (state.withB) {
      bWrap.hidden = false;
      var b = scoreB();
      $('.r-bscore').textContent = b;
      paintMeter($('.r-meter--b'), b);
    } else {
      bWrap.hidden = true;
    }

    /* Somebody already diagnosed is not sent to get diagnosed: the first
       next step becomes the appointment they already have. */
    var dx = state.about && (state.about.diagnosis === 'diagnosed' || state.about.diagnosis === 'treatment');
    $('[data-i18n="n1"]').hidden = !!dx;
    $('[data-i18n="n1Dx"]').hidden = !dx;

    $('.r-date').textContent = (state.doneAt || new Date())
      .toLocaleDateString(lang === 'ms' ? 'ms-MY' : 'en-GB', { day: 'numeric', month: 'long', year: 'numeric' });

    /* Every answer, as it was given, in the language on screen. Built
       with textContent: these strings are ours, but this list is the one
       a reader will print and hand over, and there is no reason for it to
       be the place that learns to trust innerHTML. */
    var list = $('.r-list');
    list.textContent = '';
    state.list.forEach(function (item, k) {
      if (!answered(k)) return;
      var v = state.answers[k];
      var inA = k < PART_A.length;
      var li = document.createElement('li');
      var num = document.createElement('span');
      num.className = 'r-q-n';
      num.textContent = (inA ? 'A' : 'B') + (inA ? k + 1 : k + 1 - PART_A.length);
      var txt = document.createElement('span');
      txt.className = 'r-q';
      txt.textContent = q(k);
      var chip = document.createElement('span');
      chip.className = 'r-a' + (v >= item.band ? ' is-band' : '');
      chip.textContent = scale()[v];
      if (v >= item.band) {
        var sr = document.createElement('span');
        sr.className = 'sr-only';
        sr.textContent = ', ' + T().inBand;
        chip.appendChild(sr);
      }
      li.appendChild(num); li.appendChild(txt); li.appendChild(chip);
      list.appendChild(li);
    });
  }

  /* ---------- the end of the questions ----------
     Three ways out, and which one depends on who is reading:

       - no Supabase (local dev): the full result, as it always was;
       - signed in, with details already given this visit (a retake):
         the full result, saved;
       - everybody else: the unlock screen — the score and the verdict,
         free, and the sign-in offered for the full report. */
  function finish() {
    state.doneAt = new Date();
    $('.bar-fill').style.width = '100%';
    if (!GATE_ON) { showReport(); return; }
    if (window.auth.signedIn() && state.details) { report(); return; }
    paintPreview();
    show('gate');
  }

  /* The result, on screen. Kept apart from report() so that the dev path
     can show it without trying to save anything. */
  function showReport() {
    writeResult();
    show('result');
  }

  /* The full report, and then the save. The report is on the screen
     before this opens a socket, and that ordering is the whole guarantee.
     Somebody who has just answered eighteen questions about their own
     attention is not made to watch a spinner to find out their score, and
     a network they do not control cannot take it away from them. Never
     awaited, never retried; its only visible effect is one line
     underneath. */
  function report() {
    showReport();
    drop(PENDING_KEY);
    submit();
  }

  /* ============ the sign-in, at the end ============
     The page used to ask for Google before question one. It asks now
     after the last one, on a screen that has already given the reader
     their score and verdict, and offers the sign-in for what it adds: the
     full report, a copy to keep, a record in their own account.

     GATE_ON is false when auth.js has nothing to talk to — no Supabase
     project configured. The screener then runs with no sign-in, no form,
     and nothing sent. That is a development convenience and a divergence
     from what the page's own copy promises, so it must never be true in
     production; config.js is the thing that decides, and it is deployed. */
  var GATE_ON = !!(window.auth && window.auth.configured());

  /* The answers, across a full-page redirect to Google and back.

     sessionStorage, not localStorage: it survives the navigation, it is
     scoped to this tab, and it goes when the tab closes, so nothing is
     left on a shared machine. Written only when the reader presses
     Continue with Google, and removed the moment the report is on screen,
     when they leave without saving, or when they start again. Read back
     only within the hour — an answer sheet from yesterday is not the
     reader coming back from Google, it is a stale tab.

     This is the one place the answers are ever written down in the
     browser, and it is before consent, which is why it is here and not
     on the server: holding something for the person who typed it, on
     their own device, for the length of a redirect, is not us processing
     it. Nothing in it is sent until the notice has been ticked. */
  var PENDING_KEY = 'myadhd.selfcheck.pending';
  var PENDING_TTL = 60 * 60 * 1000;

  function keep(k, v) { try { sessionStorage.setItem(k, JSON.stringify(v)); } catch (_) {} }
  function drop(k) { try { sessionStorage.removeItem(k); } catch (_) {} }
  function peek(k) {
    try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (_) { return null; }
  }

  function stashPending() {
    keep(PENDING_KEY, {
      v: 1,
      at: Date.now(),
      withB: state.withB,
      answers: state.answers.slice(0, state.list.length),
      about: state.about,
      doneAt: state.doneAt ? state.doneAt.getTime() : Date.now()
    });
  }

  /* Back from Google with an answer sheet. Every field is checked rather
     than trusted: this is the browser's own storage, but it is still
     input, and a half-written or hand-edited sheet should fall back to
     the intro rather than score something nobody answered. */
  function restorePending() {
    var p = peek(PENDING_KEY);
    var want = p && (p.withB ? PART_A.length + PART_B.length : PART_A.length);
    var ok = p && p.v === 1 && typeof p.at === 'number' &&
      Date.now() - p.at < PENDING_TTL &&
      Array.isArray(p.answers) && p.answers.length === want &&
      p.answers.every(function (n) { return n === 0 || n === 1 || n === 2 || n === 3 || n === 4; }) &&
      p.about && typeof p.about.age === 'number' && p.about.age >= 18 &&
      typeof p.about.gender === 'string' && typeof p.about.diagnosis === 'string';
    if (!ok) { drop(PENDING_KEY); return false; }
    state.withB = !!p.withB;
    state.list = state.withB ? PART_A.concat(PART_B) : PART_A.slice();
    state.answers = p.answers.slice();
    state.i = state.list.length - 1;
    state.about = p.about;
    state.doneAt = new Date(p.doneAt);
    return true;
  }

  /* Always Part A to begin with; Part B is offered on the breather. */
  function setIntent() {
    state.withB = false;
    state.list = PART_A.slice();
    state.answers = [];
    state.i = 0;
    state.doneAt = null;
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

     It no longer signs anybody out. The age is asked before the questions
     now, which is before the sign-in, so nobody reaching this has signed
     in for the screener — and signing out somebody who uses the app,
     because they typed an age into a different page, would be a
     punishment for honesty. */
  function tooYoung() {
    state.about = null;
    state.details = null;
    drop(PENDING_KEY);
    clearErrors();
    var a = $('.d-age'); if (a) a.value = '';
    $$('[data-screen="about"] input[type="radio"]').forEach(function (r) { r.checked = false; });
    show('young');
  }

  /* ---------- pressing start ----------
     Straight to the three quick things, and from them to the questions.
     Nothing on the way asks who you are: that is asked at the end, of
     somebody who has seen their score and wants the rest. */
  function start() {
    setIntent();
    clearErrors();
    show('about');
  }
  $('.start-a').addEventListener('click', start);

  /* ---------- the three quick things ----------
     Age first, though gender is no harder to answer: this is the first
     chance to find out somebody is 15, and making them fix a blank radio
     before telling them would be the page wasting their time. */
  function readAbout() {
    clearErrors();
    var ageEl = $('.d-age');
    var age = readAge(ageEl);
    if (age === null) { markBad(ageEl); setErr('.d-age-err', T().eAge); return null; }
    if (age > 100)    { markBad(ageEl); setErr('.d-age-err', T().eAgeHigh); return null; }
    if (age < 18)     { tooYoung(); return null; }

    var g = $('input[name="gender"]:checked');
    if (!g) { setErr('.d-gender-err', T().eGender); return null; }

    var dx = $('input[name="diagnosis"]:checked');
    if (!dx) { setErr('.a-dx-err', T().eDx); return null; }

    return { age: age, gender: g.value, diagnosis: dx.value };
  }

  $('.a-go').addEventListener('click', function () {
    var a = readAbout();
    if (!a) return;
    state.about = a;
    begin();
  });

  /* A retake. Somebody who has already signed in and given their details
     this visit is not asked again — at the end, finish() sees them and
     goes straight to the report. Starts from Part A; the breather offers
     Part B again. */
  $('.r-again').addEventListener('click', function () {
    setIntent();
    drop(PENDING_KEY);
    $('.r-saved').hidden = true;
    render(); show('quiz');
  });

  $('.r-print').addEventListener('click', function () { window.print(); });

  /* ---------- the unlock screen ----------
     The score and the verdict, on the screen that offers the sign-in.
     Repainted on a language switch, like the result. */
  function paintPreview() {
    var a = scoreA();
    $('.u-score').textContent = a;
    paintMeter($('.u-meter'), a);
    $('.u-verdict').textContent = a >= 4 ? T().verdictYes : T().verdictNo;
  }

  $('.g-go').addEventListener('click', function () {
    clearErrors();
    stashPending();
    /* Identity only. See the note on signIn() in auth.js: the calendar
       scope belongs to the app, not to a screener. */
    window.auth.signIn({ scopes: '', offline: false });
  });

  /* Leaving without saving is a real choice and gets a real link. It
     drops the answer sheet on the way, so the browser keeps nothing. */
  $('.g-leave').addEventListener('click', function () { drop(PENDING_KEY); });

  /* ---------- the details screen ---------- */
  function readDetails() {
    clearErrors();

    var nameEl = $('.d-name');
    var name = String(nameEl.value || '').trim();
    if (name.length < 2 || name.length > 80) {
      markBad(nameEl); setErr('.d-name-err', T().eName); return null;
    }

    var terms = $('.c-terms').checked;
    var health = $('.c-health').checked;
    if (!terms || !health) { setErr('.c-err', T().eConsent); return null; }

    return {
      name: name,
      phone: String($('.d-phone').value || '').trim(),
      contact: $('.c-contact').checked
    };
  }

  $('.d-go').addEventListener('click', function () {
    var d = readDetails();
    if (!d) return;
    state.details = d;
    report();
  });

  /* ---------- coming back ----------
     Called once the reader is known to be signed in and their answers
     are back in state. Asks the server whether it already holds a
     consent against the current notice; if it does, straight to the
     report, and if it does not, the form.

     A failed request falls through to the form. Failing toward asking
     again is always safe; failing toward skipping consent is not, and
     that asymmetry is the reason there is no retry here. */
  function resume() {
    clearErrors();
    return window.auth.token()
      .then(function (token) {
        if (!token) return 'gate';
        return fetch('/api/self-check', {
          headers: { Authorization: 'Bearer ' + token }
        }).then(function (res) {
          if (res.status === 401) return 'gate';
          return res.ok ? res.json() : null;
        });
      })
      .then(function (me) {
        if (me === 'gate') { paintPreview(); show('gate'); return; }
        var p = me && me.profile;
        var user = window.auth.user();
        var name = (p && p.name) || (user && user.name) || '';
        /* Consent on file under this notice: no form. reuse tells the
           server to save against that consent rather than mint a new
           one, and the server checks it again rather than believe us. A
           profile with no usable name still gets the form — the server
           needs one, and asking is better than failing the save. */
        if (me && me.needsConsent === false && name.trim().length >= 2) {
          state.details = { name: name.trim(), phone: (p && p.phone) || '', reuse: true };
          report();
          return;
        }
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
    /* The consent boxes are never prefilled, even for somebody we have a
       consent on file for. If they are being shown this screen at all it
       is because the notice they agreed to is not the notice in front of
       them now, and a pre-ticked box is not agreement to anything. */
  }

  /* ---------- sending it ----------
     Fire and forget, after the report is already up. */
  function submit() {
    if (!GATE_ON || !window.auth.signedIn() || !state.details || !state.about) return;

    var d = state.details;
    var a = state.about;
    var body = {
      name: d.name,
      phone: d.phone,
      age: a.age,
      gender: a.gender,
      diagnosis: a.diagnosis,
      part: state.withB ? 'ab' : 'a',
      answers: state.answers.slice(0, state.list.length),
      lang: lang,
      consent: d.reuse
        ? { reuse: true, version: CONSENT_VERSION }
        : { terms: true, health: true, contact: !!d.contact, version: CONSENT_VERSION }
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
      .then(function (res) {
        said(!!(res && res.ok));
        /* Fresh ticks are on file now. A retake this visit saves against
           them rather than recording a second agreement nobody gave. */
        if (res && res.ok && !d.reuse) d.reuse = true;
      })
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
     changes you are asked again" true rather than aspirational.
     2026-10: the notice now names the diagnosis question, and says the
     answers wait in the browser until this point. */
  var CONSENT_VERSION = 'pdpa-2026-10';

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
        /* No answer sheet means an ordinary visit. Leave the intro alone. */
        if (!restorePending()) return;
        /* A sheet but no session: they went to Google and came back
           without signing in. Their score is theirs either way, so they
           land on it again, with the offer still there. */
        if (!window.auth.signedIn()) { paintPreview(); show('gate'); return; }
        return resume();
      });
  })();

  /* ---------- what leaves this page, and when ----------
     Nothing, until the end, and then only on purpose.

     The three quick things and the answers live in this closure while the
     questions are up. If the reader presses Continue with Google, they are
     written to sessionStorage for the length of the redirect (see
     PENDING_KEY) and removed the moment the report is on screen, or when
     they leave without saving, or start again; a sheet older than an hour
     is ignored and removed. That copy is on their device, in this tab,
     and never sent by itself.

     One request leaves, from report(), after the report is already on
     screen: the answers, the three quick things, and the name and phone
     from the form. It goes only when somebody has signed in and either
     ticked the two mandatory boxes just now, or ticked them before under
     this same notice — which the server checks for itself. It is never
     retried: a result belongs to the person who earned it whether or not
     our database was reachable at that moment.

     What does not leave: anything typed by somebody who turns out to be
     under 18 — the age is asked before the questions, and that branch
     touches no network at all — and anything at all from somebody who
     closes the tab, leaves without saving, or never signs in. There is no
     analytics call here, and no third-party script on this page — the
     sign-in works by navigating away to Google and coming back, which is
     a different thing from embedding them.

     Storage, in full: myadhd.lang in localStorage, and the answer sheet in
     sessionStorage while a sign-in is under way. The page says all of this
     before it asks, in both languages, which is the only honest way to run
     a mental-health screener on somebody else's device. */
})();
