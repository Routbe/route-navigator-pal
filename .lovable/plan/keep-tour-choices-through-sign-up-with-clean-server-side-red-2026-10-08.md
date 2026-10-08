# Keep tour choices through sign-up, with clean server-side redirects

## What is broken today
When someone finishes the tour (from the About page), the last step sends them to the sign-in page. Their choices are already saved on the server under an anonymous code, but the sign-in page then ignores where it should return to. Google and magic-link sign-ins always land on `/dashboard`, so the saved username, theme, socials and so on never reach the new account. The anonymous code also travels in the address bar (`?draft=...`), and if the magic link is opened on another device, the choices are lost completely.

A server landing step (`/auth/continue`) that could copy the choices to the account already exists, but no sign-in method uses it.

## Step 0: Keys
The app can't sign anyone in without its keys. Before testing I'll open the secure form for the minimum set: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `BREVO_API_KEY`, `BREVO_SENDER_EMAIL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`. Random secrets the app creates for itself (`SESSION_SECRET`, `APP_SESSION_SECRET`, `MASTODON_STATE_SECRET`) will be generated automatically. Stripe, Scaleway and the others are optional for this task and I'll ask for them later.

## Step 1: Choices survive sign-up
- On the tour's last step ("register & log in"), a small server call stores two HttpOnly cookies: the draft code and where to go next (`/onboarding`). The draft code is never put in the address bar again.
- The magic-link email also carries the draft link, tied to the email address before the email is sent. If the link is opened on another device, the choices are still there.
- After sign-in, `/auth/continue` copies the draft to the account (by email), deletes the anonymous copy, and sends the user straight to `/onboarding`. That page loads the saved username and all other choices.
- Onboarding reads from the account's saved draft first. It falls back to this browser's copy only if needed.

## Step 2: Clean callbacks and zero-hop redirects
- Every sign-in method uses one return address: `/auth/continue`. That covers Google, GitHub, GitLab, Apple, Infomaniak, OIDC, magic link, Bluesky and Mastodon. Provider callbacks stay on their standard paths (`/api/auth/callback/<provider>`, `/api/auth/magic-link/verify`).
- `/auth/continue` checks the session on the server and answers with a single 303 redirect to the final page. There is no loading screen and no client-side bounce.
- Where to go after sign-in comes only from an HttpOnly cookie (checked to stay on this site), not from `?redirect=` in the URL. Old `?redirect=` links are turned into the cookie and then removed from the URL.
- The final page never shows `token`, `code`, `state`, `success`, `error` or `draft` in its address.

## Step 3: Clean errors
- Failures go to `/auth/sign-in?error=<code>`, using only a short fixed list of codes (provider_rejected, provider_not_configured, link_expired, state_mismatch, access_denied, session_missing). The sign-in page shows a friendly message for each code.
- Raw error details are logged on the server only.

## Step 4: Check it works
- Automated tests cover: the safe return-path rule, draft copy at `/auth/continue`, the error mapping, and URLs that must stay free of tokens.
- A browser walk-through: About → tour → last step → magic link. The user should land on `/onboarding` with their username and choices filled in, and a clean address bar.

## Technical details
- New server function `beginTourSignup` (in `tour-draft.functions.ts`): sets `rout_tour_draft` and `rout_next` (HttpOnly, Secure, SameSite=Lax, 1h).
- `AuthNeon.tsx`: `callbackURL = POST_AUTH_PATH` for social, oauth2 and magic link; `errorCallbackURL = /auth/sign-in`; and a server function that turns `?redirect=` into the cookie.
- The magic-link `sendMagicLink` hook in `better-auth.server.ts`: when the draft cookie is present, upsert the draft under the email at send time.
- The Bluesky and Mastodon callbacks end with a redirect to `/auth/continue`, not straight to their final page.
- `handlePostAuth`: also clear the draft cookie and delete the token row once the copy succeeds.
- Onboarding: drop the `?draft=` query read, and prefer `getMyTourDraft`.
- `AGENTS.md`: add a rule that every sign-in returns through `/auth/continue`, with the destination taken only from the HttpOnly cookie.
