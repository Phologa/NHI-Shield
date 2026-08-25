import type { Role } from "@/lib/security/permissions";

export type AiRecordKind = "machine_identity" | "credential" | "resource" | "access_relationship" | "finding" | "evidence" | "incident" | "activity";
export type AiReference = { key: string; kind: AiRecordKind; id: string; label: string; route?: string };
export type AiAction = { label: string; href: string };
export type AiFact = { text: string; referenceKeys: string[] };
export type AiProviderAnswer = { interpretation: string; recommendations: string[] };
export type AiAnswer = { question: string; facts: AiFact[]; deterministicAssessment: AiFact[]; interpretation: string; recommendations: string[]; references: AiReference[]; actions: AiAction[]; limitations: string[] };
export type AiResult = { ok: boolean; configured: boolean; answer?: AiAnswer; error?: string };
export type AiRequestIdentity = { userId: string; organisationId: string; organisationName: string; role: Role };
