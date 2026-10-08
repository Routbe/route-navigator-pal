# Plan: Officieel logo overal, Scaleway-opslag, Ontdek, vertalingen, pers, deel-voorbeelden

## Wat er al bestaat (en wat er mis is)
- Deel-kaarten per pagina (`page-cards.ts`) en twee afbeeldingen per pagina in `public/og/*-a/b.jpg`. Die afbeeldingen zijn door AI gemaakt, en daarom staat er soms een ander konijn op dan het officiële logo. **Die gaan weg.**
- Een automatische deel-kaart per profiel bestaat al (`og-render.server.ts`, resvg).
- De officiële logobestanden staan in `public/press` (icoon, lockup, social-avatar met cirkels).

## 1. Eén bron voor het logo
- Eén vast logobestand wordt de enige bron: het officiële vectorpad uit `public/logo.svg`. Elke afbeelding, kaart, favicon en elk persbestand wordt daaruit gemaakt.
- Varianten verschillen alleen in kleur, achtergrond en wel of geen cirkels:
  - Site en favicon: konijn zonder cirkels.
  - Profielfoto op sociale media: konijn met cirkels, zoals `rout-social-avatar.svg`.
- Het konijn zelf verandert nooit. Een kleine test controleert dat elke kaart exact dat pad gebruikt.

## 2. Deel-voorbeelden per pagina: in code ontworpen, geen AI
- Alle kaarten (1200x630) worden in code getekend en daarna als afbeelding gemaakt: echte typografie, het echte logo en echte QR-codes. Geen gegenereerde foto's.
- Per pagina een eigen motief, kaderkleur (`theme-color`) en tekst in NL/EN/FR/DE:
  - Home: echte scanbare QR naar rout.be, donker met goud.
  - About: manifest-typografie, crème.
  - Ontdek: collage van echte uitgelichte profielkaarten, mint.
  - Privacy: schild uit lijnen, "0 trackers", diep paars.
  - Pers: logo op raster.
  - Prijzen, Contact, Voorwaarden, Status, Soevereiniteit en Self-hosting: elk een eigen kleur en motief.
- Per pagina 3 varianten die elkaar afwisselen, zodat het nooit saai wordt. De keuze blijft vast per taal en week, zodat caches stabiel blijven.
- Elke variant wordt één keer aangemaakt en op Scaleway gezet. In de deel-tags staat een absolute rout.be-link, die via `/brand/og/...` naar Scaleway doorverwijst.

## 3. Deel-voorbeeld per gebruikersprofiel (volledig herontwerp)
- Groot: hun avatar of logo, naam in hun gekozen lettertype, tagline en verificatiebadge. Hun thema- en accentkleuren vormen de achtergrond en het verloop, onderaan staat `rout.be/naam` en klein het officiële konijn.
- Vier layouts die passen bij hun thema: licht, donker, glas en minimal. Het gekozen thema bepaalt de layout.
- De kaart wordt opgeslagen en vernieuwd zodra ze hun profiel aanpassen.
- In de Studio:
  - een live voorbeeld zoals op WhatsApp, X en LinkedIn;
  - een eigen afbeelding uploaden (naar hun eigen map op Scaleway);
  - altijd terug kunnen naar automatisch.

## 4. Logo's en merkbestanden naar Scaleway
- Persbestanden, ZIP en deel-afbeeldingen gaan naar de interne bucket. Alleen een beheerder kan daar schrijven.
- Publieke links lopen via vaste rout.be-adressen, zodat een andere bucket kiezen geen links breekt.
- Favicon en app-iconen blijven lokaal.
- Eerst controleer ik welke sleutels er al zijn. Daarna vraag ik via het beveiligde formulier enkel de ontbrekende: `SCALEWAY_ACCESS_KEY`, `SCALEWAY_SECRET_KEY`, `SCALEWAY_REGION`, `SCALEWAY_ENDPOINT`, `SCALEWAY_INTERNAL_BUCKET` en `SCALEWAY_CLIENT_BUCKET`. Ook `DATABASE_URL` en `BETTER_AUTH_SECRET` zijn nodig om Ontdek en profielen echt te testen.

## 5. Ontdek-pagina afwerken
- Volledig vertaald: titel "Echte profielen, echte mensen.", tekst, knoppen, kruimelpad en menu-link.
- Filters per categorie (maker, bedrijf, artiest, ...) en zoeken op naam.
- Laadskelet, een nette lege staat met link naar de rondleiding, en subtiele animaties bij aanwijzen en klikken.
- Kaarten tonen de echte profielkleuren, avatar, korte bio en badge.
- Op de home-teaser komt dezelfde vertaling.

## 6. Vertaal- en sjablooncontrole op elke pagina
- Een script doorzoekt alle pagina's op vaste tekst die buiten de vertaalbestanden staat.
- Alles wat ontbreekt, vul ik aan in alle vier talen. Je krijgt de lijst met gevonden plekken.
- Ik controleer dat elke e-mail een sjabloon heeft in elke taal, met Engels als terugval.

## 7. Perspagina
- Bovenaan het officiële konijn groot, met de knop "Download alles (ZIP)".
- Logo-tegels op donker, licht en geblokt, met een kopieerknop voor elke kleurcode.
- Do's en don'ts: vrije ruimte, minimale grootte, niet vervormen, niet herkleuren en geen ander konijn.
- Typografie, korte en lange standaardteksten met kopieerknop in vier talen, een perscontact en echte screenshots van de app (geen AI).

## Technische details
- `src/lib/brand/logo-path.ts`: het officiële pad als constante. `og-render.server.ts` krijgt per pagina templates (SVG met ingesloten fonts uit `public/fonts`, resvg-wasm naar PNG). Er komt een admin-actie "deel-kaarten genereren", die uploadt naar `brand/og/<page>-<variant>-<locale>.png`.
- `page-cards.ts` krijgt `variants: string[]` en kiest een variant op basis van week en taal. `public/og/*.jpg` wordt verwijderd.
- Profielkaart: cache-key met `updated_at` en het thema. De upload gaat naar `users/<uid>/og/`, met metadata in `display_prefs.ogImageUrl`. De zichtbaarheid wordt op de server gecontroleerd, volgens de bestaande regel.
- Het audit-script staat in `/tmp`. De i18n-sleutels komen in de bestaande locale-bestanden.
- Er zijn geen nieuwe tabellen nodig. Het geheel blijft op Neon en Scaleway, volgens AGENTS.md.
