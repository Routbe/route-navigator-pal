# ROUT Studio and trust system: complete overhaul in 7 phases

All 14 requests plus the green/grey trust document, in a safe order. Each phase ends with tests and a check in the browser before the next one starts.

## What the code does today (checked)
- **Saving:** the Studio saves silently 0.5 s after each change. When an automatic save fails, nothing is shown (`if (silent) return`). That is a likely cause of lost changes.
- **Live profile:** every save goes straight to the public profile. There is no draft and no undo.
- **Large screens:** a "wide" option already exists (wider column plus two columns of links). The normal profile stays narrow (`max-w-md`) on a computer screen.
- **Frames and decorations:** two small pickers with a fixed list of options. No search, favourites or popular choices.

## Phase 1: Never lose a change (urgent)
- Every save shows its state at the top: "Opslaan…" (saving), "Opgeslagen ✓" (saved) or "Niet opgeslagen – opnieuw proberen" (not saved, try again), with an automatic retry.
- Changes are saved one at a time, so an older save can never overwrite a newer one.
- Before leaving the page with unsaved changes, you get a warning, and a local backup is restored.
- Check that every background, button, letter, footer and layout choice really goes into the saved data.

## Phase 2: Draft, Publish and undo
- The Studio always saves to a **draft**. Only the **Publiceren** (publish) button puts it on rout.be/handle. A **Wijzigingen weggooien** (discard changes) button restores the published version.
- A sticky bar at the top shows: Undo, Redo, save status and Publish. Ctrl+Z undoes, Ctrl+Y and Ctrl+Shift+Z redo. The history holds the last 100 steps; rapid typing counts as one step.
- Your current live profile becomes the first published version, so nothing changes for visitors.

## Phase 3: Tidy-up and social verification
- Remove **Primaire kanalen** from Basic info. Existing handles are moved automatically into Links & components.
- Remove the manual follower field and the floating "Totaal bereik" block. Follower counts only appear inside the card of each social link, only if they can be read from a public source. Profile views can be shown discreetly if switched on.
- Every social link row gets a shield next to its on/off switch: grey "Verifieer", green ✓ when verified, orange "Verificatie onderbroken op [datum]".
- After adding a social link, the verification pop-up opens. You can close it and verify later.
- A daily check confirms the rout.be link is still in the bio. If it's gone, the green check disappears.

## Phase 4: Green/grey marks and re-verification (from the uploaded document)
- **Green mark:** click it to see "Geverifieerd sinds [datum]" (verified since). **Grey mark:** "Toegevoegd sinds [datum]" (added since), with an explanation of how verification works. Used for identity, email, phone, address and social links.
- **Email:** re-check once a year with a sign-in link. After a grace period of 30 days, the mark goes from green to grey.
- **Phone:** re-check once a year with an SMS code. *This needs an SMS service; see open points.*
- **Address:** re-check every 2 years (adjustable up to 3). An address can be changed at most once every 6 months.
- **Proof of address:** upload a document. It's stored privately and visible only to you and the admin. The admin gets an email and sees it in a new "Adrescontrole" (address review) list.
  - **Approve:** the green mark goes live and you get an email.
  - **Correct:** the admin enters the right address, and you get an email to accept or reject it once. If you reject or don't respond within 14 days, you have to wait 6 months.
- Documents are deleted automatically 90 days after a decision.

## Phase 5: Studio styles, without the global "Custom mode"
- **Global "Custom mode" removed:** each section (Knopvorm, Knopstijl, Gloed, Typografie, Wallpaper, Achtergrondstijl, Banner) gets its own on/off switch and a ⚙ button with detailed controls.
  - **Buttons:** colour with code input, gradient direction, border thickness, shadow depth and blur.
  - **Glow:** size, strength, spread, direction and colour.
  - **Letters:** thickness, line height, spacing, shadow and glow layers.
