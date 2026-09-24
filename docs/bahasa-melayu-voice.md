# The Malay voice

> **Superseded on register, 2026-09-18.** The main reference for every
> Malay string is now **`bahasa-melayu-reference.md`** — the PMX / MADANI
> baku register: `anda` and a sapaan, not `awak`; `tidak`, not `tak`; no
> shortenings, no pasar. What survives from this file is the mechanics:
> the `site.ms.js` keys, the ASRS and consent copy being off limits, and
> the ban on clinical claims. Read the new file first; treat the register
> advice below as history.

Every Malay string on this site is in `site.ms.js`, keyed by a hash of the
English it replaces. That arrangement makes one mistake very easy: open the
English, translate the sentence, paste it in. Do that across a hundred and
fifty strings and you get what this site had until 2026-09-13 — Malay that
is correct, formal, and unmistakably a translation. A reader who thinks in
Malay can tell in one paragraph, and what they conclude is that the Malay
is the afterthought.

**So the Malay is not a translation. It is the same thing said again, by
someone who speaks Malay.** Same facts, same promises, same order of ideas
— its own sentences. English and Malay will not line up clause for clause,
and they are not supposed to.

The rules below come from the user's own style guide, `Gaya-Bahasa-Melayu-2026.md`
on the Desktop, narrowed to this site. Where the two disagree, this file
wins for anything inside this repo — that guide is written for marketing,
and this is a health-adjacent site with a screener on it.

---

## The register: `awak`

**`awak`, everywhere the English says "you".** Decided 2026-09-13 by the user,
over `anda` and over `kau`.

- `anda` is what the site used to say. It is the pronoun of a bank letter
  and a government form, and the whole point of the About page is that this
  is not one of those.
- `kau` is closer, and it is what the style guide would pick for a young
  consumer brand. It is too close here. A stranger's first sentence on a
  mental-health site should not be one they would only use with a friend,
  and a chunk of the audience is 35+.
- `awak` sits between them: warm, direct, still polite to someone you have
  not met.

Two exceptions, and they are not really exceptions:

- **Quotes stay in `saya`.** Someone describing their own life says "saya".
  The testimonials are three real people, and their sentences belong to them.
- **The app's own buttons speak as the user.** "Kosongkan kepala saya" —
  the reader is pressing it, so it says what *they* want, not what we want
  for them.

## The nine rules

1. **Write it, don't translate it.** Read the English, look away, say the
   same thing in Malay. If your sentence keeps the English clause order,
   you translated it.

2. **Cut the DBP register.** These are the words that gave the old file
   away, with what to say instead:

   | Out | In |
   |---|---|
   | sewajarnya | yang betul, yang sepatutnya |
   | merangkumi | ada, termasuk |
   | mengharungi | lalui, habiskan |
   | bertindak balas kepada | makan, jalan, berkesan pada |
   | memadai | cukup |
   | julat | julat is fine in the screener result; elsewhere: tahap, kelas |
   | sesuatu perkara | sesuatu, benda |
   | sekadar | cuma, setakat |
   | perlu disediakan | perlu di-set |
   | memindahkan | angkat, pindah |
   | tidak / tiada (in body copy) | tak / takde |

3. **`tak` and `takde` in body copy, `tidak` in the legal and the
   disclaimer.** Privacy, Terms, the medical disclaimer and the screener's
   consent text stay formal — a promise is read closely, and there `tidak`
   reads as precision rather than distance.

4. **Verbs over nouns.** `memindahkan usaha` → `angkat beban`.
   `memberikan penyelesaian` → `selesaikan`. Useful verbs here: angkat,
   buang, luah, susun, pecah, tunjuk, ketuk, lesap, jaga.

5. **One short sentence per block.** Three to six words, placed after a long
   one. "Itu bukan kelemahan peribadi." "Mula dengan satu." "Sibuk sepanjang
   hari. Takde apa yang siap."

