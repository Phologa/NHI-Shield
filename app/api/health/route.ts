import { NextResponse } from "next/server";
import { randomUUID } from "node:crypto";

export function GET() { return NextResponse.json({ status: "ok", service: "nhi-shield", correlationId: randomUUID() }); }