"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Users, UserPlus, UserX, Heart, ArrowRight, Upload } from "lucide-react";
import { StatsCard } from "@/components/stats-card";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface SnapshotSummary {
  id: string;
  createdAt: string;
  followerCount: number;
  followingCount: number;
}

interface DiffResult {
  notFollowingBack: Array<{ username: string; profileUrl: string }>;
  fans: Array<{ username: string; profileUrl: string }>;
  mutuals: Array<{ username: string; profileUrl: string }>;
}

export default function DashboardPage() {
  const [latestSnapshot, setLatestSnapshot] = useState<SnapshotSummary | null>(null);
  const [diff, setDiff] = useState<DiffResult | null>(null);
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
        const latest = sorted[0];
        setLatestSnapshot(latest);

        const diffRes = await fetch(`/api/diff?snapshotId=${latest.id}`);
        const diffData = await diffRes.json();

        if (diffData.diff) {
          setDiff(diffData.diff);
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground text-sm">Loading dashboard...</div>
      </div>
    );
  }

  if (!latestSnapshot) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">Welcome to Instagram Follower Manager</h1>
          <p className="text-muted-foreground mt-2 text-lg">
            Get started by uploading your Instagram data export to analyze your followers.
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
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">
          Overview of your Instagram follower data from{" "}
          {new Date(latestSnapshot.createdAt).toLocaleDateString()}
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard
          title="Total Followers"
          value={latestSnapshot.followerCount}
          description="People following you"
          icon={Users}
        />
        <StatsCard
          title="Total Following"
          value={latestSnapshot.followingCount}
          description="People you follow"
          icon={UserPlus}
        />
        <StatsCard
          title="Not Following Back"
          value={diff?.notFollowingBack.length ?? "-"}
          description="You follow them, they don't follow you"
          icon={UserX}
        />
        <StatsCard
          title="Fans"
          value={diff?.fans.length ?? "-"}
          description="They follow you, you don't follow them"
          icon={Heart}
        />
      </div>

      {/* Quick Links */}
      <div className="grid gap-4 sm:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Follower Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              See who is not following you back, your fans, and mutual followers.
            </p>
            <Link href="/diff">
              <Button variant="outline">
                View Analysis
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Snapshot History</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4 text-sm">
              Track how your followers and following have changed over time.
            </p>
            <Link href="/history">
              <Button variant="outline">
                View History
                <ArrowRight className="size-4" />
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
