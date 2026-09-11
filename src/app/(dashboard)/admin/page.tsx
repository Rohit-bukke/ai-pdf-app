"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ShieldAlert,
  Cpu,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Play,
  Loader2,
  Clock,
  Database,
  Layers,
} from "lucide-react";

export default function AdminEvaluationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [adminData, setAdminData] = useState<any>(null);
  const [projects, setProjects] = useState<any[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [isLoading, setIsLoading] = useState(true);

  // Evaluation Harness Runner state
  const [isRunningEval, setIsRunningEval] = useState(false);
  const [evalSummary, setEvalSummary] = useState<any>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      if (session.user?.role !== "ADMIN") {
        // Not authorized as admin
        router.push("/dashboard");
      } else {
        loadAdminData();
      }
    }
  }, [status, session, router]);

  const loadAdminData = async () => {
    setIsLoading(true);
    try {
      const [adminRes, projectsRes] = await Promise.all([
        fetch("/api/admin/analytics"),
        fetch("/api/projects"),
      ]);

      const adminJson = await adminRes.json();
      const projectsJson = await projectsRes.json();

      if (adminJson.success) setAdminData(adminJson.data);
      if (projectsJson.success) {
        setProjects(projectsJson.data);
        if (projectsJson.data.length > 0) {
          setSelectedProjectId(projectsJson.data[0]._id);
        }
      }
    } catch (err) {
      console.error("Failed to load admin analytics", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRunEvaluation = async () => {
    if (!selectedProjectId) {
      alert("Please select a study project to run the evaluation harness against.");
      return;
    }

    setIsRunningEval(true);
    setEvalSummary(null);

    try {
      const res = await fetch("/api/admin/eval", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          projectId: selectedProjectId,
          promptVersion: "v1.0.0-gemini-flash",
        }),
      });

      const data = await res.json();
      if (data.success) {
        setEvalSummary(data.data);
        loadAdminData();
      } else {
        alert(data.error || "Failed to execute evaluation harness.");
      }
    } catch (err) {
      console.error("Evaluation run error", err);
    } finally {
      setIsRunningEval(false);
    }
  };

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-sm text-muted-foreground font-medium">Verifying Administrator Privileges...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6 space-y-8">
      {/* Admin Header */}
      <div className="border-b border-border pb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="default" className="bg-purple-600/30 text-purple-300 border-purple-500/40">
              RESTRICTED
            </Badge>
            <span className="text-xs text-muted-foreground">Admin Observability & AI Evaluation</span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white">
            System Health & AI Regression Harness
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Inspect platform-wide AI token consumption, latency distribution, and run standardized quality regression suites.
          </p>
        </div>

        <Button variant="outline" size="sm" onClick={loadAdminData} className="gap-2 border-border">
          <Clock className="h-4 w-4" />
          Refresh Stats
        </Button>
      </div>

      {/* AI Stats Overview */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card/40 border-border">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Active Model</CardDescription>
            <CardTitle className="text-xl font-bold text-white flex items-center gap-2">
              <Cpu className="h-5 w-5 text-purple-400" />
              Gemini 1.5 Flash
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Embeddings: text-embedding-004 (768-D)
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Database Engine</CardDescription>
            <CardTitle className="text-xl font-bold text-emerald-400 flex items-center gap-2">
              <Database className="h-5 w-5" />
              MongoDB Atlas
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Vector Search & Isolated Tenant Scoping
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Total AI Requests Logged</CardDescription>
            <CardTitle className="text-xl font-bold text-blue-400">
              {adminData?.aiStats?.reduce((acc: number, s: any) => acc + s.totalCalls, 0) ?? 0}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Feature breakdown tracked in AiRequestLog
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border">
          <CardHeader className="p-4 pb-1">
            <CardDescription className="text-xs">Rate Limiting Status</CardDescription>
            <CardTitle className="text-xl font-bold text-amber-400 flex items-center gap-2">
              <ShieldAlert className="h-5 w-5" />
              Enforced
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-1 text-[11px] text-muted-foreground">
            Sliding window per-user throttles
          </CardContent>
        </Card>
      </div>

      {/* AI EVALUATION HARNESS SECTION */}
      <Card className="border-purple-500/30 bg-card/60 p-6 space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-border pb-4">
          <div>
            <Badge variant="default" className="bg-purple-600/20 text-purple-300 border-purple-500/30 mb-1.5">
              Evaluation Suite
            </Badge>
            <h2 className="text-xl font-bold text-white">AI Tutor Quality & Groundedness Harness</h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              Executes 10 curated test cases evaluating Groundedness, Citation Accuracy, and Unsupported Question handling.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <select
              className="h-10 rounded-lg border border-border bg-card px-3 text-xs text-white"
              value={selectedProjectId}
              onChange={(e) => setSelectedProjectId(e.target.value)}
            >
              {projects.map((p) => (
                <option key={p._id} value={p._id} className="bg-zinc-900">
                  {p.name}
                </option>
              ))}
            </select>

            <Button
              variant="gradient"
              onClick={handleRunEvaluation}
              disabled={isRunningEval || projects.length === 0}
              className="gap-2"
            >
              {isRunningEval ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Running 10 Test Cases...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4" />
                  Execute Evaluation Suite
                </>
              )}
            </Button>
          </div>
        </div>

        {/* Evaluation Results Display */}
        {evalSummary && (
          <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-4 bg-background/50 border border-border p-4 rounded-xl">
              <div>
                <span className="text-[11px] text-muted-foreground">Passing Rate</span>
                <div className="text-lg font-bold text-white">
                  {evalSummary.passCount} / {evalSummary.totalTests} ({Math.round((evalSummary.passCount / evalSummary.totalTests) * 100)}%)
                </div>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground">Avg Groundedness</span>
                <div className="text-lg font-bold text-emerald-400">
                  {evalSummary.averageGroundedness} / 100
                </div>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground">Citation Precision</span>
                <div className="text-lg font-bold text-purple-400">
                  {evalSummary.averageCitationAccuracy} / 100
                </div>
              </div>
              <div>
                <span className="text-[11px] text-muted-foreground">Unsupported Handling</span>
                <div className="text-lg font-bold text-blue-400">
                  {evalSummary.averageUnsupportedHandling} / 100
                </div>
              </div>
            </div>

            {/* Test Case Breakdown */}
            <div className="space-y-2">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Individual Test Case Breakdown ({evalSummary.results?.length ?? 0})
              </h4>
              {evalSummary.results?.map((res: any, idx: number) => (
                <div
                  key={idx}
                  className={`rounded-lg border p-3 text-xs flex flex-col md:flex-row md:items-center justify-between gap-3 ${
                    res.passed
                      ? "border-emerald-500/30 bg-emerald-500/5"
                      : "border-destructive/30 bg-destructive/5"
                  }`}
                >
                  <div className="space-y-1 max-w-2xl">
                    <div className="flex items-center gap-2">
                      <Badge variant={res.passed ? "success" : "destructive"} className="text-[10px]">
                        {res.testCaseId}
                      </Badge>
                      <span className="font-semibold text-white">{res.question}</span>
                    </div>
                    <p className="text-muted-foreground text-[11px]">
                      Expected: {res.expectedAnswer}
                    </p>
                    <p className="text-zinc-300 text-[11px] line-clamp-2">
                      Actual: {res.actualAnswer}
                    </p>
                  </div>

                  <div className="flex items-center gap-4 text-right shrink-0">
                    <div className="text-[11px]">
                      <span className="text-muted-foreground">Grounded: </span>
                      <span className="font-bold text-white">{res.groundednessScore}%</span>
                    </div>
                    <div className="text-[11px]">
                      <span className="text-muted-foreground">Citation: </span>
                      <span className="font-bold text-white">{res.citationAccuracyScore}%</span>
                    </div>
                    <Badge variant={res.passed ? "success" : "destructive"}>
                      {res.passed ? "PASSED" : "FAILED"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* Recent AI Logs & Audits */}
      <Card className="border-border bg-card/40 p-6 space-y-4">
        <h3 className="text-base font-bold text-white">Recent AI Request Audit Trail</h3>
        {!adminData?.recentLogs || adminData.recentLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground">No AI requests logged yet.</p>
        ) : (
          <div className="divide-y divide-border/60">
            {adminData.recentLogs.map((log: any) => (
              <div key={log._id} className="py-2.5 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <Badge variant={log.success ? "success" : "destructive"} className="text-[10px]">
                    {log.feature}
                  </Badge>
                  <span className="text-zinc-300">{log.model}</span>
                </div>
                <div className="flex items-center gap-4 text-muted-foreground">
                  <span>Latency: {log.latencyMs}ms</span>
                  <span>Tokens: {log.totalTokens || 0}</span>
                  <span>{new Date(log.createdAt).toLocaleTimeString()}</span>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}
