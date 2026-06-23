"use client";

import { useState, useCallback, useEffect } from "react";
import Image from "next/image";
import {
  Plus, Search, ChevronRight, MoreHorizontal, Pencil, Trash2,
  FolderOpen, UtensilsCrossed, CheckCircle2, XCircle,
  GripVertical, AlertTriangle, ClipboardList,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/loading";
import { EmptyStateComponent } from "@/components/ui/empty-state";
import { CategoryFormModal } from "./category-form-modal";
import { MenuItemFormModal, MenuItemFormData, CategoryOption } from "./menu-item-form-modal";
import { toast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Category {
  id: string;
  name: string;
  sortOrder: number;
  _count: { items: number };
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image: string | null;
  isAvailable: boolean;
  categoryId: string;
  category: { id: string; name: string };
}

interface MenuManagerProps {
  restaurantId: string;
  currency?: string;
}

// ─── Delete Confirm ───────────────────────────────────────────────────────────
function DeleteConfirm({
  label, onConfirm, onCancel, isDeleting,
}: {
  label: string; onConfirm: () => void; onCancel: () => void; isDeleting: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-in fade-in duration-150"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(4px)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="w-full max-w-sm bg-card border border-border rounded-2xl shadow-xl p-6 space-y-4 animate-in zoom-in-95 duration-200">
        <div className="flex flex-col items-center text-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10 border border-destructive/20">
            <AlertTriangle className="h-6 w-6 text-destructive" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">Delete "{label}"?</h3>
            <p className="text-sm text-muted-foreground mt-1">This cannot be undone.</p>
          </div>
        </div>
        <div className="flex gap-2.5">
          <Button variant="ghost" size="sm" onClick={onCancel} className="flex-1 cursor-pointer" disabled={isDeleting}>Cancel</Button>
          <Button variant="destructive" size="sm" onClick={onConfirm} isLoading={isDeleting} className="flex-1 cursor-pointer">
            {!isDeleting && "Delete"}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ─── Row Menu ─────────────────────────────────────────────────────────────────
function RowMenu({ onEdit, onDelete }: { onEdit: () => void; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (!open) return;
    const h = () => setOpen(false);
    window.addEventListener("click", h);
    return () => window.removeEventListener("click", h);
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
        <div className="absolute right-0 top-8 z-20 w-36 bg-popover border border-border rounded-xl shadow-lg overflow-hidden animate-in fade-in zoom-in-95 duration-100">
          <button className="flex w-full items-center gap-2 px-3 py-2.5 text-sm hover:bg-muted transition-colors cursor-pointer" onClick={() => { onEdit(); setOpen(false); }}>
            <Pencil className="h-3.5 w-3.5 text-muted-foreground" /> Edit
          </button>
          <div className="border-t border-border" />
          <button className="flex w-full items-center gap-2 px-3 py-2.5 text-sm text-destructive hover:bg-destructive/5 transition-colors cursor-pointer" onClick={() => { onDelete(); setOpen(false); }}>
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </button>
        </div>
      )}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────
export function MenuManager({ restaurantId, currency = "INR" }: MenuManagerProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [items, setItems] = useState<MenuItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeCategoryId, setActiveCategoryId] = useState<string | "all">("all");

  // Modal state
  const [catCreate, setCatCreate] = useState(false);
  const [catEdit, setCatEdit] = useState<Category | null>(null);
  const [catDelete, setCatDelete] = useState<Category | null>(null);
  const [isDeletingCat, setIsDeletingCat] = useState(false);

  const [itemCreate, setItemCreate] = useState(false);
  const [itemEdit, setItemEdit] = useState<MenuItem | null>(null);
  const [itemDelete, setItemDelete] = useState<MenuItem | null>(null);
  const [isDeletingItem, setIsDeletingItem] = useState(false);

  // ── Fetch ──────────────────────────────────────────────────────────────────
  const fetchData = useCallback(async () => {
    try {
      const [catRes, itemRes] = await Promise.all([
        fetch(`/api/restaurants/${restaurantId}/categories`),
        fetch(`/api/restaurants/${restaurantId}/menu-items`),
      ]);
      if (!catRes.ok || !itemRes.ok) throw new Error();
      const [catData, itemData] = await Promise.all([catRes.json(), itemRes.json()]);
      setCategories(catData.categories);
      setItems(itemData.items);
    } catch {
      toast.error("Failed to load menu data");
    } finally {
      setIsLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  // ── Filtered items ─────────────────────────────────────────────────────────
  const filteredItems = items.filter((item) => {
    const matchesSearch = !search || item.name.toLowerCase().includes(search.toLowerCase()) ||
      (item.description ?? "").toLowerCase().includes(search.toLowerCase());
    const matchesCat = activeCategoryId === "all" || item.categoryId === activeCategoryId;
    return matchesSearch && matchesCat;
  });

  // ── Category CRUD ──────────────────────────────────────────────────────────
  const handleCatCreate = async (data: { name: string }) => {
    const res = await fetch(`/api/restaurants/${restaurantId}/categories`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed"); throw new Error(); }
    const { category } = await res.json();
    setCategories((prev) => [...prev, category]);
    toast.success(`"${category.name}" created!`);
  };

  const handleCatEdit = async (data: { name: string }) => {
    if (!catEdit) return;
    const res = await fetch(`/api/restaurants/${restaurantId}/categories/${catEdit.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed"); throw new Error(); }
    const { category } = await res.json();
    setCategories((prev) => prev.map((c) => c.id === catEdit.id ? { ...c, ...category } : c));
    toast.success("Category updated!");
  };

  const handleCatDelete = async () => {
    if (!catDelete) return;
    setIsDeletingCat(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/categories/${catDelete.id}`, { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed"); return; }
      setCategories((prev) => prev.filter((c) => c.id !== catDelete.id));
      if (activeCategoryId === catDelete.id) setActiveCategoryId("all");
      toast.success(`"${catDelete.name}" deleted!`);
      setCatDelete(null);
    } finally { setIsDeletingCat(false); }
  };

  // ── Item CRUD ──────────────────────────────────────────────────────────────
  const handleItemCreate = async (data: MenuItemFormData) => {
    const res = await fetch(`/api/restaurants/${restaurantId}/menu-items`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed"); throw new Error(); }
    const { item } = await res.json();
    setItems((prev) => [...prev, item]);
    // Increment count on the category
    setCategories((prev) => prev.map((c) => c.id === item.categoryId
      ? { ...c, _count: { items: c._count.items + 1 } } : c));
    toast.success(`"${item.name}" added to menu!`);
  };

  const handleItemEdit = async (data: MenuItemFormData) => {
    if (!itemEdit) return;
    const res = await fetch(`/api/restaurants/${restaurantId}/menu-items/${itemEdit.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed"); throw new Error(); }
    const { item } = await res.json();
    setItems((prev) => prev.map((i) => i.id === itemEdit.id ? { ...i, ...item } : i));
    toast.success("Item updated!");
  };

  const handleToggleAvailability = async (item: MenuItem) => {
    const res = await fetch(`/api/restaurants/${restaurantId}/menu-items/${item.id}`, {
      method: "PUT", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAvailable: !item.isAvailable }),
    });
    if (!res.ok) { toast.error("Failed to update availability"); return; }
    setItems((prev) => prev.map((i) => i.id === item.id ? { ...i, isAvailable: !item.isAvailable } : i));
    toast.success(`"${item.name}" is now ${!item.isAvailable ? "available" : "unavailable"}`);
  };

  const handleItemDelete = async () => {
    if (!itemDelete) return;
    setIsDeletingItem(true);
    try {
      const res = await fetch(`/api/restaurants/${restaurantId}/menu-items/${itemDelete.id}`, { method: "DELETE" });
      if (!res.ok) { const e = await res.json(); toast.error(e.error || "Failed"); return; }
      setItems((prev) => prev.filter((i) => i.id !== itemDelete.id));
      setCategories((prev) => prev.map((c) => c.id === itemDelete.categoryId
        ? { ...c, _count: { items: Math.max(0, c._count.items - 1) } } : c));
      toast.success(`"${itemDelete.name}" deleted`);
      setItemDelete(null);
    } finally { setIsDeletingItem(false); }
  };

  const categoryOptions: CategoryOption[] = categories.map((c) => ({ id: c.id, name: c.name }));
  const currencySymbol = currency === "INR" ? "₹" : currency === "USD" ? "$" : currency === "EUR" ? "€" : currency;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">Menu</h1>
        <p className="text-sm text-muted-foreground">
          Manage categories and dishes. Changes reflect on the customer menu instantly.
        </p>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
          <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items…" className="pl-9" />
        </div>
        <div className="flex gap-2 ml-auto">
          <Button variant="secondary" size="sm" onClick={() => setCatCreate(true)} className="gap-2 cursor-pointer whitespace-nowrap">
            <FolderOpen className="h-4 w-4" />
            Add Category
          </Button>
          <Button
            variant="primary" size="sm"
            onClick={() => { if (categories.length === 0) { toast.error("Create a category first!"); return; } setItemCreate(true); }}
            className="gap-2 cursor-pointer whitespace-nowrap"
          >
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full rounded-xl" />)}</div>
      ) : (
        <div className="flex gap-6">
          {/* ── Category Sidebar ── */}
          <div className="w-56 shrink-0 hidden md:flex flex-col gap-1">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-1">Categories</p>

            {/* All */}
            <button
              onClick={() => setActiveCategoryId("all")}
              className={cn(
                "flex items-center justify-between gap-2 w-full px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer group",
                activeCategoryId === "all"
                  ? "bg-primary/10 text-primary border border-primary/15"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <span className="flex items-center gap-2">
                <ClipboardList className="h-4 w-4 shrink-0" />
                All Items
              </span>
              <span className={cn(
                "text-[10px] font-bold px-1.5 py-0.5 rounded-full",
                activeCategoryId === "all" ? "bg-primary/15 text-primary" : "bg-muted-foreground/20 text-muted-foreground"
              )}>
                {items.length}
              </span>
            </button>

            {categories.map((cat) => (
              <div key={cat.id} className="group/cat flex items-center gap-1">
                <button
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={cn(
                    "flex items-center justify-between gap-2 flex-1 px-3 py-2.5 rounded-lg text-sm font-medium transition-all cursor-pointer min-w-0",
                    activeCategoryId === cat.id
                      ? "bg-primary/10 text-primary border border-primary/15"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  )}
                >
                  <span className="truncate">{cat.name}</span>
                  <span className={cn(
                    "text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0",
                    activeCategoryId === cat.id ? "bg-primary/15 text-primary" : "bg-muted-foreground/20 text-muted-foreground"
                  )}>
                    {cat._count.items}
                  </span>
                </button>
                {/* Category action buttons (visible on hover) */}
                <div className="flex items-center gap-0.5 opacity-0 group-hover/cat:opacity-100 transition-opacity">
                  <button onClick={() => setCatEdit(cat)} className="flex h-6 w-6 items-center justify-center rounded hover:bg-muted cursor-pointer text-muted-foreground" title="Edit">
                    <Pencil className="h-3 w-3" />
                  </button>
                  <button onClick={() => setCatDelete(cat)} className="flex h-6 w-6 items-center justify-center rounded hover:bg-destructive/10 cursor-pointer text-muted-foreground hover:text-destructive" title="Delete">
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              </div>
            ))}

            {categories.length === 0 && (
              <div className="px-3 py-6 text-center">
                <FolderOpen className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No categories yet</p>
                <button onClick={() => setCatCreate(true)} className="text-xs text-primary hover:underline mt-1 cursor-pointer">Add one</button>
              </div>
            )}
          </div>

          {/* ── Item Grid ── */}
          <div className="flex-1 min-w-0">
            {/* Mobile category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 md:hidden">
              <button
                onClick={() => setActiveCategoryId("all")}
                className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
                  activeCategoryId === "all" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
              >All</button>
              {categories.map((cat) => (
                <button key={cat.id}
                  onClick={() => setActiveCategoryId(cat.id)}
                  className={cn("shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all cursor-pointer",
                    activeCategoryId === cat.id ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground")}
                >{cat.name}</button>
              ))}
            </div>

            {/* Empty states */}
            {items.length === 0 && (
              <EmptyStateComponent
                icon={UtensilsCrossed}
                title="No menu items yet"
                description="Add your first dish to get started. Create a category first, then add items."
                actionText="Add First Item"
                onAction={() => categories.length > 0 ? setItemCreate(true) : setCatCreate(true)}
              />
            )}

            {items.length > 0 && filteredItems.length === 0 && (
              <EmptyStateComponent
                icon={Search}
                title="No items found"
                description={search ? `No items match "${search}".` : "No items in this category."}
              />
            )}

            {/* Item Cards Grid */}
            {filteredItems.length > 0 && (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    className={cn(
                      "group relative flex flex-col rounded-xl border bg-card overflow-hidden transition-all duration-200 hover:shadow-md hover:border-border/80",
                      !item.isAvailable && "opacity-60"
                    )}
                  >
                    {/* Item Image */}
                    <div className="relative h-36 bg-muted/40 overflow-hidden">
                      {item.image ? (
                        <Image src={item.image} alt={item.name} fill className="object-cover transition-transform duration-300 group-hover:scale-105" sizes="(max-width: 640px) 100vw, 33vw" />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <UtensilsCrossed className="h-10 w-10 text-muted-foreground/20" />
                        </div>
                      )}

                      {/* Availability badge */}
                      <div className="absolute top-2 left-2">
                        <span className={cn(
                          "inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold backdrop-blur-sm",
                          item.isAvailable
                            ? "bg-emerald-500/90 text-white"
                            : "bg-black/60 text-white/80"
                        )}>
                          {item.isAvailable
                            ? <CheckCircle2 className="h-2.5 w-2.5" />
                            : <XCircle className="h-2.5 w-2.5" />}
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </div>

                      {/* Category chip */}
                      <div className="absolute bottom-2 left-2">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-black/50 text-white/90 backdrop-blur-sm">
                          <FolderOpen className="h-2.5 w-2.5" />
                          {item.category.name}
                        </span>
                      </div>

                      {/* Action menu */}
                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <RowMenu
                          onEdit={() => setItemEdit(item)}
                          onDelete={() => setItemDelete(item)}
                        />
                      </div>
                    </div>

                    {/* Card body */}
                    <div className="flex flex-col gap-1.5 p-3 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <h3 className="text-sm font-semibold text-foreground leading-tight line-clamp-1">{item.name}</h3>
                        <span className="text-sm font-bold text-foreground shrink-0">
                          {currencySymbol}{item.price.toFixed(2)}
                        </span>
                      </div>

                      {item.description && (
                        <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{item.description}</p>
                      )}

                      {/* Toggle availability */}
                      <div className="flex items-center justify-between mt-auto pt-2 border-t border-border/60">
                        <button
                          onClick={() => handleToggleAvailability(item)}
                          className={cn(
                            "text-[10px] font-medium flex items-center gap-1 cursor-pointer hover:opacity-80 transition-opacity",
                            item.isAvailable ? "text-emerald-600 dark:text-emerald-400" : "text-muted-foreground"
                          )}
                        >
                          {item.isAvailable
                            ? <CheckCircle2 className="h-3 w-3" />
                            : <XCircle className="h-3 w-3" />}
                          {item.isAvailable ? "Mark unavailable" : "Mark available"}
                        </button>
                        <button onClick={() => setItemEdit(item)} className="text-[10px] text-muted-foreground hover:text-primary transition-colors cursor-pointer flex items-center gap-1">
                          <Pencil className="h-3 w-3" /> Edit
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── Modals ── */}
      <CategoryFormModal
        open={catCreate}
        onClose={() => setCatCreate(false)}
        onSubmit={handleCatCreate}
      />
      <CategoryFormModal
        open={!!catEdit}
        onClose={() => setCatEdit(null)}
        onSubmit={handleCatEdit}
        initialData={catEdit ? { name: catEdit.name } : undefined}
      />
      {catDelete && (
        <DeleteConfirm
          label={catDelete.name}
          onConfirm={handleCatDelete}
          onCancel={() => setCatDelete(null)}
          isDeleting={isDeletingCat}
        />
      )}

      <MenuItemFormModal
        open={itemCreate}
        onClose={() => setItemCreate(false)}
        onSubmit={handleItemCreate}
        categories={categoryOptions}
        restaurantId={restaurantId}
      />
      <MenuItemFormModal
        open={!!itemEdit}
        onClose={() => setItemEdit(null)}
        onSubmit={handleItemEdit}
        categories={categoryOptions}
        restaurantId={restaurantId}
        initialData={itemEdit ? {
          id: itemEdit.id,
          categoryId: itemEdit.categoryId,
          name: itemEdit.name,
          description: itemEdit.description ?? "",
          price: itemEdit.price,
          image: itemEdit.image,
          isAvailable: itemEdit.isAvailable,
        } : undefined}
      />
      {itemDelete && (
        <DeleteConfirm
          label={itemDelete.name}
          onConfirm={handleItemDelete}
          onCancel={() => setItemDelete(null)}
          isDeleting={isDeletingItem}
        />
      )}
    </div>
  );
}
