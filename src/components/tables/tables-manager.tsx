"use client";

import { useState, useCallback, useEffect } from "react";
import {
  Plus, QrCode, Pencil, Trash2, Search, MoreHorizontal,
  CheckCircle2, XCircle, AlertTriangle, TableProperties,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/loading";
import { EmptyStateComponent } from "@/components/ui/empty-state";
import { TableFormModal, TableFormData } from "./table-form-modal";
import { QrCodeModal } from "./qr-code-modal";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface TableRow {
  id: string;
  name: string;
  number: number;
  qrCode: string | null;
  isActive: boolean;
  createdAt: string;
  _count: { sessions: number };
}

interface TablesManagerProps {
  restaurantId: string;
  restaurantSlug: string;
}

// ─── Confirm Delete Dialog ────────────────────────────────────────────────────
function DeleteConfirmDialog({
  table,
  onConfirm,
  onCancel,
  isDeleting,
}: {
  table: TableRow;
  onConfirm: () => void;
  onCancel: () => void;
  isDeleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Delete {table.name}?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              This will permanently delete Table #{table.number} and its QR code. This action cannot be undone.
            </p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1 cursor-pointer" disabled={isDeleting}>
            Cancel
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={onConfirm}
            isLoading={isDeleting}
            className="flex-1 cursor-pointer"
          >
            {!isDeleting && "Delete Table"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Status Badge ─────────────────────────────────────────────────────────────
function StatusBadge({ isActive }: { isActive: boolean }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium",
        isActive
          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
          : "bg-muted text-muted-foreground border border-border"
      )}
    >
      {isActive
        ? <CheckCircle2 className="h-3 w-3" />
        : <XCircle className="h-3 w-3" />}
      {isActive ? "Active" : "Inactive"}
    </span>
  );
}

// ─── Action Menu ──────────────────────────────────────────────────────────────
function ActionMenu({
  table,
  onEdit,
  onQr,
  onToggleActive,
  onDelete,
  onDeleteQr,
}: {
  table: TableRow;
  onEdit: () => void;
  onQr: () => void;
  onToggleActive: () => void;
  onDelete: () => void;
  onDeleteQr: () => void;
}) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const handler = () => setOpen(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, [open]);

  return (
    <div className="relative" onClick={(e) => e.stopPropagation()}>
      <button
        onClick={(e) => { e.stopPropagation(); setOpen((v) => !v); }}
        className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors text-muted-foreground cursor-pointer"
      >
        <MoreHorizontal className="h-4 w-4" />
      </button>
      {open && (
        <div className="absolute right-0 top-8 z-20 w-44 bg-popover border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          {[
            { label: "View QR Code", icon: QrCode, action: onQr },
            { label: "Edit Table", icon: Pencil, action: onEdit },
            {
              label: table.isActive ? "Mark Inactive" : "Mark Active",
              icon: table.isActive ? XCircle : CheckCircle2,
              action: onToggleActive,
            },
          ].map((item) => (
            <button
              key={item.label}
              className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-foreground hover:bg-muted transition-colors cursor-pointer"
              onClick={() => { item.action(); setOpen(false); }}
            >
              <item.icon className="h-3.5 w-3.5 text-muted-foreground" />
              {item.label}
            </button>
          ))}
          {table.qrCode && (
            <>
              <div className="border-t border-border my-0.5" />
              <button
                className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors cursor-pointer"
                onClick={() => { onDeleteQr(); setOpen(false); }}
              >
                <Trash2 className="h-3.5 w-3.5 text-destructive" />
                Delete QR Code
              </button>
            </>
          )}
          <div className="border-t border-border my-0.5" />
          <button
            className="flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors cursor-pointer"
            onClick={() => { onDelete(); setOpen(false); }}
          >
            <Trash2 className="h-3.5 w-3.5" />
            Delete Table
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function TablesManager({ restaurantId, restaurantSlug }: TablesManagerProps) {
  const [tables, setTables] = useState<TableRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [createOpen, setCreateOpen] = useState(false);
  const [editTable, setEditTable] = useState<TableRow | null>(null);
  const [qrTable, setQrTable] = useState<TableRow | null>(null);
  const [deleteTable, setDeleteTable] = useState<TableRow | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ── Fetch ───────────────────────────────────────────────────────────────────
  const fetchTables = useCallback(async () => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/tables`);
      if (!res.ok) throw new Error();
      const data = await res.json();
      setTables(data.tables);
    } catch {
      toast.error("Failed to load tables");
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { fetchTables(); }, [fetchTables]);

  // ── Filter ──────────────────────────────────────────────────────────────────
  const filtered = tables.filter((t) => {
    const q = search.toLowerCase();
    return t.name.toLowerCase().includes(q) || String(t.number).includes(q);
  });

  // ── Create ──────────────────────────────────────────────────────────────────
  const handleCreate = async (data: TableFormData) => {
    const res = await fetch(`/api/restaurants/${restaurantId}/tables`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to create table");
      throw new Error();
    }
    const responseData = await res.json();
    setTables((prev) => [...prev, responseData.table].sort((a, b) => a.number - b.number));
    toast.success(`${data.name} created with QR code!`);
  };

  // ── Edit ────────────────────────────────────────────────────────────────────
  const handleEdit = async (data: TableFormData) => {
    if (!editTable) return;
    const res = await fetch(`/api/restaurants/${restaurantId}/tables/${editTable.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) {
      const err = await res.json();
      toast.error(err.error || "Failed to update table");
      throw new Error();
    }
    const responseData = await res.json();
    setTables((prev) =>
      prev.map((t) => (t.id === editTable.id ? { ...t, ...responseData.table } : t))
        .sort((a, b) => a.number - b.number)
    );
    toast.success("Table updated!");
  };

  // ── Toggle Active ───────────────────────────────────────────────────────────
  const handleToggleActive = async (table: TableRow) => {
    const res = await fetch(`/api/restaurants/${restaurantId}/tables/${table.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isActive: !table.isActive }),
    });
    if (!res.ok) {
      toast.error("Failed to update status");
      return;
    }
    setTables((prev) =>
      prev.map((t) => (t.id === table.id ? { ...t, isActive: !table.isActive } : t))
    );
    toast.success(`${table.name} marked ${!table.isActive ? "active" : "inactive"}`);
  };

  // ── Delete ──────────────────────────────────────────────────────────────────
  const handleDelete = async () => {
    if (!deleteTable) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/tables/${deleteTable.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to delete table");
        return;
      }
      setTables((prev) => prev.filter((t) => t.id !== deleteTable.id));
      toast.success(`${deleteTable.name} deleted`);
      setDeleteTable(null);
    } finally {
      setIsDeleting(false);
    }
  };

  // ── QR Update ───────────────────────────────────────────────────────────────
  const handleQrRegenerate = (tableId: string, newQrSvg: string) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, qrCode: newQrSvg } : t))
    );
    if (qrTable?.id === tableId) {
      setQrTable((prev) => prev ? { ...prev, qrCode: newQrSvg } : null);
    }
  };

  // ── Delete QR Code ──────────────────────────────────────────────────────────
  const handleDeleteQr = async (table: TableRow) => {
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/tables/${table.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: null }),
      });
      if (!res.ok) {
        const err = await res.json();
        toast.error(err.error || "Failed to delete QR code");
        return;
      }
      setTables((prev) =>
        prev.map((t) => (t.id === table.id ? { ...t, qrCode: null } : t))
      );
      toast.success(`QR code deleted for ${table.name}`);
    } catch {
      toast.error("Failed to delete QR code");
    }
  };

  const handleQrDelete = (tableId: string) => {
    setTables((prev) =>
      prev.map((t) => (t.id === tableId ? { ...t, qrCode: null } : t))
    );
    if (qrTable?.id === tableId) {
      setQrTable((prev) => prev ? { ...prev, qrCode: null } : null);
    }
  };

  const existingNumbers = tables.map((t) => t.number);

  // ── Render ──────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Page Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Tables</h1>
        <p className="text-sm text-muted-foreground">
          Manage dining tables and their QR codes. Each table gets a unique scannable link.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search tables…"
            className="pl-9"
          />
        </div>
        <Button
          variant="primary"
          size="sm"
          onClick={() => setCreateOpen(true)}
          className="gap-2 cursor-pointer whitespace-nowrap"
        >
          <Plus className="h-4 w-4" />
          Add Table
        </Button>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Total Tables", value: tables.length },
          { label: "Active", value: tables.filter((t) => t.isActive).length },
          { label: "Inactive", value: tables.filter((t) => !t.isActive).length },
        ].map((s) => (
          <div key={s.label} className="rounded-xl border border-border bg-card px-4 py-3">
            <p className="text-xl font-bold text-foreground">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Loading state */}
      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-16 w-full rounded-xl" />
          ))}
        </div>
      )}

      {/* Empty state */}
      {!isLoading && tables.length === 0 && (
        <EmptyStateComponent
          icon={TableProperties}
          title="No tables yet"
          description="Add your first table to start generating QR codes for customers to scan and view the menu."
          actionText="Add First Table"
          onAction={() => setCreateOpen(true)}
        />
      )}

      {/* Search empty */}
      {!isLoading && tables.length > 0 && filtered.length === 0 && (
        <EmptyStateComponent
          icon={Search}
          title="No tables found"
          description={`No tables match "${search}". Try a different search term.`}
        />
      )}

      {/* Table grid */}
      {!isLoading && filtered.length > 0 && (
        <div className="rounded-xl border border-border bg-card overflow-hidden">
          {/* Table header */}
          <div className="hidden sm:grid grid-cols-[3rem_1fr_1fr_auto_auto] gap-4 items-center px-5 py-3 border-b border-border bg-muted/30">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">#</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">QR Code</p>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider text-right">Actions</p>
          </div>

          {/* Rows */}
          <div className="divide-y divide-border">
            {filtered.map((table) => (
              <div
                key={table.id}
                className={cn(
                  "grid grid-cols-[3rem_1fr_auto] sm:grid-cols-[3rem_1fr_1fr_auto_auto] gap-4 items-center px-5 py-4 hover:bg-muted/20 transition-colors group",
                  !table.isActive && "opacity-60"
                )}
              >
                {/* Number */}
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-muted border border-border text-sm font-bold text-foreground font-mono">
                  {table.number}
                </div>

                {/* Name */}
                <div>
                  <p className="text-sm font-medium text-foreground">{table.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 sm:hidden">
                    {table.isActive ? "Active" : "Inactive"}
                  </p>
                </div>

                {/* Status — hidden on mobile */}
                <div className="hidden sm:flex">
                  <StatusBadge isActive={table.isActive} />
                </div>

                {/* QR Preview Button */}
                <button
                  onClick={() => setQrTable(table)}
                  className={cn(
                    "hidden sm:flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors cursor-pointer rounded-lg px-2 py-1.5 hover:bg-primary/5",
                  )}
                  title="View QR code"
                >
                  {table.qrCode ? (
                    <div
                      className="h-8 w-8 rounded bg-white flex items-center justify-center overflow-hidden border border-border/40"
                      dangerouslySetInnerHTML={{ __html: table.qrCode }}
                    />
                  ) : (
                    <QrCode className="h-5 w-5" />
                  )}
                  <span className="hidden lg:block">View QR</span>
                </button>

                {/* Action Menu */}
                <div className="flex justify-end">
                  <ActionMenu
                    table={table}
                    onQr={() => setQrTable(table)}
                    onEdit={() => setEditTable(table)}
                    onToggleActive={() => handleToggleActive(table)}
                    onDelete={() => setDeleteTable(table)}
                    onDeleteQr={() => handleDeleteQr(table)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <TableFormModal
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSubmit={handleCreate}
        existingNumbers={existingNumbers}
      />

      <TableFormModal
        open={!!editTable}
        onClose={() => setEditTable(null)}
        onSubmit={handleEdit}
        initialData={editTable ? { name: editTable.name, number: editTable.number } : undefined}
        existingNumbers={existingNumbers}
      />

      <QrCodeModal
        open={!!qrTable}
        onClose={() => setQrTable(null)}
        table={qrTable}
        restaurantSlug={restaurantSlug}
        restaurantId={restaurantId}
        onRegenerate={handleQrRegenerate}
        onDeleteQr={handleQrDelete}
      />

      {deleteTable && (
        <DeleteConfirmDialog
          table={deleteTable}
          onConfirm={handleDelete}
          onCancel={() => setDeleteTable(null)}
          isDeleting={isDeleting}
        />
      )}
    </div>
  );
}
