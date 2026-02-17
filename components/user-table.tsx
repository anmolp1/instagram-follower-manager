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
import { Copy, Loader2, Search, UserMinus } from "lucide-react";
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
  emptyMessage?: string;
  onUnfollow?: (users: UserTableUser[]) => Promise<{ successCount: number; failCount: number }>;
}

export function UserTable({
  users,
  selectable = false,
  emptyMessage = "No users to display.",
  onUnfollow,
}: UserTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState("");
  const [unfollowing, setUnfollowing] = useState(false);
  const [unfollowed, setUnfollowed] = useState<Set<string>>(new Set());

  const hasTimestamp = users.some((u) => u.timestamp !== undefined);

  const visibleUsers = useMemo(() => {
    return users.filter((u) => !unfollowed.has(u.username));
  }, [users, unfollowed]);

  const filteredUsers = useMemo(() => {
    if (!search.trim()) return visibleUsers;
    const query = search.toLowerCase();
    return visibleUsers.filter((u) => u.username.toLowerCase().includes(query));
  }, [visibleUsers, search]);

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

  const handleUnfollow = async () => {
    if (!onUnfollow) return;

    const selectedUsers = filteredUsers.filter((u) => selected.has(u.username));
    if (selectedUsers.length === 0) {
      toast.error("No users selected");
      return;
    }

    const missingIds = selectedUsers.filter((u) => !u.userId);
    if (missingIds.length > 0) {
      toast.error(
        "Some users are missing IDs. Re-import your data using the session cookie method to enable unfollowing."
      );
      return;
    }

    setUnfollowing(true);
    try {
      const result = await onUnfollow(selectedUsers);
      if (result.successCount > 0) {
        // Remove successfully unfollowed users from view
        const successUsernames = new Set(
          selectedUsers.slice(0, result.successCount).map((u) => u.username)
        );
        setUnfollowed((prev) => new Set([...prev, ...successUsernames]));
        setSelected((prev) => {
          const next = new Set(prev);
          successUsernames.forEach((u) => next.delete(u));
          return next;
        });
        toast.success(`Unfollowed ${result.successCount} user(s)`);
      }
      if (result.failCount > 0) {
        toast.error(`Failed to unfollow ${result.failCount} user(s)`);
      }
    } catch (error) {
      toast.error(
        error instanceof Error ? error.message : "Unfollow failed"
      );
    } finally {
      setUnfollowing(false);
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
              {onUnfollow && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={handleUnfollow}
                  disabled={unfollowing}
                >
                  {unfollowing ? (
                    <Loader2 className="size-4 animate-spin" />
                  ) : (
                    <UserMinus className="size-4" />
                  )}
                  {unfollowing ? "Unfollowing..." : "Unfollow Selected"}
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={copySelectedLinks}>
                <Copy className="size-4" />
                Copy Selected
              </Button>
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

      {/* Unfollow count */}
      {unfollowed.size > 0 && (
        <div className="bg-muted/50 rounded-md px-3 py-2 text-sm">
          Unfollowed <strong>{unfollowed.size}</strong> user(s) this session.
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
