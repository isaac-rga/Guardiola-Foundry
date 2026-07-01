# Add Product image upload and removal

Status: ready-for-agent

## Parent

- [PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/PRD.md)

## What to build

Extend the Product page so a Product can optionally have one primary Product image managed through the app. This slice should keep image handling simple: upload one image file on the edit page, display the current image state there, and allow removing the image so the Product returns to a true no-image state.

## Acceptance criteria

- [ ] The Product page supports uploading a single primary image file for a Product without moving image handling into the create modal.
- [ ] A user can remove an existing Product image and return the Product to a no-image state.
- [ ] Focused API and web tests verify single-image upload, persisted image state on reload, and remove-to-empty behavior from the Product page.

## Blocked by

- [03 - Add the Product edit page with explicit save workflow](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/03-add-the-product-edit-page-with-explicit-save-workflow.md)
