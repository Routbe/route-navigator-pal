# Environment Variables — wat je in Vercel moet instellen

> Vercel → Project → Settings → Environment Variables. Zet elke variabele aan voor **Production** (en Preview als je daar wilt testen). **Na elke wijziging opnieuw deployen** — Vercel leest nieuwe waarden pas bij een nieuwe deploy.
>
> Controle na deploy: open `https://rout.be/api/public/auth/providers?diagnose=1` — je ziet per login-provider welke **namen** ontbreken en de exacte callback-URL. Er worden nooit waarden getoond.

## 1. Basis (verplicht)

| Key | Verplicht | Wat / waar |
|---|---|---|
| `DATABASE_URL` | ja | Neon → Connection string (**pooled**) als rol **`rout_app`** (alleen lezen/schrijven van rijen, geen schemawijzigingen). Nooit `neondb_owner`. |
| `MIGRATION_URL` | alleen build/CI | Neon → Connection string (**direct**, zonder `-pooler`) als **`neondb_owner`**. Alleen voor `bun run db:migrate`; nooit als runtime-variabele beschikbaar maken. |
| `BETTER_AUTH_SECRET` | ja | Willekeurige tekst van **minstens 32 tekens** (`openssl rand -hex 32`). Zonder dit werkt Google/GitHub/e-mail-login niet. |
| `BETTER_AUTH_URL` | ja | `https://rout.be` (zonder `/` op het einde) — basis voor alle callback-URL's |
| `NEXT_PUBLIC_APP_URL` | aanbevolen | `https://rout.be` |
| `PUBLIC_SITE_URL` | aanbevolen | `https://rout.be` |
| `APP_SESSION_SECRET` | ja | Willekeurig, 32+ tekens (sessiecookie Bluesky/Mastodon) |
| `SESSION_SECRET` | ja | Willekeurig, 32+ tekens |
| `MASTODON_STATE_SECRET` | ja | Willekeurig, 32+ tekens |
| `NITRO_PRESET` | ja op Vercel | `vercel` (wordt ook automatisch gekozen als Vercel `VERCEL=1` zet) |

## 2. Login-providers (optioneel — knop werkt zodra beide sleutels er zijn)

| Provider | Keys | Callback-URL om in te vullen bij de provider |
|---|---|---|
| Google | `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET` (also accepted: `GOOGLE_OAUTH_CLIENT_ID/SECRET`, `AUTH_GOOGLE_ID/SECRET`) | `https://rout.be/api/auth/callback/google` |
| GitHub | `GITHUB_CLIENT_ID`, `GITHUB_CLIENT_SECRET` | `https://rout.be/api/auth/callback/github` |
| GitLab | `GITLAB_CLIENT_ID`, `GITLAB_CLIENT_SECRET`, optioneel `GITLAB_ISSUER` | `https://rout.be/api/auth/callback/gitlab` |
| Apple | `APPLE_CLIENT_ID`, `APPLE_CLIENT_SECRET`, optioneel `APPLE_APP_BUNDLE_IDENTIFIER` | `https://rout.be/api/auth/callback/apple` |
| Infomaniak | `INFOMANIAK_CLIENT_ID`, `INFOMANIAK_CLIENT_SECRET` | `https://rout.be/api/auth/oauth2/callback/infomaniak` |
| Eigen OIDC | `OIDC_CLIENT_ID`, `OIDC_CLIENT_SECRET`, `OIDC_DISCOVERY_URL` | `https://rout.be/api/auth/oauth2/callback/oidc` |
| Bluesky / Mastodon | geen sleutels nodig | — |

Alternatieve namen worden ook herkend (terugval): `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET`, `AUTH_GITHUB_ID`/`AUTH_GITHUB_SECRET`, `AUTH_GITLAB_*`, `AUTH_APPLE_*`, `AUTH_SECRET` (voor `BETTER_AUTH_SECRET`). Gebruik bij voorkeur de officiële namen hierboven.

## 3. E-mail

| Key | Verplicht | Wat |
|---|---|---|
| `BREVO_API_KEY` | ja | Brevo → SMTP & API → API keys |
| `BREVO_SENDER_EMAIL`, `BREVO_SENDER_NAME` | aanbevolen | Afzender |
| `BREVO_REPLY_TO_EMAIL`, `BREVO_ADMIN_EMAIL`, `BREVO_SMS_SENDER` | optioneel | |
| `EMAIL_FROM`, `ADMIN_EMAIL`, `CONTACT_ADMIN_EMAIL`, `OWNER_EMAILS` | optioneel | |
| `CONTACT_HASH_SALT` | aanbevolen | Willekeurig |
| `IMPROVMX_API_KEY` | optioneel | E-mailaliassen |
| `KCHAT_WEBHOOK_URL`, `KCHAT_USERNAME` | optioneel | Meldingen in kChat |

## 4. Betalingen

