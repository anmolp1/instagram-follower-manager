"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Cookie, Loader2, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface SessionImportProps {
  onSuccess?: () => void;
}

export function SessionImport({ onSuccess }: SessionImportProps) {
  const [sessionId, setSessionId] = useState("");
  const [csrfToken, setCsrfToken] = useState("");
  const [dsUserId, setDsUserId] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!sessionId || !csrfToken || !dsUserId) {
      toast.error("All three cookie values are required");
      return;
    }

    setLoading(true);
    setStatus("Connecting to Instagram...");

    try {
      const res = await fetch("/api/fetch-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          sessionId: sessionId.trim(),
          csrfToken: csrfToken.trim(),
          dsUserId: dsUserId.trim(),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch data");
      }

      // Save session cookies to localStorage for reuse (e.g. unfollowing)
      localStorage.setItem(
        "ig_session",
        JSON.stringify({
          sessionId: sessionId.trim(),
          csrfToken: csrfToken.trim(),
          dsUserId: dsUserId.trim(),
        })
      );

      setStatus("");
      toast.success(
        `Fetched ${data.followerCount} followers and ${data.followingCount} following`
      );
      onSuccess?.();
    } catch (error) {
      setStatus("");
      toast.error(
        error instanceof Error ? error.message : "Failed to fetch data"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>How to get your cookies</CardTitle>
          <CardDescription>
            3 quick steps to copy your session cookies from the browser
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ol className="text-muted-foreground list-inside list-decimal space-y-2 text-sm">
            <li>
              Open{" "}
              <a
                href="https://www.instagram.com"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline"
              >
                instagram.com
              </a>{" "}
              and make sure you&apos;re logged in
            </li>
            <li>
              Press <strong className="text-foreground">F12</strong> to open
              DevTools → go to the{" "}
              <strong className="text-foreground">Application</strong> tab
            </li>
            <li>
              In the left sidebar, expand{" "}
              <strong className="text-foreground">
                Cookies → https://www.instagram.com
              </strong>
            </li>
            <li>
              Copy the values of these 3 cookies:{" "}
              <code className="bg-muted rounded px-1 py-0.5 text-xs">
                sessionid
              </code>
              ,{" "}
              <code className="bg-muted rounded px-1 py-0.5 text-xs">
                csrftoken
              </code>
              ,{" "}
              <code className="bg-muted rounded px-1 py-0.5 text-xs">
                ds_user_id
              </code>
            </li>
          </ol>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Paste your cookies</CardTitle>
          <CardDescription>
            Enter the 3 cookie values from Instagram
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="sessionId" className="text-sm font-medium">
                sessionid
              </label>
              <input
                id="sessionId"
                type="text"
                className="border-input bg-background mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                placeholder="Paste your sessionid cookie value"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="csrfToken" className="text-sm font-medium">
                csrftoken
              </label>
              <input
                id="csrfToken"
                type="text"
                className="border-input bg-background mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                placeholder="Paste your csrftoken cookie value"
                value={csrfToken}
                onChange={(e) => setCsrfToken(e.target.value)}
                disabled={loading}
              />
            </div>

            <div>
              <label htmlFor="dsUserId" className="text-sm font-medium">
                ds_user_id
              </label>
              <input
                id="dsUserId"
                type="text"
                className="border-input bg-background mt-1 w-full rounded-md border px-3 py-2 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
                placeholder="Paste your ds_user_id cookie value"
                value={dsUserId}
                onChange={(e) => setDsUserId(e.target.value)}
                disabled={loading}
              />
            </div>

            <div className="bg-muted/50 flex items-start gap-2 rounded-md p-3">
              <ShieldCheck className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
              <p className="text-muted-foreground text-xs">
                Your cookies are sent directly to Instagram and are never stored.
                Everything runs locally on your machine.
              </p>
            </div>

            {status && (
              <p className="text-muted-foreground flex items-center gap-2 text-sm">
                <Loader2 className="h-4 w-4 animate-spin" />
                {status}
              </p>
            )}

            <Button
              type="submit"
              disabled={loading || !sessionId || !csrfToken || !dsUserId}
              className="w-full"
              size="lg"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Fetching data...
                </>
              ) : (
                <>
                  <Cookie className="mr-2 h-4 w-4" />
                  Fetch My Followers
                </>
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
