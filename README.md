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

## Leads, email and admin
The contact form posts to `/api/lead`. Each request is saved to Postgres and emailed.
The admin is at `/admin/leads` (HTTP Basic Auth) and shows where every lead came from
(channel, UTM labels, ad click ids, landing page, referrer), with status, tags, notes and CSV export.

Environment variables (Vercel → Project → Settings → Environment Variables):

| Variable | Purpose |
| --- | --- |
| `DATABASE_URL` | Set automatically when a Neon Postgres database is added from the project's Storage tab. The `leads` table is created on first use. |
| `ADMIN_USER`, `ADMIN_PASSWORD` | Login for `/admin/leads`. The admin returns 503 until both are set. |
| `RESEND_API_KEY` | Sends the notification email (optional if the database is connected). |
| `LEAD_TO_EMAIL` | Recipient, default `info@ogpdigital.com`. |
| `LEAD_FROM_EMAIL` | Sender, e.g. `OGP Website <noreply@ogpdigital.com>` once the domain is verified in Resend. |

Campaign links: `?utm_source=...&utm_medium=...&utm_campaign=...`. For Google Ads add
`&campaignid={campaignid}&adgroupid={adgroupid}&keyword={keyword}` to the tracking template.
