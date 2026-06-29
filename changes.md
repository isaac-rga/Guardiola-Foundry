# Password Change

This slice completes one authenticated password-change flow end to end.

The behavior change is:

- a signed-in `User` can submit `currentPassword` and `newPassword`
- `POST /auth/change-password` rejects a wrong current password
- `newPassword` must be at least 8 characters
- a successful password change revokes every active bearer token for that `User`
- after success, the `User` is sent back to sign-in and must authenticate with the new password

If you are reviewing the patch, read it in this order.

## 1. Shared contract

Start in:

- `packages/shared-types/src/index.ts`
- `packages/shared-validation/src/index.ts`

This adds:

- `ChangePasswordRequest`
- `changePasswordRequestSchema`

The request stays intentionally small:

- `currentPassword` is required
- `newPassword` is required and must be at least 8 characters

This is the seam that keeps the API and web app aligned. The API validates incoming requests with it, and the web form uses the same schema for client-side validation.

## 2. API route

Next read:

- `apps/api/start/routes.ts`

This adds:

- `POST /auth/change-password`

The route sits with the rest of the auth lifecycle under `/auth`, next to `login`, `logout`, and `me`.

## 3. API controller

Then read:

- `apps/api/app/modules/auth/controllers/auth_controller.ts`

`changePassword()` is the HTTP boundary. It does four things in order:

1. Extract the bearer token from the `Authorization` header.
2. Return `401` if the request is unauthenticated.
3. Validate the body with `changePasswordRequestSchema` and return `422` on schema failure.
4. Delegate to the auth service and translate the result into HTTP responses.

The service result mapping is:

- `invalid-session` -> `401 Unauthorized`
- `incorrect-current-password` -> `401 Current password is incorrect.`
- `changed` -> `204 No Content`

That keeps transport concerns in the controller and auth state changes in the service.

## 4. API service logic

Then read:

- `apps/api/app/modules/auth/auth_service.ts`

The new function is `changePassword(token, currentPassword, newPassword)`.

Walk through it in order:

1. Look up the current access token by its hash.
2. Reject expired or revoked tokens.
3. Load the `User` for that token.
4. Verify `currentPassword` against the stored password hash.
5. Save the new password.
6. Revoke all non-revoked access tokens for that user.

This is the key behavior change in the slice:

- `logout` still revokes only the presented token
- `change-password` revokes every active token for the user

That is what forces all old sessions to stop working immediately after a password change.

## 5. Web API client

Then move to:

- `apps/web/src/lib/api/auth.ts`

This adds `changePasswordCurrentSession(token, payload)`.

It is deliberately parallel to the existing auth helpers:

- it sends `POST /auth/change-password`
- it includes the bearer token
- it validates the outgoing payload with the shared schema
- it converts API failures into user-facing errors

This keeps request/response handling out of the route and page components.

## 6. Protected route flow

Next read:

- `apps/web/src/routes/app.tsx`

This route already owned the authenticated session and logout flow. It now owns password change too.

`handleChangePassword()`:

1. sets a pending state
2. clears the previous password-change error
3. calls `changePasswordCurrentSession(session.token, payload)`
4. clears stored auth session data on success
5. navigates back to `/sign-in`
6. keeps the user on `/app` and shows the error on failure

This keeps the async control flow close to the route loader that already provides the session token.

## 7. Protected page UI

Then read:

- `apps/web/src/features/auth/protected-app-page.tsx`

The page now renders a small password-change form inside the authenticated area:

- current password input
- new password input
- shared-schema validation messages
- API error message
- loading state on submit

The component still stays mostly presentational. It receives the async state and handler from the route:

- `isChangingPassword`
- `changePasswordError`
- `onChangePassword`

One small implementation detail is worth noticing: the form only resets after a successful password change. On failure, the values remain in place so the user can correct and retry.

## 8. API tests

Then review:

- `apps/api/tests/functional/auth/sign-in.spec.ts`

The added API tests cover the public behavior:

1. success path
   - sign in twice
   - change password with one token
   - verify both old tokens stop working
   - verify the old password no longer signs in
   - verify the new password does sign in

2. incorrect current password
   - returns `401`
   - leaves the existing password usable

3. invalid new password
   - returns `422`
   - enforces the shared 8-character minimum

These stay at the HTTP boundary instead of testing internal implementation details.

## 9. Web tests

Finally review:

- `apps/web/src/routes/-app.test.tsx`

The added route tests cover the user-visible behavior:

1. successful password change
   - submits the form
   - calls `POST /auth/change-password`
   - clears stored session state
   - returns to `/sign-in`

2. incorrect current password
   - shows the API error
   - keeps the user on `/app`
   - keeps the stored session intact

3. too-short new password
   - fails client-side validation
   - never calls the password-change endpoint

## 10. Verification

The narrow checks for this slice were:

- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH CI=true node ace.js test functional --files tests/functional/auth/sign-in.spec.ts`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/vitest run src/routes/-app.test.tsx`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/tsc --noEmit` in `apps/api`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH ./node_modules/.bin/tsc -b --pretty false` in `apps/web`

One repo-specific note: because the apps import `@guardiola-foundry/shared-types` and `@guardiola-foundry/shared-validation` through their package entrypoints, the shared package `dist/` outputs had to be rebuilt after adding the new request type and schema.

## 11. What this does not do

This patch stays narrow on purpose. It does not add:

- password recovery
- password strength scoring beyond the 8-character minimum
- a separate account settings route
- refresh-token behavior
- a broader auth architecture rewrite

That keeps the diff tied to the issue: one complete `Password Change` path.
