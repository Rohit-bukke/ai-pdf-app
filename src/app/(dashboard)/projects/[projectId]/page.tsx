"use client";

import { useSession } from "next-auth/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  BookOpen,
  Upload,
  FileText,
  Sparkles,
  BrainCircuit,
  GitFork,
  BarChart3,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Send,
  Loader2,
  RefreshCw,
  Clock,
  ArrowRight,
  ShieldCheck,
  Zap,
} from "lucide-react";

export default function ProjectWorkspacePage() {
  const { data: session, status } = useSession();
  const params = useParams();
  const router = useRouter();
  const projectId = params?.projectId as string;

  const [activeTab, setActiveTab] = useState<"materials" | "tutor" | "quiz" | "analytics">("materials");
  const [project, setProject] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Materials state
  const [materials, setMaterials] = useState<any[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Tutor RAG chat state
  const [messages, setMessages] = useState<Array<{
    role: "user" | "assistant";
    content: string;
    citations?: Array<{ documentName: string; pageNumber: number; snippet: string }>;
    hasSufficientSupport?: boolean;
    latencyMs?: number;
  }>>([
    {
      role: "assistant",
      content: "Hello! I am your AI Study Tutor. Ask me any question about your uploaded project materials. I will provide clear explanations backed by exact document and page citations.",
    },
  ]);
  const [questionInput, setQuestionInput] = useState("");
  const [isAsking, setIsAsking] = useState(false);
  const chatBottomRef = useRef<HTMLDivElement>(null);

  // Quiz state
  const [quizQuestions, setQuizQuestions] = useState<any[]>([]);
  const [userAnswers, setUserAnswers] = useState<Record<string, { answer: string; confidence: "LOW" | "MEDIUM" | "HIGH" }>>({});
  const [quizResult, setQuizResult] = useState<any>(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);

  // Analytics & DAG state
  const [analyticsData, setAnalyticsData] = useState<any>(null);

  const loadProjectData = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/projects/${projectId}`);
      const data = await res.json();
      if (data.success) {
        setProject(data.data);
        setMaterials(data.data.materials || []);
      }
    } catch (err) {
      console.error("Load project error", err);
    } finally {
      setIsLoading(false);
    }
  }, [projectId]);

  const loadAnalytics = useCallback(async () => {
    try {
      const res = await fetch(`/api/analytics/${projectId}`);
      const data = await res.json();
      if (data.success) {
        setAnalyticsData(data.data);
      }
    } catch (err) {
      console.error("Load analytics error", err);
    }
  }, [projectId]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated" && projectId) {
      loadProjectData();
      loadAnalytics();
    }
  }, [status, projectId, router, loadProjectData, loadAnalytics]);

  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Poll material processing status
  useEffect(() => {
    const hasUnfinished = materials.some((m) => m.status === "QUEUED" || m.status === "PROCESSING");
    if (!hasUnfinished) return;

    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/projects/${projectId}`);
        const data = await res.json();
        if (data.success) {
          setMaterials(data.data.materials || []);
        }
      } catch (e) {
        // quiet error
      }
    }, 4000);

    return () => clearInterval(interval);
  }, [materials, projectId]);

  // Upload handler
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== "application/pdf" && !file.name.endsWith(".pdf")) {
      setUploadError("Only authentic PDF documents are permitted.");
      return;
    }

    if (file.size > 20 * 1024 * 1024) {
      setUploadError("File exceeds maximum allowed size of 20 MB.");
      return;
    }

    setUploadError(null);
    setIsUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("projectId", projectId);

    try {
      const res = await fetch("/api/materials/upload", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        setUploadError(data.error || "Upload failed");
      } else {
        await loadProjectData();
      }
    } catch (err: any) {
      setUploadError(err.message || "Failed to upload file");
    } finally {
      setIsUploading(false);
      // Reset input
      e.target.value = "";
    }
  };

  // Tutor RAG Chat handler
  const handleAskTutor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!questionInput.trim() || isAsking) return;

    const query = questionInput.trim();
    setQuestionInput("");
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    setIsAsking(true);

    try {
      const res = await fetch("/api/tutor/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, question: query }),
      });

      const data = await res.json();
      if (data.success) {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: data.data.answer,
            citations: data.data.citations,
            hasSufficientSupport: data.data.hasSufficientSupport,
            latencyMs: data.data.latencyMs,
          },
        ]);
      } else {
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${data.error || "Failed to retrieve grounded tutor response."}`,
          },
        ]);
      }
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: "Failed to connect to AI Tutor. Please verify your connection.",
        },
      ]);
    } finally {
      setIsAsking(false);
      loadAnalytics();
    }
  };

  // Adaptive Quiz Generator
  const handleGenerateQuiz = async () => {
    setIsGeneratingQuiz(true);
    setQuizResult(null);
    setUserAnswers({});
    try {
      const res = await fetch("/api/quiz/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, questionCount: 4 }),
      });
      const data = await res.json();
      if (data.success) {
        setQuizQuestions(data.data);
      } else {
        alert(data.error || "Failed to generate quiz");
      }
    } catch (err) {
      console.error("Quiz generation error", err);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  // Submit Quiz with Metacognitive Confidence
  const handleSubmitQuiz = async () => {
    const unanswered = quizQuestions.filter((q) => !userAnswers[q.id]?.answer || !userAnswers[q.id]?.confidence);
    if (unanswered.length > 0) {
      alert("Please answer all questions and specify your confidence level for each before submitting.");
      return;
    }

    setIsSubmittingQuiz(true);
    try {
      const answersPayload = quizQuestions.map((q) => ({
        questionId: q.id,
        userAnswer: userAnswers[q.id].answer,
        confidence: userAnswers[q.id].confidence,
      }));

      const res = await fetch("/api/quiz/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ projectId, answers: answersPayload }),
      });

      const data = await res.json();
      if (data.success) {
        setQuizResult(data.data);
        loadAnalytics();
      } else {
        alert(data.error || "Failed to submit assessment");
      }
    } catch (err) {
      console.error("Submit quiz error", err);
    } finally {
      setIsSubmittingQuiz(false);
    }
  };

  if (isLoading || !project) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-sm text-muted-foreground font-medium">Loading Study Workspace...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Workspace Header */}
      <div className="border-b border-border pb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <Badge variant="outline" className="text-xs border-purple-500/30 text-purple-300">
                {project.spaceId?.name || "Space"}
              </Badge>
              {project.subject && (
                <span className="text-xs text-muted-foreground">• {project.subject}</span>
              )}
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight text-white">{project.name}</h1>
            <p className="text-xs text-muted-foreground mt-1 max-w-2xl">
              {project.description || "Grounded AI Study Workspace with Vector Retrieval and Adaptive Assessments."}
            </p>
          </div>

          {/* Tab navigation pills */}
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border bg-card/60 p-1.5 backdrop-blur-md">
            <Button
              size="sm"
              variant={activeTab === "materials" ? "default" : "ghost"}
              onClick={() => setActiveTab("materials")}
              className="gap-1.5 text-xs rounded-lg"
            >
              <FileText className="h-3.5 w-3.5" />
              Materials ({materials.length})
            </Button>
            <Button
              size="sm"
              variant={activeTab === "tutor" ? "default" : "ghost"}
              onClick={() => setActiveTab("tutor")}
              className="gap-1.5 text-xs rounded-lg"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-400" />
              AI Tutor (RAG)
            </Button>
            <Button
              size="sm"
              variant={activeTab === "quiz" ? "default" : "ghost"}
              onClick={() => setActiveTab("quiz")}
              className="gap-1.5 text-xs rounded-lg"
            >
              <BrainCircuit className="h-3.5 w-3.5 text-blue-400" />
              Adaptive Quiz
            </Button>
            <Button
              size="sm"
              variant={activeTab === "analytics" ? "default" : "ghost"}
              onClick={() => {
                setActiveTab("analytics");
                loadAnalytics();
              }}
              className="gap-1.5 text-xs rounded-lg"
            >
              <GitFork className="h-3.5 w-3.5 text-emerald-400" />
              Concept Graph & Growth
            </Button>
          </div>
        </div>
      </div>

      {/* TAB 1: MATERIALS */}
      {activeTab === "materials" && (
        <div className="space-y-6 pt-6">
          {/* Upload Card */}
          <Card className="border-dashed border-border/80 bg-card/40 p-8 text-center">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-tr from-purple-600/20 to-indigo-600/20 text-purple-400 mb-3">
              <Upload className="h-7 w-7" />
            </div>
            <h3 className="text-base font-semibold text-white">Upload Course PDF Material</h3>
            <p className="text-xs text-muted-foreground max-w-md mx-auto mt-1 mb-4">
              Upload textbook chapters, lecture notes, or research papers. Maximum 20MB. PDFs are validated server-side and stored securely in private storage.
            </p>

            {uploadError && (
              <div className="mb-4 inline-flex items-center gap-2 rounded-lg border border-destructive/30 bg-destructive/10 px-3.5 py-2 text-xs text-destructive">
                <AlertTriangle className="h-4 w-4" />
                {uploadError}
              </div>
            )}

            <div className="flex justify-center">
              <label className="cursor-pointer">
                <Input
                  type="file"
                  accept="application/pdf"
                  onChange={handleFileUpload}
                  disabled={isUploading}
                  className="hidden"
                />
                <Button variant="gradient" size="sm" className="gap-2 pointer-events-none">
                  {isUploading ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Processing PDF Buffer...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4" />
                      Select PDF Document
                    </>
                  )}
                </Button>
              </label>
            </div>
          </Card>

          {/* Materials List */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Uploaded Documents ({materials.length})
            </h3>

            {materials.length === 0 ? (
              <div className="rounded-xl border border-border bg-card/20 p-8 text-center text-xs text-muted-foreground">
                No materials uploaded yet. Upload a PDF above to begin vector indexing and AI tutoring.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {materials.map((mat) => (
                  <Card key={mat._id} className="border-border bg-card/50">
                    <CardHeader className="p-4 pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-2 overflow-hidden">
                          <FileText className="h-5 w-5 text-purple-400 shrink-0" />
                          <span className="truncate text-sm font-medium text-white">
                            {mat.originalName}
                          </span>
                        </div>
                        <Badge
                          variant={
                            mat.status === "READY"
                              ? "success"
                              : mat.status === "PROCESSING" || mat.status === "QUEUED"
                              ? "warning"
                              : "destructive"
                          }
                          className="text-[10px] shrink-0"
                        >
                          {mat.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 text-xs text-muted-foreground space-y-1">
                      <div className="flex justify-between">
                        <span>Size:</span>
                        <span className="text-zinc-300">{(mat.sizeBytes / (1024 * 1024)).toFixed(2)} MB</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Pages:</span>
                        <span className="text-zinc-300">{mat.pageCount || "Parsing..."}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Chunks & Vectors:</span>
                        <span className="text-zinc-300">{mat.chunkCount || "Generating..."}</span>
                      </div>
                      {mat.errorMessage && (
                        <p className="text-destructive text-[11px] mt-1">{mat.errorMessage}</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* TAB 2: AI TUTOR (RAG) */}
      {activeTab === "tutor" && (
        <div className="pt-6">
          <Card className="border-border bg-card/40 flex flex-col h-[650px]">
            {/* Header info */}
            <div className="border-b border-border p-4 flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-purple-400" />
                <span className="font-semibold text-white">Project-Scoped Grounded Tutor</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-emerald-400">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  Prompt Injection Guard Active
                </span>
              </div>
            </div>

            {/* Chat message stream */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex flex-col ${msg.role === "user" ? "items-end" : "items-start"}`}
                >
                  <div
                    className={`max-w-2xl rounded-2xl p-4 text-sm leading-relaxed shadow-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "border border-border/80 bg-card/80 text-foreground"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.content}</p>

                    {/* Citations section */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-3 border-t border-border/40 pt-2.5">
                        <div className="text-[11px] font-semibold text-purple-300 uppercase tracking-wider mb-1.5 flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          Grounded Citations ({msg.citations.length})
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {msg.citations.map((cite, cIdx) => (
                            <Badge
                              key={cIdx}
                              variant="outline"
                              className="text-[11px] bg-purple-500/10 border-purple-500/30 text-purple-300 py-0.5"
                            >
                              {cite.documentName} — Page {cite.pageNumber}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Metadata & Latency */}
                    {msg.latencyMs && (
                      <div className="mt-2 text-[10px] text-muted-foreground flex items-center justify-end gap-2">
                        <span>Latency: {msg.latencyMs}ms</span>
                        {msg.hasSufficientSupport === false && (
                          <span className="text-amber-400 font-medium">• Unsupported Question (Refused Hallucination)</span>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Input Bar */}
            <form onSubmit={handleAskTutor} className="border-t border-border p-3 flex gap-2">
              <Input
                placeholder="Ask a question about your uploaded materials (e.g. 'Explain gradient descent with equations')..."
                value={questionInput}
                onChange={(e) => setQuestionInput(e.target.value)}
                disabled={isAsking}
                className="bg-background/60"
              />
              <Button type="submit" variant="gradient" disabled={isAsking || !questionInput.trim()} className="gap-1.5">
                {isAsking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
                <span>Ask</span>
              </Button>
            </form>
          </Card>
        </div>
      )}

      {/* TAB 3: ADAPTIVE QUIZ & METACOGNITION */}
      {activeTab === "quiz" && (
        <div className="space-y-6 pt-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-card/40 border border-border p-4 rounded-xl">
            <div>
              <h3 className="text-base font-semibold text-white">Metacognitive Adaptive Assessment</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                Tests concept comprehension and tracks confidence calibration. High confidence wrong answers flag crucial blindspots.
              </p>
            </div>
            <Button
              variant="gradient"
              onClick={handleGenerateQuiz}
              disabled={isGeneratingQuiz}
              className="gap-2 shrink-0"
            >
              {isGeneratingQuiz ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Synthesizing Questions...
                </>
              ) : (
                <>
                  <BrainCircuit className="h-4 w-4" />
                  Generate Adaptive Quiz
                </>
              )}
            </Button>
          </div>

          {quizQuestions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center text-xs text-muted-foreground">
              Click &quot;Generate Adaptive Quiz&quot; above to dynamically create questions tailored to your weakest concept areas.
            </div>
          ) : (
            <div className="space-y-6">
              {quizQuestions.map((q, qIdx) => (
                <Card key={q.id} className="border-border bg-card/60">
                  <CardHeader className="p-4 pb-2">
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <span className="text-xs font-semibold text-purple-400">Question {qIdx + 1}</span>
                      <Badge variant="outline" className="text-[10px]">
                        Difficulty: {q.difficulty}
                      </Badge>
                    </div>
                    <CardTitle className="text-sm text-white font-medium">{q.questionText}</CardTitle>
                  </CardHeader>

                  <CardContent className="p-4 pt-2 space-y-4">
                    {/* Options */}
                    <div className="space-y-2">
                      {q.options?.map((opt: string, optIdx: number) => {
                        const isSelected = userAnswers[q.id]?.answer === opt;
                        return (
                          <div
                            key={optIdx}
                            onClick={() =>
                              setUserAnswers({
                                ...userAnswers,
                                [q.id]: {
                                  answer: opt,
                                  confidence: userAnswers[q.id]?.confidence || "MEDIUM",
                                },
                              })
                            }
                            className={`cursor-pointer rounded-lg border p-3 text-xs transition-all flex items-center justify-between ${
                              isSelected
                                ? "border-purple-500 bg-purple-500/10 text-white font-medium"
                                : "border-border/60 bg-background/40 text-zinc-300 hover:border-purple-500/40"
                            }`}
                          >
                            <span>{opt}</span>
                            {isSelected && <CheckCircle2 className="h-4 w-4 text-purple-400 shrink-0" />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Metacognitive Confidence Selection */}
                    <div className="rounded-lg border border-border/40 bg-background/30 p-3">
                      <div className="text-[11px] font-semibold text-zinc-300 mb-2 flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-400" />
                        Indicate your confidence in this answer:
                      </div>
                      <div className="flex gap-2">
                        {(["LOW", "MEDIUM", "HIGH"] as const).map((level) => {
                          const isLevelSelected = userAnswers[q.id]?.confidence === level;
                          return (
                            <Button
                              key={level}
                              type="button"
                              size="sm"
                              variant={isLevelSelected ? "default" : "outline"}
                              className={`text-xs flex-1 h-8 ${
                                isLevelSelected
                                  ? level === "HIGH"
                                    ? "bg-emerald-600 hover:bg-emerald-500"
                                    : level === "MEDIUM"
                                    ? "bg-blue-600 hover:bg-blue-500"
                                    : "bg-amber-600 hover:bg-amber-500"
                                  : "border-border"
                              }`}
                              onClick={() =>
                                setUserAnswers({
                                  ...userAnswers,
                                  [q.id]: {
                                    answer: userAnswers[q.id]?.answer || "",
                                    confidence: level,
                                  },
                                })
                              }
                            >
                              {level === "LOW" && "Unsure / Guess"}
                              {level === "MEDIUM" && "Moderate"}
                              {level === "HIGH" && "Certain / High"}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              <div className="flex justify-end pt-2">
                <Button
                  variant="gradient"
                  size="lg"
                  onClick={handleSubmitQuiz}
                  disabled={isSubmittingQuiz}
                  className="gap-2"
                >
                  {isSubmittingQuiz ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Evaluating Calibration...
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="h-4 w-4" />
                      Submit Assessment & Calibrate
                    </>
                  )}
                </Button>
              </div>

              {/* Assessment Results Modal / Banner */}
              {quizResult && (
                <Card className="border-purple-500/50 bg-card p-6 shadow-2xl space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-border pb-4">
                    <div>
                      <h3 className="text-xl font-bold text-white">Assessment Complete</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Score: {quizResult.overallScore}% • Calibration Index: {quizResult.calibrationScore}%
                      </p>
                    </div>
                    <Badge
                      variant={quizResult.highConfidenceErrors > 0 ? "warning" : "success"}
                      className="text-xs py-1"
                    >
                      {quizResult.highConfidenceErrors > 0
                        ? `${quizResult.highConfidenceErrors} Overconfidence Mistakes Flagged`
                        : "Well Calibrated"}
                    </Badge>
                  </div>

                  <div className="space-y-3">
                    {quizResult.items?.map((item: any, idx: number) => (
                      <div
                        key={idx}
                        className={`rounded-lg border p-3.5 text-xs space-y-1.5 ${
                          item.isCorrect
                            ? "border-emerald-500/30 bg-emerald-500/10 text-zinc-200"
                            : "border-destructive/30 bg-destructive/10 text-zinc-200"
                        }`}
                      >
                        <div className="flex items-center justify-between font-semibold">
                          <span>
                            {item.isCorrect ? "✓ Correct" : "✗ Incorrect"} (Confidence: {item.confidence})
                          </span>
                        </div>
                        <p className="font-medium text-white">{item.questionText}</p>
                        <div className="text-[11px] text-muted-foreground">
                          Your answer: <span className="text-white">{item.userAnswer}</span> | Correct:{" "}
                          <span className="text-emerald-300">{item.correctAnswer}</span>
                        </div>
                        {item.aiFeedback && (
                          <div className="text-[11px] text-purple-300 mt-1">
                            Explanation: {item.aiFeedback}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </Card>
              )}
            </div>
          )}
        </div>
      )}

      {/* TAB 4: CONCEPT DEPENDENCY GRAPH & ANALYTICS */}
      {activeTab === "analytics" && (
        <div className="space-y-6 pt-6">
          {/* Summary Cards */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-card/40 border-border">
              <CardHeader className="p-4 pb-1">
                <CardDescription className="text-xs">Average Concept Mastery</CardDescription>
                <CardTitle className="text-2xl font-bold text-white">
                  {analyticsData?.summary?.averageMastery ?? 0}%
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-card/40 border-border">
              <CardHeader className="p-4 pb-1">
                <CardDescription className="text-xs">Mastered Concepts</CardDescription>
                <CardTitle className="text-2xl font-bold text-emerald-400">
                  {analyticsData?.summary?.masteredCount ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-card/40 border-border">
              <CardHeader className="p-4 pb-1">
                <CardDescription className="text-xs">Needs Attention</CardDescription>
                <CardTitle className="text-2xl font-bold text-destructive">
                  {analyticsData?.summary?.needsAttentionCount ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>

            <Card className="bg-card/40 border-border">
              <CardHeader className="p-4 pb-1">
                <CardDescription className="text-xs">Overconfidence Mistakes</CardDescription>
                <CardTitle className="text-2xl font-bold text-amber-400">
                  {analyticsData?.summary?.totalHighConfidenceErrors ?? 0}
                </CardTitle>
              </CardHeader>
            </Card>
          </div>

          {/* Actionable Recommendations */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Dependency-Aware Recommendations
            </h3>
            {!analyticsData?.recommendations || analyticsData.recommendations.length === 0 ? (
              <div className="rounded-xl border border-border bg-card/20 p-6 text-center text-xs text-muted-foreground">
                No active gaps detected! Complete more quizzes to generate targeted prerequisite learning paths.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                {analyticsData.recommendations.map((rec: any) => (
                  <Card key={rec._id} className="border-border bg-card/60">
                    <CardHeader className="p-4 pb-1">
                      <div className="flex items-center justify-between">
                        <Badge
                          variant={rec.priority === "HIGH" ? "destructive" : "warning"}
                          className="text-[10px]"
                        >
                          {rec.priority} PRIORITY
                        </Badge>
                        <span className="text-[10px] text-muted-foreground uppercase">{rec.actionType}</span>
                      </div>
                      <CardTitle className="text-sm font-semibold text-white mt-1">{rec.title}</CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-1 text-xs text-muted-foreground space-y-1">
                      <p>{rec.description}</p>
                      <p className="text-[11px] text-purple-300 italic">Rationale: {rec.rationale}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Concept Mastery List */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
              Extracted Learning Concepts ({analyticsData?.masteryList?.length ?? 0})
            </h3>
            {!analyticsData?.masteryList || analyticsData.masteryList.length === 0 ? (
              <div className="rounded-xl border border-border bg-card/20 p-6 text-center text-xs text-muted-foreground">
                Upload PDFs to trigger concept extraction.
              </div>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {analyticsData.masteryList.map((m: any) => (
                  <Card key={m._id} className="border-border bg-card/40 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-sm text-white">
                        {m.conceptId?.name || "Concept"}
                      </span>
                      <Badge
                        variant={
                          m.status === "MASTERED"
                            ? "success"
                            : m.status === "LEARNING"
                            ? "info"
                            : "destructive"
                        }
                        className="text-[10px]"
                      >
                        {m.status} ({m.masteryScore}%)
                      </Badge>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-purple-500 to-indigo-500"
                        style={{ width: `${m.masteryScore}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[11px] text-muted-foreground">
                      <span>Attempts: {m.attemptsCount}</span>
                      <span>Accuracy: {m.attemptsCount > 0 ? Math.round((m.correctCount / m.attemptsCount) * 100) : 0}%</span>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
