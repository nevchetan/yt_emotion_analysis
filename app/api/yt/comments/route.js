/**
 * YouTube Comments API Endpoint
 * GET /api/yt/comments?videoId={videoId}
 *
 * Fetches comments for a video and analyzes emotions
 * Returns paginated results with emotion data
 *
 * Response:
 * {
 *   comments: Array<{author, text, emotion, emotionScore, isML}>,
 *   total: number (total comments available),
 *   analyzed: number (comments analyzed),
 *   hasMore: boolean (pagination flag)
 * }
 */

import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";
import { analyzeEmotionsBatch } from "@/lib/hf";

const YOUTUBE_API_BASE = "https://youtube.googleapis.com/youtube/v3";
const CACHE_MAX_AGE = 300; // 5 minutes client cache
const CONCURRENCY = 4; // Parallel emotion analysis requests

/**
 * Helper: Extract comment text from YouTube API response
 */
function extractCommentText(snippet) {
  // Prefer textOriginal to preserve emojis and formatting
  return snippet?.textOriginal || snippet?.textDisplay || "";
}

/**
 * GET handler: Fetch and analyze comments
 */
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const videoId = searchParams.get("videoId");

  // Validate input
  if (!videoId) {
    return new Response(
      JSON.stringify({
        error: "Missing videoId",
        message: "videoId query parameter is required",
      }),
      {
        status: 400,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  // Authenticate user
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Please sign in to access YouTube data",
      }),
      {
        status: 401,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    // Fetch video details (title, etc.) for metadata
    const videoUrl = new URL(`${YOUTUBE_API_BASE}/videos`);
    videoUrl.searchParams.set("part", "snippet");
    videoUrl.searchParams.set("id", videoId);

    const videoResponse = await fetch(videoUrl.toString(), {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    let videoTitle = "";
    if (videoResponse.ok) {
      const videoData = await videoResponse.json();
      videoTitle = videoData.items?.[0]?.snippet?.title || "";
    }

    // Fetch comments from YouTube API
    const commentsUrl = new URL(`${YOUTUBE_API_BASE}/commentThreads`);
    commentsUrl.searchParams.set("part", "snippet");
    commentsUrl.searchParams.set("videoId", videoId);
    commentsUrl.searchParams.set("maxResults", "100");
    commentsUrl.searchParams.set("textFormat", "plainText");

    const commentsResponse = await fetch(commentsUrl.toString(), {
      headers: { Authorization: `Bearer ${session.accessToken}` },
    });

    if (!commentsResponse.ok) {
      const errorData = await commentsResponse.text();
      return new Response(
        JSON.stringify({
          error: "YouTube API Error",
          status: commentsResponse.status,
          message: `Failed to fetch comments: ${commentsResponse.statusText}`,
        }),
        {
          status: commentsResponse.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const commentsData = await commentsResponse.json();

    // Parse comments from response
    const allComments = (commentsData.items || []).map((item) => {
      const snippet = item.snippet?.topLevelComment?.snippet;
      const commentId = item.snippet?.topLevelComment?.id || item.id;
      return {
        author: snippet?.authorDisplayName || "Unknown",
        text: extractCommentText(snippet),
        commentId,
      };
    });

    if (allComments.length === 0) {
      return new Response(
        JSON.stringify({
          comments: [],
          total: 0,
          analyzed: 0,
          videoTitle: videoTitle,
        }),
        {
          status: 200,
          headers: {
            "Content-Type": "application/json",
            "Cache-Control": `private, max-age=${CACHE_MAX_AGE}`,
          },
        },
      );
    }

    // Analyze ALL comments for complete emotion data
    const commentTexts = allComments.map((c) => c.text);
    let emotionResults = [];

    // Performance monitoring - track analysis time
    const analysisStartTime = Date.now();

    try {
      emotionResults = await analyzeEmotionsBatch(commentTexts, CONCURRENCY);
    } catch (error) {
      return new Response(
        JSON.stringify({
          error: "Emotion Analysis Failed",
          message:
            "Could not analyze comment emotions. Ensure the local Python server is running or HUGGINGFACE_API_KEY is set.",
          details: error.message,
        }),
        {
          status: 500,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    // Calculate analysis performance metrics
    const analysisTime = Date.now() - analysisStartTime;
    const avgTimePerComment = Math.round(
      analysisTime / Math.max(commentTexts.length, 1),
    );

    // Log performance metrics for monitoring
    console.log(
      `[PERF] Analyzed ${commentTexts.length} comments in ${analysisTime}ms (avg ${avgTimePerComment}ms/comment, concurrency=${CONCURRENCY})`,
    );

    // Combine comments with emotion data
    const commentsWithEmotions = allComments.map((comment, index) => ({
      ...comment,
      emotion: emotionResults[index]?.label || "neutral",
      emotionScore: emotionResults[index]?.score || 0,
      isML: true,
    }));

    // Return complete analysis with all comments
    const responseData = {
      comments: commentsWithEmotions,
      total: allComments.length,
      analyzed: allComments.length,
      videoTitle: videoTitle,
      // Performance data (for monitoring, not displayed in UI)
      _timing: {
        analysisTimeMs: analysisTime,
        avgPerCommentMs: avgTimePerComment,
      },
    };

    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": `private, max-age=${CACHE_MAX_AGE}`,
      },
    });
  } catch (error) {
    console.error("Comments API error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      },
    );
  }
}
