# Database Hardening Plan — Neon least privilege

## 1. Auditresultaat: oude Supabase-rollen

Conclusie: de app gebruikt de rollen `anon`, `authenticated` en `service_role` nooit om in te loggen of om queries uit te voeren. Toch is de code er **niet 100% vrij van**. Je kunt ze dus niet blind droppen.

| Waar | Wat er gebeurt | Risico bij droppen |
|---|---|---|
| `db/00_compat.sql` | Maakt de 3 rollen aan, plus het `auth`-schema en `auth.uid()/role()/jwt()` | Opnieuw draaien maakt ze weer aan |
| `db/21, 22, 28, 29, 31, 32, 33, 49`, `db/sql/email_aliases.sql`, `short_link_rate_limit.sql` | `GRANT ... TO` en `CREATE POLICY ... TO` deze rollen | Een `DROP ROLE` faalt zolang er grants of policies aan hangen. Opnieuw draaien faalt als de rol ontbreekt (alleen 21 en 22 checken eerst of de rol bestaat) |
| `db/03`, `01_align` | `auth.users` is nu een compat-view over `public.users` | Kan blijven bestaan, staat los van de rollen |
| `src/lib/db/execute.server.ts` `executeRpc` | Zet `request.jwt.claim.sub`, zodat SQL-functies via `auth.uid()` de ingelogde gebruiker kennen | **Het `auth`-schema en `auth.uid()` moeten blijven** (alleen de rollen gaan weg) |
| `db/21`, `db/22` | Policies lezen `app.current_user_id` | Geen rol-afhankelijkheid |
| App-runtime (`better-auth.server.ts`, `@neondatabase/serverless`) | Alles via één `DATABASE_URL` (nu `neondb_owner`) | — |

**Belangrijkste valkuil:** de app draait nu als tabel-eigenaar. Daardoor worden de RLS-policies stil overgeslagen. Draait de app straks als `rout_app` (geen eigenaar), dan worden die policies wél actief. Ze staan alleen open voor `authenticated`/`service_role`, dus elke query op wallets, gift_cards, newsletter, admin_permissions, social_links, booking_requests en meer geeft dan **0 rijen of een permission error**. Productie zou dan breken.

Daarom kiezen we bewust: de toegangscontrole gebeurt server-side in de app. Dat is al zo: alle queries lopen via serverfuncties met sessiecontrole. We halen de Supabase-policies weg en geven `rout_app` `BYPASSRLS`. De beveiliging komt uit drie dingen: de app praat niet als eigenaar, er is geen DDL-recht en er is geen toegang tot rollen. Het alternatief is alle policies herschrijven naar `rout_app` met `app.current_user_id` voor elke query. Dat is een groot, risicovol project, en kan later per tabel.

## 2. Architectuur met twee rollen

```text
Vercel runtime  ──DATABASE_URL (pooled, rout_app)──►  DML only
Deploy/migrate  ──MIGRATION_URL (direct, neondb_owner)──►  DDL (db/NN_*.sql)
Neon console    ──neondb_owner──►  noodtoegang
```

- `neondb_owner` blijft eigenaar van alle objecten en wordt alleen gebruikt voor migraties.
- `rout_app` krijgt LOGIN, alleen DML op tabellen, USAGE/SELECT op sequences en EXECUTE op functies. Geen CREATE, geen eigendom, geen CREATEROLE/CREATEDB.
- Nieuwe tabellen uit latere migraties krijgen automatisch rechten via `ALTER DEFAULT PRIVILEGES` (die horen bij de rol die de tabel maakt, dus `neondb_owner`).

## 3. SQL-script (draaien als `neondb_owner`, in één transactie)

Stap 0, alleen lezen (live inventaris; ik draai dit eerst en pas het script aan op het resultaat):
```sql
select r.rolname, r.rolcanlogin, r.rolbypassrls from pg_roles r where r.rolname in ('anon','authenticated','service_role','rout_app','neondb_owner');
select schemaname, tablename, policyname, roles from pg_policies order by 1,2;
select current_user, (select count(*) from pg_tables where schemaname='public' and tableowner<>'neondb_owner') as foreign_owned;
```

Stap 1, hardening:
```sql
begin;

-- 1a. Supabase-policies weg (verwijzen naar de te droppen rollen)
do $$
declare p record;
begin
  for p in select schemaname, tablename, policyname from pg_policies
           where roles && array['anon','authenticated','service_role']::name[]
  loop
    execute format('drop policy %I on %I.%I', p.policyname, p.schemaname, p.tablename);
  end loop;
end $$;

-- 1b. Oude rollen leegmaken en droppen
do $$
declare r text;
begin
  foreach r in array array['anon','authenticated','service_role'] loop
    if exists (select 1 from pg_roles where rolname = r) then
      execute format('reassign owned by %I to neondb_owner', r);
      execute format('drop owned by %I', r);   -- verwijdert alle grants
      execute format('drop role %I', r);
    end if;
  end loop;
end $$;

-- 1c. PUBLIC dichtzetten
revoke all on schema public from public;
revoke create on schema public from public;
revoke all on all tables in schema public from public;
revoke all on all functions in schema public from public;
revoke all on schema auth from public;

-- 1d. Runtime-rol (wachtwoord stel jij in via de Neon-console, niet in chat/SQL)
do $$ begin
  if not exists (select 1 from pg_roles where rolname = 'rout_app') then
    create role rout_app login bypassrls nocreatedb nocreaterole noinherit;
  end if;
end $$;
alter role rout_app set statement_timeout = '15s';
alter role rout_app set idle_in_transaction_session_timeout = '30s';
alter role rout_app set search_path = public;

grant connect on database neondb to rout_app;
grant usage on schema public, auth to rout_app;
grant select, insert, update, delete on all tables in schema public to rout_app;
grant select on all tables in schema auth to rout_app;            -- compat-view
grant usage, select on all sequences in schema public to rout_app;
grant execute on all functions in schema public, auth to rout_app;

-- 1e. Toekomstige migraties (objecten aangemaakt door neondb_owner)
alter default privileges for role neondb_owner in schema public
  grant select, insert, update, delete on tables to rout_app;
alter default privileges for role neondb_owner in schema public
  grant usage, select on sequences to rout_app;
alter default privileges for role neondb_owner in schema public
  grant execute on functions to rout_app;

commit;
```

