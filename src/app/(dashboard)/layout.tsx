import { AdminSidebar } from "@/components/layout/admin-sidebar";
import { AdminHeader } from "@/components/layout/admin-header";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-screen w-screen overflow-hidden bg-background">
      {/* Desktop Sidebar (hidden on mobile) */}
      <div className="hidden md:block shrink-0 h-full">
        <AdminSidebar />
      </div>

      {/* Main Viewport Container */}
      <div className="flex flex-col flex-1 h-full min-w-0">
        <AdminHeader />
        
        {/* Scrollable Main Content Frame */}
        <main className="flex-1 overflow-y-auto bg-muted/15 dark:bg-card/5 p-6">
          <div className="max-w-7xl mx-auto w-full h-full animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