| Key | Wat |
|---|---|
| `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY` | Stripe |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe (publiek) |
| `BUNQ_API_KEY`, `BUNQ_ENV`, `BUNQ_OAUTH_CLIENT_ID`, `BUNQ_OAUTH_CLIENT_SECRET`, `BUNQ_PRIVATE_KEY`, `BUNQ_PUBLIC_KEY` | bunq |
| `BANKING_WEBHOOK_SECRET`, `BANKING_WEBHOOK_HMAC_SECRET` | Bank-webhook |
| `PAYMENT_BENEFICIARY`, `PIX_KEY`, `PIX_CITY`, `UPI_VPA` | QR-betalingen |
| `ROUT_COMPANY_NAME`, `ROUT_COMPANY_ADDRESS`, `ROUT_VAT_NUMBER`, `ROUT_BILLING_EMAIL` | Factuurgegevens |
| `PROMO_CODES` | optioneel |

## 5. Beveiliging & beheer

| Key | Wat |
|---|---|
| `ALTCHA_HMAC_KEY` | Eigen botcontrole (ALTCHA, server). Optioneel: ontbreekt hij, dan wordt een sleutel afgeleid van `BETTER_AUTH_SECRET`. |
| `ADMIN_BOOTSTRAP_TOKEN` | Eenmalige token om de eerste beheerder aan te maken |
| `LOVABLE_CRON_SECRET` | Beveiligt cron-aanroepen |
| `BOOKING_TOKEN_SECRET` | Boekingslinks |
| `ROUT_API_KEY` | Interne API |

## 6. Bestandsopslag — Scaleway Object Storage (fr-par)

| Key | Waarde / wat |
|---|---|
| `SCALEWAY_ACCESS_KEY`, `SCALEWAY_SECRET_KEY` | Scaleway → IAM → API keys (Object Storage) |
| `SCALEWAY_ENDPOINT` | `https://s3.fr-par.scw.cloud` |
| `SCALEWAY_REGION` | `fr-par` |
| `SCALEWAY_CLIENT_BUCKET` | `rout-client-storage-prod` — profielfoto's, app-media, tijdelijke QR-bestanden |
| `SCALEWAY_INTERNAL_BUCKET` | `rout-internal-prod` — perskit, officiële logo's (enkel beheerders) |
| `SCALEWAY_DEFAULT_BUCKET` | `rout-storage-prod` — algemene terugval |

Zonder sleutels vallen profielfoto's terug op Neon; QR-bestanden delen staat dan uit. Opruimen van verlopen QR-bestanden: cron `GET /api/public/cron/purge-shared-files` (dagelijks, header `x-cron-secret: LOVABLE_CRON_SECRET`).

## 7. Herstelkanalen (optioneel)

`TELEGRAM_BOT_TOKEN`, `SMS_GATEWAY_URL`, `SMS_GATEWAY_KEY`, `WHATSAPP_GATEWAY_URL`, `WHATSAPP_GATEWAY_KEY`.

## 8. "Login met ROUT" (ROUT als provider voor andere apps)

Alle variabelen voor die rol beginnen met `ROUT_PROVIDER_` en staan los van bovenstaande login-instellingen.

## Problemen?

- **"Deze inlogoptie is nog niet actief"** → de server ziet de twee sleutels van die provider niet. Controleer de exacte naam (hoofdletters!), of de variabele aan staat voor Production, en deploy opnieuw.
- **`redirect_uri_mismatch`** → de callback-URL in Google/GitHub moet exact overeenkomen met de tabel hierboven.
- **Fout "BETTER_AUTH_SECRET ontbreekt"** → korter dan 32 tekens of niet ingesteld.


## Login troubleshooting ("Authenticatie mislukt")
- Set `BETTER_AUTH_SECRET` (32+ random chars). Without it a fallback is derived from `SESSION_SECRET`/`OAUTH_STATE_SECRET`/`DATABASE_URL`, but changing those then logs everyone out.
- Set `BETTER_AUTH_URL` to the exact live domain (e.g. `https://rout.be`).
- Register `https://<domain>/api/auth/callback/<provider>` at Google/GitHub/GitLab/Apple (old `/api/public/auth/...` URLs no longer work).
- Provider key aliases: `<PROVIDER>_OAUTH_CLIENT_ID/SECRET`, `AUTH_<PROVIDER>_ID/SECRET`, `<PROVIDER>_ID/SECRET`.
- Check `/api/public/auth/providers?diagnose=1` for missing key names (never values) and callback URLs.


## Database-rollen (least privilege)

- **Runtime** (`DATABASE_URL`): rol `rout_app` — SELECT/INSERT/UPDATE/DELETE, geen DDL, geen rollenbeheer. Aangemaakt door `db/53_least_privilege.sql`. Wachtwoord zet je zelf in de Neon SQL-editor: `alter role rout_app with password '…';`
- **Migraties** (`MIGRATION_URL`): owner-rol, direct endpoint. `bun run db:migrate` draait `db/NN_*.sql` één keer per bestand (bijgehouden in `public.schema_migrations`) en weigert te starten als `MIGRATION_URL` gelijk is aan `DATABASE_URL`.
- Preview-deploys: eigen Neon-branch met eigen `DATABASE_URL`/`MIGRATION_URL`, nooit productie.
- Controle: admin → deployment status toont "Runtime database role".
