import { KitchenNavigation } from "@/components/layout/kitchen-navigation";

export default function KitchenLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-background">
      {/* Kitchen Console Header */}
      <KitchenNavigation />

      {/* Main Order Queue Area */}
      <main className="flex-1 overflow-hidden bg-muted/15 dark:bg-card/5">
        <div className="h-full w-full p-6 animate-in fade-in duration-300">
          {children}
        </div>
      </main>
    </div>
  );
}
