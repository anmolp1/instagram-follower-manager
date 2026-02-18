"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Upload } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { UserTable } from "@/components/user-table";
import { getLatestSnapshot } from "@/lib/client-storage";
import { computeDiff } from "@/lib/diff";
import { DiffResult } from "@/lib/types";

export default function DiffPage() {
  const [diff, setDiff] = useState<DiffResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [hasData, setHasData] = useState(true);

  useEffect(() => {
    const latest = getLatestSnapshot();
    if (!latest) {
      setHasData(false);
    } else {
      setDiff(computeDiff(latest));
    }
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground text-sm">Loading analysis...</div>
      </div>
    );
  }

  if (!hasData || !diff) {
    return (
      <div className="flex flex-col items-center justify-center gap-6 py-20">
        <div className="text-center">
          <h1 className="text-3xl font-bold tracking-tight">No Data Available</h1>
          <p className="text-muted-foreground mt-2">
            Upload your Instagram data first to see your follower analysis.
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
        <h1 className="text-3xl font-bold tracking-tight">Follower Analysis</h1>
        <p className="text-muted-foreground mt-1">
          Analyze who follows you back, your fans, and mutual connections.
        </p>
      </div>

      <Tabs defaultValue="not-following-back">
        <TabsList>
          <TabsTrigger value="not-following-back" className="gap-2">
            Not Following Back
            <Badge variant="secondary">{diff.notFollowingBack.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="fans" className="gap-2">
            Fans
            <Badge variant="secondary">{diff.fans.length}</Badge>
          </TabsTrigger>
          <TabsTrigger value="mutuals" className="gap-2">
            Mutuals
            <Badge variant="secondary">{diff.mutuals.length}</Badge>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="not-following-back" className="mt-4">
          <UserTable
            users={diff.notFollowingBack}
            selectable={true}
            showBatchOpen={true}
            emptyMessage="Everyone you follow is following you back!"
          />
        </TabsContent>

        <TabsContent value="fans" className="mt-4">
          <UserTable
            users={diff.fans}
            selectable={false}
            emptyMessage="No fans found. You follow back everyone who follows you."
          />
        </TabsContent>

        <TabsContent value="mutuals" className="mt-4">
          <UserTable
            users={diff.mutuals}
            selectable={false}
            emptyMessage="No mutual followers found."
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
