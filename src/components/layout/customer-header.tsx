"use client";

import { useState } from "react";
import { ConciergeBell, Receipt, Utensils } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { toast } from "@/components/ui/toast";

interface CustomerHeaderProps {
  restaurantName: string;
  tableName: string;
  tableNumber: number;
  slug: string;
  tableId: string;
}

export function CustomerHeader({
  restaurantName,
  tableName,
  tableNumber,
  slug,
  tableId,
}: CustomerHeaderProps) {
  const [waiterModalOpen, setWaiterModalOpen] = useState(false);
  const [billModalOpen, setBillModalOpen] = useState(false);
  const [waiterLoading, setWaiterLoading] = useState(false);
  const [billLoading, setBillLoading] = useState(false);

  const handleCallWaiter = async () => {
    setWaiterLoading(true);
    try {
      const sessionToken = localStorage.getItem(`qrd_session_${tableId}`);
      if (!sessionToken) {
        toast.error("Active session not found. Please place an order first or scan the QR again.");
        return;
      }

      const res = await fetch(`/api/customer/${slug}/${tableId}/waiter-calls`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to call staff");
      } else {
        toast.success(data.message || "Staff member called successfully!");
        setWaiterModalOpen(false);
      }
    } catch {
      toast.error("Failed to call staff. Please check your connection.");
    } finally {
      setWaiterLoading(false);
    }
  };

  const handleRequestBill = async () => {
    setBillLoading(true);
    try {
      const sessionToken = localStorage.getItem(`qrd_session_${tableId}`);
      if (!sessionToken) {
        toast.error("Active session not found. Please place an order first or scan the QR again.");
        return;
      }

      const res = await fetch(`/api/customer/${slug}/${tableId}/bill-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionToken }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Failed to request bill");
      } else {
        toast.success(data.message || "Bill request sent!");
        setBillModalOpen(false);
      }
    } catch {
      toast.error("Failed to request bill. Please check your connection.");
    } finally {
      setBillLoading(false);
    }
  };

  return (
    <>
      <header className="sticky top-0 z-30 flex h-14 w-full items-center justify-between border-b border-border bg-background/90 backdrop-blur-md px-4 select-none">
        {/* Left: Branding & Table Info */}
        <div className="flex items-center gap-2">
          <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary text-primary-foreground shadow-xs">
            <Utensils className="h-4 w-4" />
          </div>
          <div className="flex flex-col min-w-0">
            <span className="font-bold text-xs text-foreground tracking-tight leading-none truncate max-w-[120px]">
              {restaurantName}
            </span>
            <span className="text-[9px] text-muted-foreground font-semibold mt-1">
              {tableName}
            </span>
          </div>
        </div>

        {/* Right: Quick actions */}
        <div className="flex items-center gap-1.5">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setWaiterModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 rounded-full cursor-pointer hover:bg-secondary"
          >
            <ConciergeBell className="h-3.5 w-3.5 text-amber-500" />
            <span>Call Staff</span>
          </Button>

          <Button
            variant="ghost"
            size="sm"
            onClick={() => setBillModalOpen(true)}
            className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground h-8 px-2.5 rounded-full cursor-pointer hover:bg-secondary"
          >
            <Receipt className="h-3.5 w-3.5 text-emerald-500" />
            <span>Bill</span>
          </Button>
        </div>
      </header>

      {/* Call Waiter Dialog */}
      <Dialog open={waiterModalOpen} onOpenChange={setWaiterModalOpen}>
        <DialogContent className="max-w-xs md:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <ConciergeBell className="h-5 w-5 text-amber-500" />
              Need Assistance?
            </DialogTitle>
            <DialogDescription>
              We will notify the floor staff to visit {tableName}.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex-row gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setWaiterModalOpen(false)} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleCallWaiter} isLoading={waiterLoading} className="flex-1 sm:flex-initial bg-amber-500 hover:bg-amber-600 hover:shadow-none focus-visible:ring-amber-500">
              Confirm Call
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Request Bill Dialog */}
      <Dialog open={billModalOpen} onOpenChange={setBillModalOpen}>
        <DialogContent className="max-w-xs md:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="h-5 w-5 text-emerald-500" />
              Request Final Bill?
            </DialogTitle>
            <DialogDescription>
              This will request the staff to generate the summary bill for {tableName}. You can complete the physical payment at the counter.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="mt-2 flex-row gap-2 sm:justify-end">
            <Button variant="outline" size="sm" onClick={() => setBillModalOpen(false)} className="flex-1 sm:flex-initial">
              Cancel
            </Button>
            <Button variant="primary" size="sm" onClick={handleRequestBill} isLoading={billLoading} className="flex-1 sm:flex-initial bg-emerald-500 hover:bg-emerald-600 hover:shadow-none focus-visible:ring-emerald-500">
              Request Bill
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
