"use client";

import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ClipboardPaste, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface PasteImportProps {
  onSuccess?: () => void;
}

const INSTAGRAM_USERNAME_RE = /^[a-z0-9_.]{3,30}$/;

function countUsernames(text: string): number {
  if (!text.trim()) return 0;
  const seen = new Set<string>();
  for (const line of text.split(/\n/)) {
    const cleaned = line.trim().replace(/^@/, "").toLowerCase();
    if (INSTAGRAM_USERNAME_RE.test(cleaned) && !seen.has(cleaned)) {
      seen.add(cleaned);
    }
  }
  return seen.size;
}

export function PasteImport({ onSuccess }: PasteImportProps) {
  const [followers, setFollowers] = useState("");
  const [following, setFollowing] = useState("");
  const [loading, setLoading] = useState(false);

  const followerCount = useMemo(() => countUsernames(followers), [followers]);
  const followingCount = useMemo(() => countUsernames(following), [following]);

  const handleSubmit = async () => {
    if (!followers && !following) {
      toast.error("Please paste at least one list of usernames");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/paste", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ followers, following }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Upload failed");
      }

      const data = await res.json();
      toast.success(
        `Imported ${data.followerCount} followers and ${data.followingCount} following`
      );
      setFollowers("");
      setFollowing("");
      onSuccess?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Failed to import");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Followers</CardTitle>
          <CardDescription>
            Copy-paste directly from Instagram&apos;s followers popup — usernames will be extracted automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            className="border-input bg-background placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            rows={8}
            placeholder="Paste the raw text from Instagram's followers popup here..."
            value={followers}
            onChange={(e) => setFollowers(e.target.value)}
            disabled={loading}
          />
          {followerCount > 0 && (
            <p className="text-muted-foreground mt-1 text-xs">
              ~{followerCount} username{followerCount !== 1 ? "s" : ""} detected
            </p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Following</CardTitle>
          <CardDescription>
            Copy-paste directly from Instagram&apos;s following popup — usernames will be extracted automatically
          </CardDescription>
        </CardHeader>
        <CardContent>
          <textarea
            className="border-input bg-background placeholder:text-muted-foreground w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
            rows={8}
            placeholder="Paste the raw text from Instagram's following popup here..."
            value={following}
            onChange={(e) => setFollowing(e.target.value)}
            disabled={loading}
          />
          {followingCount > 0 && (
            <p className="text-muted-foreground mt-1 text-xs">
              ~{followingCount} username{followingCount !== 1 ? "s" : ""} detected
            </p>
          )}
        </CardContent>
      </Card>

      <Button
        onClick={handleSubmit}
        disabled={loading || (!followers && !following)}
        className="w-full"
        size="lg"
      >
        {loading ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Importing...
          </>
        ) : (
          <>
            <ClipboardPaste className="mr-2 h-4 w-4" />
            Import Usernames
          </>
        )}
      </Button>
    </div>
  );
}
