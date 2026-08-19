import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

type EnvironmentInput = Record<string, string | undefined>;

export function getPublicEnv(input: EnvironmentInput = process.env) {
  return publicSchema.parse(input);
}

export function getServerEnv(input: EnvironmentInput = process.env) {
  return serverSchema.parse(input);
}