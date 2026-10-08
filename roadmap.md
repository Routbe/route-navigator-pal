# ROUT — roadmap

## Klaar
- Gratis pagina bij registratie: elk account krijgt meteen `rout.be/u/<handle>`
  (gekozen naam of automatisch, bv. `jona4827`), met vangnet bij het openen van
  de Studio.
- Tweede pagina bij verificatie: gratis `/u/`-pagina blijft, geverifieerd
  profiel verhuist naar `voornaam.achternaam` (of de eerstvolgende vrije vorm).
- Roze influencerbadge + bedrijfsbetekenis voor de zwarte badge.
- Bedrijfsverificatie: aanvraagformulier (naam, rechtsvorm, btw, adres, domein)
  met manuele goedkeuring; pagina op de officiële domeinnaam.
- Influenceraanvraag: vier naamvoorkeuren + sociale kanalen, € 70 of gratis bij
  een geverifieerd account, goedkeuring in beheer (`/admin/verifications`).

## Openstaand (wacht op jou)
- Migratie `db/41_business_influencer.sql` één keer op de Neon-database
  uitvoeren (de app maakt de tabellen anders zelf aan bij het eerste gebruik).
- Betaling van € 70 voor influenceraanvragen koppelen aan de bestaande
  betaalketen; nu blijft zo'n aanvraag op "wacht op betaling" staan.

## Nieuw verzoek — veilig verder uitwerken
- [ ] Mastodon-login afronden en foutmeldingen tonen.
- [ ] Bestaande auth/build-problemen controleren zonder regressies.
- [ ] ROUT Developer Console en OAuth/OIDC-provider veilig ontwerpen en bouwen.
- [ ] Sovereign Wallet, credential-uitgifte en publiek tonen veilig ontwerpen en bouwen.

## Security- en profielaudit (okt 2026)
- [x] Alias-SSR en clientweergave lezen uitsluitend `alias_profiles`.
- [x] Ongeverifieerde profielen zijn geblokkeerd op de schone root-URL.
- [x] Verificatie en betaling staan uitsluitend in de vergrendelde Studio-tab.
- [x] Strikte serverschema's toegevoegd voor profiel-, alias- en metadatawrites.
- [x] Automatische promotie van het oudste account verwijderd.
- [ ] Eenmalige beheerderstoken, account-mergebeveiliging en logredactie afronden.
- [ ] Passkeys, TOTP, herstelcodes en herstelkanalen volledig aansluiten.
- [ ] Juridische inhoud, footer, Turnstile-contactflow en vier talen nalopen.
- [ ] Neon-schema read-only controleren (geblokkeerd door ontbrekende `DATABASE_URL`).

## Login & ontwikkelaars (okt 2026)
- [x] Preview-/lokale adressen vertrouwd, knoppen zonder sleutels verborgen, Neon Auth-pakket weg.
- [x] Browsertest: registreren, sessie, uitloggen, fout wachtwoord, Infomaniak-doorsturing.
- [ ] "Login met ROUT" volledige ronde testen met een geverifieerd testaccount.
- [ ] WhatsApp/Green-API schrappen; Telegram + sms als verificatie.
- [ ] Bestaande Telegram-fout oplossen; verificatiecontrole elke 2,5 s.
- [ ] Pagina 'Account beveiligen' afmaken + Telegram-webhook koppelen (Telegram-bot nodig).

## Login-knoppen & openbaar profiel (okt 2026)
- [x] Alle inlogknoppen altijd zichtbaar, melding bij ontbrekende sleutel.
- [x] Privacy & Openbaar Profiel: profiel aan/uit, tijdlijn aan/uit.
- [x] Openbare tijdlijn (badges + mijlpalen) op /u/alias en /handle.
- [x] Architectuurdocument identity broker (docs/identity-broker-architecture.md).
- [x] Migratie 43 uitgevoerd op Neon.
- [ ] Dezelfde sleutels in Vercel zetten (+ NITRO_PRESET=vercel) en redeployen (wacht op jou).

## Pers-kit, Fediverse-e-mailcode, Studio (okt 2026)
- [x] /press: logo's (SVG/PNG), kleuren, standaardtekst, perscontact; link in footer.
- [x] Bluesky/Mastodon: e-mailadres + 6-cijferige code vóór aanmaken/koppelen (max 3 pogingen, 15 min slot).
- [x] Infomaniak-logo (witte k op blauw).
- [x] Iconen: e-mail = envelop; eigen links = websitelogo of wereldbol; vCard met ingebedde foto.
- [x] Profielteksten NL/EN/FR met Engels als standaard; geen links in bio's.
- [x] Geboortedatum-pop-up vóór verificatieaanvragen.
- [x] db/45, 46, 48, 49, 50, 51 op Neon uitgevoerd (okt 2026).
- [ ] Google-geboortedatum (scope user.birthday.read) — wacht op jouw akkoord + Google-review.
- [ ] Geboortedatumcontrole ook vóór andere betaalde acties.

## Console en officiële press kit (okt 2026)
- [ ] Zelfstandige `/console` workspace met Quick Access en aparte API/MCP-pagina’s.
- [ ] Consumentennavigatie vervangen door één Developer Console-ingang.
- [ ] Favicon en press kit herstellen met het officiële vrijstaande konijn.
- [ ] Console- en pressroutes visueel en technisch controleren.

## Developer Console + Scaleway (okt 2026)
- [x] Neon gesynchroniseerd (db/45–51), console-velden + PKCE/testmodus/prompt=none in de OIDC-backend.
- [ ] Scaleway: 3 buckets (client/internal/default), profielfoto + tijdelijke QR-bestanden (expires_at) + opruimjob.
- [ ] Console-UI: één linkerzijbalk, app-pagina's (Dashboard, Publishing, Security, Advanced), Quick Start, Manifesto, beheer voor badge-aanvragen.
- [ ] Press kit-logo's laden niet + transparante favicon.

## Manifesto, Explore, rondleiding (okt 2026)
- [x] /about als manifest, /explore bento-galerij, link in header en footer.
- [x] Rondleidingkeuzes automatisch toegepast na inloggen (nieuwe accounts), tests.
- [ ] Resterende sleutels (Stripe, Scaleway, extra inlogproviders) — wacht op jou.

## Deel-afbeeldingen & merk (okt 2026)
- [ ] Altijd het officiële konijn (exact), nooit AI-varianten; ringen alleen waar gekozen.
- [ ] Meerdere afwisselende high-class deel-afbeeldingen per pagina.
- [ ] Ontdek-pagina vertalen + zoeken/filters; vertaal-audit.
- [ ] Perspagina verbeteren.
- [ ] Profielkaart per gebruiker in hun kleuren/lettertype/avatar.

## Logo & deel-kaarten (okt 2026, plan goedgekeurd)
- [x] Officieel konijn (upload met paarse/groene cirkels) als enige bron; nooit een ander konijn.
- [x] Deel-kaarten per pagina in code getekend (geen AI): ÉÉN per pagina per taal, geen rotatie (cache-vriendelijk).
- [x] Ontdek vertaald + zoeken/filter.
- [ ] Profielkaart herontwerp (volgende stap).
- [ ] Vertaal-audit alle pagina's + e-mailsjablonen.
- [ ] Perspagina vernieuwen.
- [x] Scaleway-, Neon- en auth-sleutels ingevuld.
