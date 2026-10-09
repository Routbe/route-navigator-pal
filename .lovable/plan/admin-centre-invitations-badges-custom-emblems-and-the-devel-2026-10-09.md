# Admin centre, invitations, badges, custom emblems and the developer console

This comes on top of the Studio and trust plan that's already running. That plan stays on the roadmap; these are 5 new blocks, plus first fixing the security issues the scan just reported.

## What already exists (checked)
- **Admin:** an admin page with user search and the actions Suspend, Ban and Clean content (`listUsers`, `suspendProfile`, `setBan`, `cleanseProfileContent`). There is no separate `/admin/users` page and no group actions.
- **Invitations:** `rout.be/r/<handle>` already exists. The invite block is still on the Studio page itself. There is no `/r/u/<alias>` route.
- **Developer console:** a console with app pages (overview, credentials, scopes, redirects, security). There's no step-by-step wizard, no AI prompts and no log viewer.
- **Custom emblems:** no custom badges exist yet.

## Block 0: Security fixes first (from the scan)
- **Free subdomain tier:** members can no longer get the paid "lifetime" subdomain without paying. The server checks for a completed payment first.
- **Admin search fields:** in 5 places, typed text could change the search itself. That's now blocked.
- **Sign-in lock:** strangers can no longer lock someone else's account or see whether it's locked. This now goes through the server only.
- **Forwarding email:** the confirmation email can only go to an address you've verified, with a limit per day.
- **Link preview:** it can no longer reach internal addresses, and redirects are checked again.
- **Tour draft code:** always made with secure randomness, never guessable.
- **Preview customisation script:** only accepts messages from Lovable's own addresses.

## Block 1: Admin users page `/admin/users`
- Search by email, handle, name or account number. Filters: Active/Suspended, Paid/Unpaid, Free/Pro/VIP.
- Tick several users for group actions (Suspend, Unsuspend, Ban, Clean content), with a confirmation that shows how many accounts are affected.
- Each user card has these quick actions: "Verifieer & activeer", "Clear bio", "Reset avatar", "Upgrade naar hoofd-handle" (from rout.be/u/alias to rout.be/handle), a VIP switch for short names (3–4 letters), and a red "Danger zone" for bans.
- A "Vertrouwen" (trust) tab gathers verification requests, address documents (from phase 4) and the status of social link checks.
- Every action is recorded in the admin log. A new permission `manage_users` controls who can do this.

## Block 2: Invitations
- Remove the invite block from the Studio. Add a small "Uitnodigen" (invite) button at the top next to your profile menu. It opens a window with a copy button and your reward progress.
- The share text becomes: "Claim je soevereine digitale identiteit op ROUT via mijn uitnodiging: https://rout.be/r/jona.delplanche"
- A new link `rout.be/r/u/<alias>` for free alias profiles. Old `?ref=` links keep working and forward to the new links.

## Block 3: Badges
- **Blue tick vs privacy shield:** the blue tick shows your legal name and country; the privacy shield shows only "verified human". This is applied by the server, so no name ever leaks with the shield.
- **Exclusive badges:** the influencer (pink) and business badges only appear in your list after an admin has approved them.
- **Badge for your own site:**
  - A new copyable code snippet: a light SVG image that loads straight from the internet without needing a script, and follows the website's light/dark setting.
  - It's sharp at every size and has an alt text.
  - The old code keeps working.

## Block 4: Custom emblems (family crest, company logo)
- **New page `/admin/custom-badges`:**
  - All emblems in a grid. Create, edit or archive one, with a name, image and description.
  - Click an emblem to see everyone who has it. Type a handle to grant or remove it straight away.
- **On the admin users page:** give one or more emblems per user.
- **On the profile:** emblems appear next to the blue tick or privacy shield, never instead of it. Members can hide them themselves.

## Block 5: Developer console
- **New app as a 4-step wizard:**
  1. App info, logo and type. PKCE (a code-exchange safeguard) is set automatically for websites, single-page apps and mobile apps.
  2. ROUT extras in plain language: Account Auto-Discovery and Rich Identity.
  3. Scopes and redirect addresses.
  4. Launchpad: keys and tools.
- **AI Prompts:** a ready-made instruction for Cursor, Copilot or Lovable. It automatically includes your client_id, the discovery address and the chosen scopes, and explains the sign-in flow and which columns to add (`rout_id`, verified badges).
- **Database templates:** copyable SQL and Prisma examples for linking accounts and storing identity details.
- **Auth Logs:** a live log per app showing failed sign-in attempts (wrong redirect address, missing PKCE, expired code). Each shows the exact error and a solution in plain language, and logs are kept for 7 days.

## Order
Block 0, then 1, then 4, then 3, then 2, then 5. After each block: tests and a browser check. The open Studio and trust phases then continue.

## Open points
- The database connection details are still needed to test admin actions, emblems and auth logs end-to-end.
- Images for custom emblems go to the internal storage bucket. Existing storage keys are enough.

## Technical details
- `subdomain.server.ts`: `claimRootSubdomainFor` requires a paid `verification_payments`/Stripe row or an admin grant. Otherwise it returns `payment_required`.
- PostgREST `.or()` search: escape the search text (`,()%*\` and quotes), or switch to separate `ilike` filters with parameters, in `admin-moderation.server.ts`, `monitoring.server.ts`, `admin-ops.server.ts` and `contact-admin.server.ts`, including the VIP audit search.
- `signin-guard.functions.ts`: status and record only on the server side, from the auth route (`api_/auth/$.ts`) after a real sign-in attempt. The public functions are removed.
- `forwarding`: only send to verified addresses of the account itself, with a limit per day.
- `link-preview`: block private, loopback and link-local addresses (IPv4 and IPv6), check the DNS answer, allow at most 3 redirects and re-check each one.
- `tour-draft.ts`: only `crypto.getRandomValues`, no `Math.random` fallback.
- `public/lovable-customization.js`: exact origin allowlist instead of `includes("localhost")`.
- New migrations:
  - `db/58_custom_badges.sql`: `custom_badges` with id, slug, name, image_key, description and archived_at.
  - `db/59_user_custom_badges.sql`: user_id, badge_id, granted_by, granted_at and hidden.
  - `db/60_oauth_auth_logs.sql`: client_id, at, error_code, detail and request_meta (no tokens), with a cron purge after 7 days.
  - New permissions `manage_users` and `manage_badges` in the admin permission table.
- Routes: `_authenticated/admin.users.tsx`, `_authenticated/admin.custom-badges.tsx`, `_authenticated/admin.custom-badges.$id.tsx`, `r.u.$alias.tsx`, and `console.apps.new.tsx` (wizard). AI Prompts, Templates and Logs become tabs under `console.apps.$appId`.
- Badge snippet: `/api/public/badge/$handle.svg` with `prefers-color-scheme` in the SVG and `Cache-Control: public, max-age=3600, s-maxage=86400`.
- `AGENTS.md`: rules for custom emblems (only added on top, never replacing the verification mark) and the auth logs (never store tokens).
