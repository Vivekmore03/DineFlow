"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { Mail, ArrowRight, ArrowLeft, KeyRound, AlertCircle, Copy, Check } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { forgotPasswordSchema } from "@/lib/validators";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  // Simulated link variables for local development
  const [simulatedUrl, setSimulatedUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    setSimulatedUrl(null);

    const parsed = forgotPasswordSchema.safeParse({ email });
    if (!parsed.success) {
      const fieldErrors: Record<string, string> = {};
      parsed.error.issues.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0].toString()] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    startTransition(async () => {
      try {
        const res = await fetch("/api/auth/forgot-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to process request");
          return;
        }

        toast.success(data.message);
        
        // Capture debug reset link returned by MVP API
        if (data.debug?.resetUrl) {
          setSimulatedUrl(data.debug.resetUrl);
        }
      } catch (err) {
        console.error("Forgot password submission error:", err);
        toast.error("Failed to connect. Please check your internet connection.");
      }
    });
  };

  const handleCopyLink = () => {
    if (!simulatedUrl) return;
    navigator.clipboard.writeText(simulatedUrl);
    setCopied(true);
    toast.success("Reset link copied to clipboard!");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Card className="border border-border/80 shadow-lg rounded-2xl bg-card overflow-hidden">
      <CardHeader className="space-y-1.5 p-6 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 border border-primary/20 text-primary mb-2 shadow-xs">
          <KeyRound className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-foreground">
          Reset Password
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Enter your registered email address and we will simulate sending a password reset link.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        {simulatedUrl ? (
          /* Success Box with simulated URL copyable */
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-3">
              <div className="flex gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p>Reset Link Simulated! (Development Mode)</p>
                  <p className="font-normal text-muted-foreground mt-1 text-[11px] leading-normal">
                    Since SMTP is bypassed for local developer testing, you can copy the generated reset URL directly:
                  </p>
                </div>
              </div>
              
              <div className="flex items-center gap-1.5 bg-background border border-border rounded-lg p-2.5">
                <span className="text-[10px] font-mono text-muted-foreground truncate flex-1 leading-none select-all select-none">
                  {simulatedUrl}
                </span>
                <button
                  onClick={handleCopyLink}
                  className="flex h-7 w-7 shrink-0 items-center justify-center rounded-md border border-border bg-card text-muted-foreground hover:text-foreground cursor-pointer hover:bg-secondary active:scale-95 transition-all"
                  title="Copy link to clipboard"
                >
                  {copied ? <Check className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                </button>
              </div>
            </div>
            
            <Link href={simulatedUrl}>
              <Button variant="primary" className="w-full h-11 text-xs font-semibold rounded-xl cursor-pointer gap-1.5">
                Go to Reset Password
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        ) : (
          /* Normal Form */
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-xs font-semibold text-foreground">
                Account Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="email"
                  type="email"
                  placeholder="you@yourcompany.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isPending}
                  className="pl-9 h-10 text-sm bg-background border-border"
                  required
                />
              </div>
              {errors.email && (
                <p className="text-[11px] text-destructive font-medium mt-1">{errors.email}</p>
              )}
            </div>

            <Button
              type="submit"
              variant="primary"
              isLoading={isPending}
              disabled={isPending}
              className="w-full h-11 text-xs font-semibold rounded-xl mt-2 cursor-pointer gap-1.5"
            >
              {!isPending && (
                <>
                  Generate Reset URL
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
              {isPending && "Simulating password recovery..."}
            </Button>
          </form>
        )}
      </CardContent>

      <CardFooter className="flex items-center justify-center p-4 border-t border-border/40 mt-1 bg-muted/10">
        <Link href="/login" className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground font-semibold hover:underline">
          <ArrowLeft className="h-3.5 w-3.5" />
          Back to Login
        </Link>
      </CardFooter>
    </Card>
  );
}
