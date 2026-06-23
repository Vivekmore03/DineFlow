"use client";

import Image from "next/image";

interface RestaurantHeaderProps {
  name: string;
  logo: string | null;
  tableName: string;
  tableNumber: number;
}

export function RestaurantHeader({ name, logo, tableName, tableNumber }: RestaurantHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-border/60 bg-card/90 backdrop-blur-sm sticky top-0 z-20">
      {/* Restaurant identity */}
      <div className="flex items-center gap-2.5 min-w-0">
        {logo && (
          <div className="relative h-9 w-9 rounded-lg overflow-hidden bg-muted shrink-0 border border-border/60">
            <Image src={logo} alt={name} fill className="object-cover" sizes="36px" />
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold text-foreground truncate leading-tight">{name}</p>
          <p className="text-[11px] text-muted-foreground">Welcome!</p>
        </div>
      </div>

      {/* Table badge */}
      <div className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-full bg-primary/8 border border-primary/15 shrink-0">
        <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
        <span className="text-[11px] font-semibold text-primary">
          {tableName}
        </span>
      </div>
    </div>
  );
}
