"use server";

import { z } from "zod";
import { requireSecurityContext } from "@/lib/security/context";
import { getAiProvider } from "@/lib/security/ai-provider";
import { analyseSecurityQuestion, checkAiRateLimit } from "@/lib/security/ai-orchestrator";
import type { AiResult } from "@/lib/security/ai-types";
import { logger } from "@/lib/logging/logger";

const inputSchema = z.object({ question: z.string().trim().min(3).max(1200) });
export async function askSecurityAnalyst(_previous: AiResult, formData: FormData): Promise<AiResult> {
  const parsed = inputSchema.safeParse({ question: formData.get("question") });
  if (!parsed.success) return { ok: false, configured: true, error: "Enter a question between 3 and 1,200 characters." };
  try {
    const context = await requireSecurityContext("view_security_data");
    if (!checkAiRateLimit(`${context.organisationId}:${context.userId}`)) return { ok: false, configured: true, error: "AI request limit reached. Wait one minute and try again." };
    const state = getAiProvider();
    if (!state.configured) return { ok: false, configured: false, error: `AI Security Analyst is not configured. ${state.reason}` };
    const started = Date.now(); const result = await analyseSecurityQuestion(parsed.data.question, context, state.provider);
    logger.info("ai_security_analysis_completed", { organisationId: context.organisationId, userId: context.userId, durationMs: Date.now() - started });
    return result;
  } catch (error) {
    logger.error("ai_security_analysis_failed", { errorType: error instanceof Error ? error.name : "unknown" });
    const invalid = error instanceof Error && error.message === "AI_PROVIDER_INVALID_RESPONSE";
    return { ok: false, configured: true, error: invalid ? "The AI service returned an invalid structured response, so no answer was shown. No action was performed." : "The AI service is unavailable or its model configuration is incomplete. NHI Shield remains available and no answer or action was fabricated." };
  }
}
