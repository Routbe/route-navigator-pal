# ALTCHA in plaats van Cloudflare Turnstile

## Doel
Elke botcontrole in ROUT draait voortaan volledig op eigen servers (proof-of-work), zonder Cloudflare of Google. Aanmelden, registreren, magic links en wachtwoordherstel worden geweigerd (400) zonder geldig bewijs. Voor mensen is er geen zichtbare puzzel: de browser lost het bewijs op de achtergrond op.

## Wat verandert er voor gebruikers
- Op het aanmeldscherm, de registratie en de aanvraag van een magic link verschijnt alleen een klein, rustig "Beveiligd · zonder tracking"-regeltje in de ROUT-stijl. Het bewijs is meestal klaar voordat iemand klaar is met typen.
- Dezelfde controle vervangt Turnstile ook bij claim, onboarding, donaties, contact-, boekings- en nieuwsbriefformulieren. Daardoor blijft er geen externe botdienst meer over.

## Aanpak
1. **Eigen uitdagingen.** Een server-functie maakt een ALTCHA-uitdaging (SHA-256, willekeurig getal, getekend met HMAC). Die is 5 minuten geldig en verwijst naar een eigen geheim `ALTCHA_HMAC_KEY`. Er zijn geen externe aanroepen.
2. **Eenmalig gebruik.** Een nieuwe tabel `altcha_used` (db/54) slaat de handtekening van elk verbruikt bewijs op. Daardoor kan een bewijs niet opnieuw worden ingezet. Een cronjob wist verlopen regels.
3. **Afdwingen in de inlogketen.** In de bestaande auth-handler (`api_/auth/$.ts`) moeten deze paden een geldig bewijs in de header `x-altcha` meesturen: `/sign-up/email`, `/sign-in/email`, `/sign-in/magic-link`, `/forget-password` en `/request-password-reset`. Zonder geldig bewijs volgt `400 { code: "altcha_invalid" }`, nog vóór Better Auth draait. Er wordt dus geen mail via Brevo verstuurd en er wordt geen gebruiker aangemaakt. Social- en OAuth-callbacks blijven vrij, omdat die al door de provider beschermd zijn.
4. **Widget.** Het open-source pakket `altcha` (webcomponent, zelf meegebundeld, niet via een CDN) staat in een `<Altcha>`-component met automatische start (`auto="onload"`), verborgen standaardstijl en ROUT-design-tokens. Een web worker houdt het scherm vloeiend.
5. **Moeilijkheid.** `maxnumber` staat standaard op 50.000: dat is ongeveer 50–150 ms op een telefoon en duur voor bulkscripts. Na drie mislukte pogingen voor hetzelfde e-mailadres, gemeten met de bestaande `signin_throttle`, stijgt de moeilijkheid naar 500.000. Dat combineert proof-of-work met de bestaande beperking op pogingen.
6. **Turnstile verwijderen.** `Turnstile.tsx` en `turnstile.server.ts` worden geschrapt. `assertHuman` gaat in alle zes server-functies over op `verifyAltcha`. `VITE_TURNSTILE_SITE_KEY` en `TURNSTILE_SECRET_KEY` verdwijnen uit ENVIRONMENT.md en .env.example.
7. **Robuustheid.** Ontbreekt `ALTCHA_HMAC_KEY`, dan valt de server terug op een sleutel die is afgeleid van `BETTER_AUTH_SECRET`. Zo kan een ontbrekende variabele het inloggen nooit blokkeren. Een mislukte aanmaak van een uitdaging toont "probeer opnieuw" en laat de knoppen werken.

## Technische details
- Nieuwe bestanden: `src/lib/altcha.server.ts` (create/verify/replay), `src/lib/altcha.functions.ts` (`getAltchaChallenge`), `src/components/Altcha.tsx`, `db/54_altcha_replay.sql`, `src/routes/api_.public.cron.purge-altcha.ts`.
- Wijzigingen: `api_/auth/$.ts` (guard), `AuthNeon.tsx` en `auth-client` (header `x-altcha` via `fetchOptions`), Claim, Onboarding, Donate en de profielwidgets, zes `*.functions.ts`-bestanden, ENVIRONMENT.md en AGENTS.md (regel: botcontrole uitsluitend via eigen ALTCHA).
- Geheim: `ALTCHA_HMAC_KEY`, wordt automatisch gegenereerd. De gebruiker hoeft niets in te vullen.
- Tests: ongeldig of ontbrekend bewijs → 400; hergebruikt bewijs → geweigerd; verlopen bewijs → geweigerd; geldig bewijs → door.

## Buiten scope
De andere pijlers uit het eerdere document (OIDC-tokens, wijzigingen aan de providers) vallen hier buiten. Die volgen in een apart plan.
