import { sql } from "@/lib/neon";

/**
 * Linked sign-in identities: fediverse rows in `public.user_identities` plus
 * Better Auth provider accounts in `neon_auth.account` (ids prefixed `ba:`).
 *
 * Multiple accounts per provider are supported — a member can attach both a
 * personal and a work Google account. Unlinking is refused when it would leave
 * the member without any way to sign in.
 */

export type IdentityRow = {
  id: string;
  provider: string;
  providerAccountId: string;
  email: string | null;
  displayName: string | null;
  avatarUrl: string | null;
  createdAt: string;
};

type Row = Record<string, unknown>;

async function listFediverse(userId: string): Promise<IdentityRow[]> {
  const rows = (await sql`
    select id, provider, provider_account_id, email, display_name, avatar_url, created_at
      from public.user_identities
     where user_id = ${userId}
     order by provider, created_at
  `) as Row[];
  return rows.map((r) => ({
    id: r["id"] as string,
    provider: r["provider"] as string,
    providerAccountId: r["provider_account_id"] as string,
    email: (r["email"] as string | null) ?? null,
    displayName: (r["display_name"] as string | null) ?? null,
    avatarUrl: (r["avatar_url"] as string | null) ?? null,
    createdAt: String(r["created_at"]),
  }));
}

/** Better Auth user id bridged onto this ROUT member (user_metadata.neon_auth_id). */
async function betterAuthId(userId: string): Promise<string | null> {
  const rows = (await sql`
    select user_metadata->>'neon_auth_id' as ba from public.users where id = ${userId} limit 1
  `) as Row[];
  return (rows[0]?.["ba"] as string | null) ?? null;
}

type BaAccount = { id: string; providerId: string; accountId: string; createdAt: string };

async function listBetterAuth(userId: string): Promise<BaAccount[]> {
  const ba = await betterAuthId(userId);
  if (!ba) return [];
  try {
    const rows = (await sql`
      select id, "providerId", "accountId", "createdAt"
        from neon_auth.account where "userId" = ${ba}
    `) as Row[];
    return rows.map((r) => ({
      id: String(r["id"]),
      providerId: String(r["providerId"]),
      accountId: String(r["accountId"]),
      createdAt: String(r["createdAt"]),
    }));
  } catch {
    return [];
  }
}

export async function listIdentities(userId: string): Promise<IdentityRow[]> {
  const [fedi, ba] = await Promise.all([listFediverse(userId), listBetterAuth(userId)]);
  const social = ba
    .filter((a) => a.providerId !== "credential")
    .map((a) => ({
      id: `ba:${a.id}`,
      provider: a.providerId,
      providerAccountId: a.accountId,
      email: null,
      displayName: null,
      avatarUrl: null,
      createdAt: a.createdAt,
    }));
  return [...social, ...fedi];
}

export async function hasPassword(userId: string): Promise<boolean> {
  const rows = (await sql`
    select password_hash is not null as has_password from public.users where id = ${userId} limit 1
  `) as Row[];
  if (rows[0]?.["has_password"] === true) return true;
  return (await listBetterAuth(userId)).some((a) => a.providerId === "credential");
}

/** Links a fediverse identity to a member; refuses one that belongs to someone else. */
export async function attachIdentity(input: {
  userId: string;
  provider: string;
  providerAccountId: string;
  displayName?: string | null;
}): Promise<{ ok: true } | { ok: false; reason: "taken" }> {
  const owner = (await sql`
    select user_id from public.user_identities
     where provider = ${input.provider} and provider_account_id = ${input.providerAccountId} limit 1
  `) as Row[];
  const current = owner[0]?.["user_id"] as string | undefined;
  if (current && current !== input.userId) return { ok: false, reason: "taken" };
  await linkIdentity(input);
  return { ok: true };
}

/** Idempotent upsert used by the OAuth callback for sign-in and for linking. */
export async function linkIdentity(input: {
  userId: string;
  provider: string;
  providerAccountId: string;
  email?: string | null;
  displayName?: string | null;
  avatarUrl?: string | null;
}) {
  await sql`
    insert into public.user_identities
      (user_id, provider, provider_account_id, email, display_name, avatar_url)
    values (${input.userId}, ${input.provider}, ${input.providerAccountId},
            ${input.email ?? null}, ${input.displayName ?? null}, ${input.avatarUrl ?? null})
    on conflict (provider, provider_account_id) do update
      set user_id = excluded.user_id,
          email = excluded.email,
          display_name = excluded.display_name,
          avatar_url = excluded.avatar_url
  `;
}

export async function unlinkIdentity(userId: string, identityId: string) {
  const identities = await listIdentities(userId);
  const target = identities.find((i) => i.id === identityId);
  if (!target) return { ok: false as const, reason: "not_found" as const };
  if (identities.length <= 1 && !(await hasPassword(userId))) {
    return { ok: false as const, reason: "last_method" as const };
  }
  if (identityId.startsWith("ba:")) {
    const ba = await betterAuthId(userId);
    if (!ba) return { ok: false as const, reason: "not_found" as const };
    await sql`delete from neon_auth.account where id = ${identityId.slice(3)} and "userId" = ${ba}`;
  } else {
    await sql`delete from public.user_identities where id = ${identityId} and user_id = ${userId}`;
  }
  return { ok: true as const };
}
