/**
 * YouTube Videos API Endpoint
 * GET /api/yt/videos
 *
 * Fetches the authenticated user's uploaded videos
 * Requires: Google OAuth with youtube.readonly scope
 *
 * Response: YouTube PlaylistItems API response with video metadata
 */

import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const YOUTUBE_API_BASE = "https://www.googleapis.com/youtube/v3";
const CACHE_MAX_AGE = 300; // 5 minutes client cache
const CACHE_S_MAX_AGE = 600; // 10 minutes CDN cache

/**
 * GET handler: Fetch authenticated user's videos
 */
export async function GET() {
  try {
    // Authenticate user
    const session = await getServerSession(authOptions);
    console.log("🔐 Session exists:", !!session);
    console.log("🔑 Access token exists:", !!session?.accessToken);
    console.log("👤 Session user email:", session?.user?.email);
    console.log("🆔 Session userId:", session?.userId);
    console.log(
      "🎫 Access token (first 20 chars):",
      session?.accessToken?.substring(0, 20) + "...",
    );

    if (!session?.accessToken) {
      console.error("❌ No access token in session");
      return Response.json(
        {
          error: "Unauthorized",
          message: "Please sign in to access your YouTube videos",
        },
        { status: 401 },
      );
    }

    // Step 1: Get user's channel and uploads playlist ID
    const channelUrl = new URL(`${YOUTUBE_API_BASE}/channels`);
    channelUrl.searchParams.set("part", "contentDetails");
    channelUrl.searchParams.set("mine", "true");

    console.log("📡 Fetching channel from YouTube API...");
    const channelResponse = await fetch(channelUrl.toString(), {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    console.log("📺 Channel API status:", channelResponse.status);

    if (!channelResponse.ok) {
      const errorText = await channelResponse.text();
      console.error("❌ YouTube API Error:", errorText);
      return Response.json(
        {
          error: "Failed to fetch channel",
          message: `YouTube API returned ${channelResponse.status}`,
          details: errorText,
        },
        { status: channelResponse.status },
      );
    }

    const channelData = await channelResponse.json();
    console.log("📊 Channel data:", JSON.stringify(channelData, null, 2));
    console.log("🎯 Channel ID:", channelData?.items?.[0]?.id);
    const uploadsPlaylistId =
      channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    console.log("📂 Uploads playlist ID:", uploadsPlaylistId);

    if (!uploadsPlaylistId) {
      console.warn("⚠️ No uploads playlist found - returning empty array");
      return Response.json(
        { items: [] },
        {
          headers: {
            "Cache-Control": `private, max-age=${CACHE_MAX_AGE}`,
          },
        },
      );
    }

    // Step 2: Get videos from uploads playlist
    const playlistUrl = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
    playlistUrl.searchParams.set("part", "snippet");
    playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
    playlistUrl.searchParams.set("maxResults", "20");

    console.log("📡 Fetching videos from playlist...");
    const playlistResponse = await fetch(playlistUrl.toString(), {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    console.log("🎬 Playlist API status:", playlistResponse.status);

    if (!playlistResponse.ok) {
      const errorText = await playlistResponse.text();
      console.error("❌ Playlist API Error:", errorText);
      return Response.json(
        {
          error: "Failed to fetch videos",
          message: `YouTube API returned ${playlistResponse.status}`,
          details: errorText,
        },
        { status: playlistResponse.status },
      );
    }

    const playlistData = await playlistResponse.json();
    console.log("✅ Videos found:", playlistData?.items?.length || 0);

    return Response.json(playlistData, {
      headers: {
        "Cache-Control": `private, max-age=${CACHE_MAX_AGE}`,
      },
    });
  } catch (error) {
    console.error("Videos API error:", error);
    return Response.json(
      {
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      },
      { status: 500 },
    );
  }
}
