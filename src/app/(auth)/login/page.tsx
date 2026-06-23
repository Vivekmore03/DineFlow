"use client";

import { useState, useTransition, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Mail, Lock, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { loginSchema } from "@/lib/validators";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");
  const errorParam = searchParams.get("error");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = loginSchema.safeParse({ email, password });
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
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Invalid email or password");
          return;
        }

        toast.success("Login successful!");
        router.refresh();

        // Role-based redirect logic
        if (callbackUrl) {
          router.push(callbackUrl);
        } else if (data.user?.role === "KITCHEN_STAFF") {
          router.push("/kitchen");
        } else {
          router.push("/dashboard");
        }
      } catch (err) {
        console.error("Login submission error:", err);
        toast.error("Failed to connect. Please check your internet connection.");
      }
    });
  };

  return (
    <Card className="border border-border/80 shadow-lg rounded-2xl bg-card overflow-hidden">
      <CardHeader className="space-y-1.5 p-6 pb-4">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground">
          Welcome Back
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Sign in to your restaurant dashboard to manage tables and orders.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        {errorParam === "unauthorized" && (
          <div className="flex items-center gap-2 p-3 text-xs font-medium text-destructive border border-destructive/20 bg-destructive/5 rounded-xl animate-in fade-in duration-200">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>Unauthorized access. Please login with a valid role.</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Email field */}
          <div className="space-y-1.5">
            <Label htmlFor="email" className="text-xs font-semibold text-foreground">
              Work Email Address
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

          {/* Password field */}
          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <Label htmlFor="password" className="text-xs font-semibold text-foreground">
                Account Password
              </Label>
              <Link
                href="/forgot-password"
                className="text-[11px] font-medium text-primary hover:underline"
              >
                Forgot?
              </Link>
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isPending}
                className="pl-9 h-10 text-sm bg-background border-border"
                required
              />
            </div>
            {errors.password && (
              <p className="text-[11px] text-destructive font-medium mt-1">{errors.password}</p>
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
                Sign in to Console
                <ArrowRight className="h-4 w-4" />
              </>
            )}
            {isPending && "Signing you in..."}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex items-center justify-center p-4 border-t border-border/40 mt-1 bg-muted/10">
        <p className="text-xs text-muted-foreground">
          Don&apos;t have an account?{" "}
          <Link href="/signup" className="font-semibold text-primary hover:underline">
            Register your Restaurant
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={
      <Card className="border border-border/80 shadow-lg rounded-2xl bg-card overflow-hidden">
        <CardContent className="p-6 text-center text-xs text-muted-foreground">
          Loading login screen...
        </CardContent>
      </Card>
    }>
      <LoginForm />
    </Suspense>
  );
}
