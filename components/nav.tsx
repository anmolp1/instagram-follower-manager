"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Home, Upload, Users, Clock, LogOut, Loader2 } from "lucide-react";
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
  const [hasSession, setHasSession] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  useEffect(() => {
    setHasSession(localStorage.getItem("ig_session") !== null);
  }, [pathname]);

  const handleLogout = async () => {
    setLoggingOut(true);
    try {
      // Clear server-side snapshots
      await fetch("/api/logout", { method: "POST" });
      // Clear client-side session
      localStorage.removeItem("ig_session");
      setHasSession(false);
      toast.success("Logged out — all data cleared");
      router.push("/");
      router.refresh();
    } catch {
      toast.error("Failed to clear data");
    } finally {
      setLoggingOut(false);
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

        {hasSession && (
          <div className="ml-auto">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              disabled={loggingOut}
              className="text-muted-foreground hover:text-foreground gap-2"
            >
              {loggingOut ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <LogOut className="size-4" />
              )}
              {loggingOut ? "Clearing..." : "Logout"}
            </Button>
          </div>
        )}
      </div>
    </nav>
  );
}
