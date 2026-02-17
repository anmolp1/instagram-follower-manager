import { DiffResult, HistoryEntry, InstagramUser, Snapshot } from "./types";

/**
 * Compute the relationship diff from a single snapshot.
 *
 * Uses Set-based lookups for O(n) efficiency:
 * - notFollowingBack: users you follow who don't follow you back
 * - fans: users who follow you but you don't follow back
 * - mutuals: users who follow you and you follow them
 */
export function computeDiff(snapshot: Snapshot): DiffResult {
  const followerUsernames = new Set(
    snapshot.followers.map((u) => u.username)
  );
  const followingUsernames = new Set(
    snapshot.following.map((u) => u.username)
  );

  const notFollowingBack: InstagramUser[] = snapshot.following.filter(
    (u) => !followerUsernames.has(u.username)
  );

  const fans: InstagramUser[] = snapshot.followers.filter(
    (u) => !followingUsernames.has(u.username)
  );

  const mutuals: InstagramUser[] = snapshot.followers.filter((u) =>
    followingUsernames.has(u.username)
  );

  return { notFollowingBack, fans, mutuals };
}

/**
 * Compare two snapshots to produce a history entry describing what changed.
 *
 * - newFollowers: users present in current followers but absent in previous
 * - lostFollowers: users present in previous followers but absent in current
 */
export function computeHistory(
  current: Snapshot,
  previous: Snapshot
): HistoryEntry {
  const previousFollowerUsernames = new Set(
    previous.followers.map((u) => u.username)
  );
  const currentFollowerUsernames = new Set(
    current.followers.map((u) => u.username)
  );

  const newFollowers: InstagramUser[] = current.followers.filter(
    (u) => !previousFollowerUsernames.has(u.username)
  );

  const lostFollowers: InstagramUser[] = previous.followers.filter(
    (u) => !currentFollowerUsernames.has(u.username)
  );

  return {
    snapshotId: current.id,
    date: current.createdAt,
    newFollowers,
    lostFollowers,
    totalFollowers: current.followers.length,
    totalFollowing: current.following.length,
  };
}
