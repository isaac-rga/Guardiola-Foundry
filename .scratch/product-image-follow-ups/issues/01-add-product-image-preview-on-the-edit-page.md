# Add Product image preview on the edit page

Status: ready-for-agent

## Parent

- [Product Management PRD](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/PRD.md)
- [04 - Add Product image upload and removal](/Users/isaacruiz/Development/gub/Guardiola-Foundry/.scratch/product-management/issues/04-add-product-image-upload-and-removal.md)

## What to build

Extend the Product edit page so Product image handling is easier to understand visually. The current Product image slice shows saved-image state as text only. This follow-up should add an actual image preview on the Product edit page for the single primary Product image, while keeping the current one-image scope and the existing explicit-save workflow intact.

The preview should help in both states that matter to the user:

- when the Product already has a saved image
- when the user selects a new image file before saving

The page should still make it clear when the Product has no image and when a selected image is only pending until `Save changes`.

## Acceptance criteria

- [ ] The Product edit page shows a preview for the currently saved primary Product image when one exists.
- [ ] The Product edit page shows a preview for a newly selected image file before save, so the user can verify what will be uploaded.
- [ ] The page still clearly distinguishes between saved image state, pending unsaved image selection, pending removal, and true no-image state.
- [ ] The existing single-image scope remains unchanged: no galleries, no multiple uploads, and no image handling added to the create modal.
- [ ] Focused web tests verify preview behavior for saved images, pending local selections, and remove-to-empty transitions from the Product page.

## Out of scope

- Multiple Product images or galleries
- Thumbnail support in the Product list
- Image cropping, rotation, or transformations
- Rich media metadata editing
- Provider-backed storage changes or AWS S3 integration
