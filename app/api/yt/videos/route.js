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
    if (!session?.accessToken) {
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

    const channelResponse = await fetch(channelUrl.toString(), {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!channelResponse.ok) {
      return Response.json(
        {
          error: "Failed to fetch channel",
          message: `YouTube API returned ${channelResponse.status}`,
        },
        { status: channelResponse.status },
      );
    }

    const channelData = await channelResponse.json();
    const uploadsPlaylistId =
      channelData?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;

    if (!uploadsPlaylistId) {
      return Response.json(
        { items: [] },
        {
          headers: {
            "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_S_MAX_AGE}`,
          },
        },
      );
    }

    // Step 2: Get videos from uploads playlist
    const playlistUrl = new URL(`${YOUTUBE_API_BASE}/playlistItems`);
    playlistUrl.searchParams.set("part", "snippet");
    playlistUrl.searchParams.set("playlistId", uploadsPlaylistId);
    playlistUrl.searchParams.set("maxResults", "20");

    const playlistResponse = await fetch(playlistUrl.toString(), {
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
      },
    });

    if (!playlistResponse.ok) {
      return Response.json(
        {
          error: "Failed to fetch videos",
          message: `YouTube API returned ${playlistResponse.status}`,
        },
        { status: playlistResponse.status },
      );
    }

    const playlistData = await playlistResponse.json();

    return Response.json(playlistData, {
      headers: {
        "Cache-Control": `public, max-age=${CACHE_MAX_AGE}, s-maxage=${CACHE_S_MAX_AGE}`,
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
