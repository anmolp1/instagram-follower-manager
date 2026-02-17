import { NextResponse } from "next/server";

const IG_API_BASE = "https://i.instagram.com/api/v1";
const IG_APP_ID = "936619743392459";

function buildHeaders(sessionId: string, csrfToken: string, dsUserId: string) {
  return {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "X-IG-App-ID": IG_APP_ID,
    "X-CSRFToken": csrfToken,
    "X-IG-WWW-Claim": "0",
    "X-Requested-With": "XMLHttpRequest",
    "Content-Type": "application/x-www-form-urlencoded",
    Cookie: `sessionid=${sessionId}; csrftoken=${csrfToken}; ds_user_id=${dsUserId}`,
    Referer: "https://www.instagram.com/",
    Origin: "https://www.instagram.com",
  };
}

interface UnfollowResult {
  username: string;
  userId: number;
  success: boolean;
  error?: string;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, csrfToken, dsUserId, users } = body as {
      sessionId: string;
      csrfToken: string;
      dsUserId: string;
      users: { username: string; userId: number }[];
    };

    if (!sessionId || !csrfToken || !dsUserId) {
      return NextResponse.json(
        { error: "Session cookies are required. Please re-enter them on the Upload page." },
        { status: 400 }
      );
    }

    if (!users || users.length === 0) {
      return NextResponse.json(
        { error: "No users selected to unfollow" },
        { status: 400 }
      );
    }

    const headers = buildHeaders(sessionId, csrfToken, dsUserId);
    const results: UnfollowResult[] = [];

    for (const user of users) {
      try {
        const res = await fetch(
          `${IG_API_BASE}/friendships/destroy/${user.userId}/`,
          {
            method: "POST",
            headers,
            body: `user_id=${user.userId}`,
          }
        );

        if (!res.ok) {
          const text = await res.text();
          console.error(`Unfollow ${user.username} failed:`, res.status, text);

          if (res.status === 401 || res.status === 403) {
            // Session expired — stop processing
            return NextResponse.json(
              {
                error: "Session expired. Please get fresh cookies from Instagram.",
                results,
              },
              { status: 401 }
            );
          }

          results.push({
            username: user.username,
            userId: user.userId,
            success: false,
            error: `HTTP ${res.status}`,
          });
        } else {
          results.push({
            username: user.username,
            userId: user.userId,
            success: true,
          });
        }

        // Rate limit: wait 2-4 seconds between unfollows to avoid action blocks
        if (users.indexOf(user) < users.length - 1) {
          await new Promise((r) => setTimeout(r, 2000 + Math.random() * 2000));
        }
      } catch (err) {
        results.push({
          username: user.username,
          userId: user.userId,
          success: false,
          error: err instanceof Error ? err.message : "Unknown error",
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    const failCount = results.filter((r) => !r.success).length;

    return NextResponse.json({
      successCount,
      failCount,
      results,
    });
  } catch (error) {
    console.error("Unfollow error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Failed to unfollow users",
      },
      { status: 500 }
    );
  }
}
