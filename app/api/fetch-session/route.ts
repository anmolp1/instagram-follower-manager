import { NextResponse } from "next/server";
import { saveSnapshot } from "@/lib/storage";
import { InstagramUser, Snapshot } from "@/lib/types";

const IG_API_BASE = "https://i.instagram.com/api/v1";
const IG_APP_ID = "936619743392459"; // Instagram web app ID

interface IGUser {
  pk: number;
  username: string;
  full_name?: string;
}

interface IGFriendshipsResponse {
  users: IGUser[];
  next_max_id?: string;
  big_list?: boolean;
  status: string;
}

interface IGUserInfoResponse {
  user: { pk: number; username: string };
  status: string;
}

function buildHeaders(sessionId: string, csrfToken: string, dsUserId: string) {
  return {
    "User-Agent":
      "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
    "X-IG-App-ID": IG_APP_ID,
    "X-CSRFToken": csrfToken,
    "X-IG-WWW-Claim": "0",
    "X-Requested-With": "XMLHttpRequest",
    Cookie: `sessionid=${sessionId}; csrftoken=${csrfToken}; ds_user_id=${dsUserId}`,
    Referer: "https://www.instagram.com/",
    Origin: "https://www.instagram.com",
  };
}

async function getUserId(
  username: string,
  headers: Record<string, string>
): Promise<number> {
  const res = await fetch(
    `${IG_API_BASE}/users/web_profile_info/?username=${username}`,
    { headers }
  );

  if (!res.ok) {
    const text = await res.text();
    console.error("getUserId failed:", res.status, text);
    throw new Error(`Failed to get user info (${res.status}). Your session may be invalid.`);
  }

  const data = (await res.json()) as { data: { user: { id: string } } };
  return parseInt(data.data.user.id, 10);
}

async function fetchAllPages(
  url: string,
  headers: Record<string, string>,
  type: "followers" | "following"
): Promise<InstagramUser[]> {
  const users: InstagramUser[] = [];
  let maxId: string | undefined;
  let pageCount = 0;
  const maxPages = 100; // safety limit

  do {
    const params = new URLSearchParams({ count: "100" });
    if (maxId) params.set("max_id", maxId);

    const res = await fetch(`${url}?${params.toString()}`, { headers });

    if (!res.ok) {
      const text = await res.text();
      console.error(`fetch ${type} page ${pageCount} failed:`, res.status, text);
      if (res.status === 401 || res.status === 403) {
        throw new Error(
          `Session expired or invalid (${res.status}). Please get a fresh session cookie.`
        );
      }
      throw new Error(`Failed to fetch ${type} page ${pageCount} (${res.status})`);
    }

    const data = (await res.json()) as IGFriendshipsResponse;

    for (const user of data.users) {
      users.push({
        username: user.username,
        profileUrl: `https://www.instagram.com/${user.username}`,
        userId: user.pk,
      });
    }

    maxId = data.next_max_id;
    pageCount++;

    // Rate limit: wait 1-2 seconds between pages to avoid throttling
    if (maxId) {
      await new Promise((r) => setTimeout(r, 1000 + Math.random() * 1000));
    }
  } while (maxId && pageCount < maxPages);

  return users;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { sessionId, csrfToken, dsUserId } = body as {
      sessionId: string;
      csrfToken: string;
      dsUserId: string;
    };

    if (!sessionId || !csrfToken || !dsUserId) {
      return NextResponse.json(
        { error: "sessionid, csrftoken, and ds_user_id cookies are all required" },
        { status: 400 }
      );
    }

    const headers = buildHeaders(sessionId, csrfToken, dsUserId);
    const userId = parseInt(dsUserId, 10);

    // Fetch followers and following in parallel
    const [followers, following] = await Promise.all([
      fetchAllPages(
        `${IG_API_BASE}/friendships/${userId}/followers/`,
        headers,
        "followers"
      ),
      fetchAllPages(
        `${IG_API_BASE}/friendships/${userId}/following/`,
        headers,
        "following"
      ),
    ]);

    const snapshot: Snapshot = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      followers,
      following,
    };

    await saveSnapshot(snapshot);

    return NextResponse.json({
      id: snapshot.id,
      createdAt: snapshot.createdAt,
      followerCount: followers.length,
      followingCount: following.length,
    });
  } catch (error) {
    console.error("Session fetch error:", error);
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to fetch Instagram data",
      },
      { status: 500 }
    );
  }
}
