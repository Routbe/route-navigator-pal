# Plan: opslag, vertalingen, pers, deel-voorbeelden

## 1. Logo's en merkbestanden naar Scaleway
- Press-kit-logo's, favicons-bron en deel-afbeeldingen uploaden naar de interne Scaleway-bucket (ROUT-assets, alleen admin schrijft).
- Publieke downloadlinks via een vaste ROUT-URL die doorverwijst naar Scaleway (zodat de bucket wisselen geen links breekt).
- Favicon/app-iconen blijven lokaal (browsers vragen ze direct op), de rest gaat naar Scaleway.
- Echte vector-SVG's maken van het konijn (geen ingesloten PNG).
- Ik vraag je via het beveiligde formulier: Scaleway access key, secret key, regio, endpoint, naam interne bucket en publieke bucket. Bestaande sleutels worden eerst gecontroleerd.

## 2. Ontdek-pagina afwerken
- Volledig vertaald (NL/EN/FR/DE): titel, tekst, knoppen, kruimelpad, menu-link "Ontdek".
- Filters (categorie: maker, bedrijf, artiest...) en zoekveld op naam.
- Lege staat wanneer er nog geen profielen gekozen zijn, met uitnodiging naar de rondleiding.
- Laadskelet en mooie hover/klik-animaties; kaarten tonen naam, korte bio, kleur en verificatiebadge.
- Zelfde vertaling op de home-teaser ("Echte profielen, echte mensen", "Ontdek meer profielen").

## 3. Vertaal-audit op elke pagina
- Script dat alle pagina's doorzoekt op vaste Nederlandse/Engelse tekst buiten de vertaalbestanden.
- Ontbrekende sleutels aanvullen in alle vier talen; lijst van gevonden plekken als controle.
- Controle dat elke e-mail een sjabloon in elke taal heeft (met terugval naar Engels).

## 4. Perspagina beter
- Hero met groot konijn en directe "Download alles (ZIP)".
- Logo-tegels op donker, licht en geblokt (transparantie zichtbaar), met kopieer-hex bij kleuren.
- Do's en don'ts (vrije ruimte, minimale grootte, niet vervormen/herkleuren).
- Typografie-sectie, standaardteksten (kort/lang) met kopieerknop in vier talen, contact voor pers, screenshots van de app.

## 5. Unieke deel-voorbeelden per pagina
Elke pagina krijgt een eigen afbeelding (1200x630), titel, tekst en kleur, per taal:

```text
Home       QR-code + konijn, donker met gouden accent
About      manifest-typografie, "Europese infrastructuur"
Ontdek     collage van profielkaarten, mint accent
Privacy    slot/schild, zero trackers, paars
Pers       logo op raster
Prijzen, Contact, Voorwaarden, Status, Self-hosting ... elk eigen kleur/motief
```
- Afbeeldingen gegenereerd en op Scaleway gezet, met absolute URL in de deel-tags.
- Ook `theme-color` per pagina (de kaderkleur in o.a. Discord/iMessage).

## 6. Deel-voorbeeld per gebruikersprofiel (bestaat al, wordt veel beter)
- Er bestaat al een automatische kaart per profiel; die wordt herontworpen:
  - avatar of logo groot, naam in hun gekozen lettertype, tagline, hun thema- en accentkleuren als achtergrond/verloop, verificatiebadge, rout.be/naam, klein ROUT-konijn.
  - Meerdere stijlen volgens hun thema (licht, donker, glas, minimal).
- Kaart wordt gecachet en vernieuwd zodra ze hun profiel aanpassen.
- In de Studio: live voorbeeld zoals op WhatsApp/X/LinkedIn, en eigen afbeelding uploaden (naar hun eigen map op Scaleway) in plaats van alleen een URL plakken; terugzetten naar automatisch kan altijd.

## Technische details
- `src/lib/storage/s3.server.ts` uitbreiden met een `brand/` prefix in de interne bucket + server route `/brand/<file>` met presigned/publieke redirect.
- `src/lib/social-meta.ts`: per-route kaartenregister `ROUTE_CARDS[route][locale]` met title/description/image/themeColor; elke route-`head()` gebruikt het.
- `api_.public.og.$handle.ts` + `src/lib/og-card.ts`: nieuwe SVG-layouts, fonts uit `public/fonts` ingesloten, PNG-render, cache-key met `updated_at`.
- Upload eigen OG-afbeelding via bestaande uploadpad onder `users/<uid>/og/`, metadata in `display_prefs.ogImageUrl`.
- i18n-sleutels in `src/locales/*.json`; audit-script in `/tmp`, niet in het project.
- Geen nieuwe database-tabellen nodig.
