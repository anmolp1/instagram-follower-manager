"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Loader2, LogIn, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

interface InstagramLoginProps {
  onSuccess?: () => void;
}

export function InstagramLogin({ onSuccess }: InstagramLoginProps) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!username || !password) {
      toast.error("Please enter both username and password");
      return;
    }

    setLoading(true);
    setStatus("Logging into Instagram...");

    try {
      const res = await fetch("/api/fetch", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "Failed to fetch data");
      }

      setStatus("");
      toast.success(
        `Fetched ${data.followerCount} followers and ${data.followingCount} following`
      );
      setPassword("");
      onSuccess?.();
    } catch (error) {
      setStatus("");
      toast.error(error instanceof Error ? error.message : "Failed to fetch data");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Login to Instagram</CardTitle>
        <CardDescription>
          Enter your credentials to automatically fetch your followers and following lists
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="text-sm font-medium">
              Username
            </label>
            <input
              id="username"
              type="text"
              className="border-input bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
              placeholder="your_username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="text-sm font-medium">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="border-input bg-background mt-1 w-full rounded-md border px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-2"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <div className="bg-muted/50 flex items-start gap-2 rounded-md p-3">
            <ShieldCheck className="text-muted-foreground mt-0.5 h-4 w-4 shrink-0" />
            <p className="text-muted-foreground text-xs">
              Your credentials are sent directly to Instagram and are never stored.
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
            disabled={loading || !username || !password}
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
                <LogIn className="mr-2 h-4 w-4" />
                Fetch My Followers
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
