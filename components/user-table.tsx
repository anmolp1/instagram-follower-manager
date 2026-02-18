"use client";

import { useMemo, useState } from "react";
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
import { Copy, ExternalLink, RotateCcw, Search } from "lucide-react";
import { toast } from "sonner";

const BATCH_SIZE = 5;

interface UserTableUser {
  username: string;
  profileUrl: string;
  userId?: number;
  timestamp?: number;
}

interface UserTableProps {
  users: UserTableUser[];
  selectable?: boolean;
  showBatchOpen?: boolean;
  emptyMessage?: string;
}

export function UserTable({
  users,
  selectable = false,
  showBatchOpen = false,
  emptyMessage = "No users to display.",
}: UserTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [opened, setOpened] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");

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

  // Get the next batch of unopened users from the filtered list
  const getNextBatch = () => {
    return filteredUsers
      .filter((u) => !opened.has(u.username))
      .slice(0, BATCH_SIZE);
  };

  const openNextBatch = () => {
    const batch = getNextBatch();
    if (batch.length === 0) {
      toast("All profiles have been opened!");
      return;
    }

    batch.forEach((u) => {
      window.open(getProfileLink(u.username), "_blank");
    });

    setOpened((prev) => {
      const next = new Set(prev);
      batch.forEach((u) => next.add(u.username));
      return next;
    });

    const remaining = filteredUsers.filter(
      (u) => !opened.has(u.username) && !batch.find((b) => b.username === u.username)
    ).length;

    toast.success(
      `Opened ${batch.length} profile${batch.length > 1 ? "s" : ""}. ${remaining} remaining.`,
      { duration: 4000 }
    );
  };

  const openedCount = filteredUsers.filter((u) => opened.has(u.username)).length;
  const remainingCount = filteredUsers.length - openedCount;

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
              <Button variant="outline" size="sm" onClick={copySelectedLinks}>
                <Copy className="size-4" />
                Copy Links
              </Button>
            </>
          )}

          {showBatchOpen && (
            <>
              <Button
                size="sm"
                onClick={openNextBatch}
                disabled={remainingCount === 0}
              >
                <ExternalLink className="size-4" />
                Open Next {Math.min(BATCH_SIZE, remainingCount)}
              </Button>
              {openedCount > 0 && (
                <>
                  <span className="text-muted-foreground text-sm">
                    {openedCount}/{filteredUsers.length} opened
                  </span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setOpened(new Set())}
                    title="Reset progress"
                  >
                    <RotateCcw className="size-4" />
                  </Button>
                </>
              )}
            </>
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

      {/* Batch open instructions */}
      {showBatchOpen && filteredUsers.length > 0 && openedCount === 0 && (
        <div className="bg-muted/50 rounded-md border px-4 py-3 text-sm">
          <strong>How to unfollow:</strong> Click{" "}
          <span className="font-medium">&quot;Open Next {Math.min(BATCH_SIZE, filteredUsers.length)}&quot;</span>{" "}
          to open profiles in new tabs. Unfollow each one manually, close the tabs, and
          click again for the next batch. Progress is tracked here.
        </div>
      )}

      {/* Progress bar */}
      {showBatchOpen && openedCount > 0 && (
        <div className="space-y-1">
          <div className="bg-muted h-2 overflow-hidden rounded-full">
            <div
              className="bg-primary h-full transition-all duration-300"
              style={{
                width: `${(openedCount / filteredUsers.length) * 100}%`,
              }}
            />
          </div>
          <p className="text-muted-foreground text-xs">
            {openedCount} of {filteredUsers.length} profiles opened
            {remainingCount > 0 && ` — ${remainingCount} remaining`}
          </p>
        </div>
      )}

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
              {showBatchOpen && <TableHead className="w-16">Status</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow
                key={user.username}
                data-state={selected.has(user.username) ? "selected" : undefined}
                className={opened.has(user.username) ? "opacity-50" : ""}
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
                {showBatchOpen && (
                  <TableCell>
                    {opened.has(user.username) ? (
                      <span className="text-muted-foreground text-xs">Opened</span>
                    ) : null}
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
