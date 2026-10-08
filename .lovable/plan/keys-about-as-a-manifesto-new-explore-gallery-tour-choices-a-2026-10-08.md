# Keys, About as a manifesto, new Explore gallery, tour choices applied automatically

## Step 0: Remaining keys
Open the secure form for: Stripe (`STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`), Scaleway (`SCALEWAY_ACCESS_KEY`, `SCALEWAY_SECRET_KEY`, bucket and region names from ENVIRONMENT.md), and the other sign-in providers (GitHub, GitLab, Apple, Infomaniak, Microsoft, OIDC). Every field is optional, so a provider you don't use can stay empty. Its button still shows, with a notice.

## Step 1: About becomes a clean manifesto (`/about`)
- Remove the phone frame and the profile carousel.
- Typography-led layout with lots of space and big headings. Four blocks: European infrastructure, zero trackers, privacy-first, sovereign identity. Then the trust badges row.
- Two calls to action at the bottom: "Take the tour" and "Explore profiles" (to `/explore`).
- Dark Obsidian flat style, using the existing colour tokens only.

## Step 2: New Explore gallery (`/explore`)
- Bento grid that uses the profiles you already pick in the admin "Live voorbeelden" tab, in the same order. The first card is large, the others mix wide and square tiles.
- Each card is a static snapshot: avatar, name, @handle, short bio, theme colours and the first few links. No phone frame.
- Clicking a card opens the real profile in a smooth modal with a "Open full profile" button. On mobile it goes straight to the profile page.
- Shows an empty state when you haven't picked any profiles in admin.
- Gets its own page title and description, plus a link in the header and footer.
- The home page keeps its current showcase. Tell me if that should move to Explore too.

## Step 3: Apply tour choices automatically after sign-in
Already in place: choices are saved on the server under an HttpOnly cookie before Google or the magic link. `/auth/continue` copies them to the account and sends one 303 with no tokens in the address bar.
Still missing: the user lands on onboarding and has to confirm.
- In `/auth/continue`, a new user with no username yet gets the saved username claimed right away (if it's still free), plus their theme, bio and socials saved to their profile. Then the cookie and the saved draft are removed and they go straight to their dashboard.
- If the username was taken in the meantime, they land on `/onboarding` with every other choice already applied and only the username left to pick.
- Existing members who sign in keep their profile. Their draft is discarded and never overwrites anything.

## Step 4: Check
- Tests: draft gets applied, a taken username falls back to onboarding, an existing member is not overwritten, the final address never contains tokens.
- Browser walk-through of `/about` and `/explore` (grid, modal, mobile).

## Technical details
- New `applyTourDraftToUser(userId, draft)` in `onboarding.server.ts`, reusing the existing claim and profile-save paths (case-insensitive unique handle). It is called from `handlePostAuth` and returns `applied | handle_taken | skipped`.
- Cookie names stay `rout_tour_draft` / `rout_next`. They are not renamed to `rout_onboarding_pending`, so existing links keep working.
- `/explore`: new `src/routes/explore.tsx`, loader using the existing showcase server function (`db/52`), and a `ProfileBentoCard` component. The modal uses shadcn Dialog.
- `About.tsx`: drop the `PhoneShowcase` import and rebuild the sections.
- AGENTS.md: record that the showcase list in admin feeds both the home page and `/explore`.
