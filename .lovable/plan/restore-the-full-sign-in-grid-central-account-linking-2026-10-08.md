# Restore the full sign-in grid + central Account Linking

## What the user will see

**Sign-in screen**
- One clean row of icon tiles: Google, GitHub, GitLab, Mastodon, Bluesky, Keycloak (own OIDC server) and Infomaniak, with the email (magic link) form below.
- The Bluesky name field no longer sits under the grid. Tapping Bluesky or Mastodon opens a small, focused popup to type your handle or server. The Mastodon popup keeps its server suggestions and the Bluesky popup keeps its quick suffix chips. The grid itself stays clean.
- Providers that don't have keys on the server yet still show. Tapping one shows the existing "not active yet" message, so no option is ever hidden.

**Settings → Linked identities**
- One list with every provider: Google, GitHub, GitLab, Mastodon, Bluesky, Keycloak and Infomaniak. Each row shows "Connected as …" with a Disconnect button, or a Connect button.
- Connecting brings you back to the same tab with a confirmation. Disconnecting is blocked when it would leave the account with no way to sign in (no email/password and no other linked provider).

## Technical details

- `src/pages/AuthNeon.tsx`
  - Expand `TILES` to google, github, gitlab, mastodon, bluesky, oidc (Keycloak mark from `BRAND_ICONS.keycloak`), infomaniak (existing `InfomaniakMark`). The grid is already `grid-cols-4 sm:grid-cols-7`.
  - Replace the inline Bluesky/Mastodon forms with a shadcn `Dialog` per provider. Keep the logic as is (`normalizeBlueskyHandle` → `/api/public/bluesky/start`, Mastodon instance → existing start). Social/OAuth flows stay exempt from ALTCHA.
- `src/components/settings/IdentitiesPanel.tsx`
  - Today it only links google/github through `/api/auth/<provider>?link=1`, which is not a Better Auth route. Replace this with a provider table driven by the same tile config, which moves to a shared `src/lib/auth-providers.ts` so the sign-in grid and the settings list stay in sync.
  - Google/GitHub/GitLab: `authClient.linkSocial({ provider, callbackURL: "/settings?tab=identities" })`. Keycloak/Infomaniak: `authClient.oauth2.link({ providerId, callbackURL })`.
  - Bluesky/Mastodon: the same popups, starting the existing flows with `mode=link`. Their callbacks already write to `user_identities` via `linkIdentity`. Verify that the link mode attaches to the current session instead of signing in, and add it where it's missing.
  - Disconnect: a new authenticated server function `unlinkIdentity` that removes the Better Auth account row or the `user_identities` row. It refuses with `last_sign_in_method` when this is the last way to sign in.
- Better Auth config: enable `account.accountLinking` (trusted providers: the configured social and generic providers) if it isn't already on, so linking a provider with a different email works for a signed-in user.
- Verification: open `/auth` with Playwright and confirm all 7 tiles appear and the popups open. Unit-test the `unlinkIdentity` last-method guard.

## Out of scope
- Adding real provider keys (GitHub, GitLab, Keycloak, Infomaniak). The tiles appear right away and become active as soon as the keys exist on Vercel.
