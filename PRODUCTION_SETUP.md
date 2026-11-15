# Production API foundation (not live yet)
This branch adds a Cloudflare Worker API and D1 schema. It does not remove the demo UI or enable real user-facing features.

## Deployment prerequisites
1. Existing Cloudflare D1 database: `collabodb` (confirmed in user screenshot).
2. D1 binding `DB` is configured in `wrangler.jsonc` using the verified database ID.
3. Apply `schema.sql` using `npx wrangler d1 execute collabodb --remote --file=./schema.sql` after verifying the Cloudflare account and target database.
4. Verify Clerk production issuer is `https://clerk.cloudcollabo.com` and that production JWTs are RS256 signed with the matching JWKS. The issuer is enforced in src/index.js; adjust only after checking real tokens.
5. Deploy to a staging Worker first, configure test credentials and test API endpoints. Do not deploy this branch to production until the full verification is complete.

## API
- GET /api/health
- GET /api/projects (authenticated)
- POST /api/projects (authenticated)
- GET /api/projects/:id (authenticated)
- PATCH /api/projects/:id (owner only; status)
- POST /api/projects/:id/applications (non-owner)
- GET /api/projects/:id/applications (owner only)

All authenticated endpoints expect `Authorization: Bearer <Clerk session JWT>`. Public browsing, private projects, application approvals, invitations, milestones, messaging and payments remain future work. The schema includes milestones but no milestone endpoints yet.

## Security caveats
Review JWT verification and audience requirements before launch; verify against production Clerk configuration. No production database exists just because this branch was created. Add rate limiting, abuse controls and comprehensive integration tests before enabling public writes.

## Production release gate — DO NOT MERGE YET
The repository now has a confirmed Cloudflare D1 database ID and binding, but the database screenshot shows zero tables and there is no staging integration test evidence. Merging this branch as-is would deploy a Worker that returns HTTP 503 for API routes. It does not make the demonstration UI live.

### Required Cloudflare account actions
- Existing D1 database is `collabodb`; do not create a second database.
- The existing database ID has already been added to wrangler.jsonc.
- D1 binding is configured in wrangler.jsonc; verify its deployment environment before merging.
- Apply the schema to the remote database and confirm the tables exist.
- Set up a separate staging deployment and verify authentication, project create/list/status, and application permissions.
- Confirm the frontend actually calls the authenticated API; currently it still displays demonstration forms.
- Review API privacy, anti-abuse, rate limits, Clerk token claims and JWKS availability, and release rollback plan.

**Never paste Cloudflare API tokens or Clerk secret keys into GitHub issues or this repository.**
