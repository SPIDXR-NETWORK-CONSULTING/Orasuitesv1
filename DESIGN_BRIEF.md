# ORÁ Suites — Redesign Brief v2 (17 Aug 2026) — RESTRAINT PASS

v1 was rejected: too much copy, type too big, left-stacked, overlapping images, repeated images, invented content, over-designed. v2 = **subtract**. Read the whole file. Also read `/Users/abdulafolabi/.claude/skills/abdul-design-standard/SKILL.md` for the motion/quality bar — but restraint overrides everything.

## The owner's words (obey literally)
- "High-end, luxury, straightforward, simple, not over-the-top." "Less words. Less space taken by words. Clean shapes, buttons, efficiency."
- "Clean, readable, simple font. Not funky. No swooshes or swirls."
- "Everything should be a central approach." Must look good on **desktop AND mobile**.
- "The hero video should be the main thing of the home page." Text small, 1–2 lines, buttons right under.
- "**Not women-only** — we removed that concept." NEVER use the phrase.
- "**Team members should not be mentioned at all**" (they may leave). No names, no roles, no initials cards. Founder: "Meg Cauli" may appear once, on ONE line, on About only. No "built by a nurse". "Nurse-led aesthetics and luxury nails" as a phrase is liked.
- "Talk more about the space, less about the people."
- "Avoid repeating images. Only use images I already approved on the last website" (map below).
- "Why is the image overlapping? Can it not be simpler?" → **no overlaps, no offsets, no bleeds**. Straight, tidy grids, centred.
- Coming soon = **three simple faded boxes**. Not a section with its own headline/copy.
- Services page: "so much to scroll — user selects a category, then the options come up."
- Booking: "simple selection process… you should NOT be able to choose the practitioner… simplify the whole process."
- Glass effects: liked, "but not tidy" → use sparingly, aligned, consistent radius/padding.
- CTA sections that are "just words and a button and space" → remove.
- Contact: "poor spacing, so much free space" → compact.

## Typography (v2)
- Body/UI: **DM Sans** 15–16px, lh 1.55. Headings: **Playfair Display 400/500 ONLY** (no italics anywhere), sizes: page H1 `clamp(1.9rem, 3.2vw, 2.75rem)`; section H2 `clamp(1.5rem, 2.4vw, 2rem)`; card titles 1.05–1.15rem. Eyebrows optional, tiny, sparse. Line-height 1.15. Tracking -0.01em. Update `.text-display-*` in index.css to these smaller values so everything shrinks consistently.
- Max 1 heading + 1 short line (≤ 14 words) per section. No paragraphs > 2 lines on desktop.

## Layout (v2)
- Section padding 72–96px desktop / 56px mobile. Content centred (`text-center` headings, centred grids). Max width 1200.
- Cards: same radius (1rem), same padding (1.25–1.5rem), same glass tone within a section. Grids 3-up desktop / 1-up mobile (2-up on ≥640 where it fits).
- Motion kept but calm: fade+y16 reveals, 60ms stagger, hover lift 3px. No clip-path bands, no parallax on text, no split-line reveals except the hero (single line).
- No `.band-dark` overuse: max ONE dark band per page.

## Approved image map (use exactly; never reuse an image in two places on the same page)
Home: hero `/hero-video.mp4` (poster: first frame – generate poster from a still already in attached_assets if needed: `hero-image_1770213665902.png` OK) · intro `ora-logo-wax-seal.jpg` · services overview: aesthetics `service-injectables.jpg`, nails `service-nails-ora.jpg`, hair `service-hair-homepage.jpg`, makeup `service-wellness-homepage.jpg`, laser `service-led-laser.jpg` · room rentals teaser `ora-hallway.jpg` · results `result-hydrofacial.jpg` + `result-lip-filler-1.jpg` · location `manchester-location_1770213665902.png` · (cta section removed).
Services page: hero `ora-hero-zebra-crossing.jpg`; aesthetics `service-aesthetics-skincare.jpg`; nails `service-nails-gold.jpg`; hair `service-hair-blowout.jpg`; laser `service-led-laser.jpg`; makeup/wellness `service-wellness-facial.jpg`.
About: `about-meg-ceo.jpg` (founder), `community-coffee.jpg`, `community-newspaper.jpg`, `ora-hallway.jpg`, `ora-hero-zebra-crossing.jpg`.
Contact: `contact-hero-nails.jpg`. Room rentals: `ora-hallway.jpg`, `room-rental-included.jpg`, `room-rental-practitioner.jpg`, `room-rental-welcome.jpg`.
Results: `result-chin-filler.jpg`, `result-hero-contour.jpg`, `result-hydrofacial.jpg`, `result-lip-filler-new.jpg`, `result-microneedling.jpg`, `result-under-eye-new.jpg`, `service-polynucleotide.jpg` (this one is "treatment in progress" — caption honestly).

