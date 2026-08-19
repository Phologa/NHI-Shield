import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";
import { getPublicEnv } from "@/lib/env";

export function GET() { const configured = (() => { try { getPublicEnv(); return true; } catch { return false; } })(); return NextResponse.json({ status: configured ? "ready" : "not_ready", checks: { configuration: configured }, correlationId: randomUUID() }, { status: configured ? 200 : 503 }); }