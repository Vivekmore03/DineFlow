"use client";

import { useState, useTransition, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, ArrowRight, ArrowLeft, KeyRound, Check, AlertCircle } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { resetPasswordSchema } from "@/lib/validators";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    if (!token) {
      setErrors({ token: "Missing password reset token. Please request a new link." });
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    if (!token) {
      setErrors({ token: "Missing reset token. Please request a new password reset link." });
      return;
    }

    if (password !== confirmPassword) {
      setErrors({ confirmPassword: "Passwords do not match" });
      return;
    }

    // Validate using Zod schema
    const parsed = resetPasswordSchema.safeParse({ token, password });
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
        const res = await fetch("/api/auth/reset-password", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Failed to reset password");
          return;
        }

        toast.success("Password reset successfully!");
        setIsSuccess(true);
        
        // Wait 3 seconds and redirect to login
        setTimeout(() => {
          router.push("/login");
        }, 3000);
      } catch (err) {
        console.error("Reset password error:", err);
        toast.error("Failed to connect. Please check your internet connection.");
      }
    });
  };

  return (
    <Card className="border border-border/80 shadow-lg rounded-2xl bg-card overflow-hidden">
      <CardHeader className="space-y-1.5 p-6 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/8 border border-primary/20 text-primary mb-2 shadow-xs">
          <Lock className="h-5 w-5" />
        </div>
        <CardTitle className="text-xl font-bold tracking-tight text-foreground">
          New Password
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Enter and confirm your new password below.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        {errors.token && (
          <div className="rounded-xl border border-destructive/20 bg-destructive/5 p-4 flex gap-2.5 text-xs text-destructive">
            <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold">Reset Link Invalid</p>
              <p className="font-normal text-muted-foreground mt-1 text-[11px] leading-normal">
                {errors.token}
              </p>
              <Link href="/forgot-password" className="mt-2 inline-block font-semibold text-primary hover:underline">
                Request a new link &rarr;
              </Link>
            </div>
          </div>
        )}

        {isSuccess ? (
          <div className="space-y-4 animate-in fade-in duration-200">
            <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-4 space-y-2">
              <div className="flex gap-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                <Check className="h-4 w-4 shrink-0 mt-0.5" />
                <div>
                  <p>Password Reset Successful!</p>
                  <p className="font-normal text-muted-foreground mt-1 text-[11px] leading-normal">
                    Your password has been successfully updated. Redirecting you to the login page shortly...
                  </p>
                </div>
              </div>
            </div>
            
            <Link href="/login">
              <Button variant="primary" className="w-full h-11 text-xs font-semibold rounded-xl cursor-pointer">
                Go to Login Immediately
              </Button>
            </Link>
          </div>
        ) : (
          !errors.token && (
            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Password */}
              <div className="space-y-1.5">
                <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                  New Password
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isPending}
                    className="pl-9 h-10 text-sm bg-background border-border"
                    required
                    minLength={8}
                  />
                </div>
                {errors.password && (
                  <p className="text-[11px] text-destructive font-medium mt-1">{errors.password}</p>
                )}
              </div>

              {/* Confirm Password */}
              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword" className="text-xs font-semibold text-foreground">
                  Confirm New Password
                </Label>
                <div className="relative">
                  <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    disabled={isPending}
                    className="pl-9 h-10 text-sm bg-background border-border"
                    required
                    minLength={8}
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="text-[11px] text-destructive font-medium mt-1">{errors.confirmPassword}</p>
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
                    Reset Password
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
                {isPending && "Updating password..."}
              </Button>
            </form>
          )
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

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <Card className="border border-border/80 shadow-lg rounded-2xl bg-card overflow-hidden">
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          Loading password reset screen...
        </CardContent>
      </Card>
    }>
      <ResetPasswordForm />
    </Suspense>
  );
}
