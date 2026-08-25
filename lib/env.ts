import { z } from "zod";

const publicSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.string().url(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1),
});

const serverSchema = publicSchema.extend({
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1).optional(),
  APP_URL: z.string().url().optional(),
  NHI_AI_PROVIDER: z.enum(["openai", "local"]).optional(),
  NHI_LOCAL_AI_BASE_URL: z.string().url().optional(),
  NHI_LOCAL_AI_MODEL: z.string().min(1).optional(),
  NHI_LOCAL_AI_API_KEY: z.string().min(1).optional(),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().min(1).optional(),
  LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
});

type EnvironmentInput = Record<string, string | undefined>;

const publicEnvironment: EnvironmentInput = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

export function getPublicEnv(input?: EnvironmentInput) {
  return publicSchema.parse(input ?? publicEnvironment);
}

export function getServerEnv(input: EnvironmentInput = process.env) {
  return serverSchema.parse(input);
}