Randgevallen in het script:
- **SECURITY DEFINER-functies** blijven als eigenaar draaien, dus bewust gedrag blijft werken. We zetten wel `search_path` vast op elke definer-functie (lijst uit stap 0).
- **TRUNCATE en migraties-op-runtime:** stap 2 controleert of de code `truncate`, `create`, `alter` of Better Auth auto-migrate gebruikt tijdens runtime. Zo ja, dan wordt dat naar het migratiescript verplaatst.
- **Tabellen met een andere eigenaar** (`foreign_owned > 0`) krijgen eerst `alter table ... owner to neondb_owner`.
- Neon geeft `BYPASSRLS` alleen via een rol met `neon_superuser`. Lukt dat niet, dan maak ik de rol aan via de Neon-console en draai ik de rest als SQL.

## 4. Codewijzigingen (na jouw akkoord)

1. Nieuwe migratie `db/53_least_privilege.sql`: het script hierboven, idempotent.
2. `db/00_compat.sql`: maakt geen rollen meer aan. Houdt alleen het `auth`-schema en de `auth.uid()`-helpers over.
3. Migraties 21, 22, 28, 29, 31, 32, 33, 49 en `db/sql/*`: alle `GRANT/POLICY ... TO anon|authenticated|service_role` zetten we achter een `if exists (select 1 from pg_roles ...)`-check. Zo kan een nieuwe database van nul worden opgebouwd. De geschiedenis blijft leesbaar.
4. Nieuw `scripts/migrate.ts`: draait `db/NN_*.sql` op volgorde via `MIGRATION_URL`. Houdt een `schema_migrations`-tabel bij met checksum, zodat elk bestand één keer draait. Weigert te starten als `MIGRATION_URL` ontbreekt of gelijk is aan `DATABASE_URL`.
5. `src/routes/api/claim-root.ts` en eventuele andere directe `neon(DATABASE_URL)`-aanroepen nakijken op DDL.
6. Een runtime-check in `deployment-status.server.ts`: waarschuwt in de admin als `current_user = neondb_owner`.
7. Test: `rout_app` mag geen `create table` doen en wel `select` op `public.users`.
8. `ENVIRONMENT.md`, `.env.example` en `AGENTS.md` bijwerken met de regel over twee rollen.

## 5. Omgevingsvariabelen

| Variabele | Rol | Endpoint | Waar |
|---|---|---|---|
| `DATABASE_URL` | `rout_app` | **pooled** (`-pooler`) | Vercel Production + Preview runtime |
| `MIGRATION_URL` | `neondb_owner` | **direct** (zonder pooler; DDL en transacties) | Alleen Vercel build/CI-secret of lokaal. **Nooit** beschikbaar voor serverfuncties |
| `DIRECT_URL` | niet gebruikt | — | Geen Prisma, dus we kiezen één naam: `MIGRATION_URL` |

- Migraties draaien vóór de deploy (`bun scripts/migrate.ts` in de Vercel build command of een GitHub Action). Faalt de migratie, dan faalt de deploy.
- Preview-deploys wijzen naar een **Neon-branch**, met een eigen `rout_app` en `MIGRATION_URL`. Nooit naar productie.
- Rotatie: eerst het `rout_app`-wachtwoord in Neon wijzigen, dan `DATABASE_URL` in Vercel, dan redeployen. Het eigenaarswachtwoord wordt daarna ook geroteerd, omdat het al in de runtime heeft gestaan.

## 6. Volgorde van uitvoering (geen downtime)

1. Inventaris uit stap 0 draaien (alleen lezen).
2. Migratie 53 draaien met de eigenaar.
3. Jij stelt het `rout_app`-wachtwoord in via de Neon-console. Ik test de belangrijkste pagina's (inloggen, profiel, wallet, admin) op een Neon-branch met `rout_app`.
4. Productie `DATABASE_URL` omzetten naar `rout_app`, redeployen en monitoren.
5. Daarna het `neondb_owner`-wachtwoord roteren en die waarde alleen in `MIGRATION_URL` zetten.

## Wat ik van jou nodig heb

- Een **Neon API key is niet nodig**. Alles hierboven is gewone SQL. Wat wel nodig is:
  - de huidige `DATABASE_URL` (eigenaar), die al als secret aanwezig is, voor de inventaris en de migratie;
  - straks een nieuw secret `MIGRATION_URL`, dat ik via het beveiligde formulier opvraag;
  - het `rout_app`-wachtwoord, dat jij zelf kiest in de Neon-console, met daarna de nieuwe connection string als `DATABASE_URL`.
