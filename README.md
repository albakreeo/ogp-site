# OGP — Online Growth Partner (site)

Bilingual (AR/EN) one-page marketing site. Next.js (App Router), no extra dependencies.

## Run locally
```bash
npm install
npm run dev      # http://localhost:3000
npm run build && npm start
```

## Structure
- `app/body.html` — page markup (AR/EN spans, section content)
- `app/site.css` — all styles
- `public/site.js` — language switch, growth calculator, animations
- `public/img/` — client logos and photos
- `app/layout.tsx` — metadata, fonts

## Deploy (Vercel)
Import this repository in Vercel (Add New → Project). No settings needed — Next.js is detected automatically.

## Note
The contact form is a prototype: it validates fields but does not send anything yet.
