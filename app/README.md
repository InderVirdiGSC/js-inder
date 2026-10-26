# Plan Tracker

A one-tap logger for a fixed diet plan. Each item stores its nutrition label once;
logging uses the item's default amount unless you change it, and protein/calories
are calculated from the label.

## Develop

```bash
npm install
npm run dev
```

## Install on iPhone

1. Open the deployed URL in Safari.
2. Share → **Add to Home Screen**.

Data is stored on the device only (Goals → Export backup to save a copy).

## NFC tags (optional)

Every item has a link like `https://<host>/?log=paneer` (copy it from the Items tab).
In the Shortcuts app create **Automation → NFC**, scan the tag, add **Open URLs** with
that link, and turn off **Ask Before Running**. Tapping the tag logs the default amount.

## Deploy

`.github/workflows/deploy-app.yml` publishes `app/` to GitHub Pages on every push to
`main`. Enable it once under repo **Settings → Pages → Source: GitHub Actions**.
