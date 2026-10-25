# SPIN THE WILBEN

A classroom randomizer styled like a clock: the dial of names stays still and
Wilben himself is the hand that spins around the hub, slowing to a stop on the
next name called for recitation. Built with React + Vite + TypeScript, no
backend, and no internet needed once it is installed.

## Run it

```bash
npm install
npm run dev        # http://localhost:5173
```

For a presentation, build the production bundle and serve it:

```bash
npm run build
npm run preview    # http://localhost:4173
```

You can also hand `dist/` to any static file server (`dist/index.html` uses
relative asset paths, so it works from a subfolder too). Keep fonts, sounds and
images local — they are already bundled.

## Using it in class

1. **PARTICIPANTS** (bottom left) opens the roster drawer. Add a name, press
   Enter, repeat. Paste a list separated by commas or new lines to add in bulk.
2. Click the wheel, its glowing hub, or the **SPIN THE WILBEN** button — or press
   **Space** / **Enter** — to spin. Wilben sweeps around the dial for exactly
   **10 seconds**: a fast constant spin for the first 5 seconds, then a visible
   deceleration over the last 5 seconds. Names are picked uniformly; every
   eligible classmate has the same chance.
3. When the hand stops, the winner is revealed a beat later so you can see who
   Wilben is pointing at. The overlay offers **SPIN AGAIN** or **PARTICIPANTS**.
   **Esc** closes it.
4. **RESET WHEEL** (bottom right) clears who has been called. In the drawer,
   **RETURN N CALLED NAMES TO THE POOL** puts them back, **RESTORE SAMPLE
   ROSTER** rebuilds the demo list, and **CLEAR ALL** empties it.
5. **SOUND** and **FULLSCREEN** live in the bottom right. The header chips show
   the pool size, how many have been called, and (dismissible) a reminder when
   the portrait is still placeholder art or is missing.

The roster, called list, settings and sound preference all persist in
`localStorage` — everything stays on this computer. **RESTORE SAMPLE ROSTER**
also clears the pool until the next spin.

Inside the drawer, **"Remove selected names from future spins"** takes the winner
out of the pool after each spin. That setting is off by default. Turn it on for a
one-and-done recitation round; turn it off to let the same person be picked again.

## Replace Wilben's portrait

The app uses the real cutout of Wilben at:

```
public/images/WilbenSpin.png
```

Swap that file (or point `PORTRAIT_SRC` somewhere else) with a cutout that has
these properties:

- **PNG or WebP with a transparent background**, roughly **1000 × 1400 px**
  (any tall portrait aspect close to 1:1.35 works — the image rides the clock
  hand, with the feet anchored at the hub and the head toward the rim).
- **Full body, front-facing**, head at the top and feet at the bottom of the
  cutout. The whole image rotates with the hand, so it will be sideways and
  upside down at points around the dial — that is intentional clock-hand
  behavior, like the arrow itself.
- Trim most of the empty transparent margin around the figure. Wide empty
  margins are cropped automatically, but a tight crop keeps the person as
  large as possible.

`PORTRAIT_IS_PLACEHOLDER` is already `false`; flip it back to `true` only if you
put placeholder art in that slot and want the reminder badge again. If the file
is missing or fails to load, the app falls back to a built-in silhouette and
tells you what happened, so the presentation never breaks.

## Tweak it

Everything the host is likely to change lives in `src/config.ts`:

| Export | What it does |
| --- | --- |
| `APP_TITLE`, `APP_SUBTITLE`, `APP_KICKER` | Header copy |
| `PORTRAIT_SRC`, `PORTRAIT_IS_PLACEHOLDER` | Portrait file and reminder badge |
| `HUMOROUS_MESSAGES` | Lines shown at random under the winner |
| `DEFAULT_NAMES` | Sample roster used on first run |
| `MAX_PARTICIPANTS` | Roster cap (36) |
| `SPIN_TUNING` | Duration (10000 ms), turns, landing jitter |
| `HAND_REST_ANGLE` | Where Wilben points while idle (−90° = 12 o'clock) |

### Handy to know

- The winner is chosen **before** the animation and the hand's final angle is
  solved to point at that segment, so what Wilben points at and what the app
  announces always match.
- Each 10 s spin spends the first 5 s at full speed (covering about 75% of the
  turns) and the last 5 s easing down into the stop.
- **Reduced motion** (OS setting) no longer shortens the spin — the 10 s spin
  is always the same. It still turns off confetti and pulsing decorations.
- Keyboard: **Space/Enter** spins (when focus is not in a form field),
  **Esc** closes the overlay or drawer.
- Sounds are synthesized with the Web Audio API — there are no audio files to
  manage, and nothing downloads at runtime.

## Project map

```
src/
  config.ts                 host-editable copy, roster, spin tuning
  App.tsx                   layout, state, persistence, keyboard, fullscreen
  components/
    SpinWheel.tsx           static dial, rotating Wilben hand, hub, rAF spin loop
    WilbenPortrait.tsx      rider cutout, drawer glow, fallback silhouette
    WinnerAnnouncement.tsx  winner overlay, confetti, spin again
    ParticipantManager.tsx  roster drawer (add / rename / remove / bulk paste)
    Confetti.tsx            canvas celebration
  lib/
    wheel.ts                clock-hand geometry, win alignment math
    easing.ts               two-phase clock-spin curve (fast → decelerating)
    audio.ts                Web Audio tick / whoosh / fanfare
    text.ts                 label fitting helpers
  hooks/                    localStorage state, reduced-motion detection
public/images/WilbenSpin.png    portrait asset
```

## Scripts

```bash
npm run dev       # dev server with HMR
npm run build     # type-check + production bundle into dist/
npm run preview   # serve the production bundle
npm run lint      # oxlint
```
