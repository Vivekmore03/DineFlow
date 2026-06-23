"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageIcon, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

interface LogoUploaderProps {
  currentLogo?: string | null;
  onUpload: (url: string) => void;
  disabled?: boolean;
}

export function LogoUploader({ currentLogo, onUpload, disabled }: LogoUploaderProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(currentLogo ?? null);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(
    async (file: File) => {
      const ALLOWED = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
      const MAX_SIZE = 5 * 1024 * 1024;

      if (!ALLOWED.includes(file.type)) {
        toast.error("Invalid file type. Please use JPG, PNG, or WebP.");
        return;
      }
      if (file.size > MAX_SIZE) {
        toast.error("File is too large. Maximum size is 5MB.");
        return;
      }

      // Show local preview immediately
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
      setIsUploading(true);
      setUploadSuccess(false);

      try {
        const formData = new FormData();
        formData.append("file", file);
        formData.append("folder", "qr-dine/logos");

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || "Upload failed");
        }

        const data = await res.json();
        onUpload(data.url);
        setPreviewUrl(data.url);
        setUploadSuccess(true);
        toast.success("Logo uploaded successfully!");
      } catch (error) {
        toast.error(error instanceof Error ? error.message : "Upload failed");
        setPreviewUrl(currentLogo ?? null);
      } finally {
        setIsUploading(false);
        URL.revokeObjectURL(objectUrl);
      }
    },
    [currentLogo, onUpload]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFile(file);
    },
    [handleFile]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  };

  const clearLogo = () => {
    setPreviewUrl(null);
    setUploadSuccess(false);
    onUpload("");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  return (
    <div className="flex flex-col gap-3">
      <div
        className={cn(
          "relative flex flex-col items-center justify-center w-full rounded-xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden",
          isDragging
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-muted/30 bg-card/50",
          disabled && "opacity-50 pointer-events-none"
        )}
        style={{ minHeight: 160 }}
        onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => !isUploading && fileInputRef.current?.click()}
      >
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/jpg,image/png,image/webp"
          className="hidden"
          onChange={handleInputChange}
          disabled={disabled || isUploading}
        />

        {previewUrl ? (
          /* Logo Preview State */
          <div className="relative w-full h-40 group">
            <Image
              src={previewUrl}
              alt="Restaurant logo preview"
              fill
              className="object-contain p-4"
              sizes="(max-width: 768px) 100vw, 400px"
            />
            {/* Overlay on hover */}
            <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl">
              <span className="text-white text-xs font-semibold">Click to replace</span>
            </div>
            {/* Success badge */}
            {uploadSuccess && (
              <div className="absolute top-2 right-2 flex items-center gap-1 bg-emerald-500 text-white text-[10px] font-bold px-2 py-1 rounded-full shadow-sm">
                <CheckCircle2 className="h-3 w-3" />
                Uploaded
              </div>
            )}
          </div>
        ) : isUploading ? (
          /* Uploading State */
          <div className="flex flex-col items-center gap-3 py-10">
            <Loader2 className="h-8 w-8 text-primary animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">Uploading to Cloudinary…</p>
          </div>
        ) : (
          /* Empty Drop Zone State */
          <div className="flex flex-col items-center gap-3 py-10 px-4 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-secondary border border-border/60">
              {isDragging ? (
                <Upload className="h-5 w-5 text-primary animate-bounce" />
              ) : (
                <ImageIcon className="h-5 w-5 text-muted-foreground" />
              )}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">
                {isDragging ? "Drop to upload" : "Upload restaurant logo"}
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Drag & drop or click · JPG, PNG, WebP · Max 5MB
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Clear button */}
      {previewUrl && !isUploading && (
        <Button
          type="button"
          variant="ghost"
          size="sm"
          onClick={(e) => { e.stopPropagation(); clearLogo(); }}
          className="self-start text-xs text-muted-foreground hover:text-destructive gap-1.5 h-7 px-2 cursor-pointer"
          disabled={disabled}
        >
          <X className="h-3.5 w-3.5" />
          Remove logo
        </Button>
      )}
    </div>
  );
}
