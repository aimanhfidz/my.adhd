# Visual first

Every page on this site was written before it was drawn, and most of them were
never drawn at all. On 2026-09-16 the ten public pages held **5,082 words in 239
paragraphs, zero `<img>` elements, and ten content visuals** — seven of those on
`tools.html` alone and three of them social-link glyphs on `contact.html`. Six
pages had nothing to look at but the wave field behind the type. The page every
call to action on the site points at, `/self-check`, opened with a **212-word
paragraph** and carried no illustration at all.

That is a hard page for anyone. It is a much harder page for the people this
site is for. Reading comprehension in ADHD is bound by working memory: a long
paragraph is not just longer to read, it is more expensive to hold, and the cost
lands hardest on exactly the reader who came here because holding things is the
problem.

**So a point gets a picture or it gets a short sentence. It does not get a
paragraph.**

The app already knows this. `screen-loading` says its whole piece in two words
and a looping video. Chips carry four facts about a task with no sentence at all.
The matrix says important-and-urgent with grid position and spends no colour on
it. And `test.css` already has the line this file exists to generalise, written
above the pip meter: *"the same fact as the number beside them, in a form you can
read without reading."* The vocabulary is built. It is just concentrated in two
files and missing from the rest.

## What "visual" means here, and what it does not

There is a real trap in this rule, and it is worth naming before the rules start.

Cues that **mark structure** — a figure, a numeral, a meter, a labelled edge, a
grid position — reduce the load of a page and improve what a reader takes from
it. That is Mayer's signalling principle and it is what this file is asking for.

Decoration does the opposite. Images that are pleasant but carry nothing
measurably *impair* comprehension, and eye-tracking studies find that readers
with lower working memory look at them **more**, not less. A prettier page that
costs the reader attention is a worse page, and it is worse specifically for the
audience this site was built for.

So this is not a rule about adding pictures. It is a rule about which of the
page's points are being carried by prose that a drawing would carry better.

This also happens to be what the site already decided, for different reasons.
`docs/loud-redesign-plan.md` §0.8 and §10 rule out stock photography and anything
invented, and §4.7 puts a wave field where a photograph would go. `README.md`
records that the one drawn character was deliberately deleted, along with the
palette tokens it was the only consumer of. Those decisions stand. Nothing in
this file reopens them.

---

## The rules

1. **Every visual must lose information if removed.** Take it out and read the
   page. If it reads the same, it was decoration, and decoration is a cost
   charged to the reader who can least afford it. This is the whole rule; the
   rest is how to apply it.

2. **Forty words is a paragraph's ceiling. Twenty-five is a sentence's.** Past
   either, it splits, or it gains a figure that carries half of it. The numbers
   are not style — they are a working-memory budget, and a block over them is
   asking the reader to hold more than the page has given them a way to hold.

3. **Nothing is removed to hit a number.** Split it, re-set it, illustrate it,
   give it a heading. Deleting a section, a link, a call to action or a fact to
   shorten a page is not this rule and never was. A shorter page that says less
   is a failure of this rule, not a success.

4. **Use the vocabulary. Do not invent a second one.** Everything needed is
   already here:

   | Device | Where | Carries |
   |---|---|---|
   | `.cfig` / `.fig` | `site.css:664-677` | A drawn figure. Five stroke classes: `.w` accent, `.q` quiet, `.h` heavy accent, `.o`/`.os` orange, `.d`/`.s` dot and stroke |
   | `.cell-ico` | `site.css:634` | The 48px band above a grid cell, with its deliberately enormous gap |
   | `.num`, `.cell-label` | `site.css:490`, `:639` | The numeral and the mono uppercase label that say where you are |
   | `.pip` meter | `test.css:413` | A count you can read without counting |
   | The 3px edge | seven places, `styles.css:913` onward | The most repeated meaning-carrier in the repo: an annotation that needs no word |
   | `.grid` hairlines | `site.css` | Structure without a table |
   | The wave field | `waves.js`, `.page-wave` | Where a photograph would go |

   **No photography and no illustrated characters.** Not because they would look
   wrong, but because this was decided — see `docs/loud-redesign-plan.md` §0.8
   and §10, and `README.md` on the removed mascot. If that is ever reopened, it
   needs a photography direction first; `docs/brand-guidelines.html` names its
   absence as a known gap.

