"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Upload, Users, Clock, Trash2, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

const navLinks = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/diff", label: "Analysis", icon: Users },
  { href: "/history", label: "History", icon: Clock },
];

export function Nav() {
  const pathname = usePathname();
  const router = useRouter();
  const [hasData, setHasData] = useState(false);
  const [clearing, setClearing] = useState(false);

  useEffect(() => {
    fetch("/api/snapshots")
      .then((res) => res.json())
      .then((data) => setHasData(Array.isArray(data.snapshots) && data.snapshots.length > 0))
      .catch(() => setHasData(false));
  }, [pathname]);

  const handleClearData = async () => {
    setClearing(true);
    try {
      await fetch("/api/logout", { method: "POST" });
      setHasData(false);
      toast.success("All data cleared");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to clear data");
    } finally {
      setClearing(false);
    }
  };

  return (
    <nav className="border-b">
      <div className="mx-auto flex h-14 max-w-7xl items-center gap-6 px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Instagram Follower Manager
        </Link>

        <div className="flex items-center gap-1">
          {navLinks.map(({ href, label, icon: Icon }) => {
            const isActive =
              href === "/" ? pathname === "/" : pathname.startsWith(href);

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="size-4" />
                {label}
              </Link>
            );
          })}
        </div>

        {hasData && (
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearData}
              disabled={clearing}
              className="text-muted-foreground hover:text-foreground gap-2"
            >
              {clearing ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              {clearing ? "Clearing..." : "Clear Data"}
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
