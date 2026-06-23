"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  UtensilsCrossed,
  QrCode,
  ShoppingBag,
  Zap,
  CheckCircle2,
  ArrowRight,
  ChefHat,
  Receipt,
  Users,
  Sparkles,
  Smartphone,
  ChevronRight,
  HelpCircle,
  Menu,
  X,
  Laptop
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { useAuthStore } from "@/lib/store/use-auth-store";

export default function LandingPage() {
  const router = useRouter();
  const { user, fetchProfile } = useAuthStore();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [demoStep, setDemoStep] = useState(0);
  const [activeWorkflowTab, setActiveWorkflowTab] = useState<"customer" | "owner">("customer");

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  // Autoplay the demo animation steps
  useEffect(() => {
    const interval = setInterval(() => {
      setDemoStep((prev) => (prev + 1) % 5);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const demoStepsInfo = [
    {
      title: "1. Scan QR Code",
      desc: "Customer scans the table-specific QR code. No app download or registration required.",
    },
    {
      title: "2. Browse Menu",
      desc: "A beautiful, mobile-optimized menu displays active items, categories, and prices.",
    },
    {
      title: "3. Place Orders",
      desc: "Add items to cart and place orders. A session tracks multiple rounds of orders.",
    },
    {
      title: "4. Kitchen Prep",
      desc: "The kitchen receives orders instantly on their queue. Staff starts cooking right away.",
    },
    {
      title: "5. Single Bill",
      desc: "Combine multiple orders under one session for a unified bill, avoiding fragmented checks.",
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-200 selection:bg-primary/20 selection:text-primary">
      {/* Navigation */}
      <header className="sticky top-0 z-50 w-full border-b border-border/80 bg-background/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-xs group-hover:scale-105 transition-transform">
              <UtensilsCrossed className="h-5 w-5" />
            </div>
            <span className="font-bold text-base tracking-tight text-foreground">
              QR Dine
            </span>
          </Link>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-8 text-xs font-semibold text-muted-foreground">
            <a href="#features" className="hover:text-foreground transition-colors">Features</a>
            <a href="#workflows" className="hover:text-foreground transition-colors">Workflows</a>
            <a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a>
            <a href="#faqs" className="hover:text-foreground transition-colors">FAQs</a>
          </nav>

          {/* Nav Actions */}
          <div className="hidden md:flex items-center gap-4">
            <ThemeToggle />
            {user ? (
              <Link href="/dashboard">
                <Button variant="primary" className="h-9 px-4 text-xs font-semibold rounded-lg cursor-pointer">
                  Go to Console
                  <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" className="text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors">
                  Sign In
                </Link>
                <Link href="/signup">
                  <Button variant="primary" className="h-9 px-4 text-xs font-semibold rounded-lg cursor-pointer">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>

          {/* Mobile Hamburguer */}
          <div className="flex md:hidden items-center gap-3">
            <ThemeToggle />
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-secondary cursor-pointer"
            >
              {mobileMenuOpen ? <X className="h-4.5 w-4.5" /> : <Menu className="h-4.5 w-4.5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-x-0 top-16 z-40 bg-background border-b border-border p-6 shadow-lg animate-in slide-in-from-top duration-200 md:hidden">
          <nav className="flex flex-col gap-4 text-sm font-semibold text-muted-foreground mb-6">
            <a href="#features" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground">Features</a>
            <a href="#workflows" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground">Workflows</a>
            <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground">Pricing</a>
            <a href="#faqs" onClick={() => setMobileMenuOpen(false)} className="hover:text-foreground">FAQs</a>
          </nav>
          <div className="flex flex-col gap-3 pt-4 border-t border-border/60">
            {user ? (
              <Link href="/dashboard" onClick={() => setMobileMenuOpen(false)}>
                <Button variant="primary" className="w-full h-10 text-xs font-semibold rounded-lg cursor-pointer">
                  Go to Console
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/login" onClick={() => setMobileMenuOpen(false)} className="w-full text-center py-2 text-sm font-semibold text-muted-foreground hover:text-foreground">
                  Sign In
                </Link>
                <Link href="/signup" onClick={() => setMobileMenuOpen(false)}>
                  <Button variant="primary" className="w-full h-10 text-xs font-semibold rounded-lg cursor-pointer">
                    Get Started
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative pt-20 pb-20 lg:pt-28 lg:pb-28 overflow-hidden">
        {/* Subtle grid pattern background */}
        <div className="absolute inset-0 -z-10 bg-[linear-gradient(to_right,rgba(120,120,120,0.04)_1px,transparent_1px),linear-gradient(to_bottom,rgba(120,120,120,0.04)_1px,transparent_1px)] bg-[size:24px_24px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
        
        <div className="max-w-7xl mx-auto px-6 text-center space-y-6">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/25 bg-primary/5 px-3 py-1 text-[11px] font-semibold text-primary tracking-wide">
            <Sparkles className="h-3 w-3" />
            Empowering Modern Restaurant Dining
          </div>
          
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight max-w-4xl mx-auto leading-[1.1] text-foreground">
            Self-Ordering Platform for{" "}
            <span className="bg-gradient-to-r from-primary via-indigo-500 to-indigo-600 bg-clip-text text-transparent">
              Modern Restaurants
            </span>
          </h1>
          
          <p className="text-sm sm:text-base lg:text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Contactless dining sessions, instant kitchen queue notifications, and automated billing. 
            Delight customers, increase table turnover, and reduce operational overhead.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4">
            {user ? (
              <Link href="/dashboard">
                <Button variant="primary" className="h-11 px-6 text-xs font-semibold rounded-xl cursor-pointer gap-2">
                  Go to Dashboard Console
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            ) : (
              <>
                <Link href="/signup">
                  <Button variant="primary" className="h-11 px-6 text-xs font-semibold rounded-xl cursor-pointer gap-2">
                    Start Free Trial
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                <a href="#demo">
                  <Button variant="outline" className="h-11 px-6 text-xs font-semibold rounded-xl border-border bg-background cursor-pointer hover:bg-secondary">
                    View Live Demo
                  </Button>
                </a>
              </>
            )}
          </div>
        </div>
      </section>

      {/* Interactive Live Demo */}
      <section id="demo" className="py-16 border-t border-border/80 bg-muted/10">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center space-y-2 mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              See QR Dine in Action
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              A real-time preview of the self-ordering flow from both the customer&apos;s phone and the restaurant staff console.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Demo controller */}
            <div className="lg:col-span-4 space-y-3">
              {demoStepsInfo.map((s, idx) => (
                <button
                  key={idx}
                  onClick={() => setDemoStep(idx)}
                  className={`w-full text-left p-4 rounded-xl border transition-all duration-200 cursor-pointer ${
                    demoStep === idx
                      ? "bg-card border-primary/45 shadow-sm text-foreground"
                      : "bg-transparent border-transparent text-muted-foreground hover:bg-secondary/40 hover:text-foreground"
                  }`}
                >
                  <div className="text-xs font-bold leading-none">{s.title}</div>
                  <div className="text-[11px] font-medium leading-relaxed mt-2 text-muted-foreground">
                    {s.desc}
                  </div>
                </button>
              ))}
            </div>

            {/* Screen representation */}
            <div className="lg:col-span-8 flex flex-col md:flex-row justify-center items-center gap-8 bg-card border border-border/80 rounded-2xl p-6 md:p-8 min-h-[460px] shadow-lg relative overflow-hidden select-none">
              
              {/* Customer Mobile Mockup */}
              <div className="w-full max-w-[280px] h-[400px] border border-border rounded-[32px] bg-background shadow-md overflow-hidden flex flex-col relative shrink-0">
                {/* Speaker & notch */}
                <div className="absolute top-2 left-1/2 -translate-x-1/2 w-28 h-4 rounded-full bg-zinc-800/10 dark:bg-zinc-800 flex items-center justify-center">
                  <div className="w-10 h-1 bg-zinc-400 dark:bg-zinc-600 rounded-full" />
                </div>
                
                {/* Mobile screen wrapper */}
                <div className="flex-1 flex flex-col pt-8 text-[11px] overflow-hidden bg-zinc-50 dark:bg-zinc-950">
                  
                  {/* Header */}
                  <div className="px-3 py-2 border-b border-border/60 flex items-center justify-between bg-card">
                    <div className="flex flex-col">
                      <span className="font-bold text-[10px] leading-tight">Luigi&apos;s Pizzeria</span>
                      <span className="text-[8px] text-muted-foreground font-medium">Table 04</span>
                    </div>
                    <div className="flex h-5 w-5 items-center justify-center rounded bg-primary/8 text-primary border border-primary/20">
                      <QrCode className="h-3 w-3" />
                    </div>
                  </div>

                  {/* Body depends on step */}
                  <div className="flex-1 overflow-y-auto p-3 space-y-3">
                    {demoStep === 0 && (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-4 px-2">
                        <div className="relative">
                          <div className="absolute -inset-1.5 rounded-2xl bg-primary/10 animate-ping" />
                          <div className="h-16 w-16 rounded-xl border border-border bg-card flex items-center justify-center text-primary shadow-xs">
                            <QrCode className="h-8 w-8" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold block text-foreground">Scan Table QR</span>
                          <span className="text-[9px] text-muted-foreground">Camera identifies Luigi&apos;s Table 4 instantly</span>
                        </div>
                      </div>
                    )}

                    {demoStep === 1 && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between pb-1 border-b border-border/40">
                          <span className="font-bold text-foreground">Popular Pizzas</span>
                        </div>
                        
                        <div className="bg-card border border-border/80 rounded-lg p-2 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="font-bold">Margherita Pizza</span>
                            <span className="text-[9px] text-muted-foreground mt-0.5">$14.00</span>
                          </div>
                          <button className="h-5 px-2 bg-primary text-primary-foreground font-semibold rounded text-[9px] cursor-pointer">
                            + Add
                          </button>
                        </div>

                        <div className="bg-card border border-border/80 rounded-lg p-2 flex justify-between items-center">
                          <div className="flex flex-col">
                            <span className="font-bold">Pepperoni Special</span>
                            <span className="text-[9px] text-muted-foreground mt-0.5">$16.50</span>
                          </div>
                          <button className="h-5 px-2 bg-primary text-primary-foreground font-semibold rounded text-[9px] cursor-pointer">
                            + Add
                          </button>
                        </div>
                      </div>
                    )}

                    {demoStep === 2 && (
                      <div className="space-y-3">
                        <div className="font-bold text-foreground pb-1 border-b border-border/40">Your Cart</div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center text-xs">
                            <span>1x Margherita Pizza</span>
                            <span className="font-semibold">$14.00</span>
                          </div>
                          <div className="flex justify-between items-center text-xs">
                            <span>1x Lemon Soda</span>
                            <span className="font-semibold">$2.50</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-dashed border-border/80 flex justify-between font-bold text-xs text-foreground">
                          <span>Total</span>
                          <span>$16.50</span>
                        </div>
                        <button className="w-full py-2 bg-primary text-primary-foreground font-bold rounded-lg text-[10px] mt-2 shadow-xs cursor-pointer animate-pulse">
                          Place Order (Table 04)
                        </button>
                      </div>
                    )}

                    {demoStep === 3 && (
                      <div className="h-full flex flex-col items-center justify-center text-center space-y-3 px-2">
                        <div className="h-10 w-10 rounded-full bg-emerald-500/8 border border-emerald-500/20 text-emerald-500 flex items-center justify-center">
                          <CheckCircle2 className="h-5 w-5" />
                        </div>
                        <div className="space-y-1">
                          <span className="font-bold block text-foreground">Order #31 Sent</span>
                          <span className="text-[9px] text-muted-foreground">Kitchen notified immediately</span>
                        </div>
                        <div className="bg-card border border-border rounded-lg p-2 w-full text-left space-y-1 mt-2">
                          <span className="font-semibold block text-[9px] text-emerald-600 dark:text-emerald-400">STATUS: PREPARING</span>
                          <span className="text-[9px] text-muted-foreground">1x Margherita Pizza</span>
                        </div>
                      </div>
                    )}

                    {demoStep === 4 && (
                      <div className="space-y-3">
                        <div className="font-bold text-foreground pb-1 border-b border-border/40">Dining Session Summary</div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between text-muted-foreground">
                            <span>Round 1: Pizza + Soda</span>
                            <span>$16.50</span>
                          </div>
                          <div className="flex justify-between text-muted-foreground">
                            <span>Round 2: Espresso</span>
                            <span>$3.50</span>
                          </div>
                        </div>
                        <div className="pt-2 border-t border-border flex justify-between font-bold text-xs text-foreground">
                          <span>Final Total</span>
                          <span>$20.00</span>
                        </div>
                        <button className="w-full py-2 bg-secondary text-foreground border border-border font-semibold rounded-lg text-[10px] cursor-pointer">
                          Request Bill &amp; Check Out
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Console Dashboard Screen Mockup */}
              <div className="flex-1 w-full max-w-[320px] md:max-w-xs h-[320px] border border-border rounded-2xl bg-zinc-950 shadow-md flex flex-col overflow-hidden">
                <div className="px-3.5 py-2 border-b border-zinc-800 bg-zinc-900/50 flex items-center gap-2">
                  <div className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-[10px] text-zinc-400 font-bold">Kitchen Display Screen (KDS)</span>
                </div>
                
                <div className="flex-1 p-3.5 space-y-3 text-[10px] overflow-y-auto">
                  {demoStep < 3 ? (
                    <div className="h-full flex flex-col items-center justify-center text-center text-zinc-500 space-y-2">
                      <ChefHat className="h-6 w-6 stroke-1.5" />
                      <span>Waiting for new incoming table orders...</span>
                    </div>
                  ) : (
                    <div className="space-y-2.5">
                      <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-2.5 space-y-1.5 animate-in fade-in duration-300">
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-zinc-200">Table #04 (Order #31)</span>
                          <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/10 text-primary border border-primary/20">NEW</span>
                        </div>
                        <div className="text-zinc-400 font-medium space-y-0.5 pl-1.5 border-l border-zinc-700">
                          <div>1x Margherita Pizza</div>
                          <div>1x Lemon Soda</div>
                        </div>
                        <div className="flex justify-end pt-1">
                          <button className="px-2 py-0.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[8px] font-bold cursor-pointer">
                            Mark Ready
                          </button>
                        </div>
                      </div>
                      
                      {demoStep === 4 && (
                        <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-2.5 space-y-1">
                          <div className="flex justify-between text-zinc-500">
                            <span>Table #04 billing session requested</span>
                            <span className="font-bold text-zinc-300">$20.00</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Feature Cards Grid */}
      <section id="features" className="py-20 border-t border-border/80">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Built for Scale. Designed for Usability.
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              Everything you need to automate orders, operations, and collections in one robust, premium dashboard.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
            
            {/* Card 1 */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 hover:border-primary/20 transition-all duration-200 glow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 border border-primary/20 text-primary shadow-xs">
                <QrCode className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Dynamic Table QRs</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automatically generate secure, table-specific QR codes with dynamic links. Instantly mapping table coordinates upon scan.
              </p>
            </div>

            {/* Card 2 */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 hover:border-primary/20 transition-all duration-200 glow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 border border-primary/20 text-primary shadow-xs">
                <ShoppingBag className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Multi-Order Sessions</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Allows tables to order multiple rounds (drinks, starters, mains) on a single active session under one unified bill.
              </p>
            </div>

            {/* Card 3 */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 hover:border-primary/20 transition-all duration-200 glow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 border border-primary/20 text-primary shadow-xs">
                <ChefHat className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Real-time KDS Queue</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Stateful kitchen management queue. Kitchen staff is updated instantly when table orders are submitted.
              </p>
            </div>

            {/* Card 4 */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 hover:border-primary/20 transition-all duration-200 glow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 border border-primary/20 text-primary shadow-xs">
                <Receipt className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Tax & GST split Billing</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Automated invoice summaries with customized GST settings, split taxes, and checkout triggers.
              </p>
            </div>

            {/* Card 5 */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 hover:border-primary/20 transition-all duration-200 glow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 border border-primary/20 text-primary shadow-xs">
                <Users className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Staff & Access Roles</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Set roles for owners, kitchen staff, managers, and servers with fine-grained endpoint route protection.
              </p>
            </div>

            {/* Card 6 */}
            <div className="rounded-2xl border border-border/80 bg-card p-6 space-y-4 hover:border-primary/20 transition-all duration-200 glow-card">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 border border-primary/20 text-primary shadow-xs">
                <Zap className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-foreground">Subtle Micro-Interactions</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Optimized with premium hardware-accelerated transitions, dark mode defaults, and quick-loading mobile templates.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* Customer vs. Owner Workflows */}
      <section id="workflows" className="py-20 border-t border-border/80 bg-muted/10">
        <div className="max-w-5xl mx-auto px-6 space-y-12">
          
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              A Unified Workflow Experience
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Tailored modules built both for customer simplicity and restaurant administrator oversight.
            </p>

            <div className="inline-flex rounded-xl bg-card border border-border p-1 mt-4">
              <button
                onClick={() => setActiveWorkflowTab("customer")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeWorkflowTab === "customer"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground bg-transparent"
                }`}
              >
                Customer Ordering
              </button>
              <button
                onClick={() => setActiveWorkflowTab("owner")}
                className={`px-4 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all ${
                  activeWorkflowTab === "owner"
                    ? "bg-primary text-primary-foreground shadow-xs"
                    : "text-muted-foreground hover:text-foreground bg-transparent"
                }`}
              >
                Restaurant Owner console
              </button>
            </div>
          </div>

          <div className="bg-card border border-border/80 rounded-2xl p-6 md:p-8 shadow-sm">
            {activeWorkflowTab === "customer" ? (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Smartphone className="h-4.5 w-4.5 text-primary" />
                  Self-Service Table Ordering Flow
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6 relative">
                  
                  {/* Step 1 */}
                  <div className="space-y-2 relative">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">1</span>
                      <span className="text-xs font-semibold">Scan Table QR</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Unique QR mapped to the table slug. Securely loads the checkout session without login.</p>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">2</span>
                      <span className="text-xs font-semibold">Add to Cart</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Select food categories, customize quantities, and review live session prices on the screen.</p>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">3</span>
                      <span className="text-xs font-semibold">Submit Order</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Submit order requests instantly. Local storage token maintains active sessions on page reload.</p>
                  </div>

                  {/* Step 4 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">4</span>
                      <span className="text-xs font-semibold">Consolidated Check</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Request final bill from your phone. Single final checkout avoids splitting separate receipts.</p>
                  </div>

                </div>
              </div>
            ) : (
              <div className="space-y-6">
                <h3 className="text-base font-bold text-foreground flex items-center gap-2">
                  <Laptop className="h-4.5 w-4.5 text-primary" />
                  Restaurant Owner Dashboard Flow
                </h3>

                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">

                  {/* Step 1 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">1</span>
                      <span className="text-xs font-semibold">Register & Setup</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Register details and create restaurant profile (logo, currency, taxes, GST configurations).</p>
                  </div>

                  {/* Step 2 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">2</span>
                      <span className="text-xs font-semibold">Generate Table QRs</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Create tables (numbers, titles). Print and download automatically generated dining QR codes.</p>
                  </div>

                  {/* Step 3 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">3</span>
                      <span className="text-xs font-semibold">Menu Management</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Arrange categories and toggle active items, prices, and upload image descriptors on the fly.</p>
                  </div>

                  {/* Step 4 */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/10 text-primary font-bold text-[10px]">4</span>
                      <span className="text-xs font-semibold">Fulfill & Bill</span>
                    </div>
                    <p className="text-[11px] text-muted-foreground">Track order status via KDS queue, close active table sessions, and monitor transaction logs.</p>
                  </div>

                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 border-t border-border/80">
        <div className="max-w-7xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-xl mx-auto">
              No hidden fees or dynamic setup pricing. A single tier tailored to help your establishment scale.
            </p>
          </div>

          <div className="max-w-md mx-auto rounded-2xl border border-border bg-card overflow-hidden shadow-sm hover:border-primary/20 transition-all duration-200">
            <div className="p-6 md:p-8 space-y-4 border-b border-border/80 bg-muted/5">
              <span className="text-xs font-bold text-primary uppercase tracking-widest">Growth Plan</span>
              <div className="flex items-baseline gap-1 pt-2">
                <span className="text-4xl font-extrabold tracking-tight">$49</span>
                <span className="text-xs text-muted-foreground font-semibold">/ month</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Everything you need to automate tables, menu setups, and self-ordering operations.
              </p>
              <Link href="/signup" className="block pt-2">
                <Button variant="primary" className="w-full h-10 text-xs font-semibold rounded-lg cursor-pointer">
                  Start 14-Day Free Trial
                </Button>
              </Link>
            </div>
            
            <div className="p-6 md:p-8 space-y-3.5">
              <div className="text-xs font-bold text-foreground">WHAT&apos;S INCLUDED:</div>
              <ul className="space-y-2.5 text-xs text-muted-foreground font-medium">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  Unlimited Tables &amp; QRs
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  Unlimited Categories &amp; Menu Items
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  Stateful Kitchen Display Screen (KDS)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  Unified Multi-Order Dining Sessions
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  Detailed Billing summaries &amp; GST splits
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-primary shrink-0" />
                  2 Staff member logins
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Frequently Asked Questions */}
      <section id="faqs" className="py-20 border-t border-border/80 bg-muted/10">
        <div className="max-w-4xl mx-auto px-6 space-y-12">
          <div className="text-center space-y-3">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
              Frequently Asked Questions
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Common questions from restaurant owners evaluating QR Dine.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
            
            <div className="bg-card border border-border/60 rounded-xl p-5 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                Do customers need an app to order?
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                No app installation required. Customers simply scan the table QR code using their default mobile phone camera and order directly from their browser.
              </p>
            </div>

            <div className="bg-card border border-border/60 rounded-xl p-5 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                How are multiple orders handled?
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                We handle dining sessions. A table can submit order updates consecutively (e.g. Starters, then Mains, then Drinks). All rounds accumulate under a single billing session.
              </p>
            </div>

            <div className="bg-card border border-border/60 rounded-xl p-5 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                Can we configure local taxes and GST?
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                Yes. Under Restaurant Settings, owners can specify custom local tax rates, GST numbers, currencies, and restaurant branding parameters dynamically.
              </p>
            </div>

            <div className="bg-card border border-border/60 rounded-xl p-5 space-y-2">
              <h4 className="text-xs font-bold text-foreground flex items-center gap-1.5">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                How does session recovery work?
              </h4>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                We use secure local tokens. If a customer accidentally closes their browser tab or refreshes, the app resumes their active table session and pending order lists automatically.
              </p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 border-t border-border/80">
        <div className="max-w-4xl mx-auto px-6">
          <div className="rounded-2xl border border-border bg-card p-8 md:p-12 text-center space-y-6 shadow-xs relative overflow-hidden">
            {/* Subtle card glow */}
            <div className="absolute inset-0 bg-primary/2 -z-10" />
            
            <h2 className="text-3xl font-extrabold tracking-tight text-foreground">
              Ready to Upgrade Your Dining Room?
            </h2>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Join restaurant establishments using QR Dine to reduce service friction, save waiter overhead, and speed up turnover.
            </p>

            <div className="pt-2">
              {user ? (
                <Link href="/dashboard">
                  <Button variant="primary" className="h-11 px-8 text-xs font-semibold rounded-xl cursor-pointer">
                    Go to Console Dashboard
                  </Button>
                </Link>
              ) : (
                <Link href="/signup">
                  <Button variant="primary" className="h-11 px-8 text-xs font-semibold rounded-xl cursor-pointer">
                    Get Started Free
                  </Button>
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border/80 py-12 bg-muted/5 text-xs text-muted-foreground">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 md:grid-cols-4 gap-8">
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <UtensilsCrossed className="h-4 w-4" />
              </div>
              <span className="font-bold text-sm tracking-tight text-foreground">QR Dine</span>
            </div>
            <p className="text-[11px] leading-relaxed">
              Premium SaaS platform for self-ordering restaurant sessions and table-level QR code generation.
            </p>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider">Product</h4>
            <ul className="space-y-2">
              <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
              <li><a href="#demo" className="hover:text-foreground transition-colors">Interactive Demo</a></li>
              <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing Plans</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider">Solutions</h4>
            <ul className="space-y-2">
              <li><a href="#workflows" className="hover:text-foreground transition-colors">For Customers</a></li>
              <li><a href="#workflows" className="hover:text-foreground transition-colors">For Restaurant Owners</a></li>
              <li><a href="#features" className="hover:text-foreground transition-colors">KDS Queue Display</a></li>
            </ul>
          </div>

          <div className="space-y-3">
            <h4 className="font-bold text-foreground text-[11px] uppercase tracking-wider">Company</h4>
            <ul className="space-y-2">
              <li><span className="text-muted-foreground/70">About Us</span></li>
              <li><span className="text-muted-foreground/70">Privacy Policy</span></li>
              <li><span className="text-muted-foreground/70">Terms of Service</span></li>
            </ul>
          </div>

        </div>

        <div className="max-w-7xl mx-auto px-6 mt-12 pt-6 border-t border-border/40 text-center">
          <p>&copy; {new Date().getFullYear()} QR Dine. All rights reserved. Built as a premium B2B SaaS console.</p>
        </div>
      </footer>
    </div>
  );
}
