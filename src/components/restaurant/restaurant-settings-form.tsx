"use client";

import { useState, useEffect } from "react";
import {
  Building2, MapPin, Receipt, Percent,
  Coins, Save, RefreshCw, CheckCircle2, AlertCircle
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FormGroup, FormFeedback, FormDescription } from "@/components/ui/form";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { LogoUploader } from "./logo-uploader";
import { toast } from "@/components/ui/toast";
import { Skeleton } from "@/components/ui/loading";
import { cn } from "@/lib/utils";

interface Restaurant {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  address: string | null;
  gstNumber: string | null;
  taxRate: number;
  currency: string;
}

interface FormErrors {
  name?: string;
  address?: string;
  gstNumber?: string;
  taxRate?: string;
  currency?: string;
}

interface RestaurantSettingsFormProps {
  restaurantId: string;
}

export function RestaurantSettingsForm({ restaurantId }: RestaurantSettingsFormProps) {
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDirty, setIsDirty] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  // Form state
  const [name, setName] = useState("");
  const [address, setAddress] = useState("");
  const [gstNumber, setGstNumber] = useState("");
  const [taxRate, setTaxRate] = useState("5");
  const [currency, setCurrency] = useState("INR");
  const [logo, setLogo] = useState<string | null>(null);

  // Load restaurant data
  useEffect(() => {
    const fetchRestaurant = async () => {
      try {
        const res = await fetch(`/api/restaurants/${restaurantId}`);
        if (!res.ok) throw new Error("Failed to load restaurant");
        const data = await res.json();
        const r: Restaurant = data.restaurant;

        setRestaurant(r);
        setName(r.name);
        setAddress(r.address ?? "");
        setGstNumber(r.gstNumber ?? "");
        setTaxRate(String(r.taxRate));
        setCurrency(r.currency);
        setLogo(r.logo);
      } catch (err) {
        toast.error("Failed to load restaurant settings");
      } finally {
        setIsLoading(false);
      }
    };

    fetchRestaurant();
  }, [restaurantId]);

  // Track dirty state
  useEffect(() => {
    if (!restaurant) return;
    const dirty =
      name !== restaurant.name ||
      address !== (restaurant.address ?? "") ||
      gstNumber !== (restaurant.gstNumber ?? "") ||
      taxRate !== String(restaurant.taxRate) ||
      currency !== restaurant.currency ||
      logo !== restaurant.logo;

    setIsDirty(dirty);
    if (saveSuccess && dirty) setSaveSuccess(false);
  }, [name, address, gstNumber, taxRate, currency, logo, restaurant, saveSuccess]);

  const validate = (): boolean => {
    const newErrors: FormErrors = {};

    if (!name.trim() || name.trim().length < 2) {
      newErrors.name = "Restaurant name must be at least 2 characters";
    }
    if (name.trim().length > 100) {
      newErrors.name = "Restaurant name must be under 100 characters";
    }
    if (address && address.length > 300) {
      newErrors.address = "Address is too long (max 300 characters)";
    }

    const gstTrimmed = gstNumber.trim();
    const gstRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/;
    if (gstTrimmed && !gstRegex.test(gstTrimmed)) {
      newErrors.gstNumber = "Invalid GST number format. Example: 29ABCDE1234F1Z5";
    }

    const tax = parseFloat(taxRate);
    if (isNaN(tax) || tax < 0 || tax > 100) {
      newErrors.taxRate = "Tax rate must be between 0% and 100%";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          address: address.trim() || null,
          gstNumber: gstNumber.trim() || null,
          taxRate: parseFloat(taxRate),
          currency,
          logo: logo ?? null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to save");
      }

      const data = await res.json();
      setRestaurant(data.restaurant);
      setIsDirty(false);
      setSaveSuccess(true);
      toast.success("Restaurant settings saved!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    if (!restaurant) return;
    setName(restaurant.name);
    setAddress(restaurant.address ?? "");
    setGstNumber(restaurant.gstNumber ?? "");
    setTaxRate(String(restaurant.taxRate));
    setCurrency(restaurant.currency);
    setLogo(restaurant.logo);
    setErrors({});
    setSaveSuccess(false);
  };

  if (isLoading) {
    return (
      <div className="max-w-2xl w-full space-y-6 animate-in fade-in duration-300">
        <div className="space-y-2">
          <Skeleton className="h-8 w-52" />
          <Skeleton className="h-4 w-80" />
        </div>
        <div className="grid grid-cols-1 gap-6">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl w-full space-y-6 pb-8 animate-in fade-in duration-300">
      {/* Page Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Restaurant Settings</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your restaurant profile, branding, and billing configuration.
        </p>
      </div>

      {/* Save status banner */}
      {saveSuccess && (
        <div className="flex items-center gap-2.5 px-4 py-3 rounded-lg bg-emerald-500/8 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400 animate-in slide-in-from-top-2 fade-in duration-300">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          <p className="text-sm font-medium">Settings saved successfully.</p>
        </div>
      )}

      {/* ─── Logo & Branding ─── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-primary/8 border border-primary/15">
              <Building2 className="h-4 w-4 text-primary" />
            </div>
            <div>
              <CardTitle className="text-base">Branding</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Your restaurant logo displayed on menus and receipts
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormGroup>
            <Label htmlFor="restaurant-name">Restaurant Name *</Label>
            <Input
              id="restaurant-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Spice Garden"
              error={!!errors.name}
              className="mt-1.5"
            />
            <FormFeedback type="error">{errors.name}</FormFeedback>
          </FormGroup>

          <FormGroup>
            <Label>Logo</Label>
            <div className="mt-1.5">
              <LogoUploader
                currentLogo={logo}
                onUpload={(url) => setLogo(url || null)}
              />
            </div>
            <FormDescription>
              Displayed on the customer menu page. Recommended: 400×400px, transparent PNG.
            </FormDescription>
          </FormGroup>
        </CardContent>
      </Card>

      {/* ─── Location ─── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-sky-500/8 border border-sky-500/15">
              <MapPin className="h-4 w-4 text-sky-500" />
            </div>
            <div>
              <CardTitle className="text-base">Location</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                Restaurant address for invoices and records
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <FormGroup>
            <Label htmlFor="address">Address</Label>
            <textarea
              id="address"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              rows={3}
              placeholder="42 MG Road, Bengaluru, Karnataka 560001"
              className={cn(
                "flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring focus-visible:border-primary disabled:cursor-not-allowed disabled:opacity-50 resize-none mt-1.5 duration-150",
                errors.address && "border-destructive focus-visible:ring-destructive"
              )}
            />
            <FormFeedback type="error">{errors.address}</FormFeedback>
            <FormDescription>
              Printed on bills and invoices.
            </FormDescription>
          </FormGroup>
        </CardContent>
      </Card>

      {/* ─── Tax & Billing ─── */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-md bg-amber-500/8 border border-amber-500/15">
              <Receipt className="h-4 w-4 text-amber-500" />
            </div>
            <div>
              <CardTitle className="text-base">Tax & Billing</CardTitle>
              <CardDescription className="text-xs mt-0.5">
                GST configuration and bill generation settings
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <FormGroup>
            <Label htmlFor="gst-number">GST Number</Label>
            <div className="relative mt-1.5">
              <Input
                id="gst-number"
                value={gstNumber}
                onChange={(e) => setGstNumber(e.target.value.toUpperCase())}
                placeholder="29ABCDE1234F1Z5"
                error={!!errors.gstNumber}
                className="font-mono tracking-wider pr-10"
                maxLength={15}
              />
              {gstNumber.length === 15 && !errors.gstNumber && (
                <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-emerald-500" />
              )}
              {errors.gstNumber && (
                <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-destructive" />
              )}
            </div>
            <FormFeedback type="error">{errors.gstNumber}</FormFeedback>
            <FormDescription>
              15-character GST Identification Number. Printed on all invoices.
            </FormDescription>
          </FormGroup>

          <div className="grid grid-cols-2 gap-4">
            <FormGroup>
              <Label htmlFor="tax-rate">
                <span className="flex items-center gap-1">
                  <Percent className="h-3.5 w-3.5 text-muted-foreground" />
                  GST Rate (%)
                </span>
              </Label>
              <Input
                id="tax-rate"
                type="number"
                value={taxRate}
                onChange={(e) => setTaxRate(e.target.value)}
                placeholder="5"
                min="0"
                max="100"
                step="0.5"
                error={!!errors.taxRate}
                className="mt-1.5"
              />
              <FormFeedback type="error">{errors.taxRate}</FormFeedback>
            </FormGroup>

            <FormGroup>
              <Label htmlFor="currency">
                <span className="flex items-center gap-1">
                  <Coins className="h-3.5 w-3.5 text-muted-foreground" />
                  Currency
                </span>
              </Label>
              <select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
                className="flex h-9 w-full items-center rounded-md border border-input bg-background px-3 py-1 text-sm shadow-xs transition-colors focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 mt-1.5 cursor-pointer"
              >
                <option value="INR">INR — Indian Rupee</option>
                <option value="USD">USD — US Dollar</option>
                <option value="EUR">EUR — Euro</option>
                <option value="GBP">GBP — British Pound</option>
                <option value="SGD">SGD — Singapore Dollar</option>
                <option value="AED">AED — UAE Dirham</option>
              </select>
            </FormGroup>
          </div>

          {/* Tax calculation preview */}
          {!errors.taxRate && taxRate && (
            <div className="flex items-center justify-between rounded-lg bg-muted/40 border border-border/60 px-4 py-3">
              <div className="flex flex-col">
                <span className="text-xs font-medium text-muted-foreground">Sample calculation</span>
                <span className="text-xs text-muted-foreground mt-0.5">
                  On a ₹1,000 order at {taxRate}% GST
                </span>
              </div>
              <div className="text-right">
                <span className="text-sm font-bold text-foreground">
                  ₹{(1000 * (1 + parseFloat(taxRate || "0") / 100)).toFixed(0)}
                </span>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  incl. ₹{(1000 * parseFloat(taxRate || "0") / 100).toFixed(0)} tax
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Action Footer ─── */}
      <div className="flex items-center justify-between pt-2 sticky bottom-0 bg-background/80 backdrop-blur-sm py-4 -mx-6 px-6 border-t border-border/60 rounded-b-xl">
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          disabled={!isDirty || isSaving}
          className="gap-2 text-muted-foreground cursor-pointer"
        >
          <RefreshCw className="h-4 w-4" />
          Reset changes
        </Button>

        <div className="flex items-center gap-3">
          {isDirty && !isSaving && (
            <span className="text-xs text-muted-foreground animate-in fade-in duration-200">
              Unsaved changes
            </span>
          )}
          <Button
            type="button"
            variant="primary"
            onClick={handleSave}
            disabled={!isDirty || isSaving}
            isLoading={isSaving}
            className="gap-2 min-w-28 cursor-pointer"
          >
            {!isSaving && <Save className="h-4 w-4" />}
            Save Settings
          </Button>
        </div>
      </div>
    </div>
  );
}
