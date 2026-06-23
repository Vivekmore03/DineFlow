import { CustomerHeader } from "@/components/layout/customer-header";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function CustomerLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string; tableId: string }>;
}) {
  const { slug, tableId } = await params;

  // 1. Fetch table and restaurant details server-side
  const table = await prisma.table.findFirst({
    where: { id: tableId, restaurant: { slug }, isActive: true },
    include: { restaurant: true },
  });

  if (!table) {
    notFound();
  }

  return (
    <div className="min-h-screen w-full bg-muted/30 dark:bg-black/60 md:py-8">
      {/* Mobile-First Device Simulator Frame on Desktop */}
      <div className="relative mx-auto flex min-h-screen w-full max-w-md flex-col border-x border-border/80 bg-background shadow-xl md:min-h-[844px] md:rounded-2xl md:border md:overflow-hidden">
        {/* Customer Mobile Header */}
        <CustomerHeader
          restaurantName={table.restaurant.name}
          tableName={table.name}
          tableNumber={table.number}
          slug={slug}
          tableId={tableId}
        />

        {/* Scrollable Customer Viewport */}
        <main className="flex-1 overflow-y-auto pb-16">
          <div className="w-full h-full p-4 animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
