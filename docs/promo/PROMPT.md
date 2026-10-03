# Prompt — my.adhd promo film v2

Paste everything below the line into Claude Code, run from the My.adhd repo.

---

Build a 30-second vertical promo film for **my.adhd**, a web app at myadhd.my: "dump everything on your mind, it sorts it for you." Work in `docs/promo/` in the My.adhd repo, output 1080×1920 H.264 MP4, and aim for the best-looking result you can, not the easiest to build. Leave the v1 files (`promo.html`, `render.swift`, `out/myadhd-promo.mp4`) alone. Write the new film to `out/myadhd-promo-v2.mp4`.

**Tooling is your call; pick whatever gives the best visuals.** Any language and any stack is fine. What's on this Mac:
- Node is at `~/.local/node/bin` and isn't on PATH, so Remotion or Puppeteer/Playwright are options if you can install them.
- Python 3 with Pillow and NumPy.
- `swiftc` with WebKit and AVFoundation. The existing `render.swift` writes MP4s without ffmpeg.
- ffmpeg and Blender are not installed.

Suggested approach:
- **Capture the real app.** Load `app.html` from a local server. localhost bypasses the `/soon` hold. Run it in an isolated headless WebView or browser profile, seed `localStorage["myadhd.v1"]` with demo tasks there, and never touch the user's real store. Capture each state as a crisp @3x frame, or record it frame by frame.
- **Composite the captures.** Put them in a realistic phone with a subtle 3D tilt, soft shadow and depth-of-field. Add smooth camera push-ins on the key UI, motion blur on fast moves, and kinetic typography for the captions.
- **Fallback.** A hand-built SVG/HTML scene driven by a pure `seek(t)`, rendered through the existing Swift pipeline, is fine if real capture fails. It must still match the real UI pixel for pixel in spirit.
- **Sound.** A soft music bed is optional, and only if you can source a royalty-free track legally. Otherwise the film is silent and the captions carry it.

**On-screen language:** English by default. Choose another language only if it serves the film better. If you use Malay, follow `docs/bahasa-melayu-reference.md` (baku, `anda`, no tagline on a BM surface).

**Brand. Read `docs/brand-guidelines.html`, `docs/taglines.md` and `theme.css` first; they win over this prompt.**
- The ground is near-monochrome: Paper White `#FFFFFF` (not cream), ink `#101018` and secondary `#5E5E6A`. For a night scene, use surface `#101018` and ink `#F3F2FB`.
- The accent is Vivid Blue `#4737FF`, used for interactive chrome and focus.
- Vivid Orange `#F75C03` means only "press this" or "this is late". Use it for the primary button circle, the Late chip (as a wash plus an edge, never a solid fill) and the mark's arms. It goes nowhere else: no headings, no rules, no ornament. Don't show more than one orange thing on screen at a time.
- Violet `#7B3FE4` is used only for the mark's capsule and ".adhd" in the wordmark.
- The CTA gradient `linear-gradient(103deg,#101018 0%,#3529BF 38%,#4737FF 68%,#ACA5FF 100%)` may appear on a CTA only. It is never a background or a heading fill.
- Use three fonts, embedded from `fonts/`, each with one job:
  - **Baloo 2** for display captions and the wordmark (700, -.03em). It is also the in-app UI type.
  - **DM Sans** for sentences.
  - **DM Mono** for labels: uppercase, tracked .06–.16em.
  - No other fonts, including handwriting fonts.
- The mark is "an asterisk with one arm come loose": seven orange arms and a detached violet capsule. Take it from `icons/mark-solid.svg` or `icons/icon-source.svg` and the wordmark from `icons/wordmark-text.svg`. Never complete the asterisk, recolour, stretch or rotate it, or set the wordmark in DM Sans. Put the lockup on a plain ground only.
- Voice is plain, unhurried and never clinical. Keep each caption to 6 words or fewer, with full stops.
  - Don't make any claim to treat, cure or fix ADHD.
  - Don't invent testimonials, stats or stock imagery.
  - Don't show timers, streaks, XP or notifications. The app leaves those out on purpose.

**Show the real app, not an imitation.** Recreate the screens with their real copy, taken from `app.html` and `app.js`, inside a phone frame. Use the app's tokens from `theme.css` and the button styles from `styles.css`. Real copy to use:
- **Home:** "What's on your mind?", "Everything gets sorted into lists. Nothing is thrown away.", and the button "Clear my head".
- **Composer:** the title "New dump", the placeholder "just tell me, i'll sort it out.", the "hold to talk" mic and the "Sort it" button. Dates in the text turn into chips under "Heading for the calendar".
- **Triage loading:** "Untangling that…", "Sorting the noise from the signal…", "Finding the one that matters…"
- **Lists:** the eyebrow "Sorted into lists." and the headings Late / Today / Coming up / No date yet, with the category row: work, admin, money, health, home, social, errand. Each task shows minutes and energy.
- **Task detail:** "First step: …" and "Too big — break it down".
- **Calendar:** the month grid, filled from dates that were in the dump, and "Linked. Anything with a date on it goes to your calendar."
- **Done:** the toast "Done." with undo, and the "N done" pile.
- **Empty state:** "Head's clear. Nothing waiting."

Don't show anything the web app lacks: no single-task "NOW" screen, no priority matrix (that's iOS only) and no habits. Don't say "free", because Pro plans exist.

**Storyboard (30s):**
1. **0–4s, hook:** A white screen and the caption "Your head, right now." Real-life to-dos pile up and overlap in DM Sans, getting louder: reply to boss, dentist Fri, pay the bill, mum's birthday Sun, tax form 30 Sep, buy milk, that email.
2. **4–9s, dump:** The phone rises. On Home, "Clear my head" is pressed (the orange circle is the one orange on screen). The composer opens, a hold-to-talk mic pulse types the pile into the textbox, and date chips appear. Caption: "Type it. Say it. All of it."
3. **9–12s, triage:** "Sort it" is tapped and the loading lines cycle. Caption: "It sorts itself."
4. **12–18s, lists:** Tasks land under Late / Today / Coming up / No date yet, each with minutes and energy. "tax form" sits in Late with the orange wash chip. Caption: "Into lists. By day."
5. **18–22s, first step:** A task opens to its tiny first step, and "Too big — break it down" splits it. Caption: "A first step you can't refuse."
6. **22–25s, calendar:** The calendar fills with the dentist and mum's birthday, then the Google Calendar toast. Caption: "Dates go to your calendar."
7. **25–27s, done:** A task is ticked, "Done." appears with undo, the list gets quieter, and it ends on "Head's clear. Nothing waiting."
8. **27–30s, end card:** On a white ground, the mark draws itself arm by arm and the capsule settles last, still apart. Then the wordmark my**.adhd**, the tagline "Understand Your Mind. Own Your Day." (exactly as written, and the only tagline) and "myadhd.my" in DM Mono.

**Motion:** Keep it calm, with eased 250–400ms moves and no shake or glitch effects. The "loud head" is shown by density, not flashing. The film is silent, so the captions carry it: large Baloo 2, in the top third, clear of the phone.

**Deliver:**
- The MP4.
- The source, reproducible from a single command. Document that command in `docs/promo/README.md` under a "v2" heading.
- A contact sheet of stills at 2, 7, 11, 15, 20, 24, 26 and 29s.

Look at every still yourself and check it against the brand rules above before calling it done: one orange thing per frame, no cream, only the three fonts, real copy only. Fix anything off and re-render.

