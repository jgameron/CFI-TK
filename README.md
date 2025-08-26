# Flight Timer & Log PWA (v1.0)

A lightweight offline-first PWA that logs flight time, landings, Hobbs/Tach totals, and a copyable summary. Data is saved to `localStorage`.

## Features
- Live timer with **HH:MM** and **decimal hours (H.DD)**, shows **start time** and supports **pause** without accruing elapsed time.
- **Landings** counters for Student & Instructor (+/– and reset).
- **Hobbs** and **Tach** start/stop with H.DD totals (2 decimals).
- **Manual time** (HH:MM) inputs with auto-colon and cross-midnight handling.
- **Resets** per field/section and **Reset All** with confirmations.
- **Summary** builder with one-click **Copy**.
- True **PWA**: `manifest.webmanifest` + `service-worker.js` for offline.
- Version footer: **1.0**.

## Run locally
Just open `index.html` in a local web server (service workers need http/https). For example:

```bash
# Python 3
python3 -m http.server 8080
# open http://localhost:8080
```

## Deploy to Netlify
1. Create a new GitHub repo and add these files.
2. In Netlify, **New site from Git** → connect your repo.
3. Build settings: _no build command_ (static site). Publish directory: root.
4. Deploy.

## Notes
- All data persists in the browser via `localStorage`. Clearing site data will reset it.
- The service worker precaches the app shell; update the `CACHE_NAME`/version to force clients to refresh.
