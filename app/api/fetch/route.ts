import { NextResponse } from "next/server";
import { IgApiClient } from "instagram-private-api";
import { saveSnapshot } from "@/lib/storage";
import { InstagramUser, Snapshot } from "@/lib/types";

async function getAllFollowers(
  ig: IgApiClient,
  userId: number
): Promise<InstagramUser[]> {
  const followersFeed = ig.feed.accountFollowers(userId);
  const users: InstagramUser[] = [];

  do {
    const page = await followersFeed.items();
    for (const user of page) {
      users.push({
        username: user.username,
        profileUrl: `https://www.instagram.com/${user.username}`,
      });
    }
  } while (followersFeed.isMoreAvailable());

  return users;
}

async function getAllFollowing(
  ig: IgApiClient,
  userId: number
): Promise<InstagramUser[]> {
  const followingFeed = ig.feed.accountFollowing(userId);
  const users: InstagramUser[] = [];

  do {
    const page = await followingFeed.items();
    for (const user of page) {
      users.push({
        username: user.username,
        profileUrl: `https://www.instagram.com/${user.username}`,
      });
    }
  } while (followingFeed.isMoreAvailable());

  return users;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { username, password } = body as {
      username: string;
      password: string;
    };

    if (!username || !password) {
      return NextResponse.json(
        { error: "Username and password are required" },
        { status: 400 }
      );
    }

    const ig = new IgApiClient();
    ig.state.generateDevice(username);

    // Log in
    let loggedInUser;
    try {
      loggedInUser = await ig.account.login(username, password);
    } catch (err: unknown) {
      const error = err as { name?: string; message?: string; response?: { body?: { message?: string; two_factor_required?: boolean; error_type?: string } } };
      console.error("Instagram login error:", {
        name: error.name,
        message: error.message,
        responseBody: error.response?.body,
      });

      if (
        error.name === "IgCheckpointError" ||
        error.response?.body?.error_type === "checkpoint_challenge_required"
      ) {
        return NextResponse.json(
          {
            error:
              "Instagram requires verification (checkpoint). Please approve the login in the Instagram app or via email/SMS, then try again.",
          },
          { status: 403 }
        );
      }
      if (error.name === "IgLoginBadPasswordError") {
        const body = error.response?.body;
        if (body?.message?.includes("Facebook")) {
          return NextResponse.json(
            {
              error:
                "Your account is linked to Facebook. Instagram blocks direct login for Facebook-linked accounts. Please use the \"Paste manually\" method instead.",
            },
            { status: 401 }
          );
        }
        return NextResponse.json(
          { error: "Incorrect password. Please check and try again." },
          { status: 401 }
        );
      }
      if (
        error.name === "IgLoginTwoFactorRequiredError" ||
        error.response?.body?.two_factor_required
      ) {
        return NextResponse.json(
          {
            error:
              "Two-factor authentication is required. Please temporarily disable 2FA or use the paste method instead.",
          },
          { status: 403 }
        );
      }
      if (error.name === "IgLoginInvalidUserError") {
        return NextResponse.json(
          { error: "Username not found" },
          { status: 404 }
        );
      }
      // For any other Instagram error, return the actual error info
      return NextResponse.json(
        {
          error: `Instagram login failed: ${error.name || "Unknown"} — ${error.message || "No details"}`,
        },
        { status: 401 }
      );
    }

    // Fetch followers and following in parallel
    const [followers, following] = await Promise.all([
      getAllFollowers(ig, loggedInUser.pk),
      getAllFollowing(ig, loggedInUser.pk),
    ]);

    // Save as snapshot
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
    console.error("Instagram fetch error:", error);
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
