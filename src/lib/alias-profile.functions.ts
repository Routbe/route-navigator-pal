import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth/middleware";
import { z } from "zod";

/**
 * RPC-laag voor het gratis aliasprofiel (`rout.be/u/<handle>`), dat volledig
 * los van het geverifieerde rootprofiel wordt beheerd.
 */

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type AliasProfileDTO = {
  username: string | null;
  displayName: string | null;
  tagline: string | null;
  avatarUrl: string | null;
  faviconUrl: string | null;
  theme: string;
  cardStyle: string;
  blocks: Json[];
  verified: boolean;
  status: string;
  verifiedLegalName: string | null;
  displayPrefs: Record<string, Json>;
  /** Is het gekoppelde account geverifieerd? (Aliaspagina blijft de gratis ruimte.) */
  ownerVerified: boolean;
  /** Roothandle van hetzelfde account, `null` zolang er geen verificatie is. */
  rootUsername: string | null;
  aliasHandle: string | null;
};

export const getAliasProfile = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { readAliasProfile, ensureFreeAliasProfile } = await import("./alias-profile.server");
    // Vangnet: elk account hoort een werkende gratis pagina te hebben.
    await ensureFreeAliasProfile(context.userId);
    const profile = await readAliasProfile(context.userId);
    return profile as AliasProfileDTO | null;
  });

export type SaveAliasProfileInput = {
  username: string;
  displayName?: string | null;
  tagline?: string | null;
  avatarUrl?: string | null;
  faviconUrl?: string | null;
  theme?: string | null;
  cardStyle?: string | null;
  blocks?: Json[];
  displayPrefs?: Record<string, Json> | null;
};

const jsonValueSchema = z.union([
  z.string().max(20_000),
  z.number().finite(),
  z.boolean(),
  z.null(),
]);
const jsonRecordSchema = z.record(z.string(), z.union([jsonValueSchema, z.array(jsonValueSchema).max(100)]));
const optionalUrlSchema = z
  .string()
  .trim()
  .max(2_000)
  .refine((value) => !value || value.startsWith("https://") || value.startsWith("data:image/"), "invalid_url")
  .nullable()
  .optional();
const saveAliasProfileSchema = z.strictObject({
  username: z.string().trim().min(1).max(60),
  displayName: z.string().trim().max(120).nullable().optional(),
  tagline: z.string().trim().max(240).nullable().optional(),
  avatarUrl: optionalUrlSchema,
  faviconUrl: optionalUrlSchema,
  theme: z.string().trim().min(1).max(40).nullable().optional(),
  cardStyle: z.string().trim().min(1).max(40).nullable().optional(),
  blocks: z.array(jsonRecordSchema).max(100).optional(),
  displayPrefs: jsonRecordSchema.nullable().optional(),
});
const handleSchema = z.strictObject({ handle: z.string().trim().min(1).max(60) });

function validateAliasProfile(input: unknown): SaveAliasProfileInput {
  return saveAliasProfileSchema.parse(input) as SaveAliasProfileInput;
}

function validateHandle(input: unknown): { handle: string } {
  return handleSchema.parse(input);
}

export const saveAliasProfile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(validateAliasProfile)
  .handler(async ({ data, context }) => {
    const { writeAliasProfile } = await import("./alias-profile.server");
    try {
      const profile = (await writeAliasProfile(context.userId, data)) as AliasProfileDTO;
      return { ok: true as const, profile, reason: null };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "save_failed";
      return { ok: false as const, profile: null, reason };
    }
  });

export const checkAliasHandle = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(validateHandle)
  .handler(async ({ data, context }) => {
    const { isAliasHandleFree } = await import("./alias-profile.server");
    return isAliasHandleFree(data.handle, context.userId);
  });

/** Publieke read voor de `/u/<handle>`-pagina's — geen auth nodig. */
export const getPublicAliasProfileByHandle = createServerFn({ method: "GET" })
  .inputValidator(validateHandle)
  .handler(async ({ data }) => {
    const { readPublicAliasProfile } = await import("./alias-profile.server");
    const row = await readPublicAliasProfile(data.handle);
    if (!row) return null;
    const { parseDisplayPrefs } = await import("./profile-display");
    const { redactPrivateProfile } = await import("./public-timeline");
    const prefs = parseDisplayPrefs((row as Record<string, unknown>)["display_prefs"]);
    return redactPrivateProfile(row as Record<string, unknown>, prefs) as Record<string, Json>;
  });
