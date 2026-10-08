import { createServerFn } from "@tanstack/react-start";
import { requireAuth } from "@/lib/auth/middleware";
import { z } from "zod";

/**
 * Profile Hub Studio RPC layer.
 *
 * Authentication still comes from the managed auth provider (we only need the
 * user id), while every byte of profile content lives in our Neon Postgres
 * database in Frankfurt (see `src/lib/studio-profile.server.ts`).
 */

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };

export type StudioProfileDTO = {
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
  subdomainAlias: string | null;
  rootStatus: string | null;
  aliasHandle: string | null;
};

export const getStudioProfile = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { readStudioProfile } = await import("./studio-profile.server");
    const profile = await readStudioProfile(context.userId);
    return profile as StudioProfileDTO | null;
  });

export type SaveStudioProfileInput = {
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
const saveStudioProfileSchema = z.strictObject({
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

function validateStudioProfile(input: unknown): SaveStudioProfileInput {
  return saveStudioProfileSchema.parse(input) as SaveStudioProfileInput;
}

function validateHandle(input: unknown): { handle: string } {
  return handleSchema.parse(input);
}

function validateAnalyticsRange(input: unknown): { days?: number | null } {
  return z
    .strictObject({ days: z.number().int().min(1).max(3650).nullable().optional() })
    .parse(input);
}

export const saveStudioProfile = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(validateStudioProfile)
  .handler(async ({ data, context }) => {
    const { writeStudioProfile } = await import("./studio-profile.server");
    try {
      const profile = (await writeStudioProfile(context.userId, data)) as StudioProfileDTO;
      return { ok: true as const, profile, reason: null };
    } catch (error) {
      const reason = error instanceof Error ? error.message : "save_failed";
      return { ok: false as const, profile: null, reason };
    }
  });

export const checkStudioHandle = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(validateHandle)
  .handler(async ({ data, context }) => {
    const { isHandleFree } = await import("./studio-profile.server");
    return isHandleFree(data.handle, context.userId);
  });

export const getStudioAnalytics = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator(validateAnalyticsRange)
  .handler(async ({ data, context }) => {
    const { readStudioAnalytics } = await import("./studio-profile.server");
    return readStudioAnalytics(context.userId, data.days ?? null);
  });

/** Public read used by the /@handle profile pages — no auth required. */
export const getPublicProfileByHandle = createServerFn({ method: "GET" })
  .inputValidator(validateHandle)
  .handler(async ({ data }) => {
    const { readPublicProfile } = await import("./studio-profile.server");
    const row = await readPublicProfile(data.handle);
    if (!row) return null;
    const { parseDisplayPrefs } = await import("./profile-display");
    const { redactPrivateProfile } = await import("./public-timeline");
    const prefs = parseDisplayPrefs((row as Record<string, unknown>)["display_prefs"]);
    return redactPrivateProfile(row as Record<string, unknown>, prefs) as Record<string, Json>;
  });
