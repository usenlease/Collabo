# Clerk setup for Cloud Collabo (existing application)

Selected Clerk application ID: `app_3M7rLgiQ9RzSLgTahSb2Hdh3uMJ`

This repository already contains `clerk-auth.js` and `clerk-config.js`. **Do not run `clerk init`**, which could create or overwrite an application. The selected app must be verified as belonging to Cloud Collabo, not KENdiaspora, before linking.

## Host terminal steps (run in a local checkout, not in GitHub's web editor)

1. Check out branch `production-release-prep`.
2. Run `npx -y clerk@latest auth login` and sign in to the Clerk account containing the independent Cloud Collabo application.
3. Run `npx -y clerk@latest link --app app_3M7rLgiQ9RzSLgTahSb2Hdh3uMJ` **only after confirming this application is the independent Cloud Collabo application**.
4. For missing *development* keys only, run `npx -y clerk@latest env pull`. Never commit the resulting environment file.
5. Run `npx -y clerk@latest doctor`.
6. Verify sign-in/sign-up and sign-out locally, then on a staging URL.

## Production

- Use the selected app's production instance, not development `pk_test_` credentials.
- Configure `cloudcollabo.com` in Clerk and obtain a `pk_live_` publishable key. This public key may be set in `clerk-config.js` after domain validation.
- Never place `sk_live_`, `sk_test_`, or webhook secrets in browser JavaScript or GitHub.
- The existing site is a static Cloudflare Worker assets deployment. The Clerk CLI is not available inside GitHub's web editor and cannot be authenticated by merely opening Clerk Dashboard.
- Do not claim production functionality until protected server APIs, database persistence, and administrator authorization are implemented and tested.
