# Complete publishing and permanent pictures setup

This release introduces an R2 bucket binding named `PROJECT_PICTURES` with bucket name `collabo-project-pictures`.

## Before deploying
1. In the **same Cloudflare account** as the `collabo` Worker, enable R2 if needed and create a private R2 bucket named **collabo-project-pictures**. Do not make the bucket public.
2. Verify the Worker has the existing production D1 binding `DB` pointing to `collabodb`. The `project_needs` table must exist. Apply `migrations/0003_role_applications_team_chat.sql` only through the backup-first repair workflow after configuring GitHub Actions Cloudflare credentials.
3. Deploy the updated Worker after the R2 bucket exists. A missing R2 bucket can cause deployment failure. Check the latest build logs.
4. Test publishing one **new** project with one role and one small picture. Verify the role in Explore and the image in Project details. Do not test by repeatedly republishing an existing project.
5. For existing projects, open Collabo History → View and manage → Add or replace project picture. Restore roles using the owner-only role recovery form when no requirements exist.

## Guarantees and limitations
- Publishing with selected pictures is blocked if the Worker lacks the R2 binding.
- A client-generated UUID makes retries of the **same local draft** idempotent: a network failure after project creation should not create a second project on retry.
- Project and roles are written in one D1 batch. Images are uploaded after project creation; if a picture upload fails, the draft and pictures are retained and retry resumes with the same project ID. The listing can be visible before all pictures upload; this is not a cross-service atomic transaction.
- Existing duplicate listings are not automatically deleted. Review them manually.
- Only authenticated members can view pictures; only project owners can replace them. Max three pictures, 5 MB each, JPG/PNG/WebP.
- R2 incurs possible usage charges. Keep account credentials private.
