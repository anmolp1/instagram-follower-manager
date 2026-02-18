"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload, TrendingUp, TrendingDown, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getSnapshots } from "@/lib/client-storage";
import { computeHistory } from "@/lib/diff";
import { HistoryEntry, Snapshot } from "@/lib/types";

export default function HistoryPage() {
  const [snapshots, setSnapshots] = useState<Snapshot[]>([]);
  const [historyEntries, setHistoryEntries] = useState<Map<string, HistoryEntry>>(new Map());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const all = getSnapshots(); // already sorted newest-first
    setSnapshots(all);

    const entries = new Map<string, HistoryEntry>();
    for (let i = 0; i < all.length - 1; i++) {
      const current = all[i];
      const previous = all[i + 1];
      entries.set(current.id, computeHistory(current, previous));
    }
    setHistoryEntries(entries);
    setLoading(false);
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
                    <p className="text-2xl font-semibold">{snapshot.followers.length}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground text-sm">Following</p>
                    <p className="text-2xl font-semibold">{snapshot.following.length}</p>
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
