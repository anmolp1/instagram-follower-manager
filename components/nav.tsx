"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, Upload, Users, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/diff", label: "Analysis", icon: Users },
  { href: "/history", label: "History", icon: Clock },
];

export function Nav() {
  const pathname = usePathname();

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
      </div>
    </nav>
  );
}
