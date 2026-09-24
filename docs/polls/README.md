# Community polls

Polls posted to the my.adhd community group on WhatsApp, for survey purposes.
One file drives the copy (this one), one file keeps the results (`log.md`),
and the `community-poll` skill in `~/.claude/skills` turns a topic and a
format into a poll that fits both.

Nothing here is part of the web app. It is community collateral that lives
in the repo so the group's facts and the poll rules sit beside the other
brand sources. A poll is never a screener: nothing in this folder touches the
self-check, and no poll may read like one.

## The group

Fill these in. Until they are, the skill asks for whichever one a poll needs.

| | |
|---|---|
| Platform | WhatsApp group, native polls |
| Group name | `[[GROUP NAME]]` |
| Invite link | `[[INVITE LINK]]` |
| Admins | `[[WHO POSTS]]` |
| Members, roughly | `[[N]]` |
| What the group is for | `[[ONE LINE]]` |
| How often polls go out | `[[E.G. ONE A WEEK, NEVER TWO IN A DAY]]` |

The invite link is never pasted into public copy (a carousel, a Threads
reply, a page) unless the user says so for that piece. The tagline for the
invitation itself is in `../taglines.md`; a poll never carries a tagline.

## Two kinds of poll

**Research.** The answer will inform one decision, and that decision is
written down before the poll goes out: "if most people pick evening, the
reminder defaults to 9 pm". Options cover the realistic range evenly, in a
neutral order, and the result is logged as a finding.

**Engagement.** Low stakes, relatable, often self-recognition: "which of
these is you tonight". Options can be funny as long as every one is
something a person could honestly pick. The result is logged too, but as a
mood reading, not a finding.

Say which kind a poll is before drafting it. The kind decides the option
style, whether a closing line is needed, and how the row in `log.md` reads.

## WhatsApp limits, as rules

- The question is at most 255 characters. Aim for under 120.
- Between 2 and 12 options. Aim for 4 to 6; twelve is a wall.
- Each option fits one line on a phone: around 30 characters, and never a
  sentence with a full stop.
- Single-select by default. Multi-select only when the question itself says
  "all that apply" (or "semua yang berkaitan"), so nobody is surprised.
- Votes are visible to every member with a name attached. Do not ask
  anything whose honest answer would embarrass someone in front of the group:
  no medication, no diagnosis status, no money, no family.
- A poll cannot be edited once posted. The copy is final when it leaves this
  file, so it goes through the checklist first.
- One poll per message. A lead-in line goes in the poll's own question field
  or as a separate text message sent first, never as a second poll.

## Voice

The language is decided per poll. The user says which; if they do not, ask.

**English.** Plain second person, the same voice as the `en` carousels in
`../carousel/posts/`. Short. "You" is the reader, "we" is my.adhd. No
exclamation marks in the question.

**Malay.** Written in Malay, not translated into it. The group is a
conversation, not a page, so the register is the conversational `awak`:

- The reader is `awak`, my.adhd is `kami`. Never `kau`, never `aku`.
- `tidak` and `tiada`, not `tak` and `takde`. Full spellings, no
  `yg / dgn / utk / x`. No pasar, no rojak beyond `ADHD`, `app`,
  `body doubling`.
- Sentences under 25 words. Options are fragments, not sentences.

This is a deliberate exception to the `anda` rule in
`../bahasa-melayu-reference.md`, decided on 2026-09-20. Everything else in
that reference still applies here: the mechanics in its Section 2, the
clinical-claims ban in Section 8, the checklist in Section 9. A poll does not
open with a sapaan and does not close with Insya-Allah; those belong to a
piece of writing, and a poll is a question.

**Both languages.** Emoji: none, or one in the lead-in and none in the
options. No em dashes. The brand is `my.adhd` in prose. No hashtags.

## Off limits

- **No clinical claims, in either language.** No causes, no diagnosis, no
  treatment, no cure. A poll may ask what someone does or feels; it may not
  ask them to rate a symptom or tell them what a result means.
- **Nothing that reads as a screening question.** The eighteen ASRS items in
  `../../test.js` are not reused, paraphrased, shortened or turned into
  options. "How often do you have trouble wrapping up the final details"
  is a screener, not a poll, wherever it appears.
- **No leading options** and no trap options. Every option is one a member
  could honestly pick, the range is even, and the order does not put the
  answer we hope for first. A neutral "something else" is fine where the
  list cannot be complete; "none of the above" as a dead end is not.
- **Nothing identifying.** No medication names, doctors, clinics,
  workplaces, ages, locations.
- **No advice in a poll.** The closing line says what the answer will
  change, not what the reader should do.

## Anatomy of a post

1. **Lead-in** (optional, one line): why we are asking, or a hook. Sent as
   its own text message before the poll, or folded into the question when
   it is short enough.
2. **Question**: one sentence, ends with a question mark.
3. **Options**: 2 to 12 fragments, one line each.
4. **Closing line** (research only, optional): what the answer will change.
   Sent as a text message after the poll, or skipped.

### Research, Malay

```
Lead-in:  Kami sedang tetapkan waktu peringatan lalai dalam app.
Question: Bila awak paling kerap buat brain dump?
Options:
  1. Pagi, sebelum mula kerja
  2. Tengah hari
  3. Petang, lepas kerja
  4. Malam, sebelum tidur
  5. Tidak tentu, bila teringat
Closing:  Pilihan paling ramai jadi waktu lalai. Awak boleh tukar bila-bila.
Select:   single
```

### Engagement, English

```
Question: It is 1 a.m. Which one is you tonight?
Options:
  1. Not tired, just wired
  2. Tired but scrolling
  3. Asleep on the sofa, not the bed
  4. Doing the thing I avoided all day
  5. Actually in bed, somehow
Select:   single
```

### Research, English, multi-select

```
Lead-in:  Picking what the next feature should be.
Question: Which of these gets in the way most? Pick all that apply.
Options:
  1. Starting the first task
  2. Remembering what I wrote down
  3. Too many tasks on the list
  4. Losing the thread mid-task
  5. Something else, tell us below
Closing:  The top two go on the roadmap first.
Select:   multi
```

## Log

`log.md` is one row per poll, appended when the poll is approved, with the
vote counts blank. Once the poll has run, the user writes the counts in and
one line of takeaway. This is what makes the polls a survey rather than a
series of posts: a research poll with no counts logged has not finished.

Columns: date posted, kind, language, question, options with counts once
known (`Pagi 4 · Malam 11 · …`), and the takeaway or the decision it fed.

## Checklist before it goes out

- [ ] The kind is named (research or engagement), and for research, the
      decision it informs is written in the log row.
- [ ] Question is one sentence under 255 characters, ends with `?`.
- [ ] 2 to 12 options, each one line, none a full sentence.
- [ ] Single-select unless the question says "all that apply".
- [ ] Options are honest to pick, evenly spread, neutrally ordered.
- [ ] Nothing a member would mind answering with their name showing.
- [ ] No clinical claim, no screening item, no advice.
- [ ] English: plain second person. Malay: `awak` and `kami`, `tidak`,
      full spellings, no `kau`.
- [ ] Emoji zero or one, no em dashes, no hashtags, no tagline.
- [ ] The row is in `log.md` with counts blank.
