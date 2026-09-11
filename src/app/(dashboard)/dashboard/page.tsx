"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  FolderPlus,
  PlusCircle,
  Folder,
  BookOpen,
  Sparkles,
  ArrowRight,
  GraduationCap,
  Layers,
  Clock,
  Loader2,
  Trash2,
  BrainCircuit,
} from "lucide-react";
import Link from "next/link";

interface Space {
  _id: string;
  name: string;
  description?: string;
  color: string;
  icon: string;
  createdAt: string;
}

interface Project {
  _id: string;
  spaceId: { _id: string; name: string; color: string };
  name: string;
  description?: string;
  subject?: string;
  targetExam?: string;
  status: "ACTIVE" | "ARCHIVED";
  createdAt: string;
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [spaces, setSpaces] = useState<Space[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedSpaceId, setSelectedSpaceId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Modal / form states
  const [showSpaceModal, setShowSpaceModal] = useState(false);
  const [showProjectModal, setShowProjectModal] = useState(false);
  const [newSpaceName, setNewSpaceName] = useState("");
  const [newSpaceDesc, setNewSpaceDesc] = useState("");
  const [newSpaceColor, setNewSpaceColor] = useState("#6366f1");

  const [newProjectName, setNewProjectName] = useState("");
  const [newProjectDesc, setNewProjectDesc] = useState("");
  const [newProjectSubject, setNewProjectSubject] = useState("");
  const [newProjectExam, setNewProjectExam] = useState("");
  const [projectTargetSpaceId, setProjectTargetSpaceId] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/signin");
    } else if (status === "authenticated") {
      fetchDashboardData();
    }
  }, [status, router]);

  const fetchDashboardData = async () => {
    setIsLoading(true);
    try {
      const [spacesRes, projectsRes] = await Promise.all([
        fetch("/api/spaces"),
        fetch("/api/projects"),
      ]);

      const spacesData = await spacesRes.json();
      const projectsData = await projectsRes.json();

      if (spacesData.success) {
        setSpaces(spacesData.data);
      }
      if (projectsData.success) {
        setProjects(projectsData.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateSpace = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSpaceName.trim()) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/spaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: newSpaceName,
          description: newSpaceDesc,
          color: newSpaceColor,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setSpaces([data.data, ...spaces]);
        setNewSpaceName("");
        setNewSpaceDesc("");
        setShowSpaceModal(false);
      }
    } catch (err) {
      console.error("Create space failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    const targetSpace = projectTargetSpaceId || spaces[0]?._id;
    if (!newProjectName.trim() || !targetSpace) return;
    setIsSubmitting(true);
    try {
      const res = await fetch("/api/projects", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          spaceId: targetSpace,
          name: newProjectName,
          description: newProjectDesc,
          subject: newProjectSubject,
          targetExam: newProjectExam,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setProjects([data.data, ...projects]);
        setNewProjectName("");
        setNewProjectDesc("");
        setNewProjectSubject("");
        setNewProjectExam("");
        setShowProjectModal(false);
      }
    } catch (err) {
      console.error("Create project failed", err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const filteredProjects = selectedSpaceId
    ? projects.filter(
        (p) =>
          p.spaceId?._id === selectedSpaceId || (p.spaceId as any) === selectedSpaceId
      )
    : projects;

  if (status === "loading" || isLoading) {
    return (
      <div className="flex h-[70vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-purple-500" />
          <p className="text-sm text-muted-foreground font-medium">Loading your study spaces...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl px-4 py-8 sm:px-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-border pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold uppercase tracking-wider text-purple-400">
              Workspace & Spaces
            </span>
          </div>
          <h1 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Welcome back, {session?.user?.name?.split(" ")[0] || "Learner"}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Organize study materials by Space, ask grounded AI Tutor questions, and take adaptive quizzes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <Button
            variant="outline"
            className="gap-2 border-border text-foreground hover:bg-muted"
            onClick={() => setShowSpaceModal(true)}
          >
            <FolderPlus className="h-4 w-4 text-purple-400" />
            New Space
          </Button>
          <Button
            variant="gradient"
            className="gap-2 shadow-md shadow-indigo-500/20"
            onClick={() => {
              if (spaces.length === 0) {
                setShowSpaceModal(true);
              } else {
                setProjectTargetSpaceId(spaces[0]?._id);
                setShowProjectModal(true);
              }
            }}
          >
            <PlusCircle className="h-4 w-4" />
            New Study Project
          </Button>
        </div>
      </div>

      {/* Metrics Row */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 my-6">
        <Card className="bg-card/40 border-border/80">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Total Spaces</CardDescription>
            <CardTitle className="text-2xl font-bold text-white">{spaces.length}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Category containers for subjects
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/80">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Active Projects</CardDescription>
            <CardTitle className="text-2xl font-bold text-indigo-400">{projects.length}</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Course & exam workspaces
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/80">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">RAG Retrieval</CardDescription>
            <CardTitle className="text-2xl font-bold text-emerald-400">Project-Scoped</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Isolated vector search & citations
          </CardContent>
        </Card>

        <Card className="bg-card/40 border-border/80">
          <CardHeader className="p-4 pb-2">
            <CardDescription className="text-xs uppercase font-medium">Evaluation</CardDescription>
            <CardTitle className="text-2xl font-bold text-blue-400">Metacognitive</CardTitle>
          </CardHeader>
          <CardContent className="p-4 pt-0 text-xs text-muted-foreground">
            Confidence calibration & DAG
          </CardContent>
        </Card>
      </div>

      {/* Space Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 mb-6 scrollbar-none">
        <Button
          size="sm"
          variant={selectedSpaceId === null ? "default" : "outline"}
          onClick={() => setSelectedSpaceId(null)}
          className="rounded-full text-xs"
        >
          All Spaces ({projects.length})
        </Button>
        {spaces.map((space) => (
          <Button
            key={space._id}
            size="sm"
            variant={selectedSpaceId === space._id ? "default" : "outline"}
            onClick={() => setSelectedSpaceId(space._id)}
            className="rounded-full text-xs gap-1.5"
          >
            <span
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: space.color || "#6366f1" }}
            />
            {space.name}
          </Button>
        ))}
      </div>

      {/* Projects Grid */}
      {filteredProjects.length === 0 ? (
        <Card className="border-dashed border-border/80 bg-card/20 p-12 text-center">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-400 mb-4">
            <BookOpen className="h-7 w-7" />
          </div>
          <h3 className="text-lg font-semibold text-white">No Study Projects Yet</h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto mt-1 mb-6">
            Create your first study project inside a space to upload PDFs, ask grounded questions, and take adaptive quizzes.
          </p>
          <Button
            variant="gradient"
            onClick={() => {
              if (spaces.length === 0) setShowSpaceModal(true);
              else setShowProjectModal(true);
            }}
          >
            Create First Project
          </Button>
        </Card>
      ) : (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {filteredProjects.map((project) => (
            <Card
              key={project._id}
              className="group border-border/80 bg-card/50 hover:border-purple-500/50 transition-all hover:-translate-y-1 flex flex-col justify-between"
            >
              <CardHeader>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <Badge variant="outline" className="text-[11px] gap-1 border-purple-500/30 text-purple-300">
                    <Folder className="h-3 w-3" />
                    {project.spaceId?.name || "Space"}
                  </Badge>
                  <Badge variant="success" className="text-[10px]">
                    {project.status}
                  </Badge>
                </div>
                <CardTitle className="text-lg text-white group-hover:text-purple-300 transition-colors">
                  {project.name}
                </CardTitle>
                <CardDescription className="line-clamp-2 text-xs text-muted-foreground mt-1">
                  {project.description || "No description provided."}
                </CardDescription>
              </CardHeader>

              <CardContent className="space-y-3 pt-0">
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  {project.subject && (
                    <span className="rounded bg-muted/60 px-2 py-0.5 text-zinc-300">
                      Subject: {project.subject}
                    </span>
                  )}
                  {project.targetExam && (
                    <span className="rounded bg-muted/60 px-2 py-0.5 text-zinc-300">
                      Exam: {project.targetExam}
                    </span>
                  )}
                </div>
              </CardContent>

              <CardFooter className="border-t border-border/40 pt-4 flex items-center justify-between">
                <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {new Date(project.createdAt).toLocaleDateString()}
                </span>
                <Link href={`/projects/${project._id}`}>
                  <Button size="sm" variant="gradient" className="gap-1 text-xs">
                    <span>Open Project</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}

      {/* Create Space Modal */}
      {showSpaceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-md border-border bg-card shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-white">Create New Space</CardTitle>
              <CardDescription className="text-xs">
                Spaces help you organize projects by broad domains like Computer Science, Biology, or Law.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateSpace}>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1 block">Space Name *</label>
                  <Input
                    required
                    placeholder="e.g., Computer Science, Data Structures"
                    value={newSpaceName}
                    onChange={(e) => setNewSpaceName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1 block">Description</label>
                  <Input
                    placeholder="Optional space summary"
                    value={newSpaceDesc}
                    onChange={(e) => setNewSpaceDesc(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1 block">Accent Color</label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={newSpaceColor}
                      onChange={(e) => setNewSpaceColor(e.target.value)}
                      className="h-9 w-14 cursor-pointer rounded border border-border bg-transparent"
                    />
                    <span className="text-xs text-muted-foreground">{newSpaceColor}</span>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowSpaceModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Space"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}

      {/* Create Project Modal */}
      {showProjectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4">
          <Card className="w-full max-w-lg border-border bg-card shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl text-white">Create Study Project</CardTitle>
              <CardDescription className="text-xs">
                A dedicated workspace with vector retrieval, AI tutoring, adaptive quizzes, and concept graphs.
              </CardDescription>
            </CardHeader>
            <form onSubmit={handleCreateProject}>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1 block">Parent Space *</label>
                  <select
                    className="flex h-10 w-full rounded-lg border border-input bg-card/60 px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary"
                    value={projectTargetSpaceId}
                    onChange={(e) => setProjectTargetSpaceId(e.target.value)}
                  >
                    {spaces.map((s) => (
                      <option key={s._id} value={s._id} className="bg-zinc-900 text-white">
                        {s.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1 block">Project Title *</label>
                  <Input
                    required
                    placeholder="e.g., Operating Systems Final Exam Prep"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1 block">Subject</label>
                    <Input
                      placeholder="e.g., Computer Systems"
                      value={newProjectSubject}
                      onChange={(e) => setNewProjectSubject(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-300 mb-1 block">Target Exam / Goal</label>
                    <Input
                      placeholder="e.g., Midterm Exam"
                      value={newProjectExam}
                      onChange={(e) => setNewProjectExam(e.target.value)}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-zinc-300 mb-1 block">Description</label>
                  <Input
                    placeholder="Brief description of course goals or syllabus"
                    value={newProjectDesc}
                    onChange={(e) => setNewProjectDesc(e.target.value)}
                  />
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2 border-t border-border pt-4">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowProjectModal(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button type="submit" variant="gradient" size="sm" disabled={isSubmitting}>
                  {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Project"}
                </Button>
              </CardFooter>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
