import { NextResponse } from "next/server";
import { getRedis } from "@/lib/redis";

export async function GET() {
  const redis = getRedis();

  if (!redis) {
    return NextResponse.json(
      { ok: false, message: "Redis not configured" },
      { status: 500 },
    );
  }

  try {
    const pong = await redis.ping();
    return NextResponse.json({ ok: true, redis: pong || "PONG" });
  } catch (error) {
    return NextResponse.json(
      { ok: false, message: error.message },
      { status: 500 },
    );
  }
}