5. **Structure is visible before it is read.** Every block gets its kicker, its
   heading and its numeral, because those are what let someone decide what to
   read without reading it first. A sentence that names five things in a run of
   commas becomes five things.

6. **The typography floor.** Body copy at `line-height` 1.5 or more, 16px or
   more, left-aligned. Centred body copy is on the do-not list in every ADHD
   formatting guideline, because a ragged left edge costs a line-return every
   line. **Vivid Orange is never body-size text** — it measures 3.24:1 on white,
   under the 4.5 needed for body. It is a heading, an edge, a dot and the mark.
   Every other text token passes in both themes.

7. **A figure is `aria-hidden="true"` and tells a screen reader nothing new.**
   If the drawing carries a fact the prose does not, the prose is missing a fact.
   This is already true of all 88 SVGs on the site; it is written down here for
   the first time.

8. **The Malay moves with the English, or it disappears without an error.** Two
   different mechanisms, and this is where this work will break:

   - **Site pages** key off `i` + `sha1(raw inner HTML)[:7]` into `site.ms.js`.
     Change one character of the English — one entity, one comma — and the key
     changes, the lookup misses, and the string silently falls back to English.
     Mint the new key from the exact new markup:

     ```bash
     python3 -c "import hashlib,sys;print('i'+hashlib.sha1(sys.stdin.read().strip().encode()).hexdigest()[:7])"
     ```

     Then add the Malay under the new key and delete the old one. The Malay is
     rewritten, not re-translated — `bahasa-melayu-voice.md` is the rules.

   - **`self-check.html`** is the exception. Its keys are hand-named (`lede`,
     `who3`, `not2`) into `test.js`'s own table, so editing the English does
     **not** move the key. Only the Malay string beside it needs rewriting.

## Off limits

Three things this rule does not reach, and one it must never become.

- **The eighteen ASRS questions.** Not reworded, not reordered, not trimmed, and
  not illustrated. A screening instrument's validity is a property of its exact
  wording, and a drawing beside an item is a cue that changes how it is answered.

- **The substance of the PDPA notice** (`cNoticeEn` / `cNoticeMs`). It is consent
  text. Re-set its layout, break it into labelled parts, put it behind a
  disclosure — but the sentences are a legal matter, not an editorial one, and
  shortening them is a separate decision taken deliberately.

- **`docs/content/*.md`** — the user's own copy, which `/about` and `/activities`
  reproduce verbatim. Those pages may **gain** a figure. Their words do not
  change, including under this rule.

- **No clinical claim, from a picture any more than from a sentence.** A diagram
  that implies a cause, a mechanism or a diagnosis is a clinical claim wearing a
  different coat. The prohibition is on the claim, not on the prose.

## Before and after

The habits page, cell 02. One 61-word block with nothing beside it:

> **Was** — "Working next to someone — in the room, on a call, a stranger on a
> video — makes starting easier for a lot of people. We will be straight about
> why: the research is thin and points both ways. What it has going for it is
> that it costs nothing to try, and one session tells you whether it is yours."

> **Now** — a drawing of two people at one surface, a mono label reading
> SOMEONE ELSE THERE, and two blocks:
> "Working next to someone makes starting easier. In the room, on a call, or a
> stranger on a video."
> "We will be straight about why: the research is thin and points both ways.
> What it has going for it is that it is free to try, and one session tells you
> whether it is yours."

Nothing was cut. The inconvenient caveat about the research survives, because
removing a fact to hit a word count is rule 3 broken.

And one that went the other way. `self-check.html` is the only page of the ten
with no wave field, and it stays that way. Its own stylesheet says why: *"the
moment somebody starts a screener, every other link on the screen is an
invitation to abandon it."* A wave field there would carry nothing and cost
attention — rule 1, applied to a visual rather than a sentence. The two figures
that page did get each draw a fact the prose beside them states.

## Checklist before a page ships

- [ ] Longest paragraph under 40 words? Longest sentence under 25?
- [ ] Take each figure out — does the page lose a fact, or just look plainer?
- [ ] Nothing deleted. Every section, link and call to action still there?
- [ ] Every block has a kicker, a heading or a numeral above it.
- [ ] Figures are `aria-hidden`, and drawn from the table in rule 4.
- [ ] Keys recomputed, new Malay written, old keys deleted, and
      `node --check site.ms.js` clean?
- [ ] Both themes, both languages, and nothing fell back to English.
