"use client";

import { useState, useEffect } from "react";
import { X, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormGroup, FormFeedback } from "@/components/ui/form";

interface CategoryFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: { name: string }) => Promise<void>;
  initialData?: { name: string };
}

export function CategoryFormModal({ open, onClose, onSubmit, initialData }: CategoryFormModalProps) {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name ?? "");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) { setName(initialData?.name ?? ""); setError(""); }
  }, [open, initialData]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) { setError("Category name is required"); return; }
    if (trimmed.length > 80) { setError("Name too long (max 80 characters)"); return; }
    setError("");
    setIsSaving(true);
    try { await onSubmit({ name: trimmed }); onClose(); }
    catch { /* parent shows toast */ }
    finally { setIsSaving(false); }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div className="flex items-center gap-2.5">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 border border-primary/15">
              <FolderOpen className="h-4 w-4 text-primary" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">
                {isEditing ? "Edit Category" : "New Category"}
              </h2>
              <p className="text-xs text-muted-foreground">
                {isEditing ? "Update the category name." : "Add a section to organize your menu."}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <FormGroup>
            <Label htmlFor="cat-name">Category Name *</Label>
            <Input
              id="cat-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Starters, Main Course, Desserts…"
              error={!!error}
              autoFocus
              className="mt-1.5"
            />
            <FormFeedback type="error">{error}</FormFeedback>
          </FormGroup>

          <div className="flex justify-end gap-2.5 pt-1">
            <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSaving} className="cursor-pointer">Cancel</Button>
            <Button type="submit" variant="primary" size="sm" isLoading={isSaving} className="min-w-28 cursor-pointer">
              {!isSaving && (isEditing ? "Save Changes" : "Create Category")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
