"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import Image from "next/image";
import {
  X, Upload, ImageIcon, CheckCircle2, Loader2, AlertCircle,
  IndianRupee, AlignLeft, Tag, FolderOpen, ToggleLeft, ToggleRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormGroup, FormFeedback, FormDescription } from "@/components/ui/form";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

export interface MenuItemFormData {
  categoryId: string;
  name: string;
  description: string;
  price: number;
  image: string | null;
  isAvailable: boolean;
}

export interface CategoryOption {
  id: string;
  name: string;
}

interface MenuItemFormErrors {
  categoryId?: string;
  name?: string;
  description?: string;
  price?: string;
  image?: string;
}

interface MenuItemFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: MenuItemFormData) => Promise<void>;
  categories: CategoryOption[];
  restaurantId: string;
  initialData?: Partial<MenuItemFormData> & { id?: string };
}

// ─── Inline Image Uploader ────────────────────────────────────────────────────
function ItemImageUploader({
  currentImage,
  restaurantId,
  onUpload,
  disabled,
}: {
  currentImage: string | null;
  restaurantId: string;
  onUpload: (url: string | null) => void;
  disabled?: boolean;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(currentImage);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!ALLOWED.includes(file.type)) { toast.error("Use JPG, PNG, or WebP"); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error("Max 5 MB"); return; }

    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    setIsUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "qr-dine/menu");
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const data = await res.json();
      onUpload(data.url);
      setPreview(data.url);
      toast.success("Image uploaded!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
      setPreview(currentImage);
      onUpload(currentImage);
    } finally {
      setIsUploading(false);
      URL.revokeObjectURL(objectUrl);
    }
  }, [currentImage, onUpload]);

  return (
    <div className="flex items-start gap-3">
      {/* Thumbnail */}
      <div
        className={cn(
          "relative flex-shrink-0 h-20 w-20 rounded-xl border-2 border-dashed border-border bg-muted/30 flex items-center justify-center overflow-hidden cursor-pointer transition-all hover:border-primary/50 hover:bg-muted/50",
          disabled && "pointer-events-none opacity-50"
        )}
        onClick={() => !isUploading && fileRef.current?.click()}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          disabled={disabled || isUploading}
        />
        {isUploading ? (
          <Loader2 className="h-5 w-5 text-primary animate-spin" />
        ) : preview ? (
          <Image src={preview} alt="Item image" fill className="object-cover" sizes="80px" />
        ) : (
          <ImageIcon className="h-6 w-6 text-muted-foreground/50" />
        )}
        {preview && !isUploading && (
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setPreview(null); onUpload(null); }}
            className="absolute top-1 right-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white hover:bg-destructive transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      <div className="flex flex-col justify-center gap-1.5">
        <Button
          type="button"
          variant="secondary"
          size="sm"
          onClick={() => fileRef.current?.click()}
          disabled={isUploading || disabled}
          className="gap-1.5 cursor-pointer text-xs h-8"
        >
          <Upload className="h-3.5 w-3.5" />
          {preview ? "Replace Photo" : "Upload Photo"}
        </Button>
        <p className="text-[10px] text-muted-foreground">JPG, PNG, WebP · Max 5MB</p>
      </div>
    </div>
  );
}

