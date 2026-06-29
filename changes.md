# Specific Login Failures And Lockout Behavior

This slice completes the agreed sign-in feedback and lockout behavior for `/auth/login`.

The behavior change is:

- login now returns distinct failures for unknown `Email Address`, incorrect password, and inactive `User`
- repeated failed attempts for the same normalized `Email Address` trigger a 15-minute lockout after 5 failures
- a successful sign-in clears the failed-attempt state for that `Email Address`
- the web sign-in flow surfaces the lockout response and keeps the user on `/sign-in`

If you are reviewing the patch, read it in this order.

## 1. Persistence seam

Start in:

- `apps/api/database/migrations/1782759000000_create_login_attempts_table.ts`
- `apps/api/app/models/login_attempt.ts`

This adds a small persistence seam for failed sign-in tracking:

- `email`
- `failure_count`
- `locked_until`

The important design choice is that tracking is per normalized `Email Address`, not per `User` record. That lets the lockout apply even when the email does not map to an existing user.

## 2. Auth service

Next read:

- `apps/api/app/modules/auth/auth_service.ts`

This file holds the actual sign-in policy.

Walk through `signIn(email, password)` in order:

1. Normalize the `Email Address`.
2. Load the matching `login_attempts` record, if one exists.
3. Short-circuit with `locked-out` when `locked_until` is still in the future.
4. Look up the `User`.
5. Return a specific failure for:
   - unknown email
   - inactive user
   - incorrect password
6. Record the failed attempt for each of those cases.
7. Clear the failed-attempt record on successful sign-in.
8. Create and return the bearer-token session as before.

The helper functions at the bottom are the core of the new state transition:

- `recordFailedLoginAttempt(...)` increments `failure_count` and sets `locked_until` once the threshold reaches 5
- `clearFailedLoginAttempt(...)` deletes the tracking row after a successful sign-in

This keeps the new behavior local to the auth module instead of spreading lockout rules across controllers or models.

## 3. Controller mapping

Then read:

- `apps/api/app/modules/auth/controllers/auth_controller.ts`

`login()` is still the HTTP boundary. The change here is translation, not policy.

The controller now maps auth-service outcomes to explicit HTTP responses:

- `email-not-found` -> `401 Email Address was not found.`
- `incorrect-password` -> `401 Password is incorrect.`
- `inactive-user` -> `401 User is inactive.`
- `locked-out` -> `429 Too many failed sign-in attempts. Try again in 15 minutes.`

That keeps HTTP concerns in the controller and the behavioral rules in the service.

## 4. API tests

Then review:

- `apps/api/tests/functional/auth/sign-in.spec.ts`

This is the main proof for the slice. The added tests cover:

1. specific failure messages
   - unknown `Email Address`
   - incorrect password
   - inactive `User`

2. lockout activation and expiry
   - 5 failed attempts still return the underlying auth failure
   - the next attempt returns `429`
   - the lockout lasts 15 minutes
   - sign-in works again after the lockout window expires

3. unknown-email lockout
   - repeated failures for a missing email also lock the same `Email Address`

4. reset-on-success
   - a successful sign-in clears previous failed-attempt state
   - the threshold starts over after success

One test detail worth noticing: these tests use `luxon` `Settings.now` so the lockout window can be exercised without introducing a deeper seam or waiting in real time.

## 5. Web behavior

Then move to:

- `apps/web/src/features/auth/sign-in-page.test.tsx`
- `apps/web/src/routes/-sign-in.test.tsx`

The web implementation already surfaced API `message` fields through the shared auth client, so this slice did not need production code changes in `apps/web`.

Instead, the tests prove the existing flow behaves correctly with the new API response:

- `sign-in-page.test.tsx` verifies the lockout message is rendered and no session is stored
- `-sign-in.test.tsx` verifies the user stays on `/sign-in` instead of navigating into the protected app

That is the end-to-end client behavior the issue asked for.

## 6. Verification

The narrow checks for this slice were:

- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH CI=true node ace.js test functional --files tests/functional/auth/sign-in.spec.ts`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH CI=true ./node_modules/.bin/vitest run src/features/auth/sign-in-page.test.tsx src/routes/-sign-in.test.tsx`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH CI=true ./node_modules/.bin/tsc --noEmit` in `apps/api`
- `env PATH=$HOME/.nvm/versions/node/v24.17.0/bin:$PATH CI=true ./node_modules/.bin/tsc -b --pretty false` in `apps/web`

## 7. What This Does Not Do

This patch stays narrow on purpose. It does not add:

- rate limiting for routes other than `/auth/login`
- captcha or secondary anti-abuse mechanisms
- generic auth-error messaging
- admin tooling for inspecting or clearing lockouts
- a broader auth refactor

It only implements the behavior in the issue: specific login failures, per-email lockout, and reset-after-success.

## 8. Technical Debt Follow-Ups

- The lockout contract currently depends on a raw message string (`Too many failed sign-in attempts. Try again in 15 minutes.`) that is duplicated across the API controller and web tests. A future wording change will force coordinated test rewrites instead of letting the client key off a stable auth error code.

- `apps/api/tests/functional/auth/sign-in.spec.ts` now carries sign-in success, session, logout, password-change, inactive-user, and lockout coverage in one large file. The slice is well covered, but continued growth here will increase merge-conflict risk and make future auth failures harder to localize.

- The change introduced formatter debt in `apps/api/tests/functional/auth/sign-in.spec.ts` in addition to the file’s pre-existing filename-case lint exception. The behavior is verified, but the file should be cleaned up with a formatter pass or targeted line wrapping before more auth cases land in the same spec.
