# next-presensi

Minimal Next.js starter scaffold for the presensi camera project, ready to be exported as a static site for GitHub Pages.

Quick start:

1. Install dependencies

```bash
cd next-presensi
npm install
```

2. Run dev server

```bash
npm run dev
```

3. Build & export (static)

```bash
npm run build
npm run export
# output will be in `out/`
```

4. Deploy to GitHub Pages (project page)

Set environment variable `NEXT_PUBLIC_REPO` to your repository name (e.g. `GAS-GPS-Cam`) so `next.config.js` adds the correct `basePath`.

```bash
export NEXT_PUBLIC_REPO=GAS-GPS-Cam
npm run predeploy
npm run deploy
```

Notes:
- This starter uses Tailwind CSS for quick styling. You can port existing `index.html`, `style.css`, and `script.js` into `pages/index.js` (already started).
- If you prefer Vercel, you can push the repo and connect it in the Vercel dashboard — no export needed.
