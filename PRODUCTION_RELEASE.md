# Cloud Collabo production release checklist

Production target: https://cloudcollabo.com
Cloudflare Worker: collabo
This branch is **release preparation only**. Do not merge/deploy until the checklist passes.

## Clerk
- Create/activate a **production** Clerk instance, with cloudcollabo.com as the application domain.
- Copy its **pk_live_** publishable key into clerk-config.js (this key is public).
- Keep **sk_live_** and webhook signing secrets in Cloudflare Worker encrypted secrets only. Never put them in HTML, JavaScript, GitHub commits, or screenshots.
- Configure allowed redirect/origin URLs for https://cloudcollabo.com and, if used, https://www.cloudcollabo.com.
- Test sign-up, email verification, sign-in, sign-out, password recovery, and mobile browser behavior.
- Current frontend integration is a starting point and requires end-to-end validation.

## Backend before accepting real project submissions
- Add server-side Clerk session/JWT verification to all protected API routes.
- Store projects in a persistent database, tied to authenticated Clerk user IDs.
- Validate and limit user input and uploads; use private storage and signed upload URLs.
- New projects default to **pending**; never publish until approved.
- Enforce administrator role **on the server**, not just by hiding UI buttons.
- Audit approvals/rejections and prohibit self-approval.
- Set up backups, rate limits, error monitoring, and abuse reporting.
- Keep payments disabled until provider integration and secure webhook validation are complete.

## Deployment
- Deploy to staging/preview first; confirm all routes and assets load.
- Cloudflare Worker custom domain should remain cloudcollabo.com.
- Ensure no development keys or demo data appear in production.
- Run smoke tests from desktop and mobile before promoting to production.

**Status:** NOT production-ready; the current demo forms do not submit projects to a secure backend.
