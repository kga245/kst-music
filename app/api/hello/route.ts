import { NextResponse } from "next/server";

export const runtime = "nodejs";

export function GET() {
  return NextResponse.json({
    message: "hello",
    service: "kst-music",
    timestamp: new Date().toISOString(),
  });
}
