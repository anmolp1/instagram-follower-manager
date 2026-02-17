import { NextResponse } from "next/server";
import { saveSnapshot } from "@/lib/storage";
import { InstagramUser, Snapshot } from "@/lib/types";

// Instagram usernames: 1-30 chars, lowercase letters, numbers, underscores, periods
const INSTAGRAM_USERNAME_RE = /^[a-z0-9_.]{1,30}$/;

// Lines that are clearly not usernames (Instagram UI chrome, nav, bio fragments)
const NOISE_PATTERNS = [
  /^(meta|about|blog|jobs|help|api|privacy|terms|locations|threads|english|search)$/i,
  /^(instagram lite|meta ai|meta verified|contact uploading|non-users)$/i,
  /^\d+ (posts?|followers?|following)$/i,
  /^©/,
  /^followers$/i,
  /^following$/i,
  /profile picture$/i,
  /^more$/i,
  /^\·$/,
];

function isNoise(line: string): boolean {
  return NOISE_PATTERNS.some((p) => p.test(line));
}

function isLikelyUsername(line: string): boolean {
  // Must match Instagram username format
  if (!INSTAGRAM_USERNAME_RE.test(line)) return false;
  // Skip very short generic words that happen to match the regex
  if (line.length <= 2) return false;
  return true;
}

function parseUsernames(text: string): InstagramUser[] {
  const lines = text.split(/\n/).map((l) => l.trim()).filter((l) => l.length > 0);
  const seen = new Set<string>();
  const users: InstagramUser[] = [];

  for (const line of lines) {
    // Remove leading @ if present
    const cleaned = line.replace(/^@/, "").toLowerCase();

    if (isNoise(line)) continue;
    if (!isLikelyUsername(cleaned)) continue;
    if (seen.has(cleaned)) continue;

    seen.add(cleaned);
    users.push({
      username: cleaned,
      profileUrl: `https://www.instagram.com/${cleaned}`,
    });
  }

  return users;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { followers: followersText, following: followingText } = body as {
      followers: string;
      following: string;
    };

    if (!followersText && !followingText) {
      return NextResponse.json(
        { error: "Please provide at least one list of usernames" },
        { status: 400 }
      );
    }

    const followers = parseUsernames(followersText || "");
    const following = parseUsernames(followingText || "");

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
    console.error("Paste import error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process paste" },
      { status: 500 }
    );
  }
}
