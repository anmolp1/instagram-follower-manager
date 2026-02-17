export interface InstagramUser {
  username: string;
  profileUrl: string;
  timestamp?: number; // when they followed / you followed
}

export interface Snapshot {
  id: string;
  createdAt: string; // ISO date
  followers: InstagramUser[];
  following: InstagramUser[];
}

export interface DiffResult {
  notFollowingBack: InstagramUser[]; // you follow them, they don't follow you
  fans: InstagramUser[]; // they follow you, you don't follow them
  mutuals: InstagramUser[]; // both follow each other
}

export interface HistoryEntry {
  snapshotId: string;
  date: string;
  newFollowers: InstagramUser[];
  lostFollowers: InstagramUser[];
  totalFollowers: number;
  totalFollowing: number;
}
