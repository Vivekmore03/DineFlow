"use client";

import { useState, useEffect } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormGroup, FormFeedback } from "@/components/ui/form";
import { cn } from "@/lib/utils";

interface TableFormErrors {
  name?: string;
  number?: string;
}

export interface TableFormData {
  name: string;
  number: number;
}

interface TableFormModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (data: TableFormData) => Promise<void>;
  /** Provide to put the form in edit mode */
  initialData?: { name: string; number: number };
  existingNumbers?: number[]; // to validate uniqueness client-side
}

export function TableFormModal({
  open,
  onClose,
  onSubmit,
  initialData,
  existingNumbers = [],
}: TableFormModalProps) {
  const isEditing = !!initialData;
  const [name, setName] = useState(initialData?.name ?? "");
  const [number, setNumber] = useState(initialData ? String(initialData.number) : "");
  const [errors, setErrors] = useState<TableFormErrors>({});
  const [isSaving, setIsSaving] = useState(false);

  // Sync state when initialData changes (opening edit vs create)
  useEffect(() => {
    if (open) {
      setName(initialData?.name ?? "");
      setNumber(initialData ? String(initialData.number) : "");
      setErrors({});
    }
  }, [open, initialData]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  const validate = (): boolean => {
    const newErrors: TableFormErrors = {};
    const trimmedName = name.trim();
    const parsedNumber = parseInt(number, 10);

    if (!trimmedName) newErrors.name = "Table name is required";
    else if (trimmedName.length > 50) newErrors.name = "Table name too long (max 50 chars)";

    if (!number) newErrors.number = "Table number is required";
    else if (isNaN(parsedNumber) || parsedNumber < 1 || parsedNumber > 999) {
      newErrors.number = "Table number must be between 1 and 999";
    } else if (
      !isEditing &&
      existingNumbers.includes(parsedNumber)
    ) {
      newErrors.number = `Table #${parsedNumber} already exists`;
    } else if (
      isEditing &&
      parsedNumber !== initialData?.number &&
      existingNumbers.includes(parsedNumber)
    ) {
      newErrors.number = `Table #${parsedNumber} already exists`;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSaving(true);
    try {
      await onSubmit({ name: name.trim(), number: parseInt(number, 10) });
      onClose();
    } catch {
      // Parent handles the toast
    } finally {
      setIsSaving(false);
    }
  };

  // Auto-fill name from number if name is still empty
  const handleNumberChange = (val: string) => {
    setNumber(val);
    if (!name && val && !isNaN(parseInt(val, 10))) {
      setName(`Table ${val}`);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-200"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="relative w-full max-w-md bg-card border border-border rounded-2xl shadow-xl overflow-hidden animate-in zoom-in-95 slide-in-from-bottom-4 duration-200">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border">
          <div>
            <h2 className="text-base font-semibold text-foreground">
              {isEditing ? "Edit Table" : "Add New Table"}
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              {isEditing
                ? "Update the table name or number."
                : "Fill in the details to create a new table. A QR code will be auto-generated."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="flex h-7 w-7 items-center justify-center rounded-md hover:bg-muted transition-colors cursor-pointer ml-4 shrink-0"
          >
            <X className="h-4 w-4 text-muted-foreground" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-4">
          <div className="grid grid-cols-5 gap-4">
            {/* Number — smaller column */}
            <FormGroup className="col-span-2">
              <Label htmlFor="table-number">Number *</Label>
              <Input
                id="table-number"
                type="number"
                value={number}
                onChange={(e) => handleNumberChange(e.target.value)}
                placeholder="1"
                min={1}
                max={999}
                error={!!errors.number}
                className="mt-1.5 text-center font-mono"
                autoFocus={!isEditing}
              />
              <FormFeedback type="error">{errors.number}</FormFeedback>
            </FormGroup>

            {/* Name — wider column */}
            <FormGroup className="col-span-3">
              <Label htmlFor="table-name">Display Name *</Label>
              <Input
                id="table-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Table 1"
                error={!!errors.name}
                className="mt-1.5"
              />
              <FormFeedback type="error">{errors.name}</FormFeedback>
            </FormGroup>
          </div>

          {/* QR note — only on create */}
          {!isEditing && (
            <div className="flex items-start gap-2 rounded-lg bg-primary/5 border border-primary/15 px-3.5 py-3">
              <div className="mt-0.5 shrink-0 h-4 w-4 rounded-sm bg-primary/20 flex items-center justify-center">
                <span className="text-primary text-[10px] font-bold">QR</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                A QR code pointing to the customer menu will be automatically generated for this table.
              </p>
            </div>
          )}

          {/* Footer buttons */}
          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={onClose}
              disabled={isSaving}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              className="min-w-28 cursor-pointer gap-1.5"
            >
              {!isSaving && (isEditing ? "Save Changes" : "Create Table")}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
