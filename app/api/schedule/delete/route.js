import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import fs from "fs/promises";
import path from "path";
import { getRedis } from "@/lib/redis";

/**
 * API Route: Delete Schedule
 * DELETE /api/schedule/delete
 * Deletes a specific schedule by ID
 */
export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { scheduleId } = await request.json();
    if (!scheduleId) {
      return NextResponse.json(
        { error: "Missing scheduleId" },
        { status: 400 },
      );
    }

    const redis = getRedis();

    if (redis) {
      // Remove from Redis
      await redis.del(`schedule:${scheduleId}`);
      await redis.srem(`schedules:user:${session.userId}`, scheduleId);
      await redis.srem("schedules:all", scheduleId);

      return NextResponse.json({ success: true });
    }

    // Handle file-based deletion
    const schedulesFile = path.join(
      process.cwd(),
      "data",
      "schedules",
      `${session.userId}.json`,
    );

    try {
      const data = await fs.readFile(schedulesFile, "utf-8");
      let schedules = JSON.parse(data);

      // Mark as inactive instead of deleting (soft delete)
      schedules = schedules.map((item) =>
        item.id === scheduleId ? { ...item, active: false } : item,
      );

      await fs.writeFile(schedulesFile, JSON.stringify(schedules, null, 2));
    } catch (err) {
      // File doesn't exist
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: "Failed to delete schedule", details: error.message },
      { status: 500 },
    );
  }
}
