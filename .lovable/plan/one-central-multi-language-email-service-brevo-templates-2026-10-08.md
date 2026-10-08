# One central, multi-language email service (Brevo templates)

## Starting point
ROUT already has a central Brevo mailer that never throws, plus a verified table of Brevo template numbers per language (auth emails: nl #93, en #13, fr #14, de #15, shared fallback #21). The Better Auth magic-link hook skips both. It writes its own Dutch-only HTML, ignores the user's language, and fails the login request if the email can't be sent. This plan puts one small layer on top of what exists. No new packages and no database lookups.

## What gets built
1. **`sendLocalizedEmail({ to, type, locale, payload })`**: a new server-only module. `type` is a fixed list: `magic-link`, `verification`, `password-reset`, `email-change`, `welcome`.
2. **Built-in template table**: an in-memory map from type × language (nl, fr, en, de) to a Brevo template number. Each lookup is a plain object read. The numbers come from the existing verified table, so no template numbers are invented. If a translation is missing, it uses the English template. If English is missing too, it uses the global fallback (#21).
3. **Safe input handling**: anything other than nl/fr/en/de (empty, malformed, `"fr-BE"` gets trimmed to `fr`, unknown values) becomes `en`. An unknown type is logged and dropped, never thrown. The payload is limited to known fields (link, code, name), and those fields are length-capped.
4. **Non-blocking send**: the login response returns as soon as the email has been handed off. On Vercel the send is registered with the platform's built-in `waitUntil` (read from the runtime, no new package), so the function isn't stopped before Brevo answers. If that isn't available (the preview here, local dev), it falls back to awaiting the send with a 5-second timeout. Every failure is logged as `[email] dispatch failed` with the type, language and Brevo's response, and none of it is sent back to the browser.
5. **Better Auth cleanup**: the magic-link hook (and the email-verification hook, if one is enabled) only calls `sendLocalizedEmail`. The inline HTML and the hard error go. The user's language is read from the `rout_lang` cookie first, then the browser's language setting, defaulting to `en`. The tour-draft link added last time stays in place.

## Behaviour change to accept
Because sending no longer blocks login, the sign-in page can no longer show "we couldn't send the login email". The user always sees "check your inbox", and any delivery failures show up only in the server logs.

## Checks
- Unit tests: language cleanup (`nl`, `NL`, `fr-BE`, `xx`, empty, `undefined`), English fallback for a missing translation, an unknown type that doesn't throw, and a Brevo failure that doesn't throw.
- Send a real magic link from the preview to confirm it arrives in the right language.

## Technical details
- New `src/lib/email.server.ts`. The registry is built once at module load from `EMAIL_TEMPLATE_IDS` (`src/emails/template-ids.ts`) and stays type-safe (`Record<EmailType, Partial<Record<Locale, number>>>`). Sending goes through the existing `sendMail` (which never throws and handles the admin-alert cascade), so there is no second Brevo fetch.
- Brevo params are the same shape `mailAuthAction` already uses (`LINK`, `MAGIC_LINK`, `url`, `CODE`, `LANG`, ...) so the existing templates render unchanged.
- `waitUntil`: `globalThis[Symbol.for("@vercel/request-context")]?.get?.()?.waitUntil`, guarded. Otherwise `Promise.race` with a timeout.
- `better-auth.server.ts`: drop the `sendMail` import and the `APIError` throw from `sendMagicLink`, and read the locale from the `request` already in scope.
- `AGENTS.md`: add a rule that auth emails only go through `sendLocalizedEmail` (template numbers come from `template-ids.ts`, dispatch never blocks or throws).
