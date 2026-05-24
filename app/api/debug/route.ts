import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    RUNNER_URL: process.env.RUNNER_URL ?? "NOT SET",
    NODE_ENV: process.env.NODE_ENV,
  });
}
