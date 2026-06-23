"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Loader2, Mail, Lock, User, Store, AlertCircle, ArrowRight } from "lucide-react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/toast";
import { registerSchema } from "@/lib/validators";

export default function SignupPage() {
  const router = useRouter();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [restaurantName, setRestaurantName] = useState("");
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isPending, startTransition] = useTransition();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    const parsed = registerSchema.safeParse({ name, email, password, restaurantName });
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
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password, restaurantName }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(data.error || "Registration failed. Email might be in use.");
          return;
        }

        toast.success("Account and Restaurant registered successfully!");
        router.refresh();
        router.push("/dashboard");
      } catch (err) {
        console.error("Signup submission error:", err);
        toast.error("Failed to connect. Please check your internet connection.");
      }
    });
  };

  return (
    <Card className="border border-border/80 shadow-lg rounded-2xl bg-card overflow-hidden">
      <CardHeader className="space-y-1.5 p-6 pb-4">
        <CardTitle className="text-xl font-bold tracking-tight text-foreground">
          Register Restaurant
        </CardTitle>
        <CardDescription className="text-xs text-muted-foreground">
          Create an owner account and launch your digital QR menus in minutes.
        </CardDescription>
      </CardHeader>

      <CardContent className="p-6 pt-0 space-y-4">
        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Owner Name field */}
          <div className="space-y-1.5">
            <Label htmlFor="name" className="text-xs font-semibold text-foreground">
              Your Full Name
            </Label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="name"
                type="text"
                placeholder="Raj Sharma"
                value={name}
                onChange={(e) => setName(e.target.value)}
                disabled={isPending}
                className="pl-9 h-10 text-sm bg-background border-border"
                required
              />
            </div>
            {errors.name && (
              <p className="text-[11px] text-destructive font-medium mt-1">{errors.name}</p>
            )}
          </div>

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

          {/* Restaurant Name field */}
          <div className="space-y-1.5">
            <Label htmlFor="restaurantName" className="text-xs font-semibold text-foreground">
              Restaurant Name
            </Label>
            <div className="relative">
              <Store className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="restaurantName"
                type="text"
                placeholder="Spice Garden"
                value={restaurantName}
                onChange={(e) => setRestaurantName(e.target.value)}
                disabled={isPending}
                className="pl-9 h-10 text-sm bg-background border-border"
                required
              />
            </div>
            {errors.restaurantName && (
              <p className="text-[11px] text-destructive font-medium mt-1">{errors.restaurantName}</p>
            )}
          </div>

          {/* Password field */}
          <div className="space-y-1.5">
            <Label htmlFor="password" className="text-xs font-semibold text-foreground">
              Account Password
            </Label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground pointer-events-none" />
              <Input
                id="password"
                type="password"
                placeholder="Min. 8 characters"
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
                Create Account & Restaurant
                <ArrowRight className="h-4 w-4" />
              </>
            )}
            {isPending && "Creating restaurant panel..."}
          </Button>
        </form>
      </CardContent>

      <CardFooter className="flex items-center justify-center p-4 border-t border-border/40 mt-1 bg-muted/10">
        <p className="text-xs text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>
        </p>
      </CardFooter>
    </Card>
  );
}