- **Avatar frames and decorations:** 100+ in 8 groups (Cyber, Royal, Kawaii, Minimal, Nature, Dark Fantasy, Neon, Abstract, plus Gaming and Seasonal). A search field, sticky group buttons, a "Populair" (popular) row and favourites with a heart. Only the visible rows are drawn, and everything is built in code so it stays sharp.
- **Status dot:** pick an emoji or icon, optionally with no background or a thin outline.
- **Status bubble** replaces the status line under the location. It sits next to the avatar, in 4 styles (cloud, comic, neon, minimal). A ⚙ button controls colour, see-through amount, border, glow, letters, tail direction and how jagged the edge is.
- **Footer:** 50+ styles (hand-drawn, torn paper, leaves, stamp, scrolling text, pulsing neon, water, gradient wave, glass, retro shadow, cyber bar). Speed and colour stops are adjustable. Animations stop for visitors who switched off motion.
- **Background visit effects:** "Pagina bezoek effect" gets its own "Interactie & Bezoek FX" section. New effects: glitch, snow, autumn leaves, vignette pulse, digital sparks, plus the existing confetti and matrix.
- **Alignment:** the avatar, name, bio and status can be placed left, centre or right, with the avatar beside the text. Social icons get 4 positions: floating left, floating right, next to the bio, or a grid. On phones everything goes back to one column.

## Phase 6: Contact card and large screens
- **Contact opslaan** (save contact):
  - The button text follows the visitor's language (NL, EN, FR, ES, DE), and you can set your own text.
  - The card includes your photo, bio as a note, email, phone, organisation, social links and always your ROUT link, e.g. rout.be/jdelplanche.
  - The button takes its look from the general button style.
- **Large screens:** on a computer the profile gets a balanced width. Optionally, links show in 2 columns or as wide cards from 1024 px. Background effects fill the whole screen width.

## Phase 7: Final check
- Run every test and add new ones for: saving, draft/publish, undo, verification expiry, address waiting time, and the contact card.
- Check in the browser on a phone-sized and a computer-sized screen.
- Update the project notes.

## Open points (needed from you later, building does not wait for them)
- **SMS service for phone checks:** for example Twilio or MessageBird, with a key. Until then the phone mark stays grey with the note "binnenkort" (coming soon).
- **Database for testing:** `DATABASE_URL` and `MIGRATION_URL` are needed to test saving, publishing and verification end-to-end.

## Technical details
- New migrations, each written so it can safely run more than once:
  - `db/55_profile_drafts.sql`: `draft_blocks`, `draft_display_prefs`, `draft_theme`, `published_at` and a revision counter.
  - `db/56_trust_marks.sql`: `trust_marks`, with item_type, item_ref, status green/grey/broken, verified_at, added_at, expires_at and last_checked_at.
  - `db/57_address_verification.sql`: `address_submissions` with status pending/approved/corrected/rejected, corrected_address, decided_by, respond_by, locked_until, and a reference to the file in the S3 storage under `users/<uid>/`.
  - Social-link verification status is added to `trust_marks`.
- Saving: a queue with a revision number per save. A save with an outdated revision is refused (409), and the Studio then fetches the latest version first. Failures are shown and retried with growing pauses.
- History: `useStudioHistory` with past/present/future stacks over the full draft, grouping typing into one step after 400 ms, and shortcuts that are off while you type in a text field.
- Publish: `publishStudioProfile` copies the draft columns to the live columns in one transaction. The public profile pages only read the live columns.
- Cron routes: `cron/recheck-social-proofs` (daily), `cron/expire-trust-marks` (daily, sends re-check emails through `sendLocalizedEmail`) and `cron/purge-address-docs`.
- Address documents go to the client bucket with presigned upload. Admin access goes through the admin permission check (`db/28`), with a new permission `verify_addresses`.
- Frames, decorations and footers are defined as data (id, group, keywords, SVG/CSS generator) in `src/lib/decor/*`. Rows of the grid are only drawn when visible, using a simple viewport calculation (no new package). Favourites go into `display_prefs.favoriteDecor`; "popular" is counted from usage.
- Design settings get a version number with a translation step, so existing profiles keep their current look.
- `vcard.ts` gets locale tables, PHOTO (base64 or URI), NOTE, ORG, multiple URL lines and the ROUT URL as the first URL.
- `AGENTS.md`: add rules for draft/publish and trust marks.
