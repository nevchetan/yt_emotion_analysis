import { getServerSession } from "next-auth";
import { authOptions } from "../../auth/[...nextauth]/route";

const YOUTUBE_API_BASE = "https://youtube.googleapis.com/youtube/v3";

export async function POST(request) {
  const session = await getServerSession(authOptions);
  if (!session?.accessToken) {
    return new Response(
      JSON.stringify({
        error: "Unauthorized",
        message: "Please sign in to post replies",
      }),
      { status: 401, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await request.json();
    const parentId = body?.parentId;
    const replyText = body?.replyText;

    if (!parentId || !replyText || !String(replyText).trim()) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields",
          message: "parentId and replyText are required",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    const response = await fetch(`${YOUTUBE_API_BASE}/comments?part=snippet`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${session.accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        snippet: {
          parentId,
          textOriginal: String(replyText).trim(),
        },
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(
        JSON.stringify({
          error: "YouTube API Error",
          status: response.status,
          message: "Failed to post reply",
          details: errorText,
        }),
        {
          status: response.status,
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    const data = await response.json();
    return new Response(
      JSON.stringify({
        success: true,
        replyId: data?.id || null,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("Post comment error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal Server Error",
        message: error.message,
      }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }
}
