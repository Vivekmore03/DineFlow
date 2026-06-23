"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ChevronRight, Home } from "lucide-react";
import React from "react";

export function Breadcrumbs() {
  const pathname = usePathname();
  const paths = pathname.split("/").filter(Boolean);

  if (paths.length === 0) return null;

  return (
    <nav className="flex items-center gap-1.5 text-xs text-muted-foreground select-none">
      <Link
        href="/dashboard"
        className="flex items-center gap-1 hover:text-foreground transition-colors"
      >
        <Home className="h-3.5 w-3.5" />
      </Link>

      {paths.map((path, idx) => {
        const href = `/${paths.slice(0, idx + 1).join("/")}`;
        const isLast = idx === paths.length - 1;
        
        // Exclude root group folder keywords or dynamic parameters if any
        if (path.toLowerCase() === "dashboard" && idx === 0) return null;

        // Beautify path labels
        const label = path
          .replace(/-/g, " ")
          .replace(/\b\w/g, (char) => char.toUpperCase());

        return (
          <React.Fragment key={path}>
            <ChevronRight className="h-3 w-3 shrink-0 text-muted-foreground/60" />
            {isLast ? (
              <span className="font-medium text-foreground truncate max-w-[120px] sm:max-w-none">
                {label}
              </span>
            ) : (
              <Link
                href={href}
                className="hover:text-foreground transition-colors truncate max-w-[120px]"
              >
                {label}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
}
