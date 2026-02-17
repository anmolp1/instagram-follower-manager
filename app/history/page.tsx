"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface InstagramUser {
  username: string;
  profileUrl: string;
  timestamp?: number;
}

interface SnapshotSummary {
  id: string;
  createdAt: string;
  followerCount: number;
  followingCount: number;
}

interface HistoryEntry {
  snapshotId: string;
  date: string;
  newFollowers: InstagramUser[];
  lostFollowers: InstagramUser[];
  totalFollowers: number;
  totalFollowing: number;
}

export default function HistoryPage() {
  const [snapshots, setSnapshots] = useState<SnapshotSummary[]>([]);
  const [historyEntries, setHistoryEntries] = useState<Map<string, HistoryEntry>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      try {
        const snapshotsRes = await fetch("/api/snapshots");
        const snapshotsData = await snapshotsRes.json();

        if (!snapshotsData.snapshots || snapshotsData.snapshots.length === 0) {
          setLoading(false);
          return;
        }

        const sorted = snapshotsData.snapshots.sort(
          (a: SnapshotSummary, b: SnapshotSummary) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setSnapshots(sorted);

        // Fetch history (diff) for each snapshot that has a predecessor
        const entries = new Map<string, HistoryEntry>();
        for (const snapshot of sorted) {
          try {
            const diffRes = await fetch(`/api/diff?snapshotId=${snapshot.id}`);
            const diffData = await diffRes.json();
            if (diffData.history) {
              entries.set(snapshot.id, diffData.history);
            }
          } catch {
            // Skip snapshots that fail to fetch
          }
        }
        setHistoryEntries(entries);
      } catch (error) {
        console.error("Failed to fetch history data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground text-sm">Loading history...</div>
      </div>
    );
  }

  if (snapshots.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">No History Yet</h1>
          <p className="text-muted-foreground mt-2">
            Upload your Instagram data to start tracking changes over time.
          </p>
        </div>
        <Link href="/upload">
          <Button size="lg">
            <Upload className="size-5" />
            Upload Your Data
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Snapshot History</h1>
        <p className="text-muted-foreground mt-1">
          Track how your followers and following have changed over time.
        </p>
      </div>

      <div className="space-y-4">
        {snapshots.map((snapshot, index) => {
          const history = historyEntries.get(snapshot.id);
          const isLatest = index === 0;

          return (
            <Card key={snapshot.id}>
              <CardHeader className="flex flex-row items-center justify-between">
                <div className="flex items-center gap-3">
                  <Calendar className="text-muted-foreground size-5" />
                  <div>
                    <CardTitle className="text-base">
                      {new Date(snapshot.createdAt).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </CardTitle>
                    {isLatest && (
                      <Badge variant="secondary" className="mt-1">
                        Latest
                      </Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  <div>
                    <p className="text-muted-foreground text-sm">Followers</p>
                    <p className="text-2xl font-semibold">{snapshot.followerCount}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Following</p>
                    <p className="text-2xl font-semibold">{snapshot.followingCount}</p>
                  </div>

                  {history && (
                    <>
                      <div className="flex items-start gap-2">
                        <TrendingUp className="mt-0.5 size-4 text-green-600" />
                        <div>
                          <p className="text-muted-foreground text-sm">New Followers</p>
                          <p className="text-2xl font-semibold text-green-600">
                            +{history.newFollowers.length}
                          </p>
                          {history.newFollowers.length > 0 && history.newFollowers.length <= 5 && (
                            <p className="text-muted-foreground mt-1 text-xs">
                              {history.newFollowers.map((u) => u.username).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-start gap-2">
                        <TrendingDown className="mt-0.5 size-4 text-red-600" />
                        <div>
                          <p className="text-muted-foreground text-sm">Lost Followers</p>
                          <p className="text-2xl font-semibold text-red-600">
                            -{history.lostFollowers.length}
                          </p>
                          {history.lostFollowers.length > 0 && history.lostFollowers.length <= 5 && (
                            <p className="text-muted-foreground mt-1 text-xs">
                              {history.lostFollowers.map((u) => u.username).join(", ")}
                            </p>
                          )}
                        </div>
                      </div>
                    </>
                  )}

                  {!history && index < snapshots.length - 1 && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground text-sm italic">
                        No change data available for this snapshot.
                      </p>
                    </div>
                  )}

                  {!history && index === snapshots.length - 1 && (
                    <div className="sm:col-span-2">
                      <p className="text-muted-foreground text-sm italic">
                        First snapshot &mdash; no previous data to compare against.
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
