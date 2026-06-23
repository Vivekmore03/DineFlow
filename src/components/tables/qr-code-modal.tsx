"use client";

import { useEffect, useRef, useState } from "react";
import {
  QrCode, Download, ExternalLink, RefreshCw, Copy, Check, X
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { generateQrPngDataUrl, buildTableQrUrl, downloadQrPng, downloadQrSvg } from "@/lib/qr";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface QrCodeModalProps {
  open: boolean;
  onClose: () => void;
  table: { id: string; name: string; number: number; qrCode?: string | null } | null;
  restaurantSlug: string;
  restaurantId: string;
  onRegenerate: (tableId: string, newQrSvg: string) => void;
  onDeleteQr: (tableId: string) => void;
}

export function QrCodeModal({
  open,
  onClose,
  table,
  restaurantSlug,
  restaurantId,
  onRegenerate,
  onDeleteQr,
}: QrCodeModalProps) {
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [copied, setCopied] = useState(false);
  const backdropRef = useRef<HTMLDivElement>(null);

  // Trap focus / close on Escape
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  if (!open || !table) return null;

  const qrUrl = buildTableQrUrl(restaurantSlug, table.id);

  const handleCopyUrl = async () => {
    await navigator.clipboard.writeText(qrUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
    toast.success("Link copied to clipboard!");
  };

  const handleDownloadPng = async () => {
    try {
      const dataUrl = await generateQrPngDataUrl(qrUrl);
      downloadQrPng(dataUrl, `qr-table-${table.number}-${table.name.replace(/\s+/g, "-").toLowerCase()}.png`);
    } catch {
      toast.error("Failed to generate PNG");
    }
  };

  const handleDownloadSvg = () => {
    if (!table.qrCode) {
      toast.error("No QR code available");
      return;
    }
    downloadQrSvg(table.qrCode, `qr-table-${table.number}-${table.name.replace(/\s+/g, "-").toLowerCase()}.svg`);
  };

  const handleRegenerate = async () => {
    setIsRegenerating(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/tables/${table.id}`, {
        method: "PATCH",
      });
      if (!res.ok) throw new Error("Regeneration failed");
      const data = await res.json();
      onRegenerate(table.id, data.table.qrCode);
      toast.success("QR code regenerated!");
    } catch {
      toast.error("Failed to regenerate QR code");
    } finally {
      setIsRegenerating(false);
    }
  };

  const handleDeleteQr = async () => {
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/tables/${table.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ qrCode: null }),
      });
      if (!res.ok) throw new Error("Deletion failed");
      onDeleteQr(table.id);
      toast.success("QR code deleted!");
    } catch {
      toast.error("Failed to delete QR code");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    // Backdrop
    <div
      ref={backdropRef}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
    >
      {/* Panel */}
      <div className="relative w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/15">
              <QrCode className="h-4 w-4 text-primary" />
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{table.name}</p>
              <p className="text-[11px] text-muted-foreground">Table #{table.number}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* QR Code Display */}
        <div className="flex flex-col items-center gap-5 px-6 py-6">
          {table.qrCode ? (
            <div className="rounded-xl bg-white p-4 shadow-sm border border-border/40 w-52 h-52 flex items-center justify-center overflow-hidden">
              <div
                className="w-full h-full"
                dangerouslySetInnerHTML={{ __html: table.qrCode }}
              />
            </div>
          ) : (
            <div className="rounded-xl bg-muted w-52 h-52 flex flex-col items-center justify-center gap-2 border border-dashed border-border">
              <QrCode className="h-10 w-10 text-muted-foreground/40" />
              <p className="text-xs text-muted-foreground">No QR code yet</p>
            </div>
          )}

          {/* URL chip */}
          <div className="flex items-center gap-1.5 w-full rounded-lg bg-muted/50 border border-border/60 px-3 py-2">
            <p className="text-[11px] font-mono text-muted-foreground truncate flex-1">{qrUrl}</p>
            <button
              onClick={handleCopyUrl}
              className="shrink-0 flex items-center justify-center h-5 w-5 rounded transition-colors hover:text-foreground text-muted-foreground cursor-pointer"
              title="Copy link"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
            </button>
            <a
              href={qrUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 flex items-center justify-center h-5 w-5 rounded transition-colors hover:text-foreground text-muted-foreground"
              title="Open link"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </div>

        {/* Actions Footer */}
        <div className="flex flex-col gap-2.5 px-6 pb-6">
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadPng}
              className="gap-1.5 cursor-pointer text-xs"
              disabled={!table.qrCode}
            >
              <Download className="h-3.5 w-3.5" />
              Download PNG
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDownloadSvg}
              className="gap-1.5 cursor-pointer text-xs"
              disabled={!table.qrCode}
            >
              <Download className="h-3.5 w-3.5" />
              Download SVG
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRegenerate}
            isLoading={isRegenerating}
            className="gap-1.5 cursor-pointer text-xs text-muted-foreground w-full"
          >
            {!isRegenerating && <RefreshCw className="h-3.5 w-3.5" />}
            {table.qrCode ? "Regenerate QR Code" : "Generate QR Code"}
          </Button>
          {table.qrCode && (
            <Button
              variant="secondary"
              size="sm"
              onClick={handleDeleteQr}
              isLoading={isDeleting}
              className="gap-1.5 cursor-pointer text-xs w-full text-destructive hover:text-destructive hover:bg-destructive/5"
            >
              Delete QR Code
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
