"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { Copy, ExternalLink, Search, UserMinus } from "lucide-react";
import { toast } from "sonner";

interface UserTableUser {
  username: string;
  profileUrl: string;
  userId?: number;
  timestamp?: number;
}

interface UserTableProps {
  users: UserTableUser[];
  selectable?: boolean;
  showUnfollowScript?: boolean;
  emptyMessage?: string;
}

function generateUnfollowScript(usernames: string[]): string {
  return `// Instagram Bulk Unfollow Script
// Generated for ${usernames.length} user(s)
// Paste this into your browser console on instagram.com
// It will visit each profile and click Unfollow with delays

(async () => {
  const usernames = ${JSON.stringify(usernames)};
  const delay = (ms) => new Promise(r => setTimeout(r, ms));
  let success = 0, fail = 0;

  for (let i = 0; i < usernames.length; i++) {
    const u = usernames[i];
    console.log(\`[\${i+1}/\${usernames.length}] Unfollowing \${u}...\`);
    try {
      const res = await fetch(\`https://www.instagram.com/api/v1/web/friendships/\${u}/unfollow/\`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-CSRFToken': document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '',
          'X-Requested-With': 'XMLHttpRequest',
          'X-Instagram-AJAX': '1',
        },
        credentials: 'include',
      });
      if (res.ok) {
        success++;
        console.log(\`  ✓ Unfollowed \${u}\`);
      } else {
        fail++;
        console.warn(\`  ✗ Failed \${u} (\${res.status})\`);
      }
    } catch(e) {
      fail++;
      console.warn(\`  ✗ Error \${u}:\`, e.message);
    }
    // Wait 20-30s between unfollows to stay under rate limits
    if (i < usernames.length - 1) {
      const wait = 20000 + Math.random() * 10000;
      console.log(\`  Waiting \${Math.round(wait/1000)}s...\`);
      await delay(wait);
    }
  }
  console.log(\`Done! ✓ \${success} unfollowed, ✗ \${fail} failed\`);
})();`;
}

export function UserTable({
  users,
  selectable = false,
  showUnfollowScript = false,
  emptyMessage = "No users to display.",
}: UserTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [hasExtension, setHasExtension] = useState(false);

  useEffect(() => {
    // The Chrome extension's content script sets this attribute
    // so the app knows it can dispatch events instead of falling back
    const check = () =>
      setHasExtension(
        document.documentElement.hasAttribute("data-ig-extension")
      );
    check();
    // Re-check after a short delay in case the content script loads late
    const timer = setTimeout(check, 500);
    return () => clearTimeout(timer);
  }, []);

  const hasTimestamp = users.some((u) => u.timestamp !== undefined);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return users;
    const query = search.toLowerCase();
    return users.filter((u) => u.username.toLowerCase().includes(query));
  }, [users, search]);

  const allFilteredSelected =
    filteredUsers.length > 0 &&
    filteredUsers.every((u) => selected.has(u.username));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredUsers.forEach((u) => next.delete(u.username));
        return next;
      });
    } else {
      setSelected((prev) => {
        const next = new Set(prev);
        filteredUsers.forEach((u) => next.add(u.username));
        return next;
      });
    }
  };

  const toggleSelect = (username: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(username)) {
        next.delete(username);
      } else {
        next.add(username);
      }
      return next;
    });
  };

  const getProfileLink = (username: string) =>
    `https://www.instagram.com/${username}`;

  const copyLinks = async (usernames: string[]) => {
    const links = usernames.map(getProfileLink).join("\n");
    try {
      await navigator.clipboard.writeText(links);
      toast.success(`Copied ${usernames.length} link(s) to clipboard`);
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  const copySelectedLinks = () => {
    const selectedUsernames = filteredUsers
      .filter((u) => selected.has(u.username))
      .map((u) => u.username);
    copyLinks(selectedUsernames);
  };

  const copyAllLinks = () => {
    copyLinks(filteredUsers.map((u) => u.username));
  };

  const launchUnfollow = async (usernames: string[]) => {
    if (hasExtension) {
      // Extension is installed — dispatch event for one-click unfollow
      window.dispatchEvent(
        new CustomEvent("ig-unfollow", { detail: { usernames } })
      );
      toast.success(
        `Unfollowing ${usernames.length} user(s)... Check the Instagram tab for progress.`,
        { duration: 8000 }
      );
      return;
    }

    // Fallback: copy script + open Instagram
    const script = generateUnfollowScript(usernames);
    try {
      await navigator.clipboard.writeText(script);
      window.open("https://www.instagram.com", "_blank");
      toast(
        `Extension not detected — script copied. On the Instagram tab: F12 → Console → Ctrl+V → Enter`,
        { duration: 10000 }
      );
    } catch {
      toast.error("Failed to copy to clipboard");
    }
  };

  return (
    <div className="space-y-3">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1">
          <Search className="text-muted-foreground absolute left-2.5 top-1/2 size-4 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Filter by username..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring h-9 w-full rounded-md border pl-9 pr-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2"
          />
        </div>

        <div className="flex items-center gap-2">
          {selectable && selected.size > 0 && (
            <>
              <span className="text-muted-foreground text-sm">
                {selected.size} selected
              </span>
              {showUnfollowScript && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    launchUnfollow(
                      filteredUsers
                        .filter((u) => selected.has(u.username))
                        .map((u) => u.username)
                    )
                  }
                >
                  <UserMinus className="size-4" />
                  Unfollow Selected
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={copySelectedLinks}>
                <Copy className="size-4" />
                Copy Links
              </Button>
            </>
          )}
          {showUnfollowScript && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                launchUnfollow(filteredUsers.map((u) => u.username))
              }
              disabled={filteredUsers.length === 0}
            >
              <ExternalLink className="size-4" />
              Unfollow All
            </Button>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={copyAllLinks}
            disabled={filteredUsers.length === 0}
          >
            <Copy className="size-4" />
            Copy All Links
          </Button>
        </div>
      </div>

      {/* Table */}
      {filteredUsers.length === 0 ? (
        <div className="text-muted-foreground flex items-center justify-center rounded-md border py-10 text-sm">
          {search ? "No users match your search." : emptyMessage}
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              {selectable && (
                <TableHead className="w-10">
                  <Checkbox
                    checked={allFilteredSelected}
                    onCheckedChange={toggleSelectAll}
                    aria-label="Select all"
                  />
                </TableHead>
              )}
              <TableHead>Username</TableHead>
              <TableHead>Profile Link</TableHead>
              {hasTimestamp && <TableHead>Date</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow
                key={user.username}
                data-state={selected.has(user.username) ? "selected" : undefined}
              >
                {selectable && (
                  <TableCell>
                    <Checkbox
                      checked={selected.has(user.username)}
                      onCheckedChange={() => toggleSelect(user.username)}
                      aria-label={`Select ${user.username}`}
                    />
                  </TableCell>
                )}
                <TableCell className="font-medium">{user.username}</TableCell>
                <TableCell>
                  <a
                    href={getProfileLink(user.username)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    instagram.com/{user.username}
                  </a>
                </TableCell>
                {hasTimestamp && (
                  <TableCell>
                    {user.timestamp
                      ? new Date(user.timestamp * 1000).toLocaleDateString()
                      : "-"}
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </div>
  );
}
