"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  BookOpen,
  LayoutDashboard,
  ShieldAlert,
  LogOut,
  LogIn,
  Sparkles,
  Layers,
} from "lucide-react";

export function Navbar() {
  const { data: session, status } = useSession();
  const isAdmin = session?.user?.role === "ADMIN";

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-lg">
      <div className="container mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 transition hover:opacity-90">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-purple-600 via-indigo-600 to-blue-500 shadow-md shadow-indigo-500/20">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-lg font-bold tracking-tight text-white">
              AI Study Companion
            </span>
          </Link>

          {session && (
            <nav className="hidden md:flex items-center gap-4 text-sm font-medium">
              <Link
                href="/dashboard"
                className="flex items-center gap-1.5 text-muted-foreground transition hover:text-white"
              >
                <LayoutDashboard className="h-4 w-4" />
                Dashboard
              </Link>
              {isAdmin && (
                <Link
                  href="/admin"
                  className="flex items-center gap-1.5 text-purple-400 transition hover:text-purple-300"
                >
                  <ShieldAlert className="h-4 w-4" />
                  Admin & Evaluation
                </Link>
              )}
            </nav>
          )}
        </div>

        <div className="flex items-center gap-3">
          {status === "loading" ? (
            <div className="h-8 w-24 animate-pulse rounded-md bg-muted" />
          ) : session ? (
            <div className="flex items-center gap-3">
              <div className="hidden sm:flex flex-col items-end text-xs">
                <span className="font-medium text-white">{session.user?.name || "Learner"}</span>
                <span className="text-muted-foreground">{session.user?.email}</span>
              </div>
              {isAdmin && (
                <Badge variant="default" className="hidden sm:inline-flex bg-purple-600/30 text-purple-300 border-purple-500/40">
                  ADMIN
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => signOut({ callbackUrl: "/" })}
                className="gap-1.5 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Sign Out</span>
              </Button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/signin">
                <Button variant="gradient" size="sm" className="gap-1.5">
                  <LogIn className="h-4 w-4" />
                  Sign In with Google
                </Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
