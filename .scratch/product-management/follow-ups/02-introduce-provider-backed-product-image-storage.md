# Introduce provider-backed Product image storage

Status: ready-for-agent

## Parent

- [Product Management PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/PRD.md)
- [04 - Add Product image upload and removal](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/04-add-product-image-upload-and-removal.md)
- [01 - Add Product image preview on the edit page](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/follow-ups/issues/01-add-product-image-preview-on-the-edit-page.md)

## What to build

Refactor Product image storage so the Product module no longer depends directly on local filesystem paths and file operations inside the Product service. The current image-upload slice proves the Product-page workflow, but it stores files with `app.makePath('tmp/product-images')`, `mkdir`, and `unlink`, which makes the Product module hard-wired to local disk storage. This follow-up should introduce a storage seam that can support a local provider now and a remote provider later, such as AWS S3, without changing Product-page behavior.

The goal is not to expand Product image scope. The Product should still support one optional primary image, upload should still happen from the Product page, and remove-to-empty behavior should stay the same. The change is architectural: make storage provider-backed and provider-swappable.

This issue intentionally stays separate from edit-page preview work. Preview is a user-facing Product-page enhancement, while provider-backed storage is an architectural seam change.

## Acceptance criteria

- [ ] Product image persistence no longer depends directly on local filesystem operations inside the Product service; image save/delete behavior goes through a dedicated storage seam or provider abstraction.
- [ ] The default local-development implementation preserves the current user-visible Product behavior: single-image upload, persisted image state on reload, and remove-to-empty from the Product page.
- [ ] The storage seam is prepared for a remote provider such as AWS S3 by separating provider-specific path and file operations from Product-domain logic, even if the first implementation still uses a local provider by default.
- [ ] Focused API and web tests continue verifying Product-page image behavior, and any new provider-facing unit or integration tests cover the storage seam where it now owns behavior.

## Out of scope

- Multiple Product images or galleries
- Changing the Product-page workflow
- Public CDN delivery, image transformations, or thumbnail generation
- Migrating existing saved images between providers
- Implementing full AWS infrastructure, bucket provisioning, or deployment automation unless a later issue explicitly asks for it
