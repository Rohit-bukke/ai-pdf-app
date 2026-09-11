"use client";

import Link from "next/link";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  FileText,
  BrainCircuit,
  GitFork,
  CheckCircle2,
  ShieldCheck,
  ArrowRight,
  Database,
  BarChart3,
  Layers,
  GraduationCap,
} from "lucide-react";

export default function LandingPage() {
  const { data: session } = useSession();

  return (
    <div className="relative overflow-hidden">
      {/* Background radial gradients */}
      <div className="pointer-events-none absolute left-1/2 top-0 -z-10 h-[650px] w-full -translate-x-1/2 bg-[radial-gradient(ellipse_at_top,rgba(124,58,237,0.18),transparent_70%)]" />
      <div className="pointer-events-none absolute right-0 top-1/4 -z-10 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />
      <div className="pointer-events-none absolute left-10 top-1/2 -z-10 h-96 w-96 rounded-full bg-purple-500/10 blur-3xl" />

      {/* Hero Section */}
      <section className="container mx-auto max-w-6xl px-4 pt-20 pb-16 text-center sm:px-6 md:pt-28 md:pb-24">
        <div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3.5 py-1 text-xs font-semibold text-purple-300 backdrop-blur-md mb-6 animate-pulse-glow">
          <Sparkles className="h-3.5 w-3.5 text-purple-400" />
          <span>Full-Stack AI Engineering — Production-Grade Architecture</span>
        </div>

        <h1 className="text-4xl font-extrabold tracking-tight sm:text-6xl md:text-7xl">
          Learn Deeper with <br className="hidden sm:inline" />
          <span className="gradient-text">Grounded AI & Concept Graphs</span>
        </h1>

        <p className="mx-auto mt-6 max-w-2xl text-base text-muted-foreground sm:text-lg md:text-xl">
          Transform your course PDFs into an interactive, citation-backed AI Tutor.
          Experience metacognitive confidence-calibrated assessments and prerequisite dependency mapping.
        </p>

        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Link href={session ? "/dashboard" : "/signin"}>
            <Button size="lg" variant="gradient" className="gap-2 text-base px-7 shadow-indigo-600/30 shadow-lg">
              {session ? "Enter Study Dashboard" : "Get Started with Google"}
              <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>

          <Link href="#architecture">
            <Button size="lg" variant="outline" className="gap-2 border-border text-foreground hover:bg-muted/50">
              <Layers className="h-4 w-4 text-purple-400" />
              Explore Architecture
            </Button>
          </Link>
        </div>

        {/* Live Architecture Trust Badges */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-6 text-xs text-muted-foreground border-y border-border/40 py-4 max-w-4xl mx-auto">
          <span className="flex items-center gap-1.5 font-medium text-zinc-300">
            <ShieldCheck className="h-4 w-4 text-emerald-400" />
            Strict Server-Side Ownership
          </span>
          <span className="flex items-center gap-1.5 font-medium text-zinc-300">
            <Database className="h-4 w-4 text-blue-400" />
            MongoDB Atlas Vector Search
          </span>
          <span className="flex items-center gap-1.5 font-medium text-zinc-300">
            <BrainCircuit className="h-4 w-4 text-purple-400" />
            Google Gemini Provider Abstraction
          </span>
          <span className="flex items-center gap-1.5 font-medium text-zinc-300">
            <FileText className="h-4 w-4 text-amber-400" />
            Prompt Injection Defenses
          </span>
        </div>
      </section>

      {/* Feature Differentiators */}
      <section className="container mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="text-center mb-12">
          <Badge variant="default" className="mb-3 bg-indigo-500/20 text-indigo-300 border-indigo-500/30">
            Core Differentiators
          </Badge>
          <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            Engineered Beyond Generic Chatbots
          </h2>
          <p className="mt-3 text-sm text-muted-foreground max-w-xl mx-auto">
            Real AI engineering means grounding, metacognition, and pedagogical intelligence.
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {/* Differentiator 1 */}
          <Card className="border-purple-500/20 bg-card/40 hover:border-purple-500/40 transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400 mb-2">
                <GitFork className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg text-white">Concept Dependency Graph</CardTitle>
              <CardDescription>
                Learns prerequisites between concepts (e.g. Linear Equations → Quadratic Equations).
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                When a student struggles with an advanced topic, the recommendation engine guides them to master prerequisite concepts first rather than repeating failed attempts.
              </p>
            </CardContent>
          </Card>

          {/* Differentiator 2 */}
          <Card className="border-blue-500/20 bg-card/40 hover:border-blue-500/40 transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400 mb-2">
                <BrainCircuit className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg text-white">Metacognitive Quiz Mode</CardTitle>
              <CardDescription>
                Calibrates learner confidence against actual accuracy to eliminate dangerous blindspots.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                High-confidence mistakes receive strong mastery penalties and alert the student to overconfidence illusions, driving durable retention.
              </p>
            </CardContent>
          </Card>

          {/* Differentiator 3 */}
          <Card className="border-emerald-500/20 bg-card/40 hover:border-emerald-500/40 transition-all hover:-translate-y-1">
            <CardHeader>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400 mb-2">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <CardTitle className="text-lg text-white">Grounded RAG & Citations</CardTitle>
              <CardDescription>
                Zero hallucination policy with precise [Document Name — Page N] citations.
              </CardDescription>
            </CardHeader>
            <CardContent className="text-xs text-muted-foreground space-y-2">
              <p>
                All retrieved content is treated as untrusted data wrapped in security delimiters. Unsupported questions are politely declined rather than fabricated.
              </p>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Architecture Deep Dive Section */}
      <section id="architecture" className="container mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="rounded-2xl border border-border/80 bg-card/40 p-8 backdrop-blur-xl md:p-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6 mb-8">
            <div>
              <Badge variant="default" className="mb-2 bg-purple-500/20 text-purple-300">
                Layered Architecture
              </Badge>
              <h3 className="text-2xl font-bold text-white md:text-3xl">Production-Grade AI Flow</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Zero client-side secrets • Complete ownership scoping • Evaluation test suite
              </p>
            </div>
            <Link href={session ? "/dashboard" : "/signin"}>
              <Button variant="gradient">Launch Application</Button>
            </Link>
          </div>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-xl border border-border bg-background/50 p-4">
              <div className="text-xs font-semibold text-purple-400 uppercase tracking-wider mb-1">1. Ingestion</div>
              <h4 className="text-sm font-semibold text-white mb-2">Private Supabase & Inngest</h4>
              <p className="text-xs text-muted-foreground">
                20MB validation, PDF magic-byte checks, chunking with overlap, and background queueing.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background/50 p-4">
              <div className="text-xs font-semibold text-blue-400 uppercase tracking-wider mb-1">2. Embeddings</div>
              <h4 className="text-sm font-semibold text-white mb-2">Gemini 768-D Vectors</h4>
              <p className="text-xs text-muted-foreground">
                Batch embedding generation stored in MongoDB Atlas with project-level isolation.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background/50 p-4">
              <div className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-1">3. Retrieval & Tutor</div>
              <h4 className="text-sm font-semibold text-white mb-2">Project Vector Search</h4>
              <p className="text-xs text-muted-foreground">
                Cosine similarity scoring, injection defense tags, and strict [Doc — Page N] citations.
              </p>
            </div>

            <div className="rounded-xl border border-border bg-background/50 p-4">
              <div className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-1">4. Intelligence</div>
              <h4 className="text-sm font-semibold text-white mb-2">Adaptive Quizzes & Graph</h4>
              <p className="text-xs text-muted-foreground">
                Metacognitive tracking, concept dependency recommendations, and evaluation harness.
              </p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
