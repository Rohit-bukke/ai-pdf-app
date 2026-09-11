"use client";

import { Suspense } from "react";
import { signIn, useSession } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ShieldCheck, Loader2 } from "lucide-react";

// Inner component that uses useSearchParams — must be wrapped in Suspense (Next.js 14 requirement)
function SignInContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (status === "authenticated") {
      router.replace(callbackUrl);
    }
  }, [status, router, callbackUrl]);

  const handleGoogleSignIn = async () => {
    try {
      setIsLoading(true);
      await signIn("google", { callbackUrl });
    } catch (err) {
      console.error("Sign in failed", err);
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center px-4 py-12 sm:px-6 lg:px-8 relative">
      <div className="pointer-events-none absolute h-96 w-96 rounded-full bg-purple-600/10 blur-3xl -top-10 -left-10" />
      <div className="pointer-events-none absolute h-96 w-96 rounded-full bg-blue-600/10 blur-3xl -bottom-10 -right-10" />

      <Card className="w-full max-w-md border-border/80 bg-card/60 backdrop-blur-xl shadow-2xl relative">
        <CardHeader className="text-center space-y-2">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-600 shadow-md shadow-indigo-500/30 mb-2">
            <Sparkles className="h-6 w-6 text-white" />
          </div>
          <CardTitle className="text-2xl font-bold text-white">Sign In to Continue</CardTitle>
          <CardDescription className="text-xs text-muted-foreground">
            Access your spaces, study projects, grounded AI tutor, and concept mastery analytics.
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6 pt-2">
          <Button
            type="button"
            variant="default"
            size="lg"
            className="w-full gap-3 bg-white text-zinc-900 hover:bg-zinc-100 font-medium shadow-md transition-all py-6"
            onClick={handleGoogleSignIn}
            disabled={isLoading || status === "loading"}
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin text-zinc-800" />
            ) : (
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                  fill="#EA4335"
                />
              </svg>
            )}
            <span>Sign In with Google</span>
          </Button>

          <div className="rounded-lg border border-border/50 bg-background/50 p-3.5 space-y-2">
            <div className="flex items-center gap-2 text-xs font-semibold text-zinc-300">
              <ShieldCheck className="h-4 w-4 text-emerald-400 shrink-0" />
              <span>Strict Security &amp; Privacy Standards</span>
            </div>
            <p className="text-[11px] text-muted-foreground leading-relaxed">
              Google OAuth is the sole authentication provider. Your documents and learning history are isolated with server-side ownership authorization.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

// Required Suspense wrapper for useSearchParams() in Next.js 14 App Router
export default function SignInPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-[calc(100vh-8rem)] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-purple-400" />
      </div>
    }>
      <SignInContent />
    </Suspense>
  );
}