## Page specs (v2)
**HOME** — Hero: full-bleed video, soft dark overlay, centred: one line "Nurse-led aesthetics and luxury nails." (Playfair, ~2.4rem desktop / 1.7rem mobile) + one small line "49 Deansgate, Manchester" + two buttons (Book · Services). NOTHING else in the hero (no eyebrow, no Arabic, no pills, no stats). → Intro: centred, wax-seal image in a tidy centred card above one heading + one line, link to About. → Services: heading "Our services" only; 2 live cards (aesthetics, nails: image, title, "from £X", arrow) + a row of 3 small faded "Coming soon" boxes (Hair · Makeup · Laser) with just the word + badge; no copy. → Room rentals: one clean 2-col (image | heading + 1 line + 3 price pills + button) — no dark band, no bleed. → Results: 2 images side by side, centred heading, link. → Testimonials: keep, smaller quote type. → Location: image + tidy info card (address, hours, email, map link) centred; map embed optional below. → TikTok: keep but compact (single phone centred + heading), or drop if it fights the rhythm — keep. NO CTA section at the end.
**SERVICES** — short hero (40vh, zebra image, H1 "Treatments & prices", one line). Then a centred **category selector**: 5 tiles (Aesthetics, Nails live; Hair, Makeup, Laser faded coming-soon). Selecting a live tile reveals (in place, animated height) that category's price list: grouped, compact rows (name · duration · price · "Book" arrow → /book?service=id). Only ONE category open at a time; default = Aesthetics open; `#nails` hash opens nails. Nail add-ons as a compact row. NO team strip. NO "launching soon" section. Bottom: one small line "Not sure? Book a free consultation →" (link, not a section).
**BOOK** — 4 steps only: **Service → Time → Details → Confirm** (+ done). Remove practitioner step entirely (backend round-robins; do not mention practitioners). Service step: category tabs (live only) + compact list rows (name · duration · price) — no cards grid, no search box unless list > 25 (aesthetics is 36 → keep a small search input, right-aligned). Selecting a row auto-advances to Time (no separate Continue click). Time: 14-day strip + slot chips (keep, it was liked). Details: 4 fields + consent (keep). Confirm: summary + deposit note (preview mode) + Confirm button. Progress: 4 dots. Summary rail stays but slimmer. Everything centred max-w-2xl.
**ABOUT** — H1 "About ORÁ" centred; founder block: image left | text right (ONE tidy 2-col; name "Meg Cauli" one line, one short paragraph about the space/vision, no "nurse", no team). Then "More than a clinic — a community" (keep, liked) with the two community images in a straight 2-col. Then "Four things we never compromise on" as **4 static boxes** (grid, no scroll). Then "Come and meet us" (keep, liked). No team section anywhere.
**ROOM RENTALS** — keep structure but tidy: hero (hallway) + H1 + one line + 3 price pills; pricing 3 cards; "What's included" = 8 tidy icon tiles with EXACTLY: Marketing exposure · Automated booking system · Furnished treatment rooms · Community access · Wi-Fi · Shared facilities · Around-the-clock concierge · Clinic-app integration; form = ONE simple form (name, email, phone, practice type, preferred plan, start date, insurance yes/no, message) — no stepper, no "we'll do the rest" copy; submit → success.
**RESULTS** — H1 + one line; filter chips; tidy 3-col grid (desktop) / 1-col mobile, equal-height cards, no orphan; lightbox keep; before/after slider only where it works cleanly. Only approved images.
**CONTACT** — compact: H1 + one line; 2-col: info card (address, hours, email, map link) | form. Map embed below full-width, short (280px). Reduce vertical whitespace.
**HEADER/FOOTER** — keep; footer: remove team/anything wordy; keep email-list pill (it posts to GHL — good).

## Self-check before you finish (mandatory)
Run `npm run check`; then take screenshots (Playwright with installed Chrome; script at scratchpad `shot2.mjs` — or write your own) at 1440×900 AND 375×812 for every page you own; open them (Read tool) and confirm: centred, no overlap, no repeated image, no "women-only", no team names, headings small, no orphan cards, no empty half-sections. Fix, re-shoot, then report with the screenshot paths.
