# Cloud Collabo staging deployment

A dedicated staging Worker configuration is available at `wrangler.staging.jsonc`. It uses Worker name `collabo-staging`, binding `DB`, and the existing `collabodb-preview` D1 database. **Do not change the production Worker or production database.**

## Deploy (requires authorized Cloudflare account access)
From the repository root, with Wrangler authenticated to the **Collabo** Cloudflare account:

```sh
npx wrangler deploy --config wrangler.staging.jsonc
```

This is a separate deployment command, not the default GitHub-connected production deployment. The file alone does **not** create the staging Worker. Do not commit Cloudflare API tokens.

## Verify

1. Confirm Cloudflare Workers & Pages lists `collabo-staging` with a D1 binding named `DB` pointing to `collabodb-preview`.
2. Visit `https://collabo-staging.collabo-aa4.workers.dev/api/health` (verify actual URL in dashboard); expect `{"status":"ok"}`.
3. Check that `GET /api/projects` without an Authorization header returns HTTP 401.
4. Verify the staging database has tables `projects`, `applications`, `milestones` (previously verified in console).
5. Authenticated API testing requires a separate Clerk development/testing configuration or an approved staging domain. The existing production Clerk key is restricted to `cloudcollabo.com` and should not be relaxed merely for testing.
6. Test authenticated create/list/read/update/apply and owner-only permissions before any production merge.

## Release gate
Keep PR #11 as draft until staging API integration, authentication, privacy, security and UI integration have been verified. The current frontend remains a demonstration.