// ─── Main Form Modal ──────────────────────────────────────────────────────────
export function MenuItemFormModal({
  open, onClose, onSubmit, categories, restaurantId, initialData,
}: MenuItemFormModalProps) {
  const isEditing = !!initialData?.id;

  const [categoryId, setCategoryId] = useState(initialData?.categoryId ?? "");
  const [name, setName] = useState(initialData?.name ?? "");
  const [description, setDescription] = useState(initialData?.description ?? "");
  const [price, setPrice] = useState(initialData?.price != null ? String(initialData.price) : "");
  const [image, setImage] = useState<string | null>(initialData?.image ?? null);
  const [isAvailable, setIsAvailable] = useState(initialData?.isAvailable ?? true);
  const [errors, setErrors] = useState<MenuItemFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (open) {
      setCategoryId(initialData?.categoryId ?? (categories[0]?.id ?? ""));
      setName(initialData?.name ?? "");
      setDescription(initialData?.description ?? "");
      setPrice(initialData?.price != null ? String(initialData.price) : "");
      setImage(initialData?.image ?? null);
      setIsAvailable(initialData?.isAvailable ?? true);
      setErrors({});
    }
  }, [open, initialData, categories]);

  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [open, onClose]);

  const validate = () => {
    const e: MenuItemFormErrors = {};
    if (!categoryId) e.categoryId = "Please select a category";
    if (!name.trim()) e.name = "Item name is required";
    else if (name.trim().length > 120) e.name = "Name too long (max 120 chars)";
    if (description.length > 500) e.description = "Description too long (max 500 chars)";
    const p = parseFloat(price);
    if (!price) e.price = "Price is required";
    else if (isNaN(p) || p < 0) e.price = "Enter a valid price";
    else if (p > 99999) e.price = "Price seems too high";
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSubmit({
        categoryId,
        name: name.trim(),
        description: description.trim(),
        price: parseFloat(price),
        image,
        isAvailable,
      });
      onClose();
    } catch { /* parent handles toast */ }
    finally { setIsSaving(false); }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-xl overflow-hidden flex flex-col animate-in zoom-in-95 slide-in-from-bottom-4 duration-200 max-h-[90dvh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border shrink-0">
          <div>
            <h2 className="text-sm font-semibold text-foreground">
              {isEditing ? "Edit Menu Item" : "Add Menu Item"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEditing ? "Update item details." : "Fill in the details for the new dish."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer ml-4 shrink-0"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Scrollable body */}
        <form onSubmit={handleSubmit} className="overflow-y-auto flex-1">
          <div className="px-6 py-5 space-y-5">
            {/* Image */}
            <FormGroup>
              <Label>Photo</Label>
              <div className="mt-1.5">
                <ItemImageUploader
                  currentImage={image}
                  restaurantId={restaurantId}
                  onUpload={setImage}
                />
              </div>
            </FormGroup>

            {/* Category */}
            <FormGroup>
              <Label htmlFor="item-category">
                <span className="flex items-center gap-1">
                  <FolderOpen className="h-3.5 w-3.5 text-muted-foreground" />
                  Category *
                </span>
              </Label>
              <select
                id="item-category"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className={cn(
                  "flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring cursor-pointer mt-1.5",
                  errors.categoryId && "border-destructive focus-visible:ring-destructive"
                )}
              >
                <option value="" disabled>Select a category…</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <FormFeedback type="error">{errors.categoryId}</FormFeedback>
            </FormGroup>

            {/* Name */}
            <FormGroup>
              <Label htmlFor="item-name">
                <span className="flex items-center gap-1">
                  <Tag className="h-3.5 w-3.5 text-muted-foreground" />
                  Item Name *
                </span>
              </Label>
              <Input
                id="item-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Paneer Tikka, Masala Chai"
                error={!!errors.name}
                className="mt-1.5"
              />
              <FormFeedback type="error">{errors.name}</FormFeedback>
            </FormGroup>

            {/* Description */}
            <FormGroup>
              <Label htmlFor="item-desc">
                <span className="flex items-center gap-1">
                  <AlignLeft className="h-3.5 w-3.5 text-muted-foreground" />
                  Description
                </span>
              </Label>
              <textarea
                id="item-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                placeholder="Briefly describe the dish — ingredients, spice level, etc."
                className={cn(
                  "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:opacity-50 resize-none mt-1.5 duration-150",
                  errors.description && "border-destructive"
                )}
              />
              <div className="flex items-center justify-between mt-1">
                <FormFeedback type="error">{errors.description}</FormFeedback>
                <span className={cn(
                  "text-[10px] ml-auto",
                  description.length > 450 ? "text-amber-500" : "text-muted-foreground/60",
                  description.length > 500 && "text-destructive"
                )}>
                  {description.length}/500
                </span>
              </div>
            </FormGroup>

            {/* Price + Availability */}
            <div className="grid grid-cols-2 gap-4">
              <FormGroup>
                <Label htmlFor="item-price">
                  <span className="flex items-center gap-1">
                    <IndianRupee className="h-3.5 w-3.5 text-muted-foreground" />
                    Price *
                  </span>
                </Label>
                <div className="relative mt-1.5">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground font-medium">₹</span>
                  <Input
                    id="item-price"
                    type="number"
                    value={price}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0.00"
                    min="0"
                    step="0.50"
                    error={!!errors.price}
                    className="pl-7"
                  />
                </div>
                <FormFeedback type="error">{errors.price}</FormFeedback>
              </FormGroup>

              <FormGroup>
                <Label>Availability</Label>
                <button
                  type="button"
                  onClick={() => setIsAvailable((v) => !v)}
                  className={cn(
                    "flex items-center gap-2 h-9 px-3 rounded-md border text-sm font-medium transition-all duration-200 mt-1.5 cursor-pointer w-full",
                    isAvailable
                      ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-600 dark:text-emerald-400"
                      : "bg-muted border-border text-muted-foreground"
                  )}
                >
                  {isAvailable
                    ? <ToggleRight className="h-4 w-4" />
                    : <ToggleLeft className="h-4 w-4" />
                  }
                  {isAvailable ? "Available" : "Unavailable"}
                </button>
                <FormDescription>
                  {isAvailable ? "Visible to customers" : "Hidden from menu"}
                </FormDescription>
              </FormGroup>
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex justify-end gap-2.5 px-6 py-4 border-t border-border shrink-0 bg-card">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={isSaving} className="cursor-pointer">Cancel</Button>
          <Button
            type="button"
            variant="primary"
            size="sm"
            isLoading={isSaving}
            onClick={handleSubmit as unknown as React.MouseEventHandler}
            className="min-w-32 cursor-pointer"
          >
            {!isSaving && (isEditing ? "Save Changes" : "Add Item")}
          </Button>
        </div>
      </div>
    </div>
  );
}
