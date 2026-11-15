# Cloud Collabo — production foundation

This branch is NOT deployed to the live domain. The public demonstration on main remains unchanged.

## Implemented backend foundation
- Clerk session JWT verification against the Clerk issuer JWKS, including signature, issuer, expiry, not-before and authorized party.
- D1 tables for accounts, Collabos, photos metadata, and admin audit.
- Authenticated account enrollment (member role only).
- Authenticated Collabo creation, always starting in **pending** status.
- Public API listing **approved** Collabos only.
- Admin-only pending queue and approve/reject actions.
- Admin role is assigned only in the database, never from user input.

## Required before deployment
1. Create a Clerk application and enable email sign-up and sign-in. Configure production domain cloudcollabo.com.
2. Obtain Clerk publishable key for frontend and issuer domain; configure CLERK_ISSUER and CLERK_AUTHORIZED_PARTY for Worker. Do not put a Clerk secret key in GitHub or browser code.
3. Create Cloudflare D1 database; apply schema.sql with Wrangler D1 migrations or execute.
4. Add D1 binding DB and Worker main=src/worker.js to the production Wrangler configuration, preserving static assets routing. Deploy to a staging Worker first.
5. Implement Clerk frontend components and authenticated API requests with getToken(); verify sign-up, sign-in, session renewal and sign-out.
6. Bootstrap admin role through a privileged D1 command for the verified owner Clerk user ID. Never offer public admin registration.
7. Add R2 bucket and signed authenticated upload endpoint for up to three images per project. The schema supports photo metadata but image uploading is NOT implemented.
8. Configure monitoring, rate limiting, CSP/CORS policy, and audit/abuse protections. Test project submission and role isolation.
9. Posting fees, payment processing, real invitations, location distance matching and chat are NOT implemented. Do not charge fees or claim they are active.

## Security and deployment note
Do not deploy this branch by replacing the current wrangler.json until D1, Clerk, and frontend integration are configured and tested. No credentials are stored in this repository.
