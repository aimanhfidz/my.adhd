# my.adhd Late Talks sales page (Bayarcash)

The sales page for **my.adhd Late Talks**, the October–November 2026 online
series: three speakers, one each on Saturday 24 October, 7 November and
21 November (two weeks apart), 9:00–11:00 pm MYT on Zoom. Joining live is
free, and buyers pick which talks they'll join; each talk's recording
(lifetime YouTube access on the official my.adhd channel, for buyers
only) and its slides are RM 20. It is uploaded to BCL as
**one self-contained HTML file**.

A later in-person series is planned as **my.adhd Talk Series 1.0**; it is not
built yet.

Its sections follow Sekolah Minda's "Adult ADHD Malaysia Summit 2026" OnPay
page (frozen since; its content was read from the infographics on their CDN),
rebuilt in the my.adhd brand. Their sales lines were rewritten in our voice:
no exclamation marks, no "fix", no sold-out stamps.

| File | What it is |
|---|---|
| `summit.html` | The source. Edit this. Previews from the repo (fonts come from `../../fonts/`). |
| `build.py` | Subsets the two faces to woff2, inlines them, writes the upload file. |
| `cutout.swift` | Cuts the speakers out of their photos and frames them alike. |
| `photos/` | The speakers' original photos; `photos/out/` holds the cut-outs. |
| `out/summit-bayarcash.html` | **The file you upload.** Gitignored; rebuild it after any edit. |

`docs/` is in `.vercelignore`, so myadhd.my never serves any of this.

## How the page reads

Opener (what ADHD is, loosely) → the event (name, three angles, before and
after) → speakers → the calendar, countdown and timeline → register. Two
faces only: Baloo 2 for headings and names, DM Sans for everything else.
There is no DM Mono and no small coloured line above a heading, by the
user's ruling of 2026-10-18 (BRAND.md allows three faces; this page doesn't
use the third). Explanations stay at one or two sentences.

## Filling it in

Everything that changes is in the `window.SUMMIT` block at the top of
`summit.html`. An empty string shows a dashed placeholder on the page, never
an invented value.

- `registerUrl`: a payment link, for hosting the page anywhere but BCL.
  Until it is set, the register buttons point at the ticket section and a
  placeholder says the link is missing. Leave it empty on BCL (below).
- `sessions[n]`: `topic`, `subtitle`, `blurb`, `speaker`, `role`, `photo`.
  The `blurb` feeds no element on the page any more (the timeline shows
  only topic and subtitle); it is kept as the speakers' own description.
  Talk 1 is Yasmin Yakub (The ADHD Ecosystem), talk 2 Kamila Solihin
  (The ADHD Mind), talk 3 Noor Safarina (Body, Mind & Environment); topics
  matched by profession on 2026-10-15. To
  reorder, swap their `speaker` and `photo` values (and the default names
  in the speaker strip and the programme, which show without script). Dates and
  times are already set; change `date` / `start` / `end` (24-hour, MYT) and
  every date on the page, the calendar strip (whole weeks from the first
  talk to the last, across months), the countdown, the add-to-calendar
  files and the JSON-LD follow. The no-script text in the markup does not;
  change it by hand.
- `tiers[n]`: `name`, `window` (free text), `price` (`"0"` shows as Free)
  and `status` (`"upcoming"`, `"open"` or `"closed"`). They aren't drawn as
  rows any more (the BCL form sits under the heading instead); their prices
  feed the copy and the search data. Right now: **Live, free (pick any of the 3 talks); Recording & slides,
  RM 20 per talk**, both open. The prices also live on the BCL form's
  items; change both together.
- `organiser`, `contact`: shown in the footer (my.adhd, hello@myadhd.my).

Then:

    python3 docs/summit/build.py

### Speaker photos

`photos/` is gitignored: the repo is public and these are real people.
Keep the originals and `photos/out/` on the Mac that builds the page; a
fresh clone builds without them only after they're put back.

1. Put the photo in `photos/` as `<name>.png` (or .jpg), facing the camera.
2. `swift docs/summit/cutout.swift` cuts every photo out on this Mac (Apple
   Vision; nothing is uploaded) and frames each from the face, so all of
   them share one scale and eye line. A photo cropped at the chest is
   framed tighter so the body still reaches the bottom edge (Yasmin's,
   from a phone screenshot, comes out larger for it; a full-size original
   would match the others). Look at `photos/out/` afterwards: a chair
   someone leans on can count as them (`erase` a polygon), a busy
   background leaves a fringe (`erode`), and a figure that leans sits
   off-centre though the face is centred (`nudgeX`; Yasmin's is 0.07). Replaced photos go in
   `photos/old/`, dated.
3. Name it once in the PHOTOS block of `summit.html`
   (`--photo-<name>:url("photos/out/<name>.png")`) and set `photo: "<name>"`.
4. `python3 docs/summit/build.py` inlines each photo once, as WebP.

### Topics

The three in use, and a fourth left out ("The Biological & Health
Foundations of ADHD"), came from the original page, whose titles and session
descriptions were to stay as they were. They are in the config as written.

## On BCL (bcl.my)

The built file is pasted into **payment form 18428** (Payments → Forms → my.adhd
Late Talks → Open HTML Editor; form type Custom HTML), served at
myadhddigital.bcl.my/form/late-talks. BCL puts its own form after it: an
empty `#bcl-payment-form` that `bc-encrypted-payment-embed.js` fills with an
iframe at DOMContentLoaded. The page moves that element under the prices
before the iframe is built, so the form sits with the tiers, the register
button and placeholder step aside, and the footer stays last. Nothing
changes when the page is opened anywhere else.

The form has four items: **Live registration (free)**, RM 0, always in the
order, and **Talk 1/2/3 recording & slides**, RM 20 each, purchase limit 1,
all with multi-buy on. Buyers pick which talks they'll attend in a required
checkbox field, **Which talks will you join live?**, because BCL fixes every
RM 0 item at quantity 1 and can't let a buyer choose free items. Item
Settings → *Limit to one product per order* stays **off**. If BCL ever
starts a paid item at 1, the page steps it to 0 once the frame's Livewire
is up (`freeByDefault()`, same origin), so the form opens at FREE.

What the page can't do is configure the form: the prices, the caps and
whether it is open all live in BCL. The page's tiers only describe them.

## Preview

    python3 serve.py 8731        # from the repo root; bump the port each round
    open http://localhost:8731/docs/summit/summit.html
    open http://localhost:8731/docs/summit/out/summit-bayarcash.html

On a local preview only, `?now=2026-10-17T21:30:00%2B08:00` moves the page's
clock, so you can see each session go Next → Live now → Recorded. The uploaded page ignores it.

## Brand notes

- The colour tokens are copied from `theme.css` / `site.css` because the file
  can't load them; `python3 tools/brand-check.py docs/summit/summit.html`
  should report nothing.
- Speaker photos are an exception to BRAND.md §7 (no photography), made by
  the user for this page on 2026-10-06. They stay on this page; they are
  not a precedent for the site. Not yet recorded in BRAND.md §14.
- Every animation stops under reduced motion, and the page reads in full with
  no script.
