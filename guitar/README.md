# Guitar Coach

An electric guitar course from **intermediate to ultimate pro**, focused on leads and riffs.

- **4 levels, 25 lessons, 50 exercises**: Intermediate → Advanced → Pro → Ultimate Pro, split into
  picking hand, fretting hand, leads and riffs.
- **Exact fingering on every note**: an animated fretboard lights up the fretting finger
  (1 index · 2 middle · 3 ring · 4 pinky · R picking-hand tap) while a coach panel shows the string,
  fret, pick direction (↓/↑ animation) and technique (hammer-on, bend amount, palm mute…).
- **Animated technique diagrams**: pick grip, pick angle, alternate/economy/sweep/hybrid motion,
  fingertip placement, thumb position, supported bends, wrist vibrato, palm muting, string muting,
  tapping and legato.
- **Synthesised playback** (Karplus–Strong strings with optional distortion), tempo control, loop,
  click, count-in and "clean at X BPM" tempo logging.
- **Daily practice mode**: a fresh 15/30/45/60-minute routine every day for your level (warm-up,
  picking, fretting, lead lick, riff, improvisation over a drone) with block timers and a streak.
- **Tools**: metronome with tap tempo and subdivisions, and a full-neck scale explorer.

Progress is stored on the device (localStorage).

## Develop

```bash
npm install
npm run dev
```

## Deploy

`.github/workflows/deploy-app.yml` builds this app and publishes it at `/guitar/` on the repo's
GitHub Pages site, alongside the Plan Tracker.
