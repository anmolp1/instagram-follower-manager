import { InstagramUser } from "./types";

/**
 * Shape of a single entry in Instagram's data export JSON.
 * Each entry contains a `string_list_data` array with user info.
 */
interface InstagramExportEntry {
  title?: string;
  media_list_data?: unknown[];
  string_list_data: {
    href: string;
    value: string;
    timestamp: number;
  }[];
}

/**
 * Parse a raw Instagram export JSON string into an array of InstagramUser objects.
 *
 * Instagram exports data in two possible shapes:
 * 1. A top-level JSON array of entries.
 * 2. An object with a nested array under a key like `relationships_following`.
 *
 * Each entry contains `string_list_data` with `href`, `value`, and `timestamp`.
 */
export function parseInstagramJson(raw: string): InstagramUser[] {
  const parsed: unknown = JSON.parse(raw);

  let entries: InstagramExportEntry[];

  if (Array.isArray(parsed)) {
    entries = parsed as InstagramExportEntry[];
  } else if (typeof parsed === "object" && parsed !== null) {
    // Find the first key whose value is an array (e.g. `relationships_following`)
    const obj = parsed as Record<string, unknown>;
    const arrayValue = Object.values(obj).find((v) => Array.isArray(v));
    if (arrayValue) {
      entries = arrayValue as InstagramExportEntry[];
    } else {
      throw new Error(
        "Invalid Instagram export format: no array found in object"
      );
    }
  } else {
    throw new Error(
      "Invalid Instagram export format: expected an array or object"
    );
  }

  const users: InstagramUser[] = [];

  for (const entry of entries) {
    if (!entry.string_list_data || !Array.isArray(entry.string_list_data)) {
      continue;
    }

    for (const item of entry.string_list_data) {
      const username = item.value || extractUsernameFromUrl(item.href);
      const profileUrl =
        item.href || `https://www.instagram.com/${item.value}`;

      if (username) {
        users.push({
          username,
          profileUrl,
          timestamp: item.timestamp || undefined,
        });
      }
    }
  }

  return users;
}

/**
 * Extract a username from an Instagram profile URL.
 * E.g. "https://www.instagram.com/johndoe" -> "johndoe"
 */
function extractUsernameFromUrl(url: string): string {
  if (!url) return "";
  try {
    const pathname = new URL(url).pathname;
    // Remove leading/trailing slashes and return the first segment
    return pathname.replace(/^\/|\/$/g, "").split("/")[0] || "";
  } catch {
    return "";
  }
}

/**
 * Determine whether a file is a followers file or a following file
 * based on its name.
 */
function classifyFile(name: string): "followers" | "following" | null {
  const lower = name.toLowerCase();
  if (lower.includes("following")) return "following";
  if (lower.includes("follower")) return "followers";
  return null;
}

/**
 * Parse a complete Instagram data export consisting of multiple files.
 *
 * Accepts an array of { name, content } objects representing the uploaded files.
 * Files are classified as followers or following based on their filename:
 * - Files containing "follower" in the name (e.g. `followers_1.json`) are treated as followers.
 * - Files containing "following" in the name (e.g. `following.json`) are treated as following.
 *
 * Multiple follower files (e.g. `followers_1.json`, `followers_2.json`) are merged.
 */
export function parseDataExport(
  files: { name: string; content: string }[]
): { followers: InstagramUser[]; following: InstagramUser[] } {
  const followers: InstagramUser[] = [];
  const following: InstagramUser[] = [];

  for (const file of files) {
    const type = classifyFile(file.name);
    if (!type) continue;

    const users = parseInstagramJson(file.content);

    if (type === "followers") {
      followers.push(...users);
    } else {
      following.push(...users);
    }
  }

  // Deduplicate by username within each list
  const dedupe = (users: InstagramUser[]): InstagramUser[] => {
    const seen = new Set<string>();
    return users.filter((u) => {
      if (seen.has(u.username)) return false;
      seen.add(u.username);
      return true;
    });
  };

  return {
    followers: dedupe(followers),
    following: dedupe(following),
  };
}