6. **Contrast carries the idea.** `Bukan X, tapi Y` is how this brand argues,
   in both languages: "Bukan awak tak peduli. Awak peduli semua benda
   serentak." "Bukan malas, cuma buta jam."

7. **No clinical claims, in either language.** This is written down in the
   README for the English and it binds the Malay identically: no causes, no
   diagnosis, no treatment, no cure. `baiki` is allowed only where the English
   says the tool does *not* fix anything. Never write that my.adhd `merawat`,
   `menyembuhkan`, or `membaiki` ADHD.

8. **Keep the loanwords people actually use.** ADHD, body doubling, KPI,
   log masuk Google, Google Calendar, laptop, app/aplikasi. The guide's 70/20/10
   rojak ratio is for captions; on the site English earns its place only where
   the Malay word would be a lie or a puzzle. `Tabiat`, not `habits`.

9. **The Malay the user already wrote is final.** "Malas. Tak fokus. Tak
   matang. Tak reti jaga barang." is his sentence, on the About page, in both
   languages. It is not restyled, not glossed, not italicised.

## Off limits

- **The eighteen ASRS questions in `test.js`.** A screening instrument's
  validity is a property of its exact wording. The Malay there is a careful
  rendering of a validated English instrument, and it does not get a voice
  pass. `test.js` says this at the top; read it before touching that file.
- **Scores, bands, ages, and the consent copy.** Same reason, plus the legal
  one.
- **`site.ms.js` keys.** They are hashes of the English. Changing English
  markup changes the key and silently drops the string back to English; the
  value is yours to rewrite, the key is not.

## Before and after

Pulled from the 2026-09-13 pass, so you can hear the distance:

> **Was** Ia sekadar memindahkan usaha itu keluar dari kepala anda ke sesuatu yang tidak akan lupa.
> **Now** Ia cuma angkat beban tu keluar dari kepala awak, letak kat benda yang tak lupa.

> **Was** Anda sudah pun cuba lebih keras. Ia tidak berhasil — bukan kerana anda lemah, tetapi kerana "fokus sajalah" bukan strategi untuk otak yang tidak bertindak balas kepadanya.
> **Now** Awak dah pun cuba lebih keras. Tak jadi — bukan sebab awak lemah, tapi sebab "fokus je lah" bukan strategi untuk otak yang memang tak makan ayat tu.

> **Was** Perkara yang anda elakkan selama seminggu mengambil masa empat minit.
> **Now** Benda yang awak elak seminggu tu, empat minit je siap.

> **Was** Tiada sistem tiket di sebalik semua ini. E-mel sampai kepada seorang manusia.
> **Now** Takde sistem tiket di sebalik ni. E-mel sampai kepada manusia.

## The carousel is louder than the site

`docs/carousel/posts/*-ms.json` is marketing, and it is read on a phone
while someone scrolls. It gets the social end of the guide:

- The cover's `kicker` and the outro's ask can be flat-out pasar: "Kalau
  faham, faham." "Yang mana awak?"
- `awak` still, not `anda` — the carousel and the site are one voice.
- Body copy is three lines at most and reads as speech. No line survives
  that could open a press release.
- Slide titles are typed sentence case; the CSS uppercases the kicker and
  the footer, so never type caps for emphasis.
- The CTA points at the app doing one thing: luah semua, dapat balik satu
  benda untuk mula.

## Checklist before a Malay string ships

- [ ] Read it aloud. Human, or form?
- [ ] `awak`, not `anda`? (Quote → `saya`. Button the user presses → `saya`.)
- [ ] Any word from the "Out" column left?
- [ ] At least one short sentence in the block?
- [ ] Does it claim anything clinical that the English does not?
- [ ] Did the key change? (It must not.)
- [ ] `node --check site.ms.js` clean, and `{icon}`, `<span class="adhd-word">`
      and every `<a href>` still present in the strings that had them?
