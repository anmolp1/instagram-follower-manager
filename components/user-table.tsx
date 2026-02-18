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
import { Copy, Download, Search } from "lucide-react";
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
  showDownload?: boolean;
  emptyMessage?: string;
}

function downloadFile(filename: string, content: string) {
  const blob = new Blob([content], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export function UserTable({
  users,
  selectable = false,
  showDownload = false,
  emptyMessage = "No users to display.",
}: UserTableProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
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

  const downloadList = (usernames: string[]) => {
    downloadFile("unfollow_list.txt", usernames.join("\n") + "\n");
    toast.success(
      `Downloaded ${usernames.length} usernames. Run: python unfollow.py unfollow_list.txt`
    );
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
              {showDownload && (
                <Button
                  variant="destructive"
                  size="sm"
                  onClick={() =>
                    downloadList(
                      filteredUsers
                        .filter((u) => selected.has(u.username))
                        .map((u) => u.username)
                    )
                  }
                >
                  <Download className="size-4" />
                  Download Selected
                </Button>
              )}
              <Button variant="outline" size="sm" onClick={copySelectedLinks}>
                <Copy className="size-4" />
                Copy Links
              </Button>
            </>
          )}
          {showDownload && (
            <Button
              variant="outline"
              size="sm"
              onClick={() =>
                downloadList(filteredUsers.map((u) => u.username))
              }
              disabled={filteredUsers.length === 0}
            >
              <Download className="size-4" />
              Download All
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
